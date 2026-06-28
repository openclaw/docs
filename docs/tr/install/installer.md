---
read_when:
    - '`openclaw.ai/install.sh` konusunu anlamak istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / arabirimsiz)
    - GitHub checkout'undan yüklemek istiyorsunuz
summary: Yükleyici betiklerin nasıl çalıştığı (install.sh, install-cli.sh, install.ps1), bayraklar ve otomasyon
title: Yükleyicinin iç işleyişi
x-i18n:
    generated_at: "2026-06-28T00:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici betiğiyle gelir.

| Betik                              | Platform             | Ne yapar                                                                                                          |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekirse Node kurar, OpenClaw'u npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.          |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'u npm veya git checkout modlarıyla yerel bir prefix içine (`~/.openclaw`) kurar. Root gerekmez.   |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekirse Node kurar, OpenClaw'u npm (varsayılan) veya git üzerinden kurar ve onboarding çalıştırabilir.          |

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
Kurulum başarılı olursa ancak yeni bir terminalde `openclaw` bulunamazsa [Node.js sorun giderme](/tr/install/node#troubleshooting) bölümüne bakın.
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
    macOS ve Linux'u (WSL dahil) destekler.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü denetler ve gerekirse Node 24 kurar (macOS'ta Homebrew, Linux apt/dnf/yum üzerinde NodeSource kurulum betikleri). macOS'ta Homebrew yalnızca yükleyicinin Node veya Git için ihtiyacı olduğunda kurulur. OpenClaw, uyumluluk için şu anda `22.19+` olan Node 22 LTS'yi desteklemeye devam eder.
    Alpine/musl Linux'ta yükleyici NodeSource yerine apk paketlerini kullanır; yapılandırılmış Alpine depoları Node `22.19+` sağlamalıdır (bu yazının yazıldığı sırada Alpine 3.21 veya daha yeni).
  </Step>
  <Step title="Git'i sağla">
    Git eksikse algılanan paket yöneticisini kullanarak kurar; buna macOS'ta Homebrew ve Alpine'da apk dahildir.
  </Step>
  <Step title="OpenClaw'u kur">
    - `npm` yöntemi (varsayılan): global npm kurulumu
    - `git` yöntemi: depoyu klonla/güncelle, bağımlılıkları pnpm ile kur, derle, ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kur

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Yüklü bir gateway servisini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çaba)
    - Uygun olduğunda onboarding yapmayı dener (TTY kullanılabilir, onboarding devre dışı değil ve bootstrap/config denetimleri geçiyor)

  </Step>
</Steps>

### Kaynak checkout algılama

Bir OpenClaw checkout'u (`package.json` + `pnpm-workspace.yaml`) içinde çalıştırılırsa betik şunları sunar:

- checkout kullan (`git`), veya
- global kurulumu kullan (`npm`)

TTY yoksa ve kurulum yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanır ve uyarır.

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
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Kuru çalıştırma">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayraklar başvurusu">

| Bayrak                                | Açıklama                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Kurulum yöntemini seç (varsayılan: `npm`). Alias: `--method` |
| `--npm`                               | npm yöntemi için kısayol                                  |
| `--git`                               | git yöntemi için kısayol. Alias: `--github`               |
| `--version <version\|dist-tag\|spec>` | npm sürümü, dist-tag veya paket spec'i (varsayılan: `latest`) |
| `--beta`                              | Varsa beta dist-tag kullan, yoksa `latest`'e geri dön      |
| `--git-dir <path>`                    | Checkout dizini (varsayılan: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Mevcut checkout için `git pull` işlemini atla              |
| `--no-prompt`                         | Promptları devre dışı bırak                                |
| `--no-onboard`                        | Onboarding'i atla                                          |
| `--onboard`                           | Onboarding'i etkinleştir                                   |
| `--dry-run`                           | Değişiklik uygulamadan eylemleri yazdır                    |
| `--verbose`                           | Hata ayıklama çıktısını etkinleştir (`set -x`, npm notice-level günlükleri) |
| `--help`                              | Kullanımı göster (`-h`)                                    |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                          | Açıklama                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Kurulum yöntemi                                                  |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm sürümü, dist-tag veya paket spec'i                           |
| `OPENCLAW_BETA=0\|1`                              | Varsa beta kullan                                                |
| `OPENCLAW_HOME=<path>`                            | OpenClaw durumu ve varsayılan git/onboarding yolları için temel dizin |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout dizini                                                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git güncellemelerini aç/kapat                                    |
| `OPENCLAW_NO_PROMPT=1`                            | Promptları devre dışı bırak                                      |
| `OPENCLAW_NO_ONBOARD=1`                           | Onboarding'i atla                                                |
| `OPENCLAW_DRY_RUN=1`                              | Kuru çalıştırma modu                                             |
| `OPENCLAW_VERBOSE=1`                              | Hata ayıklama modu                                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm günlük düzeyi                                                |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir prefix altında (varsayılan `~/.openclaw`) tutmak ve sistem Node bağımlılığı istemediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını, ayrıca aynı prefix akışı altında git-checkout kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş desteklenen bir Node LTS tarball'unu (sürüm betiğe gömülüdür ve bağımsız olarak güncellenir) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256'yı doğrular.
    Sabitlenmiş çalışma zamanı için Node'un uyumlu tarball yayımlamadığı Alpine/musl Linux'ta, `nodejs` ve `npm` paketlerini `apk` ile kurar ve bu çalışma zamanını prefix sarmalayıcı yoluna bağlar. Alpine depoları Node `22.19+` sağlamalıdır; eski depolar yalnızca Node 20 veya 21 sağlıyorsa Alpine 3.21 veya daha yeni bir sürüm kullanın.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse Linux'ta apt/dnf/yum/apk veya macOS'ta Homebrew üzerinden kurmayı dener.
  </Step>
  <Step title="OpenClaw'u prefix altında kur">
    - `npm` yöntemi (varsayılan): npm ile prefix altına kurar, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir checkout'u klonlar/günceller (varsayılan `~/openclaw`) ve sarmalayıcıyı yine `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklü gateway servisini yenile">
    Bir gateway servisi aynı prefix'ten zaten yüklüyse betik
    `openclaw gateway install --force`, ardından `openclaw gateway restart` çalıştırır ve
    gateway sağlığını en iyi çabayla yoklar.
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
  <Tab title="Onboarding çalıştır">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayraklar başvurusu">

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
| `--no-onboard`              | Onboarding'i atlar (varsayılan)                                                 |
| `--set-npm-prefix`          | Linux'ta, geçerli önek yazılabilir değilse npm önekini `~/.npm-global` yapmaya zorlar |
| `--help`                    | Kullanımı gösterir (`-h`)                                                       |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                                    | Açıklama                                                          |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                                                   |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dist-tag                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw durumu ve varsayılan git/onboarding yolları için temel dizin |
| `OPENCLAW_GIT_DIR=<path>`                   | git kurulumları için Git checkout dizini                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut checkout'lar için git güncellemelerini açıp kapatır        |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding'i atlar                                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi                                                 |

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
    Eksikse, önce winget, sonra Chocolatey, sonra Scoop üzerinden kurmayı dener. Hiçbir paket yöneticisi yoksa betik resmi Node.js Windows zip dosyasını `%LOCALAPPDATA%\OpenClaw\deps\portable-node` içine indirir ve geçerli işleme ve kullanıcı PATH'ine ekler. Node 22 LTS, şu anda `22.19+`, uyumluluk için desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'u kur">
    - `npm` yöntemi (varsayılan): seçili `-Tag` kullanılarak global npm kurulumu; `C:\` gibi korumalı klasörlerde açılan kabukların da çalışması için yazılabilir bir kurulum geçici dizininden başlatılır
    - `git` yöntemi: repoyu klonlar/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar. Git eksikse betik, `%LOCALAPPDATA%\OpenClaw\deps\portable-git` altında kullanıcıya yerel MinGit'i önyükler ve geçerli işleme ve kullanıcı PATH'ine ekler.

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Mümkün olduğunda gerekli bin dizinini kullanıcı PATH'ine ekler
    - Yüklü bir gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` çalıştırır (en iyi çabayla)

  </Step>
  <Step title="Hataları işle">
    `iwr ... | iex` ve scriptblock kurulumları, geçerli PowerShell oturumunu kapatmadan sonlandırıcı bir hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları otomasyon için yine de sıfır olmayan çıkış koduyla çıkar.
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
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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
  <Accordion title="Bayraklar referansı">

| Bayrak                      | Açıklama                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket belirtimi (varsayılan: `latest`) |
| `-GitDir <path>`            | Checkout dizini (varsayılan: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Onboarding'i atlar                                         |
| `-NoGitUpdate`              | `git pull` işlemini atlar                                  |
| `-DryRun`                   | Yalnızca eylemleri yazdırır                                |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                           | Açıklama           |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi    |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout dizini    |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding'i atlar |
| `OPENCLAW_GIT_UPDATE=0`            | git pull'u devre dışı bırakır |
| `OPENCLAW_DRY_RUN=1`               | Kuru çalıştırma modu |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse, betik Git for Windows bağlantısını yazdırmadan önce kullanıcıya yerel MinGit önyüklemesini dener.
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
    Git, `git` kurulum yöntemi için gereklidir. `npm` kurulumlarında, bağımlılıklar git URL'leri kullandığında `spawn git ENOENT` hatalarını önlemek için Git yine de kontrol edilir/kurulur.
  </Accordion>

  <Accordion title="Linux'ta npm neden EACCES ile karşılaşıyor?">
    Bazı Linux kurulumları npm global önekini root'a ait yollara işaret eder. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve kabuk rc dosyalarına PATH dışa aktarımları ekleyebilir (bu dosyalar mevcut olduğunda).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Kullanıcıya yerel MinGit'i önyükleyebilmesi için kurulum aracını yeniden çalıştırın veya Git for Windows'u kurup PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı kurulum çıktısı nasıl alınır">
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
