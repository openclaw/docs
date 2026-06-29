---
read_when:
    - OpenClaw इंस्टॉल करने से पहले आपको Node.js इंस्टॉल करना होगा
    - आपने OpenClaw इंस्टॉल किया, लेकिन `openclaw` कमांड नहीं मिला
    - npm install -g अनुमतियों या PATH समस्याओं के कारण विफल होता है
summary: OpenClaw के लिए Node.js इंस्टॉल और कॉन्फ़िगर करें - संस्करण आवश्यकताएँ, इंस्टॉल विकल्प, और PATH समस्या निवारण
title: Node.js
x-i18n:
    generated_at: "2026-06-28T23:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw के लिए **Node 22.19 या नया** आवश्यक है। इंस्टॉल, CI, और रिलीज़ वर्कफ़्लो के लिए **Node 24 डिफ़ॉल्ट और अनुशंसित runtime** है। Node 22 सक्रिय LTS लाइन के माध्यम से समर्थित बना रहता है। [installer script](/hi/install#alternative-install-methods) Node को अपने-आप पहचानकर इंस्टॉल कर देगी - यह पेज तब के लिए है जब आप Node खुद सेट अप करना चाहते हैं और सुनिश्चित करना चाहते हैं कि सब कुछ सही तरह से जुड़ा है (versions, PATH, global installs)।

## अपना version जांचें

```bash
node -v
```

अगर यह `v24.x.x` या उससे ऊपर प्रिंट करता है, तो आप अनुशंसित डिफ़ॉल्ट पर हैं। अगर यह `v22.19.x` या उससे ऊपर प्रिंट करता है, तो आप समर्थित Node 22 LTS पथ पर हैं, लेकिन सुविधाजनक होने पर हम फिर भी Node 24 पर अपग्रेड करने की सलाह देते हैं। अगर Node इंस्टॉल नहीं है या version बहुत पुराना है, तो नीचे कोई इंस्टॉल विधि चुनें।

## Node इंस्टॉल करें

<Tabs>
  <Tab title="macOS">
    **Homebrew** (अनुशंसित):

    ```bash
    brew install node
    ```

    या [nodejs.org](https://nodejs.org/) से macOS installer डाउनलोड करें।

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

    या version manager इस्तेमाल करें (नीचे देखें)।

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

    या [nodejs.org](https://nodejs.org/) से Windows installer डाउनलोड करें।

  </Tab>
</Tabs>

<Accordion title="version manager का उपयोग करना (nvm, fnm, mise, asdf)">
  version manager आपको Node versions के बीच आसानी से स्विच करने देते हैं। लोकप्रिय विकल्प:

- [**fnm**](https://github.com/Schniz/fnm) - तेज, cross-platform
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux पर व्यापक रूप से उपयोग किया जाता है
- [**mise**](https://mise.jdx.dev/) - polyglot (Node, Python, Ruby, आदि)

fnm के साथ उदाहरण:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  सुनिश्चित करें कि आपका version manager आपकी shell startup file (`~/.zshrc` या `~/.bashrc`) में initialized है। अगर ऐसा नहीं है, तो नए terminal sessions में `openclaw` नहीं मिल सकता क्योंकि PATH में Node की bin directory शामिल नहीं होगी।
  </Warning>
</Accordion>

## समस्या निवारण

### `openclaw: command not found`

इसका लगभग हमेशा मतलब होता है कि npm की global bin directory आपके PATH पर नहीं है।

<Steps>
  <Step title="अपना global npm prefix खोजें">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="जांचें कि यह आपके PATH पर है या नहीं">
    ```bash
    echo "$PATH"
    ```

    output में `<npm-prefix>/bin` (macOS/Linux) या `<npm-prefix>` (Windows) देखें।

  </Step>
  <Step title="इसे अपनी shell startup file में जोड़ें">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` या `~/.bashrc` में जोड़ें:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        फिर नया terminal खोलें (या zsh में `rehash` / bash में `hash -r` चलाएं)।
      </Tab>
      <Tab title="Windows">
        Settings → System → Environment Variables के माध्यम से `npm prefix -g` का output अपने system PATH में जोड़ें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` पर permission errors (Linux)

अगर आपको `EACCES` errors दिखें, तो npm के global prefix को user-writable directory पर स्विच करें:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

इसे स्थायी बनाने के लिए `export PATH=...` line को अपने `~/.bashrc` या `~/.zshrc` में जोड़ें।

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install) - सभी installation methods
- [अपडेट करना](/hi/install/updating) - OpenClaw को up to date रखना
- [शुरुआत करना](/hi/start/getting-started) - install के बाद पहले steps
