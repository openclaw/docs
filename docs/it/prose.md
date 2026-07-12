---
read_when:
    - Vuoi eseguire o scrivere file di workflow .prose
    - Vuoi abilitare il plugin OpenProse
    - Devi comprendere come OpenProse si associa alle primitive di OpenClaw
sidebarTitle: OpenProse
summary: OpenProse è un formato di flusso di lavoro basato principalmente su Markdown per sessioni di IA multi-agente. In OpenClaw viene distribuito come Plugin con un comando slash `/prose` e un pacchetto di Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T07:26:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse è un formato di workflow portabile, basato principalmente su Markdown, per orchestrare sessioni di IA. In OpenClaw viene distribuito come Plugin che installa un pacchetto di Skills OpenProse e un comando slash `/prose`. I programmi risiedono in file `.prose` e possono avviare più sotto-agenti con un flusso di controllo esplicito.

<CardGroup cols={3}>
  <Card title="Installazione" icon="download" href="#install">
    Abilita il Plugin OpenProse e riavvia il Gateway.
  </Card>
  <Card title="Eseguire un programma" icon="play" href="#slash-command">
    Usa `/prose run` per eseguire un file `.prose` o un programma remoto.
  </Card>
  <Card title="Scrivere programmi" icon="pencil" href="#example-parallel-research-and-synthesis">
    Crea workflow multi-agente con passaggi paralleli e sequenziali.
  </Card>
</CardGroup>

## Installazione

<Steps>
  <Step title="Abilitare il Plugin">
    OpenProse è incluso, ma disabilitato per impostazione predefinita. Abilitalo:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Riavviare il Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verificare">
    ```bash
    openclaw plugins list | grep prose
    ```

    Dovresti vedere `open-prose` come abilitato. Il comando di Skills `/prose` è ora disponibile nella chat.

  </Step>
</Steps>

Da un checkout del repository puoi installare direttamente il Plugin:
`openclaw plugins install ./extensions/open-prose`

## Comando slash

OpenProse registra `/prose` come comando di Skills richiamabile dall'utente:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` viene risolto in `https://p.prose.md/<handle>/<slug>`.
Gli URL diretti vengono recuperati così come sono tramite lo strumento `web_fetch`.

Le esecuzioni remote di primo livello sono esplicite. Le importazioni remote all'interno di un programma `.prose` sono dipendenze di codice transitive: prima che OpenProse recuperi qualsiasi destinazione `use` remota, mostra l'elenco delle importazioni risolte e richiede all'operatore di rispondere esattamente `approve remote prose imports` per quell'esecuzione.

## Funzionalità

- Ricerca e sintesi multi-agente con parallelismo esplicito.
- Workflow ripetibili e sicuri mediante approvazioni (revisione del codice, valutazione iniziale degli incidenti, pipeline di contenuti).
- Programmi `.prose` riutilizzabili, eseguibili nei runtime degli agenti supportati.

## Esempio: ricerca e sintesi parallele

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## Mappatura del runtime OpenClaw

I programmi OpenProse vengono mappati sulle primitive di OpenClaw:

| Concetto OpenProse                   | Strumento OpenClaw                                |
| ------------------------------------ | ------------------------------------------------- |
| Avvio di una sessione / strumento Task | `sessions_spawn`                                |
| Lettura / scrittura di file          | `read` / `write`                                  |
| Recupero dal Web                     | `web_fetch` (`exec` + curl quando è richiesto POST) |

<Warning>
  Se l'elenco consentito degli strumenti blocca `sessions_spawn`, `read`, `write` o `web_fetch`, i programmi OpenProse non funzioneranno. Controlla la [configurazione dell'elenco consentito degli strumenti](/it/gateway/config-tools).
</Warning>

## Percorsi dei file

OpenProse conserva lo stato nella directory `.prose/` dell'area di lavoro:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Gli agenti persistenti a livello utente, condivisi tra i progetti, risiedono in:

```text
~/.prose/agents/
```

## Backend dello stato

<AccordionGroup>
  <Accordion title="filesystem (predefinito)">
    Lo stato viene scritto in `.prose/runs/...` nell'area di lavoro. Non sono richieste dipendenze aggiuntive.
  </Accordion>
  <Accordion title="nel contesto">
    Lo stato transitorio viene mantenuto nella finestra di contesto; selezionalo con `--in-context`.
    È adatto a programmi piccoli e di breve durata.
  </Accordion>
  <Accordion title="sqlite (sperimentale)">
    Selezionalo con `--state=sqlite`. Richiede il binario `sqlite3` nel `PATH` (se non è presente, usa il filesystem come ripiego); lo stato viene archiviato in `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (sperimentale)">
    Selezionalo con `--state=postgres`. Richiede `psql` e una stringa di connessione in `OPENPROSE_POSTGRES_URL` (impostala in `.prose/.env`).

    <Warning>
      Le credenziali Postgres vengono incluse nei log dei sotto-agenti. Usa un database dedicato con privilegi minimi.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sicurezza

Tratta i file `.prose` come codice. Esaminali prima di eseguirli, incluse le importazioni `use` remote. Le richieste `/prose run https://...` di primo livello sono esplicite, ma le importazioni remote transitive richiedono l'approvazione per ogni esecuzione prima di essere recuperate o eseguite. Usa gli elenchi consentiti degli strumenti e i controlli di approvazione di OpenClaw per controllare gli effetti collaterali. Per workflow deterministici soggetti ad approvazione, confronta con [Lobster](/it/tools/lobster).

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Riferimento per Skills" href="/it/tools/skills" icon="puzzle-piece">
    Come viene caricato il pacchetto di Skills di OpenProse e quali controlli si applicano.
  </Card>
  <Card title="Sotto-agenti" href="/it/tools/subagents" icon="users">
    Il livello nativo di coordinamento multi-agente di OpenClaw.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="volume-high">
    Aggiungi un output audio ai tuoi workflow.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Tutti i comandi di chat disponibili, incluso /prose.
  </Card>
</CardGroup>

Sito ufficiale: [https://www.prose.md](https://www.prose.md)
