---
read_when:
    - Einrichten der Twitch-Chat-Integration für OpenClaw
sidebarTitle: Twitch
summary: Konfiguration und Einrichtung des Twitch-Chatbots
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Twitch-Chat-Unterstützung über IRC-Verbindung. OpenClaw verbindet sich als Twitch-Benutzer (Bot-Konto), um Nachrichten in Kanälen zu empfangen und zu senden.

## Gebündeltes Plugin

<Note>
Twitch wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, daher benötigen normale paketierte Builds keine separate Installation.
</Note>

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Twitch nicht enthält, installieren Sie es manuell:

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

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung (für Einsteiger)

<Steps>
  <Step title="Sicherstellen, dass das Plugin verfügbar ist">
    Aktuelle paketierte OpenClaw-Releases enthalten es bereits. Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
  </Step>
  <Step title="Ein Twitch-Bot-Konto erstellen">
    Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein bestehendes Konto).
  </Step>
  <Step title="Zugangsdaten generieren">
    Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wählen Sie **Bot Token**
    - Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
    - Kopieren Sie die **Client ID** und das **Access Token**

  </Step>
  <Step title="Ihre Twitch-Benutzer-ID finden">
    Verwenden Sie [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), um einen Benutzernamen in eine Twitch-Benutzer-ID umzuwandeln.
  </Step>
  <Step title="Das Token konfigurieren">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
    - Oder Konfiguration: `channels.twitch.accessToken`

    Wenn beides gesetzt ist, hat die Konfiguration Vorrang (Env-Fallback gilt nur für das Standardkonto).

  </Step>
  <Step title="Das Gateway starten">
    Starten Sie das Gateway mit dem konfigurierten Kanal.
  </Step>
</Steps>

<Warning>
Fügen Sie Zugriffskontrollen (`allowFrom` oder `allowedRoles`) hinzu, um zu verhindern, dass nicht autorisierte Benutzer den Bot auslösen. `requireMention` ist standardmäßig auf `true` gesetzt.
</Warning>

Minimale Konfiguration:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Twitch-Konto des Bots
      accessToken: "oauth:abc123...", // OAuth Access Token (oder OPENCLAW_TWITCH_ACCESS_TOKEN als Env-Variable verwenden)
      clientId: "xyz789...", // Client ID vom Token Generator
      channel: "vevisk", // Zu welchem Twitch-Chat-Kanal beigetreten werden soll (erforderlich)
      allowFrom: ["123456789"], // (empfohlen) Nur Ihre Twitch-Benutzer-ID – abrufbar über https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Was es ist

- Ein Twitch-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen immer an Twitch zurück.
- Jedes Konto wird auf einen isolierten Sitzungsschlüssel `agent:<agentId>:twitch:<accountName>` abgebildet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` ist der Chat-Raum, dem beigetreten wird.

## Einrichtung (detailliert)

### Zugangsdaten generieren

Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wählen Sie **Bot Token**
- Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
- Kopieren Sie die **Client ID** und das **Access Token**

<Note>
Keine manuelle App-Registrierung erforderlich. Tokens laufen nach mehreren Stunden ab.
</Note>

### Den Bot konfigurieren

<Tabs>
  <Tab title="Env var (nur Standardkonto)">
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
      allowFrom: ["123456789"], // (empfohlen) Nur Ihre Twitch-Benutzer-ID
    },
  },
}
```

Bevorzugen Sie `allowFrom` für eine harte Allowlist. Verwenden Sie stattdessen `allowedRoles`, wenn Sie rollenbasierten Zugriff möchten.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Warum Benutzer-IDs?** Benutzernamen können sich ändern und so Identitätsvortäuschung ermöglichen. Benutzer-IDs sind dauerhaft.

Finden Sie Ihre Twitch-Benutzer-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Ihren Twitch-Benutzernamen in eine ID umwandeln)
</Note>

## Token-Aktualisierung (optional)

Tokens vom [Twitch Token Generator](https://twitchtokengenerator.com/) können nicht automatisch aktualisiert werden — generieren Sie sie nach Ablauf erneut.

Für automatische Token-Aktualisierung erstellen Sie Ihre eigene Twitch-Anwendung in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Folgendes zur Konfiguration hinzu:

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

Der Bot aktualisiert Tokens automatisch vor ihrem Ablauf und protokolliert Aktualisierungsereignisse.

## Unterstützung mehrerer Konten

Verwenden Sie `channels.twitch.accounts` mit kontospezifischen Tokens. Das gemeinsame Muster finden Sie unter [Configuration](/de/gateway/configuration).

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
  <Tab title="Benutzer-ID-Allowlist (am sichersten)">
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
  <Tab title="Rollenbasiert">
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

    `allowFrom` ist eine harte Allowlist. Wenn gesetzt, sind nur diese Benutzer-IDs zugelassen. Wenn Sie rollenbasierten Zugriff möchten, lassen Sie `allowFrom` unset und konfigurieren stattdessen `allowedRoles`.

  </Tab>
  <Tab title="@Erwähnungspflicht deaktivieren">
    Standardmäßig ist `requireMention` auf `true` gesetzt. Zum Deaktivieren und Antworten auf alle Nachrichten:

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

Führen Sie zunächst Diagnosebefehle aus:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Der Bot antwortet nicht auf Nachrichten">
    - **Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie `allowFrom` testweise vorübergehend und setzen Sie `allowedRoles: ["all"]`.
    - **Prüfen, ob der Bot im Kanal ist:** Der Bot muss dem in `channel` angegebenen Kanal beitreten.

  </Accordion>
  <Accordion title="Token-Probleme">
    „Failed to connect“ oder Authentifizierungsfehler:

    - Vergewissern Sie sich, dass `accessToken` der Wert des OAuth-Access-Tokens ist (beginnt typischerweise mit dem Präfix `oauth:`)
    - Prüfen Sie, ob das Token die Scopes `chat:read` und `chat:write` hat
    - Wenn Sie Token-Aktualisierung verwenden, prüfen Sie, ob `clientSecret` und `refreshToken` gesetzt sind

  </Accordion>
  <Accordion title="Token-Aktualisierung funktioniert nicht">
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
  OAuth-Access-Token mit `chat:read` und `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch-Client-ID (vom Token Generator oder Ihrer App).
</ParamField>
<ParamField path="channel" type="string" required>
  Kanal, dem beigetreten werden soll.
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
  Token-Ablauf in Sekunden.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Zeitstempel des Token-Erhalts.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Benutzer-ID-Allowlist.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rollenbasierte Zugriffskontrolle.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @Erwähnung verlangen.
</ParamField>

### Provider-Optionen

- `channels.twitch.enabled` - Kanalstart aktivieren/deaktivieren
- `channels.twitch.username` - Bot-Benutzername (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accessToken` - OAuth-Access-Token (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.clientId` - Twitch-Client-ID (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.channel` - Kanal, dem beigetreten werden soll (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accounts.<accountName>` - Mehrkonto-Konfiguration (alle obigen Kontofelder)

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

- **Behandeln Sie Tokens wie Passwörter** — Tokens niemals in Git committen.
- **Verwenden Sie automatische Token-Aktualisierung** für lang laufende Bots.
- **Verwenden Sie Benutzer-ID-Allowlists** statt Benutzernamen für die Zugriffskontrolle.
- **Überwachen Sie Logs** auf Token-Aktualisierungsereignisse und Verbindungsstatus.
- **Scopes von Tokens minimal halten** — nur `chat:read` und `chat:write` anfordern.
- **Wenn Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie bestätigt haben, dass kein anderer Prozess die Sitzung besitzt.

## Grenzen

- **500 Zeichen** pro Nachricht (automatisch an Wortgrenzen aufgeteilt).
- Markdown wird vor dem Aufteilen entfernt.
- Keine Ratenbegrenzung (verwendet die integrierten Ratenlimits von Twitch).

## Verwandt

- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungssteuerung
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
