---
read_when:
    - आप किसी मशीन से OpenClaw हटाना चाहते हैं
    - अनइंस्टॉल करने के बाद भी Gateway सेवा चल रही है
summary: OpenClaw को पूरी तरह अनइंस्टॉल करें (CLI, सेवा, स्थिति, कार्यक्षेत्र)
title: अनइंस्टॉल करें
x-i18n:
    generated_at: "2026-07-16T15:41:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

दो तरीके:

- **आसान तरीका**, यदि `openclaw` अभी भी इंस्टॉल है।
- **मैन्युअल सेवा हटाना**, यदि CLI हट चुका है लेकिन सेवा अभी भी चल रही है।

## आसान तरीका (CLI अभी भी इंस्टॉल है)

अनुशंसित: अंतर्निहित अनइंस्टॉलर का उपयोग करें:

```bash
openclaw uninstall
```

स्टेट हटाने पर कॉन्फ़िगर की गई वर्कस्पेस डायरेक्टरियाँ सुरक्षित रहती हैं, जब तक कि आप `--workspace` भी नहीं चुनते।

क्या हटाया जाएगा, इसका पूर्वावलोकन करें (सुरक्षित):

```bash
openclaw uninstall --dry-run --all
```

गैर-इंटरैक्टिव (ऑटोमेशन / npx)। सावधानी से और स्कोप की पुष्टि करने के बाद ही उपयोग करें:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

फ़्लैग: `--service`, `--state`, `--workspace`, `--app` अलग-अलग स्कोप चुनते हैं; `--all` चारों को चुनता है।

मैन्युअल चरण (समान परिणाम):

1. Gateway सेवा रोकें:

```bash
openclaw gateway stop
```

2. Gateway सेवा अनइंस्टॉल करें (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. स्टेट + कॉन्फ़िग हटाएँ:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

यदि आपने `OPENCLAW_CONFIG_PATH` को स्टेट डायरेक्टरी से बाहर किसी कस्टम स्थान पर सेट किया है, तो उस फ़ाइल को भी हटाएँ।
यदि आप स्टेट डायरेक्टरी के अंदर कोई वर्कस्पेस, जैसे `~/.openclaw/workspace`, रखना चाहते हैं, तो `rm -rf` चलाने से पहले उसे दूसरी जगह ले जाएँ या स्टेट की सामग्री चुनिंदा रूप से हटाएँ।

4. अपना वर्कस्पेस हटाएँ (वैकल्पिक, एजेंट फ़ाइलें हटाता है):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI इंस्टॉलेशन हटाएँ (वही चुनें जिसका आपने उपयोग किया था):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. यदि आपने macOS ऐप इंस्टॉल किया था:

```bash
rm -rf /Applications/OpenClaw.app
```

टिप्पणियाँ:

- यदि आपने प्रोफ़ाइल (`--profile` / `OPENCLAW_PROFILE`) का उपयोग किया था, तो प्रत्येक स्टेट डायरेक्टरी के लिए चरण 3 दोहराएँ (डिफ़ॉल्ट `~/.openclaw-<profile>` हैं)।
- रिमोट मोड में स्टेट डायरेक्टरी **Gateway होस्ट** पर होती है, इसलिए वहाँ भी चरण 1-4 चलाएँ।

## मैन्युअल सेवा हटाना (CLI इंस्टॉल नहीं है)

यदि Gateway सेवा चलती रहती है, लेकिन `openclaw` उपलब्ध नहीं है, तो इसका उपयोग करें।

### macOS (launchd)

डिफ़ॉल्ट लेबल `ai.openclaw.gateway` है (या प्रोफ़ाइल के साथ `ai.openclaw.<profile>`):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

यदि आपने प्रोफ़ाइल का उपयोग किया था, तो लेबल और plist नाम को `ai.openclaw.<profile>` से बदलें।

### Linux (systemd उपयोगकर्ता यूनिट)

डिफ़ॉल्ट यूनिट नाम `openclaw-gateway.service` है (या `openclaw-gateway-<profile>.service`)। बहुत पुराने इंस्टॉलेशन से अपग्रेड की गई मशीनों पर नाम बदलने से पहले की `clawdbot-gateway.service` यूनिट अब भी मौजूद हो सकती है; `openclaw uninstall` / `openclaw gateway uninstall` इसका स्वतः पता लगाकर इसे हटा देता है।

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (शेड्यूल्ड टास्क)

डिफ़ॉल्ट टास्क नाम `OpenClaw Gateway` है (या `OpenClaw Gateway (<profile>)`)।
यह टास्क आपकी स्टेट डायरेक्टरी के अंतर्गत बिना विंडो वाली `gateway.vbs` स्क्रिप्ट शुरू करता है, जो आगे
`gateway.cmd` चलाती है; दोनों को हटाएँ।

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

यदि आपने प्रोफ़ाइल का उपयोग किया था, तो उससे मेल खाने वाला टास्क नाम और `~\.openclaw-<profile>` के अंतर्गत `gateway.cmd` /
`gateway.vbs` फ़ाइलें हटाएँ।

## सामान्य इंस्टॉलेशन बनाम सोर्स चेकआउट

### सामान्य इंस्टॉलेशन (install.sh / npm / pnpm / bun)

यदि आपने `https://openclaw.ai/install.sh` या `install.ps1` का उपयोग किया था, तो CLI को `npm install -g openclaw@latest` से इंस्टॉल किया गया था।
इसे `npm rm -g openclaw` से हटाएँ (या यदि आपने उस तरीके से इंस्टॉल किया था, तो `pnpm remove -g` / `bun remove -g` से)।

### सोर्स चेकआउट (git clone)

यदि आप किसी रिपॉज़िटरी चेकआउट से चलाते हैं (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. रिपॉज़िटरी हटाने से **पहले** Gateway सेवा अनइंस्टॉल करें (ऊपर दिए आसान तरीके या मैन्युअल सेवा हटाने का उपयोग करें)।
2. रिपॉज़िटरी डायरेक्टरी हटाएँ।
3. ऊपर दिखाए अनुसार स्टेट + वर्कस्पेस हटाएँ।

## संबंधित

- [इंस्टॉलेशन का अवलोकन](/hi/install)
- [माइग्रेशन गाइड](/hi/install/migrating)
