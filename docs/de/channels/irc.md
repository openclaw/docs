---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Zulassungslisten, Gruppenrichtlinien oder die Erwähnungssteuerung
summary: Einrichtung des IRC-Plugins, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-07-12T01:22:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten nutzen möchten.
Installieren Sie das offizielle IRC-Plugin und konfigurieren Sie es anschließend unter `channels.irc`.

## Schnellstart

1. Installieren Sie das Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Legen Sie in `~/.openclaw/openclaw.json` mindestens Host, Nick und die beizutretenden Kanäle fest:

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

3. Starten Sie den Gateway oder starten Sie ihn neu:

```bash
openclaw gateway run
```

Bevorzugen Sie für die Bot-Koordination einen privaten IRC-Server. Wenn Sie bewusst ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie leicht vorhersehbare öffentliche Kanäle für den Hintergrundverkehr von Bots oder Schwärmen.

## Verbindungseinstellungen

| Schlüssel                     | Standardwert                  | Hinweise                                                    |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | keiner (erforderlich)         | Hostname des IRC-Servers                                    |
| `port`                        | `6697` mit TLS, `6667` unverschlüsselt | 1–65535                                            |
| `tls`                         | `true`                        | Nur für bewusst gewählten Klartexttransport auf `false` setzen |
| `nick`                        | keiner (erforderlich)         | Nick des Bots                                               |
| `username`                    | Nick, andernfalls `openclaw`  | IRC-Benutzername                                            |
| `realname`                    | `OpenClaw`                    | Realname-/GECOS-Feld                                        |
| `password` / `passwordFile`   | keiner                        | Serverpasswort; die Datei muss eine reguläre Datei sein     |
| `channels`                    | keine                         | Beizutretende Kanäle (`["#openclaw"]`)                      |
| `accounts` / `defaultAccount` | keine                         | Einrichtung mehrerer Konten; Umgebungsvariablen ergänzen nur das Standardkonto |

## Sicherheitsvorgaben

- IRC verwendet rohe TCP-/TLS-Sockets außerhalb des vom OpenClaw-Betreiber verwalteten Forward-Proxy-Routings. Setzen Sie in Bereitstellungen, die sämtlichen ausgehenden Datenverkehr durch diesen Forward-Proxy leiten müssen, `channels.irc.enabled=false`, sofern direkter ausgehender IRC-Datenverkehr nicht ausdrücklich genehmigt wurde.
- `channels.irc.dmPolicy` ist standardmäßig `"pairing"`: Unbekannte Absender von Direktnachrichten erhalten einen Kopplungscode, den Sie mit `openclaw pairing approve irc <code>` genehmigen.
- `channels.irc.groupPolicy` ist standardmäßig `"allowlist"`.
- Legen Sie bei `groupPolicy="allowlist"` mit `channels.irc.groups` die zulässigen Kanäle fest.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht bewusst Klartexttransport akzeptieren.

## Zugriffssteuerung

Für IRC-Kanäle gibt es zwei getrennte „Schranken“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot überhaupt Nachrichten aus einem Kanal akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / kanalspezifisches `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- Zulassungsliste für Direktnachrichten (Absenderzugriff für Direktnachrichten): `channels.irc.allowFrom`
- Zulassungsliste für Gruppenabsender (Absenderzugriff in Kanälen): `channels.irc.groupAllowFrom`
- Kanalspezifische Steuerung (Kanal-, Absender- und Erwähnungsregeln): `channels.irc.groups["#channel"]` mit `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` und `systemPrompt`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig ist weiterhin eine Erwähnung erforderlich**)

Einträge in Zulassungslisten sollten stabile Absenderidentitäten (`nick!user@host`) verwenden.
Der Abgleich nur anhand des Nicks ist veränderlich und wird ausschließlich aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` gilt für Direktnachrichten, nicht für Kanäle

Wenn Sie Protokolleinträge wie diesen sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bedeutet dies, dass der Absender für **Gruppen-/Kanalnachrichten** nicht zugelassen war. Beheben Sie dies auf eine der folgenden Arten:

- Legen Sie `channels.irc.groupAllowFrom` fest (global für alle Kanäle), oder
- legen Sie kanalspezifische Absender-Zulassungslisten fest: `channels.irc.groups["#channel"].allowFrom`

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

Selbst wenn ein Kanal zulässig ist (über `groupPolicy` + `groups`) und der Absender zugelassen ist, verlangt OpenClaw in Gruppenkontexten standardmäßig eine **Erwähnung**. Der Bot gilt als erwähnt, wenn die Nachricht den verbundenen Bot-Nick enthält oder Ihren konfigurierten Erwähnungsmustern entspricht.

Daher können Protokolleinträge wie `drop channel … (missing-mention)` erscheinen, sofern die Nachricht kein Erwähnungsmuster enthält, das zum Bot passt.

Damit der Bot in einem IRC-Kanal **ohne erforderliche Erwähnung** antwortet, deaktivieren Sie die Erwähnungspflicht für diesen Kanal:

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

Oder erlauben Sie **alle** IRC-Kanäle (ohne kanalspezifische Zulassungsliste) und lassen Sie den Bot dennoch ohne Erwähnungen antworten:

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

Wenn Sie `allowFrom: ["*"]` in einem öffentlichen Kanal zulassen, kann jede Person dem Bot Prompts senden.
Beschränken Sie zur Risikoreduzierung die Werkzeuge für diesen Kanal.

### Gleiche Werkzeuge für alle Personen im Kanal

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

### Unterschiedliche Werkzeuge je Absender (Eigentümer erhält mehr Berechtigungen)

Verwenden Sie `toolsBySender`, um für `"*"` eine strengere Richtlinie und für Ihren Nick eine weniger strenge Richtlinie anzuwenden:

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

- Schlüssel in `toolsBySender` sollten explizite Präfixe verwenden (`channel:`, `id:`, `e164:`, `username:`, `name:`). Verwenden Sie für IRC `id:` mit dem Wert der Absenderidentität: `id:alice` oder für einen zuverlässigeren Abgleich `id:alice!~alice@203.0.113.7`.
- Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, ausschließlich wie `id:` abgeglichen und lösen eine Warnung zur bevorstehenden Entfernung aus.
- Die erste passende Absenderrichtlinie hat Vorrang; `"*"` dient als Platzhalter-Ausweichregel.

Weitere Informationen zum Gruppenzugriff im Vergleich zur Erwähnungspflicht und zu deren Zusammenspiel finden Sie unter: [/channels/groups](/de/channels/groups).

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

Die NickServ-Identifizierung wird standardmäßig bei jedem gesetzten Passwort ausgeführt (`enabled` muss nur zum Deaktivieren auf `false` gesetzt werden). `service` ist standardmäßig `NickServ`; `passwordFile` ist eine Alternative zum direkt angegebenen `password`.

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

`IRC_HOST` kann nicht über eine `.env`-Datei im Arbeitsbereich festgelegt werden; siehe [`.env`-Dateien im Arbeitsbereich](/de/gateway/security).

## Fehlerbehebung

- Wenn der Bot eine Verbindung herstellt, aber in Kanälen nie antwortet, prüfen Sie `channels.irc.groups` **und**, ob die Erwähnungspflicht Nachrichten verwirft (`missing-mention`). Wenn er ohne direkte Ansprache antworten soll, legen Sie für den Kanal `requireMention:false` fest.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host, Port und die Zertifikatskonfiguration.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungspflicht
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
