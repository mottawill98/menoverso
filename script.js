(function () {
  "use strict";

  var STATUS = {
    none: { label: "Não iniciado" },
    progress: { label: "Em andamento" },
    done: { label: "Concluído" }
  };

  var DATA = [
    {
      id: "redes_sociais",
      num: "1",
      title: "Redes Sociais",
      items: [
        "Plataformas com perfil oficial (Instagram, TikTok, YouTube)",
        "Influenciadores (prospecção, contrato, briefing, pagamento, acompanhamento)",
        "Campanhas de UGC (User Generated Content)",
        "Copywriting (legendas, CTAs, tom de voz por rede)",
        "Design (posts estáticos, carrosséis, stories, templates)",
        "Criação de vídeo (reels, shorts, roteiro, edição)",
        "Calendário editorial / frequência de postagem",
        "Moderação e resposta a comentários/DMs",
        "Social listening / monitoramento de menções",
        "Fluxos de automação (respostas a menções e mensagens)"
      ]
    },
    {
      id: "conteudo",
      num: "2",
      title: "Conteúdo",
      items: [
        "Blog / artigos",
        "SEO on-page (palavras-chave, meta description, estrutura)",
        "Materiais ricos (e-books, whitepapers, planilhas)",
        "Vídeos long-form (YouTube, webinars)",
        "Podcasts"
      ]
    },
    {
      id: "performance",
      num: "3",
      title: "Performance / Tráfego Pago",
      items: [
        "Google Ads (Search, Display, Shopping)",
        "Meta Ads (Instagram/Facebook)",
        "TikTok Ads / outras plataformas",
        "Criativos para anúncios (copy + design específico)",
        "Gestão de orçamento e lances",
        "Landing pages para campanhas"
      ]
    },
    {
      id: "email",
      num: "4",
      title: "Email Marketing / CRM",
      items: [
        "Newsletters",
        "Fluxos de automação (boas-vindas, carrinho abandonado, nutrição)",
        "Segmentação de base",
        "Gestão de lista (LGPD, opt-in/opt-out)"
      ]
    },
    {
      id: "marca",
      num: "5",
      title: "Marca / Branding",
      items: [
        "Identidade visual (logo, paleta, tipografia, manual de marca)",
        "Tom de voz / posicionamento",
        "Brand guidelines para parceiros/franquias"
      ]
    },
    {
      id: "site",
      num: "6",
      title: "Site / Presença Digital",
      items: [
        "Manutenção e atualização do site",
        "SEO técnico",
        "UX/UI",
        "Analytics (GA4, pixels, tags)"
      ]
    },
    {
      id: "eventos",
      num: "7",
      title: "Eventos / Trade Marketing",
      items: [
        "Feiras, ativações, patrocínios",
        "Materiais físicos (banners, brindes, PDV)"
      ]
    },
    {
      id: "imprensa",
      num: "8",
      title: "Assessoria de Imprensa / RP",
      items: [
        "Releases",
        "Relacionamento com veículos/imprensa",
        "Gestão de crise de imagem"
      ]
    },
    {
      id: "parcerias",
      num: "9",
      title: "Parcerias / Co-marketing",
      items: [
        "Prospecção de parceiros",
        "Contratos e negociação",
        "Ações conjuntas"
      ]
    },
    {
      id: "ecommerce",
      num: "11",
      title: "E-commerce / Social Commerce",
      items: [
        "TikTok Shop (loja, catálogo de produtos, configuração)",
        "Programa de afiliados / comissão de criadores (TikTok Shop)",
        "TikTok Shop Ads (anúncios de produto dentro do Shop)",
        "Live shopping / transmissões de venda ao vivo",
        "Instagram Shopping / catálogo de produtos",
        "Gestão de pedidos e integração com estoque",
        "Análise de performance de vendas por canal social"
      ]
    },
    {
      id: "dados",
      num: "12",
      title: "Dados / Analytics",
      groups: [
        {
          area: "Email Marketing",
          kpis: [
            "Taxa de abertura", "Taxa de cliques (CTR)", "Taxa de conversão",
            "Taxa de descadastro (unsubscribe)", "Taxa de entrega / bounce rate", "Crescimento de lista"
          ]
        },
        {
          area: "Performance / Tráfego Pago",
          kpis: [
            "CPC (custo por clique)", "CPA (custo por aquisição)", "ROAS (retorno sobre investimento em anúncios)",
            "CTR dos anúncios", "Taxa de conversão de landing page", "Impressões e alcance"
          ]
        },
        {
          area: "Blog / SEO",
          kpis: [
            "Tráfego orgânico", "Posição média de palavras-chave", "Taxa de cliques orgânica (CTR SERP)",
            "Tempo médio na página", "Taxa de rejeição", "Backlinks conquistados"
          ]
        },
        {
          area: "YouTube",
          kpis: [
            "Visualizações", "Tempo de exibição / retenção", "Inscritos ganhos",
            "Taxa de cliques da thumbnail (CTR)", "Engajamento (likes, comentários, compartilhamentos)"
          ]
        },
        {
          area: "Redes Sociais",
          kpis: [
            "Alcance e impressões", "Engajamento (curtidas, comentários, compartilhamentos, salvamentos)",
            "Crescimento de seguidores", "Taxa de engajamento por post",
            "Cliques no link da bio / tráfego gerado", "Performance de UGC e influenciadores"
          ]
        },
        {
          area: "E-commerce / Social Commerce",
          kpis: [
            "GMV (volume total de vendas via TikTok Shop)",
            "Número de pedidos",
            "Ticket médio",
            "Taxa de conversão do catálogo",
            "Comissões pagas a afiliados/criadores",
            "Alcance e vendas geradas em lives"
          ]
        }
      ]
    }
  ];

  // ---------- Shared storage (everyone sees the same data) ----------
  var state = {};              // key -> { status, resp, obs }
  var db = null;               // resolved "db" capability namespace, or null
  var dbReady = false;
  var writeChains = {};        // key -> promise chain, one write at a time per doc

  function getEntry(key) {
    return state[key] || { status: "none", resp: "", obs: "" };
  }

  // Local, optimistic update — always runs immediately so typing feels instant.
  function applyLocal(key, patch) {
    state[key] = Object.assign({}, getEntry(key), patch);
    updateStats();
    refreshRowDom(key);
  }

  function setEntry(key, patch) {
    applyLocal(key, patch);
    if (!db) return; // no shared backend available in this view — stays local only
    var fullDoc = state[key];
    var prevChain = writeChains[key] || Promise.resolve();
    writeChains[key] = prevChain
      .catch(function () {})
      .then(function () {
        return db.collection("entries").doc(key).set(fullDoc);
      })
      .catch(function (err) {
        console.error("Falha ao salvar", key, err);
      });
  }

  var rowRefs = {}; // key -> { select, respInput, obsInput }

  function refreshRowDom(key) {
    var refs = rowRefs[key];
    if (!refs) return;
    var entry = getEntry(key);
    if (document.activeElement !== refs.select) {
      refs.select.value = entry.status;
      refs.select.dataset.status = entry.status;
    }
    if (document.activeElement !== refs.respInput) {
      refs.respInput.value = entry.resp || "";
    }
    if (document.activeElement !== refs.obsInput) {
      refs.obsInput.value = entry.obs || "";
    }
  }

  function setSyncNote(text) {
    var n = document.getElementById("syncNote");
    if (n) n.textContent = text;
  }

  async function initSharedStore() {
    try {
      if (typeof claude === "undefined" || !claude.use) {
        db = null;
      } else {
        db = await claude.use("db");
      }
    } catch (e) {
      db = null;
    }
    if (!db) {
      setSyncNote("Sem conexão com o banco compartilhado — preenchimento só fica neste dispositivo.");
      return;
    }
    setSyncNote("Sincronizado com o time · todo mundo vê o mesmo preenchimento.");
    try {
      db.collection("entries").onSnapshot(function (snap) {
        snap.docChanges().forEach(function (change) {
          var key = change.doc.id;
          if (change.type === "removed") {
            state[key] = { status: "none", resp: "", obs: "" };
          } else {
            var data = change.doc.data() || {};
            state[key] = {
              status: data.status || "none",
              resp: data.resp || "",
              obs: data.obs || ""
            };
          }
          refreshRowDom(key);
        });
        updateStats();
        dbReady = true;
      }, function (err) {
        console.error("db subscribe error", err);
        setSyncNote("Conexão com o banco compartilhado perdida — tentando manter o que já foi carregado.");
      });
    } catch (e) {
      console.error(e);
    }
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function buildRow(key, label) {
    var entry = getEntry(key);
    var row = el("div", "row");

    var labelCell = el("div", "label", label);
    row.appendChild(labelCell);

    var statusWrap = el("div");
    statusWrap.appendChild(el("span", "field-mobile-label", "Status"));
    var select = el("select", "status-select");
    Object.keys(STATUS).forEach(function (k) {
      var opt = el("option", null, STATUS[k].label);
      opt.value = k;
      if (k === entry.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.dataset.status = entry.status;
    select.addEventListener("change", function () {
      select.dataset.status = select.value;
      setEntry(key, { status: select.value });
    });
    statusWrap.appendChild(select);
    row.appendChild(statusWrap);

    var respWrap = el("div");
    respWrap.appendChild(el("span", "field-mobile-label", "Responsável"));
    var respInput = el("input", "text-field");
    respInput.type = "text";
    respInput.placeholder = "Nome";
    respInput.value = entry.resp || "";
    respInput.addEventListener("input", function () {
      setEntryDebounced(key, { resp: respInput.value });
    });
    respWrap.appendChild(respInput);
    row.appendChild(respWrap);

    var obsWrap = el("div");
    obsWrap.appendChild(el("span", "field-mobile-label", "Observações"));
    var obsInput = el("input", "text-field");
    obsInput.type = "text";
    obsInput.placeholder = "—";
    obsInput.value = entry.obs || "";
    obsInput.addEventListener("input", function () {
      setEntryDebounced(key, { obs: obsInput.value });
    });
    obsWrap.appendChild(obsInput);
    row.appendChild(obsWrap);

    rowRefs[key] = { select: select, respInput: respInput, obsInput: obsInput };

    return row;
  }

  var debounceTimers = {};
  function setEntryDebounced(key, patch) {
    applyLocal(key, patch); // instant local feedback
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(function () {
      setEntry(key, {}); // patch already applied locally; this just flushes the write
    }, 400);
  }

  function categoryKeys(cat) {
    var keys = [];
    if (cat.items) {
      cat.items.forEach(function (_, i) { keys.push(cat.id + ":" + i); });
    } else if (cat.groups) {
      cat.groups.forEach(function (g, gi) {
        g.kpis.forEach(function (_, i) { keys.push(cat.id + ":" + gi + ":" + i); });
      });
    }
    return keys;
  }

  function categoryProgress(cat) {
    var keys = categoryKeys(cat);
    var done = 0, progress = 0;
    keys.forEach(function (k) {
      var s = getEntry(k).status;
      if (s === "done") done++;
      else if (s === "progress") progress++;
    });
    return { total: keys.length, done: done, progress: progress };
  }

  function renderCategory(cat) {
    var card = el("div", "category");
    var header = el("button", "cat-header");
    header.type = "button";
    header.setAttribute("aria-expanded", "false");

    var num = el("div", "cat-num", cat.num);
    header.appendChild(num);

    var titleWrap = el("div", "cat-title-wrap");
    titleWrap.appendChild(el("div", "cat-title", cat.title));
    var subEl = el("div", "cat-sub");
    titleWrap.appendChild(subEl);
    header.appendChild(titleWrap);

    var miniProgress = el("div", "cat-mini-progress");
    var miniFill = el("i");
    miniProgress.appendChild(miniFill);
    header.appendChild(miniProgress);

    var chevron = el("div", "chevron", '<svg viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    header.appendChild(chevron);

    var body = el("div", "cat-body");
    var bodyInner = el("div", "cat-body-inner");

    if (cat.items) {
      cat.items.forEach(function (label, i) {
        bodyInner.appendChild(buildRow(cat.id + ":" + i, label));
      });
    } else if (cat.groups) {
      cat.groups.forEach(function (g, gi) {
        bodyInner.appendChild(el("div", "group-label", g.area));
        g.kpis.forEach(function (label, i) {
          bodyInner.appendChild(buildRow(cat.id + ":" + gi + ":" + i, "KPI: " + label));
        });
      });
    }
    body.appendChild(bodyInner);

    function refreshHeader() {
      var p = categoryProgress(cat);
      var noun = cat.groups ? "KPIs" : "subtarefas";
      subEl.textContent = p.total + " " + noun + " · " + p.done + " concluídas";
      var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
      miniFill.style.width = pct + "%";
    }
    refreshHeader();
    card._refresh = refreshHeader;

    header.addEventListener("click", function () {
      var isOpen = card.classList.toggle("open");
      header.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (isOpen) {
        body.style.maxHeight = body.scrollHeight + "px";
      } else {
        body.style.maxHeight = "0px";
      }
    });

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  var allCards = [];

  function updateStats() {
    var total = 0, done = 0, progress = 0;
    DATA.forEach(function (cat) {
      var p = categoryProgress(cat);
      total += p.total;
      done += p.done;
      progress += p.progress;
    });
    document.getElementById("statTotal").textContent = total;
    document.getElementById("statDone").textContent = done;
    document.getElementById("statProgress").textContent = progress;
    var pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("statPct").textContent = pct + "%";
    document.getElementById("progressFill").style.width = pct + "%";
    allCards.forEach(function (c) {
      c._refresh();
      if (c.classList.contains("open")) {
        var body = c.querySelector(".cat-body");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  }

  var container = document.getElementById("categories");
  DATA.forEach(function (cat) {
    var card = renderCategory(cat);
    allCards.push(card);
    container.appendChild(card);
  });

  updateStats();
  initSharedStore();

  document.getElementById("resetBtn").addEventListener("click", function () {
    if (!confirm("Isso apaga o preenchimento de TODO MUNDO (status, responsável e observações em todas as áreas). Continuar?")) return;
    var keys = Object.keys(rowRefs);
    keys.forEach(function (key) {
      state[key] = { status: "none", resp: "", obs: "" };
      refreshRowDom(key);
      if (db) {
        var prevChain = writeChains[key] || Promise.resolve();
        writeChains[key] = prevChain
          .catch(function () {})
          .then(function () { return db.collection("entries").doc(key).delete(); })
          .catch(function (err) { console.error("Falha ao limpar", key, err); });
      }
    });
    updateStats();
  });

})();
