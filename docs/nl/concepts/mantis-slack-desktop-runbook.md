---
read_when:
    - Mantis Slack-desktop-QA uitvoeren vanuit GitHub of lokaal
    - Debuggen van trage Mantis Slack-desktopuitvoeringen
    - Kiezen tussen bron-, vooraf gehydrateerde of warm-lease-modus
    - Screenshot- en videobewijs bij een PR plaatsen
summary: 'Operator-runbook voor Mantis Slack desktop-QA: GitHub-dispatch, lokale CLI, warme VNC-leases, hydrate-modi, interpretatie van timing, artefacten en foutafhandeling.'
title: Mantis Slack-desktopdraaiboek
x-i18n:
    generated_at: "2026-05-06T09:08:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop-QA is de real-UI-lane voor bugs van Slack-klasse die een
Linux-desktop, VNC-redding, Slack Web, een echte OpenClaw gateway, screenshots,
video's en een PR-bewijscommentaar nodig hebben.

Gebruik dit wanneer unit tests of de headless Slack live-lane de bug niet kunnen bewijzen.

## Opslagmodel

Mantis gebruikt drie verschillende opslaglagen:

- Provider-image: eigendom van Crabbox en opgeslagen in het cloudprovideraccount.
  Deze bevat machinecapaciteiten zoals Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, native buildtools en lege cachemappen.
- Warme lease-status: eigendom van de huidige operatorsessie. Deze kan een
  ingelogd browserprofiel, `/var/cache/crabbox/pnpm` en een voorbereide source
  checkout bevatten zolang de lease actief is.
- Mantis-artefacten: eigendom van de OpenClaw-run. Ze staan onder
  `.artifacts/qa-e2e/mantis/...`, waarna GitHub Actions ze uploadt en de
  Mantis GitHub App inline bewijs op de PR plaatst.

Plaats nooit geheimen, browsercookies, Slack-inlogstatus, repository-checkouts,
`node_modules` of `dist/` in een vooraf gebakken provider-image.

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

Toegestane `candidate_ref`-waarden zijn bewust smal omdat de workflow
live-referenties gebruikt: huidige `main`-afstamming, releasetags of een open PR-head
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
- externe logs zoals `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` en `ffmpeg.log`.

Het PR-commentaar wordt ter plekke bijgewerkt via de verborgen
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

Gebruik `--hydrate-mode prehydrated` alleen wanneer de hergebruikte externe werkruimte al
`node_modules` en een gebouwde `dist/` heeft. Mantis faalt gesloten als die
ontbreken.

## Hydratatiemodi

| Modus         | Gebruik wanneer                            | Extern gedrag                                                                         | Afweging                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Normaal PR-bewijs, koude machines, CI      | Voert `pnpm install --frozen-lockfile --prefer-offline` en `pnpm build` uit in de VM | Traagst, sterkste source-checkout-bewijs                 |
| `prehydrated` | Je bewust een hergebruikte lease voorbereidde | Vereist bestaande `node_modules` en `dist/`; slaat install/build over                | Snel, maar alleen geldig voor door de operator beheerde warme leases |

GitHub Actions bereidt de kandidaat-checkout altijd voor vóór de VM-run. De
pnpm-store wordt gecachet op OS, Node-versie en lockfile. De VM-source-run gebruikt ook
`/var/cache/crabbox/pnpm` wanneer aanwezig.

## Timinginterpretatie

`mantis-slack-desktop-smoke-report.md` bevat fasetimings:

- `crabbox.warmup`: cloudprovider-boot, desktop-/browsergereedheid en SSH.
- `crabbox.inspect`: opzoeken van lease-metadata.
- `credentials.prepare`: verkrijgen van een Convex-referentielease.
- `crabbox.remote_run`: synchronisatie, browserstart, OpenClaw install/build of
  hydratatievalidatie, Gateway-start, screenshot en video-opname.
- `artifacts.copy`: rsync terug vanaf de VM.

`crabbox.remote_run` kan als `accepted` worden gemarkeerd wanneer Crabbox een niet-nul
externe status teruggeeft nadat Mantis metadata heeft gekopieerd die bewijst dat de OpenClaw Gateway
actief is en de setup is voltooid. Behandel `accepted` als geslaagd-met-uitleg,
niet als een mislukt scenario.

Als de run traag is:

- warmup domineert: bak vooraf of promoot een betere Crabbox provider-image;
- remote_run domineert in `source`: gebruik een warme lease, verbeter hergebruik van de pnpm-store,
  of verplaats machinevereisten naar de provider-image;
- remote_run domineert in `prehydrated`: de externe werkruimte was niet echt
  klaar, of de Gateway/browser/Slack-setup is traag;
- artefactkopie domineert: inspecteer videogrootte en de inhoud van de artefactmap.

## Bewijschecklist

Een goed PR-commentaar moet tonen:

- scenario-id en kandidaat-SHA;
- GitHub Actions-run-URL;
- artefact-URL;
- inline screenshot;
- inline geanimeerde preview wanneer beschikbaar;
- volledige MP4- en ingekorte MP4-links;
- pass/fail-status;
- timingsamenvatting in het bijgevoegde rapport.

Commit geen screenshots of video's naar de repository. Bewaar ze in GitHub
Actions-artefacten of het PR-commentaar.

## Foutafhandeling

Als de workflow faalt vóór de VM-run, inspecteer dan eerst de Actions-job. Typische
oorzaken zijn een niet-vertrouwde `candidate_ref`, ontbrekende omgevingsgeheimen of een mislukte
install/build van de kandidaat.

Als de VM-run faalt maar screenshots zijn teruggekopieerd, inspecteer:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Als de run de lease heeft behouden, open dan VNC met de `crabbox vnc ...`-opdracht uit het rapport.
Stop de lease wanneer je klaar bent:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Als de Slack-login is verlopen, herstel die dan in VNC op een behouden lease en voer opnieuw uit met
`--lease-id`. Bak dat browserprofiel niet in een provider-image.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation)
- [Slack-kanaal](/nl/channels/slack)
- [Testen](/nl/help/testing)
