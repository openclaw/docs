---
read_when:
    - Synology Chat mit OpenClaw einrichten
    - Fehlerbehebung bei der Webhook-Weiterleitung in Synology Chat
summary: Synology Chat-Webhook-Einrichtung und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T06:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: gebündelter Plugin-Direktnachrichtenkanal mit Synology Chat-Webhooks.
Das Plugin akzeptiert eingehende Nachrichten von ausgehenden Synology Chat-Webhooks und sendet Antworten
über einen eingehenden Synology Chat-Webhook.

## Gebündeltes Plugin

Synology Chat wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Synology Chat ausschließt,
installieren Sie es manuell:

Installation aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

1. Stellen Sie sicher, dass das Synology Chat-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen bündeln es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit dem obigen Befehl manuell aus einem Quell-Checkout hinzufügen.
   - `openclaw onboard` zeigt Synology Chat jetzt in derselben Kanaleinrichtungsliste wie `openclaw channels add`.
   - Nicht interaktive Einrichtung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In den Synology Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Richten Sie die ausgehende Webhook-URL auf Ihr OpenClaw-Gateway:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihr benutzerdefiniertes `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab.
   - Geführt: `openclaw onboard`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie eine DM an den Synology Chat-Bot.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das ausgehende Webhook-Token aus `body.token`, dann
  `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Tokens werden sicher abgewiesen.

Minimale Konfiguration:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Umgebungsvariablen

Für das Standardkonto können Sie Umgebungsvariablen verwenden:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (durch Kommas getrennt)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Konfigurationswerte überschreiben Umgebungsvariablen.

`SYNOLOGY_CHAT_INCOMING_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## DM-Richtlinie und Zugriffskontrolle

- `dmPolicy: "allowlist"` ist der empfohlene Standard.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere `allowedUserIds`-Liste als Fehlkonfiguration behandelt und die Webhook-Route startet nicht (verwenden Sie `dmPolicy: "open"` mit `allowedUserIds: ["*"]` für Alles-erlauben).
- `dmPolicy: "open"` erlaubt öffentliche DMs nur, wenn `allowedUserIds` `"*"` enthält; bei restriktiven Einträgen können nur passende Benutzer chatten.
- `dmPolicy: "disabled"` blockiert DMs.
- Die Antwortempfänger-Bindung bleibt standardmäßig auf der stabilen numerischen `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Notfall-Kompatibilitätsmodus, der die veränderliche Suche nach Benutzername/Nickname für die Antwortzustellung wieder aktiviert.
- Pairing-Freigaben funktionieren mit:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Ausgehende Zustellung

Verwenden Sie numerische Synology Chat-Benutzer-IDs als Ziele.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Mediensendungen werden über URL-basierte Dateizustellung unterstützt.
Ausgehende Datei-URLs müssen `http` oder `https` verwenden, und private oder anderweitig blockierte Netzwerkziele werden abgewiesen, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Mehrere Konten

Mehrere Synology Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, DM-Richtlinie und Limits überschreiben.
Direktnachrichten-Sitzungen sind pro Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
auf zwei verschiedenen Synology-Konten keinen Transkriptstatus teilt.
Geben Sie jedem aktivierten Konto einen eigenen `webhookPath`. OpenClaw weist jetzt exakt doppelte Pfade zurück
und verweigert den Start benannter Konten, die in Mehrkonten-Einrichtungen nur einen gemeinsam genutzten Webhook-Pfad erben.
Wenn Sie für ein benanntes Konto bewusst Legacy-Vererbung benötigen, setzen Sie
`dangerouslyAllowInheritedWebhookPath: true` auf diesem Konto oder unter `channels.synology-chat`,
aber exakt doppelte Pfade werden weiterhin sicher abgewiesen. Bevorzugen Sie explizite kontospezifische Pfade.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Sicherheitshinweise

- Halten Sie `token` geheim und rotieren Sie es, falls es offengelegt wurde.
- Behalten Sie `allowInsecureSsl: false` bei, sofern Sie nicht ausdrücklich einem selbstsignierten lokalen NAS-Zertifikat vertrauen.
- Eingehende Webhook-Anfragen werden per Token verifiziert und pro Absender ratenbegrenzt.
- Prüfungen ungültiger Tokens verwenden einen zeitkonstanten Geheimnisvergleich und werden sicher abgewiesen.
- Bevorzugen Sie `dmPolicy: "allowlist"` für die Produktion.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, sofern Sie nicht ausdrücklich Legacy-Zustellung von Antworten anhand von Benutzernamen benötigen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, sofern Sie nicht ausdrücklich das Routingrisiko gemeinsam genutzter Pfade in einer Mehrkonten-Einrichtung akzeptieren.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - der ausgehende Webhook-Payload enthält eines der erforderlichen Felder nicht
  - wenn Synology das Token in Headern sendet, stellen Sie sicher, dass Gateway/Proxy diese Header beibehält
- `Invalid token`:
  - das ausgehende Webhook-Geheimnis stimmt nicht mit `channels.synology-chat.token` überein
  - die Anfrage trifft das falsche Konto/den falschen Webhook-Pfad
  - ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - zu viele Versuche mit ungültigem Token aus derselben Quelle können diese Quelle vorübergehend aussperren
  - authentifizierte Absender haben außerdem ein separates nach Benutzer begrenztes Nachrichtenratenlimit
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - die numerische `user_id` des Absenders befindet sich nicht in `allowedUserIds`

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
