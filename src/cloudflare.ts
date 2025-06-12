
import { app } from "./app"
import { Context } from "elysia"
import { Env } from "./types/env"

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: Context,

    ): Promise<Response> {

        return await app(env).fetch(request)
    },
}
