---
read_when:
    - Bijwerken van herhaalgedrag of standaardinstellingen voor providers
    - Provider-verzendfouten of snelheidslimieten debuggen
summary: Beleid voor opnieuw proberen bij uitgaande provideraanroepen
title: Beleid voor nieuwe pogingen
x-i18n:
    generated_at: "2026-04-29T22:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 16
---

## Doelen

- Probeer opnieuw per HTTP-verzoek, niet per meerstappenstroom.
- Behoud de volgorde door alleen de huidige stap opnieuw te proberen.
- Voorkom dubbele niet-idempotente bewerkingen.

## Standaardwaarden

- Pogingen: 3
- Maximale vertragingslimiet: 30000 ms
- Jitter: 0.1 (10 procent)
- Provider-standaardwaarden:
  - Minimale vertraging voor Telegram: 400 ms
  - Minimale vertraging voor Discord: 500 ms

## Gedrag

### Modelproviders

- OpenClaw laat provider-SDK's normale korte herpogingen afhandelen.
- Voor op Stainless gebaseerde SDK's zoals Anthropic en OpenAI kunnen antwoorden
  waarop opnieuw geprobeerd kan worden (`408`, `409`, `429` en `5xx`)
  `retry-after-ms` of `retry-after` bevatten. Wanneer die wachttijd langer is
  dan 60 seconden, voegt OpenClaw `x-should-retry: false` toe, zodat de SDK de
  fout onmiddellijk doorgeeft en model-failover naar een ander auth-profiel of
  fallbackmodel kan roteren.
- Overschrijf de limiet met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Stel deze in op `0`, `false`, `off`, `none` of `disabled` om SDK's lange
  interne `Retry-After`-wachttijden te laten respecteren.

### Discord

- Probeert alleen opnieuw bij rate-limit-fouten (HTTP 429).
- Gebruikt Discord `retry_after` wanneer beschikbaar, anders exponentiële backoff.

### Telegram

- Probeert opnieuw bij tijdelijke fouten (429, time-out, connect/reset/closed, tijdelijk niet beschikbaar).
- Gebruikt `retry_after` wanneer beschikbaar, anders exponentiële backoff.
- Markdown-parsefouten worden niet opnieuw geprobeerd; ze vallen terug op platte tekst.

## Configuratie

Stel het herpogingsbeleid per provider in `~/.openclaw/openclaw.json` in:

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

- Herpogingen gelden per verzoek (bericht verzenden, media uploaden, reactie, poll, sticker).
- Samengestelde stromen proberen voltooide stappen niet opnieuw.

## Gerelateerd

- [Model-failover](/nl/concepts/model-failover)
- [Opdrachtwachtrij](/nl/concepts/queue)
