---
read_when:
    - आप Gateway के लिए एक सस्ता, हमेशा चालू रहने वाला Linux होस्ट चाहते हैं
    - आप अपना VPS चलाए बिना दूरस्थ Control UI एक्सेस चाहते हैं
summary: OpenClaw Gateway को दूरस्थ पहुंच के लिए exe.dev (VM + HTTPS प्रॉक्सी) पर चलाएं
title: exe.dev
x-i18n:
    generated_at: "2026-06-28T23:20:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

लक्ष्य: exe.dev VM पर चल रहा OpenClaw Gateway, आपके लैपटॉप से इसके ज़रिए पहुंच योग्य: `https://<vm-name>.exe.xyz`

यह पेज exe.dev की डिफ़ॉल्ट **exeuntu** इमेज मानकर चलता है। अगर आपने अलग distro चुना है, तो packages को उसी अनुसार map करें।

## शुरुआती त्वरित पथ

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. ज़रूरत के अनुसार अपनी auth key/token भरें
3. अपनी VM के पास "Agent" पर क्लिक करें और Shelley के provisioning पूरा करने तक प्रतीक्षा करें
4. `https://<vm-name>.exe.xyz/` खोलें और configured shared secret से authenticate करें (यह गाइड डिफ़ॉल्ट रूप से token auth का उपयोग करती है, लेकिन अगर आप `gateway.auth.mode` बदलते हैं तो password auth भी काम करता है)
5. किसी भी pending device pairing requests को `openclaw devices approve <requestId>` से approve करें

## आपको क्या चाहिए

- exe.dev account
- [exe.dev](https://exe.dev) virtual machines तक `ssh exe.dev` access (वैकल्पिक)

## Shelley के साथ automated install

Shelley, [exe.dev](https://exe.dev) का agent, हमारे prompt से OpenClaw तुरंत install कर सकता है। उपयोग किया गया prompt नीचे है:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Manual installation

## 1) VM बनाएं

अपने device से:

```bash
ssh exe.dev new
```

फिर connect करें:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
इस VM को **stateful** रखें। OpenClaw `openclaw.json`, per-agent `auth-profiles.json`, sessions, और channel/provider state को `~/.openclaw/` के तहत store करता है, साथ ही workspace को `~/.openclaw/workspace/` के तहत।
</Tip>

## 2) prerequisites install करें (VM पर)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw install करें

OpenClaw install script चलाएं:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw को port 8000 पर proxy करने के लिए nginx setup करें

`/etc/nginx/sites-enabled/default` को इससे edit करें

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

client-supplied chains को preserve करने के बजाय forwarding headers overwrite करें।
OpenClaw forwarded IP metadata पर केवल explicitly configured proxies से ही trust करता है,
और append-style `X-Forwarded-For` chains को hardening risk माना जाता है।

## 5) OpenClaw access करें और privileges grant करें

`https://<vm-name>.exe.xyz/` access करें (onboarding से Control UI output देखें)। अगर यह auth के लिए prompt करता है, तो VM से configured shared secret paste करें। यह गाइड token auth का उपयोग करती है, इसलिए `gateway.auth.token`
को `openclaw config get gateway.auth.token` से retrieve करें (या `openclaw doctor --generate-gateway-token` से generate करें)।
अगर आपने gateway को password auth में बदला है, तो इसके बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` उपयोग करें।
`openclaw devices list` और `openclaw devices approve <requestId>` से devices approve करें। संदेह होने पर, अपने browser से Shelley का उपयोग करें!

## Remote channel setup

remote hosts के लिए, `config set` पर कई SSH calls के बजाय एक `config patch` call को प्राथमिकता दें। real tokens को VM environment या `~/.openclaw/.env` में रखें, और `openclaw.json` में केवल SecretRefs डालें।

VM पर, service environment में वे secrets शामिल करें जिनकी उसे ज़रूरत है:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

अपनी local machine से, एक patch file बनाएं और उसे VM में pipe करें:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

जब कोई nested allowlist ठीक patch value ही बननी चाहिए, तब `--replace-path` उपयोग करें, उदाहरण के लिए Discord channel allowlist replace करते समय:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Remote access

Remote access [exe.dev](https://exe.dev) के authentication द्वारा handle किया जाता है। डिफ़ॉल्ट रूप से, port 8000 से HTTP traffic को email auth के साथ `https://<vm-name>.exe.xyz` पर forward किया जाता है।

## Updating

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

गाइड: [Updating](/hi/install/updating)

## Related

- [Remote gateway](/hi/gateway/remote)
- [Install overview](/hi/install)
