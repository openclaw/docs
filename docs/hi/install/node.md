---
read_when:
    - OpenClaw इंस्टॉल करने से पहले आपको Node.js इंस्टॉल करना होगा
    - आपने OpenClaw इंस्टॉल किया है, लेकिन `openclaw` कमांड नहीं मिला
    - '`npm install -g` अनुमतियों या `PATH` समस्याओं के कारण विफल होता है'
summary: OpenClaw के लिए Node.js इंस्टॉल और कॉन्फ़िगर करें - संस्करण आवश्यकताएँ, इंस्टॉल विकल्प, और PATH समस्या निवारण
title: Node.js
x-i18n:
    generated_at: "2026-07-04T08:46:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw के लिए **Node 22.19+, Node 23.11+, या Node 24+** आवश्यक है। **Node 24 इंस्टॉल, CI, और रिलीज़ वर्कफ़्लो के लिए डिफ़ॉल्ट और अनुशंसित runtime है**। Node 22 सक्रिय LTS लाइन के माध्यम से समर्थित बना हुआ है। [इंस्टॉलर स्क्रिप्ट](/hi/install#alternative-install-methods) Node को अपने आप पहचानकर इंस्टॉल कर देगी - यह पेज तब के लिए है जब आप Node खुद सेट अप करना चाहते हैं और सुनिश्चित करना चाहते हैं कि सब कुछ सही तरह से जुड़ा है (वर्ज़न, PATH, ग्लोबल इंस्टॉल)।

## अपना वर्ज़न जाँचें

```bash
node -v
```

अगर यह `v24.x.x` या उससे ऊपर दिखाता है, तो आप अनुशंसित डिफ़ॉल्ट पर हैं। अगर यह `v22.19.x` या उससे ऊपर दिखाता है, तो आप समर्थित Node 22 LTS पथ पर हैं, लेकिन हम फिर भी सुविधाजनक समय पर Node 24 में अपग्रेड करने की सलाह देते हैं। `v23.11.0` से पहले के Node 23 वर्ज़न समर्थित नहीं हैं। अगर Node इंस्टॉल नहीं है या वर्ज़न समर्थित सीमा से बाहर है, तो नीचे से कोई इंस्टॉल विधि चुनें।

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

    या कोई वर्ज़न मैनेजर इस्तेमाल करें (नीचे देखें)।

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  वर्ज़न मैनेजर आपको Node वर्ज़न के बीच आसानी से स्विच करने देते हैं। लोकप्रिय विकल्प:

- [**fnm**](https://github.com/Schniz/fnm) - तेज़, क्रॉस-प्लैटफ़ॉर्म
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux पर व्यापक रूप से इस्तेमाल होता है
- [**mise**](https://mise.jdx.dev/) - पॉलीग्लॉट (Node, Python, Ruby, आदि)

fnm के साथ उदाहरण:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  सुनिश्चित करें कि आपका वर्ज़न मैनेजर आपकी शेल स्टार्टअप फ़ाइल (`~/.zshrc` या `~/.bashrc`) में इनिशियलाइज़ किया गया है। अगर ऐसा नहीं है, तो नए टर्मिनल सेशन में `openclaw` नहीं मिल सकता क्योंकि PATH में Node की bin डायरेक्टरी शामिल नहीं होगी।
  </Warning>
</Accordion>

## समस्या निवारण

### `openclaw: command not found`

इसका लगभग हमेशा मतलब होता है कि npm की ग्लोबल bin डायरेक्टरी आपके PATH में नहीं है।

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    आउटपुट में `<npm-prefix>/bin` (macOS/Linux) या `<npm-prefix>` (Windows) देखें।

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` या `~/.bashrc` में जोड़ें:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        फिर नया टर्मिनल खोलें (या zsh में `rehash` / bash में `hash -r` चलाएँ)।
      </Tab>
      <Tab title="Windows">
        Settings → System → Environment Variables के ज़रिए `npm prefix -g` के आउटपुट को अपने सिस्टम PATH में जोड़ें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` पर अनुमति त्रुटियाँ (Linux)

अगर आपको `EACCES` त्रुटियाँ दिखती हैं, तो npm के ग्लोबल प्रीफ़िक्स को ऐसी डायरेक्टरी में बदलें जिसमें उपयोगकर्ता लिख सके:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

इसे स्थायी बनाने के लिए `export PATH=...` लाइन को अपने `~/.bashrc` या `~/.zshrc` में जोड़ें।

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install) - सभी इंस्टॉलेशन विधियाँ
- [अपडेट करना](/hi/install/updating) - OpenClaw को अद्यतित रखना
- [शुरुआत करना](/hi/start/getting-started) - इंस्टॉल के बाद पहले चरण
