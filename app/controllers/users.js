const jsonwebtoken = require('jsonwebtoken')
const User = require('../model/users')
const Question = require('../model/questions')
const Answer = require('../model/answers')
const Comment = require('../model/comments')

const { secret } = require('../config')

class UsersCtl {
    async checkOwner(ctx, next) {
        if (ctx.params.id !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }

    async checkUserExist(ctx, next) {
        if (ctx.params.id.length !== 24) {
            ctx.throw(400, '输入的ID长度错误')
        }
        const user = await User.findById(ctx.params.id)
        if (!user) {
            ctx.throw(404, '用户不存在')
        }
        await next()
    }

    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true },
        })
        const { name } = ctx.request.body
        const repeatedUser = await User.findOne({ name })
        if (repeatedUser) {
            ctx.throw(409, '用户名已存在')
        }
        const user = await new User(ctx.request.body).save()
        ctx.body = {
            status: 0,
            data: user,
        }
    }

    async login(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true },
        })
        const user = await User.findOne(ctx.request.body)
        if (!user) {
            ctx.throw(401, '用户名或密码不正确')
        }

        //设置token
        const { _id, name } = user
        // 设置token并设置过期时间
        const token = jsonwebtoken.sign({ _id, name }, secret, {
            expiresIn: '1d',
        })
        ctx.body = { status: 0, token }
    }

    async find(ctx) {
        const user = await User.find({ name: new RegExp(ctx.query.q) }).sort({
            name: 1,
        })
        const count = await User.find().countDocuments()
        ctx.body = {
            count,
            data: user,
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields
            .split(';')
            .filter((f) => f)
            .map((f) => '+' + f)
            .join(' ')

        const populateStr = fields
            .split(';')
            .filter((f) => f)
            .map((f) => {
                if (f === 'employments') {
                    return 'employments.company employments.job'
                }
                if (f === 'educations') {
                    return 'educations.school educations.major'
                }
                return f
            })
            .join(' ')
        const user = await await User.findById(ctx.params.id)
            .select(selectFields)
            .populate(populateStr)

        ctx.body = user
    }

    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            password: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            gender: { type: 'string', required: false },
            headline: { type: 'string', required: false },
            locations: { type: 'array', itemType: 'string', required: false },
            business: { type: 'string', required: false },
            employments: { type: 'array', itemType: 'object', required: false },
            eductions: { type: 'array', itemType: 'object', required: false },
        })
        const user = await User.findByIdAndUpdate(
            ctx.params.id,
            ctx.request.body
        )
        ctx.body = user
    }

    async delete(ctx) {
        const user = await User.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }

    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id)
            .select('+following')
            .populate('following')
        ctx.body = user.following
    }

    async listFollowers(ctx) {
        const users = await User.find({ following: ctx.params.id })
        ctx.body = users
    }

    async follow(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+following'
        )

        //关注者列表的id转成字符串后，是否包含params.id，如果没有才添加进去
        if (
            !user.following.map((id) => id.toString()).includes(ctx.params.id)
        ) {
            user.following.push(ctx.params.id)
            user.save()
        }
        ctx.status = 204
    }

    async unfollow(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+following'
        )
        const index = user.following
            .map((id) => id.toString())
            .indexOf(ctx.params.id)
        if (index > -1) {
            user.following.splice(index, 1)
            user.save()
        }
        ctx.status = 204
    }

    async listFollowingTopics(ctx) {
        const user = await User.findById(ctx.params.id)
            .select('+followingTopics')
            .populate('followingTopics')

        ctx.body = user.followingTopics
    }

    async followTopic(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+followingTopics'
        )
        if (
            !user.followingTopics
                .map((id) => id.toString())
                .includes(ctx.params.id)
        ) {
            user.followingTopics.push(ctx.params.id)
            user.save()
        }
        ctx.status = 204
    }

    async unfollowTopic(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+followingTopics'
        )
        const index = user.followingTopics
            .map((id) => id.id.toString())
            .includes(ctx.params.id)

        if (index > -1) {
            user.followingTopics.splice(index, 1)
            user.save()
        }
        ctx.status = 204
    }

    async listQuestions(ctx) {
        const questions = await Question.find({ questioner: ctx.params.id })
        ctx.body = questions
    }

    async listAnswers(ctx) {
        const answers = await Answer.find({ answerer: ctx.params.id })
        ctx.body = answers
    }

    async listLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id)
            .select('+likingAnswers')
            .populate('likingAnswers')

        ctx.body = user.likingAnswers
    }

    async likeAnswer(ctx, next) {
        const user = await User.findById(ctx.state.user._id).select(
            '+likingAnswers'
        )

        if (
            !user.likingAnswers
                .map((id) => id.toString())
                .includes(ctx.params.id)
        ) {
            user.likingAnswers.push(ctx.params.id)
            user.save()

            //同时在答案的投票数中添加1，使用$inc方法
            await Answer.findByIdAndUpdate(ctx.params.id, {
                $inc: { voteCount: 1 },
            })
        } else {
            ctx.throw(409, '你已经点赞过答案')
        }
        ctx.status = 204
        await next()
    }

    async unlikeAnswer(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+likingAnswers'
        )
        const index = user.likingAnswers
            .map((id) => id.toString())
            .indexOf(ctx.params.id)

        if (index > -1) {
            user.likingAnswers.splice(index, 1)
            user.save()

            //同时在答案的投票数中减1，使用$inc方法
            await Answer.findByIdAndUpdate(ctx.params.id, {
                $inc: { voteCount: -1 },
            })
        }
        ctx.status = 204
    }

    async listDisLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id)
            .select('+dislikingAnswers')
            .populate('dislikingAnswers')
        ctx.body = user.dislikingAnswers
    }

    async dislikeAnswer(ctx, next) {
        const user = await User.findById(ctx.state.user._id).select(
            '+dislikingAnswers'
        )

        if (
            !user.dislikingAnswers
                .map((id) => id.toString())
                .includes(ctx.params.id)
        ) {
            user.dislikingAnswers.push(ctx.params.id)
            user.save()
        } else {
            ctx.throw(409, '你已经踩过该答案')
        }
        ctx.status = 204
        await next()
    }

    async undislikeAnswer(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+dislikingAnswers'
        )
        const index = user.dislikingAnswers
            .map((id) => id.toString())
            .indexOf(ctx.params.id)

        if (index > -1) {
            user.dislikingAnswers.splice(index, 1)
            user.save()
        }
        ctx.status = 204
    }

    async listColletingAnswers(ctx) {
        const user = await User.findById(ctx.params.id)
            .select('+colletingAnswers')
            .populate('colletingAnswers')
        ctx.body = user.colletingAnswers
    }

    async collectAnswers(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+colletingAnswers'
        )
        if (
            !user.colletingAnswers
                .map((id) => id.toString())
                .includes(ctx.params.id)
        ) {
            user.colletingAnswers.push(ctx.params.id)
            user.save()
        } else {
            ctx.throw(409, '你已经收藏该答案')
        }
        ctx.status = 204
    }

    async unCollectAnswers(ctx) {
        const user = await User.findById(ctx.state.user._id).select(
            '+colletingAnswers'
        )

        const index = user.colletingAnswers
            .map((id) => id.toString())
            .indexOf(ctx.params.id)

        if (index > -1) {
            user.colletingAnswers.splice(index, 1)
            user.save()
        }
        ctx.status = 204
    }

    async listComment(ctx) {
        const comments = await Comment.find({ commentator: ctx.params.id })
        ctx.body = {
            data: comments,
        }
    }
}

module.exports = new UsersCtl()
