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

let permessi = [];
let currDate = new Date();

const getTxt = async (url = "") => {
    try {
        const response = await fetch(url, { method: "GET" });
        console.log("getTxt | response: ", response);
        return await response.text();
    } catch(err) {
        console.log("getTxt | ", err);
    }
};

const getHTMLDoc = async (filename = "") => {
    try {
        const txtResp = await getTxt(`/api/v1/static/${filename}.html`);
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(txtResp, "text/html");
        const htmlStr = htmlDoc.body.innerHTML;
        // console.log("getHTMLDoc | htmlStr: ", htmlStr);
        return htmlStr;
    } catch(err) {
        console.log("getHTMLDoc | ", err);
    }
};

const getJSON = async (url = "") => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "auth-token": sessionStorage.getItem("token") },
    });
    console.log("getJSON | response: ", response);
    return response.json();
  } catch(err) {
    console.log("getJSON | ", err);
  }
};

const retrivePermessi = async () => {
  try {
    const result = await getJSON(
      `/api/v1/auth/permessi?month=${currDate.getMonth()}`
    );
    console.log("retrivePermessi | result: ", result);
    if (result.success === false) {
      throw new Error(result.msg);
    }
    permessi = result.data;
  } catch (err) {
    console.log("retrivePermessi | ", err);
  }
};

const postPermessi = async (url = "", data = {}) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": sessionStorage.getItem("token")
      },
      body: JSON.stringify(data),
    });

    console.log("postPermessi | response: ", response);

    return response.json();
  } catch (err) {
    console.log("postPermessi | ", err);
  }
}

const postLogin = async (url = "", data = {}) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("postLogin | response: ", response);

    const token = response.headers.get("auth-token");
    if (response.ok && token) {
      sessionStorage.setItem("token", token);
    }

    return response.json();
  } catch (err) {
    console.log("postLogin | ", err);
  }
};

const addMonthsToDate = (date, months) => new Date(date.setMonth(date.getMonth() + months));
const getFirstDayMonth = (month, year) => new Date(year, month, 1).getDay();

const changeMonthBtnEvent = (numOfMonths, currMonthH1, daysList) => {
    currDate = addMonthsToDate(currDate, numOfMonths);
    retrivePermessi().then(() =>
      setCurrMonthCalendar(currDate, currMonthH1, daysList)
    );
};

const checkBoxesEvent = (input = new Element()) => {
    const { value, checked } = input;
    console.log("checkBoxesEvent | ", value, " ", checked);

    const permesso = {
      username: sessionStorage.getItem("username"),
      date: value
    };

    postPermessi("/api/v1/auth/permessi/push", permesso)
      .then((result) => {
        console.log("checkBoxesEvent | result: ", result);

        if (!result.success) {
          throw new Error(result.msg);
        }

        permessi.push(permesso);

        const numPermessi = maxPermessi - permessiCounter(permesso.date);
        const dayTd = input.parentElement;
        dayTd.innerHTML = `${new Date(permesso.date).getDate()}<br>Disponibilita\': ${numPermessi}<br>Prenotato`;
        dayTd.classList.add("prenotato");
      })
      .catch((err) => console.log("checkBoxesEvent | ", err));
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
        const numPermessi = maxPermessi - permessiCounter(dateCopy);
        const prenotato = hasPermesso(dateCopy);
        if(dateCopy < currTime || dateCopy.getMonth() !== currMonth || (numPermessi < 1 && !prenotato)) {
            day.innerHTML = dateCopy.getDate().toString();
            day.classList.remove("prenotato");
            day.classList.add("not-available");
        }
        else {
            day.classList.remove("not-available");
            const partialHtml = `${dateCopy.getDate()}<br>Disponibilita\': ${numPermessi}<br>`;
            if(prenotato) {
              day.innerHTML = `${partialHtml}Prenotato`;
              day.classList.add("prenotato");
            }
            else {
              const checkbox = `<input type="checkbox" value="${dateCopy.toDateString()}" onchange=\"checkBoxesEvent(this)\"></input>`;
              day.innerHTML = `${partialHtml}${checkbox}`;
              day.classList.remove("prenotato");
            }
        }
        dateCopy = new Date(dateCopy.setDate(dateCopy.getDate() + 1));
    });
};

const permessiCounter = (date) => {
  const dateStr =
    date instanceof Date
      ? date.toDateString()
      : typeof date === "string"
      ? date
      : "";
  return permessi
    .map((permesso) => new Date(permesso.date).toDateString())
    .filter((permDate) => permDate === dateStr)
    .length;
};

const hasPermesso = (date) => {
  const dateStr =
    date instanceof Date
      ? date.toDateString()
      : typeof date === "string"
      ? date
      : "";
  const username = sessionStorage.getItem("username");
  return permessi
    .filter((permesso) => permesso.username === username)
    .map((permesso) => new Date(permesso.date).toDateString())
    .filter((permDate) => permDate === dateStr)
    .length > 0;
};

const reqLogin = async (usernameInput, passwordInput, errMsgP) => {
  try {
    const result = await postLogin("api/v1/auth/login", {
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

  prevMonthBtn.addEventListener("click", () =>
    changeMonthBtnEvent(-1, currMonthH1, daysList)
  );
  nextMonthBtn.addEventListener("click", () =>
    changeMonthBtnEvent(1, currMonthH1, daysList)
  );

  retrivePermessi().then(() =>
    setCurrMonthCalendar(currDate, currMonthH1, daysList)
  );
};

const main = () => {
  console.log("main | Session storage: ", sessionStorage);
  if (sessionStorage.getItem("username") && sessionStorage.getItem("admin")) {
    console.log("HOME");
    getHTMLDoc("home")
      .then(__home)
      .catch((err) => console.log("main | ", err));
  } else {
    console.log("LOGIN");
    getHTMLDoc("login")
      .then(__login)
      .catch((err) => console.log("main | ", err));
  }
};
main();