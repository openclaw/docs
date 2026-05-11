---
read_when:
    - Onderzoeken waarom de refactor van de kanaalingang te veel code heeft toegevoegd
    - Beleid voor routes, commando's, gebeurtenissen, activering of toegangsgroepen verplaatsen van gebundelde Plugins naar de kern
    - Controleren of een helper voor kanaalingress daadwerkelijk gebundelde Plugin-code verwijdert
sidebarTitle: Ingress core deletion
summary: Plan waarbij verwijderen vooropstaat voor het verplaatsen van herhaalde lijmcode voor kanaalingress naar de kern.
title: Plan voor het verwijderen van de ingress-kern
x-i18n:
    generated_at: "2026-05-11T20:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Verwijderingsplan voor ingress-core

De ingress-refactor is niet gezond zolang deze duizenden netto regels toevoegt. Core-
centralisatie telt alleen wanneer gebundelde pluginproductiecode kleiner wordt en
oude SDK-compatibiliteit voor derden wordt geïsoleerd in SDK/core-shims.

Gewenste runtime-vorm:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Gebundelde plugins mogen ingress niet terugvertalen naar lokale `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` of
`{ allowed, reasonCode }`-vormen, tenzij dat type een openbare plugin-API is.

## Budget

Gemeten ten opzichte van de PR merge-base met `origin/main`, inclusief niet-getrackte
bestanden.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Minimaal resterende opschoning:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Verwijdering van alleen commentaar telt niet als opschoning. De vorige budgetronde was
te royaal omdat die herstelde verklarende QQBot-commentaren meenam; dit
document volgt alleen verplaatsing van uitvoerbare code, docs en testcode.

Meet opnieuw na elke opschoningsgolf:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnose

De eerste ronde voegde de gedeelde ingress-kernel toe en liet daarna te veel plugin-lokale
autorisatie ernaast staan:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Dat dupliceert het model. Core-productie groeide met ongeveer 3.376 regels, terwijl
gebundelde pluginproductie 1.240 regels kleiner is. Dat is beter dan de eerste
ronde, maar het valt niet binnen het minimumbudget. De oplossing blijft eerst verwijderen:

- verwijder plugin-DTO's die alleen ingress-velden hernoemen
- verwijder tests die alleen wrapper-vorm controleren
- voeg core-helpers alleen toe wanneer dezelfde patch gebundelde plugincode verwijdert
- houd oude SDK-compatibiliteit alleen in SDK/core-shims
- pak core opnieuw in nadat wrapperverwijdering de stabiele vorm blootlegt

## Hotspots

Positieve gebundelde productiebestanden die nog moeten krimpen:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

De branch valt nog niet binnen het minimumbudget. Het resterende review-relevante
werk moet herhaalde autorisatiestromen, turn-scaffolding of wrappertests verwijderen
voordat er nog een core-abstractie wordt toegevoegd.

## Huidige Codelezing

De gezonde core-seam bestaat al in `src/channels/message-access/runtime.ts`:
die beheert identiteitsadapters, effectieve allowlists, reads uit de pairing-store,
routedescriptors, command-/eventpresets, toegangsgroepen en de uiteindelijk opgeloste
`ResolvedChannelMessageIngress`-projectie.

De resterende groei bestaat vooral uit pluginlijm bovenop die seam:

- `extensions/telegram/src/ingress.ts` verpakt core-beslissingen in Telegram-specifieke
  command-/eventhelpers, waarna callsites nog steeds vooraf berekende genormaliseerde
  allowlists en ownerlijsten doorgeven.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  en `extensions/matrix/src/matrix/monitor/access-state.ts` behouden nog steeds
  lokale beleids-DTO's of verouderde beslissingsnamen naast ingress.
- `extensions/signal/src/monitor/access-policy.ts` houdt Signal-
  identiteitsnormalisatie en pairing-antwoorden terecht lokaal, maar heeft nog steeds een wrapper-
  seam die moet samenvallen met direct ingress-gebruik.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` en
  `extensions/zalouser/src/monitor.ts` herhalen nog steeds route-/envelope-/turn-
  assemblage die naar gedeelde turn-helpers buiten de ingress-kernel kan verhuizen.

Conclusie: meer code naar core verplaatsen is alleen nuttig als het deze
pluginwrapperlagen in dezelfde patch verwijdert. Nog een abstractie toevoegen terwijl
wrapperreturns blijven bestaan herhaalt de fout.

## Grens

Core beheert generiek beleid:

- allowlist-normalisatie en matching
- uitbreiding en diagnostiek van toegangsgroepen
- DM-allowlistreads uit de pairing-store
- route-, afzender-, command-, event- en activatiepoorten
- admission-mapping: dispatch, drop, skip, observe, pairing
- geredigeerde state, beslissingen, diagnostiek en SDK-compatibiliteitsprojecties
- herbruikbare generieke descriptors voor identiteit, route, command, event, activatie
  en uitkomsten

Plugins beheren transportfeiten en bijwerkingen:

- authenticiteit van webhook/socket/request
- platformidentiteitsextractie en API-lookups
- kanaalspecifieke beleidsstandaarden
- levering van pairing-challenges, antwoorden, acks, reacties, typen, media, historie,
  setup, doctor, status, logs en gebruikersgerichte tekst

Core moet kanaalonafhankelijk blijven: geen Discord, Slack, Telegram, Matrix, room,
guild, space, API-client of pluginspecifieke standaard in
`src/channels/message-access`.

## Acceptatieregel

Elke nieuwe core-helper moet direct gebundelde pluginproductiecode verwijderen.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Stop en ontwerp opnieuw als:

- pluginproductie-LOC toeneemt
- tests sneller groeien dan productie krimpt
- een gebundeld hot path een DTO retourneert die alleen `ResolvedChannelMessageIngress` hernoemt
- een core-helper een channel-id, platformobject, API-client of
  kanaalspecifieke standaard nodig heeft

## Werkpakketten

1. Bevries het budget.
   Zet LOC in de PR, houd deprecated-ingress-lint groen en neem before/after-
   LOC op in opschoningscommits.

2. Verwijder dunne DTO-seams.
   Vervang plugin-lokale wrapperreturns door `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` of `ingress` direct. Begin
   met QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage en
   Tlon. Verwijder wrapper-vormtests; behoud gedragstests.

3. Voeg uitkomstclassificatie alleen toe met verwijderingen.
   Een generieke classifier mag `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` en
   `drop-ingress` blootleggen. Die moet afleiden uit de beslissingsgrafiek, niet uit reason strings,
   en minstens drie plugins migreren in dezelfde patch.

4. Voeg routedescriptor-builders alleen toe met verwijderingen.
   Generieke helpers voor routetarget en routeafzender zijn alleen acceptabel als ze
   route-zware plugins direct verkleinen: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo en Zalo Personal.

5. Voeg command-/eventpresets alleen toe met verwijderingen.
   Centraliseer tekst-command-, native-command-, callback- en origin-subject-vormen.
   Command-consumers moeten standaard unauthorized zijn wanneer geen command-gate heeft gedraaid;
   events mogen pairing niet starten.

6. Voeg identiteitspresets alleen toe waar ze boilerplate verwijderen.
   Helpers voor stable-id, stable-id-plus-aliases, phone/e164 en multi-identifier
   zijn toegestaan wanneer ruwe waarden alleen adapterinput binnenkomen en geredigeerde state
   ondoorzichtige id's/aantallen behoudt.

7. Deel geautoriseerde turn-assemblage.
   Verwijder buiten de ingress-kernel herhaalde route-/session-/envelope-/reply-
   scaffolding uit QA Channel, IRC, Nextcloud Talk, Zalo en Zalo Personal.
   Core mag route-/session-/envelope-/dispatch-sequencing beheren; plugins behouden
   levering en kanaalspecifieke context.

8. Isoleer compatibiliteit.
   Verouderde SDK-helpers blijven broncompatibel, maar gebundelde hot paths mogen geen
   verouderde ingress- of command-auth-facades importeren. Compatibiliteitstests moeten
   nepplugins van derden gebruiken, geen internals van gebundelde plugins.

9. Pak core opnieuw in.
   Na wrapperverwijdering: vouw eenmalig gebruikte modules samen, verwijder ongebruikte exports, verplaats
   compatibiliteitsprojectie uit hot paths en behoud gerichte tests voor identiteit,
   route, command/event, activatie, toegangsgroepen en compatibiliteitsshims.

## Verwijderingsgolven

Voer deze op volgorde uit. Elke golf moet gebundelde productie-LOC verlagen.

1. Wrappercollapse, verwachte plugindelta: -400 tot -600.
   Vervang plugin-lokale `resolveXAccess`, `resolveXCommandAccess` en
   `accessFromIngress`-resultaattypen door directe reads uit
   `ResolvedChannelMessageIngress`. Eerste doelen: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Gedeelde uitkomsthelpers, verwachte plugindelta: -200 tot -350.
   Voeg één generieke classifier alleen toe als die herhaalde
   `shouldBlockControlCommand`-, pairing-, activatie-skip-, route-block- en sender-
   block-ladders over minstens drie plugins verwijdert.

3. Routedescriptor-builders, verwachte plugindelta: -200 tot -350.
   Verplaats herhaalde assemblage van routetarget- en routeafzenderdescriptors naar core-
   helpers. Eerste doelen: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Delen van turn-assemblage, verwachte plugindelta: -250 tot -450.
   Gebruik gemeenschappelijke route-/session-/envelope-/dispatch-sequencing voor eenvoudige inbound-
   plugins. Eerste doelen: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Core opnieuw inpakken, verwachte coredelta: -300 tot -700.
   Nadat plugins runtimeprojecties direct gebruiken, verwijder eenmalig gebruikte modules,
   merge kleine bestanden terug in `runtime.ts` of gerichte siblings en houd SDK-
   compatibiliteitsbestanden gescheiden van gebundelde hot paths.

6. Testsnoei, verwachte testdelta: -300 tot -600.
   Verwijder tests die alleen verwijderde wrapper-vormen controleren. Behoud gedragstests voor
   command-weigering, groepsfallback, origin-subject-matching, activatie-skip,
   toegangsgroepen, pairing en redactie.

Verwachte minimale landingsvorm na deze golven:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Niet Verplaatsen

Verplaats geen standaardwaarden voor platformconfiguratie, setup-UX, doctor/fix-tekst, API-lookups,
Slack-eigenaar-aanwezigheidscontroles, Matrix-alias-/verificatieafhandeling, Telegram
callback-parsing, commandosyntaxisparsing, native command-registratie, reaction
payload-parsing, koppelingsantwoorden, commandoantwoorden, bevestigingen, typen, media, geschiedenis,
of logs.

## Verificatie

Gerichte lokale iteratie:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Gebruik Testbox voor brede wijzigingsgates/volledige-suite-bewijs zodra de LOC-trend
binnen het budget valt.

Elk werkpakket legt vast:

- LOC voor/na per categorie
- verwijderde plugin-wrappers
- nieuwe LOC voor core-helpers, indien van toepassing
- uitgevoerde gerichte tests
- resterende hotspotlijst

## Exitcriteria

- gebundelde productie-imports hebben geen deprecated channel-access- of command-auth-facades
- compatibiliteitscode is geisoleerd tot SDK/core-seams
- gebundelde plugins consumeren ingress-projecties of generieke uitkomsten direct
- productie-LOC van plugins is minstens 1.500 netto negatief ten opzichte van `origin/main`
- productie-LOC van core is <= +1.500, of elke overschrijding wordt gecompenseerd terwijl het totaal
  <= +2.000 blijft
- representatieve tests dekken redactie, route, commando/event, activatie,
  access-group en kanaalspecifiek fallback-gedrag
