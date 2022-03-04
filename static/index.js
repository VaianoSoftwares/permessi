const months = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
];

const maxPermessi = 3;

const loginWrapper = document.querySelector("#login-wrapper");
const homeWrapper = document.querySelector("#home-wrapper");

let currDate = new Date();

const getTxt = async (url = "") => {
    try {
        const response = await fetch(url);
        console.log(response);
        const txtResp = await response.text();
        return txtResp;
    } catch(err) {
        console.log("getTxt | ", err);
    }
};

const getHTMLDoc = async (filename = "") => {
    try {
        const txtResp = await getTxt(`/api/v1/static/${filename}.html`);
        const parser = new DOMParser();
        const homeDoc = parser.parseFromString(txtResp, "text/html");
        const htmlStr = homeDoc.body.innerHTML;
        console.log(htmlStr);
        return htmlStr;
    } catch(err) {
        console.log("getHTMLDoc | ", err);
    }
};

const postData = async (url = "", data = {}) => {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => {
      console.log(response);
      return response.json();
    });
};

const addMonthsToDate = (date, months) => new Date(date.setMonth(date.getMonth() + months));
const getFirstDayMonth = (month, year) => new Date(year, month, 1).getDay();

const prevMonthBtnEvent = () => {
    currDate = addMonthsToDate(currDate, -1);
    setCurrMonthCalendar(currDate);
};
const nextMonthBtnEvent = () => {
    currDate = addMonthsToDate(currDate, 1);
    setCurrMonthCalendar(currDate);
};

const checkBoxesEvent = (input) => {
    const { value, checked } = input;
    console.log(value, checked);
};

const setCurrMonthCalendar = (date = new Date(), currMonthH1, daysList) => {
    const currYear = date.getFullYear();
    const currMonth = date.getMonth();
    currMonthH1.innerText = `${months[currMonth]} ${currYear}`; 

    const firstDay = getFirstDayMonth(currMonth, currYear);
    const currTime = new Date();
    let dateCopy = new Date(date.getFullYear(), date.getMonth(), 1);
    dateCopy = new Date(dateCopy.setDate(dateCopy.getDate() + 1 - firstDay));
    daysList.forEach((day) => {
        if(dateCopy < currTime || dateCopy.getMonth() !== currMonth) {
            day.innerHTML = dateCopy.getDate().toString();
            day.classList.add("not-available");
        }
        else {
            const disponibilita = `Disponibilita\': ${maxPermessi}`;
            const checkbox = `<input type="checkbox" value="${dateCopy}" onchange=\"checkBoxesEvent(this)\"></input>`;
            day.innerHTML = `${dateCopy.getDate()}<br>${disponibilita}<br>${checkbox}`;
            day.classList.remove("not-available");
        }
        dateCopy = new Date(dateCopy.setDate(dateCopy.getDate() + 1));
    });
};

const reqLogin = async (usernameInput, passwordInput, errMsgP) => {
  try {
    const result = await postData("api/v1/auth/login", {
      username: usernameInput.value,
      password: passwordInput.value,
    });

    console.log("submitBtnEvent | result: ", result);

    if (result.success === true) {
      sessionStorage.setItem("username", result.data.username);
      sessionStorage.setItem("admin", result.data.admin);
    } else {
      errMsgP.innerText = result.msg;
    }

    return result.success;
  } catch(err) {
    console.log("submitBtnEvent | ", err);
  }
};

const __login = (htmlStr) => {
  loginWrapper.innerHTML = htmlStr;
  homeWrapper.innerHTML = "";

  const usernameInput = loginWrapper.querySelector("#username");
  const passwordInput = loginWrapper.querySelector("#password");
  const submitBtn = loginWrapper.querySelector("button");
  const errMsgP = loginWrapper.querySelector("#err-msg");

  submitBtn.addEventListener("click", async () => {
    const loggedIn = await reqLogin(usernameInput, passwordInput, errMsgP);
    if(loggedIn === true) main();
  });
};
const __home = (htmlStr) => {
  homeWrapper.innerHTML = htmlStr;
  loginWrapper.innerHTML = "";

  const currMonthH1 = homeWrapper.querySelector(
    "#months tbody tr #current-month-td #current-month"
  );
  const prevMonthBtn = homeWrapper.querySelector(
    "#months tbody tr #prev-month-td #prev-month-btn"
  );
  const nextMonthBtn = homeWrapper.querySelector(
    "#months tbody tr #next-month-td #next-month-btn"
  );
  const daysList = homeWrapper.querySelectorAll("#calendar tbody tr td");

  prevMonthBtn.onclick = prevMonthBtnEvent;
  nextMonthBtn.onclick = nextMonthBtnEvent;

  setCurrMonthCalendar(currDate, currMonthH1, daysList);
};

const main = () => {
  console.log("main | Session storage: ", sessionStorage);
  if (sessionStorage.getItem("username") && sessionStorage.getItem("admin")) {
    console.log("HOME");
    getHTMLDoc("home")
      .then(__home)
      .catch((err) => console.log(err));
  } else {
    console.log("LOGIN");
    getHTMLDoc("login")
      .then(__login)
      .catch((err) => console.log(err));
  }
};
main();
