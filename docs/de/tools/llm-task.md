---
read_when:
    - Sie möchten einen LLM-Schritt ausschließlich mit JSON innerhalb von Workflows
    - Sie benötigen eine schemavalidierte LLM-Ausgabe für die Automatisierung
summary: Reine JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Aufgabe
x-i18n:
    generated_at: "2026-07-12T15:57:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` ist ein gebündeltes **optionales Plugin-Tool**, das einen einzelnen reinen JSON-
LLM-Aufruf ausführt und strukturierte Ausgaben zurückgibt, die optional anhand eines JSON-
Schemas validiert werden. Es stellt Workflow-Engines wie Lobster einen LLM-Schritt bereit, ohne dass
für jeden Workflow eigener OpenClaw-Code erforderlich ist.

## Aktivieren

1. Aktivieren Sie das Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Erlauben Sie das Tool:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` fügt `llm-task` zusätzlich zum aktiven Tool-Profil hinzu, ohne
andere Kern-Tools einzuschränken. Verwenden Sie stattdessen `tools.allow` nur, wenn Sie einen restriktiven
Allowlist-Modus wünschen.

## Konfiguration (optional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` ist eine Allowlist aus `provider/model`-Zeichenfolgen; eine Anfrage für ein
anderes Modell wird abgelehnt. Alle anderen Schlüssel dienen als aufrufspezifische Fallbacks, wenn beim
Tool-Aufruf der jeweilige Parameter fehlt.

## Tool-Parameter

| Parameter       | Typ    | Hinweise                                                                                                                                                                   |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Erforderlich. Aufgabenanweisung für das LLM.                                                                                                                               |
| `input`         | any    | Optionale Nutzdaten; werden als JSON serialisiert und an den Prompt angehängt.                                                                                             |
| `schema`        | object | Optionales JSON-Schema, anhand dessen die geparste Ausgabe validiert werden muss.                                                                                          |
| `provider`      | string | Überschreibt `defaultProvider` bzw. den Standard-Provider des Agenten.                                                                                                     |
| `model`         | string | Überschreibt `defaultModel`; akzeptiert reine Modell-IDs, Aliase oder eine `provider/model`-Referenz (ein doppeltes Provider-Präfix wird automatisch entfernt).             |
| `thinking`      | string | Reasoning-Stufe (z. B. `low`, `medium`); muss vom aufgelösten Modell unterstützt werden.                                                                                   |
| `authProfileId` | string | Überschreibt `defaultAuthProfileId`.                                                                                                                                       |
| `temperature`   | number | Nach bestem Bemühen; nicht alle Provider berücksichtigen diesen Wert.                                                                                                     |
| `maxTokens`     | number | Obergrenze für Ausgabe-Token nach bestem Bemühen.                                                                                                                         |
| `timeoutMs`     | number | Zeitüberschreitung für die Ausführung; Standardwert `30000`.                                                                                                              |

## Ausgabe

Gibt `details.json` (das geparste, anhand des Schemas validierte JSON) sowie
`details.provider` und `details.model` zurück, die angeben, was tatsächlich ausgeführt wurde.

## Beispiel: Lobster-Workflow-Schritt

### Wichtige Einschränkung

Das folgende Beispiel setzt voraus, dass die **eigenständige Lobster-CLI** in einer Umgebung ausgeführt wird,
in der `openclaw.invoke` bereits über den richtigen Gateway-URL-/Authentifizierungskontext verfügt.

Für den gebündelten **eingebetteten** Lobster-Runner innerhalb von OpenClaw ist dieses verschachtelte CLI-
Muster **derzeit nicht zuverlässig**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Bis eingebettetes Lobster über eine unterstützte Brücke für diesen Ablauf verfügt, verwenden Sie vorzugsweise entweder:

- direkte Aufrufe des Tools `llm-task` außerhalb von Lobster oder
- Lobster-Schritte, die nicht auf verschachtelten Aufrufen von `openclaw.invoke` basieren.

Beispiel für die eigenständige Lobster-CLI:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Ermitteln Sie anhand der eingegebenen E-Mail die Absicht und geben Sie einen Entwurf zurück.",
  "thinking": "low",
  "input": {
    "subject": "Hallo",
    "body": "Können Sie helfen?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Sicherheitshinweise

- **Nur JSON**: Das Modell wird angewiesen, ausschließlich einen JSON-Wert zurückzugeben, ohne Code-
  Blöcke und ohne Kommentare.
- **Keine Tools**: Bei der zugrunde liegenden Ausführung sind Tools deaktiviert, sodass das Modell
  während der Aufgabe keine externen Aufrufe durchführen kann.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Platzieren Sie Genehmigungen vor jedem Schritt mit Seiteneffekten (Senden, Veröffentlichen, Ausführen), der
  diese Ausgabe verwendet.

## Verwandte Themen

- [Thinking-Stufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
- [Slash-Befehle](/de/tools/slash-commands)
