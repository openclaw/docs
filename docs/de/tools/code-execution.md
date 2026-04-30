---
read_when:
    - Sie möchten code_execution aktivieren oder konfigurieren
    - Sie möchten Remote-Analysen ohne lokalen Shell-Zugriff
    - Sie möchten x_search oder web_search mit Python-Analyse in einer Remote-Umgebung kombinieren
summary: code_execution -- Sandbox-geschützte Remote-Python-Analyse mit xAI ausführen
title: Codeausführung
x-i18n:
    generated_at: "2026-04-30T07:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` führt Python-Analysen in einer abgeschotteten Remote-Umgebung über die Responses API von xAI aus.
Das unterscheidet sich von lokalem [`exec`](/de/tools/exec):

- `exec` führt Shell-Befehle auf Ihrem Rechner oder Node aus
- `code_execution` führt Python in der Remote-Sandbox von xAI aus

Verwenden Sie `code_execution` für:

- Berechnungen
- Tabellierung
- schnelle Statistiken
- diagrammartige Analysen
- die Analyse von Daten, die von `x_search` oder `web_search` zurückgegeben wurden

Verwenden Sie es **nicht**, wenn Sie lokale Dateien, Ihre Shell, Ihr Repository oder gekoppelte
Geräte benötigen. Verwenden Sie dafür [`exec`](/de/tools/exec).

## Einrichtung

Sie benötigen einen xAI-API-Schlüssel. Jede dieser Optionen funktioniert:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Beispiel:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

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

Das Tool akzeptiert intern einen einzelnen `task`-Parameter, daher sollte der Agent
die vollständige Analyseanfrage und alle Inline-Daten in einem Prompt senden.

## Einschränkungen

- Dies ist Remote-Ausführung bei xAI, keine lokale Prozessausführung.
- Sie sollte als flüchtige Analyse behandelt werden, nicht als persistentes Notebook.
- Gehen Sie nicht davon aus, dass Zugriff auf lokale Dateien oder Ihren Workspace besteht.
- Verwenden Sie für aktuelle X-Daten zuerst [`x_search`](/de/tools/web#x_search).

## Verwandt

- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [apply_patch-Tool](/de/tools/apply-patch)
- [Web-Tools](/de/tools/web)
- [xAI](/de/providers/xai)
