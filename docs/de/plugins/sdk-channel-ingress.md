---
read_when:
    - Erstellen oder Migrieren eines Plugins für einen Messaging-Kanal
    - Ändern von Zulassungslisten für Direktnachrichten oder Gruppen, Routing-Sperren, Befehlsautorisierung, Ereignisautorisierung oder Erwähnungsaktivierung
    - Überprüfung der Schwärzung beim Kanaleingang oder der SDK-Kompatibilitätsgrenzen
sidebarTitle: Channel Ingress
summary: Experimentelle Channel-Ingress-API zur Autorisierung eingehender Nachrichten
title: Kanal-Eingangs-API
x-i18n:
    generated_at: "2026-07-24T04:01:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel-Ingress ist die experimentelle Zugriffssteuerungsgrenze für eingehende
Channel-Ereignisse. Plugins verwalten plattformspezifische Fakten und Seiteneffekte; der Core verwaltet
generische Richtlinien: Zulassungslisten für DMs/Gruppen, DM-Einträge im Pairing-Speicher, Route-Gates,
Command-Gates, Ereignisautorisierung, Aktivierung durch Erwähnungen, geschwärzte Diagnosen und
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

Berechnen Sie effektive Zulassungslisten, Command-Eigentümer oder Command-Gruppen nicht vorab.
Der Resolver leitet sie aus unverarbeiteten Zulassungslisten, Speicher-Callbacks, Route-
Deskriptoren, Zugriffsgruppen, Richtlinien und der Konversationsart ab.

## Ergebnis

Gebündelte Plugins sollten moderne Projektionen direkt verwenden:

| Feld               | Bedeutung                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | geordnete Gate-Entscheidung und Zulassung                          |
| `senderAccess`     | nur Autorisierung von Absender und Konversation                    |
| `routeAccess`      | Projektion von Route und Route-Absender                            |
| `commandAccess`    | Command-Autorisierung; `requested: false`, wenn kein Command-Gate ausgeführt wurde |
| `activationAccess` | Ergebnis der Erwähnung/Aktivierung                                 |

Die Ereignisautorisierung bleibt im geordneten `ingress.graph` und im
entscheidenden `ingress.reasonCode` verfügbar; es wird keine separate Ereignisprojektion ausgegeben.

Veraltete SDK-Hilfsfunktionen von Drittanbietern können ältere Strukturen intern rekonstruieren. Neue
gebündelte Empfangspfade sollten moderne Ergebnisse nicht zurück in lokale
DTOs übersetzen.

## Zugriffsgruppen

`accessGroup:<name>`-Einträge bleiben geschwärzt. Der Core löst statische
`message.senders`-Gruppen selbst auf und ruft `resolveAccessGroupMembership` nur
für dynamische Gruppen auf, die eine Plattformabfrage erfordern. Fehlende, nicht unterstützte und
fehlgeschlagene Gruppen werden standardmäßig abgelehnt.

## Ereignismodi

| `authMode`       | Bedeutung                                        |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normale Gates für eingehende Absender            |
| `command`        | Command-Gates für Callbacks oder bereichsgebundene Schaltflächen |
| `origin-subject` | Akteur muss dem Subjekt der ursprünglichen Nachricht entsprechen |
| `route-only`     | nur Route-Gates für vertrauenswürdige, routenbezogene Ereignisse |
| `none`           | Plugin-eigene interne Ereignisse umgehen die gemeinsame Autorisierung |

Verwenden Sie `mayPair: false` für Reaktionen, Schaltflächen, Callbacks und native Commands.

## Routen und Aktivierung

Verwenden Sie Route-Deskriptoren für Raum-, Themen-, Guild-, Thread- oder verschachtelte Route-Richtlinien:

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

Verwenden Sie `channelIngressRoutes(...)`, wenn ein Plugin mehrere optionale Route-
Deskriptoren besitzt; dies filtert deaktivierte Zweige heraus, während Route-Fakten generisch
und nach dem `precedence` jedes Deskriptors geordnet bleiben.

Das Erwähnungs-Gating ist ein Aktivierungs-Gate. Eine fehlende Erwähnung gibt
`admission: "skip"` zurück, damit der Turn-Kernel keinen Turn verarbeitet, der nur der Beobachtung dient.
Bei den meisten Channels sollte die Aktivierung nach den Absender- und Command-Gates erfolgen. Öffentliche
Chat-Oberflächen, die nicht erwähnten Datenverkehr vor Störmeldungen aus Absender-Zulassungslisten unterdrücken
müssen, können `activation.order: "before-sender"` aktivieren, wenn die Umgehung durch Text-Commands
deaktiviert ist. Channels mit impliziter Aktivierung, etwa Antworten in Bot-
Threads, lösen `channels.defaults.implicitMentions` sowie Channel- und Account-
Überschreibungen mit `resolveChannelImplicitMentions(...)` auf und übergeben das Ergebnis anschließend als
`activation.implicitMentions`. Das projizierte
`activationAccess.shouldBypassMention` gibt an, wann eine explizite Erwähnung durch Command- oder implizite
Aktivierung umgangen wurde.

## Schwärzung

Unverarbeitete Absenderwerte und unverarbeitete Zulassungslisteneinträge dienen nur als Eingabe für den Resolver. Sie
dürfen nicht in aufgelöstem Zustand, Entscheidungen, Diagnosen, Snapshots oder
Kompatibilitätsfakten erscheinen. Verwenden Sie undurchsichtige Subjekt-IDs, Eintrags-IDs, Route-IDs und
Diagnose-IDs.

## Überprüfung

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
