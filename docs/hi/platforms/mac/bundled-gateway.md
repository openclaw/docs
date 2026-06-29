---
read_when:
    - OpenClaw.app की पैकेजिंग
    - macOS Gateway launchd सेवा की डीबगिंग
    - macOS के लिए Gateway CLI इंस्टॉल करना
summary: Gateway रनटाइम macOS पर (बाहरी launchd सेवा)
title: macOS पर Gateway
x-i18n:
    generated_at: "2026-06-28T23:27:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app अब Node/Bun या Gateway runtime को बंडल नहीं करता। macOS ऐप
एक **बाहरी** `openclaw` CLI इंस्टॉल की अपेक्षा करता है, Gateway को
child process के रूप में spawn नहीं करता, और Gateway को चालू रखने के लिए
प्रति-उपयोगकर्ता launchd service प्रबंधित करता है (या यदि कोई मौजूदा स्थानीय Gateway पहले से चल रहा हो तो उससे जुड़ जाता है)।

## CLI इंस्टॉल करें (local mode के लिए आवश्यक)

Mac पर Node 24 डिफ़ॉल्ट runtime है। संगतता के लिए Node 22 LTS, वर्तमान में `22.19+`, अभी भी काम करता है। फिर `openclaw` को globally इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

macOS ऐप का **CLI इंस्टॉल करें** बटन वही global install flow चलाता है जिसे ऐप
आंतरिक रूप से उपयोग करता है: यह पहले npm को प्राथमिकता देता है, फिर pnpm को, फिर bun को, यदि वही
एकमात्र detected package manager हो। Node अनुशंसित Gateway runtime बना रहता है।

## Launchd (Gateway as LaunchAgent)

लेबल:

- `ai.openclaw.gateway` (या `ai.openclaw.<profile>`; legacy `com.openclaw.*` रह सकता है)

Plist स्थान (प्रति-उपयोगकर्ता):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (या `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

मैनेजर:

- macOS ऐप Local mode में LaunchAgent install/update का स्वामी है।
- CLI भी इसे इंस्टॉल कर सकता है: `openclaw gateway install`।

व्यवहार:

- "OpenClaw Active" LaunchAgent को enable/disable करता है।
- ऐप quit करने से gateway बंद **नहीं** होता (launchd इसे जीवित रखता है)।
- यदि configured port पर कोई Gateway पहले से चल रहा है, तो ऐप नया शुरू करने के बजाय
  उससे जुड़ जाता है।

लॉगिंग:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profiles `gateway-<profile>.log` उपयोग करते हैं)
- launchd stderr: दबाया गया

## Version compatibility

macOS ऐप gateway version को अपने version के साथ जाँचता है। यदि वे
असंगत हैं, तो app version से मिलाने के लिए global CLI को update करें।

## macOS पर state directory

OpenClaw state को स्थानीय, non-synced disk पर रखें। iCloud Drive और अन्य
cloud-synced folders से बचें क्योंकि sync latency और file locks sessions,
credentials, और Gateway state को प्रभावित कर सकते हैं।

`OPENCLAW_STATE_DIR` को स्थानीय path पर केवल तब सेट करें जब आपको override चाहिए।
`openclaw doctor` सामान्य cloud-synced state paths के बारे में चेतावनी देता है और
local storage पर वापस जाने की सलाह देता है। देखें
[environment variables](/hi/help/environment#path-related-env-vars) और
[Doctor](/hi/gateway/doctor)।

## ऐप connectivity debug करें

source checkout से macOS debug CLI का उपयोग करके वही Gateway
WebSocket handshake और discovery logic चलाएँ जिसे ऐप उपयोग करता है:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` `--url`, `--token`, `--timeout`, और `--json` स्वीकार करता है। `discover`
`--timeout`, `--json`, और `--include-local` स्वीकार करता है। जब आपको CLI discovery को
app-side connection issues से अलग करना हो, तो discovery output की तुलना
`openclaw gateway discover --json` से करें।

## Smoke check

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

फिर:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## संबंधित

- [macOS app](/hi/platforms/macos)
- [Gateway runbook](/hi/gateway)
