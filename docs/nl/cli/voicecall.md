---
read_when:
    - U gebruikt de voice-call-plugin en wilt elk CLI-toegangspunt
    - U hebt tabellen met vlaggen en standaardwaarden nodig voor setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose en start
summary: CLI-referentie voor `openclaw voicecall` (opdrachtinterface van de spraakoproepplugin)
title: Spraakoproep
x-i18n:
    generated_at: "2026-07-12T08:45:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` is een door een plugin geleverde opdracht. Deze verschijnt alleen wanneer de plugin voor spraakoproepen is geïnstalleerd en ingeschakeld.

Wanneer de Gateway actief is, worden operationele opdrachten (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) doorgestuurd naar de runtime voor spraakoproepen van die Gateway. Als geen Gateway bereikbaar is, vallen ze terug op een zelfstandige
CLI-runtime.

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

| Subopdracht | Beschrijving                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `setup`     | Toon gereedheidscontroles voor de provider en Webhook.                        |
| `smoke`     | Voer gereedheidscontroles uit; plaats alleen met `--yes` een live-testoproep. |
| `call`      | Start een uitgaande spraakoproep.                                             |
| `start`     | Alias voor `call`, waarbij `--to` vereist en `--message` optioneel is.         |
| `continue`  | Spreek een bericht uit en wacht op het volgende antwoord.                     |
| `speak`     | Spreek een bericht uit zonder op een antwoord te wachten.                     |
| `dtmf`      | Stuur DTMF-cijfers naar een actieve oproep.                                   |
| `end`       | Beëindig een actieve oproep.                                                  |
| `status`    | Bekijk actieve oproepen (of één oproep met `--call-id`).                      |
| `tail`      | Volg `calls.jsonl` (nuttig tijdens providertests).                            |
| `latency`   | Vat latentiemetingen per beurt uit `calls.jsonl` samen.                       |
| `expose`    | Schakel Tailscale serve/funnel voor het Webhook-eindpunt in of uit.           |

## Installatie en rooktest

### `setup`

Drukt standaard voor mensen leesbare gereedheidscontroles af. Geef `--json` door voor scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Voert dezelfde gereedheidscontroles uit. Plaatst alleen een echte telefoonoproep wanneer zowel
`--to` als `--yes` aanwezig zijn.

| Vlag               | Standaard                         | Beschrijving                                    |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| `-t, --to <phone>` | (geen)                            | Telefoonnummer voor een live-rooktest.          |
| `--message <text>` | `OpenClaw voice call smoke test.` | Bericht dat tijdens de testoproep wordt gezegd. |
| `--mode <mode>`    | `notify`                          | Oproepmodus: `notify` of `conversation`.        |
| `--yes`            | `false`                           | Plaats de live uitgaande oproep daadwerkelijk.  |
| `--json`           | `false`                           | Druk machineleesbare JSON af.                   |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # droge uitvoering
openclaw voicecall smoke --to "+15555550123" --yes  # live meldingsoproep
```

<Note>
Voor externe providers (`plivo`, `telnyx`, `twilio`) vereisen `setup` en `smoke` een openbare Webhook-URL uit `publicUrl`, een tunnel of blootstelling via Tailscale. Een terugval op local loopback of een privé-serve-configuratie wordt geweigerd, omdat telecomproviders deze niet kunnen bereiken.
</Note>

## Levenscyclus van oproepen

### `call`

Start een uitgaande spraakoproep.

| Vlag                   | Vereist | Standaard         | Beschrijving                                                                          |
| ---------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------- |
| `-m, --message <text>` | ja      | (geen)            | Bericht dat wordt uitgesproken wanneer de oproep wordt verbonden.                     |
| `-t, --to <phone>`     | nee     | config `toNumber` | E.164-telefoonnummer dat moet worden gebeld.                                           |
| `--mode <mode>`        | nee     | `conversation`    | Oproepmodus: `notify` (ophangen na het bericht) of `conversation` (verbonden blijven). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias voor `call` met een andere standaardvorm voor vlaggen.

| Vlag               | Vereist | Standaard      | Beschrijving                                                      |
| ------------------ | ------- | -------------- | ----------------------------------------------------------------- |
| `--to <phone>`     | ja      | (geen)         | Telefoonnummer dat moet worden gebeld.                             |
| `--message <text>` | nee     | (geen)         | Bericht dat wordt uitgesproken wanneer de oproep wordt verbonden. |
| `--mode <mode>`    | nee     | `conversation` | Oproepmodus: `notify` of `conversation`.                           |

### `continue`

Spreek een bericht uit en wacht op een antwoord.

| Vlag               | Vereist | Beschrijving                   |
| ------------------ | ------- | ------------------------------ |
| `--call-id <id>`   | ja      | Oproep-ID.                     |
| `--message <text>` | ja      | Bericht dat wordt uitgesproken. |

### `speak`

Spreek een bericht uit zonder op een antwoord te wachten.

| Vlag               | Vereist | Beschrijving                   |
| ------------------ | ------- | ------------------------------ |
| `--call-id <id>`   | ja      | Oproep-ID.                     |
| `--message <text>` | ja      | Bericht dat wordt uitgesproken. |

### `dtmf`

Stuur DTMF-cijfers naar een actieve oproep.

| Vlag                | Vereist | Beschrijving                                                |
| ------------------- | ------- | ----------------------------------------------------------- |
| `--call-id <id>`    | ja      | Oproep-ID.                                                  |
| `--digits <digits>` | ja      | DTMF-cijfers (bijvoorbeeld `ww123456#` voor wachttijden).   |

### `end`

Beëindig een actieve oproep.

| Vlag             | Vereist | Beschrijving |
| ---------------- | ------- | ------------ |
| `--call-id <id>` | ja      | Oproep-ID.   |

### `status`

Bekijk actieve oproepen.

| Vlag             | Standaard | Beschrijving                          |
| ---------------- | --------- | ------------------------------------- |
| `--call-id <id>` | (geen)    | Beperk de uitvoer tot één oproep.     |
| `--json`         | `false`   | Druk machineleesbare JSON af.         |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Logboeken en metrische gegevens

### `tail`

Volg het JSONL-logboek voor spraakoproepen. Drukt bij het starten de laatste `--since`-regels af en
streamt vervolgens nieuwe regels zodra ze worden geschreven.

| Vlag            | Standaard                         | Beschrijving                              |
| --------------- | --------------------------------- | ----------------------------------------- |
| `--file <path>` | afgeleid uit de opslag van de plugin | Pad naar `calls.jsonl`.                |
| `--since <n>`   | `25`                              | Regels die vóór het volgen worden afgedrukt. |
| `--poll <ms>`   | `250` (minimaal 50)               | Pollinterval in milliseconden.            |

### `latency`

Vat de latentie per beurt en de wachttijd voor luisteren uit `calls.jsonl` samen. De uitvoer is
JSON met samenvattingen voor `recordsScanned`, `turnLatency` en `listenWait`.

| Vlag            | Standaard                            | Beschrijving                                  |
| --------------- | ------------------------------------ | --------------------------------------------- |
| `--file <path>` | afgeleid uit de opslag van de plugin | Pad naar `calls.jsonl`.                       |
| `--last <n>`    | `200` (minimaal 1)                   | Aantal recente records dat wordt geanalyseerd. |

## Webhooks beschikbaar maken

### `expose`

Schakel de Tailscale serve/funnel-configuratie voor de spraak-Webhook in, uit of wijzig deze.

| Vlag                  | Standaard                                 | Beschrijving                                        |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) of `funnel` (openbaar).    |
| `--path <path>`       | config `tailscale.path` of `--serve-path` | Tailscale-pad dat beschikbaar moet worden gemaakt.  |
| `--port <port>`       | config `serve.port` of `3334`             | Lokale Webhook-poort.                               |
| `--serve-path <path>` | config `serve.path` of `/voice/webhook`   | Lokaal Webhook-pad.                                 |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Stel het Webhook-eindpunt alleen beschikbaar aan netwerken die u vertrouwt. Geef waar mogelijk de voorkeur aan Tailscale Serve boven Funnel.
</Warning>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Plugin voor spraakoproepen](/nl/plugins/voice-call)
