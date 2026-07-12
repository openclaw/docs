---
read_when:
    - Mantis Slack-desktop-QA uitvoeren vanuit GitHub of lokaal
    - Trage Mantis-runs in de Slack-desktopapp debuggen
    - Kiezen tussen bronmodus, vooraf gehydrateerde modus of warme-lease-modus
    - Screenshot- en videobewijs bij een PR plaatsen
summary: 'Draaiboek voor operators voor Mantis Slack-desktop-QA: GitHub-dispatch, lokale CLI, warme VNC-leases, hydratatiemodi, interpretatie van timing, artefacten en foutafhandeling.'
title: Runbook voor Mantis Slack-desktop
x-i18n:
    generated_at: "2026-07-12T08:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack-desktop-QA is het real-UI-traject voor bugs in de Slack-klasse waarvoor een
Linux-desktop, VNC-herstel, Slack Web, een echte OpenClaw Gateway, schermafbeeldingen,
video's en een bewijscommentaar bij een PR nodig zijn. Gebruik dit wanneer eenheidstests of het headless
live-traject voor Slack de bug niet kunnen aantonen.

## Opslagmodel

Mantis gebruikt drie opslaglagen:

- **Provider-image** - beheerd door Crabbox en opgeslagen in het cloudprovideraccount.
  Bevat machinefunctionaliteit (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, systeemeigen buildtools) en lege cachemappen.
- **Status van warme lease** - beheerd door de huidige operatorsessie. Kan een
  aangemeld browserprofiel, `/var/cache/crabbox/pnpm` en een voorbereide broncodecheckout
  bevatten zolang de lease actief is.
- **Mantis-artefacten** - beheerd door de OpenClaw-run. Bevinden zich onder
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions uploadt ze en de Mantis
  GitHub App plaatst het bewijs rechtstreeks in een commentaar bij de PR.

Neem nooit geheimen, browsercookies, Slack-aanmeldstatus, repositorycheckouts,
`node_modules` of `dist/` op in een provider-image.

## GitHub-dispatch

Voer de workflow uit vanaf `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` is beperkt omdat de workflow live-aanmeldgegevens gebruikt: deze
moet verwijzen naar de huidige afstamming van `main`, een releasetag of de head van een open PR in
`openclaw/openclaw`.

De workflow produceert:

- geüpload artefact `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- rechtstreeks PR-commentaar van de Mantis GitHub App
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- externe logboeken: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Het PR-commentaar wordt ter plaatse bijgewerkt via de verborgen markering `<!-- mantis-slack-desktop-smoke -->`.

## Lokale CLI

Koud bewijs vanuit de broncode:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Behoud de VM voor VNC-herstel:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Open VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Hergebruik een warme lease:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte externe werkruimte al
`node_modules` en een gebouwde `dist/` bevat; anders stopt Mantis uit veiligheidsoverwegingen.

Toon de systeemeigen Slack-goedkeuringsinterface aan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` en `--gateway-setup` sluiten elkaar uit. Deze optie voert
de expliciet ingeschakelde scenario's `slack-approval-exec-native` en `slack-approval-plugin-native`
uit, tenzij u expliciet een goedkeuringscontrolepunt als `--scenario` opgeeft; andere
Slack-scenario's worden geweigerd voordat de VM wordt gestart. De Slack-QA-runner schrijft
elk JSON-bestand voor een controlepunt op basis van het echte Slack-API-bericht dat deze heeft waargenomen, waarna
de externe watcher dat bericht rendert naar
`approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png`. De run mislukt als een
JSON-controlepunt, berichtbewijs, bevestigings-JSON of gerenderde schermafbeelding ontbreekt
of leeg is.

Koude GitHub Actions-leases bevatten geen Slack Web-cookies, waardoor de browseropname
op het Slack-aanmeldscherm kan uitkomen. Vertrouw voor bewijs van goedkeuringscontrolepunten op de
gerenderde controlepuntafbeeldingen en Slack-QA-artefacten in plaats van op
`slack-desktop-smoke.png`. Gebruik alleen een behouden warme lease met een handmatig
aangemeld Slack Web-profiel wanneer de browserschermafbeelding zelf
Slack Web moet tonen.

## Hydratatiemodi

| Modus         | Gebruiken wanneer                              | Extern gedrag                                                                         | Afweging                                                      |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `source`      | Normaal PR-bewijs, koude machines, CI          | Voert `pnpm install --frozen-lockfile --prefer-offline` en `pnpm build` uit in de VM | Langzaamst, sterkste bewijs vanuit de broncodecheckout         |
| `prehydrated` | U hebt bewust een hergebruikte lease voorbereid | Vereist bestaande `node_modules` en `dist/`; slaat installatie/build over             | Snel, maar alleen geldig voor door de operator beheerde warme leases |

GitHub Actions bereidt de kandidaatcheckout altijd voor voordat de VM-run begint. De
pnpm-store wordt gecachet op basis van het besturingssysteem, de Node-versie en het lockbestand. De VM-run met `source`
hergebruikt ook `/var/cache/crabbox/pnpm` wanneer deze aanwezig is.

## Interpretatie van tijdmetingen

`mantis-slack-desktop-smoke-report.md` bevat tijdmetingen per fase:

- `crabbox.warmup` - opstarten van de cloudprovider, gereedheid van desktop/browser en SSH.
- `crabbox.inspect` - opzoeken van leasemetadata.
- `credentials.prepare` - verkrijgen van een lease voor Convex-aanmeldgegevens.
- `crabbox.remote_run` - synchronisatie, starten van de browser, installatie/build van OpenClaw of
  hydratatievalidatie, starten van de Gateway, schermafbeelding en video-opname.
- `artifacts.copy` - terugsynchroniseren vanuit de VM met rsync.

`crabbox.remote_run` kan `accepted` tonen wanneer Crabbox een externe status anders dan nul
retourneert, maar Mantis metadata heeft gekopieerd waaruit blijkt dat de configuratie van de OpenClaw Gateway
is voltooid of dat de Slack-QA-opdracht zelf met succes is afgesloten. Beschouw
`accepted` als geslaagd-met-uitleg, niet als een mislukt scenario.

Als een run traag is:

- Opwarming domineert: neem vereisten vooraf op of promoveer een betere Crabbox-provider-image.
- `remote_run` domineert bij `source`: gebruik een warme lease, verbeter het hergebruik van de pnpm-store
  of verplaats machinevereisten naar de provider-image.
- `remote_run` domineert bij `prehydrated`: de externe werkruimte was niet
  daadwerkelijk gereed, of de configuratie van de Gateway/browser/Slack is traag.
- Het kopiëren van artefacten domineert: controleer de videogrootte en de inhoud van de artefactmap.

## Bewijschecklist

Een goed PR-commentaar toont:

- scenario-id en kandidaat-SHA
- URL van de GitHub Actions-run en artefact-URL
- rechtstreeks opgenomen schermafbeelding van het goedkeuringscontrolepunt, of een Slack Web-schermafbeelding van een
  aangemelde warme lease
- rechtstreeks opgenomen bewegende voorvertoning, indien beschikbaar
- koppelingen naar de volledige MP4 en de ingekorte MP4
- status geslaagd/mislukt en het overzicht van de tijdmetingen uit het rapport

Commit geen schermafbeeldingen of video's naar de repository. Bewaar ze in GitHub
Actions-artefacten of in het PR-commentaar.

## Afhandeling van fouten

Als de workflow vóór de VM-run mislukt, controleer dan eerst de Actions-taak.
Typische oorzaken: niet-vertrouwde `candidate_ref`, ontbrekende omgevingsgeheimen of een
mislukte installatie/build van de kandidaat.

Als de VM-run mislukt maar schermafbeeldingen zijn teruggekopieerd, controleer dan:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Als de lease door de run is behouden, opent u VNC met de opdracht `crabbox vnc ...`
uit het rapport en stopt u daarna de lease:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Als de Slack-aanmelding is verlopen, herstelt u deze via VNC op een behouden lease en voert u de run opnieuw uit met
`--lease-id`. Neem dat browserprofiel niet op in een provider-image.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation)
- [Slack-kanaal](/nl/channels/slack)
- [Testen](/nl/help/testing)
