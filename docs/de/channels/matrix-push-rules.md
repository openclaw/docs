---
read_when:
    - Einrichten von stillem Matrix-Streaming für selbst gehostetes Synapse oder Tuwunel
    - Benutzer wünschen Benachrichtigungen nur für abgeschlossene Blöcke, nicht bei jeder Bearbeitung der Vorschau
summary: Empfängerspezifische Matrix-Push-Regeln für stille, abgeschlossene Vorschauänderungen
title: Matrix-Push-Regeln für unaufdringliche Vorschauen
x-i18n:
    generated_at: "2026-07-24T04:15:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Wenn `channels.matrix.streaming.mode` auf `"quiet"` gesetzt ist, streamt OpenClaw die Antwort, indem ein einzelnes Vorschauereignis direkt bearbeitet wird. Vorschauen werden als nicht benachrichtigende `m.notice`-Ereignisse gesendet, und die abschließende Bearbeitung wird mit `content["com.openclaw.finalized_preview"] = true` markiert. Matrix-Clients benachrichtigen bei dieser abschließenden Bearbeitung nur, wenn eine benutzerspezifische Push-Regel mit der Markierung übereinstimmt. Diese Seite richtet sich an Betreiber, die Matrix selbst hosten und diese Regel für jedes Empfängerkonto installieren möchten.

`streaming.mode: "progress"` schließt seine Entwürfe über denselben Pfad ab, sodass dieselbe Regel auch bei abgeschlossenen Bearbeitungen im Fortschrittsmodus ausgelöst wird.

Wenn Sie nur das standardmäßige Benachrichtigungsverhalten von Matrix wünschen, verwenden Sie `streaming.mode: "partial"` oder lassen Sie Streaming deaktiviert. Siehe [Einrichtung des Matrix-Kanals](/de/channels/matrix#streaming-previews).

## Voraussetzungen

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie für die folgenden API-Aufrufe das Zugriffstoken des Empfängerbenutzers
- gleichen Sie `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab
- für das Empfängerkonto müssen bereits funktionierende Pusher vorhanden sein; Regeln für stille Vorschauen funktionieren nur, wenn die normale Matrix-Push-Zustellung ordnungsgemäß funktioniert

## Schritte

<Steps>
  <Step title="Stille Vorschauen konfigurieren">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Zugriffstoken des Empfängers abrufen">
    Verwenden Sie nach Möglichkeit das Token einer vorhandenen Clientsitzung erneut. So erstellen Sie ein neues:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Vorhandene Pusher überprüfen">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn keine Pusher zurückgegeben werden, beheben Sie zunächst die normale Matrix-Push-Zustellung für dieses Konto.

  </Step>

  <Step title="Überschreibende Push-Regel installieren">
    Installieren Sie eine Regel, die sowohl mit der Markierung der abgeschlossenen Vorschau als auch mit der MXID des Bots als Absender übereinstimmt:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Vor der Ausführung ersetzen:

    - `https://matrix.example.org`: die Basis-URL Ihres Homeservers
    - `$USER_ACCESS_TOKEN`: das Zugriffstoken des Empfängerbenutzers
    - `openclaw-finalized-preview-botname`: eine pro Bot und Empfänger eindeutige Regel-ID (Muster: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: die MXID Ihres OpenClaw-Bots, nicht die des Empfängers

  </Step>

  <Step title="Überprüfen">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testen Sie anschließend eine gestreamte Antwort. Im stillen Modus zeigt der Raum eine stille Entwurfsvorschau an und benachrichtigt einmal, wenn der Block oder Durchlauf abgeschlossen ist.

  </Step>
</Steps>

Um die Regel später zu entfernen, senden Sie `DELETE` an dieselbe Regel-URL und verwenden Sie dabei das Token des Empfängers.

## Hinweise für mehrere Bots

Push-Regeln werden über `ruleId` identifiziert: Wenn `PUT` erneut für dieselbe ID ausgeführt wird, wird eine einzelne Regel aktualisiert. Wenn mehrere OpenClaw-Bots denselben Empfänger benachrichtigen, erstellen Sie für jeden Bot eine Regel mit einem eigenen Absenderabgleich.

Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln des Servers eingefügt, sodass kein zusätzlicher Ordnungsparameter erforderlich ist. Die Regel wirkt sich nur auf reine Textvorschau-Bearbeitungen aus, die direkt abgeschlossen werden können; Medienantworten, Fallbacks für veraltete Vorschauen und endgültige Texte, die Matrix-Erwähnungen aktivieren würden, werden stattdessen als normale benachrichtigende Nachrichten zugestellt.

## Hinweise zum Homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Es ist keine besondere Änderung an `homeserver.yaml` erforderlich. Wenn normale Matrix-Benachrichtigungen diesen Benutzer bereits erreichen, sind das Empfängertoken und der obige `pushrules`-Aufruf die wichtigsten Einrichtungsschritte.

    Wenn Synapse hinter einem Reverse-Proxy oder mit Workern betrieben wird, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse ordnungsgemäß erreicht. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` beziehungsweise konfigurierten Pusher-Workern verarbeitet – stellen Sie sicher, dass diese ordnungsgemäß funktionieren.

    Die Regel verwendet die Push-Regel-Bedingung `event_property_is` (MSC3758, Push-Regel v1.10), die 2023 zu Synapse hinzugefügt wurde. Ältere Synapse-Versionen akzeptieren den `PUT pushrules/...`-Aufruf, gleichen die Bedingung jedoch unbemerkt nie ab. Aktualisieren Sie Synapse, wenn bei einer abgeschlossenen Vorschau-Bearbeitung keine Benachrichtigung eintrifft.

  </Accordion>

  <Accordion title="Tuwunel">
    Derselbe Ablauf wie bei Synapse; für die Markierung der abgeschlossenen Vorschau ist keine Tuwunel-spezifische Konfiguration erforderlich.

    Wenn Benachrichtigungen ausbleiben, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Version 1.4.2 (September 2025) hinzugefügt; sie kann Push-Benachrichtigungen an andere Geräte absichtlich unterdrücken, solange ein Gerät aktiv ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Einrichtung des Matrix-Kanals](/de/channels/matrix)
- [Streaming-Konzepte](/de/concepts/streaming)
