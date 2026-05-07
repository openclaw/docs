---
read_when:
    - OpenClaw'u yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw'ı yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izin veya PATH sorunları nedeniyle başarısız oluyor
summary: OpenClaw için Node.js'i kurun ve yapılandırın - sürüm gereksinimleri, kurulum seçenekleri ve PATH sorunlarını giderme
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw, **Node 22.16 veya daha yeni bir sürüm** gerektirir. **Node 24, kurulumlar, CI ve sürüm iş akışları için varsayılan ve önerilen çalışma zamanıdır**. Node 22, aktif LTS hattı üzerinden desteklenmeye devam eder. [Kurulum betiği](/tr/install#alternative-install-methods), Node'u otomatik olarak algılayıp kurar - bu sayfa, Node'u kendiniz kurmak ve her şeyin doğru bağlandığından emin olmak istediğiniz durumlar içindir (sürümler, PATH, global kurulumlar).

## Sürümünüzü kontrol edin

```bash
node -v
```

Bu komut `v24.x.x` veya daha yüksek bir sürüm yazdırırsa önerilen varsayılandasınız. `v22.16.x` veya daha yüksek bir sürüm yazdırırsa desteklenen Node 22 LTS yolundasınız, ancak uygun olduğunda Node 24'e yükseltmenizi yine de öneririz. Node kurulu değilse veya sürüm çok eskiyse aşağıdan bir kurulum yöntemi seçin.

## Node'u kurun

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilir):

    ```bash
    brew install node
    ```

    Alternatif olarak macOS kurulum aracını [nodejs.org](https://nodejs.org/) adresinden indirin.

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

    Alternatif olarak bir sürüm yöneticisi kullanın (aşağıya bakın).

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

    Alternatif olarak Windows kurulum aracını [nodejs.org](https://nodejs.org/) adresinden indirin.

  </Tab>
</Tabs>

<Accordion title="Bir sürüm yöneticisi kullanma (nvm, fnm, mise, asdf)">
  Sürüm yöneticileri, Node sürümleri arasında kolayca geçiş yapmanızı sağlar. Popüler seçenekler:

- [**fnm**](https://github.com/Schniz/fnm) - hızlı, platformlar arası
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux üzerinde yaygın olarak kullanılır
- [**mise**](https://mise.jdx.dev/) - çok dilli (Node, Python, Ruby vb.)

fnm ile örnek:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Sürüm yöneticinizin kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatıldığından emin olun. Başlatılmadıysa, PATH Node'un bin dizinini içermeyeceği için yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu neredeyse her zaman npm'in global bin dizininin PATH'inizde olmadığı anlamına gelir.

<Steps>
  <Step title="Global npm prefix değerini bulun">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH'inizde olup olmadığını kontrol edin">
    ```bash
    echo "$PATH"
    ```

    Çıktıda `<npm-prefix>/bin` (macOS/Linux) veya `<npm-prefix>` (Windows) arayın.

  </Step>
  <Step title="Kabuk başlangıç dosyanıza ekleyin">
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

`EACCES` hataları görürseniz npm'in global prefix değerini kullanıcı tarafından yazılabilir bir dizine taşıyın:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hale getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Kuruluma Genel Bakış](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw'u güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
