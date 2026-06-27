---
read_when:
    - Achtergrond-exec-gedrag toevoegen of wijzigen
    - Langlopende exec-taken debuggen
summary: Uitvoering van exec op de achtergrond en procesbeheer
title: Achtergrond-exec en procestool
x-i18n:
    generated_at: "2026-06-27T17:31:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw voert shellopdrachten uit via de `exec`-tool en bewaart langlopende taken in het geheugen. De `process`-tool beheert die achtergrondsessies.

## exec-tool

Belangrijke parameters:

- `command` (vereist)
- `yieldMs` (standaard 10000): automatisch naar de achtergrond na deze vertraging
- `background` (bool): onmiddellijk op de achtergrond uitvoeren
- `timeout` (seconden, standaard `tools.exec.timeoutSec`): beëindig het proces na deze timeout; stel `timeout: 0` alleen in om de timeout van het exec-proces voor die aanroep uit te schakelen
- `elevated` (bool): buiten de sandbox uitvoeren als verhoogde modus is ingeschakeld/toegestaan (`gateway` standaard, of `node` wanneer het exec-doel `node` is)
- Een echte TTY nodig? Stel `pty: true` in.
- `workdir`, `env`

Gedrag:

- Voorgrondtaken retourneren uitvoer rechtstreeks.
- Wanneer een taak naar de achtergrond gaat (expliciet of door timeout), retourneert de tool `status: "running"` + `sessionId` en een korte tail.
- Achtergrondtaken en `yieldMs`-taken erven `tools.exec.timeoutSec`, tenzij de aanroep een expliciete `timeout` opgeeft.
- Uitvoer wordt in het geheugen bewaard totdat de sessie wordt gepolld of gewist.
- Als de `process`-tool niet is toegestaan, voert `exec` synchroon uit en negeert het `yieldMs`/`background`.
- Gestarte exec-opdrachten krijgen `OPENCLAW_SHELL=exec` voor contextbewuste shell-/profielregels.
- Voor langlopend werk dat nu begint, start het eenmaal en vertrouw op automatische
  voltooiingswake wanneer die is ingeschakeld en de opdracht uitvoer produceert of mislukt.
- Als automatische voltooiingswake niet beschikbaar is, of als je bevestiging bij stille
  succesvolle voltooiing nodig hebt voor een opdracht die zonder uitvoer correct is afgesloten, gebruik dan `process`
  om voltooiing te bevestigen.
- Emuleer geen herinneringen of vertraagde opvolgingen met `sleep`-lussen of herhaalde
  polling; gebruik Cron voor toekomstig werk.

## Bridging van childprocessen

Wanneer langlopende childprocessen buiten de exec/process-tools worden gestart (bijvoorbeeld CLI-herstarts of Gateway-helpers), koppel dan de bridge-helper voor childprocessen zodat beëindigingssignalen worden doorgestuurd en listeners bij afsluiten/fout worden losgekoppeld. Dit voorkomt verweesde processen op systemd en houdt afsluitgedrag consistent op alle platforms.

Omgevingsoverschrijvingen:

- `OPENCLAW_BASH_YIELD_MS`: standaard yield (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: uitvoerlimiet in geheugen (tekens)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limiet voor wachtende stdout/stderr per stream (tekens)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL voor voltooide sessies (ms, begrensd tot 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: drempel voor inactieve uitvoer voordat beschrijfbare achtergrondsessies worden gemarkeerd als waarschijnlijk wachtend op invoer (standaard 15000 ms)

Configuratie (voorkeur):

- `tools.exec.backgroundMs` (standaard 10000)
- `tools.exec.timeoutSec` (standaard 1800)
- `tools.exec.cleanupMs` (standaard 1800000)
- `tools.exec.notifyOnExit` (standaard true): plaats een systeemgebeurtenis in de wachtrij + vraag een Heartbeat aan wanneer een exec op de achtergrond afsluit.
- `tools.exec.notifyOnExitEmptySuccess` (standaard false): wanneer true, plaats ook voltooiingsgebeurtenissen in de wachtrij voor succesvolle achtergrondtaken die geen uitvoer produceerden.

## process-tool

Acties:

- `list`: actieve + voltooide sessies
- `poll`: nieuwe uitvoer voor een sessie uitlezen (rapporteert ook afsluitstatus)
- `log`: de samengevoegde uitvoer lezen en hints voor invoerherstel tonen (ondersteunt `offset` + `limit`)
- `write`: stdin verzenden (`data`, optioneel `eof`)
- `send-keys`: expliciete toetstokens of bytes naar een door PTY ondersteunde sessie verzenden
- `submit`: Enter / carriage return naar een door PTY ondersteunde sessie verzenden
- `paste`: letterlijke tekst verzenden, optioneel verpakt in bracketed paste mode
- `kill`: een achtergrondsessie beëindigen
- `clear`: een voltooide sessie uit het geheugen verwijderen
- `remove`: beëindigen als de sessie actief is, anders wissen als die voltooid is

Notities:

- Alleen achtergrondsessies worden vermeld/bewaard in het geheugen.
- Sessies gaan verloren bij een procesherstart (geen schijfpersistentie).
- Sessielogboeken worden alleen opgeslagen in de chatgeschiedenis als je `process poll/log` uitvoert en het toolresultaat wordt vastgelegd.
- `process` is per agent afgebakend; het ziet alleen sessies die door die agent zijn gestart.
- Gebruik `poll` / `log` voor status, logboeken, bevestiging bij stille succesvolle voltooiing, of
  voltooiingsbevestiging wanneer automatische voltooiingswake niet beschikbaar is.
- Gebruik `log` voordat je een interactieve CLI herstelt, zodat het huidige transcript,
  de stdin-status en de invoerwachthint samen zichtbaar zijn.
- Gebruik `write` / `send-keys` / `submit` / `paste` / `kill` wanneer je invoer
  of ingrijpen nodig hebt.
- `process list` bevat een afgeleide `name` (opdrachtwerkwoord + doel) voor snelle scans.
- `process list`, `poll` en `log` rapporteren `waitingForInput` alleen
  wanneer de sessie nog beschrijfbare stdin heeft en langer inactief is geweest dan de
  invoerwachtdrempel.
- `process log` gebruikt regelgebaseerde `offset`/`limit`.
- Wanneer zowel `offset` als `limit` zijn weggelaten, retourneert het de laatste 200 regels en bevat het een pagineringshint.
- Wanneer `offset` is opgegeven en `limit` is weggelaten, retourneert het vanaf `offset` tot het einde (niet begrensd tot 200).
- Polling is voor status op aanvraag, niet voor planning via wachtlussen. Als het werk later moet
  gebeuren, gebruik dan Cron.

## Voorbeelden

Voer een lange taak uit en poll later:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecteer een interactieve sessie voordat je invoer verzendt:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Start onmiddellijk op de achtergrond:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Verzend stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Verzend PTY-toetsen:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Dien de huidige regel in:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Plak letterlijke tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Gerelateerd

- [exec-tool](/nl/tools/exec)
- [exec-goedkeuringen](/nl/tools/exec-approvals)
