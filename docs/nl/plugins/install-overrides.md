---
read_when:
    - Onboarding- of configuratieprocessen testen met een lokaal verpakte Plugin
    - Een pluginpakket verifiëren voordat u het publiceert
    - Een automatische plugininstallatie vervangen door een testartefact
sidebarTitle: Install overrides
summary: Test overschrijvingen van verpakte plugins met installatiestromen tijdens de configuratie
title: Overschrijvingen voor Plugin-installatie
x-i18n:
    generated_at: "2026-07-12T09:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Overschrijvingen voor Plugin-installaties stellen beheerders in staat om Plugin-installaties tijdens de configuratie naar een specifiek npm-pakket of lokaal npm-pack-tarballbestand te verwijzen in plaats van naar de catalogus, gebundelde of standaard npm-bron. Ze zijn uitsluitend bedoeld voor E2E- en pakketvalidatie; normale gebruikers installeren plugins met
[`openclaw plugins install`](/nl/cli/plugins).

<Warning>
Bij overschrijvingen wordt Plugin-code uitgevoerd vanuit de bron die u opgeeft. Gebruik ze alleen in een geïsoleerde statusmap of op een tijdelijke testmachine.
</Warning>

## Omgeving

Overschrijvingen zijn uitgeschakeld tenzij beide variabelen zijn ingesteld:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

De overschrijvingskaart is JSON met Plugin-id's als sleutels. Waarden ondersteunen:

| Voorvoegsel           | Bron                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm:<registry-spec>` | Registerpakketten, exacte versies of tags                                                                             |
| `npm-pack:<path.tgz>` | Lokale tarballbestanden die door `npm pack` zijn gemaakt; relatieve paden worden vanuit de huidige werkmap herleid     |

## Gedrag

Wanneer een configuratieproces een Plugin installeert waarvan de id in de kaart voorkomt, gebruikt OpenClaw de overschrijvingsbron in plaats van de catalogus, gebundelde of standaard npm-bron. Dit geldt voor onboarding en elk ander proces dat het gedeelde installatieprogramma voor plugins tijdens de configuratie gebruikt.

- Overschrijvingen blijven de verwachte Plugin-id afdwingen: een tarballbestand dat aan `codex` is toegewezen, moet een Plugin installeren waarvan de manifest-id `codex` is.
- Overschrijvingen nemen de officiële status van vertrouwde bron niet over. Zelfs wanneer de catalogusvermelding normaal gesproken een pakket van OpenClaw vertegenwoordigt, wordt een overschrijving behandeld als door de beheerder aangeleverde testinvoer.
- `.env`-bestanden in de werkruimte kunnen installatieoverschrijvingen niet inschakelen; beide omgevingsvariabelen staan op de lijst met geblokkeerde dotenv-variabelen voor de werkruimte. Stel ze in via de vertrouwde shell, CI-taak of externe testopdracht waarmee OpenClaw wordt gestart.

## Pakket-E2E

Gebruik een geïsoleerde statusmap, zodat pakketinstallaties en installatierecords uw normale OpenClaw-status niet beïnvloeden:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Controleer het geïnstalleerde pakket in de statusmap:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Voor E2E met een actieve provider haalt u de echte API-sleutel uit een vertrouwde shell of een CI-geheim voordat u de testopdracht start. Druk sleutels niet af; vermeld alleen de bron en of de sleutel aanwezig was.
