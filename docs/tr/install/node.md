---
read_when:
    - OpenClaw'ı yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw’ı yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izin veya PATH sorunları nedeniyle başarısız olur
summary: OpenClaw için Node.js'yi kurma ve yapılandırma - sürüm gereksinimleri, kurulum seçenekleri ve PATH sorun giderme
title: Node.js
x-i18n:
    generated_at: "2026-05-06T09:20:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw **Node 22.14 veya daha yeni bir sürüm** gerektirir. **Node 24; kurulumlar, CI ve yayın iş akışları için varsayılan ve önerilen çalışma zamanıdır**. Node 22, etkin LTS hattı üzerinden desteklenmeye devam eder. [Kurulum betiği](/tr/install#alternative-install-methods) Node'u otomatik olarak algılayıp kurar - bu sayfa, Node'u kendiniz kurmak ve her şeyin doğru şekilde bağlandığından emin olmak istediğiniz durumlar içindir (sürümler, PATH, global kurulumlar).

## Sürümünüzü kontrol edin

```bash
node -v
```

Bu komut `v24.x.x` veya daha yüksek bir sürüm yazdırırsa, önerilen varsayılanı kullanıyorsunuz. `v22.14.x` veya daha yüksek bir sürüm yazdırırsa, desteklenen Node 22 LTS yolundasınız, ancak yine de uygun olduğunda Node 24'e yükseltmenizi öneririz. Node kurulu değilse veya sürüm çok eskiyse, aşağıdaki kurulum yöntemlerinden birini seçin.

## Node'u kurun

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilir):

    ```bash
    brew install node
    ```

    Ya da macOS kurulum paketini [nodejs.org](https://nodejs.org/) adresinden indirin.

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

    Ya da bir sürüm yöneticisi kullanın (aşağıya bakın).

  </Tab>
  <Tab title="Windows">
    **winget** (önerilir):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Ya da Windows kurulum paketini [nodejs.org](https://nodejs.org/) adresinden indirin.

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Sürüm yöneticileri, Node sürümleri arasında kolayca geçiş yapmanızı sağlar. Popüler seçenekler:

- [**fnm**](https://github.com/Schniz/fnm) - hızlı, çapraz platform
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux üzerinde yaygın olarak kullanılır
- [**mise**](https://mise.jdx.dev/) - çok dilli (Node, Python, Ruby vb.)

fnm ile örnek:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Sürüm yöneticinizin kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatıldığından emin olun. Başlatılmamışsa, PATH Node'un bin dizinini içermeyeceği için yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu neredeyse her zaman npm'in global bin dizininin PATH'inizde olmadığı anlamına gelir.

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

    Çıktıda `<npm-prefix>/bin` (macOS/Linux) veya `<npm-prefix>` (Windows) değerini arayın.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` veya `~/.bashrc` dosyasına ekleyin:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Ardından yeni bir terminal açın (veya zsh içinde `rehash` / bash içinde `hash -r` çalıştırın).
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` çıktısını Ayarlar → Sistem → Ortam Değişkenleri üzerinden sistem PATH'inize ekleyin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` üzerinde izin hataları (Linux)

`EACCES` hataları görürseniz, npm'in global prefix'ini kullanıcı tarafından yazılabilir bir dizine geçirin:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hale getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Kuruluma Genel Bakış](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw'ı güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
