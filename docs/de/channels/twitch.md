---
read_when:
    - Twitch-Chat-Integration für OpenClaw einrichten
sidebarTitle: Twitch
summary: Konfiguration und Einrichtung des Twitch-Chatbots
title: Twitch
x-i18n:
    generated_at: "2026-04-30T06:42:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Twitch-Chat-Support über IRC-Verbindung. OpenClaw verbindet sich als Twitch-Benutzer (Bot-Konto), um Nachrichten in Kanälen zu empfangen und zu senden.

## Gebündeltes Plugin

<Note>
Twitch wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.
</Note>

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Twitch ausschließt, installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht ist:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten
OpenClaw-Build oder den lokalen Checkout-Pfad, bis ein neueres npm-Paket
veröffentlicht ist.

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (Einsteiger)

<Steps>
  <Step title="Ensure plugin is available">
    Aktuelle paketierte OpenClaw-Releases bündeln es bereits. Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
  </Step>
  <Step title="Create a Twitch bot account">
    Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein vorhandenes Konto).
  </Step>
  <Step title="Generate credentials">
    Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wählen Sie **Bot Token** aus
    - Prüfen Sie, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
    - Kopieren Sie die **Client ID** und das **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    Verwenden Sie [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), um einen Benutzernamen in eine Twitch-Benutzer-ID umzuwandeln.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
    - Oder Konfiguration: `channels.twitch.accessToken`

    Wenn beides gesetzt ist, hat die Konfiguration Vorrang (Env-Fallback gilt nur für das Standardkonto).

  </Step>
  <Step title="Start the gateway">
    Starten Sie das Gateway mit dem konfigurierten Kanal.
  </Step>
</Steps>

<Warning>
Fügen Sie Zugriffskontrolle (`allowFrom` oder `allowedRoles`) hinzu, um zu verhindern, dass nicht autorisierte Benutzer den Bot auslösen. `requireMention` ist standardmäßig `true`.
</Warning>

Minimale Konfiguration:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Was es ist

- Ein Twitch-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen immer zurück an Twitch.
- Jedes Konto wird einem isolierten Sitzungsschlüssel `agent:<agentId>:twitch:<accountName>` zugeordnet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` ist der Chatraum, dem beigetreten wird.

## Einrichtung (detailliert)

### Anmeldedaten generieren

Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wählen Sie **Bot Token** aus
- Prüfen Sie, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
- Kopieren Sie die **Client ID** und das **Access Token**

<Note>
Keine manuelle App-Registrierung erforderlich. Tokens laufen nach mehreren Stunden ab.
</Note>

### Den Bot konfigurieren

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Wenn sowohl Env als auch Konfiguration gesetzt sind, hat die Konfiguration Vorrang.

### Zugriffskontrolle (empfohlen)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Bevorzugen Sie `allowFrom` für eine strikte Zulassungsliste. Verwenden Sie stattdessen `allowedRoles`, wenn Sie rollenbasierten Zugriff möchten.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Warum Benutzer-IDs?** Benutzernamen können sich ändern und dadurch Identitätsmissbrauch ermöglichen. Benutzer-IDs sind dauerhaft.

Ihre Twitch-Benutzer-ID finden: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Wandeln Sie Ihren Twitch-Benutzernamen in eine ID um)
</Note>

## Token-Aktualisierung (optional)

Tokens vom [Twitch Token Generator](https://twitchtokengenerator.com/) können nicht automatisch aktualisiert werden - generieren Sie sie neu, wenn sie abgelaufen sind.

Für automatische Token-Aktualisierung erstellen Sie Ihre eigene Twitch-Anwendung in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Sie der Konfiguration Folgendes hinzu:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Der Bot aktualisiert Tokens automatisch vor Ablauf und protokolliert Aktualisierungsereignisse.

## Multi-Konto-Support

Verwenden Sie `channels.twitch.accounts` mit kontospezifischen Tokens. Siehe [Konfiguration](/de/gateway/configuration) für das gemeinsame Muster.

Beispiel (ein Bot-Konto in zwei Kanälen):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Jedes Konto benötigt ein eigenes Token (ein Token pro Kanal).
</Note>

## Zugriffskontrolle

<Tabs>
  <Tab title="User ID allowlist (most secure)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Role-based">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` ist eine strikte Zulassungsliste. Wenn gesetzt, sind nur diese Benutzer-IDs erlaubt. Wenn Sie rollenbasierten Zugriff möchten, lassen Sie `allowFrom` ungesetzt und konfigurieren Sie stattdessen `allowedRoles`.

  </Tab>
  <Tab title="Disable @mention requirement">
    Standardmäßig ist `requireMention` auf `true` gesetzt. Um dies zu deaktivieren und auf alle Nachrichten zu antworten:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Fehlerbehebung

Führen Sie zuerst Diagnosebefehle aus:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie `allowFrom` vorübergehend und setzen Sie `allowedRoles: ["all"]`, um zu testen.
    - **Prüfen, ob der Bot im Kanal ist:** Der Bot muss dem in `channel` angegebenen Kanal beitreten.

  </Accordion>
  <Accordion title="Token issues">
    „Failed to connect“ oder Authentifizierungsfehler:

    - Prüfen Sie, dass `accessToken` der Wert des OAuth-Zugriffstokens ist (beginnt typischerweise mit dem Präfix `oauth:`)
    - Prüfen Sie, dass das Token die Scopes `chat:read` und `chat:write` hat
    - Wenn Sie Token-Aktualisierung verwenden, prüfen Sie, dass `clientSecret` und `refreshToken` gesetzt sind

  </Accordion>
  <Accordion title="Token refresh not working">
    Prüfen Sie die Logs auf Aktualisierungsereignisse:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Wenn Sie „token refresh disabled (no refresh token)“ sehen:

    - Stellen Sie sicher, dass `clientSecret` angegeben ist
    - Stellen Sie sicher, dass `refreshToken` angegeben ist

  </Accordion>
</AccordionGroup>

## Konfiguration

### Kontokonfiguration

<ParamField path="username" type="string">
  Bot-Benutzername.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth-Zugriffstoken mit `chat:read` und `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (vom Token Generator oder Ihrer App).
</ParamField>
<ParamField path="channel" type="string" required>
  Kanal, dem beigetreten wird.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Dieses Konto aktivieren.
</ParamField>
<ParamField path="clientSecret" type="string">
  Optional: für automatische Token-Aktualisierung.
</ParamField>
<ParamField path="refreshToken" type="string">
  Optional: für automatische Token-Aktualisierung.
</ParamField>
<ParamField path="expiresIn" type="number">
  Token-Ablaufzeit in Sekunden.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Zeitstempel des Token-Erhalts.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Benutzer-ID-Zulassungsliste.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rollenbasierte Zugriffskontrolle.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention erforderlich machen.
</ParamField>

### Provider-Optionen

- `channels.twitch.enabled` - Kanalstart aktivieren/deaktivieren
- `channels.twitch.username` - Bot-Benutzername (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accessToken` - OAuth-Zugriffstoken (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.clientId` - Twitch Client ID (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.channel` - Kanal, dem beigetreten wird (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accounts.<accountName>` - Multi-Konto-Konfiguration (alle obigen Kontofelder)

Vollständiges Beispiel:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool-Aktionen

Der Agent kann `twitch` mit folgender Aktion aufrufen:

- `send` - Eine Nachricht an einen Kanal senden

Beispiel:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sicherheit und Betrieb

- **Behandeln Sie Tokens wie Passwörter** — Committen Sie Tokens niemals in git.
- **Verwenden Sie automatische Token-Aktualisierung** für dauerhaft laufende Bots.
- **Verwenden Sie Benutzer-ID-Zulassungslisten** statt Benutzernamen für die Zugriffskontrolle.
- **Überwachen Sie Logs** auf Token-Aktualisierungsereignisse und Verbindungsstatus.
- **Begrenzen Sie Token-Scopes minimal** — Fordern Sie nur `chat:read` und `chat:write` an.
- **Wenn Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie bestätigt haben, dass kein anderer Prozess die Sitzung besitzt.

## Limits

- **500 Zeichen** pro Nachricht (automatisch an Wortgrenzen aufgeteilt).
- Markdown wird vor dem Aufteilen entfernt.
- Keine Ratenbegrenzung (verwendet die integrierten Ratenbegrenzungen von Twitch).

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
