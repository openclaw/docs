---
read_when:
    - Retrygedrag of standaardinstellingen van de provider bijwerken
    - Fouten bij verzending via providers of snelheidslimieten debuggen
summary: Beleid voor nieuwe pogingen bij uitgaande provideroproepen
title: Beleid voor nieuwe pogingen
x-i18n:
    generated_at: "2026-07-12T08:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Doelen

- Probeer opnieuw per HTTP-verzoek, niet per meerstapsproces.
- Behoud de volgorde door alleen de huidige stap opnieuw te proberen.
- Voorkom duplicatie van niet-idempotente bewerkingen.

## Standaardwaarden

| Instelling                  | Standaard |
| --------------------------- | --------- |
| Aantal pogingen             | 3         |
| Maximale vertragingslimiet  | 30000 ms  |
| Willekeurige afwijking      | 0.1 (10%) |
| Minimale Telegram-vertraging | 400 ms   |
| Minimale Discord-vertraging | 500 ms    |

## Gedrag

### Modelproviders

- OpenClaw laat SDK's van providers normale korte nieuwe pogingen afhandelen.
- Voor op Stainless gebaseerde SDK's, zoals Anthropic en OpenAI, kunnen antwoorden die opnieuw kunnen worden geprobeerd (`408`, `409`, `429` en `5xx`) `retry-after-ms` of `retry-after` bevatten. Wanneer die wachttijd langer is dan 60 seconden, voegt OpenClaw `x-should-retry: false` toe, zodat de SDK de fout onmiddellijk doorgeeft en modelomschakeling naar een ander authenticatieprofiel of reservemodel kan overschakelen.
- Overschrijf de limiet met `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Stel deze in op `0`, `false`, `off`, `none` of `disabled` om SDK's lange wachttijden uit `Retry-After` intern te laten respecteren.

### Discord

- Probeert opnieuw bij snelheidslimietfouten (HTTP 429), time-outs van verzoeken, HTTP 5xx-antwoorden en tijdelijke transportfouten, zoals mislukte DNS-zoekopdrachten, verbroken verbindingen, gesloten sockets en ophaalfouten.
- Gebruikt Discord `retry_after` wanneer beschikbaar, anders exponentiële wachttijden.

### Telegram

- Probeert opnieuw bij tijdelijke fouten (429, time-out, verbinding mislukt/opnieuw ingesteld/gesloten, tijdelijk niet beschikbaar).
- Gebruikt `retry_after` wanneer beschikbaar, anders exponentiële wachttijden.
- HTML-/Markdown-parseerfouten worden niet opnieuw geprobeerd; bij de eerste poging wordt teruggevallen op platte tekst.

## Configuratie

Stel het beleid voor nieuwe pogingen per provider in `~/.openclaw/openclaw.json` in:

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

- Nieuwe pogingen gelden per verzoek (bericht verzenden, media uploaden, reactie, peiling, sticker).
- Samengestelde processen proberen voltooide stappen niet opnieuw.

## Gerelateerd

- [Modelomschakeling](/nl/concepts/model-failover)
- [Opdrachtwachtrij](/nl/concepts/queue)
