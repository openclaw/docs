---
read_when:
    - '`openclaw.ai/install.sh` öğesini anlamak istiyorsunuz.'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / grafik arayüzsüz)
    - Bir GitHub çalışma kopyasından yüklemek istiyorsunuz
summary: Yükleyici betiklerinin çalışma şekli (install.sh, install-cli.sh, install.ps1), bayraklar ve otomasyon
title: Yükleyicinin iç işleyişi
x-i18n:
    generated_at: "2026-07-16T17:13:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç yükleyici betiğiyle birlikte gelir.

| Betik                              | Platform             | İşlevi                                                                                             |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerektiğinde Node'u yükler, OpenClaw'ı npm (varsayılan) veya git aracılığıyla yükler; ilk kurulumu çalıştırabilir. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw'ı npm veya git aracılığıyla yerel bir ön eke (`~/.openclaw`) yükler. Kök yetkisi gerekmez. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerektiğinde Node'u yükler, OpenClaw'ı npm (varsayılan) veya git aracılığıyla yükler; ilk kurulumu çalıştırabilir. |

Üçü de Node **22.22.3+, 24.15+ veya 25.9+** sürümlerini destekler; yeni yüklemelerde varsayılan hedef Node 24'tür.

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
Yükleme başarılı olduğu hâlde yeni bir terminalde `openclaw` bulunamıyorsa [Node.js sorun giderme](/tr/install/node#troubleshooting) bölümüne bakın.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL üzerindeki çoğu etkileşimli yükleme için önerilir.
</Tip>

### Akış (install.sh)

<Steps>
  <Step title="İşletim sistemini algıla">
    macOS ve Linux'u (WSL dâhil) destekler.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağla">
    Node sürümünü denetler ve gerekirse Node 24'ü yükler (macOS'ta Homebrew, Linux'ta apt/dnf/yum için NodeSource kurulum betikleri). macOS'ta Homebrew yalnızca yükleyicinin Node veya Git için buna ihtiyaç duyması durumunda yüklenir. Node 22.22.3+, Node 24.15+ ve Node 25.9+ desteklenir; Node 23 desteklenmez.
    Alpine/musl Linux'ta yükleyici, NodeSource yerine apk paketlerini kullanır ve bağlı gerçek SQLite sürümünü doğrular. Güncel kararlı Alpine paket akışları, güvenlik açığı bulunan sistem SQLite'ı ile yeterince yeni bir Node sağlayabilir; böyle bir durumda bunun yerine resmî bir `node:24-alpine` konteyneri veya glibc tabanlı bir ana makine kullanın.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse macOS'ta Homebrew ve Alpine'da apk dâhil olmak üzere algılanan paket yöneticisini kullanarak yükler.
  </Step>
  <Step title="OpenClaw'ı yükle">
    - `npm` yöntemi (varsayılan): genel npm yüklemesi
    - `git` yöntemi: depoyu klonlar/günceller, bağımlılıkları pnpm ile yükler, derler ve ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna yükler

  </Step>
  <Step title="Yükleme sonrası görevler">
    - Takip eden komutlar için yeni yüklenen `openclaw` ikili dosyasını çözümler
    - Yapılandırılmamış bir yüklemede doctor veya gateway yoklamalarından önce ilk kurulumu başlatır. `--no-onboard` kullanıldığında veya TTY olmadığında, kurulumu daha sonra tamamlamak için gereken komutu yazdırır.
    - Yapılandırılmış bir yüklemede, yüklenmiş bir gateway hizmetini mümkün olan en iyi şekilde yeniler ve yeniden başlatır, ardından doctor'ı çalıştırır. Yükseltmeler mümkün olduğunda pluginleri günceller veya istemlerin etkin olduğu başsız bir çalıştırmada manuel komutu yazdırır.
    - `--verify` çalıştırıldığında yüklü sürümü denetler ve yalnızca yapılandırma mevcutsa gateway durumunu denetler.

  </Step>
</Steps>

### Kaynak kod deposu algılama

Betik bir OpenClaw deposunun içinde (`package.json` + `pnpm-workspace.yaml`) çalıştırılırsa şu seçenekleri sunar:

- depoyu kullan (`git`) veya
- genel yüklemeyi kullan (`npm`)

TTY yoksa ve yükleme yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanılır ve bir uyarı gösterilir.

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
  <Tab title="Git yüklemesi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub ana dal deposu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Deneme çalıştırması">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Yüklemeden sonra doğrula">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayrak başvurusu">

| Bayrak                                  | Açıklama                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Yükleme yöntemini seçer (varsayılan: `npm`)                          |
| `--npm`                                 | npm yöntemi için kısayol                                                |
| `--git \| --github`                     | git yöntemi için kısayol                                                |
| `--version <version\|dist-tag\|spec>`   | npm sürümü, dağıtım etiketi veya paket belirtimi (varsayılan: `latest`) |
| `--beta`                                | Varsa beta dağıtım etiketini kullanır, yoksa `latest` değerine geri döner |
| `--git-dir \| --dir <path>`             | Depo dizini (varsayılan: `~/openclaw`)                                  |
| `--no-git-update`                       | Mevcut depo için `git pull` işlemini atlar                              |
| `--no-prompt`                           | İstemleri devre dışı bırakır                                           |
| `--no-onboard`                          | İlk kurulumu atlar                                                      |
| `--onboard`                             | İlk kurulumu etkinleştirir                                              |
| `--verify`                              | Yükleme sonrası hızlı doğrulama çalıştırır (`--version`, yüklüyse gateway durumu) |
| `--dry-run`                             | Değişiklikleri uygulamadan eylemleri yazdırır                           |
| `--verbose`                             | Hata ayıklama çıktısını etkinleştirir (`set -x`, npm bildirim düzeyi günlükleri) |
| `--help \| -h`                          | Kullanım bilgisini gösterir                                             |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                          | Açıklama                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Yükleme yöntemi                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm sürümü, dağıtım etiketi veya paket belirtimi                    |
| `OPENCLAW_BETA=0\|1`                              | Varsa beta sürümünü kullanır                                        |
| `OPENCLAW_HOME=<path>`                            | OpenClaw durumu ve varsayılan git/ilk kurulum yolları için temel dizin |
| `OPENCLAW_GIT_DIR=<path>`                         | Depo dizini                                                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git güncellemelerini açar veya kapatır                              |
| `OPENCLAW_NO_PROMPT=1`                            | İstemleri devre dışı bırakır                                        |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Yükleme sonrası hızlı doğrulamayı çalıştırır                        |
| `OPENCLAW_NO_ONBOARD=1`                           | İlk kurulumu atlar                                                  |
| `OPENCLAW_DRY_RUN=1`                              | Deneme çalıştırması modu                                             |
| `OPENCLAW_VERBOSE=1`                              | Hata ayıklama modu                                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm günlük düzeyi (varsayılan: `error`, npm kullanımdan kaldırma gürültüsünü gizler) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir ön ek altında (varsayılan `~/.openclaw`) tutmak ve
sistem Node bağımlılığı kullanmamak istediğiniz ortamlar için tasarlanmıştır.
Varsayılan olarak npm yüklemelerini ve aynı ön ek akışı altında git deposu
yüklemelerini destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını yükle">
    Sabitlenmiş ve desteklenen bir Node LTS tarball'ını (sürüm betiğe gömülüdür ve bağımsız olarak güncellenir; varsayılan `24.15.0`) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256'yı doğrular.
    Resmî Node 24+ ARMv7 ikili dosyaları bulunmadığından Linux ARMv7, Node `22.22.3` kullanır.
    Node'un sabitlenmiş çalışma zamanı için uyumlu tarball'lar yayımlamadığı Alpine/musl Linux'ta, `apk` ile `nodejs` ve `npm` paketlerini yükler; ardından hem Node'u hem de bağlı gerçek SQLite kitaplığını doğrular. Güncel kararlı Alpine paket akışları, yeterince yeni bir Node ile bile güvenlik açığı bulunan SQLite'a bağlanabilir; güvenlik denetimi paketi reddettiğinde resmî bir `node:24-alpine` konteyneri veya glibc tabanlı bir ana makine kullanın.
  </Step>
  <Step title="Git'i sağla">
    Git eksikse Linux'ta apt/dnf/yum/apk veya macOS'ta Homebrew aracılığıyla yüklemeyi dener.
  </Step>
  <Step title="OpenClaw'ı ön ek altına yükle">
    - `npm` yöntemi (varsayılan): npm ile ön ek altına yükler, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir depoyu klonlar/günceller (varsayılan `~/openclaw`) ve sarmalayıcıyı yine `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklü gateway hizmetini yenile">
    Aynı ön ekten bir gateway hizmeti zaten yüklenmişse betik,
    yerine geçen hizmeti etkinleştiren `openclaw gateway install --force` komutunu çalıştırır
    ve ardından gateway durumunu mümkün olan en iyi şekilde yoklar.
  </Step>
</Steps>

### Örnekler (install-cli.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Özel ön ek + sürüm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git yüklemesi">
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
  <Accordion title="Bayrak başvurusu">

| Bayrak                                  | Açıklama                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Kurulum öneki (varsayılan: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`)                                          |
| `--npm`                                 | npm yöntemi için kısayol                                                        |
| `--git \| --github`                     | git yöntemi için kısayol                                                        |
| `--git-dir \| --dir <path>`             | Git çalışma kopyası dizini (varsayılan: `~/openclaw`)                           |
| `--version <ver>`                       | OpenClaw sürümü veya dist-tag (varsayılan: `latest`)                            |
| `--node-version <ver>`                  | Node sürümü (varsayılan: `24.15.0`; Linux ARMv7'de `22.22.3`)                  |
| `--json`                                | NDJSON olayları yayınlar                                                        |
| `--onboard`                             | Kurulumdan sonra `openclaw onboard` komutunu çalıştırır                         |
| `--no-onboard`                          | İlk kurulumu atlar (varsayılan)                                                 |
| `--set-npm-prefix`                      | Linux'ta mevcut önek yazılabilir değilse npm önekini `~/.npm-global` olarak ayarlar |
| `--help \| -h`                          | Kullanım bilgisini gösterir                                                     |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                                    | Açıklama                                                           |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                                      |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                                                    |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dist-tag                                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                                        |
| `OPENCLAW_HOME=<path>`                      | OpenClaw durumu ve varsayılan git/ilk kurulum yolları için temel dizin |
| `OPENCLAW_GIT_DIR=<path>`                   | Git kurulumları için çalışma kopyası dizini                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut çalışma kopyaları için git güncellemelerini açar veya kapatır |
| `OPENCLAW_NO_ONBOARD=1`                     | İlk kurulumu atlar                                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi (varsayılan: `error`)                            |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` ve diğer GitHub kaynak belirtimleri, npm kurulumlarında geçerli `--version` hedefleri değildir. Bunun yerine `--install-method git --version main` kullanın.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Akış (install.ps1)

<Steps>
  <Step title="PowerShell ve Windows ortamını hazırla">
    PowerShell 5+ gerektirir.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü hazırla">
    Eksikse önce winget, ardından Chocolatey, sonra Scoop aracılığıyla kurmayı dener. Hiçbir paket yöneticisi yoksa betik, resmi Node.js 24 Windows zip dosyasını `%LOCALAPPDATA%\OpenClaw\deps\portable-node` içine indirir ve mevcut işlemin ve kullanıcının PATH'ine ekler. Node 22.22.3+, Node 24.15+ ve Node 25.9+ desteklenir; Node 23 desteklenmez.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak genel npm kurulumu; `C:\` gibi korumalı klasörlerde açılan kabukların da çalışabilmesi için yazılabilir bir geçici yükleyici dizininden başlatılır
    - `git` yöntemi: depoyu klonlar/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar. Git eksikse betik, `%LOCALAPPDATA%\OpenClaw\deps\portable-git` altında kullanıcıya özel MinGit'i hazırlar ve mevcut işlemin ve kullanıcının PATH'ine ekler.

  </Step>
  <Step title="Kurulum sonrası görevleri gerçekleştir">
    - Mümkün olduğunda gerekli ikili dosya dizinini kullanıcının PATH'ine ekler
    - Yüklenmiş bir gateway hizmetini en iyi çabayla yeniler (`openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` komutunu çalıştırır (en iyi çaba)

  </Step>
  <Step title="Hataları işle">
    `iwr ... | iex` ve betik bloğu kurulumları, mevcut PowerShell oturumunu kapatmadan sonlandırıcı bir hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları, otomasyon için yine sıfırdan farklı bir kodla çıkar.
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
  <Tab title="GitHub main çalışma kopyası">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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
</Tabs>

<AccordionGroup>
  <Accordion title="Bayraklar referansı">

| Bayrak                      | Açıklama                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                       |
| `-Tag <tag\|version\|spec>` | npm dist-tag, sürüm veya paket belirtimi (varsayılan: `latest`) |
| `-GitDir <path>`            | Çalışma kopyası dizini (varsayılan: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | İlk kurulumu atlar                                        |
| `-NoGitUpdate`              | `git pull` adımını atlar                                  |
| `-DryRun`                   | Yalnızca eylemleri yazdırır                               |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                           | Açıklama                 |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi          |
| `OPENCLAW_GIT_DIR=<path>`          | Çalışma kopyası dizini   |
| `OPENCLAW_NO_ONBOARD=1`            | İlk kurulumu atlar       |
| `OPENCLAW_GIT_UPDATE=0`            | git pull işlemini devre dışı bırakır |
| `OPENCLAW_DRY_RUN=1`               | Deneme çalıştırması modu |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git eksikse betik, Git for Windows bağlantısını yazdırmadan önce kullanıcıya özel bir MinGit hazırlamayı dener.
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
  <Accordion title="Git neden gereklidir?">
    Git, `git` kurulum yöntemi için gereklidir. `npm` kurulumlarında da bağımlılıklar git URL'leri kullandığında oluşabilecek `spawn git ENOENT` hatalarını önlemek için Git denetlenir/kurulur.
  </Accordion>

  <Accordion title="npm Linux'ta neden EACCES hatası verir?">
    Bazı Linux kurulumları npm'in genel önekini root'a ait yollara yönlendirir. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve kabuk rc dosyalarına PATH dışa aktarımlarını ekleyebilir (bu dosyalar mevcutsa).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Kullanıcıya özel MinGit'i hazırlayabilmesi için yükleyiciyi yeniden çalıştırın veya Git for Windows'u kurup PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcınızın PATH'ine ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı yükleyici çıktısı nasıl alınır">
    `install.ps1`, bir `-Verbose` anahtarı sunmaz.
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

- [Kuruluma genel bakış](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
