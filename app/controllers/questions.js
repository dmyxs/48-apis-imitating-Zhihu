const Question = require('../model/questions')

class QuestionsCtl {
    async checkQuestioner(ctx, next) {
        const { question } = ctx.state
        if (question.questioner.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }

    async checkQuestionExist(ctx, next) {
        if (ctx.params.id.length !== 24) {
            ctx.throw(400, '输入的ID长度错误，长度必须为24')
        }
        const question = await Question.findById(ctx.params.id).select(
            '+questioner'
        )
        if (!question) {
            ctx.throw(404, '该问题不存在')
        }

        ctx.state.question = question
        await next()
    }

    async find(ctx) {
        const { per_page } = ctx.query
        const page = Math.max(ctx.query.page * 1, 1) - 1
        const perPage = Math.max(per_page * 1, 1) - 1
        const q = new RegExp(ctx.query.q)
        const questions = await Question.find({
            $or: [{ title: q }, { description: q }],
        })
            .limit(perPage)
            .skip(perPage * page)
            .populate('questioner')
        const count = await Question.find().countDocuments
        ctx.body = {
            count,
            data: questions,
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields
            .split(';')
            .filter((f) => f)
            .map((f) => '+' + f)
            .join('')
        const question = await Question.findById(ctx.params.id)
            .select(selectFields)
            .populate('questioner topics')

        ctx.body = question
    }

    async create(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
        })
        const question = await new Question({
            ...ctx.request.body,
            questioner: ctx.state.user._id,
        }).save()
        ctx.body = question
    }

    async update(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
        })
        await ctx.state.question.update(ctx.request.body)
        ctx.body = ctx.state.question
    }

    async delete(ctx) {
        await Question.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new QuestionsCtl()
