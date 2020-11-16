const Topic = require('../model/topics')
const User = require('../model/users')
const Question = require('../model/questions')

class TopicCtl {
    async checkTopicExist(ctx, next) {
        if (ctx.params.id.length !== 24) {
            ctx.throw(400, '输入的ID长度错误')
        }
        const topic = await Topic.findById(ctx.params.id)
        if (!topic) {
            ctx.throw(404, '话题不存在')
        }

        await next()
    }

    async find(ctx) {
        const { per_page = 3 } = ctx.query
        const page = Math.max(ctx.query.page * 1, 1) - 1
        const perPage = Math.max(per_page * 1, 1)

        const count = await Topic.find().countDocuments()
        const data = await Topic.find({ name: new RegExp(ctx.query.q) })
            .limit(perPage)
            .skip(page * perPage)
        ctx.body = {
            count,
            data,
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields
            .split(';')
            .filter((f) => f)
            .map((f) => '+' + f)
            .join(' ')
        const topic = await Topic.findById(ctx.params.id).select(selectFields)
        if (!topic) {
            ctx.throw(404, '该话题不存在')
        }
        ctx.body = topic
    }

    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false },
        })
        const { name } = ctx.request.body
        const repeatedUser = await Topic.findOne({ name })
        if (repeatedUser) {
            ctx.throw(409, '该话题已存在')
        }
        const topic = await new Topic(ctx.request.body).save()
        ctx.body = topic
    }

    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false },
        })
        const topic = await Topic.findByIdAndUpdate(
            ctx.params.id,
            ctx.request.body
        )
        if (!topic) {
            ctx.throw(404, '该话题不存在')
        }
        ctx.body = topic
    }

    async listTopicFollowers(ctx) {
        const users = await User.find({ followingTopics: ctx.params.id })
        ctx.body = users
    }

    async listQuestions(ctx) {
        const questions = await Question.find({ topics: ctx.params.id })
        ctx.body = questions
    }
}

module.exports = new TopicCtl()
