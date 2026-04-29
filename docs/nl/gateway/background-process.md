---
read_when:
    - Gedrag voor uitvoering op de achtergrond toevoegen of wijzigen
    - Langlopende exec-taken debuggen
summary: Uitvoering van exec op de achtergrond en procesbeheer
title: Achtergronduitvoering en proceshulpmiddel
x-i18n:
    generated_at: "2026-04-29T22:42:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Achtergrond-exec + process-tool

OpenClaw voert shellopdrachten uit via de `exec`-tool en houdt langlopende taken in het geheugen. De `process`-tool beheert die achtergrondsessies.

## exec-tool

Belangrijke parameters:

- `command` (vereist)
- `yieldMs` (standaard 10000): automatisch naar achtergrond na deze vertraging
- `background` (bool): direct op de achtergrond uitvoeren
- `timeout` (seconden, standaard `tools.exec.timeoutSec`): beëindig het proces na deze timeout; stel `timeout: 0` alleen in om de exec-procestimeout voor die aanroep uit te schakelen
- `elevated` (bool): buiten de sandbox uitvoeren als verhoogde modus is ingeschakeld/toegestaan (`gateway` standaard, of `node` wanneer het exec-doel `node` is)
- Een echte TTY nodig? Stel `pty: true` in.
- `workdir`, `env`

Gedrag:

- Voorgrondruns geven uitvoer direct terug.
- Wanneer naar de achtergrond verplaatst (expliciet of door timeout), geeft de tool `status: "running"` + `sessionId` en een korte tail terug.
- Achtergrond- en `yieldMs`-runs erven `tools.exec.timeoutSec`, tenzij de aanroep een expliciete `timeout` opgeeft.
- Uitvoer blijft in het geheugen totdat de sessie wordt gepolld of gewist.
- Als de `process`-tool niet is toegestaan, voert `exec` synchroon uit en negeert `yieldMs`/`background`.
- Gestarte exec-opdrachten ontvangen `OPENCLAW_SHELL=exec` voor contextbewuste shell-/profielregels.
- Voor langlopend werk dat nu start: start het eenmaal en vertrouw op automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of faalt.
- Als automatische voltooiingswake niet beschikbaar is, of als je bevestiging van
  stille succesvolle voltooiing nodig hebt voor een opdracht die zonder uitvoer netjes is afgesloten, gebruik dan `process`
  om voltooiing te bevestigen.
- Emuleer geen herinneringen of vertraagde opvolgingen met `sleep`-lussen of herhaald
  pollen; gebruik Cron voor toekomstig werk.

## Brug voor child-processen

Wanneer langlopende child-processen buiten de exec/process-tools worden gestart (bijvoorbeeld CLI-herstarts of Gateway-helpers), koppel dan de bridge-helper voor child-processen zodat beëindigingssignalen worden doorgestuurd en listeners bij exit/error worden losgekoppeld. Dit voorkomt verweesde processen op systemd en houdt afsluitgedrag consistent op alle platforms.

Omgevingsoverschrijvingen:

- `PI_BASH_YIELD_MS`: standaard yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: uitvoerlimiet in geheugen (tekens)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limiet voor wachtende stdout/stderr per stream (tekens)
- `PI_BASH_JOB_TTL_MS`: TTL voor voltooide sessies (ms, begrensd op 1m–3h)

Configuratie (voorkeur):

- `tools.exec.backgroundMs` (standaard 10000)
- `tools.exec.timeoutSec` (standaard 1800)
- `tools.exec.cleanupMs` (standaard 1800000)
- `tools.exec.notifyOnExit` (standaard true): zet een systeemgebeurtenis in de wachtrij + vraag een Heartbeat aan wanneer een exec op de achtergrond afsluit.
- `tools.exec.notifyOnExitEmptySuccess` (standaard false): wanneer true, zet ook voltooiingsgebeurtenissen in de wachtrij voor succesvolle achtergrondruns die geen uitvoer hebben geproduceerd.

## process-tool

Acties:

- `list`: actieve + voltooide sessies
- `poll`: nieuwe uitvoer voor een sessie ophalen (rapporteert ook exitstatus)
- `log`: de samengevoegde uitvoer lezen (ondersteunt `offset` + `limit`)
- `write`: stdin sturen (`data`, optioneel `eof`)
- `send-keys`: expliciete toets-tokens of bytes naar een PTY-ondersteunde sessie sturen
- `submit`: Enter / carriage return naar een PTY-ondersteunde sessie sturen
- `paste`: letterlijke tekst sturen, optioneel verpakt in bracketed paste mode
- `kill`: een achtergrondsessie beëindigen
- `clear`: een voltooide sessie uit het geheugen verwijderen
- `remove`: beëindigen als actief, anders wissen als voltooid

Opmerkingen:

- Alleen sessies op de achtergrond worden vermeld/bewaard in het geheugen.
- Sessies gaan verloren bij een procesherstart (geen opslag op schijf).
- Sessielogs worden alleen in de chatgeschiedenis opgeslagen als je `process poll/log` uitvoert en het toolresultaat wordt vastgelegd.
- `process` is per agent afgebakend; het ziet alleen sessies die door die agent zijn gestart.
- Gebruik `poll` / `log` voor status, logs, bevestiging van stille succesvolle voltooiing, of
  voltooiingsbevestiging wanneer automatische voltooiingswake niet beschikbaar is.
- Gebruik `write` / `send-keys` / `submit` / `paste` / `kill` wanneer je invoer
  of interventie nodig hebt.
- `process list` bevat een afgeleide `name` (opdrachtwerkwoord + doel) voor snelle scans.
- `process log` gebruikt regelgebaseerde `offset`/`limit`.
- Wanneer zowel `offset` als `limit` zijn weggelaten, geeft het de laatste 200 regels terug en bevat het een paging-hint.
- Wanneer `offset` is opgegeven en `limit` is weggelaten, geeft het terug vanaf `offset` tot het einde (niet beperkt tot 200).
- Pollen is bedoeld voor status op aanvraag, niet voor wait-loop-planning. Als het werk later moet
  gebeuren, gebruik dan in plaats daarvan Cron.

## Voorbeelden

Voer een lange taak uit en poll later:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Start direct op de achtergrond:

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
