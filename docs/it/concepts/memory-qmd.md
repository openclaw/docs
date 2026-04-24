---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Vuoi funzionalità di memoria avanzate come reranking o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, reranking ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-04-24T08:36:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) è un sidecar di ricerca local-first che viene eseguito
accanto a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario, e può indicizzare contenuti oltre ai file di memoria del tuo workspace.

## Cosa aggiunge rispetto al builtin

- **Reranking ed espansione delle query** per un recupero migliore.
- **Indicizza directory aggiuntive** -- documentazione di progetto, note del team, qualsiasi cosa su disco.
- **Indicizza le trascrizioni delle sessioni** -- richiama conversazioni precedenti.
- **Completamente locale** -- viene eseguito tramite Bun + node-llama-cpp, scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna senza problemi al
  motore builtin.

## Per iniziare

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` oppure `bun install -g @tobilu/qmd`
- Build SQLite che consenta le estensioni (`brew install sqlite` su macOS).
- QMD deve essere nel `PATH` del gateway.
- macOS e Linux funzionano subito. Windows è supportato al meglio tramite WSL2.

### Abilitazione

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea una home QMD autosufficiente sotto
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita del sidecar
-- raccolte, aggiornamenti ed esecuzioni di embedding sono gestiti per te.
Preferisce le attuali forme di raccolta QMD e query MCP, ma ricade comunque sui
flag di raccolta legacy `--mask` e sui nomi dei tool MCP meno recenti quando necessario.
La riconciliazione all'avvio ricrea inoltre le raccolte gestite obsolete riportandole ai loro
pattern canonici quando è ancora presente una raccolta QMD meno recente con lo stesso nome.

## Come funziona il sidecar

- OpenClaw crea raccolte a partire dai file di memoria del tuo workspace e da qualsiasi
  `memory.qmd.paths` configurato, quindi esegue `qmd update` + `qmd embed` all'avvio
  e periodicamente (predefinito ogni 5 minuti).
- La raccolta workspace predefinita tiene traccia di `MEMORY.md` più l'albero `memory/`.
  `memory.md` in minuscolo non viene indicizzato come file di memoria root.
- L'aggiornamento all'avvio viene eseguito in background in modo da non bloccare
  l'avvio della chat.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta anche
  `vsearch` e `query`). Se una modalità fallisce, OpenClaw ritenta con `qmd query`.
- Se QMD fallisce completamente, OpenClaw torna al motore SQLite builtin.

<Info>
La prima ricerca può essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
reranking ed espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Override dei modelli

Le variabili d'ambiente dei modelli QMD vengono inoltrate senza modifiche dal
processo gateway, quindi puoi regolare QMD globalmente senza aggiungere nuova configurazione OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver cambiato il modello di embedding, riesegui gli embedding in modo che l'indice corrisponda al
nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Punta QMD a directory aggiuntive per renderle ricercabili:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Gli snippet dai percorsi aggiuntivi compaiono come `qmd/<collection>/<relative-path>` nei
risultati di ricerca. `memory_get` comprende questo prefisso e legge dalla corretta
root della raccolta.

## Indicizzazione delle trascrizioni delle sessioni

Abilita l'indicizzazione delle sessioni per richiamare conversazioni precedenti:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Le trascrizioni vengono esportate come turni User/Assistant sanificati in una raccolta QMD dedicata
sotto `~/.openclaw/agents/<id>/qmd/sessions/`.

## Ambito di ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati nelle sessioni dirette e di canale
(non nei gruppi). Configura `memory.qmd.scope` per modificarlo:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quando l'ambito nega una ricerca, OpenClaw registra un avviso con il canale derivato e
il tipo di chat, così i risultati vuoti sono più facili da diagnosticare.

## Citazioni

Quando `memory.citations` è `auto` o `on`, gli snippet di ricerca includono un
footer `Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il footer
continuando comunque a passare internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando ti serve:

- Reranking per risultati di qualità superiore.
- Cercare documentazione di progetto o note fuori dal workspace.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore builtin](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del gateway. Se OpenClaw
viene eseguito come servizio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**La prima ricerca è molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Pre-riscalda
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**La ricerca va in timeout?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Impostalo a `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- il valore predefinito
consente solo sessioni dirette e di canale.

**La ricerca nella memoria root è improvvisamente diventata troppo ampia?** Riavvia il gateway oppure attendi
la successiva riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
riportandole ai pattern canonici `MEMORY.md` e `memory/` quando rileva un conflitto
di stesso nome.

**Repository temporanei visibili dal workspace causano `ENAMETOOLONG` o indicizzazione non corretta?**
L'attraversamento QMD al momento segue il comportamento dello scanner QMD sottostante invece
delle regole builtin di symlink di OpenClaw. Mantieni i checkout temporanei di monorepo sotto
directory nascoste come `.tmp/` o fuori dalle root QMD indicizzate finché QMD non esporrà
un attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), modalità di ricerca, intervalli di
aggiornamento, regole di ambito e tutte le altre opzioni, vedi il
[Riferimento della configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria builtin](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
