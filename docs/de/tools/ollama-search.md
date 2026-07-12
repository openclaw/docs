---
read_when:
    - Sie möchten Ollama für web_search verwenden
    - Sie möchten einen Websuche-Provider ohne API-Schlüssel
    - Sie möchten die gehostete Ollama-Websuche mit OLLAMA_API_KEY verwenden
    - Sie benötigen eine Anleitung zur Einrichtung der Ollama-Websuche
summary: Ollama-Websuche über einen lokalen Ollama-Host oder die gehostete Ollama-API
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-07-12T02:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider,
der Titel, URLs und Textauszüge von Ollamas Websuch-API zurückgibt.

Für lokales/selbst gehostetes Ollama ist standardmäßig kein API-Schlüssel erforderlich; benötigt werden ein erreichbarer
Ollama-Host sowie `ollama signin`. Die direkte gehostete Suche (ohne lokales Ollama) erfordert
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
  OpenClaw wählt Ollama Web Search niemals automatisch anstelle eines höher priorisierten
  Providers mit Anmeldedaten aus; Sie müssen ihn ausdrücklich über
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

Optionale Host-Überschreibung, ausschließlich für die Websuche:

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

`models.providers.ollama.baseUrl` ist der kanonische Schlüssel; der Websuch-
Provider akzeptiert dort zur Kompatibilität mit Konfigurationsbeispielen im Stil des OpenAI SDK auch `baseURL`.
Wenn nichts festgelegt ist, verwendet OpenClaw standardmäßig
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

- Es gibt kein eigenes API-Schlüsselfeld für die Websuche; der Provider verwendet
  `models.providers.ollama.apiKey` (oder die entsprechende umgebungsvariablengestützte Provider-Authentifizierung),
  wenn der konfigurierte Host durch Authentifizierung geschützt ist.
- Reihenfolge der Host-Auflösung: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (oder `baseURL`) → `http://127.0.0.1:11434`.
- Wenn der aufgelöste Host `https://ollama.com` lautet, ruft OpenClaw
  `https://ollama.com/api/web_search` direkt auf und verwendet den API-Schlüssel für die Bearer-
  Authentifizierung.
- Andernfalls ruft OpenClaw zuerst den lokalen Proxy-Endpunkt
  `/api/experimental/web_search` auf (der die Anfrage signiert und an Ollama
  Cloud weiterleitet) und greift anschließend auf `/api/web_search` auf demselben Host zurück. Wenn beide Aufrufe fehlschlagen
  und `OLLAMA_API_KEY` gesetzt ist, versucht OpenClaw den Aufruf einmal erneut über
  `https://ollama.com/api/web_search` mit diesem Schlüssel – ohne ihn an
  den lokalen Host zu senden.
- OpenClaw warnt während der Einrichtung, wenn Ollama nicht erreichbar oder nicht angemeldet ist,
  verhindert jedoch nicht die Auswahl des Providers.

## Verwandte Themen

- [Übersicht über die Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Ollama](/de/providers/ollama) -- Einrichtung von Ollama-Modellen sowie Cloud- und lokale Modi
