const Router = require('koa-router')
const router = new Router({ prefix: '/users' })
const jwt = require('koa-jwt')
const { secret } = require('../config')

//使用jwt库处理认证与授权
const auth = jwt({ secret })

const {
    find,
    findById,
    create,
    update,
    delete: del,
    login,
    checkOwner,
    listFollowing,
    listFollowers,
    follow,
    unfollow,
    checkUserExist,
    listFollowingTopics,
    followTopic,
    unfollowTopic,
    listQuestions,
    listAnswers,
    listLikingAnswers,
    likeAnswer,
    unlikeAnswer,
    listDisLikingAnswers,
    dislikeAnswer,
    undislikeAnswer,
    listColletingAnswers,
    collectAnswers,
    unCollectAnswers,
    listComment,
} = require('../controllers/users')

const { checkTopicExist } = require('../controllers/topics')
const { checkAnswerExist } = require('../controllers/answers')

//登录与注册
router.post('/login', login)
router.post('/', create)

//获取用户
router.get('/', find)
router.get('/:id', checkUserExist, findById)

//修改和删除
router.patch('/:id', auth, checkUserExist, checkOwner, update)
router.delete('/:id', auth, checkUserExist, checkOwner, del)

//关注与粉丝
router.get('/:id/following', checkUserExist, listFollowing)
router.get('/:id/followers', checkUserExist, listFollowers)
router.put('/following/:id', auth, checkUserExist, follow)
router.delete('/following/:id', auth, checkUserExist, unfollow)

//关注与话题
router.get('/:id/followingTopics', auth, checkUserExist, listFollowingTopics)
router.put('/followingTopics/:id', auth, checkTopicExist, followTopic)
router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopic)

//问题
router.get('/:id/questions', auth, checkUserExist, listQuestions)

//答案
router.get('/:id/answers', auth, checkUserExist, listAnswers)

//点赞
router.get('/:id/likingAnswers', checkUserExist, listLikingAnswers)
router.put(
    '/likingAnswers/:id',
    auth,
    checkAnswerExist,
    likeAnswer,
    undislikeAnswer
)
router.delete('/likingAnswers/:id', auth, checkAnswerExist, unlikeAnswer)

router.get('/:id/dislikingAnswers', checkUserExist, listDisLikingAnswers)
router.put(
    '/dislikingAnswers/:id',
    auth,
    checkAnswerExist,
    dislikeAnswer,
    unlikeAnswer
)
router.delete('/dislikingAnswers/:id', auth, checkAnswerExist, undislikeAnswer)

router.get('/:id/collectkingAnswers', checkUserExist, listColletingAnswers)
router.put('/collectkingAnswers/:id', auth, checkAnswerExist, collectAnswers)
router.delete(
    '/collectkingAnswers/:id',
    auth,
    checkAnswerExist,
    unCollectAnswers
)

//评论
router.get('/:id/comments', auth, checkUserExist, listComment)

module.exports = router
