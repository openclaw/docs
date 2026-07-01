---
read_when:
    - हेडलेस Node होस्ट चलाना
    - system.run के लिए non-macOS नोड को पेयर करना
summary: '`openclaw node` के लिए CLI संदर्भ (हेडलेस Node होस्ट)'
title: Node
x-i18n:
    generated_at: "2026-07-01T13:00:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

एक **हेडलेस Node होस्ट** चलाएँ जो Gateway WebSocket से जुड़ता है और इस मशीन पर
`system.run` / `system.which` उपलब्ध कराता है।

## Node होस्ट का उपयोग क्यों करें?

जब आप एजेंटों से अपने नेटवर्क की **अन्य मशीनों पर कमांड चलवाना** चाहते हैं, बिना
वहाँ पूरा macOS companion app इंस्टॉल किए, तब Node होस्ट का उपयोग करें।

सामान्य उपयोग मामले:

- रिमोट Linux/Windows मशीनों पर कमांड चलाएँ (बिल्ड सर्वर, लैब मशीनें, NAS)।
- Gateway पर exec को **sandboxed** रखें, लेकिन स्वीकृत रन अन्य होस्टों को सौंपें।
- ऑटोमेशन या CI नोड्स के लिए हल्का, हेडलेस execution target उपलब्ध कराएँ।

Execution फिर भी Node होस्ट पर **exec approvals** और प्रति-एजेंट allowlists द्वारा सुरक्षित रहता है, इसलिए आप कमांड access को scoped और explicit रख सकते हैं।

## ब्राउज़र प्रॉक्सी (zero-config)

अगर Node पर `browser.enabled` अक्षम नहीं है, तो Node होस्ट अपने-आप ब्राउज़र प्रॉक्सी advertise करते हैं। इससे एजेंट उस Node पर अतिरिक्त configuration के बिना browser automation का उपयोग कर सकता है।

डिफ़ॉल्ट रूप से, प्रॉक्सी Node की सामान्य browser profile surface उपलब्ध कराता है। अगर आप `nodeHost.browserProxy.allowProfiles` सेट करते हैं, तो प्रॉक्सी restrictive हो जाता है:
allowlist में न होने वाले profile targeting को reject किया जाता है, और persistent profile create/delete routes प्रॉक्सी के माध्यम से blocked रहते हैं।

ज़रूरत हो तो इसे Node पर अक्षम करें:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## चलाएँ (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

विकल्प:

- `--host <host>`: Gateway WebSocket होस्ट (डिफ़ॉल्ट: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket पोर्ट (डिफ़ॉल्ट: `18789`)
- `--context-path <path>`: Gateway WebSocket context path (जैसे `/openclaw-gw`)। WebSocket URL में जोड़ा जाता है।
- `--tls`: Gateway connection के लिए TLS उपयोग करें
- `--tls-fingerprint <sha256>`: अपेक्षित TLS certificate fingerprint (sha256)
- `--node-id <id>`: Node id override करें (pairing token साफ़ करता है)
- `--display-name <name>`: Node display name override करें

## Node होस्ट के लिए Gateway auth

`openclaw node run` और `openclaw node install` config/env से Gateway auth resolve करते हैं (Node commands पर कोई `--token`/`--password` flags नहीं):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` पहले checked होते हैं।
- फिर local config fallback: `gateway.auth.token` / `gateway.auth.password`।
- local mode में, Node होस्ट जानबूझकर `gateway.remote.token` / `gateway.remote.password` inherit नहीं करता।
- अगर `gateway.auth.token` / `gateway.auth.password` SecretRef के माध्यम से explicitly configured है और unresolved है, तो Node auth resolution fail closed करता है (कोई remote fallback masking नहीं)।
- `gateway.mode=remote` में, remote client fields (`gateway.remote.token` / `gateway.remote.password`) भी remote precedence rules के अनुसार eligible हैं।
- Node होस्ट auth resolution केवल `OPENCLAW_GATEWAY_*` env vars का सम्मान करता है।

plaintext `ws://` Gateway से जुड़ने वाले Node के लिए, loopback, private IP
literals, `.local`, और Tailnet `*.ts.net` hosts accepted हैं। अन्य
trusted private-DNS names के लिए, `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` सेट करें; इसके बिना
Node startup fail closed करता है और आपसे `wss://`, SSH tunnel, या
Tailscale उपयोग करने को कहता है। यह process-environment opt-in है, `openclaw.json` config
key नहीं।
`openclaw node install` इसे supervised Node service में persist करता है जब यह
install command environment में मौजूद हो।

## Service (background)

हेडलेस Node होस्ट को user service के रूप में इंस्टॉल करें।

```bash
openclaw node install --host <gateway-host> --port 18789
```

विकल्प:

- `--host <host>`: Gateway WebSocket होस्ट (डिफ़ॉल्ट: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket पोर्ट (डिफ़ॉल्ट: `18789`)
- `--context-path <path>`: Gateway WebSocket context path (जैसे `/openclaw-gw`)। WebSocket URL में जोड़ा जाता है।
- `--tls`: Gateway connection के लिए TLS उपयोग करें
- `--tls-fingerprint <sha256>`: अपेक्षित TLS certificate fingerprint (sha256)
- `--node-id <id>`: Node id override करें (pairing token साफ़ करता है)
- `--display-name <name>`: Node display name override करें
- `--runtime <runtime>`: Service runtime (`node` या `bun`)
- `--force`: अगर पहले से installed है, तो reinstall/overwrite करें

Service manage करें:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

foreground Node होस्ट के लिए `openclaw node run` उपयोग करें (कोई service नहीं)।

Service commands machine-readable output के लिए `--json` स्वीकार करते हैं।

Node होस्ट Gateway restart और network closes को in-process retry करता है। अगर
Gateway terminal token/password/bootstrap auth pause report करता है, तो Node होस्ट
close detail log करता है और non-zero exit करता है ताकि launchd/systemd fresh
config और credentials के साथ उसे restart कर सके। Pairing-required pauses foreground
flow में रहते हैं ताकि pending request approve की जा सके।

## Pairing

पहला connection Gateway पर pending device pairing request (`role: node`) बनाता है।
इसे approve करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

कड़ाई से नियंत्रित Node networks पर, Gateway operator trusted CIDRs से first-time Node pairing को auto-approve करने के लिए explicitly opt in कर सकता है:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

यह डिफ़ॉल्ट रूप से disabled है। यह केवल fresh `role: node` pairing पर लागू होता है
जब कोई requested scopes नहीं हों। Operator/browser clients, Control UI, WebChat, और role,
scope, metadata, या public-key upgrades को फिर भी manual approval चाहिए।

अगर Node बदले हुए auth details (role/scopes/public key) के साथ pairing retry करता है,
तो पिछला pending request superseded हो जाता है और नया `requestId` बनाया जाता है।
approval से पहले `openclaw devices list` फिर से चलाएँ।

Node होस्ट अपना Node id, token, display name, और Gateway connection info
`~/.openclaw/node.json` में store करता है।

## Exec approvals

`system.run` local exec approvals द्वारा gated है:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, या
  variable unset होने पर `~/.openclaw/exec-approvals.json`
- [Exec approvals](/hi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway से edit करें)

approved async Node exec के लिए, OpenClaw prompting से पहले canonical `systemRunPlan`
तैयार करता है। बाद का approved `system.run` forward उस stored
plan को reuse करता है, इसलिए approval request बनने के बाद command/cwd/session fields में edits
Node द्वारा execute की जाने वाली चीज़ बदलने के बजाय reject कर दिए जाते हैं।

## संबंधित

- [CLI reference](/hi/cli)
- [Nodes](/hi/nodes)
