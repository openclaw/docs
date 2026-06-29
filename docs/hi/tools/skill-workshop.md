---
read_when:
    - आप चाहते हैं कि एजेंट चैट से कोई कौशल बनाए या अपडेट करे
    - आपको जनरेट किए गए skill ड्राफ़्ट की समीक्षा करनी, उसे लागू करना, अस्वीकार करना या क्वारंटीन करना होगा
    - आप Skill Workshop की स्वीकृति, स्वायत्तता, स्टोरेज, या सीमाएं कॉन्फ़िगर कर रहे हैं
sidebarTitle: Skill Workshop
summary: Skill Workshop समीक्षा के माध्यम से workspace Skills बनाएँ और अपडेट करें
title: कौशल कार्यशाला
x-i18n:
    generated_at: "2026-06-29T00:23:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop कार्यस्थल skills बनाने और अपडेट करने के लिए OpenClaw का शासित पथ है।

एजेंट और ऑपरेटर इस पथ के माध्यम से सक्रिय `SKILL.md` फ़ाइलें सीधे नहीं लिखते। वे पहले एक **प्रस्ताव** बनाते हैं। प्रस्ताव एक लंबित ड्राफ्ट होता है जिसमें प्रस्तावित skill सामग्री, लक्ष्य बाइंडिंग, स्कैनर स्थिति, हैश, सहायक-फ़ाइल मेटाडेटा, और रोलबैक मेटाडेटा शामिल होते हैं। यह केवल लागू किए जाने पर लाइव skill बनता है।

Skill Workshop केवल कार्यस्थल skills लिखता है। यह bundled, plugin, ClawHub, extra-root, managed, personal-agent, या system skills को परिवर्तित नहीं करता।

## यह कैसे काम करता है

- **पहले प्रस्ताव:** जनरेट की गई skill सामग्री `SKILL.md` नहीं, बल्कि `PROPOSAL.md` के रूप में संग्रहीत होती है।
- **लागू करना ही एकमात्र लाइव लेखन है:** create, update, और revise सक्रिय skills को नहीं बदलते।
- **कार्यस्थल-सीमित:** create लक्ष्य कार्यस्थल `skills/` रूट को बनाते हैं। अपडेट केवल लिखने योग्य कार्यस्थल skills के लिए अनुमत हैं।
- **ओवरराइट नहीं:** यदि लक्ष्य skill पहले से मौजूद है, तो create विफल हो जाता है।
- **हैश-बद्ध:** अपडेट प्रस्ताव वर्तमान लक्ष्य हैश से बंधते हैं और यदि apply से पहले लाइव skill बदल जाती है तो पुराने हो जाते हैं।
- **स्कैनर-नियंत्रित:** apply लिखने से पहले स्कैनिंग दोबारा चलाता है।
- **पुनर्प्राप्त करने योग्य:** apply लाइव फ़ाइलें बदलने से पहले रोलबैक मेटाडेटा लिखता है।
- **सुसंगत सतहें:** chat, CLI, और Gateway सभी वही Skill Workshop सेवा कॉल करते हैं।

## जीवनचक्र

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

केवल `pending` प्रस्तावों को revise, apply, reject, या quarantine किया जा सकता है।

## Chat

एजेंट से वह skill मांगें जो आप चाहते हैं। एजेंट `skill_workshop` कॉल करता है और प्रस्ताव id लौटाता है।

बनाएं:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

मौजूदा कार्यस्थल skill अपडेट करें:

```text
Update trip-planning to also check seat maps before booking.
```

लंबित प्रस्ताव पर पुनरावृत्ति करें:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

डिफ़ॉल्ट रूप से, एजेंट द्वारा शुरू किए गए `apply`, `reject`, और `quarantine` चलने से पहले एक स्वीकृति prompt दिखाते हैं। विश्वसनीय वातावरणों के लिए prompt छोड़ने के लिए `skills.workshop.approvalPolicy` को `"auto"` पर सेट करें।

## CLI

नया skill प्रस्ताव बनाएं:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

मौजूदा कार्यस्थल skill के लिए अपडेट प्रस्ताव बनाएं:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

सूचीबद्ध करें और निरीक्षण करें:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

स्वीकृति से पहले संशोधित करें:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

प्रस्ताव को पूरा करें:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## प्रस्ताव सामग्री

लंबित रहते समय, प्रस्ताव `PROPOSAL.md` के रूप में केवल-प्रस्ताव frontmatter के साथ संग्रहीत होता है:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

लागू करने पर, Skill Workshop सक्रिय `SKILL.md` लिखता है और केवल-प्रस्ताव फ़ील्ड हटाता है: `status`, प्रस्ताव `version`, और प्रस्ताव `date`।

## सहायक फ़ाइलें

जब प्रस्तावित skill को `PROPOSAL.md` के साथ फ़ाइलों की आवश्यकता हो, तो `--proposal-dir` का उपयोग करें:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

डायरेक्टरी में `PROPOSAL.md` होना चाहिए। सहायक फ़ाइलें इनके अंतर्गत होनी चाहिए:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop प्रस्ताव के साथ सहायक फ़ाइलों को स्कैन, हैश, और संग्रहीत करता है। वे केवल apply पर लाइव `SKILL.md` के साथ लिखी जाती हैं।

अस्वीकृत सहायक-फ़ाइल पथों में absolute paths, छिपे path segments, path traversal, overlapping paths, प्रस्ताव directories से executable files, non-UTF-8 text, null bytes, और मानक support folders के बाहर की फ़ाइलें शामिल हैं।

## एजेंट टूल

मॉडल `skill_workshop` का उपयोग करता है:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

एजेंटों को generated skill work के लिए `skill_workshop` का उपयोग करना चाहिए। उन्हें `write`, `edit`, `exec`, shell commands, या direct filesystem operations के माध्यम से proposal files बनानी या बदलनी नहीं चाहिए।

<Note>
`skill_workshop` एक built-in agent tool है और `tools.profile: "coding"` में शामिल है। यदि कोई stricter policy इसे छिपाती है, तो `skill_workshop` को सक्रिय `tools.allow` सूची में जोड़ें, या जब scope बिना explicit `tools.allow` वाले profile का उपयोग करता हो तो `tools.alsoAllow: ["skill_workshop"]` का उपयोग करें। Sandboxed runs host-side Skill Workshop tool नहीं बनाते, इसलिए proposal review actions को सामान्य host-side agent session या CLI से चलाएं।
</Note>

## स्वीकृति और स्वायत्तता

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

- `autonomous.enabled`: सफल turns के बाद durable conversation signals से OpenClaw को pending proposals बनाने की अनुमति देता है। डिफ़ॉल्ट: `false`।
- `allowSymlinkTargetWrites`: apply को workspace skill symlinks के माध्यम से लिखने की अनुमति देता है जिनका वास्तविक लक्ष्य `skills.load.allowSymlinkTargets` में सूचीबद्ध है। डिफ़ॉल्ट: `false`।
- `approvalPolicy: "pending"`: agent-initiated `apply`, `reject`, या `quarantine` से पहले approval prompt आवश्यक करता है।
- `approvalPolicy: "auto"`: उस approval prompt को छोड़ देता है। एजेंट को फिर भी action कॉल करना होगा।
- `maxPending`: प्रति कार्यस्थल pending और quarantined proposals की सीमा तय करता है।
- `maxSkillBytes`: proposal body size की सीमा तय करता है। डिफ़ॉल्ट: `40000`।

प्रस्ताव विवरण हमेशा 160 bytes तक सीमित होते हैं।

## Gateway methods

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Read-only methods के लिए `operator.read` आवश्यक है। Mutating methods के लिए `operator.admin` आवश्यक है।

## संग्रहण

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

डिफ़ॉल्ट state directory: `~/.openclaw`।

- `proposal.json`: canonical proposal record।
- `proposals.json`: तेज़ listing index, proposal folders से rebuild किया जा सकता है।
- `PROPOSAL.md`: pending skill proposal।
- `rollback.json`: apply द्वारा live files बदलने से पहले लिखा गया recovery metadata।

## सीमाएं

- विवरण: 160 bytes।
- प्रस्ताव body: `skills.workshop.maxSkillBytes` (डिफ़ॉल्ट 40,000)।
- सहायक फ़ाइलें: प्रति प्रस्ताव 64।
- सहायक फ़ाइल आकार: प्रत्येक 256 KB, कुल 2 MB।
- Pending और quarantined proposals: प्रति कार्यस्थल `skills.workshop.maxPending` (डिफ़ॉल्ट 50)।

## समस्या निवारण

| समस्या                                        | समाधान                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` को 160 bytes या उससे कम तक छोटा करें।                                                                                                                                                                 |
| `Skill proposal content is too large`          | proposal body को छोटा करें या `skills.workshop.maxSkillBytes` बढ़ाएं।                                                                                                                                         |
| `Target skill changed after proposal creation` | वर्तमान लक्ष्य के विरुद्ध proposal को revise करें, या नया proposal बनाएं।                                                                                                                                   |
| `Proposal scan failed`                         | scanner findings का निरीक्षण करें, फिर proposal को revise या quarantine करें।                                                                                                                                           |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` कॉन्फ़िगर करें और `skills.workshop.allowSymlinkTargetWrites` केवल जानबूझकर साझा skill roots के लिए सक्षम करें।                                                                  |
| `Support file paths must be under one of...`   | support files को `assets/`, `examples/`, `references/`, `scripts/`, या `templates/` के अंतर्गत ले जाएं।                                                                                                                |
| Proposal does not show in list                 | चुने गए `--agent` कार्यस्थल और `OPENCLAW_STATE_DIR` की जांच करें।                                                                                                                                            |
| Agent cannot call `skill_workshop`             | सक्रिय tool policy और run mode की जांच करें। `coding` tool शामिल करता है; restrictive `tools.allow` policies में इसे स्पष्ट रूप से सूचीबद्ध करना होगा, और sandboxed runs को सामान्य host-side agent session या CLI का उपयोग करना होगा। |

## संबंधित

- [Skills](/hi/tools/skills) load order, precedence, और visibility के लिए
- [Skills बनाना](/hi/tools/creating-skills) हाथ से लिखे गए `SKILL.md` की बुनियादी बातों के लिए
- [Skills config](/hi/tools/skills-config) पूर्ण `skills.workshop` schema के लिए
- [Skills CLI](/hi/cli/skills) `openclaw skills` commands के लिए
