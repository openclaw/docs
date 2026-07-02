---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट या प्रकाशन को डीबग करना
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िगरेशन, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-07-02T17:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, bin: `clawhub`.

इसे npm या pnpm से globally इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

फिर इसे सत्यापित करें:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Global flags

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot workspace पर वापस जाता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल डायरेक्टरी (डिफ़ॉल्ट: `skills`)
- `--site <url>`: browser login के लिए base URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API base URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: prompts अक्षम करें

Env equivalents:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI corporate proxies या restricted networks के पीछे मौजूद systems के लिए standard HTTP proxy environment variables का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी variable सेट होता है, CLI outbound requests को निर्दिष्ट proxy के माध्यम से route करता है। `HTTPS_PROXY` HTTPS requests के लिए उपयोग होता है, `HTTP_PROXY` plain HTTP के लिए। `NO_PROXY` / `no_proxy` का सम्मान specific hosts या domains के लिए proxy bypass करने में किया जाता है।

यह उन systems पर आवश्यक है जहां direct outbound connections blocked हैं (जैसे Docker containers, proxy-only internet वाला Hetzner VPS, corporate firewalls).

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई proxy variable सेट नहीं होता, व्यवहार अपरिवर्तित रहता है (direct connections).

## Config file

आपका API token + cached registry URL store करता है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Legacy fallback: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI legacy path का पुनः उपयोग करता है
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Commands

### `login` / `auth login`

- डिफ़ॉल्ट: browser को `<site>/cli/auth` पर खोलता है और loopback callback के माध्यम से पूरा करता है।
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` एक code print करता है और आपके `<site>/cli/device` पर authorize करने तक प्रतीक्षा करता है।

### `whoami`

- Stored token को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- Stored API token को stdout पर print करता है।
- Local login token को CI secret setup commands में pipe करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके highlights में skill जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` को call करता है।
- `--yes` confirmation छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` को call करता है।
- Output में skill slug, owner handle, display name, और relevance score शामिल होता है।
- Search download popularity से पहले exact slug/name token matches को प्राथमिकता देता है। `map` जैसा standalone slug token, `amap` के अंदर substring की तुलना में `personal-map` से अधिक मज़बूती से match करता है।
- Popularity एक छोटा ranking prior है, top placement की guarantee नहीं।
- यदि कोई skill दिखाई देनी चाहिए लेकिन नहीं दिखती, तो metadata rename करने से पहले owner-visible moderation diagnostics जांचने के लिए logged in रहते हुए `clawhub inspect @owner/slug` चलाएं।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से newest skills list करता है (`createdAt` desc के अनुसार sorted).
- Flags:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest). Legacy install sort aliases compatibility के लिए अभी भी काम करते हैं।
  - `--json` (machine-readable output)
- Output: `<slug>  v<version>  <age>  <summary>` (summary 50 chars तक truncated).

### `inspect @owner/slug`

- इंस्टॉल किए बिना skill metadata और version files fetch करता है।
- `--version <version>`: किसी specific version को inspect करें (डिफ़ॉल्ट: latest).
- `--tag <tag>`: tagged version inspect करें (जैसे `latest`).
- `--versions`: version history list करें (first page).
- `--limit <n>`: list करने के लिए max versions (1-200).
- `--files`: selected version की files list करें।
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `install @owner/slug`

- Named owner और skill के लिए latest version resolve करता है।
- `/api/v1/download` के माध्यम से zip download करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- Pinned skills overwrite करने से इनकार करता है; पहले `clawhub unpin <skill>` चलाएं।
- Writes:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile entry delete करता है।
- Logged in रहते हुए best-effort telemetry भेजता है ताकि current install counts deactivate किए जा सकें।
- Interactive: confirmation पूछता है।
- Non-interactive (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`) पढ़ता है।
- `clawhub pin` से frozen skills के आगे `pinned` दिखाता है, optional reason सहित।

### `pin <skill>`

- Installed skill को lockfile में pinned mark करता है।
- `--reason <text>` record करता है कि skill frozen क्यों है।
- Pinned skills को `update --all` द्वारा skip किया जाता है और direct `update <skill>` द्वारा reject किया जाता है।
- Pinned skills `install --force` को भी reject करते हैं ताकि local bytes गलती से replace न हों।

### `unpin <skill>`

- Installed skill से lockfile pin हटाता है ताकि future updates उसे modify कर सकें।

### `update [@owner/slug]` / `update --all`

- Local files से fingerprint compute करता है।
- यदि fingerprint किसी known version से match करता है: कोई prompt नहीं।
- यदि fingerprint match नहीं करता:
  - डिफ़ॉल्ट रूप से इनकार करता है
  - `--force` से overwrite करता है (या interactive होने पर prompt)
- Pinned skills कभी भी `--force` द्वारा update नहीं होते।
- `update <skill>` pinned skills के लिए तुरंत fail होता है और आपको पहले `clawhub unpin <skill>` चलाने को कहता है।
- `update --all` pinned slugs skip करता है और जो frozen रहे उनका summary print करता है।

### `skill publish <path>`

- Local bundle fingerprint की ClawHub से तुलना करता है और content पहले से published होने पर successfully exit करता है।
- New skills डिफ़ॉल्ट रूप से `1.0.0` होते हैं; changed skills अगले patch version पर default होते हैं।
- `--version <version>` स्पष्ट रूप से एक version select करता है और content existing version से match करने पर भी publish करता है।
- `--dry-run` upload किए बिना publish resolve करता है; `--json` machine-readable result print करता है।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब actor के पास publisher access होता है।
- `--migrate-owner` existing skill को `--owner` में move करता है और साथ में new version publish करता है। दोनों publishers पर admin/owner access आवश्यक है।
- Owner और review behavior `docs/publishing.md` में समझाया गया है।
- किसी skill को publish करने का अर्थ है कि वह ClawHub पर `MIT-0` के अंतर्गत released है।
- Published skills attribution के बिना use, modify, और redistribute करने के लिए free हैं।
- ClawHub paid skills या per-skill pricing support नहीं करता।
- Legacy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub का reusable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत प्रत्येक immediate skill folder के लिए `skill publish` call करता है। यह unchanged skills skip करता है और वही automatic patch-version behavior उपयोग करता है।

Token के बिना preview करने के लिए `dry_run: true` सेट करें। Real publishes के लिए `clawhub_token` secret आवश्यक है।

### `sync`

- Current workdir, configured skills directory, और `--root <dir>` folders को local skill folders के लिए scan करता है जिनमें `SKILL.md` या `skill.md` हो।
- प्रत्येक local skill fingerprint की ClawHub से तुलना करता है और केवल new या changed skills publish करता है।
- New skills `1.0.0` के रूप में publish होते हैं; changed skills डिफ़ॉल्ट रूप से अगले patch version को publish करते हैं। ऐसे update batches के लिए `--bump minor|major` उपयोग करें जिन्हें बड़े semver step से move करना चाहिए।
- `--dry-run` upload किए बिना publish plan दिखाता है; `--json` machine-readable plan print करता है।
- `--all` हर new या changed skill को बिना prompting publish करता है। `--all` के बिना, interactive terminals आपको publish करने के लिए skills select करने देते हैं।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब actor के पास publisher access होता है।
- `sync` केवल one-way publish है। यह install, update, download, या install/download telemetry report नहीं करता।

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` आवश्यक है।
- `POST /api/v1/skills/-/scan` के माध्यम से ClawHub ClawScan चलाता है, फिर scan terminal होने तक poll करता है।
- Scans asynchronous होते हैं और complete होने में समय लग सकता है। Queued रहने के दौरान, terminal spinner current prioritized scan position और आगे कितने scans हैं दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins `clawhub-admin` के माध्यम से वही backend use कर सकते हैं।
- `--update` केवल `--slug` के साथ valid है; यह successful published scan results को selected version पर वापस write करता है।
- `--output <file.zip>` full report archive download करता है जिसमें `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` शामिल हैं।
- `--json` automation के लिए full poll response print करता है।
- Local path scans अब supported नहीं हैं। New version upload करें, फिर उस submitted version के stored scan results retrieve करने के लिए `scan download` उपयोग करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- Submitted skill या plugin version के लिए stored scan report ZIP download करता है, जिसमें वे versions भी शामिल हैं जिन्हें ClawHub security checks ने blocked या hidden किया था।
- Skill downloads skill slug use करते हैं और default `--kind skill` होता है।
- Plugin downloads package name use करते हैं और `--kind plugin` आवश्यक है।
- `--version` आवश्यक है ताकि authors ठीक वही submitted version inspect करें जिसे ClawHub ने block किया था।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub skill repos और catalog repos के लिए एक official reusable workflow यहां ship करता है
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml).

Typical catalog setup:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notes:

- `root` catalog repos के लिए `skills` पर default होता है।
- एक skill folder process करने के लिए `skill_path: skills/review-helper` pass करें।
- `owner` CLI `--owner` flag से map होता है; authenticated user के रूप में publish करने के लिए इसे omit करें।
- V1 skill publishing `clawhub_token` use करता है; GitHub OIDC trusted publishing अभी package-only है।

### `delete <skill>`

- `--version` के बिना, किसी skill को soft-delete करें (owner, moderator, या admin).
- `DELETE /api/v1/skills/{slug}` कॉल करता है.
- Owner द्वारा शुरू किए गए soft delete slug को 30 दिनों के लिए आरक्षित रखते हैं; command expiry time प्रिंट करता है.
- `--version <version>` fail-closed,
  version-specific route के ज़रिए owned non-latest version को स्थायी रूप से delete करता है.
  Deleted versions को restore या republish नहीं किया जा सकता. current latest version को delete करने से पहले replacement publish करें. Platform staff इस version-only flow के लिए ownership bypass नहीं करते.
- `--reason <text>` whole-skill soft-delete और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation skip करता है.

### `undelete <skill>`

- hidden skill restore करें (owner, moderator, या admin).
- कोई version undelete नहीं है; स्थायी रूप से deleted versions restore नहीं किए जा सकते.
- `POST /api/v1/skills/{slug}/undelete` कॉल करता है.
- `--reason <text>` skill और audit log पर moderation note record करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation skip करता है.

### `hide <skill>`

- skill hide करें (owner, moderator, या admin).
- `delete` का alias.

### `unhide <skill>`

- skill unhide करें (owner, moderator, या admin).
- `undelete` का alias.

### `skill rename <skill> <new-name>`

- owned skill का नाम बदलें और पिछले slug को redirect alias के रूप में रखें.
- `POST /api/v1/skills/{slug}/rename` कॉल करता है.
- `--yes` confirmation skip करता है.

### `skill merge <source> <target>`

- एक owned skill को दूसरे owned skill में merge करें.
- source slug publicly list होना बंद कर देता है और target के लिए redirect alias बन जाता है.
- `POST /api/v1/skills/{sourceSlug}/merge` कॉल करता है.
- `--yes` confirmation skip करता है.

### `transfer`

- Ownership transfer workflow.
- user handles को transfers एक pending request बनाते हैं जिसे recipient accept करता है.
- org/publisher handles को transfers तुरंत apply होते हैं, केवल तब जब actor के पास
  current owner और destination publisher दोनों के लिए admin access हो.
- Subcommands:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- unified package catalog को `GET /api/v1/packages` और `GET /api/v1/packages/search` के ज़रिए browse या search करता है.
- इसे plugins और अन्य package-family entries के लिए इस्तेमाल करें; top-level `search` skill search surface ही रहता है.
- Flags:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, default: 25)
  - `--json`

Examples:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- install किए बिना package metadata fetch करता है.
- इसे Plugin metadata, compatibility, verification, source, और version/file inspection के लिए इस्तेमाल करें.
- `--version <version>`: किसी specific version को inspect करें (default: latest).
- `--tag <tag>`: tagged version को inspect करें (जैसे `latest`).
- `--versions`: version history list करें (first page).
- `--limit <n>`: list करने के लिए max versions (1-100).
- `--files`: selected version के लिए files list करें.
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `package download <name>`

- package version को
  `GET /api/v1/packages/{name}/versions/{version}/artifact` के ज़रिए resolve करता है.
- resolver के `downloadUrl` से artifact download करता है.
- सभी artifacts के लिए ClawHub SHA-256 verify करता है.
- ClawPack npm-pack artifacts के लिए, npm `sha512` integrity,
  npm shasum, और tarball के `package.json` name/version को भी verify करता है.
- Legacy ZIP versions legacy ZIP route के ज़रिए download होते हैं.
- Flags:
  - `--version <version>`: specific version download करें.
  - `--tag <tag>`: tagged version download करें (default: `latest`).
  - `-o, --output <path>`: output file या directory.
  - `--force`: existing output file overwrite करें.
  - `--json`: machine-readable output.

Examples:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- local artifact के लिए ClawHub SHA-256, npm `sha512` integrity, और npm shasum compute करता है.
- `--package` के साथ, ClawHub से expected metadata resolve करता है और
  local file की तुलना published artifact metadata से करता है.
- direct digest flags के साथ, network lookup के बिना verify करता है.
- Flags:
  - `--package <name>`: expected artifact metadata resolve करने के लिए package name.
  - `--version <version>` or `--tag <tag>`: expected package version.
  - `--sha256 <hex>`: expected ClawHub SHA-256.
  - `--npm-integrity <sri>`: expected npm integrity.
  - `--npm-shasum <sha1>`: expected npm shasum.
  - `--json`: machine-readable output.

Examples:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- local Plugin package folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है.
- local OpenClaw checkout locate या import किए बिना, default रूप से offline/static validation करता है.
- Hard compatibility errors non-zero exit करते हैं. Warning-only findings प्रिंट होते हैं लेकिन
  zero exit करते हैं.
- Flags:
  - `--out <dir>`: Plugin Inspector reports इस directory में लिखें.
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें.
  - `--runtime`: runtime capture enable करें; Plugin code import करता है.
  - `--allow-execute`: isolated workspace में runtime capture allow करें.
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package validate ./example-plugin
```

अगर validation package, manifest, SDK import, या artifact finding report करता है, तो
[Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें, फिर command दोबारा चलाएं.

### `package delete <name>`

- `--version` के बिना, package और सभी releases को soft-delete करता है.
- `--version <version>` fail-closed,
  version-specific route के ज़रिए owned non-latest release को स्थायी रूप से delete करता है.
  Deleted versions को restore या republish नहीं किया जा सकता. current latest version को delete करने से पहले
  replacement publish करें. इस version-only flow के लिए package owner या org publisher
  admin चाहिए; platform staff package ownership bypass नहीं करते.
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin चाहिए.
- Flags:
  - `--version <version>`: एक non-latest version स्थायी रूप से delete करें.
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases restore करता है.
- कोई version undelete नहीं है; स्थायी रूप से deleted versions restore नहीं किए जा सकते.
- package owner, org publisher owner/admin, platform moderator,
  या platform admin चाहिए.
- `POST /api/v1/packages/{name}/undelete` कॉल करता है.
- Flags:
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को दूसरे publisher को transfer करता है.
- current package owner और destination
  publisher दोनों के लिए admin access चाहिए, जब तक platform admin द्वारा perform न किया जाए.
- Scoped package names matching scope owner को ही transfer होने चाहिए.
- `POST /api/v1/packages/{name}/transfer` कॉल करता है.
- Flags:
  - `--to <owner>`: destination publisher handle.
  - `--reason <text>`: optional audit reason.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- package को moderators को report करने के लिए authenticated command.
- `POST /api/v1/packages/{name}/report` कॉल करता है.
- Reports package-level होते हैं, optional रूप से किसी version से जुड़े होते हैं, और review के लिए
  moderators को visible हो जाते हैं.
- Reports अपने आप packages hide नहीं करते या downloads block नहीं करते.
- Flags:
  - `--version <version>`: report से attach करने के लिए optional package version.
  - `--reason <text>`: required report reason.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility check करने के लिए owner command.
- `GET /api/v1/packages/{name}/moderation` कॉल करता है.
- current package scan state, open report count, latest release manual
  moderation state, download block state, और moderation reasons दिखाता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- check करता है कि package future OpenClaw consumption के लिए ready है या नहीं.
- `GET /api/v1/packages/{name}/readiness` कॉल करता है.
- official status, ClawPack availability, artifact digest,
  source provenance, OpenClaw compatibility, host targets, environment metadata,
  और scan state के लिए blockers report करता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- ऐसे package के लिए operator-oriented migration status दिखाता है जो किसी
  bundled OpenClaw Plugin को replace कर सकता है.
- `package readiness` जैसा ही computed readiness endpoint कॉल करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers प्रिंट करता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user के owned org publisher को create करता है.
- handle को lowercase में normalize किया जाता है और `@` के साथ या बिना pass किया जा सकता है.
- Newly created org publishers default रूप से trusted/official नहीं होते.
- अगर handle किसी existing publisher, user, या reserved route द्वारा already used है तो fail होता है.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के ज़रिए code Plugin या bundle Plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub रिपॉज़िटरी: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- Metadata `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle markers जैसे
  `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से अपने-आप पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI सटीक npm-pack
  bytes अपलोड करता है और निकाली गई `package/` सामग्री का उपयोग केवल सत्यापन और
  metadata prefill के लिए करता है।
- code-Plugin फ़ोल्डर अपलोड से पहले ClawPack npm tarball में पैक किए जाते हैं ताकि
  OpenClaw इंस्टॉल सटीक artifact सत्यापित कर सकें। bundle-Plugin फ़ोल्डर अब भी
  extracted-file publish path का उपयोग करते हैं।
- GitHub स्रोतों के लिए, source attribution रिपॉज़िटरी, resolved commit, ref, और subpath से अपने-आप भरा जाता है।
- स्थानीय फ़ोल्डरों के लिए, source attribution स्थानीय git से अपने-आप पहचाना जाता है जब origin remote GitHub की ओर संकेत करता है।
- बाहरी code Plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करने होंगे।
  शीर्ष-स्तरीय `package.json.version` को publish validation के fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` अपलोड किए बिना resolved publish payload का पूर्वावलोकन करता है।
- `--json` CI के लिए machine-readable आउटपुट देता है।
- जब actor के पास publisher access हो, तो `--owner <handle>` किसी user या org publisher handle के अंतर्गत प्रकाशित करता है।
- scoped package नाम चुने गए owner से मेल खाने चाहिए। `docs/publishing.md` देखें।
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अब भी overrides के रूप में काम करते हैं।
- निजी GitHub रिपॉज़िटरी के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि आप live release बनाने से पहले resolved package metadata और
source attribution की पुष्टि कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर flow

code Plugins के लिए, folder publish package folder से ClawPack artifact बनाकर अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी code Plugins को `package.json` में थोड़ी OpenClaw metadata चाहिए।
यह न्यूनतम manifest सफल publish के लिए पर्याप्त है:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

आवश्यक fields:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

नोट्स:

- `package.json.version` आपके package release का version है, लेकिन इसका उपयोग
  OpenClaw compatibility/build validation के fallback के रूप में नहीं किया जाता।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
  ClawHub मौजूद होने पर उन्हें दिखा सकता है, लेकिन publish के लिए वे आवश्यक नहीं हैं।
- यदि आप अधिक विस्तृत compatibility metadata प्रकाशित करना चाहते हैं, तो `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक extras हैं।
- यदि आप पुरानी `clawhub` CLI release का उपयोग कर रहे हैं, तो प्रकाशित करने से पहले upgrade करें ताकि
  स्थानीय preflight checks upload से पहले चलें।
- यदि validation कोई remediation code रिपोर्ट करता है, तो
  [Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub Plugin रिपॉज़िटरी के लिए
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
पर एक आधिकारिक reusable workflow भी भेजता है।

सामान्य caller setup:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

नोट्स:

- reusable workflow `source` को caller repo पर default करता है।
- monorepos के लिए, `source_path` पास करें ताकि workflow Plugin
  package folder प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`।
- reusable workflow को stable tag या full commit SHA पर pin करें। `@main` से release publishing न चलाएँ।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए ताकि CI non-polluting रहे।
- वास्तविक publishes को `workflow_dispatch` या tag pushes जैसे trusted events तक सीमित रखना चाहिए।
- secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करता है; tag pushes को अब भी `clawhub_token` चाहिए।
- first publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- workflow JSON result को artifact के रूप में upload करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है।
- config set करने के बाद repository, workflow filename,
  और optional environment pin की पुष्टि करने के लिए इसका उपयोग करें।
- Flags:
  - `--json`: machine-readable आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- मौजूदा package के लिए GitHub Actions trusted publisher config attach या replace करता है।
- package पहले normal manual या token-authenticated
  `clawhub package publish` के ज़रिए बनाया जाना चाहिए।
- config set होने के बाद, भविष्य के supported GitHub Actions publishes लंबे समय तक रहने वाले ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` `owner/repo` होना चाहिए।
- `--workflow-filename <file>` को
  `.github/workflows/` में workflow file name से मेल खाना चाहिए।
- `--environment <name>` वैकल्पिक है। configure होने पर, OIDC claim में GitHub Actions
  environment बिल्कुल मेल खाना चाहिए।
- यह command चलने पर ClawHub configured GitHub repository सत्यापित करता है।
  public repositories को public GitHub metadata के ज़रिए सत्यापित किया जा सकता है। private
  repositories के लिए ClawHub के पास उस repository तक GitHub access होना आवश्यक है, जैसे
  भविष्य के ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के ज़रिए।
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: वैकल्पिक exact-match GitHub Actions environment।
  - `--json`: machine-readable आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- package से trusted publisher config हटाता है।
- यदि workflow, repository, या environment pin को disable या re-create करना हो, तो इसे rollback के रूप में उपयोग करें।
- भविष्य के real publishes को config फिर से set होने तक normal authenticated publishing का उपयोग करना होगा।
- Flags:
  - `--json`: machine-readable आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install telemetry

- login होने पर `clawhub install <slug>` के बाद भेजा जाता है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` set न हो।
- reporting best-effort है। telemetry उपलब्ध न होने पर install commands fail नहीं होते।
- विवरण: `docs/telemetry.md`।
