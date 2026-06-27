---
read_when:
    - Sie möchten Ollama für web_search verwenden
    - Sie möchten einen web_search-Provider ohne Schlüssel
    - Sie möchten die gehostete Ollama-Websuche mit OLLAMA_API_KEY verwenden
    - Sie benötigen Anleitung zur Einrichtung der Ollama-Websuche
summary: Ollama-Websuche über einen lokalen Ollama-Host oder die gehostete Ollama-API
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-06-27T18:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider. Er
verwendet Ollamas Websuche-API und gibt strukturierte Ergebnisse mit Titeln,
URLs und Snippets zurück.

Für lokales oder selbst gehostetes Ollama benötigt diese Einrichtung standardmäßig
keinen API-Schlüssel. Erforderlich sind jedoch:

- ein Ollama-Host, der von OpenClaw aus erreichbar ist
- `ollama signin`

Für direkte gehostete Suche setzen Sie die Basis-URL des Ollama-Providers auf `https://ollama.com`
und geben Sie einen echten `OLLAMA_API_KEY` an.

## Einrichtung

<Steps>
  <Step title="Ollama starten">
    Stellen Sie sicher, dass Ollama installiert ist und ausgeführt wird.
  </Step>
  <Step title="Anmelden">
    Führen Sie aus:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search auswählen">
    Führen Sie aus:

    ```bash
    openclaw configure --section web
    ```

    Wählen Sie anschließend **Ollama Web Search** als Provider aus.

  </Step>
</Steps>

Wenn Sie Ollama bereits für Modelle verwenden, nutzt Ollama Web Search denselben
konfigurierten Host wieder.

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

Optionales Überschreiben des Ollama-Hosts:

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

Wenn Sie Ollama bereits als Modell-Provider konfigurieren, kann der Websuche-Provider
stattdessen diesen Host wiederverwenden:

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

Der Ollama-Modell-Provider verwendet `baseUrl` als kanonischen Schlüssel. Der Websuche-Provider berücksichtigt außerdem `baseURL` unter `models.providers.ollama`, um mit Konfigurationsbeispielen im Stil des OpenAI SDK kompatibel zu sein.

Wenn keine explizite Ollama-Basis-URL festgelegt ist, verwendet OpenClaw `http://127.0.0.1:11434`.

Wenn Ihr Ollama-Host Bearer-Authentifizierung erwartet, verwendet OpenClaw
`models.providers.ollama.apiKey` (oder die passende env-gestützte Provider-Authentifizierung)
für Anfragen an diesen konfigurierten Host wieder.

Direkte gehostete Ollama Web Search:

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

## Hinweise

- Für diesen Provider ist kein eigenes API-Schlüsselfeld für die Websuche erforderlich.
- Wenn der Ollama-Host durch Authentifizierung geschützt ist, verwendet OpenClaw den normalen Ollama
  Provider-API-Schlüssel wieder, sofern vorhanden.
- Wenn `baseUrl` `https://ollama.com` ist, ruft OpenClaw
  `https://ollama.com/api/web_search` direkt auf und sendet den konfigurierten Ollama
  API-Schlüssel als Bearer-Authentifizierung.
- Wenn der konfigurierte Host keine Websuche bereitstellt und `OLLAMA_API_KEY` gesetzt ist,
  kann OpenClaw auf `https://ollama.com/api/web_search` zurückfallen, ohne
  diesen env-Schlüssel an den lokalen Host zu senden.
- OpenClaw warnt während der Einrichtung, wenn Ollama nicht erreichbar oder nicht angemeldet ist,
  blockiert die Auswahl jedoch nicht.
- OpenClaw wählt Ollama Web Search nicht automatisch aus, wenn kein höher priorisierter
  Provider mit Zugangsdaten konfiguriert ist; wählen Sie ihn explizit mit
  `tools.web.search.provider: "ollama"`.
- Lokale Ollama-Daemon-Hosts verwenden den lokalen Proxy-Endpunkt
  `/api/experimental/web_search`, der signiert und an Ollama Cloud weiterleitet.
- `https://ollama.com`-Hosts verwenden den öffentlichen gehosteten Endpunkt
  `/api/web_search` direkt mit Bearer-Authentifizierung per API-Schlüssel.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Ollama](/de/providers/ollama) -- Einrichtung des Ollama-Modells und Cloud-/lokale Modi
