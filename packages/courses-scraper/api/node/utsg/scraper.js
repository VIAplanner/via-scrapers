import axios from 'axios';
import fs from 'fs';

const bla = async () => {
  const res = await axios(
    'https://timetable.iit.artsci.utoronto.ca/api/20219/courses?code=csc108',
  );
  console.log(JSON.stringify(res.data, undefined, 2));
};

const rawInfo = fs.readFileSync('output/allCourseCodes.json');

// bla();
console.log(JSON.parse(rawInfo));