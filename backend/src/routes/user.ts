import {Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from "hono/jwt"
import { signupInput, signinInput } from "@iamcodex/medium-blog"
export const userRouter=new Hono<{ Bindings: { JWT_SECRET: string, DATABASE_URL: string } }>()


userRouter.post('/signup', async (c) => {
  const body = await c.req.json();
  //sanitize the input
  const bodyParsed = signupInput.safeParse(body);
  if (!bodyParsed.success) {
    c.status(400);
    return c.text("Invalid input");
  }
//   const body = bodyParsed.data;
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        name: body.name
      }
    });
    
    const jwt = await sign({
      id: user.id
    }, c.env.JWT_SECRET);
    
    return c.text(jwt);
  } catch(e) {
    console.log(e);
    
    if (e instanceof Error) {
      // Now TypeScript knows e is an Error object
      c.status(400);
      return c.text(`Error: ${e.message}`);
    }
    
    // Fallback for non-Error objects
    c.status(500);
    return c.text('An unknown error occurred');
  }
})


userRouter.post('/signin', async (c) => {
  const body = await c.req.json();
  //sanitize the input
  const bodyParsed = signinInput.safeParse(body);
  if (!bodyParsed.success) {
    c.status(400);
    return c.text("Invalid input");
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password
      }
    });
    
    if (!user) {
      c.status(403);
      return c.json({
        message: "Incorrect creds"
      });
    }
    
    const jwt = await sign({
      id: user.id
    }, c.env.JWT_SECRET);
    
    return c.text(jwt);
  } catch(e) {
    console.log(e);
    c.status(411);
    return c.text("Invalid");
  }
});