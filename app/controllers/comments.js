const Comment = require('../model/comments')

class CommentCtl {
    async checkCommentator(ctx, next) {
        const { comment } = ctx.state
        if (comment.commentator.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }

    async checkCommentExist(ctx, next) {
        if (ctx.params.id.length !== 24) {
            ctx.throw(400, '输入的ID长度错误，长度必须为24')
        }
        const comment = await Comment.findById(ctx.params.id).select(
            '+commentator'
        )
        if (!comment) {
            ctx.throw(404, '该评论不存在')
        }
        if (
            ctx.params.questionId &&
            comment.questionId.toString() !== ctx.params.questionId
        ) {
            ctx.throw(404, '该问题下没有此评论')
        }
        if (
            ctx.params.answerId &&
            comment.answerId.toString() !== ctx.params.answerId
        ) {
            ctx.throw(404, '该答案下没有此评论')
        }

        ctx.state.comment = comment
        await next()
    }

    async find(ctx) {
        const { per_page = 10 } = ctx.query
        const page = Math.max(ctx.query.page * 1, 1) - 1
        const perPage = Math.max(per_page * 1, 1)
        const q = new RegExp(ctx.query.q)
        const { answerId, questionId } = ctx.params
        const { rootCommentId } = ctx.query
        const comments = await Comment.find({
            content: q,
            questionId,
            answerId,
            rootCommentId,
        })
            .limit(perPage)
            .skip(page * perPage)
            .populate('commentator replyTo')
        const count = await Comment.find().countDocuments()
        ctx.body = {
            count,
            data: comments,
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields
            .split(';')
            .filter((f) => f)
            .map((f) => '+' + f)
            .join('')
        const comment = await Comment.findById(ctx.params.id)
            .select(selectFields)
            .populate('commentator')

        ctx.body = comment
    }

    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
            rootCommentId: { type: 'string', required: false },
            replyTo: { type: 'string', required: false },
        })
        const commentator = ctx.state.user._id
        const { questionId, answerId } = ctx.params
        const comment = await new Comment({
            ...ctx.request.body,
            commentator,
            questionId,
            answerId,
        }).save()
        ctx.body = comment
    }

    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
        })
        const { content } = ctx.request.body
        await ctx.state.comment.update(content)
        ctx.body = ctx.state.comment
    }

    async delete(ctx) {
        await Comment.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new CommentCtl()
