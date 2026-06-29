---
read_when:
    - आप `openclaw.ai/install.sh` को समझना चाहते हैं
    - आप इंस्टॉल को स्वचालित करना चाहते हैं (CI / हेडलेस)
    - आप GitHub चेकआउट से इंस्टॉल करना चाहते हैं
summary: इंस्टॉलर स्क्रिप्ट कैसे काम करती हैं (install.sh, install-cli.sh, install.ps1), फ़्लैग, और ऑटोमेशन
title: इंस्टॉलर की आंतरिक कार्यप्रणाली
x-i18n:
    generated_at: "2026-06-28T23:21:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw तीन इंस्टॉलर स्क्रिप्ट के साथ आता है, जिन्हें `openclaw.ai` से परोसा जाता है।

| स्क्रिप्ट                           | प्लेटफ़ॉर्म          | यह क्या करती है                                                                                              |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ज़रूरत होने पर Node इंस्टॉल करती है, npm (डिफ़ॉल्ट) या git के ज़रिए OpenClaw इंस्टॉल करती है, और ऑनबोर्डिंग चला सकती है। |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw को npm या git checkout मोड के साथ एक स्थानीय प्रीफ़िक्स (`~/.openclaw`) में इंस्टॉल करती है। root की आवश्यकता नहीं। |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ज़रूरत होने पर Node इंस्टॉल करती है, npm (डिफ़ॉल्ट) या git के ज़रिए OpenClaw इंस्टॉल करती है, और ऑनबोर्डिंग चला सकती है। |

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
अगर इंस्टॉल सफल हो जाता है लेकिन नए टर्मिनल में `openclaw` नहीं मिलता, तो [Node.js समस्या-निवारण](/hi/install/node#troubleshooting) देखें।
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL पर अधिकांश इंटरैक्टिव इंस्टॉल के लिए अनुशंसित।
</Tip>

### प्रवाह (install.sh)

<Steps>
  <Step title="Detect OS">
    macOS और Linux (WSL सहित) का समर्थन करता है।
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Node संस्करण जांचता है और ज़रूरत होने पर Node 24 इंस्टॉल करता है (macOS पर Homebrew, Linux apt/dnf/yum पर NodeSource setup scripts)। macOS पर, Homebrew केवल तब इंस्टॉल होता है जब इंस्टॉलर को Node या Git के लिए इसकी ज़रूरत होती है। OpenClaw अभी भी संगतता के लिए Node 22 LTS, वर्तमान में `22.19+`, का समर्थन करता है।
    Alpine/musl Linux पर, इंस्टॉलर NodeSource के बजाय apk पैकेजों का उपयोग करता है; कॉन्फ़िगर की गई Alpine रिपॉज़िटरी में Node `22.19+` उपलब्ध होना चाहिए (लिखते समय Alpine 3.21 या नया)।
  </Step>
  <Step title="Ensure Git">
    पहचाने गए पैकेज मैनेजर का उपयोग करके Git इंस्टॉल करता है, यदि वह मौजूद नहीं है, जिसमें macOS पर Homebrew और Alpine पर apk शामिल हैं।
  </Step>
  <Step title="Install OpenClaw">
    - `npm` विधि (डिफ़ॉल्ट): वैश्विक npm install
    - `git` विधि: repo clone/update करें, pnpm के साथ deps इंस्टॉल करें, build करें, फिर `~/.local/bin/openclaw` पर wrapper इंस्टॉल करें

  </Step>
  <Step title="Post-install tasks">
    - लोड की गई gateway service को सर्वोत्तम-प्रयास के आधार पर refresh करता है (`openclaw gateway install --force`, फिर restart)
    - upgrades और git installs पर `openclaw doctor --non-interactive` चलाता है (सर्वोत्तम प्रयास)
    - उपयुक्त होने पर ऑनबोर्डिंग का प्रयास करता है (TTY उपलब्ध, ऑनबोर्डिंग disabled नहीं, और bootstrap/config checks pass)

  </Step>
</Steps>

### Source checkout पहचान

यदि किसी OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) के अंदर चलाया जाए, तो स्क्रिप्ट ये विकल्प देती है:

- checkout का उपयोग करें (`git`), या
- global install का उपयोग करें (`npm`)

यदि कोई TTY उपलब्ध नहीं है और कोई install method set नहीं है, तो यह `npm` पर default करता है और चेतावनी देता है।

अमान्य method selection या अमान्य `--install-method` मानों के लिए स्क्रिप्ट code `2` के साथ exit करती है।

### उदाहरण (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                                  | विवरण                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | install method चुनें (डिफ़ॉल्ट: `npm`)। उपनाम: `--method` |
| `--npm`                               | npm method के लिए shortcut                              |
| `--git`                               | git method के लिए shortcut। उपनाम: `--github`           |
| `--version <version\|dist-tag\|spec>` | npm version, dist-tag, या package spec (डिफ़ॉल्ट: `latest`) |
| `--beta`                              | उपलब्ध होने पर beta dist-tag का उपयोग करें, अन्यथा `latest` पर fallback करें |
| `--git-dir <path>`                    | Checkout directory (डिफ़ॉल्ट: `~/openclaw`)। उपनाम: `--dir` |
| `--no-git-update`                     | मौजूदा checkout के लिए `git pull` छोड़ें                 |
| `--no-prompt`                         | prompts disabled करें                                    |
| `--no-onboard`                        | ऑनबोर्डिंग छोड़ें                                       |
| `--onboard`                           | ऑनबोर्डिंग enabled करें                                  |
| `--dry-run`                           | बदलाव लागू किए बिना actions print करें                  |
| `--verbose`                           | debug output enabled करें (`set -x`, npm notice-level logs) |
| `--help`                              | usage दिखाएं (`-h`)                                      |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                          | विवरण                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Install method                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm version, dist-tag, या package spec                             |
| `OPENCLAW_BETA=0\|1`                              | उपलब्ध होने पर beta का उपयोग करें                                  |
| `OPENCLAW_HOME=<path>`                            | OpenClaw state और default git/onboarding paths के लिए base directory |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout directory                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git updates toggle करें                                            |
| `OPENCLAW_NO_PROMPT=1`                            | prompts disabled करें                                             |
| `OPENCLAW_NO_ONBOARD=1`                           | ऑनबोर्डिंग छोड़ें                                                 |
| `OPENCLAW_DRY_RUN=1`                              | Dry run mode                                                       |
| `OPENCLAW_VERBOSE=1`                              | Debug mode                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm log level                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
उन environments के लिए डिज़ाइन किया गया है जहां आप सब कुछ एक स्थानीय प्रीफ़िक्स
(डिफ़ॉल्ट `~/.openclaw`) के नीचे रखना चाहते हैं और कोई system Node dependency नहीं चाहते। डिफ़ॉल्ट रूप से npm installs
का समर्थन करता है, साथ ही उसी prefix flow के अंतर्गत git-checkout installs भी।
</Info>

### प्रवाह (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    एक pinned supported Node LTS tarball (version स्क्रिप्ट में embedded होता है और स्वतंत्र रूप से updated होता है) को `<prefix>/tools/node-v<version>` में download करता है और SHA-256 verify करता है।
    Alpine/musl Linux पर, जहां Node pinned runtime के लिए compatible tarballs publish नहीं करता, `apk` के साथ `nodejs` और `npm` इंस्टॉल करता है और उस runtime को prefix wrapper path में link करता है। Alpine repositories में Node `22.19+` उपलब्ध होना चाहिए; यदि पुराने repositories केवल Node 20 या 21 उपलब्ध कराते हैं, तो Alpine 3.21 या नया उपयोग करें।
  </Step>
  <Step title="Ensure Git">
    यदि Git मौजूद नहीं है, तो Linux पर apt/dnf/yum/apk या macOS पर Homebrew के ज़रिए install का प्रयास करता है।
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` विधि (डिफ़ॉल्ट): prefix के अंतर्गत npm के साथ install करता है, फिर `<prefix>/bin/openclaw` पर wrapper लिखता है
    - `git` विधि: checkout (डिफ़ॉल्ट `~/openclaw`) clone/update करता है और फिर भी wrapper को `<prefix>/bin/openclaw` पर लिखता है

  </Step>
  <Step title="Refresh loaded gateway service">
    यदि gateway service उसी prefix से पहले से loaded है, तो स्क्रिप्ट
    `openclaw gateway install --force`, फिर `openclaw gateway restart` चलाती है, और
    सर्वोत्तम-प्रयास के आधार पर gateway health probe करती है।
  </Step>
</Steps>

### उदाहरण (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | विवरण                                                                          |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | स्थापना उपसर्ग (डिफ़ॉल्ट: `~/.openclaw`)                                         |
| `--install-method npm\|git` | स्थापना विधि चुनें (डिफ़ॉल्ट: `npm`). उपनाम: `--method`                       |
| `--npm`                     | npm विधि के लिए शॉर्टकट                                                         |
| `--git`, `--github`         | git विधि के लिए शॉर्टकट                                                         |
| `--git-dir <path>`          | Git चेकआउट निर्देशिका (डिफ़ॉल्ट: `~/openclaw`). उपनाम: `--dir`                  |
| `--version <ver>`           | OpenClaw संस्करण या dist-tag (डिफ़ॉल्ट: `latest`)                                |
| `--node-version <ver>`      | Node संस्करण (डिफ़ॉल्ट: `22.22.0`)                                               |
| `--json`                    | NDJSON इवेंट उत्सर्जित करें                                                              |
| `--onboard`                 | स्थापना के बाद `openclaw onboard` चलाएं                                            |
| `--no-onboard`              | ऑनबोर्डिंग छोड़ें (डिफ़ॉल्ट)                                                       |
| `--set-npm-prefix`          | Linux पर, यदि मौजूदा उपसर्ग लिखने योग्य नहीं है तो npm उपसर्ग को जबरन `~/.npm-global` करें |
| `--help`                    | उपयोग दिखाएं (`-h`)                                                               |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                    | विवरण                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | स्थापना उपसर्ग                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | स्थापना विधि                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw संस्करण या dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node संस्करण                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw स्थिति और डिफ़ॉल्ट git/ऑनबोर्डिंग पथों के लिए आधार निर्देशिका |
| `OPENCLAW_GIT_DIR=<path>`                   | git स्थापनाओं के लिए Git चेकआउट निर्देशिका                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | मौजूदा चेकआउट के लिए git अपडेट चालू/बंद करें                          |
| `OPENCLAW_NO_ONBOARD=1`                     | ऑनबोर्डिंग छोड़ें                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm लॉग स्तर                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### प्रवाह (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    PowerShell 5+ आवश्यक है.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    यदि अनुपस्थित हो, तो winget, फिर Chocolatey, फिर Scoop के माध्यम से स्थापना का प्रयास करता है. यदि कोई पैकेज मैनेजर उपलब्ध नहीं है, तो स्क्रिप्ट आधिकारिक Node.js Windows zip को `%LOCALAPPDATA%\OpenClaw\deps\portable-node` में डाउनलोड करती है और उसे मौजूदा प्रक्रिया और उपयोगकर्ता PATH में जोड़ती है. Node 22 LTS, वर्तमान में `22.19+`, संगतता के लिए समर्थित रहता है.
  </Step>
  <Step title="Install OpenClaw">
    - `npm` विधि (डिफ़ॉल्ट): चुने गए `-Tag` का उपयोग करके वैश्विक npm स्थापना, लिखने योग्य इंस्टॉलर अस्थायी निर्देशिका से शुरू की जाती है ताकि `C:\` जैसे सुरक्षित फ़ोल्डरों में खोले गए शेल भी काम करें
    - `git` विधि: repo क्लोन/अपडेट करें, pnpm के साथ इंस्टॉल/बिल्ड करें, और `%USERPROFILE%\.local\bin\openclaw.cmd` पर wrapper इंस्टॉल करें. यदि Git अनुपस्थित है, तो स्क्रिप्ट `%LOCALAPPDATA%\OpenClaw\deps\portable-git` के तहत उपयोगकर्ता-स्थानीय MinGit बूटस्ट्रैप करती है और उसे मौजूदा प्रक्रिया और उपयोगकर्ता PATH में जोड़ती है.

  </Step>
  <Step title="Post-install tasks">
    - संभव होने पर आवश्यक bin निर्देशिका को उपयोगकर्ता PATH में जोड़ता है
    - लोड की गई gateway सेवा को सर्वोत्तम प्रयास से रीफ़्रेश करता है (`openclaw gateway install --force`, फिर रीस्टार्ट)
    - अपग्रेड और git स्थापनाओं पर `openclaw doctor --non-interactive` चलाता है (सर्वोत्तम प्रयास)

  </Step>
  <Step title="Handle failures">
    `iwr ... | iex` और scriptblock स्थापनाएं मौजूदा PowerShell सत्र को बंद किए बिना समाप्त करने वाली त्रुटि रिपोर्ट करती हैं. सीधे `powershell -File` / `pwsh -File` स्थापनाएं अब भी automation के लिए non-zero के साथ बाहर निकलती हैं.
  </Step>
</Steps>

### उदाहरण (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | विवरण                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | स्थापना विधि (डिफ़ॉल्ट: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag, संस्करण, या पैकेज spec (डिफ़ॉल्ट: `latest`) |
| `-GitDir <path>`            | चेकआउट निर्देशिका (डिफ़ॉल्ट: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | ऑनबोर्डिंग छोड़ें                                            |
| `-NoGitUpdate`              | `git pull` छोड़ें                                            |
| `-DryRun`                   | केवल कार्रवाइयां प्रिंट करें                                         |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                           | विवरण        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | स्थापना विधि     |
| `OPENCLAW_GIT_DIR=<path>`          | चेकआउट निर्देशिका |
| `OPENCLAW_NO_ONBOARD=1`            | ऑनबोर्डिंग छोड़ें    |
| `OPENCLAW_GIT_UPDATE=0`            | git pull अक्षम करें   |
| `OPENCLAW_DRY_RUN=1`               | ड्राई रन मोड       |

  </Accordion>
</AccordionGroup>

<Note>
यदि `-InstallMethod git` का उपयोग किया गया है और Git अनुपस्थित है, तो स्क्रिप्ट Git for Windows लिंक प्रिंट करने से पहले उपयोगकर्ता-स्थानीय MinGit बूटस्ट्रैप का प्रयास करती है.
</Note>

---

## CI और automation

पूर्वानुमेय रन के लिए non-interactive flags/env vars का उपयोग करें.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Why is Git required?">
    `git` स्थापना विधि के लिए Git आवश्यक है. `npm` स्थापनाओं के लिए, Git को फिर भी जांचा/इंस्टॉल किया जाता है ताकि dependencies द्वारा git URLs का उपयोग करने पर `spawn git ENOENT` विफलताओं से बचा जा सके.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    कुछ Linux setups npm वैश्विक उपसर्ग को root-owned पथों की ओर इंगित करते हैं. `install.sh` उपसर्ग को `~/.npm-global` पर स्विच कर सकता है और shell rc files में PATH exports जोड़ सकता है (जब वे files मौजूद हों).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    इंस्टॉलर फिर से चलाएं ताकि यह उपयोगकर्ता-स्थानीय MinGit बूटस्ट्रैप कर सके, या Git for Windows इंस्टॉल करें और PowerShell फिर से खोलें.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` चलाएं और उस निर्देशिका को अपने उपयोगकर्ता PATH में जोड़ें (Windows पर `\bin` प्रत्यय की आवश्यकता नहीं), फिर PowerShell फिर से खोलें.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` वर्तमान में `-Verbose` switch उपलब्ध नहीं कराता.
    script-level diagnostics के लिए PowerShell tracing का उपयोग करें:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    आम तौर पर यह PATH समस्या होती है. [Node.js समस्या निवारण](/hi/install/node#troubleshooting) देखें.
  </Accordion>
</AccordionGroup>

## संबंधित

- [स्थापना अवलोकन](/hi/install)
- [अपडेट करना](/hi/install/updating)
- [अनइंस्टॉल](/hi/install/uninstall)
