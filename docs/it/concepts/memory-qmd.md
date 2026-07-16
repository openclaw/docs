---
read_when:
    - Si desidera configurare QMD come backend di memoria
    - Si desiderano funzionalità di memoria avanzate, come il reranking o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, riordinamento ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-07-16T14:15:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) è un processo ausiliario di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario e può indicizzare contenuti oltre ai file di memoria dello spazio di lavoro.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione delle query** per un richiamo migliore.
- **Indicizzazione di directory aggiuntive** - documentazione di progetto, note del team, qualsiasi contenuto su disco.
- **Indicizzazione delle trascrizioni delle sessioni** - consente di recuperare conversazioni precedenti.
- **Completamente locale** - viene eseguito con il Plugin provider ufficiale llama.cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** - se QMD non è disponibile, OpenClaw passa
  senza interruzioni al motore integrato.

## Introduzione

### Prerequisiti

- Installare QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Una build di SQLite che consenta le estensioni (`brew install sqlite` su macOS).
- QMD deve essere presente nel `PATH` del Gateway.
- macOS e Linux funzionano senza configurazione aggiuntiva. Su Windows, il supporto migliore è tramite WSL2.

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
del processo ausiliario: raccolte, aggiornamenti ed esecuzioni degli embedding vengono gestiti automaticamente.
Privilegia le forme correnti delle raccolte QMD e delle query MCP, ma, quando necessario, ricorre
a flag alternativi per i pattern delle raccolte e ai nomi precedenti degli strumenti MCP.
La riconciliazione all'avvio ricrea inoltre le raccolte gestite obsolete secondo i rispettivi
pattern canonici quando è ancora presente una raccolta QMD precedente con lo stesso nome.

## Funzionamento del processo ausiliario

- OpenClaw crea raccolte dai file di memoria dello spazio di lavoro e da ogni
  `memory.qmd.paths` configurato, quindi esegue `qmd update` all'apertura del gestore QMD
  e periodicamente in seguito (`memory.qmd.update.interval`, valore predefinito:
  `5m`). Gli aggiornamenti vengono eseguiti tramite sottoprocessi QMD, non mediante una scansione
  in-process del file system. Le modalità di ricerca semantica eseguono anche `qmd embed`
  (`memory.qmd.update.embedInterval`, valore predefinito: `60m`).
- La raccolta predefinita dello spazio di lavoro tiene traccia di `MEMORY.md` e dell'albero `memory/`.
  Il file `memory.md` in minuscolo non viene indicizzato come file di memoria radice.
- Lo scanner di QMD ignora i percorsi nascosti e le comuni directory di dipendenze/build
  come `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. Per impostazione predefinita, l'avvio del Gateway non inizializza QMD
  (`memory.qmd.update.startup` ha come valore predefinito `off`), quindi un avvio a freddo evita
  di importare il runtime della memoria o di creare il watcher persistente prima
  del primo utilizzo della memoria.
- Impostare `memory.qmd.update.startup` su `idle` o `immediate` per inizializzare comunque QMD
  all'avvio del Gateway. `memory.qmd.update.onBoot` ha come valore predefinito `true` ed
  esegue l'aggiornamento iniziale all'avvio; impostarlo su `false` per saltare
  l'aggiornamento immediato (il gestore persistente viene comunque aperto quando sono configurati
  intervalli di aggiornamento o embedding, quindi QMD continua a gestire i propri watcher/timer periodici).
- Le ricerche usano il valore `searchMode` configurato (valore predefinito: `search`; supporta anche
  `vsearch` e `query`). `search` usa solo BM25, quindi in tale modalità OpenClaw ignora
  i controlli di disponibilità dei vettori semantici e la manutenzione degli embedding. Se una modalità
  non riesce, OpenClaw riprova con `qmd query`.
- Quando `searchMode` è `query`, impostare `memory.qmd.rerank` su `false` per usare
  il percorso di query ibrido di QMD senza il reranker (richiede QMD 2.1 o versione successiva).
  OpenClaw passa `--no-rerank` al percorso diretto della CLI QMD e
  `rerank: false` allo strumento di query MCP di QMD.
- Con le versioni di QMD che dichiarano filtri per più raccolte, OpenClaw raggruppa
  le raccolte con la stessa origine in un'unica invocazione di ricerca QMD. Le versioni precedenti di QMD
  mantengono il fallback compatibile per singola raccolta.
- Se QMD non funziona del tutto, OpenClaw passa al motore SQLite integrato.
  I tentativi ripetuti durante i turni della chat applicano una breve attesa progressiva dopo un errore
  di apertura, affinché un binario mancante o una dipendenza non funzionante del processo ausiliario non generi una raffica di tentativi;
  `openclaw memory status` e le verifiche una tantum della CLI continuano comunque a controllare QMD
  direttamente.

<Info>
La prima ricerca può essere lenta: alla prima esecuzione di `qmd query`, QMD scarica
automaticamente i modelli GGUF (~2 GB) per il reranking e l'espansione delle query.
</Info>

## Prestazioni e compatibilità della ricerca

OpenClaw mantiene il percorso di ricerca QMD compatibile sia con le installazioni
correnti sia con quelle precedenti di QMD.

All'avvio, OpenClaw controlla una volta per gestore il testo della guida di QMD installato. Se
il binario dichiara il supporto per più filtri di raccolta, OpenClaw
esegue la ricerca in tutte le raccolte con la stessa origine mediante un unico comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

In questo modo si evita di avviare un sottoprocesso QMD per ogni raccolta di memoria persistente.
Le raccolte delle trascrizioni delle sessioni rimangono nel proprio gruppo di origine, quindi le ricerche
miste `memory` + `sessions` continuano a fornire al diversificatore dei risultati dati provenienti
da entrambe le origini.

Le build precedenti di QMD accettano un solo filtro di raccolta. Quando OpenClaw rileva una
di queste build, mantiene il percorso di compatibilità e cerca separatamente in ogni raccolta
prima di unire e deduplicare i risultati.

Per esaminare manualmente il contratto installato, eseguire:

```bash
qmd --help | grep -i collection
```

La guida corrente di QMD menziona la selezione di una o più raccolte. La guida precedente
descrive generalmente una singola raccolta.

## Sostituzione dei modelli

Le variabili d'ambiente dei modelli QMD vengono trasmesse senza modifiche dal processo
del Gateway, quindi è possibile configurare QMD globalmente senza aggiungere nuove impostazioni di OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver modificato il modello di embedding, rieseguire gli embedding affinché l'indice corrisponda al
nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Indicare a QMD directory aggiuntive per renderle ricercabili:

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

Abilitare l'indicizzazione delle sessioni per recuperare conversazioni precedenti. QMD richiede sia
l'origine generale delle sessioni `memorySearch` sia l'esportatore di trascrizioni QMD:

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
dedicata in `~/.openclaw/agents/<id>/qmd/sessions/`. L'impostazione del solo
`memorySearch.experimental.sessionMemory` non esporta le trascrizioni in
QMD.

I risultati delle sessioni vengono comunque filtrati da
[`tools.sessions.visibility`](/it/gateway/config-tools#toolssessions). La
visibilità predefinita `tree` non espone sessioni non correlate dello stesso agente. Se una
sessione avviata dal Gateway deve essere recuperabile da una sessione DM separata,
impostare intenzionalmente `tools.sessions.visibility: "agent"`.

## Ambito della ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati solo nelle sessioni dirette, non
nelle chat di gruppo o dei canali. Configurare `memory.qmd.scope` per modificare questo comportamento:

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
OpenClaw registra un avviso con il canale e il tipo di chat derivati, facilitando
il debug dei risultati vuoti.

## Citazioni

Quando `memory.citations` è `auto` o `on`, ai frammenti di ricerca viene aggiunto
un piè di pagina `Source: <path>#L<line>` (o `#L<start>-L<end>`). In modalità `auto`
il piè di pagina viene aggiunto solo per le sessioni di chat diretta. Impostare
`memory.citations = "off"` per omettere il piè di pagina continuando a trasmettere internamente il percorso
all'agente.

## Quando utilizzarlo

Scegliere QMD quando occorre:

- Reranking per risultati di qualità superiore.
- Cercare documentazione di progetto o note esterne allo spazio di lavoro.
- Recuperare conversazioni di sessioni precedenti.
- Una ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Verificare che il binario sia presente nel `PATH` del Gateway. Se OpenClaw
viene eseguito come servizio, creare un collegamento simbolico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funziona nella shell ma OpenClaw continua a segnalare
`spawn qmd ENOENT`, il processo del Gateway probabilmente usa un `PATH` diverso da quello
della shell interattiva. Specificare esplicitamente il binario:

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

Usare `command -v qmd` nell'ambiente in cui QMD è installato, quindi verificare nuovamente
con `openclaw memory status --deep`.

**La prima ricerca è molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Eseguire il preriscaldamento
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**Molti sottoprocessi QMD durante la ricerca?** Aggiornare QMD, se possibile. OpenClaw
usa un unico processo per le ricerche in più raccolte con la stessa origine soltanto quando il
QMD installato dichiara il supporto per più filtri `-c`; in caso contrario,
mantiene il precedente fallback per singola raccolta per garantire la correttezza.

**QMD in modalità solo BM25 tenta comunque di compilare llama.cpp?** Impostare
`memory.qmd.searchMode = "search"`. OpenClaw considera tale modalità
esclusivamente lessicale, ignora i controlli dello stato vettoriale QMD e la manutenzione degli embedding e
lascia i controlli della disponibilità semantica alle configurazioni `vsearch` o `query`.

**La ricerca va in timeout?** Aumentare `memory.qmd.limits.timeoutMs` (valore predefinito: 4000ms).
Impostarlo su un valore superiore, ad esempio `120000`, per hardware più lento. Questo limite si applica ai
comandi di ricerca di QMD durante le chiamate `memory_search` dell'agente; configurazione, sincronizzazione,
fallback integrato e operazioni supplementari sul corpus mantengono scadenze proprie più brevi.

**Risultati vuoti nelle chat di gruppo o dei canali?** È previsto con il valore predefinito
`memory.qmd.scope`, che consente solo le sessioni dirette. Aggiungere una regola
`allow` per i tipi di chat `group` o `channel` se si desiderano risultati QMD
anche in tali contesti.

**La ricerca nella memoria radice è diventata improvvisamente troppo ampia?** Riavviare il Gateway o attendere
la successiva riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
secondo i pattern canonici `MEMORY.md` e `memory/` quando
rileva un conflitto con lo stesso nome.

**I repository temporanei visibili nello spazio di lavoro causano `ENAMETOOLONG` o problemi di indicizzazione?**
L'attraversamento di QMD segue lo scanner QMD sottostante anziché le
regole integrate di OpenClaw per i collegamenti simbolici. Conservare i checkout temporanei del monorepo in directory
nascoste come `.tmp/` o al di fuori delle radici QMD indicizzate finché QMD non offrirà
un attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per la superficie completa della configurazione (`memory.qmd.*`), le modalità di ricerca, gli intervalli di aggiornamento,
le regole di ambito e tutte le altre opzioni, consultare il
[riferimento per la configurazione della memoria](/it/reference/memory-config).

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
