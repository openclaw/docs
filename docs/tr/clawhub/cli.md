---
read_when:
    - ClawHub CLI'ı Kullanma
    - Kurulum, güncelleme veya yayımlamada hata ayıklama
summary: 'CLI referansı: komutlar, bayraklar, yapılandırma ve kilit dosyası davranışı.'
x-i18n:
    generated_at: "2026-06-30T14:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, ikili: `clawhub`.

npm veya pnpm ile global olarak kurun:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Ardından doğrulayın:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Global bayraklar

- `--workdir <dir>`: çalışma dizini (varsayılan: cwd; yapılandırılmışsa Clawdbot çalışma alanına geri döner)
- `--dir <dir>`: workdir altında kurulum dizini (varsayılan: `skills`)
- `--site <url>`: tarayıcı girişi için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, yoksa `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırakır

Ortam eşdeğerleri:

- `CLAWHUB_SITE` (eski `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (eski `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (eski `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI, kurumsal proxy'lerin veya kısıtlı ağların arkasındaki sistemler için
standart HTTP proxy ortam değişkenlerine uyar:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Bu değişkenlerden herhangi biri ayarlandığında CLI, giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli host'lar veya alan adları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(ör. Docker kapsayıcıları, yalnızca proxy internetli Hetzner VPS, kurumsal
güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Hiçbir proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API belirtecinizi + önbelleğe alınmış kayıt URL'sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ama `clawdhub/config.json` varsa CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresinde açar ve local loopback geri çağrısı üzerinden tamamlar.
- Başsız: `clawhub login --token clh_...`
- Uzak/başsız etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan belirteci `/api/v1/whoami` üzerinden doğrular.

### `token`

- Saklanan API belirtecini stdout'a yazdırır.
- Yerel giriş belirtecini CI gizli anahtar kurulum komutlarına aktarmak için kullanışlıdır.

### `star <skill>` / `unstar <skill>`

- Vurgularınıza bir beceri ekler veya kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Çıktı beceri slug'ını, sahip tanıtıcısını, görünen adı ve alaka puanını içerir.
- Arama, indirme popülerliğinden önce tam slug/ad belirteci eşleşmelerini tercih eder. `map` gibi bağımsız bir slug belirteci, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- Popülerlik küçük bir sıralama önceliğidir, en üst konum garantisi değildir.
- Bir becerinin görünmesi gerekiyor ama görünmüyorsa, metaveriyi yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect @owner/slug` çalıştırın.

### `explore`

- En yeni becerileri `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan olarak sıralanır).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|rating|downloads|trending` (varsayılan: newest). Eski kurulum sıralama takma adları uyumluluk için hâlâ çalışır.
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect @owner/slug`

- Kurulum yapmadan beceri metaverilerini ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: latest).
- `--tag <tag>`: etiketli bir sürümü inceleyin (ör. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm (1-200).
- `--files`: seçilen sürümün dosyalarını listeleyin.
- `--file <path>`: ham dosya içeriğini getirin (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install @owner/slug`

- Adlandırılan sahip ve beceri için en son sürümü çözer.
- Zip dosyasını `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş becerilerin üzerine yazmayı reddeder; önce `clawhub unpin <skill>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Geçerli kurulum sayılarının devre dışı bırakılabilmesi için oturum açıkken
  en iyi çabayla telemetri gönderir.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- İsteğe bağlı neden dahil, `clawhub pin` ile dondurulan becerilerin yanında `pinned` gösterir.

### `pin <skill>`

- Kurulu bir beceriyi lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` becerinin neden dondurulduğunu kaydeder.
- Sabitlenmiş beceriler `update --all` tarafından atlanır ve doğrudan `update <skill>` tarafından reddedilir.
- Sabitlenmiş beceriler ayrıca yerel baytların yanlışlıkla değiştirilememesi için `install --force` komutunu da reddeder.

### `unpin <skill>`

- Gelecekteki güncellemelerin değiştirebilmesi için kurulu bir beceriden lockfile sabitlemesini kaldırır.

### `update [@owner/slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem yoktur.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş beceriler `--force` tarafından asla güncellenmez.
- `update <skill>` sabitlenmiş beceriler için hızlıca başarısız olur ve önce `clawhub unpin <skill>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve donmuş kalanların özetini yazdırır.

### `skill publish <path>`

- Yerel paket parmak izini ClawHub ile karşılaştırır ve içerik zaten
  yayımlanmışsa başarıyla çıkar.
- Yeni beceriler varsayılan olarak `1.0.0` olur; değişen beceriler varsayılan
  olarak bir sonraki yama sürümüne geçer.
- `--version <version>` açıkça bir sürüm seçer ve içerik mevcut bir sürümle
  eşleşse bile yayımlar.
- `--dry-run` yükleme yapmadan yayımı çözer; `--json` makine tarafından
  okunabilir bir sonuç yazdırır.
- `--owner <handle>`, aktörün yayımlayıcı erişimi olduğunda bir kuruluş/kullanıcı yayımlayıcı tanıtıcısı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir beceriyi `--owner` altına taşır. Her iki yayımlayıcıda da yönetici/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir beceri yayımlamak, onun ClawHub üzerinde `MIT-0` altında yayımlandığı anlamına gelir.
- Yayımlanan beceriler atıf gerektirmeden ücretsiz olarak kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli becerileri veya beceri başına fiyatlandırmayı desteklemez.
- Eski takma ad: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub'ın yeniden kullanılabilir
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
iş akışı, bir `skill_path` için veya `root` (varsayılan: `skills`) altındaki
her doğrudan beceri klasörü için `skill publish` çağırır. Değişmeyen becerileri
atlar ve aynı otomatik yama sürümü davranışını kullanır.

Belirteç olmadan önizlemek için `dry_run: true` ayarlayın. Gerçek yayımlar
`clawhub_token` gizli anahtarını gerektirir.

### `sync`

- Geçerli workdir'i, yapılandırılmış beceriler dizinini ve `SKILL.md` veya
  `skill.md` içeren yerel beceri klasörleri için tüm `--root <dir>` klasörlerini
  tarar.
- Her yerel beceri parmak izini ClawHub ile karşılaştırır ve yalnızca yeni veya
  değişmiş becerileri yayımlar.
- Yeni beceriler `1.0.0` olarak yayımlanır; değişen beceriler varsayılan olarak
  bir sonraki yama sürümünü yayımlar. Daha büyük bir semver adımıyla ilerlemesi
  gereken güncelleme grupları için `--bump minor|major` kullanın.
- `--dry-run` yükleme yapmadan yayım planını gösterir; `--json` makine tarafından
  okunabilir bir plan yazdırır.
- `--all` her yeni veya değişmiş beceriyi istem göstermeden yayımlar. `--all`
  olmadan, etkileşimli terminaller yayımlanacak becerileri seçmenize izin verir.
- `--owner <handle>`, aktörün yayımlayıcı erişimi olduğunda bir kuruluş/kullanıcı yayımlayıcı tanıtıcısı altında yayımlar.
- `sync` yalnızca tek yönlü yayımdır. Kurulum yapmaz, güncellemez, indirmez veya
  kurulum/indirme telemetrisi raporlamaz.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` gerektirir.
- ClawHub ClawScan'i `POST /api/v1/skills/-/scan` üzerinden çalıştırır, ardından tarama terminal olana kadar yoklama yapar.
- Taramalar asenkrondur ve tamamlanması zaman alabilir. Kuyruktayken terminal döndürücüsü geçerli öncelikli tarama konumunu ve önde kaç tarama olduğunu gösterir.
- Yayımlanmış taramalar sahiplik veya yayımlayıcı yönetim erişimi gerektirir. Moderatörler/yöneticiler aynı arka ucu `clawhub-admin` üzerinden kullanabilir.
- `--update` yalnızca `--slug` ile geçerlidir; başarılı yayımlanmış tarama sonuçlarını seçilen sürüme geri yazar.
- `--output <file.zip>` tam rapor arşivini `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` ile indirir.
- `--json` otomasyon için tam yoklama yanıtını yazdırır.
- Yerel yol taramaları artık desteklenmez. Yeni bir sürüm yükleyin, ardından gönderilen o sürüm için saklanan tarama sonuçlarını almak üzere `scan download` kullanın.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` gerektirir.
- ClawHub güvenlik kontrolleri tarafından engellenen veya gizlenen sürümler dahil, gönderilen bir beceri veya plugin sürümü için saklanan tarama raporu ZIP dosyasını indirir.
- Beceri indirmeleri beceri slug'ını kullanır ve varsayılan olarak `--kind skill` olur.
- Plugin indirmeleri paket adını kullanır ve `--kind plugin` gerektirir.
- Yazarların ClawHub'ın engellediği tam gönderilmiş sürümü inceleyebilmesi için `--version` gereklidir.
- `--output <file.zip>` hedef yolu seçer.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub, beceri repoları ve katalog repoları için resmi bir yeniden kullanılabilir iş akışını
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
konumunda sunar.

Tipik katalog kurulumu:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notlar:

- `root`, katalog repoları için varsayılan olarak `skills` olur.
- Bir beceri klasörünü işlemek için `skill_path: skills/review-helper` geçin.
- `owner`, CLI `--owner` bayrağına eşlenir; kimliği doğrulanmış kullanıcı olarak yayımlamak için atlayın.
- V1 beceri yayımı `clawhub_token` kullanır; GitHub OIDC güvenilir yayımı şimdilik yalnızca paketler içindir.

### `delete <skill>`

- `--version` olmadan bir beceriyi geçici olarak siler (sahip, moderatör veya yönetici).
- `DELETE /api/v1/skills/{slug}` çağrısını yapar.
- Sahip tarafından başlatılan geçici silmeler, slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--version <version>`, sahip olunan en son olmayan tek bir sürümü hata durumunda kapalı,
  sürüme özel bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce bir yedek yayımlayın.
  Platform personeli, yalnızca sürüme yönelik bu akışta sahipliği atlayamaz.
- `--reason <text>`, tüm beceri geçici silmesi ve denetim günlüğü için bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `undelete <skill>`

- Gizlenmiş bir beceriyi geri yükler (sahip, moderatör veya yönetici).
- Sürüm geri yükleme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- `POST /api/v1/skills/{slug}/undelete` çağrısını yapar.
- `--reason <text>`, beceri ve denetim günlüğü için bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `hide <skill>`

- Bir beceriyi gizler (sahip, moderatör veya yönetici).
- `delete` için takma addır.

### `unhide <skill>`

- Bir beceriyi görünür yapar (sahip, moderatör veya yönetici).
- `undelete` için takma addır.

### `skill rename <skill> <new-name>`

- Sahip olunan bir beceriyi yeniden adlandırır ve önceki slug'ı yönlendirme takma adı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağrısını yapar.
- `--yes` onayı atlar.

### `skill merge <source> <target>`

- Sahip olunan bir beceriyi, sahip olunan başka bir beceriyle birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendirme takma adı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısını yapar.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına yapılan aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayıncı tanıtıcılarına yapılan aktarımlar, yalnızca aktörün hem mevcut sahipte
  hem de hedef yayıncıda yönetici erişimi olduğunda hemen uygulanır.
- Alt komutlar:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Uç noktalar:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Birleşik paket kataloğuna `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden göz atar veya arama yapar.
- Bunu plugin'ler ve diğer paket ailesi girdileri için kullanın; üst düzey `search`, beceri arama yüzeyi olarak kalır.
- Bayraklar:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, varsayılan: 25)
  - `--json`

Örnekler:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Paketi kurmadan paket meta verilerini getirir.
- Bunu plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listeleyin.
- `--file <path>`: ham dosya içeriğini getirir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü
  `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Yapıtı çözümleyicinin `downloadUrl` adresinden indirir.
- Tüm yapıtlar için ClawHub SHA-256 doğrulaması yapar.
- ClawPack npm-pack yapıtları için ayrıca npm `sha512` bütünlüğünü,
  npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri, eski ZIP rotası üzerinden indirilir.
- Bayraklar:
  - `--version <version>`: belirli bir sürümü indirin.
  - `--tag <tag>`: etiketlenmiş bir sürümü indirin (varsayılan: `latest`).
  - `-o, --output <path>`: çıktı dosyası veya dizini.
  - `--force`: mevcut bir çıktı dosyasının üzerine yaz.
  - `--json`: makine tarafından okunabilir çıktı.

Örnekler:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Yerel bir yapıt için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve
  yerel dosyayı yayımlanan yapıt meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla, ağ araması olmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen yapıt meta verilerini çözümlemek için paket adı.
  - `--version <version>` veya `--tag <tag>`: beklenen paket sürümü.
  - `--sha256 <hex>`: beklenen ClawHub SHA-256.
  - `--npm-integrity <sri>`: beklenen npm bütünlüğü.
  - `--npm-shasum <sha1>`: beklenen npm shasum.
  - `--json`: makine tarafından okunabilir çıktı.

Örnekler:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- ClawHub CLI'nin paketli Plugin Inspector aracını yerel bir plugin paketi
  klasörüne karşı çalıştırır.
- Yerel bir OpenClaw checkout bulmadan veya içe aktarmadan, varsayılan olarak
  çevrimdışı/statik doğrulama yapar.
- Sert uyumluluk hataları sıfır olmayan çıkış koduyla çıkar. Yalnızca uyarı olan bulgular yazdırılır ancak
  sıfır çıkış koduyla çıkar.
- Bayraklar:
  - `--out <dir>`: Plugin Inspector raporlarını bu dizine yaz.
  - `--openclaw <path>`: açık bir yerel OpenClaw checkout'a karşı incele.
  - `--runtime`: çalışma zamanı yakalamayı etkinleştir; plugin kodunu içe aktarır.
  - `--allow-execute`: yalıtılmış bir çalışma alanında çalışma zamanı yakalamaya izin ver.
  - `--no-mock-sdk`: çalışma zamanı yakalama sırasında taklit edilen OpenClaw SDK'yı devre dışı bırak.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package validate ./example-plugin
```

Doğrulama bir paket, manifest, SDK içe aktarma veya yapıt bulgusu raporlarsa
[Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes) bölümüne bakın, ardından komutu yeniden çalıştırın.

### `package delete <name>`

- `--version` olmadan bir paketi ve tüm yayınları geçici olarak siler.
- `--version <version>`, sahip olunan en son olmayan tek bir yayını hata durumunda kapalı,
  sürüme özel bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce bir yedek yayımlayın.
  Yalnızca sürüme yönelik bu akış, paket sahibini veya kuruluş yayıncısı
  yöneticisini gerektirir; platform personeli paket sahipliğini atlayamaz.
- Tüm paket geçici silmesi; paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform
  moderatörü veya platform yöneticisi gerektirir.
- Bayraklar:
  - `--version <version>`: en son olmayan tek bir sürümü kalıcı olarak sil.
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Geçici olarak silinen bir paketi ve yayınları geri yükler.
- Sürüm geri yükleme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- Paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısını yapar.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir yayıncıya aktarır.
- Platform yöneticisi tarafından gerçekleştirilmediği sürece, hem mevcut paket sahibine hem de hedef
  yayıncıya yönetici erişimi gerektirir.
- Kapsamlı paket adları, eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısını yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayıncı tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağrısını yapar.
- Raporlar paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir ve inceleme için
  moderatörlere görünür hale gelir.
- Raporlar kendi başlarına paketleri otomatik olarak gizlemez veya indirmeleri engellemez.
- Bayraklar:
  - `--version <version>`: rapora eklenecek isteğe bağlı paket sürümü.
  - `--reason <text>`: gerekli rapor nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısını yapar.
- Geçerli paket tarama durumunu, açık rapor sayısını, en son yayın manuel
  moderasyon durumunu, indirme engelleme durumunu ve moderasyon nedenlerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekteki OpenClaw tüketimi için hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısını yapar.
- Resmi durum, ClawPack kullanılabilirliği, yapıt özeti,
  kaynak kökeni, OpenClaw uyumluluğu, ana makine hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri raporlar.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Paketli bir OpenClaw plugin'inin yerini alabilecek bir paket için operatör odaklı
  geçiş durumunu gösterir.
- `package readiness` ile aynı hesaplanan hazır olma uç noktasını çağırır, ancak
  geçiş odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Kimliği doğrulanmış kullanıcının sahip olduğu bir kuruluş yayıncısı oluşturur.
- Tanıtıcı küçük harfe normalleştirilir ve `@` ile veya `@` olmadan geçirilebilir.
- Yeni oluşturulan kuruluş yayıncıları varsayılan olarak güvenilir/resmi değildir.
- Tanıtıcı mevcut bir yayıncı, kullanıcı veya ayrılmış rota tarafından zaten kullanılıyorsa başarısız olur.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Bir kod Plugin'i veya bundle Plugin'i `POST /api/v1/packages` üzerinden yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball'ı: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json`
  gibi gerçek OpenClaw bundle işaretçilerinden otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak ele alınır. CLI, birebir npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  meta veri ön doldurma için kullanır.
- Kod Plugin'i klasörleri, yüklemeden önce bir ClawPack npm tarball'ı olarak
  paketlenir; böylece OpenClaw kurulumları birebir artefaktı doğrulayabilir. Bundle Plugin'i klasörleri ise
  çıkarılmış dosya yayımlama yolunu kullanmaya devam eder.
- GitHub kaynakları için kaynak atfı depodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik doldurulur.
- Yerel klasörler için kaynak atfı, origin remote GitHub'ı işaret ettiğinde yerel git'ten otomatik algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` alanlarını açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, çözümlenen yayımlama payload'unu yüklemeden önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kullanıcı veya kuruluş yayımcı tanıtıcısı altında yayımlar.
- Kapsamlı paket adları seçilen sahip ile eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) geçersiz kılma olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Önerilen yerel akış

Canlı bir sürüm oluşturmadan önce çözümlenen paket meta verilerini ve
kaynak atfını doğrulayabilmek için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod Plugin'leri için klasör yayımlama, paket klasöründen bir ClawPack artefaktı oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için en küçük `package.json`

Harici kod Plugin'leri, `package.json` içinde az miktarda OpenClaw meta verisine
ihtiyaç duyar. Bu en küçük manifest başarılı bir yayımlama için yeterlidir:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Gerekli alanlar:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notlar:

- `package.json.version`, paket sürümünüzdür ancak OpenClaw uyumluluk/derleme
  doğrulaması için yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub mevcut olduklarında bunları gösterebilir, ancak yayımlama için gerekli değildirler.
- `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion`, daha ayrıntılı uyumluluk meta verileri yayımlamak
  isterseniz isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön kontrol
  denetimlerinin yüklemeden önce çalışması için yayımlamadan önce yükseltin.
- Doğrulama bir düzeltme kodu bildirirse bkz.
  [Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir workflow sunar.

Tipik çağıran kurulumu:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notlar:

- Yeniden kullanılabilir workflow, `source` değerini varsayılan olarak çağıran depoya ayarlar.
- Monorepo'lar için workflow'un Plugin paket klasörünü yayımlaması amacıyla
  `source_path` geçin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow'u kararlı bir etikete veya tam commit SHA'sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- CI'ın kirletici olmaması için `pull_request`, `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya etiket push'ları gibi güvenilir olaylarla sınırlandırılmalıdır.
- Gizli anahtar olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları yine de `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` kullanılabilir durumda tutun.
- Workflow JSON sonucunu artefakt olarak yükler ve workflow çıktıları olarak sunar.

### `package trusted-publisher get <name>`

- Bir paket için GitHub Actions güvenilir yayımcı yapılandırmasını gösterir.
- Yapılandırmayı ayarladıktan sonra depo, workflow dosya adı
  ve isteğe bağlı ortam sabitlemesini doğrulamak için bunu kullanın.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Mevcut bir paket için GitHub Actions güvenilir yayımcı yapılandırmasını ekler
  veya değiştirir.
- Paket önce normal manuel ya da token ile kimliği doğrulanmış
  `clawhub package publish` üzerinden oluşturulmalıdır.
- Yapılandırma ayarlandıktan sonra gelecekte desteklenen GitHub Actions yayımlamaları,
  uzun ömürlü bir ClawHub token'ı olmadan OIDC/güvenilir yayımlama kullanabilir.
- `--repository <repo>`, `owner/repo` olmalıdır.
- `--workflow-filename <file>`, `.github/workflows/` içindeki workflow dosya adıyla
  eşleşmelidir.
- `--environment <name>` isteğe bağlıdır. Yapılandırıldığında OIDC claim'indeki
  GitHub Actions ortamı birebir eşleşmelidir.
- ClawHub, bu komut çalıştığında yapılandırılan GitHub deposunu doğrular.
  Genel depolar, genel GitHub meta verileri üzerinden doğrulanabilir. Özel
  depolar, örneğin gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkili
  GitHub entegrasyonu aracılığıyla ClawHub'ın o depoya GitHub erişimi olmasını gerektirir.
- Bayraklar:
  - `--repository <repo>`: GitHub deposu, örneğin `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflow dosya adı, örneğin `package-publish.yml`.
  - `--environment <name>`: isteğe bağlı, birebir eşleşen GitHub Actions ortamı.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Bir paketten güvenilir yayımcı yapılandırmasını kaldırır.
- Workflow, depo veya ortam sabitlemesinin devre dışı bırakılması ya da yeniden oluşturulması
  gerekiyorsa bunu geri alma olarak kullanın.
- Gelecekteki gerçek yayımlamalar, yapılandırma tekrar ayarlanana kadar normal kimliği doğrulanmış yayımlama kullanmalıdır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Kurulum telemetrisi

- Oturum açılmışsa, `CLAWHUB_DISABLE_TELEMETRY=1` ayarlanmadığı sürece
  `clawhub install <slug>` sonrasında gönderilir.
- Raporlama en iyi çaba esasına dayanır. Telemetri kullanılamıyorsa kurulum komutları
  başarısız olmaz.
- Ayrıntılar: `docs/telemetry.md`.
