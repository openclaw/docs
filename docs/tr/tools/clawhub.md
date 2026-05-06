---
read_when:
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt deposuna yayımlama
    - ClawHub CLI'yi veya ortam geçersiz kılmalarını yapılandırma
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills ve Plugin’leri, yerel kurulum akışları ve clawhub CLI için genel kayıt dizini'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub, **OpenClaw Skills ve Pluginleri** için herkese açık kayıt defteridir.

- Skills aramak, yüklemek ve güncellemek; ayrıca ClawHub’dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri kimlik doğrulaması, yayımlama, silme/silmeyi geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI aracını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

<Steps>
  <Step title="Ara">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Yükle">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Kullan">
    Yeni bir OpenClaw oturumu başlatın - yeni Skills’i algılar.
  </Step>
  <Step title="Yayımla (isteğe bağlı)">
    Kayıt defteriyle kimliği doğrulanmış iş akışları (yayımlama, eşitleme, yönetme) için
    ayrı `clawhub` CLI aracını yükleyin:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Yerel OpenClaw akışları

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel `openclaw` komutları etkin çalışma alanınıza yükleme yapar ve
    kaynak meta verilerini kalıcı tutar; böylece sonraki `update` çağrıları ClawHub’da kalabilir.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search`, ClawHub Plugin kataloğunu sorgular ve yüklemeye hazır
    paket adlarını yazdırır. ClawHub çözümlemesi istediğinizde `clawhub:<package>` kullanın.
    Çıplak npm uyumlu Plugin belirtimleri, başlatma geçişi sırasında npm’den yüklenir:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` de yalnızca npm içindir ve bir belirtimin aksi halde
    belirsiz olabileceği durumlarda yararlıdır:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve
    `minGatewayVersion` uyumluluğunu doğrular; böylece uyumsuz ana makineler paketi
    kısmen yüklemek yerine erkenden kapalı şekilde başarısız olur. Bir paket sürümü
    ClawPack yapıtı yayımladığında OpenClaw, tam olarak yüklenen npm-pack `.tgz`
    dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları doğrular ve sonraki
    güncellemeler için yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını
    ve ClawPack özet meta verilerini kaydeder. ClawPack meta verileri olmayan daha eski
    paket sürümleri, eski paket arşivi doğrulama yolunu kullanmaya devam eder.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` yalnızca yüklenebilir Plugin
ailelerini kabul eder. Bir ClawHub paketi aslında Skills ise OpenClaw durur ve
bunun yerine sizi `openclaw skills install <slug>` komutuna yönlendirir.

Anonim ClawHub Plugin yüklemeleri de özel paketler için kapalı şekilde başarısız olur.
Topluluk veya diğer resmi olmayan kanallar yine de yüklenebilir, ancak OpenClaw
operatörlerin bunları etkinleştirmeden önce kaynak ve doğrulamayı inceleyebilmesi için
uyarı verir.
</Note>

## ClawHub nedir

- OpenClaw Skills ve Pluginleri için herkese açık bir kayıt defteri.
- Skills paketlerinin ve meta verilerinin sürümlü deposu.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

Tipik bir Skills, şunları içeren sürümlü bir dosya paketidir:

- Birincil açıklama ve kullanımı içeren bir `SKILL.md` dosyası.
- Skills tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destek dosyaları.
- Etiketler, özet ve yükleme gereksinimleri gibi meta veriler.

ClawHub, keşfi desteklemek ve Skills yeteneklerini güvenli şekilde ortaya çıkarmak için
meta verileri kullanır. Kayıt defteri, sıralamayı ve görünürlüğü iyileştirmek için
kullanım sinyallerini (yıldızlar, indirmeler) izler. Her yayımlama yeni bir semver
sürümü oluşturur ve kayıt defteri, kullanıcıların değişiklikleri denetleyebilmesi için
sürüm geçmişini saklar.

## Çalışma alanı ve Skills yükleme

Ayrı `clawhub` CLI aracı da Skills’i geçerli çalışma dizininizin altındaki
`./skills` içine yükler. Bir OpenClaw çalışma alanı yapılandırılmışsa `clawhub`,
`--workdir` (veya `CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece bu çalışma
alanına geri döner. OpenClaw, çalışma alanı Skills’lerini `<workspace>/skills`
konumundan yükler ve bunları **sonraki** oturumda algılar.

Zaten `~/.openclaw/skills` veya paketlenmiş Skills kullanıyorsanız çalışma alanı
Skills’leri önceliklidir. Skills’in nasıl yüklendiği, paylaşıldığı ve kapılandığı
hakkında daha fazla ayrıntı için [Skills](/tr/tools/skills) sayfasına bakın.

## Hizmet özellikleri

| Özellik                  | Notlar                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Herkese açık gezinme     | Skills ve `SKILL.md` içerikleri herkese açık olarak görüntülenebilir. |
| Arama                    | Yalnızca anahtar sözcükler değil, embedding destekli (vektör araması). |
| Sürümleme                | Semver, değişiklik günlükleri ve etiketler (`latest` dahil).         |
| İndirmeler               | Sürüm başına zip.                                                    |
| Yıldızlar ve yorumlar    | Topluluk geri bildirimi.                                             |
| Güvenlik taraması özetleri | Ayrıntı sayfaları yükleme veya indirme öncesinde en son tarama durumunu gösterir. |
| Tarayıcı ayrıntı sayfaları | VirusTotal, ClawScan ve statik analiz sonuçlarında derin bağlantılar bulunur. |
| Sahip kurtarma panosu    | Yayımcılar, `/dashboard` üzerinden taramada bekletilen sahip oldukları içeriği görebilir. |
| Sahip tarafından istenen yeniden taramalar | Sahipler, yanlış pozitif kurtarma için sınırlı yeniden taramalar isteyebilir. |
| Moderasyon               | Onaylar ve denetimler.                                               |
| CLI dostu API            | Otomasyon ve betik yazımı için uygundur.                             |

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır - herkes Skills yükleyebilir, ancak yayımlama
yapabilmek için bir GitHub hesabının **en az bir haftalık** olması gerekir. Bu,
meşru katkıda bulunanları engellemeden kötüye kullanımı yavaşlatır.

<AccordionGroup>
  <Accordion title="Güvenlik taramaları">
    ClawHub, yayımlanan Skills ve Plugin sürümlerinde otomatik güvenlik denetimleri çalıştırır.
    Herkese açık ayrıntı sayfaları geçerli sonucu özetler ve tarayıcı satırları VirusTotal,
    ClawScan ve statik analiz için ayrılmış ayrıntı sayfalarına bağlanır.

    Taramada bekletilen veya engellenen sürümler, sahipleri için `/dashboard` içinde görünür
    kalırken herkese açık katalog ve yükleme yüzeylerinde kullanılamayabilir.

  </Accordion>
  <Accordion title="Raporlama">
    - Oturum açmış herhangi bir kullanıcı bir Skills’i raporlayabilir.
    - Rapor nedenleri zorunludur ve kaydedilir.
    - Her kullanıcının aynı anda en fazla 20 etkin raporu olabilir.
    - 3’ten fazla benzersiz raporu olan Skills varsayılan olarak otomatik gizlenir.

  </Accordion>
  <Accordion title="Moderasyon">
    - Moderatörler gizli Skills’i görüntüleyebilir, gizlemeyi kaldırabilir, silebilir veya kullanıcıları yasaklayabilir.
    - Raporlama özelliğini kötüye kullanmak hesap yasaklarına neden olabilir.
    - Moderatör olmak mı istiyorsunuz? OpenClaw Discord’da sorun ve bir moderatör veya bakım sorumlusuyla iletişime geçin.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Buna yalnızca yayımlama/eşitleme gibi kayıt defteriyle kimliği doğrulanmış iş akışları için
ihtiyaç duyarsınız.

### Genel seçenekler

<ParamField path="--workdir <dir>" type="string">
  Çalışma dizini. Varsayılan: geçerli dizin; OpenClaw çalışma alanına geri döner.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Workdir’e göre göreli Skills dizini.
</ParamField>
<ParamField path="--site <url>" type="string">
  Site taban URL’si (tarayıcı oturum açma).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Kayıt defteri API taban URL’si.
</ParamField>
<ParamField path="--no-input" type="boolean">
  İstemleri devre dışı bırakır (etkileşimsiz).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI sürümünü yazdırır.
</ParamField>

### Komutlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama (oturum açma / oturumu kapatma / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Oturum açma seçenekleri:

    - `--token <token>` - bir API token’ı yapıştırın.
    - `--label <label>` - tarayıcı oturum açma token’ları için saklanan etiket (varsayılan: `CLI token`).
    - `--no-browser` - tarayıcı açma (`--token` gerektirir).

  </Accordion>
  <Accordion title="Arama">
    ```bash
    clawhub search "query"
    ```

    Skills arar. Plugin/paket keşfi için `clawhub package explore` kullanın.

    - `--limit <n>` - en fazla sonuç.

  </Accordion>
  <Accordion title="Pluginlere göz at / incele">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` ve `package inspect`, Plugin/paket keşfi ve meta veri incelemesi için ClawHub CLI yüzeyleridir. Yerel OpenClaw yüklemeleri yine `openclaw plugins install clawhub:<package>` kullanır.

    Seçenekler:

    - `--family skill|code-plugin|bundle-plugin` - paket ailesini filtrele.
    - `--official` - yalnızca resmi paketleri göster.
    - `--executes-code` - yalnızca kod çalıştıran paketleri göster.
    - `--version <version>` / `--tag <tag>` - belirli bir paket sürümünü incele.
    - `--versions`, `--files`, `--file <path>` - paket geçmişini ve dosyalarını incele.
    - `--json` - makine tarafından okunabilir çıktı.

  </Accordion>
  <Accordion title="Yükle / güncelle / listele">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Seçenekler:

    - `--version <version>` - belirli bir sürümü yükle veya güncelle (`update` üzerinde yalnızca tek slug).
    - `--force` - klasör zaten varsa veya yerel dosyalar yayımlanmış herhangi bir sürümle eşleşmiyorsa üzerine yaz.
    - `clawhub list`, `.clawhub/lock.json` dosyasını okur.

  </Accordion>
  <Accordion title="Skills yayımla">
    ```bash
    clawhub skill publish <path>
    ```

    Seçenekler:

    - `--slug <slug>` - Skills slug’ı.
    - `--name <name>` - görünen ad.
    - `--version <version>` - semver sürümü.
    - `--changelog <text>` - değişiklik günlüğü metni (boş olabilir).
    - `--tags <tags>` - virgülle ayrılmış etiketler (varsayılan: `latest`).

  </Accordion>
  <Accordion title="Pluginleri yayımla">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` yerel bir klasör, `owner/repo`, `owner/repo@ref` veya bir
    GitHub URL’si olabilir.

    Seçenekler:

    - `--dry-run` - hiçbir şey yüklemeden tam yayımlama planını oluştur.
    - `--json` - CI için makine tarafından okunabilir çıktı üret.
    - `--source-repo`, `--source-commit`, `--source-ref` - otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

  </Accordion>
  <Accordion title="Yeniden tarama iste">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Yeniden tarama komutları, oturum açmış bir sahip token’ı gerektirir ve en son
    yayımlanmış Skills sürümünü veya Plugin sürümünü hedefler. Etkileşimsiz çalışmalarda
    `--yes` iletin.

    JSON yanıtları hedef türünü, adı, sürümü, yeniden tarama durumunu ve
    o sürüm veya yayın için kalan/azami istek sayılarını içerir.

  </Accordion>
  <Accordion title="Sil / silmeyi geri al (sahip veya yönetici)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Eşitle (yereli tara + yeni veya güncellenmiş olanları yayımla)">
    ```bash
    clawhub sync
    ```

    Seçenekler:

    - `--root <dir...>` - ek tarama kökleri.
    - `--all` - istem olmadan her şeyi yükle.
    - `--dry-run` - nelerin yükleneceğini göster.
    - `--bump <type>` - güncellemeler için `patch|minor|major` (varsayılan: `patch`).
    - `--changelog <text>` - etkileşimsiz güncellemeler için değişiklik günlüğü.
    - `--tags <tags>` - virgülle ayrılmış etiketler (varsayılan: `latest`).
    - `--concurrency <n>` - kayıt defteri denetimleri (varsayılan: `4`).

  </Accordion>
</AccordionGroup>

## Yaygın iş akışları

<Tabs>
  <Tab title="Ara">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Bir Plugin bul">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Yükle">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Tümünü güncelle">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Tek bir skill yayımla">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Birçok skill eşitle">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="GitHub'dan bir Plugin yayımla">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin paketi meta verileri

Kod Plugin'leri, gerekli OpenClaw meta verilerini
`package.json` içinde içermelidir:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Yayımlanan paketler **derlenmiş JavaScript** ile gönderilmeli ve
`runtimeExtensions` bu çıktıyı göstermelidir. Git checkout kurulumları,
derlenmiş dosya yoksa hâlâ TypeScript kaynağına geri dönebilir, ancak
derlenmiş çalışma zamanı girişleri başlangıç, doctor ve
Plugin yükleme yollarında çalışma zamanı TypeScript derlemesini önler.

## Sürümleme, lockfile ve telemetri

<AccordionGroup>
  <Accordion title="Sürümleme ve etiketler">
    - Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
    - Etiketler (`latest` gibi) bir sürümü gösterir; etiketleri taşımak geri almanıza olanak tanır.
    - Değişiklik günlükleri sürüm başına eklenir ve güncellemeleri eşitlerken veya yayımlarken boş olabilir.

  </Accordion>
  <Accordion title="Yerel değişiklikler ve registry sürümleri">
    Güncellemeler, yerel skill içeriklerini bir içerik hash'i kullanarak
    registry sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış
    herhangi bir sürümle eşleşmiyorsa CLI, üzerine yazmadan önce sorar
    (veya etkileşimsiz çalıştırmalarda `--force` gerektirir).
  </Accordion>
  <Accordion title="Eşitleme taraması ve yedek kökler">
    `clawhub sync` önce geçerli workdir'inizi tarar. Hiç skill
    bulunamazsa bilinen eski konumlara geri döner (örneğin
    `~/openclaw/skills` ve `~/.openclaw/skills`). Bu, ek bayraklar olmadan
    eski skill kurulumlarını bulmak için tasarlanmıştır.
  </Accordion>
  <Accordion title="Depolama ve lockfile">
    - Kurulu skill'ler workdir'iniz altında `.clawhub/lock.json` içine kaydedilir.
    - Kimlik doğrulama token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

  </Accordion>
  <Accordion title="Telemetri (kurulum sayıları)">
    Oturum açmışken `clawhub sync` çalıştırdığınızda CLI, kurulum
    sayılarını hesaplamak için minimal bir anlık görüntü gönderir. Bunu
    tamamen devre dışı bırakabilirsiniz:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

| Değişken                      | Etki                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Site URL'sini geçersiz kılar.                   |
| `CLAWHUB_REGISTRY`            | Registry API URL'sini geçersiz kılar.           |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin token/yapılandırmayı nerede sakladığını geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan workdir'i geçersiz kılar.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` sırasında telemetriyi devre dışı bırakır. |

## İlgili

- [Topluluk Plugin'leri](/tr/plugins/community)
- [Plugin'ler](/tr/tools/plugin)
- [Skills](/tr/tools/skills)
