---
read_when:
    - '`openclaw.ai/install.sh`'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / başsız)
    - Bir GitHub checkout'tan kurulum yapmak istiyorsunuz
summary: Kurucu betiklerinin nasıl çalıştığı (`install.sh`, `install-cli.sh`, `install.ps1`), bayraklar ve otomasyon
title: Kurucu iç yapısı
x-i18n:
    generated_at: "2026-04-24T09:16:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç kurucu betiğiyle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                       |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve ilk kullanım akışını çalıştırabilir. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'ı yerel bir önek (`~/.openclaw`) içine npm veya git checkout modlarıyla kurar. Root gerekmez. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve ilk kullanım akışını çalıştırabilir. |

## Hızlı komutlar

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Kurulum başarılı olduğu hâlde yeni bir terminalde `openclaw` bulunamıyorsa bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL üzerinde çoğu etkileşimli kurulum için önerilir.
</Tip>

### Akış (install.sh)

<Steps>
  <Step title="İşletim sistemini algıla">
    macOS ve Linux'u (WSL dahil) destekler. macOS algılanırsa Homebrew yoksa kurar.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS'ta Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). OpenClaw, uyumluluk için şu anda `22.14+` olmak üzere Node 22 LTS'yi de desteklemeye devam eder.
  </Step>
  <Step title="Git'i sağla">
    Git yoksa kurar.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: depoyu clone eder/günceller, bağımlılıkları `pnpm` ile kurar, derler, ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kurar
  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklü bir gateway hizmetini mümkün olduğunca yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (best effort)
    - Uygun olduğunda ilk kullanım akışını başlatmayı dener (TTY mevcutsa, ilk kullanım devre dışı bırakılmamışsa ve bootstrap/yapılandırma denetimleri geçiyorsa)
    - Varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar
  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout içinde çalıştırılırsa (`package.json` + `pnpm-workspace.yaml`), betik şu seçenekleri sunar:

- checkout'u kullan (`git`) veya
- global kurulumu kullan (`npm`)

TTY yoksa ve hiçbir kurulum yöntemi ayarlanmamışsa, varsayılan olarak `npm` kullanır ve bir uyarı verir.

Betik, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

### Örnekler (install.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="İlk kullanım akışını atla">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git kurulumu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="npm üzerinden GitHub main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                                | Açıklama                                                         |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seçer (varsayılan: `npm`). Takma ad: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                         |
| `--git`                               | git yöntemi için kısayol. Takma ad: `--github`                   |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket belirtimi (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullanır, yoksa `latest` etiketine döner     |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir`    |
| `--no-git-update`                     | Mevcut checkout için `git pull` işlemini atlar                   |
| `--no-prompt`                         | İstemleri devre dışı bırakır                                     |
| `--no-onboard`                        | İlk kullanım akışını atlar                                       |
| `--onboard`                           | İlk kullanım akışını etkinleştirir                               |
| `--dry-run`                           | Değişiklik uygulamadan eylemleri yazdırır                        |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştirir (`set -x`, npm notice düzeyi günlükler) |
| `--help`                              | Kullanımı gösterir (`-h`)                                        |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                               | Açıklama                                  |
| ------------------------------------------------------ | ----------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Kurulum yöntemi                           |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket belirtimi |
| `OPENCLAW_BETA=0\|1`                                   | Varsa beta kullanır                       |
| `OPENCLAW_GIT_DIR=<path>`                              | Checkout dizini                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | git güncellemelerini açar/kapatır         |
| `OPENCLAW_NO_PROMPT=1`                                 | İstemleri devre dışı bırakır              |
| `OPENCLAW_NO_ONBOARD=1`                                | İlk kullanım akışını atlar                |
| `OPENCLAW_DRY_RUN=1`                                   | Dry run modu                              |
| `OPENCLAW_VERBOSE=1`                                   | Hata ayıklama modu                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | npm günlük düzeyi                         |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | sharp/libvips davranışını kontrol eder (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyin yerel bir önek altında
(varsayılan `~/.openclaw`) olmasını ve sistem Node bağımlılığı olmamasını istediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını
destekler; ayrıca aynı önek akışı altında git checkout kurulumlarını da destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş, desteklenen bir Node LTS tarball sürümünü (sürüm betiğin içine gömülüdür ve bağımsız güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 doğrulaması yapar.
  </Step>
  <Step title="Git'i sağla">
    Git yoksa Linux'ta apt/dnf/yum veya macOS'ta Homebrew ile kurmayı dener.
  </Step>
  <Step title="OpenClaw'ı önek altına kur">
    - `npm` yöntemi (varsayılan): önek altına npm ile kurar, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout'u clone eder/günceller (varsayılan `~/openclaw`) ve yine sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
  </Step>
  <Step title="Yüklü gateway hizmetini yenile">
    Aynı önekten yüklenmiş bir gateway hizmeti zaten varsa betik
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    Gateway sağlığını mümkün olduğunca probe eder.
  </Step>
</Steps>

### Örnekler (install-cli.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Özel önek + sürüm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git kurulumu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Otomasyon JSON çıktısı">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="İlk kullanım akışını çalıştır">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                      | Açıklama                                                                          |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum öneki (varsayılan: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`). Takma ad: `--method`                 |
| `--npm`                     | npm yöntemi için kısayol                                                          |
| `--git`, `--github`         | git yöntemi için kısayol                                                          |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir`                 |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                              |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                               |
| `--json`                    | NDJSON olayları üretir                                                            |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştırır                                    |
| `--no-onboard`              | İlk kullanım akışını atlar (varsayılan)                                           |
| `--set-npm-prefix`          | Linux'ta, mevcut önek yazılabilir değilse npm önekini `~/.npm-global` olmaya zorlar |
| `--help`                    | Kullanımı gösterir (`-h`)                                                         |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                   | Açıklama                                  |
| ------------------------------------------ | ----------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Kurulum öneki                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`         | Kurulum yöntemi                           |
| `OPENCLAW_VERSION=<ver>`                   | OpenClaw sürümü veya dist-tag             |
| `OPENCLAW_NODE_VERSION=<ver>`              | Node sürümü                               |
| `OPENCLAW_GIT_DIR=<path>`                  | git kurulumları için Git checkout dizini  |
| `OPENCLAW_GIT_UPDATE=0\|1`                 | Mevcut checkout'lar için git güncellemelerini açar/kapatır |
| `OPENCLAW_NO_ONBOARD=1`                    | İlk kullanım akışını atlar                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                         |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | sharp/libvips davranışını kontrol eder (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Akış (install.ps1)

<Steps>
  <Step title="PowerShell + Windows ortamını sağla">
    PowerShell 5+ gerektirir.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Eksikse sırasıyla winget, sonra Chocolatey, sonra Scoop ile kurmayı dener. Uyumluluk için şu anda `22.14+` olmak üzere Node 22 LTS desteği sürmektedir.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak global npm kurulumu
    - `git` yöntemi: depoyu clone eder/günceller, `pnpm` ile kurulum/derleme yapar ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar
  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklü bir gateway hizmetini mümkün olduğunca yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (best effort)
  </Step>
</Steps>

### Örnekler (install.ps1)

<Tabs>
  <Tab title="Varsayılan">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git kurulumu">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="npm üzerinden GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Özel git dizini">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Hata ayıklama izi">
    ```powershell
    # install.ps1 henüz özel bir -Verbose bayrağına sahip değil.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                      | Açıklama                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                              |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket belirtimi (varsayılan: `latest`)  |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)           |
| `-NoOnboard`                | İlk kullanım akışını atlar                                       |
| `-NoGitUpdate`              | `git pull` işlemini atlar                                        |
| `-DryRun`                   | Yalnızca eylemleri yazdırır                                      |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                          | Açıklama        |
| --------------------------------- | --------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi |
| `OPENCLAW_GIT_DIR=<path>`         | Checkout dizini |
| `OPENCLAW_NO_ONBOARD=1`           | İlk kullanım akışını atlar |
| `OPENCLAW_GIT_UPDATE=0`           | git pull'u devre dışı bırakır |
| `OPENCLAW_DRY_RUN=1`              | Dry run modu    |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse betik çıkar ve Git for Windows bağlantısını yazdırır.
</Note>

---

## CI ve otomasyon

Öngörülebilir çalıştırmalar için etkileşimsiz bayrakları/ortam değişkenlerini kullanın.

<Tabs>
  <Tab title="install.sh (etkileşimsiz npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (etkileşimsiz git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ilk kullanım akışını atla)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Sorun giderme

<AccordionGroup>
  <Accordion title="Git neden gerekli?">
    Git, `git` kurulum yöntemi için gereklidir. `npm` kurulumlarında da bağımlılıklar git URL'leri kullandığında `spawn git ENOENT` hatalarını önlemek için Git yine denetlenir/kurulur.
  </Accordion>

  <Accordion title="npm Linux'ta neden EACCES alıyor?">
    Bazı Linux kurulumları npm global önekini root sahipli yolları gösterecek şekilde ayarlar. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve shell rc dosyalarına PATH dışa aktarmalarını ekleyebilir (bu dosyalar mevcutsa).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı derlenmesini önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows'u kurun, PowerShell'i yeniden açın, kurucuyu yeniden çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı kurucu çıktısı nasıl alınır">
    `install.ps1` şu anda bir `-Verbose` anahtarı sunmuyor.
    Betik düzeyi tanılama için PowerShell izlemeyi kullanın:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Kurulumdan sonra openclaw bulunamıyor">
    Genellikle bir PATH sorunudur. Bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
