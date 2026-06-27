---
read_when:
    - Onboarding- of setupflows testen met een lokaal ingepakte plugin
    - Een Plugin-pakket verifiëren vóór publicatie
    - Een automatische Plugin-installatie vervangen door een testartefact
sidebarTitle: Install overrides
summary: Test verpakte Plugin-overschrijvingen met installatiestromen tijdens de setup
title: Plugin-installatie-overschrijvingen
x-i18n:
    generated_at: "2026-06-27T17:54:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin-installatie-overschrijvingen laten maintainers Plugin-installaties tijdens de setup testen tegen
een specifiek npm-pakket of een lokale npm-pack-tarball. Ze zijn alleen bedoeld voor E2E- en pakketvalidatie.
Normale gebruikers moeten plugins installeren met
[`openclaw plugins install`](/nl/cli/plugins).

<Warning>
Overschrijvingen voeren Plugin-code uit vanaf de bron die je opgeeft. Gebruik ze alleen in een
geïsoleerde state-directory of een tijdelijke testmachine.
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

De overschrijvingsmap is JSON met plugin-id's als sleutels. Waarden ondersteunen:

- `npm:<registry-spec>` voor registry-pakketten en exacte versies of tags
- `npm-pack:<path.tgz>` voor lokale tarballs die zijn geproduceerd door `npm pack`

Relatieve `npm-pack:`-paden worden opgelost vanaf de huidige werkdirectory.

## Gedrag

Wanneer een setup-flow vraagt om een Plugin te installeren waarvan de id in de map voorkomt,
gebruikt OpenClaw de overschrijvingsbron in plaats van de catalogus-, meegeleverde of standaard
npm-bron. Dit geldt voor onboarding en andere flows die de gedeelde Plugin-installer voor setup gebruiken.

Overschrijvingen blijven de verwachte plugin-id afdwingen. Een tarball die is toegewezen aan `codex`
moet een Plugin installeren waarvan de manifest-id `codex` is.

Overschrijvingen erven geen officiële status als vertrouwde bron. Zelfs wanneer de catalogusvermelding
normaal gesproken een pakket vertegenwoordigt dat eigendom is van OpenClaw, wordt een overschrijving behandeld als
door de operator aangeleverde testinput.

Workspace-`.env`-bestanden kunnen installatie-overschrijvingen niet inschakelen. Stel deze variabelen in in
de vertrouwde shell, CI-job of externe testopdracht die OpenClaw start.

## Pakket-E2E

Gebruik een geïsoleerde state-directory zodat pakketinstallaties en installatierecords je normale
OpenClaw-state niet raken:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Controleer het geïnstalleerde pakket onder de state-directory:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Voor live provider-E2E laad je de echte API-sleutel vanuit een vertrouwde shell of CI-secret
voordat je de testopdracht start. Druk sleutels niet af; rapporteer alleen de bron en
of de sleutel aanwezig was.
