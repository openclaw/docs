---
read_when:
    - Linux सहायक ऐप की स्थिति देखी जा रही है
    - प्लेटफ़ॉर्म कवरेज या योगदान की योजना बनाना
    - VPS या कंटेनर पर Linux OOM kill या exit 137 को debug करना
summary: Linux समर्थन + सहयोगी ऐप की स्थिति
title: Linux ऐप
x-i18n:
    generated_at: "2026-06-28T23:28:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

The Gateway Linux पर पूरी तरह समर्थित है। **Node अनुशंसित runtime है**।
Gateway के लिए Bun अनुशंसित नहीं है (WhatsApp/Telegram bugs)।

Native Linux companion apps योजनाबद्ध हैं। यदि आप कोई बनाने में मदद करना चाहते हैं, तो योगदानों का स्वागत है।

## शुरुआती त्वरित मार्ग (VPS)

1. Node 24 इंस्टॉल करें (अनुशंसित; Node 22 LTS, वर्तमान में `22.19+`, compatibility के लिए अभी भी काम करता है)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. अपने laptop से: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` खोलें और configured shared secret से authenticate करें (default रूप से token; यदि आपने `gateway.auth.mode: "password"` सेट किया है तो password)

पूर्ण Linux server guide: [Linux Server](/hi/vps). चरण-दर-चरण VPS उदाहरण: [exe.dev](/hi/install/exe-dev)

## इंस्टॉल करें

- [शुरू करना](/hi/start/getting-started)
- [इंस्टॉल और updates](/hi/install/updating)
- वैकल्पिक flows: [Bun (experimental)](/hi/install/bun), [Nix](/hi/install/nix), [Docker](/hi/install/docker)

## Gateway

- [Gateway runbook](/hi/gateway)
- [Configuration](/hi/gateway/configuration)

## Gateway service install (CLI)

इनमें से एक का उपयोग करें:

```
openclaw onboard --install-daemon
```

या:

```
openclaw gateway install
```

या:

```
openclaw configure
```

Prompt आने पर **Gateway service** चुनें।

Repair/migrate:

```
openclaw doctor
```

## System control (systemd user unit)

OpenClaw default रूप से systemd **user** service इंस्टॉल करता है। Shared या always-on servers के लिए **system**
service का उपयोग करें। `openclaw gateway install` और
`openclaw onboard --install-daemon` पहले से ही आपके लिए current canonical unit
render करते हैं; custom system/service-manager setup की जरूरत हो तभी इसे हाथ से लिखें।
पूरी service guidance [Gateway runbook](/hi/gateway) में है।

Minimal setup:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` बनाएं:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

इसे enable करें:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Memory pressure और OOM kills

Linux पर, जब किसी host, VM, या container cgroup की memory समाप्त हो जाती है,
तो kernel एक OOM victim चुनता है। Gateway खराब victim हो सकता है क्योंकि यह long-lived
sessions और channel connections का मालिक होता है। इसलिए OpenClaw, जहां संभव हो,
transient child processes को Gateway से पहले kill किए जाने के लिए bias करता है।

Eligible Linux child spawns के लिए, OpenClaw child को एक छोटे
`/bin/sh` wrapper के जरिए शुरू करता है, जो child के अपने `oom_score_adj` को `1000` तक बढ़ाता है, फिर
real command को `exec` करता है। यह unprivileged operation है क्योंकि child
केवल अपनी OOM kill likelihood बढ़ा रहा होता है।

Covered child process surfaces में शामिल हैं:

- supervisor-managed command children,
- PTY shell children,
- MCP stdio server children,
- OpenClaw-launched browser/Chrome processes.

Wrapper केवल Linux के लिए है और `/bin/sh` उपलब्ध न होने पर skip किया जाता है। इसे
तब भी skip किया जाता है यदि child env `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, या `off` सेट करता है।

Child process verify करने के लिए:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Covered children के लिए expected value `1000` है। Gateway process को
अपना normal score रखना चाहिए, आमतौर पर `0`।

Recommended systemd unit `OOMPolicy=continue` भी सेट करता है। इससे
OOM killer द्वारा transient child process चुने जाने पर Gateway unit alive रहती है;
child command/session fail हो सकता है और systemd द्वारा पूरे gateway service को failed mark करके
सभी channels restart किए बिना अपनी error report कर सकता है।

यह normal memory tuning को replace नहीं करता। यदि कोई VPS या container बार-बार
children को kill करता है, तो memory limit बढ़ाएं, concurrency घटाएं, या systemd `MemoryMax=` या container-level memory limits जैसे stronger
resource controls जोड़ें।

## संबंधित

- [Install overview](/hi/install)
- [Linux server](/hi/vps)
- [Raspberry Pi](/hi/install/raspberry-pi)
