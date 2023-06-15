export default class MeetingSection {
  constructor() {
    this.sectionCode = '';
    this.instructors = [];
    this.times = [];
    this.size = 0;
    this.enrolment = 0;
    this.method = '';
    this.openLimitInd = 'N';
  }

  setSectionCode(sectionCode) {
    this.sectionCode = sectionCode;
  }

  setInstructors(instructor) {
    this.instructors = instructor;
  }

  addInstructor(instructor) {
    this.instructors.push(instructor);
  }

  setTimes(times) {
    this.times = times;
  }

  addTime(time) {
    this.times.push(time);
  }

  setSize(size) {
    this.size = size;
  }

  setEnrolment(enrolment) {
    this.enrolment = enrolment;
  }

  setMethod(method) {
    this.method = method;
  }

  setOpenLimitInd(openLimitInd) {
    this.openLimitInd = openLimitInd;
  }
}
