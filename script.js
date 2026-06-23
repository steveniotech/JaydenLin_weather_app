let api = "https://api.open-meteo.com/v1/forecast";
let wcvs = document.getElementById("wgraph");
let metric = false;
function getapi(lat, long) {
  let addOn1 = `?latitude=${lat}&longitude=${long}`;
  let addOn2 =
    "&hourly=temperature_2m,rain&daily=temperature_2m_max,temperature_2m_min&timezone=GMT";
  return api + addOn1 + addOn2;
}
let api2 = "https://geocoding-api.open-meteo.com/v1/search";
function getapi2(cityname) {
  let addOn1 = "?name=" + cityname;
  let addOn2 = "&count=10&language=en&format=json";
  return api2 + addOn1 + addOn2;
}
let currentLL = [0, 0];
let updating = false;
let timeElement = document.getElementById("time");
let params = {
  latitude: 0,
  longitude: 0,
  hourly: [
    "temperature_2m",
    "dew_point_2m",
    "precipitation",
    "relative_humidity_2m",
  ],
  timezone: "America/New_York",
};
async function GetCities(cityName) {
  try {
    let f = await fetch(getapi2(cityName));
    let g = await f.json();

    if (!g.results || g.results.length == 0) {
      alert("No city found");
      return 404;
    }
    document.getElementById("citySelect").innerHTML = "";
    g.results.forEach((city) => {
      let container = document.createElement("div");
      container.className = "city";
      let cn = document.createElement("h3");
      let cc = document.createElement("p");
      let bt = document.createElement("button");
      bt.innerText = "Select";
      cn.innerText = city.admin1 + "\n" + city.country;
      cc.innerText = (city.admin2 || "") + "\n" + city.timezone;
      container.appendChild(cn);
      container.appendChild(cc);
      container.appendChild(bt);
      document.getElementById("citySelect").appendChild(container);
      bt.onclick = async () => {
        if (!updating) {
          updating = true;
          currentLL[0] = city.latitude;
          currentLL[1] = city.longitude;
          await refreshWeather(["ll", currentLL[0], currentLL[1]]);
          // document.getElementById("citySelect").innerHTML = ""
          updating = false;
        }
      };
    });
  } catch (err) {
    console.error(err);
  }
  return 404;
}

async function fetchWeather(inputLoc) {
  console.log(inputLoc);
  if (inputLoc[0] == "ll" && typeof inputLoc == "object") {
    currentLL[0] = inputLoc[1];
    currentLL[0] = inputLoc[2];
    let f = await fetch(getapi(inputLoc[1], inputLoc[2]));
    let g = await f.json();
    return g;
  }
  try {
    let f = await fetch(getapi(currentLL[0], currentLL[1]));
    let g = await f.json();
    return g;
  } catch (___) {
    console.log(___);
  }
  return 404;
}
async function refreshWeather(loc) {
  document.getElementById("wresults").innerHTML = "<h2>loading weather...</h2>";
  let weatherData = await fetchWeather(loc);
  if (weatherData == 404) {
    return 404;
  }
  let hourly = weatherData.hourly;
  let daily = weatherData.daily;
  let maxd = daily.temperature_2m_max;
  let mind = daily.temperature_2m_min;
  console.log(daily);
  document.getElementById("wresults").innerHTML = "";
  console.log(hourly);
  wcvs.width = wcvs.width;
  let wctx = wcvs.getContext("2d");
  wctx.beginPath();
  let timeNow = new Date().getTime();
  let nearestTime = 111111111111111111111111111111111111;
  let nearestTemp = 0;
  let moduloBy = 4;
  let maxs = [];
  let mins = [];
  hourly.temperature_2m.forEach((value, ind) => {
    if (ind % moduloBy == 0) {
      if (new Date(hourly.time[ind]).getTime() - timeNow < nearestTime) {
        nearestTime = new Date(hourly.time[ind]).getTime() - timeNow;
        nearestTemp = value;
      }
      wctx.strokeStyle = "rgb(0,0,0)";
      if (ind == 0) {
        wctx.moveTo(
          ind * (wcvs.width / hourly.temperature_2m.length),
          150 + value * -5
        );
      } else {
        wctx.lineTo(
          ind * (wcvs.width / hourly.temperature_2m.length),
          150 + value * -5
        );
      }
      wctx.lineWidth = 3;
      let weatherDiv = document.createElement("div");
      weatherDiv.className = "wresult";
      if (ind % 12 == 0) {
        weatherDiv.className = "wresult leadingwresult";
      }
      let weatherElement = document.createElement("h2");
      let CDM = Math.round(maxd[Math.floor(ind / 24)]);
      let nCDM = Math.round(maxd[(Math.floor(ind / 24) + 1) % maxd.length]);
      let CDMi = Math.round(mind[Math.floor(ind / 24)]);
      let nCDMi = Math.round(mind[(Math.floor(ind / 24) + 1) % mind.length]);
      let alpha = (ind % 24) / 24;
      let tCDM = Math.max(CDM * (1 - alpha) + nCDM * alpha, value);
      let tCDMi = Math.min(CDMi * (1 - alpha) + nCDMi * alpha, value);
      let tFDM = (tCDM * 9) / 5 + 32;
      let tFDMi = (tCDMi * 9) / 5 + 32;
      maxs.push(tCDM);
      mins.push(tCDMi);
      weatherElement.innerText =
        value.toFixed(1) +
        "C" +
        ` High: ${tCDM.toFixed(1)}C Low: ${tCDMi.toFixed(1)}C  `;
      if (!metric) {
        weatherElement.innerText =
          ((value * 9) / 5 + 32).toFixed(1) +
          "F" +
          ` High: ${tFDM.toFixed(1)}F Low: ${tFDMi.toFixed(1)}F  `;
      }
      let weatherImg = new Image();
      weatherImg.src = "./cloud.webp";
      if (hourly.rain[ind] >= 0.1) {
        weatherImg.src = "./cloud_rain.png";
        if (ind < 1) {
          document.body.style.backgroundImage = 'url("./rainysky.jpg")';
        }
        weatherImg.onmouseover = ()=>{
          console.log("yes");
          document.body.style.backgroundImage = 'url("./rainysky.jpg")';
        }
        weatherImg.onmouseleave = ()=>{
          console.log("leave");
          document.body.style.backgroundImage = 'url("./sky.png")';
        }
      }
      weatherImg.alt = "N/A";
      let fitTo64 = Math.max(weatherImg.width / 64, weatherImg.height / 64);
      weatherImg.width /= fitTo64;
      weatherImg.height /= fitTo64;
      let weatherTime = document.createElement("p");
      weatherTime.innerText = new Date(hourly.time[ind]).toLocaleString();
      weatherDiv.appendChild(weatherImg);
      weatherDiv.appendChild(weatherElement);
      weatherDiv.appendChild(weatherTime);
      document.getElementById("wresults").appendChild(weatherDiv);
    }
    wctx.stroke();
  });
  if (!metric) {
    document.getElementById("tempnow").innerText =
      Math.round((nearestTemp * 9) / 5 + 32) + "F";
  } else {
    document.getElementById("tempnow").innerText =
      Math.round(nearestTemp) + "C";
  }

  wctx.beginPath();
  wctx.strokeStyle = "rgb(49,49,255)";
  hourly.rain.forEach((value, ind) => {
    if (ind == 0) {
      wctx.moveTo(ind * (wcvs.width / hourly.rain.length), 200 + value * -20);
    } else {
      wctx.lineTo(ind * (wcvs.width / hourly.rain.length), 200 + value * -25);
    }
    wctx.lineWidth = 1;
    wctx.stroke();
  });
  wctx.beginPath();
  wctx.strokeStyle = "rgb(180,50,50)";
  maxs.forEach((value, ind) => {
    if (ind == 0) {
      wctx.moveTo(ind * (wcvs.width / maxs.length), 130 + value * -5);
    } else {
      wctx.lineTo(ind * (wcvs.width / maxs.length), 130 + value * -5);
    }
    wctx.lineWidth = 1;
    wctx.stroke();
  });
  wctx.beginPath();
  wctx.strokeStyle = "rgb(50,50,147)";
  mins.forEach((value, ind) => {
    if (ind == 0) {
      wctx.moveTo(ind * (wcvs.width / mins.length), 170 + value * -5);
    } else {
      wctx.lineTo(ind * (wcvs.width / mins.length), 170 + value * -5);
    }
    wctx.lineWidth = 1;
    wctx.stroke();
  });
}
let loadCL = () => {
  navigator.geolocation.getCurrentPosition(async (gp) => {
    let params = ["ll", gp.coords.latitude, gp.coords.longitude];
    await refreshWeather(params);
  });
};
window.onload = loadCL;
let citye = document.getElementById("city");
let subm = document.getElementById("subm");
subm.onclick = async () => {
  await GetCities(citye.value);
};
citye.addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    event.preventDefault();
    subm.click();
  }
});
setInterval(() => {
  timeElement.innerHTML = new Date().toLocaleString();
}, 200);
