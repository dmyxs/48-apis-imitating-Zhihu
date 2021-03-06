const Router = require('koa-router')
const router = new Router({ prefix: '/questions/:questionId/answers' })
const jwt = require('koa-jwt')
const { secret } = require('../config')
const auth = jwt({ secret })

const {
    find,
    findById,
    create,
    update,
    delete: del,
    checkAnswerer,
    checkAnswerExist,
} = require('../controllers/answers')

router.get('/', find)
router.get('/:id', checkAnswerExist, findById)
router.post('/', auth, create)
router.patch('/:id', auth, checkAnswerExist, checkAnswerer, update)
router.delete('/:id', auth, checkAnswerExist, checkAnswerer, del)

module.exports = router
