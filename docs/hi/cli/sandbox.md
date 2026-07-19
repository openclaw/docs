---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: सैंडबॉक्स रनटाइम प्रबंधित करें और प्रभावी सैंडबॉक्स नीति का निरीक्षण करें
title: Sandbox CLI
x-i18n:
    generated_at: "2026-07-19T08:19:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

अलग-थलग एजेंट निष्पादन के लिए सैंडबॉक्स रनटाइम प्रबंधित करें: Docker कंटेनर, SSH लक्ष्य या OpenShell बैकएंड।

## कमांड

### `openclaw sandbox list`

स्थिति, बैकएंड, कॉन्फ़िगरेशन मिलान, आयु, निष्क्रिय समय और संबद्ध सत्र/एजेंट सहित सैंडबॉक्स रनटाइम सूचीबद्ध करें।

```bash
openclaw sandbox list
openclaw sandbox list --browser  # केवल ब्राउज़र कंटेनर
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

वर्तमान कॉन्फ़िगरेशन के साथ पुनर्निर्माण बाध्य करने के लिए सैंडबॉक्स रनटाइम हटाएँ। अगली बार एजेंट का उपयोग होने पर रनटाइम स्वचालित रूप से फिर से बनाए जाते हैं।

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # agent:mybot:* उप-सत्र शामिल हैं
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # केवल ब्राउज़र कंटेनर
openclaw sandbox recreate --all --force        # पुष्टि छोड़ें
```

विकल्प:

- `--all`: सभी सैंडबॉक्स कंटेनर फिर से बनाएँ
- `--session <key>`: इसी सटीक स्कोप कुंजी वाला रनटाइम फिर से बनाएँ (जैसा `sandbox list` द्वारा दिखाया गया है); छोटे नाम का विस्तार नहीं
- `--agent <id>`: एक एजेंट के रनटाइम फिर से बनाएँ (`agent:<id>` और `agent:<id>:*` से मेल खाता है)
- `--browser`: केवल ब्राउज़र कंटेनर को प्रभावित करें
- `--force`: पुष्टि प्रॉम्प्ट छोड़ें

`--all`, `--session` या `--agent` में से ठीक एक दें।

`ssh` और OpenShell `remote` के लिए, पुनर्निर्माण Docker की तुलना में अधिक महत्वपूर्ण है: प्रारंभिक सीड के बाद रिमोट वर्कस्पेस प्रामाणिक होता है, `recreate` चयनित स्कोप के लिए उस प्रामाणिक रिमोट वर्कस्पेस को हटा देता है और अगला रन उसे वर्तमान स्थानीय वर्कस्पेस से फिर से सीड करता है।

### `openclaw sandbox explain`

प्रभावी सैंडबॉक्स मोड/स्कोप/वर्कस्पेस पहुँच, सैंडबॉक्स टूल नीति और उन्नत-टूल गेट का निरीक्षण करें (सुधार हेतु कॉन्फ़िगरेशन कुंजी पथों सहित)।

रिपोर्ट `workspaceRoot` को कॉन्फ़िगर किए गए सैंडबॉक्स रूट के रूप में रखती है और प्रभावी होस्ट वर्कस्पेस, बैकएंड रनटाइम कार्यशील डायरेक्टरी तथा Docker माउंट तालिका अलग से दिखाती है। `workspaceAccess: "rw"` के लिए, प्रभावी होस्ट वर्कस्पेस `workspaceRoot` के अंतर्गत किसी डायरेक्टरी के बजाय एजेंट वर्कस्पेस होता है।

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session` के विपरीत, यह छोटे सत्र नाम (उदाहरण के लिए `main`) स्वीकार करता है और उन्हें निर्धारित एजेंट के अनुसार विस्तारित करता है।

## पुनर्निर्माण क्यों आवश्यक है

सैंडबॉक्स कॉन्फ़िगरेशन अपडेट करने से चल रहे कंटेनर प्रभावित नहीं होते: मौजूदा रनटाइम अपनी पुरानी सेटिंग बनाए रखते हैं और निष्क्रिय रनटाइम केवल `prune.idleHours` (डिफ़ॉल्ट 24h) के बाद हटाए जाते हैं। नियमित रूप से उपयोग किए जाने वाले एजेंट पुराने रनटाइम को अनिश्चित काल तक सक्रिय रख सकते हैं। `openclaw sandbox recreate` पुराने रनटाइम को हटा देता है ताकि अगला उपयोग उसे वर्तमान कॉन्फ़िगरेशन से फिर से बनाए।

<Tip>
बैकएंड-विशिष्ट मैन्युअल सफ़ाई के बजाय `openclaw sandbox recreate` को प्राथमिकता दें। यह Gateway की रनटाइम रजिस्ट्री का उपयोग करता है और स्कोप या सत्र कुंजियाँ बदलने पर असंगतियों से बचाता है।
</Tip>

## सामान्य कारण

| परिवर्तन                                                                                                                                                         | कमांड                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker इमेज अपडेट (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| सैंडबॉक्स कॉन्फ़िगरेशन (`agents.defaults.sandbox.*`)                                                                                                                   | `openclaw sandbox recreate --all`                                   |
| SSH लक्ष्य/प्रमाणीकरण (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| OpenShell स्रोत/नीति/मोड (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                           | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (या एक एजेंट के लिए `--agent <id>`) |

<Note>
अगली बार एजेंट का उपयोग होने पर रनटाइम स्वचालित रूप से फिर से बनाए जाते हैं।
</Note>

## रजिस्ट्री माइग्रेशन

सैंडबॉक्स रनटाइम मेटाडेटा साझा SQLite स्थिति डेटाबेस में रहता है। पुराने इंस्टॉलेशन में विरासती रजिस्ट्री फ़ाइलें हो सकती हैं जिन्हें नियमित रीड अब दोबारा नहीं लिखते:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` या `~/.openclaw/sandbox/browsers/` के अंतर्गत प्रति कंटेनर/ब्राउज़र एक JSON शार्ड

मान्य विरासती प्रविष्टियों को SQLite में माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ। अमान्य विरासती फ़ाइलों को क्वारंटीन किया जाता है ताकि कोई दूषित पुरानी रजिस्ट्री वर्तमान रनटाइम प्रविष्टियों को छिपा न सके।

## कॉन्फ़िगरेशन

सैंडबॉक्स सेटिंग `~/.openclaw/openclaw.json` में `agents.defaults.sandbox` के अंतर्गत होती हैं (प्रति-एजेंट ओवरराइड `agents.list[].sandbox` में रखे जाते हैं):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (Plugin द्वारा प्रदान किया गया)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... और Docker विकल्प
        },
        "prune": {
          "idleHours": 24, // 24h निष्क्रिय रहने के बाद स्वतः हटाएँ
          "maxAgeDays": 7, // 7 दिनों के बाद स्वतः हटाएँ
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
