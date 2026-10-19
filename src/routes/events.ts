import { Hono } from "hono";
import { db } from "../database";
import { eventTable } from "../database/schema"
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth";
import { requireAuth } from "../middleware/auth";

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


// GET MY EVENTS
app.get("/me", requireAuth, async c => {
    const user = c.get("user")

    const [events] = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.creator_id, user.id))
    
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


// CREATE EVENT
app.post("/", requireAuth, async c => {
    const body = await c.req.json()
    const user = c.get("user")

    const [newEvent] = await db
        .insert(eventTable)
        .values({
            name: body.name,
            creator_id: user.id,
            description: body.description,
            starts_at: new Date(),
            capacity: 10
        })
        .returning()

    return c.json({
        success: true,
        status: 201,
        data: {
            event: newEvent
        }
    }, 201)
})


// UPDATE
app.patch("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const user = c.get("user");

    const [existingEvent] = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.id, id));

    if (!existingEvent) {
        throw new HTTPException(404, { message: "Event not found" });
    }

    if (existingEvent.creator_id !== user.id) {
        throw new HTTPException(403, { message: "Forbidden" });
    }

    const [updatedEvent] = await db
        .update(eventTable)
        .set({
            name: body.name ?? existingEvent.name,
            description: body.description ?? existingEvent.description,
            starts_at: body.starts_at ? new Date(body.starts_at) : existingEvent.starts_at,
        })
        .where(eq(eventTable.id, id))
        .returning();

    return c.json({
        success: true,
        data: { event: updatedEvent }
    });
});


//DELETE
app.delete("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");

    const [existingEvent] = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.id, id));

    if (!existingEvent) {
        throw new HTTPException(404, { message: "Event not found" });
    }

    if (existingEvent.creator_id !== user.id) {
        throw new HTTPException(403, { message: "Forbidden" });
    }

    await db
        .delete(eventTable)
        .where(eq(eventTable.id, id));

    return c.body(null, 204);
});

export default app