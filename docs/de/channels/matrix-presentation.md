---
read_when:
    - Matrix-Clients erstellen, die Rich Responses von OpenClaw darstellen
    - Debugging des Ereignisinhalts von com.openclaw.presentation
summary: Matrix-MessagePresentation-Metadaten für OpenClaw-kompatible Clients
title: Matrix-Präsentationsmetadaten
x-i18n:
    generated_at: "2026-07-12T01:25:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw fügt ausgehenden Matrix-Ereignissen vom Typ `m.room.message` normalisierte `MessagePresentation`-Metadaten unter dem Inhaltsschlüssel `com.openclaw.presentation` hinzu.

Standardmäßige Matrix-Clients stellen weiterhin den Klartext in `body` dar. OpenClaw-kompatible Clients können die strukturierten Metadaten auslesen und native UI-Elemente wie Schaltflächen, Auswahlfelder, Kontextzeilen und Trennlinien darstellen.

## Ereignisinhalt

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
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

- `version` ist die Version des Metadatenschemas; die aktuelle Version ist `1`. `type` ist ein stabiler Diskriminator und lautet immer `"message.presentation"`. Der Matrix-Adapter gibt nur Nutzdaten mit genau dieser Version und diesem Typ aus. Clients sollten ebenso unbekannte Versionen, die sie nicht sicher interpretieren können, unbekannte `type`-Werte und unbekannte Blocktypen ignorieren.
- `title` und `tone` (`info`, `success`, `warning`, `danger`, `neutral`) sind optionale Hinweise.
- Schaltflächen und Auswahloptionen können zusätzlich zum veralteten Zeichenfolgenwert `value` eine typisierte `action` (`{ "type": "command", "command": "/..." }` oder `{ "type": "callback", "value": "..." }`) enthalten. Wenn beide vorhanden sind, verwenden Sie vorzugsweise `action`.

## Fallback-Verhalten

OpenClaw schreibt immer einen lesbaren Klartext-Fallback in `body`. Die strukturierten Metadaten sind eine additive Ergänzung und dürfen für die grundlegende Matrix-Interoperabilität nicht erforderlich sein.

Regeln für die Fallback-Darstellung:

- Inhalte von `title`, `text` und `context` werden als Klartextzeilen dargestellt.
- Schaltflächen mit einer `command`-Aktion werden als ``label: `/command` `` dargestellt, damit der Befehl kopierbar bleibt. Schaltflächen mit einer `callback`-Aktion oder nur einem veralteten `value` werden ausschließlich mit ihrer Beschriftung dargestellt, damit nicht transparente Callback-Werte privat bleiben; deaktivierte Schaltflächen werden immer ausschließlich mit ihrer Beschriftung dargestellt. URL- und Web-App-Schaltflächen werden als `label: URL` dargestellt.
- Auswahlblöcke stellen den Platzhalter (oder `Options:`) als Überschrift dar, gefolgt von Optionszeilen, die nur die jeweilige Beschriftung enthalten.
- Wenn nichts dargestellt wird, beispielsweise bei einer Präsentation, die nur aus einer Trennlinie besteht, greift der Text auf `---` zurück.

Nicht unterstützende Clients zeigen weiterhin den Fallback-Text an. OpenClaw-kompatible Clients können für die Anzeige die strukturierten Metadaten bevorzugen und zugleich den Fallback für Kopiervorgänge, Suche, Benachrichtigungen und Barrierefreiheit beibehalten.

## Unterstützte Blöcke

Der ausgehende Matrix-Adapter gibt native Unterstützung für folgende Blöcke an:

- `buttons`
- `select`
- `context`
- `divider`

`text`-Blöcke werden über den Fallback-Text immer unterstützt. Behandeln Sie alle Blöcke als unverbindliche Darstellungshinweise; ignorieren Sie unbekannte Felder und Blocktypen, anstatt die gesamte Nachricht als fehlerhaft zu behandeln.

## Interaktionen

Diese Metadaten fügen keine Matrix-Callback-Semantik hinzu. Werte von Schaltflächen und Auswahlfeldern sind Fallback-Interaktionsnutzdaten, üblicherweise Slash-Befehle oder Textbefehle. Ein Matrix-Client, der Interaktionen unterstützen soll, ermittelt den Wert des Steuerelements (`action.command`, dann `action.value`, dann `value`) und sendet ihn als normale Nachricht an den Raum zurück.

Eine Schaltfläche mit dem Wert `/model deepseek/deepseek-chat` kann beispielsweise verarbeitet werden, indem dieser Wert als verschlüsselte Matrix-Textnachricht in denselben Raum gesendet wird.

## Beziehung zu Genehmigungsmetadaten

`com.openclaw.presentation` dient der allgemeinen Darstellung umfangreicher Nachrichten.

Genehmigungsaufforderungen verwenden die dedizierten Metadaten `com.openclaw.approval`, da Genehmigungen sicherheitsrelevante Zustände, Entscheidungen und Ausführungs-/Plugin-Details enthalten. Wenn beide Metadatenschlüssel im selben Ereignis vorhanden sind, sollten Clients die dedizierte Genehmigungsdarstellung bevorzugen.

## Mediennachrichten

Wenn eine Antwort mehrere Medien-URLs enthält, sendet OpenClaw pro Medien-URL ein Matrix-Ereignis. Beschriftungstext und Präsentationsmetadaten werden nur an das erste Ereignis angefügt, sodass Clients genau einen stabilen strukturierten Nutzdatenblock ohne doppelte Darstellungen erhalten. Dieselbe Regel gilt, wenn langer Text auf mehrere Ereignisse aufgeteilt wird: Die Metadaten werden nur mit dem ersten Ereignis übertragen.

Halten Sie Präsentationsmetadaten kompakt. Umfangreiche für Benutzer sichtbare Texte sollten in `body` verbleiben und den normalen Matrix-Pfad zur Textaufteilung verwenden.
