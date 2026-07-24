---
read_when:
    - Dieselbe Zulassungsliste für mehrere Nachrichtenkanäle konfigurieren
    - Zugriffsregeln für Absender in Direktnachrichten und Gruppen freigeben
    - Überprüfung der Zugriffskontrolle für Nachrichtenkanäle
summary: Wiederverwendbare Absender-Zulassungslisten für Nachrichtenkanäle
title: Zugriffsgruppen
x-i18n:
    generated_at: "2026-07-24T04:20:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Zugriffsgruppen sind benannte Absenderlisten, die Sie einmal unter `accessGroups` definieren und über `accessGroup:<name>` in Kanal-Zulassungslisten referenzieren.

Verwenden Sie sie, wenn dieselben Personen über mehrere Nachrichtenkanäle hinweg zugelassen werden sollen oder wenn eine vertrauenswürdige Gruppe sowohl für die Autorisierung von Direktnachrichten als auch von Gruppenabsendern gelten soll.

Eine Gruppe gewährt für sich genommen keinerlei Zugriff. Sie ist nur dort relevant, wo ein Zulassungslistenfeld auf sie verweist.

## Statische Gruppen von Nachrichtenabsendern

Statische Absendergruppen verwenden `type: "message.senders"`. `members` ist nach Nachrichtenkanal-ID strukturiert; hinzu kommt `"*"` für Einträge, die von allen Kanälen gemeinsam verwendet werden:

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

| Schlüssel                   | Bedeutung                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `"*"`                      | Gemeinsame Einträge, die für jeden Nachrichtenkanal geprüft werden, der die Gruppe referenziert.       |
| `discord`, `telegram`, ... | Einträge, die nur beim Abgleich mit der Zulassungsliste dieses Kanals geprüft werden.                   |

Einträge werden anhand der normalen `allowFrom`-Regeln des Zielkanals abgeglichen. OpenClaw überträgt keine Absender-IDs zwischen Kanälen: Wenn Alice eine Telegram-ID und eine Discord-ID hat, führen Sie beide IDs unter den passenden Kanalschlüsseln auf.

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
- kanalspezifische Absender-Zulassungslisten pro Raum, die dieselben Abgleichsregeln für Absender verwenden (beispielsweise Google Chat `groups.<space>.users`)
- Befehlsautorisierungspfade, die Absender-Zulassungslisten von Nachrichtenkanälen wiederverwenden

Die Kanalunterstützung hängt davon ab, ob der jeweilige Kanal die gemeinsamen OpenClaw-Hilfsfunktionen für die Absenderautorisierung verwendet. Die derzeit enthaltene Unterstützung umfasst ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo und Zalo Personal. Statische `message.senders`-Gruppen sind kanalunabhängig. Neue Nachrichtenkanäle erhalten daher Unterstützung dafür, indem sie die gemeinsamen Eingangs-Hilfsfunktionen des Plugin SDK statt einer benutzerdefinierten Erweiterung von Zulassungslisten verwenden.

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

`discord.channelAudience` bedeutet: „Discord-Direktnachrichten-Absender zulassen, die diesen Guild-Kanal derzeit sehen können.“ OpenClaw löst den Absender zum Zeitpunkt der Autorisierung über Discord auf und wendet die Discord-Berechtigungsregeln für `ViewChannel` an. `membership` ist optional und hat standardmäßig den Wert `canViewChannel`.

Verwenden Sie dies, wenn ein Discord-Kanal bereits die maßgebliche Quelle für ein Team ist, beispielsweise `#maintainers` oder `#on-call`.

Anforderungen und Fehlerverhalten:

- Der Bot benötigt Zugriff auf die Guild und den Kanal.
- Der Bot benötigt im Discord Developer Portal **Server Members Intent**.
- Die Zugriffsgruppe verweigert den Zugriff im Fehlerfall, wenn Discord `Missing Access` zurückgibt, der Absender nicht als Guild-Mitglied aufgelöst werden kann oder der Kanal zu einer anderen Guild gehört.

Weitere Discord-spezifische Beispiele: [Discord-Zugriffssteuerung](/de/channels/discord#access-control-and-routing)

## Plugin-Diagnose

Plugin-Autoren können den strukturierten Zustand von Zugriffsgruppen prüfen, ohne ihn wieder in eine flache Zulassungsliste zu erweitern:

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
- `dmPolicy: "open"` erfordert weiterhin `"*"` in der wirksamen Direktnachrichten-Zulassungsliste. Das Referenzieren einer Zugriffsgruppe ist nicht dasselbe wie öffentlicher Zugriff.
- Fehlende Gruppennamen führen zur Verweigerung des Zugriffs. Wenn `allowFrom` den Eintrag `accessGroup:operators` enthält und `accessGroups.operators` fehlt, autorisiert dieser Eintrag niemanden.
- Halten Sie Kanal-IDs stabil. Bevorzugen Sie numerische IDs beziehungsweise Benutzer-IDs gegenüber Anzeigenamen, wenn der Kanal beides unterstützt.

## Fehlerbehebung

Wenn ein Absender übereinstimmen sollte, aber blockiert wird:

1. Vergewissern Sie sich, dass das Zulassungslistenfeld die exakte Referenz `accessGroup:<name>` enthält.
2. Vergewissern Sie sich, dass `accessGroups.<name>.type` korrekt ist.
3. Vergewissern Sie sich, dass die Absender-ID unter dem passenden Kanalschlüssel oder unter `"*"` aufgeführt ist.
4. Vergewissern Sie sich, dass der Eintrag die normale Zulassungslistensyntax dieses Kanals verwendet.
5. Vergewissern Sie sich bei Discord-Kanalzielgruppen, dass der Bot den Guild-Kanal sehen kann und Server Members Intent aktiviert ist.

Führen Sie nach der Bearbeitung der Zugriffssteuerungskonfiguration `openclaw doctor` aus. Dadurch werden viele ungültige Kombinationen aus Zulassungslisten und Richtlinien bereits vor der Laufzeit erkannt.
