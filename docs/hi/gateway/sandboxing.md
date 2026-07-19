---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw सैंडबॉक्सिंग कैसे काम करती है: मोड, स्कोप, वर्कस्पेस एक्सेस और इमेजेस'
title: सैंडबॉक्सिंग
x-i18n:
    generated_at: "2026-07-19T08:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e2cab130955ee38532838a97ad3c750921dad5e9fe6ed6c533837291e935cd5
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw प्रभाव-क्षेत्र को कम करने के लिए टूल निष्पादन को सैंडबॉक्स बैकएंड के भीतर चला सकता है। सैंडबॉक्सिंग डिफ़ॉल्ट रूप से बंद रहती है और इसे `agents.defaults.sandbox` (वैश्विक) या `agents.list[].sandbox` (प्रति-एजेंट) द्वारा नियंत्रित किया जाता है। Gateway प्रक्रिया हमेशा होस्ट पर रहती है; सक्षम होने पर केवल टूल निष्पादन सैंडबॉक्स में जाता है।

<Note>
यह पूर्ण सुरक्षा सीमा नहीं है, लेकिन मॉडल द्वारा कोई मूर्खतापूर्ण काम किए जाने पर यह फ़ाइल सिस्टम और प्रक्रिया की पहुँच को काफी हद तक सीमित करती है।
</Note>

## क्या सैंडबॉक्स किया जाता है

- टूल निष्पादन: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, आदि।
- वैकल्पिक सैंडबॉक्स किया गया ब्राउज़र (`agents.defaults.sandbox.browser`)।

सैंडबॉक्स नहीं किए जाते:

- स्वयं Gateway प्रक्रिया।
- `tools.elevated` के माध्यम से सैंडबॉक्स के बाहर चलने की स्पष्ट अनुमति वाला कोई भी टूल। उन्नत exec सैंडबॉक्सिंग को बायपास करता है और कॉन्फ़िगर किए गए एस्केप पथ पर चलता है (डिफ़ॉल्ट रूप से `gateway`, या exec लक्ष्य के `node` होने पर `node`)। यदि सैंडबॉक्सिंग बंद है, तो `tools.elevated` कुछ नहीं बदलता, क्योंकि exec पहले से ही होस्ट पर चलता है। [उन्नत मोड](/hi/tools/elevated) देखें।

## मोड, दायरा और बैकएंड

तीन स्वतंत्र सेटिंग सैंडबॉक्स व्यवहार को नियंत्रित करती हैं:

| सेटिंग | कुंजी                               | मान                       | डिफ़ॉल्ट  |
| ------- | --------------------------------- | ---------------------------- | -------- |
| मोड    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| दायरा   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| बैकएंड | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**मोड** नियंत्रित करता है कि सैंडबॉक्सिंग कब लागू होती है:

- `off`: कोई सैंडबॉक्सिंग नहीं।
- `non-main`: एजेंट के मुख्य सत्र को छोड़कर प्रत्येक सत्र को सैंडबॉक्स करें। मुख्य सत्र कुंजी हमेशा `agent:<agentId>:main` होती है (या `session.scope` के `"global"` होने पर `global`); इसे कॉन्फ़िगर नहीं किया जा सकता। समूह/चैनल सत्र अपनी अलग कुंजियों का उपयोग करते हैं, इसलिए वे हमेशा गैर-मुख्य माने जाते हैं और सैंडबॉक्स किए जाते हैं।
- `all`: प्रत्येक सत्र सैंडबॉक्स में चलता है।

**दायरा** नियंत्रित करता है कि कितने कंटेनर/परिवेश बनाए जाते हैं:

- `agent`: प्रति एजेंट एक कंटेनर।
- `session`: प्रति सत्र एक कंटेनर।
- `shared`: सभी सैंडबॉक्स किए गए सत्रों द्वारा साझा किया गया एक कंटेनर (इस दायरे में प्रति-एजेंट `docker`/`ssh`/`browser` ओवरराइड अनदेखे किए जाते हैं)।

**बैकएंड** नियंत्रित करता है कि कौन-सा रनटाइम सैंडबॉक्स किए गए टूल निष्पादित करता है। SSH-विशिष्ट कॉन्फ़िगरेशन `agents.defaults.sandbox.ssh` के अंतर्गत रहता है; OpenShell-विशिष्ट कॉन्फ़िगरेशन `plugins.entries.openshell.config` के अंतर्गत रहता है।

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **कहाँ चलता है**   | स्थानीय कंटेनर                  | कोई भी SSH-सुलभ होस्ट        | OpenShell द्वारा प्रबंधित सैंडबॉक्स                           |
| **सेटअप**           | `scripts/sandbox-setup.sh`       | SSH कुंजी + लक्ष्य होस्ट          | OpenShell plugin सक्षम                            |
| **वर्कस्पेस मॉडल** | बाइंड-माउंट या कॉपी               | रिमोट-कैनोनिकल (एक बार सीड करें)   | `mirror` या `remote`                                |
| **नेटवर्क नियंत्रण** | `docker.network` (डिफ़ॉल्ट: कोई नहीं) | रिमोट होस्ट पर निर्भर         | OpenShell पर निर्भर                                |
| **ब्राउज़र सैंडबॉक्स** | समर्थित                        | समर्थित नहीं                  | अभी समर्थित नहीं                                   |
| **बाइंड माउंट**     | `docker.binds`                   | लागू नहीं                            | लागू नहीं                                                 |
| **सर्वोत्तम उपयोग**        | स्थानीय विकास, पूर्ण पृथक्करण        | रिमोट मशीन पर कार्य स्थानांतरित करना | वैकल्पिक द्विदिशीय सिंक वाले प्रबंधित रिमोट सैंडबॉक्स |

## Docker बैकएंड

सैंडबॉक्सिंग सक्षम होने पर Docker डिफ़ॉल्ट बैकएंड होता है। यह Docker डेमन सॉकेट (`/var/run/docker.sock`) के माध्यम से टूल और सैंडबॉक्स ब्राउज़र को स्थानीय रूप से चलाता है; पृथक्करण Docker नेमस्पेस से मिलता है।

डिफ़ॉल्ट: `network: "none"` (कोई निर्गामी ट्रैफ़िक नहीं), `readOnlyRoot: true`, `capDrop: ["ALL"]`, इमेज `openclaw-sandbox:bookworm-slim`।

होस्ट GPU उपलब्ध कराने के लिए, `agents.defaults.sandbox.docker.gpus` (या प्रति-एजेंट ओवरराइड) को `"all"` या `"device=GPU-uuid"` जैसे मान पर सेट करें। इसे Docker के `--gpus` फ़्लैग को दिया जाता है और इसके लिए NVIDIA Container Toolkit जैसे संगत होस्ट रनटाइम की आवश्यकता होती है।

<Warning>
**Docker-आउट-ऑफ़-Docker (DooD) की बाधाएँ**

यदि आप OpenClaw Gateway को स्वयं Docker कंटेनर के रूप में परिनियोजित करते हैं, तो यह होस्ट के Docker सॉकेट (DooD) का उपयोग करके समान-स्तर के सैंडबॉक्स कंटेनरों को संचालित करता है। इससे पथ मैपिंग की एक बाधा आती है:

- **कॉन्फ़िगरेशन के लिए होस्ट पथ आवश्यक हैं**: `openclaw.json` `workspace` में **होस्ट का निरपेक्ष पथ** (जैसे `/home/user/.openclaw/workspaces`) होना चाहिए, आंतरिक Gateway कंटेनर पथ नहीं। Docker डेमन पथों का मूल्यांकन Gateway के अपने नेमस्पेस के बजाय होस्ट OS नेमस्पेस के सापेक्ष करता है।
- **मेल खाता वॉल्यूम मैप आवश्यक है**: Gateway प्रक्रिया उस `workspace` पथ पर Heartbeat और ब्रिज फ़ाइलें भी लिखती है। Gateway कंटेनर को समान वॉल्यूम मैप (`-v /home/user/.openclaw:/home/user/.openclaw`) दें, ताकि वही होस्ट पथ Gateway कंटेनर के भीतर से भी सही ढंग से रिज़ॉल्व हो। मैपिंग में अंतर होने पर Gateway द्वारा अपना Heartbeat लिखने का प्रयास करते समय `EACCES` दिखाई देता है।
- **Codex कोड मोड**: जब OpenClaw सैंडबॉक्स सक्रिय होता है, तो OpenClaw उस टर्न के लिए Codex ऐप-सर्वर का मूल कोड मोड, उपयोगकर्ता MCP सर्वर और ऐप-समर्थित plugin निष्पादन अक्षम कर देता है (ये OpenClaw सैंडबॉक्स बैकएंड से नहीं, बल्कि Gateway-होस्ट ऐप-सर्वर प्रक्रिया से चलते हैं), जब तक कि सैंडबॉक्स टूल नीति आवश्यक टूल उपलब्ध न कराए और आप प्रायोगिक सैंडबॉक्स exec-सर्वर पथ को न चुनें। इसके बाद शेल पहुँच `sandbox_exec` और `sandbox_process` जैसे OpenClaw सैंडबॉक्स-समर्थित टूल के माध्यम से रूट होती है। होस्ट Docker सॉकेट को एजेंट सैंडबॉक्स कंटेनरों या कस्टम Codex सैंडबॉक्स में माउंट न करें। पूर्ण व्यवहार के लिए [Codex हार्नेस](/hi/plugins/codex-harness) देखें।

Docker सैंडबॉक्स मोड सक्षम Ubuntu/AppArmor होस्ट पर, Codex ऐप-सर्वर `workspace-write` शेल निष्पादन को सैंडबॉक्स कंटेनर के भीतर विशेषाधिकार-रहित उपयोगकर्ता नेमस्पेस की आवश्यकता होती है और सेवा उपयोगकर्ता द्वारा उन्हें न बना पाने पर यह शेल शुरू होने से पहले विफल हो सकता है। Docker सैंडबॉक्स का निर्गामी ट्रैफ़िक अक्षम होने पर (`network: "none"`, डिफ़ॉल्ट) इसके लिए एक विशेषाधिकार-रहित नेटवर्क नेमस्पेस भी आवश्यक है। सामान्य लक्षण: `bwrap: setting up uid map: Permission denied` और `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`। `openclaw doctor` चलाएँ; यदि यह Codex bwrap नेमस्पेस जाँच विफलता की सूचना देता है, तो ऐसा AppArmor प्रोफ़ाइल चुनें जो OpenClaw सेवा प्रक्रिया को आवश्यक नेमस्पेस की अनुमति देता हो। `kernel.apparmor_restrict_unprivileged_userns=0` सुरक्षा संबंधी समझौतों वाला होस्ट-व्यापी वैकल्पिक उपाय है; इसका उपयोग केवल तभी करें जब उस होस्ट की सुरक्षा स्थिति स्वीकार्य हो।
</Warning>

### सैंडबॉक्स किया गया ब्राउज़र

- ब्राउज़र टूल को आवश्यकता होने पर सैंडबॉक्स ब्राउज़र स्वतः शुरू होता है (सुनिश्चित करता है कि CDP पहुँच योग्य है)। `agents.defaults.sandbox.browser.autoStart` (डिफ़ॉल्ट `true`) और `autoStartTimeoutMs` (डिफ़ॉल्ट 12s) के माध्यम से कॉन्फ़िगर करें।
- सैंडबॉक्स ब्राउज़र कंटेनर वैश्विक `bridge` नेटवर्क के बजाय समर्पित Docker नेटवर्क (`openclaw-sandbox-browser`) का उपयोग करते हैं। `agents.defaults.sandbox.browser.network` से कॉन्फ़िगर करें।
- `agents.defaults.sandbox.browser.cdpSourceRange` CIDR अनुमति-सूची (उदाहरण के लिए `172.21.0.1/32`) के साथ कंटेनर-किनारे के CDP प्रवेश को सीमित करता है।
- noVNC प्रेक्षक पहुँच डिफ़ॉल्ट रूप से पासवर्ड-संरक्षित होती है; OpenClaw एक अल्पकालिक टोकन URL जारी करता है, जो एक स्थानीय बूटस्ट्रैप पृष्ठ प्रस्तुत करता है और URL फ़्रैगमेंट में पासवर्ड के साथ noVNC खोलता है (क्वेरी स्ट्रिंग या हेडर लॉग में नहीं)।
- `agents.defaults.sandbox.browser.allowHostControl` (डिफ़ॉल्ट `false`) सैंडबॉक्स किए गए सत्रों को स्पष्ट रूप से होस्ट ब्राउज़र लक्षित करने देता है।
- वैकल्पिक अनुमति-सूचियाँ `target: "custom"` को नियंत्रित करती हैं: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`।

## SSH बैकएंड

किसी भी SSH-सुलभ मशीन पर `exec`, फ़ाइल टूल और मीडिया पठन को सैंडबॉक्स करने के लिए `backend: "ssh"` का उपयोग करें।

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // या स्थानीय फ़ाइलों के बजाय SecretRefs / इनलाइन सामग्री का उपयोग करें:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

डिफ़ॉल्ट: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`।

- **जीवनचक्र**: OpenClaw `sandbox.ssh.workspaceRoot` के अंतर्गत प्रति-दायरा रिमोट रूट बनाता है। बनाने या दोबारा बनाने के बाद पहले उपयोग पर, यह स्थानीय वर्कस्पेस से उस रिमोट वर्कस्पेस को एक बार सीड करता है। इसके बाद, `exec`, `read`, `write`, `edit`, `apply_patch`, प्रॉम्प्ट मीडिया पठन और आने वाले मीडिया की स्टेजिंग SSH पर सीधे रिमोट वर्कस्पेस के विरुद्ध चलती है। OpenClaw रिमोट परिवर्तनों को स्थानीय वर्कस्पेस में स्वतः सिंक नहीं करता।
- **प्रमाणीकरण सामग्री**: `identityFile`/`certificateFile`/`knownHostsFile` मौजूदा स्थानीय फ़ाइलों को संदर्भित करते हैं। `identityData`/`certificateData`/`knownHostsData` इनलाइन स्ट्रिंग या SecretRefs स्वीकार करते हैं, जिन्हें सामान्य सीक्रेट रनटाइम स्नैपशॉट के माध्यम से रिज़ॉल्व किया जाता है, `0600` मोड वाली अस्थायी फ़ाइलों में लिखा जाता है और SSH सत्र समाप्त होने पर हटा दिया जाता है। यदि एक ही आइटम के लिए `*File` और `*Data` दोनों प्रकार सेट हैं, तो उस सत्र के लिए `*Data` प्रभावी होता है।
- **रिमोट-कैनोनिकल के परिणाम**: प्रारंभिक सीड के बाद रिमोट SSH वर्कस्पेस वास्तविक सैंडबॉक्स स्थिति बन जाता है। सीड चरण के बाद OpenClaw के बाहर किए गए होस्ट-स्थानीय संपादन तब तक रिमोट पर दिखाई नहीं देते, जब तक आप सैंडबॉक्स को दोबारा न बनाएँ। `openclaw sandbox recreate` प्रति-दायरा रिमोट रूट को हटा देता है और अगले उपयोग पर स्थानीय स्रोत से फिर सीड करता है। इस बैकएंड पर ब्राउज़र सैंडबॉक्सिंग समर्थित नहीं है और `sandbox.docker.*` सेटिंग इस पर लागू नहीं होतीं।

## OpenShell बैकएंड

OpenShell द्वारा प्रबंधित रिमोट परिवेश में टूल को सैंडबॉक्स करने के लिए `backend: "openshell"` का उपयोग करें। OpenShell सामान्य SSH बैकएंड वाले उसी SSH ट्रांसपोर्ट और रिमोट फ़ाइल सिस्टम ब्रिज का पुनः उपयोग करता है और इसमें OpenShell जीवनचक्र (`sandbox create/get/delete/ssh-config`) के साथ वैकल्पिक `mirror` वर्कस्पेस सिंक मोड जोड़ता है।

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // मिरर | रिमोट
        },
      },
    },
  },
}
```

`mode: "mirror"` (डिफ़ॉल्ट) स्थानीय वर्कस्पेस को कैनोनिकल रखता है: OpenClaw `exec` से पहले स्थानीय सामग्री को सैंडबॉक्स में सिंक करता है और उसके बाद वापस सिंक करता है। `mode: "remote"` रिमोट वर्कस्पेस को स्थानीय सामग्री से एक बार सीड करता है, फिर वापस सिंक किए बिना `exec`/`read`/`write`/`edit`/`apply_patch` को सीधे रिमोट वर्कस्पेस पर चलाता है; सीड के बाद किए गए स्थानीय संपादन तब तक दिखाई नहीं देते, जब तक आप `openclaw sandbox recreate` नहीं करते। `scope: "agent"` या `scope: "shared"` के अंतर्गत, वह रिमोट वर्कस्पेस उसी दायरे में साझा किया जाता है। वर्तमान सीमाएँ: सैंडबॉक्स ब्राउज़र अभी समर्थित नहीं है, और `sandbox.docker.binds` इस बैकएंड पर लागू नहीं होता।

`openclaw sandbox list`/`recreate`/प्रून सभी OpenShell रनटाइम को Docker रनटाइम के समान मानते हैं; प्रून लॉजिक बैकएंड-सचेत है।

सभी पूर्वापेक्षाओं, कॉन्फ़िगरेशन संदर्भ, वर्कस्पेस-मोड तुलना और लाइफ़साइकल विवरणों के लिए, [OpenShell](/hi/gateway/openshell) देखें।

## वर्कस्पेस एक्सेस

`agents.defaults.sandbox.workspaceAccess` नियंत्रित करता है कि सैंडबॉक्स क्या देख सकता है:

| मान            | व्यवहार                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (डिफ़ॉल्ट) | टूल `~/.openclaw/sandboxes` के अंतर्गत एक पृथक सैंडबॉक्स वर्कस्पेस देखते हैं।                    |
| `ro`             | एजेंट वर्कस्पेस को `/agent` पर केवल-पढ़ने योग्य रूप में माउंट करता है (`write`/`edit`/`apply_patch` को अक्षम करता है)। |
| `rw`             | एजेंट वर्कस्पेस को `/workspace` पर पढ़ने/लिखने योग्य रूप में माउंट करता है।                                    |

OpenShell बैकएंड के साथ, `mirror` मोड अब भी exec टर्न के बीच स्थानीय वर्कस्पेस को कैनोनिकल स्रोत के रूप में उपयोग करता है, `remote` मोड प्रारंभिक सीड के बाद रिमोट OpenShell वर्कस्पेस को कैनोनिकल के रूप में उपयोग करता है, और `workspaceAccess: "ro"`/`"none"` अब भी लिखने के व्यवहार को उसी तरह प्रतिबंधित करते हैं।

इनबाउंड मीडिया को सक्रिय सैंडबॉक्स वर्कस्पेस (`media/inbound/*`) में कॉपी किया जाता है।

<Note>
**Skills**: `read` टूल सैंडबॉक्स-रूटेड है। `workspaceAccess: "none"` के साथ, OpenClaw योग्य Skills को सैंडबॉक्स वर्कस्पेस (`.../skills`) में मिरर करता है ताकि उन्हें पढ़ा जा सके। `"rw"` के साथ, वर्कस्पेस Skills को `/workspace/skills` से पढ़ा जा सकता है, और योग्य प्रबंधित, बंडल किए गए या Plugin Skills को जनरेट किए गए केवल-पढ़ने योग्य पथ `/workspace/.openclaw/sandbox-skills/skills` में मूर्त रूप दिया जाता है।
</Note>

## एक एजेंट के लिए अनेक फ़ोल्डर

जब किसी सैंडबॉक्स किए गए एजेंट को उसके प्राथमिक वर्कस्पेस से अधिक फ़ोल्डरों की आवश्यकता हो, तो Docker बाइंड माउंट का उपयोग करें। प्रत्येक प्रविष्टि किसी होस्ट फ़ोल्डर को स्पष्ट एक्सेस मोड के साथ कंटेनर पथ पर मैप करती है:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` माउंट किए गए फ़ोल्डर को सैंडबॉक्स के भीतर केवल-पढ़ने योग्य बनाता है।
- `rw` सैंडबॉक्स किए गए टूल और प्रक्रियाओं को होस्ट फ़ोल्डर बदलने देता है।
- कंटेनर पथ वह पथ है जिसका एजेंट उपयोग करता है। होस्ट पथ स्वचालित रूप से उजागर नहीं किए जाते।

यह उदाहरण `research` एजेंट को लिखने योग्य प्राथमिक वर्कस्पेस, `/reference` पर केवल-पढ़ने योग्य संदर्भ सामग्री और `/drafts` पर एक अलग लिखने योग्य आउटपुट फ़ोल्डर देता है:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // आवश्यक है क्योंकि ये स्रोत एजेंट वर्कस्पेस से बाहर हैं।
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` और बाइंड मोड एक-दूसरे से स्वतंत्र हैं:

| सेटिंग                          | नियंत्रण                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | एक पृथक सैंडबॉक्स वर्कस्पेस का उपयोग करता है; एजेंट वर्कस्पेस को उजागर नहीं करता।    |
| `workspaceAccess: "ro"`          | एजेंट वर्कस्पेस को `/agent` पर केवल-पढ़ने योग्य रूप में माउंट करता है।                           |
| `workspaceAccess: "rw"`          | एजेंट वर्कस्पेस को `/workspace` पर पढ़ने/लिखने योग्य रूप में माउंट करता है।                      |
| `docker.binds` प्रविष्टि `:ro`/`:rw` | केवल उस अतिरिक्त होस्ट फ़ोल्डर को उसके कॉन्फ़िगर किए गए कंटेनर पथ पर नियंत्रित करती है। |

`workspaceAccess` बदलने से कोई अतिरिक्त बाइंड `ro` से `rw` में, या इसके विपरीत, नहीं बदलता। वैश्विक और प्रति-एजेंट `docker.binds` मर्ज किए जाते हैं। प्रति-एजेंट बाइंड के लिए `scope: "agent"` या `"session"` रखें; `scope: "shared"` सभी प्रति-एजेंट Docker ओवरराइड को अनदेखा करता है और केवल वैश्विक बाइंड का उपयोग करता है।

बाइंड माउंट समर्थित बहु-फ़ोल्डर सीमा हैं क्योंकि Docker माउंट पृथक्करण के साथ कंटेनर का फ़ाइलसिस्टम दृश्य बनाता है, और `ro`/`rw` मोड सैंडबॉक्स की प्रत्येक प्रक्रिया पर लागू होता है। यह सीमा प्रत्येक OpenClaw कोड पथ में पथ-प्राधिकरण जाँचों को दोहराए बिना `exec`, फ़ाइलसिस्टम टूल, चाइल्ड प्रक्रियाओं और लाइब्रेरी को कवर करती है। जब कोई अनुमत शेल या निर्भरता फ़ाइलों को सीधे एक्सेस कर सकती हो, तब होस्ट-साइड पथ अनुमति-सूची समान पूर्ण सीमा प्रदान नहीं कर सकती।

ऑप्ट-इन `dangerouslyAllowExternalBindSources` केवल वर्कस्पेस रूट के बाहर के स्रोतों को अनुमति देता है। यह OpenClaw की अवरुद्ध सिस्टम, क्रेडेंशियल, Docker सॉकेट, सिमलिंक-पैरेंट या आरक्षित-लक्ष्य जाँचों को अक्षम नहीं करता। सबसे छोटा फ़ोल्डर चुनें, जब तक लिखना आवश्यक न हो `ro` का उपयोग करें, और माउंट बदलने के बाद सैंडबॉक्स को फिर से बनाएँ:

```bash
openclaw sandbox recreate --agent research
```

### बाइंड का अन्य व्यवहार

`agents.defaults.sandbox.docker.binds` वैश्विक माउंट कॉन्फ़िगर करता है। प्रारूप वही `host:container:mode` रूप है (उदाहरण के लिए, `"/home/user/source:/source:rw"`)।

`agents.defaults.sandbox.browser.binds` अतिरिक्त होस्ट डायरेक्टरी को केवल **सैंडबॉक्स ब्राउज़र** कंटेनर में माउंट करता है। सेट होने पर (`[]` सहित), यह ब्राउज़र कंटेनर के लिए `docker.binds` को प्रतिस्थापित करता है; छोड़े जाने पर, ब्राउज़र कंटेनर `docker.binds` पर वापस जाता है।

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**बाइंड सुरक्षा**

- बाइंड सैंडबॉक्स फ़ाइलसिस्टम को बायपास करते हैं: वे आपके सेट किए गए मोड (`:ro` या `:rw`) के अनुसार होस्ट पथ उजागर करते हैं।
- OpenClaw डिफ़ॉल्ट रूप से खतरनाक बाइंड स्रोतों को अवरुद्ध करता है: सिस्टम पथ (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker सॉकेट डायरेक्टरी (`/run`, `/var/run` और उनके `docker.sock` प्रकार), और सामान्य होम-डायरेक्टरी क्रेडेंशियल रूट (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`)।
- सत्यापन स्रोत पथ को सामान्यीकृत करता है, फिर अवरुद्ध पथों और अनुमत रूटों की दोबारा जाँच करने से पहले उसे सबसे गहरे मौजूदा पूर्वज के माध्यम से फिर से हल करता है, इसलिए अंतिम लीफ़ के अभी मौजूद न होने पर भी सिमलिंक-पैरेंट एस्केप फ़ेल-क्लोज़ होते हैं (उदाहरण के लिए, यदि `run-link` वहाँ इंगित करता है, तो `/workspace/run-link/new-file` अब भी `/var/run/...` के रूप में हल होता है)।
- आरक्षित कंटेनर माउंट बिंदुओं (`/workspace`, `/agent`) को छिपाने वाले बाइंड लक्ष्य भी डिफ़ॉल्ट रूप से अवरुद्ध होते हैं; `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` से ओवरराइड करें।
- वर्कस्पेस/एजेंट-वर्कस्पेस की अनुमति-सूची वाले रूटों से बाहर के बाइंड स्रोत डिफ़ॉल्ट रूप से अवरुद्ध होते हैं; `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` से ओवरराइड करें। अनुमत रूट भी उसी प्रकार कैनोनिकलाइज़ किए जाते हैं, इसलिए जो पथ सिमलिंक रिज़ॉल्यूशन से पहले केवल अनुमति-सूची के भीतर दिखाई देता है, उसे भी अनुमत रूटों से बाहर होने के कारण अस्वीकार किया जाता है।
- संवेदनशील माउंट (सीक्रेट, SSH कुंजियाँ, सेवा क्रेडेंशियल) जब तक बिल्कुल आवश्यक न हों, `:ro` होने चाहिए।
- यदि आपको वर्कस्पेस तक केवल पढ़ने की पहुँच चाहिए, तो `workspaceAccess: "ro"` के साथ संयोजित करें; बाइंड मोड स्वतंत्र रहते हैं।
- बाइंड टूल नीति और उन्नत exec के साथ कैसे इंटरैक्ट करते हैं, इसके लिए [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें।

</Warning>

## इमेज और सेटअप

डिफ़ॉल्ट Docker इमेज: `openclaw-sandbox:bookworm-slim`

<Note>
**स्रोत चेकआउट बनाम npm इंस्टॉल**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` और `scripts/sandbox-browser-setup.sh` सहायक स्क्रिप्ट केवल [स्रोत चेकआउट](https://github.com/openclaw/openclaw) से चलाते समय उपलब्ध होती हैं। वे npm पैकेज में शामिल नहीं हैं।

यदि आपने `npm install -g openclaw` के माध्यम से OpenClaw इंस्टॉल किया है, तो इसके बजाय नीचे दिखाई गई इनलाइन `docker build` कमांड का उपयोग करें।
</Note>

<Steps>
  <Step title="डिफ़ॉल्ट इमेज बनाएँ">
    स्रोत चेकआउट से:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm इंस्टॉल से (स्रोत चेकआउट आवश्यक नहीं):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    डिफ़ॉल्ट इमेज में Node शामिल **नहीं** है। यदि किसी Skill को Node (या अन्य रनटाइम) की आवश्यकता है, तो या तो कस्टम इमेज में उसे शामिल करें या `sandbox.docker.setupCommand` के माध्यम से इंस्टॉल करें (नेटवर्क एग्रेस + लिखने योग्य रूट + रूट उपयोगकर्ता आवश्यक)।

    `openclaw-sandbox:bookworm-slim` न होने पर OpenClaw चुपचाप साधारण `debian:bookworm-slim` को प्रतिस्थापित नहीं करता। डिफ़ॉल्ट इमेज को लक्षित करने वाले सैंडबॉक्स रन, आपके द्वारा उसे बनाए जाने तक बिल्ड निर्देश के साथ तुरंत विफल होते हैं, क्योंकि बंडल की गई इमेज सैंडबॉक्स लिखने/संपादित करने वाले सहायकों के लिए `python3` रखती है।

  </Step>
  <Step title="वैकल्पिक: सामान्य इमेज बनाएँ">
    सामान्य टूलिंग वाली अधिक कार्यात्मक सैंडबॉक्स इमेज के लिए (उदाहरण के लिए `curl`, `jq`, Node 24, pnpm, `python3` और `git`):

    स्रोत चेकआउट से:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm इंस्टॉल से, पहले डिफ़ॉल्ट इमेज बनाएँ (ऊपर देखें), फिर रिपॉज़िटरी के [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) का उपयोग करके उसके ऊपर सामान्य इमेज बनाएँ।

    फिर `agents.defaults.sandbox.docker.image` को `openclaw-sandbox-common:bookworm-slim` पर सेट करें।

  </Step>
  <Step title="वैकल्पिक: सैंडबॉक्स ब्राउज़र इमेज बनाएँ">
    स्रोत चेकआउट से:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm इंस्टॉल से, रिपॉज़िटरी के [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) का उपयोग करके बनाएँ।

  </Step>
</Steps>

डिफ़ॉल्ट रूप से, Docker सैंडबॉक्स कंटेनर **बिना नेटवर्क** के चलते हैं। `agents.defaults.sandbox.docker.network` से ओवरराइड करें।

<AccordionGroup>
  <Accordion title="सैंडबॉक्स ब्राउज़र Chromium डिफ़ॉल्ट">
    बंडल की गई सैंडबॉक्स ब्राउज़र इमेज कंटेनरीकृत वर्कलोड के लिए सावधानीपूर्ण Chromium स्टार्टअप फ़्लैग लागू करती है:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new`, जब `browser.headless` सक्षम हो।
    - `--no-sandbox --disable-setuid-sandbox`, जब `browser.noSandbox` सक्षम हो।
    - डिफ़ॉल्ट रूप से `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`; ये ग्राफ़िक्स-सुदृढ़ीकरण फ़्लैग GPU समर्थन के बिना कंटेनरों में सहायक होते हैं। यदि आपके कार्यभार को WebGL या अन्य 3D सुविधाओं की आवश्यकता है, तो `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` सेट करें।
    - डिफ़ॉल्ट रूप से `--disable-extensions`; एक्सटेंशन पर निर्भर प्रवाहों के लिए `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` सेट करें।
    - डिफ़ॉल्ट रूप से `--renderer-process-limit=2`; इसे `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` नियंत्रित करता है, जहाँ `0` Chromium का डिफ़ॉल्ट बनाए रखता है।

    यदि आपको किसी भिन्न रनटाइम प्रोफ़ाइल की आवश्यकता है, तो कस्टम ब्राउज़र इमेज का उपयोग करें और अपना एंट्रीपॉइंट प्रदान करें। स्थानीय (गैर-कंटेनर) Chromium प्रोफ़ाइलों के लिए अतिरिक्त स्टार्टअप फ़्लैग जोड़ने हेतु `browser.extraArgs` का उपयोग करें।

  </Accordion>
  <Accordion title="नेटवर्क सुरक्षा के डिफ़ॉल्ट">
    - `network: "host"` अवरुद्ध है।
    - `network: "container:<id>"` डिफ़ॉल्ट रूप से अवरुद्ध है (नेमस्पेस जॉइन बायपास का जोखिम)।
    - आपातकालीन ओवरराइड: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`।

  </Accordion>
</AccordionGroup>

Docker इंस्टॉलेशन और कंटेनरीकृत Gateway यहाँ उपलब्ध हैं: [Docker](/hi/install/docker)

Docker Gateway डिप्लॉयमेंट के लिए, `scripts/docker/setup.sh` सैंडबॉक्स कॉन्फ़िगरेशन को बूटस्ट्रैप कर सकता है। इस पथ को सक्षम करने के लिए `OPENCLAW_SANDBOX=1` (या `true`/`yes`/`on`) सेट करें। सॉकेट स्थान को `OPENCLAW_DOCKER_SOCKET` से ओवरराइड करें। संपूर्ण सेटअप और एनवायरनमेंट संदर्भ: [Docker](/hi/install/docker#agent-sandbox)।

## setupCommand (एक बार का कंटेनर सेटअप)

सैंडबॉक्स कंटेनर बनने के बाद `setupCommand` **एक बार** चलता है (प्रत्येक रन पर नहीं)। यह कंटेनर के भीतर `sh -lc` के माध्यम से निष्पादित होता है।

पथ:

- वैश्विक: `agents.defaults.sandbox.docker.setupCommand`
- प्रति-एजेंट: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="सामान्य समस्याएँ">
    - डिफ़ॉल्ट `docker.network`, `"none"` है (कोई आउटबाउंड पहुँच नहीं), इसलिए पैकेज इंस्टॉलेशन विफल होंगे।
    - `docker.network: "container:<id>"` के लिए `dangerouslyAllowContainerNamespaceJoin: true` आवश्यक है और यह केवल आपातकालीन उपयोग के लिए है।
    - `readOnlyRoot: true` लिखने से रोकता है; `readOnlyRoot: false` सेट करें या कस्टम इमेज बनाएँ।
    - पैकेज इंस्टॉलेशन के लिए `user` का root होना आवश्यक है (`user` को छोड़ दें या `user: "0:0"` सेट करें)।
    - सैंडबॉक्स निष्पादन होस्ट के `process.env` को इनहेरिट **नहीं** करता। Skill API कुंजियों के लिए `agents.defaults.sandbox.docker.env` (या कस्टम इमेज) का उपयोग करें।
    - `agents.defaults.sandbox.docker.env` के मान स्पष्ट Docker कंटेनर एनवायरनमेंट वेरिएबल के रूप में भेजे जाते हैं। Docker डेमन तक पहुँच रखने वाला कोई भी व्यक्ति `docker inspect` जैसे Docker मेटाडेटा कमांड से उनका निरीक्षण कर सकता है। यदि मेटाडेटा में इस प्रकार का प्रकटीकरण स्वीकार्य नहीं है, तो कस्टम इमेज, माउंट की गई सीक्रेट फ़ाइल या सीक्रेट पहुँचाने के किसी अन्य पथ का उपयोग करें।

  </Accordion>
</AccordionGroup>

## टूल नीति और वैकल्पिक निकास मार्ग

टूल की अनुमति/अस्वीकृति नीतियाँ सैंडबॉक्स नियमों से पहले भी लागू होती हैं। यदि कोई टूल वैश्विक रूप से या प्रति-एजेंट अस्वीकृत है, तो सैंडबॉक्सिंग उसे वापस उपलब्ध नहीं कराती।

`tools.elevated` एक स्पष्ट वैकल्पिक निकास मार्ग है, जो `exec` को सैंडबॉक्स के बाहर चलाता है (डिफ़ॉल्ट रूप से `gateway`, या जब निष्पादन लक्ष्य `node` हो तब `node`)। `/exec` निर्देश केवल अधिकृत प्रेषकों पर लागू होते हैं और प्रति सत्र बने रहते हैं; `exec` को पूर्णतः अक्षम करने के लिए टूल नीति में अस्वीकृति का उपयोग करें ([सैंडबॉक्स बनाम टूल नीति बनाम एलिवेटेड](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें)।

डीबगिंग:

- `openclaw sandbox list` सैंडबॉक्स कंटेनर, स्थिति, इमेज मिलान, आयु, निष्क्रिय समय और संबद्ध सत्र/एजेंट दिखाता है।
- `openclaw sandbox explain [--session <key>] [--agent <id>]` प्रभावी सैंडबॉक्स मोड, होस्ट वर्कस्पेस, रनटाइम कार्य निर्देशिका, Docker माउंट, टूल नीति और सुधार हेतु कॉन्फ़िगरेशन कुंजियों का निरीक्षण करता है। इसका `workspaceRoot` फ़ील्ड कॉन्फ़िगर किया गया सैंडबॉक्स रूट ही रहता है; `effectiveHostWorkspaceRoot` दिखाता है कि सक्रिय वर्कस्पेस वास्तव में कहाँ स्थित है।
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` कंटेनर/एनवायरनमेंट हटाता है, ताकि अगली बार उपयोग करने पर वे वर्तमान कॉन्फ़िगरेशन के साथ फिर से बनाए जाएँ।
- “यह क्यों अवरुद्ध है?” समझने के मानसिक मॉडल के लिए [सैंडबॉक्स बनाम टूल नीति बनाम एलिवेटेड](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें।

## मल्टी-एजेंट ओवरराइड

प्रत्येक एजेंट सैंडबॉक्स और टूल को ओवरराइड कर सकता है: `agents.list[].sandbox` और `agents.list[].tools` (साथ ही सैंडबॉक्स टूल नीति के लिए `agents.list[].tools.sandbox.tools`)। प्राथमिकता क्रम के लिए [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) देखें।

## न्यूनतम सक्षमीकरण उदाहरण

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## संबंधित

- [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) -- प्रति-एजेंट ओवरराइड और प्राथमिकता क्रम
- [OpenShell](/hi/gateway/openshell) -- प्रबंधित सैंडबॉक्स बैकएंड सेटअप, वर्कस्पेस मोड और कॉन्फ़िगरेशन संदर्भ
- [सैंडबॉक्स कॉन्फ़िगरेशन](/hi/gateway/config-agents#agentsdefaultssandbox)
- [सैंडबॉक्स बनाम टूल नीति बनाम एलिवेटेड](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) -- “यह क्यों अवरुद्ध है?” की डीबगिंग
- [सुरक्षा](/hi/gateway/security)
