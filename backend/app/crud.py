# # backend/app/crud.py

# from sqlalchemy.orm import Session
# from . import models
# from .models import Evaluation

# def save_evaluation(db: Session, question: str, answer: str, feedback: str):
#     evaluation = Evaluation(question=question, answer=answer, feedback=feedback)
#     db.add(evaluation)
#     db.commit()
#     db.refresh(evaluation)
#     return evaluation

# def create_evaluation(db: Session, question: str, answer: str, feedback: str):
#     evaluation = models.Evaluation(
#         question=question,
#         answer=answer,
#         feedback=feedback
#     )
#     db.add(evaluation)
#     db.commit()
#     db.refresh(evaluation)
#     return evaluation

# def get_all_evaluations(db: Session):
#     return db.query(models.Evaluation).all()
