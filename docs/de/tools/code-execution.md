---
read_when:
    - Sie möchten code_execution aktivieren oder konfigurieren
    - Sie möchten eine Remote-Analyse ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit Remote-Python-Analyse kombinieren
summary: 'code_execution: Python-Analyse mit xAI auf einem entfernten System in einer Sandbox ausführen'
title: Codeausführung
x-i18n:
    generated_at: "2026-05-06T07:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` führt sandboxed Remote-Python-Analysen über xAIs Responses API aus. Es wird vom gebündelten `xai`-Plugin registriert (unter dem `tools`-Contract) und leitet Anfragen an denselben `https://api.x.ai/v1/responses`-Endpunkt weiter, der auch von `x_search` verwendet wird.

| Eigenschaft         | Wert                                                           |
| ------------------- | -------------------------------------------------------------- |
| Werkzeugname        | `code_execution`                                               |
| Provider-Plugin     | `xai` (gebündelt, `enabledByDefault: true`)                    |
| Authentifizierung   | `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` |
| Standardmodell      | `grok-4-1-fast`                                                |
| Standard-Timeout    | 30 Sekunden                                                    |
| Standard-`maxTurns` | nicht gesetzt (xAI wendet ein eigenes internes Limit an)       |

Dies unterscheidet sich von lokalem [`exec`](/de/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Computer oder Ihrer gekoppelten Node aus.
- `code_execution` führt Python in xAIs Remote-Sandbox aus.

Verwenden Sie `code_execution` für:

- Berechnungen.
- Tabellenaufbereitung.
- Schnelle Statistiken.
- Diagrammartige Analysen.
- Analysen von Daten, die von `x_search` oder `web_search` zurückgegeben wurden.

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repository oder gekoppelte Geräte benötigen. Verwenden Sie dafür [`exec`](/de/tools/exec).

## Einrichtung

<Steps>
  <Step title="Einen xAI-API-Schlüssel bereitstellen">
    Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung, oder konfigurieren Sie den Schlüssel unter dem xAI-Plugin, sodass dieselben Anmeldedaten `code_execution`, `x_search`, Websuche und andere xAI-Werkzeuge abdecken:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Oder über die Konfiguration:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution aktivieren und abstimmen">
    Das Werkzeug wird über `plugins.entries.xai.config.codeExecution.enabled` gesteuert. Standardmäßig ist es deaktiviert.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` erscheint in der Werkzeugliste des Agenten, sobald sich das xAI-Plugin erneut mit `enabled: true` registriert.

  </Step>
</Steps>

## Verwendung

Fragen Sie natürlich und machen Sie die Analyseabsicht explizit:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Das Werkzeug verwendet intern einen einzelnen `task`-Parameter. Daher sollte der Agent die vollständige Analyseanfrage und alle Inline-Daten in einem Prompt senden.

## Fehler

Wenn das Werkzeug ohne Authentifizierung ausgeführt wird, gibt es einen strukturierten `missing_xai_api_key`-Fehler zurück, der auf die Umgebungsvariable und den Konfigurationspfad verweist. Der Fehler ist JSON und keine ausgelöste Exception, sodass der Agent sich selbst korrigieren kann:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limits

- Dies ist Remote-Ausführung über xAI, keine lokale Prozessausführung.
- Behandeln Sie Ergebnisse als flüchtige Analyse, nicht als persistente Notebook-Sitzung.
- Gehen Sie nicht davon aus, dass Zugriff auf lokale Dateien oder Ihren Arbeitsbereich besteht.
- Verwenden Sie für aktuelle X-Daten zuerst [`x_search`](/de/tools/web#x_search) und leiten Sie das Ergebnis in `code_execution` weiter.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec-Werkzeug" href="/de/tools/exec" icon="terminal">
    Lokale Shell-Ausführung auf Ihrem Computer oder Ihrer gekoppelten Node.
  </Card>
  <Card title="Exec-Genehmigungen" href="/de/tools/exec-approvals" icon="shield">
    Zulassen-/Ablehnen-Richtlinie für Shell-Ausführung.
  </Card>
  <Card title="Web-Werkzeuge" href="/de/tools/web" icon="globe">
    `web_search`, `x_search` und `web_fetch`.
  </Card>
  <Card title="xAI-Provider" href="/de/providers/xai" icon="microchip">
    Grok-Modelle, Web-/X-Suche und Konfiguration für Codeausführung.
  </Card>
</CardGroup>
