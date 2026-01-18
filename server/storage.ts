import { db } from "./db";
import {
  admins,
  sessions,
  classes,
  students,
  subjects,
  marks,
  type Admin,
  type Session,
  type Class,
  type Student,
  type Subject,
  type Mark,
  type InsertAdmin,
  type InsertSession,
  type InsertClass,
  type InsertStudent,
  type InsertSubject,
  type StudentWithMarks
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Admin
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Session
  getSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, update: Partial<InsertSession>): Promise<Session>;
  setActiveSession(id: number): Promise<void>;
  getActiveSession(): Promise<Session | undefined>;

  // Class
  getClasses(sessionId?: number): Promise<Class[]>;
  createClass(cls: InsertClass): Promise<Class>;

  getStudents(classId?: number): Promise<StudentWithMarks[]>;
  getStudent(id: number): Promise<StudentWithMarks | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, update: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  getSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: number): Promise<void>;
  
  updateMark(studentId: number, subjectId: number, obtained: string): Promise<Mark>;
}

export class DatabaseStorage implements IStorage {
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: number, update: Partial<InsertSession>): Promise<Session> {
    const [session] = await db.update(sessions)
      .set(update)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async setActiveSession(id: number): Promise<void> {
    await db.update(sessions).set({ isActive: false }); // Deactivate all
    await db.update(sessions).set({ isActive: true }).where(eq(sessions.id, id));
  }

  async getActiveSession(): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.isActive, true));
    return session;
  }

  async getClasses(sessionId?: number): Promise<Class[]> {
    if (sessionId) {
      return await db.select().from(classes).where(eq(classes.sessionId, sessionId));
    }
    return await db.select().from(classes);
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const [cls] = await db.insert(classes).values(insertClass).returning();
    return cls;
  }

  async getStudents(classId?: number): Promise<StudentWithMarks[]> {
    try {
      let query = db.select().from(students);
      if (classId) {
        // @ts-ignore
        query = query.where(eq(students.classId, classId));
      }
      const allStudents = await query;
      
      const allSubjects = await db.select().from(subjects);
      const allMarks = await db.select().from(marks);

      return allStudents.map(s => {
        const studentMarks = allMarks
          .filter(m => m.studentId === s.id)
          .map(m => {
            const subject = allSubjects.find(sub => sub.id === m.subjectId);
            return {
              ...m,
              subject: subject || { id: 0, name: "Unknown", date: "", maxMarks: 100 }
            };
          });
        return { ...s, marks: studentMarks };
      });
    } catch (error) {
      console.error("Error in getStudents:", error);
      return [];
    }
  }

  async getStudent(id: number): Promise<StudentWithMarks | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    if (!student) return undefined;

    const allSubjects = await db.select().from(subjects);
    const studentMarks = await db.select().from(marks)
      .where(eq(marks.studentId, id));
    
    return {
      ...student,
      marks: studentMarks.map(m => ({
        ...m,
        subject: allSubjects.find(sub => sub.id === m.subjectId)!
      }))
    };
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, update: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db.update(students)
      .set(update)
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(marks).where(eq(marks.studentId, id));
    await db.delete(students).where(eq(students.id, id));
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    
    // Auto-create "0" marks for all existing students when a subject is added
    const allStudents = await db.select().from(students);
    if (allStudents.length > 0) {
      await db.insert(marks).values(
        allStudents.map(s => ({
          studentId: s.id,
          subjectId: subject.id,
          obtained: "0"
        }))
      );
    }
    
    return subject;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(marks).where(eq(marks.subjectId, id));
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async updateSubject(id: number, update: Partial<InsertSubject>): Promise<Subject> {
    const [updated] = await db.update(subjects)
      .set(update)
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async updateMark(studentId: number, subjectId: number, obtained: string): Promise<Mark> {
    const [existing] = await db.select().from(marks).where(
      and(eq(marks.studentId, studentId), eq(marks.subjectId, subjectId))
    );

    if (existing) {
      const [updated] = await db.update(marks)
        .set({ obtained })
        .where(eq(marks.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(marks)
        .values({ studentId, subjectId, obtained })
        .returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
