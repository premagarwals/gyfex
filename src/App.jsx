import { React, useState, useEffect } from 'react'
import SubjectCard from './comps/SubjectCard';

const App = () => {

  //These all be be set by fetchData function, which will run at start
  const [rollNo, setRollNo] = useState("please login to erp");
  const [name, setName] = useState("User");
  const [sem, setSem] = useState(0);
  const [dept, setDept] = useState("");

  //You go to ERP/Academics/Students/Your_Academic_Information
  //and you will see your Roll No. and Name there...
  //This function extracts your roll and name from there
  //Though, name isn't necessary, but Roll No. is
  //Why Roll No. is necessary? To know Dept, fetch core courses, current year of study 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://erp.iitkgp.ac.in/Acad/yourAcademicInfo_UGPG.jsp");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const table = doc.querySelector("#searchResultTable");

        if (table) {
          const rows = table.querySelectorAll("tr");
          if (rows.length > 3) {
            const cells = rows[3].querySelectorAll("td");
            if (cells.length >= 2) {
              const rollNoElement = cells[0].textContent.trim();
              const nameElement = cells[1].textContent.trim();
              if (rollNoElement && nameElement) {
                setRollNo(rollNoElement);
                setName(nameElement);
              }

              //Now calculate upcoming semester and and current year of study
              if (rollNoElement) {
                const admissionYear = parseInt("20" + rollNoElement.substring(0, 2)); // "21" becomes "2021"
                const admissionDate = new Date(admissionYear, 4); // Assuming semester starts in May (Month 4, 0-based)

                const now = new Date();
                const diffInMonths =
                  (now.getFullYear() - admissionDate.getFullYear()) * 12 +
                  now.getMonth() -
                  admissionDate.getMonth();

                const semester = Math.floor(diffInMonths / 6) + 1;
                setSem(semester);
                setDept(rollNoElement.substring(2, 4));
              }
            } else {
              console.error("Not enough cells in the target row.");
            }
          } else {
            console.error("Target row does not exist.");
          }
        } else {
          console.error("Table not found.");
        }
      } catch (error) {
        console.error("Error fetching or parsing data:", error);
      }
    };

    fetchData();
  }, []);



  //This will be be updated by fetchCoreCourses function, which will run if value of sem is changed
  const [coreCourses, setCoreCourses] = useState([]);

  //You go to ERP/Academics/Students/Your_Academic_Information/Performance_New
  //and you will see multiple semester there...
  //If you open any sem, you will see all the courses in that sem
  //This function extracts all the subject codes from there (for any particular semester)
  useEffect(() => {
    const fetchCoreCourses = async () => {
      try {
        const response = await fetch(`https://erp.iitkgp.ac.in/Academic/student_performance_details_ug.htm?semno=${sem}&rollno=${rollNo}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // currently don't need anything to provide here
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const subjectNumbers = data.map(course => course.subno).filter(subno => subno);
        setCoreCourses(subjectNumbers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchCoreCourses();
  }, [sem]);



  //This will be be updated by fetchAndPopulateSlots function, which will run if value of coreCourses is changed
  const [slots, setSlots] = useState([]);
  //This is mapping of lab slots clashing with normal slots
  const overlaps = {
    "J": ["H3", "U3", "U4"],
    "K": ["D2", "D3", "D4", "A3"],
    "L": ["U3", "U4", "H2", "H3"],
    "M": ["C4", "E3", "E4", "G3"],
    "N": ["I2", "V2", "V3", "V4"],
    "O": ["E2", "E3", "E4", "F2", "F3", "F4"],
    "P": ["V3", "V4", "I2"],
    "Q": ["C3", "C4", "B3", "D3", "D4"],
    "R": ["F3", "F4", "G3", "E3", "E4"],
    "X": ["X4"]
  }

  //You go to ERP/Academics/Time_Table/Subject_List_with_time_table_slots
  //and you will see course code to slots mapping...
  //This function uses that data to find the slots of core courses and labs
  //This function also adds the slots clashing with labs using "overlaps"
  useEffect(() => {
    const fetchAndPopulateSlots = async () => {
      try {
        const uniquePrefixes = [...new Set(coreCourses.map(code => code.slice(0, 2)))];
        const allSlots = [];

        for (const dept of uniquePrefixes) {
          const response = await fetch(`https://erp.iitkgp.ac.in/Acad/timetable_track.jsp?action=second&dept=${dept}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ /* Currently nothing to add here */ }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/html');

          // Parsing the table to get slot data
          const tableRows = Array.from(doc.querySelectorAll('#disptab tr')).slice(2);
          const newSlots = [];

          tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
              const subjectNo = cells[0]?.textContent.trim();
              const slotString = cells[5]?.textContent.trim();

              if (coreCourses.includes(subjectNo)) {
                const slotsArray = slotString.split(',');
                newSlots.push(...slotsArray);
              }
            }
          });

          allSlots.push(...newSlots);
        }
        let optimalSlots = new Set();
        allSlots.forEach(slot => {
          if (slot.length > 2) {
            optimalSlots.add(slot.substring(0, 2));
          }
          else {
            optimalSlots.add(slot);
          }
          if (overlaps[slot]) {
            overlaps[slot].forEach(relative => optimalSlots.add(relative));
          }
        });
        setSlots(Array.from(optimalSlots));

      } catch (error) {
        console.error("Error fetching or processing data:", error);
      }
    };

    fetchAndPopulateSlots();
  }, [coreCourses]);



  //This will be be set by fetchBreadth function, which will run at start
  const [breadths, setBreadths] = useState([]);

  //You go to ERP/Academics/Subjects/Breadth_list_for_current_semester
  //and you will see multiple breadth there...
  //This function extracts all subjects from there
  //////     IMPORTANT NOTE: This fetching should be updated. Subjects should be fetched from registarion portal's options    /////
  useEffect(() => {
    async function fetchBreadth() {

      //This part determmines the upcoming semester and session
      //Why are we doing this? See the bottom 'fetch', whose body param requires session and semester
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const session = currentMonth >= 4 ?
        `${currentYear}-${currentYear + 1}` :
        `${currentYear - 1}-${currentYear}`;

      const semester = (currentMonth >= 4 && currentMonth <= 10) ?
        'AUTUMN' :
        'SPRING';

      //This part is actual fetching
      try {
        const response = await fetch('https://erp.iitkgp.ac.in/Acad/central_breadth_tt.jsp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            session: session,
            semester: semester,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const htmlText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const table = doc.getElementById('display_tab');
        const rows = table.querySelectorAll('tr');
        const subjects = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td');

          if (cells.length < 9) continue;

          const subjectNo = cells[0].textContent.trim();
          const subjectName = cells[1].textContent.trim();
          const ltP = cells[2].textContent.trim();
          const preReq1 = cells[3].textContent.trim();
          const preReq2 = cells[4].textContent.trim();
          const preReq3 = cells[5].textContent.trim();
          const offeredBy = cells[6].textContent.trim();
          const slot = cells[7].textContent.trim().slice(1, -1);
          const room = cells[8].textContent.trim();

          const subject = {
            id: subjectNo,
            name: subjectName,
            ltP: ltP,
            preRequisites: {
              preReq1: preReq1,
              preReq2: preReq2,
              preReq3: preReq3,
            },
            offeredBy: offeredBy,
            slot: slot,
            room: room,
          };

          subjects.push(subject);
        }

        setBreadths(subjects);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
        return [];
      }
    }

    fetchBreadth();
  }, []);



  // THIS IS OUR ONE AND ONLY...FILTRATION PROCESSSSSSSSSS
  //This runs each time slots change or breadths change
  useEffect(() => {
    setBreadths(prevSubjects =>
      prevSubjects.filter(subject => {
        const subjectSlots = subject.slot.split(",");
        return !subjectSlots.some(slot => slots.includes(slot));
      })
    );
  }, [slots, breadths]);



  return (
    <div className="bg-green-100 h-full w-screen relative overflow-x-hidden">

      {/* Header Section */}
      <div className="bg-slate-600 fixed z-20 h-16 w-full m-0 p-4 flex flex-col items-center justify-center text-green-200">
        <p className='text-lg font-bold '>GYFEx</p>
        <p className='text-xs tracing-wide'>Inspired by <a className='font-semibold' href="https://github.com/metakgp/gyfe" target='_blanck'> GYFE </a> • Made with ❤️</p>
      </div>

      {/* Below Header Section */}
      <div className="bg-slate-500 fixed top-16 z-20 h-8 w-full m-0 p-4 flex flex-col items-center justify-center text-green-200">
        <p className='text-xs '>Signed in as: {name} ({rollNo}); <span className='font-semibold'>Semester:</span> {sem}; <span className='font-semibold'>Dept:</span> {dept};</p>
      </div>


      {/* User data section */}
      <div className="p-6 w-full pt-24 pr-10">

        {/* Show subject codes of all core courses */}
        <p className='text-slate-600 text-sm mt-3 font-semibold text-center'>Removed subjects clashing with followings:</p>
        <ul className='bg-green-200 flex flex-wrap gap-0 items-center m-2 justify-center'>
          {coreCourses.map((subno, index) => (
            <li className='m-2 p-2 text-xs bg-gradient-to-br from-green-400 to-green-300 rounded px-4 text-green-600 border-green-400 border-b-2 border-r-2 shadow-xl hover:rotate-2 hover:scale-105 transition-all cursor-pointer' key={index}>{subno}</li>
          ))}
        </ul>

        {/* Show clashable slots */}
        <p className='text-slate-600 text-sm mt-3 font-semibold text-center'>Potentially Clashable Slots:</p>
        <p className='text-green-400 text-xs font-semibold text-center tracking-tight'>(As per ERP)</p>
        <ul className='bg-green-200 flex flex-wrap gap-1 items-center m-2 justify-center p-4'>
          {slots.map((slot, index) => (
            <li className='bg-gradient-to-r from-red-500 to-red-400 px-2 text-xs rounded text-white shadow-md hover:-translate-y-1 transition-all cursor-pointer' key={index}>{slot}</li>
          ))}
        </ul>

        {/* Disclaimer and total subject count */}
        <p className='text-green-400 text-xs font-thin text-center tracking-tight'>Disclaimer: The data displayed is presented as per the records in the ERP system.</p>
        <h2 className='text-center text-green-500 font-semibold tracking-wide'>You have minimum {breadths.length} options!!!</h2>

        {/* Show all the breadth subjects */}
        {breadths.map((subject) => (
          <SubjectCard
            key={subject.id}
            code={subject.id}
            name={subject.name}
            llt={subject.ltP}
            branch={subject.offeredBy}
            slot={subject.slot}
            room={subject.room}
            pre1={subject.preRequisites.preReq1}
            pre2={subject.preRequisites.preReq2}
            pre3={subject.preRequisites.preReq3}
          />
        ))}

      </div>

      {/* A tiny disclaimer footer */}
      <div className='w-full h-auto bg-slate-600 m-0 p-4 text-green-200 text-center text-sm'>
        <p className='font-bold mb-2'>Important Note:</p> The data shown here is simplified to avoid inconveniences. Other subjects may <strong>not</strong> clash but are excluded due to ERP limitations. Users should not fully rely on this tool and are advised to manually verify the schedule to avoid missing any opportunities. We aren’t responsible for any issues.
      </div>

    </div>
  )
}

export default App
