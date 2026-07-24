---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Zulassungslisten, Gruppenrichtlinien oder die Erwähnungssteuerung
summary: Einrichtung des IRC-Plugins, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-07-24T04:47:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85c3da80b45d6611872ddbd10b3be4a5742b46e355e8bb554353a478f2a1702f
    source_path: channels/irc.md
    workflow: 16
---

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Channels (`#room`) und Direktnachrichten einsetzen möchten.
Installieren Sie das offizielle IRC-Plugin und konfigurieren Sie es anschließend unter `channels.irc`.

## Schnellstart

1. Installieren Sie das Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Legen Sie in `~/.openclaw/openclaw.json` mindestens Host, Nick und die Channels fest, denen beigetreten werden soll:

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

3. Starten Sie das Gateway bzw. starten Sie es neu:

```bash
openclaw gateway run
```

Bevorzugen Sie für die Bot-Koordination einen privaten IRC-Server. Wenn Sie bewusst ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie leicht vorhersehbare öffentliche Channels für den Backchannel-Datenverkehr von Bots oder Schwärmen.

## Dauerhaftigkeit eingehender Nachrichten

OpenClaw schreibt jedes akzeptierte IRC-`PRIVMSG` vor den regulären Richtlinienprüfungen und der Agent-Weiterleitung in seine dauerhafte Eingangswarteschlange. Ausstehende oder erneut zustellbare Nachrichten überstehen einen Neustart des Gateways und bleiben pro Channel oder Direktnachrichten-Gegenstelle serialisiert.

IRC stellt keine erneut abrufbare Zustellungs-ID bereit und sendet keine Nachrichten erneut, die ein nicht verbundener Client verpasst hat. OpenClaw weist daher eine lokale ID zu, die nur innerhalb der aktuellen TCP-Verbindung stabil ist. Die Warteschlange schützt das lokale Zeitfenster zwischen Annahme und Weiterleitung; sie kann weder eine Nachricht wiederherstellen, die OpenClaw nie erreicht hat, noch eine erneute Serverzustellung über mehrere Verbindungen hinweg deduplizieren.

## Verbindungseinstellungen

| Schlüssel                     | Standardwert                  | Hinweise                                                    |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | keiner (erforderlich)         | Hostname des IRC-Servers                                    |
| `port`                        | `6697` mit TLS, `6667` unverschlüsselt | 1-65535                                                     |
| `tls`                         | `true`                        | Legen Sie `false` nur bei bewusst gewähltem Klartext fest |
| `nick`                        | keiner (erforderlich)         | Bot-Nick                                                    |
| `username`                    | Nick, andernfalls `openclaw` | IRC-Benutzername                                            |
| `realname`                    | `OpenClaw`                    | Realname-/GECOS-Feld                                        |
| `password` / `passwordFile`   | keiner                        | Serverpasswort; die Datei muss eine reguläre Datei sein     |
| `channels`                    | keiner                        | Channels, denen beigetreten werden soll (`["#openclaw"]`) |
| `accounts` / `defaultAccount` | keiner                        | Mehrkonteneinrichtung; Umgebungsvariablen befüllen nur das Standardkonto |

## Sicherheitsstandards

- IRC verwendet direkte TCP-/TLS-Sockets außerhalb des vom OpenClaw-Betreiber verwalteten Forward-Proxy-Routings. Legen Sie in Bereitstellungen, die sämtlichen ausgehenden Datenverkehr über diesen Forward-Proxy leiten müssen, `channels.irc.enabled=false` fest, sofern direkter ausgehender IRC-Datenverkehr nicht ausdrücklich genehmigt ist.
- `channels.irc.dmPolicy` hat standardmäßig den Wert `"pairing"`: Unbekannte Absender von Direktnachrichten erhalten einen Kopplungscode, den Sie mit `openclaw pairing approve irc <code>` genehmigen.
- `channels.irc.groupPolicy` hat standardmäßig den Wert `"allowlist"`.
- Legen Sie bei `groupPolicy="allowlist"` mit `channels.irc.groups` die zulässigen Channels fest.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht bewusst eine Klartextübertragung akzeptieren.

## Zugriffskontrolle

Für IRC-Channels gibt es zwei separate „Zugriffsschranken“:

1. **Channel-Zugriff** (`groupPolicy` + `groups`): ob der Bot Nachrichten aus einem Channel überhaupt akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / channelspezifisch `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Channels auslösen darf.

Konfigurationsschlüssel:

- Zulassungsliste für Direktnachrichten (Absenderzugriff bei Direktnachrichten): `channels.irc.allowFrom`
- Zulassungsliste für Gruppenabsender (Absenderzugriff im Channel): `channels.irc.groupAllowFrom`
- Channelspezifische Steuerung (Channel-, Absender- und Erwähnungsregeln): `channels.irc.groups["#channel"]` mit `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` und `systemPrompt`
- `channels.irc.groupPolicy="open"` lässt nicht konfigurierte Channels zu (**standardmäßig weiterhin nur bei Erwähnung**)

Einträge in Zulassungslisten sollten stabile Absenderidentitäten verwenden (`nick!user@host`).
Der Abgleich ausschließlich anhand des Nicks ist veränderlich und nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true`.

### Häufiger Stolperstein: `allowFrom` gilt für Direktnachrichten, nicht für Channels

Wenn Protokolle wie das folgende angezeigt werden:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bedeutet dies, dass der Absender für **Gruppen-/Channel-Nachrichten** nicht zugelassen war. Beheben Sie dies durch eine der folgenden Maßnahmen:

- Legen Sie `channels.irc.groupAllowFrom` fest (global für alle Channels), oder
- legen Sie channelspezifische Absender-Zulassungslisten fest: `channels.irc.groups["#channel"].allowFrom`

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

Selbst wenn ein Channel zugelassen ist (über `groupPolicy` + `groups`) und der Absender zugelassen ist, reagiert OpenClaw in Gruppenkontexten standardmäßig **nur bei Erwähnung**. Der Bot gilt als erwähnt, wenn die Nachricht den Nick des verbundenen Bots enthält oder mit Ihren konfigurierten Erwähnungsmustern übereinstimmt.

Daher können Protokolle wie `drop channel … (missing-mention)` angezeigt werden, sofern die Nachricht kein mit dem Bot übereinstimmendes Erwähnungsmuster enthält.

Damit der Bot in einem IRC-Channel **ohne erforderliche Erwähnung** antwortet, deaktivieren Sie die Erwähnungsschranke für diesen Channel:

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

Oder um **alle** IRC-Channels zuzulassen (ohne channelspezifische Zulassungsliste) und weiterhin ohne Erwähnungen zu antworten:

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

## Sicherheitshinweis (für öffentliche Channels empfohlen)

Wenn Sie `allowFrom: ["*"]` in einem öffentlichen Channel zulassen, kann jede Person dem Bot Prompts senden.
Schränken Sie zur Risikominderung die Tools für diesen Channel ein.

### Gleiche Tools für alle Personen im Channel

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

### Unterschiedliche Tools je Absender (der Eigentümer erhält mehr Berechtigungen)

Verwenden Sie `toolsBySender`, um auf `"*"` eine strengere Richtlinie und auf Ihren Nick eine weniger strenge Richtlinie anzuwenden:

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

- Schlüssel für `toolsBySender` sollten explizite Präfixe verwenden (`channel:`, `id:`, `e164:`, `username:`, `name:`). Verwenden Sie für IRC `id:` mit dem Wert der Absenderidentität: `id:alice` oder für einen stärkeren Abgleich `id:alice!~alice@203.0.113.7`.
- Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert, ausschließlich als `id:` abgeglichen und lösen eine Veraltungswarnung aus.
- Die erste übereinstimmende Absenderrichtlinie hat Vorrang; `"*"` dient als Platzhalter-Rückfalloption.

Weitere Informationen zum Gruppenzugriff im Vergleich zur Erwähnungsschranke (und zu ihrem Zusammenspiel) finden Sie unter: [/channels/groups](/de/channels/groups).

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

Die NickServ-Identifizierung wird standardmäßig ausgeführt, sobald ein Passwort festgelegt ist (`enabled` muss nur auf `false` gesetzt werden, um sie zu deaktivieren). `service` hat standardmäßig den Wert `NickServ`; `passwordFile` ist eine Alternative zum direkt angegebenen `password`.

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
- `IRC_CHANNELS` (kommagetrennt)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kann nicht über eine Workspace-`.env` festgelegt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Fehlerbehebung

- Wenn der Bot eine Verbindung herstellt, aber in Channels nie antwortet, überprüfen Sie `channels.irc.groups` **und**, ob die Erwähnungsschranke Nachrichten verwirft (`missing-mention`). Wenn er ohne Ping antworten soll, legen Sie für den Channel `requireMention:false` fest.
- Wenn die Anmeldung fehlschlägt, überprüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, überprüfen Sie Host, Port und Zertifikatseinrichtung.

## Verwandte Themen

- [Channel-Übersicht](/de/channels) — alle unterstützten Channels
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsschranke
- [Channel-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
