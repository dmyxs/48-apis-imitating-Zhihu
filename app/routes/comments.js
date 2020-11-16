const Router = require('koa-router')
const router = new Router({
    prefix: '/questions/:questionId/answers/:answerId/comments',
})
const jwt = require('koa-jwt')
const { secret } = require('../config')
const auth = jwt({ secret })

const {
    find,
    findById,
    create,
    update,
    delete: del,
    checkCommentator,
    checkCommentExist,
} = require('../controllers/comments')

router.get('/', find)
router.get('/:id', checkCommentExist, findById)
router.post('/', auth, create)
router.patch('/:id', auth, checkCommentExist, checkCommentator, update)
router.delete('/:id', auth, checkCommentExist, checkCommentator, del)

module.exports = router
