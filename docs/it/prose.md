---
read_when:
    - Vuoi eseguire o scrivere file di workflow .prose
    - Vuoi abilitare il plugin OpenProse
    - Devi capire come OpenProse si mappa sulle primitive di OpenClaw
sidebarTitle: OpenProse
summary: OpenProse è un formato di flusso di lavoro orientato a Markdown per sessioni IA multi-agente. In OpenClaw viene distribuito come plugin con un comando slash /prose e un pacchetto Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:04:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse è un formato di workflow portabile, incentrato su Markdown, per orchestrare
sessioni di IA. In OpenClaw viene distribuito come plugin che installa un pacchetto di skill
OpenProse e un comando slash `/prose`. I programmi risiedono in file `.prose` e possono
generare più sub-agent con flusso di controllo esplicito.

<CardGroup cols={3}>
  <Card title="Installa" icon="download" href="#install">
    Abilita il plugin OpenProse e riavvia il Gateway.
  </Card>
  <Card title="Esegui un programma" icon="play" href="#slash-command">
    Usa `/prose run` per eseguire un file `.prose` o un programma remoto.
  </Card>
  <Card title="Scrivi programmi" icon="pencil" href="#example">
    Crea workflow multi-agent con passaggi paralleli e sequenziali.
  </Card>
</CardGroup>

## Installa

<Steps>
  <Step title="Abilita il plugin">
    I plugin inclusi sono disabilitati per impostazione predefinita. Abilita OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifica">
    ```bash
    openclaw plugins list | grep prose
    ```

    Dovresti vedere `open-prose` come abilitato. Il comando skill `/prose` è ora
    disponibile in chat.

  </Step>
</Steps>

Per un checkout locale: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Comando slash

OpenProse registra `/prose` come comando skill richiamabile dall'utente:

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
Gli URL diretti vengono recuperati così come sono usando lo strumento `web_fetch`.

Le esecuzioni remote di primo livello sono esplicite. Gli import remoti dentro un programma `.prose` sono
dipendenze di codice transitive: prima che OpenProse recuperi qualsiasi destinazione remota `use`,
mostra l'elenco degli import risolti e richiede all'operatore di rispondere esattamente
`approve remote prose imports` per quell'esecuzione.

## Cosa può fare

- Ricerca e sintesi multi-agent con parallelismo esplicito.
- Workflow ripetibili e sicuri tramite approvazione (revisione del codice, triage degli incidenti, pipeline di contenuti).
- Programmi `.prose` riutilizzabili che puoi eseguire sui runtime agent supportati.

## Esempio: ricerca parallela e sintesi

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

I programmi OpenProse vengono mappati sulle primitive OpenClaw:

| Concetto OpenProse        | Strumento OpenClaw |
| ------------------------- | ------------------ |
| Spawn session / Task tool | `sessions_spawn`   |
| File read / write         | `read` / `write`   |
| Web fetch                 | `web_fetch`        |

<Warning>
  Se la tua allowlist degli strumenti blocca `sessions_spawn`, `read`, `write` o
  `web_fetch`, i programmi OpenProse non riusciranno. Controlla la tua
  [configurazione della allowlist degli strumenti](/it/gateway/config-tools).
</Warning>

## Posizioni dei file

OpenProse conserva lo stato sotto `.prose/` nel tuo workspace:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Gli agent persistenti a livello utente si trovano in:

```text
~/.prose/agents/
```

## Backend di stato

<AccordionGroup>
  <Accordion title="filesystem (predefinito)">
    Lo stato viene scritto in `.prose/runs/...` nel workspace. Non sono richieste
    dipendenze aggiuntive.
  </Accordion>
  <Accordion title="in-context">
    Stato transitorio mantenuto nella finestra di contesto. Adatto a programmi
    piccoli e di breve durata.
  </Accordion>
  <Accordion title="sqlite (sperimentale)">
    Richiede il binario `sqlite3` in `PATH`.
  </Accordion>
  <Accordion title="postgres (sperimentale)">
    Richiede `psql` e una stringa di connessione.

    <Warning>
      Le credenziali Postgres finiscono nei log dei sub-agent. Usa un database dedicato
      con privilegi minimi.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sicurezza

Tratta i file `.prose` come codice. Esaminali prima di eseguirli, inclusi gli import remoti
`use`. Le richieste `/prose run https://...` di primo livello sono esplicite, ma
gli import remoti transitivi richiedono approvazione per ogni esecuzione prima di essere recuperati o
eseguiti. Usa le allowlist degli strumenti e i gate di approvazione di OpenClaw per controllare gli
effetti collaterali. Per workflow deterministici con approvazione obbligatoria, confronta con
[Lobster](/it/tools/lobster).

## Correlati

<CardGroup cols={2}>
  <Card title="Riferimento Skills" href="/it/tools/skills" icon="puzzle-piece">
    Come viene caricato il pacchetto skill di OpenProse e quali gate si applicano.
  </Card>
  <Card title="Subagent" href="/it/tools/subagents" icon="users">
    Il livello di coordinamento multi-agent nativo di OpenClaw.
  </Card>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="volume-high">
    Aggiungi output audio ai tuoi workflow.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Tutti i comandi chat disponibili, incluso /prose.
  </Card>
</CardGroup>

Sito ufficiale: [https://www.prose.md](https://www.prose.md)
