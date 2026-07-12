---
read_when:
    - Synology Chat mit OpenClaw einrichten
    - Debugging des Synology-Chat-Webhook-Routings
summary: Einrichtung des Synology-Chat-Webhooks und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T01:24:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat verbindet sich über ein Webhook-Paar mit OpenClaw: Ein ausgehender Synology-Chat-Webhook sendet eingehende Direktnachrichten an den Gateway, und Antworten werden über einen eingehenden Synology-Chat-Webhook zurückgesendet.

Status: offizielles Plugin, separat installiert. Nur Direktnachrichten; Textnachrichten und URL-basierter Dateiversand werden unterstützt.

## Installation

```bash
openclaw plugins install @openclaw/synology-chat
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Installieren Sie das Plugin (siehe oben).
2. In den Synology-Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Richten Sie die URL des ausgehenden Webhooks auf Ihren OpenClaw-Gateway:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihren benutzerdefinierten Pfad `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab. Synology Chat erscheint in beiden Abläufen in derselben Liste zur Kanaleinrichtung:
   - Geführt: `openclaw onboard` oder `openclaw channels add`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie den Gateway neu und senden Sie dem Synology-Chat-Bot eine Direktnachricht.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks zuerst aus `body.token`, dann aus
  `?token=...` und anschließend aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Tokens führen zur sicheren Ablehnung.
- Nutzdaten können vom Typ `application/x-www-form-urlencoded` oder `application/json` sein; `token`, `user_id` und `text` sind erforderlich.

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

`SYNOLOGY_CHAT_INCOMING_URL` und `SYNOLOGY_NAS_HOST` können nicht über eine `.env`-Datei des Arbeitsbereichs festgelegt werden; siehe [`.env`-Dateien des Arbeitsbereichs](/de/gateway/security#workspace-env-files).

## Richtlinie und Zugriffssteuerung für Direktnachrichten

- Unterstützte Werte für `dmPolicy`: `allowlist` (Standard), `open` und `disabled`. Synology Chat verfügt über keinen Kopplungsablauf; autorisieren Sie Absender, indem Sie deren numerische Synology-Benutzer-IDs zu `allowedUserIds` hinzufügen.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere `allowedUserIds`-Liste als Fehlkonfiguration behandelt, und die Webhook-Route wird nicht gestartet.
- `dmPolicy: "open"` erlaubt öffentliche Direktnachrichten nur, wenn `allowedUserIds` den Eintrag `"*"` enthält; bei einschränkenden Einträgen können nur übereinstimmende Benutzer chatten. Bei `open` mit einer leeren `allowedUserIds`-Liste wird der Start der Route ebenfalls verweigert.
- `dmPolicy: "disabled"` blockiert Direktnachrichten.
- Die Bindung des Antwortempfängers erfolgt standardmäßig über die stabile numerische `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Kompatibilitätsmodus für Notfälle, der die Suche anhand veränderlicher Benutzernamen oder Spitznamen für die Zustellung von Antworten wieder aktiviert.

## Ausgehende Zustellung

Verwenden Sie numerische Synology-Chat-Benutzer-IDs als Ziele. Die Präfixe `synology-chat:`, `synology_chat:` und `synology:` werden akzeptiert.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Ausgehender Text wird in Abschnitte von jeweils höchstens 2.000 Zeichen aufgeteilt. Der Versand von Medien wird über die URL-basierte Dateizustellung unterstützt: Das NAS lädt die Datei herunter und hängt sie an (maximal 32 MB). URLs für ausgehende Dateien müssen `http` oder `https` verwenden; private oder anderweitig blockierte Netzwerkziele werden abgelehnt, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Mehrere Konten

Unter `channels.synology-chat.accounts` werden mehrere Synology-Chat-Konten unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, Richtlinie für Direktnachrichten und Grenzwerte überschreiben.
Direktnachrichtensitzungen sind nach Konto und Benutzer getrennt, sodass dieselbe numerische `user_id`
in zwei unterschiedlichen Synology-Konten keinen gemeinsamen Konversationsverlauf verwendet.
Weisen Sie jedem aktivierten Konto einen eigenen `webhookPath` zu. OpenClaw lehnt exakt identische Pfade ab
und verweigert in Konfigurationen mit mehreren Konten den Start benannter Konten, die lediglich einen gemeinsamen Webhook-Pfad erben.
Wenn Sie für ein benanntes Konto absichtlich die bisherige Vererbung benötigen, setzen Sie für dieses Konto oder unter
`channels.synology-chat` die Option `dangerouslyAllowInheritedWebhookPath: true`;
exakt identische Pfade werden jedoch weiterhin sicher abgelehnt. Verwenden Sie vorzugsweise explizite Pfade für jedes Konto.

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

- Halten Sie `token` geheim und ersetzen Sie es, falls es offengelegt wurde.
- Behalten Sie `allowInsecureSsl: false` bei, es sei denn, Sie vertrauen ausdrücklich einem selbstsignierten lokalen NAS-Zertifikat.
- Eingehende Webhook-Anfragen werden anhand des Tokens überprüft und pro Absender ratenbegrenzt (`rateLimitPerMinute`, Standardwert 30).
- Prüfungen ungültiger Tokens verwenden einen zeitkonstanten Vergleich geheimer Werte und lehnen Anfragen sicher ab; wiederholte Versuche mit ungültigen Tokens sperren die Quell-IP vorübergehend.
- Der Text eingehender Nachrichten wird gegen bekannte Prompt-Injection-Muster bereinigt und auf 4.000 Zeichen gekürzt.
- Verwenden Sie in Produktionsumgebungen vorzugsweise `dmPolicy: "allowlist"`.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, sofern Sie nicht ausdrücklich die bisherige, benutzernamenbasierte Zustellung von Antworten benötigen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, sofern Sie nicht ausdrücklich das Risiko der Weiterleitung über einen gemeinsamen Pfad in einer Konfiguration mit mehreren Konten akzeptieren.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - In den Nutzdaten des ausgehenden Webhooks fehlt eines der erforderlichen Felder.
  - Wenn Synology das Token in Headern sendet, stellen Sie sicher, dass der Gateway oder Proxy diese Header beibehält.
- `Invalid token`:
  - Das Geheimnis des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein.
  - Die Anfrage erreicht den falschen Konto- oder Webhook-Pfad.
  - Ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat.
- `Rate limit exceeded`:
  - Zu viele Versuche mit ungültigen Tokens aus derselben Quelle können diese Quelle vorübergehend sperren.
  - Authentifizierte Absender unterliegen außerdem einer separaten Nachrichtenratenbegrenzung pro Benutzer.
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert.
- `User not authorized`:
  - Die numerische `user_id` des Absenders ist nicht in `allowedUserIds` enthalten.

## Verwandte Themen

- [Übersicht der Kanäle](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
