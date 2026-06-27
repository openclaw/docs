---
read_when:
    - Mantis Slack-desktop-QA uitvoeren vanuit GitHub of lokaal
    - Trage Mantis Slack-desktopruns debuggen
    - Kiezen tussen bronmodus, voorgehydrateerde modus of warme-lease-modus
    - Screenshot- en videobewijs in een PR plaatsen
summary: 'Operator-runbook voor Mantis Slack-desktop-QA: GitHub-dispatch, lokale CLI, warme VNC-leases, hydrate-modi, timinginterpretatie, artefacten en foutafhandeling.'
title: Mantis Slack-desktop-runbook
x-i18n:
    generated_at: "2026-06-27T17:26:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop-QA is de real-UI-lane voor Slack-klasse bugs die een
Linux-desktop, VNC-redding, Slack Web, een echte OpenClaw-gateway, screenshots,
video's en een PR-bewijscommentaar nodig hebben.

Gebruik dit wanneer unittests of de headless Slack live-lane de bug niet kunnen bewijzen.

## Opslagmodel

Mantis gebruikt drie verschillende opslaglagen:

- Providerimage: eigendom van Crabbox en opgeslagen in het cloudprovideraccount.
  Deze bevat machinecapaciteiten zoals Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, native buildtools en lege cachedirectory's.
- Warme lease-status: eigendom van de huidige operatorsessie. Deze kan een
  ingelogd browserprofiel, `/var/cache/crabbox/pnpm` en een voorbereide source
  checkout bevatten zolang de lease actief is.
- Mantis-artefacten: eigendom van de OpenClaw-run. Ze staan onder
  `.artifacts/qa-e2e/mantis/...`, waarna GitHub Actions ze uploadt en de
  Mantis GitHub App inline bewijs op de PR plaatst.

Plaats nooit geheimen, browsercookies, Slack-inlogstatus, repositorycheckouts,
`node_modules` of `dist/` in een voorgebakken providerimage.

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

Toegestane `candidate_ref`-waarden zijn bewust beperkt omdat de workflow
live-credentials gebruikt: huidige `main`-afkomst, releasetags of een open PR-head
van `openclaw/openclaw`.

De workflow schrijft:

- geüpload artefact: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- inline PR-commentaar van de Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- remote logs zoals `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` en `ffmpeg.log`.

Het PR-commentaar wordt ter plaatse bijgewerkt via de verborgen
`<!-- mantis-slack-desktop-smoke -->`-markering.

## Lokale CLI

Koud source-bewijs:

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

Behoud de VM voor VNC-redding:

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

Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte remote workspace al
`node_modules` en een gebouwde `dist/` heeft. Mantis faalt gesloten als die
ontbreken.

Bewijs native Slack-goedkeurings-UI:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Goedkeuringscheckpointmodus sluit `--gateway-setup` wederzijds uit. Deze voert
de opt-in `slack-approval-exec-native`- en `slack-approval-plugin-native`-
scenario's uit, tenzij je expliciete goedkeuringscheckpoint-`--scenario`-flags
meegeeft; andere Slack-scenario's worden afgewezen voordat de VM start. De
Slack QA-runner schrijft elk checkpoint-JSON-bestand vanuit het echte Slack API-
bericht dat deze heeft waargenomen, waarna de remote watcher die berichtsnapshot rendert naar
`approval-checkpoints/<scenario>-pending.png` en
`approval-checkpoints/<scenario>-resolved.png`. De run faalt als een checkpoint-
JSON, berichtbewijs, ack-JSON of gerenderde screenshot ontbreekt of leeg is.

Koude GitHub Actions-leases hebben geen Slack Web-cookies, dus hun browsercapture
kan op Slack-aanmelding terechtkomen. Vertrouw voor goedkeuringscheckpointbewijs
op de gerenderde checkpointafbeeldingen en Slack QA-artefacten in plaats van
`slack-desktop-smoke.png`. Gebruik alleen een behouden warme lease met een
handmatig ingelogd Slack Web-profiel wanneer de browserscreenshot zelf Slack Web
moet tonen.

## Hydrate-modi

| Modus         | Gebruik wanneer                           | Remote gedrag                                                                         | Afweging                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `source`      | Normaal PR-bewijs, koude machines, CI     | Voert `pnpm install --frozen-lockfile --prefer-offline` en `pnpm build` uit binnen de VM | Traagst, sterkste source-checkout-bewijs                |
| `prehydrated` | Je bewust een hergebruikte lease hebt voorbereid | Vereist bestaande `node_modules` en `dist/`; slaat install/build over                 | Snel, maar alleen geldig voor door operators beheerde warme leases |

GitHub Actions bereidt de candidate checkout altijd voor vóór de VM-run. De
pnpm-store wordt gecachet per OS, Node-versie en lockfile. De VM-source-run
gebruikt ook `/var/cache/crabbox/pnpm` wanneer aanwezig.

## Timinginterpretatie

`mantis-slack-desktop-smoke-report.md` bevat fasetimings:

- `crabbox.warmup`: cloudproviderboot, desktop-/browsergereedheid en SSH.
- `crabbox.inspect`: opzoeken van leasemetadata.
- `credentials.prepare`: verkrijgen van Convex-credentiallease.
- `crabbox.remote_run`: synchronisatie, browserstart, OpenClaw-install/build of
  hydrate-validatie, gatewaystart, screenshot en video-opname.
- `artifacts.copy`: rsync terug vanaf de VM.

`crabbox.remote_run` kan als `accepted` worden gemarkeerd wanneer Crabbox een
niet-nul remote status retourneert nadat Mantis metadata heeft gekopieerd die
bewijst dat de OpenClaw-gatewaysetup is voltooid of dat de Slack QA-opdracht zelf
succesvol is afgesloten. Behandel `accepted` als geslaagd-met-uitleg, niet als
een mislukt scenario.

Als de run traag is:

- warmup domineert: bak een betere Crabbox-providerimage voor of promoot die;
- remote_run domineert in `source`: gebruik een warme lease, verbeter hergebruik
  van de pnpm-store of verplaats machinevereisten naar de providerimage;
- remote_run domineert in `prehydrated`: de remote workspace was niet werkelijk
  klaar, of de gateway-/browser-/Slack-setup is traag;
- artefactkopie domineert: inspecteer videogrootte en inhoud van de artefactdirectory.

## Bewijschecklist

Een goed PR-commentaar moet tonen:

- scenario-id en candidate-SHA;
- GitHub Actions-run-URL;
- artefact-URL;
- inline goedkeuringscheckpoint-screenshot, of een Slack Web-screenshot van een
  ingelogde warme lease;
- inline geanimeerde preview wanneer beschikbaar;
- volledige MP4- en ingekorte MP4-links;
- pass/fail-status;
- timingsamenvatting in het bijgevoegde rapport.

Commit geen screenshots of video's naar de repository. Bewaar ze in GitHub
Actions-artefacten of het PR-commentaar.

## Foutafhandeling

Als de workflow faalt vóór de VM-run, inspecteer dan eerst de Actions-job. Typische
oorzaken zijn een niet-vertrouwde `candidate_ref`, ontbrekende omgevingsgeheimen
of een mislukte candidate-install/build.

Als de VM-run faalt maar screenshots zijn teruggekopieerd, inspecteer:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Als de run de lease heeft behouden, open VNC met de `crabbox vnc ...`-opdracht
uit het rapport. Stop de lease wanneer je klaar bent:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Als de Slack-login is verlopen, herstel deze dan in VNC op een behouden lease en
voer opnieuw uit met `--lease-id`. Bak dat browserprofiel niet in een
providerimage.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation)
- [Slack-kanaal](/nl/channels/slack)
- [Testen](/nl/help/testing)
