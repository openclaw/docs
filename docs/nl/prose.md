---
read_when:
    - U wilt .prose-workflowbestanden uitvoeren of schrijven
    - U wilt de OpenProse-plugin inschakelen
    - U moet begrijpen hoe OpenProse wordt gekoppeld aan OpenClaw-primitieven
sidebarTitle: OpenProse
summary: OpenProse is een workflowindeling met Markdown als uitgangspunt voor AI-sessies met meerdere agents. In OpenClaw wordt het geleverd als een Plugin met een `/prose`-slashcommando en een Skillspakket.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T09:17:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse is een overdraagbare, op Markdown gerichte workflowindeling voor het orkestreren van AI-sessies. In OpenClaw wordt het geleverd als een Plugin die een OpenProse-skillpakket en een slashopdracht `/prose` installeert. Programma's staan in `.prose`-bestanden en kunnen meerdere subagents starten met een expliciete besturingsstroom.

<CardGroup cols={3}>
  <Card title="Installeren" icon="download" href="#install">
    Schakel de OpenProse-Plugin in en start de Gateway opnieuw.
  </Card>
  <Card title="Een programma uitvoeren" icon="play" href="#slash-command">
    Gebruik `/prose run` om een `.prose`-bestand of extern programma uit te voeren.
  </Card>
  <Card title="Programma's schrijven" icon="pencil" href="#example-parallel-research-and-synthesis">
    Schrijf multiagentworkflows met parallelle en opeenvolgende stappen.
  </Card>
</CardGroup>

## Installeren

<Steps>
  <Step title="De Plugin inschakelen">
    OpenProse wordt meegeleverd, maar is standaard uitgeschakeld. Schakel het in:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="De Gateway opnieuw starten">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifiëren">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` moet als ingeschakeld worden weergegeven. De skillopdracht
    `/prose` is nu beschikbaar in de chat.

  </Step>
</Steps>

Vanuit een uitgecheckte repository kunt u de Plugin rechtstreeks installeren:
`openclaw plugins install ./extensions/open-prose`

## Slashopdracht

OpenProse registreert `/prose` als een door de gebruiker aanroepbare skillopdracht:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` wordt omgezet naar `https://p.prose.md/<handle>/<slug>`.
Rechtstreekse URL's worden ongewijzigd opgehaald met het hulpprogramma `web_fetch`.

Externe uitvoeringen op het hoogste niveau zijn expliciet. Externe imports binnen een `.prose`-programma zijn transitieve codeafhankelijkheden: voordat OpenProse een extern `use`-doel ophaalt, toont het de opgeloste importlijst en moet de beheerder voor die uitvoering exact antwoorden met `approve remote prose imports`.

## Mogelijkheden

- Multiagentonderzoek en -synthese met expliciet parallellisme.
- Herhaalbare workflows met veilige goedkeuringen (codebeoordeling, incidenttriage, inhoudspijplijnen).
- Herbruikbare `.prose`-programma's die u in ondersteunde agentruntimes kunt uitvoeren.

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

## Toewijzing aan de OpenClaw-runtime

OpenProse-programma's worden toegewezen aan OpenClaw-primitieven:

| OpenProse-concept          | OpenClaw-hulpprogramma                           |
| ------------------------- | ----------------------------------------------- |
| Sessie starten / Task-hulpprogramma | `sessions_spawn`                        |
| Bestand lezen / schrijven | `read` / `write`                                |
| Webinhoud ophalen         | `web_fetch` (`exec` + curl wanneer POST nodig is) |

<Warning>
  Als uw lijst met toegestane hulpprogramma's `sessions_spawn`, `read`, `write`
  of `web_fetch` blokkeert, mislukken OpenProse-programma's. Controleer uw
  [configuratie van de lijst met toegestane hulpprogramma's](/nl/gateway/config-tools).
</Warning>

## Bestandslocaties

OpenProse bewaart de status onder `.prose/` in uw werkruimte:

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

Permanente agents op gebruikersniveau, die tussen projecten worden gedeeld, staan in:

```text
~/.prose/agents/
```

## Statusbackends

<AccordionGroup>
  <Accordion title="bestandssysteem (standaard)">
    De status wordt naar `.prose/runs/...` in de werkruimte geschreven. Er zijn
    geen extra afhankelijkheden vereist.
  </Accordion>
  <Accordion title="in context">
    Tijdelijke status die in het contextvenster wordt bewaard; selecteer deze met
    `--in-context`. Geschikt voor kleine, kortstondige programma's.
  </Accordion>
  <Accordion title="sqlite (experimenteel)">
    Selecteer deze met `--state=sqlite`. Vereist het binaire bestand `sqlite3` in
    `PATH` (valt terug op het bestandssysteem als dit ontbreekt); de status wordt
    opgeslagen in `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (experimenteel)">
    Selecteer deze met `--state=postgres`. Vereist `psql` en een verbindingsreeks
    in `OPENPROSE_POSTGRES_URL` (stel deze in via `.prose/.env`).

    <Warning>
      Postgres-inloggegevens komen in de logboeken van subagents terecht. Gebruik
      een aparte database met minimale bevoegdheden.
    </Warning>

  </Accordion>
</AccordionGroup>

## Beveiliging

Behandel `.prose`-bestanden als code. Beoordeel ze vóór uitvoering, inclusief externe `use`-imports. Verzoeken van het hoogste niveau met `/prose run https://...` zijn expliciet, maar transitieve externe imports vereisen per uitvoering goedkeuring voordat ze worden opgehaald of uitgevoerd. Gebruik lijsten met toegestane OpenClaw-hulpprogramma's en goedkeuringspoorten om neveneffecten te beheren. Vergelijk voor deterministische workflows met verplichte goedkeuring met [Lobster](/nl/tools/lobster).

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills-referentie" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe het skillpakket van OpenProse wordt geladen en welke poorten van toepassing zijn.
  </Card>
  <Card title="Subagents" href="/nl/tools/subagents" icon="users">
    De ingebouwde multiagentcoördinatielaag van OpenClaw.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="volume-high">
    Voeg audio-uitvoer toe aan uw workflows.
  </Card>
  <Card title="Slashopdrachten" href="/nl/tools/slash-commands" icon="terminal">
    Alle beschikbare chatopdrachten, waaronder /prose.
  </Card>
</CardGroup>

Officiële website: [https://www.prose.md](https://www.prose.md)
