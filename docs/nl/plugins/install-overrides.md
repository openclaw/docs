---
read_when:
    - Onboarding- of configuratieprocessen testen met een lokaal verpakte Plugin
    - Een Plugin-pakket verifiëren voordat het wordt gepubliceerd
    - Een automatische Plugin-installatie vervangen door een testartefact
sidebarTitle: Install overrides
summary: Test verpakte Plugin-overschrijvingen met installatiestromen tijdens configuratie
title: Overschrijvingen voor Plugin-installatie
x-i18n:
    generated_at: "2026-05-11T20:40:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin-installatie-overschrijvingen laten maintainers Plugin-installaties tijdens de setup testen tegen
een specifiek npm-pakket of een lokale npm-pack-tarball. Ze zijn alleen bedoeld
voor E2E- en pakketvalidatie. Gewone gebruikers moeten plugins installeren met
[`openclaw plugins install`](/nl/cli/plugins).

<Warning>
Overschrijvingen voeren Plugin-code uit vanuit de bron die je opgeeft. Gebruik ze
alleen in een geïsoleerde statusmap of op een wegwerp-testmachine.
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

De overschrijvingsmap is JSON met Plugin-ID's als sleutels. Waarden ondersteunen:

- `npm:<registry-spec>` voor registrypakketten en exacte versies of tags
- `npm-pack:<path.tgz>` voor lokale tarballs die door `npm pack` zijn geproduceerd

Relatieve `npm-pack:`-paden worden opgelost vanuit de huidige werkmap.

## Gedrag

Wanneer een setup-flow vraagt om een Plugin te installeren waarvan de ID in de map voorkomt,
gebruikt OpenClaw de overschrijvingsbron in plaats van de catalogus-, gebundelde of standaard
npm-bron. Dit geldt voor onboarding en andere flows die het gedeelde
Plugin-installatieprogramma tijdens de setup gebruiken.

Overschrijvingen handhaven nog steeds de verwachte Plugin-ID. Een tarball die aan `codex`
is gekoppeld, moet een Plugin installeren waarvan de manifest-ID `codex` is.

Overschrijvingen erven geen officiële status als vertrouwde bron. Zelfs wanneer de catalogusvermelding
normaal gesproken een pakket vertegenwoordigt dat eigendom is van OpenClaw, wordt een overschrijving behandeld als
door de operator aangeleverde testinvoer.

Workspace-`.env`-bestanden kunnen installatie-overschrijvingen niet inschakelen. Stel deze variabelen in
in de vertrouwde shell, CI-job of externe testopdracht die OpenClaw start.

## Pakket-E2E

Gebruik een geïsoleerde statusmap zodat pakketinstallaties en installatierecords
je normale OpenClaw-status niet raken:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Controleer het geïnstalleerde pakket onder de statusmap:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Voor live provider-E2E laad je de echte API-sleutel vanuit een vertrouwde shell of CI-secret
voordat je de testopdracht start. Druk geen sleutels af; rapporteer alleen de bron en
of de sleutel aanwezig was.
