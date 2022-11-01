import dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';
import cliProgress from 'cli-progress';
import ora from 'ora';
import fs from 'fs';
import axios from 'axios';

(async () => {
  const spinner = ora({
    text: 'Calculating total time',
    spinner: {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    },
  }).start();

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
  });
  const page = await browser.newPage();
  await page.goto(
    'https://coursefinder.utoronto.ca/course-search/search/courseSearch?viewId=CourseSearch-FormView&methodToCall=start#search',
    { waitUntil: 'networkidle0' },
  );
  await page.select("select[name='courseSearchResults_length']", '100');

  const totalUTMCourses = await page.evaluate(() => {
    return parseInt(
      document.querySelector('div.dataTables_info').innerText.split(' ')[3].replace(',', ''),
    );
  });

  let totalUTSGCourses = 0;

  const utsgRawData = await Promise.all([
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=F'),
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=S'),
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=Y'),
  ]);

  utsgRawData.forEach((rawData) => {
    const allSessionCourses = rawData.data;
    totalUTSGCourses += Object.keys(allSessionCourses).length;
  });

  const totalNumCourses = totalUTMCourses + totalUTSGCourses;

  spinner.stop();

  // create a new progress bar instance and use shades_classic theme
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let allCourseCodes = [];

  progressBar.start(totalNumCourses, 0);

  // UTM and UTSC Courses
  while (true) {
    let currCourseCodes = await page.evaluate(() => {
      let currCourseCodes = [];
      let rawOdd = document.querySelectorAll('tr.odd');
      let rawEven = document.querySelectorAll('tr.even');

      rawOdd.forEach((element) => {
        let courseCode = element.querySelectorAll('td')[1].innerText;
        let url = element.querySelectorAll('td')[1].querySelector('a').href;
        let term = element.querySelectorAll('td')[6].innerText;
        currCourseCodes.push({ courseCode, term, url });
      });
      rawEven.forEach((element) => {
        let courseCode = element.querySelectorAll('td')[1].innerText;
        let url = element.querySelectorAll('td')[1].querySelector('a').href;
        let term = element.querySelectorAll('td')[6].innerText;
        currCourseCodes.push({ courseCode, term, url });
      });

      return currCourseCodes;
    });

    progressBar.increment(currCourseCodes.length);
    allCourseCodes = allCourseCodes.concat(
      // remove utsg courses
      currCourseCodes.filter(({ courseCode }) => courseCode[7] !== '1' && courseCode[7] !== '0'),
    );

    let endResultNum = await page.evaluate(() => {
      return parseInt(
        document
          .querySelector('div.dataTables_info')
          .innerText.split(' ')[1]
          .split('-')[1]
          .replace(',', ''),
      );
    });

    // if we have reached the final course, stop the loop
    if (endResultNum === totalUTMCourses) {
      break;
    } else {
      //click next
      await page.evaluate(() => {
        document.getElementById('courseSearchResults_next').click();
      });
    }
  }

  utsgRawData.forEach((rawData) => {
    const allSessionCourses = rawData.data;
    Object.keys(allSessionCourses).forEach((rawCourseCode) => {
      const rawTerm = rawCourseCode[9];
      let term;

      if (rawTerm === 'F') {
        term = '2021 Fall';
      } else if (rawTerm === 'S') {
        term = '2022 Winter';
      } else if (rawTerm === 'Y') {
        term = '2021 Fall +';
      }

      allCourseCodes.push({
        courseCode: rawCourseCode.slice(0, 8),
        term,
      });

      progressBar.increment();
    });
  });

  fs.writeFile(`output/allCourseCodes.json`, JSON.stringify(allCourseCodes), (err) => {
    if (err) {
      console.log(err);
    }
  });

  await browser.close();
  return progressBar.stop();
})();
