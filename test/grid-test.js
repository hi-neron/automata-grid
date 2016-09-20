'use strict'

const test = require('ava')
const Grid = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')
const fixtures = require('./fixtures')

let env = process.env.NODE_ENV || 'production'

test.beforeEach('setup grid class', async t => {
  const dbName = `automata_${uuid.v4()}`
  // const db = new Db({})
  const grid = new Grid({db: dbName, setup: true})
  t.context.grid = grid
  t.context.dbName = dbName
})

test.afterEach.always('Clean up', async t => {
  let dbName = t.context.dbName
  if (env !== 'test') {
    let conn = await r.connect({})
    await r.dbDrop(dbName).run(conn)
  }
})

test.skip('build a grid', async t => {
  let grid = t.context.grid
  t.is(typeof grid.buildGrid, 'function')

  let createdGrid = await grid.buildGrid()
  // console.log(createdGrid)
  t.is(typeof createdGrid, 'object')
  t.is(createdGrid.length, 3)
  t.is(createdGrid[0].length, 3)
})

test.skip('get a grid from db', async t => {
  let grid = t.context.grid
  t.is(typeof grid.getGridFromDb, 'function')

  let newGrid = await grid.getGridFromDb()
  t.is(typeof newGrid, 'object')
  t.is(newGrid.grid.length, 5)
  t.is(newGrid.grid[0].length, 5)
})

test('get a grid', async t => {
  let grid = t.context.grid
  t.is(typeof grid.getGrid, 'function')

  let newGrid = await grid.getGrid()
  t.is(typeof newGrid, 'object')
  t.truthy(newGrid.grid.length > 1)
  t.truthy(newGrid.grid.length > 1)
})

// posicionar o crear una imagen en la grilla
// la imagen debe ocupar un espacio vacio
// la imagen debe estar cerca a otras
// la imagen debe tener una rotacion
// si una nueva imagen, supera el tamaño de la grilla, la grilla debe crecer * 8
// la grilla debe guardarse en la bd cada X interacciones
test('Push an image in the grid', async t => {
  let grid = t.context.grid
  t.is(typeof grid.pushImage, 'function')

  let image = fixtures.getImage()

  let imageInGrid = await grid.pushImage(image)
  t.truthy(imageInGrid.pos)
  t.deepEqual(imageInGrid.rotation, 0)

  let updatedGrid = await grid.getGrid()
  console.log(updatedGrid)
  t.deepEqual(updatedGrid.grid[imageInGrid.pos.x][imageInGrid.pos.y], imageInGrid)
})
