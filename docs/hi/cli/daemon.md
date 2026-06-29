---
read_when:
    - आप अभी भी स्क्रिप्ट्स में `openclaw daemon ...` का उपयोग करते हैं
    - आपको सेवा जीवनचक्र कमांड (install/start/stop/restart/status) चाहिए
summary: '`openclaw daemon` के लिए CLI संदर्भ (Gateway सेवा प्रबंधन के लिए लेगेसी उपनाम)'
title: डेमन
x-i18n:
    generated_at: "2026-06-28T22:48:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway सेवा प्रबंधन कमांड के लिए पुराना alias।

`openclaw daemon ...`, `openclaw gateway ...` सेवा कमांड के समान सेवा नियंत्रण सतह पर मैप होता है।

## उपयोग

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## उप-कमांड

- `status`: सेवा install स्थिति दिखाएँ और Gateway health की probe करें
- `install`: सेवा install करें (`launchd`/`systemd`/`schtasks`)
- `uninstall`: सेवा हटाएँ
- `start`: सेवा शुरू करें
- `stop`: सेवा रोकें
- `restart`: सेवा restart करें

## सामान्य विकल्प

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- lifecycle (`uninstall|start|stop`): `--json`

नोट:

- `status` संभव होने पर probe auth के लिए configured auth SecretRefs resolve करता है।
- यदि इस command path में कोई आवश्यक auth SecretRef unresolved है, तो probe connectivity/auth विफल होने पर `daemon status --json` `rpc.authWarning` report करता है; `--token`/`--password` स्पष्ट रूप से pass करें या पहले secret source resolve करें।
- यदि probe सफल होती है, तो false positives से बचने के लिए unresolved auth-ref warnings suppress कर दी जाती हैं।
- `status --deep` best-effort system-level सेवा scan जोड़ता है। जब उसे अन्य gateway-जैसी सेवाएँ मिलती हैं, तो human output cleanup hints print करता है और चेतावनी देता है कि प्रति machine एक gateway अभी भी सामान्य recommendation है।
- `status --deep` Plugin-aware mode में config validation भी चलाता है और configured Plugin manifest warnings (उदाहरण के लिए missing channel config metadata) surface करता है, ताकि install और update smoke checks उन्हें पकड़ सकें। Default `status` तेज़ read-only path रखता है जो Plugin validation skip करता है।
- Linux systemd installs पर, `status` token-drift checks में `Environment=` और `EnvironmentFile=` दोनों unit sources शामिल होते हैं।
- Drift checks merged runtime env (पहले service command env, फिर process env fallback) का उपयोग करके `gateway.auth.token` SecretRefs resolve करते हैं।
- यदि token auth effectively active नहीं है (`password`/`none`/`trusted-proxy` का explicit `gateway.auth.mode`, या mode unset जहाँ password जीत सकता है और कोई token candidate नहीं जीत सकता), तो token-drift checks config token resolution skip करते हैं।
- जब token auth को token चाहिए और `gateway.auth.token` SecretRef-managed है, तो `install` validate करता है कि SecretRef resolvable है, लेकिन resolved token को service environment metadata में persist नहीं करता।
- यदि token auth को token चाहिए और configured token SecretRef unresolved है, तो install fail closed होता है।
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो install तब तक blocked रहता है जब तक mode स्पष्ट रूप से set न किया जाए।
- macOS पर, `install` LaunchAgent plists को owner-only रखता है और API keys या auth-profile env refs को `EnvironmentVariables` में serialize करने के बजाय managed service environment values को owner-only file और wrapper के माध्यम से load करता है।
- यदि आप जानबूझकर एक host पर multiple gateways चलाते हैं, तो ports, config/state, और workspaces isolate करें; देखें [/gateway#multiple-gateways-same-host](/hi/gateway#multiple-gateways-same-host)।
- `restart --safe` running Gateway से active work preflight करने और active work drain होने के बाद एक coalesced restart schedule करने को कहता है। Plain `restart` मौजूदा service-manager behavior रखता है; `--force` immediate override path बना रहता है।
- `restart --safe --skip-deferral` OpenClaw-aware safe restart चलाता है, लेकिन active-work deferral gate bypass करता है ताकि blockers report होने पर भी Gateway restart तुरंत emit करे। यह stuck task run safe restart को pin करने पर operator escape hatch है; `--safe` आवश्यक है।

## प्राथमिकता दें

वर्तमान docs और examples के लिए [`openclaw gateway`](/hi/cli/gateway) का उपयोग करें।

## संबंधित

- [CLI reference](/hi/cli)
- [Gateway runbook](/hi/gateway)
