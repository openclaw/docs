---
read_when:
    - '`openclaw.ai/install.sh` hakkında bilgi edinmek istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / arayüzsüz)
    - GitHub çalışma kopyasından kurulum yapmak istiyorsunuz
summary: Kurulum betiklerinin nasıl çalıştığı (install.sh, install-cli.sh, install.ps1), bayraklar ve otomasyon
title: Yükleyicinin iç işleyişi
x-i18n:
    generated_at: "2026-05-02T08:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici script ile gelir.

| Script                             | Platform             | Ne yapar                                                                                                               |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node'u kurar, OpenClaw'u npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'u npm veya git checkout modlarıyla yerel bir prefix'e (`~/.openclaw`) kurar. Root gerekmez.            |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node'u kurar, OpenClaw'u npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.             |

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
  <Step title="İşletim sistemini algıla">
    macOS ve Linux'u (WSL dahil) destekler. macOS algılanırsa, eksikse Homebrew'u kurar.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü kontrol eder ve gerekirse Node 24'ü kurar (macOS'ta Homebrew, Linux apt/dnf/yum'da NodeSource kurulum script'leri). OpenClaw uyumluluk için hâlâ şu anda `22.14+` olan Node 22 LTS'yi destekler.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse kurar.
  </Step>
  <Step title="OpenClaw'u kur">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: repo'yu clone/update eder, bağımlılıkları pnpm ile kurar, build eder, ardından wrapper'ı `~/.local/bin/openclaw` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklenmiş Gateway servisini elden geldiğince yeniler (`openclaw gateway install --force`, ardından restart)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (elden geldiğince)
    - Uygun olduğunda onboarding'i dener (TTY kullanılabilir, onboarding devre dışı değil ve bootstrap/config kontrolleri geçer)
    - Varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar

  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout'u içinde çalıştırılırsa (`package.json` + `pnpm-workspace.yaml`), script şunları sunar:

- checkout kullan (`git`), veya
- global kurulumu kullan (`npm`)

TTY yoksa ve kurulum yöntemi ayarlanmamışsa, varsayılan olarak `npm` kullanır ve uyarır.

Script, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

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
  <Accordion title="Flag başvurusu">

| Flag                                  | Açıklama                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seçer (varsayılan: `npm`). Alias: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                  |
| `--git`                               | git yöntemi için kısayol. Alias: `--github`               |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket spec'i (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag'i kullanır, yoksa `latest`'a döner    |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Mevcut checkout için `git pull` işlemini atlar            |
| `--no-prompt`                         | Prompt'ları devre dışı bırakır                            |
| `--no-onboard`                        | Onboarding'i atlar                                        |
| `--onboard`                           | Onboarding'i etkinleştirir                                |
| `--dry-run`                           | Değişiklikleri uygulamadan işlemleri yazdırır             |
| `--verbose`                           | Debug çıktısını etkinleştirir (`set -x`, npm notice-level günlükleri) |
| `--help`                              | Kullanımı gösterir (`-h`)                                 |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                                | Açıklama                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket spec'i        |
| `OPENCLAW_BETA=0\|1`                                    | Varsa beta'yı kullan                          |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout dizini                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git güncellemelerini aç/kapat                 |
| `OPENCLAW_NO_PROMPT=1`                                  | Prompt'ları devre dışı bırak                  |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding'i atla                             |
| `OPENCLAW_DRY_RUN=1`                                    | Dry run modu                                  |
| `OPENCLAW_VERBOSE=1`                                    | Debug modu                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm günlük seviyesi                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips davranışını kontrol eder (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir prefix altında (varsayılan `~/.openclaw`) istediğiniz ve sistem Node bağımlılığı istemediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını, ayrıca aynı prefix akışı altında git-checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node runtime'ı kur">
    Sabitlenmiş, desteklenen bir Node LTS tarball'unu (sürüm script'e gömülüdür ve bağımsız olarak güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 ile doğrular.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse, Linux'ta apt/dnf/yum veya macOS'ta Homebrew üzerinden kurmayı dener.
  </Step>
  <Step title="OpenClaw'u prefix altında kur">
    - `npm` yöntemi (varsayılan): npm ile prefix altına kurar, ardından wrapper'ı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout'u clone/update eder (varsayılan `~/openclaw`) ve yine wrapper'ı `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklenmiş Gateway servisini yenile">
    Bir Gateway servisi zaten aynı prefix'ten yüklenmişse, script
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    Gateway sağlığını elden geldiğince yoklar.
  </Step>
</Steps>

### Örnekler (install-cli.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Özel prefix + sürüm">
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
  <Accordion title="Flag başvurusu">

| Flag                        | Açıklama                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum prefix'i (varsayılan: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`). Alias: `--method`                  |
| `--npm`                     | npm yöntemi için kısayol                                                        |
| `--git`, `--github`         | git yöntemi için kısayol                                                        |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                            |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                             |
| `--json`                    | NDJSON olayları yayar                                                           |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştırır                                  |
| `--no-onboard`              | Onboarding'i atlar (varsayılan)                                                 |
| `--set-npm-prefix`          | Linux'ta, mevcut prefix yazılabilir değilse npm prefix'ini `~/.npm-global` olarak zorlar |
| `--help`                    | Kullanımı gösterir (`-h`)                                                       |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                    | Açıklama                                      |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Git kurulumları için Git checkout dizini      |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut checkout'lar için git güncellemelerini aç/kapat |
| `OPENCLAW_NO_ONBOARD=1`                     | İlk kurulumu atla                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük seviyesi                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips davranışını denetle (varsayılan: `1`) |

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
    Eksikse, winget, ardından Chocolatey, ardından Scoop aracılığıyla kurmayı dener. Node 22 LTS, şu anda `22.14+`, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'u kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak global npm kurulumu; `C:\` gibi korumalı klasörlerde açılan kabukların da çalışması için yazılabilir bir geçici kurulum dizininden başlatılır
    - `git` yöntemi: repoyu klonlar/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklenmiş Gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çaba)

  </Step>
  <Step title="Hataları ele al">
    `iwr ... | iex` ve scriptblock kurulumları, geçerli PowerShell oturumunu kapatmadan sonlandırıcı bir hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları otomasyon için yine de sıfır olmayan kodla çıkar.
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
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket tanımı (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | İlk kurulumu atla                                          |
| `-NoGitUpdate`              | `git pull` komutunu atla                                   |
| `-DryRun`                   | Yalnızca eylemleri yazdır                                  |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                           | Açıklama              |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi       |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout dizini       |
| `OPENCLAW_NO_ONBOARD=1`            | İlk kurulumu atla     |
| `OPENCLAW_GIT_UPDATE=0`            | git pull'u devre dışı bırak |
| `OPENCLAW_DRY_RUN=1`               | Deneme çalıştırması modu |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse, betik çıkar ve Git for Windows bağlantısını yazdırır.
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
  <Tab title="install.ps1 (ilk kurulumu atla)">
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

  <Accordion title="npm Linux'ta neden EACCES ile karşılaşıyor?">
    Bazı Linux kurulumları npm global önekini root'a ait yollara yönlendirir. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve PATH export'larını kabuk rc dosyalarına ekleyebilir (bu dosyalar varsa).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı derlenmesini önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` kullanır. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows'u kurun, PowerShell'i yeniden açın, kurucuyu yeniden çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı kurucu çıktısı nasıl alınır">
    `install.ps1` şu anda bir `-Verbose` anahtarı sunmaz.
    Betik düzeyi tanılama için PowerShell izlemeyi kullanın:

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

- [Kurulum özeti](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
