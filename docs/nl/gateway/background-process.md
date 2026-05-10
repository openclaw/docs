---
read_when:
    - Achtergrond-exec-gedrag toevoegen of wijzigen
    - Debuggen van langlopende exec-taken
summary: Achtergronduitvoering met exec en procesbeheer
title: Achtergronduitvoering en procestool
x-i18n:
    generated_at: "2026-05-10T19:34:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw voert shellopdrachten uit via de tool `exec` en houdt langlopende taken in het geheugen. De tool `process` beheert die achtergrondsessies.

## exec-tool

Belangrijkste parameters:

- `command` (vereist)
- `yieldMs` (standaard 10000): automatisch naar achtergrond na deze vertraging
- `background` (bool): onmiddellijk op de achtergrond uitvoeren
- `timeout` (seconden, standaard `tools.exec.timeoutSec`): het proces na deze timeout beëindigen; stel `timeout: 0` alleen in om de timeout van het exec-proces voor die aanroep uit te schakelen
- `elevated` (bool): buiten de sandbox uitvoeren als verhoogde modus is ingeschakeld/toegestaan (`gateway` standaard, of `node` wanneer het exec-doel `node` is)
- Een echte TTY nodig? Stel `pty: true` in.
- `workdir`, `env`

Gedrag:

- Voorgronduitvoeringen geven uitvoer direct terug.
- Wanneer naar de achtergrond verplaatst (expliciet of door timeout), geeft de tool `status: "running"` + `sessionId` en een korte staart terug.
- Achtergrond- en `yieldMs`-uitvoeringen erven `tools.exec.timeoutSec`, tenzij de aanroep een expliciete `timeout` opgeeft.
- Uitvoer wordt in het geheugen bewaard totdat de sessie wordt gepolld of gewist.
- Als de tool `process` niet is toegestaan, draait `exec` synchroon en negeert het `yieldMs`/`background`.
- Gestarte exec-opdrachten ontvangen `OPENCLAW_SHELL=exec` voor contextbewuste shell-/profielregels.
- Voor langlopend werk dat nu start, start je het eenmaal en vertrouw je op automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of faalt.
- Als automatische voltooiingswake niet beschikbaar is, of je een bevestiging van stille
  succesvolle voltooiing nodig hebt voor een opdracht die netjes zonder uitvoer is afgesloten, gebruik dan `process`
  om voltooiing te bevestigen.
- Emuleer geen herinneringen of vertraagde follow-ups met `sleep`-lussen of herhaald
  pollen; gebruik Cron voor toekomstig werk.

## Brug naar onderliggende processen

Wanneer je langlopende onderliggende processen buiten de exec/process-tools start (bijvoorbeeld CLI-herstarts of gateway-helpers), koppel dan de bridge-helper voor onderliggende processen zodat beëindigingssignalen worden doorgestuurd en listeners bij exit/error worden losgekoppeld. Dit voorkomt verweesde processen op systemd en houdt afsluitgedrag consistent tussen platforms.

Omgevingsoverschrijvingen:

- `PI_BASH_YIELD_MS`: standaard yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: uitvoerlimiet in geheugen (tekens)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limiet voor wachtende stdout/stderr per stream (tekens)
- `PI_BASH_JOB_TTL_MS`: TTL voor voltooide sessies (ms, begrensd tot 1m-3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: drempel voor inactieve uitvoer voordat schrijfbare achtergrondsessies worden gemarkeerd als waarschijnlijk wachtend op invoer (standaard 15000 ms)

Configuratie (voorkeur):

- `tools.exec.backgroundMs` (standaard 10000)
- `tools.exec.timeoutSec` (standaard 1800)
- `tools.exec.cleanupMs` (standaard 1800000)
- `tools.exec.notifyOnExit` (standaard true): zet een systeemgebeurtenis in de wachtrij + vraag een Heartbeat aan wanneer een exec op de achtergrond afsluit.
- `tools.exec.notifyOnExitEmptySuccess` (standaard false): wanneer true, zet ook voltooiingsgebeurtenissen in de wachtrij voor succesvolle achtergrondruns die geen uitvoer produceerden.

## process-tool

Acties:

- `list`: actieve + voltooide sessies
- `poll`: nieuwe uitvoer voor een sessie leegmaken (rapporteert ook exitstatus)
- `log`: de geaggregeerde uitvoer lezen en hints voor invoerherstel tonen (ondersteunt `offset` + `limit`)
- `write`: stdin verzenden (`data`, optioneel `eof`)
- `send-keys`: expliciete toetstokens of bytes naar een PTY-ondersteunde sessie sturen
- `submit`: Enter / carriage return naar een PTY-ondersteunde sessie sturen
- `paste`: letterlijke tekst verzenden, optioneel verpakt in bracketed paste-modus
- `kill`: een achtergrondsessie beëindigen
- `clear`: een voltooide sessie uit het geheugen verwijderen
- `remove`: beëindigen als deze draait, anders wissen als deze voltooid is

Opmerkingen:

- Alleen achtergrondsessies worden vermeld/bewaard in het geheugen.
- Sessies gaan verloren bij een procesherstart (geen schijfpersistentie).
- Sessielogs worden alleen opgeslagen in de chatgeschiedenis als je `process poll/log` uitvoert en het toolresultaat wordt vastgelegd.
- `process` is per agent afgebakend; het ziet alleen sessies die door die agent zijn gestart.
- Gebruik `poll` / `log` voor status, logs, bevestiging van stille succesvolle voltooiing, of
  voltooiingsbevestiging wanneer automatische voltooiingswake niet beschikbaar is.
- Gebruik `log` voordat je een interactieve CLI herstelt, zodat het huidige transcript,
  de stdin-status en de input-wait-hint samen zichtbaar zijn.
- Gebruik `write` / `send-keys` / `submit` / `paste` / `kill` wanneer je invoer
  of ingrijpen nodig hebt.
- `process list` bevat een afgeleide `name` (opdrachtwerkwoord + doel) voor snelle scans.
- `process list`, `poll` en `log` rapporteren `waitingForInput` alleen
  wanneer de sessie nog schrijfbare stdin heeft en langer inactief is geweest dan de
  input-wait-drempel.
- `process log` gebruikt regelgebaseerde `offset`/`limit`.
- Wanneer zowel `offset` als `limit` zijn weggelaten, retourneert het de laatste 200 regels en bevat het een pagineringshint.
- Wanneer `offset` is opgegeven en `limit` is weggelaten, retourneert het vanaf `offset` tot het einde (niet begrensd op 200).
- Pollen is bedoeld voor status op aanvraag, niet voor wait-loop-planning. Als het werk later moet
  plaatsvinden, gebruik dan in plaats daarvan Cron.

## Voorbeelden

Een lange taak uitvoeren en later pollen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Een interactieve sessie inspecteren voordat invoer wordt verzonden:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Onmiddellijk op de achtergrond starten:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin verzenden:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY-toetsen verzenden:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Huidige regel indienen:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Letterlijke tekst plakken:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Gerelateerd

- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
