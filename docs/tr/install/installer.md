---
read_when:
    - '`openclaw.ai/install.sh` komutunu anlamak istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / headless)
    - Bir GitHub checkout'undan kurulum yapmak istiyorsunuz
summary: Yükleyici betiklerinin nasıl çalıştığı (`install.sh`, `install-cli.sh`, `install.ps1`), bayraklar ve otomasyon
title: Yükleyici İç Yapısı
x-i18n:
    generated_at: "2026-04-05T13:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: eced891572b8825b1f8a26ccc9d105ae8a38bd8ad89baef2f1927e27d4619e04
    source_path: install/installer.md
    workflow: 15
---

# Yükleyici iç yapısı

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici betiğiyle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                         |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve onboarding çalıştırabilir.             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'ı yerel bir öneke (`~/.openclaw`) npm veya git checkout modlarıyla kurar. root gerekmez.      |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve onboarding çalıştırabilir.             |

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
Kurulum başarılı olduğu hâlde yeni bir terminalde `openclaw` bulunamıyorsa bkz. [Node.js troubleshooting](/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL üzerindeki çoğu etkileşimli kurulum için önerilir.
</Tip>

### Akış (install.sh)

<Steps>
  <Step title="İşletim sistemini algıla">
    macOS ve Linux'u (WSL dahil) destekler. macOS algılanırsa Homebrew eksikse kurar.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS'ta Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). OpenClaw uyumluluk için şu anda `22.14+` olan Node 22 LTS sürümünü de desteklemeye devam eder.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse kurar.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: depoyu clone eder/günceller, bağımlılıkları pnpm ile kurar, derler, ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kurar
  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklenmiş bir gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, sonra yeniden başlatır)
    - Yükseltmelerde ve git kurulumlarında en iyi çabayla `openclaw doctor --non-interactive` çalıştırır
    - Uygun olduğunda onboarding denemesi yapar (TTY mevcutsa, onboarding devre dışı değilse ve bootstrap/config denetimleri geçiyorsa)
    - Varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar
  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout'u içinde çalıştırılırsa (`package.json` + `pnpm-workspace.yaml`), betik şunları sunar:

- checkout'u kullan (`git`) veya
- global kurulumu kullan (`npm`)

TTY yoksa ve kurulum yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanır ve uyarı verir.

Betik, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

### Örnekler (install.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Onboarding'i atla">
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

| Bayrak                                | Açıklama                                                     |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | Kurulum yöntemini seçin (varsayılan: `npm`). Takma ad: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                     |
| `--git`                               | git yöntemi için kısayol. Takma ad: `--github`              |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket belirtimi (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullan, yoksa `latest` değerine geri dön |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir` |
| `--no-git-update`                     | Mevcut checkout için `git pull` komutunu atla               |
| `--no-prompt`                         | İstemleri devre dışı bırak                                   |
| `--no-onboard`                        | Onboarding'i atla                                            |
| `--onboard`                           | Onboarding'i etkinleştir                                     |
| `--dry-run`                           | Değişiklikleri uygulamadan eylemleri yazdır                 |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştir (`set -x`, npm notice düzeyi günlükler) |
| `--help`                              | Kullanımı göster (`-h`)                                      |

  </Accordion>

  <Accordion title="Ortam değişkeni başvurusu">

| Değişken                                               | Açıklama                                     |
| ------------------------------------------------------ | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Kurulum yöntemi                              |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket belirtimi    |
| `OPENCLAW_BETA=0\|1`                                   | Varsa beta kullan                            |
| `OPENCLAW_GIT_DIR=<path>`                              | Checkout dizini                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Git güncellemelerini aç/kapat                |
| `OPENCLAW_NO_PROMPT=1`                                 | İstemleri devre dışı bırak                   |
| `OPENCLAW_NO_ONBOARD=1`                                | Onboarding'i atla                            |
| `OPENCLAW_DRY_RUN=1`                                   | Dry run modu                                 |
| `OPENCLAW_VERBOSE=1`                                   | Hata ayıklama modu                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | npm günlük düzeyi                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | sharp/libvips davranışını denetle (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir önek altında istediğiniz
(varsayılan `~/.openclaw`) ve sistem Node bağımlılığı istemediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını, ayrıca aynı önek akışı altında git checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş desteklenen bir Node LTS tarball sürümünü (`<prefix>/tools/node-v<version>` konumuna) indirir (sürüm betiğin içine gömülüdür ve bağımsız güncellenir) ve SHA-256 doğrular.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse Linux'ta apt/dnf/yum veya macOS'ta Homebrew üzerinden kurmaya çalışır.
  </Step>
  <Step title="OpenClaw'ı önek altında kur">
    - `npm` yöntemi (varsayılan): önek altında npm ile kurar, sonra sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: checkout'u clone eder/günceller (varsayılan `~/openclaw`) ve yine sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
  </Step>
  <Step title="Yüklenmiş gateway hizmetini yenile">
    Aynı önekten yüklenmiş bir gateway hizmeti zaten varsa betik
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    gateway sağlığını en iyi çabayla probe eder.
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
  <Tab title="Onboarding'i çalıştır">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                      | Açıklama                                                                          |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum öneki (varsayılan: `~/.openclaw`)                                        |
| `--install-method npm\|git` | Kurulum yöntemini seçin (varsayılan: `npm`). Takma ad: `--method`                |
| `--npm`                     | npm yöntemi için kısayol                                                          |
| `--git`, `--github`         | git yöntemi için kısayol                                                          |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir`               |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                             |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                              |
| `--json`                    | NDJSON olayları üretir                                                            |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştırır                                   |
| `--no-onboard`              | Onboarding'i atla (varsayılan)                                                   |
| `--set-npm-prefix`          | Linux'ta, mevcut önek yazılabilir değilse npm önekini `~/.npm-global` olarak zorlar |
| `--help`                    | Kullanımı göster (`-h`)                                                          |

  </Accordion>

  <Accordion title="Ortam değişkeni başvurusu">

| Değişken                                  | Açıklama                                  |
| ----------------------------------------- | ----------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                  | Kurulum öneki                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`        | Kurulum yöntemi                           |
| `OPENCLAW_VERSION=<ver>`                  | OpenClaw sürümü veya dist-tag             |
| `OPENCLAW_NODE_VERSION=<ver>`             | Node sürümü                               |
| `OPENCLAW_GIT_DIR=<path>`                 | git kurulumları için Git checkout dizini  |
| `OPENCLAW_GIT_UPDATE=0\|1`                | Mevcut checkout'lar için Git güncellemelerini aç/kapat |
| `OPENCLAW_NO_ONBOARD=1`                   | Onboarding'i atla                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`        | sharp/libvips davranışını denetle (varsayılan: `1`) |

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
    Eksikse sırasıyla winget, sonra Chocolatey, sonra Scoop üzerinden kurmaya çalışır. Şu anda `22.14+` olan Node 22 LTS, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak global npm kurulumu
    - `git` yöntemi: depoyu clone eder/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar
  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklenmiş bir gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, sonra yeniden başlatır)
    - Yükseltmelerde ve git kurulumlarında en iyi çabayla `openclaw doctor --non-interactive` çalıştırır
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
    # install.ps1 için henüz özel bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                      | Açıklama                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                           |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket belirtimi (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | Onboarding'i atla                                              |
| `-NoGitUpdate`              | `git pull` komutunu atla                                       |
| `-DryRun`                   | Yalnızca eylemleri yazdır                                      |

  </Accordion>

  <Accordion title="Ortam değişkeni başvurusu">

| Değişken                         | Açıklama        |
| -------------------------------- | --------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi |
| `OPENCLAW_GIT_DIR=<path>`        | Checkout dizini |
| `OPENCLAW_NO_ONBOARD=1`          | Onboarding'i atla |
| `OPENCLAW_GIT_UPDATE=0`          | Git pull'u devre dışı bırak |
| `OPENCLAW_DRY_RUN=1`             | Dry run modu    |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılır ve Git eksikse betik çıkar ve Git for Windows bağlantısını yazdırır.
</Note>

---

## CI ve otomasyon

Öngörülebilir çalıştırmalar için etkileşimsiz bayraklar/env değişkenleri kullanın.

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
  <Tab title="install.ps1 (onboarding'i atla)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Sorun giderme

<AccordionGroup>
  <Accordion title="Git neden gerekiyor?">
    `git` kurulum yöntemi için Git gereklidir. `npm` kurulumlarında da, bağımlılıklar git URL'leri kullandığında `spawn git ENOENT` hatalarını önlemek için Git yine denetlenir/kurulur.
  </Accordion>

  <Accordion title="npm neden Linux'ta EACCES alıyor?">
    Bazı Linux kurulumları npm global önekini root'a ait yollara yönlendirir. `install.sh`, öneki `~/.npm-global` değerine çevirebilir ve PATH dışa aktarımlarını shell rc dosyalarına ekleyebilir (bu dosyalar varsa).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı derlenmesini önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows kurun, PowerShell'i yeniden açın, yükleyiciyi tekrar çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı yükleyici çıktısı nasıl alınır">
    `install.ps1` şu anda bir `-Verbose` anahtarı sunmuyor.
    Betik düzeyi tanılama için PowerShell izlemeyi kullanın:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Kurulumdan sonra openclaw bulunamıyor">
    Genellikle PATH sorunudur. Bkz. [Node.js troubleshooting](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
