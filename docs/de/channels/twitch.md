---
read_when:
    - Twitch-Chat-Integration für OpenClaw einrichten
sidebarTitle: Twitch
summary: Konfiguration und Einrichtung des Twitch-Chatbots
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Twitch-Chat-Unterstützung über IRC-Verbindung. OpenClaw verbindet sich als Twitch-Benutzer (Bot-Konto), um Nachrichten in Kanälen zu empfangen und zu senden.

## Gebündeltes Plugin

<Note>
Twitch wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.
</Note>

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Twitch ausschließt, installieren Sie das npm-Paket direkt:

<Tabs>
  <Tab title="npm-Registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Lokaler Checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung (Einsteiger)

<Steps>
  <Step title="Sicherstellen, dass das Plugin verfügbar ist">
    Aktuelle paketierte OpenClaw-Releases bündeln es bereits. Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
  </Step>
  <Step title="Twitch-Bot-Konto erstellen">
    Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein vorhandenes Konto).
  </Step>
  <Step title="Zugangsdaten erzeugen">
    Verwenden Sie [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wählen Sie **Bot Token**
    - Prüfen Sie, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
    - Kopieren Sie die **Client ID** und das **Access Token**

  </Step>
  <Step title="Ihre Twitch-Benutzer-ID finden">
    Verwenden Sie [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), um einen Benutzernamen in eine Twitch-Benutzer-ID umzuwandeln.
  </Step>
  <Step title="Token konfigurieren">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
    - Oder Konfiguration: `channels.twitch.accessToken`

    Wenn beides gesetzt ist, hat die Konfiguration Vorrang (Env-Fallback gilt nur für das Standardkonto).

  </Step>
  <Step title="Gateway starten">
    Starten Sie das Gateway mit dem konfigurierten Kanal.
  </Step>
</Steps>

<Warning>
Fügen Sie Zugriffskontrolle (`allowFrom` oder `allowedRoles`) hinzu, um zu verhindern, dass unbefugte Benutzer den Bot auslösen. `requireMention` ist standardmäßig `true`.
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
- `username` ist das Konto des Bots (das authentifiziert wird), `channel` ist der Chatraum, dem beigetreten wird.

## Einrichtung (detailliert)

### Zugangsdaten erzeugen

Verwenden Sie [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wählen Sie **Bot Token**
- Prüfen Sie, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
- Kopieren Sie die **Client ID** und das **Access Token**

<Note>
Keine manuelle App-Registrierung erforderlich. Tokens laufen nach mehreren Stunden ab.
</Note>

### Bot konfigurieren

<Tabs>
  <Tab title="Env-Variable (nur Standardkonto)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Konfiguration">
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

Wenn Env und Konfiguration beide gesetzt sind, hat die Konfiguration Vorrang.

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

Bevorzugen Sie `allowFrom` für eine harte Positivliste. Verwenden Sie stattdessen `allowedRoles`, wenn Sie rollenbasierten Zugriff möchten.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Warum Benutzer-IDs?** Benutzernamen können sich ändern, was Identitätsübernahme ermöglicht. Benutzer-IDs sind dauerhaft.

Ihre Twitch-Benutzer-ID finden: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Konvertieren Sie Ihren Twitch-Benutzernamen in eine ID)
</Note>

## Token-Aktualisierung (optional)

Tokens aus [Twitch Token Generator](https://twitchtokengenerator.com/) können nicht automatisch aktualisiert werden - erzeugen Sie sie nach Ablauf neu.

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

Der Bot aktualisiert Tokens automatisch vor dem Ablauf und protokolliert Aktualisierungsereignisse.

## Unterstützung für mehrere Konten

Verwenden Sie `channels.twitch.accounts` mit kontoabhängigen Tokens. Siehe [Konfiguration](/de/gateway/configuration) für das gemeinsame Muster.

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
Jedes Konto benötigt sein eigenes Token (ein Token pro Kanal).
</Note>

## Zugriffskontrolle

<Tabs>
  <Tab title="Benutzer-ID-Positivliste (am sichersten)">
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

    `allowFrom` ist eine harte Positivliste. Wenn gesetzt, sind nur diese Benutzer-IDs erlaubt. Wenn Sie rollenbasierten Zugriff möchten, lassen Sie `allowFrom` ungesetzt und konfigurieren Sie stattdessen `allowedRoles`.

  </Tab>
  <Tab title="@mention-Anforderung deaktivieren">
    Standardmäßig ist `requireMention` `true`. So deaktivieren Sie dies und antworten auf alle Nachrichten:

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
  <Accordion title="Bot reagiert nicht auf Nachrichten">
    - **Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie `allowFrom` vorübergehend und setzen Sie zum Testen `allowedRoles: ["all"]`.
    - **Prüfen, ob der Bot im Kanal ist:** Der Bot muss dem in `channel` angegebenen Kanal beitreten.

  </Accordion>
  <Accordion title="Token-Probleme">
    „Failed to connect“ oder Authentifizierungsfehler:

    - Prüfen Sie, dass `accessToken` der OAuth-Zugriffstokenwert ist (beginnt typischerweise mit dem Präfix `oauth:`)
    - Prüfen Sie, dass das Token die Scopes `chat:read` und `chat:write` hat
    - Wenn Sie Token-Aktualisierung verwenden, prüfen Sie, dass `clientSecret` und `refreshToken` gesetzt sind

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
  OAuth-Zugriffstoken mit `chat:read` und `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (aus Token Generator oder Ihrer App).
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
  Zeitstempel, zu dem das Token erhalten wurde.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Benutzer-ID-Positivliste.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rollenbasierte Zugriffskontrolle.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention erforderlich.
</ParamField>

### Provider-Optionen

- `channels.twitch.enabled` - Kanalstart aktivieren/deaktivieren
- `channels.twitch.username` - Bot-Benutzername (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accessToken` - OAuth-Zugriffstoken (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.clientId` - Twitch Client ID (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.channel` - Kanal, dem beigetreten werden soll (vereinfachte Einzelkonto-Konfiguration)
- `channels.twitch.accounts.<accountName>` - Mehrkonten-Konfiguration (alle Kontofelder oben)

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

- **Behandeln Sie Tokens wie Passwörter** — Committen Sie Tokens niemals in Git.
- **Verwenden Sie automatische Token-Aktualisierung** für langlebige Bots.
- **Verwenden Sie Benutzer-ID-Positivlisten** statt Benutzernamen für die Zugriffskontrolle.
- **Überwachen Sie Logs** auf Token-Aktualisierungsereignisse und Verbindungsstatus.
- **Beschränken Sie Tokens minimal** — Fordern Sie nur `chat:read` und `chat:write` an.
- **Wenn Sie feststecken**: Starten Sie das Gateway neu, nachdem Sie bestätigt haben, dass kein anderer Prozess die Sitzung besitzt.

## Grenzen

- **500 Zeichen** pro Nachricht (automatisch an Wortgrenzen aufgeteilt).
- Markdown wird vor dem Aufteilen entfernt.
- Keine Ratenbegrenzung (verwendet die integrierten Ratenbegrenzungen von Twitch).

## Verwandt

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
