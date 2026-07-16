---
read_when:
    - OpenClaw bijwerken
    - Er gaat iets kapot na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), plus terugdraaistrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-07-16T15:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Houd OpenClaw up-to-date.

Zie voor het vervangen van Docker-, Podman- en Kubernetes-images
[Containerimages upgraden](/nl/install/docker#upgrading-container-images). De
Gateway voert vóór gereedheid opstartveilige upgradewerkzaamheden uit en sluit af als gekoppelde
status handmatig herstel vereist.

## Aanbevolen: `openclaw update`

Detecteert je installatietype (npm, pnpm, Bun of git), haalt de nieuwste versie op, voert `openclaw doctor` uit en herstart de Gateway.

```bash
openclaw update
```

Wissel van kanaal of kies een specifieke versie:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # voorbeeldweergave zonder toepassing
```

`openclaw update` heeft geen vlag `--verbose` (het installatieprogramma wel). Gebruik voor diagnostiek
`--dry-run` om geplande acties vooraf te bekijken, `--json` voor gestructureerde resultaten of
`openclaw update status --json` om de kanaal- en beschikbaarheidsstatus te controleren.

`--channel beta` geeft de voorkeur aan de npm-dist-tag beta, maar valt terug op stable/latest
wanneer de beta-tag ontbreekt of de versie ervan ouder is dan de nieuwste stabiele
release. Gebruik in plaats daarvan `--tag beta` voor een eenmalige pakketupdate die is vastgezet op de onbewerkte npm-
dist-tag beta.

`--channel extended-stable` geldt alleen voor pakketten en de installatie blijft
uitsluitend op de voorgrond plaatsvinden. OpenClaw leest de openbare npm-selector `extended-stable`,
verifieert het exact geselecteerde pakket en installeert precies die versie. Ontbrekende
of inconsistente registergegevens leiden tot een veilige fout; er wordt nooit teruggevallen op `latest`.
Als de geselecteerde versie ouder is dan de geïnstalleerde versie, blijft de normale
bevestiging voor downgraden van toepassing. De CLI slaat het kanaal op na een
geslaagde kernupdate; een rechtstreekse `npm install -g openclaw@extended-stable`
werkt `update.channel` niet bij.
Na het vervangen van de kern worden geschikte officiële npm-plugins met standaard/lege intentie of
`latest`-intentie afgestemd op precies die kernversie. Exact vastgezette versies en expliciete
niet-`latest`-tags, plugins van derden en niet-npm-bronnen blijven ongewijzigd.
Catalogusinstallaties die door huidige OpenClaw-versies zijn gemaakt, behouden die standaard-
intentie. Oudere records die alleen een exacte versie bevatten, blijven vastgezet omdat
OpenClaw een oude automatische vastzetting niet veilig van een gebruikersvastzetting kan onderscheiden; voer
`openclaw plugins update @openclaw/name` eenmaal uit op het extended-stable-kanaal
om die plugin opnieuw exacte-kerntracking te laten gebruiken.

`--channel dev` biedt een permanente, meebewegende GitHub-`main`-checkout. Voor een eenmalige
pakketupdate wordt `--tag main` gekoppeld aan de pakketspecificatie `github:openclaw/openclaw#main`
en rechtstreeks geïnstalleerd via de doelpakketbeheerder (npm/pnpm/bun).

Voor beheerde plugins is een ontbrekende betarelease een waarschuwing, geen fout: de
kernupdate kan nog steeds slagen terwijl een plugin terugvalt op de geregistreerde
standaard-/nieuwste release.

Zie [Releasekanalen](/nl/install/development-channels) voor de betekenis van kanalen.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen om het installatietype te wijzigen. De updater behoudt je status, configuratie,
referenties en werkruimte in `~/.openclaw`; alleen wordt gewijzigd welke OpenClaw-
code-installatie de CLI en Gateway gebruiken.

```bash
# npm-pakketinstallatie -> bewerkbare git-checkout
openclaw update --channel dev

# git-checkout -> npm-pakketinstallatie
openclaw update --channel stable
```

Bekijk eerst een voorbeeld van de wisseling van installatiemodus:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` zorgt voor een git-checkout, bouwt deze en installeert de globale CLI vanuit die
checkout. De kanalen `stable`, `extended-stable` en `beta` gebruiken pakket-
installaties. Extended-stable wordt bij een git-checkout geweigerd zonder deze te wijzigen of
te converteren. Als de Gateway al is geïnstalleerd, vernieuwt `openclaw update`
de servicemetadata en herstart de service, tenzij je `--no-restart` meegeeft.

Voor pakketinstallaties met een beheerde Gateway-service richt `openclaw update` zich op
de pakketroot die door die service wordt gebruikt. Als de shellopdracht `openclaw`
uit een andere installatie komt, toont de updater beide roots en het Node-pad
van de beheerde service, en controleert de Node-versie aan de hand van de vereiste
`engines.node` van de doelrelease voordat het pakket wordt vervangen.

## Alternatief: voer het installatieprogramma opnieuw uit

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Voeg `--no-onboard` toe om onboarding over te slaan. Geef
`--install-method git --no-onboard` of `--install-method npm --no-onboard` mee om een specifiek installatietype af te dwingen.

Als `openclaw update` na de npm-pakketinstallatiefase mislukt, voer dan het
installatieprogramma opnieuw uit. Het roept de updater niet aan; het voert de globale pakket-
installatie rechtstreeks uit en kan een gedeeltelijk bijgewerkte npm-installatie herstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Zet het herstel met `--version` vast op een specifieke versie of dist-tag:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatief: handmatig met npm, pnpm of bun

```bash
npm i -g openclaw@latest
```

Geef bij installaties onder supervisie de voorkeur aan `openclaw update`: hiermee kan het vervangen van het pakket
worden afgestemd met de actieve Gateway-service. Als je een installatie onder supervisie
handmatig bijwerkt, stop dan eerst de beheerde Gateway. Pakketbeheerders vervangen bestanden
ter plaatse, waardoor een actieve Gateway anders kan proberen kern- of pluginbestanden
tijdens de vervanging te laden. Herstart de Gateway nadat de pakketbeheerder klaar is, zodat
de nieuwe installatie wordt geladen.

Als `openclaw update` bij een globale Linux-systeeminstallatie in eigendom van root mislukt met
`EACCES`, herstel dan met systeem-npm terwijl de Gateway gestopt blijft voor de
handmatige vervanging. Gebruik dezelfde profielvlaggen/-omgeving die je normaal voor
die Gateway gebruikt. Vervang `/usr/bin/npm` door de systeem-npm die eigenaar is van het
globale prefix in eigendom van root op je host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Verifieer vervolgens:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wanneer `openclaw update` een globale npm-installatie beheert, installeert deze het doel
eerst in een tijdelijk npm-prefix. Het kandidaatpakket valideert tijdens
`preinstall` de Node-versie van de host; pas daarna verifieert OpenClaw de verpakte
`dist`-inventaris en vervangt het de schone pakketstructuur in het echte globale prefix. Een
verpakte voltooiingsbeveiliging wordt weggelaten uit de verwachte inventaris en pas verwijderd
nadat `preinstall` is geslaagd, zodat overgeslagen levenscyclusscripts ook vóór de
vervanging mislukken. Op npm 12 en nieuwer keurt de updater alleen de levenscyclus van kandidaat-OpenClaw
goed; scripts van transitieve afhankelijkheden blijven geblokkeerd. Dit voorkomt dat npm
een nieuw pakket over achtergebleven bestanden van het oude pakket heen plaatst. Als de installatie-
opdracht mislukt, probeert OpenClaw het eenmaal opnieuw met `--omit=optional`, wat helpt op hosts
waar native optionele afhankelijkheden niet kunnen worden gecompileerd.

Door OpenClaw beheerde npm-update- en pluginupdateopdrachten wissen ook npm's
toeleveringsketenquarantaine `min-release-age` (of de oudere configuratiesleutel `before`)
voor het onderliggende npm-proces. Dat beleid bestaat voor algemene bescherming, maar een
expliciete OpenClaw-update betekent "installeer de geselecteerde release nu."

```bash
pnpm add -g openclaw@latest
```

Als pnpm 11 OpenClaw 2026.7.1 heeft geïnstalleerd, voer die handmatige opdracht dan eenmaal uit. Die
release dateert van vóór de geïsoleerde globale pakketindeling van pnpm 11, waardoor de updater
een andere npm-installatie ten onrechte kan aanzien voor de actieve CLI. Latere releases behouden
pnpm-eigenaarschap en volgen tijdens updates de pakketroot van het vervangende pakket. Ze
gebruiken ook de door de beherende pakketbeheerder gerapporteerde globale bin-map en stoppen vóór
wijzigingen wanneer de beschikbare pnpm-opdracht een andere globale root of hoofdversie meldt,
of wanneer het aanroepende pakket verweesd is of daar niet de enige actieve OpenClaw-
installatie is.

Als OpenClaw een globale pnpm 11-installatiegroep met een ander pakket deelt, stopt de
automatische updater voordat de groep wordt gewijzigd. Werk de oorspronkelijke
door komma's gescheiden groep handmatig bij, zodat de verwante pakketten en het buildbeleid
intact blijven.

```bash
bun add -g openclaw@latest
```

### Geavanceerde onderwerpen voor npm-installaties

<AccordionGroup>
  <Accordion title="Alleen-lezen pakketstructuur">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketmap beschrijfbaar is voor de huidige gebruiker. Installaties van pluginpakketten bevinden zich in npm-/git-roots die eigendom zijn van OpenClaw onder de configuratiemap van de gebruiker, en het opstarten van de Gateway wijzigt de OpenClaw-pakketstructuur niet.

    Sommige Linux-npm-configuraties installeren globale pakketten onder mappen in eigendom van root, zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling omdat opdrachten voor het installeren/bijwerken van plugins buiten die globale pakketmap schrijven.

  </Accordion>
  <Accordion title="Versterkte systemd-units">
    Geef OpenClaw schrijftoegang tot de configuratie-/statusroots, zodat expliciete plugininstallaties, pluginupdates en opschoning door doctor hun wijzigingen kunnen opslaan:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Voorafgaande controle van schijfruimte">
    Vóór pakketupdates en expliciete plugininstallaties probeert OpenClaw naar beste vermogen de schijfruimte van het doelvolume te controleren. Weinig ruimte levert een waarschuwing op met het gecontroleerde pad, maar blokkeert de update niet omdat bestandssysteemquota, momentopnamen en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke installatie door de pakketbeheerder en de verificatie na installatie blijven doorslaggevend.
  </Accordion>
</AccordionGroup>

## Automatische updater

Standaard uitgeschakeld. Schakel deze in via `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanaal            | Gedrag                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Wacht `stableDelayHours` (standaard: 6) en past de update vervolgens toe met deterministische spreiding over `stableJitterHours` (standaard: 12) voor een gespreide uitrol. |
| `extended-stable` | Controleert bij het opstarten en elke 24 uur op een alleen-lezen updatehint wanneer `checkOnStart` is ingeschakeld. Past nooit automatisch toe. |
| `beta`            | Controleert elke `betaCheckIntervalHours` (standaard: 1) en past onmiddellijk toe.                                                           |
| `dev`             | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                                    |

De Gateway registreert bij het opstarten ook een updatehint (uitschakelen met
`update.checkOnStart: false`). Opgeslagen extended-stable-selecties gebruiken dit
alleen-lezen hintpad en het bestaande hintinterval van 24 uur, maar starten nooit
automatische installatie, overdracht, herstart, stabiele vertraging/spreiding of beta-polling.
Stel voor downgraden of herstel na een incident `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Updatehints bij het opstarten kunnen nog steeds worden uitgevoerd, tenzij `update.checkOnStart` ook is uitgeschakeld.

Updates via pakketbeheerders die via het actieve Gateway-besturingsvlak
(`update.run`) worden aangevraagd, vervangen de pakketstructuur niet binnen het actieve Gateway-
proces. Bij installaties met een beheerde service start de Gateway een losgekoppelde overdracht,
sluit af en laat het normale CLI-pad `openclaw update --yes --json` de
service stoppen, het pakket vervangen, de servicemetadata vernieuwen, herstarten, de
Gateway-versie en bereikbaarheid verifiëren en waar mogelijk een geïnstalleerde maar niet-geladen macOS-
LaunchAgent herstellen. Als de Gateway die overdracht niet veilig kan uitvoeren,
meldt `update.run` in plaats daarvan een veilige shellopdracht zonder de pakket-
beheerder in het proces uit te voeren.

De updatekaart in de zijbalk van de Control UI toont **Gateway bijwerken** wanneer deze
de `update.run`-stroom rechtstreeks start. Dit geldt voor de in de browser gehoste Control UI, externe
Gateways en handmatig beheerde lokale Gateways.

In de ondertekende macOS-app verandert een lokale, door de app beheerde Gateway die kaart in
**Mac-app + Gateway bijwerken**. Sparkle werkt eerst de app bij; na het opnieuw starten voert de
app `openclaw update --tag <app-version> --json` uit, start de Gateway opnieuw
en controleert de status in een voortgangsvenster zoals tijdens de configuratie. Het venster verschijnt alleen
wanneer die beheerde Gateway moet worden bijgewerkt, gerepareerd of geïnstalleerd; updates die alleen de app betreffen, starten
de app direct opnieuw. Details over fouten blijven zichtbaar met Opnieuw proberen, [Updatehandleiding](/nl/install/updating) en
[Discord](https://discord.gg/clawd)-acties. De app gebruikt dit gecoördineerde
pad nooit voor een externe of extern beheerde Gateway, voert nooit een downgrade van een nieuwere
Gateway uit en overschrijft nooit een `extended-stable`-kanaalpin.

Wanneer de update slaagt, plaatst de app een eenmalige welkomstgebeurtenis in de wachtrij voor de
meest recente directe sessie op het hoogste niveau met een echte gebruikers-/kanaalinteractie. Cron-uitvoeringen,
heartbeats en sessie-updates die uitsluitend op de achtergrond plaatsvinden, wijzigen die selectie niet. In de
externe modus werkt de app alleen de lokale Mac-Node-runtime bij en verzendt de gebeurtenis
alleen wanneer de verbonden externe Gateway minstens even nieuw is als de app.

## Na het bijwerken

<Steps>

### Doctor uitvoeren

```bash
openclaw doctor
```

Migreert de configuratie, controleert DM-beleid en controleert de status van de Gateway. Details: [Doctor](/nl/gateway/doctor)

### De Gateway opnieuw starten

```bash
openclaw gateway restart
```

### Verifiëren

```bash
openclaw health
```

</Steps>

## Terugdraaien

Terugdraaien bestaat uit twee lagen:

1. Installeer oudere OpenClaw-code opnieuw met behoud van de huidige status.
2. Herstel de status van vóór de update alleen wanneer de oudere code een gemigreerde
   configuratie of database niet kan gebruiken.

Begin met het terugdraaien van alleen de code. Bij het herstellen van de status gaan wijzigingen verloren die na
de back-up zijn aangebracht.

### Vóór het bijwerken: maak een geverifieerde back-up

`openclaw update` bewaart automatisch een kopie van de configuratie van vóór de update, maar maakt
geen volledig herstelpunt voor de status. Maak vóór een belangrijke update expliciet
een herstelpunt:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Het archiefmanifest vermeldt de OpenClaw-versie en de bronpaden die
in de back-up zijn opgenomen. Het archief kan inloggegevens, authenticatieprofielen en kanaalstatus
bevatten. Bewaar het daarom met machtigingen die alleen de eigenaar toegang geven en met dezelfde beveiliging als de
actieve statusmap. Zie [Back-up](/nl/cli/backup) voor opgenomen en bewust
weggelaten bestanden.

Voor een byte-voor-byte-herstelpunt dat vluchtige artefacten bevat die niet in
het overdraagbare archief zijn opgenomen, stop je de Gateway en gebruik je een door je platform
geleverde momentopname van het bestandssysteem, volume of de VM.

### Een pakketinstallatie terugdraaien

Geef de gepubliceerde versies weer, bekijk vervolgens een voorbeeld en installeer de bekende werkende versie:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` heeft de voorkeur boven een rechtstreekse installatie via de pakketbeheerder. Deze
detecteert de downgrade, vraagt om bevestiging, voert beheerde convergentie van plugins
en compatibiliteitscontroles uit voor het geïnstalleerde doel, vernieuwt de
servicemetadata, start de Gateway opnieuw en verifieert de actieve versie. Als het opgeslagen
kanaal `extended-stable` is, gebruik je
`--channel stable --tag <known-good-version>`, omdat exacte eenmalige tags niet
met de `extended-stable`-selector kunnen worden gecombineerd.

Bij pakketupdates wordt de kandidaat vóór activering klaargezet en geverifieerd. Als het
omwisselen van het bestandssysteem of het vervangen van de commandoshim mislukt, herstelt OpenClaw automatisch het oude
pakket. Als na een geslaagde omwisseling later een statuscontrole van de Gateway
mislukt, worden de vorige versie en instructies voor handmatig terugdraaien gemeld in plaats van
het pakket opnieuw automatisch te vervangen.

Als het CLI-updatepad niet beschikbaar is, gebruik je dezelfde pakketbeheerder en hetzelfde
installatiebereik die de huidige Gateway beheren:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Vervang `npm` door `pnpm` of `bun` wanneer die beheerder de installatie beheert. Voorkom
tijdens incidentherstel dat een ingeschakelde automatische updater onmiddellijk een
nieuwere release toepast door `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in te stellen.

### Een broncode-check-out terugdraaien

Gebruik een schone check-out en selecteer een bekende werkende tag of commit:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Om terug te keren naar de nieuwste versie: `git checkout main && git pull`.

De updater zet een Git-check-out automatisch terug naar de vorige branch en
SHA wanneer de installatie van afhankelijkheden, de build, de UI-build of Doctor mislukt nadat een Git-update
is gestart. Handmatig uitchecken blijft vereist wanneer je bewust
een oudere commit kiest.

### Downgraden over de SQLite-sessiemigratie heen

Voordat je een oudere, op bestanden gebaseerde OpenClaw-release start, gebruik je de huidige CLI om
gearchiveerde oudere transcriptartefacten te herstellen:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Hiermee worden geen SQLite-gegevens verwijderd. Sessies die na de SQLite-migratie zijn gemaakt,
bestaan alleen in SQLite en verschijnen niet in de oudere runtime. Zie
[Downgraden na de SQLite-sessiemigratie](/nl/cli/doctor#downgrading-after-session-sqlite-migration).

### Herstel de status alleen wanneer dat nodig is

Als de oudere code een nieuwere configuratie of een nieuwer databaseschema niet kan lezen, stop je de
Gateway en herstel je de geverifieerde momentopname van het bestandssysteem, volume of de VM van vóór de update.
Bewaar de huidige status afzonderlijk voordat je deze herstelt, omdat hierdoor
wijzigingen worden verwijderd die na de momentopname zijn aangebracht.

Brede `openclaw backup create`-archieven ondersteunen het maken en verifiëren, maar
niet de activering van het volledige archief op de oorspronkelijke locatie. Pak een breed archief uit in een tijdelijke
map en gebruik de bron-naar-archiefkoppeling in `manifest.json` voor offline
herstel. `openclaw backup sqlite restore` schrijft eveneens een geverifieerde database
naar een nieuw doel; het activeren van dat doel blijft een expliciete offline stap voor de beheerder.

### Controleer het terugdraaien

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Als je vastloopt

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` bij broncode-check-outs initialiseert de updater indien nodig automatisch `pnpm`. Als je een pnpm-/corepack-initialisatiefout ziet, installeer je `pnpm` handmatig (of schakel je `corepack` opnieuw in) en voer je de update opnieuw uit.
- Controleer: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het op Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): statuscontroles na updates.
- [Migreren](/nl/install/migrating): migratiehandleidingen voor hoofdversies.
