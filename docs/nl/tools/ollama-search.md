---
read_when:
    - Je wilt Ollama gebruiken voor web_search
    - Je wilt een sleutelvrije web_search-provider
    - Je wilt gehoste Ollama Web Search gebruiken met OLLAMA_API_KEY
    - Je hebt hulp nodig bij het instellen van Ollama Web Search
summary: Ollama Web Search via een lokale Ollama-host of de gehoste Ollama-API
title: Ollama-webzoekfunctie
x-i18n:
    generated_at: "2026-06-27T18:28:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw ondersteunt **Ollama Web Search** als een meegeleverde `web_search`-provider. Het
gebruikt Ollama's webzoek-API en retourneert gestructureerde resultaten met titels, URL's
en fragmenten.

Voor lokale of zelfgehoste Ollama heeft deze configuratie standaard geen API-sleutel
nodig. Het vereist wel:

- een Ollama-host die bereikbaar is vanuit OpenClaw
- `ollama signin`

Voor direct gehost zoeken stelt u de basis-URL van de Ollama-provider in op `https://ollama.com`
en geeft u een echte `OLLAMA_API_KEY` op.

## Configuratie

<Steps>
  <Step title="Ollama starten">
    Zorg ervoor dat Ollama is geïnstalleerd en actief is.
  </Step>
  <Step title="Aanmelden">
    Voer uit:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search kiezen">
    Voer uit:

    ```bash
    openclaw configure --section web
    ```

    Selecteer vervolgens **Ollama Web Search** als provider.

  </Step>
</Steps>

Als u Ollama al voor modellen gebruikt, hergebruikt Ollama Web Search dezelfde
geconfigureerde host.

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

Optionele overschrijving van Ollama-host:

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

Als u Ollama al configureert als modelprovider, kan de webzoek-provider
in plaats daarvan die host hergebruiken:

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

De Ollama-modelprovider gebruikt `baseUrl` als canonieke sleutel. De webzoek-provider respecteert ook `baseURL` op `models.providers.ollama` voor compatibiliteit met configuratievoorbeelden in OpenAI SDK-stijl.

Als er geen expliciete Ollama-basis-URL is ingesteld, gebruikt OpenClaw `http://127.0.0.1:11434`.

Als uw Ollama-host bearer-auth verwacht, hergebruikt OpenClaw
`models.providers.ollama.apiKey` (of de overeenkomende via env ondersteunde provider-auth)
voor aanvragen naar die geconfigureerde host.

Direct gehoste Ollama Web Search:

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

## Opmerkingen

- Voor deze provider is geen webzoek-specifiek API-sleutelveld vereist.
- Als de Ollama-host met auth is beveiligd, hergebruikt OpenClaw de normale Ollama
  provider-API-sleutel wanneer die aanwezig is.
- Als `baseUrl` `https://ollama.com` is, roept OpenClaw
  `https://ollama.com/api/web_search` direct aan en verzendt de geconfigureerde Ollama
  API-sleutel als bearer-auth.
- Als de geconfigureerde host geen web search aanbiedt en `OLLAMA_API_KEY` is ingesteld,
  kan OpenClaw terugvallen op `https://ollama.com/api/web_search` zonder
  die env-sleutel naar de lokale host te verzenden.
- OpenClaw waarschuwt tijdens de configuratie als Ollama onbereikbaar is of niet is aangemeld, maar
  blokkeert de selectie niet.
- OpenClaw selecteert Ollama Web Search niet automatisch wanneer er geen credentialed provider met hogere prioriteit
  is geconfigureerd; kies deze expliciet met
  `tools.web.search.provider: "ollama"`.
- Lokale Ollama-daemonhosts gebruiken het lokale proxy-eindpunt
  `/api/experimental/web_search`, dat ondertekent en doorstuurt naar Ollama Cloud.
- `https://ollama.com`-hosts gebruiken het openbaar gehoste eindpunt
  `/api/web_search` direct met bearer API-sleutel-auth.

## Gerelateerd

- [Overzicht Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Ollama](/nl/providers/ollama) -- Ollama-modelconfiguratie en cloud-/lokale modi
