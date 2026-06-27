---
read_when:
    - Sie möchten code_execution aktivieren oder konfigurieren
    - Sie möchten Remote-Analyse ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit Remote-Python-Analyse kombinieren
summary: 'code_execution: Sandbox-geschützte Remote-Python-Analyse mit xAI ausführen'
title: Codeausführung
x-i18n:
    generated_at: "2026-06-27T18:16:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` führt sandboxed entfernte Python-Analysen über die Responses API von xAI aus. Es wird vom gebündelten `xai`-Plugin registriert (unter dem `tools`-Vertrag) und leitet an denselben `https://api.x.ai/v1/responses`-Endpoint weiter, den auch `x_search` verwendet.

| Eigenschaft        | Wert                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| Tool-Name          | `code_execution`                                                                  |
| Provider-Plugin    | `xai` (gebündelt, `enabledByDefault: true`)                                       |
| Auth               | xAI-Auth-Profil, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` |
| Standardmodell     | `grok-4-1-fast`                                                                   |
| Standard-Timeout   | 30 Sekunden                                                                       |
| Standard-`maxTurns` | nicht gesetzt (xAI wendet sein eigenes internes Limit an)                         |

Dies unterscheidet sich vom lokalen [`exec`](/de/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Rechner oder gekoppelten Node aus.
- `code_execution` führt Python in der entfernten Sandbox von xAI aus.

Verwenden Sie `code_execution` für:

- Berechnungen.
- Tabellierung.
- Schnelle Statistiken.
- Diagrammartige Analysen.
- Analysen von Daten, die von `x_search` oder `web_search` zurückgegeben wurden.

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repo oder gekoppelte Geräte benötigen. Verwenden Sie dafür [`exec`](/de/tools/exec).

## Einrichtung

<Steps>
  <Step title="Provide xAI credentials">
    Melden Sie sich mit Grok OAuth über ein berechtigtes SuperGrok- oder X Premium-Abonnement an,
    oder speichern Sie einen API-Schlüssel. xAI OAuth verwendet die Gerätecode-Verifizierung und funktioniert daher
    von entfernten Hosts aus ohne localhost-Callback. OAuth funktioniert für
    `code_execution` und `x_search`; `XAI_API_KEY` oder die Plugin-Web-Search-Konfiguration
    können auch Grok `web_search` bereitstellen.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Bei einer Neuinstallation sind dieselben Auth-Optionen im
    Onboarding verfügbar:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Oder verwenden Sie einen API-Schlüssel:

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    `code_execution` ist verfügbar, wenn xAI-Anmeldedaten vorhanden sind. Setzen Sie
    `plugins.entries.xai.config.codeExecution.enabled` auf `false`, um es zu deaktivieren,
    oder verwenden Sie denselben Block, um Modell und Timeout anzupassen.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` erscheint in der Tool-Liste des Agenten, sobald sich das xAI-Plugin erneut mit `enabled: true` registriert.

  </Step>
</Steps>

## Verwendung

Fragen Sie natürlich und machen Sie die Analyseabsicht ausdrücklich:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Das Tool nimmt intern einen einzelnen `task`-Parameter entgegen. Daher sollte der Agent die vollständige Analyseanfrage und alle Inline-Daten in einem Prompt senden.

## Fehler

Wenn das Tool ohne Auth ausgeführt wird, gibt es einen strukturierten `missing_xai_api_key`-Fehler zurück, der auf Auth-Profil, Umgebungsvariable und Konfigurationsoptionen verweist. Der Fehler ist JSON, keine ausgelöste Exception, sodass der Agent sich selbst korrigieren kann:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limits

- Dies ist entfernte xAI-Ausführung, keine lokale Prozessausführung.
- Behandeln Sie Ergebnisse als flüchtige Analyse, nicht als persistente Notebook-Sitzung.
- Gehen Sie nicht davon aus, dass Zugriff auf lokale Dateien oder Ihren Arbeitsbereich besteht.
- Für aktuelle X-Daten verwenden Sie zuerst [`x_search`](/de/tools/web#x_search) und leiten das Ergebnis in `code_execution` weiter.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Lokale Shell-Ausführung auf Ihrem Rechner oder gekoppelten Node.
  </Card>
  <Card title="Exec approvals" href="/de/tools/exec-approvals" icon="shield">
    Zulassen-/Ablehnen-Richtlinie für Shell-Ausführung.
  </Card>
  <Card title="Web tools" href="/de/tools/web" icon="globe">
    `web_search`, `x_search` und `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/de/providers/xai" icon="microchip">
    Grok-Modelle, Web-/X-Suche und Code-Ausführungskonfiguration.
  </Card>
</CardGroup>
