---
read_when:
    - OpenClaw bijwerken
    - Iets werkt niet meer na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), plus terugdraaistrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-05-01T11:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
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

`--channel beta` geeft de voorkeur aan beta, maar de runtime valt terug op stable/latest wanneer
de beta-tag ontbreekt of ouder is dan de nieuwste stabiele release. Gebruik `--tag beta`
als je de ruwe npm beta dist-tag wilt voor een eenmalige pakketupdate.

Zie [Ontwikkelkanalen](/nl/install/development-channels) voor kanaalsemantiek.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen wanneer je het installatietype wilt wijzigen. De updater behoudt je
staat, configuratie, referenties en workspace in `~/.openclaw`; hij wijzigt alleen
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

Het kanaal `dev` zorgt voor een git-checkout, bouwt die en installeert de globale CLI
vanuit die checkout. De kanalen `stable` en `beta` gebruiken pakketinstallaties. Als de
Gateway al is geïnstalleerd, ververst `openclaw update` de servicemetadata
en herstart deze, tenzij je `--no-restart` doorgeeft.

## Alternatief: voer de installer opnieuw uit

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Voeg `--no-onboard` toe om onboarding over te slaan. Om een specifiek installatietype via
de installer af te dwingen, geef je `--install-method git --no-onboard` of
`--install-method npm --no-onboard` door.

Als `openclaw update` faalt na de fase waarin het npm-pakket wordt geïnstalleerd, voer dan de
installer opnieuw uit. De installer roept de oude updater niet aan; hij voert de globale
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

Wanneer `openclaw update` een globale npm-installatie beheert, installeert het het doel eerst in
een tijdelijke npm-prefix, verifieert het de verpakte `dist`-inventaris en wisselt het daarna
de schone pakketboom om naar de echte globale prefix. Dat voorkomt dat npm een
nieuw pakket over verouderde bestanden uit het oude pakket heen legt. Als de installatieopdracht faalt,
probeert OpenClaw het één keer opnieuw met `--omit=optional`. Die nieuwe poging helpt hosts waarop native
optionele afhankelijkheden niet kunnen compileren, terwijl de oorspronkelijke fout zichtbaar blijft
als de fallback ook faalt.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Geavanceerde npm-installatieonderwerpen

<AccordionGroup>
  <Accordion title="Alleen-lezen pakketboom">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketdirectory schrijfbaar is voor de huidige gebruiker. Gebundelde runtime-afhankelijkheden van plugins worden in plaats daarvan klaargezet in een schrijfbare runtimedirectory, in plaats van de pakketboom te wijzigen. Dit voorkomt dat `openclaw update` botst met een draaiende Gateway of lokale agent die tijdens dezelfde installatie plugin-afhankelijkheden herstelt.

    Sommige Linux-npm-configuraties installeren globale pakketten onder directories die eigendom zijn van root, zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling via hetzelfde externe stagingpad.

  </Accordion>
  <Accordion title="Versterkte systemd-units">
    Stel een schrijfbare stagedirectory in die is opgenomen in `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` accepteert ook een padlijst. OpenClaw lost gebundelde runtime-afhankelijkheden van plugins van links naar rechts op over de vermelde roots, behandelt eerdere roots als alleen-lezen vooraf geïnstalleerde lagen en installeert of herstelt alleen in de laatste schrijfbare root:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Als `OPENCLAW_PLUGIN_STAGE_DIR` niet is ingesteld, gebruikt OpenClaw `$STATE_DIRECTORY` wanneer systemd die levert, en valt daarna terug op `~/.openclaw/plugin-runtime-deps`. De herstelstap behandelt die stage als een door OpenClaw beheerde lokale pakketroot en negeert de npm-prefix en globale instellingen van de gebruiker, zodat npm-configuratie voor globale installatie gebundelde plugin-afhankelijkheden niet omleidt naar `~/node_modules` of de globale pakketboom.

  </Accordion>
  <Accordion title="Schijfruimtevoorcontrole">
    Vóór pakketupdates en herstel van gebundelde runtime-afhankelijkheden probeert OpenClaw naar beste vermogen een schijfruimtecontrole uit te voeren voor het doelvolume. Weinig ruimte levert een waarschuwing op met het gecontroleerde pad, maar blokkeert de update niet, omdat bestandssysteemquota, snapshots en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke npm-installatie, kopie en verificatie na installatie blijven leidend.
  </Accordion>
  <Accordion title="Gebundelde runtime-afhankelijkheden van plugins">
    Verpakte installaties houden gebundelde runtime-afhankelijkheden van plugins buiten de alleen-lezen pakketboom. Bij het opstarten en tijdens `openclaw doctor --fix` herstelt OpenClaw runtime-afhankelijkheden alleen voor gebundelde plugins die actief zijn in de configuratie, actief zijn via legacy kanaalconfiguratie of zijn ingeschakeld door hun gebundelde manifeststandaard. Alleen opgeslagen kanaal-authenticatiestatus activeert geen herstel van runtime-afhankelijkheden bij het opstarten van de Gateway.

    Expliciet uitschakelen wint. Een uitgeschakelde plugin of kanaal laat zijn runtime-afhankelijkheden niet herstellen alleen omdat het in het pakket bestaat. Externe plugins en aangepaste laadpaden blijven `openclaw plugins install` of `openclaw plugins update` gebruiken.

  </Accordion>
</AccordionGroup>

## Automatische updater

De automatische updater staat standaard uit. Schakel deze in via `~/.openclaw/openclaw.json`:

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

| Kanaal   | Gedrag                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wacht `stableDelayHours` en past daarna toe met deterministische jitter over `stableJitterHours` (gespreide uitrol). |
| `beta`   | Controleert elke `betaCheckIntervalHours` (standaard: elk uur) en past onmiddellijk toe.                              |
| `dev`    | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                    |

De Gateway logt ook een updatehint bij het opstarten (uitschakelen met `update.checkOnStart: false`).
Voor downgrade of incidentherstel stel je `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Updatehints bij het opstarten kunnen nog steeds worden uitgevoerd, tenzij `update.checkOnStart` ook is uitgeschakeld.

Pakketbeheerupdates die via de live Gateway control-plane-handler worden aangevraagd,
forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown. Dat
voorkomt dat een oud proces in het geheugen lang genoeg blijft bestaan om lazy-loaded chunks
te laden uit een pakketboom die al is vervangen. Shell `openclaw update`
blijft het voorkeursproces voor bewaakte installaties, omdat het de service rond de update kan stoppen en
herstarten.

## Na het updaten

<Steps>

### Voer doctor uit

```bash
openclaw doctor
```

Migreert configuratie, controleert DM-beleid en controleert de gezondheid van de Gateway. Details: [Doctor](/nl/gateway/doctor)

### Herstart de Gateway

```bash
openclaw gateway restart
```

### Verifiëren

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

### Zet een commit vast (broncode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Om terug te keren naar de nieuwste versie: `git checkout main && git pull`.

## Als je vastloopt

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` op broncode-checkouts bootstrappt de updater `pnpm` automatisch wanneer dat nodig is. Als je een pnpm/corepack-bootstrapfout ziet, installeer dan `pnpm` handmatig (of schakel `corepack` opnieuw in) en voer de update opnieuw uit.
- Controleer: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontroles na updates.
- [Migreren](/nl/install/migrating): migratiegidsen voor hoofdversies.
