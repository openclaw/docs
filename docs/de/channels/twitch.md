---
read_when:
    - Einrichtung der Twitch-Chat-Integration für OpenClaw
sidebarTitle: Twitch
summary: 'Twitch-Chatbot: Installation, Anmeldedaten, Zugriffskontrolle, Token-Aktualisierung'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T01:27:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twitch-Chat-Unterstützung über die Chat-Schnittstelle (IRC) von Twitch mithilfe des Twurple-Clients. OpenClaw meldet sich als Twitch-Bot-Konto an, tritt pro konfiguriertem Konto einem Kanal bei und antwortet in diesem Kanal.

## Installation

Twitch wird als offizielles Plugin bereitgestellt und ist nicht Teil der Kerninstallation.

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

`plugins install` registriert und aktiviert das Plugin. Wenn Sie Twitch während `openclaw onboard` oder `openclaw channels add` auswählen, wird es bei Bedarf installiert. Verwenden Sie den reinen Paketnamen, um der aktuellen Version zu folgen; legen Sie nur für reproduzierbare Installationen eine genaue Version fest. Erfordert OpenClaw 2026.4.10 oder neuer.

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

<Steps>
  <Step title="Plugin installieren">
    Siehe [Installation](#install) oben.
  </Step>
  <Step title="Twitch-Bot-Konto erstellen">
    Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein vorhandenes Konto).
  </Step>
  <Step title="Anmeldedaten generieren">
    Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wählen Sie **Bot Token**
    - Vergewissern Sie sich, dass die Berechtigungsbereiche `chat:read` und `chat:write` ausgewählt sind
    - Kopieren Sie **Client ID** und **Access Token**

  </Step>
  <Step title="Ihre Twitch-Benutzer-ID ermitteln">
    Verwenden Sie [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), um einen Benutzernamen in eine Twitch-Benutzer-ID umzuwandeln.
  </Step>
  <Step title="Token konfigurieren">
    - Umgebungsvariable: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur für das Standardkonto)
    - Oder Konfiguration: `channels.twitch.accessToken`

    Wenn beide gesetzt sind, hat die Konfiguration Vorrang (die Umgebungsvariable dient nur als Rückfalloption für das Standardkonto).

  </Step>
  <Step title="Gateway starten">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Fügen Sie eine Zugriffskontrolle (`allowFrom` oder `allowedRoles`) hinzu, um zu verhindern, dass unbefugte Benutzer den Bot auslösen. `requireMention` ist standardmäßig `true`.
</Warning>

Minimale Konfiguration:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Twitch-Konto des Bots (authentifiziert sich)
      accessToken: "oauth:abc123...", // OAuth-Zugriffstoken (oder Umgebungsvariable OPENCLAW_TWITCH_ACCESS_TOKEN verwenden)
      clientId: "xyz789...", // Client-ID aus dem Token Generator
      channel: "yourchannel", // Chat des Twitch-Kanals, dem beigetreten werden soll (erforderlich)
      allowFrom: ["123456789"], // (empfohlen) Nur Ihre Twitch-Benutzer-ID
    },
  },
}
```

## Funktionsweise

- Ein Twitch-Kanal im Besitz des Gateways.
- Deterministisches Routing: Antworten gehen immer an den Twitch-Kanal zurück, aus dem die Nachricht stammt.
- Jeder beigetretene Kanal wird einem isolierten Gruppensitzungsschlüssel `agent:<agentId>:twitch:group:<channel>` zugeordnet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` ist der Chatraum, dem beigetreten wird. Jeder Kontoeintrag tritt genau einem Kanal bei.
- Tokens funktionieren mit oder ohne Präfix `oauth:`; OpenClaw normalisiert beide Formen (der Einrichtungsassistent erwartet die Form mit `oauth:`).

## Token-Aktualisierung (optional)

Tokens vom [Twitch Token Generator](https://twitchtokengenerator.com/) können von OpenClaw nicht aktualisiert werden – generieren Sie sie nach Ablauf neu (sie sind einige Stunden gültig; keine App-Registrierung erforderlich).

Erstellen Sie für eine automatische Aktualisierung Ihre eigene App in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Sie Folgendes hinzu:

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

Wenn beide Werte gesetzt sind, verwendet das Plugin einen aktualisierenden Authentifizierungs-Provider, der Tokens vor ihrem Ablauf erneuert und jede Aktualisierung protokolliert. Ohne `refreshToken` wird `token refresh disabled (no refresh token)` protokolliert; ohne `clientSecret` wird auf ein statisches (nicht aktualisierendes) Token zurückgegriffen.

## Unterstützung mehrerer Konten

Verwenden Sie `channels.twitch.accounts` mit kontospezifischen Anmeldedaten. Das gemeinsame Muster finden Sie unter [Konfiguration](/de/gateway/configuration).

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
          channel: "yourchannel",
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
Jeder Kontoeintrag benötigt ein eigenes `accessToken` (die Umgebungsvariable gilt nur für das Standardkonto). Ein Konto tritt genau einem Kanal bei; für den Beitritt zu zwei Kanälen sind daher zwei Konten erforderlich. `channels.twitch.defaultAccount` legt fest, welches Konto das Standardkonto ist.
</Note>

## Zugriffskontrolle

`allowFrom` ist eine feste Zulassungsliste von Twitch-Benutzer-IDs. Wenn sie gesetzt ist, wird `allowedRoles` ignoriert; lassen Sie `allowFrom` ungesetzt, um stattdessen rollenbasierten Zugriff zu verwenden.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Zulassungsliste mit Benutzer-IDs (am sichersten)">
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
  </Tab>
  <Tab title="@Erwähnungsanforderung deaktivieren">
    Standardmäßig ist `requireMention` auf `true` gesetzt. So antwortet der Bot auf alle zulässigen Nachrichten:

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

<Note>
**Warum Benutzer-IDs?** Benutzernamen können geändert werden, wodurch Identitätsvortäuschung möglich ist. Benutzer-IDs sind dauerhaft.

Ermitteln Sie Ihre ID mit dem [Konverter von Benutzernamen zu IDs](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Fehlerbehebung

Führen Sie zunächst Diagnosebefehle aus:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot antwortet nicht auf Nachrichten">
    - **Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie `allowFrom` vorübergehend und setzen Sie zum Testen `allowedRoles: ["all"]`.
    - **Erwähnungssperre prüfen:** Bei `requireMention: true` (Standard) müssen Nachrichten den Benutzernamen des Bots mit @ erwähnen.
    - **Prüfen, ob der Bot im Kanal ist:** Der Bot tritt nur dem in `channel` angegebenen Kanal bei.

  </Accordion>
  <Accordion title="Token-Probleme">
    `Failed to connect` oder Authentifizierungsfehler:

    - Vergewissern Sie sich, dass `accessToken` den Wert des OAuth-Zugriffstokens enthält (das Präfix `oauth:` ist optional)
    - Prüfen Sie, ob das Token über die Berechtigungsbereiche `chat:read` und `chat:write` verfügt
    - Prüfen Sie bei Verwendung der Token-Aktualisierung, ob `clientSecret` und `refreshToken` gesetzt sind

  </Accordion>
  <Accordion title="Token-Aktualisierung funktioniert nicht">
    Prüfen Sie die Protokolle auf Aktualisierungsereignisse:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Wenn `token refresh disabled (no refresh token)` angezeigt wird:

    - Stellen Sie sicher, dass `clientSecret` angegeben ist
    - Stellen Sie sicher, dass `refreshToken` angegeben ist

  </Accordion>
</AccordionGroup>

## Konfiguration

### Kontokonfiguration

<ParamField path="username" type="string" required>
  Benutzername des Bots (das authentifizierende Konto).
</ParamField>
<ParamField path="accessToken" type="string" required>
  OAuth-Zugriffstoken mit `chat:read` und `chat:write` (Konfiguration oder Umgebungsvariable für das Standardkonto).
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch-Client-ID (aus dem Token Generator oder Ihrer App). Im Schema optional, für die Verbindung jedoch erforderlich.
</ParamField>
<ParamField path="channel" type="string" required>
  Kanal, dem beigetreten werden soll.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Dieses Konto aktivieren.
</ParamField>
<ParamField path="clientSecret" type="string">
  Optional: für die automatische Token-Aktualisierung.
</ParamField>
<ParamField path="refreshToken" type="string">
  Optional: für die automatische Token-Aktualisierung.
</ParamField>
<ParamField path="expiresIn" type="number">
  Ablaufzeit des Tokens in Sekunden (Nachverfolgung der Aktualisierung).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Zeitstempel, zu dem das Token abgerufen wurde (Nachverfolgung der Aktualisierung).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Zulassungsliste mit Benutzer-IDs. Wenn sie gesetzt ist, werden Rollen ignoriert.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rollenbasierte Zugriffskontrolle.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @Erwähnung zum Auslösen des Bots erforderlich machen.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Überschreibung des Präfixes für ausgehende Antworten dieses Kontos.
</ParamField>

### Provider-Optionen

- `channels.twitch.enabled` – Start des Kanals aktivieren/deaktivieren
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` – Vereinfachte Einzelkontokonfiguration (implizites Konto `default`; hat Vorrang vor `accounts.default`)
- `channels.twitch.accounts.<accountName>` – Mehrkontenkonfiguration (alle oben aufgeführten Kontofelder)
- `channels.twitch.defaultAccount` – Kontoname, der als Standard verwendet wird
- `channels.twitch.markdown.tables` – Darstellungsmodus für Markdown-Tabellen (`off` | `bullets` | `code` | `block`)

Vollständiges Beispiel:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool-Aktionen

Der Agent kann Twitch-Nachrichten über die Aktion `send` des Nachrichten-Tools senden:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` ist optional und verwendet standardmäßig den für das Konto konfigurierten `channel`.

## Sicherheit und Betrieb

- **Behandeln Sie Tokens wie Passwörter** – übertragen Sie Tokens niemals in Git.
- **Verwenden Sie die automatische Token-Aktualisierung** für dauerhaft laufende Bots.
- **Verwenden Sie Zulassungslisten mit Benutzer-IDs** anstelle von Benutzernamen für die Zugriffskontrolle.
- **Überwachen Sie die Protokolle** auf Token-Aktualisierungsereignisse und den Verbindungsstatus.
- **Beschränken Sie die Token-Berechtigungen auf das Minimum** – fordern Sie nur `chat:read` und `chat:write` an.
- **Wenn Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie sich vergewissert haben, dass kein anderer Prozess die Sitzung besitzt.

## Beschränkungen

- **500 Zeichen** pro Nachricht; längere Antworten werden an Wortgrenzen aufgeteilt.
- Markdown wird vor dem Senden entfernt (der Twitch-Chat besteht aus Klartext; Zeilenumbrüche werden zu Leerzeichen).
- OpenClaw fügt keine eigene Ratenbegrenzung hinzu; der Twurple-Chat-Client verarbeitet die Ratenbegrenzungen von Twitch.

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungssperre
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
