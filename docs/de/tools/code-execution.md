---
read_when:
    - Sie möchten `code_execution` aktivieren oder konfigurieren
    - Sie möchten eine Remote-Analyse ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit einer Python-Analyse auf einem entfernten System kombinieren
summary: 'code_execution: isolierte Remote-Python-Analyse mit xAI ausführen'
title: Codeausführung
x-i18n:
    generated_at: "2026-07-12T02:14:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` führt eine isolierte Remote-Python-Analyse über die Responses API von xAI aus
(`https://api.x.ai/v1/responses`, derselbe Endpunkt, den `x_search` verwendet). Das Tool wird
vom gebündelten Plugin `xai` unter dem Vertrag `tools` registriert.

<Warning>
  `code_execution` wird auf den Servern von xAI ausgeführt. xAI berechnet 5 US-Dollar pro 1.000 Tool-Aufrufe
  zuzüglich der Ein- und Ausgabe-Token des Modells.
</Warning>

| Eigenschaft         | Wert                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| Tool-Name           | `code_execution`                                                                  |
| Provider-Plugin     | `xai` (gebündelt, `enabledByDefault: true`)                                        |
| Authentifizierung   | xAI-Authentifizierungsprofil, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` |
| Standardmodell      | `grok-4.3`                                                                        |
| Standard-Timeout    | 30 Sekunden                                                                       |
| Standard-`maxTurns` | nicht festgelegt (xAI wendet ein eigenes internes Limit an)                       |

Verwenden Sie das Tool für Berechnungen, Tabellierungen, schnelle Statistiken und
diagrammähnliche Analysen, einschließlich der von `x_search` oder `web_search`
zurückgegebenen Daten. Es hat keinen Zugriff auf lokale Dateien, Ihre Shell, Ihr
Repository oder gekoppelte Geräte und speichert keinen Zustand zwischen Aufrufen.
Behandeln Sie daher jeden Aufruf als kurzlebige Analyse und nicht als Notebook-Sitzung.
Für aktuelle X-Daten führen Sie zuerst [`x_search`](/de/tools/web#x_search) aus und
übergeben Sie anschließend das Ergebnis.

Verwenden Sie für die lokale Ausführung stattdessen [`exec`](/de/tools/exec).

## Einrichtung

<Steps>
  <Step title="Provide xAI credentials">
    OAuth erfordert ein berechtigtes SuperGrok- oder X-Premium-Abonnement
    (Bestätigung per Gerätecode, sodass es von Remote-Hosts ohne
    localhost-Callback funktioniert):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Bei einer Neuinstallation steht dieselbe Auswahl während des Onboardings zur Verfügung:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Alternativ mit einem API-Schlüssel:

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

    Jede dieser drei Optionen stellt auch die Authentifizierung für `x_search` und
    Grok-`web_search` bereit.

  </Step>

  <Step title="Enable and tune code_execution">
    Wenn `enabled` nicht angegeben ist, wird `code_execution` nur bereitgestellt,
    wenn der Provider des aktiven Modells `xai` ist und die xAI-Anmeldedaten
    aufgelöst werden können. Legen Sie für ein aktives Modell mit einem bekannten
    Nicht-xAI-Provider `plugins.entries.xai.config.codeExecution.enabled` auf
    `true` fest, um die providerübergreifende Verwendung zu aktivieren. Wenn der
    Provider des aktiven Modells fehlt oder nicht aufgelöst werden kann, bleibt
    das Tool ausgeblendet. Legen Sie `enabled` auf `false` fest, um es für jeden
    Provider zu deaktivieren. xAI-Anmeldedaten sind immer erforderlich.

    Verwenden Sie denselben Block, um das Modell, das Aufruflimit oder den Timeout
    zu überschreiben:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

    `code_execution` wird in der Tool-Liste des Agenten angezeigt, sobald sich das
    xAI-Plugin erneut registriert hat und die obigen Prüfungen für Provider,
    Aktivierung und Authentifizierung erfolgreich waren.

  </Step>
</Steps>

## Verwendung

Formulieren Sie die beabsichtigte Analyse ausdrücklich. Das Tool akzeptiert einen
einzelnen Parameter `task`; senden Sie daher die vollständige Anfrage und alle
eingebetteten Daten in einem Prompt:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## Fehler

Ohne Authentifizierung gibt das Tool einen strukturierten JSON-Fehler zurück
(keine ausgelöste Ausnahme), sodass der Agent das Problem selbst beheben kann:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Lokale Shell-Ausführung auf Ihrem Computer oder einer gekoppelten Node.
  </Card>
  <Card title="Exec approvals" href="/de/tools/exec-approvals" icon="shield">
    Richtlinie zum Zulassen oder Ablehnen der Shell-Ausführung.
  </Card>
  <Card title="Web tools" href="/de/tools/web" icon="globe">
    `web_search`, `x_search` und `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/de/providers/xai" icon="microchip">
    Grok-Modelle, Web-/X-Suche und Konfiguration der Codeausführung.
  </Card>
</CardGroup>
