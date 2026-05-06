---
read_when:
    - Je wilt begrijpen wat "context" betekent in OpenClaw
    - Je debugt waarom het model iets "weet" (of het is vergeten)
    - U wilt de contextoverhead verminderen (/context, /status, /compact)
summary: 'Context: wat het model ziet, hoe het wordt opgebouwd en hoe je het inspecteert'
title: Context
x-i18n:
    generated_at: "2026-05-06T09:08:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Context" is **alles wat OpenClaw voor een uitvoering naar het model stuurt**. Dit wordt begrensd door het **contextvenster** van het model (tokenlimiet).

Mentale kapstok voor beginners:

- **Systeemprompt** (door OpenClaw gebouwd): regels, tools, Skills-lijst, tijd/runtime en geïnjecteerde werkruimtebestanden.
- **Gespreksgeschiedenis**: jouw berichten + de berichten van de assistent voor deze sessie.
- **Toolaanroepen/resultaten + bijlagen**: commandouitvoer, gelezen bestanden, afbeeldingen/audio, enz.

Context is _niet hetzelfde_ als "geheugen": geheugen kan op schijf worden opgeslagen en later opnieuw worden geladen; context is wat zich in het huidige venster van het model bevindt.

## Snel starten (context inspecteren)

- `/status` → snelle weergave van "hoe vol is mijn venster?" + sessie-instellingen.
- `/context list` → wat is geïnjecteerd + ruwe groottes (per bestand + totalen).
- `/context detail` → diepere uitsplitsing: groottes per bestand, per toolschema, per Skill-item en grootte van de systeemprompt.
- `/usage tokens` → voeg een gebruiksfooter per antwoord toe aan normale antwoorden.
- `/compact` → vat oudere geschiedenis samen tot een compacte vermelding om ruimte in het venster vrij te maken.

Zie ook: [Slash commands](/nl/tools/slash-commands), [Tokengebruik en kosten](/nl/reference/token-use), [Compaction](/nl/concepts/compaction).

## Voorbeelduitvoer

Waarden verschillen per model, provider, toolbeleid en wat er in je werkruimte staat.

### `/context list`

```
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

```
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

## Wat meetelt voor het contextvenster

Alles wat het model ontvangt telt mee, waaronder:

- Systeemprompt (alle secties).
- Gespreksgeschiedenis.
- Toolaanroepen + toolresultaten.
- Bijlagen/transcripten (afbeeldingen/audio/bestanden).
- Compaction-samenvattingen en pruning-artefacten.
- Provider-"wrappers" of verborgen headers (niet zichtbaar, tellen toch mee).

## Hoe OpenClaw de systeemprompt bouwt

De systeemprompt is **eigendom van OpenClaw** en wordt bij elke uitvoering opnieuw opgebouwd. Deze bevat:

- Toollijst + korte beschrijvingen.
- Skills-lijst (alleen metadata; zie hieronder).
- Werkruimtelocatie.
- Tijd (UTC + geconverteerde gebruikerstijd indien geconfigureerd).
- Runtime-metadata (host/OS/model/denken).
- Geïnjecteerde bootstrap-bestanden uit de werkruimte onder **Projectcontext**.

Volledige uitsplitsing: [Systeemprompt](/nl/concepts/system-prompt).

## Geïnjecteerde werkruimtebestanden (Projectcontext)

Standaard injecteert OpenClaw een vaste set werkruimtebestanden (indien aanwezig):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen eerste uitvoering)

Grote bestanden worden per bestand afgekapt met `agents.defaults.bootstrapMaxChars` (standaard `12000` tekens). OpenClaw dwingt ook een totale limiet af voor bootstrap-injectie over alle bestanden met `agents.defaults.bootstrapTotalMaxChars` (standaard `60000` tekens). `/context` toont groottes van **ruw versus geïnjecteerd** en of er is afgekapt.

Wanneer afkapping optreedt, kan de runtime een waarschuwingsblok in de prompt injecteren onder Projectcontext. Configureer dit met `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; standaard `once`).

## Skills: geïnjecteerd versus op aanvraag geladen

De systeemprompt bevat een compacte **Skills-lijst** (naam + beschrijving + locatie). Deze lijst heeft echte overhead.

Skill-instructies worden standaard _niet_ opgenomen. Van het model wordt verwacht dat het de `SKILL.md` van de Skill **alleen leest wanneer nodig**.

## Tools: er zijn twee kostenposten

Tools beïnvloeden context op twee manieren:

1. **Toollijsttekst** in de systeemprompt (wat je ziet als "Tooling").
2. **Toolschema's** (JSON). Deze worden naar het model gestuurd zodat het tools kan aanroepen. Ze tellen mee voor context, ook al zie je ze niet als platte tekst.

`/context detail` splitst de grootste toolschema's uit, zodat je kunt zien wat domineert.

## Commands, richtlijnen en "inline snelkoppelingen"

Slash commands worden afgehandeld door de Gateway. Er zijn een paar verschillende gedragingen:

- **Losse commands**: een bericht dat alleen `/...` bevat, wordt als command uitgevoerd.
- **Richtlijnen**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` worden verwijderd voordat het model het bericht ziet.
  - Berichten met alleen richtlijnen bewaren sessie-instellingen.
  - Inline richtlijnen in een normaal bericht werken als hints per bericht.
- **Inline snelkoppelingen** (alleen toegestane afzenders): bepaalde `/...`-tokens in een normaal bericht kunnen onmiddellijk worden uitgevoerd (voorbeeld: "hey /status") en worden verwijderd voordat het model de resterende tekst ziet.

Details: [Slash commands](/nl/tools/slash-commands).

## Sessies, Compaction en pruning (wat blijft bewaard)

Wat tussen berichten bewaard blijft, hangt af van het mechanisme:

- **Normale geschiedenis** blijft in het sessietranscript staan totdat deze volgens beleid wordt gecompacteerd/gepruned.
- **Compaction** bewaart een samenvatting in het transcript en houdt recente berichten intact.
- **Pruning** verwijdert oude toolresultaten uit de _in-memory_ prompt om ruimte in het contextvenster vrij te maken, maar herschrijft het sessietranscript niet - de volledige geschiedenis blijft op schijf inspecteerbaar.

Docs: [Sessie](/nl/concepts/session), [Compaction](/nl/concepts/compaction), [Sessiesnoei](/nl/concepts/session-pruning).

Standaard gebruikt OpenClaw de ingebouwde `legacy` context-engine voor assemblage en
Compaction. Als je een Plugin installeert die `kind: "context-engine"` levert en
deze selecteert met `plugins.slots.contextEngine`, delegeert OpenClaw context-
assemblage, `/compact` en gerelateerde subagent-contextlevenscyclushooks in plaats daarvan naar die
engine. `ownsCompaction: false` zorgt niet automatisch voor een fallback naar de legacy
engine; de actieve engine moet `compact()` nog steeds correct implementeren. Zie
[Context Engine](/nl/concepts/context-engine) voor de volledige
plug-inbare interface, levenscyclushooks en configuratie.

## Wat `/context` daadwerkelijk rapporteert

`/context` geeft de voorkeur aan het nieuwste **tijdens de uitvoering gebouwde** systeempromptrapport wanneer beschikbaar:

- `System prompt (run)` = vastgelegd uit de laatste embedded (tool-geschikte) uitvoering en bewaard in de sessiestore.
- `System prompt (estimate)` = direct berekend wanneer er geen uitvoeringsrapport bestaat (of wanneer er via een CLI-backend wordt uitgevoerd die het rapport niet genereert).

In beide gevallen rapporteert het groottes en belangrijkste bijdragers; het dumpt **niet** de volledige systeemprompt of toolschema's.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Context engine" href="/nl/concepts/context-engine" icon="puzzle-piece">
    Aangepaste contextinjectie via plugins.
  </Card>
  <Card title="Compaction" href="/nl/concepts/compaction" icon="compress">
    Lange gesprekken samenvatten om ze binnen het modelvenster te houden.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Hoe de systeemprompt wordt gebouwd en wat deze bij elke beurt injecteert.
  </Card>
  <Card title="Agentlus" href="/nl/concepts/agent-loop" icon="arrows-rotate">
    De volledige agentuitvoeringscyclus van binnenkomend bericht tot definitief antwoord.
  </Card>
</CardGroup>
