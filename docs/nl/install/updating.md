---
read_when:
    - OpenClaw bijwerken
    - Iets werkt niet meer na een update
summary: OpenClaw veilig bijwerken (globale installatie of broncode), plus rollbackstrategie
title: Bijwerken
x-i18n:
    generated_at: "2026-04-29T22:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Houd OpenClaw up-to-date.

## Aanbevolen: `openclaw update`

De snelste manier om bij te werken. Deze detecteert je installatietype (npm of git), haalt de nieuwste versie op, voert `openclaw doctor` uit en herstart de Gateway.

```bash
openclaw update
```

Om van kanaal te wisselen of een specifieke versie te gebruiken:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # voorbeeldweergave zonder toe te passen
```

`--channel beta` geeft de voorkeur aan beta, maar de runtime valt terug op stable/latest wanneer
de beta-tag ontbreekt of ouder is dan de nieuwste stabiele release. Gebruik `--tag beta`
als je de ruwe npm beta dist-tag wilt voor een eenmalige pakketupdate.

Zie [Ontwikkelkanalen](/nl/install/development-channels) voor kanaalsemantiek.

## Wisselen tussen npm- en git-installaties

Gebruik kanalen wanneer je het installatietype wilt wijzigen. De updater behoudt je
status, configuratie, inloggegevens en werkruimte in `~/.openclaw`; hij wijzigt alleen
welke OpenClaw-code-installatie de CLI en Gateway gebruiken.

```bash
# npm-pakketinstallatie -> bewerkbare git-checkout
openclaw update --channel dev

# git-checkout -> npm-pakketinstallatie
openclaw update --channel stable
```

Voer eerst uit met `--dry-run` om de exacte wissel van installatiemodus vooraf te bekijken:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Het `dev`-kanaal zorgt voor een git-checkout, bouwt die en installeert de globale CLI
vanuit die checkout. De kanalen `stable` en `beta` gebruiken pakketinstallaties. Als de
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

Wanneer `openclaw update` een globale npm-installatie beheert, installeert deze het doel eerst in
een tijdelijke npm-prefix, verifieert de verpakte `dist`-inventaris en wisselt daarna
de schone pakketboom naar de echte globale prefix. Dat voorkomt dat npm een
nieuw pakket over verouderde bestanden uit het oude pakket heen legt. Als de installatieopdracht mislukt,
probeert OpenClaw het een keer opnieuw met `--omit=optional`. Die nieuwe poging helpt hosts waarop native
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
  <Accordion title="Alleen-lezen pakketboom">
    OpenClaw behandelt verpakte globale installaties tijdens runtime als alleen-lezen, zelfs wanneer de globale pakketmap beschrijfbaar is voor de huidige gebruiker. Gebundelde Plugin-runtimeafhankelijkheden worden in plaats daarvan in een beschrijfbare runtimemap klaargezet, zonder de pakketboom te wijzigen. Dit voorkomt dat `openclaw update` botst met een draaiende Gateway of lokale agent die tijdens dezelfde installatie Plugin-afhankelijkheden repareert.

    Sommige Linux-npm-installaties plaatsen globale pakketten onder mappen die eigendom zijn van root, zoals `/usr/lib/node_modules/openclaw`. OpenClaw ondersteunt die indeling via hetzelfde externe stagingpad.

  </Accordion>
  <Accordion title="Verharde systemd-units">
    Stel een beschrijfbare stagingmap in die is opgenomen in `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` accepteert ook een lijst met paden. OpenClaw lost gebundelde Plugin-runtimeafhankelijkheden van links naar rechts op over de vermelde roots, behandelt eerdere roots als alleen-lezen vooraf geinstalleerde lagen en installeert of repareert alleen in de laatste beschrijfbare root:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Als `OPENCLAW_PLUGIN_STAGE_DIR` niet is ingesteld, gebruikt OpenClaw `$STATE_DIRECTORY` wanneer systemd die levert, en valt daarna terug op `~/.openclaw/plugin-runtime-deps`. De reparatiestap behandelt die stage als een lokale pakketroot die eigendom is van OpenClaw en negeert de npm-prefix en globale instellingen van de gebruiker, zodat globale npm-installatieconfiguratie gebundelde Plugin-afhankelijkheden niet omleidt naar `~/node_modules` of de globale pakketboom.

  </Accordion>
  <Accordion title="Voorcontrole op schijfruimte">
    Voor pakketupdates en reparaties van gebundelde runtimeafhankelijkheden probeert OpenClaw naar beste kunnen de schijfruimte voor het doelvolume te controleren. Weinig ruimte levert een waarschuwing op met het gecontroleerde pad, maar blokkeert de update niet omdat bestandssysteemquota, snapshots en netwerkvolumes na de controle kunnen veranderen. De daadwerkelijke npm-installatie, kopie en verificatie na installatie blijven leidend.
  </Accordion>
  <Accordion title="Gebundelde Plugin-runtimeafhankelijkheden">
    Verpakte installaties houden gebundelde Plugin-runtimeafhankelijkheden buiten de alleen-lezen pakketboom. Bij het opstarten en tijdens `openclaw doctor --fix` repareert OpenClaw runtimeafhankelijkheden alleen voor gebundelde plugins die actief zijn in de configuratie, actief zijn via verouderde kanaalconfiguratie of ingeschakeld zijn door hun standaardinstelling in het gebundelde manifest. Alleen opgeslagen kanaal-authenticatiestatus activeert geen reparatie van runtimeafhankelijkheden bij het opstarten van de Gateway.

    Expliciet uitschakelen heeft voorrang. Een uitgeschakelde Plugin of uitgeschakeld kanaal krijgt zijn runtimeafhankelijkheden niet gerepareerd alleen omdat het in het pakket bestaat. Externe plugins en aangepaste laadpaden blijven `openclaw plugins install` of `openclaw plugins update` gebruiken.

  </Accordion>
</AccordionGroup>

## Automatische updater

De automatische updater staat standaard uit. Schakel deze in `~/.openclaw/openclaw.json` in:

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

| Kanaal   | Gedrag                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Wacht `stableDelayHours` en past daarna toe met deterministische jitter over `stableJitterHours` (gespreide uitrol). |
| `beta`   | Controleert elke `betaCheckIntervalHours` (standaard: elk uur) en past onmiddellijk toe.                              |
| `dev`    | Geen automatische toepassing. Gebruik `openclaw update` handmatig.                                                           |

De Gateway logt ook een updatetip bij het opstarten (uitschakelen met `update.checkOnStart: false`).
Voor downgrade of herstel na incidenten stel je `OPENCLAW_NO_AUTO_UPDATE=1` in de Gateway-omgeving in om automatische toepassingen te blokkeren, zelfs wanneer `update.auto.enabled` is geconfigureerd. Updatetips bij het opstarten kunnen nog steeds worden uitgevoerd, tenzij `update.checkOnStart` ook is uitgeschakeld.

## Na het bijwerken

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

### Zet een commit vast (bron)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Om terug te keren naar de nieuwste versie: `git checkout main && git pull`.

## Als je vastloopt

- Voer `openclaw doctor` opnieuw uit en lees de uitvoer zorgvuldig.
- Voor `openclaw update --channel dev` op broncheckouts bootstrappt de updater `pnpm` automatisch wanneer dat nodig is. Als je een pnpm/corepack-bootstrapfout ziet, installeer `pnpm` dan handmatig (of schakel `corepack` opnieuw in) en voer de update opnieuw uit.
- Controleer: [Probleemoplossing](/nl/gateway/troubleshooting)
- Vraag het in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Gerelateerd

- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontroles na updates.
- [Migreren](/nl/install/migrating): migratiehandleidingen voor hoofdversies.
