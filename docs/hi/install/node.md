---
read_when:
    - OpenClaw इंस्टॉल करने से पहले आपको Node.js इंस्टॉल करना होगा
    - आपने OpenClaw इंस्टॉल किया है, लेकिन `openclaw` कमांड नहीं मिल रही है
    - अनुमतियों या PATH संबंधी समस्याओं के कारण `npm install -g` विफल हो जाता है
summary: OpenClaw के लिए Node.js इंस्टॉल और कॉन्फ़िगर करें - संस्करण आवश्यकताएँ, इंस्टॉल विकल्प और PATH समस्या निवारण
title: Node.js
x-i18n:
    generated_at: "2026-07-16T15:30:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw के लिए **Node 22.22.3+, Node 24.15+, या Node 25.9+** आवश्यक है। इंस्टॉल, CI और रिलीज़ वर्कफ़्लो के लिए **Node 24 डिफ़ॉल्ट और अनुशंसित रनटाइम है**; सक्रिय LTS शृंखला के माध्यम से Node 22 समर्थित बना हुआ है। Node 23 समर्थित नहीं है। [इंस्टॉलर स्क्रिप्ट](/hi/install#alternative-install-methods) Node का स्वचालित रूप से पता लगाकर उसे इंस्टॉल करती है — जब आप Node को स्वयं सेट अप करना चाहते हों (वर्ज़न, PATH, ग्लोबल इंस्टॉल), तब इस पेज का उपयोग करें।

## अपना वर्ज़न जाँचें

```bash
node -v
```

`v24.15.0` या नया 24.x अनुशंसित डिफ़ॉल्ट है। `v22.22.3` या नया 22.x समर्थित Node 22 LTS विकल्प है; Node `v25.9.0+` भी समर्थित है। Node 23 समर्थित नहीं है। यदि Node उपलब्ध नहीं है या समर्थित सीमा से बाहर है, तो नीचे दी गई कोई इंस्टॉल विधि चुनें।

## Node इंस्टॉल करें

<Tabs>
  <Tab title="macOS">
    **Homebrew** (अनुशंसित):

    ```bash
    brew install node
    ```

    या [nodejs.org](https://nodejs.org/) से macOS इंस्टॉलर डाउनलोड करें।

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    या किसी वर्ज़न मैनेजर का उपयोग करें (नीचे देखें)।

  </Tab>
  <Tab title="Windows">
    **winget** (अनुशंसित):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    या [nodejs.org](https://nodejs.org/) से Windows इंस्टॉलर डाउनलोड करें।

  </Tab>
</Tabs>

<Accordion title="वर्ज़न मैनेजर का उपयोग करना (nvm, fnm, mise, asdf)">
  वर्ज़न मैनेजर आपको Node वर्ज़नों के बीच आसानी से स्विच करने देते हैं। लोकप्रिय विकल्प:

- [**fnm**](https://github.com/Schniz/fnm) - तेज़, क्रॉस-प्लेटफ़ॉर्म
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux पर व्यापक रूप से उपयोग किया जाता है
- [**mise**](https://mise.jdx.dev/) - बहुभाषी (Node, Python, Ruby आदि)

fnm के साथ उदाहरण:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  अपने शेल की स्टार्टअप फ़ाइल (`~/.zshrc` या `~/.bashrc`) में अपना वर्ज़न मैनेजर आरंभ करें। यदि आप इसे छोड़ देते हैं, तो नए टर्मिनल सत्रों में `openclaw` नहीं मिल सकता, क्योंकि PATH में Node की bin डायरेक्टरी शामिल नहीं होगी।
  </Warning>
</Accordion>

## समस्या निवारण

### `openclaw: command not found`

इसका लगभग हमेशा यही अर्थ होता है कि npm की ग्लोबल bin डायरेक्टरी आपके PATH में नहीं है।

<Steps>
  <Step title="अपना ग्लोबल npm प्रीफ़िक्स खोजें">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="जाँचें कि यह आपके PATH में है या नहीं">
    ```bash
    echo "$PATH"
    ```

    आउटपुट में `<npm-prefix>/bin` (macOS/Linux) या `<npm-prefix>` (Windows) खोजें।

  </Step>
  <Step title="इसे अपनी शेल स्टार्टअप फ़ाइल में जोड़ें">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` या `~/.bashrc` में जोड़ें:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        फिर नया टर्मिनल खोलें (या zsh में `rehash` / bash में `hash -r` चलाएँ)।
      </Tab>
      <Tab title="Windows">
        Settings → System → Environment Variables के माध्यम से `npm prefix -g` के आउटपुट को अपने सिस्टम PATH में जोड़ें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` पर अनुमति संबंधी त्रुटियाँ (Linux)

यदि आपको `EACCES` त्रुटियाँ दिखाई देती हैं, तो npm के ग्लोबल प्रीफ़िक्स को उपयोगकर्ता द्वारा लिखने योग्य डायरेक्टरी पर सेट करें:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

इसे स्थायी बनाने के लिए `export PATH=...` वाली पंक्ति को अपने `~/.bashrc` या `~/.zshrc` में जोड़ें।

## संबंधित

- [इंस्टॉल का अवलोकन](/hi/install) - इंस्टॉल करने की सभी विधियाँ
- [अपडेट करना](/hi/install/updating) - OpenClaw को अद्यतित रखना
- [शुरुआत करना](/hi/start/getting-started) - इंस्टॉल के बाद के शुरुआती चरण
