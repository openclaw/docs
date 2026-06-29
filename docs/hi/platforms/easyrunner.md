---
read_when:
    - EasyRunner पर OpenClaw डिप्लॉय करना
    - EasyRunner के Caddy प्रॉक्सी के पीछे Gateway चलाना
    - होस्टेड Gateway के लिए स्थायी वॉल्यूम और प्रमाणीकरण चुनना
summary: Podman और Caddy के साथ EasyRunner पर OpenClaw Gateway चलाएँ
title: EasyRunner
x-i18n:
    generated_at: "2026-06-28T23:26:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner अपने Caddy proxy के पीछे एक छोटे कंटेनरीकृत ऐप के रूप में OpenClaw Gateway को होस्ट कर सकता है। यह मार्गदर्शिका मानती है कि EasyRunner होस्ट Podman-संगत Compose ऐप चलाता है और Caddy के माध्यम से HTTPS उपलब्ध कराता है।

## शुरू करने से पहले

- एक EasyRunner सर्वर, जिसके लिए domain उस पर रूट किया गया हो।
- बनाया गया या प्रकाशित OpenClaw container image।
- `/home/node/.openclaw` के लिए persistent config volume।
- `/workspace` के लिए persistent workspace volume।
- एक मजबूत Gateway token या password।

संभव हो तो device auth सक्षम रखें। यदि आपका reverse proxy deployment device identity को सही ढंग से आगे नहीं ले जा सकता, तो पहले trusted-proxy settings ठीक करें; खतरनाक auth bypasses का उपयोग केवल पूरी तरह निजी, operator-controlled network के लिए करें।

## Compose ऐप

इस तरह की संरचना वाली Compose file के साथ एक EasyRunner ऐप बनाएं:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` को अपने Gateway hostname से बदलें। `OPENCLAW_GATEWAY_TOKEN` को ऐप definition में commit करने के बजाय EasyRunner के secret/environment manager में store करें।

## OpenClaw कॉन्फ़िगर करें

Persistent config volume के अंदर, Gateway को केवल proxy के माध्यम से पहुंच योग्य रखें और auth आवश्यक करें:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

यदि Caddy Gateway के लिए TLS terminate करता है, तो auth checks को globally disable करने के बजाय ठीक proxy path के लिए trusted proxy settings कॉन्फ़िगर करें। देखें [Trusted proxy auth](/hi/gateway/trusted-proxy-auth)।

## सत्यापित करें

अपने workstation से:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner host से, listening Gateway के लिए ऐप logs जांचें और यह भी कि कोई startup SecretRef, Plugin, या channel auth failures नहीं हैं।

## Updates और backups

- नया OpenClaw image pull या build करें, फिर EasyRunner ऐप redeploy करें।
- Updates से पहले `openclaw-config` volume का backup लें।
- यदि agents वहां durable project data लिखते हैं, तो `openclaw-workspace` का backup लें।
- बड़े updates के बाद config migrations और service warnings पकड़ने के लिए `openclaw doctor` चलाएं।

## समस्या निवारण

- `gateway probe` connect नहीं कर सकता: पुष्टि करें कि Caddy hostname ऐप की ओर point करता है और container `0.0.0.0:1455` पर listen कर रहा है।
- Auth fail होता है: EasyRunner secrets और local client command में token को साथ-साथ rotate करें।
- Restore के बाद files root-owned हैं: mounted volumes को repair करें ताकि container user `/home/node/.openclaw` और `/workspace` में लिख सके।
- Browser या channel plugins fail होते हैं: जांचें कि required external binaries, network egress, और mounted credentials container के अंदर उपलब्ध हैं या नहीं।
