---
read_when:
    - OpenClaw bijwerken
    - Er gaat iets mis na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), plus terugdraaistrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-05-04T07:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
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
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` accepteert geen `--verbose`. Gebruik voor updatediagnostiek
`--dry-run` om een voorbeeld van de geplande acties te bekijken, `--json` voor gestructureerde resultaten, of
`openclaw update status --json` om de kanaal- en beschikbaarheidsstatus te bekijken. Het
installatieprogramma heeft een eigen `--verbose`-vlag, maar die vlag maakt geen deel uit van
`openclaw update`.

`--channel beta` geeft de voorkeur aan beta, maar de runtime valt terug op stable/latest wanneer
de betatag ontbreekt of ouder is dan de nieuwste stabiele release. Gebruik `--tag beta`
als je de ruwe npm-beta-dist-tag wilt voor een eenmalige pakketupdate.

Zie [Ontwikkelingskanalen](/nl/install/development-channels) voor kanaalsemantiek.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen wanneer je het installatietype wilt wijzigen. De updater behoudt je
status, configuratie, referenties en werkruimte in `~/.openclaw`; hij wijzigt alleen
welke OpenClaw-code-installatie de CLI en Gateway gebruiken.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Voer eerst uit met `--dry-run` om de exacte wijziging van installatiemodus te bekijken:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Het `dev`-kanaal zorgt voor een git-checkout, bouwt die en installeert de globale CLI
vanuit die checkout. De `stable`- en `beta`-kanalen gebruiken pakketinstallaties. Als de
Gateway al is geinstalleerd, vernieuwt `openclaw update` de servicemetadata
en herstart deze, tenzij je `--no-restart` meegeeft.

## Alternatief: voer het installatieprogramma opnieuw uit

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Voeg `--no-onboard` toe om onboarding over te slaan. Om een specifiek installatietype via
het installatieprogramma af te dwingen, geef je `--install-method git --no-onboard` of
`--install-method npm --no-onboard` mee.

Als `openclaw update` mislukt na de npm-pakketinstallatiefase, voer dan het
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

Gebruik bij voorkeur `openclaw update` voor beheerde installaties, omdat dit de
pakketwisseling kan coordineren met de actieve Gateway-service. Als je handmatig bijwerkt terwijl een
beheerde Gateway actief is, herstart de Gateway dan direct nadat de pakketbeheerder
klaar is, zodat het oude proces niet blijft serveren vanuit vervangen pakketbestanden.

Wanneer `openclaw update` een globale npm-installatie beheert, installeert het het doel eerst in
een tijdelijke npm-prefix, verifieert het de verpakte `dist`-inventaris en wisselt het daarna
de schone pakketstructuur in de echte globale prefix. Zo wordt voorkomen dat npm een
nieuw pakket over verouderde bestanden uit het oude pakket heen legt. Als de installatieopdracht mislukt,
probeert OpenClaw het eenmaal opnieuw met `--omit=optional`. Die nieuwe poging helpt hosts waarop native
optionele afhankelijkheden niet kunnen compileren, terwijl de oorspronkelijke fout zichtbaar blijft
als de fallback ook mislukt.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Geavanceerde npm-installatieonderwerpen

<AccordionGroup>
  <Accordion title="Alleen-lezen pakketstructuur">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketmap schrijfbaar is voor de huidige gebruiker. Plugin-pakketinstallaties staan in door OpenClaw beheerde npm/git-roots onder de gebruikersconfiguratiemap, en het opstarten van de Gateway wijzigt de OpenClaw-pakketstructuur niet.

    Sommige Linux-npm-configuraties installeren globale pakketten onder root-beheerde mappen zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling omdat Plugin-installatie- en updateopdrachten buiten die globale pakketmap schrijven.

  </Accordion>
  <Accordion title="Versterkte systemd-units">
    Geef OpenClaw schrijfrechten op zijn configuratie- en statusroots, zodat expliciete Plugin-installaties, Plugin-updates en doctor-opruiming hun wijzigingen kunnen bewaren:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Schijfruimtecontrole vooraf">
    Voor pakketupdates en expliciete Plugin-installaties probeert OpenClaw een best-effort schijfruimtecontrole voor het doelvolume uit te voeren. Weinig ruimte levert een waarschuwing op met het gecontroleerde pad, maar blokkeert de update niet omdat bestandssysteemquota, snapshots en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke pakketbeheerinstallatie en verificatie na installatie blijven gezaghebbend.
  </Accordion>
</AccordionGroup>

## Auto-updater

De auto-updater staat standaard uit. Schakel deze in `~/.openclaw/openclaw.json` in:

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

| Kanaal   | Gedrag                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wacht `stableDelayHours` en past daarna toe met deterministische jitter over `stableJitterHours` (gespreide uitrol).       |
| `beta`   | Controleert elke `betaCheckIntervalHours` (standaard: elk uur) en past onmiddellijk toe.                                  |
| `dev`    | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                        |

De Gateway logt ook een updatehint bij het opstarten (uitschakelen met `update.checkOnStart: false`).
Voor downgrade of herstel na een incident stel je `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Opstart-updatehints kunnen nog steeds worden uitgevoerd, tenzij `update.checkOnStart` ook is uitgeschakeld.

Pakketbeheerupdates die via de live Gateway-control-plane-handler worden aangevraagd,
forceren na de pakketwisseling een niet-uitgestelde updateherstart zonder cooldown. Dat
voorkomt dat een oud in-memory proces lang genoeg blijft bestaan om chunks lazy te laden
uit een pakketstructuur die al is vervangen. Shell-`openclaw update`
blijft het voorkeursproces voor beheerde installaties, omdat het de service rond de update kan stoppen en
herstarten.

## Na het updaten

<Steps>

### Voer doctor uit

```bash
openclaw doctor
```

Migreert configuratie, controleert DM-beleid en controleert de Gateway-gezondheid. Details: [Doctor](/nl/gateway/doctor)

### Herstart de Gateway

```bash
openclaw gateway restart
```

### Verifieer

```bash
openclaw health
```

</Steps>

## Rollback

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

## Als je vastloopt

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` op source-checkouts bootstrapt de updater `pnpm` automatisch wanneer dat nodig is. Als je een pnpm/corepack-bootstrapfout ziet, installeer `pnpm` dan handmatig (of schakel `corepack` opnieuw in) en voer de update opnieuw uit.
- Controleer: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontroles na updates.
- [Migreren](/nl/install/migrating): migratiehandleidingen voor hoofdversies.
