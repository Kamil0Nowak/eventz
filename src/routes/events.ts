import { Hono } from "hono";
import { db } from "../database";
import { eventTable } from "../database/schema"
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const app = new Hono()

// GET ALL
app.get("/", async c => {
    const [events] = await db
        .select()
        .from(eventTable)
    
    return c.json({
        success: true,
        data: {
            events
        }
    })
})


// GET SINGLE BY ID
app.get("/:id", async c => {
    const id = c.req.param("id")

    const [event] = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.id, id))
    
    if (!event) throw new HTTPException(404, { message: "Event not found" })

    return c.json({
        success: true,
        status: 200,
        data: {
            event
        }
    }, 200)
})

export default app