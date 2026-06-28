---
read_when:
    - Dieselbe Allowlist für mehrere Nachrichtenkanäle konfigurieren
    - Zugriffsregeln für das Teilen von DM- und Gruppensendern
    - Überprüfung der Zugriffskontrolle für Nachrichtenkanäle
summary: Wiederverwendbare Absender-Allowlists für Nachrichtenkanäle
title: Zugriffsgruppen
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Zugriffsgruppen sind benannte Absenderlisten, die Sie einmal definieren und aus Kanal-Allowlists mit `accessGroup:<name>` referenzieren.

Verwenden Sie sie, wenn dieselben Personen über mehrere Nachrichtenkanäle hinweg zugelassen werden sollen oder wenn eine vertrauenswürdige Gruppe sowohl für DMs als auch für die Autorisierung von Gruppenabsendern gelten soll.

Zugriffsgruppen gewähren für sich genommen keinen Zugriff. Eine Gruppe ist nur relevant, wenn ein Allowlist-Feld sie referenziert.

## Statische Gruppen von Nachrichtenabsendern

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

Mitgliederlisten sind nach Nachrichtenkanal-ID verschlüsselt:

| Schlüssel  | Bedeutung                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| `"*"`      | Gemeinsame Einträge, die für jeden Nachrichtenkanal geprüft werden, der die Gruppe referenziert. |
| `discord`  | Einträge, die nur für den Discord-Allowlist-Abgleich geprüft werden.             |
| `telegram` | Einträge, die nur für den Telegram-Allowlist-Abgleich geprüft werden.            |
| `whatsapp` | Einträge, die nur für den WhatsApp-Allowlist-Abgleich geprüft werden.            |

Einträge werden mit den normalen `allowFrom`-Regeln des Zielkanals abgeglichen. OpenClaw übersetzt Absender-IDs nicht zwischen Kanälen. Wenn Alice eine Telegram-ID und eine Discord-ID hat, listen Sie beide IDs unter den passenden Schlüsseln auf.

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

Beispiel für eine Allowlist von Gruppenabsendern:

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

Zugriffsgruppen sind in gemeinsamen Autorisierungspfaden für Nachrichtenkanäle verfügbar, einschließlich:

- DM-Absender-Allowlists wie `channels.<channel>.allowFrom`
- Gruppenabsender-Allowlists wie `channels.<channel>.groupAllowFrom`
- kanalspezifische Absender-Allowlists pro Raum, die dieselben Abgleichsregeln für Absender verwenden
- Befehlsautorisierungspfade, die Absender-Allowlists von Nachrichtenkanälen wiederverwenden

Die Kanalunterstützung hängt davon ab, ob dieser Kanal über die gemeinsamen OpenClaw-Hilfsfunktionen für Absenderautorisierung angebunden ist. Die aktuelle gebündelte Unterstützung umfasst Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo und Zalo Personal. Statische `message.senders`-Gruppen sind kanalagnostisch ausgelegt, daher sollten neue Nachrichtenkanäle sie unterstützen, indem sie die gemeinsamen Plugin-SDK-Hilfsfunktionen anstelle einer eigenen Allowlist-Erweiterung verwenden.

## Plugin-Diagnose

Plugin-Autoren können den strukturierten Zugriffsgruppenstatus prüfen, ohne ihn wieder zu einer flachen Allowlist zu erweitern:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Das Ergebnis meldet referenzierte, übereinstimmende, fehlende, nicht unterstützte und fehlgeschlagene Gruppen. Verwenden Sie dies, wenn Sie Diagnosen oder Konformitätstests benötigen. Verwenden Sie `expandAllowFromWithAccessGroups(...)` nur für Kompatibilitätspfade, die noch ein flaches `allowFrom`-Array erwarten.

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

`discord.channelAudience` bedeutet „Discord-DM-Absender zulassen, die diesen Guild-Kanal aktuell sehen können.“ OpenClaw löst den Absender zum Autorisierungszeitpunkt über Discord auf und wendet die Discord-Berechtigungsregeln für `ViewChannel` an.

Verwenden Sie dies, wenn ein Discord-Kanal bereits die maßgebliche Quelle für ein Team ist, etwa `#maintainers` oder `#on-call`.

Anforderungen und Fehlerverhalten:

- Der Bot benötigt Zugriff auf die Guild und den Kanal.
- Der Bot benötigt im Discord Developer Portal den **Server Members Intent**.
- Die Zugriffsgruppe schlägt geschlossen fehl, wenn Discord `Missing Access` zurückgibt, der Absender nicht als Guild-Mitglied aufgelöst werden kann oder der Kanal zu einer anderen Guild gehört.

Weitere Discord-spezifische Beispiele: [Discord-Zugriffskontrolle](/de/channels/discord#access-control-and-routing)

## Sicherheitshinweise

- Zugriffsgruppen sind Allowlist-Aliasse, keine Rollen. Sie erstellen keine Besitzer, genehmigen keine Kopplungsanfragen und gewähren für sich genommen keine Tool-Berechtigungen.
- `dmPolicy: "open"` erfordert weiterhin `"*"` in der effektiven DM-Allowlist. Eine Zugriffsgruppe zu referenzieren ist nicht dasselbe wie öffentlicher Zugriff.
- Fehlende Gruppennamen schlagen geschlossen fehl. Wenn `allowFrom` `accessGroup:operators` enthält und `accessGroups.operators` fehlt, autorisiert dieser Eintrag niemanden.
- Halten Sie Kanal-IDs stabil. Bevorzugen Sie numerische IDs oder Benutzer-IDs gegenüber Anzeigenamen, wenn der Kanal beides unterstützt.

## Problembehandlung

Wenn ein Absender übereinstimmen sollte, aber blockiert wird:

1. Bestätigen Sie, dass das Allowlist-Feld die exakte `accessGroup:<name>`-Referenz enthält.
2. Bestätigen Sie, dass `accessGroups.<name>.type` korrekt ist.
3. Bestätigen Sie, dass die Absender-ID unter dem passenden Kanalschlüssel oder unter `"*"` aufgeführt ist.
4. Bestätigen Sie, dass der Eintrag die normale Allowlist-Syntax dieses Kanals verwendet.
5. Bestätigen Sie bei Discord-Kanalzielgruppen, dass der Bot den Guild-Kanal sehen kann und Server Members Intent aktiviert ist.

Führen Sie `openclaw doctor` aus, nachdem Sie die Zugriffskontrollkonfiguration bearbeitet haben. Es erkennt viele ungültige Allowlist- und Richtlinienkombinationen vor der Laufzeit.
