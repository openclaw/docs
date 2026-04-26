---
read_when:
    - Sie möchten Ollama für `web_search` verwenden
    - Sie möchten einen schlüsselfreien `web_search`-Anbieter
    - Sie benötigen Anleitungen zur Einrichtung der Ollama-Websuche
summary: Ollama-Websuche über Ihren konfigurierten Ollama-Host
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-04-26T11:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw unterstützt **Ollama-Websuche** als gebündelten `web_search`-Anbieter. Sie
verwendet die Web-Search-API von Ollama und gibt strukturierte Ergebnisse mit Titeln, URLs
und Snippets zurück.

Im Unterschied zum Ollama-Modellanbieter benötigt diese Einrichtung standardmäßig
keinen API-Schlüssel. Erforderlich sind jedoch:

- ein Ollama-Host, der von OpenClaw aus erreichbar ist
- `ollama signin`

## Einrichtung

<Steps>
  <Step title="Ollama starten">
    Stellen Sie sicher, dass Ollama installiert ist und läuft.
  </Step>
  <Step title="Anmelden">
    Führen Sie aus:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama-Websuche auswählen">
    Führen Sie aus:

    ```bash
    openclaw configure --section web
    ```

    Wählen Sie dann **Ollama-Websuche** als Anbieter aus.

  </Step>
</Steps>

Wenn Sie Ollama bereits für Modelle verwenden, nutzt die Ollama-Websuche denselben
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

Optionale Überschreibung des Ollama-Hosts:

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

Wenn keine explizite Ollama-Basis-URL gesetzt ist, verwendet OpenClaw `http://127.0.0.1:11434`.

Wenn Ihr Ollama-Host Bearer-Authentifizierung erwartet, verwendet OpenClaw
`models.providers.ollama.apiKey` (oder die entsprechende env-gestützte Anbieter-Authentifizierung)
auch für Web-Search-Anfragen erneut.

## Hinweise

- Für diesen Anbieter ist kein API-Schlüsselfeld speziell für die Websuche erforderlich.
- Wenn der Ollama-Host authentifizierungsgeschützt ist, verwendet OpenClaw den normalen
  API-Schlüssel des Ollama-Anbieters erneut, falls vorhanden.
- OpenClaw warnt während der Einrichtung, wenn Ollama nicht erreichbar ist oder keine Anmeldung
  besteht, blockiert die Auswahl jedoch nicht.
- Die Auto-Erkennung zur Laufzeit kann auf Ollama-Websuche zurückfallen, wenn kein Anbieter mit
  höherer Priorität und konfigurierten Zugangsdaten vorhanden ist.
- Der Anbieter verwendet den Endpunkt `/api/web_search` von Ollama.

## Verwandt

- [Überblick zur Websuche](/de/tools/web) -- alle Anbieter und Auto-Erkennung
- [Ollama](/de/providers/ollama) -- Einrichtung von Ollama-Modellen und Cloud-/lokale Modi
