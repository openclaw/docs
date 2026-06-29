---
read_when:
    - हेडलेस Node होस्ट चलाना
    - system.run के लिए गैर-macOS Node को पेयर करना
summary: '`openclaw node` के लिए CLI संदर्भ (हेडलेस Node होस्ट)'
title: Node
x-i18n:
    generated_at: "2026-06-28T22:51:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

एक **हेडलेस node host** चलाएँ जो Gateway WebSocket से कनेक्ट करता है और इस मशीन पर
`system.run` / `system.which` उपलब्ध कराता है।

## node host का उपयोग क्यों करें?

जब आप चाहते हैं कि एजेंट आपके नेटवर्क में **दूसरी मशीनों पर कमांड चलाएँ** और वहाँ पूरा macOS companion app इंस्टॉल न करना पड़े, तब node host का उपयोग करें।

सामान्य उपयोग मामले:

- दूरस्थ Linux/Windows मशीनों (बिल्ड सर्वर, लैब मशीनें, NAS) पर कमांड चलाएँ।
- gateway पर exec को **sandboxed** रखें, लेकिन स्वीकृत रन दूसरे hosts को सौंपें।
- ऑटोमेशन या CI nodes के लिए हल्का, हेडलेस execution target दें।

Execution अब भी node host पर **exec approvals** और प्रति-एजेंट allowlists से सुरक्षित रहता है, इसलिए आप command access को सीमित और स्पष्ट रख सकते हैं।

## Browser proxy (zero-config)

अगर node पर `browser.enabled` disabled नहीं है, तो node hosts अपने-आप browser proxy advertise करते हैं। इससे agent उस node पर अतिरिक्त configuration के बिना browser automation का उपयोग कर सकता है।

डिफ़ॉल्ट रूप से, proxy node के सामान्य browser profile surface को expose करता है। अगर आप `nodeHost.browserProxy.allowProfiles` सेट करते हैं, तो proxy restrictive हो जाता है:
non-allowlisted profile targeting reject हो जाती है, और persistent profile
create/delete routes proxy के ज़रिए block कर दिए जाते हैं।

ज़रूरत हो तो इसे node पर disable करें:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Run (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options:

- `--host <host>`: Gateway WebSocket host (default: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (default: `18789`)
- `--tls`: gateway connection के लिए TLS का उपयोग करें
- `--tls-fingerprint <sha256>`: अपेक्षित TLS certificate fingerprint (sha256)
- `--node-id <id>`: node id override करें (pairing token साफ़ करता है)
- `--display-name <name>`: node display name override करें

## node host के लिए Gateway auth

`openclaw node run` और `openclaw node install` config/env से gateway auth resolve करते हैं (node commands पर `--token`/`--password` flags नहीं होते):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` पहले जाँचे जाते हैं।
- फिर local config fallback: `gateway.auth.token` / `gateway.auth.password`.
- local mode में, node host जानबूझकर `gateway.remote.token` / `gateway.remote.password` inherit नहीं करता।
- अगर `gateway.auth.token` / `gateway.auth.password` SecretRef के ज़रिए स्पष्ट रूप से configured है और unresolved है, तो node auth resolution fail closed होता है (कोई remote fallback masking नहीं)।
- `gateway.mode=remote` में, remote client fields (`gateway.remote.token` / `gateway.remote.password`) भी remote precedence rules के अनुसार eligible होते हैं।
- Node host auth resolution केवल `OPENCLAW_GATEWAY_*` env vars को मानता है।

plaintext `ws://` Gateway से connect होने वाले node के लिए, loopback, private IP
literals, `.local`, और Tailnet `*.ts.net` hosts accepted हैं। दूसरे trusted private-DNS names के लिए, `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` सेट करें; इसके बिना
node startup fail closed होता है और आपसे `wss://`, SSH tunnel, या
Tailscale का उपयोग करने को कहता है। यह process-environment opt-in है, `openclaw.json` config
key नहीं।
`openclaw node install` इसे supervised node service में persist करता है जब यह
install command environment में मौजूद होता है।

## Service (background)

हेडलेस node host को user service के रूप में install करें।

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options:

- `--host <host>`: Gateway WebSocket host (default: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (default: `18789`)
- `--tls`: gateway connection के लिए TLS का उपयोग करें
- `--tls-fingerprint <sha256>`: अपेक्षित TLS certificate fingerprint (sha256)
- `--node-id <id>`: node id override करें (pairing token साफ़ करता है)
- `--display-name <name>`: node display name override करें
- `--runtime <runtime>`: Service runtime (`node` या `bun`)
- `--force`: अगर पहले से installed है तो reinstall/overwrite करें

service manage करें:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

foreground node host के लिए `openclaw node run` का उपयोग करें (कोई service नहीं)।

Service commands machine-readable output के लिए `--json` accept करते हैं।

node host Gateway restart और network closes को in-process retry करता है। अगर
Gateway terminal token/password/bootstrap auth pause report करता है, तो node host
close detail log करता है और non-zero exit करता है ताकि launchd/systemd उसे
fresh config और credentials के साथ restart कर सके। Pairing-required pauses foreground
flow में रहते हैं ताकि pending request approve की जा सके।

## Pairing

पहला connection Gateway पर pending device pairing request (`role: node`) बनाता है।
इसे इसके ज़रिए approve करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

कड़े नियंत्रण वाले node networks पर, Gateway operator trusted CIDRs से first-time node pairing को auto-approve करने के लिए explicit opt in कर सकता है:

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

यह default रूप से disabled है। यह केवल बिना requested scopes वाली fresh `role: node` pairing पर लागू होता है। Operator/browser clients, Control UI, WebChat, और role,
scope, metadata, या public-key upgrades के लिए अभी भी manual approval चाहिए।

अगर node बदले हुए auth details (role/scopes/public key) के साथ pairing retry करता है,
तो पिछली pending request supersede हो जाती है और नया `requestId` बनता है।
approval से पहले फिर से `openclaw devices list` चलाएँ।

node host अपना node id, token, display name, और gateway connection info
`~/.openclaw/node.json` में store करता है।

## Exec approvals

`system.run` local exec approvals से gated है:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, या
  variable unset होने पर `~/.openclaw/exec-approvals.json`
- [Exec approvals](/hi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway से edit करें)

approved async node exec के लिए, OpenClaw prompt करने से पहले canonical `systemRunPlan`
तैयार करता है। बाद का approved `system.run` forward उस stored
plan को reuse करता है, इसलिए approval request बनने के बाद command/cwd/session fields में edits, node जो execute करता है उसे बदलने के बजाय reject हो जाती हैं।

## संबंधित

- [CLI reference](/hi/cli)
- [Nodes](/hi/nodes)
