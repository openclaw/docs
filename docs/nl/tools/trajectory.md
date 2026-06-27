---
read_when:
    - Debuggen waarom een agent op een bepaalde manier antwoordde, faalde of tools aanriep
    - Een supportbundel exporteren voor een OpenClaw-sessie
    - Promptcontext, toolaanroepen, runtimefouten of gebruiksmetadata onderzoeken
    - Trajectorie-vastlegging uitschakelen of verplaatsen
summary: Exporteer geschoonde trajectbundels voor het debuggen van een OpenClaw-agentsessie
title: Trajectoriebundels
x-i18n:
    generated_at: "2026-06-27T18:30:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectorie-opname is OpenClaw's vluchtrecorder per sessie. Deze legt een
gestructureerde tijdlijn voor elke agent-run vast; daarna verpakt `/export-trajectory` de
huidige sessie in een geredigeerde supportbundel.

Gebruik dit wanneer je vragen moet beantwoorden zoals:

- Welke prompt, systeemprompt en tools zijn naar het model gestuurd?
- Welke transcriptberichten en toolaanroepen hebben tot dit antwoord geleid?
- Is de run verlopen, afgebroken, gecompacteerd, of is er een providerfout opgetreden?
- Welk model, welke plugins, Skills en runtime-instellingen waren actief?
- Welke gebruiks- en prompt-cachemetadata heeft de provider teruggegeven?

Als je een breed supportrapport indient voor een live Gateway-probleem, begin dan met
[`/diagnostics`](/nl/gateway/diagnostics#chat-command). Diagnostiek verzamelt de
gesaneerde Gateway-bundel en kan, voor OpenAI Codex-harnesssessies, na goedkeuring ook
Codex-feedback naar OpenAI-servers sturen. Gebruik `/export-trajectory` wanneer
je specifiek de gedetailleerde prompt-, tool- en transcripttijdlijn per sessie nodig hebt.

## Snel aan de slag

Stuur dit in de actieve sessie:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw schrijft de bundel onder de werkruimte:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Je kunt een relatieve naam voor de uitvoermap kiezen:

```text
/export-trajectory bug-1234
```

Het aangepaste pad wordt binnen `.openclaw/trajectory-exports/` opgelost. Absolute
paden en `~`-paden worden geweigerd.

Trajectoriebundels kunnen prompts, modelberichten, toolschema's, toolresultaten,
runtime-events en lokale paden bevatten. De slashopdracht in chat loopt daarom
elke keer via exec-goedkeuring. Keur de export één keer goed wanneer je de
bundel wilt maken; gebruik geen allow-all. In groepschats stuurt OpenClaw de
goedkeuringsprompt en het exportresultaat privé naar de eigenaar, in plaats van de
trajectoriedetails terug in de gedeelde ruimte te plaatsen.

Voor lokale inspectie of supportworkflows kun je ook het goedgekeurde commandopad
direct uitvoeren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Toegang

Trajectorie-export is een eigenaaropdracht. De afzender moet slagen voor de normale
autorisatiecontroles voor opdrachten en de eigenaarscontroles voor het kanaal.

## Wat wordt opgenomen

Trajectorie-opname staat standaard aan voor OpenClaw-agent-runs.

Runtime-events omvatten:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusief het bronmodel, volgende model, reden/detail van de fout, positie in de keten, en of fallback de keten heeft voortgezet, is geslaagd, of de keten heeft uitgeput
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript-events worden ook gereconstrueerd vanuit de actieve sessievertakking:

- gebruikersberichten
- assistentberichten
- toolaanroepen
- toolresultaten
- compacties
- modelwijzigingen
- labels en aangepaste sessie-items

Events worden geschreven als JSON Lines met deze schemamarkering:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundelbestanden

Een geëxporteerde bundel kan het volgende bevatten:

| Bestand               | Inhoud                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundelschema, bronbestanden, aantallen events en gegenereerde bestandslijst                    |
| `events.jsonl`        | Geordende runtime- en transcripttijdlijn                                                       |
| `session-branch.json` | Geredigeerde actieve transcriptvertakking en sessiekop                                         |
| `metadata.json`       | OpenClaw-versie, OS/runtime, model, configuratiesnapshot, plugins, Skills en promptmetadata    |
| `artifacts.json`      | Eindstatus, fouten, gebruik, prompt-cache, aantal compacties, assistenttekst en toolmetadata   |
| `prompts.json`        | Ingediende prompts en geselecteerde details voor promptopbouw                                  |
| `system-prompt.txt`   | Laatst gecompileerde systeemprompt, wanneer vastgelegd                                         |
| `tools.json`          | Tooldefinities die naar het model zijn gestuurd, wanneer vastgelegd                            |

`manifest.json` vermeldt de bestanden die in die bundel aanwezig zijn. Sommige bestanden worden weggelaten
wanneer de sessie de bijbehorende runtimedata niet heeft vastgelegd.

## Opnamelocatie

Standaard worden runtime-trajectorie-events naast het sessiebestand geschreven:

```text
<session>.trajectory.jsonl
```

OpenClaw schrijft ook een best-effort verwijzingsbestand naast de sessie:

```text
<session>.trajectory-path.json
```

Stel `OPENCLAW_TRAJECTORY_DIR` in om runtime-trajectorie-sidecars in een
speciale map op te slaan:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Wanneer deze variabele is ingesteld, schrijft OpenClaw één JSONL-bestand per sessie-id in die
map.

Sessieonderhoud verwijdert trajectorie-sidecars wanneer hun eigenaar-sessie-item
wordt opgeschoond, begrensd of verwijderd door het schijfbudget voor sessies. Runtimebestanden buiten
de sessiemap worden alleen verwijderd wanneer het verwijzingsdoel nog bewijst dat het
bij die sessie hoort.

## Opname uitschakelen

Stel `OPENCLAW_TRAJECTORY=0` in voordat je OpenClaw start:

```bash
export OPENCLAW_TRAJECTORY=0
```

Dit schakelt runtime-trajectorie-opname uit. `/export-trajectory` kan nog steeds
de transcriptvertakking exporteren, maar runtime-only bestanden zoals gecompileerde context,
providerartefacten en promptmetadata kunnen ontbreken.

## Flushtime-out afstemmen

OpenClaw flusht runtime-trajectorie-sidecars tijdens het opschonen van de agent. De standaard
opschoontime-out is 10.000 ms. Stel op trage schijven of grote opslagplaatsen
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` in voordat je OpenClaw start:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Dit bepaalt wanneer OpenClaw een `openclaw-trajectory-flush`-time-out logt en doorgaat.
Het wijzigt de groottelimieten voor trajectorieën niet. Stel `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` in
om alle opschoonstappen van agents af te stemmen die geen expliciete time-out doorgeven.

## Privacy en limieten

Trajectoriebundels zijn ontworpen voor support en debugging, niet om openbaar te posten.
OpenClaw redigeert gevoelige waarden voordat exportbestanden worden geschreven:

- inloggegevens en bekende geheimachtig payloadvelden
- afbeeldingsdata
- lokale statuspaden
- werkruimtepaden, vervangen door `$WORKSPACE_DIR`
- thuismappaden, waar gedetecteerd

De exporter begrenst ook de invoergrootte:

- runtime-sidecarbestanden: live-opname stopt bij 10 MiB en registreert een truncatie-event wanneer er ruimte overblijft; export accepteert bestaande runtime-sidecars tot 50 MiB
- sessiebestanden: 50 MiB
- runtime-events: 200.000
- totaal geëxporteerde events: 250.000
- afzonderlijke runtime-eventregels worden boven 256 KiB afgekapt

Controleer bundels voordat je ze buiten je team deelt. Redactie gebeurt naar beste vermogen
en kan niet elk toepassingsspecifiek geheim kennen.

## Probleemoplossing

Als de export geen runtime-events heeft:

- bevestig dat OpenClaw is gestart zonder `OPENCLAW_TRAJECTORY=0`
- controleer of `OPENCLAW_TRAJECTORY_DIR` naar een schrijfbare map verwijst
- voer nog een bericht uit in de sessie en exporteer daarna opnieuw
- inspecteer `manifest.json` op `runtimeEventCount`

Als de opdracht het uitvoerpad weigert:

- gebruik een relatieve naam zoals `bug-1234`
- geef geen `/tmp/...` of `~/...` door
- houd de export binnen `.openclaw/trajectory-exports/`

Als de export mislukt met een groottefout, heeft de sessie of sidecar de
veiligheidslimieten voor export overschreden. Start een nieuwe sessie of exporteer een kleinere reproductie.

## Gerelateerd

- [Diffs](/nl/tools/diffs)
- [Sessiebeheer](/nl/concepts/session)
- [Exec-tool](/nl/tools/exec)
