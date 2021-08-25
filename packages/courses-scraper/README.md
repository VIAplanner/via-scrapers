# UofT Course Scraper

## Overview
This package contains the scraper for obtaining UofT courses (all 3 campuses). The scraped courses will be stored as js files, please visit our [Documentation Website](https://uoftcoursetools.tech/course-api/#_1-course) to see the schema of the data.  

## Note
The python scrapers are not longer maintained. Please use the node versions
## Usage Example
### 1. Install the necessary packages
Command: `npm install`

### 2. Create a file called `.env` and follow the template given in `.env.template`

### 3. Run setup.bash
Command: `sh setup.bash`
### 4. Scrape all the course codes
Command: `npm run scrape:code` \
Explanation: This will produce a file called `allCourseCodes.json` which contains, like you guessed, all the course codes. This command is essentially a preprocessor for our scraper, making the scraping progress accurate and much faster.

### 5. Scrape some courses
Command: `npm run scrape` (there are more options in package.json)\
Explanation: All the scraped courses will be in `output/courses`


## API Component Breakdown
- [scraper.js](./api/node/tri-campus/scraper.js):
  - Retrieves course data from [Course Finder](http://coursefinder.utoronto.ca/course-search/search) using Puppeteer. 
  - Different courses are placed in a queue, then parsed later by multiple workers (multi-threading). 
- [uploader.py](./api/uploader.py)
  - Uploads the json files stored in **output** onto MongoDB.
  - Can be used to upload to other server by changing the server address on line 9.
  - Progress is displayed in the terminal.
  - Note: there's no instructions for this step purposefully


