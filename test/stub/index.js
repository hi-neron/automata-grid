'use strict'

const Promise = require('bluebird')
const uuid = require('uuid-base62')

class Database {
  connect () {
    return Promise.resolve(true)
  }

  disconnect () {
    return Promise.resolve(true)
  }

  getGrid (cb) {
    let grid = [{ date: '2016-09-18T19:00:17.771Z',
      grid:
  [ [null, null, null],
    [null, {num: 'one'}, null],
    [null, null, null]],
      id: '76ea6408-4e3f-46f4-b5a5-66f871413ed4',
      publicId: '3Cod6QcVt3BcOHCCB9jp6A'
    }]

    return Promise.resolve(grid).asCallback(cb)
  }

  updateGrid (data) {
    let grid = {
      grid: data.grid,
      date: new Date(),
      id: uuid.v4()
    }
    return Promise.resolve(grid)
  }
}

module.exports = Database
/*

[ [{num: 43}, {num: 44}, {num: 45}, {num: 46}, {num: 47}, {num: 48}, {num: 49}],
  [{num: 42}, {num: 21}, {num: 22}, {num: 23}, {num: 24}, {num: 25}, {num: 26}],
  [{num: 41}, {num: 20}, {num: 6}, {num: 7}, {num: 8}, {num: 9}, {num: 27}],
  [{num: 40}, {num: 19}, {num: 5}, {num: 0}, {num: 1}, {num: 10}, {num: 28}],
  [{num: 39}, {num: 18}, {num: 4}, {num: 3}, {num: 2}, {num: 11}, {num: 29}],
  [{num: 38}, {num: 17}, {num: 16}, {num: 14}, {num: 13}, {num: 12}, {num: 30}],
  [{num: 37}, {num: 36}, {num: 35}, {num: 34}, {num: 33}, {num: 32}, {num: 31}] ],

[ [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, 7777, 8888, 9999, 1000, null, null],
  [null, null, null, 6666, 1111, 2222, 1001, null, null],
  [null, null, null, 5555, 4444, 3333, 1002, null, null],
  [null, null, null, null, null, null, 1003, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null] ]

[ [null, null, null, null, null, null, null],
  [null, {num: 21}, {num: 22}, {num: 23}, {num: 24}, {num: 25}, {num: 26}],
  [null, {num: 20}, {num: 6}, {num: 7}, {num: 8}, {num: 9}, {num: 27}],
  [null, {num: 19}, {num: 5}, {num: 0}, {num: 1}, {num: 10}, null],
  [null, {num: 18}, {num: 4}, {num: 3}, {num: 2}, {num: 11}, null],
  [null, {num: 17}, {num: 16}, {num: 15}, {num: 13}, {num: 12}, null],
  [null, null, null, null, null, null, null] ],

  [ [ null, null, null, null, null ],
    [ null, {image: '7'}, {image: '8'}, {image: '9'}, null ],
    [ null, {image: '6'}, {image: '1'}, {image: '2'}, null ],
    [ null, {image: '5'}, {image: '4'}, {image: '3'}, null ],
    [ null, null, null, null, null ] ],
  */
