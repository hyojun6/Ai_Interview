# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import vertexai
# from vertexai.preview.generative_models import GenerativeModel
# import os
# from pydantic import BaseModel
# from typing import List
# from fastapi import Depends
# from .database import get_db
# from . import crud, models
# from sqlalchemy.orm import Session
# from app.database import engine  # 이 줄이 있어야 함
# from app import models

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import vertexai
from vertexai.preview.generative_models import GenerativeModel
import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
import uuid

# from app.database import get_db, engine, Base
# from app import crud, models

DATABASE_CONN = "mysql+mysqlconnector://root:interview@127.0.0.1:3309/interview"
engine = create_engine(DATABASE_CONN, poolclass=QueuePool,pool_size=10, max_overflow=0)


app = FastAPI()
#Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/yanghyojun/Downloads/fa-interview-464510-b314020b9d83.json"
vertexai.init(
    project="fa-interview-464510",
    location="us-east4",
)

class QuestionRequest(BaseModel):
    field: str
    level: str
    count: int

class EvaluationRequest(BaseModel):
    field: str
    level: str
    count: int
    session_id: str
    questions: List[str]
    answers: List[str]

@app.post("/api/questions")
def generate_questions(req: QuestionRequest):
    prompt = f"""
        {req.field}분야에 대해
        {req.level}수준의 기업 면접 질문을 면접관의 입장에서
        {req.count}개 만들어줘.

        출력 형식 : '질문1:', '문제1:'등의 문항금지. [문제1(줄바꿈)문제2]

        초급 : 갓 배우기 시작한 수준
        중급 : 어느정도의 기술과 이론을 아는 수준
        고급 : 직무에서 최상의 코드를 바랄수있는 수준
        """

    model = GenerativeModel("gemini-2.0-flash-001")
    response = model.generate_content(prompt)

    # 질문을 줄 단위로 나눈다 (질문 형태에 따라 조정 필요)
    questions = [line for line in response.text.strip().split("\n") if line.strip()]
    session_id = str(uuid.uuid4())  # 한 세트를 구분할 ID 생성
    
    return {
        "questions": questions,
        "session_id": session_id,
        "field": req.field,
        "level": req.level,
        "count": req.count
    }

@app.post("/api/evaluate")
# def evaluate_answers(req: EvaluationRequest, db: Session = Depends(get_db)):
def evaluate_answers(req: EvaluationRequest):
    model = GenerativeModel("gemini-2.0-flash-001")
    results = []

    try:
        conn = engine.connect()
        with engine.begin() as conn:
            insert_query = """
                INSERT INTO evaluations (field, level, question, answer, feedback, session_id)
                VALUES (:field, :level, :question, :answer, :feedback, :session_id)
            """

            for q, a in zip(req.questions, req.answers):
                prompt = f"""
                    다음은 면접 질문과 지원자의 답변이야.

                    질문: {q}
                    답변: {a}

                    이 답변을 간단히 평가하고 개선 방향을 알려줘. 너무 길지 않게 핵심만 정리해서 마크다운 형식으로 출력해줘.
                """

                response = model.generate_content(prompt)
                feedback = response.text
                results.append(feedback)

                stmt = text(insert_query).bindparams(
                    field=req.field,
                    level=req.level,
                    question=q,
                    answer=a,
                    feedback=feedback,
                    session_id=req.session_id
                )
                conn.execute(stmt)

    except SQLAlchemyError as e:
        print("DB 오류:", e)
    finally:
        conn.close()

    return {"evaluations": results}

# @app.get("/api/evaluations")
# def read_evaluations(db: Session = Depends(get_db)):
#     return crud.get_all_evaluations(db)



# model = GenerativeModel("gemini-2.0-flash-001")  # 또는 "gemini-1.0-pro" // gemini-2.0-flash
# response = model.generate_content("AI란 무엇인가요?")
# print(response.text)