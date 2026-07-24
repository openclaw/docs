---
read_when:
    - Sie möchten Ollama für web_search verwenden
    - Sie möchten einen Websuche-Provider ohne API-Schlüssel
    - Sie möchten die gehostete Ollama-Websuche mit `OLLAMA_API_KEY` verwenden
    - Sie benötigen eine Anleitung zur Einrichtung der Ollama-Websuche
summary: Ollama-Websuche über einen lokalen Ollama-Host oder die gehostete Ollama-API
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-07-24T04:45:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider
und gibt Titel, URLs und Ausschnitte aus der Websuch-API von Ollama zurück.

Lokales bzw. selbst gehostetes Ollama benötigt standardmäßig keinen API-Schlüssel; erforderlich sind ein erreichbarer
Ollama-Host sowie `ollama signin`. Die direkte gehostete Suche (ohne lokales Ollama) benötigt
`baseUrl: "https://ollama.com"` und einen echten `OLLAMA_API_KEY`.

## Einrichtung

<Steps>
  <Step title="Ollama starten">
    Stellen Sie sicher, dass Ollama installiert ist und ausgeführt wird.
  </Step>
  <Step title="Anmelden">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Ollama Web Search auswählen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie **Ollama Web Search** als Provider aus.

  </Step>
</Steps>

Wenn Sie Ollama bereits für Modelle verwenden, nutzt Ollama Web Search denselben
konfigurierten Host.

<Note>
  OpenClaw wählt Ollama Web Search niemals automatisch anstelle eines authentifizierten
  Providers mit höherer Priorität aus; Sie müssen ihn ausdrücklich mit
  `tools.web.search.provider: "ollama"` auswählen.
</Note>

## Konfiguration

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

Optionale Host-Überschreibung, die nur für die Websuche gilt:

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

Alternativ können Sie den bereits für den Ollama-Modell-Provider konfigurierten Host wiederverwenden:

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

`models.providers.ollama.baseUrl` ist der kanonische Schlüssel; der Websuch-Provider
akzeptiert dort zur Kompatibilität mit Konfigurationsbeispielen im Stil des OpenAI SDK auch
`baseURL`. Wenn nichts festgelegt ist, verwendet OpenClaw standardmäßig
`http://127.0.0.1:11434`.

Direkte gehostete Ollama Web Search (ohne lokales Ollama):

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

## Authentifizierung und Anfrageweiterleitung

- Es gibt kein Websuch-spezifisches API-Schlüsselfeld; der Provider verwendet
  `models.providers.ollama.apiKey` (oder die entsprechende umgebungsvariablenbasierte Provider-Authentifizierung),
  wenn der konfigurierte Host durch Authentifizierung geschützt ist.
- Reihenfolge der Host-Auflösung: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (oder `baseURL`) → `http://127.0.0.1:11434`.
- Wenn der aufgelöste Host `https://ollama.com` ist, ruft OpenClaw
  `https://ollama.com/api/web_search` direkt auf und verwendet den API-Schlüssel für die Bearer-
  Authentifizierung.
- Andernfalls ruft OpenClaw zunächst den lokalen Proxy-Endpunkt
  `/api/experimental/web_search` auf (der die Anfrage signiert und an Ollama
  Cloud weiterleitet) und greift anschließend auf demselben Host auf `/api/web_search` zurück. Wenn beide Aufrufe fehlschlagen
  und `OLLAMA_API_KEY` festgelegt ist, wird der Aufruf einmal mit diesem Schlüssel gegen
  `https://ollama.com/api/web_search` wiederholt — ohne ihn an
  den lokalen Host zu senden.
- OpenClaw zeigt während der Einrichtung eine Warnung an, wenn Ollama nicht erreichbar oder keine Anmeldung erfolgt ist,
  verhindert jedoch nicht die Auswahl des Providers.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Ollama](/de/providers/ollama) -- Einrichtung von Ollama-Modellen und Cloud-/lokale Modi
