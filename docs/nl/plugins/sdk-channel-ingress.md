---
read_when:
    - Een Plugin voor een berichtenkanaal bouwen of migreren
    - Allowlist, routepoorten, opdrachtverificatie, gebeurtenisverificatie of vermeldingsactivering voor DM's of groepen wijzigen
    - Redactie van inkomende kanaalgegevens of SDK-compatibiliteitsgrenzen beoordelen
sidebarTitle: Channel Ingress
summary: Experimentele API voor kanaalingang voor de autorisatie van inkomende berichten
title: API voor inkomend kanaalverkeer
x-i18n:
    generated_at: "2026-07-12T09:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel-ingress is de experimentele toegangscontrolegrens voor inkomende
kanaalgebeurtenissen. Plugins beheren platformspecifieke feiten en bijwerkingen; de kern beheert
generiek beleid: toelatingslijsten voor privéberichten/groepen, privéberichtvermeldingen in de koppelingsopslag, routepoorten,
opdrachtpoorten, gebeurtenisautorisatie, activering via vermeldingen, geredigeerde diagnostiek en
toelating.

Gebruik `openclaw/plugin-sdk/channel-ingress-runtime` voor nieuwe ontvangstpaden. Het
oudere subpad `openclaw/plugin-sdk/channel-ingress` blijft geëxporteerd als een
verouderde compatibiliteitsfacade voor Plugins van derden.

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

Bereken effectieve toelatingslijsten, opdrachteigenaren of opdrachtgroepen niet vooraf.
De resolver leidt deze af uit onbewerkte toelatingslijsten, opslagcallbacks, routebeschrijvingen,
toegangsgroepen, beleid en het soort gesprek.

## Resultaat

Meegeleverde Plugins moeten moderne projecties rechtstreeks gebruiken:

| Veld               | Betekenis                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `ingress`          | geordende poortbeslissing en toelating                                     |
| `senderAccess`     | uitsluitend autorisatie van afzender/gesprek                               |
| `routeAccess`      | projectie van route en routeafzender                                       |
| `commandAccess`    | opdrachtautorisatie; `requested: false` wanneer geen opdrachtpoort is uitgevoerd |
| `activationAccess` | resultaat van vermelding/activering                                        |

Gebeurtenisautorisatie blijft beschikbaar in de geordende `ingress.graph` en de
doorslaggevende `ingress.reasonCode`; er wordt geen afzonderlijke gebeurtenisprojectie gegenereerd.

Verouderde SDK-helpers van derden mogen intern oudere structuren opnieuw opbouwen. Nieuwe
meegeleverde ontvangstpaden mogen moderne resultaten niet terugvertalen naar lokale
DTO's.

## Toegangsgroepen

`accessGroup:<name>`-vermeldingen blijven geredigeerd. De kern verwerkt statische
`message.senders`-groepen zelf en roept `resolveAccessGroupMembership` alleen aan
voor dynamische groepen waarvoor een platformopzoeking nodig is. Ontbrekende, niet-ondersteunde en
mislukte groepen worden standaard geweigerd.

## Gebeurtenismodi

| `authMode`       | Betekenis                                                       |
| ---------------- | --------------------------------------------------------------- |
| `inbound`        | normale afzenderpoorten voor inkomende gebeurtenissen           |
| `command`        | opdrachtpoorten voor callbacks of afgebakende knoppen            |
| `origin-subject` | actor moet overeenkomen met het onderwerp van het oorspronkelijke bericht |
| `route-only`     | uitsluitend routepoorten voor vertrouwde routegebonden gebeurtenissen |
| `none`           | interne gebeurtenissen die door de Plugin worden beheerd, omzeilen gedeelde autorisatie |

Gebruik `mayPair: false` voor reacties, knoppen, callbacks en systeemeigen opdrachten.

## Routes en activering

Gebruik routebeschrijvingen voor beleid voor ruimtes, onderwerpen, guilds, threads of geneste routes:

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

Gebruik `channelIngressRoutes(...)` wanneer een Plugin meerdere optionele
routebeschrijvingen heeft; deze functie filtert uitgeschakelde vertakkingen, terwijl routefeiten generiek
blijven en worden geordend volgens de `precedence` van elke beschrijving.

Controle op vermeldingen is een activeringspoort. Een ontbrekende vermelding retourneert
`admission: "skip"`, zodat de turn-kernel geen beurt verwerkt die alleen ter observatie dient.
De meeste kanalen moeten activering na de afzender- en opdrachtpoorten laten plaatsvinden. Openbare
chatoppervlakken die niet-vermeld verkeer moeten dempen voordat ruis van afzendertoelatingslijsten
ontstaat, kunnen kiezen voor `activation.order: "before-sender"` wanneer het omzeilen via
tekstopdrachten is uitgeschakeld. Kanalen met impliciete activering, zoals antwoorden in
botthreads, kunnen `activation.allowedImplicitMentionKinds` doorgeven; de geprojecteerde
`activationAccess.shouldBypassMention` meldt vervolgens wanneer een opdracht of impliciete
activering een expliciete vermelding heeft omzeild.

## Redactie

Onbewerkte afzenderwaarden en onbewerkte toelatingslijstvermeldingen dienen uitsluitend als invoer voor de resolver. Ze
mogen niet voorkomen in opgeloste status, beslissingen, diagnostiek, momentopnamen of
compatibiliteitsfeiten. Gebruik ondoorzichtige onderwerp-id's, vermeldings-id's, route-id's en
diagnostische id's.

## Verificatie

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
