import axios from 'axios';

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
  pageSize: 10,
  direction: 'asc',
};

(async () => {
  const result = await axios.post(url, body);
  console.log(result.data);
})();
