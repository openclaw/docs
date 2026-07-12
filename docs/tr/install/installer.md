---
read_when:
    - '`openclaw.ai/install.sh` hakkında bilgi edinmek istiyorsunuz'
    - Kurulumları otomatikleştirmek istiyorsunuz (CI / kullanıcı arayüzü olmadan)
    - Bir GitHub çalışma kopyasından yüklemek istiyorsunuz
summary: Yükleyici betiklerinin (`install.sh`, `install-cli.sh`, `install.ps1`) çalışma şekli, bayraklar ve otomasyon
title: Yükleyici iç işleyişi
x-i18n:
    generated_at: "2026-07-12T12:24:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw, `openclaw.ai` üzerinden sunulan üç kurulum betiğiyle birlikte gelir.

| Betik                              | Platform             | Yaptığı işlem                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Gerekiyorsa Node'u kurar, OpenClaw'ı npm (varsayılan) veya git aracılığıyla kurar ve ilk yapılandırmayı çalıştırabilir. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node ve OpenClaw'ı npm veya git aracılığıyla yerel bir ön eke (`~/.openclaw`) kurar. Root yetkisi gerekmez.     |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Gerekiyorsa Node'u kurar, OpenClaw'ı npm (varsayılan) veya git aracılığıyla kurar ve ilk yapılandırmayı çalıştırabilir. |

Üçü de Node **22.19+, 23.11+ veya 24+** sürümlerini destekler; yeni kurulumlarda varsayılan hedef Node 24'tür.

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
Kurulum başarılı olduğu hâlde yeni bir terminalde `openclaw` bulunamıyorsa [Node.js sorun giderme](/tr/install/node#troubleshooting) bölümüne bakın.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL üzerindeki etkileşimli kurulumların çoğu için önerilir.
</Tip>

### Akış (install.sh)

<Steps>
  <Step title="İşletim sistemini algıla">
    macOS ve Linux'u (WSL dâhil) destekler.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü hazırla">
    Node sürümünü denetler ve gerekirse Node 24'ü kurar (macOS'te Homebrew, Linux'ta apt/dnf/yum için NodeSource kurulum betikleri). macOS'te Homebrew yalnızca kurulum betiği Node veya Git için buna ihtiyaç duyduğunda kurulur. Uyumluluk amacıyla Node 22.19+ ve 23.11+ desteklenmeye devam eder.
    Alpine/musl Linux'ta kurulum betiği NodeSource yerine apk paketlerini kullanır; yapılandırılmış Alpine depoları desteklenen bir Node sürümü sağlamalıdır (bu metnin yazıldığı sırada Alpine 3.21 veya daha yenisi).
  </Step>
  <Step title="Git'i hazırla">
    Git yoksa algılanan paket yöneticisini kullanarak kurar; buna macOS'te Homebrew ve Alpine'da apk dahildir.
  </Step>
  <Step title="OpenClaw'ı kur">
    - `npm` yöntemi (varsayılan): genel npm kurulumu
    - `git` yöntemi: depoyu klonlar/günceller, bağımlılıkları pnpm ile kurar, derler ve ardından sarmalayıcıyı `~/.local/bin/openclaw` konumuna kurar

  </Step>
  <Step title="Kurulum sonrası görevler">
    - Sonraki komutlar için yeni kurulmuş `openclaw` ikili dosyasını çözümler
    - Yapılandırılmamış bir kurulumda, doctor veya gateway yoklamalarından önce ilk yapılandırmayı başlatır. `--no-onboard` kullanıldığında veya TTY olmadığında, kurulumu daha sonra tamamlamak için gereken komutu yazdırır.
    - Yapılandırılmış bir kurulumda, yüklenmiş Gateway hizmetini mümkün olan en iyi şekilde yenileyip yeniden başlatır ve doctor'ı çalıştırır. Yükseltmeler mümkün olduğunda Plugin'leri günceller veya terminal arayüzü olmayan ancak istemlerin etkin olduğu bir çalıştırmada manuel komutu yazdırır.
    - `--verify` çalıştırıldığında, yalnızca yapılandırma mevcutsa kurulu sürümü ve Gateway durumunu denetler.

  </Step>
</Steps>

### Kaynak çalışma kopyasını algılama

Bir OpenClaw çalışma kopyası (`package.json` + `pnpm-workspace.yaml`) içinde çalıştırılırsa betik şu seçenekleri sunar:

- çalışma kopyasını kullan (`git`) veya
- genel kurulumu kullan (`npm`)

TTY kullanılamıyorsa ve kurulum yöntemi ayarlanmamışsa varsayılan olarak `npm` kullanılır ve bir uyarı gösterilir.

Betik, geçersiz yöntem seçimi veya geçersiz `--install-method` değerleri için `2` koduyla çıkar.

### Örnekler (install.sh)

<Tabs>
  <Tab title="Varsayılan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="İlk yapılandırmayı atla">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git kurulumu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub ana dal çalışma kopyası">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Deneme çalıştırması">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Kurulumdan sonra doğrula">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayraklar başvurusu">

| Bayrak                                  | Açıklama                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`)                                             |
| `--npm`                                 | npm yöntemi için kısayol                                                               |
| `--git \| --github`                     | git yöntemi için kısayol                                                               |
| `--version <version\|dist-tag\|spec>`   | npm sürümü, dağıtım etiketi veya paket belirtimi (varsayılan: `latest`)                 |
| `--beta`                                | Varsa beta dağıtım etiketini kullanır, aksi hâlde `latest` değerine geri döner          |
| `--git-dir \| --dir <path>`             | Çalışma kopyası dizini (varsayılan: `~/openclaw`)                                       |
| `--no-git-update`                       | Mevcut çalışma kopyası için `git pull` işlemini atlar                                   |
| `--no-prompt`                           | İstemleri devre dışı bırakır                                                            |
| `--no-onboard`                          | İlk yapılandırmayı atlar                                                                |
| `--onboard`                             | İlk yapılandırmayı etkinleştirir                                                        |
| `--verify`                              | Kurulum sonrası hızlı doğrulama çalıştırır (`--version`, yüklüyse Gateway durumu)       |
| `--dry-run`                             | Değişiklikleri uygulamadan işlemleri yazdırır                                           |
| `--verbose`                             | Hata ayıklama çıktısını etkinleştirir (`set -x`, npm bildirim düzeyi günlükleri)         |
| `--help \| -h`                          | Kullanımı gösterir                                                                      |

  </Accordion>

  <Accordion title="Ortam değişkenleri başvurusu">

| Değişken                                          | Açıklama                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Kurulum yöntemi                                                                  |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm sürümü, dağıtım etiketi veya paket belirtimi                                 |
| `OPENCLAW_BETA=0\|1`                              | Varsa beta sürümünü kullanır                                                     |
| `OPENCLAW_HOME=<path>`                            | OpenClaw durumu ile varsayılan git/ilk yapılandırma yollarının temel dizini      |
| `OPENCLAW_GIT_DIR=<path>`                         | Çalışma kopyası dizini                                                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Git güncellemelerini açar veya kapatır                                           |
| `OPENCLAW_NO_PROMPT=1`                            | İstemleri devre dışı bırakır                                                     |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Kurulum sonrası hızlı doğrulamayı çalıştırır                                     |
| `OPENCLAW_NO_ONBOARD=1`                           | İlk yapılandırmayı atlar                                                         |
| `OPENCLAW_DRY_RUN=1`                              | Deneme çalıştırması modu                                                         |
| `OPENCLAW_VERBOSE=1`                              | Hata ayıklama modu                                                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm günlük düzeyi (varsayılan: `error`, npm kullanımdan kaldırma gürültüsünü gizler) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Her şeyi yerel bir ön ek (varsayılan `~/.openclaw`) altında tutmak ve sistem Node bağımlılığı kullanmamak istediğiniz ortamlar için tasarlanmıştır. Varsayılan olarak npm kurulumlarını ve ayrıca aynı ön ek akışı altında git çalışma kopyası kurulumlarını destekler.
</Info>

### Akış (install-cli.sh)

<Steps>
  <Step title="Yerel Node çalışma zamanını kur">
    Sabitlenmiş, desteklenen bir Node LTS tar arşivini (sürüm betiğe gömülüdür ve bağımsız olarak güncellenir; varsayılan `22.22.2`) `<prefix>/tools/node-v<version>` konumuna indirir ve SHA-256 değerini doğrular.
    Node'un sabitlenmiş çalışma zamanı için uyumlu tar arşivleri yayımlamadığı Alpine/musl Linux'ta, `nodejs` ve `npm` paketlerini `apk` ile kurar ve bu çalışma zamanını ön ek sarmalayıcı yoluna bağlar. Alpine depoları desteklenen bir Node sürümü (22.19+, 23.11+ veya 24+) sağlamalıdır; eski depolar yalnızca Node 20 veya 21 sağlıyorsa Alpine 3.21 veya daha yenisini kullanın.
  </Step>
  <Step title="Git'i hazırla">
    Git yoksa Linux'ta apt/dnf/yum/apk veya macOS'te Homebrew aracılığıyla kurmayı dener.
  </Step>
  <Step title="OpenClaw'ı ön ek altına kur">
    - `npm` yöntemi (varsayılan): npm ile ön ek altına kurar, ardından sarmalayıcıyı `<prefix>/bin/openclaw` konumuna yazar
    - `git` yöntemi: bir çalışma kopyasını (varsayılan `~/openclaw`) klonlar/günceller ve sarmalayıcıyı yine `<prefix>/bin/openclaw` konumuna yazar

  </Step>
  <Step title="Yüklenmiş Gateway hizmetini yenile">
    Aynı ön ekten bir Gateway hizmeti zaten yüklenmişse betik,
    `openclaw gateway install --force`, ardından `openclaw gateway restart` komutunu çalıştırır ve
    Gateway durumunu mümkün olan en iyi şekilde yoklar.
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
  <Tab title="Git kurulumu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Otomasyon için JSON çıktısı">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="İlk yapılandırmayı çalıştır">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Bayraklar başvurusu">

| Bayrak                                  | Açıklama                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Kurulum öneki (varsayılan: `~/.openclaw`)                                              |
| `--install-method \| --method npm\|git` | Kurulum yöntemini seçer (varsayılan: `npm`)                                             |
| `--npm`                                 | npm yöntemi için kısayol                                                               |
| `--git \| --github`                     | git yöntemi için kısayol                                                               |
| `--git-dir \| --dir <path>`             | Git çalışma kopyası dizini (varsayılan: `~/openclaw`)                                   |
| `--version <ver>`                       | OpenClaw sürümü veya dağıtım etiketi (varsayılan: `latest`)                             |
| `--node-version <ver>`                  | Node sürümü (varsayılan: `22.22.2`)                                                     |
| `--json`                                | NDJSON olayları üretir                                                                 |
| `--onboard`                             | Kurulumdan sonra `openclaw onboard` komutunu çalıştırır                                 |
| `--no-onboard`                          | İlk yapılandırmayı atlar (varsayılan)                                                   |
| `--set-npm-prefix`                      | Linux'ta mevcut önek yazılabilir değilse npm önekini `~/.npm-global` olarak ayarlar     |
| `--help \| -h`                          | Kullanımı gösterir                                                                     |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                                    | Açıklama                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Kurulum öneki                                                               |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Kurulum yöntemi                                                             |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw sürümü veya dağıtım etiketi                                        |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node sürümü                                                                 |
| `OPENCLAW_HOME=<path>`                      | OpenClaw durumu ve varsayılan git/ilk yapılandırma yolları için temel dizin |
| `OPENCLAW_GIT_DIR=<path>`                   | git kurulumları için Git çalışma kopyası dizini                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Mevcut çalışma kopyaları için git güncellemelerini açar veya kapatır        |
| `OPENCLAW_NO_ONBOARD=1`                     | İlk yapılandırmayı atlar                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm günlük düzeyi (varsayılan: `error`)                                     |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` ve diğer GitHub kaynak tanımları, npm kurulumlarında geçerli `--version` hedefleri değildir. Bunun yerine `--install-method git --version main` kullanın.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Akış (install.ps1)

<Steps>
  <Step title="PowerShell ve Windows ortamını doğrulayın">
    PowerShell 5+ gerektirir.
  </Step>
  <Step title="Varsayılan olarak Node.js 24'ü sağlayın">
    Mevcut değilse sırasıyla winget, Chocolatey ve Scoop aracılığıyla kurmayı dener. Kullanılabilir bir paket yöneticisi yoksa betik, resmi Node.js 24 Windows zip dosyasını `%LOCALAPPDATA%\OpenClaw\deps\portable-node` konumuna indirir ve geçerli işlemin ve kullanıcının PATH değişkenine ekler. Uyumluluk için Node 22.19+ ve 23.11+ desteklenmeye devam eder.
  </Step>
  <Step title="OpenClaw'ı kurun">
    - `npm` yöntemi (varsayılan): seçilen `-Tag` kullanılarak genel npm kurulumu; `C:\` gibi korumalı klasörlerde açılan kabukların da çalışabilmesi için yazılabilir bir geçici yükleyici dizininden başlatılır
    - `git` yöntemi: depoyu klonlar/günceller, pnpm ile kurar/derler ve sarmalayıcıyı `%USERPROFILE%\.local\bin\openclaw.cmd` konumuna kurar. Git mevcut değilse betik, `%LOCALAPPDATA%\OpenClaw\deps\portable-git` altında kullanıcıya özel MinGit'i hazırlar ve geçerli işlemin ve kullanıcının PATH değişkenine ekler.

  </Step>
  <Step title="Kurulum sonrası görevleri çalıştırın">
    - Gerektiğinde gerekli ikili dosya dizinini kullanıcının PATH değişkenine ekler
    - Yüklü bir Gateway hizmetini mümkün olan en iyi şekilde yeniler (önce `openclaw gateway install --force`, ardından yeniden başlatma)
    - Yükseltmelerde ve git kurulumlarında `openclaw doctor --non-interactive` komutunu çalıştırır (mümkün olan en iyi şekilde)

  </Step>
  <Step title="Hataları işleyin">
    `iwr ... | iex` ve betik bloğu kurulumları, geçerli PowerShell oturumunu kapatmadan sonlandırıcı bir hata bildirir. Doğrudan `powershell -File` / `pwsh -File` kurulumları ise otomasyon için sıfır olmayan bir kodla çıkmaya devam eder.
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

| Bayrak                      | Açıklama                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Kurulum yöntemi (varsayılan: `npm`)                                     |
| `-Tag <tag\|version\|spec>` | npm dağıtım etiketi, sürümü veya paket tanımı (varsayılan: `latest`)     |
| `-GitDir <path>`            | Çalışma kopyası dizini (varsayılan: `%USERPROFILE%\openclaw`)           |
| `-NoOnboard`                | İlk yapılandırmayı atlar                                                |
| `-NoGitUpdate`              | `git pull` komutunu atlar                                               |
| `-DryRun`                   | Yalnızca eylemleri yazdırır                                             |

  </Accordion>

  <Accordion title="Ortam değişkenleri referansı">

| Değişken                           | Açıklama                 |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Kurulum yöntemi          |
| `OPENCLAW_GIT_DIR=<path>`          | Çalışma kopyası dizini   |
| `OPENCLAW_NO_ONBOARD=1`            | İlk yapılandırmayı atlar |
| `OPENCLAW_GIT_UPDATE=0`            | git pull'u devre dışı bırakır |
| `OPENCLAW_DRY_RUN=1`               | Deneme çalıştırması modu |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` kullanılırsa ve Git mevcut değilse betik, Git for Windows bağlantısını göstermeden önce kullanıcıya özel MinGit'i hazırlamayı dener.
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
  <Tab title="install.ps1 (ilk yapılandırmayı atla)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Sorun giderme

<AccordionGroup>
  <Accordion title="Git neden gerekli?">
    `git` kurulum yöntemi için Git gereklidir. `npm` kurulumlarında da bağımlılıklar git URL'lerini kullandığında oluşabilecek `spawn git ENOENT` hatalarını önlemek amacıyla Git denetlenir/kurulur.
  </Accordion>

  <Accordion title="npm neden Linux'ta EACCES hatası veriyor?">
    Bazı Linux yapılandırmaları, npm'in genel önekini root kullanıcısına ait yollara yönlendirir. `install.sh`, öneki `~/.npm-global` olarak değiştirebilir ve kabuk rc dosyalarına PATH dışa aktarımlarını ekleyebilir (bu dosyalar mevcutsa).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Kullanıcıya özel MinGit'i hazırlayabilmesi için yükleyiciyi yeniden çalıştırın veya Git for Windows'u kurup PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` komutunu çalıştırın ve bu dizini kullanıcınızın PATH değişkenine ekleyin (Windows'ta `\bin` son eki gerekmez), ardından PowerShell'i yeniden açın.
  </Accordion>

  <Accordion title="Windows: ayrıntılı yükleyici çıktısı nasıl alınır?">
    `install.ps1`, bir `-Verbose` anahtarı sunmaz.
    Betik düzeyinde tanılama için PowerShell izlemeyi kullanın:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Kurulumdan sonra openclaw bulunamıyor">
    Bu genellikle bir PATH sorunudur. Bkz. [Node.js sorun giderme](/tr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Güncelleme](/tr/install/updating)
- [Kaldırma](/tr/install/uninstall)
