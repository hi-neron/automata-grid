'use strict'

const Db = require('automata-db')
const Promise = require('bluebird')
const co = require('co')
const Dbstub = require('../test/stub')
const utils = require('../utils/grid')
const Skill = require('automata-skills')
// const _ = require('lodash')

const env = process.env.NODE_ENV || 'production'

class Grid {
  constructor (config) {
    let data = config || {db: 'automata'}
    this.grid = []
    this.counter = 1

    if (env === 'test') {
      this.db = new Dbstub()
    } else {
      this.db = new Db(data)
    }
  }

  createNewGrid () {
    let newGrid = []

    let size = 5

    for (let x = 0; x < size; x++) {
      newGrid.push([])
      for (let y = 0; y < size; y++) {
        newGrid[x].push(null)
      }
    }

    return newGrid
  }

  getGridFromDb (cb) {
    const db = this.db
    let createNewGrid = this.createNewGrid.bind(this)

    const tasks = co.wrap(function * () {
      yield db.connect()

      let grid = yield db.getGrid()

      if (grid.length === 0) {
        let newGrid = createNewGrid()
        let data = {
          grid: newGrid
        }
        grid = yield db.updateGrid(data)
      } else {
        grid = grid[0]
      }

      yield db.disconnect()
      return Promise.resolve(grid)
    })

    return Promise.resolve(tasks()).asCallback(cb)
  }

  updateGridDb (newGrid, cb) {
    let db = this.db

    let tasks = co.wrap(function * () {
      yield db.connect()

      let data = {
        grid: newGrid
      }

      let update = yield db.updateGrid(data)
      yield db.disconnect()

      return Promise.resolve(update)
    })
    return Promise.resolve(tasks()).asCallback(cb)
  }

  updateGrid (newGrid) {
    this.grid = newGrid
  }

  getGrid (cb) {
    let grid = this.grid
    let getGridFromDb = this.getGridFromDb.bind(this)
    let tasks = co.wrap(function * () {
      if (grid.length === 0) {
        grid = yield getGridFromDb()
      }
      return Promise.resolve(grid)
    })

    return Promise.resolve(tasks()).asCallback(cb)
  }

  pushImage (image, cb) {
    let data = this.grid
    let getGrid = this.getGrid.bind(this)
    let updateGridDb = this.updateGridDb.bind(this)
    let updateGrid = this.updateGrid.bind(this)

    let tasks = co.wrap(function * () {
      // debe existir una grilla, o crearse en caso de que no exista
      if (data.length === 0 || !data.grid) {
        data = yield getGrid()
      }

      let grid = data.grid
      // la imagen debe ocupar un espacio vacio desde el centro hacia afuera
      // la imagen debe estar cerca a otras
      let emptySpace = yield utils.getEmptySpace(grid)

      // si una nueva imagen, supera el tamaño de la grilla, la grilla debe crecer * 8
      if (!emptySpace) {
        console.log('> Grid not enough, it will augmented')
        grid = utils.upgradeGrid(grid)
        emptySpace = yield utils.getEmptySpace(grid)
      }

      // implementar rotacion a la imagen rotacion
      image.rotation = 0
      image.pos = emptySpace

      // poner imagen en la grilla
      grid[image.pos.x][image.pos.y] = image

      // guardar la grilla con los cambios
      let update = yield updateGridDb(grid)
      updateGrid(update)

      // debe devolver el cambio especifico del lugar donde se creo la imagen
      return Promise.resolve(image)
    })
    return Promise.resolve(tasks()).asCallback()
  }

  getFourImages (pos, cb) {
    let getGrid = this.getGrid.bind(this)

    let tasks = co.wrap(function * () {
      let dataGrid = yield getGrid()

      let grid = dataGrid.grid

      let fourImages = []

      if (pos.x >= grid.length || pos.y >= grid.length) {
        return Promise.reject(new Error('pos is too big'))
      }

      if (pos.x < 0 || pos.y < 0) {
        return Promise.reject(new Error('pos is too small'))
      }

      for (let x = pos.x; x < pos.x + 2; x++) {
        for (let y = pos.y; y < pos.y + 2; y++) {
          fourImages.push(grid[x][y])
        }
      }

      return Promise.resolve(fourImages)
    })

    return Promise.resolve(tasks()).asCallback(cb)
  }

  stepUpCounter () {
    this.counter = this.counter > 1000 ? 1 : this.counter += 1
    return this.counter
  }

  addChangesGrid (pos, changes) {
    let updateGrid = this.updateGrid.bind(this)
    return Promise.resolve(this.getGrid()).then((data) => {
      let count = 0

      for (let x = pos.x; x < pos.x + 2; x++) {
        for (let y = pos.y; y < pos.y + 2; y++) {
          data.grid[x][y] = changes[count]
          count++
        }
      }

      updateGrid(data)

      return data
    })
  }

  onSkill (data, cb) {
    // let db = this.db

    let getFourImages = this.getFourImages.bind(this)
    let stepUpCounter = this.stepUpCounter.bind(this)
    let addChangesGrid = this.addChangesGrid.bind(this)
    // let updateGrid = this.updateGrid.bind(this)
    let updateGridDb = this.updateGridDb.bind(this)

    let tasks = co.wrap(function * () {
      // la data contiene una posicion, y el nombre de la skill
      /* data: {
          pos: {x:, y:}
          skill: <skillname>
        }
       */
      // ❗️
      // se asegura que el usuario tenga la skill en su perfil <- se encargara el motot RT
      // se devuelve un error si no la tiene activa <- RT
      let skillName = data.skill
      let pos = data.pos

      // busca las imagenes en la posicion
      let imagesToChange = yield getFourImages(pos)

      // Se crea un objeto skill con el nombre (debe existir un skill en el sistema
      // con ese nombre, sino devuelve un error),
      let skill = new Skill(skillName)

      let imagesChanged

      try {
        // se le pasan los objetos imagen y se activa (si el objeto no contiene
        // los cuatro objetos imagen, devuelve un error)
        // pushOn del objeto skill devuelve la nueva configuracion de las imagenes
        imagesChanged = yield skill.pushOn(imagesToChange)
      } catch (e) {
        return Promise.reject(e)
      }

      // las imagenes son actualizadas en la bd cache
      let newGrid = yield addChangesGrid(pos, imagesChanged)

      let counter = stepUpCounter()

      if (counter % 20 === 0) {
        yield updateGridDb(newGrid)
      }

      // cada X interacciones la bd cache es guardad en la db.automata

      // se devuelve un objeto con
      /*
          {
            pos: {
              x: <- posicion X esquina superior izquierda del cuaterno de imagenes a cambiar
              y: <- posicion Y esquina superior izquierda del cuaterno de imagenes a cambiar
            },
            changes: [
              { image: image }, < imagen ◰
              { image: image }, < imagen ◳
              { image: image }, < imagen ◱
              { image: image }, < imagen ◲
            ],
            status: <200>
          }
      */

      let response = {
        pos: data.pos,
        changes: imagesChanged,
        status: 200,
        skill: skillName
      }

      return Promise.resolve(response)
    })
    return Promise.resolve(tasks()).asCallback(cb)
  }

  changeImagePos (image, cb) {
  }
}

module.exports = Grid
