---
read_when:
    - OpenClaw'u yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw'u yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izinler veya PATH sorunları nedeniyle başarısız oluyor
summary: OpenClaw için Node.js'i yükleme ve yapılandırma - sürüm gereksinimleri, yükleme seçenekleri ve PATH sorunlarını giderme
title: Node.js
x-i18n:
    generated_at: "2026-07-16T17:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw için **Node 22.22.3+, Node 24.15+ veya Node 25.9+** gerekir. **Node 24; kurulumlar, CI ve sürüm iş akışları için varsayılan ve önerilen çalışma zamanıdır**; Node 22, etkin LTS serisi üzerinden desteklenmeye devam eder. Node 23 desteklenmez. [Yükleyici betiği](/tr/install#alternative-install-methods), Node'u otomatik olarak algılar ve kurar — Node'u kendiniz ayarlamak istediğinizde (sürümler, PATH, global kurulumlar) bu sayfayı kullanın.

## Sürümünüzü kontrol edin

```bash
node -v
```

`v24.15.0` veya daha yeni bir 24.x sürümü, önerilen varsayılandır. `v22.22.3` veya daha yeni bir 22.x sürümü, desteklenen Node 22 LTS yoludur; Node `v25.9.0+` de desteklenir. Node 23 desteklenmez. Node yüklü değilse veya desteklenen aralığın dışındaysa aşağıdan bir kurulum yöntemi seçin.

## Node'u kurun

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilir):

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
    **winget** (önerilir):

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
  Sürüm yöneticileri, Node sürümleri arasında kolayca geçiş yapmanızı sağlar. Yaygın seçenekler:

- [**fnm**](https://github.com/Schniz/fnm) - hızlı ve platformlar arası
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux'ta yaygın olarak kullanılır
- [**mise**](https://mise.jdx.dev/) - çok dilli (Node, Python, Ruby vb.)

fnm ile örnek:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Sürüm yöneticinizi kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatın. Bu adımı atlarsanız PATH, Node'un bin dizinini içermeyeceğinden yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu, neredeyse her zaman npm'in global bin dizininin PATH'inizde olmadığı anlamına gelir.

<Steps>
  <Step title="Global npm önekinizi bulun">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH'inizde olup olmadığını kontrol edin">
    ```bash
    echo "$PATH"
    ```

    Çıktıda `<npm-prefix>/bin` (macOS/Linux) veya `<npm-prefix>` (Windows) değerini arayın.

  </Step>
  <Step title="Kabuk başlangıç dosyanıza ekleyin">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` veya `~/.bashrc` dosyasına ekleyin:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Ardından yeni bir terminal açın (veya zsh'de `rehash` / bash'te `hash -r` komutunu çalıştırın).
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` çıktısını Settings → System → Environment Variables üzerinden sistem PATH'inize ekleyin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` sırasında izin hataları (Linux)

`EACCES` hataları görürseniz npm'in global önekini kullanıcı tarafından yazılabilir bir dizine geçirin:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hâle getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili içerikler

- [Kuruluma Genel Bakış](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw'ı güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
