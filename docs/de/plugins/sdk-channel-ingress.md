---
read_when:
    - Erstellen oder Migrieren eines Messaging-Kanal-Plugins
    - Ändern von Zulassungslisten für Direktnachrichten oder Gruppen, Routing-Sperren, Befehls-, Ereignis- oder Erwähnungsaktivierungsautorisierung
    - Überprüfung der Schwärzung eingehender Kanalnachrichten oder der SDK-Kompatibilitätsgrenzen
sidebarTitle: Channel Ingress
summary: Experimentelle Channel-Ingress-API für die Autorisierung eingehender Nachrichten
title: API für den Kanaleingang
x-i18n:
    generated_at: "2026-07-16T13:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel-Ingress ist die experimentelle Zugriffskontrollgrenze für eingehende
Channel-Ereignisse. Plugins sind für Plattformfakten und Seiteneffekte zuständig; der Kern ist für
generische Richtlinien zuständig: Zulassungslisten für DMs/Gruppen, DM-Einträge im Pairing-Speicher, Routen-Gates,
Befehls-Gates, Ereignisautorisierung, Erwähnungsaktivierung, redigierte Diagnosen und
Zulassung.

Verwenden Sie `openclaw/plugin-sdk/channel-ingress-runtime` für Empfangspfade.

## Runtime-Resolver

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Berechnen Sie effektive Zulassungslisten, Befehlseigentümer oder Befehlsgruppen nicht vorab.
Der Resolver leitet sie aus unverarbeiteten Zulassungslisten, Speicher-Callbacks, Routen-
Deskriptoren, Zugriffsgruppen, Richtlinien und der Konversationsart ab.

## Ergebnis

Gebündelte Plugins sollten moderne Projektionen direkt verwenden:

| Feld              | Bedeutung                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | geordnete Gate-Entscheidung und Zulassung                                |
| `senderAccess`     | nur Absender-/Konversationsautorisierung                             |
| `routeAccess`      | Routen- und Routenabsenderprojektion                                  |
| `commandAccess`    | Befehlsautorisierung; `requested: false`, wenn kein Befehls-Gate ausgeführt wurde |
| `activationAccess` | Ergebnis der Erwähnung/Aktivierung                                          |

Die Ereignisautorisierung bleibt im geordneten `ingress.graph` und im
entscheidenden `ingress.reasonCode` verfügbar; es wird keine separate Ereignisprojektion ausgegeben.

Veraltete SDK-Hilfsfunktionen von Drittanbietern dürfen ältere Strukturen intern wiederherstellen. Neue
gebündelte Empfangspfade sollten moderne Ergebnisse nicht wieder in lokale
DTOs umwandeln.

## Zugriffsgruppen

`accessGroup:<name>`-Einträge bleiben redigiert. Der Kern löst statische
`message.senders`-Gruppen selbst auf und ruft `resolveAccessGroupMembership` nur
für dynamische Gruppen auf, die eine Plattformabfrage erfordern. Fehlende, nicht unterstützte und
fehlgeschlagene Gruppen werden standardmäßig abgelehnt.

## Ereignismodi

| `authMode`       | Bedeutung                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normale Gates für eingehende Absender                      |
| `command`        | Befehls-Gates für Callbacks oder bereichsgebundene Schaltflächen    |
| `origin-subject` | der Akteur muss dem Subjekt der ursprünglichen Nachricht entsprechen    |
| `route-only`     | nur Routen-Gates für routenbezogene vertrauenswürdige Ereignisse |
| `none`           | Plugin-eigene interne Ereignisse umgehen die gemeinsame Autorisierung  |

Verwenden Sie `mayPair: false` für Reaktionen, Schaltflächen, Callbacks und native Befehle.

## Routen und Aktivierung

Verwenden Sie Routendeskriptoren für Richtlinien zu Räumen, Themen, Guilds, Threads oder verschachtelten Routen:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Verwenden Sie `channelIngressRoutes(...)`, wenn ein Plugin mehrere optionale Routen-
Deskriptoren besitzt; es filtert deaktivierte Zweige heraus, während Routenfakten generisch
und nach dem `precedence` jedes Deskriptors geordnet bleiben.

Das Erwähnungs-Gating ist ein Aktivierungs-Gate. Eine fehlende Erwähnung gibt
`admission: "skip"` zurück, damit der Turn-Kernel keinen Turn verarbeitet, der nur der Beobachtung dient.
Bei den meisten Channels sollte die Aktivierung nach den Absender- und Befehls-Gates erfolgen. Öffentliche
Chat-Oberflächen, die nicht erwähnten Datenverkehr vor Meldungen der Absender-Zulassungsliste
unterdrücken müssen, können `activation.order: "before-sender"` verwenden, wenn die
Umgehung durch Textbefehle deaktiviert ist. Channels mit impliziter Aktivierung, etwa Antworten in Bot-
Threads, können `activation.allowedImplicitMentionKinds` übergeben; das projizierte
`activationAccess.shouldBypassMention` gibt dann an, wann ein Befehl oder eine implizite
Aktivierung eine explizite Erwähnung umgangen hat.

## Redigierung

Unverarbeitete Absenderwerte und unverarbeitete Zulassungslisteneinträge dienen nur als Resolver-Eingaben. Sie
dürfen nicht in aufgelöstem Zustand, Entscheidungen, Diagnosen, Snapshots oder
Kompatibilitätsfakten erscheinen. Verwenden Sie opake Subjekt-IDs, Eintrags-IDs, Routen-IDs und
Diagnose-IDs.

## Verifizierung

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
