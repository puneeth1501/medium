import {Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from "hono/jwt"
import { createBlogInput, updateBlogInput } from "@iamcodex/medium-blog"
export const blogRouter=new Hono<{ Bindings: { JWT_SECRET: string, DATABASE_URL: string },
Variables: { userId: string } }>()

blogRouter.use("/*",async (c,next)=>{
    const authHeader=c.req.header("Authorization")||""
    const user= await verify(authHeader,c.env.JWT_SECRET)
    if(user){
        c.set("userId",String(user.id))
        await next()
    }
    else{
        c.status(401)
        return c.text("Unauthorized")
    }
    
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    //sainitize the input
    const bodyParsed = createBlogInput.safeParse(body);
    if (!bodyParsed.success) {
      c.status(400);
      return c.text("Invalid input");
    }
    const userid=c.get("userId")
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const blog =await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(userid)
    }
    })
    return c.json({
        id:blog.id,
    })

  })
  
blogRouter.put ('/', async (c) => {
        const body = await c.req.json();
        //sainitize the input
        const bodyParsed = updateBlogInput.safeParse(body);
        if (!bodyParsed.success) {
          c.status(400);
          return c.text("Invalid input");
        }

        const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
const blog =await prisma.blog.update({
    where:{
        id:body.id
    },
    data:{
        title:body.title,
        content:body.content
    }
})
return c.json({
    id:blog.id,
  })
})

  //pagination needed 
blogRouter.get('/bulk' ,async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs=await prisma.blog.findMany({})
    return c.json({
        blogs
    })
    
  })
  
blogRouter.get('/:id', async (c) => {
    const id =c.req.param("id")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try{
        const blog=await prisma.blog.findFirst({
            where:{
                id:Number(id)
            }
            })
            return c.json({
                blog 
            })
        }
        catch(e){
            console.log(e)
            return c.json({
                error:"blog not found"
            })
        }
  })


