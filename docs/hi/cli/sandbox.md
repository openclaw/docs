---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: सैंडबॉक्स रनटाइम प्रबंधित करें और प्रभावी सैंडबॉक्स नीति का निरीक्षण करें
title: Sandbox CLI
x-i18n:
    generated_at: "2026-06-28T22:52:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

सैंडबॉक्स रनटाइम प्रबंधित करें, ताकि अलग-थलग एजेंट निष्पादन हो सके।

## अवलोकन

OpenClaw सुरक्षा के लिए एजेंटों को अलग-थलग सैंडबॉक्स रनटाइम में चला सकता है। `sandbox` कमांड आपको अपडेट या कॉन्फ़िगरेशन बदलावों के बाद उन रनटाइम को जाँचने और फिर से बनाने में मदद करते हैं।

आज आम तौर पर इसका अर्थ है:

- Docker सैंडबॉक्स कंटेनर
- SSH सैंडबॉक्स रनटाइम जब `agents.defaults.sandbox.backend = "ssh"`
- OpenShell सैंडबॉक्स रनटाइम जब `agents.defaults.sandbox.backend = "openshell"`

`ssh` और OpenShell `remote` के लिए, Docker की तुलना में recreate अधिक महत्वपूर्ण है:

- प्रारंभिक सीड के बाद रिमोट वर्कस्पेस ही canonical होता है
- `openclaw sandbox recreate` चुने गए स्कोप के लिए उस canonical रिमोट वर्कस्पेस को हटाता है
- अगला उपयोग उसे वर्तमान स्थानीय वर्कस्पेस से फिर से सीड करता है

## कमांड

### `openclaw sandbox explain`

**प्रभावी** सैंडबॉक्स मोड/स्कोप/वर्कस्पेस एक्सेस, सैंडबॉक्स टूल नीति, और elevated gates का निरीक्षण करें (fix-it कॉन्फ़िग कुंजी पथों के साथ)।

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

सभी सैंडबॉक्स रनटाइम को उनकी स्थिति और कॉन्फ़िगरेशन के साथ सूचीबद्ध करें।

```bash
openclaw sandbox list
openclaw sandbox list --browser  # केवल ब्राउज़र कंटेनर सूचीबद्ध करें
openclaw sandbox list --json     # JSON आउटपुट
```

**आउटपुट में शामिल है:**

- रनटाइम नाम और स्थिति
- बैकएंड (`docker`, `openshell`, आदि)
- कॉन्फ़िग लेबल और क्या वह वर्तमान कॉन्फ़िग से मेल खाता है
- आयु (बनने के बाद से समय)
- निष्क्रिय समय (अंतिम उपयोग के बाद से समय)
- संबंधित सत्र/एजेंट

### `openclaw sandbox recreate`

अपडेट किए गए कॉन्फ़िग के साथ फिर से बनाने के लिए सैंडबॉक्स रनटाइम हटाएँ।

```bash
openclaw sandbox recreate --all                # सभी कंटेनर फिर से बनाएँ
openclaw sandbox recreate --session main       # विशिष्ट सत्र
openclaw sandbox recreate --agent mybot        # विशिष्ट एजेंट
openclaw sandbox recreate --browser            # केवल ब्राउज़र कंटेनर
openclaw sandbox recreate --all --force        # पुष्टि छोड़ें
```

**विकल्प:**

- `--all`: सभी सैंडबॉक्स कंटेनर फिर से बनाएँ
- `--session <key>`: विशिष्ट सत्र के लिए कंटेनर फिर से बनाएँ
- `--agent <id>`: विशिष्ट एजेंट के लिए कंटेनर फिर से बनाएँ
- `--browser`: केवल ब्राउज़र कंटेनर फिर से बनाएँ
- `--force`: पुष्टि प्रॉम्प्ट छोड़ें

<Note>
एजेंट के अगले उपयोग पर रनटाइम अपने-आप फिर से बनाए जाते हैं।
</Note>

## उपयोग के मामले

### Docker इमेज अपडेट करने के बाद

```bash
# नई इमेज पुल करें
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# नई इमेज उपयोग करने के लिए कॉन्फ़िग अपडेट करें
# कॉन्फ़िग संपादित करें: agents.defaults.sandbox.docker.image (या agents.list[].sandbox.docker.image)

# कंटेनर फिर से बनाएँ
openclaw sandbox recreate --all
```

### सैंडबॉक्स कॉन्फ़िगरेशन बदलने के बाद

```bash
# कॉन्फ़िग संपादित करें: agents.defaults.sandbox.* (या agents.list[].sandbox.*)

# नया कॉन्फ़िग लागू करने के लिए फिर से बनाएँ
openclaw sandbox recreate --all
```

### SSH लक्ष्य या SSH auth सामग्री बदलने के बाद

```bash
# कॉन्फ़िग संपादित करें:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

मुख्य `ssh` बैकएंड के लिए, recreate SSH लक्ष्य पर प्रति-स्कोप रिमोट वर्कस्पेस रूट को हटाता है। अगला रन उसे स्थानीय वर्कस्पेस से फिर से सीड करता है।

### OpenShell स्रोत, नीति, या मोड बदलने के बाद

```bash
# कॉन्फ़िग संपादित करें:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` मोड के लिए, recreate उस स्कोप के canonical रिमोट वर्कस्पेस को हटाता है। अगला रन उसे स्थानीय वर्कस्पेस से फिर से सीड करता है।

### setupCommand बदलने के बाद

```bash
openclaw sandbox recreate --all
# या केवल एक एजेंट:
openclaw sandbox recreate --agent family
```

### केवल किसी विशिष्ट एजेंट के लिए

```bash
# केवल एक एजेंट के कंटेनर अपडेट करें
openclaw sandbox recreate --agent alfred
```

## इसकी आवश्यकता क्यों है

जब आप सैंडबॉक्स कॉन्फ़िगरेशन अपडेट करते हैं:

- मौजूदा रनटाइम पुरानी सेटिंग्स के साथ चलते रहते हैं।
- रनटाइम केवल 24h निष्क्रियता के बाद pruned किए जाते हैं।
- नियमित रूप से उपयोग किए जाने वाले एजेंट पुराने रनटाइम को अनिश्चित काल तक जीवित रखते हैं।

पुराने रनटाइम को बलपूर्वक हटाने के लिए `openclaw sandbox recreate` का उपयोग करें। अगली बार आवश्यकता होने पर वे वर्तमान सेटिंग्स के साथ अपने-आप फिर से बनाए जाते हैं।

<Tip>
मैनुअल बैकएंड-विशिष्ट cleanup की बजाय `openclaw sandbox recreate` को प्राथमिकता दें। यह Gateway की रनटाइम रजिस्ट्री का उपयोग करता है और स्कोप या सत्र कुंजियाँ बदलने पर mismatch से बचाता है।
</Tip>

## रजिस्ट्री माइग्रेशन

OpenClaw सैंडबॉक्स रनटाइम metadata को साझा SQLite state database में संग्रहीत करता है। पुराने installs में अभी भी legacy sandbox registry files हो सकती हैं:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

कुछ upgrades में `~/.openclaw/sandbox/containers/` या `~/.openclaw/sandbox/browsers/` के अंतर्गत प्रति container/browser एक JSON shard भी हो सकता है। नियमित sandbox runtime reads उन legacy sources को फिर से नहीं लिखते। वैध legacy entries को SQLite में migrate करने के लिए `openclaw doctor --fix` चलाएँ। अमान्य legacy files को quarantine किया जाता है, ताकि एक खराब पुरानी registry वर्तमान runtime entries को छिपा न सके।

## कॉन्फ़िगरेशन

सैंडबॉक्स सेटिंग्स `~/.openclaw/openclaw.json` में `agents.defaults.sandbox` के अंतर्गत रहती हैं (प्रति-एजेंट overrides `agents.list[].sandbox` में जाते हैं):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [सैंडबॉक्सिंग](/hi/gateway/sandboxing)
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)
- [Doctor](/hi/gateway/doctor): सैंडबॉक्स सेटअप की जाँच करता है।
