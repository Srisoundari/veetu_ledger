from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import households, expenses, projects, shared_list, nlp

app = FastAPI(title="Finance App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(households.router,   prefix="/households",  tags=["households"])
app.include_router(expenses.router,     prefix="/expenses",    tags=["expenses"])
app.include_router(projects.router,     prefix="/projects",    tags=["projects"])
app.include_router(shared_list.router,  prefix="/list",        tags=["list"])
app.include_router(nlp.router,          prefix="/nlp",         tags=["nlp"])


@app.get("/")
def health():
    return {"status": "ok"}
