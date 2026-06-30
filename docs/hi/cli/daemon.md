---
read_when:
    - आप अभी भी स्क्रिप्ट्स में `openclaw daemon ...` का उपयोग करते हैं
    - आपको सेवा जीवनचक्र कमांड चाहिए (`install`/`start`/`stop`/`restart`/`status`)
summary: '`openclaw daemon` के लिए CLI संदर्भ (Gateway सेवा प्रबंधन के लिए लेगेसी उपनाम)'
title: डेमन
x-i18n:
    generated_at: "2026-06-30T14:03:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway सेवा प्रबंधन कमांडों के लिए लेगेसी उपनाम।

`openclaw daemon ...`, `openclaw gateway ...` सेवा कमांडों वाले समान सेवा नियंत्रण सतह से मैप होता है।

## उपयोग

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## सबकमांड

- `status`: सेवा इंस्टॉल स्थिति दिखाएं और Gateway स्वास्थ्य की जांच करें
- `install`: सेवा इंस्टॉल करें (`launchd`/`systemd`/`schtasks`)
- `uninstall`: सेवा हटाएं
- `start`: सेवा शुरू करें
- `stop`: सेवा रोकें
- `restart`: सेवा फिर से शुरू करें

## सामान्य विकल्प

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- जीवनचक्र (`uninstall|start|stop`): `--json`

टिप्पणियां:

- संभव होने पर `status`, जांच प्रमाणीकरण के लिए कॉन्फिगर किए गए प्रमाणीकरण SecretRefs को हल करता है।
- अगर इस कमांड पथ में आवश्यक प्रमाणीकरण SecretRef हल नहीं होता है, तो जांच कनेक्टिविटी/प्रमाणीकरण विफल होने पर `daemon status --json`, `rpc.authWarning` रिपोर्ट करता है; `--token`/`--password` स्पष्ट रूप से पास करें या पहले सीक्रेट स्रोत को हल करें।
- अगर जांच सफल होती है, तो गलत सकारात्मक परिणामों से बचने के लिए अनसुलझी auth-ref चेतावनियां दबा दी जाती हैं।
- `status --deep` सर्वोत्तम-प्रयास वाली सिस्टम-स्तरीय सेवा स्कैन जोड़ता है। जब उसे अन्य gateway-जैसी सेवाएं मिलती हैं, तो मानव-पठनीय आउटपुट सफाई संकेत प्रिंट करता है और चेतावनी देता है कि प्रति मशीन एक gateway अभी भी सामान्य अनुशंसा है।
- `status --deep` Plugin-अवेयर मोड में कॉन्फिग सत्यापन भी चलाता है और कॉन्फिगर किए गए plugin manifest चेतावनियां सामने लाता है (उदाहरण के लिए गायब channel config metadata), ताकि इंस्टॉल और अपडेट smoke checks उन्हें पकड़ सकें। डिफॉल्ट `status` तेज read-only पथ रखता है जो plugin validation को छोड़ता है।
- Linux systemd इंस्टॉल पर, `status` token-drift जांचों में `Environment=` और `EnvironmentFile=` दोनों unit स्रोत शामिल होते हैं।
- Drift जांचें merged runtime env का उपयोग करके `gateway.auth.token` SecretRefs हल करती हैं (पहले service command env, फिर process env fallback)।
- अगर token auth प्रभावी रूप से सक्रिय नहीं है (`password`/`none`/`trusted-proxy` का स्पष्ट `gateway.auth.mode`, या mode unset जहां password जीत सकता है और कोई token candidate नहीं जीत सकता), तो token-drift जांचें config token resolution छोड़ देती हैं।
- जब token auth को token चाहिए और `gateway.auth.token` SecretRef-managed है, तो `install` सत्यापित करता है कि SecretRef हल किया जा सकता है, लेकिन resolved token को service environment metadata में persist नहीं करता।
- अगर token auth को token चाहिए और कॉन्फिगर किया गया token SecretRef अनसुलझा है, तो install fail closed होता है।
- अगर `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फिगर हैं और `gateway.auth.mode` unset है, तो install तब तक blocked रहता है जब तक mode स्पष्ट रूप से set नहीं किया जाता।
- macOS पर, `install` LaunchAgent plists को owner-only रखता है और API keys या auth-profile env refs को `EnvironmentVariables` में serialize करने के बजाय owner-only file और wrapper के जरिए managed service environment values लोड करता है।
- अगर आप जानबूझकर एक host पर कई gateways चलाते हैं, तो ports, config/state, और workspaces को isolate करें; देखें [/gateway#multiple-gateways-same-host](/hi/gateway#multiple-gateways-same-host).
- `restart --safe` running Gateway से active work को preflight करने और active work drain होने के बाद एक coalesced restart schedule करने को कहता है। डिफॉल्ट safe restart, कॉन्फिगर किए गए `gateway.reload.deferralTimeoutMs` (डिफॉल्ट 5 मिनट) तक active work का इंतजार करता है; वह budget खत्म होने पर restart force किया जाता है। कभी force न करने वाली indefinite safe wait के लिए `gateway.reload.deferralTimeoutMs` को `0` पर set करें। Plain `restart` मौजूदा service-manager behavior रखता है; `--force` immediate override path बना रहता है।
- `restart --safe --skip-deferral` OpenClaw-aware safe restart चलाता है लेकिन active-work deferral gate को bypass करता है, ताकि blockers report होने पर भी Gateway restart तुरंत emit करे। जब कोई stuck task run safe restart को pin कर देता है, तब operator escape hatch; `--safe` आवश्यक है।

## प्राथमिकता दें

वर्तमान docs और उदाहरणों के लिए [`openclaw gateway`](/hi/cli/gateway) का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway रनबुक](/hi/gateway)
