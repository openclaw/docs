---
read_when:
    - Vuoi eseguire o scrivere flussi di lavoro `.prose`
    - Vuoi abilitare il Plugin OpenProse
    - Ti serve capire l'archiviazione dello stato
summary: 'OpenProse: flussi di lavoro `.prose`, comandi slash e stato in OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T08:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse è un formato di workflow portabile e markdown-first per orchestrare sessioni AI. In OpenClaw viene distribuito come Plugin che installa un pacchetto di Skills OpenProse più un comando slash `/prose`. I programmi vivono in file `.prose` e possono generare più sotto-agenti con controllo di flusso esplicito.

Sito ufficiale: [https://www.prose.md](https://www.prose.md)

## Cosa può fare

- Ricerca + sintesi multi-agente con parallelismo esplicito.
- Flussi di lavoro ripetibili e sicuri rispetto alle approvazioni (code review, triage degli incidenti, pipeline di contenuti).
- Programmi `.prose` riutilizzabili che puoi eseguire su runtime di agenti supportati.

## Installazione + abilitazione

I Plugin inclusi sono disabilitati per impostazione predefinita. Abilita OpenProse:

```bash
openclaw plugins enable open-prose
```

Riavvia il Gateway dopo aver abilitato il Plugin.

Checkout dev/locale: `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentazione correlata: [Plugins](/it/tools/plugin), [Plugin manifest](/it/plugins/manifest), [Skills](/it/tools/skills).

## Comando slash

OpenProse registra `/prose` come comando skill invocabile dall'utente. Instrada verso le istruzioni della VM OpenProse e usa sotto il cofano gli strumenti OpenClaw.

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

OpenProse mantiene lo stato sotto `.prose/` nel tuo spazio di lavoro:

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

Gli agenti persistenti a livello utente vivono in:

```
~/.prose/agents/
```

## Modalità di stato

OpenProse supporta più backend di stato:

- **filesystem** (predefinito): `.prose/runs/...`
- **in-context**: transitorio, per piccoli programmi
- **sqlite** (sperimentale): richiede il binario `sqlite3`
- **postgres** (sperimentale): richiede `psql` e una stringa di connessione

Note:

- sqlite/postgres sono opt-in e sperimentali.
- Le credenziali postgres fluiscono nei log dei sotto-agenti; usa un DB dedicato con privilegi minimi.

## Programmi remoti

`/prose run <handle/slug>` viene risolto in `https://p.prose.md/<handle>/<slug>`.
Gli URL diretti vengono recuperati così come sono. Questo usa lo strumento `web_fetch` (oppure `exec` per POST).

## Mappatura del runtime OpenClaw

I programmi OpenProse vengono mappati su primitive OpenClaw:

| Concetto OpenProse | Strumento OpenClaw |
| ------------------------- | ---------------- |
| Genera sessione / strumento Task | `sessions_spawn` |
| Lettura/scrittura file | `read` / `write` |
| Web fetch | `web_fetch` |

Se la tua allowlist degli strumenti blocca questi strumenti, i programmi OpenProse falliranno. Vedi [Skills config](/it/tools/skills-config).

## Sicurezza + approvazioni

Tratta i file `.prose` come codice. Esaminali prima di eseguirli. Usa le allowlist degli strumenti OpenClaw e i punti di approvazione per controllare gli effetti collaterali.

Per flussi di lavoro deterministici e controllati da approvazione, confronta con [Lobster](/it/tools/lobster).

## Correlati

- [Text-to-speech](/it/tools/tts)
- [Markdown formatting](/it/concepts/markdown-formatting)
