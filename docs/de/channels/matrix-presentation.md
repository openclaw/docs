---
read_when:
    - Matrix-Clients erstellen, die Rich Responses von OpenClaw darstellen
    - Debugging des Ereignisinhalts von com.openclaw.presentation
summary: Matrix-MessagePresentation-Metadaten für OpenClaw-kompatible Clients
title: Matrix-Präsentationsmetadaten
x-i18n:
    generated_at: "2026-07-12T15:02:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw fügt ausgehenden Matrix-`m.room.message`-Ereignissen normalisierte `MessagePresentation`-Metadaten unter dem Inhaltsschlüssel `com.openclaw.presentation` hinzu.

Standardmäßige Matrix-Clients stellen weiterhin den Klartext-`body` dar. OpenClaw-kompatible Clients können die strukturierten Metadaten lesen und native UI-Elemente wie Schaltflächen, Auswahlfelder, Kontextzeilen und Trennlinien darstellen.

## Ereignisinhalt

```json
{
  "msgtype": "m.text",
  "body": "Modell auswählen\n\nModell auswählen:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Modell auswählen",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Modell auswählen",
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

- `version` ist die Version des Metadatenschemas; die aktuelle Version ist `1`. `type` ist ein stabiler Diskriminator und lautet immer `"message.presentation"`. Der Matrix-Adapter gibt nur Payloads mit genau dieser Version und diesem Typ aus. Ebenso sollten Clients unbekannte Versionen, die sie nicht sicher interpretieren können, unbekannte `type`-Werte und unbekannte Blocktypen ignorieren.
- `title` und `tone` (`info`, `success`, `warning`, `danger`, `neutral`) sind optionale Hinweise.
- Schaltflächen und Auswahloptionen können zusätzlich zum bisherigen Zeichenfolgenwert `value` eine typisierte `action` (`{ "type": "command", "command": "/..." }` oder `{ "type": "callback", "value": "..." }`) enthalten. Wenn beide vorhanden sind, verwenden Sie vorzugsweise `action`.

## Fallback-Verhalten

OpenClaw rendert immer eine lesbare Klartext-Fallback-Darstellung in `body`. Die strukturierten Metadaten sind eine Ergänzung und dürfen für die grundlegende Matrix-Interoperabilität nicht erforderlich sein.

Regeln für das Fallback-Rendering:

- Inhalte von `title`, `text` und `context` werden als einfache Zeilen gerendert.
- Schaltflächen mit einer `command`-Aktion werden als ``label: `/command` `` gerendert, damit der Befehl kopierbar bleibt. Schaltflächen mit einer `callback`-Aktion oder nur einem veralteten `value` werden ausschließlich mit ihrer Beschriftung gerendert, damit nicht transparente Callback-Werte privat bleiben; deaktivierte Schaltflächen werden immer ausschließlich mit ihrer Beschriftung gerendert. URL- und Web-App-Schaltflächen werden als `label: URL` gerendert.
- Auswahlblöcke rendern den Platzhalter (oder `Options:`) als Überschrift, gefolgt von Optionszeilen, die ausschließlich die jeweilige Beschriftung enthalten.
- Wenn nichts gerendert wird, beispielsweise bei einer Darstellung, die nur aus einer Trennlinie besteht, wird für den Body ersatzweise `---` verwendet.

Nicht unterstützte Clients zeigen weiterhin den Fallback-Text an. OpenClaw-kompatible Clients können für die Anzeige die strukturierten Metadaten bevorzugen und zugleich den Fallback für Kopieren, Suche, Benachrichtigungen und Barrierefreiheit beibehalten.

## Unterstützte Blöcke

Der ausgehende Matrix-Adapter gibt native Unterstützung an für:

- `buttons`
- `select`
- `context`
- `divider`

`text`-Blöcke werden über den Fallback-Textkörper immer unterstützt. Behandeln Sie alle Blöcke als Best-Effort-Darstellungshinweise; ignorieren Sie unbekannte Felder und Blocktypen, anstatt die gesamte Nachricht fehlschlagen zu lassen.

## Interaktionen

Diese Metadaten fügen keine Matrix-Callback-Semantik hinzu. Schaltflächen- und Auswahlwerte sind Fallback-Interaktionsnutzdaten, üblicherweise Slash-Befehle oder Textbefehle. Ein Matrix-Client, der Interaktionen unterstützen möchte, löst den Steuerelementwert auf (`action.command`, dann `action.value`, dann `value`) und sendet ihn als normale Nachricht zurück an den Raum.

Beispielsweise kann eine Schaltfläche mit dem Wert `/model deepseek/deepseek-chat` verarbeitet werden, indem dieser Wert als verschlüsselte Matrix-Textnachricht im selben Raum gesendet wird.

## Beziehung zu Genehmigungsmetadaten

`com.openclaw.presentation` dient der allgemeinen Darstellung angereicherter Nachrichten.

Genehmigungsaufforderungen verwenden die dedizierten `com.openclaw.approval`-Metadaten, da Genehmigungen sicherheitsrelevanten Status, Entscheidungen und Ausführungs-/Plugin-Details enthalten. Wenn beide Metadatenschlüssel im selben Ereignis vorhanden sind, sollten Clients den dedizierten Genehmigungs-Renderer bevorzugen.

## Mediennachrichten

Wenn eine Antwort mehrere Medien-URLs enthält, sendet OpenClaw ein Matrix-Ereignis pro Medien-URL. Beschriftungstext und Darstellungsmetadaten werden nur an das erste Ereignis angehängt, sodass Clients eine einzige stabile strukturierte Nutzlast ohne doppelte Renderer erhalten. Dieselbe Regel gilt, wenn langer Text auf mehrere Ereignisse aufgeteilt wird: Die Metadaten werden nur mit dem ersten Ereignis übertragen.

Halten Sie Darstellungsmetadaten kompakt. Umfangreicher für Benutzer sichtbarer Text sollte in `body` verbleiben und den normalen Matrix-Pfad zur Aufteilung von Text verwenden.
