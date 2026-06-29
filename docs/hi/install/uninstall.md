---
read_when:
    - आप किसी मशीन से OpenClaw हटाना चाहते हैं
    - अनइंस्टॉल के बाद भी gateway सेवा चल रही है
summary: OpenClaw को पूरी तरह अनइंस्टॉल करें (CLI, सेवा, स्थिति, कार्यस्थान)
title: अनइंस्टॉल کریں
x-i18n:
    generated_at: "2026-06-28T23:23:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

दो रास्ते:

- **आसान रास्ता** यदि `openclaw` अभी भी इंस्टॉल है।
- **मैन्युअल सेवा हटाना** यदि CLI हट गई है लेकिन सेवा अभी भी चल रही है।

## आसान रास्ता (CLI अभी भी इंस्टॉल है)

अनुशंसित: बिल्ट-इन अनइंस्टॉलर का उपयोग करें:

```bash
openclaw uninstall
```

CLI का उपयोग करते समय, स्थिति हटाने से कॉन्फ़िगर की गई कार्यस्थान निर्देशिकाएँ सुरक्षित रहती हैं, जब तक कि आप `--workspace` भी न चुनें।

पूर्वावलोकन करें कि क्या हटाया जाएगा (सुरक्षित):

```bash
openclaw uninstall --dry-run --all
```

गैर-इंटरैक्टिव (स्वचालन / npx)। सावधानी से उपयोग करें और केवल स्कोप की पुष्टि करने के बाद:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

मैन्युअल चरण (वही परिणाम):

1. Gateway सेवा रोकें:

```bash
openclaw gateway stop
```

2. Gateway सेवा अनइंस्टॉल करें (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. स्थिति + कॉन्फ़िगरेशन हटाएँ:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

यदि आपने `OPENCLAW_CONFIG_PATH` को स्थिति निर्देशिका के बाहर किसी कस्टम स्थान पर सेट किया है, तो वह फ़ाइल भी हटाएँ।
यदि आप स्थिति निर्देशिका के अंदर कोई कार्यस्थान रखना चाहते हैं, जैसे `~/.openclaw/workspace`, तो `rm -rf` चलाने से पहले उसे अलग स्थान पर ले जाएँ या स्थिति सामग्री को चुनिंदा रूप से हटाएँ।

4. अपना कार्यस्थान हटाएँ (वैकल्पिक, एजेंट फ़ाइलें हटाता है):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI इंस्टॉल हटाएँ (जिसका आपने उपयोग किया था उसे चुनें):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. यदि आपने macOS ऐप इंस्टॉल किया था:

```bash
rm -rf /Applications/OpenClaw.app
```

नोट्स:

- यदि आपने प्रोफ़ाइल (`--profile` / `OPENCLAW_PROFILE`) का उपयोग किया है, तो प्रत्येक स्थिति निर्देशिका के लिए चरण 3 दोहराएँ (डिफ़ॉल्ट `~/.openclaw-<profile>` हैं)।
- दूरस्थ मोड में, स्थिति निर्देशिका **Gateway होस्ट** पर होती है, इसलिए चरण 1-4 वहाँ भी चलाएँ।

## मैन्युअल सेवा हटाना (CLI इंस्टॉल नहीं है)

इसका उपयोग करें यदि Gateway सेवा चलती रहती है लेकिन `openclaw` अनुपलब्ध है।

### macOS (launchd)

डिफ़ॉल्ट लेबल `ai.openclaw.gateway` है (या `ai.openclaw.<profile>`; पुराना `com.openclaw.*` अभी भी मौजूद हो सकता है):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

यदि आपने प्रोफ़ाइल का उपयोग किया है, तो लेबल और plist नाम को `ai.openclaw.<profile>` से बदलें। यदि कोई पुरानी `com.openclaw.*` plist मौजूद हो, तो उसे हटा दें।

### Linux (systemd उपयोगकर्ता यूनिट)

डिफ़ॉल्ट यूनिट नाम `openclaw-gateway.service` है (या `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

डिफ़ॉल्ट कार्य नाम `OpenClaw Gateway` है (या `OpenClaw Gateway (<profile>)`)।
कार्य स्क्रिप्ट आपकी स्थिति निर्देशिका के अंतर्गत `gateway.cmd` के रूप में होती है; मौजूदा इंस्टॉल
एक विंडोलेस `gateway.vbs` लॉन्चर भी बना सकते हैं जिसे Task Scheduler सीधे
`gateway.cmd` खोलने के बजाय चलाता है।

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

यदि आपने प्रोफ़ाइल का उपयोग किया है, तो मेल खाते कार्य नाम और `~\.openclaw-<profile>` के अंतर्गत `gateway.cmd` /
`gateway.vbs` फ़ाइलें हटाएँ।

## सामान्य इंस्टॉल बनाम स्रोत चेकआउट

### सामान्य इंस्टॉल (install.sh / npm / pnpm / bun)

यदि आपने `https://openclaw.ai/install.sh` या `install.ps1` का उपयोग किया था, तो CLI `npm install -g openclaw@latest` से इंस्टॉल की गई थी।
इसे `npm rm -g openclaw` से हटाएँ (या यदि आपने उस तरह इंस्टॉल किया था तो `pnpm remove -g` / `bun remove -g`)।

### स्रोत चेकआउट (git clone)

यदि आप किसी रिपॉज़िटरी चेकआउट (`git clone` + `openclaw ...` / `bun run openclaw ...`) से चलाते हैं:

1. रिपॉज़िटरी हटाने से **पहले** Gateway सेवा अनइंस्टॉल करें (ऊपर दिया आसान रास्ता या मैन्युअल सेवा हटाना उपयोग करें)।
2. रिपॉज़िटरी निर्देशिका हटाएँ।
3. ऊपर दिखाए अनुसार स्थिति + कार्यस्थान हटाएँ।

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [माइग्रेशन गाइड](/hi/install/migrating)
