---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Vuoi funzionalità di memoria avanzate come il reranking o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, reranking ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-06-28T22:33:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) è un componente affiancato di ricerca locale-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un singolo
binario, e può indicizzare contenuti oltre ai file di memoria del tuo workspace.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione delle query** per un richiamo migliore.
- **Indicizza directory aggiuntive** -- documentazione del progetto, note del team, qualsiasi cosa su disco.
- **Indicizza le trascrizioni delle sessioni** -- richiama conversazioni precedenti.
- **Completamente locale** -- viene eseguito con il Plugin provider ufficiale llama.cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna senza interruzioni al
  motore integrato.

## Per iniziare

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` oppure `bun install -g @tobilu/qmd`
- Build di SQLite che consenta le estensioni (`brew install sqlite` su macOS).
- QMD deve trovarsi nel `PATH` del Gateway.
- macOS e Linux funzionano direttamente. Windows è supportato al meglio tramite WSL2.

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
del componente affiancato -- raccolte, aggiornamenti ed esecuzioni degli embedding sono gestiti per te.
Preferisce le forme correnti di raccolta QMD e query MCP, ma, quando necessario, usa ancora come fallback
flag alternativi per i pattern delle raccolte e nomi di strumenti MCP meno recenti.
La riconciliazione all'avvio ricrea inoltre le raccolte gestite obsolete riportandole ai loro
pattern canonici quando una raccolta QMD più vecchia con lo stesso nome è ancora
presente.

## Come funziona il componente affiancato

- OpenClaw crea raccolte dai file di memoria del workspace e da eventuali
  `memory.qmd.paths` configurati, quindi esegue `qmd update` quando il gestore QMD viene
  aperto e periodicamente in seguito (valore predefinito ogni 5 minuti). Questi aggiornamenti
  passano attraverso sottoprocessi QMD, non tramite una scansione del filesystem nel processo. Le modalità
  semantiche eseguono anche `qmd embed`.
- La raccolta predefinita del workspace traccia `MEMORY.md` più l'albero
  `memory/`. `memory.md` minuscolo non viene indicizzato come file di memoria radice.
- Lo scanner di QMD ignora i percorsi nascosti e le directory comuni di dipendenze/build
  come `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. L'avvio del Gateway non inizializza QMD per impostazione predefinita, quindi l'avvio a freddo
  evita di importare il runtime della memoria o creare il watcher a lunga durata prima
  che la memoria venga usata per la prima volta.
- Se vuoi comunque inizializzare QMD all'avvio del Gateway, imposta
  `memory.qmd.update.startup` su `idle` o `immediate`. Con
  `memory.qmd.update.onBoot: true`, l'avvio esegue l'aggiornamento iniziale. Con
  `onBoot: false`, l'avvio salta quell'aggiornamento immediato ma apre comunque il
  gestore a lunga durata quando sono configurati intervalli di aggiornamento o embedding, così QMD può
  gestire il proprio watcher regolare e i timer.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta anche
  `vsearch` e `query`). `search` è solo BM25, quindi OpenClaw salta le sonde di prontezza
  vettoriale semantica e la manutenzione degli embedding in quella modalità. Se una modalità
  non riesce, OpenClaw riprova con `qmd query`.
- Quando `searchMode` è `query`, imposta `memory.qmd.rerank` su `false` per usare il percorso
  di query ibrido di QMD senza il reranker. OpenClaw passa `--no-rerank` al percorso
  CLI diretto di QMD e `rerank: false` allo strumento di query MCP di QMD. Questa opzione
  richiede QMD 2.1 o versioni successive.
- Con le release di QMD che dichiarano filtri multi-raccolta, OpenClaw raggruppa
  raccolte della stessa fonte in una sola invocazione di ricerca QMD. Le release QMD più vecchie
  mantengono il fallback compatibile per singola raccolta.
- Se QMD fallisce completamente, OpenClaw torna al motore SQLite integrato.
  Tentativi ripetuti nei turni di chat applicano un breve backoff dopo un errore di apertura, così un
  binario mancante o una dipendenza del componente affiancato rotta non crea una tempesta di tentativi;
  `openclaw memory status` e le sonde CLI una tantum ricontrollano comunque QMD direttamente.

<Info>
La prima ricerca può essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
reranking ed espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Prestazioni di ricerca e compatibilità

OpenClaw mantiene il percorso di ricerca QMD compatibile sia con le installazioni QMD correnti sia con
quelle più vecchie.

All'avvio, OpenClaw controlla il testo di aiuto di QMD installato una volta per gestore. Se il
binario dichiara il supporto per più filtri di raccolta, OpenClaw cerca in tutte le
raccolte della stessa fonte con un unico comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Questo evita di avviare un sottoprocesso QMD per ogni raccolta di memoria durevole.
Le raccolte di trascrizioni delle sessioni restano nel proprio gruppo di fonte, quindi le ricerche miste
`memory` + `sessions` forniscono comunque al diversificatore dei risultati input da entrambe
le fonti.

Le build QMD più vecchie accettano un solo filtro di raccolta. Quando OpenClaw ne rileva una
di queste build, mantiene il percorso di compatibilità e cerca in ogni raccolta
separatamente prima di unire e deduplicare i risultati.

Per ispezionare manualmente il contratto installato, esegui:

```bash
qmd --help | grep -i collection
```

L'aiuto QMD corrente dice che i filtri di raccolta possono indirizzare una o più raccolte.
L'aiuto più vecchio di solito descrive una singola raccolta.

## Override dei modelli

Le variabili d'ambiente dei modelli QMD passano invariate dal processo del Gateway,
così puoi regolare QMD globalmente senza aggiungere nuova configurazione OpenClaw:

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

Gli snippet dai percorsi aggiuntivi appaiono come `qmd/<collection>/<relative-path>` nei
risultati di ricerca. `memory_get` comprende questo prefisso e legge dalla radice della
raccolta corretta.

## Indicizzazione delle trascrizioni delle sessioni

Abilita l'indicizzazione delle sessioni per richiamare conversazioni precedenti. QMD richiede sia la fonte sessione generale
`memorySearch` sia l'esportatore di trascrizioni QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Le trascrizioni vengono esportate come turni User/Assistant sanificati in una raccolta QMD
dedicata sotto `~/.openclaw/agents/<id>/qmd/sessions/`. Impostare solo
`memorySearch.experimental.sessionMemory` non esporta le trascrizioni in QMD.

I risultati delle sessioni sono ancora filtrati da
[`tools.sessions.visibility`](/it/gateway/config-tools#toolssessions). La visibilità predefinita
`tree` non espone sessioni non correlate dello stesso agente. Se una
sessione inviata dal Gateway deve essere richiamabile da una sessione DM separata, imposta
intenzionalmente `tools.sessions.visibility: "agent"`.

## Ambito della ricerca

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

Quando `memory.citations` è `auto` o `on`, gli snippet di ricerca includono un piè di pagina
`Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il piè di pagina
pur passando internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando ti serve:

- Reranking per risultati di qualità superiore.
- Cercare documentazione o note del progetto fuori dal workspace.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del Gateway. Se OpenClaw
viene eseguito come servizio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funziona nella tua shell ma OpenClaw segnala ancora
`spawn qmd ENOENT`, è probabile che il processo Gateway abbia un `PATH` diverso rispetto alla tua
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

Usa `command -v qmd` nell'ambiente in cui QMD è installato, quindi ricontrolla
con `openclaw memory status --deep`.

**Prima ricerca molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Preriscalda
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**Molti sottoprocessi QMD durante la ricerca?** Aggiorna QMD se possibile. OpenClaw usa
un processo per le ricerche multi-raccolta della stessa fonte solo quando QMD installato
dichiara supporto per più filtri `-c`; altrimenti mantiene il fallback più vecchio
per singola raccolta per correttezza.

**QMD solo BM25 tenta ancora di compilare llama.cpp?** Imposta
`memory.qmd.searchMode = "search"`. OpenClaw tratta quella modalità come solo lessicale,
non esegue sonde di stato vettoriale QMD né manutenzione degli embedding, e lascia
i controlli di prontezza semantica alle configurazioni `vsearch` o `query`.

**La ricerca scade?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Imposta a `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- il valore predefinito consente solo
sessioni dirette e di canale.

**La ricerca nella memoria radice è diventata improvvisamente troppo ampia?** Riavvia il Gateway o attendi
la prossima riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
riportandole ai pattern canonici `MEMORY.md` e `memory/` quando rileva un conflitto
con lo stesso nome.

**Repository temporanei visibili dal workspace causano `ENAMETOOLONG` o indicizzazione rotta?**
L'attraversamento di QMD attualmente segue il comportamento dello scanner QMD sottostante anziché
le regole symlink integrate di OpenClaw. Tieni i checkout temporanei di monorepo sotto
directory nascoste come `.tmp/` o fuori dalle radici QMD indicizzate finché QMD non espone
attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), le modalità di ricerca, gli intervalli di aggiornamento,
le regole di ambito e tutte le altre opzioni, consulta il
[Riferimento alla configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
