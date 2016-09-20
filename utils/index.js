'use strict'

const Promise = require('bluebird')

module.exports = {
  getEmptySpace: getEmptySpace,
  upgradeGrid: upgradeGrid
}

function getEmptySpace (grid, cb) {
  /*
  GRID:
    → → → ↓ < Grid upgrade
    ↑ → ↓
    ↑ ← ←

  */

  let size = grid.length
  let startPoint = Math.floor(size / 2)
  let radious = startPoint

  let odd = 1
  let odd2 = 1

  for (let i = 0; i <= radious; i++) {
    for (let direction = 0; direction < 4; direction++) {
      if (direction === 0) {
        let start = i === 0 ? 2 : odd
        let equF = i > 0 ? 1 : 0
        for (let forw = 0; forw < start; forw++) {
          let forwX = (startPoint - i) + forw + equF
          let forwY = (startPoint - i)

          if (grid[forwY][forwX] === null) {
            return Promise.resolve({
              x: forwX,
              y: forwY
            }).asCallback(cb)
          }

          if (grid[forwY][forwX] === undefined) {
            return Promise.resolve(null).asCallback(cb)
          }
        }
        odd += 2
      }
      if (direction === 1) {
        let start = i === 0 ? 1 : odd2
        let equB
        if (i === 0) equB = 1
        if (i === 1) equB = 0
        if (i > 1) equB = -1 * (i - 1)

        for (let bot = 0; bot < start; bot++) {
          let botX = (startPoint + i) + 1
          let botY = (startPoint + equB) + bot

          if (grid[botY][botX] === null) {
            return Promise.resolve({
              x: botX,
              y: botY
            }).asCallback(cb)
          }
        }
        odd2 += 2
      }
      if (direction === 2) {
        for (let back = 0; back < (i + 1) * 2; back++) {
          let backX = (startPoint + i) - back
          let backY = (startPoint + i) + 1

          if (grid[backY][backX] === null) {
            return Promise.resolve({
              x: backX,
              y: backY
            }).asCallback(cb)
          }
        }
      }
      if (direction === 3) {
        for (let top = 0; top < (i + 1) * 2; top++) {
          let topX = (startPoint - 1) - i
          let topY = (startPoint + i) - top

          if (grid[topX][topY] === null) {
            return Promise.resolve({
              x: topX,
              y: topY
            }).asCallback(cb)
          }
        }
      }
    }
  }
}

function emptySpaceGenerator (grid) {
  let space = []

  for (let i = 0; i < grid.length; i++) {
    space.push(null)
  }
  return space
}

function upgradeGrid (grid) {
  grid.map((row) => {
    row.push(null, null)
    row.unshift(null, null)
  })

  let spaces = emptySpaceGenerator(grid[0])

  grid.unshift(spaces, spaces)
  grid.push(spaces, spaces)

  return grid
}
