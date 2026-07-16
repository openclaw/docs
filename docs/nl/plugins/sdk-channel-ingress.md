---
read_when:
    - Een Plugin voor een berichtenkanaal bouwen of migreren
    - DM- of groeps-toestaanlijsten, routepoorten, opdrachtverificatie, gebeurtenisverificatie of activering via vermeldingen wijzigen
    - Redactie van binnenkomende kanaalgegevens of SDK-compatibiliteitsgrenzen beoordelen
sidebarTitle: Channel Ingress
summary: Experimentele API voor kanaal-ingress voor autorisatie van inkomende berichten
title: API voor kanaalingang
x-i18n:
    generated_at: "2026-07-16T16:21:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Kanaalingang is de experimentele toegangscontrolegrens voor inkomende
kanaalgebeurtenissen. Plugins beheren platformfeiten en neveneffecten; de kern beheert
generiek beleid: toelatingslijsten voor DM's/groepen, DM-vermeldingen in het koppelingsarchief, routepoorten,
opdrachtpoorten, gebeurtenisautorisatie, activering via vermeldingen, geredigeerde diagnostiek en
toelating.

Gebruik `openclaw/plugin-sdk/channel-ingress-runtime` voor ontvangstpaden.

## Runtime-resolver

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

Bereken geen effectieve toelatingslijsten, opdrachteigenaren of opdrachtgroepen vooraf.
De resolver leidt deze af uit onbewerkte toelatingslijsten, archiefcallbacks, route-
descriptoren, toegangsgroepen, beleid en het gesprekstype.

## Resultaat

Gebundelde plugins moeten moderne projecties rechtstreeks gebruiken:

| Veld               | Betekenis                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | geordende poortbeslissing en toelating                              |
| `senderAccess`     | alleen autorisatie van afzender/gesprek                             |
| `routeAccess`      | projectie van route en routeafzender                                |
| `commandAccess`    | opdrachtautorisatie; `requested: false` wanneer geen opdrachtpoort is uitgevoerd |
| `activationAccess` | resultaat van vermelding/activering                                |

Gebeurtenisautorisatie blijft beschikbaar in de geordende `ingress.graph` en de
beslissende `ingress.reasonCode`; er wordt geen afzonderlijke gebeurtenisprojectie gegenereerd.

Verouderde SDK-hulpfuncties van derden mogen intern oudere structuren opnieuw opbouwen. Nieuwe
gebundelde ontvangstpaden mogen moderne resultaten niet terugvertalen naar lokale
DTO's.

## Toegangsgroepen

`accessGroup:<name>`-vermeldingen blijven geredigeerd. De kern verwerkt statische
`message.senders`-groepen zelf en roept `resolveAccessGroupMembership` alleen aan
voor dynamische groepen waarvoor een platformzoekopdracht vereist is. Ontbrekende, niet-ondersteunde en
mislukte groepen worden standaard geweigerd.

## Gebeurtenismodi

| `authMode`       | Betekenis                                        |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normale poorten voor inkomende afzenders         |
| `command`        | opdrachtpoorten voor callbacks of knoppen met een beperkt bereik |
| `origin-subject` | actor moet overeenkomen met het onderwerp van het oorspronkelijke bericht |
| `route-only`     | alleen routepoorten voor vertrouwde gebeurtenissen met een beperkt routebereik |
| `none`           | interne gebeurtenissen die door de plugin worden beheerd, omzeilen gedeelde autorisatie |

Gebruik `mayPair: false` voor reacties, knoppen, callbacks en systeemeigen opdrachten.

## Routes en activering

Gebruik routedescriptoren voor beleid voor kamers, onderwerpen, guilds, threads of geneste routes:

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

Gebruik `channelIngressRoutes(...)` wanneer een plugin meerdere optionele route-
descriptoren heeft; hiermee worden uitgeschakelde vertakkingen gefilterd terwijl routefeiten generiek blijven
en worden geordend volgens de `precedence` van elke descriptor.

Poortcontrole op vermeldingen is een activeringspoort. Een gemiste vermelding retourneert
`admission: "skip"`, zodat de turn-kernel een alleen-observerende turn niet verwerkt.
Voor de meeste kanalen hoort activering na de afzender- en opdrachtpoorten te blijven. Openbare
chatoppervlakken die niet-vermeld verkeer vóór ruis van de toelatingslijst voor afzenders moeten onderdrukken,
kunnen kiezen voor `activation.order: "before-sender"` wanneer het omzeilen via tekstopdrachten
is uitgeschakeld. Kanalen met impliciete activering, zoals antwoorden in bot-
threads, kunnen `activation.allowedImplicitMentionKinds` doorgeven; de geprojecteerde
`activationAccess.shouldBypassMention` meldt vervolgens wanneer een opdracht of impliciete
activering een expliciete vermelding heeft omzeild.

## Redactie

Onbewerkte afzenderwaarden en onbewerkte vermeldingen in toelatingslijsten dienen alleen als invoer voor de resolver. Ze
mogen niet voorkomen in verwerkte status, beslissingen, diagnostiek, momentopnamen of
compatibiliteitsfeiten. Gebruik ondoorzichtige onderwerp-id's, vermeldings-id's, route-id's en
diagnostische id's.

## Verificatie

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
