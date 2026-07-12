---
read_when:
    - Je wilt Ollama gebruiken voor web_search
    - Je wilt een web_search-provider zonder sleutel
    - Je wilt gehoste Ollama Web Search gebruiken met OLLAMA_API_KEY
    - Je hebt hulp nodig bij het instellen van Ollama Web Search
summary: Ollama-webzoekopdracht via een lokale Ollama-host of de gehoste Ollama-API
title: Ollama-zoekopdracht op het web
x-i18n:
    generated_at: "2026-07-12T09:30:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw ondersteunt **Ollama Web Search** als meegeleverde `web_search`-provider,
die titels, URL's en fragmenten retourneert vanuit Ollama's API voor zoeken op het web.

Voor lokale/zelfgehoste Ollama is standaard geen API-sleutel nodig; hiervoor zijn een bereikbare
Ollama-host en `ollama signin` vereist. Rechtstreeks gehost zoeken (zonder lokale Ollama) vereist
`baseUrl: "https://ollama.com"` en een echte `OLLAMA_API_KEY`.

## Instellen

<Steps>
  <Step title="Ollama starten">
    Zorg ervoor dat Ollama is geïnstalleerd en actief is.
  </Step>
  <Step title="Aanmelden">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Ollama Web Search kiezen">
    ```bash
    openclaw configure --section web
    ```

    Selecteer **Ollama Web Search** als provider.

  </Step>
</Steps>

Als je Ollama al voor modellen gebruikt, gebruikt Ollama Web Search dezelfde
geconfigureerde host.

<Note>
  OpenClaw selecteert Ollama Web Search nooit automatisch boven een provider
  met hogere prioriteit waarvoor aanmeldgegevens zijn ingesteld; je moet deze expliciet kiezen met
  `tools.web.search.provider: "ollama"`.
</Note>

## Configuratie

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Optionele hostoverschrijving, uitsluitend voor zoeken op het web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Of gebruik de host opnieuw die al voor de Ollama-modelprovider is geconfigureerd:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` is de canonieke sleutel; de provider voor
zoeken op het web accepteert daar voor compatibiliteit met configuratievoorbeelden
in de stijl van de OpenAI SDK ook `baseURL`. Als niets is ingesteld, gebruikt OpenClaw standaard
`http://127.0.0.1:11434`.

Rechtstreeks gehoste Ollama Web Search (zonder lokale Ollama):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Authenticatie en routering van verzoeken

- Er bestaat geen specifiek API-sleutelveld voor zoeken op het web; de provider gebruikt
  `models.providers.ollama.apiKey` (of de bijbehorende, door een omgevingsvariabele
  ondersteunde providerauthenticatie) wanneer de geconfigureerde host door authenticatie is beveiligd.
- Volgorde voor hostresolutie: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (of `baseURL`) → `http://127.0.0.1:11434`.
- Als de opgeloste host `https://ollama.com` is, roept OpenClaw
  `https://ollama.com/api/web_search` rechtstreeks aan met de API-sleutel als
  bearer-authenticatie.
- Anders roept OpenClaw eerst het lokale proxy-eindpunt
  `/api/experimental/web_search` aan (dat het verzoek ondertekent en doorstuurt naar Ollama
  Cloud) en valt daarna terug op `/api/web_search` op dezelfde host. Als beide mislukken
  en `OLLAMA_API_KEY` is ingesteld, probeert het eenmaal opnieuw via
  `https://ollama.com/api/web_search` met die sleutel — zonder deze naar
  de lokale host te sturen.
- OpenClaw waarschuwt tijdens het instellen als Ollama niet bereikbaar is of als je niet
  bent aangemeld, maar blokkeert het selecteren van de provider niet.

## Gerelateerd

- [Overzicht van zoeken op het web](/nl/tools/web) -- alle providers en automatische detectie
- [Ollama](/nl/providers/ollama) -- instelling van Ollama-modellen en cloud-/lokale modi
