---
read_when:
    - OpenClaw'ı yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw'ı yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izinler veya PATH sorunları nedeniyle başarısız oluyor
summary: OpenClaw için Node.js’i kurma ve yapılandırma - sürüm gereksinimleri, kurulum seçenekleri ve PATH sorunlarını giderme
title: Node.js
x-i18n:
    generated_at: "2026-06-28T00:44:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw, **Node 22.19 veya daha yeni** sürüm gerektirir. **Node 24, kurulumlar, CI ve yayın iş akışları için varsayılan ve önerilen çalışma zamanıdır**. Node 22, etkin LTS hattı üzerinden desteklenmeye devam eder. [yükleyici betik](/tr/install#alternative-install-methods) Node'u otomatik olarak algılar ve kurar - bu sayfa, Node'u kendiniz kurmak ve her şeyin doğru şekilde bağlandığından emin olmak istediğiniz durumlar içindir (sürümler, PATH, global kurulumlar).

## Sürümünüzü kontrol edin

```bash
node -v
```

Bu komut `v24.x.x` veya daha yüksek bir sürüm yazdırıyorsa önerilen varsayılan sürümdesiniz. `v22.19.x` veya daha yüksek bir sürüm yazdırıyorsa desteklenen Node 22 LTS yolundasınız, ancak uygun olduğunda yine de Node 24'e yükseltmenizi öneririz. Node kurulu değilse veya sürüm çok eskiyse aşağıdaki kurulum yöntemlerinden birini seçin.

## Node'u yükleyin

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilen):

    ```bash
    brew install node
    ```

    Alternatif olarak macOS yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

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
    **winget** (önerilen):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Alternatif olarak Windows yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

  </Tab>
</Tabs>

<Accordion title="Sürüm yöneticisi kullanma (nvm, fnm, mise, asdf)">
  Sürüm yöneticileri Node sürümleri arasında kolayca geçiş yapmanızı sağlar. Popüler seçenekler:

- [**fnm**](https://github.com/Schniz/fnm) - hızlı, platformlar arası
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

Bu neredeyse her zaman npm'in global bin dizininin PATH üzerinde olmadığı anlamına gelir.

<Steps>
  <Step title="Global npm önekinizi bulun">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH üzerinde olup olmadığını kontrol edin">
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

`EACCES` hataları görüyorsanız npm'in global önekini kullanıcının yazabildiği bir dizine taşıyın:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hale getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Kurulum Genel Bakışı](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw'ı güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
