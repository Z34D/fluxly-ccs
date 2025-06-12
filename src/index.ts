import { app } from "./app"
import { Env } from "./types/env";

// Development environment configuration
const env : Env = {
    PORT: "3000"    
};

// Create app instance with development environment
const gitCorsProxyApp = app(env);
gitCorsProxyApp.listen(env.PORT || 3000); 
console.log(`Server is running on http://localhost:${env.PORT || 3000}`);