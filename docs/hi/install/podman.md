---
read_when:
    - आप Docker के बजाय Podman के साथ कंटेनरीकृत Gateway चाहते हैं
summary: OpenClaw को रूटलेस Podman कंटेनर में चलाएँ
title: Podman
x-i18n:
    generated_at: "2026-07-16T15:31:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway को रूटलेस Podman कंटेनर में चलाएँ, जिसे आपका वर्तमान गैर-रूट उपयोगकर्ता प्रबंधित करता है।

मॉडल:

- Podman Gateway कंटेनर चलाता है।
- आपके होस्ट का `openclaw` CLI नियंत्रण तल है।
- डिफ़ॉल्ट रूप से स्थायी स्थिति होस्ट पर `~/.openclaw` के अंतर्गत रहती है।
- दैनिक प्रबंधन में `sudo -u openclaw`, `podman exec`, या किसी अलग सेवा उपयोगकर्ता के बजाय `openclaw --container <name> ...` का उपयोग होता है।

## पूर्वापेक्षाएँ

- रूटलेस मोड में **Podman**
- होस्ट पर इंस्टॉल किया गया **OpenClaw CLI**
- **वैकल्पिक:** यदि आप Quadlet-प्रबंधित स्वचालित प्रारंभ चाहते हैं, तो `systemd --user`
- **वैकल्पिक:** केवल तभी `sudo`, जब आप हेडलेस होस्ट पर बूट स्थायित्व के लिए `loginctl enable-linger "$(whoami)"` चाहते हैं

## त्वरित शुरुआत

<Steps>
  <Step title="एक बार का सेटअप">
    रेपो रूट से `./scripts/podman/setup.sh` चलाएँ।

    यह आपके रूटलेस Podman स्टोर में `openclaw:local` बनाता है (या सेट होने पर `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` पुल करता है), अनुपस्थित होने पर `gateway.mode: "local"` सहित `~/.openclaw/openclaw.json` बनाता है, और अनुपस्थित होने पर जनरेट किए गए `OPENCLAW_GATEWAY_TOKEN` सहित `~/.openclaw/.env` बनाता है।

    वैकल्पिक बिल्ड-समय env vars:

    | वेरिएबल | प्रभाव |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local` बनाने के बजाय किसी मौजूदा/पुल की गई इमेज का उपयोग करें |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | इमेज बिल्ड के दौरान अतिरिक्त apt पैकेज इंस्टॉल करें (पुराना `OPENCLAW_DOCKER_APT_PACKAGES` भी स्वीकार करता है) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | इमेज बिल्ड के दौरान अतिरिक्त Python पैकेज इंस्टॉल करें; संस्करण पिन करें और केवल विश्वसनीय पैकेज इंडेक्स का उपयोग करें |
    | `OPENCLAW_EXTENSIONS` | समर्थित चयनित plugins को कंपाइल/पैकेज करें और उनकी रनटाइम निर्भरताएँ इंस्टॉल करें |
    | `OPENCLAW_INSTALL_BROWSER` | ब्राउज़र ऑटोमेशन के लिए Chromium और Xvfb पहले से इंस्टॉल करें (`1` पर सेट करें) |

    इसके बजाय Quadlet-प्रबंधित सेटअप के लिए (केवल Linux + systemd उपयोगकर्ता सेवाएँ):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    या `OPENCLAW_PODMAN_QUADLET=1` सेट करें।

  </Step>

  <Step title="Gateway कंटेनर प्रारंभ करें">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    कंटेनर को आपके वर्तमान uid/gid के रूप में `--userns=keep-id` के साथ प्रारंभ करता है और आपकी OpenClaw स्थिति को कंटेनर में बाइंड-माउंट करता है।

  </Step>

  <Step title="कंटेनर के भीतर ऑनबोर्डिंग चलाएँ">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    फिर `http://127.0.0.1:18789/` खोलें और `~/.openclaw/.env` का टोकन उपयोग करें।

    मॉडल प्रमाणीकरण: सेटअप के दौरान OpenClaw-प्रबंधित प्रमाणीकरण का उपयोग करें (Anthropic API कुंजियाँ, या Codex-समर्थित OpenAI के लिए OpenAI Codex ब्राउज़र OAuth/डिवाइस-कोड प्रमाणीकरण)। Podman लॉन्चर `~/.claude` या `~/.codex` जैसे होस्ट CLI क्रेडेंशियल होम को सेटअप या Gateway कंटेनर में माउंट नहीं करता। मौजूदा होस्ट CLI लॉगिन केवल उसी होस्ट की सुविधाजनक विधियाँ हैं -- कंटेनर इंस्टॉलेशन के लिए, प्रदाता प्रमाणीकरण को सेटअप द्वारा प्रबंधित माउंट की गई `~/.openclaw` स्थिति में रखें।

  </Step>

  <Step title="होस्ट CLI से चल रहे कंटेनर को प्रबंधित करें">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    इसके बाद सामान्य `openclaw` कमांड उस कंटेनर के भीतर अपने-आप चलते हैं:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # अतिरिक्त सेवा स्कैन शामिल करता है
    openclaw doctor
    openclaw channels login
    ```

    macOS पर Podman मशीन के कारण ब्राउज़र Gateway को गैर-स्थानीय दिखाई दे सकता है। यदि लॉन्च के बाद Control UI डिवाइस-प्रमाणीकरण त्रुटियाँ दिखाता है, तो [Podman और Tailscale](#podman-and-tailscale) में दिए गए Tailscale मार्गदर्शन का उपयोग करें।

  </Step>
</Steps>

मैन्युअल लॉन्चर `~/.openclaw/.env` से केवल Podman-संबंधित कुंजियों की एक छोटी अनुमतिसूची पढ़ता है और कंटेनर को स्पष्ट रनटाइम env vars देता है; यह पूरी env फ़ाइल Podman को नहीं देता।

<a id="podman-and-tailscale"></a>

## Podman और Tailscale

HTTPS या दूरस्थ ब्राउज़र पहुँच के लिए, मुख्य Tailscale दस्तावेज़ों का पालन करें।

Podman-विशिष्ट टिप्पणियाँ:

- Podman प्रकाशन होस्ट को `127.0.0.1` पर रखें।
- `openclaw gateway --tailscale serve` के बजाय होस्ट-प्रबंधित `tailscale serve` को प्राथमिकता दें।
- macOS पर, यदि स्थानीय ब्राउज़र डिवाइस-प्रमाणीकरण संदर्भ अविश्वसनीय हो, तो तदर्थ स्थानीय टनल समाधानों के बजाय Tailscale पहुँच का उपयोग करें।

[Tailscale](/hi/gateway/tailscale) और [Control UI](/hi/web/control-ui) देखें।

## Systemd (Quadlet, वैकल्पिक)

यदि आपने `./scripts/podman/setup.sh --quadlet` चलाया है, तो सेटअप `~/.config/containers/systemd/openclaw.container` पर एक Quadlet फ़ाइल इंस्टॉल करता है।

| कार्रवाई | कमांड                                    |
| ------ | ------------------------------------------ |
| प्रारंभ करें  | `systemctl --user start openclaw.service`  |
| रोकें   | `systemctl --user stop openclaw.service`   |
| स्थिति | `systemctl --user status openclaw.service` |
| लॉग   | `journalctl --user -u openclaw.service -f` |

Quadlet फ़ाइल संपादित करने के बाद:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/हेडलेस होस्ट पर बूट स्थायित्व के लिए, अपने वर्तमान उपयोगकर्ता हेतु lingering सक्षम करें:

```bash
sudo loginctl enable-linger "$(whoami)"
```

जनरेट की गई Quadlet सेवा एक निश्चित, सुदृढ़ डिफ़ॉल्ट संरचना बनाए रखती है: `127.0.0.1` प्रकाशित पोर्ट (`18789` Gateway, `18790` ब्रिज), कंटेनर के भीतर `--bind lan`, `keep-id` उपयोगकर्ता नेमस्पेस, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, और `TimeoutStartSec=300`। यह `OPENCLAW_GATEWAY_TOKEN` जैसे मानों के लिए `~/.openclaw/.env` को रनटाइम `EnvironmentFile` के रूप में पढ़ती है, लेकिन मैन्युअल लॉन्चर की Podman-विशिष्ट ओवरराइड अनुमतिसूची का उपयोग नहीं करती। कस्टम प्रकाशित पोर्ट, प्रकाशन होस्ट, या अन्य कंटेनर-रन फ़्लैग के लिए इसके बजाय मैन्युअल लॉन्चर का उपयोग करें, या सीधे `~/.config/containers/systemd/openclaw.container` संपादित करें और फिर सेवा को पुनः लोड तथा पुनः प्रारंभ करें।

## कॉन्फ़िगरेशन, env और स्टोरेज

- **कॉन्फ़िगरेशन डायरेक्टरी:** `~/.openclaw`
- **वर्कस्पेस डायरेक्टरी:** `~/.openclaw/workspace`
- **टोकन फ़ाइल:** `~/.openclaw/.env`
- **लॉन्च सहायक:** `./scripts/run-openclaw-podman.sh`

लॉन्च स्क्रिप्ट और Quadlet होस्ट स्थिति को कंटेनर में बाइंड-माउंट करते हैं: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`। डिफ़ॉल्ट रूप से ये होस्ट डायरेक्टरियाँ हैं, अनाम कंटेनर स्थिति नहीं, इसलिए `openclaw.json`, प्रति-एजेंट `auth-profiles.json`, चैनल/प्रदाता स्थिति, सत्र और वर्कस्पेस कंटेनर बदलने के बाद भी बने रहते हैं। सेटअप प्रकाशित Gateway पोर्ट पर `127.0.0.1` और `localhost` के लिए `gateway.controlUi.allowedOrigins` भी आरंभिक रूप से भरता है, ताकि स्थानीय डैशबोर्ड कंटेनर के गैर-लूपबैक बाइंड के साथ काम करे।

मैन्युअल लॉन्चर के लिए उपयोगी env vars (इन्हें `~/.openclaw/.env` में बनाए रखें; कंटेनर/इमेज डिफ़ॉल्ट को अंतिम रूप देने से पहले लॉन्चर यह फ़ाइल पढ़ता है):

| वेरिएबल                                        | डिफ़ॉल्ट          | प्रभाव                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | कंटेनर का नाम                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | चलाने के लिए इमेज                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | कंटेनर `18789` से मैप किया गया होस्ट पोर्ट  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | कंटेनर `18790` से मैप किया गया होस्ट पोर्ट  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | प्रकाशित पोर्ट के लिए होस्ट इंटरफ़ेस     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | कंटेनर के भीतर Gateway बाइंड मोड |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto`, या `host`           |

यदि आप गैर-डिफ़ॉल्ट `OPENCLAW_CONFIG_DIR` या `OPENCLAW_WORKSPACE_DIR` का उपयोग करते हैं, तो `./scripts/podman/setup.sh` और बाद के `./scripts/run-openclaw-podman.sh launch` कमांड, दोनों के लिए समान वेरिएबल सेट करें -- रेपो-स्थानीय लॉन्चर शेल बदलने पर कस्टम पथ ओवरराइड बनाए नहीं रखता।

## इमेज अपग्रेड करना

नई इमेज पुनः बनाने या पुल करने के बाद, कंटेनर या Quadlet सेवा पुनः प्रारंभ करें।
OpenClaw के नए संस्करण के पहले प्रारंभ पर, तैयार होने की सूचना देने से पहले Gateway सुरक्षित स्थिति और
Plugin मरम्मत चलाता है।

यदि Gateway तैयार होने के बजाय बंद हो जाता है, तो उसी माउंट की गई स्थिति/कॉन्फ़िगरेशन पर
उसी इमेज को `openclaw doctor --fix` के साथ एक बार चलाएँ, फिर
Gateway को सामान्य रूप से पुनः प्रारंभ करें:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

SELinux होस्ट पर, यदि Podman माउंट की गई स्थिति तक पहुँच अवरुद्ध करता है, तो दोनों बाइंड माउंट में
`,Z` जोड़ें।

## उपयोगी कमांड

- **कंटेनर लॉग:** `podman logs -f openclaw`
- **कंटेनर रोकें:** `podman stop openclaw`
- **कंटेनर हटाएँ:** `podman rm -f openclaw`
- **होस्ट CLI से डैशबोर्ड URL खोलें:** `openclaw dashboard --no-open`
- **होस्ट CLI के माध्यम से स्वास्थ्य/स्थिति:** `openclaw gateway status --deep` (RPC जाँच + अतिरिक्त सेवा स्कैन)

## समस्या निवारण

- **कॉन्फ़िगरेशन या वर्कस्पेस पर अनुमति अस्वीकृत (EACCES):** कंटेनर डिफ़ॉल्ट रूप से `--userns=keep-id` और `--user <your uid>:<your gid>` के साथ चलता है। सुनिश्चित करें कि होस्ट के कॉन्फ़िगरेशन/वर्कस्पेस पथों का स्वामित्व आपके वर्तमान उपयोगकर्ता के पास हो।
- **Gateway प्रारंभ अवरुद्ध (अनुपस्थित `gateway.mode=local`):** सुनिश्चित करें कि `~/.openclaw/openclaw.json` मौजूद है और `gateway.mode="local"` सेट करता है। अनुपस्थित होने पर `scripts/podman/setup.sh` इसे बनाता है।
- **इमेज अपडेट के बाद कंटेनर पुनः प्रारंभ होता है:** [इमेज अपग्रेड करना](#upgrading-images) में दिया गया एक-बार का `openclaw doctor --fix` कमांड चलाएँ, फिर Gateway दोबारा प्रारंभ करें।
- **कंटेनर CLI कमांड गलत लक्ष्य तक पहुँचते हैं:** `openclaw --container <name> ...` का स्पष्ट रूप से उपयोग करें, या अपने शेल में `OPENCLAW_CONTAINER=<name>` एक्सपोर्ट करें।
- **`openclaw update` में `--container` के साथ विफलता:** यह अपेक्षित है। इमेज पुनः बनाएँ/पुल करें, फिर कंटेनर या Quadlet सेवा पुनः प्रारंभ करें।
- **Quadlet सेवा प्रारंभ नहीं होती:** `systemctl --user daemon-reload` चलाएँ, फिर `systemctl --user start openclaw.service`। हेडलेस सिस्टम पर आपको `sudo loginctl enable-linger "$(whoami)"` की भी आवश्यकता हो सकती है।
- **SELinux बाइंड माउंट अवरुद्ध करता है:** डिफ़ॉल्ट माउंट व्यवहार को न बदलें; Linux पर SELinux के enforcing या permissive होने पर लॉन्चर अपने-आप `:Z` जोड़ता है।

## संबंधित

- [Docker](/hi/install/docker)
- [Gateway पृष्ठभूमि प्रक्रिया](/hi/gateway/background-process)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
