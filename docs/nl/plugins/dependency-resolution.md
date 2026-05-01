---
read_when:
    - Je debugt het herstel van runtime-afhankelijkheden voor gebundelde Plugins
    - Je wijzigt het opstarten van Plugin, doctor of het installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of meegeleverde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw gebundelde Plugin-runtimeafhankelijkheden plant, klaarzet en herstelt
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-01T11:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw installeert niet de volledige afhankelijkheidsboom van elke meegeleverde Plugin tijdens de pakketinstallatie. Het leidt eerst een effectief Plugin-plan af uit de configuratie en Plugin-metadata, en zet daarna alleen runtime-afhankelijkheden klaar voor meegeleverde, door OpenClaw beheerde Plugins die het plan daadwerkelijk kan laden.

Deze pagina behandelt verpakte runtime-afhankelijkheden voor meegeleverde OpenClaw-Plugins. Plugins van derden en aangepaste Plugin-paden blijven expliciete Plugin-installatiecommando's gebruiken, zoals `openclaw plugins install` en `openclaw plugins update`.

## Verantwoordelijkheidsverdeling

OpenClaw beheert het plan en het beleid:

- welke Plugins actief zijn voor deze configuratie
- welke afhankelijkheidsroots schrijfbaar of alleen-lezen zijn
- wanneer herstel is toegestaan
- welke Plugin-id's voor het opstarten worden klaargezet
- laatste controles voordat Plugin-runtime-modules worden geïmporteerd

De pakketbeheerder beheert afhankelijkheidsconvergentie:

- resolutie van de pakketgraaf
- verwerking van productie-, optionele en peer-afhankelijkheden
- `node_modules`-indeling
- pakketintegriteit
- lock- en installatiemetadata

In de praktijk moet OpenClaw bepalen wat er moet bestaan. `pnpm` of `npm` moet het bestandssysteem laten overeenkomen met die beslissing.

OpenClaw beheert ook de coördinatie-lock per installatieroot. Pakketbeheerders beschermen hun eigen installatietransactie, maar serialiseren niet de manifest-writes van OpenClaw, het kopiëren/hernoemen van geïsoleerde stages, de eindvalidatie of Plugin-import tegen een andere Gateway, doctor of CLI-proces dat dezelfde runtime-afhankelijkheidsroot aanraakt.

## Effectief Plugin-plan

Het effectieve Plugin-plan wordt afgeleid uit de configuratie plus ontdekte Plugin-metadata. Deze invoer kan runtime-afhankelijkheden van meegeleverde Plugins activeren:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` en `plugins.enabled`
- legacy kanaalconfiguratie zoals `channels.telegram.enabled`
- geconfigureerde providers, modellen of CLI-backendverwijzingen waarvoor een Plugin vereist is
- meegeleverde manifeststandaarden zoals `enabledByDefault`
- de geïnstalleerde Plugin-index en meegeleverde manifestmetadata

Expliciete uitschakeling wint. Een uitgeschakelde Plugin, geweigerde Plugin-id, uitgeschakeld Plugin-systeem of uitgeschakeld kanaal activeert geen herstel van runtime-afhankelijkheden. Alleen opgeslagen auth-status activeert ook geen meegeleverd kanaal of meegeleverde provider.

Het Plugin-plan is de stabiele invoer. De gegenereerde afhankelijkheidsmaterialisatie is een uitvoer van dat plan.

## Opstartflow

Gateway-opstart verwerkt de configuratie en bouwt de opstart-Plugin-opzoektabel voordat Plugin-runtime-modules worden geladen. Daarna zet de opstartflow alleen runtime-afhankelijkheden klaar voor de `startupPluginIds` die door dat plan zijn geselecteerd.

Voor verpakte installaties is afhankelijkheidsstaging toegestaan vóór Plugin-import. Na staging importeert de runtime-loader opstart-Plugins met installatieherstel uitgeschakeld; op dat moment wordt ontbrekende afhankelijkheidsmaterialisatie behandeld als een laadfout, niet als nog een herstellus.

Wanneer opstartafhankelijkheidsstaging wordt uitgesteld tot na de HTTP-bind, blijft Gateway-gereedheid geblokkeerd op de reden `plugin-runtime-deps` totdat de geselecteerde opstart-Plugin-afhankelijkheden zijn gematerialiseerd en de opstart-Plugin-runtime is geladen.

## Wanneer herstel wordt uitgevoerd

Herstel van runtime-afhankelijkheden moet worden uitgevoerd wanneer een van deze situaties waar is:

- het effectieve Plugin-plan is gewijzigd en voegt meegeleverde Plugins toe die runtime-afhankelijkheden nodig hebben
- het gegenereerde afhankelijkheidsmanifest komt niet meer overeen met het effectieve plan
- verwachte geïnstalleerde pakket-sentinels ontbreken of zijn onvolledig
- `openclaw doctor --fix` of `openclaw plugins deps --repair` is aangevraagd

Herstel van runtime-afhankelijkheden moet niet worden uitgevoerd alleen omdat OpenClaw is gestart. Een normale opstart met een ongewijzigd plan en volledige afhankelijkheidsmaterialisatie moet pakketbeheerwerk overslaan.

Commando's die configuratie bewerken, Plugins inschakelen of doctor-bevindingen herstellen, kunnen één keer naar Plugin-planmodus gaan, de nieuw vereiste meegeleverde afhankelijkheden materialiseren en daarna terugkeren naar de normale commandoflow. Lokale `openclaw onboard` en `openclaw configure` doen dit automatisch nadat ze configuratie succesvol hebben geschreven, zodat de volgende Gateway-run geen ontbrekende meegeleverde Plugin-pakketten ontdekt nadat het opstarten al is begonnen. Remote onboarding/configure blijft alleen-lezen voor lokale runtime-afhankelijkheden.

## Hot-reloadregel

Hot-reloadpaden die actieve Plugins kunnen wijzigen, moeten opnieuw via Plugin-planmodus gaan voordat Plugin-runtime wordt geladen. De reload moet het nieuwe effectieve Plugin-plan vergelijken met het vorige, ontbrekende afhankelijkheden voor nieuw actieve meegeleverde Plugins klaarzetten en daarna de betrokken runtime laden of herstarten.

Als een configuratiereload het effectieve Plugin-plan niet wijzigt, moet deze geen meegeleverde runtime-afhankelijkheden herstellen.

## Uitvoering van pakketbeheerder

OpenClaw schrijft een gegenereerd installatiemanifest voor de geselecteerde meegeleverde runtime-afhankelijkheden en voert de pakketbeheerder uit in de installatieroot voor runtime-afhankelijkheden. Het geeft de voorkeur aan `pnpm` wanneer beschikbaar en valt terug op de met Node meegeleverde `npm`-runner.

Het `pnpm`-pad gebruikt productie-afhankelijkheden, schakelt lifecycle-scripts uit, negeert de workspace en houdt de store binnen de installatieroot:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

De `npm`-fallback gebruikt de veilige npm-installatiewrapper met productie-afhankelijkheden, uitgeschakelde lifecycle-scripts, uitgeschakelde workspace-modus, uitgeschakelde audit, uitgeschakelde fund-output, legacy peer-afhankelijkheidsgedrag en ingeschakelde package-lock-output voor de gegenereerde installatieroot.

Na installatie valideert OpenClaw de klaargezette afhankelijkheidsboom voordat deze zichtbaar wordt voor de runtime-afhankelijkheidsroot. Geïsoleerde staging wordt naar de runtime-afhankelijkheidsroot gekopieerd en opnieuw gevalideerd.

De hele herstel-/materialisatiesectie wordt beschermd door een installatieroot-lock. Huidige lock-eigenaren registreren PID, starttijd van het proces wanneer beschikbaar en aanmaaktijd. Legacy locks zonder bewijs van processtarttijd of aanmaaktijd worden alleen op basis van bestandssysteemleeftijd teruggevorderd, zodat hergebruikte Docker PID 1-locks herstellen zonder normale langlopende huidige installaties alleen op basis van leeftijd te laten verlopen.

## Installatieroots

Verpakte installaties mogen alleen-lezen pakketdirectories niet wijzigen. OpenClaw kan afhankelijkheidsroots lezen uit verpakte lagen, maar schrijft gegenereerde runtime-afhankelijkheden naar een schrijfbare stage zoals:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` in containerachtige installaties

De schrijfbare root is het uiteindelijke materialisatiedoel. Oudere alleen-lezen roots worden alleen als compatibiliteitslagen bewaard wanneer dat nodig is.

Wanneer een verpakte OpenClaw-update de geversioneerde schrijfbare root wijzigt, maar het geselecteerde afhankelijkheidsplan voor meegeleverde Plugins nog steeds wordt voldaan door een vorige staged root, hergebruikt herstel die vorige `node_modules`-boom in plaats van de pakketbeheerder opnieuw uit te voeren. De nieuwe geversioneerde root krijgt nog steeds zijn eigen actuele pakket-runtime-mirror, zodat Plugin-code uit het huidige OpenClaw-pakket komt terwijl ongewijzigde afhankelijkheidsbomen tussen updates worden gedeeld. Hergebruik slaat vorige roots met een actieve OpenClaw-runtime-afhankelijkheidslock over, zodat een nieuwe root niet linkt naar een afhankelijkheidsboom die een andere Gateway, doctor of CLI-proces momenteel herstelt.

## Doctor- en CLI-commando's

Gebruik `plugins deps` om materialisatie van runtime-afhankelijkheden van meegeleverde Plugins te inspecteren of te herstellen:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Gebruik doctor wanneer de afhankelijkheidsstatus onderdeel is van bredere installatiegezondheid:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` en doctor werken op door OpenClaw beheerde runtime-afhankelijkheden van meegeleverde Plugins die door het effectieve Plugin-plan zijn geselecteerd. Het zijn geen installatie- of updatecommando's voor Plugins van derden.

## Probleemoplossing

Als een verpakte installatie ontbrekende meegeleverde runtime-afhankelijkheden meldt:

1. Voer `openclaw plugins deps --json` uit om het geselecteerde plan en ontbrekende pakketten te inspecteren.
2. Voer `openclaw plugins deps --repair` of `openclaw doctor --fix` uit om de schrijfbare afhankelijkheidsstage te herstellen.
3. Als de installatieroot alleen-lezen is, stel dan `OPENCLAW_PLUGIN_STAGE_DIR` in op een schrijfbaar pad en voer herstel opnieuw uit.
4. Herstart Gateway na herstel als de ontbrekende afhankelijkheid het laden van de opstart-Plugin blokkeerde.

In source-checkouts levert de workspace-installatie meestal de afhankelijkheden voor meegeleverde Plugins. Voer `pnpm install` uit voor herstel van bronafhankelijkheden in plaats van verpakt runtime-afhankelijkheidsherstel als eerste stap te gebruiken.
