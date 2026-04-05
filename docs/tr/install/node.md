---
read_when:
    - OpenClaw'ı yüklemeden önce Node.js kurmanız gerekiyor
    - OpenClaw'ı kurdunuz ama `openclaw` komutu bulunamıyor
    - '`npm install -g`, izin veya PATH sorunları nedeniyle başarısız oluyor'
summary: OpenClaw için Node.js yükleyin ve yapılandırın — sürüm gereksinimleri, yükleme seçenekleri ve PATH sorun giderme
title: Node.js
x-i18n:
    generated_at: "2026-04-05T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw, **Node 22.14 veya daha yenisini** gerektirir. **Node 24**, kurulumlar, CI ve sürüm iş akışları için varsayılan ve önerilen çalışma zamanıdır. Node 22, etkin LTS hattı üzerinden desteklenmeye devam eder. [Yükleyici betiği](/install#alternative-install-methods) Node'u otomatik olarak algılar ve yükler — bu sayfa, Node'u kendiniz kurmak ve her şeyin doğru bağlandığından emin olmak istediğiniz durumlar içindir (sürümler, PATH, genel kurulumlar).

## Sürümünüzü denetleyin

```bash
node -v
```

Bu komut `v24.x.x` veya daha yüksek bir sürüm yazdırıyorsa önerilen varsayılanı kullanıyorsunuz. `v22.14.x` veya daha yüksek bir sürüm yazdırıyorsa desteklenen Node 22 LTS yolundasınız, ancak uygun olduğunda yine de Node 24'e yükseltmenizi öneririz. Node kurulu değilse veya sürüm çok eskiyse, aşağıdaki kurulum yöntemlerinden birini seçin.

## Node'u yükleyin

<Tabs>
  <Tab title="macOS">
    **Homebrew** (önerilir):

    ```bash
    brew install node
    ```

    Veya macOS yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

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

    Veya bir sürüm yöneticisi kullanın (aşağıya bakın).

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

    Veya Windows yükleyicisini [nodejs.org](https://nodejs.org/) adresinden indirin.

  </Tab>
</Tabs>

<Accordion title="Bir sürüm yöneticisi kullanma (nvm, fnm, mise, asdf)">
  Sürüm yöneticileri Node sürümleri arasında kolayca geçiş yapmanızı sağlar. Popüler seçenekler:

- [**fnm**](https://github.com/Schniz/fnm) — hızlı, platformlar arası
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux üzerinde yaygın kullanılır
- [**mise**](https://mise.jdx.dev/) — çok dilli (Node, Python, Ruby vb.)

fnm ile örnek:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Sürüm yöneticinizin kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatıldığından emin olun. Başlatılmadıysa, PATH Node'un bin dizinini içermeyeceğinden yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu neredeyse her zaman npm'nin genel bin dizininin PATH üzerinde olmadığı anlamına gelir.

<Steps>
  <Step title="Genel npm prefix'inizi bulun">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH üzerinde olup olmadığını denetleyin">
    ```bash
    echo "$PATH"
    ```

    Çıktıda `<npm-prefix>/bin` (macOS/Linux) veya `<npm-prefix>` (Windows) arayın.

  </Step>
  <Step title="Kabuk başlangıç dosyanıza ekleyin">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` veya `~/.bashrc` dosyasına şunu ekleyin:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Ardından yeni bir terminal açın (veya zsh'de `rehash`, bash'te `hash -r` çalıştırın).
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` çıktısını Ayarlar → Sistem → Ortam Değişkenleri üzerinden sistem PATH'inize ekleyin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` sırasında izin hataları (Linux)

`EACCES` hataları görüyorsanız, npm'nin genel prefix'ini kullanıcı tarafından yazılabilir bir dizine taşıyın:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı olması için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Install Overview](/install) — tüm kurulum yöntemleri
- [Updating](/install/updating) — OpenClaw'ı güncel tutma
- [Getting Started](/start/getting-started) — kurulumdan sonraki ilk adımlar
