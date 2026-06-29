---
read_when:
    - OpenClaw अद्यतन, डॉक्टर, पैकेज स्वीकृति या Plugin स्थापना व्यवहार बदलना
    - रिलीज़ कैंडिडेट तैयार करना या अनुमोदित करना
    - पैकेज अपडेट, plugin dependency cleanup, या plugin install regressions की debugging
sidebarTitle: Update and plugin tests
summary: OpenClaw अपडेट पथों, पैकेज माइग्रेशन और Plugin इंस्टॉल/अपडेट व्यवहार को कैसे सत्यापित करता है
title: 'परीक्षण: अपडेट और Plugin'
x-i18n:
    generated_at: "2026-06-28T23:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

यह update और Plugin सत्यापन के लिए समर्पित checklist है। लक्ष्य
सरल है: यह साबित करना कि installable package वास्तविक user state को update कर सकता है, `doctor` के जरिए stale
legacy state को repair कर सकता है, और supported sources से
plugins को अब भी install, load, update, और uninstall कर सकता है।

व्यापक test runner map के लिए, [Testing](/hi/help/testing) देखें। live provider
keys और network-touching suites के लिए, [Testing live](/hi/help/testing-live) देखें।

## हम क्या सुरक्षित रखते हैं

Update और plugin tests ये contracts सुरक्षित रखते हैं:

- package tarball complete है, उसमें valid `dist/postinstall-inventory.json` है,
  और वह unpacked repo files पर depend नहीं करता।
- user config, agents, sessions, workspaces, plugin allowlists, या
  channel config खोए बिना पुराने published package से candidate package पर जा सकता है।
- `openclaw doctor --fix --non-interactive` legacy cleanup और repair
  paths का owner है। Startup को stale
  plugin state के लिए hidden compatibility migrations नहीं बढ़ानी चाहिए।
- Plugin installs local directories, git repos, npm packages, और
  ClawHub registry path से काम करते हैं।
- Plugin npm dependencies हर plugin के लिए एक managed npm project में install होती हैं,
  trust से पहले scanned होती हैं, और uninstall के दौरान npm के जरिए हटाई जाती हैं ताकि hoisted
  dependencies बची न रहें।
- जब कुछ बदला न हो तब Plugin update stable रहता है: install records, resolved
  source, installed dependency layout, और enabled state intact रहते हैं।

## development के दौरान local proof

संकीर्ण दायरे से शुरू करें:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin install, uninstall, dependency, या package-inventory changes के लिए, edited seam को cover करने वाले focused tests भी
चलाएँ:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

किसी package Docker lane द्वारा tarball consume करने से पहले, package artifact साबित करें:

```bash
pnpm release:check
```

`release:check` config/docs/API drift checks चलाता है, package dist
inventory लिखता है, `npm pack --dry-run` चलाता है, forbidden packed files reject करता है,
tarball को temp prefix में install करता है, postinstall चलाता है, और bundled channel
entrypoints smoke करता है।

## Docker lanes

Docker lanes product-level proof हैं। वे Linux containers के अंदर real
package install या update करते हैं और CLI commands,
Gateway startup, HTTP probes, RPC status, और filesystem state के जरिए behavior assert करते हैं।

Iterate करते समय focused lanes का उपयोग करें:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

महत्वपूर्ण lanes:

- `test:docker:plugins` plugin install smoke, local folder installs,
  local folder update skip behavior, preinstalled
  dependencies वाले local folders, `file:` package installs, CLI execution के साथ git installs, git
  moving-ref updates, hoisted transitive
  dependencies के साथ npm registry installs, npm update no-ops, malformed npm package metadata rejection,
  local ClawHub fixture installs और update no-ops, marketplace update behavior,
  और Claude-bundle enable/inspect validate करता है। ClawHub block को hermetic/offline रखने के लिए `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` set करें।
- `test:docker:plugin-lifecycle-matrix` candidate package को bare
  container में install करता है, npm plugin को install, inspect, disable, enable,
  explicit upgrade, explicit downgrade, और plugin
  code delete करने के बाद uninstall से गुजारता है। यह हर phase के लिए RSS और CPU metrics log करता है।
- `test:docker:plugin-update` validate करता है कि unchanged installed plugin
  `openclaw plugins update` के दौरान reinstall नहीं होता या install metadata नहीं खोता।
- `test:docker:upgrade-survivor` candidate tarball को dirty
  old-user fixture के ऊपर install करता है, package update plus non-interactive doctor चलाता है, फिर
  loopback Gateway शुरू करता है और state preservation checks करता है।
- `test:docker:published-upgrade-survivor` पहले published baseline install करता है,
  baked `openclaw config set` recipe से उसे configure करता है, उसे
  candidate tarball पर update करता है, doctor चलाता है, legacy cleanup check करता है, Gateway शुरू करता है, और
  `/healthz`, `/readyz`, और RPC status probe करता है।
- `test:docker:update-restart-auth` candidate package install करता है, managed token-auth Gateway शुरू करता है,
  `openclaw update --yes --json` के लिए caller gateway auth env unset करता है,
  और candidate update command से normal probes से पहले Gateway restart करवाना require करता है।
- `test:docker:update-migration` cleanup-heavy published-update lane है। यह
  configured Discord/Telegram-style user state से शुरू करता है, baseline
  doctor चलाता है ताकि configured plugin dependencies materialize होने का मौका पा सकें, configured packaged plugin के लिए
  legacy plugin dependency debris seed करता है, candidate tarball पर update करता है, और post-update doctor से legacy
  dependency roots हटाना require करता है।

Useful published-upgrade survivor variants:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Available scenarios हैं `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path`, और `versioned-runtime-deps`। aggregate runs में,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` सभी reported
issue-shaped scenarios तक expand होता है, जिसमें configured-plugin install migration शामिल है।

Full update migration को Full Release CI से जानबूझकर अलग रखा गया है। जब release question यह हो कि "क्या
2026.4.23 से आगे की हर published stable release इस candidate पर update हो सकती है और
plugin dependency debris clean up कर सकती है?", तब manual `Update Migration` workflow का उपयोग करें:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance GitHub-native package gate है। यह एक candidate
package को `package-under-test` tarball में resolve करता है, version और SHA-256 record करता है, फिर
उसी exact tarball के खिलाफ reusable Docker E2E lanes चलाता है। workflow harness
ref package source ref से अलग है, इसलिए current test logic पुराने trusted releases को validate कर सकता है।

Candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, या exact
  published version validate करें।
- `source=ref`: selected current
  harness के साथ trusted branch, tag, या commit pack करें।
- `source=url`: required `package_sha256` के साथ public HTTPS tarball validate करें।
  यह path URL credentials, non-default HTTPS ports, private/internal
  hostnames या DNS/IP results, special-use IP space, और unsafe redirects reject करता है।
- `source=trusted-url`: maintainer-owned policy
  `.github/package-trusted-sources.json` के खिलाफ required
  `package_sha256` और `trusted_source_id` के साथ HTTPS tarball validate करें। enterprise/private
  mirrors के लिए इसका उपयोग करें, `source=url` को input-level allow-private
  switch से कमजोर करने के बजाय। Bearer auth, जब policy से configured हो, fixed
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret का उपयोग करता है।
- `source=artifact`: किसी अन्य Actions run द्वारा uploaded tarball reuse करें।

Full Release Validation default रूप से `source=artifact` का उपयोग करता है, जिसे
resolved release SHA से बनाया जाता है। post-publish proof के लिए,
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` pass करें ताकि वही upgrade matrix
shipped npm package को target करे।

Release checks Package Acceptance को package/update/restart/plugin set के साथ call करते हैं:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

जब release soak enabled होता है, वे यह भी pass करते हैं:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

यह package migration, update channel switching, corrupt managed-plugin
tolerance, stale plugin dependency cleanup, offline plugin coverage, plugin
update behavior, और Telegram package QA को उसी resolved artifact पर रखता है, default release package gate को हर published release पर चलाए बिना।

`last-stable-4` चार latest stable npm-published OpenClaw
releases पर resolve होता है। Release package acceptance `2026.4.23` को first plugin-update
compatibility boundary, `2026.5.2` को plugin-architecture churn boundary, और
`2026.4.15` को पुराने 2026.4.1x published-update baseline के रूप में pin करता है; resolver
उन pins को dedupe करता है जो पहले से latest four में हैं। exhaustive published
update migration coverage के लिए, Full Release CI के बजाय अलग Update
Migration workflow में `all-since-2026.4.23` का उपयोग करें। जब आप legacy pre-date
anchor भी चाहते हों, तब manual wider sampling के लिए `release-history` उपलब्ध रहता है।

जब multiple published-upgrade survivor baselines चुने जाते हैं, reusable
Docker workflow हर baseline को अपने targeted runner job में shard करता है। हर
baseline shard अब भी selected scenario set चलाता है, लेकिन logs और artifacts
per-baseline रहते हैं और wall time एक बड़े serial job के बजाय slowest shard से bounded होता है।

release से पहले candidate validate करते समय package profile manually चलाएँ:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

जब release question में MCP channels,
cron/subagent cleanup, OpenAI web search, या OpenWebUI शामिल हों, तब `suite_profile=product` का उपयोग करें। `suite_profile=full`
का उपयोग केवल तब करें जब आपको full Docker release-path coverage चाहिए।

## Release default

Release candidates के लिए, default proof stack है:

1. source-level regressions के लिए `pnpm check:changed` और `pnpm test:changed`।
2. package artifact integrity के लिए `pnpm release:check`।
3. install/update/restart/plugin contracts के लिए Package Acceptance `package` profile या release-check custom package
   lanes।
4. OS-specific installer, onboarding, और platform
   behavior के लिए Cross-OS release checks।
5. Live suites केवल तब जब changed surface provider या hosted-service
   behavior को touch करे।

Maintainer machines पर, broad gates और Docker/package product proof Testbox में चलना चाहिए,
जब तक कि explicitly local proof न किया जा रहा हो।

## Legacy compatibility

Compatibility leniency संकीर्ण और time boxed है:

- `2026.4.25` तक के packages, जिनमें `2026.4.25-beta.*` शामिल हैं,
  Package Acceptance में already-shipped package metadata gaps tolerate कर सकते हैं।
- published `2026.4.26` package already shipped local build metadata stamp
  files के लिए warn कर सकता है।
- बाद के packages को modern contracts satisfy करने होंगे। वही gaps warning या skipping के बजाय fail होंगे।

इन old shapes के लिए नए startup migrations न जोड़ें। doctor
repair add या extend करें, फिर update command restart own करता हो तो उसे `upgrade-survivor`, `published-upgrade-survivor`, या
`update-restart-auth` से prove करें।

## Coverage जोड़ना

Update या plugin behavior बदलते समय, सबसे lower layer पर coverage जोड़ें जो
सही वजह से fail हो सके:

- शुद्ध पाथ या मेटाडेटा लॉजिक: source के पास unit test।
- पैकेज इन्वेंटरी या पैक्ड-फ़ाइल व्यवहार: `package-dist-inventory` या tarball
  checker test।
- CLI install/update व्यवहार: Docker lane assertion या fixture।
- प्रकाशित-रिलीज़ migration व्यवहार: `published-upgrade-survivor` scenario।
- update-owned restart व्यवहार: `update-restart-auth`।
- registry/package source व्यवहार: `test:docker:plugins` fixture या ClawHub
  fixture server।
- dependency layout या cleanup व्यवहार: runtime execution और
  filesystem boundary, दोनों assert करें। npm dependencies Plugin के
  managed npm project के अंदर hoist हो सकती हैं, इसलिए tests को साबित करना चाहिए
  कि उसी project को scan/clean किया जाता है, बजाय इसके कि केवल Plugin package-local `node_modules` tree मान लिया जाए।

नए Docker fixtures को default रूप से hermetic रखें। local fixture registries और
fake packages का उपयोग करें, जब तक test का उद्देश्य live registry व्यवहार न हो।

## failure triage

artifact identity से शुरू करें:

- पैकेज स्वीकृति `resolve_package` summary: source, version, SHA-256, और
  artifact name।
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs, और rerun commands।
- upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  जिसमें baseline version, candidate version, scenario, phase timings, और
  recipe steps शामिल हों।

पूरे release umbrella को rerun करने के बजाय उसी package artifact के साथ
failed exact lane को rerun करना प्राथमिकता दें।
