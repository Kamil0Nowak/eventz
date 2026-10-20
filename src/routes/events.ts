import { Hono } from "hono";
import { db } from "../database";
import { eventTable } from "../database/schema"
import { count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../middleware/auth";
import z from "zod";
import { sValidator } from "@hono/standard-validator";

const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  starts_at: z.string().datetime(),
  capacity: z.number().int().positive(),
});


const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  starts_at: z.string().datetime().optional(),
  capacity: z.number().int().positive().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const app = new Hono()

// GET ALL
app.get("/", sValidator("query", paginationSchema), async c => {
    const { page = 1, limit = 10 } = c.req.valid("query");

    const [resultAll] = await db
        .select({ count: count() })
        .from(eventTable);

    const totalEvents = resultAll.count;

    const events = await db
        .select()
        .from(eventTable)
        .offset((page - 1) * limit)
        .limit(limit);

    return c.json({
        success: true,
        data: {
            events
        },
        meta: {
            pages: Math.ceil(totalEvents / limit),
            total: totalEvents
        }
    })
})


// GET MY EVENTS
app.get("/me", requireAuth, sValidator("query", paginationSchema), async c => {
    const user = c.get("user")
    const { page = 1, limit = 10 } = c.req.valid("query");

    const [resultAll] = await db
        .select({ count: count() })
        .from(eventTable);

    const totalEvents = resultAll.count;

    const events = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.creator_id, user.id))
        .offset((page - 1) * limit)
        .limit(limit);

    return c.json({
        success: true,
        data: {
            events
        },
        meta: {
            pages: Math.ceil(totalEvents / limit),
            total: totalEvents
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
app.post("/", requireAuth, sValidator("json", createEventSchema), async c => {
    const body = c.req.valid("json");
    const user = c.get("user")

    const [newEvent] = await db
        .insert(eventTable)
        .values({
            name: body.name,
            creator_id: user.id,
            description: body.description,
            starts_at: new Date(body.starts_at),
            capacity: body.capacity
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
app.patch("/:id", requireAuth, sValidator("json", updateEventSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
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
            capacity: body.capacity ?? existingEvent.capacity,
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