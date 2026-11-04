
const API_GEO="https://geocoding-api.open-meteo.com/v1/search";
const API_WEATHER="https://api.open-meteo.com/v1/forecast";
const STORAGE_KEY="climatempo_favoritos";
const searchForm=document.getElementById("searchForm");
const cityInput=document.getElementById("cityInput");
const searchButton=document.getElementById("searchButton");
const statusMessage=document.getElementById("statusMessage");
const resultsSection=document.getElementById("resultsSection");
const cityResults=document.getElementById("cityResults");
const weatherSection=document.getElementById("weatherSection");
const currentWeather=document.getElementById("currentWeather");
const forecast=document.getElementById("forecast");
const favoriteButton=document.getElementById("favoriteButton");
const favoritesList=document.getElementById("favoritesList");
let selectedCity=null;
let favorites=loadFavorites();
let searchController=null;
let weatherController=null;
const weatherDescriptions={
0:{description:"Céu limpo",icon:"☀️"},
1:{description:"Predominantemente limpo",icon:"🌤️"},
2:{description:"Parcialmente nublado",icon:"⛅"},
3:{description:"Nublado",icon:"☁️"},
45:{description:"Nevoeiro",icon:"🌫️"},
48:{description:"Nevoeiro com geada",icon:"🌫️"},
51:{description:"Garoa fraca",icon:"🌦️"},
53:{description:"Garoa moderada",icon:"🌦️"},
55:{description:"Garoa intensa",icon:"🌧️"},
56:{description:"Garoa congelante fraca",icon:"🌧️"},
57:{description:"Garoa congelante intensa",icon:"🌧️"},
61:{description:"Chuva fraca",icon:"🌧️"},
63:{description:"Chuva moderada",icon:"🌧️"},
65:{description:"Chuva forte",icon:"🌧️"},
66:{description:"Chuva congelante fraca",icon:"🌧️"},
67:{description:"Chuva congelante forte",icon:"🌧️"},
71:{description:"Neve fraca",icon:"🌨️"},
73:{description:"Neve moderada",icon:"🌨️"},
75:{description:"Neve forte",icon:"❄️"},
77:{description:"Grãos de neve",icon:"❄️"},
80:{description:"Pancadas de chuva fracas",icon:"🌦️"},
81:{description:"Pancadas de chuva moderadas",icon:"🌧️"},
82:{description:"Pancadas de chuva fortes",icon:"⛈️"},
85:{description:"Pancadas de neve fracas",icon:"🌨️"},
86:{description:"Pancadas de neve fortes",icon:"❄️"},
95:{description:"Trovoada",icon:"⛈️"},
96:{description:"Trovoada com granizo fraco",icon:"⛈️"},
99:{description:"Trovoada com granizo forte",icon:"⛈️"}
};
function getWeatherInfo(code){
return weatherDescriptions[code]||{description:"Condição não identificada",icon:"🌡️"};
}
function showStatus(message,type=""){
statusMessage.textContent=message;
statusMessage.className="status "+type;
}
function clearWeather(){
selectedCity=null;
currentWeather.replaceChildren();
forecast.replaceChildren();
weatherSection.classList.add("hidden");
}
function getCityKey(city){
return `${Number(city.latitude).toFixed(4)}_${Number(city.longitude).toFixed(4)}_${city.name.toLowerCase()}_${city.country_code||""}`;
}
function loadFavorites(){
try{
const saved=localStorage.getItem(STORAGE_KEY);
if(!saved)return [];
const parsed=JSON.parse(saved);
if(!Array.isArray(parsed))return [];
return parsed.filter(city=>city&&typeof city.name==="string"&&typeof city.latitude==="number"&&typeof city.longitude==="number"&&Number.isFinite(city.latitude)&&Number.isFinite(city.longitude));
}catch(error){
console.error("Erro ao carregar favoritos:",error);
return [];
}
}
function saveFavorites(){
try{
localStorage.setItem(STORAGE_KEY,JSON.stringify(favorites));
}catch(error){
console.error("Erro ao salvar favoritos:",error);
showStatus("Não foi possível salvar os favoritos no navegador.","error");
}
}
async function searchCities(cityName){
if(searchController)searchController.abort();
searchController=new AbortController();
const signal=searchController.signal;
showStatus("🔄 Procurando cidades...","loading");
searchButton.disabled=true;
resultsSection.classList.add("hidden");
cityResults.replaceChildren();
clearWeather();
try{
const url=`${API_GEO}?name=${encodeURIComponent(cityName)}&count=10&language=pt&format=json`;
const response=await fetch(url,{signal});
if(!response.ok)throw new Error(`Erro HTTP ${response.status} ao localizar a cidade.`);
const data=await response.json();
if(!data.results||data.results.length===0){
showStatus("Nenhuma cidade encontrada. Verifique o nome e tente novamente.","error");
return;
}
displayCityResults(data.results);
resultsSection.classList.remove("hidden");
showStatus(`${data.results.length} localidade(s) encontrada(s). Selecione a cidade desejada.`,"success");
}catch(error){
if(error.name==="AbortError")return;
console.error("Erro na pesquisa:",error);
showStatus("Não foi possível localizar a cidade. Verifique sua conexão e tente novamente.","error");
}finally{
if(searchController?.signal===signal){
searchButton.disabled=false;
}
}
}
function displayCityResults(cities){
cityResults.replaceChildren();
cities.forEach(city=>{
const button=document.createElement("button");
button.type="button";
button.className="city-option";
const name=document.createElement("strong");
name.textContent=city.name;
const details=document.createElement("span");
details.textContent=[city.admin1,city.country].filter(Boolean).join(" - ");
const coordinates=document.createElement("span");
coordinates.textContent=`Latitude: ${city.latitude.toFixed(2)} | Longitude: ${city.longitude.toFixed(2)}`;
button.append(name,details,coordinates);
button.addEventListener("click",()=>selectCity(city));
cityResults.appendChild(button);
});
}
async function selectCity(city){
const cityData={
id:city.id??null,
name:city.name,
admin1:city.admin1||"",
country:city.country||"",
country_code:city.country_code||"",
latitude:Number(city.latitude),
longitude:Number(city.longitude)
};
if(!Number.isFinite(cityData.latitude)||!Number.isFinite(cityData.longitude)){
showStatus("As coordenadas desta localidade são inválidas.","error");
return;
}
if(weatherController)weatherController.abort();
weatherController=new AbortController();
const signal=weatherController.signal;
selectedCity=cityData;
resultsSection.classList.add("hidden");
weatherSection.classList.add("hidden");
currentWeather.replaceChildren();
forecast.replaceChildren();
showStatus("🔄 Consultando as condições meteorológicas...","loading");
try{
const params=new URLSearchParams({
latitude:String(cityData.latitude),
longitude:String(cityData.longitude),
current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
timezone:"auto",
forecast_days:"6",
temperature_unit:"celsius",
wind_speed_unit:"kmh"
});
const response=await fetch(`${API_WEATHER}?${params.toString()}`,{signal});
if(!response.ok)throw new Error(`Erro HTTP ${response.status} ao consultar o clima.`);
const data=await response.json();
if(!data.current||!data.daily)throw new Error("A API retornou dados meteorológicos incompletos.");
if(selectedCity!==cityData)return;
displayCurrentWeather(cityData,data);
displayForecast(data.daily);
weatherSection.classList.remove("hidden");
updateFavoriteButton();
showStatus(`Consulta concluída! Confira a previsão para ${cityData.name}.`,"success");
}catch(error){
if(error.name==="AbortError")return;
console.error("Erro meteorológico:",error);
if(selectedCity===cityData){
clearWeather();
showStatus("Não foi possível consultar a previsão do tempo. Tente novamente.","error");
}
}
}
function createDetail(label,value){
const item=document.createElement("div");
item.className="detail-item";
const title=document.createElement("span");
title.textContent=label;
const content=document.createElement("strong");
content.textContent=value;
item.append(title,content);
return item;
}
function displayCurrentWeather(city,data){
const current=data.current;
const info=getWeatherInfo(current.weather_code);
const location=document.createElement("div");
location.className="weather-location";
location.textContent=`📍 ${city.name}${city.admin1?", "+city.admin1:""} - ${city.country}`;
const main=document.createElement("div");
main.className="weather-main";
const temperatureArea=document.createElement("div");
const temperature=document.createElement("div");
temperature.className="temperature";
temperature.textContent=current.temperature_2m!=null?`${Math.round(current.temperature_2m)}°C`:"--";
const description=document.createElement("div");
description.className="weather-description";
description.textContent=info.description;
temperatureArea.append(temperature,description);
const icon=document.createElement("div");
icon.className="weather-icon";
icon.textContent=info.icon;
main.append(temperatureArea,icon);
const details=document.createElement("div");
details.className="weather-details";
details.append(
createDetail("🌡️ Sensação térmica",current.apparent_temperature!=null?`${Math.round(current.apparent_temperature)}°C`:"Não disponível"),
createDetail("💨 Velocidade do vento",current.wind_speed_10m!=null?`${current.wind_speed_10m} km/h`:"Não disponível"),
createDetail("💧 Umidade do ar",current.relative_humidity_2m!=null?`${current.relative_humidity_2m}%`:"Não disponível"),
createDetail("🌧️ Precipitação",current.precipitation!=null?`${current.precipitation} mm`:"Não disponível")
);
currentWeather.replaceChildren(location,main,details);
}
function formatDate(dateString){
const date=new Date(`${dateString}T12:00:00`);
return date.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
}
function displayForecast(daily){
forecast.replaceChildren();
if(!daily.time||daily.time.length===0){
const message=document.createElement("p");
message.textContent="Previsão diária não disponível.";
forecast.appendChild(message);
return;
}
daily.time.forEach((date,index)=>{
const card=document.createElement("div");
card.className="forecast-card";
const info=getWeatherInfo(daily.weather_code?.[index]);
const day=document.createElement("div");
day.className="day";
day.textContent=index===0?"Hoje":formatDate(date);
const icon=document.createElement("div");
icon.className="icon";
icon.textContent=info.icon;
const description=document.createElement("div");
description.className="description";
description.textContent=info.description;
const temperatures=document.createElement("div");
temperatures.className="temperatures";
const maximum=daily.temperature_2m_max?.[index];
const minimum=daily.temperature_2m_min?.[index];
temperatures.textContent=`${maximum!=null?Math.round(maximum)+"°":"--"} / `;
const minSpan=document.createElement("span");
minSpan.textContent=minimum!=null?`${Math.round(minimum)}°`:"--";
temperatures.appendChild(minSpan);
const rain=document.createElement("div");
rain.className="rain";
const probability=daily.precipitation_probability_max?.[index];
rain.textContent=probability!=null?`🌧️ Chuva: ${probability}%`:"🌧️ Chuva: Não disponível";
card.append(day,icon,description,temperatures,rain);
forecast.appendChild(card);
});
}
function updateFavoriteButton(){
if(!selectedCity)return;
const exists=favorites.some(city=>getCityKey(city)===getCityKey(selectedCity));
favoriteButton.textContent=exists?"♥ Cidade favoritada":"♡ Adicionar aos favoritos";
favoriteButton.disabled=exists;
}
function addFavorite(){
if(!selectedCity)return;
const exists=favorites.some(city=>getCityKey(city)===getCityKey(selectedCity));
if(exists){
showStatus("Esta cidade já está nos seus favoritos.","error");
return;
}
favorites.push({...selectedCity});
saveFavorites();
displayFavorites();
updateFavoriteButton();
showStatus(`${selectedCity.name} foi adicionada aos favoritos!`,"success");
}
function removeFavorite(key){
favorites=favorites.filter(city=>getCityKey(city)!==key);
saveFavorites();
displayFavorites();
updateFavoriteButton();
showStatus("Cidade removida dos favoritos.","success");
}
function displayFavorites(){
favoritesList.replaceChildren();
if(favorites.length===0){
const empty=document.createElement("div");
empty.className="empty-favorites";
empty.textContent="⭐ Você ainda não possui cidades favoritas. Consulte uma cidade e adicione-a à sua lista!";
favoritesList.appendChild(empty);
return;
}
favorites.forEach(city=>{
const card=document.createElement("div");
card.className="favorite-card";
const info=document.createElement("div");
info.className="favorite-info";
const name=document.createElement("strong");
name.textContent=city.name;
const country=document.createElement("span");
country.textContent=[city.admin1,city.country].filter(Boolean).join(" - ");
info.append(name,country);
info.addEventListener("click",()=>selectCity(city));
const actions=document.createElement("div");
actions.className="favorite-actions";
const selectButton=document.createElement("button");
selectButton.className="select-favorite";
selectButton.type="button";
selectButton.textContent="Consultar";
selectButton.addEventListener("click",()=>selectCity(city));
const removeButton=document.createElement("button");
removeButton.className="remove-favorite";
removeButton.type="button";
removeButton.textContent="✕";
removeButton.setAttribute("aria-label",`Remover ${city.name} dos favoritos`);
removeButton.addEventListener("click",()=>removeFavorite(getCityKey(city)));
actions.append(selectButton,removeButton);
card.append(info,actions);
favoritesList.appendChild(card);
});
}
searchForm.addEventListener("submit",event=>{
event.preventDefault();
const cityName=cityInput.value.trim();
if(!cityName){
showStatus("Digite o nome de uma cidade antes de pesquisar.","error");
cityInput.focus();
return;
}
searchCities(cityName);
});
favoriteButton.addEventListener("click",addFavorite);
displayFavorites();
