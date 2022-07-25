import axios from 'axios';
import cliProgress from 'cli-progress';
import ora from 'ora';

import Course from '../structures/course';
import MeetingSection from '../structures/meetingSection';
import Time from '../structures/time';

// convert 24 hours to seconds
const timeToSeconds = (hour) => {
  let splitTimes = hour.split(':');
  let hourSeconds = parseInt(splitTimes[0]) * 3600;
  let minuteSeconds = parseInt(splitTimes[1]) * 60;
  return hourSeconds + minuteSeconds;
};

const formatTime = ({ meetingDay, meetingStartTime, meetingEndTime, assignedRoom1 }) => {
  if (meetingStartTime === null || meetingEndTime === null) return; // time is null

  const currTime = new Time();

  currTime.setStart(timeToSeconds(meetingStartTime));
  currTime.setEnd(timeToSeconds(meetingEndTime));
  currTime.setDuration(timeToSeconds(meetingEndTime) - timeToSeconds(meetingStartTime));
  currTime.setLocation(assignedRoom1 || "");

  switch (meetingDay) {
    case 'MO': {
      currTime.setDay('MONDAY');
      break;
    }
    case 'TU': {
      currTime.setDay('TUESDAY');
      break;
    }
    case 'WE': {
      currTime.setDay('WEDNESDAY');
      break;
    }
    case 'TH': {
      currTime.setDay('THURSDAY');
      break;
    }
    case 'FR': {
      currTime.setDay('FRIDAY');
      break;
    }
  }

  return currTime;
};

(async () => {
  const spinner = ora({
    text: 'Calculating total time ...',
    spinner: {
      interval: 40,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    },
  }).start();

  const allRawData = await Promise.all([
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=F'),
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=S'),
    axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?section=Y'),
  ]);

  // testing data
  // const allRawData = await Promise.all([
  //   axios('https://timetable.iit.artsci.utoronto.ca/api/20219/courses?code=csc108'),
  // ]);

  spinner.stop();

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(
    allRawData.reduce((previous, { data }) => previous + Object.keys(data).length, 0),
    0,
  );

  allRawData.forEach((rawData) => {
    const allSessionCourses = rawData.data;
    Object.values(allSessionCourses).forEach(
      ({
        code,
        section,
        session,
        courseTitle,
        courseDescription,
        org,
        prerequisite,
        corequisite,
        exclusion,
        breadthCategories,
        distributionCategories,
        meetings,
      }) => {
        const currCourse = new Course();
        let term;

        if (section === 'F') {
          term = '2021 Fall';
        } else if (section === 'S') {
          term = '2022 Winter';
        } else if (section === 'Y') {
          term = '2021 Fall +';
        }
        currCourse.setId(code + section + session);
        currCourse.setCourseCode(code + section);
        currCourse.setName(courseTitle);
        currCourse.setDescription(courseDescription.replace('<p>', '').replace('</p>', ''));
        currCourse.setDivision('University of Toronto St.George');
        currCourse.setDepartment(org);
        currCourse.setPrerequisites(prerequisite);
        currCourse.setCorequisites(corequisite);
        currCourse.setExclusions(exclusion);
        currCourse.setLevel(code[3]);
        currCourse.setCampus('St. George');
        currCourse.setTerm(term);
        currCourse.setBreath(breadthCategories);
        currCourse.setDistribution(distributionCategories);

        Object.values(meetings).forEach(
          ({
            instructors,
            teachingMethod,
            sectionNumber,
            enrollmentCapacity,
            actualEnrolment,
            deliveryMode,
            schedule,
          }) => {
            if (deliveryMode === 'ONLASYNC') return; // skip async sections

            const currMeetingSection = new MeetingSection();

            currMeetingSection.setSectionCode(teachingMethod[0] + sectionNumber);
            currMeetingSection.setSize(enrollmentCapacity);
            currMeetingSection.setEnrolment(actualEnrolment);
            currMeetingSection.setMethod(deliveryMode === 'CLASS' ? 'INPER' : 'SYNC');

            Object.values(schedule).forEach((rawTime) => {
              if (formatTime(rawTime)) currMeetingSection.addTime(formatTime(rawTime));
            });

            if (currMeetingSection.times.length === 0) return; // if the current section have no time

            Object.values(instructors).forEach(({ firstName, lastName }) => {
              currMeetingSection.addInstructor(`${firstName}, ${lastName}`);
            });

            currCourse.addMeetingSection(currMeetingSection);
          },
        );

        progressBar.increment();
        if (currCourse.meeting_sections.length === 0) return;

        currCourse.save();
      },
    );
  });

  return progressBar.stop();
})();
