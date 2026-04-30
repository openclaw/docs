---
read_when:
    - '`openclaw.ai/install.sh` konusunu anlamak istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / başsız)
    - GitHub checkout'undan kurulum yapmak istiyorsunuz
summary: Yükleyici betiklerinin nasıl çalıştığı (install.sh, install-cli.sh, install.ps1), bayraklar ve otomasyon
title: Yükleyici iç yapısı
x-i18n:
    generated_at: "2026-04-30T09:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç kurulum betiğiyle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                              |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git üzerinden kurar ve ilk kurulumu çalıştırabilir.             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'ı npm veya git checkout modlarıyla yerel bir öneke (`~/.openclaw`) kurar. Root gerekmez.              |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node kurar, OpenClaw'ı npm (varsayılan) veya git üzerinden kurar ve ilk kurulumu çalıştırabilir.             |

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
    macOS ve Linux'u (WSL dahil) destekler. macOS algılanırsa eksikse Homebrew kurar.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS'te Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). OpenClaw uyumluluk için Node 22 LTS'yi, şu anda `22.14+`, desteklemeye devam eder.
  </Step>
  <Step title="Git'i sağla">
    Eksikse Git kurar.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: depoyu clone/update eder, pnpm ile bağımlılıkları kurar, derler ve ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklenmiş bir Gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çabayla)
    - Uygun olduğunda ilk kurulumu dener (TTY mevcut, ilk kurulum devre dışı değil ve bootstrap/yapılandırma denetimleri başarılı)
    - `SHARP_IGNORE_GLOBAL_LIBVIPS=1` değerini varsayılan yapar

  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout'u (`package.json` + `pnpm-workspace.yaml`) içinde çalıştırılırsa betik şunları sunar:

- checkout kullan (`git`), veya
- global kurulum kullan (`npm`)

TTY yoksa ve kurulum yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanır ve uyarır.

Betik, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

### Örnekler (install.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="İlk kurulumu atla">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git kurulumu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="npm ile GitHub main">
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

| Flag                                  | Açıklama                                                        |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seçin (varsayılan: `npm`). Alias: `--method`   |
| `--npm`                               | npm yöntemi için kısayol                                         |
| `--git`                               | git yöntemi için kısayol. Alias: `--github`                      |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket belirtimi (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullan, yoksa `latest` değerine geri dön     |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Alias: `--dir`       |
| `--no-git-update`                     | Mevcut checkout için `git pull` atla                             |
| `--no-prompt`                         | İstemleri devre dışı bırak                                       |
| `--no-onboard`                        | İlk kurulumu atla                                                |
| `--onboard`                           | İlk kurulumu etkinleştir                                         |
| `--dry-run`                           | Değişiklikleri uygulamadan eylemleri yazdır                      |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştir (`set -x`, npm notice düzeyi günlükleri) |
| `--help`                              | Kullanımı göster (`-h`)                                          |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                                | Açıklama                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket belirtimi     |
| `OPENCLAW_BETA=0\|1`                                    | Varsa beta kullan                             |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout dizini                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git güncellemelerini aç/kapat                 |
| `OPENCLAW_NO_PROMPT=1`                                  | İstemleri devre dışı bırak                    |
| `OPENCLAW_NO_ONBOARD=1`                                 | İlk kurulumu atla                             |
| `OPENCLAW_DRY_RUN=1`                                    | Dry run modu                                  |
| `OPENCLAW_VERBOSE=1`                                    | Hata ayıklama modu                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm günlük düzeyi                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips davranışını denetle (varsayılan: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir önek altında (varsayılan `~/.openclaw`) istediğiniz
ve sistem Node bağımlılığı istemediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını
ve ayrıca aynı önek akışı altında git-checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş desteklenen bir Node LTS tarball'ını (sürüm betiğe gömülüdür ve bağımsız olarak güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 doğrulaması yapar.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse Linux'ta apt/dnf/yum veya macOS'te Homebrew üzerinden kurmayı dener.
  </Step>
  <Step title="OpenClaw'ı önek altında kur">
    - `npm` yöntemi (varsayılan): npm ile önek altında kurar, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout'u clone/update eder (varsayılan `~/openclaw`) ve sarmalayıcıyı yine `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklenmiş Gateway hizmetini yenile">
    Bir Gateway hizmeti zaten aynı önekten yüklenmişse betik
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    Gateway sağlığını en iyi çabayla yoklar.
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
  <Tab title="İlk kurulumu çalıştır">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag başvurusu">

| Flag                        | Açıklama                                                                     |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | Kurulum öneki (varsayılan: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Kurulum yöntemini seçin (varsayılan: `npm`). Alias: `--method`               |
| `--npm`                     | npm yöntemi için kısayol                                                     |
| `--git`, `--github`         | git yöntemi için kısayol                                                     |
| `--git-dir <path>`          | Git checkout dizini (varsayılan: `~/openclaw`). Alias: `--dir`               |
| `--version <ver>`           | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                         |
| `--node-version <ver>`      | Node sürümü (varsayılan: `22.22.0`)                                          |
| `--json`                    | NDJSON olayları yay                                                          |
| `--onboard`                 | Kurulumdan sonra `openclaw onboard` çalıştır                                 |
| `--no-onboard`              | İlk kurulumu atla (varsayılan)                                               |
| `--set-npm-prefix`          | Linux'ta geçerli önek yazılabilir değilse npm önekini `~/.npm-global` olarak zorla |
| `--help`                    | Kullanımı göster (`-h`)                                                      |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                   | Açıklama                                      |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                               |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | git kurulumları için Git checkout dizini      |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut checkout'lar için git güncellemelerini aç/kapat |
| `OPENCLAW_NO_ONBOARD=1`                     | İlk kurulumu atla                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                             |
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
    Eksikse önce winget, ardından Chocolatey, ardından Scoop ile kurmayı dener. Node 22 LTS, şu anda `22.14+`, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'u kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak genel npm kurulumu
    - `git` yöntemi: depoyu klonla/güncelle, pnpm ile kur/derle ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kur

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklü bir gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çaba)

  </Step>
  <Step title="Hataları işle">
    `iwr ... | iex` ve scriptblock kurulumları, geçerli PowerShell oturumunu kapatmadan sonlandırıcı bir hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları otomasyon için yine sıfır olmayan kodla çıkar.
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
  <Tab title="Kuru çalıştırma">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Hata ayıklama izlemesi">
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
| `-Tag <tag\|version\|spec>` | npm dist-tag'i, sürüm veya paket tanımı (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | İlk kurulumu atla                                          |
| `-NoGitUpdate`              | `git pull` komutunu atla                                   |
| `-DryRun`                   | Yalnızca eylemleri yazdır                                  |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                           | Açıklama          |
| ---------------------------------- | ----------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi   |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout dizini   |
| `OPENCLAW_NO_ONBOARD=1`            | İlk kurulumu atla |
| `OPENCLAW_GIT_UPDATE=0`            | git pull'u devre dışı bırak |
| `OPENCLAW_DRY_RUN=1`               | Kuru çalıştırma modu |

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
    Bazı Linux kurulumları npm genel önekini root'a ait yollara işaret eder. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve PATH dışa aktarımlarını shell rc dosyalarına ekleyebilir (bu dosyalar varsa).
  </Accordion>

  <Accordion title="sharp/libvips sorunları">
    Betikler, sharp'ın sistem libvips'e karşı derlenmesini önlemek için varsayılan olarak `SHARP_IGNORE_GLOBAL_LIBVIPS=1` kullanır. Geçersiz kılmak için:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows'u kurun, PowerShell'i yeniden açın, kurucuyu tekrar çalıştırın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez), ardından PowerShell'i yeniden açın.
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

  <Accordion title="kurulumdan sonra openclaw bulunamıyor">
    Genellikle bir PATH sorunudur. Bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
