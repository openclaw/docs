---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Desideri funzionalità di memoria avanzate, come il riordinamento per rilevanza o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, riordinamento ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-07-12T07:00:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) è un processo ausiliario di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e riordinamento dei risultati in un unico
binario e può indicizzare contenuti oltre ai file di memoria del tuo workspace.

## Cosa aggiunge rispetto al motore integrato

- **Riordinamento dei risultati ed espansione delle query** per un recupero migliore.
- **Indicizzazione di directory aggiuntive** - documentazione di progetto, note del team, qualsiasi contenuto su disco.
- **Indicizzazione delle trascrizioni delle sessioni** - recupero delle conversazioni precedenti.
- **Completamente locale** - viene eseguito con il Plugin provider ufficiale llama.cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** - se QMD non è disponibile, OpenClaw passa
  automaticamente al motore integrato.

## Guida introduttiva

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` oppure `bun install -g @tobilu/qmd`
- Una build di SQLite che consenta le estensioni (`brew install sqlite` su macOS).
- QMD deve essere presente nel `PATH` del Gateway.
- macOS e Linux funzionano senza configurazione aggiuntiva. Su Windows il supporto migliore è tramite WSL2.

### Abilitazione

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un ambiente QMD autonomo in
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita
del processo ausiliario: raccolte, aggiornamenti e generazione degli embedding vengono gestiti automaticamente.
Preferisce i formati correnti delle raccolte QMD e delle query MCP, ma, quando necessario, usa come fallback
flag alternativi per i pattern delle raccolte e i nomi precedenti degli strumenti MCP.
La riconciliazione all'avvio ricrea inoltre le raccolte gestite obsolete secondo i rispettivi
pattern canonici quando è ancora presente una raccolta QMD precedente con lo stesso nome.

## Funzionamento del processo ausiliario

- OpenClaw crea raccolte dai file di memoria del workspace e dagli eventuali
  percorsi `memory.qmd.paths` configurati, quindi esegue `qmd update` all'apertura
  del gestore QMD e successivamente a intervalli regolari (`memory.qmd.update.interval`, valore predefinito
  `5m`). Gli aggiornamenti vengono eseguiti tramite sottoprocessi QMD, non tramite una scansione
  del file system nello stesso processo. Le modalità di ricerca semantica eseguono anche `qmd embed`
  (`memory.qmd.update.embedInterval`, valore predefinito `60m`).
- La raccolta predefinita del workspace tiene traccia di `MEMORY.md` e dell'albero
  `memory/`. Il file `memory.md` in minuscolo non viene indicizzato come file di memoria principale.
- Lo scanner di QMD ignora i percorsi nascosti e le comuni directory di dipendenze e build,
  come `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. Per impostazione predefinita, l'avvio del Gateway non inizializza QMD
  (`memory.qmd.update.startup` ha come valore predefinito `off`), quindi un avvio a freddo evita
  di importare il runtime della memoria o di creare l'osservatore persistente prima
  del primo utilizzo della memoria.
- Imposta `memory.qmd.update.startup` su `idle` o `immediate` per inizializzare comunque QMD
  all'avvio del Gateway. `memory.qmd.update.onBoot` ha come valore predefinito `true` ed
  esegue l'aggiornamento iniziale all'avvio; impostalo su `false` per saltare
  tale aggiornamento immediato (il gestore persistente viene comunque avviato quando sono configurati
  intervalli di aggiornamento o embedding, quindi QMD continua a gestire il proprio osservatore e i propri timer regolari).
- Le ricerche utilizzano la modalità `searchMode` configurata (valore predefinito: `search`; supporta anche
  `vsearch` e `query`). `search` utilizza esclusivamente BM25, quindi in questa modalità OpenClaw evita
  i controlli di disponibilità dei vettori semantici e la manutenzione degli embedding. Se una modalità
  non riesce, OpenClaw riprova con `qmd query`.
- Quando `searchMode` è `query`, imposta `memory.qmd.rerank` su `false` per utilizzare
  il percorso di query ibrido di QMD senza il riordinatore dei risultati (richiede QMD 2.1 o versioni successive).
  OpenClaw passa `--no-rerank` al percorso diretto della CLI QMD e
  `rerank: false` allo strumento di query MCP di QMD.
- Con le versioni di QMD che dichiarano filtri per più raccolte, OpenClaw raggruppa
  le raccolte con la stessa origine in una singola invocazione di ricerca QMD. Le versioni precedenti di QMD
  mantengono il fallback compatibile per singola raccolta.
- Se QMD non funziona affatto, OpenClaw passa al motore SQLite integrato.
  Dopo un errore di apertura, i tentativi ripetuti durante i turni di chat vengono temporaneamente diradati, affinché
  un binario mancante o una dipendenza difettosa del processo ausiliario non generi una raffica di nuovi tentativi;
  `openclaw memory status` e i controlli una tantum della CLI continuano comunque a verificare QMD
  direttamente.

<Info>
La prima ricerca può essere lenta: QMD scarica automaticamente i modelli GGUF (~2 GB) per
il riordinamento dei risultati e l'espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Prestazioni e compatibilità della ricerca

OpenClaw mantiene il percorso di ricerca QMD compatibile sia con le installazioni correnti sia con quelle precedenti di QMD.

All'avvio, OpenClaw controlla una volta per ogni gestore il testo della guida di QMD installato. Se
il binario dichiara il supporto per più filtri di raccolta, OpenClaw
cerca in tutte le raccolte con la stessa origine mediante un solo comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

In questo modo si evita di avviare un sottoprocesso QMD per ogni raccolta di memoria persistente.
Le raccolte delle trascrizioni delle sessioni rimangono nel proprio gruppo di origine, quindi le ricerche
miste `memory` + `sessions` continuano a fornire al diversificatore dei risultati dati provenienti
da entrambe le origini.

Le build precedenti di QMD accettano un solo filtro di raccolta. Quando OpenClaw rileva una
di queste build, mantiene il percorso di compatibilità e cerca separatamente in ogni raccolta,
prima di unire e deduplicare i risultati.

Per esaminare manualmente il contratto installato, esegui:

```bash
qmd --help | grep -i collection
```

La guida delle versioni correnti di QMD menziona la possibilità di selezionare una o più raccolte. La guida delle versioni
precedenti descrive generalmente una singola raccolta.

## Sostituzione dei modelli

Le variabili d'ambiente dei modelli QMD vengono trasmesse senza modifiche dal processo del Gateway,
quindi puoi regolare QMD globalmente senza aggiungere una nuova configurazione di OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver modificato il modello di embedding, rigenera gli embedding affinché l'indice corrisponda al
nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Indica a QMD directory aggiuntive per renderle ricercabili:

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

I frammenti provenienti dai percorsi aggiuntivi vengono visualizzati come `qmd/<collection>/<relative-path>` nei
risultati di ricerca. `memory_get` riconosce questo prefisso e legge dalla
radice corretta della raccolta.

## Indicizzazione delle trascrizioni delle sessioni

Abilita l'indicizzazione delle sessioni per recuperare le conversazioni precedenti. QMD richiede sia
l'origine generale delle sessioni `memorySearch` sia l'esportatore delle trascrizioni QMD:

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

Le trascrizioni vengono esportate come turni Utente/Assistente sanitizzati in una raccolta QMD
dedicata in `~/.openclaw/agents/<id>/qmd/sessions/`. Impostare soltanto
`memorySearch.experimental.sessionMemory` non esporta le trascrizioni in
QMD.

I risultati delle sessioni vengono comunque filtrati in base a
[`tools.sessions.visibility`](/it/gateway/config-tools#toolssessions). La visibilità
predefinita `tree` non espone sessioni non correlate dello stesso agente. Se una
sessione distribuita dal Gateway deve poter essere recuperata da una sessione DM separata,
imposta intenzionalmente `tools.sessions.visibility: "agent"`.

## Ambito della ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati solo nelle sessioni dirette, non
nelle chat di gruppo o di canale. Configura `memory.qmd.scope` per modificare questo comportamento:

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

Il frammento precedente rappresenta la regola predefinita effettiva. Quando l'ambito nega una ricerca,
OpenClaw registra un avviso con il canale e il tipo di chat derivati, per rendere
più semplice diagnosticare i risultati vuoti.

## Citazioni

Quando `memory.citations` è `auto` oppure `on`, ai frammenti dei risultati viene aggiunto
un piè di pagina `Source: <path>#L<line>` (oppure `#L<start>-L<end>`). In modalità `auto`
il piè di pagina viene aggiunto soltanto per le sessioni di chat dirette. Imposta
`memory.citations = "off"` per omettere il piè di pagina continuando a trasmettere internamente
il percorso all'agente.

## Quando utilizzarlo

Scegli QMD quando ti occorre:

- Riordinare i risultati per ottenere una qualità superiore.
- Cercare nella documentazione di progetto o nelle note esterne al workspace.
- Recuperare conversazioni di sessioni precedenti.
- Eseguire ricerche completamente locali senza chiavi API.

Per le configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia presente nel `PATH` del Gateway. Se OpenClaw
viene eseguito come servizio, crea un collegamento simbolico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funziona nella shell ma OpenClaw continua a segnalare
`spawn qmd ENOENT`, è probabile che il processo del Gateway abbia un `PATH` diverso da quello
della shell interattiva. Specifica esplicitamente il binario:

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

Usa `command -v qmd` nell'ambiente in cui è installato QMD, quindi verifica nuovamente
con `openclaw memory status --deep`.

**La prima ricerca è molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Esegui un preriscaldamento
con `qmd query "test"` usando le stesse directory XDG utilizzate da OpenClaw.

**Molti sottoprocessi QMD durante la ricerca?** Se possibile, aggiorna QMD. OpenClaw
utilizza un solo processo per le ricerche su più raccolte con la stessa origine soltanto quando
QMD installato dichiara il supporto per più filtri `-c`; in caso contrario,
mantiene il precedente fallback per singola raccolta per garantire la correttezza.

**QMD solo BM25 tenta comunque di compilare llama.cpp?** Imposta
`memory.qmd.searchMode = "search"`. OpenClaw considera questa modalità
esclusivamente lessicale, evita i controlli sullo stato dei vettori QMD e la manutenzione degli embedding e
lascia i controlli di disponibilità semantica alle configurazioni `vsearch` o `query`.

**La ricerca scade?** Aumenta `memory.qmd.limits.timeoutMs` (valore predefinito:
4000ms). Impostalo su un valore maggiore, ad esempio `120000`, per l'hardware più lento.

**Risultati vuoti nelle chat di gruppo o di canale?** È il comportamento previsto con
l'impostazione predefinita di `memory.qmd.scope`, che consente soltanto le sessioni dirette. Aggiungi una
regola `allow` per i tipi di chat `group` o `channel` se desideri visualizzare lì i risultati QMD.

**La ricerca nella memoria principale è improvvisamente diventata troppo ampia?** Riavvia il Gateway oppure attendi
la successiva riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
secondo i pattern canonici `MEMORY.md` e `memory/` quando
rileva un conflitto con lo stesso nome.

**I repository temporanei visibili dal workspace causano `ENAMETOOLONG` o un'indicizzazione non valida?**
L'attraversamento di QMD segue lo scanner QMD sottostante anziché le regole integrate di OpenClaw
per i collegamenti simbolici. Mantieni i checkout temporanei dei monorepository in directory
nascoste come `.tmp/` oppure all'esterno delle radici QMD indicizzate, finché QMD non offrirà
un attraversamento protetto dai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), le modalità di ricerca, gli intervalli di aggiornamento,
le regole di ambito e tutte le altre opzioni, consulta il
[riferimento per la configurazione della memoria](/it/reference/memory-config).

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
