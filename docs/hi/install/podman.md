---
read_when:
    - आप Docker के बजाय Podman के साथ एक कंटेनरीकृत Gateway चाहते हैं
summary: रूटलेस Podman कंटेनर में OpenClaw चलाएँ
title: Podman
x-i18n:
    generated_at: "2026-06-28T23:23:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway को rootless Podman कंटेनर में चलाएं, जिसे आपका मौजूदा गैर-root उपयोगकर्ता प्रबंधित करता है।

अभिप्रेत मॉडल है:

- Podman gateway कंटेनर चलाता है।
- आपका होस्ट `openclaw` CLI control plane है।
- स्थायी स्थिति डिफ़ॉल्ट रूप से होस्ट पर `~/.openclaw` के अंतर्गत रहती है।
- दैनिक प्रबंधन `sudo -u openclaw`, `podman exec`, या अलग service user के बजाय `openclaw --container <name> ...` का उपयोग करता है।

## पूर्वापेक्षाएं

- rootless मोड में **Podman**
- होस्ट पर स्थापित **OpenClaw CLI**
- **वैकल्पिक:** यदि आप Quadlet-प्रबंधित auto-start चाहते हैं, तो `systemd --user`
- **वैकल्पिक:** `sudo` केवल तब, जब आप headless होस्ट पर boot persistence के लिए `loginctl enable-linger "$(whoami)"` चाहते हैं

## त्वरित शुरुआत

<Steps>
  <Step title="एक-बार सेटअप">
    repo root से, `./scripts/podman/setup.sh` चलाएं।
  </Step>

  <Step title="Gateway कंटेनर शुरू करें">
    कंटेनर को `./scripts/run-openclaw-podman.sh launch` से शुरू करें।
  </Step>

  <Step title="कंटेनर के अंदर onboarding चलाएं">
    `./scripts/run-openclaw-podman.sh launch setup` चलाएं, फिर `http://127.0.0.1:18789/` खोलें।
  </Step>

  <Step title="होस्ट CLI से चल रहे कंटेनर को प्रबंधित करें">
    `OPENCLAW_CONTAINER=openclaw` सेट करें, फिर होस्ट से सामान्य `openclaw` कमांड का उपयोग करें।
  </Step>
</Steps>

सेटअप विवरण:

- `./scripts/podman/setup.sh` डिफ़ॉल्ट रूप से आपके rootless Podman store में `openclaw:local` बनाता है, या यदि आपने `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` सेट किया है तो उसका उपयोग करता है।
- यदि अनुपस्थित हो, तो यह `gateway.mode: "local"` के साथ `~/.openclaw/openclaw.json` बनाता है।
- यदि अनुपस्थित हो, तो यह `OPENCLAW_GATEWAY_TOKEN` के साथ `~/.openclaw/.env` बनाता है।
- manual launches के लिए, helper `~/.openclaw/.env` से केवल Podman-संबंधित keys की छोटी allowlist पढ़ता है और कंटेनर को स्पष्ट runtime env vars पास करता है; यह पूरी env file Podman को नहीं देता।

Quadlet-प्रबंधित सेटअप:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet केवल Linux विकल्प है क्योंकि यह systemd user services पर निर्भर करता है।

आप `OPENCLAW_PODMAN_QUADLET=1` भी सेट कर सकते हैं।

वैकल्पिक build/setup env vars:

- `OPENCLAW_IMAGE` या `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` बनाने के बजाय किसी मौजूदा/pulled image का उपयोग करें
- `OPENCLAW_IMAGE_APT_PACKAGES` -- image build के दौरान अतिरिक्त apt packages install करें (legacy `OPENCLAW_DOCKER_APT_PACKAGES` भी स्वीकार करता है)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- image build के दौरान अतिरिक्त Python packages install करें; versions pin करें और केवल उन package indexes का उपयोग करें जिन पर आप भरोसा करते हैं
- `OPENCLAW_EXTENSIONS` -- build time पर Plugin dependencies पहले से install करें
- `OPENCLAW_INSTALL_BROWSER` -- browser automation के लिए Chromium और Xvfb पहले से install करें (enable करने के लिए `1` पर सेट करें)

कंटेनर start:

```bash
./scripts/run-openclaw-podman.sh launch
```

script कंटेनर को आपके मौजूदा uid/gid के रूप में `--userns=keep-id` के साथ शुरू करता है और आपके OpenClaw state को कंटेनर में bind-mount करता है।

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

फिर `http://127.0.0.1:18789/` खोलें और `~/.openclaw/.env` से token का उपयोग करें।

Podman में model auth:

- setup के दौरान OpenClaw-प्रबंधित auth का उपयोग करें: Anthropic के लिए Anthropic API keys, या Codex-backed OpenAI के लिए OpenAI Codex browser OAuth/device-code auth।
- Podman launcher setup या gateway कंटेनर में host CLI credential homes जैसे `~/.claude` या `~/.codex` mount नहीं करता।
- मौजूदा host CLI logins same-host सुविधा paths हैं। container installs के लिए, provider auth को mounted `~/.openclaw` state में रखें जिसे setup प्रबंधित करता है।

होस्ट CLI default:

```bash
export OPENCLAW_CONTAINER=openclaw
```

फिर इन जैसे commands अपने आप उस कंटेनर के अंदर चलेंगे:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS पर, Podman machine browser को gateway के लिए non-local दिखा सकती है।
यदि launch के बाद Control UI device-auth errors रिपोर्ट करता है, तो
[Podman और Tailscale](#podman--tailscale) में Tailscale guidance का उपयोग करें।

<a id="podman--tailscale"></a>

## Podman और Tailscale

HTTPS या remote browser access के लिए, मुख्य Tailscale docs का पालन करें।

Podman-specific note:

- Podman publish host को `127.0.0.1` पर रखें।
- `openclaw gateway --tailscale serve` के बजाय host-managed `tailscale serve` को प्राथमिकता दें।
- macOS पर, यदि local browser device-auth context भरोसेमंद नहीं है, तो ad hoc local tunnel workarounds के बजाय Tailscale access का उपयोग करें।

देखें:

- [Tailscale](/hi/gateway/tailscale)
- [Control UI](/hi/web/control-ui)

## Systemd (Quadlet, वैकल्पिक)

यदि आपने `./scripts/podman/setup.sh --quadlet` चलाया है, तो setup यहां Quadlet file install करता है:

```bash
~/.config/containers/systemd/openclaw.container
```

उपयोगी commands:

- **Start:** `systemctl --user start openclaw.service`
- **Stop:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Quadlet file edit करने के बाद:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/headless hosts पर boot persistence के लिए, अपने मौजूदा user के लिए lingering enable करें:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env, और storage

- **Config dir:** `~/.openclaw`
- **Workspace dir:** `~/.openclaw/workspace`
- **Token file:** `~/.openclaw/.env`
- **Launch helper:** `./scripts/run-openclaw-podman.sh`

launch script और Quadlet host state को कंटेनर में bind-mount करते हैं:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

डिफ़ॉल्ट रूप से ये host directories हैं, anonymous container state नहीं, इसलिए
`openclaw.json`, per-agent `auth-profiles.json`, channel/provider state,
sessions, और workspace container replacement के बाद भी बने रहते हैं।
Podman setup प्रकाशित gateway port पर `127.0.0.1` और `localhost` के लिए `gateway.controlUi.allowedOrigins` भी seed करता है, ताकि local dashboard कंटेनर के non-loopback bind के साथ काम करे।

manual launcher के लिए उपयोगी env vars:

- `OPENCLAW_PODMAN_CONTAINER` -- container name (डिफ़ॉल्ट रूप से `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- चलाने के लिए image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- container `18789` पर mapped host port
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- container `18790` पर mapped host port
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- published ports के लिए host interface; default `127.0.0.1` है
- `OPENCLAW_GATEWAY_BIND` -- कंटेनर के अंदर gateway bind mode; default `lan` है
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (default), `auto`, या `host`

manual launcher container/image defaults final करने से पहले `~/.openclaw/.env` पढ़ता है, इसलिए आप इन्हें वहां persist कर सकते हैं।

यदि आप non-default `OPENCLAW_CONFIG_DIR` या `OPENCLAW_WORKSPACE_DIR` का उपयोग करते हैं, तो `./scripts/podman/setup.sh` और बाद के `./scripts/run-openclaw-podman.sh launch` commands दोनों के लिए वही variables सेट करें। repo-local launcher shells के बीच custom path overrides persist नहीं करता।

Quadlet note:

- generated Quadlet service जानबूझकर fixed, hardened default shape रखती है: `127.0.0.1` published ports, कंटेनर के अंदर `--bind lan`, और `keep-id` user namespace।
- यह `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, और `TimeoutStartSec=300` pin करता है।
- यह `127.0.0.1:18789:18789` (gateway) और `127.0.0.1:18790:18790` (bridge) दोनों publish करता है।
- यह `OPENCLAW_GATEWAY_TOKEN` जैसी values के लिए runtime `EnvironmentFile` के रूप में `~/.openclaw/.env` पढ़ता है, लेकिन manual launcher की Podman-specific override allowlist consume नहीं करता।
- यदि आपको custom publish ports, publish host, या अन्य container-run flags चाहिए, तो manual launcher का उपयोग करें या `~/.config/containers/systemd/openclaw.container` को सीधे edit करें, फिर service reload और restart करें।

## उपयोगी commands

- **Container logs:** `podman logs -f openclaw`
- **Stop container:** `podman stop openclaw`
- **Remove container:** `podman rm -f openclaw`
- **Host CLI से dashboard URL खोलें:** `openclaw dashboard --no-open`
- **Host CLI के माध्यम से Health/status:** `openclaw gateway status --deep` (RPC probe + अतिरिक्त
  service scan)

## Troubleshooting

- **config या workspace पर Permission denied (EACCES):** कंटेनर डिफ़ॉल्ट रूप से `--userns=keep-id` और `--user <your uid>:<your gid>` के साथ चलता है। सुनिश्चित करें कि host config/workspace paths आपके मौजूदा user के owned हों।
- **Gateway start blocked (missing `gateway.mode=local`):** सुनिश्चित करें कि `~/.openclaw/openclaw.json` मौजूद है और `gateway.mode="local"` सेट करता है। यदि missing हो, तो `scripts/podman/setup.sh` इसे बनाता है।
- **Container CLI commands गलत target पर जाते हैं:** स्पष्ट रूप से `openclaw --container <name> ...` का उपयोग करें, या अपने shell में `OPENCLAW_CONTAINER=<name>` export करें।
- **`openclaw update` `--container` के साथ fail होता है:** अपेक्षित है। image rebuild/pull करें, फिर container या Quadlet service restart करें।
- **Quadlet service शुरू नहीं होती:** `systemctl --user daemon-reload` चलाएं, फिर `systemctl --user start openclaw.service`। headless systems पर आपको `sudo loginctl enable-linger "$(whoami)"` भी चाहिए हो सकता है।
- **SELinux bind mounts block करता है:** default mount behavior को वैसा ही रहने दें; launcher Linux पर SELinux enforcing या permissive होने पर auto-adds `:Z` करता है।

## संबंधित

- [Docker](/hi/install/docker)
- [Gateway background process](/hi/gateway/background-process)
- [Gateway troubleshooting](/hi/gateway/troubleshooting)
