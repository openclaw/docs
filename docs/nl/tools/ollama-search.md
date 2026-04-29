---
read_when:
    - Je wilt Ollama gebruiken voor web_search
    - Je wilt een web_search-provider zonder sleutel
    - Je wilt de gehoste Ollama-webzoekfunctie gebruiken met OLLAMA_API_KEY
    - Je hebt hulp nodig bij het instellen van Ollama Web Search
summary: Ollama-webzoekfunctie via een lokale Ollama-host of de gehoste Ollama-API
title: Ollama-webzoekfunctie
x-i18n:
    generated_at: "2026-04-29T23:26:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw ondersteunt **Ollama Web Search** als een meegeleverde `web_search`-provider. Deze gebruikt de webzoek-API van Ollama en retourneert gestructureerde resultaten met titels, URL's en fragmenten.

Voor lokale of zelf gehoste Ollama heeft deze configuratie standaard geen API-sleutel nodig. Wel vereist dit:

- een Ollama-host die bereikbaar is vanuit OpenClaw
- `ollama signin`

Voor direct gehost zoeken stelt u de basis-URL van de Ollama-provider in op `https://ollama.com` en geeft u een echte `OLLAMA_API_KEY` op.

## Configuratie

<Steps>
  <Step title="Start Ollama">
    Zorg dat Ollama is geinstalleerd en actief is.
  </Step>
  <Step title="Sign in">
    Voer uit:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    Voer uit:

    ```bash
    openclaw configure --section web
    ```

    Selecteer vervolgens **Ollama Web Search** als provider.

  </Step>
</Steps>

Als u Ollama al voor modellen gebruikt, hergebruikt Ollama Web Search dezelfde geconfigureerde host.

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

Optionele override voor de Ollama-host:

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

Als u Ollama al als modelprovider configureert, kan de webzoek-provider in plaats daarvan die host hergebruiken:

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

Als uw Ollama-host bearer-authenticatie verwacht, hergebruikt OpenClaw `models.providers.ollama.apiKey` (of de overeenkomende door env ondersteunde provider-authenticatie) voor verzoeken naar die geconfigureerde host.

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
- Als de Ollama-host met authenticatie is beveiligd, hergebruikt OpenClaw de normale API-sleutel van de Ollama-provider wanneer die aanwezig is.
- Als `baseUrl` `https://ollama.com` is, roept OpenClaw `https://ollama.com/api/web_search` rechtstreeks aan en verzendt het de geconfigureerde Ollama-API-sleutel als bearer-authenticatie.
- Als de geconfigureerde host geen webzoekfunctie beschikbaar stelt en `OLLAMA_API_KEY` is ingesteld, kan OpenClaw terugvallen op `https://ollama.com/api/web_search` zonder die env-sleutel naar de lokale host te verzenden.
- OpenClaw waarschuwt tijdens de configuratie als Ollama niet bereikbaar is of niet is aangemeld, maar blokkeert de selectie niet.
- Automatische detectie tijdens runtime kan terugvallen op Ollama Web Search wanneer er geen geconfigureerde provider met referenties en hogere prioriteit is.
- Lokale Ollama-daemonhosts gebruiken het lokale proxy-eindpunt `/api/experimental/web_search`, dat ondertekent en doorstuurt naar Ollama Cloud.
- `https://ollama.com`-hosts gebruiken het openbare gehoste eindpunt `/api/web_search` rechtstreeks met bearer-API-sleutelauthenticatie.

## Gerelateerd

- [Overzicht van webzoekfunctie](/nl/tools/web) -- alle providers en automatische detectie
- [Ollama](/nl/providers/ollama) -- configuratie van Ollama-modellen en cloud-/lokale modi
