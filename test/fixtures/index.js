'use strict'

module.exports = {
  getUser () {
    return {
      alerts: [],
      avatar: '/standard.png',
      badges: [],
      bio: 'it is a bio with 200 ascii length',
      createdAt: '2016-08-26T18:40:42.448Z',
      email: '6e0cf970-7958-435d-8089-1343100586d0@automata.co',
      id: '32c28f13-c16b-4de8-9cea-dcf40a3dac20',
      masteries: [],
      messages: [],
      name: 'whatever user',
      password: '72bb97299c418b00872a1ccc8826cced99fa4173bf8d61fad696653381634b77',
      publicId: '1xMwRmVnzNsFMORq61GCeA',
      points: 0,
      skills: [],
      username: 'AnUserName'
    }
  },
  getImage () {
    return {
      id: 'e0de1420-01ba-4e19-91c6-00a76ba0668a',
      publicId: '6QjLPtk8EYHsb0G9FIqftU',
      userId: `user_6QjLPtk8EY`,
      src: 'http://nana.com/6QjLPtk8EYHsb0G9FIqftU.jpg',
      description: '#awesome',
      awards: ['awesome'],
      createdAt: new Date().toString()
    }
  },
  getSkill (skillName) {
    return {
      skill: skillName,
      pos: {
        x: 1, y: 1
      }
    }
  }
}
