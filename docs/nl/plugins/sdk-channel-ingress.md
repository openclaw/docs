---
read_when:
    - Een Plugin voor berichtenkanalen bouwen of migreren
    - DM- of groepsallowlists, routegates, commando-authenticatie, gebeurtenis-authenticatie of vermeldingsactivatie wijzigen
    - Controleren van maskering van inkomend kanaalverkeer of SDK-compatibiliteitsgrenzen
sidebarTitle: Channel Ingress
summary: Experimentele ingress-API voor kanalen voor autorisatie van inkomende berichten
title: API voor kanaalingang
x-i18n:
    generated_at: "2026-05-11T20:42:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# Channel ingress-API

Channel ingress is de experimentele toegangscontrolegrens voor inkomende
kanaalgebeurtenissen. Gebruik `openclaw/plugin-sdk/channel-ingress-runtime` voor ontvangstpaden.
Het oudere subpad `openclaw/plugin-sdk/channel-ingress` blijft geëxporteerd als een
verouderde compatibiliteitsfacade voor externe plugins.

Plugins beheren platformfeiten en neveneffecten. Core beheert generiek beleid: toestemmingslijsten voor DM/groepen, DM-vermeldingen in de koppelingsopslag, routepoorten, opdrachtpoorten, gebeurtenisautorisatie,
mention-activering, geredigeerde diagnostiek en toelating.

## Runtime Resolver

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

Bereken effectieve toestemmingslijsten, opdrachteigenaren of opdrachtgroepen niet vooraf. De
resolver leidt ze af uit ruwe toestemmingslijsten, opslagcallbacks, routebeschrijvingen,
toegangsgroepen, beleid en gesprekssoort.

## Resultaat

Gebundelde plugins moeten moderne projecties direct gebruiken:

- `ingress`: geordende poortbeslissing en toelating
- `senderAccess`: alleen autorisatie van afzender/gesprek
- `routeAccess`: projectie van route en route-afzender
- `commandAccess`: opdrachtautorisatie; false wanneer er geen opdrachtpoort is uitgevoerd
- `activationAccess`: mention-/activeringsresultaat

Gebeurtenisautorisatie blijft beschikbaar op de geordende `ingress.graph` en de
doorslaggevende `ingress.reasonCode`; er wordt geen afzonderlijke gebeurtenisprojectie uitgegeven.

Verouderde SDK-helpers van derden kunnen oudere vormen intern opnieuw opbouwen. Nieuwe
gebundelde ontvangstpaden mogen moderne resultaten niet terugvertalen naar lokale DTO's.

## Toegangsgroepen

`accessGroup:<name>`-vermeldingen blijven geredigeerd. Core lost statische
`message.senders`-groepen zelf op en roept `resolveAccessGroupMembership` alleen aan
voor dynamische groepen waarvoor een platformzoekactie nodig is. Ontbrekende, niet-ondersteunde en
mislukte groepen falen gesloten.

## Gebeurtenismodi

| `authMode`       | Betekenis                                        |
| ---------------- | ------------------------------------------------ |
| `inbound`        | normale poorten voor inkomende afzenders         |
| `command`        | opdrachtpoorten voor callbacks of scoped knoppen |
| `origin-subject` | actor moet overeenkomen met het oorspronkelijke berichtonderwerp |
| `route-only`     | alleen routepoorten voor route-scoped vertrouwde gebeurtenissen |
| `none`           | door de plugin beheerde interne gebeurtenissen omzeilen gedeelde auth |

Gebruik `mayPair: false` voor reacties, knoppen, callbacks en native opdrachten.

## Routes en activering

Gebruik routebeschrijvingen voor kamer-, onderwerp-, guild-, thread- of genest routebeleid:

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

Gebruik `channelIngressRoutes(...)` wanneer een plugin meerdere optionele
routebeschrijvingen heeft; dit filtert uitgeschakelde vertakkingen terwijl routefeiten generiek blijven en
geordend worden op basis van de `precedence` van elke beschrijving.

Mention-poorten vormen een activeringspoort. Een gemiste mention retourneert
`admission: "skip"` zodat de turn-kernel geen observe-only beurt verwerkt.
De meeste kanalen moeten activering na afzender- en opdrachtpoorten laten staan. Openbare
chatoppervlakken die niet-genoemd verkeer moeten dempen vóór ruis van afzender-toestemmingslijsten
kunnen kiezen voor `activation.order: "before-sender"` wanneer de bypass voor tekstopdrachten
is uitgeschakeld. Kanalen met impliciete activering, zoals antwoorden in botthreads,
kunnen `activation.allowedImplicitMentionKinds` doorgeven; de geprojecteerde
`activationAccess.shouldBypassMention` rapporteert dan wanneer opdracht- of impliciete
activering een expliciete mention heeft omzeild.

## Redactie

Ruwe afzenderwaarden en ruwe toestemmingslijstvermeldingen zijn alleen resolverinvoer. Ze mogen
niet voorkomen in opgeloste status, beslissingen, diagnostiek, snapshots of
compatibiliteitsfeiten. Gebruik ondoorzichtige subject-id's, vermelding-id's, route-id's en
diagnostische id's.

## Verificatie

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
