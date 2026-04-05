---
read_when:
    - Vuoi eseguire o scrivere workflow `.prose`
    - Vuoi abilitare il plugin OpenProse
    - Hai bisogno di capire l'archiviazione dello stato
summary: 'OpenProse: workflow `.prose`, slash command e stato in OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T14:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse è un formato di workflow portabile, markdown-first, per orchestrare sessioni AI. In OpenClaw viene distribuito come plugin che installa un pacchetto Skills OpenProse più uno slash command `/prose`. I programmi vivono in file `.prose` e possono generare più sub-agent con un controllo di flusso esplicito.

Sito ufficiale: [https://www.prose.md](https://www.prose.md)

## Cosa può fare

- Ricerca + sintesi multi-agente con parallelismo esplicito.
- Workflow ripetibili e sicuri rispetto alle approvazioni (code review, triage degli incidenti, pipeline di contenuti).
- Programmi `.prose` riutilizzabili che puoi eseguire nei runtime agente supportati.

## Installazione + abilitazione

I plugin inclusi sono disabilitati per impostazione predefinita. Abilita OpenProse:

```bash
openclaw plugins enable open-prose
```

Riavvia il Gateway dopo aver abilitato il plugin.

Checkout dev/locale: `openclaw plugins install ./path/to/local/open-prose-plugin`

Documenti correlati: [Plugin](/tools/plugin), [Manifest del plugin](/plugins/manifest), [Skills](/tools/skills).

## Slash command

OpenProse registra `/prose` come comando Skill invocabile dall'utente. Instrada verso le istruzioni della VM OpenProse e usa i tool OpenClaw dietro le quinte.

Comandi comuni:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Esempio: un semplice file `.prose`

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

## Posizioni dei file

OpenProse mantiene lo stato sotto `.prose/` nel tuo workspace:

```
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

Gli agenti persistenti a livello utente si trovano in:

```
~/.prose/agents/
```

## Modalità di stato

OpenProse supporta più backend di stato:

- **filesystem** (predefinito): `.prose/runs/...`
- **in-context**: temporaneo, per programmi piccoli
- **sqlite** (sperimentale): richiede il binario `sqlite3`
- **postgres** (sperimentale): richiede `psql` e una stringa di connessione

Note:

- sqlite/postgres sono opt-in e sperimentali.
- Le credenziali postgres confluiscono nei log dei subagent; usa un database dedicato con privilegi minimi.

## Programmi remoti

`/prose run <handle/slug>` viene risolto in `https://p.prose.md/<handle>/<slug>`.
Gli URL diretti vengono recuperati così come sono. Questo usa il tool `web_fetch` (o `exec` per POST).

## Mappatura del runtime OpenClaw

I programmi OpenProse vengono mappati su primitive OpenClaw:

| Concetto OpenProse         | Tool OpenClaw    |
| -------------------------- | ---------------- |
| Generazione sessione / tool Task | `sessions_spawn` |
| Lettura/scrittura file     | `read` / `write` |
| Web fetch                  | `web_fetch`      |

Se la tua allowlist dei tool blocca questi tool, i programmi OpenProse falliranno. Vedi [Configurazione Skills](/tools/skills-config).

## Sicurezza + approvazioni

Tratta i file `.prose` come codice. Rivedili prima di eseguirli. Usa le allowlist dei tool OpenClaw e i gate di approvazione per controllare gli effetti collaterali.

Per workflow deterministici con gate di approvazione, confronta con [Lobster](/tools/lobster).
