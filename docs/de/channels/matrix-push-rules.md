---
read_when:
    - Stilles Matrix-Streaming für selbst gehostetes Synapse oder Tuwunel einrichten
    - Benutzer möchten Benachrichtigungen nur für abgeschlossene Blöcke, nicht bei jeder Vorschau-Bearbeitung.
summary: Empfängerspezifische Matrix-Push-Regeln für stille finalisierte Vorschau-Bearbeitungen
title: Matrix-Push-Regeln für stille Vorschauen
x-i18n:
    generated_at: "2026-04-30T06:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Wenn `channels.matrix.streaming` auf `"quiet"` gesetzt ist, bearbeitet OpenClaw ein einzelnes Vorschauereignis direkt und kennzeichnet die finalisierte Bearbeitung mit einem benutzerdefinierten Inhalts-Flag. Matrix-Clients benachrichtigen nur dann über die finale Bearbeitung, wenn eine benutzerspezifische Push-Regel dieses Flag abgleicht. Diese Seite richtet sich an Betreiber, die Matrix selbst hosten und diese Regel für jedes Empfängerkonto installieren möchten.

Wenn Sie nur das Standard-Benachrichtigungsverhalten von Matrix möchten, verwenden Sie `streaming: "partial"` oder lassen Sie Streaming deaktiviert. Siehe [Einrichtung des Matrix-Kanals](/de/channels/matrix#streaming-previews).

## Voraussetzungen

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie das Access Token des Empfängerbenutzers für die folgenden API-Aufrufe
- gleichen Sie `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab
- das Empfängerkonto muss bereits funktionierende Pusher haben — Regeln für stille Vorschauen funktionieren nur, wenn die normale Matrix-Push-Zustellung fehlerfrei läuft

## Schritte

<Steps>
  <Step title="Stille Vorschauen konfigurieren">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Access Token des Empfängers abrufen">
    Verwenden Sie nach Möglichkeit ein vorhandenes Client-Sitzungstoken erneut. So erstellen Sie ein neues:

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

  <Step title="Vorhandene Pusher prüfen">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn keine Pusher zurückkommen, beheben Sie die normale Matrix-Push-Zustellung für dieses Konto, bevor Sie fortfahren.

  </Step>

  <Step title="Override-Push-Regel installieren">
    OpenClaw kennzeichnet finalisierte reine Text-Vorschau-Bearbeitungen mit `content["com.openclaw.finalized_preview"] = true`. Installieren Sie eine Regel, die diesen Marker plus die Bot-MXID als Absender abgleicht:

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

    Vor dem Ausführen ersetzen:

    - `https://matrix.example.org`: die Basis-URL Ihres Homeservers
    - `$USER_ACCESS_TOKEN`: das Access Token des Empfängerbenutzers
    - `openclaw-finalized-preview-botname`: eine pro Bot und Empfänger eindeutige Regel-ID (Muster: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: die MXID Ihres OpenClaw-Bots, nicht die des Empfängers

  </Step>

  <Step title="Prüfen">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testen Sie anschließend eine gestreamte Antwort. Im stillen Modus zeigt der Raum eine stille Entwurfsvorschau und benachrichtigt einmal, wenn der Block oder Turn abgeschlossen ist.

  </Step>
</Steps>

Um die Regel später zu entfernen, senden Sie `DELETE` an dieselbe Regel-URL mit dem Token des Empfängers.

## Hinweise zu mehreren Bots

Push-Regeln werden durch `ruleId` identifiziert: Ein erneutes Ausführen von `PUT` mit derselben ID aktualisiert eine einzelne Regel. Wenn mehrere OpenClaw-Bots denselben Empfänger benachrichtigen, erstellen Sie pro Bot eine Regel mit einem eigenen Absenderabgleich.

Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich. Die Regel betrifft nur reine Text-Vorschau-Bearbeitungen, die direkt finalisiert werden können; Medien-Fallbacks und Fallbacks für veraltete Vorschauen verwenden die normale Matrix-Zustellung.

## Hinweise zum Homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Es ist keine spezielle Änderung an `homeserver.yaml` erforderlich. Wenn normale Matrix-Benachrichtigungen diesen Benutzer bereits erreichen, ist das Empfängertoken plus der oben gezeigte `pushrules`-Aufruf der wichtigste Einrichtungsschritt.

    Wenn Sie Synapse hinter einem Reverse Proxy oder mit Workern betreiben, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workern verarbeitet — stellen Sie sicher, dass diese fehlerfrei laufen.

    Die Regel verwendet die Push-Regel-Bedingung `event_property_is` (MSC3758, Push-Regel v1.10), die 2023 zu Synapse hinzugefügt wurde. Ältere Synapse-Versionen akzeptieren den Aufruf `PUT pushrules/...`, gleichen die Bedingung jedoch stillschweigend nie ab — aktualisieren Sie Synapse, wenn bei einer finalisierten Vorschau-Bearbeitung keine Benachrichtigung eintrifft.

  </Accordion>

  <Accordion title="Tuwunel">
    Gleicher Ablauf wie bei Synapse; für den finalisierten Vorschau-Marker ist keine Tuwunel-spezifische Konfiguration erforderlich.

    Wenn Benachrichtigungen verschwinden, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in 1.4.2 (September 2025) hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Einrichtung des Matrix-Kanals](/de/channels/matrix)
- [Streaming-Konzepte](/de/concepts/streaming)
