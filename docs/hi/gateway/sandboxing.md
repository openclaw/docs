---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw सैंडबॉक्सिंग कैसे काम करती है: मोड, स्कोप, workspace एक्सेस, और इमेजेज'
title: सैंडबॉक्सिंग
x-i18n:
    generated_at: "2026-06-28T23:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw प्रभाव-क्षेत्र घटाने के लिए **सैंडबॉक्स बैकएंड के अंदर टूल** चला सकता है। यह **वैकल्पिक** है और कॉन्फ़िगरेशन (`agents.defaults.sandbox` या `agents.list[].sandbox`) से नियंत्रित होता है। यदि सैंडबॉक्सिंग बंद है, तो टूल होस्ट पर चलते हैं। Gateway होस्ट पर रहता है; सक्षम होने पर टूल निष्पादन एक अलग-थलग सैंडबॉक्स में चलता है।

<Note>
यह कोई पूर्ण सुरक्षा सीमा नहीं है, लेकिन जब मॉडल कोई गलत काम करता है तो यह फ़ाइल सिस्टम और प्रक्रिया पहुंच को स्पष्ट रूप से सीमित करता है।
</Note>

## क्या सैंडबॉक्स किया जाता है

- टूल निष्पादन (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, आदि)।
- वैकल्पिक सैंडबॉक्स किया गया ब्राउज़र (`agents.defaults.sandbox.browser`)।

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - डिफ़ॉल्ट रूप से, जब ब्राउज़र टूल को इसकी ज़रूरत होती है, तो सैंडबॉक्स ब्राउज़र अपने आप शुरू होता है (यह सुनिश्चित करता है कि CDP पहुंच योग्य है)। `agents.defaults.sandbox.browser.autoStart` और `agents.defaults.sandbox.browser.autoStartTimeoutMs` से कॉन्फ़िगर करें।
    - डिफ़ॉल्ट रूप से, सैंडबॉक्स ब्राउज़र कंटेनर वैश्विक `bridge` नेटवर्क के बजाय एक समर्पित Docker नेटवर्क (`openclaw-sandbox-browser`) का उपयोग करते हैं। `agents.defaults.sandbox.browser.network` से कॉन्फ़िगर करें।
    - वैकल्पिक `agents.defaults.sandbox.browser.cdpSourceRange` कंटेनर-एज CDP इनग्रेस को CIDR allowlist (उदाहरण के लिए `172.21.0.1/32`) से सीमित करता है।
    - noVNC ऑब्ज़र्वर पहुंच डिफ़ॉल्ट रूप से पासवर्ड-सुरक्षित होती है; OpenClaw एक अल्पकालिक टोकन URL जारी करता है, जो एक स्थानीय bootstrap पेज परोसता है और URL fragment में पासवर्ड के साथ noVNC खोलता है (query/header logs में नहीं)।
    - `agents.defaults.sandbox.browser.allowHostControl` सैंडबॉक्स किए गए सेशन को होस्ट ब्राउज़र को स्पष्ट रूप से लक्ष्य बनाने देता है।
    - वैकल्पिक allowlists `target: "custom"` को नियंत्रित करती हैं: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`।

  </Accordion>
</AccordionGroup>

सैंडबॉक्स नहीं किया गया:

- Gateway प्रक्रिया स्वयं।
- कोई भी टूल जिसे सैंडबॉक्स के बाहर चलने की स्पष्ट अनुमति है (जैसे `tools.elevated`)।
  - **Elevated exec सैंडबॉक्सिंग को बायपास करता है और कॉन्फ़िगर किए गए escape path का उपयोग करता है (डिफ़ॉल्ट रूप से `gateway`, या जब exec लक्ष्य `node` हो तो `node`)।**
  - यदि सैंडबॉक्सिंग बंद है, तो `tools.elevated` निष्पादन नहीं बदलता (पहले से ही होस्ट पर है)। [Elevated Mode](/hi/tools/elevated) देखें।

## मोड

`agents.defaults.sandbox.mode` यह नियंत्रित करता है कि सैंडबॉक्सिंग **कब** उपयोग की जाती है:

<Tabs>
  <Tab title="off">
    कोई सैंडबॉक्सिंग नहीं।
  </Tab>
  <Tab title="non-main">
    केवल **non-main** सेशन को सैंडबॉक्स करें (यदि आप सामान्य चैट होस्ट पर चाहते हैं तो डिफ़ॉल्ट)।

    `"non-main"` `session.mainKey` (डिफ़ॉल्ट `"main"`) पर आधारित है, एजेंट id पर नहीं। ग्रुप/चैनल सेशन अपनी कुंजियों का उपयोग करते हैं, इसलिए वे non-main माने जाते हैं और सैंडबॉक्स किए जाएंगे।

  </Tab>
  <Tab title="all">
    हर सेशन सैंडबॉक्स में चलता है।
  </Tab>
</Tabs>

## दायरा

`agents.defaults.sandbox.scope` यह नियंत्रित करता है कि **कितने कंटेनर** बनाए जाते हैं:

- `"agent"` (डिफ़ॉल्ट): प्रति एजेंट एक कंटेनर।
- `"session"`: प्रति सेशन एक कंटेनर।
- `"shared"`: सभी सैंडबॉक्स किए गए सेशन द्वारा साझा किया गया एक कंटेनर।

## बैकएंड

`agents.defaults.sandbox.backend` यह नियंत्रित करता है कि **कौन सा runtime** सैंडबॉक्स प्रदान करता है:

- `"docker"` (सैंडबॉक्सिंग सक्षम होने पर डिफ़ॉल्ट): स्थानीय Docker-backed सैंडबॉक्स runtime।
- `"ssh"`: generic SSH-backed remote sandbox runtime।
- `"openshell"`: OpenShell-backed sandbox runtime।

SSH-विशिष्ट कॉन्फ़िगरेशन `agents.defaults.sandbox.ssh` के अंतर्गत रहता है। OpenShell-विशिष्ट कॉन्फ़िगरेशन `plugins.entries.openshell.config` के अंतर्गत रहता है।

### बैकएंड चुनना

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **कहां चलता है**   | स्थानीय कंटेनर                  | कोई भी SSH-पहुंच योग्य होस्ट        | OpenShell managed sandbox                           |
| **सेटअप**           | `scripts/sandbox-setup.sh`       | SSH key + target host          | OpenShell plugin enabled                            |
| **Workspace model** | Bind-mount या copy               | Remote-canonical (seed once)   | `mirror` या `remote`                                |
| **नेटवर्क नियंत्रण** | `docker.network` (डिफ़ॉल्ट: none) | remote host पर निर्भर         | OpenShell पर निर्भर                                |
| **ब्राउज़र सैंडबॉक्स** | समर्थित                        | समर्थित नहीं                  | अभी समर्थित नहीं                                   |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **इसके लिए सर्वोत्तम** | Local dev, full isolation        | remote machine पर offloading | वैकल्पिक two-way sync के साथ managed remote sandboxes |

### Docker बैकएंड

सैंडबॉक्सिंग डिफ़ॉल्ट रूप से बंद होती है। यदि आप सैंडबॉक्सिंग सक्षम करते हैं और कोई बैकएंड नहीं चुनते, तो OpenClaw Docker बैकएंड का उपयोग करता है। यह Docker daemon socket (`/var/run/docker.sock`) के माध्यम से स्थानीय रूप से टूल और सैंडबॉक्स ब्राउज़र चलाता है। सैंडबॉक्स कंटेनर isolation Docker namespaces द्वारा निर्धारित होता है।

होस्ट GPU को Docker सैंडबॉक्स के सामने लाने के लिए, `agents.defaults.sandbox.docker.gpus` या per-agent `agents.list[].sandbox.docker.gpus` override सेट करें। मान Docker के `--gpus` flag को अलग argument के रूप में दिया जाता है, उदाहरण के लिए `"all"` या `"device=GPU-uuid"`, और इसके लिए NVIDIA Container Toolkit जैसे compatible host runtime की आवश्यकता होती है।

<Warning>
**Docker-out-of-Docker (DooD) सीमाएं**

यदि आप OpenClaw Gateway को स्वयं Docker कंटेनर के रूप में deploy करते हैं, तो यह होस्ट के Docker socket (DooD) का उपयोग करके sibling sandbox containers orchestrate करता है। इससे एक विशिष्ट path mapping constraint आता है:

- **Config को host paths चाहिए**: `openclaw.json` `workspace` configuration में **Host's absolute path** (जैसे `/home/user/.openclaw/workspaces`) होना चाहिए, internal Gateway container path नहीं। जब OpenClaw Docker daemon से sandbox spawn करने को कहता है, तो daemon paths को Gateway namespace नहीं, बल्कि Host OS namespace के सापेक्ष evaluate करता है।
- **FS bridge parity (identical volume map)**: OpenClaw Gateway native process भी `workspace` directory में heartbeat और bridge files लिखता है। क्योंकि Gateway अपने containerized environment के भीतर से वही exact string (host path) evaluate करता है, Gateway deployment में host namespace को natively link करने वाला identical volume map शामिल होना चाहिए (`-v /home/user/.openclaw:/home/user/.openclaw`)।
- **Codex code mode**: जब OpenClaw sandbox सक्रिय होता है, तो OpenClaw उस turn के लिए Codex app-server native Code Mode, user MCP servers, और app-backed plugin execution को disable कर देता है, क्योंकि ये native surfaces OpenClaw sandbox backend के बजाय Gateway-host app-server process से चलते हैं। जब normal exec/process tools उपलब्ध हों, तो shell access OpenClaw sandbox-backed tools जैसे `sandbox_exec` और `sandbox_process` के माध्यम से exposed होता है। agent sandbox containers या custom Codex sandboxes में host Docker socket mount न करें।

Ubuntu/AppArmor hosts पर, Codex `workspace-write` shell startup से पहले fail हो सकता है
जब आप जानबूझकर active OpenClaw sandboxing के बिना native Codex `workspace-write`
चलाते हैं और service user को unprivileged user namespaces बनाने की अनुमति नहीं है।
जब Docker sandbox egress disabled हो (`network: "none"`, डिफ़ॉल्ट), तो
Codex को unprivileged network namespace भी चाहिए। सामान्य symptoms हैं
`bwrap: setting up uid map: Permission denied` और
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`। चलाएं
`openclaw doctor`; यदि यह Codex bwrap namespace probe failure रिपोर्ट करता है, तो OpenClaw service
process को आवश्यक namespaces देने वाली AppArmor profile को प्राथमिकता दें।
`kernel.apparmor_restrict_unprivileged_userns=0` host-wide
fallback है जिसमें security tradeoffs हैं; इसे केवल तभी उपयोग करें जब वह host posture
स्वीकार्य हो।

यदि आप absolute host parity के बिना paths को internally map करते हैं, तो OpenClaw container environment के भीतर अपना heartbeat लिखने का प्रयास करते समय natively `EACCES` permission error फेंकता है, क्योंकि fully qualified path string natively मौजूद नहीं होती।
</Warning>

### SSH बैकएंड

`backend: "ssh"` का उपयोग तब करें जब आप चाहते हैं कि OpenClaw `exec`, file tools, और media reads को किसी arbitrary SSH-accessible machine पर sandbox करे।

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How it works">
    - OpenClaw `sandbox.ssh.workspaceRoot` के अंतर्गत per-scope remote root बनाता है।
    - create या recreate के बाद पहले उपयोग पर, OpenClaw उस remote workspace को local workspace से एक बार seed करता है।
    - उसके बाद, `exec`, `read`, `write`, `edit`, `apply_patch`, prompt media reads, और inbound media staging सीधे SSH के माध्यम से remote workspace के विरुद्ध चलते हैं।
    - OpenClaw remote changes को local workspace में automatically sync नहीं करता।

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: मौजूदा local files का उपयोग करें और उन्हें OpenSSH config के माध्यम से pass करें।
    - `identityData`, `certificateData`, `knownHostsData`: inline strings या SecretRefs का उपयोग करें। OpenClaw उन्हें normal secrets runtime snapshot के माध्यम से resolve करता है, `0600` के साथ temp files में लिखता है, और SSH session समाप्त होने पर उन्हें delete करता है।
    - यदि एक ही item के लिए `*File` और `*Data` दोनों सेट हैं, तो उस SSH session के लिए `*Data` जीतता है।

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    यह एक **remote-canonical** model है। initial seed के बाद remote SSH workspace वास्तविक sandbox state बन जाता है।

    - seed step के बाद OpenClaw के बाहर किए गए host-local edits remotely visible नहीं होते, जब तक आप sandbox recreate नहीं करते।
    - `openclaw sandbox recreate` per-scope remote root को delete करता है और अगले उपयोग पर local से फिर seed करता है।
    - SSH backend पर browser sandboxing supported नहीं है।
    - `sandbox.docker.*` settings SSH backend पर लागू नहीं होतीं।

  </Accordion>
</AccordionGroup>

### OpenShell बैकएंड

`backend: "openshell"` का उपयोग तब करें जब आप चाहते हैं कि OpenClaw OpenShell-managed remote environment में tools को sandbox करे। पूर्ण setup guide, configuration reference, और workspace mode comparison के लिए, dedicated [OpenShell page](/hi/gateway/openshell) देखें।

OpenShell generic SSH backend की तरह वही core SSH transport और remote filesystem bridge reuse करता है, और OpenShell-specific lifecycle (`sandbox create/get/delete`, `sandbox ssh-config`) तथा वैकल्पिक `mirror` workspace mode जोड़ता है।

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell modes:

- `mirror` (डिफ़ॉल्ट): local workspace canonical रहता है। OpenClaw exec से पहले local files को OpenShell में sync करता है और exec के बाद remote workspace को वापस sync करता है।
- `remote`: sandbox बनने के बाद OpenShell workspace canonical होता है। OpenClaw remote workspace को local workspace से एक बार seed करता है, फिर file tools और exec बदलावों को वापस sync किए बिना सीधे remote sandbox के विरुद्ध चलते हैं।

<AccordionGroup>
  <Accordion title="रिमोट ट्रांसपोर्ट विवरण">
    - OpenClaw `openshell sandbox ssh-config <name>` के ज़रिए OpenShell से sandbox-विशिष्ट SSH config मांगता है।
    - Core उस SSH config को एक अस्थायी फ़ाइल में लिखता है, SSH session खोलता है, और `backend: "ssh"` द्वारा इस्तेमाल किए जाने वाले उसी remote filesystem bridge का पुनः उपयोग करता है।
    - `mirror` mode में केवल lifecycle अलग होता है: exec से पहले local को remote से sync करें, फिर exec के बाद वापस sync करें।

  </Accordion>
  <Accordion title="मौजूदा OpenShell सीमाएं">
    - sandbox browser अभी समर्थित नहीं है
    - OpenShell backend पर `sandbox.docker.binds` समर्थित नहीं है
    - `sandbox.docker.*` के अंतर्गत Docker-विशिष्ट runtime knobs अभी भी केवल Docker backend पर लागू होते हैं

  </Accordion>
</AccordionGroup>

#### Workspace modes

OpenShell के दो workspace मॉडल हैं। व्यवहार में सबसे अधिक महत्व इसी भाग का है।

<Tabs>
  <Tab title="mirror (local canonical)">
    जब आप चाहते हैं कि **local workspace canonical बना रहे**, तब `plugins.entries.openshell.config.mode: "mirror"` का उपयोग करें।

    व्यवहार:

    - `exec` से पहले, OpenClaw local workspace को OpenShell sandbox में sync करता है।
    - `exec` के बाद, OpenClaw remote workspace को वापस local workspace में sync करता है।
    - File tools अब भी sandbox bridge के माध्यम से काम करते हैं, लेकिन turns के बीच local workspace ही source of truth रहता है।

    इसका उपयोग तब करें जब:

    - आप OpenClaw के बाहर local रूप से फ़ाइलें edit करते हैं और चाहते हैं कि वे बदलाव sandbox में अपने आप दिखाई दें
    - आप चाहते हैं कि OpenShell sandbox जितना संभव हो Docker backend जैसा व्यवहार करे
    - आप चाहते हैं कि प्रत्येक exec turn के बाद host workspace sandbox writes को दर्शाए

    Tradeoff: exec से पहले और बाद में अतिरिक्त sync लागत।

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    जब आप चाहते हैं कि **OpenShell workspace canonical बन जाए**, तब `plugins.entries.openshell.config.mode: "remote"` का उपयोग करें।

    व्यवहार:

    - जब sandbox पहली बार बनाया जाता है, OpenClaw local workspace से remote workspace को एक बार seed करता है।
    - उसके बाद, `exec`, `read`, `write`, `edit`, और `apply_patch` सीधे remote OpenShell workspace पर काम करते हैं।
    - OpenClaw exec के बाद remote बदलावों को वापस local workspace में sync **नहीं** करता।
    - Prompt-time media reads फिर भी काम करते हैं, क्योंकि file और media tools local host path मानने के बजाय sandbox bridge के माध्यम से पढ़ते हैं।
    - Transport, `openshell sandbox ssh-config` द्वारा लौटाए गए OpenShell sandbox में SSH है।

    महत्वपूर्ण परिणाम:

    - यदि seed step के बाद आप OpenClaw के बाहर host पर फ़ाइलें edit करते हैं, तो remote sandbox उन बदलावों को अपने आप **नहीं** देखेगा।
    - यदि sandbox फिर से बनाया जाता है, तो remote workspace फिर से local workspace से seed होता है।
    - `scope: "agent"` या `scope: "shared"` के साथ, वह remote workspace उसी scope पर साझा किया जाता है।

    इसका उपयोग तब करें जब:

    - sandbox मुख्य रूप से remote OpenShell side पर रहना चाहिए
    - आप प्रति-turn sync overhead कम चाहते हैं
    - आप नहीं चाहते कि host-local edits चुपचाप remote sandbox state को overwrite करें

  </Tab>
</Tabs>

यदि आप sandbox को एक अस्थायी execution environment मानते हैं, तो `mirror` चुनें। यदि आप sandbox को वास्तविक workspace मानते हैं, तो `remote` चुनें।

#### OpenShell lifecycle

OpenShell sandboxes अब भी सामान्य sandbox lifecycle के माध्यम से manage होते हैं:

- `openclaw sandbox list` OpenShell runtimes के साथ-साथ Docker runtimes भी दिखाता है
- `openclaw sandbox recreate` मौजूदा runtime को delete करता है और अगले उपयोग पर OpenClaw को उसे फिर से बनाने देता है
- prune logic भी backend-aware है

`remote` mode के लिए, recreate विशेष रूप से महत्वपूर्ण है:

- recreate उस scope के लिए canonical remote workspace को delete करता है
- अगला उपयोग local workspace से एक fresh remote workspace seed करता है

`mirror` mode के लिए, recreate मुख्य रूप से remote execution environment को reset करता है, क्योंकि local workspace वैसे भी canonical रहता है।

## Workspace access

`agents.defaults.sandbox.workspaceAccess` नियंत्रित करता है कि **sandbox क्या देख सकता है**:

<Tabs>
  <Tab title="none (default)">
    Tools `~/.openclaw/sandboxes` के अंतर्गत एक sandbox workspace देखते हैं।
  </Tab>
  <Tab title="ro">
    Agent workspace को `/agent` पर read-only mount करता है (`write`/`edit`/`apply_patch` को disable करता है)।
  </Tab>
  <Tab title="rw">
    Agent workspace को `/workspace` पर read/write mount करता है।
  </Tab>
</Tabs>

OpenShell backend के साथ:

- `mirror` mode अब भी exec turns के बीच local workspace को canonical source के रूप में उपयोग करता है
- `remote` mode initial seed के बाद remote OpenShell workspace को canonical source के रूप में उपयोग करता है
- `workspaceAccess: "ro"` और `"none"` अब भी write behavior को उसी तरह restrict करते हैं

Inbound media को active sandbox workspace (`media/inbound/*`) में copy किया जाता है।

<Note>
**Skills note:** `read` tool sandbox-rooted है। `workspaceAccess: "none"` के साथ, OpenClaw eligible skills को sandbox workspace (`.../skills`) में mirror करता है ताकि उन्हें पढ़ा जा सके। `"rw"` के साथ, workspace skills `/workspace/skills` से readable होती हैं, और eligible managed, bundled, या plugin skills generated read-only path `/workspace/.openclaw/sandbox-skills/skills` में materialize की जाती हैं।
</Note>

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` अतिरिक्त host directories को container में mount करता है। Format: `host:container:mode` (जैसे, `"/home/user/source:/source:rw"`).

Global और per-agent binds **merge** किए जाते हैं (replace नहीं किए जाते)। `scope: "shared"` के अंतर्गत, per-agent binds ignore किए जाते हैं।

`agents.defaults.sandbox.browser.binds` अतिरिक्त host directories को केवल **sandbox browser** container में mount करता है।

- जब set हो (जिसमें `[]` भी शामिल है), यह browser container के लिए `agents.defaults.sandbox.docker.binds` को replace करता है।
- जब omit हो, browser container `agents.defaults.sandbox.docker.binds` पर fallback करता है (backwards compatible).

Example (read-only source + एक अतिरिक्त data directory):

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
**Bind security**

- Binds sandbox filesystem को bypass करते हैं: वे आपके set किए गए mode (`:ro` या `:rw`) के साथ host paths expose करते हैं।
- OpenClaw dangerous bind sources को block करता है (उदाहरण: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, और parent mounts जो उन्हें expose करेंगे)।
- OpenClaw आम home-directory credential roots जैसे `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, और `~/.ssh` को भी block करता है।
- Bind validation केवल string matching नहीं है। OpenClaw source path को normalize करता है, फिर blocked paths और allowed roots को फिर से check करने से पहले उसे deepest existing ancestor के माध्यम से फिर resolve करता है।
- इसका मतलब है कि symlink-parent escapes तब भी fail closed होते हैं जब final leaf अभी मौजूद नहीं है। Example: यदि `run-link` वहां point करता है, तो `/workspace/run-link/new-file` अब भी `/var/run/...` के रूप में resolve होता है।
- Allowed source roots को भी इसी तरह canonicalize किया जाता है, इसलिए कोई path जो symlink resolution से पहले ही allowlist के अंदर दिखता है, फिर भी `outside allowed roots` के रूप में reject किया जाता है।
- Sensitive mounts (secrets, SSH keys, service credentials) `:ro` होने चाहिए, जब तक कि बिल्कुल आवश्यक न हो।
- यदि आपको workspace तक केवल read access चाहिए, तो `workspaceAccess: "ro"` के साथ combine करें; bind modes स्वतंत्र रहते हैं।
- Binds tool policy और elevated exec के साथ कैसे interact करते हैं, इसके लिए [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें।

</Warning>

## Images and setup

Default Docker image: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout vs npm install**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, और `scripts/sandbox-browser-setup.sh` helper scripts केवल [source checkout](https://github.com/openclaw/openclaw) से चलाते समय उपलब्ध हैं। वे npm package में शामिल नहीं हैं।

यदि आपने OpenClaw को `npm install -g openclaw` के ज़रिए install किया है, तो इसके बजाय नीचे दिखाए गए inline `docker build` commands का उपयोग करें।
</Note>

<Steps>
  <Step title="Default image build करें">
    Source checkout से:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm install से (source checkout आवश्यक नहीं):

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

    Default image में Node शामिल **नहीं** है। यदि किसी skill को Node (या अन्य runtimes) चाहिए, तो या तो custom image bake करें या `sandbox.docker.setupCommand` के माध्यम से install करें (network egress + writable root + root user आवश्यक है)।

    जब `openclaw-sandbox:bookworm-slim` missing होता है, तो OpenClaw चुपचाप plain `debian:bookworm-slim` substitute नहीं करता। Default image को target करने वाले sandbox runs build instruction के साथ fast fail होते हैं जब तक आप इसे build नहीं करते, क्योंकि bundled image sandbox write/edit helpers के लिए `python3` लेकर आती है।

  </Step>
  <Step title="Optional: common image build करें">
    Common tooling (उदाहरण के लिए `curl`, `jq`, Node 24, pnpm, `python3`, और `git`) के साथ अधिक functional sandbox image के लिए:

    Source checkout से:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm install से, पहले default image build करें (ऊपर देखें), फिर repository से [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) का उपयोग करके उसके ऊपर common image build करें।

    फिर `agents.defaults.sandbox.docker.image` को `openclaw-sandbox-common:bookworm-slim` पर set करें।

  </Step>
  <Step title="Optional: sandbox browser image build करें">
    Source checkout से:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm install से, repository से [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) का उपयोग करके build करें।

  </Step>
</Steps>

Default रूप से, Docker sandbox containers **बिना network** के चलते हैं। `agents.defaults.sandbox.docker.network` के साथ override करें।

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Bundled sandbox browser image containerized workloads के लिए conservative Chromium startup defaults भी apply करती है। मौजूदा container defaults में शामिल हैं:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - जब `noSandbox` enabled हो, तो `--no-sandbox`।
    - तीन graphics hardening flags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) optional हैं और तब उपयोगी हैं जब containers में GPU support न हो। यदि आपके workload को WebGL या अन्य 3D/browser features चाहिए, तो `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` set करें।
    - `--disable-extensions` default रूप से enabled है और extension-reliant flows के लिए `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` से disabled किया जा सकता है।
    - `--renderer-process-limit=2` `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` द्वारा controlled है, जहां `0` Chromium का default रखता है।

    यदि आपको अलग runtime profile चाहिए, तो custom browser image का उपयोग करें और अपना entrypoint provide करें। Local (non-container) Chromium profiles के लिए, additional startup flags append करने हेतु `browser.extraArgs` का उपयोग करें।

  </Accordion>
  <Accordion title="नेटवर्क सुरक्षा डिफ़ॉल्ट">
    - `network: "host"` अवरुद्ध है।
    - `network: "container:<id>"` डिफ़ॉल्ट रूप से अवरुद्ध है (namespace join bypass जोखिम)।
    - ब्रेक-ग्लास ओवरराइड: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`।

  </Accordion>
</AccordionGroup>

Docker इंस्टॉल और containerized Gateway यहां हैं: [Docker](/hi/install/docker)

Docker Gateway deployments के लिए, `scripts/docker/setup.sh` sandbox config को bootstrap कर सकता है। उस पथ को सक्षम करने के लिए `OPENCLAW_SANDBOX=1` (या `true`/`yes`/`on`) सेट करें। आप `OPENCLAW_DOCKER_SOCKET` से socket location override कर सकते हैं। पूरा setup और env reference: [Docker](/hi/install/docker#agent-sandbox).

## setupCommand (एक-बार container setup)

`setupCommand` sandbox container बनने के बाद **एक बार** चलता है (हर run पर नहीं)। यह container के अंदर `sh -lc` के जरिए execute होता है।

Paths:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="सामान्य pitfalls">
    - डिफ़ॉल्ट `docker.network` `"none"` है (कोई egress नहीं), इसलिए package installs विफल होंगे।
    - `docker.network: "container:<id>"` के लिए `dangerouslyAllowContainerNamespaceJoin: true` जरूरी है और यह केवल break-glass के लिए है।
    - `readOnlyRoot: true` writes रोकता है; `readOnlyRoot: false` सेट करें या custom image bake करें।
    - package installs के लिए `user` root होना चाहिए (`user` छोड़ दें या `user: "0:0"` सेट करें)।
    - Sandbox exec host `process.env` inherit **नहीं** करता। skill API keys के लिए `agents.defaults.sandbox.docker.env` (या custom image) इस्तेमाल करें।
    - `agents.defaults.sandbox.docker.env` में values explicit Docker container environment variables के रूप में pass होती हैं। Docker daemon access वाला कोई भी व्यक्ति उन्हें `docker inspect` जैसे Docker metadata commands से inspect कर सकता है। अगर यह metadata exposure स्वीकार्य नहीं है, तो custom image, mounted secret file, या कोई दूसरा secret delivery path इस्तेमाल करें।

  </Accordion>
</AccordionGroup>

## Tool policy और escape hatches

Tool allow/deny policies sandbox rules से पहले भी लागू होती हैं। अगर कोई tool globally या per-agent denied है, तो sandboxing उसे वापस नहीं लाती।

`tools.elevated` एक explicit escape hatch है जो sandbox के बाहर `exec` चलाता है (डिफ़ॉल्ट रूप से `gateway`, या जब exec target `node` हो तो `node`)। `/exec` directives केवल authorized senders के लिए लागू होती हैं और per session persist करती हैं; `exec` को hard-disable करने के लिए, tool policy deny इस्तेमाल करें ([Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें)।

Debugging:

- effective sandbox mode, tool policy, और fix-it config keys inspect करने के लिए `openclaw sandbox explain` इस्तेमाल करें।
- "यह blocked क्यों है?" mental model के लिए [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें।

इसे locked down रखें।

## Multi-agent overrides

हर agent sandbox + tools override कर सकता है: `agents.list[].sandbox` और `agents.list[].tools` (साथ ही sandbox tool policy के लिए `agents.list[].tools.sandbox.tools`)। Precedence के लिए [Multi-Agent Sandbox & Tools](/hi/tools/multi-agent-sandbox-tools) देखें।

## Minimal enable example

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

## Related

- [Multi-Agent Sandbox & Tools](/hi/tools/multi-agent-sandbox-tools) — per-agent overrides और precedence
- [OpenShell](/hi/gateway/openshell) — managed sandbox backend setup, workspace modes, और config reference
- [Sandbox configuration](/hi/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) — debugging "यह blocked क्यों है?"
- [Security](/hi/gateway/security)
