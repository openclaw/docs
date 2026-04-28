---
read_when:
    - '`openclaw.ai/install.sh` anlamak istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / headless)
    - Bir GitHub checkout'undan kurulum yapmak istiyorsunuz
summary: Yükleyici betiklerin nasıl çalıştığı (`install.sh`, `install-cli.sh`, `install.ps1`), bayraklar ve otomasyon
title: Yükleyici iç yapısı
x-i18n:
    generated_at: "2026-04-26T11:34:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici betikle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                      |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve onboarding çalıştırabilir.          |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'ı yerel bir önek altına (`~/.openclaw`) npm veya git checkout modlarıyla kurar. Root gerekmez. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git ile kurar ve onboarding çalıştırabilir.          |

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
Kurulum başarılı olduysa ama yeni bir terminalde `openclaw` bulunamıyorsa bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
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
  <Step title="Varsayılan olarak Node.js 24 sağla">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS'ta Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). OpenClaw, uyumluluk için hâlâ Node 22 LTS'yi, şu anda `22.14+`, destekler.
  </Step>
  <Step title="Git'i sağla">
    Git yoksa kurar.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): genel npm kurulumu
    - `git` yöntemi: depoyu clone/update eder, bağımlılıkları pnpm ile kurar, build alır, sonra `~/.local/bin/openclaw` konumuna wrapper kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklü bir gateway hizmetini best-effort olarak yeniler (`openclaw gateway install --force`, sonra restart)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (best effort)
    - Uygun olduğunda onboarding dener (TTY mevcut, onboarding devre dışı değil ve bootstrap/config denetimleri geçiyorsa)
    - Varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar

  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout'u içinde çalıştırılırsa (`package.json` + `pnpm-workspace.yaml`), betik şunları sunar:

- checkout'u kullan (`git`), veya
- genel kurulumu kullan (`npm`)

TTY yoksa ve hiçbir kurulum yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanır ve uyarı verir.

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
  <Accordion title="Bayraklar referansı">

| Bayrak                                | Açıklama                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seç (varsayılan: `npm`). Takma ad: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                 |
| `--git`                               | git yöntemi için kısayol. Takma ad: `--github`           |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket spec'i (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullan, yoksa `latest` değerine fallback yap |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir` |
| `--no-git-update`                     | Mevcut checkout için `git pull` atla                     |
| `--no-prompt`                         | İstemleri devre dışı bırak                               |
| `--no-onboard`                        | Onboarding'i atla                                        |
| `--onboard`                           | Onboarding'i etkinleştir                                 |
| `--dry-run`                           | Değişiklik uygulamadan eylemleri yazdır                  |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştir (`set -x`, npm notice düzeyi günlükler) |
| `--help`                              | Kullanımı göster (`-h`)                                  |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                                              | Açıklama                                  |
| ----------------------------------------------------- | ----------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                    | Kurulum yöntemi                           |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket spec'i    |
| `OPENCLAW_BETA=0\|1`                                  | Varsa beta kullan                         |
| `OPENCLAW_GIT_DIR=<path>`                             | Checkout dizini                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                            | Git güncellemelerini aç/kapat             |
| `OPENCLAW_NO_PROMPT=1`                                | İstemleri devre dışı bırak                |
| `OPENCLAW_NO_ONBOARD=1`                               | Onboarding'i atla                         |
| `OPENCLAW_DRY_RUN=1`                                  | Dry run modu                              |
| `OPENCLAW_VERBOSE=1`                                  | Hata ayıklama modu                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`           | npm günlük düzeyi                         |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                    | sharp/libvips davranışını denetle (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir önek altında
(varsayılan `~/.openclaw`) ve sistem Node bağımlılığı olmadan istediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını,
ayrıca aynı önek akışı altında git checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş desteklenen bir Node LTS tarball'ını (sürüm betik içine gömülüdür ve bağımsız güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 doğrulaması yapar.
  </Step>
  <Step title="Git'i sağla">
    Git yoksa Linux'ta apt/dnf/yum veya macOS'ta Homebrew üzerinden kurmayı dener.
  </Step>
  <Step title="OpenClaw'ı önek altına kur">
    - `npm` yöntemi (varsayılan): önek altına npm ile kurar, sonra wrapper'ı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout'u clone/update eder (varsayılan `~/openclaw`) ve yine wrapper'ı `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklü gateway hizmetini yenile">
    Aynı önekten yüklenmiş bir gateway hizmeti zaten varsa, betik
    `openclaw gateway install --force`, sonra `openclaw gateway restart` çalıştırır ve
    gateway sağlığını best-effort olarak probe eder.
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
  <Accordion title="Bayraklar referansı">

| Bayrak                      | Açıklama                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum öneki (varsayılan: `~/.openclaw`)                                     |
| `--install-method npm\|git` | Kurulum yöntemini seç (varsayılan: `npm`). Takma ad: `--method`               |
| `--npm`                     | npm yöntemi için kısayol                                                      |
| `--git`, `--github`         | git yöntemi için kısayol                                                      |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Takma ad: `--dir`             |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                          |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                           |
| `--json`                    | NDJSON olayları yayar                                                         |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştır                                  |
| `--no-onboard`              | Onboarding'i atla (varsayılan)                                                |
| `--set-npm-prefix`          | Linux'ta, geçerli önek yazılabilir değilse npm önekini `~/.npm-global` olarak zorla |
| `--help`                    | Kullanımı göster (`-h`)                                                       |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                                  | Açıklama                                   |
| ----------------------------------------- | ------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                  | Kurulum öneki                              |
| `OPENCLAW_INSTALL_METHOD=git\|npm`        | Kurulum yöntemi                            |
| `OPENCLAW_VERSION=<ver>`                  | OpenClaw sürümü veya dist-tag              |
| `OPENCLAW_NODE_VERSION=<ver>`             | Node sürümü                                |
| `OPENCLAW_GIT_DIR=<path>`                 | Git kurulumları için checkout dizini       |
| `OPENCLAW_GIT_UPDATE=0\|1`                | Mevcut checkout'lar için git güncellemelerini aç/kapat |
| `OPENCLAW_NO_ONBOARD=1`                   | Onboarding'i atla                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                          |
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
  <Step title="Varsayılan olarak Node.js 24 sağla">
    Eksikse önce winget, sonra Chocolatey, sonra Scoop üzerinden kurmayı dener. Node 22 LTS, şu anda `22.14+`, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): seçili `-Tag` kullanılarak genel npm kurulumu
    - `git` yöntemi: depoyu clone/update eder, pnpm ile kurulum/build yapar ve wrapper'ı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklü bir gateway hizmetini best-effort olarak yeniler (`openclaw gateway install --force`, sonra restart)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (best effort)

  </Step>
  <Step title="Hataları işle">
    `iwr ... | iex` ve scriptblock kurulumları, mevcut PowerShell oturumunu kapatmadan sonlandırıcı hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları ise otomasyon için yine sıfır olmayan kodla çıkar.
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
  <Accordion title="Bayraklar referansı">

| Bayrak                      | Açıklama                                                 |
| --------------------------- | -------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket spec'i (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)   |
| `-NoOnboard`                | Onboarding'i atla                                        |
| `-NoGitUpdate`              | `git pull` atla                                          |
| `-DryRun`                   | Yalnızca eylemleri yazdır                                |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                         | Açıklama         |
| -------------------------------- | ---------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi  |
| `OPENCLAW_GIT_DIR=<path>`        | Checkout dizini  |
| `OPENCLAW_NO_ONBOARD=1`          | Onboarding'i atla |
| `OPENCLAW_GIT_UPDATE=0`          | Git pull'u devre dışı bırak |
| `OPENCLAW_DRY_RUN=1`             | Dry run modu     |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse betik çıkar ve Git for Windows bağlantısını yazdırır.
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
    `git` kurulum yöntemi için Git gereklidir. `npm` kurulumlarında bile, bağımlılıklar git URL'leri kullandığında `spawn git ENOENT` hatalarını önlemek için Git yine de denetlenir/kurulur.
  </Accordion>

  <Accordion title="Linux'ta npm neden EACCES hatasına çarpıyor?">
    Bazı Linux kurulumlarında npm genel öneki root sahibi yolları işaret eder. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve kabuk rc dosyalarına PATH dışa aktarımları ekleyebilir (bu dosyalar varsa).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı build almasını önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` ayarlar. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows'u kurun, PowerShell'i yeniden açın, yükleyiciyi yeniden çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez), sonra PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı yükleyici çıktısı nasıl alınır">
    `install.ps1` şu anda bir `-Verbose` anahtarı sunmuyor.
    Betik düzeyinde tanılama için PowerShell izlemeyi kullanın:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Kurulumdan sonra openclaw bulunamadı">
    Genellikle bir PATH sorunudur. Bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
