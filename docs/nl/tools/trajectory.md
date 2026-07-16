---
read_when:
    - Fouten opsporen om te achterhalen waarom een agent op een bepaalde manier antwoordde, faalde of tools aanriep
    - Een ondersteuningsbundel voor een OpenClaw-sessie exporteren
    - Promptcontext, toolaanroepen, runtimefouten of gebruiksmetadata onderzoeken
    - Trajectregistratie uitschakelen
summary: Geanonimiseerde trajectbundels exporteren om fouten in een OpenClaw-agentsessie op te sporen
title: Trajectbundels
x-i18n:
    generated_at: "2026-07-16T16:32:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectoryregistratie is OpenClaws vluchtrecorder per sessie. Deze registreert een
gestructureerde tijdlijn voor elke agentuitvoering, waarna `/export-trajectory` de
huidige sessie verpakt in een geredigeerde supportbundel met:

- De prompt, systeemprompt en tools die naar het model zijn verzonden
- Welke transcriptberichten en toolaanroepen tot een antwoord hebben geleid
- Of de uitvoering een time-out kreeg, werd afgebroken, gecompacteerd of een providerfout ondervond
- Welke modellen, plugins, Skills en runtime-instellingen actief waren
- Gebruiks- en promptcachemetadata die de provider heeft geretourneerd

Begin voor een breed Gateway-supportrapport in plaats daarvan met
[`/diagnostics`](/nl/gateway/diagnostics#chat-command); dit verzamelt de
opgeschoonde Gateway-bundel en kan voor OpenAI Codex-harness-sessies na
goedkeuring Codex-feedback naar OpenAI verzenden. Gebruik `/export-trajectory`
wanneer je de gedetailleerde tijdlijn per sessie met prompts, tools en het
transcript nodig hebt.

## Snel aan de slag

Verzend in de actieve sessie (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw schrijft de bundel onder de werkruimte:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Geef een relatieve naam voor de uitvoermap op om deze te overschrijven:

```text
/export-trajectory bug-1234
```

De naam wordt binnen `.openclaw/trajectory-exports/` opgelost. Absolute paden en
`~`-paden worden geweigerd.

Trajectorybundels kunnen prompts, modelberichten, toolschema's, toolresultaten,
runtimegebeurtenissen en lokale paden bevatten. Daarom doorloopt de chatopdracht
altijd uitvoeringsgoedkeuring. Keur de export eenmaal goed wanneer je de bundel
wilt maken; gebruik niet alles toestaan. In groepschats stuurt OpenClaw de
goedkeuringsprompt en het exportresultaat privé naar de eigenaar, in plaats van
trajectorydetails terug te plaatsen in de gedeelde ruimte.

Voer voor lokale inspectie of supportworkflows de onderliggende CLI-opdracht
rechtstreeks uit:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Andere vlaggen: `--output <path>` (mapnaam binnen
`.openclaw/trajectory-exports`), `--store <path>` (overschrijving van de sessieopslag),
`--agent <id>` (agent-id voor opslagresolutie), `--json` (gestructureerde uitvoer).

## Toegang

Trajectoryexport is een eigenaarsopdracht. De afzender moet slagen voor de
normale autorisatiecontroles voor opdrachten en voor de eigenaarscontrole van
het kanaal.

## Wat wordt geregistreerd

Trajectoryregistratie is standaard ingeschakeld voor OpenClaw-agentuitvoeringen.

Runtimegebeurtenissen omvatten:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusief het bronmodel, volgende model, reden/details van de fout, positie in de keten en of de keten doorging, slaagde of uitgeput raakte
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcriptgebeurtenissen worden gereconstrueerd uit de actieve sessietak:
gebruikersberichten, assistentberichten, toolaanroepen, toolresultaten,
compactions, modelwijzigingen, labels en aangepaste sessievermeldingen.

Gebeurtenissen worden als JSON Lines geschreven met deze schemamarkering:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundelbestanden

| Bestand                  | Inhoud                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundelschema, bronbestanden, aantallen gebeurtenissen en lijst met gegenereerde bestanden      |
| `events.jsonl`       | Geordende tijdlijn van runtime- en transcriptgebeurtenissen                                    |
| `session-branch.json`       | Geredigeerde actieve transcripttak en sessieheader                                              |
| `metadata.json`       | OpenClaw-versie, besturingssysteem/runtime, model, configuratiemomentopname, plugins, Skills en promptmetadata |
| `artifacts.json`       | Eindstatus, fouten, gebruik, promptcache, aantal compactions, assistenttekst en toolmetadata    |
| `prompts.json`       | Ingediende prompts en geselecteerde details over de opbouw van prompts                          |
| `system-prompt.txt`       | Laatst gecompileerde systeemprompt, indien geregistreerd                                        |
| `tools.json`       | Tooldefinities die naar het model zijn verzonden, indien geregistreerd                         |

`manifest.json` vermeldt welke bestanden in een bepaalde bundel aanwezig
zijn; sommige bestanden worden weggelaten wanneer de sessie de bijbehorende
runtimegegevens niet heeft geregistreerd.

## Opslag van registraties

Runtime-trajectorygebeurtenissen worden samen met de sessie opgeslagen in de
SQLite-database per agent. Bij het exporteren van een trajectory wordt een
geredigeerde JSONL-supportbundel gegenereerd; de actieve runtimeregistratie is
geen JSONL-zijbestand naast de sessie.

Verouderde `.trajectory.jsonl`- en `.trajectory-path.json`-bestanden kunnen nog
voorkomen door oudere releases of expliciete exports naar verouderde bestanden.
Sessieonderhoud behandelt die bestanden als opruimdoelen; actieve registratie
schrijft databaserijen.

## Registratie uitschakelen

```bash
export OPENCLAW_TRAJECTORY=0
```

Dit schakelt runtime-trajectoryregistratie uit voordat OpenClaw wordt gestart.
`/export-trajectory` kan de transcripttak nog steeds exporteren, maar gegevens die
alleen tijdens runtime beschikbaar zijn, zoals gecompileerde context,
providerartefacten en promptmetadata, kunnen ontbreken.

## Time-out voor flush aanpassen

OpenClaw flusht runtime-trajectoryrijen tijdens het opruimen van de agent. De
standaardtime-out voor opruimen is 10,000 ms. Stel op langzame schijven of bij
grote opslagvolumes `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` in voordat je OpenClaw start:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Dit bepaalt wanneer OpenClaw een `openclaw-trajectory-flush`-time-out registreert en
doorgaat; het wijzigt de maximale trajectorygrootte niet. Stel
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` in om alle opruimstappen van de agent aan te passen die geen
expliciete time-out doorgeven.

## Privacy en limieten

Trajectorybundels zijn bedoeld voor support en foutopsporing, niet voor
openbare publicatie. OpenClaw redigeert gevoelige waarden voordat
exportbestanden worden geschreven:

- referenties en bekende payloadvelden die op geheimen lijken
- afbeeldingsgegevens
- lokale statuspaden
- werkruimtepaden, vervangen door `$WORKSPACE_DIR`
- paden naar de thuismap, waar gedetecteerd

De exportfunctie begrenst ook de invoergrootte:

- runtimeregistratie: de actieve registratie is een voortschrijdend venster met een maximum van 10 MiB, waarbij de oudste gebeurtenissen worden verwijderd om ruimte te maken voor nieuwe; bij export worden bestaande verouderde runtimezijbestanden tot 50 MiB geaccepteerd
- sessiebestanden: 50 MiB
- runtimegebeurtenissen per export: 200,000
- totaal aantal geëxporteerde gebeurtenissen: 250,000
- afzonderlijke regels met runtimegebeurtenissen worden boven 256 KiB afgekapt

Controleer bundels voordat je ze buiten je team deelt. Redigering gebeurt naar
beste vermogen en kan niet elk toepassingsspecifiek geheim herkennen.

## Problemen oplossen

Als de export geen runtimegebeurtenissen bevat:

- controleer of OpenClaw zonder `OPENCLAW_TRAJECTORY=0` is gestart
- voer nog een bericht uit in de sessie en exporteer opnieuw
- controleer `manifest.json` op `runtimeEventCount`

Als de opdracht het uitvoerpad weigert:

- gebruik een relatieve naam zoals `bug-1234`
- geef `/tmp/...` of `~/...` niet door
- bewaar de export binnen `.openclaw/trajectory-exports/`

Als de export mislukt met een groottefout, heeft de sessie of het zijbestand de
bovenstaande veiligheidslimieten voor export overschreden. Start een nieuwe
sessie of exporteer een kleinere reproductie.

## Gerelateerd

- [Verschillen](/nl/tools/diffs)
- [Sessiebeheer](/nl/concepts/session)
- [Uitvoeringstool](/nl/tools/exec)
