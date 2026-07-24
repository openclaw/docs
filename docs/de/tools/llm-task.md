---
read_when:
    - Sie möchten einen LLM-Schritt mit reiner JSON-Ausgabe innerhalb von Workflows
    - Sie benötigen schemavalidierte LLM-Ausgaben für die Automatisierung
summary: Reine JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Aufgabe
x-i18n:
    generated_at: "2026-07-24T04:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` ist ein gebündeltes **optionales Plugin-Tool**, das einen einzelnen reinen JSON-
LLM-Aufruf ausführt und eine strukturierte Ausgabe zurückgibt, die optional anhand eines JSON-
Schemas validiert wird. Es stellt Workflow-Engines wie Lobster einen LLM-Schritt bereit, ohne dass
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
andere Kern-Tools einzuschränken. Verwenden Sie stattdessen `tools.allow` nur, wenn Sie einen
restriktiven Allowlist-Modus wünschen.

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
anderes Modell wird abgelehnt. Alle anderen Schlüssel sind Rückfallwerte pro Aufruf, die verwendet
werden, wenn der Tool-Aufruf den jeweiligen Parameter auslässt.

## Tool-Parameter

| Parameter       | Typ    | Hinweise                                                                                                                                      |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Erforderlich. Aufgabenanweisung für das LLM.                                                                                                  |
| `input`         | any    | Optionale Nutzlast; wird als JSON serialisiert und an den Prompt angehängt.                                                                   |
| `schema`        | object | Optionales JSON-Schema, anhand dessen die geparste Ausgabe validiert werden muss.                                                             |
| `provider`      | string | Überschreibt `defaultProvider` / den Standard-Provider des Agenten.                                                                           |
| `model`         | string | Überschreibt `defaultModel`; akzeptiert reine Modell-IDs, Aliasse oder eine `provider/model`-Referenz (ein doppeltes Provider-Präfix wird automatisch entfernt). |
| `thinking`      | string | Reasoning-Stufe (z. B. `low`, `medium`); muss vom aufgelösten Modell unterstützt werden.                                               |
| `authProfileId` | string | Überschreibt `defaultAuthProfileId`.                                                                                                              |
| `temperature`   | number | Nach bestem Bemühen; nicht alle Provider berücksichtigen den Wert.                                                                            |
| `maxTokens`     | number | Obergrenze für Ausgabe-Token nach bestem Bemühen.                                                                                             |
| `timeoutMs`     | number | Zeitüberschreitung für die Ausführung; Standardwert `30000`.                                                                       |

## Ausgabe

Gibt `details.json` (das geparste, anhand des Schemas validierte JSON) sowie `details.provider`
und `details.model` zurück, die angeben, was tatsächlich ausgeführt wurde.

## Beispiel: Lobster-Workflow-Schritt

### Wichtige Einschränkung

Das folgende Beispiel setzt voraus, dass die **eigenständige Lobster-CLI** dort ausgeführt wird, wo
`openclaw.invoke` bereits über die korrekte Gateway-URL und den korrekten Authentifizierungskontext verfügt.

Für den gebündelten **eingebetteten** Lobster-Runner in OpenClaw ist dieses verschachtelte CLI-
Muster **derzeit nicht zuverlässig**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Bis eingebettetes Lobster über eine unterstützte Brücke für diesen Ablauf verfügt, verwenden Sie vorzugsweise entweder:

- direkte `llm-task`-Tool-Aufrufe außerhalb von Lobster oder
- Lobster-Schritte, die nicht auf verschachtelten `openclaw.invoke`-Aufrufen beruhen.

Beispiel für die eigenständige Lobster-CLI:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Geben Sie für die Eingabe-E-Mail die Absicht und einen Entwurf zurück.",
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
- **Keine Tools**: Für die zugrunde liegende Ausführung sind Tools deaktiviert, sodass das Modell
  während der Aufgabe keine externen Aufrufe durchführen kann.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Setzen Sie Genehmigungen vor jeden Schritt mit Nebenwirkungen (Senden, Veröffentlichen, Ausführen), der
  diese Ausgabe verwendet.

## Verwandte Themen

- [Reasoning-Stufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
- [Slash-Befehle](/de/tools/slash-commands)
