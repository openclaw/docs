---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Zulassungslisten, Gruppenrichtlinien oder die Erwähnungssteuerung
summary: Einrichtung des IRC-Plugins, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-07-12T15:00:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten einsetzen möchten.
Installieren Sie das offizielle IRC-Plugin und konfigurieren Sie es anschließend unter `channels.irc`.

## Schnellstart

1. Installieren Sie das Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Legen Sie in `~/.openclaw/openclaw.json` mindestens Host, Nick und die Kanäle fest, denen beigetreten werden soll:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Starten Sie den Gateway bzw. starten Sie ihn neu:

```bash
openclaw gateway run
```

Bevorzugen Sie einen privaten IRC-Server für die Bot-Koordination. Wenn Sie bewusst ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie vorhersehbare öffentliche Kanäle für den Backchannel-Datenverkehr von Bots oder Schwärmen.

## Verbindungseinstellungen

| Schlüssel                     | Standardwert                  | Hinweise                                                    |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | keiner (erforderlich)         | Hostname des IRC-Servers                                    |
| `port`                        | `6697` mit TLS, `6667` unverschlüsselt | 1-65535                                            |
| `tls`                         | `true`                        | Nur bei bewusst gewählter Klartextübertragung auf `false` setzen |
| `nick`                        | keiner (erforderlich)         | Nick des Bots                                               |
| `username`                    | Nick, sonst `openclaw`        | IRC-Benutzername                                            |
| `realname`                    | `OpenClaw`                    | Realname-/GECOS-Feld                                        |
| `password` / `passwordFile`   | keiner                        | Serverpasswort; die Datei muss eine reguläre Datei sein     |
| `channels`                    | keine                         | Kanäle, denen beigetreten werden soll (`["#openclaw"]`)     |
| `accounts` / `defaultAccount` | keine                         | Einrichtung mehrerer Konten; Umgebungsvariablen ergänzen nur das Standardkonto |

## Sicherheitsvorgaben

- IRC verwendet direkte TCP-/TLS-Sockets außerhalb des vom OpenClaw-Betreiber verwalteten Forward-Proxy-Routings. Setzen Sie in Bereitstellungen, bei denen sämtlicher ausgehender Datenverkehr über diesen Forward-Proxy laufen muss, `channels.irc.enabled=false`, sofern der direkte ausgehende IRC-Datenverkehr nicht ausdrücklich genehmigt wurde.
- `channels.irc.dmPolicy` verwendet standardmäßig `"pairing"`: Unbekannte Absender von Direktnachrichten erhalten einen Kopplungscode, den Sie mit `openclaw pairing approve irc <code>` genehmigen.
- `channels.irc.groupPolicy` verwendet standardmäßig `"allowlist"`.
- Legen Sie bei `groupPolicy="allowlist"` mit `channels.irc.groups` die zulässigen Kanäle fest.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht bewusst eine Klartextübertragung akzeptieren.

## Zugriffskontrolle

Für IRC-Kanäle gibt es zwei separate „Schranken“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot überhaupt Nachrichten aus einem Kanal akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / kanalspezifisch `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- Zulassungsliste für Direktnachrichten (Zugriff für Absender von Direktnachrichten): `channels.irc.allowFrom`
- Zulassungsliste für Gruppenabsender (Zugriff für Absender im Kanal): `channels.irc.groupAllowFrom`
- Kanalspezifische Steuerung (Kanal-, Absender- und Erwähnungsregeln): `channels.irc.groups["#channel"]` mit `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` und `systemPrompt`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig gilt weiterhin die Erwähnungsschranke**)

Einträge in der Zulassungsliste sollten stabile Absenderidentitäten (`nick!user@host`) verwenden.
Der Abgleich nur anhand des Nicks ist veränderlich und nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` gilt für Direktnachrichten, nicht für Kanäle

Wenn Sie Protokolleinträge wie diesen sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bedeutet dies, dass der Absender für **Gruppen-/Kanalnachrichten** nicht zugelassen war. Beheben Sie dies, indem Sie entweder:

- `channels.irc.groupAllowFrom` festlegen (global für alle Kanäle) oder
- kanalspezifische Absender-Zulassungslisten festlegen: `channels.irc.groups["#channel"].allowFrom`

Beispiel (allen Personen in `#openclaw` erlauben, mit dem Bot zu kommunizieren):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Auslösen von Antworten (Erwähnungen)

Selbst wenn ein Kanal zugelassen ist (über `groupPolicy` + `groups`) und der Absender zugelassen ist, verwendet OpenClaw in Gruppenkontexten standardmäßig eine **Erwähnungsschranke**. Der Bot gilt als erwähnt, wenn die Nachricht den verbundenen Bot-Nick enthält oder Ihren konfigurierten Erwähnungsmustern entspricht.

Daher sehen Sie möglicherweise Protokolleinträge wie `drop channel … (missing-mention)`, sofern die Nachricht kein zum Bot passendes Erwähnungsmuster enthält.

Um den Bot in einem IRC-Kanal **ohne erforderliche Erwähnung** antworten zu lassen, deaktivieren Sie die Erwähnungsschranke für diesen Kanal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Oder um **alle** IRC-Kanäle zuzulassen (ohne kanalspezifische Zulassungsliste) und weiterhin ohne Erwähnungen zu antworten:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Sicherheitshinweis (für öffentliche Kanäle empfohlen)

Wenn Sie in einem öffentlichen Kanal `allowFrom: ["*"]` zulassen, kann jede Person dem Bot Prompts senden.
Beschränken Sie zur Risikominderung die Tools für diesen Kanal.

### Dieselben Tools für alle Personen im Kanal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Unterschiedliche Tools je Absender (der Eigentümer erhält mehr Befugnisse)

Verwenden Sie `toolsBySender`, um eine strengere Richtlinie auf `"*"` und eine weniger strenge auf Ihren Nick anzuwenden:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Hinweise:

- Schlüssel von `toolsBySender` sollten explizite Präfixe verwenden (`channel:`, `id:`, `e164:`, `username:`, `name:`). Verwenden Sie für IRC `id:` mit dem Wert der Absenderidentität: `id:alice` oder für einen strengeren Abgleich `id:alice!~alice@203.0.113.7`.
- Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, ausschließlich als `id:` abgeglichen und erzeugen eine Veraltungswarnung.
- Die erste passende Absenderrichtlinie gilt; `"*"` dient als Platzhalter-Rückfalloption.

Weitere Informationen zum Gruppenzugriff im Vergleich zur Erwähnungsschranke und zu deren Zusammenspiel finden Sie unter: [/channels/groups](/de/channels/groups).

## NickServ

So identifizieren Sie sich nach dem Verbindungsaufbau bei NickServ:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Die NickServ-Identifizierung wird standardmäßig immer ausgeführt, wenn ein Passwort festgelegt ist (`enabled` muss nur zum Deaktivieren auf `false` gesetzt werden). `service` verwendet standardmäßig `NickServ`; `passwordFile` ist eine Alternative zu einem direkt angegebenen `password`.

Optionale einmalige Registrierung beim Verbindungsaufbau (`register: true` erfordert `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Deaktivieren Sie `register`, nachdem der Nick registriert wurde, um wiederholte REGISTER-Versuche zu vermeiden.

## Umgebungsvariablen

Das Standardkonto unterstützt:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (durch Kommas getrennt)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kann nicht über eine `.env`-Datei des Arbeitsbereichs festgelegt werden; siehe [`.env`-Dateien des Arbeitsbereichs](/de/gateway/security).

## Fehlerbehebung

- Wenn der Bot eine Verbindung herstellt, aber in Kanälen nie antwortet, prüfen Sie `channels.irc.groups` **und** ob die Erwähnungsschranke Nachrichten verwirft (`missing-mention`). Wenn er ohne Ping antworten soll, setzen Sie für den Kanal `requireMention:false`.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host/Port und die Zertifikatseinrichtung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsschranke
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
