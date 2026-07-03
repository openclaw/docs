---
read_when:
    - ClawHub का पहली बार उपयोग
    - रजिस्ट्री से कोई कौशल या Plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugin खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-03T17:22:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# त्वरित शुरुआत

ClawHub OpenClaw Skills और plugins की registry है।

जब आप OpenClaw में चीज़ें install कर रहे हों, तो OpenClaw का उपयोग करें। जब आप sign in कर रहे हों, publish कर रहे हों, अपनी listings manage कर रहे हों, या registry-specific workflows का उपयोग कर रहे हों, तो `clawhub` CLI का उपयोग करें।

## skill ढूँढें और install करें

OpenClaw से search करें:

```bash
openclaw skills search "calendar"
```

skill install करें:

```bash
openclaw skills install @openclaw/demo
```

installed skills update करें:

```bash
openclaw skills update --all
```

OpenClaw यह record करता है कि skill कहाँ से आई थी, ताकि बाद के updates ClawHub के माध्यम से resolve करना जारी रख सकें।

## plugin ढूँढें और install करें

OpenClaw से search करें:

```bash
openclaw plugins search "calendar"
```

explicit ClawHub source के साथ ClawHub-hosted plugin install करें:

```bash
openclaw plugins install clawhub:<package>
```

installed plugins update करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw package को npm या किसी अन्य source के बजाय ClawHub के माध्यम से resolve करे, तो `clawhub:` prefix का उपयोग करें।

## publishing के लिए sign in करें

ClawHub CLI install करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub से sign in करें:

```bash
clawhub login
clawhub whoami
```

Headless environments ClawHub web UI से API token का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## skill publish करें

skill एक folder है जिसमें required `SKILL.md` file और optional supporting files होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

command unchanged content को skip करता है। नई skills `1.0.0` से शुरू होती हैं; बाद के changes automatically अगला patch version publish करते हैं। preview के लिए `--dry-run` या explicit version चुनने के लिए `--version` का उपयोग करें।

publish करने से पहले, `SKILL.md` में metadata check करें। required environment variables, tools, और permissions declare करें ताकि users install करने से पहले समझ सकें कि skill को क्या चाहिए। [Skill format](/hi/clawhub/skill-format) देखें।

multiple skills वाली repositories के लिए, reusable GitHub workflow `skills/` के अंतर्गत हर immediate skill folder के लिए `skill publish` call करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## plugin publish करें

local folder, GitHub repo, GitHub ref, या existing archive से plugin publish करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

publish किए बिना resolved package metadata, compatibility fields, source attribution, और upload plan का preview देखने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## install करने से पहले inspect करें

install करने से पहले, metadata, source links, versions, changelogs, और scan status inspect करने के लिए ClawHub web page या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Public listings latest scan state दिखाती हैं। moderation द्वारा held या blocked releases search और install surfaces से resolved होने तक hidden हो सकती हैं।
