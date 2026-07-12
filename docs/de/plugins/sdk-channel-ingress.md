---
read_when:
    - Erstellen oder Migrieren eines Plugins für einen Nachrichtenkanal
    - Ändern von Zulassungslisten für Direktnachrichten oder Gruppen, Routing-Sperren, Befehlsautorisierung, Ereignisautorisierung oder Erwähnungsaktivierung
    - Überprüfung der Schwärzung eingehender Kanalnachrichten oder der SDK-Kompatibilitätsgrenzen
sidebarTitle: Channel Ingress
summary: Experimentelle Channel-Ingress-API für die Autorisierung eingehender Nachrichten
title: API für eingehende Channel-Nachrichten
x-i18n:
    generated_at: "2026-07-12T15:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel-Ingress ist die experimentelle Zugriffskontrollgrenze für eingehende
Channel-Ereignisse. Plugins sind für Plattformfakten und Seiteneffekte zuständig; der Core ist für
generische Richtlinien zuständig: Zulassungslisten für DMs/Gruppen, DM-Einträge im Pairing-Speicher, Routen-Gates,
Befehls-Gates, Ereignisautorisierung, Erwähnungsaktivierung, geschwärzte Diagnosen und
Zulassung.

Verwenden Sie `openclaw/plugin-sdk/channel-ingress-runtime` für neue Empfangspfade. Der
ältere Unterpfad `openclaw/plugin-sdk/channel-ingress` bleibt als
veraltete Kompatibilitätsfassade für Drittanbieter-Plugins exportiert.

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

Berechnen Sie effektive Zulassungslisten, Befehlsverantwortliche oder Befehlsgruppen nicht vorab.
Der Resolver leitet sie aus den unverarbeiteten Zulassungslisten, Speicher-Callbacks, Routen-
deskriptoren, Zugriffsgruppen, Richtlinien und der Konversationsart ab.

## Ergebnis

Gebündelte Plugins sollten moderne Projektionen direkt verwenden:

| Feld               | Bedeutung                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `ingress`          | geordnete Gate-Entscheidung und Zulassung                                  |
| `senderAccess`     | ausschließlich Autorisierung von Absender und Konversation                 |
| `routeAccess`      | Projektion von Route und Routenabsender                                    |
| `commandAccess`    | Befehlsautorisierung; `requested: false`, wenn kein Befehls-Gate ausgeführt wurde |
| `activationAccess` | Ergebnis der Erwähnung/Aktivierung                                          |

Die Ereignisautorisierung bleibt im geordneten `ingress.graph` und im
maßgeblichen `ingress.reasonCode` verfügbar; es wird keine separate Ereignisprojektion ausgegeben.

Veraltete SDK-Hilfsfunktionen für Drittanbieter dürfen ältere Strukturen intern rekonstruieren. Neue
gebündelte Empfangspfade sollten moderne Ergebnisse nicht wieder in lokale
DTOs übersetzen.

## Zugriffsgruppen

`accessGroup:<name>`-Einträge bleiben geschwärzt. Der Core löst statische
`message.senders`-Gruppen selbst auf und ruft `resolveAccessGroupMembership` nur
für dynamische Gruppen auf, die eine Plattformabfrage erfordern. Fehlende, nicht unterstützte und
fehlgeschlagene Gruppen führen standardmäßig zur Ablehnung.

## Ereignismodi

| `authMode`       | Bedeutung                                                        |
| ---------------- | ---------------------------------------------------------------- |
| `inbound`        | normale Gates für eingehende Absender                            |
| `command`        | Befehls-Gates für Callbacks oder bereichsgebundene Schaltflächen |
| `origin-subject` | Akteur muss dem Subjekt der ursprünglichen Nachricht entsprechen |
| `route-only`     | nur Routen-Gates für routenbezogene vertrauenswürdige Ereignisse |
| `none`           | Plugin-eigene interne Ereignisse umgehen die gemeinsame Autorisierung |

Verwenden Sie `mayPair: false` für Reaktionen, Schaltflächen, Callbacks und native Befehle.

## Routen und Aktivierung

Verwenden Sie Routendeskriptoren für Raum-, Themen-, Guild-, Thread- oder verschachtelte Routenrichtlinien:

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
deskriptoren hat; die Funktion filtert deaktivierte Zweige heraus, während die Routenfakten generisch
und nach der `precedence` jedes Deskriptors geordnet bleiben.

Das Erwähnungs-Gating ist ein Aktivierungs-Gate. Eine fehlende Erwähnung gibt
`admission: "skip"` zurück, damit der Turn-Kernel keinen Turn verarbeitet, der ausschließlich der Beobachtung dient.
Die meisten Channels sollten die Aktivierung nach den Absender- und Befehls-Gates belassen. Öffentliche
Chat-Oberflächen, die nicht erwähnten Datenverkehr vor Meldungen zu Absender-Zulassungslisten
unterdrücken müssen, können `activation.order: "before-sender"` verwenden, wenn die Umgehung durch
Textbefehle deaktiviert ist. Channels mit impliziter Aktivierung, etwa Antworten in Bot-
Threads, können `activation.allowedImplicitMentionKinds` übergeben; das projizierte
`activationAccess.shouldBypassMention` meldet dann, wenn eine Befehls- oder implizite
Aktivierung eine explizite Erwähnung umgangen hat.

## Schwärzung

Unverarbeitete Absenderwerte und Einträge in Zulassungslisten dienen nur als Eingaben für den Resolver. Sie
dürfen nicht im aufgelösten Zustand, in Entscheidungen, Diagnosen, Snapshots oder
Kompatibilitätsfakten erscheinen. Verwenden Sie opake Subjekt-IDs, Eintrags-IDs, Routen-IDs und
Diagnose-IDs.

## Überprüfung

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
