---
read_when:
    - Achtergronduitvoeringsgedrag toevoegen of wijzigen
    - Langlopende exec-taken debuggen
summary: Uitvoering op de achtergrond en procesbeheer
title: Uitvoering op de achtergrond en procestool
x-i18n:
    generated_at: "2026-07-12T08:48:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw voert shellopdrachten uit via de tool `exec` en bewaart langlopende taken in het geheugen. De tool `process` beheert deze achtergrondsessies.

## Tool exec

Parameters:

| Parameter    | Beschrijving                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Vereist. Uit te voeren shellopdracht.                                                                                                                                                                              |
| `workdir`    | Werkmap; laat weg om de standaard-cwd te gebruiken.                                                                                                                                                                |
| `env`        | Extra omgevingsvariabelen voor de opdracht.                                                                                                                                                                        |
| `yieldMs`    | Aantal milliseconden dat wordt gewacht voordat de taak naar de achtergrond gaat (standaard 10000).                                                                                                                 |
| `background` | Voer onmiddellijk op de achtergrond uit.                                                                                                                                                                           |
| `timeout`    | Time-out in seconden (standaard `tools.exec.timeoutSec`); beëindigt het proces wanneer deze verstrijkt. Stel `timeout: 0` in om de time-out van het exec-proces voor die aanroep uit te schakelen.                   |
| `pty`        | Voer indien beschikbaar uit in een pseudoterminal (CLI's die een TTY vereisen, codeeragents).                                                                                                                       |
| `elevated`   | Voer buiten de sandbox uit als de verhoogde modus is ingeschakeld/toegestaan (standaard `gateway`, of `node` wanneer het uitvoerdoel `node` is).                                                                    |
| `host`       | Uitvoerdoel: `auto`, `sandbox`, `gateway` of `node`.                                                                                                                                                               |
| `node`       | Node-id/-naam, gebruikt met `host: "node"`.                                                                                                                                                                        |

Gedrag:

- Uitvoeringen op de voorgrond retourneren de uitvoer rechtstreeks.
- Wanneer een taak naar de achtergrond gaat (expliciet of door een `yieldMs`-time-out), retourneert de tool `status: "running"` + `sessionId` en een kort laatste deel van de uitvoer.
- Uitvoeringen op de achtergrond en met `yieldMs` nemen `tools.exec.timeoutSec` over, tenzij de aanroep een expliciete `timeout` meegeeft.
- Uitvoer blijft in het geheugen totdat de sessie wordt opgevraagd of gewist.
- Als de tool `process` niet is toegestaan, wordt `exec` synchroon uitgevoerd en worden `yieldMs`/`background` genegeerd.
- Gestarte exec-opdrachten ontvangen `OPENCLAW_SHELL=exec` voor contextbewuste shell-/profielregels.
- Voor langlopend werk dat nu begint: start het eenmaal en vertrouw op de automatische activering bij voltooiing (indien ingeschakeld) zodra de opdracht uitvoer produceert of mislukt.
- Als automatische activering bij voltooiing niet beschikbaar is, of als je bevestiging van een stille succesvolle uitvoering nodig hebt voor een opdracht die zonder uitvoer correct afsluit, vraag je de status op met `process`.
- Boots herinneringen of uitgestelde vervolgacties niet na met `sleep`-lussen of herhaald opvragen — gebruik Cron voor toekomstig werk.

### Overschrijvingen via omgevingsvariabelen

| Variabele                                | Effect                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Standaardwachttijd voordat de taak naar de achtergrond gaat (ms). Standaard 10000, begrensd op 10-120000.                                      |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limiet voor uitvoer in het geheugen (tekens).                                                                                                  |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limiet voor wachtende stdout/stderr per stroom (tekens).                                                                                       |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL voor voltooide sessies (ms), begrensd op 1 min.-3 uur.                                                                                     |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Drempel voor inactieve uitvoer voordat schrijfbare achtergrondsessies worden gemarkeerd als waarschijnlijk wachtend op invoer. Standaard 15000. |

### Configuratie (bij voorkeur in plaats van overschrijvingen via omgevingsvariabelen)

| Sleutel                               | Standaard | Effect                                                                                              |
| ------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000     | Hetzelfde als `OPENCLAW_BASH_YIELD_MS`.                                                             |
| `tools.exec.timeoutSec`               | 1800      | Standaardtime-out per aanroep.                                                                      |
| `tools.exec.cleanupMs`                | 1800000   | Hetzelfde als `OPENCLAW_BASH_JOB_TTL_MS`.                                                           |
| `tools.exec.notifyOnExit`             | true      | Zet een systeemgebeurtenis in de wachtrij en vraagt om een Heartbeat wanneer een exec op de achtergrond afsluit. |
| `tools.exec.notifyOnExitEmptySuccess` | false     | Zet ook voltooiingsgebeurtenissen in de wachtrij voor succesvolle uitvoeringen op de achtergrond zonder uitvoer. |

## Overbrugging van onderliggende processen

Wanneer langlopende onderliggende processen buiten de tools exec/process worden gestart (herstarts van CLI's, Gateway-helpers), koppel je de overbruggingshelper voor onderliggende processen zodat beëindigingssignalen worden doorgestuurd en listeners bij afsluiten/fouten worden losgekoppeld. Dit voorkomt verweesde processen onder systemd en houdt het afsluitgedrag consistent op verschillende platforms.

## Tool process

Acties:

| Actie       | Effect                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `list`      | Actieve + voltooide sessies.                                                                           |
| `poll`      | Haal nieuwe uitvoer voor een sessie op (rapporteert ook de afsluitstatus).                              |
| `log`       | Lees samengevoegde uitvoer en aanwijzingen voor invoerherstel. Ondersteunt `offset` + `limit`.          |
| `write`     | Stuur stdin (`data`, optioneel `eof`).                                                                  |
| `send-keys` | Stuur expliciete toetstokens of bytes naar een door een PTY ondersteunde sessie.                        |
| `submit`    | Stuur Enter/regeleinde naar een door een PTY ondersteunde sessie.                                      |
| `paste`     | Stuur letterlijke tekst, optioneel omsloten door de modus voor gemarkeerd plakken.                      |
| `kill`      | Beëindig een achtergrondsessie.                                                                         |
| `clear`     | Verwijder een voltooide sessie uit het geheugen.                                                        |
| `remove`    | Beëindig de sessie als deze actief is; wis deze anders als deze voltooid is.                            |

Opmerkingen:

- Alleen achtergrondsessies worden weergegeven/bewaard — uitsluitend in het geheugen, niet op schijf. Sessies gaan verloren wanneer het proces opnieuw wordt gestart.
- Een actieve achtergrondsessie blokkeert coöperatieve opschorting van de host en een veilige herstart van de Gateway totdat de proceseigenaar bevestigt dat het proces daadwerkelijk is afgesloten.
- `process remove` kan een actieve sessie onmiddellijk verbergen nadat beëindiging is aangevraagd; opschorting en herstart blijven geblokkeerd totdat het afsluiten is bevestigd.
- Sessielogboeken worden alleen in de chatgeschiedenis opgeslagen als je `process poll`/`log` uitvoert en het toolresultaat wordt vastgelegd.
- `process` heeft een bereik per agent; de tool ziet alleen sessies die door die agent zijn gestart.
- Gebruik `poll`/`log` voor status, logboeken of bevestiging van voltooiing wanneer automatische activering bij voltooiing niet beschikbaar is.
- Gebruik `log` voordat je een interactieve CLI herstelt, zodat het huidige transcript, de stdin-status en de aanwijzing dat op invoer wordt gewacht samen zichtbaar zijn.
- Gebruik `write`/`send-keys`/`submit`/`paste`/`kill` wanneer invoer of ingrijpen nodig is.
- `process list` bevat een afgeleide `name` (opdrachtwerkwoord + doel) voor snel overzicht.
- `process list`, `poll` en `log` rapporteren `waitingForInput` alleen wanneer de sessie nog schrijfbare stdin heeft en langer inactief is dan de drempel voor wachten op invoer (standaard 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` gebruikt een regelgebaseerde `offset`/`limit`. Wanneer beide zijn weggelaten, worden de laatste 200 regels geretourneerd met een bladeraanwijzing. Wanneer `offset` is ingesteld en `limit` niet, wordt vanaf `offset` tot het einde geretourneerd (niet beperkt tot 200).
- De `timeout` van `poll` wacht maximaal het opgegeven aantal milliseconden voordat de aanroep retourneert; waarden boven 30000 worden begrensd op 30000.
- Opvragen is bedoeld voor status op aanvraag, niet voor het plannen van wachtlussen. Als het werk later moet plaatsvinden, gebruik je Cron.

## Voorbeelden

Voer een langlopende taak uit en vraag de status later op:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecteer een interactieve sessie voordat je invoer verstuurt:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Start onmiddellijk op de achtergrond:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Stuur stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Stuur PTY-toetsen:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Verstuur de huidige regel:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Plak letterlijke tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Gerelateerd

- [Tool exec](/nl/tools/exec)
- [Goedkeuringen voor exec](/nl/tools/exec-approvals)
