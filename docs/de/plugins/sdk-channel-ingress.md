---
read_when:
    - Erstellen oder Migrieren eines Nachrichtenkanal-Plugins
    - Ändern von DM- oder Gruppen-Allowlists, Route-Gates, Befehlsauthentifizierung, Ereignisauthentifizierung oder Erwähnungsaktivierung
    - Überprüfung der Kanal-Ingress-Schwärzung oder SDK-Kompatibilitätsgrenzen
sidebarTitle: Channel Ingress
summary: Experimentelle Channel-Ingress-API zur Autorisierung eingehender Nachrichten
title: Kanal-Eingangs-API
x-i18n:
    generated_at: "2026-05-10T19:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kanal-Ingress-API

Kanal-Ingress ist die experimentelle Zugriffskontrollgrenze für eingehende Kanalereignisse. Verwenden Sie `openclaw/plugin-sdk/channel-ingress-runtime` für Empfangspfade. Der ältere Subpfad `openclaw/plugin-sdk/channel-ingress` bleibt als veraltete Kompatibilitätsfassade für Drittanbieter-Plugins exportiert.

Plugins besitzen plattformspezifische Fakten und Seiteneffekte. Der Core besitzt generische Richtlinien: Zulassungslisten für Direktnachrichten/Gruppen, DM-Einträge im Pairing-Store, Routing-Gates, Befehls-Gates, Ereignisautorisierung, Aktivierung durch Erwähnung, redigierte Diagnosen und Zulassung.

## Laufzeit-Resolver

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

Berechnen Sie effektive Zulassungslisten, Befehlsinhaber oder Befehlsgruppen nicht vorab. Der Resolver leitet sie aus Roh-Zulassungslisten, Store-Callbacks, Routen-Deskriptoren, Zugriffsgruppen, Richtlinien und Konversationsart ab.

## Ergebnis

Gebündelte Plugins sollten moderne Projektionen direkt verwenden:

- `ingress`: geordnete Gate-Entscheidung und Zulassung
- `senderAccess`: nur Autorisierung von Absender/Konversation
- `routeAccess`: Routen- und Routenabsender-Projektion
- `commandAccess`: Befehlsautorisierung; false, wenn kein Befehls-Gate ausgeführt wurde
- `activationAccess`: Ergebnis der Erwähnung/Aktivierung

Die Ereignisautorisierung bleibt im geordneten `ingress.graph` und im entscheidenden `ingress.reasonCode` verfügbar; es wird keine separate Ereignisprojektion ausgegeben.

Veraltete SDK-Hilfsfunktionen für Drittanbieter können ältere Formen intern neu aufbauen. Neue gebündelte Empfangspfade sollten moderne Ergebnisse nicht wieder in lokale DTOs übersetzen.

## Zugriffsgruppen

`accessGroup:<name>`-Einträge bleiben redigiert. Der Core löst statische `message.senders`-Gruppen selbst auf und ruft `resolveAccessGroupMembership` nur für dynamische Gruppen auf, die eine Plattformabfrage erfordern. Fehlende, nicht unterstützte und fehlgeschlagene Gruppen schlagen geschlossen fehl.

## Ereignismodi

| `authMode`       | Bedeutung                                               |
| ---------------- | ------------------------------------------------------- |
| `inbound`        | normale Gates für eingehende Absender                   |
| `command`        | Befehls-Gates für Callbacks oder begrenzte Schaltflächen |
| `origin-subject` | Akteur muss mit dem Subjekt der ursprünglichen Nachricht übereinstimmen |
| `route-only`     | nur Routen-Gates für routenbezogene vertrauenswürdige Ereignisse |
| `none`           | Plugin-eigene interne Ereignisse umgehen gemeinsame Authentifizierung |

Verwenden Sie `mayPair: false` für Reaktionen, Schaltflächen, Callbacks und native Befehle.

## Routen und Aktivierung

Verwenden Sie Routen-Deskriptoren für Raum-, Themen-, Guild-, Thread- oder verschachtelte Routenrichtlinien:

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

Verwenden Sie `channelIngressRoutes(...)`, wenn ein Plugin mehrere optionale Routen-Deskriptoren hat; es filtert deaktivierte Zweige heraus, während Routenfakten generisch bleiben und nach der `precedence` jedes Deskriptors geordnet werden.

Mention-Gating ist ein Aktivierungs-Gate. Eine verfehlte Erwähnung gibt `admission: "skip"` zurück, sodass der Turn-Kernel keinen reinen Beobachtungs-Turn verarbeitet. Die meisten Kanäle sollten die Aktivierung nach Absender- und Befehls-Gates belassen. Öffentliche Chat-Oberflächen, die nicht erwähnten Verkehr vor Rauschen durch Absender-Zulassungslisten unterdrücken müssen, können `activation.order: "before-sender"` aktivieren, wenn die Umgehung per Textbefehl deaktiviert ist. Kanäle mit impliziter Aktivierung, etwa Antworten in Bot-Threads, können `activation.allowedImplicitMentionKinds` übergeben; das projizierte `activationAccess.shouldBypassMention` meldet dann, wann Befehls- oder implizite Aktivierung eine ausdrückliche Erwähnung umgangen hat.

## Redigierung

Rohwerte von Absendern und rohe Zulassungslisten-Einträge sind nur Eingaben für den Resolver. Sie dürfen nicht in aufgelöstem Zustand, Entscheidungen, Diagnosen, Snapshots oder Kompatibilitätsfakten erscheinen. Verwenden Sie opake Subjekt-IDs, Eintrags-IDs, Routen-IDs und Diagnose-IDs.

## Verifizierung

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
