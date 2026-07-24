---
read_when:
    - Synology Chat mit OpenClaw einrichten
    - Debuggen des Synology-Chat-Webhook-Routings
summary: Einrichtung des Synology-Chat-Webhooks und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-07-24T04:16:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c03379944ee4187260a7287f6d2aed1ad8fdd1c22b5581c8a5d55515bbb6ad5
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat verbindet sich über ein Webhook-Paar mit OpenClaw: Ein ausgehender Webhook von Synology Chat sendet eingehende Direktnachrichten an das Gateway, und Antworten werden über einen eingehenden Webhook von Synology Chat zurückgesendet.

Status: offizielles Plugin, separat installiert. Nur Direktnachrichten; Textnachrichten und dateibasierte Sendungen per URL werden unterstützt.

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
2. In den Integrationen von Synology Chat:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Legen Sie als URL des ausgehenden Webhooks Ihr OpenClaw Gateway fest:
   - `https://gateway-host/webhook/synology` standardmäßig.
   - Oder Ihren benutzerdefinierten `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab. Synology Chat erscheint in beiden Abläufen in derselben Liste zur Kanaleinrichtung:
   - Geführt: `openclaw onboard` oder `openclaw channels add`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie dem Synology-Chat-Bot eine Direktnachricht.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks aus `body.token`, dann
  `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Tokens führen zu einer sicheren Ablehnung.
- Nutzdaten können `application/x-www-form-urlencoded` oder `application/json` sein; `token`, `user_id` und `text` sind erforderlich.

## Dauerhaftigkeit eingehender Nachrichten

Nachdem die Token-, Absenderrichtlinien- und Ratenbegrenzungsprüfungen bestanden wurden, entfernt OpenClaw das Webhook-Token aus dem gespeicherten Umschlag und reiht das Ereignis dauerhaft in die Warteschlange ein, bevor es bestätigt wird. Die Route gibt `204` erst zurück, nachdem dieses Anhängen erfolgreich war; ein Persistenzfehler gibt `503` zurück, damit Synology Chat den Vorgang wiederholen kann, anstatt die Nachricht unbemerkt zu verlieren.

Ausstehende oder wiederholbare Ereignisse überstehen einen Neustart des Gateways. Synologys stabile `post_id` unterdrückt doppelte Warteschlangeneinträge, solange der entsprechende aktive oder aufbewahrte Abschlussdatensatz vorhanden ist. Die Zustellung erfolgt beim Übergang von der Warteschlange an den Agenten weiterhin mindestens einmal, sodass ein Absturz an dieser Grenze weiterhin zur erneuten Ausführung eines Durchlaufs führen kann.

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

`SYNOLOGY_CHAT_INCOMING_URL` und `SYNOLOGY_NAS_HOST` können nicht über eine `.env` im Arbeitsbereich festgelegt werden; siehe [`.env`-Dateien im Arbeitsbereich](/de/gateway/security#workspace-env-files).

## Direktnachrichtenrichtlinie und Zugriffskontrolle

- Unterstützte Werte für `dmPolicy`: `allowlist` (Standard), `open` und `disabled`. Synology Chat bietet keinen Kopplungsablauf; genehmigen Sie Absender, indem Sie deren numerische Synology-Benutzer-IDs zu `allowedUserIds` hinzufügen.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) mit Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere Liste `allowedUserIds` als Fehlkonfiguration behandelt, und die Webhook-Route wird nicht gestartet.
- `dmPolicy: "open"` erlaubt öffentliche Direktnachrichten nur, wenn `allowedUserIds` den Wert `"*"` enthält; bei einschränkenden Einträgen können nur übereinstimmende Benutzer chatten. Bei `open` und einer leeren Liste `allowedUserIds` wird der Start der Route ebenfalls verweigert.
- `dmPolicy: "disabled"` blockiert Direktnachrichten.
- Die Bindung des Antwortempfängers bleibt standardmäßig an die stabile numerische `user_id` gebunden. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Kompatibilitätsmodus für Notfälle, der die veränderliche Suche anhand von Benutzername/Spitzname für die Antwortzustellung wieder aktiviert.

## Ausgehende Zustellung

Verwenden Sie numerische Synology-Chat-Benutzer-IDs als Ziele. Die Präfixe `synology-chat:`, `synology_chat:` und `synology:` werden akzeptiert.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hallo von OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Nochmals hallo"
openclaw message send --channel synology-chat --target synology:123456 --message "Kurzes Präfix"
```

Ausgehender Text wird bei 2000 Zeichen aufgeteilt. Das Senden von Medien wird durch dateibasierte Zustellung per URL unterstützt: Das NAS lädt die Datei herunter und hängt sie an (max. 32 MB). URLs ausgehender Dateien müssen `http` oder `https` verwenden, und private oder anderweitig blockierte Netzwerkziele werden abgelehnt, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Mehrere Konten

Mehrere Synology-Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, Direktnachrichtenrichtlinie und Grenzwerte überschreiben.
Direktnachrichtensitzungen sind nach Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
in zwei verschiedenen Synology-Konten keinen gemeinsamen Transkriptstatus verwendet.
Weisen Sie jedem aktivierten Konto einen eigenen `webhookPath` zu. OpenClaw lehnt identische doppelte Pfade ab
und verweigert in Konfigurationen mit mehreren Konten den Start benannter Konten, die lediglich einen gemeinsamen Webhook-Pfad erben.
Wenn Sie für ein benanntes Konto absichtlich die alte Vererbung benötigen, legen Sie
`dangerouslyAllowInheritedWebhookPath: true` für dieses Konto oder unter `channels.synology-chat` fest;
identische doppelte Pfade werden jedoch weiterhin sicher abgelehnt. Bevorzugen Sie explizite Pfade pro Konto.

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

- Halten Sie `token` geheim und erneuern Sie es, falls es offengelegt wurde.
- Belassen Sie `allowInsecureSsl: false`, sofern Sie nicht ausdrücklich einem selbstsignierten Zertifikat eines lokalen NAS vertrauen.
- Eingehende Webhook-Anfragen werden anhand des Tokens überprüft und pro Absender ratenbegrenzt (`rateLimitPerMinute`, Standardwert 30).
- Bei Prüfungen ungültiger Tokens wird ein zeitkonstanter Geheimnisvergleich verwendet und sicher abgelehnt; wiederholte Versuche mit ungültigen Tokens sperren die Quell-IP vorübergehend.
- Der Text eingehender Nachrichten wird gegen bekannte Prompt-Injection-Muster bereinigt und auf 4000 Zeichen gekürzt.
- Bevorzugen Sie `dmPolicy: "allowlist"` für den Produktivbetrieb.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, sofern Sie nicht ausdrücklich die alte benutzernamenbasierte Antwortzustellung benötigen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, sofern Sie nicht ausdrücklich das Routing-Risiko eines gemeinsam genutzten Pfads in einer Konfiguration mit mehreren Konten akzeptieren.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - In den Nutzdaten des ausgehenden Webhooks fehlt eines der erforderlichen Felder
  - Wenn Synology das Token in Headern sendet, stellen Sie sicher, dass das Gateway bzw. der Proxy diese Header beibehält
- `Invalid token`:
  - Das Geheimnis des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein
  - Die Anfrage erreicht den falschen Konto-/Webhook-Pfad
  - Ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - Zu viele Versuche mit ungültigen Tokens von derselben Quelle können diese Quelle vorübergehend sperren
  - Für authentifizierte Absender gilt außerdem eine separate Nachrichtenratenbegrenzung pro Benutzer
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - Die numerische `user_id` des Absenders ist nicht in `allowedUserIds` enthalten

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchatverhalten und Erwähnungssteuerung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
