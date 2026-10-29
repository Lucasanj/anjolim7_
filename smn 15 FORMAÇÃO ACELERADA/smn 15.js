
const API_GEOCODING =
    "https://geocoding-api.open-meteo.com/v1/search";

const API_WEATHER =
    "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusMessage = document.getElementById("status-message");
const searchResults = document.getElementById("search-results");
const resultsList = document.getElementById("results-list");
const weatherSection = document.getElementById("weather-section");

const weatherCodes = {
    0: "Céu limpo",
    1: "Predominantemente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro com geada",
    51: "Garoa fraca",
    53: "Garoa moderada",
    55: "Garoa intensa",
    61: "Chuva fraca",
    63: "Chuva moderada",
    65: "Chuva forte",
    71: "Neve fraca",
    73: "Neve moderada",
    75: "Neve forte",
    80: "Pancadas de chuva fracas",
    81: "Pancadas de chuva moderadas",
    82: "Pancadas de chuva fortes",
    95: "Trovoada",
    96: "Trovoada com granizo",
    99: "Trovoada forte com granizo"
};

function mostrarMensagem(texto, tipo = "info") {
    statusMessage.textContent = texto;
    statusMessage.className = `status ${tipo}`;
    statusMessage.hidden = false;
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    elemento.className = classe;
    elemento.textContent = texto;
    return elemento;
}

async function buscarJSON(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    return await resposta.json();
}

// Pesquisa a cidade na API de geocodificação
async function pesquisarCidade(nomeCidade) {
    const parametros = new URLSearchParams({
        name: nomeCidade,
        count: "10",
        language: "pt",
        format: "json"
    });

    return await buscarJSON(
        `${API_GEOCODING}?${parametros.toString()}`
    );
}

// Exibe as cidades encontradas
function mostrarResultados(cidades) {
    resultsList.replaceChildren();

    cidades.forEach(cidade => {
        const item = criarElemento("article", "result-item", "");
        const informacoes = criarElemento("div", "result-info", "");

        informacoes.append(
            criarElemento("strong", "", cidade.name),
            criarElemento(
                "p",
                "",
                [
                    cidade.admin1,
                    cidade.country,
                    `Lat: ${cidade.latitude}`,
                    `Lon: ${cidade.longitude}`
                ].filter(Boolean).join(" • ")
            )
        );

        const botao = criarElemento(
            "button",
            "result-select",
            "Consultar clima"
        );

        botao.type = "button";

        botao.addEventListener("click", () => {
            consultarClima(cidade);
        });

        item.append(informacoes, botao);
        resultsList.appendChild(item);
    });

    searchResults.hidden = false;
}

// Consulta o clima usando as coordenadas retornadas pela primeira API
async function consultarClima(cidade) {
    weatherSection.hidden = true;

    mostrarMensagem(
        `Carregando o clima de ${cidade.name}...`,
        "loading"
    );

    const parametros = new URLSearchParams({
        latitude: cidade.latitude,
        longitude: cidade.longitude,
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max"
        ].join(","),
        timezone: "auto",
        forecast_days: "5"
    });

    try {
        const dados = await buscarJSON(
            `${API_WEATHER}?${parametros.toString()}`
        );

        mostrarClimaAtual(cidade, dados.current);
        mostrarPrevisao(dados.daily);

        weatherSection.hidden = false;
        searchResults.hidden = true;

        mostrarMensagem(
            `Clima de ${cidade.name} atualizado com sucesso!`,
            "success"
        );
    } catch (erro) {
        console.error(erro);

        mostrarMensagem(
            "Não foi possível consultar o clima. Verifique sua conexão e tente novamente.",
            "error"
        );
    }
}

// Mostra as condições meteorológicas atuais
function mostrarClimaAtual(cidade, clima) {
    document.getElementById("current-location").textContent =
        `${cidade.name}, ${cidade.country}`;

    document.getElementById("current-date").textContent =
        new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

    document.getElementById("current-description").textContent =
        weatherCodes[clima.weather_code] ||
        "Condição não disponível";

    document.getElementById("current-icon").textContent =
        clima.weather_code === 0 ? "☀️" :
        clima.weather_code <= 2 ? "⛅" :
        clima.weather_code >= 95 ? "⛈️" :
        clima.weather_code >= 51 ? "🌧️" : "☁️";

    document.getElementById("current-temperature").textContent =
        clima.temperature_2m != null
            ? `${clima.temperature_2m} °C`
            : "Não disponível";

    document.getElementById("feels-like").textContent =
        clima.apparent_temperature != null
            ? `${clima.apparent_temperature} °C`
            : "Não disponível";

    document.getElementById("humidity").textContent =
        clima.relative_humidity_2m != null
            ? `${clima.relative_humidity_2m}%`
            : "Não disponível";

    document.getElementById("wind-speed").textContent =
        clima.wind_speed_10m != null
            ? `${clima.wind_speed_10m} km/h`
            : "Não disponível";
}

// Monta os cartões da previsão para cinco dias
function mostrarPrevisao(dias) {
    forecastList.replaceChildren();

    dias.time.slice(0, 5).forEach((data, indice) => {
        const cartao = criarElemento("article", "forecast-card", "");

        cartao.append(
            criarElemento(
                "p",
                "forecast-day",
                indice === 0
                    ? "Hoje"
                    : new Date(data + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        { weekday: "long" }
                    )
            ),
            criarElemento(
                "p",
                "forecast-date",
                new Date(data + "T12:00:00").toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "short" }
                )
            ),
            criarElemento(
                "div",
                "forecast-icon",
                "🌤️"
            ),
            criarElemento(
                "p",
                "forecast-description",
                weatherCodes[dias.weather_code?.[indice]] ||
                "Condição não disponível"
            ),
            criarElemento(
                "p",
                "forecast-temperatures",
                `Máx. ${dias.temperature_2m_max[indice] ?? "—"} °C | Mín. ${dias.temperature_2m_min[indice] ?? "—"} °C`
            ),
            criarElemento(
                "p",
                "forecast-rain",
                dias.precipitation_probability_max?.[indice] == null
                    ? "Chuva: não disponível"
                    : `Chuva: ${dias.precipitation_probability_max[indice]}%`
            )
        );

        forecastList.appendChild(cartao);
    });
}

// Evento do formulário de pesquisa
form.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nomeCidade = cityInput.value.trim();

    if (!nomeCidade) {
        mostrarMensagem(
            "Digite o nome de uma cidade.",
            "error"
        );
        return;
    }

    searchResults.hidden = true;
    resultsList.replaceChildren();
    mostrarMensagem("Pesquisando cidade...", "loading");

    try {
        const dados = await pesquisarCidade(nomeCidade);
        const cidades = (dados.results || []).filter(cidade =>
            Number.isFinite(cidade.latitude) &&
            Number.isFinite(cidade.longitude)
        );

        if (cidades.length === 0) {
            mostrarMensagem(
                "Nenhuma cidade encontrada.",
                "info"
            );
            return;
        }

        mostrarResultados(cidades);

        mostrarMensagem(
            "Selecione a cidade correta nos resultados.",
            "success"
        );
    } catch (erro) {
        console.error(erro);

        mostrarMensagem(
            "Erro ao pesquisar a cidade. Confira sua internet.",
            "error"
        );
    }
});

// Preenche a pesquisa inicialmente com Charqueadas, RS
cityInput.value = "Charqueadas";

// Atribuição da fonte meteorológica
console.log("Dados meteorológicos fornecidos pela Open-Meteo.");
