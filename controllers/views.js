/**
 * Created by as on 2017/5/6.
 */
module.exports = {
    'GET /': async (ctx, next) => {
        await ctx.render('index');
        next();
    },
    'GET /index2': async (ctx, next) => {
        await ctx.render('index2');
        next();
    },
    'GET /watermark': async (ctx, next) => {
        await ctx.render('watermark');
        next();
    }
};