---
read_when:
    - Twitch-Chat-Integration für OpenClaw einrichten
sidebarTitle: Twitch
summary: 'Twitch-Chatbot: Installation, Anmeldedaten, Zugriffskontrolle, Token-Aktualisierung'
title: Twitch
x-i18n:
    generated_at: "2026-07-24T03:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d827c742ded5fd0b071443dead27b975e2414419b0facb486d7f9c0c9800b060
    source_path: channels/twitch.md
    workflow: 16
---

Twitch-Chat-Unterstützung über die Chat-Schnittstelle (IRC) von Twitch mithilfe des Twurple-Clients. OpenClaw meldet sich mit einem Twitch-Bot-Konto an, tritt pro konfiguriertem Konto einem Kanal bei und antwortet in diesem Kanal.

## Installation

Twitch wird als offizielles Plugin bereitgestellt und ist nicht Bestandteil der Kerninstallation.

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

`plugins install` registriert und aktiviert das Plugin. Wenn Twitch während `openclaw onboard` oder `openclaw channels add` ausgewählt wird, erfolgt die Installation bei Bedarf. Verwenden Sie den reinen Paketnamen, um der aktuellen Version zu folgen; fixieren Sie eine exakte Version nur für reproduzierbare Installationen. Erfordert OpenClaw 2026.4.10 oder neuer.

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

<Steps>
  <Step title="Plugin installieren">
    Siehe oben unter [Installation](#install).
  </Step>
  <Step title="Twitch-Bot-Konto erstellen">
    Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein vorhandenes Konto).
  </Step>
  <Step title="Anmeldedaten generieren">
    Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wählen Sie **Bot Token**
    - Prüfen Sie, ob die Scopes `chat:read` und `chat:write` ausgewählt sind
    - Kopieren Sie **Client ID** und **Access Token**

  </Step>
  <Step title="Ihre Twitch-Benutzer-ID ermitteln">
    Verwenden Sie [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), um einen Benutzernamen in eine Twitch-Benutzer-ID umzuwandeln.
  </Step>
  <Step title="Token konfigurieren">
    - Umgebungsvariable: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
    - Oder Konfiguration: `channels.twitch.accessToken`

    Wenn beide festgelegt sind, hat die Konfiguration Vorrang (die Umgebungsvariable dient nur als Rückfalloption für das Standardkonto).

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

- Ein Twitch-Kanal, dessen Eigentümer das Gateway ist.
- Deterministisches Routing: Antworten gehen immer an den Twitch-Kanal zurück, aus dem die Nachricht stammt.
- Jeder beigetretene Kanal wird einem isolierten Gruppensitzungsschlüssel `agent:<agentId>:twitch:group:<channel>` zugeordnet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` gibt den beizutretenden Chatraum an. Ein Kontoeintrag tritt genau einem Kanal bei.
- Token funktionieren mit oder ohne das Präfix `oauth:`; OpenClaw normalisiert beide Formen (der Einrichtungsassistent erwartet die Form `oauth:`).

## Dauerhafte Verarbeitung eingehender Nachrichten

OpenClaw reiht jede akzeptierte Twitch-Chatnachricht vor der normalen Weiterleitung dauerhaft in eine Warteschlange ein. Ausstehende oder erneut zustellbare Nachrichten überstehen einen Neustart des Gateways, bleiben für den konfigurierten Kanal serialisiert und verwenden die Nachrichten-ID von Twitch, um doppelte Warteschlangeneinträge zu unterdrücken, solange der aktive oder aufbewahrte Abschlussdatensatz vorhanden ist.

Der Twitch-Chat sendet eine `PRIVMSG` nicht erneut, nachdem der Client sie akzeptiert hat. Dies schützt vor Abstürzen im lokalen Zeitfenster zwischen Annahme und Weiterleitung, kann jedoch keine Nachrichten wiederherstellen, die vor der dauerhaften Aufnahme verpasst wurden. Wenn das Anhängen an die Warteschlange selbst fehlschlägt, protokolliert OpenClaw den Fehler; eine erneute Verbindung veranlasst Twitch nicht dazu, diese Nachricht erneut zu senden.

## Token-Aktualisierung (optional)

Token vom [Twitch Token Generator](https://twitchtokengenerator.com/) können von OpenClaw nicht aktualisiert werden – generieren Sie sie nach Ablauf neu (sie sind einige Stunden gültig; keine App-Registrierung erforderlich).

Erstellen Sie für die automatische Aktualisierung Ihre eigene App in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Sie Folgendes hinzu:

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

Wenn beide Werte festgelegt sind, verwendet das Plugin einen aktualisierenden Authentifizierungs-Provider, der Token vor Ablauf erneuert und jede Aktualisierung protokolliert. Ohne `refreshToken` protokolliert es `token refresh disabled (no refresh token)`; ohne `clientSecret` greift es auf ein statisches (nicht aktualisierbares) Token zurück.

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
Jeder Kontoeintrag benötigt einen eigenen Wert für `accessToken` (die Umgebungsvariable gilt nur für das Standardkonto). Ein Konto tritt genau einem Kanal bei; für den Beitritt zu zwei Kanälen sind daher zwei Konten erforderlich. `channels.twitch.defaultAccount` bestimmt, welches Konto das Standardkonto ist.
</Note>

## Zugriffskontrolle

`allowFrom` ist eine strikte Positivliste von Twitch-Benutzer-IDs. Wenn sie festgelegt ist, wird `allowedRoles` ignoriert; lassen Sie `allowFrom` nicht festgelegt, um stattdessen rollenbasierten Zugriff zu verwenden.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Positivliste der Benutzer-IDs (am sichersten)">
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
**Warum Benutzer-IDs?** Benutzernamen können geändert werden, wodurch Identitätsvortäuschung möglich wird. Benutzer-IDs sind dauerhaft.

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
    - **Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie zum Testen vorübergehend `allowFrom` und setzen Sie `allowedRoles: ["all"]`.
    - **Erwähnungssperre prüfen:** Bei `requireMention: true` (Standard) müssen Nachrichten den Benutzernamen des Bots mit @ erwähnen.
    - **Prüfen, ob der Bot im Kanal ist:** Der Bot tritt nur dem in `channel` angegebenen Kanal bei.

  </Accordion>
  <Accordion title="Token-Probleme">
    „Verbindung fehlgeschlagen“ oder Authentifizierungsfehler:

    - Prüfen Sie, ob `accessToken` den Wert des OAuth-Zugriffstokens enthält (das Präfix `oauth:` ist optional)
    - Prüfen Sie, ob das Token über die Scopes `chat:read` und `chat:write` verfügt
    - Wenn Sie die Token-Aktualisierung verwenden, prüfen Sie, ob `clientSecret` und `refreshToken` festgelegt sind

  </Accordion>
  <Accordion title="Token-Aktualisierung funktioniert nicht">
    Prüfen Sie die Protokolle auf Aktualisierungsereignisse:

    ```text
    Umgebungs-Tokenquelle für mybot wird verwendet
    Zugriffstoken für Benutzer 123456 aktualisiert (läuft in 14400s ab)
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
  Twitch-Client-ID (aus dem Token Generator oder Ihrer App). Im Schema optional, aber für die Verbindung erforderlich.
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
  Token-Ablaufzeit in Sekunden (Nachverfolgung der Aktualisierung).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Zeitstempel des Token-Erhalts (Nachverfolgung der Aktualisierung).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Positivliste der Benutzer-IDs. Wenn sie festgelegt ist, werden Rollen ignoriert.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rollenbasierte Zugriffskontrolle.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @Erwähnung zum Auslösen des Bots voraussetzen.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Überschreibung des Präfixes für ausgehende Antworten dieses Kontos.
</ParamField>

### Provider-Optionen

- `channels.twitch.enabled` – Kanalstart aktivieren/deaktivieren
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` – Vereinfachte Einzelkontokonfiguration (implizites Konto `default`; hat Vorrang vor `accounts.default`)
- `channels.twitch.accounts.<accountName>` – Mehrkontenkonfiguration (alle oben aufgeführten Kontofelder)
- `channels.twitch.defaultAccount` – Name des Standardkontos
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
  message: "Hallo Twitch!",
}
```

`to` ist optional und verwendet standardmäßig den konfigurierten Wert `channel` des Kontos.

## Sicherheit und Betrieb

- **Behandeln Sie Tokens wie Passwörter** – committen Sie Tokens niemals in Git.
- **Verwenden Sie die automatische Token-Aktualisierung** für Bots mit langer Laufzeit.
- **Verwenden Sie Zulassungslisten mit Benutzer-IDs** statt Benutzernamen für die Zugriffskontrolle.
- **Überwachen Sie die Protokolle** auf Token-Aktualisierungsereignisse und den Verbindungsstatus.
- **Beschränken Sie den Token-Umfang auf das Minimum** – fordern Sie nur `chat:read` und `chat:write` an.
- **Falls Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie bestätigt haben, dass kein anderer Prozess die Sitzung verwendet.

## Beschränkungen

- **500 Zeichen** pro Nachricht; längere Antworten werden an Wortgrenzen aufgeteilt.
- Markdown wird vor dem Senden entfernt (der Twitch-Chat verwendet reinen Text; Zeilenumbrüche werden zu Leerzeichen).
- OpenClaw fügt keine eigene Ratenbegrenzung hinzu; der Twurple-Chat-Client verarbeitet die Twitch-Ratenbegrenzungen.

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
