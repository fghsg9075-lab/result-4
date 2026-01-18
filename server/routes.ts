import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertAdminSchema, insertSessionSchema, insertClassSchema } from "@shared/schema";
import { z } from "zod";
import { hash, compare } from "bcryptjs";

const SEED_DATA = [
  { rollNo: 1, name: "Aakash Yadav", obtained: 54, max: 80 },
  { rollNo: 2, name: "Aryan Kumar", obtained: 51, max: 80 },
  { rollNo: 3, name: "Rahul Kumar", obtained: 70, max: 80 },
  { rollNo: 4, name: "Aman Kumar", obtained: 46, max: 80 },
  { rollNo: 5, name: "Prince Kumar", obtained: 0, max: 80 },
  { rollNo: 6, name: "Faiz Raza", obtained: 58, max: 80 },
  { rollNo: 7, name: "Meraj Alam", obtained: 0, max: 80 },
  { rollNo: 8, name: "Afroz", obtained: 0, max: 80 },
  { rollNo: 9, name: "Ismail", obtained: 0, max: 80 },
  { rollNo: 10, name: "Khusboo", obtained: 62, max: 80 },
  { rollNo: 11, name: "Salma Parveen", obtained: 0, max: 80 },
  { rollNo: 12, name: "Aaisha Khatoon", obtained: 49, max: 80 },
  { rollNo: 13, name: "Sahima", obtained: 0, max: 80 },
  { rollNo: 14, name: "Aashiya", obtained: 45, max: 80 },
  { rollNo: 15, name: "Shanzida", obtained: 36, max: 80 },
  { rollNo: 16, name: "Maimuna", obtained: 68, max: 80 },
  { rollNo: 17, name: "Soha", obtained: 56, max: 80 },
  { rollNo: 18, name: "Naziya (U)", obtained: 58, max: 80 },
  { rollNo: 19, name: "Jashmin", obtained: 56, max: 80 },
  { rollNo: 20, name: "Usha Kumari", obtained: 38, max: 80 },
  { rollNo: 21, name: "Gungun", obtained: 54, max: 80 },
  { rollNo: 22, name: "Naziya (D)", obtained: 45, max: 80 },
  { rollNo: 23, name: "Shahina Khatoon", obtained: 60, max: 80 },
  { rollNo: 24, name: "Sonam Kumari", obtained: 40, max: 80 },
  { rollNo: 25, name: "Farzana", obtained: 65, max: 80 },
  { rollNo: 26, name: "Muskan Khatoon", obtained: 53, max: 80 },
  { rollNo: 27, name: "Sabina", obtained: 60, max: 80 },
  { rollNo: 28, name: "Farhin", obtained: 0, max: 80 },
  { rollNo: 29, name: "Sanaa Parveen", obtained: 66, max: 80 },
  { rollNo: 30, name: "Rani Parveen", obtained: 56, max: 80 },
  { rollNo: 31, name: "Gulafsa", obtained: 68, max: 80 },
  { rollNo: 32, name: "Sajiya Khatoon", obtained: 54, max: 80 },
  { rollNo: 33, name: "Amarjit Kumar", obtained: 47, max: 80 },
  { rollNo: 34, name: "Prince Yadav", obtained: 21, max: 80 },
  { rollNo: 35, name: "Tabrez", obtained: 41, max: 80 },
  { rollNo: 36, name: "Faiz", obtained: 0, max: 80 },
  { rollNo: 37, name: "Muskan II", obtained: 0, max: 80 },
  { rollNo: 38, name: "Tahir", obtained: 40, max: 80 },
  { rollNo: 39, name: "Anshu Kumari", obtained: 0, max: 80 },
];

async function seedDatabase() {
  // Seed Admin
  const existingAdmin = await storage.getAdminByEmail("Nadimanwar794@gmail.com");
  if (!existingAdmin) {
     console.log("Seeding admin...");
     const hashedPassword = await hash("ns841414", 10);
     await storage.createAdmin({
       email: "Nadimanwar794@gmail.com",
       password: hashedPassword,
       name: "Nadim Anwar",
       isSuperAdmin: true
     });
  }

  // Seed Initial Session if none exists
  const sessions = await storage.getSessions();
  if (sessions.length === 0) {
    const session = await storage.createSession({
      name: "2025-26",
      isActive: true
    });
    // Create a default class for this session
    await storage.createClass({
      name: "Standard 10",
      sessionId: session.id
    });
  }

  const students = await storage.getStudents();
  if (students.length === 0) {
    console.log("Seeding students...");
    
    // Create initial subject first
    const subject = await storage.createSubject({
      name: "Initial Test",
      date: new Date().toISOString().split('T')[0],
      maxMarks: 80,
      classId: 1 // Default class ID 1
    });

    for (const data of SEED_DATA) {
      const student = await storage.createStudent({
        rollNo: data.rollNo,
        name: data.name,
        classId: 1 // Default class ID 1
      });
      
      // Update mark for this student and subject
      await storage.updateMark(student.id, subject.id, data.obtained.toString());
    }
    console.log("Seeding complete.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data on startup
  seedDatabase();

  // --- Admin Routes ---
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const admin = await storage.getAdminByEmail(email);
    
    if (admin && (await compare(password, admin.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...rest } = admin;
      res.json(rest);
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/admin/create", async (req, res) => {
    try {
      const input = insertAdminSchema.parse(req.body);
      const existing = await storage.getAdminByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Admin already exists" });
      }
      const hashedPassword = await hash(input.password, 10);
      const admin = await storage.createAdmin({ ...input, password: hashedPassword });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...rest } = admin;
      res.status(201).json(rest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Session Routes ---
  app.get("/api/sessions", async (req, res) => {
    const sessions = await storage.getSessions();
    res.json(sessions);
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const input = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = insertSessionSchema.partial().parse(req.body);
      const session = await storage.updateSession(id, input);
      res.json(session);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });
  
  app.get("/api/sessions/active", async (req, res) => {
      const session = await storage.getActiveSession();
      res.json(session || null);
  });

  app.post("/api/sessions/:id/active", async (req, res) => {
      const id = Number(req.params.id);
      await storage.setActiveSession(id);
      res.json({ success: true });
  });

  // --- Class Routes ---
  app.get("/api/classes", async (req, res) => {
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
    const classes = await storage.getClasses(sessionId);
    res.json(classes);
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const input = insertClassSchema.parse(req.body);
      const cls = await storage.createClass(input);
      res.status(201).json(cls);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.students.list.path, async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const students = await storage.getStudents(classId);
    res.json(students);
  });

  app.get(api.students.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const student = await storage.getStudent(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  });

  app.post(api.students.create.path, async (req, res) => {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.students.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.students.update.input.parse(req.body);
      const updated = await storage.updateStudent(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.subjects.create.path, async (req, res) => {
    try {
      const input = api.subjects.create.input.parse(req.body);
      const subject = await storage.createSubject(input);
      res.status(201).json(subject);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.subjects.list.path, async (req, res) => {
    const subjects = await storage.getSubjects();
    res.json(subjects);
  });

  app.patch(api.subjects.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const input = api.subjects.update.input.parse(req.body);
    const updated = await storage.updateSubject(id, input);
    res.json(updated);
  });

  app.post(api.marks.update.path, async (req, res) => {
    try {
      const { studentId, subjectId, obtained } = api.marks.update.input.parse(req.body);
      const updatedMark = await storage.updateMark(studentId, subjectId, obtained);
      res.json(updatedMark);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.students.delete.path, async (req, res) => {
     const id = Number(req.params.id);
     await storage.deleteStudent(id);
     res.status(204).send();
  });

  return httpServer;
}
