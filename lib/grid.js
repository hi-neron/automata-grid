'use strict'

const Db = require('automata-db')
const Promise = require('bluebird')
const co = require('co')
const Dbstub = require('../test/stub')
const utils = require('../utils')
// const _ = require('lodash')

const env = process.env.NODE_ENV || 'production'

class Grid {
  constructor (config) {
    let data = config || {db: 'automata'}
    this.grid = []
    this.interactions = 0

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

  updateGrid (newGrid, cb) {
    this.grid = newGrid
  }

  getGrid (cb) {
    if (this.grid.length === 0) {
      this.grid = Promise.resolve(this.getGridFromDb())
    }

    return Promise.resolve(this.grid).asCallback(cb)
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

  skillOn (pos, skill, cb) {
  }

  changeImagePos (image, cb) {
  }
}

module.exports = Grid
