---
read_when:
    - Einrichten von Synology Chat mit OpenClaw
    - Fehlerbehebung beim Webhook-Routing von Synology Chat
summary: Einrichtung des Synology-Chat-Webhooks und der OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: Gebündelter Plugin-Direktnachrichtenkanal mit Synology-Chat-Webhooks.
Das Plugin akzeptiert eingehende Nachrichten von ausgehenden Synology-Chat-Webhooks und sendet Antworten
über einen eingehenden Synology-Chat-Webhook.

## Gebündeltes Plugin

Synology Chat wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Synology Chat ausschließt,
installieren Sie es manuell:

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Synology-Chat-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit dem obigen Befehl manuell aus einem Source-Checkout hinzufügen.
   - `openclaw onboard` zeigt Synology Chat jetzt in derselben Kanaleinrichtungsliste wie `openclaw channels add` an.
   - Nicht-interaktive Einrichtung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In den Synology-Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Leiten Sie die URL des ausgehenden Webhooks an Ihr OpenClaw-Gateway weiter:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihr benutzerdefinierter `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab.
   - Geführt: `openclaw onboard`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie eine Direktnachricht an den Synology-Chat-Bot.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks aus `body.token`, dann
  `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Token werden Fail-Closed abgewiesen.

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

## DM-Richtlinie und Zugriffskontrolle

- `dmPolicy: "allowlist"` ist die empfohlene Standardeinstellung.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere `allowedUserIds`-Liste als Fehlkonfiguration behandelt, und die Webhook-Route wird nicht gestartet (verwenden Sie `dmPolicy: "open"` für Zugriff für alle).
- `dmPolicy: "open"` erlaubt jeden Absender.
- `dmPolicy: "disabled"` blockiert Direktnachrichten.
- Die Bindung des Antwortempfängers bleibt standardmäßig an die stabile numerische `user_id` gebunden. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der die Suche nach veränderbaren Benutzernamen/Spitznamen für die Antwortzustellung wieder aktiviert.
- Pairing-Freigaben funktionieren mit:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Ausgehende Zustellung

Verwenden Sie numerische Synology-Chat-Benutzer-IDs als Ziele.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Das Senden von Medien wird über URL-basierte Dateizustellung unterstützt.
Ausgehende Datei-URLs müssen `http` oder `https` verwenden, und private oder anderweitig blockierte Netzwerkziele werden abgewiesen, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Mehrere Konten

Mehrere Synology-Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, DM-Richtlinie und Limits überschreiben.
Direktnachrichtensitzungen werden pro Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
in zwei verschiedenen Synology-Konten keinen gemeinsamen Transkriptstatus teilt.
Geben Sie jedem aktivierten Konto einen eigenen `webhookPath`. OpenClaw weist jetzt doppelte exakte Pfade zurück
und verweigert den Start benannter Konten, die in Mehrkontoeinrichtungen nur einen gemeinsamen Webhook-Pfad erben.
Wenn Sie absichtlich Legacy-Vererbung für ein benanntes Konto benötigen, setzen Sie
`dangerouslyAllowInheritedWebhookPath: true` für dieses Konto oder unter `channels.synology-chat`,
aber doppelte exakte Pfade werden weiterhin Fail-Closed abgewiesen. Bevorzugen Sie explizite kontospezifische Pfade.

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

- Halten Sie `token` geheim und rotieren Sie es, wenn es offengelegt wurde.
- Behalten Sie `allowInsecureSsl: false` bei, es sei denn, Sie vertrauen einem selbstsignierten lokalen NAS-Zertifikat ausdrücklich.
- Eingehende Webhook-Anfragen werden per Token verifiziert und pro Absender ratelimitiert.
- Prüfungen auf ungültige Token verwenden einen Secret-Vergleich in konstanter Zeit und werden Fail-Closed durchgeführt.
- Bevorzugen Sie `dmPolicy: "allowlist"` für Produktionsumgebungen.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, es sei denn, Sie benötigen ausdrücklich die Legacy-Antwortzustellung auf Basis von Benutzernamen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, es sei denn, Sie akzeptieren ausdrücklich das Routing-Risiko eines gemeinsam genutzten Pfads in einer Mehrkontoeinrichtung.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - in der Payload des ausgehenden Webhooks fehlt eines der erforderlichen Felder
  - wenn Synology das Token in Headern sendet, stellen Sie sicher, dass das Gateway/der Proxy diese Header beibehält
- `Invalid token`:
  - das Secret des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein
  - die Anfrage trifft das falsche Konto bzw. den falschen Webhook-Pfad
  - ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - zu viele Versuche mit ungültigem Token von derselben Quelle können diese Quelle vorübergehend sperren
  - authentifizierte Absender haben außerdem ein separates Nachrichten-Ratelimit pro Benutzer
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - die numerische `user_id` des Absenders ist nicht in `allowedUserIds` enthalten

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
