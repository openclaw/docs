---
read_when:
    - OpenClaw'u yüklemeden önce Node.js'i yüklemeniz gerekir
    - OpenClaw'ı yüklediniz ancak `openclaw` komutu bulunamadı
    - npm install -g izinler veya PATH sorunları nedeniyle başarısız oluyor
summary: OpenClaw için Node.js'i yükleyin ve yapılandırın - sürüm gereksinimleri, yükleme seçenekleri ve PATH sorun giderme
title: Node.js
x-i18n:
    generated_at: "2026-07-12T12:23:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw için **Node 22.19+, Node 23.11+ veya Node 24+** gereklidir. **Node 24; kurulumlar, CI ve sürüm iş akışları için varsayılan ve önerilen çalışma zamanıdır**; Node 22, etkin LTS serisi üzerinden desteklenmeye devam eder. [Kurulum betiği](/tr/install#alternative-install-methods) Node'u otomatik olarak algılar ve kurar. Node'u kendiniz yapılandırmak istediğinizde (sürümler, PATH, genel kurulumlar) bu sayfayı kullanın.

## Sürümünüzü kontrol edin

```bash
node -v
```

Önerilen varsayılan sürüm `v24.x.x` veya üzeridir. Desteklenen Node 22 LTS yolu `v22.19.x` veya üzeridir (uygun olduğunda Node 24'e yükseltin). `v23.11.0` öncesindeki Node 23 derlemeleri desteklenmez. Node yüklü değilse veya desteklenen aralığın dışındaysa aşağıdaki kurulum yöntemlerinden birini seçin.

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

- [**fnm**](https://github.com/Schniz/fnm) - hızlı, platformlar arası
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux üzerinde yaygın olarak kullanılır
- [**mise**](https://mise.jdx.dev/) - çok dilli (Node, Python, Ruby vb.)

fnm ile örnek:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Sürüm yöneticinizi kabuk başlangıç dosyanızda (`~/.zshrc` veya `~/.bashrc`) başlatın. Bu adımı atlarsanız PATH, Node'un ikili dosya dizinini içermeyeceği için yeni terminal oturumlarında `openclaw` bulunamayabilir.
  </Warning>
</Accordion>

## Sorun giderme

### `openclaw: command not found`

Bu, neredeyse her zaman npm'in genel ikili dosya dizininin PATH'inizde olmadığı anlamına gelir.

<Steps>
  <Step title="Genel npm önekinizi bulun">
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

        Ardından yeni bir terminal açın (veya zsh'de `rehash`, bash'te `hash -r` komutunu çalıştırın).
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` çıktısını Settings → System → Environment Variables üzerinden sistem PATH'inize ekleyin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` sırasında izin hataları (Linux)

`EACCES` hataları görürseniz npm'in genel önekini kullanıcının yazabildiği bir dizine geçirin:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Kalıcı hâle getirmek için `export PATH=...` satırını `~/.bashrc` veya `~/.zshrc` dosyanıza ekleyin.

## İlgili

- [Kuruluma Genel Bakış](/tr/install) - tüm kurulum yöntemleri
- [Güncelleme](/tr/install/updating) - OpenClaw'u güncel tutma
- [Başlarken](/tr/start/getting-started) - kurulumdan sonraki ilk adımlar
