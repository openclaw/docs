---
read_when:
    - OpenClaw'ı yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw'ı yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izinler veya PATH sorunları nedeniyle başarısız oluyor
summary: OpenClaw için Node.js’i kurma ve yapılandırma - sürüm gereksinimleri, kurulum seçenekleri ve PATH sorunlarını giderme
title: Node.js
x-i18n:
    generated_at: "2026-07-04T10:58:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw, **Node 22.19+, Node 23.11+ veya Node 24+** gerektirir. **Node 24; kurulumlar, CI ve sürüm iş akışları için varsayılan ve önerilen çalışma zamanıdır**. Node 22, etkin LTS hattı üzerinden desteklenmeye devam eder. [Yükleyici betiği](/tr/install#alternative-install-methods) Node’u otomatik olarak algılayıp kurar - bu sayfa, Node’u kendiniz kurmak ve her şeyin doğru bağlandığından emin olmak istediğiniz durumlar içindir (sürümler, PATH, global kurulumlar).

## Sürümünüzü kontrol edin

```bash
node -v
```

Bu komut `v24.x.x` veya daha yüksek bir sürüm yazdırıyorsa önerilen varsayılan sürümdesiniz. `v22.19.x` veya daha yüksek bir sürüm yazdırıyorsa desteklenen Node 22 LTS yolundasınız, ancak uygun olduğunda yine de Node 24’e yükseltmenizi öneririz. `v23.11.0` öncesindeki Node 23 sürümleri desteklenmez. Node kurulu değilse veya sürüm desteklenen aralığın dışındaysa aşağıdan bir kurulum yöntemi seçin.

## Node’u kurun

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilir):

    ```bash
    brew install node
    ```

    Ya da macOS yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

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

    Ya da Windows yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

  </Tab>
</Tabs>

<Accordion title="Sürüm yöneticisi kullanma (nvm, fnm, mise, asdf)">
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
  Sürüm yöneticinizin kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatıldığından emin olun. Başlatılmamışsa, PATH Node’un bin dizinini içermeyeceği için yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu neredeyse her zaman npm’in global bin dizininin PATH’inizde olmadığı anlamına gelir.

<Steps>
  <Step title="Global npm prefix’inizi bulun">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH’inizde olup olmadığını kontrol edin">
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
        `npm prefix -g` çıktısını Ayarlar → Sistem → Ortam Değişkenleri üzerinden sistem PATH’inize ekleyin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` üzerinde izin hataları (Linux)

`EACCES` hataları görürseniz npm’in global prefix’ini kullanıcı tarafından yazılabilir bir dizine taşıyın:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hale getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Kurulum Genel Bakışı](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw’ı güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
