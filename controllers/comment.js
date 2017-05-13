/**
 * Created by as on 2017/5/4.
 */
module.exports = {
    'POST /comment': async (ctx, next) => {
        let username = ctx.request.body.username || '';
        let content = ctx.request.body.content || '';
        console.log(`${username} says that ${content}!`);
        ctx.response.type = 'text/html';
        ctx.response.body = `<p><strong>${username}评论说: </strong></p>
            <p>${content}</p><strong><hr></strong>`;
    }
};