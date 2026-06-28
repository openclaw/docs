---
read_when:
    - Onderzoeken waarom de refactoring van inkomende kanaalverwerking te veel code heeft toegevoegd
    - Het verplaatsen van route-, commando-, gebeurtenis-, activerings- of toegangsgroepbeleid van gebundelde Plugins naar de kern
    - Controleren of een helper voor inkomend kanaalverkeer daadwerkelijk gebundelde Plugin-code verwijdert
sidebarTitle: Ingress core deletion
summary: Plan met verwijdering als uitgangspunt om herhaalde lijmcode voor kanaalbinnenkomst naar de kern te verplaatsen.
title: Plan voor het verwijderen van de ingress-kern
x-i18n:
    generated_at: "2026-05-12T00:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Verwijderingsplan voor de ingress-kern

De ingress-refactor is niet gezond zolang die duizenden netto regels toevoegt. Kerncentralisatie telt alleen wanneer productiecode van gebundelde plugins kleiner wordt en oude SDK-compatibiliteit voor derden wordt afgezonderd in SDK-/kern-shims.

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

Gebundelde plugins mogen ingress niet terugvertalen naar lokale `AccessResult`-, `GroupAccessDecision`-, `CommandAuthDecision`-, `DmCommandAccess`- of `{ allowed, reasonCode }`-vormen, tenzij dat type openbare plugin-API is.

## Budget

Gemeten tegen de PR-merge-base met `origin/main`, inclusief niet-gevolgde bestanden.

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

Minimale resterende opschoning:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Verwijdering van alleen opmerkingen telt niet als opschoning. De vorige budgetronde was te ruimhartig omdat die herstelde verklarende QQBot-opmerkingen meenam; dit document volgt alleen verplaatsing van uitvoerbare code, documentatiecode en testcode.

Meet opnieuw na elke opschoningsgolf:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnose

De eerste ronde voegde de gedeelde ingress-kernel toe en liet daarna te veel plugin-lokale autorisatie ernaast staan:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Dat dupliceert het model. De kernproductie groeide met ongeveer 3.376 regels, terwijl de productiecode van gebundelde plugins 1.240 regels kleiner is. Dat is beter dan de eerste ronde, maar het valt niet binnen het minimumbudget. De oplossing blijft verwijdering eerst:

- verwijder plugin-DTO's die alleen ingress-velden hernoemen
- verwijder tests die alleen wrapper-vorm bevestigen
- voeg alleen kernhelpers toe wanneer dezelfde patch gebundelde plugin-code verwijdert
- houd oude SDK-compatibiliteit alleen in SDK-/kern-shims
- pak de kern opnieuw in nadat wrapper-verwijdering de stabiele vorm blootlegt

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

De branch valt nog niet binnen het minimumbudget. Het resterende review-relevante werk moet herhaalde autorisatiestromen, turn-scaffolding of wrappertests verwijderen voordat er nog een kernabstractie wordt toegevoegd.

## Huidige codelezing

De gezonde kernnaad bestaat al in `src/channels/message-access/runtime.ts`: die is eigenaar van identity-adapters, effectieve allowlists, pairing-store-reads, routebeschrijvers, command-/event-presets, access groups en de uiteindelijke opgeloste `ResolvedChannelMessageIngress`-projectie.

De resterende groei is vooral plugin-lijm boven op die naad:

- `extensions/telegram/src/ingress.ts` wikkelt kernbeslissingen in Telegram-specifieke command-/eventhelpers, waarna callsites nog steeds vooraf berekende genormaliseerde allowlists en eigenaarslijsten doorgeven.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` en `extensions/matrix/src/matrix/monitor/access-state.ts` houden nog steeds lokale policy-DTO's of legacy beslissingsnamen naast ingress.
- `extensions/signal/src/monitor/access-policy.ts` houdt Signal-identiteitsnormalisatie en pairing-antwoorden terecht lokaal, maar heeft nog steeds een wrapper-naad die moet instorten tot directe ingress-consumptie.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` en `extensions/zalouser/src/monitor.ts` herhalen nog steeds route-/envelope-/turn-assemblage die naar gedeelde turnhelpers buiten de ingress-kernel kan verhuizen.

Conclusie: meer code naar de kern verplaatsen is alleen nuttig als het in dezelfde patch deze plugin-wrapperlagen verwijdert. Nog een abstractie toevoegen terwijl wrapper-returns blijven bestaan, herhaalt de fout.

## Grens

De kern is eigenaar van generiek beleid:

- allowlist-normalisatie en matching
- uitbreiding en diagnostiek van access groups
- DM-allowlist-reads uit de pairing-store
- route-, sender-, command-, event- en activation-gates
- toelatingsmapping: dispatch, drop, skip, observe, pairing
- geredigeerde status, beslissingen, diagnostiek en SDK-compatibiliteitsprojecties
- herbruikbare generieke beschrijvers voor identity, route, command, event, activation en outcomes

Plugins zijn eigenaar van transportfeiten en neveneffecten:

- authenticiteit van webhook/socket/request
- platformidentiteitsextractie en API-lookups
- kanaalspecifieke beleidsstandaarden
- levering van pairing-uitdagingen, antwoorden, acks, reacties, typen, media, geschiedenis, setup, doctor, status, logs en gebruikersgerichte tekst

De kern moet kanaalagnostisch blijven: geen Discord, Slack, Telegram, Matrix, room, guild, space, API-client of plugin-specifieke standaard in `src/channels/message-access`.

## Acceptatieregel

Elke nieuwe kernhelper moet onmiddellijk productiecode van gebundelde plugins verwijderen.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Stop en ontwerp opnieuw als:

- productie-LOC van plugins toeneemt
- tests sneller groeien dan productie krimpt
- een gebundeld hot path een DTO retourneert die alleen `ResolvedChannelMessageIngress` hernoemt
- een kernhelper een channel-id, platformobject, API-client of kanaalspecifieke standaard nodig heeft

## Werkpakketten

1. Bevries het budget.
   Zet LOC in de PR, houd deprecated-ingress-lint groen en neem voor/na-LOC op in opschoningscommits.

2. Verwijder dunne DTO-naden.
   Vervang plugin-lokale wrapper-returns door direct gebruik van `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` of `ingress`. Begin met QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage en Tlon. Verwijder wrapper-vormtests; behoud gedragstests.

3. Voeg outcome-classificatie alleen toe met verwijderingen.
   Een generieke classifier mag `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` en `drop-ingress` blootleggen. Die moet afgeleid zijn van de beslissingsgrafiek, niet van redenstrings, en in dezelfde patch minstens drie plugins migreren.

4. Voeg routebeschrijver-builders alleen toe met verwijderingen.
   Generieke helpers voor routedoel en routesender zijn alleen acceptabel als ze route-zware plugins onmiddellijk verkleinen: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo en Zalo Personal.

5. Voeg command-/event-presets alleen toe met verwijderingen.
   Centraliseer text-command-, native-command-, callback- en origin-subject-vormen. Command-consumenten moeten standaard naar unauthorized gaan wanneer er geen command-gate is uitgevoerd; events mogen geen pairing starten.

6. Voeg identity-presets alleen toe waar ze boilerplate verwijderen.
   Stable-id-, stable-id-plus-aliases-, phone/e164- en multi-identifier-helpers zijn toegestaan wanneer ruwe waarden alleen adapterinvoer binnenkomen en geredigeerde status ondoorzichtige id's/aantallen behoudt.

7. Deel geautoriseerde turn-assemblage.
   Verwijder buiten de ingress-kernel herhaalde route-/session-/envelope-/context-/reply-scaffolding uit QA Channel, IRC, Nextcloud Talk, Zalo en Zalo Personal. De kern mag route-/session-/envelope-/dispatch-volgorde bezitten; plugins behouden levering en kanaalspecifieke context.

8. Zet compatibiliteit in quarantaine.
   Verouderde SDK-helpers blijven broncompatibel, maar gebundelde hot paths mogen geen verouderde ingress- of command-auth-facades importeren. Compatibiliteitstests moeten nepplugins van derden gebruiken, geen internals van gebundelde plugins.

9. Pak de kern opnieuw in.
   Na wrapper-verwijdering: klap modules met één gebruik in, verwijder ongebruikte exports, verplaats compatibiliteitsprojectie uit hot paths en behoud gerichte tests voor identity, route, command/event, activation, access groups en compatibiliteitsshims.

## Verwijderingsgolven

Voer deze op volgorde uit. Elke golf moet productie-LOC van gebundelde plugins verlagen.

1. Wrapper-collapse, verwachte plugin-delta: -400 tot -600.
   Vervang plugin-lokale `resolveXAccess`-, `resolveXCommandAccess`- en `accessFromIngress`-resultaattypen door directe reads uit `ResolvedChannelMessageIngress`. Eerste doelen: Discord DM command auth, Feishu policy, Matrix access state, Telegram ingress, Signal access policy, QQBot SDK-adapter.

2. Gedeelde outcome-helpers, verwachte plugin-delta: -200 tot -350.
   Voeg één generieke classifier alleen toe als die herhaalde `shouldBlockControlCommand`-, pairing-, activation-skip-, route-block- en sender-block-ladders verwijdert uit minstens drie plugins.

3. Routebeschrijver-builders, verwachte plugin-delta: -200 tot -350.
   Verplaats herhaalde assemblage van routedoel- en routesenderbeschrijvers naar kernhelpers. Eerste doelen: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Delen van turn-assemblage, verwachte plugin-delta: -250 tot -450.
   Gebruik gemeenschappelijke route-/session-/envelope-/dispatch-volgorde voor eenvoudige inkomende plugins. Eerste doelen: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Kern opnieuw inpakken, verwachte kern-delta: -300 tot -700.
   Nadat plugins runtime-projecties direct consumeren: verwijder modules met één gebruik, voeg kleine bestanden terug samen in `runtime.ts` of gerichte buren, en houd SDK-compatibiliteitsbestanden gescheiden van gebundelde hot paths.

6. Testopschoning, verwachte test-delta: -300 tot -600.
   Verwijder tests die alleen verwijderde wrapper-vormen bevestigen. Behoud gedragstests voor command denial, group fallback, origin-subject matching, activation skip, access groups, pairing en redactie.

Verwachte minimale landingsvorm na deze golven:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Niet Verplaatsen

Verplaats geen platformconfiguratiestandaarden, installatie-UX, doctor/fix-tekst, API-lookups,
Slack-eigenaarsaanwezigheidscontroles, Matrix-alias-/verificatieafhandeling, Telegram
callback-parsing, syntaxisparsing van opdrachten, native opdrachtregistratie, parsing van
reactiepayloads, koppelingsantwoorden, opdrachtantwoorden, bevestigingen, typen, media, geschiedenis
of logs.

## Verificatie

Gerichte lokale loop:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Gebruik Testbox voor brede gewijzigde gates/full-suitebewijs zodra de LOC-trend
binnen budget is.

Elk werkpakket legt vast:

- LOC vóór/na per categorie
- verwijderde Plugin-wrappers
- nieuwe kernhelper-LOC, indien aanwezig
- uitgevoerde gerichte tests
- resterende lijst met hotspots

## Exitcriteria

- gebundelde productie-imports gebruiken geen verouderde channel-access- of command-auth-facades
- compatibiliteitscode is geïsoleerd tot SDK-/kernnaden
- gebundelde Plugins consumeren ingress-projecties of generieke uitkomsten rechtstreeks
- Plugin-productie-LOC is netto ten minste 1.500 lager ten opzichte van `origin/main`
- kernproductie-LOC is `<= +1,500`, of elke overschrijding wordt gecompenseerd terwijl het totaal
  `<= +2,000` blijft
- representatieve tests dekken redactie, route, opdracht/event, activatie,
  toegangsgroep en kanaalspecifiek fallbackgedrag
