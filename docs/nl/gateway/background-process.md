---
read_when:
    - Gedrag voor uitvoering op de achtergrond toevoegen of wijzigen
    - Langlopende exec-taken debuggen
summary: Achtergronduitvoering van exec en procesbeheer
title: Exec op de achtergrond en procestool
x-i18n:
    generated_at: "2026-05-06T09:12:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw voert shellopdrachten uit via de `exec`-tool en houdt langlopende taken in het geheugen. De `process`-tool beheert die achtergrondsessies.

## exec-tool

Belangrijke parameters:

- `command` (verplicht)
- `yieldMs` (standaard 10000): automatisch naar de achtergrond na deze vertraging
- `background` (bool): onmiddellijk op de achtergrond uitvoeren
- `timeout` (seconden, standaard `tools.exec.timeoutSec`): beëindig het proces na deze timeout; stel `timeout: 0` alleen in om de exec-procestimeout voor die aanroep uit te schakelen
- `elevated` (bool): voer buiten de sandbox uit als elevated mode is ingeschakeld/toegestaan (`gateway` standaard, of `node` wanneer het exec-doel `node` is)
- Een echte TTY nodig? Stel `pty: true` in.
- `workdir`, `env`

Gedrag:

- Voorgronduitvoeringen geven uitvoer direct terug.
- Wanneer naar de achtergrond verplaatst (expliciet of door timeout), retourneert de tool `status: "running"` + `sessionId` en een korte tail.
- Achtergrond- en `yieldMs`-uitvoeringen erven `tools.exec.timeoutSec`, tenzij de aanroep een expliciete `timeout` opgeeft.
- Uitvoer wordt in het geheugen bewaard totdat de sessie wordt gepolld of gewist.
- Als de `process`-tool niet is toegestaan, voert `exec` synchroon uit en negeert het `yieldMs`/`background`.
- Gestarte exec-opdrachten ontvangen `OPENCLAW_SHELL=exec` voor contextbewuste shell-/profielregels.
- Voor langlopend werk dat nu start, start je het één keer en vertrouw je op de automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of faalt.
- Als automatische voltooiingswake niet beschikbaar is, of je stille-succes-
  bevestiging nodig hebt voor een opdracht die schoon is afgesloten zonder uitvoer, gebruik dan `process`
  om voltooiing te bevestigen.
- Emuleer geen herinneringen of vertraagde follow-ups met `sleep`-lussen of herhaald
  pollen; gebruik cron voor toekomstig werk.

## Brug voor child processes

Wanneer langlopende child processes buiten de exec-/process-tools worden gestart (bijvoorbeeld CLI-respawns of gateway-helpers), koppel dan de bridge-helper voor child processes zodat beëindigingssignalen worden doorgestuurd en listeners bij exit/error worden losgekoppeld. Dit voorkomt verweesde processen op systemd en houdt afsluitgedrag consistent tussen platforms.

Omgevingsoverschrijvingen:

- `PI_BASH_YIELD_MS`: standaard yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limiet voor uitvoer in het geheugen (tekens)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limiet voor wachtende stdout/stderr per stream (tekens)
- `PI_BASH_JOB_TTL_MS`: TTL voor voltooide sessies (ms, begrensd tot 1m–3h)

Configuratie (aanbevolen):

- `tools.exec.backgroundMs` (standaard 10000)
- `tools.exec.timeoutSec` (standaard 1800)
- `tools.exec.cleanupMs` (standaard 1800000)
- `tools.exec.notifyOnExit` (standaard true): zet een systeemevent in de wachtrij + vraag om een Heartbeat wanneer een exec op de achtergrond afsluit.
- `tools.exec.notifyOnExitEmptySuccess` (standaard false): wanneer true, zet ook voltooiingsevents in de wachtrij voor succesvolle achtergrondruns die geen uitvoer produceerden.

## process-tool

Acties:

- `list`: actieve + voltooide sessies
- `poll`: nieuwe uitvoer voor een sessie leegmaken (rapporteert ook exitstatus)
- `log`: de samengevoegde uitvoer lezen (ondersteunt `offset` + `limit`)
- `write`: stdin verzenden (`data`, optioneel `eof`)
- `send-keys`: expliciete toets-tokens of bytes verzenden naar een PTY-ondersteunde sessie
- `submit`: Enter / carriage return verzenden naar een PTY-ondersteunde sessie
- `paste`: letterlijke tekst verzenden, optioneel verpakt in bracketed paste mode
- `kill`: een achtergrondsessie beëindigen
- `clear`: een voltooide sessie uit het geheugen verwijderen
- `remove`: beëindigen als actief, anders wissen als voltooid

Opmerkingen:

- Alleen achtergrondsessies worden vermeld/bewaard in het geheugen.
- Sessies gaan verloren bij een procesherstart (geen persistentie op schijf).
- Sessielogs worden alleen opgeslagen in de chatgeschiedenis als je `process poll/log` uitvoert en het toolresultaat wordt vastgelegd.
- `process` is per agent afgebakend; het ziet alleen sessies die door die agent zijn gestart.
- Gebruik `poll` / `log` voor status, logs, stille-succesbevestiging of
  voltooiingsbevestiging wanneer automatische voltooiingswake niet beschikbaar is.
- Gebruik `write` / `send-keys` / `submit` / `paste` / `kill` wanneer je invoer
  of interventie nodig hebt.
- `process list` bevat een afgeleide `name` (opdrachtwerkwoord + doel) voor snelle scans.
- `process log` gebruikt regelgebaseerde `offset`/`limit`.
- Wanneer zowel `offset` als `limit` zijn weggelaten, retourneert het de laatste 200 regels en bevat het een paginghint.
- Wanneer `offset` is opgegeven en `limit` is weggelaten, retourneert het vanaf `offset` tot het einde (niet begrensd tot 200).
- Pollen is bedoeld voor status op aanvraag, niet voor wait-loopplanning. Als het werk later moet
  plaatsvinden, gebruik dan in plaats daarvan cron.

## Voorbeelden

Voer een lange taak uit en poll later:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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

Dien huidige regel in:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Plak letterlijke tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Gerelateerd

- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
