---
read_when:
    - U wilt begrijpen wat ‘context’ betekent in OpenClaw
    - Je onderzoekt waarom het model iets ‘weet’ (of is vergeten)
    - Je wilt de contextoverhead verminderen (/context, /status, /compact)
summary: 'Context: wat het model ziet, hoe die wordt opgebouwd en hoe u die kunt inspecteren'
title: Context
x-i18n:
    generated_at: "2026-07-12T08:45:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Context" is **alles wat OpenClaw voor een uitvoering naar het model stuurt**. Dit wordt begrensd door het **contextvenster** van het model (tokenlimiet).

Eenvoudig mentaal model:

- **Systeemprompt** (opgebouwd door OpenClaw): regels, tools, lijst met Skills, tijd/runtime en geïnjecteerde werkruimtebestanden.
- **Gespreksgeschiedenis**: jouw berichten + de berichten van de assistent voor deze sessie.
- **Toolaanroepen/-resultaten + bijlagen**: opdrachtuitvoer, gelezen bestanden, afbeeldingen/audio enzovoort.

Context is _niet hetzelfde_ als "geheugen": geheugen kan op schijf worden opgeslagen en later opnieuw worden geladen; context is wat zich in het huidige venster van het model bevindt.

## Snel aan de slag (context inspecteren)

- `/status` → snelle weergave van "hoe vol is mijn venster?" + sessie-instellingen.
- `/context list` → wat er wordt geïnjecteerd + geschatte grootten (per bestand + totalen).
- `/context detail` → diepgaandere uitsplitsing: grootten per bestand, per toolschema en per Skill-item, grootte van de systeemprompt en aantallen comprimeerbare transcriptberichten.
- `/context map` → WinDirStat-achtige treemapafbeelding van de bijgehouden contextbijdragen van de huidige sessie.
- `/usage tokens` → voegt aan normale antwoorden een voettekst met het gebruik per antwoord toe.
- `/compact` → vat oudere geschiedenis samen tot een compact item om ruimte in het venster vrij te maken.

Zie ook: [Slash-opdrachten](/nl/tools/slash-commands), [Tokengebruik en -kosten](/nl/reference/token-use), [Compaction](/nl/concepts/compaction).

## Voorbeelduitvoer

Waarden verschillen per model, provider, toolbeleid en inhoud van je werkruimte.

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Stuurt een afbeelding die is gegenereerd uit het meest recente gecachte uitvoeringsrapport plus het sessietranscript. Voordat een normaal bericht een uitvoeringsrapport in de sessie heeft opgeleverd, retourneert `/context map` een melding dat de functie niet beschikbaar is in plaats van een schatting weer te geven. De oppervlakte van een rechthoek is evenredig aan het aantal bijgehouden prompttekens:

- gesprekstranscript (gebruikersberichten, antwoorden van de assistent, toolresultaten, Compaction-samenvattingen), plus runtimecontext per beurt en toevoegingen aan hookprompts die alleen het model bereiken
- geïnjecteerde werkruimtebestanden
- basistekst van de systeemprompt
- promptitems van Skills
- JSON-schema's van tools

De gespreksgroep groeit mee met de sessie, waardoor de kaart per beurt verandert; na Compaction klapt deze samen tot een tegel met samenvattingen.

`/context list`, `/context detail` en `/context json` kunnen nog steeds een op aanvraag gemaakte schatting inspecteren wanneer er geen uitvoeringsrapport is gecacht.

## Wat meetelt voor het contextvenster

Alles wat het model ontvangt, telt mee, waaronder:

- Systeemprompt (alle secties).
- Gespreksgeschiedenis.
- Toolaanroepen + toolresultaten.
- Bijlagen/transcripten (afbeeldingen/audio/bestanden).
- Compaction-samenvattingen en snoeiartefacten.
- "Wrappers" of verborgen headers van de provider (niet zichtbaar, maar tellen wel mee).

## Hoe OpenClaw de systeemprompt opbouwt

De systeemprompt is **eigendom van OpenClaw** en wordt voor elke uitvoering opnieuw opgebouwd. Deze bevat:

- Lijst met tools + korte beschrijvingen.
- Lijst met Skills (alleen metadata; zie hieronder).
- Locatie van de werkruimte.
- Tijd (UTC + omgerekende gebruikerstijd indien geconfigureerd).
- Runtimemetadata (host/OS/model/denkmodus).
- Geïnjecteerde bootstrapbestanden uit de werkruimte onder **Projectcontext**.

Volledige uitsplitsing: [Systeemprompt](/nl/concepts/system-prompt).

## Geïnjecteerde werkruimtebestanden (Projectcontext)

OpenClaw injecteert standaard een vaste set werkruimtebestanden (indien aanwezig):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen bij de eerste uitvoering)

Grote bestanden worden per bestand afgekapt volgens `agents.defaults.bootstrapMaxChars` (standaard `20000` tekens). OpenClaw dwingt daarnaast een totale limiet af voor bootstrapinjectie over alle bestanden met `agents.defaults.bootstrapTotalMaxChars` (standaard `60000` tekens). `/context` toont de **onbewerkte tegenover de geïnjecteerde** grootten en of er afkapping heeft plaatsgevonden.

Wanneer afkapping optreedt, kan de runtime onder Projectcontext een waarschuwingsblok in de prompt injecteren. Configureer dit met `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; standaard `always`).

## Skills: geïnjecteerd tegenover op aanvraag geladen

De systeemprompt bevat een compacte **lijst met Skills** (naam + beschrijving + locatie). Deze lijst brengt daadwerkelijke overhead met zich mee.

Instructies voor Skills worden standaard _niet_ opgenomen. Van het model wordt verwacht dat het de `SKILL.md` van de Skill `read` **alleen wanneer dat nodig is**.

## Tools: er zijn twee kostenposten

Tools beïnvloeden de context op twee manieren:

1. **Tekst van de toollijst** in de systeemprompt (wat je als "Tooling" ziet).
2. **Toolschema's** (JSON). Deze worden naar het model gestuurd zodat het tools kan aanroepen. Ze tellen mee voor de context, ook al zie je ze niet als platte tekst.

`/context detail` splitst de grootste toolschema's uit, zodat je kunt zien wat het meeste ruimte inneemt.

## Opdrachten, richtlijnen en "inline-snelkoppelingen"

Slash-opdrachten worden door de Gateway verwerkt. Er zijn enkele verschillende gedragingen:

- **Zelfstandige opdrachten**: een bericht dat alleen uit `/...` bestaat, wordt als opdracht uitgevoerd.
- **Richtlijnen**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` worden verwijderd voordat het model het bericht ziet.
  - Berichten die alleen uit richtlijnen bestaan, slaan sessie-instellingen blijvend op.
  - Inline-richtlijnen in een normaal bericht werken als aanwijzingen per bericht.
- **Inline-snelkoppelingen** (alleen afzenders op de toestemmingslijst): bepaalde `/...`-tokens in een normaal bericht kunnen onmiddellijk worden uitgevoerd (voorbeeld: "hé /status") en worden verwijderd voordat het model de resterende tekst ziet.

Details: [Slash-opdrachten](/nl/tools/slash-commands).

## Sessies, Compaction en snoeien (wat behouden blijft)

Wat tussen berichten behouden blijft, hangt af van het mechanisme:

- **Normale geschiedenis** blijft in het sessietranscript staan totdat deze volgens beleid wordt gecomprimeerd of gesnoeid.
- **Compaction** slaat een samenvatting op in het transcript en houdt recente berichten intact.
- **Snoeien** verwijdert oude toolresultaten uit de prompt _in het geheugen_ om ruimte in het contextvenster vrij te maken, maar herschrijft het sessietranscript niet: de volledige geschiedenis blijft op schijf inspecteerbaar.

Documentatie: [Sessie](/nl/concepts/session), [Compaction](/nl/concepts/compaction), [Sessiesnoeiing](/nl/concepts/session-pruning).

OpenClaw gebruikt standaard de ingebouwde `legacy`-contextengine voor samenstelling en
Compaction. Als je een Plugin installeert die `kind: "context-engine"` aanbiedt en
deze selecteert met `plugins.slots.contextEngine`, delegeert OpenClaw de
contextsamenstelling, `/compact` en gerelateerde levenscyclus-hooks voor de context van subagents naar die
engine. `ownsCompaction: false` schakelt niet automatisch terug naar de `legacy`-
engine; de actieve engine moet `compact()` nog steeds correct implementeren. Zie
[Contextengine](/nl/concepts/context-engine) voor de volledige
inplugbare interface, levenscyclus-hooks en configuratie.

## Wat `/context` daadwerkelijk rapporteert

`/context` geeft indien beschikbaar de voorkeur aan het meest recente **tijdens de uitvoering opgebouwde** systeempromptrapport:

- `System prompt (run)` = vastgelegd tijdens de laatste ingebedde uitvoering (met toolmogelijkheden) en opgeslagen in de sessieopslag.
- `System prompt (estimate)` = direct berekend wanneer er geen uitvoeringsrapport bestaat (of wanneer de uitvoering plaatsvindt via een CLI-backend die het rapport niet genereert).

In beide gevallen rapporteert het grootten en de grootste bijdragen; het dumpt **niet** de volledige systeemprompt of toolschema's. In de gedetailleerde modus vergelijkt het bovendien het sessietranscript met hetzelfde predicaat voor echte gespreksberichten dat door Compaction wordt gebruikt, zodat hoog prompt-/cachegebruik gemakkelijker te onderscheiden is van comprimeerbare gespreksgeschiedenis.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Contextengine" href="/nl/concepts/context-engine" icon="puzzle-piece">
    Aangepaste contextinjectie via Plugins.
  </Card>
  <Card title="Compaction" href="/nl/concepts/compaction" icon="compress">
    Lange gesprekken samenvatten om ze binnen het modelvenster te houden.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Hoe de systeemprompt wordt opgebouwd en wat deze elke beurt injecteert.
  </Card>
  <Card title="Agentlus" href="/nl/concepts/agent-loop" icon="arrows-rotate">
    De volledige uitvoeringscyclus van een agent, van binnenkomend bericht tot definitief antwoord.
  </Card>
</CardGroup>
