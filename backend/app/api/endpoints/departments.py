from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models import models
from app.schemas import department as schemas
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.post("/", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(models.Department).filter(models.Department.name == dept.name).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department already exists")
    
    new_dept = models.Department(**dept.dict())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.get("/{dept_id}", response_model=schemas.DepartmentResponse)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.put("/{dept_id}", response_model=schemas.DepartmentResponse)
def update_department(dept_id: int, dept_update: schemas.DepartmentUpdate, db: Session = Depends(get_db)):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    for key, value in dept_update.dict(exclude_unset=True).items():
        setattr(db_dept, key, value)
    
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(dept)
    db.commit()
    return {"detail": "Department deleted"}
