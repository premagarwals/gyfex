import { React, useState, useEffect } from 'react'
import SubjectCard from './comps/SubjectCard';

const App = () => {

  //These all be be set by fetchData function, which will run at start
  const [rollNo, setRollNo] = useState("please login to erp");
  const [name, setName] = useState("User");
  const [sem, setSem] = useState(0);
  const [dept, setDept] = useState("");

  // Department selection for fetching subjects
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const departments = [
    "AE", "AF", "AG", "AI", "AP", "AR", "AT", "BE", "BM", "BS", "BT", "CD", "CE", "CH", "CL", "CP",
    "CR", "CS", "CY", "DE", "DH", "DS", "EA", "EC", "EE", "EF", "EG", "ES", "ET", "EX", "FA", "FH",
    "FN", "GG", "GS", "HS", "ID", "IE", "IM", "IP", "IS", "IT", "KS", "MA", "MC", "ME", "MF", "MI",
    "MM", "MS", "MT", "NA", "NT", "PH", "PP", "QD", "QE", "QM", "RD", "RE", "RJ", "RT", "RW", "RX",
    "SD", "SE", "SH", "SI", "SL", "TE", "TL", "TS", "TV", "UP", "WM"
  ];

  // Subject type selection (Depth, Breadth, Additional)
  const [subjectType, setSubjectType] = useState("Breadth");
  const subjectTypes = ["Depth", "Breadth", "Additional"];

  const [isLoading, setIsLoading] = useState(false);

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
      console.log('==================== SLOT FETCHING DEBUG ====================');
      console.log('Core Courses:', coreCourses);

      if (coreCourses.length === 0) {
        console.log('No core courses found, skipping slot fetch');
        console.log('=============================================================');
        return;
      }

      try {
        const uniquePrefixes = [...new Set(coreCourses.map(code => code.slice(0, 2)))];
        console.log('Unique department prefixes:', uniquePrefixes);

        // Determine session and semester
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const session = currentMonth >= 4 ?
          `${currentYear}-${currentYear + 1}` :
          `${currentYear - 1}-${currentYear}`;

        const semester = (currentMonth >= 4 && currentMonth <= 10) ?
          'AUTUMN' :
          'SPRING';

        console.log(`Session: ${session}, Semester: ${semester}`);

        const allSlots = [];

        for (const dept of uniquePrefixes) {
          console.log(`Fetching slots for department: ${dept}`);
          const response = await fetch(`https://erp.iitkgp.ac.in/Acad/timetable_track.jsp?action=second&dept=${dept}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              for_session: session,
              for_semester: semester,
              dept: dept
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.text();

          // Parse the malformed HTML using regex to handle missing </tr> tags
          // Pattern matches: <tr><td>SUBNO</td><td>NAME</td><td>FACULTY</td><td>LTP</td><td>CREDITS</td><td>SLOT</td>
          const rowMatches = data.matchAll(/<tr><td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>/g);

          const newSlots = [];
          let rowCount = 0;
          const allSubjects = [];

          for (const match of rowMatches) {
            rowCount++;
            const subjectNo = match[1].trim();
            const slotString = match[6].trim();

            allSubjects.push(subjectNo);

            if (rowCount <= 15) {
              console.log(`Row ${rowCount}: ${subjectNo} - Slot: ${slotString}`);
            }

            if (coreCourses.includes(subjectNo)) {
              console.log(`✓ MATCH! Found core course ${subjectNo} with slots: ${slotString}`);
              const slotsArray = slotString.split(',').map(s => s.trim());
              newSlots.push(...slotsArray);
            }
          }

          console.log(`Total rows parsed for ${dept}: ${rowCount}`);
          console.log(`All subjects found:`, allSubjects);
          console.log(`Looking for core courses:`, coreCourses.filter(c => c.startsWith(dept)));
          console.log(`Slots found for ${dept}:`, newSlots);
          allSlots.push(...newSlots);
        }

        console.log('All slots before processing:', allSlots);

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

        const finalSlots = Array.from(optimalSlots);
        console.log('Final clashable slots:', finalSlots);
        console.log('=============================================================');
        setSlots(finalSlots);

      } catch (error) {
        console.error("Error fetching or processing data:", error);
        console.log('=============================================================');
      }
    };

    fetchAndPopulateSlots();
  }, [coreCourses]);



  //This will be be set by fetchBreadth function, which will run when department is selected
  const [breadths, setBreadths] = useState([]);

  //Fetch subjects from the new department-wise API
  //This function extracts all subjects from the registration portal
  useEffect(() => {
    // Only fetch if a department is selected
    if (!selectedDepartment) {
      setBreadths([]);
      setIsLoading(false);
      return;
    }

    async function fetchBreadth() {
      setIsLoading(true);
      try {
        // Fetch all subjects with pagination
        let allSubjects = [];
        let offset = 0;
        const limit = 300; // Fetch 300 at a time
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(
            `https://erp.iitkgp.ac.in/Academic/getOtherDeptSubjectList.htm?department=${selectedDepartment}&sub_type_code=${subjectType}&semno=${sem}&subject_status=Normal`,
            {
              credentials: "include",
              headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Priority": "u=0"
              },
              referrer: "https://erp.iitkgp.ac.in/Academic/subjectRegistrationUGPG.htm",
              body: JSON.stringify({ order: "asc", limit: limit, offset: offset }),
              method: "POST",
              mode: "cors"
            }
          );

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();

          if (data.length === 0) {
            hasMore = false;
          } else {
            allSubjects = [...allSubjects, ...data];
            offset += limit;

            // If we got less than limit, we've reached the end
            if (data.length < limit) {
              hasMore = false;
            }
          }
        }

        // Transform the data to match our structure
        const subjects = allSubjects.map(item => ({
          id: item.subno,
          name: item.subname,
          ltP: item.ltp,
          credits: item.crd,
          preRequisites: {
            preReq1: item.prereq && item.prereq !== "--------" ? item.prereq.split(',')[0]?.trim() || "None" : "None",
            preReq2: item.prereq && item.prereq !== "--------" ? item.prereq.split(',')[1]?.trim() || "None" : "None",
            preReq3: item.prereq && item.prereq !== "--------" ? item.prereq.split(',')[2]?.trim() || "None" : "None",
          },
          teacher: item.teacher || "TBA",
          slot: item.slot,
          period: item.period || [],
        }));

        setBreadths(subjects);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
        setBreadths([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBreadth();
  }, [selectedDepartment, sem, subjectType]);

  // Filtered breadths based on slot clashes
  // This filters out subjects that clash with core course slots
  const [filteredBreadths, setFilteredBreadths] = useState([]);

  useEffect(() => {
    console.log('==================== FILTERING DEBUG ====================');
    console.log('Core Course Slots (clashable):', slots);
    console.log('Total breadth subjects fetched:', breadths.length);

    if (breadths.length > 0) {
      console.log('Sample subject slots:', breadths.slice(0, 5).map(s => ({ name: s.name, slot: s.slot })));
    }

    const filtered = breadths.filter(subject => {
      if (!subject.slot) {
        console.log('Subject has no slot, keeping it:', subject.name);
        return true;
      }

      const subjectSlots = subject.slot.split(",").map(s => s.trim());

      // Check if any subject slot clashes with core course slots
      // Compare first 2 characters of each slot
      const hasClash = subjectSlots.some(subSlot => {
        // Normalize both to first 2 characters for comparison
        const normalizedSubSlot = subSlot.substring(0, 2);

        // Check if any core slot matches (comparing first 2 chars)
        const clashFound = slots.some(coreSlot => {
          const normalizedCoreSlot = coreSlot.substring(0, 2);
          return normalizedSubSlot === normalizedCoreSlot;
        });

        return clashFound;
      });

      if (hasClash) {
        console.log(`CLASH FOUND: "${subject.name}" (${subject.id}) - Slots: ${subject.slot}`);
      }

      return !hasClash;
    });

    console.log('Filtered breadths (non-clashing):', filtered.length);
    console.log('Clashing subjects removed:', breadths.length - filtered.length);
    console.log('=========================================================');

    setFilteredBreadths(filtered);
  }, [slots, breadths]);

  // Function to download filtered subjects as CSV
  const downloadCSV = () => {
    if (filteredBreadths.length === 0) {
      alert('No subjects to download. Please select a department first.');
      return;
    }

    // CSV headers
    const headers = ['Subject Code', 'Subject Name', 'L-T-P', 'Credits', 'Teacher', 'Slot', 'Prerequisite'];

    // CSV rows
    const rows = filteredBreadths.map(subject => [
      subject.id,
      subject.name,
      subject.ltP,
      subject.credits,
      subject.teacher,
      subject.slot,
      subject.preRequisites.preReq1
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Determine session and semester for filename
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const session = currentMonth >= 4 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
    const semester = (currentMonth >= 4 && currentMonth <= 10) ? 'AUTUMN' : 'SPRING';

    // Format: SubjectType_SEMESTER_SESSION_DEPT_ROLLNO_gyfex.csv
    const filename = `${subjectType}_${semester}_${session}_${selectedDepartment}_${rollNo}_gyfex.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



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

        {/* Department Selection Dropdown */}
        <div className="mb-6 mt-8 flex flex-col items-center">
          <label htmlFor="dept-select" className="text-slate-600 text-sm font-semibold mb-2">
            Select Department to Fetch Subjects:
          </label>
          <select
            id="dept-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-green-200 text-slate-700 font-semibold px-4 py-2 rounded border-2 border-green-400 hover:bg-green-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Choose a Department --</option>
            {departments.map((deptCode) => (
              <option key={deptCode} value={deptCode}>
                {deptCode}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Type Selection (Depth/Breadth/Additional) */}
        <div className="mb-6 flex flex-col items-center">
          <label className="text-slate-600 text-sm font-semibold mb-3">
            Select Subject Type:
          </label>
          <div className="flex gap-4">
            {subjectTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSubjectType(type)}
                className={`px-6 py-2 rounded font-semibold transition-all ${subjectType === type
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-green-200 text-slate-700 hover:bg-green-300'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

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

        {isLoading ? (
          <div className='text-center py-8'>
            <div className='inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-green-600 mb-4'></div>
            <p className='text-green-600 font-semibold'>Fetching subjects from {selectedDepartment} department...</p>
          </div>
        ) : selectedDepartment ? (
          <div className='text-center'>
            <h2 className='text-green-500 font-semibold tracking-wide'>
              You can take {filteredBreadths.length} out of {breadths.length} {selectedDepartment} courses
            </h2>
            {filteredBreadths.length > 0 && (
              <button
                onClick={downloadCSV}
                className='mt-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded shadow-lg transition-all hover:scale-105 active:scale-95'
              >
                ↓ Download as CSV
              </button>
            )}
          </div>
        ) : (
          <h2 className='text-center text-green-500 font-semibold tracking-wide'>
            Please select a department to view available courses
          </h2>
        )}

        {/* Show all the breadth subjects */}
        {!isLoading && filteredBreadths.map((subject) => (
          <SubjectCard
            key={subject.id}
            code={subject.id}
            name={subject.name}
            llt={subject.ltP}
            credits={subject.credits}
            teacher={subject.teacher}
            slot={subject.slot}
            pre1={subject.preRequisites.preReq1}
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
