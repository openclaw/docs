---
read_when:
    - U wilt .prose-workflowbestanden uitvoeren of schrijven
    - U wilt de OpenProse Plugin inschakelen
    - Je moet begrijpen hoe OpenProse wordt gekoppeld aan OpenClaw-primitieven
sidebarTitle: OpenProse
summary: OpenProse is een op markdown gerichte workflowindeling voor AI-sessies met meerdere agents. In OpenClaw wordt het geleverd als een Plugin met een /prose-slashcommand en een skillpakket.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse is een draagbaar, markdown-eerst workflowformaat voor het orkestreren van AI-sessies. In OpenClaw wordt het geleverd als een Plugin die een OpenProse-skillpakket en een `/prose` slash-command installeert. Programma's staan in `.prose`-bestanden en kunnen meerdere subagents starten met expliciete control flow.

<CardGroup cols={3}>
  <Card title="Installeren" icon="download" href="#install">
    Schakel de OpenProse-Plugin in en herstart de Gateway.
  </Card>
  <Card title="Een programma uitvoeren" icon="play" href="#slash-command">
    Gebruik `/prose run` om een `.prose`-bestand of extern programma uit te voeren.
  </Card>
  <Card title="Programma's schrijven" icon="pencil" href="#example">
    Maak workflows met meerdere agents met parallelle en sequentiële stappen.
  </Card>
</CardGroup>

## Installeren

<Steps>
  <Step title="De Plugin inschakelen">
    Gebundelde plugins zijn standaard uitgeschakeld. Schakel OpenProse in:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="De Gateway herstarten">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifiëren">
    ```bash
    openclaw plugins list | grep prose
    ```

    Je zou moeten zien dat `open-prose` is ingeschakeld. Het `/prose` Skills-commando is nu beschikbaar in chat.

  </Step>
</Steps>

Voor een lokale checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Slash-command

OpenProse registreert `/prose` als een door de gebruiker aanroepbaar Skills-commando:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` wordt omgezet naar `https://p.prose.md/<handle>/<slug>`. Directe URL's worden ongewijzigd opgehaald met de tool `web_fetch`.

Remote runs op topniveau zijn expliciet. Remote imports binnen een `.prose`-programma zijn transitieve codeafhankelijkheden: voordat OpenProse een remote `use`-doel ophaalt, toont het de opgeloste importlijst en vereist het dat de operator exact antwoordt met `approve remote prose imports` voor die run.

## Wat het kan doen

- Onderzoek en synthese met meerdere agents en expliciete parallelliteit.
- Herhaalbare, approval-veilige workflows (codereview, incidenttriage, contentpijplijnen).
- Herbruikbare `.prose`-programma's die je kunt uitvoeren op ondersteunde agent-runtimes.

## Voorbeeld: parallel onderzoek en synthese

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

## OpenClaw-runtimekoppeling

OpenProse-programma's worden gekoppeld aan OpenClaw-primitieven:

| OpenProse-concept         | OpenClaw-tool    |
| ------------------------- | ---------------- |
| Sessie starten / Task-tool | `sessions_spawn` |
| Bestand lezen / schrijven | `read` / `write` |
| Web ophalen               | `web_fetch`      |

<Warning>
  Als je tool-allowlist `sessions_spawn`, `read`, `write` of `web_fetch` blokkeert, zullen OpenProse-programma's mislukken. Controleer je [configuratie voor tool-allowlists](/nl/gateway/config-tools).
</Warning>

## Bestandslocaties

OpenProse bewaart status onder `.prose/` in je workspace:

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

Persistente agents op gebruikersniveau staan op:

```text
~/.prose/agents/
```

## State-backends

<AccordionGroup>
  <Accordion title="filesystem (default)">
    State wordt geschreven naar `.prose/runs/...` in de workspace. Geen extra afhankelijkheden vereist.
  </Accordion>
  <Accordion title="in-context">
    Tijdelijke state die in het contextvenster wordt bewaard. Geschikt voor kleine, kortlevende programma's.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Vereist de `sqlite3`-binary op `PATH`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Vereist `psql` en een connection string.

    <Warning>
      Postgres-inloggegevens komen terecht in subagent-logs. Gebruik een toegewezen database met minimale rechten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Beveiliging

Behandel `.prose`-bestanden als code. Review ze voordat je ze uitvoert, inclusief remote `use`-imports. Top-level `/prose run https://...`-verzoeken zijn expliciet, maar transitieve remote imports vereisen goedkeuring per run voordat ze worden opgehaald of uitgevoerd. Gebruik OpenClaw-tool-allowlists en approval gates om neveneffecten te beheersen. Vergelijk voor deterministische workflows met approval gates met [Lobster](/nl/tools/lobster).

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills-referentie" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe het skillpakket van OpenProse wordt geladen en welke gates gelden.
  </Card>
  <Card title="Subagents" href="/nl/tools/subagents" icon="users">
    OpenClaw's native coördinatielaag voor meerdere agents.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="volume-high">
    Voeg audio-uitvoer toe aan je workflows.
  </Card>
  <Card title="Slash-commands" href="/nl/tools/slash-commands" icon="terminal">
    Alle beschikbare chatcommando's, inclusief /prose.
  </Card>
</CardGroup>

Officiële site: [https://www.prose.md](https://www.prose.md)
