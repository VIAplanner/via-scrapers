import axios from 'axios';
import fs from 'fs';
import ora from 'ora';

import Course from '../structures/course';
import MeetingSection from '../structures/meetingSection';
import Time from '../structures/time';

const url = 'https://api.easi.utoronto.ca/ttb/getPageableCourses';
const body = {
  courseCodeAndTitleProps: {
    courseCode: '',
    courseTitle: '',
    courseSectionCode: '',
    searchCourseDescription: true,
  },
  departmentProps: [],
  campuses: [],
  sessions: ['20239', '20241', '20239-20241'],
  requirementProps: [],
  instructor: '',
  courseLevels: [],
  deliveryModes: [],
  dayPreferences: [],
  timePreferences: [],
  divisions: ['APSC', 'ARCLA', 'ARTSC', 'ERIN', 'MUSIC', 'SCAR'],
  creditWeights: [],
  page: 1,
  pageSize: 9999, // hack to get all courses
  direction: 'asc',
};

const parseTerm = (sectionCode) => {
  if (sectionCode === 'F') {
    return '2022 Fall';
  } else if (sectionCode === 'S') {
    return '2023 Fall';
  } else {
    return '2022 Fall +';
  }
};

const parseDay = (dayNum) => {
  if (dayNum === 1) {
    return 'MONDAY';
  } else if (dayNum === 2) {
    return 'TUESDAY';
  } else if (dayNum === 3) {
    return 'WEDNESDAY';
  } else if (dayNum === 4) {
    return 'THURSDAY';
  } else if (dayNum === 5) {
    return 'FRIDAY';
  } else if (dayNum === 6) {
    return 'SATURDAY';
  }
  return 'SUNDAY';
};

(async () => {
  const spinner = ora({
    text: 'Retrieving Courses',
    spinner: {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    },
  }).start();

  try {
    const allCourseCodes = [];
    const result = await axios.post(url, body);
    const courses = result.data.payload.pageableCourse.courses;

    courses.forEach(
      ({
        code,
        sectionCode,
        name,
        sessions,
        campus,
        cmCourseInfo,
        department: { code: departmentCode },
        sections,
      }) => {
        const parsedCmCourseInfo = cmCourseInfo || {
          description: '',
          prerequisitesText: '',
          corequisitesText: '',
          exclusionsText: '',
        };
        const { description, prerequisitesText, corequisitesText, exclusionsText } = parsedCmCourseInfo;

        // all course codes array
        allCourseCodes.push({
          courseCode: code + sectionCode,
          name,
        });

        // create a new course
        const course = new Course();
        course.setId(code + sectionCode + sessions[0]);
        course.setCourseCode(code + sectionCode);
        course.setName(name);
        course.setDescription(description);
        course.setDivision(`University of Toronto ${campus}`);
        course.setDepartment(departmentCode);
        course.setPrerequisites(prerequisitesText);
        course.setCorequisites(corequisitesText);
        course.setExclusions(exclusionsText);
        course.setLevel(parseInt(code[3]));
        course.setCampus(campus);
        course.setTerm(parseTerm(sectionCode));
        course.setBreath('');
        course.setDistribution('');

        // adding all meeting sections
        sections.forEach(
          ({
            teachMethod,
            sectionNumber,
            instructors,
            maxEnrolment,
            currentEnrolment,
            deliveryModes,
            meetingTimes,
            openLimitInd,
          }) => {
            // skip if no meeting times
            if (meetingTimes.length === 0) {
              return;
            }

            const meetingSection = new MeetingSection();
            meetingSection.setSectionCode(teachMethod[0] + sectionNumber);
            meetingSection.setInstructors(instructors);
            meetingSection.setSize(maxEnrolment);
            meetingSection.setEnrolment(currentEnrolment);
            meetingSection.setMethod(deliveryModes[0].mode);
            meetingSection.setOpenLimitInd(openLimitInd);

            // if there are multiple meeting times for a Y course, take the first on
            let parsedMeetingTimes = meetingTimes;
            if (sectionCode === 'Y') {
              parsedMeetingTimes = [parsedMeetingTimes[0]];
            }

            parsedMeetingTimes.forEach(
              ({
                start: { millisofday: startTimeMillisecond, day },
                end: { millisofday: endTimeMillisecond },
                building: { buildingCode, buildingRoomNumber },
              }) => {
                const time = new Time();
                const startTime = startTimeMillisecond / 1000;
                const endTime = endTimeMillisecond / 1000;
                const duration = endTime - startTime;

                time.setDay(parseDay(day));
                time.setStart(startTime);
                time.setEnd(endTime);
                time.setDuration(duration);
                time.setLocation(`${buildingCode} ${buildingRoomNumber}`);

                if(time.day !== 'SATURDAY' && time.day !== 'SUNDAY') {
                  meetingSection.addTime(time);
                }
              },
            );

            course.addMeetingSection(meetingSection);
          },
        );

        if (course.meeting_sections.length === 0) {
          console.log(`${course.id} has no meeting sections`);
          return;
        }

        course.save();
      },
    );

    fs.writeFile(`output/allCourseCodes.json`, JSON.stringify(allCourseCodes), (err) => {
      if (err) {
        console.log(err);
      }
    });

    spinner.stop();
  } catch (error) {
    spinner.stop();
    console.error(error);
  }
})();
