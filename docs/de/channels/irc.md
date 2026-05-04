---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Zulassungslisten, Gruppenrichtlinien oder Erwähnungs-Gating
summary: Einrichtung des IRC-Plugins, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten nutzen möchten.
IRC wird als gebündeltes Plugin ausgeliefert, wird aber in der Hauptkonfiguration unter `channels.irc` konfiguriert.

## Schnellstart

1. Aktivieren Sie die IRC-Konfiguration in `~/.openclaw/openclaw.json`.
2. Legen Sie mindestens Folgendes fest:

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

Bevorzugen Sie einen privaten IRC-Server für die Bot-Koordination. Wenn Sie bewusst ein öffentliches IRC-Netzwerk verwenden, gehören Libera.Chat, OFTC und Snoonet zu den gängigen Optionen. Vermeiden Sie vorhersehbare öffentliche Kanäle für Bot- oder Schwarm-Backchannel-Datenverkehr.

3. Starten Sie das Gateway bzw. starten Sie es neu:

```bash
openclaw gateway run
```

## Sicherheitsstandards

- IRC verwendet rohe TCP/TLS-Sockets außerhalb des von OpenClaw-Operatoren verwalteten Forward-Proxy-Routings. Setzen Sie in Deployments, die sämtlichen ausgehenden Datenverkehr über diesen Forward Proxy leiten müssen, `channels.irc.enabled=false`, sofern direkter IRC-Egress nicht ausdrücklich genehmigt ist.
- `channels.irc.dmPolicy` ist standardmäßig auf `"pairing"` gesetzt.
- `channels.irc.groupPolicy` ist standardmäßig auf `"allowlist"` gesetzt.
- Legen Sie bei `groupPolicy="allowlist"` `channels.irc.groups` fest, um erlaubte Kanäle zu definieren.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie Klartexttransport nicht bewusst akzeptieren.

## Zugriffskontrolle

Für IRC-Kanäle gibt es zwei separate „Gates“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot überhaupt Nachrichten aus einem Kanal akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / kanalbezogenes `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- DM-Allowlist (DM-Absenderzugriff): `channels.irc.allowFrom`
- Gruppen-Absender-Allowlist (Kanal-Absenderzugriff): `channels.irc.groupAllowFrom`
- Kanalbezogene Steuerelemente (Kanal-, Absender- und Erwähnungsregeln): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig weiterhin durch Erwähnungen begrenzt**)

Allowlist-Einträge sollten stabile Absenderidentitäten verwenden (`nick!user@host`).
Der Abgleich bloßer Nicks ist veränderlich und nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` gilt für DMs, nicht für Kanäle

Wenn Sie Protokolle wie dieses sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bedeutet das, dass der Absender für **Gruppen-/Kanal**-Nachrichten nicht zugelassen war. Beheben Sie dies entweder durch:

- Setzen von `channels.irc.groupAllowFrom` (global für alle Kanäle) oder
- Setzen kanalbezogener Absender-Allowlists: `channels.irc.groups["#channel"].allowFrom`

Beispiel (allen Personen in `#tuirc-dev` erlauben, mit dem Bot zu sprechen):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Auslösen von Antworten (Erwähnungen)

Auch wenn ein Kanal erlaubt ist (über `groupPolicy` + `groups`) und der Absender zugelassen ist, verwendet OpenClaw in Gruppenkontexten standardmäßig **Erwähnungs-Gating**.

Das bedeutet, dass Sie Protokolle wie `drop channel … (missing-mention)` sehen können, sofern die Nachricht kein Erwähnungsmuster enthält, das zum Bot passt.

Um den Bot in einem IRC-Kanal **ohne erforderliche Erwähnung** antworten zu lassen, deaktivieren Sie das Erwähnungs-Gating für diesen Kanal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Oder um **alle** IRC-Kanäle zu erlauben (keine kanalbezogene Allowlist) und trotzdem ohne Erwähnungen zu antworten:

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

Wenn Sie `allowFrom: ["*"]` in einem öffentlichen Kanal erlauben, kann jede Person den Bot prompten.
Um das Risiko zu reduzieren, schränken Sie die Tools für diesen Kanal ein.

### Dieselben Tools für alle im Kanal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### Unterschiedliche Tools pro Absender (Owner erhält mehr Befugnisse)

Verwenden Sie `toolsBySender`, um eine strengere Richtlinie auf `"*"` und eine lockerere auf Ihren Nick anzuwenden:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- `toolsBySender`-Schlüssel sollten `id:` für Werte der IRC-Absenderidentität verwenden:
  `id:eigen` oder `id:eigen!~eigen@174.127.248.171` für strengeren Abgleich.
- Legacy-Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.
- Die erste passende Absenderrichtlinie gewinnt; `"*"` ist der Wildcard-Fallback.

Weitere Informationen zu Gruppenzugriff im Vergleich zu Erwähnungs-Gating (und wie sie zusammenwirken) finden Sie unter: [/channels/groups](/de/channels/groups).

## NickServ

Um sich nach dem Verbinden bei NickServ zu identifizieren:

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

Optionale einmalige Registrierung beim Verbinden:

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

`IRC_HOST` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Fehlerbehebung

- Wenn der Bot eine Verbindung herstellt, aber nie in Kanälen antwortet, prüfen Sie `channels.irc.groups` **und**, ob Erwähnungs-Gating Nachrichten verwirft (`missing-mention`). Wenn er ohne Pings antworten soll, setzen Sie `requireMention:false` für den Kanal.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host/Port und die Zertifikatseinrichtung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
