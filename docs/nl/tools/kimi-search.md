---
read_when:
    - Je wilt Kimi gebruiken voor web_search
    - Je hebt een KIMI_API_KEY of MOONSHOT_API_KEY nodig
summary: Kimi-webzoekfunctie via Moonshot-webzoekfunctie
title: Kimi zoeken
x-i18n:
    generated_at: "2026-04-29T23:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw ondersteunt Kimi als `web_search`-provider, met Moonshot-webzoekfunctie
om door AI gesynthetiseerde antwoorden met citaties te produceren.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Create a key">
    Haal een API-sleutel op bij [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Store the key">
    Stel `KIMI_API_KEY` of `MOONSHOT_API_KEY` in de Gateway-omgeving in, of
    configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- het standaard Kimi-webzoekmodel (standaard `kimi-k2.6`)

## Configuratie

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Als je de China API-host voor chat gebruikt (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), gebruikt OpenClaw diezelfde host opnieuw voor Kimi
`web_search` wanneer `tools.web.search.kimi.baseUrl` is weggelaten, zodat sleutels van
[platform.moonshot.cn](https://platform.moonshot.cn/) niet per ongeluk het
internationale endpoint raken (dat vaak HTTP 401 retourneert). Overschrijf dit
met `tools.web.search.kimi.baseUrl` wanneer je een andere basis-URL voor zoeken nodig hebt.

**Omgevingsalternatief:** stel `KIMI_API_KEY` of `MOONSHOT_API_KEY` in de
Gateway-omgeving in. Voor een Gateway-installatie plaats je dit in `~/.openclaw/.env`.

Als je `baseUrl` weglaat, gebruikt OpenClaw standaard `https://api.moonshot.ai/v1`.
Als je `model` weglaat, gebruikt OpenClaw standaard `kimi-k2.6`.

## Hoe het werkt

Kimi gebruikt Moonshot-webzoekfunctie om antwoorden met inline citaties te synthetiseren,
vergelijkbaar met Gemini en Groks aanpak voor gegronde antwoorden.

## Ondersteunde parameters

Kimi-zoekopdrachten ondersteunen `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Kimi
retourneert nog steeds één gesynthetiseerd antwoord met citaties in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Webzoekoverzicht](/nl/tools/web) -- alle providers en automatische detectie
- [Moonshot AI](/nl/providers/moonshot) -- documentatie voor Moonshot-model en Kimi Coding-provider
- [Gemini Search](/nl/tools/gemini-search) -- door AI gesynthetiseerde antwoorden via Google-grounding
- [Grok Search](/nl/tools/grok-search) -- door AI gesynthetiseerde antwoorden via xAI-grounding
