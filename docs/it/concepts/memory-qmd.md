---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Vuoi funzionalità di memoria avanzate come il reranking o percorsi indicizzati aggiuntivi
summary: Componente ausiliario di ricerca con priorità al locale con BM25, vettori, riordinamento ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-06-27T17:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) è un processo ausiliario di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario, e può indicizzare contenuti oltre ai file di memoria del workspace.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione delle query** per un richiamo migliore.
- **Indicizzazione di directory aggiuntive** -- documenti di progetto, note del team, qualsiasi cosa su disco.
- **Indicizzazione delle trascrizioni di sessione** -- richiama conversazioni precedenti.
- **Completamente locale** -- funziona con il Plugin ufficiale del provider llama.cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna al
  motore integrato senza interruzioni.

## Primi passi

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` oppure `bun install -g @tobilu/qmd`
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

OpenClaw crea una home QMD autonoma sotto
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita
del processo ausiliario -- raccolte, aggiornamenti ed esecuzioni degli embedding
sono gestiti per te. Preferisce le forme attuali delle raccolte QMD e delle
query MCP, ma, quando necessario, usa ancora come fallback flag di pattern di
raccolta alternativi e nomi di tool MCP più vecchi. Anche la riconciliazione
all'avvio ricrea le raccolte gestite obsolete riportandole ai pattern canonici
quando è ancora presente una raccolta QMD più vecchia con lo stesso nome.

## Come funziona il processo ausiliario

- OpenClaw crea raccolte dai file di memoria del workspace e da eventuali
  `memory.qmd.paths` configurati, poi esegue `qmd update` quando il gestore QMD
  viene aperto e periodicamente in seguito (predefinito: ogni 5 minuti). Questi
  aggiornamenti passano attraverso sottoprocessi QMD, non una scansione del
  filesystem in-process. Le modalità semantiche eseguono anche `qmd embed`.
- La raccolta predefinita del workspace traccia `MEMORY.md` più l'albero
  `memory/`. `memory.md` in minuscolo non viene indicizzato come file di memoria
  root.
- Lo scanner di QMD ignora percorsi nascosti e comuni directory di dipendenze/build
  come `.git`, `.cache`, `node_modules`, `vendor`, `dist` e `build`. L'avvio del
  Gateway non inizializza QMD per impostazione predefinita, quindi un avvio a freddo
  evita di importare il runtime della memoria o creare il watcher di lunga durata
  prima del primo utilizzo della memoria.
- Se vuoi comunque inizializzare QMD all'avvio del gateway, imposta
  `memory.qmd.update.startup` su `idle` o `immediate`. Con
  `memory.qmd.update.onBoot: true`, l'avvio esegue il primo aggiornamento. Con
  `onBoot: false`, l'avvio salta quell'aggiornamento immediato ma apre comunque
  il gestore di lunga durata quando sono configurati intervalli di aggiornamento
  o embedding, così QMD può gestire il suo watcher e i suoi timer regolari.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta
  anche `vsearch` e `query`). `search` è solo BM25, quindi OpenClaw salta le sonde
  di prontezza vettoriale semantica e la manutenzione degli embedding in quella
  modalità. Se una modalità fallisce, OpenClaw riprova con `qmd query`.
- Quando `searchMode` è `query`, imposta `memory.qmd.rerank` su `false` per usare
  il percorso di query ibrido di QMD senza il reranker. OpenClaw passa
  `--no-rerank` al percorso CLI diretto di QMD e `rerank: false` al tool di query
  MCP di QMD. Questa opzione richiede QMD 2.1 o versioni successive.
- Con le release QMD che dichiarano filtri multi-raccolta, OpenClaw raggruppa le
  raccolte della stessa fonte in un'unica invocazione di ricerca QMD. Le release
  QMD più vecchie mantengono il fallback compatibile per raccolta.
- Se QMD fallisce completamente, OpenClaw torna al motore SQLite integrato.
  I tentativi ripetuti nei turni di chat applicano un breve backoff dopo un errore
  di apertura, così un binario mancante o una dipendenza rotta del processo
  ausiliario non crea una tempesta di tentativi; `openclaw memory status` e le
  sonde CLI una tantum ricontrollano comunque QMD direttamente.

<Info>
La prima ricerca può essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
reranking ed espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Prestazioni di ricerca e compatibilità

OpenClaw mantiene il percorso di ricerca QMD compatibile sia con le installazioni
QMD attuali sia con quelle più vecchie.

All'avvio, OpenClaw controlla una volta per gestore il testo di aiuto di QMD
installato. Se il binario dichiara il supporto per più filtri di raccolta,
OpenClaw cerca in tutte le raccolte della stessa fonte con un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Questo evita di avviare un sottoprocesso QMD per ogni raccolta di memoria
persistente. Le raccolte delle trascrizioni di sessione restano nel proprio
gruppo di fonte, quindi le ricerche miste `memory` + `sessions` forniscono
comunque al diversificatore dei risultati input da entrambe le fonti.

Le build QMD più vecchie accettano un solo filtro di raccolta. Quando OpenClaw
rileva una di queste build, mantiene il percorso di compatibilità e cerca in ogni
raccolta separatamente prima di unire e deduplicare i risultati.

Per ispezionare manualmente il contratto installato, esegui:

```bash
qmd --help | grep -i collection
```

L'help QMD attuale dice che i filtri di raccolta possono mirare a una o più
raccolte. L'help più vecchio di solito descrive una singola raccolta.

## Override dei modelli

Le variabili d'ambiente dei modelli QMD passano invariate dal processo gateway,
quindi puoi regolare QMD globalmente senza aggiungere nuova configurazione
OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver cambiato il modello di embedding, riesegui gli embedding così l'indice
corrisponde al nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Indirizza QMD verso directory aggiuntive per renderle ricercabili:

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
risultati di ricerca. `memory_get` comprende questo prefisso e legge dalla root
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

Le trascrizioni vengono esportate come turni User/Assistant sanificati in una
raccolta QMD dedicata sotto `~/.openclaw/agents/<id>/qmd/sessions/`.

## Ambito di ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati nelle
sessioni dirette e di canale (non nei gruppi). Configura `memory.qmd.scope` per
modificarlo:

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

Quando l'ambito nega una ricerca, OpenClaw registra un avviso con il canale
derivato e il tipo di chat, così è più facile eseguire il debug dei risultati
vuoti.

## Citazioni

Quando `memory.citations` è `auto` o `on`, gli snippet di ricerca includono un
footer `Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il
footer continuando comunque a passare internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando ti serve:

- Reranking per risultati di qualità superiore.
- Cercare documenti o note di progetto fuori dal workspace.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del gateway. Se OpenClaw
viene eseguito come servizio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funziona nella tua shell ma OpenClaw segnala ancora
`spawn qmd ENOENT`, probabilmente il processo gateway ha un `PATH` diverso dalla
tua shell interattiva. Fissa esplicitamente il binario:

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

Usa `command -v qmd` nell'ambiente in cui QMD è installato, poi ricontrolla con
`openclaw memory status --deep`.

**Prima ricerca molto lenta?** QMD scarica i modelli GGUF al primo utilizzo.
Esegui un preriscaldamento con `qmd query "test"` usando le stesse directory XDG
usate da OpenClaw.

**Molti sottoprocessi QMD durante la ricerca?** Aggiorna QMD se possibile.
OpenClaw usa un solo processo per le ricerche multi-raccolta della stessa fonte
solo quando QMD installato dichiara il supporto per più filtri `-c`; altrimenti
mantiene il vecchio fallback per raccolta per correttezza.

**QMD solo BM25 prova ancora a compilare llama.cpp?** Imposta
`memory.qmd.searchMode = "search"`. OpenClaw tratta quella modalità come solo
lessicale, non esegue sonde di stato vettoriale QMD né manutenzione degli
embedding, e lascia i controlli di prontezza semantica alle configurazioni
`vsearch` o `query`.

**La ricerca va in timeout?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Impostalo su `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- il valore
predefinito consente solo sessioni dirette e di canale.

**La ricerca nella memoria root è improvvisamente diventata troppo ampia?** Riavvia il gateway o attendi
la prossima riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
riportandole ai pattern canonici `MEMORY.md` e `memory/` quando rileva un
conflitto con lo stesso nome.

**Repository temporanei visibili dal workspace causano `ENAMETOOLONG` o indicizzazione rotta?**
L'attraversamento di QMD attualmente segue il comportamento dello scanner QMD
sottostante invece delle regole symlink integrate di OpenClaw. Mantieni i
checkout temporanei di monorepo sotto directory nascoste come `.tmp/` o fuori
dalle root QMD indicizzate finché QMD non espone un attraversamento sicuro rispetto
ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), le modalità di
ricerca, gli intervalli di aggiornamento, le regole di ambito e tutte le altre
impostazioni, consulta il
[riferimento alla configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
