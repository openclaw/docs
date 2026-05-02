---
read_when:
    - Dieselbe Allowlist für mehrere Nachrichtenkanäle konfigurieren
    - Zugriffsregeln für Absender beim Teilen von DMs und Gruppen
    - Überprüfung der Zugriffskontrolle für Nachrichtenkanäle
summary: Wiederverwendbare Absender-Allowlists für Nachrichtenkanäle
title: Zugriffsgruppen
x-i18n:
    generated_at: "2026-05-02T06:26:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Zugriffsgruppen sind benannte Absenderlisten, die Sie einmal definieren und über `accessGroup:<name>` aus Kanal-Allowlists referenzieren.

Verwenden Sie sie, wenn dieselben Personen über mehrere Nachrichtenkanäle hinweg zugelassen sein sollen oder wenn eine vertrauenswürdige Gruppe sowohl für DMs als auch für die Absenderautorisierung in Gruppen gelten soll.

Zugriffsgruppen gewähren für sich allein keinen Zugriff. Eine Gruppe ist nur relevant, wenn ein Allowlist-Feld sie referenziert.

## Statische Nachrichten-Absendergruppen

Statische Absendergruppen verwenden `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Mitgliederlisten werden nach Nachrichtenkanal-ID geschlüsselt:

| Schlüssel  | Bedeutung                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| `"*"`      | Gemeinsame Einträge, die für jeden Nachrichtenkanal geprüft werden, der die Gruppe referenziert. |
| `discord`  | Einträge, die nur für Discord-Allowlist-Abgleiche geprüft werden.          |
| `telegram` | Einträge, die nur für Telegram-Allowlist-Abgleiche geprüft werden.         |
| `whatsapp` | Einträge, die nur für WhatsApp-Allowlist-Abgleiche geprüft werden.         |

Einträge werden mit den normalen `allowFrom`-Regeln des Zielkanals abgeglichen. OpenClaw übersetzt keine Absender-IDs zwischen Kanälen. Wenn Alice eine Telegram-ID und eine Discord-ID hat, führen Sie beide IDs unter den passenden Schlüsseln auf.

## Gruppen aus Allowlists referenzieren

Referenzieren Sie eine Gruppe mit `accessGroup:<name>` überall dort, wo der Nachrichtenkanalpfad Absender-Allowlists unterstützt.

Beispiel für eine DM-Allowlist:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Beispiel für eine Gruppen-Absender-Allowlist:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Sie können Gruppen und direkte Einträge mischen:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Unterstützte Nachrichtenkanalpfade

Zugriffsgruppen sind in gemeinsamen Autorisierungspfaden für Nachrichtenkanäle verfügbar, darunter:

- DM-Absender-Allowlists wie `channels.<channel>.allowFrom`
- Gruppen-Absender-Allowlists wie `channels.<channel>.groupAllowFrom`
- kanalspezifische Absender-Allowlists pro Raum, die dieselben Abgleichsregeln für Absender verwenden
- Befehlsautorisierungspfade, die Absender-Allowlists von Nachrichtenkanälen wiederverwenden

Die Kanalunterstützung hängt davon ab, ob dieser Kanal über die gemeinsamen OpenClaw-Hilfsfunktionen zur Absenderautorisierung angebunden ist. Die aktuelle gebündelte Unterstützung umfasst Discord, Google Chat, Nostr, WhatsApp, Zalo und Zalo Personal. Statische `message.senders`-Gruppen sind kanalunabhängig ausgelegt. Neue Nachrichtenkanäle sollten sie daher unterstützen, indem sie die gemeinsamen Hilfsfunktionen des Plugin-SDK statt einer eigenen Allowlist-Erweiterung verwenden.

## Discord-Kanalzielgruppen

Discord unterstützt außerdem einen dynamischen Zugriffsgruppentyp:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` bedeutet: „Discord-DM-Absender zulassen, die diesen Guild-Kanal derzeit sehen können.“ OpenClaw löst den Absender zum Autorisierungszeitpunkt über Discord auf und wendet die Discord-`ViewChannel`-Berechtigungsregeln an.

Verwenden Sie dies, wenn ein Discord-Kanal bereits die maßgebliche Quelle für ein Team ist, etwa `#maintainers` oder `#on-call`.

Anforderungen und Fehlerverhalten:

- Der Bot benötigt Zugriff auf die Guild und den Kanal.
- Der Bot benötigt im Discord Developer Portal den **Server Members Intent**.
- Die Zugriffsgruppe schlägt geschlossen fehl, wenn Discord `Missing Access` zurückgibt, der Absender nicht als Guild-Mitglied aufgelöst werden kann oder der Kanal zu einer anderen Guild gehört.

Weitere Discord-spezifische Beispiele: [Discord-Zugriffskontrolle](/de/channels/discord#access-control-and-routing)

## Sicherheitshinweise

- Zugriffsgruppen sind Allowlist-Aliase, keine Rollen. Sie erstellen für sich allein keine Owner, genehmigen keine Kopplungsanfragen und gewähren keine Tool-Berechtigungen.
- `dmPolicy: "open"` erfordert weiterhin `"*"` in der effektiven DM-Allowlist. Das Referenzieren einer Zugriffsgruppe ist nicht dasselbe wie öffentlicher Zugriff.
- Fehlende Gruppennamen schlagen geschlossen fehl. Wenn `allowFrom` `accessGroup:operators` enthält und `accessGroups.operators` fehlt, autorisiert dieser Eintrag niemanden.
- Halten Sie Kanal-IDs stabil. Bevorzugen Sie numerische IDs oder Benutzer-IDs gegenüber Anzeigenamen, wenn der Kanal beides unterstützt.

## Fehlerbehebung

Wenn ein Absender übereinstimmen sollte, aber blockiert wird:

1. Bestätigen Sie, dass das Allowlist-Feld die exakte Referenz `accessGroup:<name>` enthält.
2. Bestätigen Sie, dass `accessGroups.<name>.type` korrekt ist.
3. Bestätigen Sie, dass die Absender-ID unter dem passenden Kanalschlüssel oder unter `"*"` aufgeführt ist.
4. Bestätigen Sie, dass der Eintrag die normale Allowlist-Syntax dieses Kanals verwendet.
5. Bestätigen Sie bei Discord-Kanalzielgruppen, dass der Bot den Guild-Kanal sehen kann und Server Members Intent aktiviert ist.

Führen Sie nach dem Bearbeiten der Zugriffskontrollkonfiguration `openclaw doctor` aus. Der Befehl erkennt viele ungültige Kombinationen aus Allowlists und Richtlinien vor der Laufzeit.
