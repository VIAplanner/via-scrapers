import axios from 'axios';
import fs from 'fs';
import ora from 'ora';

const url = 'https://api.easi.utoronto.ca/ttb/getPageableCourses';
const body = {
  courseCodeAndTitleProps: {
    courseCode: '',
    courseTitle: '',
    courseSectionCode: '',
  },
  departmentProps: [],
  campuses: [],
  sessions: ['20229', '20231', '20229-20231'],
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
    console.log(courses);

    courses.forEach(({ code, sectionCode, name }) => {
      allCourseCodes.push({
        courseCode: code + sectionCode,
        name,
      });
    });

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
