---
read_when:
    - GitHub से या स्थानीय रूप से Mantis Slack डेस्कटॉप QA चलाना
    - धीमे Mantis Slack डेस्कटॉप रन की डिबगिंग
    - source, prehydrated, या warm-lease मोड चुनना
    - PR पर स्क्रीनशॉट और वीडियो प्रमाण पोस्ट करना
summary: 'Mantis Slack डेस्कटॉप QA के लिए ऑपरेटर रनबुक: GitHub dispatch, स्थानीय CLI, warm VNC leases, hydrate modes, timing interpretation, artifacts, और failure handling.'
title: Mantis Slack डेस्कटॉप रनबुक
x-i18n:
    generated_at: "2026-06-28T22:58:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA Slack-वर्ग की उन बगों के लिए वास्तविक-UI lane है जिन्हें
Linux desktop, VNC rescue, Slack Web, वास्तविक OpenClaw gateway, स्क्रीनशॉट,
वीडियो, और PR evidence comment की आवश्यकता होती है।

इसे तब उपयोग करें जब unit tests या headless Slack live lane बग को सिद्ध नहीं कर सकते।

## Storage model

Mantis तीन अलग-अलग storage layers का उपयोग करता है:

- Provider image: Crabbox के स्वामित्व में और cloud provider account में संग्रहीत।
  इसमें Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, native build tools,
  और खाली cache directories जैसी machine capabilities होती हैं।
- Warm lease state: वर्तमान operator session के स्वामित्व में। Lease सक्रिय रहने तक इसमें
  logged-in browser profile, `/var/cache/crabbox/pnpm`, और prepared source
  checkout हो सकते हैं।
- Mantis artifacts: OpenClaw run के स्वामित्व में। वे
  `.artifacts/qa-e2e/mantis/...` के अंतर्गत रहते हैं, फिर GitHub Actions उन्हें upload करता है और
  Mantis GitHub App PR पर inline evidence comment करता है।

Secrets, browser cookies, Slack login state, repository checkouts,
`node_modules`, या `dist/` को कभी भी prebaked provider image में न डालें।

## GitHub dispatch

Workflow को `main` से चलाएँ:

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

Allowed `candidate_ref` values जानबूझकर सीमित हैं क्योंकि workflow
live credentials का उपयोग करता है: current `main` ancestry, release tags, या
`openclaw/openclaw` से open PR head।

Workflow लिखता है:

- uploaded artifact: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Mantis GitHub App से inline PR comment;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- remote logs जैसे `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log`, और `ffmpeg.log`।

PR comment को छिपे हुए
`<!-- mantis-slack-desktop-smoke -->` marker द्वारा वहीं update किया जाता है।

## Local CLI

Cold source proof:

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

VNC rescue के लिए VM रखें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC खोलें:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Warm lease का पुनः उपयोग करें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

`--hydrate-mode prehydrated` का उपयोग केवल तब करें जब reused remote workspace में पहले से
`node_modules` और built `dist/` हों। यदि वे
मौजूद नहीं हैं तो Mantis fail closed करता है।

Native Slack approval UI सिद्ध करें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Approval checkpoint mode `--gateway-setup` के साथ mutually exclusive है। यह
opt-in `slack-approval-exec-native` और `slack-approval-plugin-native`
scenarios चलाता है जब तक आप explicit approval checkpoint `--scenario` flags पास नहीं करते; अन्य
Slack scenarios को VM शुरू होने से पहले reject कर दिया जाता है। Slack QA runner
देखे गए वास्तविक Slack API message से प्रत्येक checkpoint JSON file लिखता है, फिर
remote watcher उस message snapshot को
`approval-checkpoints/<scenario>-pending.png` और
`approval-checkpoints/<scenario>-resolved.png` में render करता है। यदि कोई checkpoint
JSON, message evidence, ack JSON, या rendered screenshot missing या empty है तो run fail होता है।

Cold GitHub Actions leases में Slack Web cookies नहीं होते, इसलिए उनका browser
capture Slack sign-in पर पहुँच सकता है। Approval checkpoint proof के लिए,
`slack-desktop-smoke.png` के बजाय rendered checkpoint images और Slack QA artifacts पर भरोसा करें।
Browser screenshot में स्वयं Slack Web दिखना आवश्यक हो तभी manually logged-in Slack
Web profile के साथ kept warm lease का उपयोग करें।

## Hydrate modes

| Mode          | कब उपयोग करें                              | Remote behavior                                                                       | Tradeoff                                           |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `source`      | Normal PR proof, cold machines, CI         | VM के अंदर `pnpm install --frozen-lockfile --prefer-offline` और `pnpm build` चलाता है | सबसे धीमा, सबसे मजबूत source-checkout proof       |
| `prehydrated` | आपने जानबूझकर reused lease तैयार किया है  | मौजूदा `node_modules` और `dist/` की आवश्यकता होती है; install/build skip करता है     | तेज, लेकिन केवल operator-controlled warm leases के लिए valid |

GitHub Actions हमेशा VM run से पहले candidate checkout तैयार करता है। इसका
pnpm store OS, Node version, और lockfile द्वारा cached होता है। VM source run भी
उपस्थित होने पर `/var/cache/crabbox/pnpm` का उपयोग करता है।

## Timing interpretation

`mantis-slack-desktop-smoke-report.md` में phase timings शामिल हैं:

- `crabbox.warmup`: cloud provider boot, desktop/browser readiness, और SSH।
- `crabbox.inspect`: lease metadata lookup।
- `credentials.prepare`: Convex credential lease acquisition।
- `crabbox.remote_run`: sync, browser launch, OpenClaw install/build या
  hydrate validation, gateway startup, screenshot, और video capture।
- `artifacts.copy`: VM से rsync back।

`crabbox.remote_run` को `accepted` mark किया जा सकता है जब Crabbox non-zero
remote status लौटाता है, लेकिन Mantis ने ऐसा metadata copy कर लिया हो जो सिद्ध करता है कि या तो OpenClaw
gateway setup पूरा हुआ या Slack QA command स्वयं successfully exited हुई।
`accepted` को failed scenario नहीं, बल्कि pass-with-explanation मानें।

यदि run धीमा है:

- warmup dominate करता है: बेहतर Crabbox provider image prebake या promote करें;
- `source` में remote_run dominate करता है: warm lease उपयोग करें, pnpm store reuse सुधारें,
  या machine prerequisites को provider image में ले जाएँ;
- `prehydrated` में remote_run dominate करता है: remote workspace वास्तव में
  ready नहीं था, या gateway/browser/Slack setup धीमा है;
- artifact copy dominate करता है: video size और artifact directory contents inspect करें।

## Evidence checklist

अच्छे PR comment में दिखना चाहिए:

- scenario id और candidate SHA;
- GitHub Actions run URL;
- artifact URL;
- inline approval checkpoint screenshot, या
  logged-in warm lease से Slack Web screenshot;
- उपलब्ध होने पर inline animated preview;
- full MP4 और trimmed MP4 links;
- pass/fail status;
- attached report में timing summary।

Screenshots या videos को repository में commit न करें। उन्हें GitHub
Actions artifacts या PR comment में रखें।

## Failure handling

यदि workflow VM run से पहले fail होता है, तो पहले Actions job inspect करें। सामान्य
कारण untrusted `candidate_ref`, missing environment secrets, या candidate
install/build failure होते हैं।

यदि VM run fail होता है लेकिन screenshots copy back हुए हैं, तो inspect करें:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

यदि run ने lease रखा है, तो report के `crabbox vnc ...` command से VNC खोलें।
काम पूरा होने पर lease stop करें:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

यदि Slack login expired हो गया है, तो kept lease पर VNC में उसे repair करें और
`--lease-id` के साथ rerun करें। उस browser profile को provider image में bake न करें।

## Related

- [QA overview](/hi/concepts/qa-e2e-automation)
- [Slack channel](/hi/channels/slack)
- [Testing](/hi/help/testing)
