---
read_when:
    - Je gebruikt de voice-call-plugin en wilt elk CLI-toegangspunt
    - Je hebt vlagtabellen en standaardwaarden nodig voor setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose en start
summary: CLI-referentie voor `openclaw voicecall` (opdrachtinterface van de spraakoproep-Plugin)
title: Spraakoproep
x-i18n:
    generated_at: "2026-05-10T19:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` is een door een Plugin geleverde opdracht. Deze verschijnt alleen wanneer de voice-call-Plugin is geïnstalleerd en ingeschakeld.

Wanneer de Gateway actief is, worden operationele opdrachten (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) naar de voice-call-runtime van die Gateway gerouteerd. Als er geen Gateway bereikbaar is, vallen ze terug op een zelfstandige CLI-runtime.

## Subopdrachten

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Subopdracht | Beschrijving                                                   |
| ---------- | --------------------------------------------------------------- |
| `setup`    | Toon gereedheidscontroles voor provider en Webhook.             |
| `smoke`    | Voer gereedheidscontroles uit; plaats alleen met `--yes` een live testgesprek. |
| `call`     | Start een uitgaand spraakgesprek.                               |
| `start`    | Alias voor `call` waarbij `--to` verplicht is en `--message` optioneel. |
| `continue` | Spreek een bericht uit en wacht op het volgende antwoord.       |
| `speak`    | Spreek een bericht uit zonder op een antwoord te wachten.       |
| `dtmf`     | Stuur DTMF-cijfers naar een actief gesprek.                     |
| `end`      | Beëindig een actief gesprek.                                    |
| `status`   | Inspecteer actieve gesprekken (of één via `--call-id`).         |
| `tail`     | Volg `calls.jsonl` (nuttig tijdens providertests).              |
| `latency`  | Vat turn-latency-statistieken uit `calls.jsonl` samen.          |
| `expose`   | Schakel Tailscale serve/funnel voor het Webhook-eindpunt om.    |

## Setup en smoke

### `setup`

Drukt standaard menselijk leesbare gereedheidscontroles af. Geef `--json` door voor scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Voert dezelfde gereedheidscontroles uit. Er wordt geen echt telefoongesprek geplaatst tenzij zowel `--to` als `--yes` aanwezig zijn.

| Vlag               | Standaard                         | Beschrijving                           |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (geen)                            | Telefoonnummer om te bellen voor een live smoke. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Bericht dat tijdens het smoke-gesprek wordt uitgesproken. |
| `--mode <mode>`    | `notify`                          | Gespreksmodus: `notify` of `conversation`. |
| `--yes`            | `false`                           | Plaats het live uitgaande gesprek daadwerkelijk. |
| `--json`           | `false`                           | Druk machineleesbare JSON af.           |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Voor externe providers (`twilio`, `telnyx`, `plivo`) vereisen `setup` en `smoke` een openbare Webhook-URL van `publicUrl`, een tunnel of Tailscale-blootstelling. Een loopback of private serve-fallback wordt geweigerd omdat carriers deze niet kunnen bereiken.
</Note>

## Gesprekslevenscyclus

### `call`

Start een uitgaand spraakgesprek.

| Vlag                   | Vereist | Standaard        | Beschrijving                                                              |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | ja       | (geen)            | Bericht dat wordt uitgesproken wanneer het gesprek verbinding maakt.       |
| `-t, --to <phone>`     | nee      | config `toNumber` | E.164-telefoonnummer om te bellen.                                        |
| `--mode <mode>`        | nee      | `conversation`    | Gespreksmodus: `notify` (ophangen na bericht) of `conversation` (open blijven). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias voor `call` met een andere standaard vlagvorm.

| Vlag               | Vereist | Standaard      | Beschrijving                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | ja       | (geen)         | Telefoonnummer om te bellen.             |
| `--message <text>` | nee      | (geen)         | Bericht dat wordt uitgesproken wanneer het gesprek verbinding maakt. |
| `--mode <mode>`    | nee      | `conversation` | Gespreksmodus: `notify` of `conversation`. |

### `continue`

Spreek een bericht uit en wacht op een antwoord.

| Vlag               | Vereist | Beschrijving             |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ja       | Gespreks-ID.       |
| `--message <text>` | ja       | Bericht om uit te spreken. |

### `speak`

Spreek een bericht uit zonder op een antwoord te wachten.

| Vlag               | Vereist | Beschrijving             |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ja       | Gespreks-ID.       |
| `--message <text>` | ja       | Bericht om uit te spreken. |

### `dtmf`

Stuur DTMF-cijfers naar een actief gesprek.

| Vlag                | Vereist | Beschrijving                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | ja       | Gespreks-ID.                              |
| `--digits <digits>` | ja       | DTMF-cijfers (bijv. `ww123456#` voor wachttijden). |

### `end`

Beëindig een actief gesprek.

| Vlag             | Vereist | Beschrijving |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | ja       | Gespreks-ID. |

### `status`

Inspecteer actieve gesprekken.

| Vlag             | Standaard | Beschrijving                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (geen)  | Beperk uitvoer tot één gesprek. |
| `--json`         | `false` | Druk machineleesbare JSON af. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Logs en statistieken

### `tail`

Volg het JSONL-logbestand voor spraakgesprekken. Drukt bij start de laatste `--since` regels af en streamt daarna nieuwe regels zodra ze worden geschreven.

| Vlag            | Standaard                  | Beschrijving                         |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | resolved from plugin store | Pad naar `calls.jsonl`.              |
| `--since <n>`   | `25`                       | Regels om af te drukken voordat tailing start. |
| `--poll <ms>`   | `250` (minimum 50)         | Pollinterval in milliseconden.       |

### `latency`

Vat turn-latency- en listen-wait-statistieken uit `calls.jsonl` samen. De uitvoer is JSON met samenvattingen voor `recordsScanned`, `turnLatency` en `listenWait`.

| Vlag            | Standaard                  | Beschrijving                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | resolved from plugin store | Pad naar `calls.jsonl`.              |
| `--last <n>`    | `200` (minimum 1)          | Aantal recente records om te analyseren. |

## Webhooks blootstellen

### `expose`

Schakel de Tailscale serve/funnel-configuratie voor de voice-Webhook in, uit of wijzig deze.

| Vlag                  | Standaard                                | Beschrijving                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) of `funnel` (openbaar). |
| `--path <path>`       | config `tailscale.path` of `--serve-path` | Tailscale-pad om bloot te stellen.              |
| `--port <port>`       | config `serve.port` of `3334`             | Lokale Webhook-poort.                           |
| `--serve-path <path>` | config `serve.path` of `/voice/webhook`   | Lokaal Webhook-pad.                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Stel het Webhook-eindpunt alleen bloot aan netwerken die je vertrouwt. Geef waar mogelijk de voorkeur aan Tailscale Serve boven Funnel.
</Warning>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Voice-call-Plugin](/nl/plugins/voice-call)
