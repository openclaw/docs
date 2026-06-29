---
read_when:
    - नई मशीन सेट अप करना
    - आप अपने निजी सेटअप को बिगाड़े बिना “सबसे नया + सबसे बेहतर” चाहते हैं
summary: OpenClaw के लिए उन्नत सेटअप और डेवलपमेंट वर्कफ़्लो
title: सेटअप
x-i18n:
    generated_at: "2026-06-29T00:14:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
यदि आप पहली बार सेटअप कर रहे हैं, तो [शुरू करना](/hi/start/getting-started) से शुरू करें।
ऑनबोर्डिंग विवरण के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।
</Note>

## संक्षेप में

आप कितनी बार अपडेट चाहते हैं और क्या आप Gateway खुद चलाना चाहते हैं, इसके आधार पर सेटअप वर्कफ़्लो चुनें:

- **अनुकूलन repo के बाहर रहता है:** अपना config और workspace `~/.openclaw/openclaw.json` और `~/.openclaw/workspace/` में रखें ताकि repo अपडेट उन्हें न छुएँ।
- **स्थिर वर्कफ़्लो (अधिकांश के लिए अनुशंसित):** macOS app इंस्टॉल करें और उसे bundled Gateway चलाने दें।
- **Bleeding edge वर्कफ़्लो (dev):** `pnpm gateway:watch` के ज़रिए Gateway खुद चलाएँ, फिर macOS app को Local मोड में अटैच होने दें।

## पूर्वापेक्षाएँ (source से)

- Node 24 अनुशंसित (Node 22 LTS, वर्तमान में `22.19+`, अभी भी समर्थित)
- source checkouts के लिए `pnpm` आवश्यक है। OpenClaw dev mode में bundled plugins को
  `extensions/*` pnpm workspace packages से लोड करता है, इसलिए root `npm install`
  पूरा source tree तैयार नहीं करता।
- Docker (वैकल्पिक; केवल containerized setup/e2e के लिए - [Docker](/hi/install/docker) देखें)

## अनुकूलन रणनीति (ताकि अपडेट नुकसान न करें)

यदि आप "100% मेरे लिए अनुकूलित" _और_ आसान अपडेट चाहते हैं, तो अपना customization यहाँ रखें:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; इसे private git repo बनाएँ)

एक बार bootstrap करें:

```bash
openclaw setup
```

इस repo के अंदर से, local CLI entry इस्तेमाल करें:

```bash
openclaw setup
```

यदि आपके पास अभी global install नहीं है, तो इसे `pnpm openclaw setup` के ज़रिए चलाएँ।

## इस repo से Gateway चलाएँ

`pnpm build` के बाद, आप packaged CLI सीधे चला सकते हैं:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## स्थिर वर्कफ़्लो (पहले macOS app)

1. **OpenClaw.app** इंस्टॉल + launch करें (menu bar)।
2. onboarding/permissions checklist पूरी करें (TCC prompts)।
3. सुनिश्चित करें कि Gateway **Local** है और चल रहा है (app इसे manage करता है)।
4. surfaces लिंक करें (उदाहरण: WhatsApp):

```bash
openclaw channels login
```

5. sanity check:

```bash
openclaw health
```

यदि onboarding आपके build में उपलब्ध नहीं है:

- `openclaw setup` चलाएँ, फिर `openclaw channels login`, फिर Gateway manually शुरू करें (`openclaw gateway`)।

## Bleeding edge वर्कफ़्लो (terminal में Gateway)

लक्ष्य: TypeScript Gateway पर काम करना, hot reload पाना, macOS app UI को attached रखना।

### 0) (वैकल्पिक) macOS app को source से भी चलाएँ

यदि आप macOS app को भी bleeding edge पर रखना चाहते हैं:

```bash
./scripts/restart-mac.sh
```

### 1) dev Gateway शुरू करें

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` Gateway watch process को named tmux
session में शुरू या restart करता है और interactive terminals से auto-attach करता है। Non-interactive shells
detached रहते हैं और `tmux attach -t openclaw-gateway-watch-main` print करते हैं; interactive run को
detached रखने के लिए `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` इस्तेमाल करें,
या foreground watch mode के लिए `pnpm gateway:watch:raw`। watcher
relevant source, config, और bundled-plugin metadata changes पर reload करता है। यदि
watched Gateway startup के दौरान exit होता है, तो `gateway:watch`
`openclaw doctor --fix --non-interactive` एक बार चलाता है और retry करता है; उस dev-only repair pass को disable करने के लिए
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` set करें।
`pnpm openclaw setup` fresh checkout के लिए one-time local config/workspace initialization step है।
`pnpm gateway:watch` `dist/control-ui` rebuild नहीं करता, इसलिए `ui/` changes के बाद `pnpm ui:build` दोबारा चलाएँ या Control UI develop करते समय `pnpm ui:dev` इस्तेमाल करें।

### 2) macOS app को अपने running Gateway की ओर point करें

**OpenClaw.app** में:

- Connection Mode: **Local**
  app configured port पर running gateway से attach होगा।

### 3) Verify करें

- In-app Gateway status में **"Using existing gateway …"** दिखना चाहिए
- या CLI के ज़रिए:

```bash
openclaw health
```

### आम गलतियाँ

- **गलत port:** Gateway WS default रूप से `ws://127.0.0.1:18789` होता है; app + CLI को same port पर रखें।
- **state कहाँ रहता है:**
  - Channel/provider state: `~/.openclaw/credentials/`
  - Model auth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Credential storage map

auth debug करते समय या क्या back up करना है तय करते समय इसका उपयोग करें:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env या `channels.telegram.tokenFile` (केवल regular file; symlinks rejected)
- **Discord bot token**: config/env या SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (default account)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (non-default accounts)
- **Model auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **File-backed secrets payload (वैकल्पिक)**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`
  अधिक विवरण: [Security](/hi/gateway/security#credential-storage-map)।

## अपडेट करना (अपने setup को खराब किए बिना)

- `~/.openclaw/workspace` और `~/.openclaw/` को "आपकी चीज़ें" मानकर रखें; personal prompts/config को `openclaw` repo में न डालें।
- source अपडेट करना: `git pull` + `pnpm install` + `pnpm gateway:watch` का उपयोग जारी रखें।

## Linux (systemd user service)

Linux installs systemd **user** service का उपयोग करते हैं। default रूप से, systemd logout/idle पर user
services रोक देता है, जिससे Gateway बंद हो जाता है। Onboarding आपके लिए
lingering enable करने की कोशिश करता है (sudo के लिए prompt कर सकता है)। यदि यह अभी भी off है, तो चलाएँ:

```bash
sudo loginctl enable-linger $USER
```

always-on या multi-user servers के लिए, user service के बजाय **system** service पर विचार करें
(lingering की ज़रूरत नहीं)। systemd notes के लिए [Gateway runbook](/hi/gateway) देखें।

## संबंधित docs

- [Gateway runbook](/hi/gateway) (flags, supervision, ports)
- [Gateway configuration](/hi/gateway/configuration) (config schema + examples)
- [Discord](/hi/channels/discord) और [Telegram](/hi/channels/telegram) (reply tags + replyToMode settings)
- [OpenClaw assistant setup](/hi/start/openclaw)
- [macOS app](/hi/platforms/macos) (gateway lifecycle)
