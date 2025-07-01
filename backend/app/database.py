# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base, Session

# DATABASE_URL = "mysql+pymysql://fa_user:fa_pass@interview:3306/interview"

# engine = create_engine(DATABASE_URL, echo=True)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# def get_db():
#     db: Session = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
