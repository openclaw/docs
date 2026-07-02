---
read_when:
    - ClawHub CLI का उपयोग करना
    - इंस्टॉल, अपडेट, या पब्लिश को डीबग करना
summary: 'CLI संदर्भ: कमांड, फ़्लैग, कॉन्फ़िग, और लॉकफ़ाइल व्यवहार।'
x-i18n:
    generated_at: "2026-07-02T00:53:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8af3d4d7c689fd0dc774354f275dd75fa44ec723880e3895d980a755f81a7d
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI पैकेज: `clawhub`, बिन: `clawhub`.

इसे npm या pnpm के साथ ग्लोबली इंस्टॉल करें:

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

## ग्लोबल फ़्लैग

- `--workdir <dir>`: कार्यशील डायरेक्टरी (डिफ़ॉल्ट: cwd; कॉन्फ़िगर होने पर Clawdbot workspace पर वापस जाता है)
- `--dir <dir>`: workdir के अंतर्गत इंस्टॉल dir (डिफ़ॉल्ट: `skills`)
- `--site <url>`: ब्राउज़र लॉगिन के लिए बेस URL (डिफ़ॉल्ट: `https://clawhub.ai`)
- `--registry <url>`: API बेस URL (डिफ़ॉल्ट: खोजा गया, अन्यथा `https://clawhub.ai`)
- `--no-input`: प्रॉम्प्ट अक्षम करें

Env समकक्ष:

- `CLAWHUB_SITE` (लेगेसी `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (लेगेसी `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (लेगेसी `CLAWDHUB_WORKDIR`)

### HTTP प्रॉक्सी

CLI कॉर्पोरेट प्रॉक्सी या प्रतिबंधित नेटवर्क के पीछे मौजूद सिस्टम के लिए मानक HTTP प्रॉक्सी environment variables का सम्मान करता है:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

जब इनमें से कोई भी variable सेट होता है, CLI outbound requests को निर्दिष्ट प्रॉक्सी के माध्यम से route करता है। `HTTPS_PROXY` HTTPS requests के लिए उपयोग होता है, `HTTP_PROXY` plain HTTP के लिए। विशिष्ट hosts या domains के लिए प्रॉक्सी को bypass करने हेतु `NO_PROXY` / `no_proxy` का सम्मान किया जाता है।

यह उन सिस्टम पर आवश्यक है जहां direct outbound connections blocked हैं (जैसे Docker containers, proxy-only internet वाला Hetzner VPS, corporate firewalls).

उदाहरण:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

जब कोई proxy variable सेट नहीं होता, व्यवहार अपरिवर्तित रहता है (direct connections).

## कॉन्फ़िग फ़ाइल

आपका API token + cached registry URL संग्रहीत करता है।

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- लेगेसी fallback: यदि `clawhub/config.json` अभी मौजूद नहीं है लेकिन `clawdhub/config.json` मौजूद है, तो CLI लेगेसी path का पुनः उपयोग करता है
- override: `CLAWHUB_CONFIG_PATH` (लेगेसी `CLAWDHUB_CONFIG_PATH`)

## कमांड

### `login` / `auth login`

- डिफ़ॉल्ट: ब्राउज़र को `<site>/cli/auth` पर खोलता है और loopback callback के माध्यम से पूरा करता है।
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` एक code प्रिंट करता है और प्रतीक्षा करता है जब तक आप इसे `<site>/cli/device` पर authorize करते हैं।

### `whoami`

- Stored token को `/api/v1/whoami` के माध्यम से सत्यापित करता है।

### `token`

- Stored API token को stdout पर प्रिंट करता है।
- Local login token को CI secret setup commands में pipe करने के लिए उपयोगी।

### `star <skill>` / `unstar <skill>`

- आपके highlights से skill जोड़ता/हटाता है।
- `POST /api/v1/stars/<slug>` और `DELETE /api/v1/stars/<slug>` को call करता है।
- `--yes` पुष्टि को छोड़ देता है।

### `search <query...>`

- `/api/v1/search?q=...` को call करता है।
- Output में skill slug, owner handle, display name, और relevance score शामिल होते हैं।
- Search download popularity से पहले exact slug/name token matches को प्राथमिकता देता है। `map` जैसा standalone slug token `amap` के अंदर substring की तुलना में `personal-map` से अधिक मजबूती से match करता है।
- Popularity एक छोटा ranking prior है, top placement की guarantee नहीं।
- यदि कोई skill दिखाई देना चाहिए लेकिन नहीं दिखता, तो metadata rename करने से पहले owner-visible moderation diagnostics जांचने के लिए logged in रहते हुए `clawhub inspect @owner/slug` चलाएं।

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` के माध्यम से newest skills सूचीबद्ध करता है (`createdAt` desc से sorted).
- फ़्लैग:
  - `--limit <n>` (1-200, डिफ़ॉल्ट: 25)
  - `--sort newest|updated|rating|downloads|trending` (डिफ़ॉल्ट: newest). Legacy install sort aliases compatibility के लिए अब भी काम करते हैं।
  - `--json` (machine-readable output)
- Output: `<slug>  v<version>  <age>  <summary>` (summary 50 chars तक truncated).

### `inspect @owner/slug`

- Install किए बिना skill metadata और version files fetch करता है।
- `--version <version>`: किसी specific version को inspect करें (डिफ़ॉल्ट: latest).
- `--tag <tag>`: किसी tagged version को inspect करें (जैसे `latest`).
- `--versions`: version history सूचीबद्ध करें (पहला page).
- `--limit <n>`: सूचीबद्ध करने के लिए max versions (1-200).
- `--files`: selected version के लिए files सूचीबद्ध करें।
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `install @owner/slug`

- Named owner और skill के लिए latest version resolve करता है।
- `/api/v1/download` के माध्यम से zip download करता है।
- `<workdir>/<dir>/<slug>` में extract करता है।
- Pinned skills को overwrite करने से मना करता है; पहले `clawhub unpin <skill>` चलाएं।
- लिखता है:
  - `<workdir>/.clawhub/lock.json` (लेगेसी `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (लेगेसी `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` हटाता है और lockfile entry delete करता है।
- Logged in रहते हुए best-effort telemetry भेजता है ताकि current install counts deactivate हो सकें।
- Interactive: confirmation मांगता है।
- Non-interactive (`--no-input`): `--yes` आवश्यक है।

### `list`

- `<workdir>/.clawhub/lock.json` पढ़ता है (लेगेसी `.clawdhub`).
- `clawhub pin` के साथ frozen skills के आगे `pinned` दिखाता है, optional reason सहित।

### `pin <skill>`

- Installed skill को lockfile में pinned के रूप में mark करता है।
- `--reason <text>` record करता है कि skill frozen क्यों है।
- Pinned skills को `update --all` द्वारा skip किया जाता है और direct `update <skill>` द्वारा reject किया जाता है।
- Pinned skills `install --force` को भी reject करते हैं ताकि local bytes accidentally replace न हों।

### `unpin <skill>`

- Installed skill से lockfile pin हटाता है ताकि future updates इसे modify कर सकें।

### `update [@owner/slug]` / `update --all`

- Local files से fingerprint compute करता है।
- यदि fingerprint किसी known version से match करता है: कोई prompt नहीं।
- यदि fingerprint match नहीं करता:
  - default रूप से refuses
  - `--force` के साथ overwrite करता है (या interactive होने पर prompt)
- Pinned skills कभी भी `--force` द्वारा update नहीं होते।
- `update <skill>` pinned skills के लिए fail fast करता है और आपको पहले `clawhub unpin <skill>` चलाने के लिए कहता है।
- `update --all` pinned slugs को skip करता है और जो frozen रहा उसका summary print करता है।

### `skill publish <path>`

- Local bundle fingerprint की तुलना ClawHub से करता है और content पहले से published होने पर successfully exit करता है।
- New skills का default `1.0.0` होता है; changed skills का default next patch version होता है।
- `--version <version>` explicit रूप से version select करता है और content existing version से match होने पर भी publish करता है।
- `--dry-run` upload किए बिना publish resolve करता है; `--json` machine-readable result print करता है।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब actor के पास publisher access हो।
- `--migrate-owner` new version publish करते समय existing skill को `--owner` पर move करता है। दोनों publishers पर admin/owner access आवश्यक है।
- Owner और review behavior `docs/publishing.md` में explained है।
- Skill publish करने का मतलब है कि यह ClawHub पर `MIT-0` के अंतर्गत release होता है।
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
workflow एक `skill_path` के लिए, या `root` (डिफ़ॉल्ट: `skills`) के अंतर्गत प्रत्येक immediate skill folder के लिए `skill publish` call करता है। यह unchanged skills को skip करता है और वही automatic patch-version behavior use करता है।

Token के बिना preview करने के लिए `dry_run: true` सेट करें। Real publishes के लिए `clawhub_token` secret आवश्यक है।

### `sync`

- Current workdir, configured skills directory, और किसी भी `--root <dir>` folders को local skill folders के लिए scan करता है जिनमें `SKILL.md` या `skill.md` हो।
- प्रत्येक local skill fingerprint की तुलना ClawHub से करता है और केवल new या changed skills publish करता है।
- New skills `1.0.0` के रूप में publish होते हैं; changed skills default रूप से next patch version publish करते हैं। Update batches के लिए जिन्हें larger semver step से move करना चाहिए, `--bump minor|major` use करें।
- `--dry-run` upload किए बिना publish plan दिखाता है; `--json` machine-readable plan print करता है।
- `--all` बिना prompt किए हर new या changed skill publish करता है। `--all` के बिना, interactive terminals आपको publish करने के लिए skills select करने देते हैं।
- `--owner <handle>` org/user publisher handle के अंतर्गत publish करता है जब actor के पास publisher access हो।
- `sync` केवल one-way publish है। यह install, update, download, या install/download telemetry report नहीं करता।

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` आवश्यक है।
- `POST /api/v1/skills/-/scan` के माध्यम से ClawHub ClawScan चलाता है, फिर scan terminal होने तक poll करता है।
- Scans asynchronous हैं और complete होने में समय लग सकता है। Queued रहते समय, terminal spinner current prioritized scan position और आगे कितने scans हैं दिखाता है।
- Published scans के लिए ownership या publisher management access आवश्यक है। Moderators/admins वही backend `clawhub-admin` के माध्यम से use कर सकते हैं।
- `--update` केवल `--slug` के साथ valid है; यह successful published scan results को selected version पर वापस लिखता है।
- `--output <file.zip>` full report archive download करता है जिसमें `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` शामिल हैं।
- `--json` automation के लिए full poll response print करता है।
- Local path scans अब supported नहीं हैं। New version upload करें, फिर उस submitted version के stored scan results retrieve करने के लिए `scan download` use करें।

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` आवश्यक है।
- Submitted skill या plugin version के लिए stored scan report ZIP download करता है, उन versions सहित जिन्हें ClawHub security checks ने block या hidden किया था।
- Skill downloads skill slug use करते हैं और default `--kind skill` होता है।
- Plugin downloads package name use करते हैं और `--kind plugin` आवश्यक है।
- `--version` आवश्यक है ताकि authors वही exact submitted version inspect करें जिसे ClawHub ने block किया।
- `--output <file.zip>` destination path चुनता है।

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub skill repos और catalog repos के लिए
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/skill-publish.yml)
पर official reusable workflow ship करता है।

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

नोट्स:

- Catalog repos के लिए `root` default रूप से `skills` होता है।
- एक skill folder process करने के लिए `skill_path: skills/review-helper` pass करें।
- `owner` CLI `--owner` flag पर map करता है; authenticated user के रूप में publish करने के लिए इसे omit करें।
- V1 skill publishing `clawhub_token` use करता है; GitHub OIDC trusted publishing अभी package-only है।

### `delete <skill>`

- `--version` के बिना, किसी skill को soft-delete करें (owner, moderator, या admin).
- `DELETE /api/v1/skills/{slug}` को कॉल करता है.
- owner द्वारा शुरू किए गए soft delete slug को 30 दिनों के लिए reserve करते हैं; command expiry time प्रिंट करता है.
- `--version <version>` fail-closed,
  version-specific route के ज़रिए एक owned non-latest version को स्थायी रूप से delete करता है.
  Delete किए गए versions restore या republish नहीं किए जा सकते. Current latest version delete करने से पहले replacement publish करें. Platform staff इस version-only flow में ownership को bypass नहीं करते.
- `--reason <text>` whole-skill soft-delete और audit log पर moderation note रिकॉर्ड करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation skip करता है.

### `undelete <skill>`

- hidden skill को restore करें (owner, moderator, या admin).
- कोई version undelete नहीं है; स्थायी रूप से delete किए गए versions restore नहीं किए जा सकते.
- `POST /api/v1/skills/{slug}/undelete` को कॉल करता है.
- `--reason <text>` skill और audit log पर moderation note रिकॉर्ड करता है.
- `--note <text>` `--reason` का alias है.
- `--yes` confirmation skip करता है.

### `hide <skill>`

- skill छिपाएँ (owner, moderator, या admin).
- `delete` का alias.

### `unhide <skill>`

- skill को unhide करें (owner, moderator, या admin).
- `undelete` का alias.

### `skill rename <skill> <new-name>`

- owned skill का नाम बदलें और पिछले slug को redirect alias के रूप में रखें.
- `POST /api/v1/skills/{slug}/rename` को कॉल करता है.
- `--yes` confirmation skip करता है.

### `skill merge <source> <target>`

- एक owned skill को दूसरे owned skill में merge करें.
- source slug सार्वजनिक listing बंद कर देता है और target के लिए redirect alias बन जाता है.
- `POST /api/v1/skills/{sourceSlug}/merge` को कॉल करता है.
- `--yes` confirmation skip करता है.

### `transfer`

- ownership transfer workflow.
- user handles पर transfers एक pending request बनाते हैं जिसे recipient accept करता है.
- org/publisher handles पर transfers तुरंत apply होते हैं, केवल तब जब actor के पास
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

- `GET /api/v1/packages` और `GET /api/v1/packages/search` के ज़रिए unified package catalog browse या search करता है.
- इसे plugins और अन्य package-family entries के लिए उपयोग करें; top-level `search` skill search surface बना रहता है.
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
- इसे plugin metadata, compatibility, verification, source, और version/file inspection के लिए उपयोग करें.
- `--version <version>`: specific version inspect करें (default: latest).
- `--tag <tag>`: tagged version inspect करें (जैसे `latest`).
- `--versions`: version history list करें (first page).
- `--limit <n>`: list करने के लिए max versions (1-100).
- `--files`: selected version के लिए files list करें.
- `--file <path>`: raw file content fetch करें (केवल text files; 200KB limit).
- `--json`: machine-readable output.

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` के ज़रिए
  package version resolve करता है.
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

- local plugin package
  folder के विरुद्ध ClawHub CLI का bundled Plugin Inspector चलाता है.
- local
  OpenClaw checkout locate या import किए बिना, offline/static validation पर default करता है.
- Hard compatibility errors non-zero exit करते हैं. केवल warning findings print किए जाते हैं लेकिन
  zero exit करते हैं.
- Flags:
  - `--out <dir>`: Plugin Inspector reports इस directory में write करें.
  - `--openclaw <path>`: explicit local OpenClaw checkout के विरुद्ध inspect करें.
  - `--runtime`: runtime capture enable करें; plugin code import करता है.
  - `--allow-execute`: isolated workspace में runtime capture allow करें.
  - `--no-mock-sdk`: runtime capture के दौरान mocked OpenClaw SDK disable करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package validate ./example-plugin
```

यदि validation किसी package, manifest, SDK import, या artifact finding की report करता है, तो
[Plugin validation fixes](/clawhub/plugin-validation-fixes) देखें, फिर command दोबारा चलाएँ.

### `package delete <name>`

- `--version` के बिना, package और सभी releases को soft-delete करता है.
- `--version <version>` fail-closed,
  version-specific route के ज़रिए एक owned non-latest release को स्थायी रूप से delete करता है.
  Delete किए गए versions restore या republish नहीं किए जा सकते. Current latest version delete करने से पहले replacement publish करें. इस version-only flow के लिए package owner या org publisher
  admin चाहिए; platform staff package ownership bypass नहीं करते.
- Whole-package soft-delete के लिए package owner, org publisher owner/admin, platform
  moderator, या platform admin चाहिए.
- Flags:
  - `--version <version>`: एक non-latest version को स्थायी रूप से delete करें.
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- soft-deleted package और releases को restore करता है.
- कोई version undelete नहीं है; स्थायी रूप से delete किए गए versions restore नहीं किए जा सकते.
- package owner, org publisher owner/admin, platform moderator,
  या platform admin चाहिए.
- `POST /api/v1/packages/{name}/undelete` को कॉल करता है.
- Flags:
  - `--yes`: confirmation skip करें.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package को दूसरे publisher में transfer करता है.
- current package owner और destination
  publisher दोनों के लिए admin access चाहिए, जब तक कि platform admin द्वारा perform न किया गया हो.
- Scoped package names matching scope owner को transfer होने चाहिए.
- `POST /api/v1/packages/{name}/transfer` को कॉल करता है.
- Flags:
  - `--to <owner>`: destination publisher handle.
  - `--reason <text>`: optional audit reason.
  - `--json`: machine-readable output.

Example:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- moderators को package report करने के लिए authenticated command.
- `POST /api/v1/packages/{name}/report` को कॉल करता है.
- Reports package-level होते हैं, optional रूप से version से जुड़े होते हैं, और review के लिए
  moderators को visible हो जाते हैं.
- Reports स्वयं packages को auto-hide नहीं करते या downloads block नहीं करते.
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
- `GET /api/v1/packages/{name}/moderation` को कॉल करता है.
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
- `GET /api/v1/packages/{name}/readiness` को कॉल करता है.
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

- ऐसे package के लिए operator-oriented migration status दिखाता है जो bundled OpenClaw plugin को replace कर सकता है.
- `package readiness` जैसा ही computed readiness endpoint कॉल करता है, लेकिन
  migration-focused status, latest version, official-package state, checks, और
  blockers print करता है.
- Flags:
  - `--json`: machine-readable output.

Example:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user द्वारा owned org publisher बनाता है.
- handle को lowercase में normalize किया जाता है और `@` के साथ या बिना pass किया जा सकता है.
- Newly created org publishers default रूप से trusted/official नहीं होते.
- यदि handle पहले से किसी existing publisher, user, या reserved route द्वारा used है तो fail होता है.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` के ज़रिए code Plugin या bundle Plugin प्रकाशित करता है।
- `<source>` स्वीकार करता है:
  - स्थानीय फ़ोल्डर पथ: `./my-plugin`
  - स्थानीय ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub रेपो: `owner/repo` या `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- मेटाडेटा `package.json`, `openclaw.plugin.json`, और वास्तविक OpenClaw bundle मार्करों जैसे
  `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, और `.cursor-plugin/plugin.json` से अपने-आप पहचाना जाता है।
- `.tgz` स्रोतों को ClawPack माना जाता है। CLI ठीक वही npm-pack
  बाइट्स अपलोड करता है और निकाले गए `package/` कॉन्टेंट का उपयोग केवल सत्यापन और
  मेटाडेटा प्रीफिल के लिए करता है।
- code-Plugin फ़ोल्डरों को अपलोड से पहले ClawPack npm tarball में पैक किया जाता है ताकि
  OpenClaw इंस्टॉल ठीक उसी आर्टिफैक्ट को सत्यापित कर सकें। bundle-Plugin फ़ोल्डर अभी भी
  निकाली गई फ़ाइल वाले प्रकाशन पथ का उपयोग करते हैं।
- GitHub स्रोतों के लिए, स्रोत एट्रिब्यूशन रेपो, resolved commit, ref, और subpath से अपने-आप भरा जाता है।
- स्थानीय फ़ोल्डरों के लिए, जब origin remote GitHub की ओर इंगित करता है, तो स्रोत एट्रिब्यूशन स्थानीय git से अपने-आप पहचाना जाता है।
- बाहरी code Plugins को `openclaw.compat.pluginApi` और
  `openclaw.build.openclawVersion` स्पष्ट रूप से घोषित करने होंगे।
  शीर्ष-स्तरीय `package.json.version` को प्रकाशन सत्यापन के fallback के रूप में उपयोग नहीं किया जाता।
- `--dry-run` अपलोड किए बिना resolved publish payload का पूर्वावलोकन करता है।
- `--json` CI के लिए मशीन-पठनीय आउटपुट निकालता है।
- `--owner <handle>` उस user या org publisher handle के तहत प्रकाशित करता है जब actor के पास publisher access हो।
- scoped package नामों को चुने गए owner से मेल खाना चाहिए। `docs/publishing.md` देखें।
- मौजूदा flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) अभी भी overrides के रूप में काम करते हैं।
- निजी GitHub repos के लिए `GITHUB_TOKEN` आवश्यक है।

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### अनुशंसित स्थानीय flow

पहले `--dry-run` का उपयोग करें ताकि live release बनाने से पहले आप resolved package metadata और
source attribution की पुष्टि कर सकें:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### स्थानीय फ़ोल्डर flow

code Plugins के लिए, folder publish package folder से ClawPack artifact बनाता और अपलोड करता है:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` के लिए न्यूनतम `package.json`

बाहरी code Plugins को `package.json` में थोड़े OpenClaw metadata की आवश्यकता होती है।
सफल publish के लिए यह न्यूनतम manifest पर्याप्त है:

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

आवश्यक फ़ील्ड:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

टिप्पणियां:

- `package.json.version` आपके package release का version है, लेकिन इसे OpenClaw compatibility/build validation के fallback के रूप में उपयोग नहीं किया जाता।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
  मौजूद होने पर ClawHub इन्हें दिखा सकता है, लेकिन publish के लिए ये आवश्यक नहीं हैं।
- `openclaw.compat.minGatewayVersion` और
  `openclaw.build.pluginSdkVersion` वैकल्पिक extras हैं, यदि आप अधिक विस्तृत compatibility metadata प्रकाशित करना चाहते हैं।
- यदि आप पुराने `clawhub` CLI release का उपयोग कर रहे हैं, तो publish करने से पहले upgrade करें ताकि स्थानीय preflight checks upload से पहले चलें।
- यदि validation कोई remediation code रिपोर्ट करता है, तो
  [Plugin सत्यापन सुधार](/clawhub/plugin-validation-fixes) देखें।

#### GitHub Actions

ClawHub Plugin repos के लिए यहां एक official reusable workflow भी भेजता है:
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/package-publish.yml)

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

टिप्पणियां:

- reusable workflow `source` को default रूप से caller repo पर सेट करता है।
- monorepos के लिए, `source_path` पास करें ताकि workflow Plugin
  package folder प्रकाशित करे, उदाहरण के लिए `source_path: extensions/codex`।
- reusable workflow को स्थिर tag या पूरे commit SHA पर pin करें। `@main` से release publishing न चलाएं।
- `pull_request` को `dry_run: true` का उपयोग करना चाहिए ताकि CI non-polluting रहे।
- वास्तविक publishes को `workflow_dispatch` या tag pushes जैसे trusted events तक सीमित रखना चाहिए।
- secret के बिना trusted publishing केवल `workflow_dispatch` पर काम करता है; tag pushes के लिए अभी भी `clawhub_token` चाहिए।
- पहले publish, untrusted packages, या break-glass publishes के लिए `clawhub_token` उपलब्ध रखें।
- workflow JSON result को artifact के रूप में upload करता है और उसे workflow outputs के रूप में expose करता है।

### `package trusted-publisher get <name>`

- किसी package के लिए GitHub Actions trusted publisher config दिखाता है।
- config सेट करने के बाद repository, workflow filename,
  और वैकल्पिक environment pin की पुष्टि करने के लिए इसका उपयोग करें।
- Flags:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- मौजूदा package के लिए GitHub Actions trusted publisher config जोड़ता या बदलता है।
- package को पहले सामान्य manual या token-authenticated
  `clawhub package publish` के ज़रिए बनाया जाना चाहिए।
- config सेट होने के बाद, भविष्य के supported GitHub Actions publishes लंबे समय तक रहने वाले ClawHub token के बिना
  OIDC/trusted publishing का उपयोग कर सकते हैं।
- `--repository <repo>` को `owner/repo` होना चाहिए।
- `--workflow-filename <file>` को
  `.github/workflows/` में मौजूद workflow file name से मेल खाना चाहिए।
- `--environment <name>` वैकल्पिक है। configured होने पर, OIDC claim में GitHub Actions
  environment बिल्कुल मेल खाना चाहिए।
- इस command के चलने पर ClawHub configured GitHub repository को verify करता है।
  Public repositories को public GitHub metadata के माध्यम से verify किया जा सकता है। Private
  repositories के लिए ClawHub को उस repository तक GitHub access चाहिए, उदाहरण के लिए भविष्य के ClawHub GitHub App installation या किसी अन्य authorized
  GitHub integration के माध्यम से।
- Flags:
  - `--repository <repo>`: GitHub repository, उदाहरण के लिए `openclaw/example-plugin`।
  - `--workflow-filename <file>`: workflow file name, उदाहरण के लिए `package-publish.yml`।
  - `--environment <name>`: वैकल्पिक exact-match GitHub Actions environment।
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- किसी package से trusted publisher config हटाता है।
- यदि workflow, repository, या environment pin को disable या फिर से create करने की आवश्यकता हो, तो rollback के रूप में इसका उपयोग करें।
- भविष्य के वास्तविक publishes को config फिर से सेट होने तक सामान्य authenticated publishing का उपयोग करना होगा।
- Flags:
  - `--json`: मशीन-पठनीय आउटपुट।

उदाहरण:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### install telemetry

- logged in होने पर `clawhub install <slug>` के बाद भेजी जाती है, जब तक
  `CLAWHUB_DISABLE_TELEMETRY=1` सेट न हो।
- Reporting best-effort है। telemetry unavailable होने पर install commands fail नहीं होते।
- विवरण: `docs/telemetry.md`।
