---
read_when:
    - Sie möchten code_execution aktivieren oder konfigurieren
    - Sie möchten eine Remote-Analyse ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit Remote-Python-Analyse kombinieren
summary: 'code_execution: sandboxierte Remote-Python-Analyse mit xAI ausführen'
title: Codeausführung
x-i18n:
    generated_at: "2026-05-10T19:53:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` führt sandboxed Remote-Python-Analysen über die Responses API von xAI aus. Es wird vom mitgelieferten `xai`-Plugin (unter dem `tools`-Contract) registriert und leitet an denselben `https://api.x.ai/v1/responses`-Endpunkt weiter, den auch `x_search` verwendet.

| Eigenschaft            | Wert                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Tool-Name              | `code_execution`                                                                               |
| Provider-Plugin        | `xai` (mitgeliefert, `enabledByDefault: true`)                                                 |
| Authentifizierung      | xAI-Auth-Profil, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`              |
| Standardmodell         | `grok-4-1-fast`                                                                                |
| Standard-Timeout       | 30 Sekunden                                                                                    |
| Standard-`maxTurns`    | nicht gesetzt (xAI wendet sein eigenes internes Limit an)                                      |

Dies unterscheidet sich von lokalem [`exec`](/de/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Computer oder gekoppelten Node aus.
- `code_execution` führt Python in der Remote-Sandbox von xAI aus.

Verwenden Sie `code_execution` für:

- Berechnungen.
- Tabellierung.
- Schnelle Statistiken.
- Diagrammartige Analysen.
- Analyse von Daten, die von `x_search` oder `web_search` zurückgegeben wurden.

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repo oder gekoppelte Geräte benötigen. Verwenden Sie dafür [`exec`](/de/tools/exec).

## Einrichtung

<Steps>
  <Step title="Provide an xAI API key">
    Führen Sie `openclaw onboard --auth-choice xai-api-key` für `code_execution` und
    `x_search` aus, oder setzen Sie `XAI_API_KEY` / konfigurieren Sie den Schlüssel unter dem xAI-Plugin,
    wenn auch die Grok-Websuche dieselben Anmeldedaten verwenden soll:

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

  <Step title="Enable and tune code_execution">
    Das Tool ist über `plugins.entries.xai.config.codeExecution.enabled` abgesichert. Standardmäßig ist es deaktiviert.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // überschreibt das standardmäßige xAI-Code-Execution-Modell
                maxTurns: 2,            // optionale Begrenzung interner Tool-Turns
                timeoutSeconds: 30,     // Anfrage-Timeout (Standard: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` erscheint in der Tool-Liste des Agenten, sobald das xAI-Plugin erneut mit `enabled: true` registriert wurde.

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

Das Tool nimmt intern einen einzelnen `task`-Parameter entgegen, daher sollte der Agent die vollständige Analyseanfrage und alle Inline-Daten in einem Prompt senden.

## Fehler

Wenn das Tool ohne Authentifizierung ausgeführt wird, gibt es einen strukturierten `missing_xai_api_key`-Fehler zurück, der auf das Auth-Profil, die Env-Var und die Konfigurationsoptionen verweist. Der Fehler ist JSON und keine ausgelöste Exception, sodass der Agent sich selbst korrigieren kann:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Grenzen

- Dies ist Remote-Ausführung über xAI, keine lokale Prozessausführung.
- Behandeln Sie Ergebnisse als kurzlebige Analyse, nicht als persistente Notebook-Sitzung.
- Gehen Sie nicht davon aus, dass Zugriff auf lokale Dateien oder Ihren Workspace besteht.
- Verwenden Sie für aktuelle X-Daten zuerst [`x_search`](/de/tools/web#x_search) und leiten Sie das Ergebnis an `code_execution` weiter.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Lokale Shell-Ausführung auf Ihrem Computer oder gekoppelten Node.
  </Card>
  <Card title="Exec approvals" href="/de/tools/exec-approvals" icon="shield">
    Zulassen-/Ablehnen-Richtlinie für Shell-Ausführung.
  </Card>
  <Card title="Web tools" href="/de/tools/web" icon="globe">
    `web_search`, `x_search` und `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/de/providers/xai" icon="microchip">
    Grok-Modelle, Web-/X-Suche und Codeausführungskonfiguration.
  </Card>
</CardGroup>
