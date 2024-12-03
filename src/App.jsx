import { React, useState, useEffect } from 'react'

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

      </div>
    </div>
  )
}

export default App
