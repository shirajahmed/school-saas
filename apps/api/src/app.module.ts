import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { StudentsModule } from "./students/students.module";
import { TeachersModule } from "./teachers/teachers.module";
import { ClassesModule } from "./classes/classes.module";
import { SectionsModule } from "./sections/sections.module";
import { DepartmentsModule } from "./departments/departments.module";
import { ExamsModule } from "./exams/exams.module";
import { ResultsModule } from "./results/results.module";
import { AttendanceModule } from "./attendance/attendance.module";

@Module({
  imports: [
    CommonModule, 
    AuthModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    SectionsModule,
    DepartmentsModule,
    ExamsModule,
    ResultsModule,
    AttendanceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
