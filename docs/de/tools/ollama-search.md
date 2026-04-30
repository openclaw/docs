---
read_when:
    - Sie möchten Ollama für web_search verwenden
    - Sie möchten einen web_search-Provider ohne Schlüssel
    - Sie möchten die gehostete Ollama Web Search mit OLLAMA_API_KEY verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von Ollama Web Search
summary: Ollama-Websuche über einen lokalen Ollama-Host oder die gehostete Ollama-API
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-04-30T07:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider. Er
verwendet die Websuche-API von Ollama und gibt strukturierte Ergebnisse mit Titeln, URLs
und Snippets zurück.

Für lokales oder selbst gehostetes Ollama benötigt diese Einrichtung standardmäßig
keinen API-Schlüssel. Erforderlich sind:

- ein Ollama-Host, der von OpenClaw aus erreichbar ist
- `ollama signin`

Für direkte gehostete Suche setzen Sie die Basis-URL des Ollama-Providers auf `https://ollama.com`
und stellen Sie einen echten `OLLAMA_API_KEY` bereit.

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
konfigurierten Host erneut.

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
stattdessen diesen Host erneut verwenden:

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
`models.providers.ollama.apiKey` (oder die passende umgebungsvariablenbasierte Provider-Authentifizierung)
für Anfragen an diesen konfigurierten Host erneut.

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

- Für diesen Provider ist kein API-Schlüsselfeld speziell für die Websuche erforderlich.
- Wenn der Ollama-Host durch Authentifizierung geschützt ist, verwendet OpenClaw den normalen Ollama-
  Provider-API-Schlüssel erneut, sofern vorhanden.
- Wenn `baseUrl` `https://ollama.com` ist, ruft OpenClaw
  `https://ollama.com/api/web_search` direkt auf und sendet den konfigurierten Ollama-
  API-Schlüssel als Bearer-Authentifizierung.
- Wenn der konfigurierte Host keine Websuche bereitstellt und `OLLAMA_API_KEY` gesetzt ist,
  kann OpenClaw auf `https://ollama.com/api/web_search` zurückfallen, ohne
  diesen Umgebungsschlüssel an den lokalen Host zu senden.
- OpenClaw warnt während der Einrichtung, wenn Ollama nicht erreichbar oder nicht angemeldet ist,
  blockiert die Auswahl jedoch nicht.
- Die Laufzeit-Autoerkennung kann auf Ollama Web Search zurückfallen, wenn kein höher priorisierter
  Provider mit Anmeldedaten konfiguriert ist.
- Lokale Hosts des Ollama-Daemons verwenden den lokalen Proxy-Endpunkt
  `/api/experimental/web_search`, der signiert und an Ollama Cloud weiterleitet.
- `https://ollama.com`-Hosts verwenden den öffentlichen gehosteten Endpunkt
  `/api/web_search` direkt mit Bearer-API-Schlüssel-Authentifizierung.

## Verwandt

- [Überblick zur Websuche](/de/tools/web) -- alle Provider und Autoerkennung
- [Ollama](/de/providers/ollama) -- Ollama-Modelleinrichtung und Cloud-/lokale Modi
