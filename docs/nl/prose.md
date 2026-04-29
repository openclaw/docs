---
read_when:
    - Je wilt .prose-workflows uitvoeren of schrijven
    - Je wilt de OpenProse Plugin inschakelen
    - Je moet statusopslag begrijpen
summary: 'OpenProse: .prose-workflows, slash-opdrachten en status in OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-29T23:07:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 16
---

OpenProse is een draagbare, markdown-first workflowindeling voor het orkestreren van AI-sessies. In OpenClaw wordt het geleverd als een Plugin die een OpenProse Skills-pakket plus een `/prose` slashopdracht installeert. Programma's staan in `.prose`-bestanden en kunnen meerdere sub-agents starten met expliciete besturingsstroom.

Officiële site: [https://www.prose.md](https://www.prose.md)

## Wat het kan doen

- Onderzoek met meerdere agents + synthese met expliciet parallellisme.
- Herhaalbare workflows met veilige goedkeuringen (codereview, incidenttriage, contentpijplijnen).
- Herbruikbare `.prose`-programma's die je kunt uitvoeren in ondersteunde agent-runtimes.

## Installeren + inschakelen

Gebundelde Plugins zijn standaard uitgeschakeld. Schakel OpenProse in:

```bash
openclaw plugins enable open-prose
```

Herstart de Gateway nadat je de Plugin hebt ingeschakeld.

Dev/lokale checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Gerelateerde docs: [Plugins](/nl/tools/plugin), [Plugin-manifest](/nl/plugins/manifest), [Skills](/nl/tools/skills).

## Slashopdracht

OpenProse registreert `/prose` als een door de gebruiker aanroepbare Skills-opdracht. Deze routeert naar de instructies van de OpenProse-VM en gebruikt onder de motorkap OpenClaw-tools.

Veelgebruikte opdrachten:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Voorbeeld: een eenvoudig `.prose`-bestand

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

## Bestandslocaties

OpenProse bewaart status onder `.prose/` in je workspace:

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

Persistente agents op gebruikersniveau staan in:

```
~/.prose/agents/
```

## Statusmodi

OpenProse ondersteunt meerdere statusbackends:

- **filesystem** (standaard): `.prose/runs/...`
- **in-context**: tijdelijk, voor kleine programma's
- **sqlite** (experimenteel): vereist de binary `sqlite3`
- **postgres** (experimenteel): vereist `psql` en een verbindingsreeks

Opmerkingen:

- sqlite/postgres zijn opt-in en experimenteel.
- postgres-referenties komen terecht in subagent-logs; gebruik een toegewezen DB met minimale rechten.

## Externe programma's

`/prose run <handle/slug>` wordt omgezet naar `https://p.prose.md/<handle>/<slug>`.
Directe URL's worden ongewijzigd opgehaald. Dit gebruikt de tool `web_fetch` (of `exec` voor POST).

## OpenClaw-runtimekoppeling

OpenProse-programma's worden gekoppeld aan OpenClaw-primitieven:

| OpenProse-concept         | OpenClaw-tool    |
| ------------------------- | ---------------- |
| Sessie starten / Task-tool | `sessions_spawn` |
| Bestand lezen/schrijven   | `read` / `write` |
| Web ophalen               | `web_fetch`      |

Als je tool-allowlist deze tools blokkeert, mislukken OpenProse-programma's. Zie [Skills-configuratie](/nl/tools/skills-config).

## Beveiliging + goedkeuringen

Behandel `.prose`-bestanden als code. Review ze voordat je ze uitvoert. Gebruik OpenClaw-tool-allowlists en goedkeuringspoorten om neveneffecten te beheersen.

Voor deterministische workflows met goedkeuringspoorten, vergelijk met [Lobster](/nl/tools/lobster).

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Markdown-opmaak](/nl/concepts/markdown-formatting)
