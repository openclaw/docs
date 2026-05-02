---
read_when:
    - Provider-retrygedrag of standaardwaarden bijwerken
    - Foutopsporing bij verzendfouten van providers of limieten voor aanvraagsnelheid
summary: Beleid voor nieuwe pogingen voor uitgaande aanroepen naar aanbieders
title: Beleid voor opnieuw proberen
x-i18n:
    generated_at: "2026-05-02T11:14:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## Doelen

- Probeer opnieuw per HTTP-verzoek, niet per flow met meerdere stappen.
- Behoud de volgorde door alleen de huidige stap opnieuw te proberen.
- Vermijd duplicatie van niet-idempotente bewerkingen.

## Standaardwaarden

- Pogingen: 3
- Maximale vertragingslimiet: 30000 ms
- Jitter: 0,1 (10 procent)
- Standaardwaarden per provider:
  - Minimale vertraging voor Telegram: 400 ms
  - Minimale vertraging voor Discord: 500 ms

## Gedrag

### Modelproviders

- OpenClaw laat provider-SDK's normale korte retries afhandelen.
- Voor SDK's op basis van Stainless, zoals Anthropic en OpenAI, kunnen retrybare responses
  (`408`, `409`, `429` en `5xx`) `retry-after-ms` of
  `retry-after` bevatten. Wanneer die wachttijd langer is dan 60 seconden, injecteert OpenClaw
  `x-should-retry: false`, zodat de SDK de fout direct doorgeeft en modelfailover
  kan overschakelen naar een ander auth-profiel of fallbackmodel.
- Overschrijf de limiet met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Stel dit in op `0`, `false`, `off`, `none` of `disabled` om SDK's lange
  `Retry-After`-wachttijden intern te laten respecteren.

### Discord

- Probeert opnieuw bij rate-limit-fouten (HTTP 429), request-time-outs, HTTP 5xx-responses
  en tijdelijke transportfouten zoals DNS-lookupfouten, verbindingsresets,
  socket-sluitingen en fetch-fouten.
- Gebruikt Discord `retry_after` wanneer beschikbaar, anders exponentiële backoff.

### Telegram

- Probeert opnieuw bij tijdelijke fouten (429, time-out, connect/reset/closed, tijdelijk niet beschikbaar).
- Gebruikt `retry_after` wanneer beschikbaar, anders exponentiële backoff.
- Markdown-parsefouten worden niet opnieuw geprobeerd; ze vallen terug op platte tekst.

## Configuratie

Stel het retrybeleid per provider in `~/.openclaw/openclaw.json` in:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Opmerkingen

- Retries gelden per verzoek (bericht verzenden, media-upload, reactie, poll, sticker).
- Samengestelde flows proberen voltooide stappen niet opnieuw.

## Gerelateerd

- [Modelfailover](/nl/concepts/model-failover)
- [Opdrachtwachtrij](/nl/concepts/queue)
