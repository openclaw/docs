---
read_when:
    - '`openclaw.ai/install.sh` konusunu anlamak istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / arayüzsüz)
    - Bir GitHub checkout'undan kurulum yapmak istiyorsunuz
summary: Kurulum betiklerinin nasıl çalıştığı (install.sh, install-cli.sh, install.ps1), bayraklar ve otomasyon
title: Yükleyicinin iç işleyişi
x-i18n:
    generated_at: "2026-05-07T13:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici betiğiyle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                              |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerektiğinde Node kurar, OpenClaw’ı npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.          |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw’ı npm veya git checkout modlarıyla yerel bir öneke (`~/.openclaw`) kurar. Root gerekmez.             |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerektiğinde Node kurar, OpenClaw’ı npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.          |

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
Kurulum başarılı olur ancak yeni bir terminalde `openclaw` bulunamazsa [Node.js sorun giderme](/tr/install/node#troubleshooting) bölümüne bakın.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL üzerindeki çoğu etkileşimli kurulum için önerilir.
</Tip>

### Akış (install.sh)

<Steps>
  <Step title="Detect OS">
    macOS ve Linux’u (WSL dahil) destekler. macOS algılanırsa ve Homebrew eksikse Homebrew kurar.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS’ta Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). OpenClaw uyumluluk için hâlâ şu anda `22.16+` olan Node 22 LTS’yi destekler.
  </Step>
  <Step title="Ensure Git">
    Eksikse Git kurar.
  </Step>
  <Step title="Install OpenClaw">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: repoyu klonlar/günceller, bağımlılıkları pnpm ile kurar, derler, ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kurar

  </Step>
  <Step title="Post-install tasks">
    - Yüklü bir Gateway servisini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çaba)
    - Uygun olduğunda onboarding yapmayı dener (TTY mevcutsa, onboarding devre dışı değilse ve bootstrap/config denetimleri geçerse)
    - `SHARP_IGNORE_GLOBAL_LIBVIPS=1` varsayılanını kullanır

  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout içinde çalıştırılırsa (`package.json` + `pnpm-workspace.yaml`), betik şunları sunar:

- checkout kullan (`git`), veya
- global kurulum kullan (`npm`)

TTY yoksa ve kurulum yöntemi ayarlanmamışsa, varsayılan olarak `npm` kullanır ve uyarır.

Betik, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

### Örnekler (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
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
  <Accordion title="Flags reference">

| Bayrak                                | Açıklama                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seçer (varsayılan: `npm`). Takma ad: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                  |
| `--git`                               | git yöntemi için kısayol. Takma ad: `--github`             |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket belirtimi (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullanır, yoksa `latest` değerine geri döner |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir` |
| `--no-git-update`                     | Mevcut checkout için `git pull` atlar                      |
| `--no-prompt`                         | İstemleri devre dışı bırakır                               |
| `--no-onboard`                        | Onboarding’i atlar                                         |
| `--onboard`                           | Onboarding’i etkinleştirir                                 |
| `--dry-run`                           | Değişiklik uygulamadan eylemleri yazdırır                  |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştirir (`set -x`, npm notice-level günlükleri) |
| `--help`                              | Kullanımı gösterir (`-h`)                                  |

  </Accordion>

  <Accordion title="Environment variables reference">

| Değişken                                                | Açıklama                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket belirtimi     |
| `OPENCLAW_BETA=0\|1`                                    | Varsa beta kullan                             |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout dizini                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git güncellemelerini aç/kapat                 |
| `OPENCLAW_NO_PROMPT=1`                                  | İstemleri devre dışı bırak                    |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding’i atla                             |
| `OPENCLAW_DRY_RUN=1`                                    | Kuru çalıştırma modu                          |
| `OPENCLAW_VERBOSE=1`                                    | Hata ayıklama modu                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm günlük düzeyi                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips davranışını denetler (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir önek altında (varsayılan `~/.openclaw`) ve sistem Node bağımlılığı olmadan istediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını, ayrıca aynı önek akışı altında git-checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Sabitlenmiş desteklenen bir Node LTS tarball dosyasını (sürüm betiğe gömülüdür ve bağımsız olarak güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 doğrular.
  </Step>
  <Step title="Ensure Git">
    Git eksikse, Linux’ta apt/dnf/yum veya macOS’ta Homebrew üzerinden kurmayı dener.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` yöntemi (varsayılan): önek altına npm ile kurar, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout’u klonlar/günceller (varsayılan `~/openclaw`) ve yine sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Refresh loaded gateway service">
    Bir Gateway servisi aynı önekten zaten yüklenmişse, betik
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    Gateway sağlığını en iyi çabayla yoklar.
  </Step>
</Steps>

### Örnekler (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Bayrak                      | Açıklama                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum öneki (varsayılan: `~/.openclaw`)                                       |
| `--install-method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`). Takma ad: `--method`               |
| `--npm`                     | npm yöntemi için kısayol                                                        |
| `--git`, `--github`         | git yöntemi için kısayol                                                        |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir`               |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                            |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                             |
| `--json`                    | NDJSON olayları yayar                                                           |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştırır                                  |
| `--no-onboard`              | Onboarding’i atlar (varsayılan)                                                 |
| `--set-npm-prefix`          | Linux’ta, geçerli önek yazılabilir değilse npm önekini `~/.npm-global` olmaya zorlar |
| `--help`                    | Kullanımı gösterir (`-h`)                                                       |

  </Accordion>

  <Accordion title="Environment variables reference">

| Değişken                                    | Açıklama                                      |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Git kurulumları için Git checkout dizini      |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut checkout'lar için git güncellemelerini aç/kapat |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding'i atla                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips davranışını denetle (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Akış (install.ps1)

<Steps>
  <Step title="PowerShell + Windows ortamını doğrula">
    PowerShell 5+ gerektirir.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü doğrula">
    Eksikse winget, ardından Chocolatey, ardından Scoop üzerinden kurmayı dener. Node 22 LTS, şu anda `22.16+`, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak global npm kurulumu; `C:\` gibi korumalı klasörlerde açılan kabukların da çalışması için yazılabilir bir yükleyici geçici dizininden başlatılır
    - `git` yöntemi: repoyu klonlar/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklü bir Gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çabayla)

  </Step>
  <Step title="Hataları işle">
    `iwr ... | iex` ve scriptblock kurulumları, geçerli PowerShell oturumunu kapatmadan sonlandırıcı hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları otomasyon için yine sıfır olmayan kodla çıkar.
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
  <Tab title="Deneme çalıştırması">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Hata ayıklama izi">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                      | Açıklama                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket belirtimi (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Onboarding'i atla                                          |
| `-NoGitUpdate`              | `git pull` işlemini atla                                   |
| `-DryRun`                   | Yalnızca eylemleri yazdır                                  |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                           | Açıklama            |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi     |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout dizini     |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding'i atla   |
| `OPENCLAW_GIT_UPDATE=0`            | git pull'u devre dışı bırak |
| `OPENCLAW_DRY_RUN=1`               | Deneme çalıştırması modu |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse, betik çıkar ve Git for Windows bağlantısını yazdırır.
</Note>

---

## CI ve otomasyon

Öngörülebilir çalıştırmalar için etkileşimsiz bayraklar/ortam değişkenleri kullanın.

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
  <Accordion title="Git neden gerekli?">
    Git, `git` kurulum yöntemi için gereklidir. `npm` kurulumlarında, bağımlılıklar git URL'leri kullandığında `spawn git ENOENT` hatalarını önlemek için Git yine de denetlenir/kurulur.
  </Accordion>

  <Accordion title="npm Linux'ta neden EACCES'e takılıyor?">
    Bazı Linux kurulumları npm global önekini root'a ait yollara yönlendirir. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve PATH dışa aktarımlarını kabuk rc dosyalarına ekleyebilir (bu dosyalar mevcut olduğunda).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı derlenmesini önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` kullanır. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows'ı kurun, PowerShell'i yeniden açın, yükleyiciyi yeniden çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı yükleyici çıktısı nasıl alınır">
    `install.ps1` şu anda bir `-Verbose` anahtarı sunmaz.
    Betik düzeyi tanılamalar için PowerShell izlemeyi kullanın:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="kurulumdan sonra openclaw bulunamadı">
    Genellikle bir PATH sorunudur. Bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
