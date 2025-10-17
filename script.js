// script.js (substitua todo o arquivo por este)

const form = document.getElementById("form-filme");
const lista = document.getElementById("lista-filmes");
const cancelarBtn = document.getElementById("cancelar");
const formTitulo = document.getElementById("form-titulo");
const modal = document.getElementById("modal-form");
const btnAbrir = document.getElementById("abrir-form");
const spanFechar = document.querySelector(".fechar");

const btnEditar = document.getElementById("editar-filme");
const btnExcluir = document.getElementById("excluir-filme");
const btnOrdenar = document.getElementById("ordenar-filmes");
const inputPesquisa = document.getElementById("pesquisa");

let editandoId = null;         // índice no array do localStorage do filme sendo editado
let cardSelecionado = null;    // elemento DOM selecionado
let ordemRecentePrimeiro = true; // controle de ordenação

// ----- Modal / botões básicos -----
btnAbrir.addEventListener("click", () => {
  modal.style.display = "block";
});

spanFechar.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

cancelarBtn.addEventListener("click", () => {
  modal.style.display = "none";
  form.reset();
  editandoId = null;
  formTitulo.textContent = "Adicionar Filme";
});

// Ordenar toggle
btnOrdenar.addEventListener("click", () => {
  ordemRecentePrimeiro = !ordemRecentePrimeiro;
  btnOrdenar.textContent = ordemRecentePrimeiro ? "🔄 Mais Recentes" : "🔄 Mais Antigos";
  carregarFilmes();
});

// Pesquisa em tempo real
inputPesquisa.addEventListener("input", carregarFilmes);

// ----- Form submit -----
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const genero = document.getElementById("genero").value.trim();
  const nota = parseInt(document.getElementById("nota").value);
  const comentario = document.getElementById("comentario").value.trim();
  const data = document.getElementById("data").value;
  const imagemInput = document.getElementById("imagem").files[0];

  if (imagemInput) {
    const reader = new FileReader();
    reader.onload = (event) => {
      salvarFilme(titulo, genero, nota, comentario, data, event.target.result);
    };
    reader.readAsDataURL(imagemInput);
  } else {
    salvarFilme(titulo, genero, nota, comentario, data, null);
  }
});

function salvarFilme(titulo, genero, nota, comentario, data, imagem) {
  let filmes = JSON.parse(localStorage.getItem("filmes")) || [];

  if (editandoId !== null && !isNaN(editandoId)) {
    // atualiza o filme existente pelo índice correto no storage
    filmes[editandoId] = {
      titulo,
      genero,
      nota,
      comentario,
      data,
      imagem: imagem || filmes[editandoId].imagem
    };
    editandoId = null;
    formTitulo.textContent = "Adicionar Filme";
    cancelarBtn.style.display = "none";
  } else {
    // novo
    filmes.push({ titulo, genero, nota, comentario, data, imagem });
  }

  // sempre ordena antes de salvar para manter consistência
  filmes.sort((a, b) => ordemRecentePrimeiro
    ? new Date(b.data) - new Date(a.data)
    : new Date(a.data) - new Date(b.data)
  );

  localStorage.setItem("filmes", JSON.stringify(filmes));
  form.reset();
  carregarFilmes();
}

// ----- UI helpers -----
function gerarEstrelas(nota) {
  let estrelas = "";
  for (let i = 1; i <= 5; i++) {
    estrelas += i <= nota ? "★" : "☆";
  }
  return estrelas;
}

function formatarData(data) {
  const d = new Date(data);
  if (isNaN(d)) return data || "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Selecionar card (recebe índice ORIGINAL do array no localStorage)
function selecionarCard(card, indiceOriginal) {
  if (cardSelecionado) cardSelecionado.classList.remove("selecionado");
  cardSelecionado = card;
  cardSelecionado.classList.add("selecionado");
  editandoId = indiceOriginal; // índice que será usado para editar/excluir no storage
  btnEditar.disabled = false;
  btnExcluir.disabled = false;
}

// ----- Carregar / renderizar com mapeamento de índices -----
function carregarFilmes() {
  lista.innerHTML = "";
  let filmes = JSON.parse(localStorage.getItem("filmes")) || [];

  // Cria array com referência ao índice original
  const filmesComIndice = filmes.map((f, idx) => ({ f, idx }));

  // Ordena pela data (baseado na flag)
  filmesComIndice.sort((a, b) => ordemRecentePrimeiro
    ? new Date(b.f.data) - new Date(a.f.data)
    : new Date(a.f.data) - new Date(b.f.data)
  );

  // Aplicar filtro da pesquisa sobre o conteúdo (usa título, gênero, data formatada ou nota)
  const termo = inputPesquisa.value.toLowerCase().trim();
  let filmesParaMostrar = filmesComIndice;
  if (termo) {
    filmesParaMostrar = filmesComIndice.filter(({ f }) => {
      const titulo = (f.titulo || "").toLowerCase();
      const genero = (f.genero || "").toLowerCase();
      const dataFormatada = formatarData(f.data).toLowerCase();
      // nota é preciso pegar apenas o número digitado
      if (/^\d+$/.test(termo)) {
        const termoNum = parseInt(termo);
        return f.nota === termoNum;
      }
      // 🔍 Caso contrário, busca normal (texto)
      return (
        titulo.includes(termo) ||
        genero.includes(termo) ||
        dataFormatada.includes(termo)
      );
    });
  }

  // Renderiza usando o índice ORIGINAL para referencia nas ações
  filmesParaMostrar.forEach(({ f, idx }) => {
    const artigo = document.createElement("article");
    artigo.classList.add("entry"); //dang v
    artigo.innerHTML = `
      ${f.imagem ? `<img src="${f.imagem}" class="capa">` : `<div class="capa" style="background:#ddd;"></div>`}
      <div class="info">
        <div class="meta">
          <div class="title-container">
            <div class="title">${f.titulo}</div>
            <div class="genero">${f.genero}</div>
          </div>
          <div class="rating">
            <span class="nota">${f.nota}/5</span>
            <span class="stars">${gerarEstrelas(f.nota)}</span>
            <span class="date">(${formatarData(f.data)})</span>
          </div>
        </div>
        <p class="comment">${f.comentario}</p>
      </div>
    `;

    // Ao clicar no card: seleciona e passa o índice ORIGINAL (idx)
    artigo.addEventListener("click", () => selecionarCard(artigo, idx));
    lista.appendChild(artigo);
  });

  // limpa seleção visual/estado quando recarrega a lista
  cardSelecionado = null;
  editandoId = null;
  btnEditar.disabled = true;
  btnExcluir.disabled = true;
}

// ----- Botões principais: editar / excluir -----
btnEditar.addEventListener("click", () => {
  if (editandoId === null) return;
  const filmes = JSON.parse(localStorage.getItem("filmes")) || [];
  const f = filmes[editandoId];
  if (!f) return;

  document.getElementById("titulo").value = f.titulo || "";
  document.getElementById("genero").value = f.genero || "";
  document.getElementById("nota").value = f.nota || "";
  document.getElementById("comentario").value = f.comentario || "";
  document.getElementById("data").value = f.data || "";

  formTitulo.textContent = "Editar Filme";
  cancelarBtn.style.display = "inline-block";
  modal.style.display = "block";
});

btnExcluir.addEventListener("click", () => {
  if (editandoId === null) return;
  let filmes = JSON.parse(localStorage.getItem("filmes")) || [];
  // remove pelo índice correto no storage
  filmes.splice(editandoId, 1);
  localStorage.setItem("filmes", JSON.stringify(filmes));
  carregarFilmes();
});

// Inicial
carregarFilmes();
