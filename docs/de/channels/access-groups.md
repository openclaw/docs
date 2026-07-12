---
read_when:
    - Dieselbe Positivliste für mehrere Nachrichtenkanäle konfigurieren
    - Zugriffsregeln für Absender in Direktnachrichten und Gruppen gemeinsam verwenden
    - Überprüfung der Zugriffskontrolle für Nachrichtenkanäle
summary: Wiederverwendbare Absender-Zulassungslisten für Nachrichtenkanäle
title: Zugriffsgruppen
x-i18n:
    generated_at: "2026-07-12T01:23:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Zugriffsgruppen sind benannte Absenderlisten, die Sie einmal unter `accessGroups` definieren und in Kanal-Zulassungslisten mit `accessGroup:<name>` referenzieren.

Verwenden Sie sie, wenn dieselben Personen über mehrere Nachrichtenkanäle hinweg zugelassen werden sollen oder wenn eine vertrauenswürdige Gruppe sowohl für Direktnachrichten als auch für die Absenderautorisierung in Gruppen gelten soll.

Eine Gruppe gewährt für sich genommen keinerlei Zugriff. Sie ist nur relevant, wenn ein Zulassungslistenfeld auf sie verweist.

## Statische Gruppen von Nachrichtenabsendern

Statische Absendergruppen verwenden `type: "message.senders"`. `members` ist nach Nachrichtenkanal-ID gegliedert; zusätzlich steht `"*"` für Einträge, die für alle Kanäle gelten:

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

| Schlüssel                  | Bedeutung                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `"*"`                      | Gemeinsame Einträge, die für jeden Nachrichtenkanal geprüft werden, der die Gruppe referenziert. |
| `discord`, `telegram`, ... | Einträge, die nur beim Abgleich mit der Zulassungsliste dieses Kanals geprüft werden.      |

Einträge werden nach den normalen `allowFrom`-Regeln des Zielkanals abgeglichen. OpenClaw überträgt Absender-IDs nicht zwischen Kanälen: Wenn Alice eine Telegram-ID und eine Discord-ID hat, führen Sie beide IDs unter den jeweils passenden Kanalschlüsseln auf.

## Gruppen aus Zulassungslisten referenzieren

Referenzieren Sie eine Gruppe mit `accessGroup:<name>` überall dort, wo der Nachrichtenkanalpfad Absender-Zulassungslisten unterstützt.

Beispiel für eine Direktnachrichten-Zulassungsliste:

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

Beispiel für eine Gruppenabsender-Zulassungsliste:

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Sie können Gruppen und direkte Einträge kombinieren:

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

Zugriffsgruppen funktionieren in den gemeinsamen Autorisierungspfaden für Nachrichtenkanäle:

- Absender-Zulassungslisten für Direktnachrichten wie `channels.<channel>.allowFrom`
- Gruppenabsender-Zulassungslisten wie `channels.<channel>.groupAllowFrom`
- kanalspezifische Absender-Zulassungslisten pro Raum, die dieselben Regeln für den Absenderabgleich verwenden, beispielsweise Google Chat `groups.<space>.users`
- Befehlsautorisierungspfade, die Absender-Zulassungslisten von Nachrichtenkanälen wiederverwenden

Die Kanalunterstützung hängt davon ab, ob der jeweilige Kanal die gemeinsamen OpenClaw-Hilfsfunktionen zur Absenderautorisierung verwendet. Die derzeit gebündelte Unterstützung umfasst ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo und Zalo Personal. Statische `message.senders`-Gruppen sind kanalunabhängig. Neue Nachrichtenkanäle unterstützen sie daher, indem sie die gemeinsamen Eingangs-Hilfsfunktionen des Plugin-SDK statt einer benutzerdefinierten Erweiterung der Zulassungsliste verwenden.

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

`discord.channelAudience` bedeutet: „Discord-Absender von Direktnachrichten zulassen, die diesen Serverkanal derzeit sehen können.“ OpenClaw löst den Absender zum Autorisierungszeitpunkt über Discord auf und wendet die Discord-Berechtigungsregeln für `ViewChannel` an. `membership` ist optional und verwendet standardmäßig `canViewChannel`.

Verwenden Sie dies, wenn ein Discord-Kanal bereits die maßgebliche Datenquelle für ein Team ist, etwa `#maintainers` oder `#on-call`.

Anforderungen und Fehlerverhalten:

- Der Bot benötigt Zugriff auf den Server und den Kanal.
- Der Bot benötigt im Discord Developer Portal den **Server Members Intent**.
- Die Zugriffsgruppe verweigert den Zugriff bei Fehlern, wenn Discord `Missing Access` zurückgibt, der Absender nicht als Servermitglied aufgelöst werden kann oder der Kanal zu einem anderen Server gehört.

Weitere Discord-spezifische Beispiele: [Discord-Zugriffssteuerung](/de/channels/discord#access-control-and-routing)

## Plugin-Diagnose

Plugin-Autoren können den strukturierten Zustand von Zugriffsgruppen untersuchen, ohne ihn wieder in eine flache Zulassungsliste zu erweitern:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Das Ergebnis meldet referenzierte, übereinstimmende, fehlende, nicht unterstützte und fehlgeschlagene Gruppen. Verwenden Sie es für Diagnosen oder Konformitätstests. Verwenden Sie `expandAllowFromWithAccessGroups(...)` nur für Kompatibilitätspfade, die weiterhin ein flaches `allowFrom`-Array erwarten.

## Sicherheitshinweise

- Zugriffsgruppen sind Aliasse für Zulassungslisten, keine Rollen. Sie erstellen keine Eigentümer, genehmigen keine Kopplungsanfragen und gewähren für sich genommen keine Werkzeugberechtigungen.
- `dmPolicy: "open"` erfordert weiterhin `"*"` in der effektiven Direktnachrichten-Zulassungsliste. Das Referenzieren einer Zugriffsgruppe entspricht nicht öffentlichem Zugriff.
- Fehlende Gruppennamen verweigern den Zugriff. Wenn `allowFrom` den Eintrag `accessGroup:operators` enthält und `accessGroups.operators` fehlt, autorisiert dieser Eintrag niemanden.
- Halten Sie Kanal-IDs stabil. Bevorzugen Sie numerische IDs beziehungsweise Benutzer-IDs gegenüber Anzeigenamen, wenn der Kanal beides unterstützt.

## Fehlerbehebung

Wenn ein Absender übereinstimmen sollte, aber blockiert wird:

1. Prüfen Sie, ob das Zulassungslistenfeld die exakte Referenz `accessGroup:<name>` enthält.
2. Prüfen Sie, ob `accessGroups.<name>.type` korrekt ist.
3. Prüfen Sie, ob die Absender-ID unter dem passenden Kanalschlüssel oder unter `"*"` aufgeführt ist.
4. Prüfen Sie, ob der Eintrag die normale Zulassungslistensyntax dieses Kanals verwendet.
5. Prüfen Sie bei Discord-Kanalzielgruppen, ob der Bot den Serverkanal sehen kann und der Server Members Intent aktiviert ist.

Führen Sie nach der Bearbeitung der Zugriffssteuerungskonfiguration `openclaw doctor` aus. Der Befehl erkennt bereits vor der Laufzeit viele ungültige Kombinationen aus Zulassungslisten und Richtlinien.
