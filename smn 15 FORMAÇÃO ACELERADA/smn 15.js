let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

function adicionarTarefa() {

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const data = document.getElementById("data").value;
    const prioridade = document.getElementById("prioridade").value;

    if (titulo === "") {
        alert("Digite o título da tarefa!");
        return;
    }

    const novaTarefa = {
        id: Date.now(),
        titulo: titulo,
        descricao: descricao,
        data: data,
        prioridade: prioridade,
        concluida: false
    };

    tarefas.push(novaTarefa);

    salvarTarefas();
    limparCampos();
    mostrarTarefas();
}

function mostrarTarefas() {

    const lista = document.getElementById("listaTarefas");
    const filtro = document.getElementById("filtro").value;

    lista.innerHTML = "";

    let tarefasFiltradas = tarefas;

    if (filtro === "Pendentes") {
        tarefasFiltradas = tarefas.filter(tarefa => !tarefa.concluida);
    }

    if (filtro === "Concluídas") {
        tarefasFiltradas = tarefas.filter(tarefa => tarefa.concluida);
    }

    if (tarefasFiltradas.length === 0) {
        lista.innerHTML = "<p>Nenhuma tarefa encontrada.</p>";
        return;
    }

    tarefasFiltradas.forEach(tarefa => {

        const div = document.createElement("div");

        div.classList.add("tarefa");

        if (tarefa.concluida) {
            div.classList.add("concluida");
        }

        div.innerHTML = `
            <h3>${tarefa.titulo}</h3>

            <p>${tarefa.descricao}</p>

            <p><strong>Prazo:</strong> 
                ${tarefa.data || "Não informado"}
            </p>

            <p><strong>Prioridade:</strong> 
                ${tarefa.prioridade}
            </p>

            <p><strong>Status:</strong> 
                ${tarefa.concluida ? "Concluída" : "Pendente"}
            </p>

            <div class="botoes">

                <button 
                    class="btn-concluir"
                    onclick="concluirTarefa(${tarefa.id})">
                    ${tarefa.concluida ? "Desmarcar" : "Concluir"}
                </button>

                <button 
                    class="btn-editar"
                    onclick="editarTarefa(${tarefa.id})">
                    Editar
                </button>

                <button 
                    class="btn-excluir"
                    onclick="excluirTarefa(${tarefa.id})">
                    Excluir
                </button>

            </div>
        `;

        lista.appendChild(div);
    });
}

function concluirTarefa(id) {

    const tarefa = tarefas.find(tarefa => tarefa.id === id);

    tarefa.concluida = !tarefa.concluida;

    salvarTarefas();
    mostrarTarefas();
}

function excluirTarefa(id) {

    const confirmar = confirm("Deseja realmente excluir esta tarefa?");

    if (!confirmar) {
        return;
    }

    tarefas = tarefas.filter(tarefa => tarefa.id !== id);

    salvarTarefas();
    mostrarTarefas();
}

function editarTarefa(id) {

    const tarefa = tarefas.find(tarefa => tarefa.id === id);

    const novoTitulo = prompt(
        "Digite o novo título:",
        tarefa.titulo
    );

    if (novoTitulo === null || novoTitulo.trim() === "") {
        return;
    }

    tarefa.titulo = novoTitulo;

    salvarTarefas();
    mostrarTarefas();
}

function salvarTarefas() {

    localStorage.setItem(
        "tarefas",
        JSON.stringify(tarefas)
    );
}

function limparCampos() {

    document.getElementById("titulo").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("data").value = "";
    document.getElementById("prioridade").value = "Baixa";
}

mostrarTarefas();