---
read_when:
    - Vuoi configurare QMD come backend per la memoria
    - Desideri funzionalità di memoria avanzate come il riordinamento o percorsi indicizzati aggiuntivi
summary: Componente ausiliario di ricerca con priorità locale, con BM25, vettori, riordinamento ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-04-30T08:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) è un sidecar di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario, e può indicizzare contenuti oltre ai file di memoria del tuo workspace.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione delle query** per un richiamo migliore.
- **Indicizzazione di directory aggiuntive** -- documentazione di progetto, note del team, qualsiasi cosa su disco.
- **Indicizzazione delle trascrizioni delle sessioni** -- richiama conversazioni precedenti.
- **Completamente locale** -- funziona con il pacchetto runtime opzionale node-llama-cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna
  senza interruzioni al motore integrato.

## Per iniziare

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Build di SQLite che consenta le estensioni (`brew install sqlite` su macOS).
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

OpenClaw crea una home QMD autonoma in
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita
del sidecar -- raccolte, aggiornamenti ed esecuzioni degli embedding vengono gestiti per te.
Preferisce le forme attuali di raccolta QMD e query MCP, ma, quando necessario,
ripiega ancora su flag di pattern di raccolta alternativi e su nomi di strumenti MCP più vecchi.
La riconciliazione all'avvio ricrea anche le raccolte gestite obsolete secondo
i loro pattern canonici quando è ancora presente una raccolta QMD più vecchia
con lo stesso nome.

## Come funziona il sidecar

- OpenClaw crea raccolte dai file di memoria del tuo workspace e da qualsiasi
  `memory.qmd.paths` configurato, poi esegue `qmd update` quando il gestore QMD
  viene aperto e periodicamente in seguito (predefinito: ogni 5 minuti). Questi aggiornamenti
  passano attraverso sottoprocessi QMD, non tramite una scansione del filesystem in-process. Anche le modalità semantiche
  eseguono `qmd embed`.
- La raccolta predefinita del workspace traccia `MEMORY.md` più l'albero
  `memory/`. `memory.md` in minuscolo non viene indicizzato come file di memoria radice.
- Lo scanner di QMD ignora i percorsi nascosti e le comuni directory di dipendenze/build
  come `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. L'avvio del Gateway non inizializza QMD per impostazione predefinita, quindi un avvio a freddo
  evita di importare il runtime della memoria o di creare il watcher di lunga durata prima
  che la memoria venga usata per la prima volta.
- Se vuoi comunque un aggiornamento all'avvio del Gateway, imposta
  `memory.qmd.update.startup` su `idle` o `immediate`. L'aggiornamento
  all'avvio opzionale usa un percorso di sottoprocesso QMD one-shot invece di creare il watcher completo
  di lunga durata in-process.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta anche
  `vsearch` e `query`). `search` è solo BM25, quindi OpenClaw salta i probe
  di prontezza vettoriale semantica e la manutenzione degli embedding in quella modalità. Se una modalità
  fallisce, OpenClaw riprova con `qmd query`.
- Con le versioni di QMD che dichiarano filtri multi-raccolta, OpenClaw raggruppa
  raccolte con la stessa sorgente in un'unica invocazione di ricerca QMD. Le versioni QMD più vecchie
  mantengono il fallback compatibile per raccolta.
- Se QMD fallisce completamente, OpenClaw torna al motore SQLite integrato.
  Tentativi ripetuti durante i turni di chat applicano un breve backoff dopo un errore di apertura, così un
  binario mancante o una dipendenza del sidecar rotta non crea una tempesta di tentativi;
  `openclaw memory status` e i probe CLI one-shot ricontrollano comunque QMD direttamente.

<Info>
La prima ricerca può essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
reranking ed espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Prestazioni di ricerca e compatibilità

OpenClaw mantiene il percorso di ricerca QMD compatibile sia con le installazioni QMD attuali
sia con quelle più vecchie.

All'avvio, OpenClaw controlla una volta per gestore il testo di aiuto di QMD installato. Se il
binario dichiara il supporto per più filtri di raccolta, OpenClaw cerca in tutte le
raccolte con la stessa sorgente con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Questo evita di avviare un sottoprocesso QMD per ogni raccolta di memoria durevole.
Le raccolte delle trascrizioni di sessione restano nel proprio gruppo di sorgente, quindi le ricerche miste
`memory` + `sessions` forniscono comunque al diversificatore dei risultati input da entrambe
le sorgenti.

Le build QMD più vecchie accettano solo un filtro di raccolta. Quando OpenClaw rileva una
di queste build, mantiene il percorso di compatibilità e cerca in ogni raccolta
separatamente prima di unire e deduplicare i risultati.

Per ispezionare manualmente il contratto installato, esegui:

```bash
qmd --help | grep -i collection
```

L'help QMD attuale dice che i filtri di raccolta possono puntare a una o più raccolte.
L'help più vecchio di solito descrive una singola raccolta.

## Override dei modelli

Le variabili d'ambiente dei modelli QMD vengono passate invariate dal processo
Gateway, quindi puoi regolare QMD globalmente senza aggiungere nuova configurazione OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver cambiato il modello di embedding, riesegui gli embedding così che l'indice corrisponda al
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
risultati di ricerca. `memory_get` comprende questo prefisso e legge dalla radice
della raccolta corretta.

## Indicizzazione delle trascrizioni di sessione

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

Le trascrizioni vengono esportate come turni User/Assistant sanitizzati in una raccolta QMD
dedicata in `~/.openclaw/agents/<id>/qmd/sessions/`.

## Ambito di ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono esposti nelle sessioni dirette e di canale
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
il tipo di chat, così i risultati vuoti sono più facili da debuggare.

## Citazioni

Quando `memory.citations` è `auto` o `on`, gli snippet di ricerca includono un
footer `Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il footer
continuando comunque a passare internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando ti serve:

- Reranking per risultati di qualità più alta.
- Cercare documentazione o note di progetto fuori dal workspace.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del Gateway. Se OpenClaw
viene eseguito come servizio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funziona nella tua shell ma OpenClaw segnala ancora
`spawn qmd ENOENT`, il processo Gateway probabilmente ha un `PATH` diverso da quello della tua
shell interattiva. Fissa esplicitamente il binario:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Usa `command -v qmd` nell'ambiente in cui QMD è installato, poi ricontrolla
con `openclaw memory status --deep`.

**Prima ricerca molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Pre-riscalda
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**Molti sottoprocessi QMD durante la ricerca?** Aggiorna QMD se possibile. OpenClaw usa
un processo per le ricerche multi-raccolta con la stessa sorgente solo quando il QMD installato
dichiara il supporto per più filtri `-c`; altrimenti mantiene il fallback più vecchio
per raccolta per correttezza.

**QMD solo BM25 prova ancora a compilare llama.cpp?** Imposta
`memory.qmd.searchMode = "search"`. OpenClaw tratta quella modalità come solo lessicale,
non esegue probe di stato vettoriale QMD né manutenzione degli embedding, e lascia
i controlli di prontezza semantica alle configurazioni `vsearch` o `query`.

**La ricerca va in timeout?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Impostalo a `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- il valore predefinito consente solo
sessioni dirette e di canale.

**La ricerca nella memoria radice è diventata improvvisamente troppo ampia?** Riavvia il Gateway o attendi
la prossima riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
secondo i pattern canonici `MEMORY.md` e `memory/` quando rileva un conflitto
con lo stesso nome.

**Repository temporanei visibili dal workspace causano `ENAMETOOLONG` o indicizzazione rotta?**
L'attraversamento di QMD attualmente segue il comportamento dello scanner QMD sottostante invece delle
regole dei symlink integrate in OpenClaw. Tieni i checkout temporanei di monorepo sotto
directory nascoste come `.tmp/` o fuori dalle radici QMD indicizzate finché QMD non espone
attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), le modalità di ricerca, gli intervalli di aggiornamento,
le regole di ambito e tutte le altre opzioni, vedi il
[riferimento della configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
