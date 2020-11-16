const Router = require('koa-router')
const router = new Router({ prefix: '/topics' })
const jwt = require('koa-jwt')
const { secret } = require('../config')
const auth = jwt({ secret })

const {
    find,
    findById,
    create,
    update,
    listQuestions,
    checkTopicExist,
    listTopicFollowers,
} = require('../controllers/topics')

router.get('/', find)
router.get('/:id', checkTopicExist, findById)
router.get('/:id/followers', checkTopicExist, listTopicFollowers)
router.post('/', auth, create)
router.patch('/:id', auth, checkTopicExist, update)
router.get('/:id/questions', checkTopicExist, listQuestions)

module.exports = router
