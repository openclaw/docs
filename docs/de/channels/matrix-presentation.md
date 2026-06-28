---
read_when:
    - Matrix-Clients erstellen, die reichhaltige OpenClaw-Antworten darstellen
    - Debuggen von com.openclaw.presentation-Ereignisinhalten
summary: Matrix-MessagePresentation-Metadaten für Clients mit OpenClaw-Unterstützung
title: Metadaten zur Matrixdarstellung
x-i18n:
    generated_at: "2026-05-10T19:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw kann normalisierte `MessagePresentation`-Metadaten an ausgehende Matrix-`m.room.message`-Ereignisse unter `com.openclaw.presentation` anhängen.

Standard-Matrix-Clients rendern weiterhin den reinen Text in `body`. OpenClaw-fähige Clients können die strukturierten Metadaten lesen und native Benutzeroberflächen wie Schaltflächen, Auswahlfelder, Kontextzeilen und Trennlinien rendern.

## Ereignisinhalt

Die Metadaten werden im Inhalt des Matrix-Ereignisses gespeichert:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

`version` ist die Schemaversion der Matrix-Präsentationsmetadaten. `type` ist ein stabiler Diskriminator für OpenClaw-fähige Clients. Clients sollten unbekannte `type`-Werte, unbekannte Versionen, die sie nicht sicher interpretieren können, und unbekannte Blocktypen ignorieren.

## Fallback-Verhalten

OpenClaw rendert immer einen lesbaren Fallback als reinen Text in `body`. Die strukturierten Metadaten sind additiv und dürfen nicht für grundlegende Matrix-Interoperabilität erforderlich sein.

Nicht unterstützte Clients sollten weiterhin den Fallback-Text anzeigen. OpenClaw-fähige Clients können die strukturierten Metadaten für die Anzeige bevorzugen und zugleich den Fallback-Text für Kopieren, Suche, Benachrichtigungen und Barrierefreiheit beibehalten.

## Unterstützte Blöcke

Der ausgehende Matrix-Adapter gibt Unterstützung für Folgendes an:

- `buttons`
- `select`
- `context`
- `divider`

Clients sollten diese Blöcke als Best-Effort-Präsentationshinweise behandeln. Unbekannte Felder und unbekannte Blocktypen sollten ignoriert werden, statt das Rendern der gesamten Nachricht fehlschlagen zu lassen.

## Interaktionen

Diese Metadaten fügen keine Matrix-Callback-Semantik hinzu. Werte von Schaltflächen und Auswahloptionen sind Fallback-Interaktions-Payloads, in der Regel Slash-Befehle oder Textbefehle. Ein Matrix-Client, der Interaktion unterstützen möchte, kann den ausgewählten Wert als normale Nachricht zurück in den Raum senden.

Beispielsweise kann eine Schaltfläche mit dem Wert `/model deepseek/deepseek-chat` verarbeitet werden, indem dieser Wert als verschlüsselte Matrix-Textnachricht im selben Raum gesendet wird.

## Beziehung zu Genehmigungsmetadaten

`com.openclaw.presentation` ist für allgemeine Rich-Message-Präsentation vorgesehen.

Genehmigungsaufforderungen verwenden die dedizierten `com.openclaw.approval`-Metadaten, da Genehmigungen sicherheitsrelevanten Zustand, Entscheidungen und Ausführungs-/Plugin-Details enthalten. Wenn beide Metadatenschlüssel im selben Ereignis vorhanden sind, sollten Clients den dedizierten Genehmigungs-Renderer bevorzugen.

## Mediennachrichten

Wenn eine Antwort mehrere Medien-URLs enthält, sendet OpenClaw ein Matrix-Ereignis pro Medien-URL. Präsentationsmetadaten werden nur an das erste Medienereignis angehängt, damit Clients einen stabilen strukturierten Payload haben und doppelte Renderer vermieden werden.

Halten Sie Präsentationsmetadaten kompakt. Umfangreicher benutzersichtbarer Text sollte in `body` verbleiben und den normalen Pfad zur Matrix-Textaufteilung verwenden.
