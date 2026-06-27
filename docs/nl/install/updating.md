---
read_when:
    - OpenClaw bijwerken
    - Er gaat iets mis na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), plus rollbackstrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-06-27T17:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Houd OpenClaw up-to-date.

## Aanbevolen: `openclaw update`

De snelste manier om te updaten. Het detecteert je installatietype (npm of git), haalt de nieuwste versie op, voert `openclaw doctor` uit en herstart de Gateway.

```bash
openclaw update
```

Om van kanaal te wisselen of een specifieke versie te gebruiken:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` accepteert geen `--verbose`. Gebruik voor updatediagnostiek
`--dry-run` om de geplande acties vooraf te bekijken, `--json` voor gestructureerde resultaten, of
`openclaw update status --json` om de kanaal- en beschikbaarheidsstatus te inspecteren. Het
installatieprogramma heeft een eigen `--verbose`-vlag, maar die vlag maakt geen deel uit van
`openclaw update`.

`--channel beta` geeft de voorkeur aan beta, maar de runtime valt terug op stable/latest wanneer
de beta-tag ontbreekt of ouder is dan de nieuwste stabiele release. Gebruik `--tag beta`
als je de ruwe npm beta dist-tag wilt voor een eenmalige pakketupdate.

Gebruik `--channel dev` voor een permanente, bewegende GitHub `main`-checkout. Voor pakketupdates
wordt `--tag main` voor een enkele run gekoppeld aan `github:openclaw/openclaw#main`, en
GitHub/git-bronspecificaties worden in een tijdelijke tarball verpakt voordat de gefaseerde
npm-installatie plaatsvindt.

Voor beheerde plugins is terugval van het beta-kanaal een waarschuwing: de core-update kan
nog steeds slagen terwijl een plugin de vastgelegde standaard-/nieuwste release gebruikt omdat er geen
plugin-beta beschikbaar is.

Zie [Ontwikkelingskanalen](/nl/install/development-channels) voor kanaalsemantiek.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen wanneer je het installatietype wilt wijzigen. De updater behoudt je
state, config, inloggegevens en workspace in `~/.openclaw`; hij wijzigt alleen
welke OpenClaw-code-installatie de CLI en Gateway gebruiken.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Voer eerst uit met `--dry-run` om de exacte installatiemoduswissel vooraf te bekijken:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Het `dev`-kanaal zorgt voor een git-checkout, bouwt die en installeert de globale CLI
vanuit die checkout. De kanalen `stable` en `beta` gebruiken pakketinstallaties. Als de
Gateway al is geinstalleerd, vernieuwt `openclaw update` de servicemetadata
en herstart deze, tenzij je `--no-restart` meegeeft.

Voor pakketinstallaties met een beheerde Gateway-service richt `openclaw update` zich op
de pakketroot die door die service wordt gebruikt. Als de shellopdracht `openclaw`
uit een andere installatie komt, print de updater beide roots en het Node-pad van de beheerde service. De pakketupdate gebruikt de pakketbeheerder die eigenaar is van de service-root
en controleert de Node van de beheerde service tegen de engine van de doelrelease
voordat het pakket wordt vervangen.

## Alternatief: voer het installatieprogramma opnieuw uit

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Voeg `--no-onboard` toe om onboarding over te slaan. Om een specifiek installatietype via
het installatieprogramma af te dwingen, geef je `--install-method git --no-onboard` of
`--install-method npm --no-onboard` mee.

Als `openclaw update` faalt na de npm-pakketinstallatiefase, voer dan het
installatieprogramma opnieuw uit. Het installatieprogramma roept de oude updater niet aan; het voert de globale
pakketinstallatie rechtstreeks uit en kan een gedeeltelijk bijgewerkte npm-installatie herstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Om het herstel vast te zetten op een specifieke versie of dist-tag, voeg je `--version` toe:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatief: handmatig npm, pnpm of bun

```bash
npm i -g openclaw@latest
```

Geef de voorkeur aan `openclaw update` voor begeleide installaties omdat het de
pakketwissel kan coordineren met de draaiende Gateway-service. Als je handmatig updatet op een
begeleide installatie, stop dan de beheerde Gateway voordat de pakketbeheerder start.
Pakketbeheerders vervangen bestanden ter plaatse, en een draaiende Gateway kan anders proberen
core- of plugin-bestanden te laden terwijl de pakketstructuur tijdelijk half verwisseld is.
Herstart de Gateway nadat de pakketbeheerder klaar is, zodat de service de
nieuwe installatie oppakt.

Voor een Linux-systeembrede installatie die eigendom is van root: als `openclaw update` faalt met
`EACCES` en je herstelt met systeem-npm, houd de Gateway dan gestopt tijdens de
handmatige pakketvervanging. Gebruik dezelfde `openclaw`-profielvlaggen of omgeving
die je normaal voor die Gateway gebruikt. Vervang `/usr/bin/npm` door de systeem-npm
die eigenaar is van de root-owned globale prefix op je host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Verifieer daarna de service:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wanneer `openclaw update` een globale npm-installatie beheert, installeert het eerst het doel in
een tijdelijke npm-prefix, verifieert de verpakte `dist`-inventaris en wisselt daarna
de schone pakketstructuur naar de echte globale prefix. Dat voorkomt dat npm een
nieuw pakket over oude bestanden van het vorige pakket heen legt. Als de installatieopdracht faalt,
probeert OpenClaw het eenmaal opnieuw met `--omit=optional`. Die retry helpt hosts waar native
optionele afhankelijkheden niet kunnen compileren, terwijl de oorspronkelijke fout zichtbaar blijft
als de fallback ook faalt.

Door OpenClaw beheerde npm-update- en plugin-update-opdrachten wissen ook de npm
`min-release-age`-quarantaine voor het child-npm-proces. npm kan dat beleid rapporteren als
een afgeleide `before`-grens; beide zijn nuttig voor algemene supply-chain-quarantainebeleidsregels,
maar een expliciete OpenClaw-update betekent: "installeer de geselecteerde
OpenClaw-release nu."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Geavanceerde npm-installatieonderwerpen

<AccordionGroup>
  <Accordion title="Alleen-lezen pakketstructuur">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketdirectory schrijfbaar is voor de huidige gebruiker. Plugin-pakketinstallaties staan in door OpenClaw beheerde npm/git-roots onder de gebruikersconfiguratiedirectory, en het starten van de Gateway wijzigt de OpenClaw-pakketstructuur niet.

    Sommige Linux-npm-configuraties installeren globale pakketten onder directories die eigendom zijn van root, zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling omdat opdrachten voor het installeren/updaten van plugins buiten die globale pakketdirectory schrijven.

  </Accordion>
  <Accordion title="Versterkte systemd-units">
    Geef OpenClaw schrijftoegang tot zijn config-/state-roots zodat expliciete plugin-installaties, plugin-updates en doctor-opruiming hun wijzigingen kunnen opslaan:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Schijfruimte-preflight">
    Voor pakketupdates en expliciete plugin-installaties probeert OpenClaw een best-effort schijfruimtecontrole uit te voeren voor het doelvolume. Weinig ruimte levert een waarschuwing op met het gecontroleerde pad, maar blokkeert de update niet omdat filesystemquota, snapshots en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke pakketbeheerderinstallatie en post-installverificatie blijven leidend.
  </Accordion>
</AccordionGroup>

## Auto-updater

De auto-updater staat standaard uit. Schakel deze in via `~/.openclaw/openclaw.json`:

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

| Kanaal   | Gedrag                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `stable` | Wacht `stableDelayHours` en past daarna toe met deterministische jitter over `stableJitterHours` (gespreide uitrol). |
| `beta`   | Controleert elke `betaCheckIntervalHours` (standaard: elk uur) en past onmiddellijk toe.                          |
| `dev`    | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                |

De Gateway logt bij het opstarten ook een updatehint (uitschakelen met `update.checkOnStart: false`).
Voor downgrade of incidentherstel stel je `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Updatehints bij het opstarten kunnen nog steeds draaien tenzij `update.checkOnStart` ook is uitgeschakeld.

Pakketbeheerderupdates die via de live Gateway-control-plane-handler worden aangevraagd,
vervangen de pakketstructuur niet binnen het draaiende Gateway-proces. Bij beheerde
service-installaties start de Gateway een losgekoppelde overdracht, sluit af en laat het
normale CLI-pad `openclaw update --yes --json` de service stoppen, het
pakket vervangen, servicemetadata vernieuwen, herstarten, de Gateway-versie en
bereikbaarheid verifiëren, en waar mogelijk een geinstalleerde-maar-niet-geladen macOS LaunchAgent herstellen. Als de Gateway die overdracht niet veilig kan uitvoeren, rapporteert `update.run` een
veilige shellopdracht in plaats van de pakketbeheerder in-process uit te voeren.

## Na het updaten

<Steps>

### Voer doctor uit

```bash
openclaw doctor
```

Migreert config, controleert DM-beleid en controleert de Gateway-gezondheid. Details: [Doctor](/nl/gateway/doctor)

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

### Zet een versie vast (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` toont de huidige gepubliceerde versie.
</Tip>

### Zet een commit vast (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Om terug te keren naar de nieuwste versie: `git checkout main && git pull`.

## Als je vastzit

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` op source-checkouts bootstrapt de updater `pnpm` automatisch wanneer dat nodig is. Als je een pnpm/corepack-bootstrapfout ziet, installeer `pnpm` dan handmatig (of schakel `corepack` opnieuw in) en voer de update opnieuw uit.
- Controleer: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontroles na updates.
- [Migreren](/nl/install/migrating): migratiegidsen voor hoofdversies.
