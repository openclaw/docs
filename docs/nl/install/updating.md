---
read_when:
    - OpenClaw bijwerken
    - Er gaat iets mis na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), inclusief terugdraaistrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-07-12T09:01:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Houd OpenClaw up-to-date.

Zie voor het vervangen van Docker-, Podman- en Kubernetes-images
[Container-images upgraden](/nl/install/docker#upgrading-container-images). De
Gateway voert vóór de gereedheidscontrole upgradebewerkingen uit die veilig zijn
tijdens het opstarten en wordt afgesloten als gekoppelde status handmatig moet
worden hersteld.

## Aanbevolen: `openclaw update`

Detecteert je installatietype (npm of git), haalt de nieuwste versie op, voert `openclaw doctor` uit en herstart de Gateway.

```bash
openclaw update
```

Wissel van kanaal of kies een specifieke versie:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # voorbeeldweergave zonder wijzigingen toe te passen
```

`openclaw update` heeft geen vlag `--verbose` (het installatieprogramma wel). Gebruik voor diagnostiek
`--dry-run` om geplande acties vooraf te bekijken, `--json` voor gestructureerde resultaten of
`openclaw update status --json` om de status van het kanaal en de beschikbaarheid te controleren.

`--channel beta` geeft de voorkeur aan de npm-dist-tag beta, maar valt terug op stable/latest
wanneer de beta-tag ontbreekt of de versie ervan ouder is dan de nieuwste stabiele
release. Gebruik in plaats daarvan `--tag beta` voor een eenmalige pakketupdate die is vastgezet op de onbewerkte npm-
dist-tag beta.

`--channel extended-stable` werkt alleen met pakketten en de installatie blijft
uitsluitend op de voorgrond plaatsvinden. OpenClaw leest de openbare npm-selector `extended-stable`,
verifieert het exact geselecteerde pakket en installeert precies die versie. Ontbrekende
of inconsistente registergegevens leiden tot een veilige fout; er wordt nooit teruggevallen op `latest`.
Als de geselecteerde versie ouder is dan de geïnstalleerde versie, blijft de normale
bevestiging voor downgraden van toepassing. De CLI slaat het kanaal op na een
geslaagde update van de kern; een rechtstreekse `npm install -g openclaw@extended-stable`
werkt `update.channel` niet bij.
Na het vervangen van de kern worden geschikte officiële npm-plugins met een ongespecificeerde/standaardintentie of
`latest`-intentie afgestemd op exact die kernversie. Exact vastgezette versies en expliciete
andere tags dan `latest`, plugins van derden en bronnen die niet van npm afkomstig zijn, blijven ongewijzigd.
Catalogusinstallaties die door huidige OpenClaw-versies zijn aangemaakt, behouden die standaard-
intentie. Oudere records die alleen een exacte versie bevatten, blijven vastgezet omdat
OpenClaw niet veilig onderscheid kan maken tussen een oude automatische vastzetting en een vastzetting door een gebruiker; voer
eenmalig `openclaw plugins update @openclaw/name` uit op het extended-stable-kanaal
om die plugin opnieuw exacte kernversies te laten volgen.

`--channel dev` biedt een permanente, bewegende GitHub-check-out van `main`. Voor een eenmalige
pakketupdate wordt `--tag main` omgezet naar de pakketspecificatie `github:openclaw/openclaw#main`
en rechtstreeks geïnstalleerd via het gekozen pakketbeheer (npm/pnpm/bun).

Voor beheerde plugins is een ontbrekende betarelease een waarschuwing en geen fout: de
kernupdate kan nog steeds slagen terwijl een plugin terugvalt op de geregistreerde
standaard-/nieuwste release.

Zie [Releasekanalen](/nl/install/development-channels) voor de semantiek van kanalen.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen om het installatietype te wijzigen. De updater behoudt je status, configuratie,
aanmeldgegevens en werkruimte in `~/.openclaw`; alleen de OpenClaw-
code-installatie die de CLI en Gateway gebruiken, wordt gewijzigd.

```bash
# npm-pakketinstallatie -> bewerkbare git-check-out
openclaw update --channel dev

# git-check-out -> npm-pakketinstallatie
openclaw update --channel stable
```

Bekijk eerst een voorbeeld van de wisseling van installatiemodus:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` zorgt voor een git-check-out, bouwt deze en installeert de globale CLI vanuit die
check-out. De kanalen `stable`, `extended-stable` en `beta` gebruiken pakket-
installaties. Extended-stable wordt bij een git-check-out geweigerd zonder deze te wijzigen of
te converteren. Als de Gateway al is geïnstalleerd, vernieuwt `openclaw update`
de servicemetadata en herstart de service, tenzij je `--no-restart` doorgeeft.

Voor pakketinstallaties met een beheerde Gateway-service richt `openclaw update` zich
op de pakketroot die door die service wordt gebruikt. Als de shellopdracht `openclaw`
uit een andere installatie afkomstig is, toont de updater beide roots en het Node-pad
van de beheerde service, en controleert de Node-versie aan de hand van de
`engines.node`-vereiste van de doelrelease voordat het pakket wordt vervangen.

## Alternatief: voer het installatieprogramma opnieuw uit

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Voeg `--no-onboard` toe om de onboarding over te slaan. Geef
`--install-method git --no-onboard` of `--install-method npm --no-onboard` door om een specifiek installatietype af te dwingen.

Als `openclaw update` mislukt na de installatiefase van het npm-pakket, voer dan het
installatieprogramma opnieuw uit. Dit roept de updater niet aan; het voert de globale pakket-
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

Geef de voorkeur aan `openclaw update` voor installaties onder servicebeheer: hiermee kan het vervangen van het pakket
worden gecoördineerd met de actieve Gateway-service. Als je een installatie onder servicebeheer handmatig
bijwerkt, stop dan eerst de beheerde Gateway. Pakketbeheerders vervangen bestanden
ter plaatse, waardoor een actieve Gateway anders kan proberen kern- of pluginbestanden
te laden terwijl de vervanging bezig is. Herstart de Gateway nadat het pakketbeheer is voltooid, zodat
de nieuwe installatie wordt geladen.

Als `openclaw update` bij een globale Linux-systeeminstallatie die eigendom is van root mislukt met
`EACCES`, herstel dan met de npm van het systeem terwijl de Gateway gestopt blijft voor de
handmatige vervanging. Gebruik dezelfde profielvlaggen/-omgeving die je normaal voor
die Gateway gebruikt. Vervang `/usr/bin/npm` door de systeem-npm die eigenaar is van het
globale rootprefix op je host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Verifieer daarna:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wanneer `openclaw update` een globale npm-installatie beheert, installeert het eerst het doel
in een tijdelijk npm-prefix, verifieert het de verpakte `dist`-inventaris en
verwisselt het vervolgens de schone pakketstructuur met het werkelijke globale prefix — zodat npm
geen nieuw pakket over verouderde bestanden van het oude pakket heen legt. Als de installatie-
opdracht mislukt, probeert OpenClaw het eenmaal opnieuw met `--omit=optional`, wat helpt op hosts
waar optionele native afhankelijkheden niet kunnen worden gecompileerd.

Door OpenClaw beheerde npm-update- en pluginupdate-opdrachten wissen ook de
`min-release-age`-quarantaine voor de toeleveringsketen van npm (of de oudere configuratiesleutel `before`)
voor het onderliggende npm-proces. Dat beleid bestaat voor algemene bescherming, maar een
expliciete OpenClaw-update betekent: "installeer de geselecteerde release nu."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Geavanceerde onderwerpen voor npm-installaties

<AccordionGroup>
  <Accordion title="Alleen-lezen pakketstructuur">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketmap beschrijfbaar is voor de huidige gebruiker. Installaties van pluginpakketten bevinden zich in npm-/git-roots die eigendom zijn van OpenClaw, onder de configuratiemap van de gebruiker, en tijdens het opstarten wijzigt de Gateway de OpenClaw-pakketstructuur niet.

    Sommige Linux-npm-configuraties installeren globale pakketten onder mappen die eigendom zijn van root, zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling omdat opdrachten voor het installeren en bijwerken van plugins buiten die globale pakketmap schrijven.

  </Accordion>
  <Accordion title="Versterkte systemd-eenheden">
    Geef OpenClaw schrijftoegang tot de roots voor configuratie en status, zodat expliciete plugininstallaties, pluginupdates en opschoning door doctor hun wijzigingen kunnen opslaan:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Voorafgaande controle van schijfruimte">
    Vóór pakketupdates en expliciete plugininstallaties probeert OpenClaw naar beste vermogen de beschikbare schijfruimte op het doelvolume te controleren. Weinig ruimte levert een waarschuwing met het gecontroleerde pad op, maar blokkeert de update niet, omdat bestandssysteemquota, momentopnamen en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke installatie door het pakketbeheer en de verificatie na installatie blijven doorslaggevend.
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
| `stable`          | Wacht `stableDelayHours` (standaard: 6) en past de update daarna toe met deterministische spreiding over `stableJitterHours` (standaard: 12) voor een gefaseerde uitrol. |
| `extended-stable` | Controleert bij het opstarten en elke 24 uur op een alleen-lezen updatehint wanneer `checkOnStart` is ingeschakeld. Past nooit automatisch toe. |
| `beta`            | Controleert elke `betaCheckIntervalHours` (standaard: 1) en past de update onmiddellijk toe.                                                  |
| `dev`             | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                                           |

De Gateway registreert bij het opstarten ook een updatehint (schakel dit uit met
`update.checkOnStart: false`). Opgeslagen extended-stable-selecties gebruiken dit
alleen-lezen hintpad en het bestaande hintinterval van 24 uur, maar roepen nooit
automatische installatie, overdracht, herstart, stabiele vertraging/spreiding of betacontrole aan.
Stel voor een downgrade of herstel na een incident `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Updatehints bij het opstarten kunnen nog steeds worden uitgevoerd, tenzij `update.checkOnStart` ook is uitgeschakeld.

Updates van pakketbeheer die via het live besturingsvlak van de Gateway
(`update.run`) worden aangevraagd, vervangen de pakketstructuur niet binnen het actieve Gateway-
proces. Bij installaties met een beheerde service start de Gateway een losgekoppelde overdracht,
wordt afgesloten en laat het normale CLI-pad `openclaw update --yes --json` de
service stoppen, het pakket vervangen, servicemetadata vernieuwen, herstarten, de
Gateway-versie en bereikbaarheid verifiëren en waar mogelijk een geïnstalleerde maar niet-geladen macOS-
LaunchAgent herstellen. Als de Gateway die overdracht niet veilig kan uitvoeren,
rapporteert `update.run` een veilige shellopdracht in plaats van het pakketbeheer
binnen het proces uit te voeren.

De updatekaart in de zijbalk van de Control UI start dezelfde `update.run`-stroom. In de
ondertekende macOS-app werkt de kaart eerst de app bij via Sparkle; na het opnieuw starten
brengt de app de beheerde lokale Gateway naar de overeenkomende versie.

## Na het bijwerken

<Steps>

### Voer doctor uit

```bash
openclaw doctor
```

Migreert de configuratie, controleert DM-beleid en controleert de gezondheid van de Gateway. Details: [Doctor](/nl/gateway/doctor)

### Herstart de Gateway

```bash
openclaw gateway restart
```

### Verifieer

```bash
openclaw health
```

</Steps>

## Terugdraaien

### Een versie vastzetten (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` toont de huidige gepubliceerde versie.
</Tip>

### Een commit vastzetten (broncode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Om terug te keren naar de nieuwste versie: `git checkout main && git pull`.

## Als je vastloopt

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` bij check-outs van de broncode initialiseert de updater `pnpm` indien nodig automatisch. Als je een pnpm-/corepack-initialisatiefout ziet, installeer `pnpm` dan handmatig (of schakel `corepack` opnieuw in) en voer de update opnieuw uit.
- Raadpleeg: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): statuscontroles na updates.
- [Migreren](/nl/install/migrating): migratiehandleidingen voor hoofdversies.
