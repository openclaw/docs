---
read_when:
    - आप `openclaw.ai/install.sh` को समझना चाहते हैं
    - आप इंस्टॉलेशन स्वचालित करना चाहते हैं (CI / हेडलेस)
    - आप GitHub चेकआउट से इंस्टॉल करना चाहते हैं
summary: इंस्टॉलर स्क्रिप्ट कैसे काम करती हैं (install.sh, install-cli.sh, install.ps1), फ़्लैग और स्वचालन
title: इंस्टॉलर की आंतरिक कार्यप्रणाली
x-i18n:
    generated_at: "2026-07-19T09:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw तीन इंस्टॉलर स्क्रिप्ट के साथ आता है, जिन्हें `openclaw.ai` से प्रस्तुत किया जाता है।

| स्क्रिप्ट                             | प्लेटफ़ॉर्म             | यह क्या करती है                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | आवश्यकता होने पर Node इंस्टॉल करती है, npm (डिफ़ॉल्ट) या git के माध्यम से OpenClaw इंस्टॉल करती है और ऑनबोर्डिंग चला सकती है।       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm या git के माध्यम से स्थानीय प्रीफ़िक्स (`~/.openclaw`) में Node + OpenClaw इंस्टॉल करती है। root की आवश्यकता नहीं है। |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | आवश्यकता होने पर Node इंस्टॉल करती है, npm (डिफ़ॉल्ट) या git के माध्यम से OpenClaw इंस्टॉल करती है और ऑनबोर्डिंग चला सकती है।       |

तीनों Node **22.22.3+, 24.15+, या 25.9+** का समर्थन करती हैं; नए इंस्टॉल के लिए Node 24 डिफ़ॉल्ट लक्ष्य है।

## त्वरित कमांड

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
यदि इंस्टॉल सफल हो जाता है, लेकिन नए टर्मिनल में `openclaw` नहीं मिलता, तो [Node.js समस्या निवारण](/hi/install/node#troubleshooting) देखें।
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL पर अधिकांश इंटरैक्टिव इंस्टॉल के लिए अनुशंसित।
</Tip>

### प्रवाह (install.sh)

<Steps>
  <Step title="OS का पता लगाएँ">
    macOS और Linux (WSL सहित) का समर्थन करती है।
  </Step>
  <Step title="डिफ़ॉल्ट रूप से Node.js 24 सुनिश्चित करें">
    Node संस्करण की जाँच करती है और आवश्यकता होने पर Node 24 इंस्टॉल करती है (macOS पर Homebrew, Linux apt/dnf/yum पर NodeSource सेटअप स्क्रिप्ट)। macOS पर Homebrew केवल तभी इंस्टॉल किया जाता है, जब इंस्टॉलर को Node या Git के लिए इसकी आवश्यकता होती है। Node 22.22.3+, Node 24.15+, और Node 25.9+ समर्थित हैं; Node 23 समर्थित नहीं है।
    Alpine/musl Linux पर इंस्टॉलर NodeSource के बजाय apk पैकेज का उपयोग करता है और वास्तविक रूप से लिंक किए गए SQLite संस्करण की पुष्टि करता है। वर्तमान स्थिर Alpine पैकेज स्ट्रीम पर्याप्त रूप से नया Node उपलब्ध करा सकती हैं, लेकिन सिस्टम SQLite असुरक्षित हो सकता है; ऐसा होने पर इसके बजाय आधिकारिक `node:24-alpine` कंटेनर या glibc-आधारित होस्ट का उपयोग करें।
  </Step>
  <Step title="Git सुनिश्चित करें">
    Git न मिलने पर, पहचाने गए पैकेज मैनेजर का उपयोग करके इसे इंस्टॉल करती है, जिसमें macOS पर Homebrew और Alpine पर apk शामिल हैं।
  </Step>
  <Step title="OpenClaw इंस्टॉल करें">
    - `npm` विधि (डिफ़ॉल्ट): वैश्विक npm इंस्टॉल
    - `git` विधि: रिपॉज़िटरी क्लोन/अपडेट करें, pnpm से निर्भरताएँ इंस्टॉल करें, बिल्ड करें, फिर `~/.local/bin/openclaw` पर रैपर इंस्टॉल करें

  </Step>
  <Step title="इंस्टॉल के बाद के कार्य">
    - बाद के कमांड के लिए अभी-अभी इंस्टॉल की गई `openclaw` बाइनरी का पथ निर्धारित करती है
    - अकॉन्फ़िगर किए गए इंस्टॉल के लिए, doctor या gateway जाँच से पहले ऑनबोर्डिंग शुरू करती है। `--no-onboard` के साथ या TTY न होने पर, यह बाद में सेटअप पूरा करने का कमांड प्रिंट करती है।
    - कॉन्फ़िगर किए गए इंस्टॉल के लिए, लोड की गई gateway सेवा को यथासंभव रीफ़्रेश और पुनः आरंभ करती है और doctor चलाती है। जहाँ संभव हो, अपग्रेड plugins को अपडेट करते हैं, या हेडलेस प्रॉम्प्ट-सक्षम रन में मैन्युअल कमांड प्रिंट करते हैं।
    - `--verify` चलने पर, यह इंस्टॉल किए गए संस्करण की जाँच करती है और कॉन्फ़िगरेशन मौजूद होने के बाद ही gateway की स्थिति जाँचती है।

  </Step>
</Steps>

### सोर्स चेकआउट का पता लगाना

यदि इसे किसी OpenClaw चेकआउट (`package.json` + `pnpm-workspace.yaml`) के भीतर चलाया जाता है, तो स्क्रिप्ट ये विकल्प देती है:

- चेकआउट का उपयोग करें (`git`), या
- वैश्विक इंस्टॉल का उपयोग करें (`npm`)

यदि कोई TTY उपलब्ध नहीं है और कोई इंस्टॉल विधि सेट नहीं है, तो यह डिफ़ॉल्ट रूप से `npm` का उपयोग करती है और चेतावनी देती है।

अमान्य विधि चयन या अमान्य `--install-method` मानों के लिए स्क्रिप्ट कोड `2` के साथ बाहर निकलती है।

### उदाहरण (install.sh)

<Tabs>
  <Tab title="डिफ़ॉल्ट">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="ऑनबोर्डिंग छोड़ें">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git इंस्टॉल">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main चेकआउट">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="ड्राई रन">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="इंस्टॉल के बाद पुष्टि करें">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="फ़्लैग संदर्भ">

| फ़्लैग                                    | विवरण                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | इंस्टॉल विधि चुनें (डिफ़ॉल्ट: `npm`)                                  |
| `--npm`                                 | npm विधि का शॉर्टकट                                                 |
| `--git \| --github`                     | git विधि का शॉर्टकट                                                 |
| `--version <version\|dist-tag\|spec>`   | npm संस्करण, dist-tag, या पैकेज विनिर्देश (डिफ़ॉल्ट: `latest`)              |
| `--beta`                                | उपलब्ध होने पर beta dist-tag का उपयोग करें, अन्यथा `latest` पर वापस जाएँ              |
| `--git-dir \| --dir <path>`             | चेकआउट डायरेक्टरी (डिफ़ॉल्ट: `~/openclaw`)                              |
| `--no-git-update`                       | मौजूदा चेकआउट के लिए `git pull` छोड़ें                                   |
| `--no-prompt`                           | प्रॉम्प्ट अक्षम करें                                                         |
| `--no-onboard`                          | ऑनबोर्डिंग छोड़ें                                                         |
| `--onboard`                             | ऑनबोर्डिंग सक्षम करें                                                       |
| `--verify`                              | इंस्टॉल के बाद स्मोक सत्यापन चलाएँ (`--version`, लोड होने पर gateway की स्थिति) |
| `--dry-run`                             | परिवर्तन लागू किए बिना कार्रवाइयाँ प्रिंट करें                                  |
| `--verbose`                             | डीबग आउटपुट सक्षम करें (`set -x`, npm notice-स्तरीय लॉग)                   |
| `--help \| -h`                          | उपयोग दिखाएँ                                                              |

  </Accordion>

  <Accordion title="एनवायरनमेंट वेरिएबल संदर्भ">

| वेरिएबल                                          | विवरण                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | इंस्टॉल विधि                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm संस्करण, dist-tag, या पैकेज विनिर्देश                             |
| `OPENCLAW_BETA=0\|1`                              | उपलब्ध होने पर beta का उपयोग करें                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw स्थिति और डिफ़ॉल्ट git/ऑनबोर्डिंग पथों की आधार डायरेक्टरी |
| `OPENCLAW_GIT_DIR=<path>`                         | चेकआउट डायरेक्टरी                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git अपडेट टॉगल करें                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | प्रॉम्प्ट अक्षम करें                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | इंस्टॉल के बाद स्मोक सत्यापन चलाएँ                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | ऑनबोर्डिंग छोड़ें                                                    |
| `OPENCLAW_DRY_RUN=1`                              | ड्राई रन मोड                                                       |
| `OPENCLAW_VERBOSE=1`                              | डीबग मोड                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm लॉग स्तर (डिफ़ॉल्ट: `error`, npm की डिप्रिकेशन संबंधी अनावश्यक सूचनाएँ छिपाता है)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
उन परिवेशों के लिए डिज़ाइन किया गया है जहाँ आप सब कुछ स्थानीय प्रीफ़िक्स
(डिफ़ॉल्ट `~/.openclaw`) के अंतर्गत चाहते हैं और सिस्टम Node निर्भरता नहीं चाहते। डिफ़ॉल्ट रूप से npm इंस्टॉल
और उसी प्रीफ़िक्स प्रवाह के अंतर्गत git-checkout इंस्टॉल का भी समर्थन करता है।
</Info>

### प्रवाह (install-cli.sh)

<Steps>
  <Step title="स्थानीय Node रनटाइम इंस्टॉल करें">
    पिन की गई समर्थित Node LTS tarball (संस्करण स्क्रिप्ट में अंतर्निहित है और स्वतंत्र रूप से अपडेट किया जाता है, डिफ़ॉल्ट `24.15.0`) को `<prefix>/tools/node-v<version>` में डाउनलोड करती है और SHA-256 की पुष्टि करती है।
    Linux ARMv7, Node `22.22.3` का उपयोग करता है क्योंकि आधिकारिक Node 24+ ARMv7 बाइनरी उपलब्ध नहीं हैं।
    Alpine/musl Linux पर, जहाँ Node पिन किए गए रनटाइम के लिए संगत tarball प्रकाशित नहीं करता, `apk` से `nodejs` और `npm` इंस्टॉल करती है, फिर Node और वास्तविक रूप से लिंक की गई SQLite लाइब्रेरी, दोनों की पुष्टि करती है। वर्तमान स्थिर Alpine पैकेज स्ट्रीम पर्याप्त रूप से नए Node के साथ भी असुरक्षित SQLite लिंक कर सकती हैं; सुरक्षा जाँच द्वारा पैकेज अस्वीकार किए जाने पर आधिकारिक `node:24-alpine` कंटेनर या glibc-आधारित होस्ट का उपयोग करें।
  </Step>
  <Step title="Git सुनिश्चित करें">
    यदि Git नहीं मिलता है, तो Linux पर apt/dnf/yum/apk या macOS पर Homebrew के माध्यम से इंस्टॉल करने का प्रयास करती है।
  </Step>
  <Step title="प्रीफ़िक्स के अंतर्गत OpenClaw इंस्टॉल करें">
    - `npm` विधि (डिफ़ॉल्ट): npm से प्रीफ़िक्स के अंतर्गत इंस्टॉल करती है, फिर `<prefix>/bin/openclaw` में रैपर लिखती है
    - `git` विधि: चेकआउट (डिफ़ॉल्ट `~/openclaw`) को क्लोन/अपडेट करती है और फिर भी `<prefix>/bin/openclaw` में रैपर लिखती है

  </Step>
  <Step title="लोड की गई gateway सेवा रीफ़्रेश करें">
    यदि उसी प्रीफ़िक्स से कोई gateway सेवा पहले से लोड है, तो स्क्रिप्ट
    `openclaw gateway install --force` चलाती है, जो प्रतिस्थापन सेवा को सक्रिय करता है,
    और फिर यथासंभव gateway की स्थिति जाँचती है।
  </Step>
</Steps>

### उदाहरण (install-cli.sh)

<Tabs>
  <Tab title="डिफ़ॉल्ट">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="कस्टम प्रीफ़िक्स + संस्करण">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git इंस्टॉल">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="ऑटोमेशन JSON आउटपुट">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="ऑनबोर्डिंग चलाएँ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="फ़्लैग संदर्भ">

| फ़्लैग                                    | विवरण                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | इंस्टॉल प्रीफ़िक्स (डिफ़ॉल्ट: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | इंस्टॉल विधि चुनें (डिफ़ॉल्ट: `npm`)                                          |
| `--npm`                                 | npm विधि का शॉर्टकट                                                         |
| `--git \| --github`                     | git विधि का शॉर्टकट                                                         |
| `--git-dir \| --dir <path>`             | Git चेकआउट डायरेक्टरी (डिफ़ॉल्ट: `~/openclaw`)                                  |
| `--version <ver>`                       | OpenClaw संस्करण या dist-tag (डिफ़ॉल्ट: `latest`)                                |
| `--node-version <ver>`                  | Node संस्करण (डिफ़ॉल्ट: `24.15.0`; Linux ARMv7 पर `22.22.3`)                     |
| `--json`                                | NDJSON इवेंट उत्सर्जित करें                                                              |
| `--onboard`                             | इंस्टॉल के बाद `openclaw onboard` चलाएँ                                            |
| `--no-onboard`                          | ऑनबोर्डिंग छोड़ें (डिफ़ॉल्ट)                                                       |
| `--set-npm-prefix`                      | Linux पर, यदि वर्तमान प्रीफ़िक्स लिखने योग्य नहीं है, तो npm प्रीफ़िक्स को बलपूर्वक `~/.npm-global` पर सेट करें |
| `--help \| -h`                          | उपयोग दिखाएँ                                                                      |

  </Accordion>

  <Accordion title="पर्यावरण वेरिएबल संदर्भ">

| वेरिएबल                                    | विवरण                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | इंस्टॉल प्रीफ़िक्स                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | इंस्टॉल विधि                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw संस्करण या dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node संस्करण                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw स्थिति और डिफ़ॉल्ट git/ऑनबोर्डिंग पाथ के लिए बेस डायरेक्टरी |
| `OPENCLAW_GIT_DIR=<path>`                   | git इंस्टॉल के लिए Git चेकआउट डायरेक्टरी                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | मौजूदा चेकआउट के लिए git अपडेट टॉगल करें                          |
| `OPENCLAW_NO_ONBOARD=1`                     | ऑनबोर्डिंग छोड़ें                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm लॉग स्तर (डिफ़ॉल्ट: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` और अन्य GitHub स्रोत स्पेसिफ़िकेशन npm इंस्टॉल के लिए मान्य `--version` लक्ष्य नहीं हैं। इसके बजाय `--install-method git --version main` का उपयोग करें।
</Note>

---

<a id="installps1"></a>

## install.ps1

### प्रवाह (install.ps1)

<Steps>
  <Step title="PowerShell + Windows परिवेश सुनिश्चित करें">
    PowerShell 5+ आवश्यक है।
  </Step>
  <Step title="डिफ़ॉल्ट रूप से Node.js 24 सुनिश्चित करें">
    यदि उपलब्ध नहीं है, तो पहले winget, फिर Chocolatey और फिर Scoop के माध्यम से इंस्टॉल करने का प्रयास करता है। यदि कोई पैकेज मैनेजर उपलब्ध नहीं है, तो स्क्रिप्ट आधिकारिक Node.js 24 Windows zip को `%LOCALAPPDATA%\OpenClaw\deps\portable-node` में डाउनलोड करती है और उसे वर्तमान प्रक्रिया तथा उपयोगकर्ता PATH में जोड़ती है। Node 22.22.3+, Node 24.15+ और Node 25.9+ समर्थित हैं; Node 23 समर्थित नहीं है।
  </Step>
  <Step title="OpenClaw इंस्टॉल करें">
    - `npm` विधि (डिफ़ॉल्ट): चुने गए `-Tag` का उपयोग करके ग्लोबल npm इंस्टॉल, जिसे लिखने योग्य इंस्टॉलर अस्थायी डायरेक्टरी से शुरू किया जाता है ताकि `C:\` जैसे सुरक्षित फ़ोल्डर में खुले शेल भी काम करें
    - `git` विधि: रेपो को क्लोन/अपडेट करें, pnpm से इंस्टॉल/बिल्ड करें और `%USERPROFILE%\.local\bin\openclaw.cmd` पर रैपर इंस्टॉल करें। यदि Git उपलब्ध नहीं है, तो स्क्रिप्ट `%LOCALAPPDATA%\OpenClaw\deps\portable-git` के अंतर्गत उपयोगकर्ता-स्थानीय MinGit को बूटस्ट्रैप करती है और उसे वर्तमान प्रक्रिया तथा उपयोगकर्ता PATH में जोड़ती है।

  </Step>
  <Step title="इंस्टॉल के बाद के कार्य">
    - जहाँ संभव हो, आवश्यक bin डायरेक्टरी को उपयोगकर्ता PATH में जोड़ता है
    - लोड की गई Gateway सेवा को यथासंभव रीफ़्रेश करता है (`openclaw gateway install --force`, फिर पुनः आरंभ)
    - अपग्रेड और git इंस्टॉल पर `openclaw doctor --non-interactive` चलाता है (यथासंभव)

  </Step>
  <Step title="विफलताओं को संभालें">
    `iwr ... | iex` और स्क्रिप्टब्लॉक इंस्टॉल वर्तमान PowerShell सत्र को बंद किए बिना एक समापन त्रुटि की रिपोर्ट करते हैं। प्रत्यक्ष `powershell -File` / `pwsh -File` इंस्टॉल अब भी स्वचालन के लिए गैर-शून्य कोड के साथ बाहर निकलते हैं।
  </Step>
</Steps>

### उदाहरण (install.ps1)

<Tabs>
  <Tab title="डिफ़ॉल्ट">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git इंस्टॉल">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main चेकआउट">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="कस्टम git डायरेक्टरी">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="ड्राई रन">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="फ़्लैग संदर्भ">

| फ़्लैग                        | विवरण                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | इंस्टॉल विधि (डिफ़ॉल्ट: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag, संस्करण या पैकेज स्पेसिफ़िकेशन (डिफ़ॉल्ट: `latest`) |
| `-GitDir <path>`            | चेकआउट डायरेक्टरी (डिफ़ॉल्ट: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | ऑनबोर्डिंग छोड़ें                                            |
| `-NoGitUpdate`              | `git pull` छोड़ें                                            |
| `-DryRun`                   | केवल कार्रवाइयाँ प्रिंट करें                                         |

  </Accordion>

  <Accordion title="पर्यावरण वेरिएबल संदर्भ">

| वेरिएबल                           | विवरण        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | इंस्टॉल विधि     |
| `OPENCLAW_GIT_DIR=<path>`          | चेकआउट डायरेक्टरी |
| `OPENCLAW_NO_ONBOARD=1`            | ऑनबोर्डिंग छोड़ें    |
| `OPENCLAW_GIT_UPDATE=0`            | git pull अक्षम करें   |
| `OPENCLAW_DRY_RUN=1`               | ड्राई रन मोड       |

  </Accordion>
</AccordionGroup>

<Note>
यदि `-InstallMethod git` का उपयोग किया जाता है और Git उपलब्ध नहीं है, तो स्क्रिप्ट Git for Windows लिंक प्रिंट करने से पहले उपयोगकर्ता-स्थानीय MinGit बूटस्ट्रैप का प्रयास करती है।
</Note>

---

## CI और स्वचालन

पूर्वानुमेय रन के लिए गैर-इंटरैक्टिव फ़्लैग/पर्यावरण वेरिएबल का उपयोग करें।

<Tabs>
  <Tab title="install.sh (गैर-इंटरैक्टिव npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (गैर-इंटरैक्टिव git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ऑनबोर्डिंग छोड़ें)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Git क्यों आवश्यक है?">
    `git` इंस्टॉल विधि के लिए Git आवश्यक है। `npm` इंस्टॉल के लिए भी Git की जाँच/इंस्टॉल किया जाता है, ताकि निर्भरताओं द्वारा git URL उपयोग किए जाने पर `spawn git ENOENT` विफलताओं से बचा जा सके।
  </Accordion>

  <Accordion title="Linux पर npm में EACCES क्यों आता है?">
    कुछ Linux सेटअप npm के ग्लोबल प्रीफ़िक्स को root के स्वामित्व वाले पाथ पर इंगित करते हैं। `install.sh` प्रीफ़िक्स को `~/.npm-global` पर बदल सकता है और शेल rc फ़ाइलों में PATH एक्सपोर्ट जोड़ सकता है (जब वे फ़ाइलें मौजूद हों)।
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    इंस्टॉलर को फिर से चलाएँ ताकि वह उपयोगकर्ता-स्थानीय MinGit को बूटस्ट्रैप कर सके, या Git for Windows इंस्टॉल करके PowerShell को फिर से खोलें।
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` चलाएँ और उस डायरेक्टरी को अपने उपयोगकर्ता PATH में जोड़ें (Windows पर `\bin` प्रत्यय की आवश्यकता नहीं है), फिर PowerShell को दोबारा खोलें।
  </Accordion>

  <Accordion title="Windows: विस्तृत इंस्टॉलर आउटपुट कैसे प्राप्त करें">
    `install.ps1` कोई `-Verbose` स्विच उपलब्ध नहीं कराता।
    स्क्रिप्ट-स्तरीय निदान के लिए PowerShell ट्रेसिंग का उपयोग करें:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="इंस्टॉल के बाद openclaw नहीं मिला">
    आमतौर पर यह PATH की समस्या होती है। [Node.js समस्या निवारण](/hi/install/node#troubleshooting) देखें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [इंस्टॉल का अवलोकन](/hi/install)
- [अपडेट करना](/hi/install/updating)
- [अनइंस्टॉल](/hi/install/uninstall)
