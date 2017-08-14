'use strict'

const Db = require('automata-db')
const Promise = require('bluebird')
const co = require('co')
const Dbstub = require('../test/stub')
const utils = require('../utils/grid')
const Skill = require('automata-skills')
const _ = require('lodash')

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
    // if !this.grid then creates a new grid
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

      console.log(grid, 'from / grid / getGridFromDb()')

      yield db.disconnect()
      return Promise.resolve(grid)
    })

    return Promise.resolve(tasks()).asCallback(cb)
  }

  updateGridDb (newGrid, cb) {
    let db = this.db

    let tasks = co.wrap(function * () {
      yield db.connect()

      console.log(newGrid, '------ new grid -----')

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
    // se bindean las funciones y la data
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
      image.pos = {
        x: emptySpace.y,
        y: emptySpace.x
      }

      // poner imagen en la grilla
      grid[image.pos.x][image.pos.y] = image

      // guardar la grilla con los cambios
      let update = yield updateGridDb(grid)

      // actualiza los cambios para la grilla cache
      updateGrid(update)

      // debe devolver el cambio especifico del lugar donde se creo la imagen
      return Promise.resolve(image)
    })
    return Promise.resolve(tasks()).asCallback()
  }

  removeImage (image, cb) {
    /* image data:
    { id: 'e0de1420-01ba-4e19-91c6-00a76ba0668a',
      publicId: '6QjLPtk8EYHsb0G9FIqftU',
      userId: 'user_6QjLPtk8EY',
      src: 'http://nana.com/6QjLPtk8EYHsb0G9FIqftU.jpg',
      description: '#awesome',
      awards: [ 'awesome' ],
      createdAt: 'Mon Sep 26 2016 23:41:00 GMT-0500 (COT)',
      rotation: 0,
      pos: { x: 2, y: 0 }
    }
    */

    let data = this.grid
    let getGrid = this.getGrid.bind(this)
    let updateGridDb = this.updateGridDb.bind(this)
    let updateGrid = this.updateGrid.bind(this)

    console.log(image)

    let tasks = co.wrap(function * () {
      // revisar si la imagen es valida
      if (data.length === 0 || !data.grid) {
        return Promise.reject(new Error('image not found'))
      }

      // la imagen debe tener un publicId
      if (!image.publicId) {
        return Promise.reject(new Error('Invalid image'))
      }

      // se requiere la grilla
      let grid = yield getGrid()
      grid = grid.grid
      let place = null

      // buscar la imagen en la grilla con el publicId y devolver la posicion
      for (let x = 0; x < grid.length; x++) {
        let placeY = _.findIndex(grid[x], {publicId: image.publicId})
        if (placeY !== -1) {
          place = {
            x: placeY,
            y: x
          }
          break
        }
      }

      // devolver un status code 200 y un mensaje de exito
      let response = {
        status: 200,
        action: 'delete',
        image: image.publicId,
        place: place,
        message: 'Image was delete'
      }

      if (place === null) {
        return Promise.reject(new Error('Image not found'))
      }

      // cambiar esa posicion por null
      grid[place.y][place.x] = null

      // guardar la grilla con los cambios
      let update = yield updateGridDb(grid)
      updateGrid(update)

      return Promise.resolve(response)
    })
    return Promise.resolve(tasks()).asCallback(cb)
  }

  getFourImages (pos, cb) {
    let getGrid = this.getGrid.bind(this)

    let tasks = co.wrap(function * () {
      let dataGrid = yield getGrid()

      let grid = dataGrid.grid

      console.log(grid, 'from / grid / getFourImages()')

      let fourImages = []

      if (pos.x >= grid.length - 1 || pos.y >= grid.length - 1) {
        return Promise.reject(new Error('pos is too big'))
      }

      if (pos.x < 0 || pos.y < 0) {
        return Promise.reject(new Error('pos is too small'))
      }

      console.log('grid', grid)

      for (let x = pos.x; x < pos.x + 2; x++) {
        for (let y = pos.y; y < pos.y + 2; y++) {
          fourImages.push(grid[x][y])
        }
      }

      console.log('grid - complete')
      return Promise.resolve(fourImages)
    })

    return Promise.resolve(tasks()).asCallback(cb)
  }

  stepUpCounter () {
    this.counter = this.counter > 1000 ? 1 : this.counter += 1
    return this.counter
  }

  addChangesGrid (pos, changes, cb) {
    let updateGrid = this.updateGrid.bind(this)
    let getGrid = this.getGrid.bind(this)

    let tasks = co.wrap(function * () {
      let data = yield getGrid()
      let count = 0

      let size = data.grid[0].length

      for (let x = pos.x; x < pos.x + 2; x++) {
        for (let y = pos.y; y < pos.y + 2; y++) {
          if (x >= size || y >= size) {
            return Promise.reject(new Error({message: 'Invalid item position'}))
          }

          data.grid[x][y] = changes[count]
          count++
        }
      }

      updateGrid(data)
      return Promise.resolve(data.grid)
    })

    return Promise.resolve(tasks()).asCallback(cb)

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
      let imagesToChange

      try {
        imagesToChange = yield getFourImages(pos)
      } catch (e) {
        return Promise.reject(e)
      }

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
      let newGrid

      try {
        newGrid = yield addChangesGrid(pos, imagesChanged)
      } catch (e) {
        return Promise.reject(e)
      }

      // cada X interacciones la bd cache es guardad en la db.automata
      let counter = stepUpCounter()
      if (counter % 20 === 0) {
        yield updateGridDb(newGrid)
      }

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
}

module.exports = Grid
