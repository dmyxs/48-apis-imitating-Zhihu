const Answer = require('../model/answers')

class AnswerCtl {
    async checkAnswerer(ctx, next) {
        const { answer } = ctx.state
        if (answer.answerer.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }

    async checkAnswerExist(ctx, next) {
        if (ctx.params.id.length !== 24) {
            ctx.throw(400, '输入的ID长度错误，长度必须为24')
        }
        const answer = await Answer.findById(ctx.params.id).select('+answerer')
        if (!answer) {
            ctx.throw(404, '该答案不存在')
        }
        if (
            ctx.params.questionId &&
            ctx.params.questionId !== answer.questionId
        ) {
            ctx.throw(404, '该问题下没有此答案')
        }

        ctx.state.answer = answer
        await next()
    }

    async find(ctx) {
        const { per_page = 10 } = ctx.query
        const page = Math.max(ctx.query.page * 1, 1) - 1
        const perPage = Math.max(per_page * 1, 1)
        const q = new RegExp(ctx.query.q)
        const answers = await Answer.find({
            content: q,
            questionId: ctx.params.questionId,
        })
            .limit(perPage)
            .skip(page * perPage)
        const count = await Answer.find().countDocuments()
        ctx.body = {
            count,
            data: answers,
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields
            .split(';')
            .filter((f) => f)
            .map((f) => '+' + f)
            .join('')
        const answer = await Answer.findById(ctx.params.id)
            .select(selectFields)
            .populate('answerer')

        ctx.body = answer
    }

    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
        })
        const answer = await new Answer({
            ...ctx.request.body,
            answerer: ctx.state.user._id,
            questionId: ctx.params.questionId,
        }).save()
        ctx.body = answer
    }

    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
        })
        await ctx.state.answer.update(ctx.request.body)
        ctx.body = ctx.state.answer
    }

    async delete(ctx) {
        await Answer.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new AnswerCtl()
