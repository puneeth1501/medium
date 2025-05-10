import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'



const app = new Hono<{ Bindings: { JWT_SECRET: string, DATABASE_URL: string } }>()


app.route('/api/v1/blog', blogRouter)
app.route('/api/v1/user', userRouter)










export default app
