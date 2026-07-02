---
read_when:
    - ClawHub CLI'yi kullanma
    - Kurulum, güncelleme veya yayımlama hatalarını ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma ve kilit dosyası davranışı.'
x-i18n:
    generated_at: "2026-07-02T17:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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
- `--dir <dir>`: workdir altındaki kurulum dizini (varsayılan: `skills`)
- `--site <url>`: tarayıcı oturum açma için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, yoksa `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırakır

Ortam değişkeni karşılıkları:

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
`HTTP_PROXY` kullanılır. Belirli ana makineler veya etki alanları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(ör. Docker container'ları, yalnızca proxy ile internete çıkan Hetzner VPS,
kurumsal güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Hiçbir proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API token'ınızı + önbelleğe alınmış registry URL'sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresinde açar ve loopback callback üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `token`

- Saklanan API token'ını stdout'a yazdırır.
- Yerel oturum açma token'ını CI secret kurulum komutlarına pipe etmek için kullanışlıdır.

### `star <skill>` / `unstar <skill>`

- Bir beceriyi öne çıkanlarınıza ekler/kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Çıktı beceri slug'ını, sahip handle'ını, görünen adı ve alaka puanını içerir.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi tek başına bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- Popülerlik küçük bir sıralama önceliğidir, en üstte yer alma garantisi değildir.
- Bir beceri görünmesi gerekirken görünmüyorsa, metadata'yı yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect @owner/slug` çalıştırın.

### `explore`

- En yeni becerileri `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan sıralı).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|rating|downloads|trending` (varsayılan: newest). Eski install sıralama takma adları uyumluluk için hâlâ çalışır.
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect @owner/slug`

- Kurulum yapmadan beceri metadata'sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (ör. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçilen sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200 KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install @owner/slug`

- Adlandırılan sahip ve beceri için en son sürümü çözer.
- Zip'i `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş becerilerin üzerine yazmayı reddeder; önce `clawhub unpin <skill>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Oturum açıkken mevcut kurulum sayılarının devre dışı bırakılabilmesi için
  en iyi çabayla telemetry gönderir.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- İsteğe bağlı gerekçe dahil olmak üzere `clawhub pin` ile dondurulan becerilerin yanında `pinned` gösterir.

### `pin <skill>`

- Kurulu bir beceriyi lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` becerinin neden dondurulduğunu kaydeder.
- Sabitlenmiş beceriler `update --all` tarafından atlanır ve doğrudan `update <skill>` tarafından reddedilir.
- Sabitlenmiş beceriler ayrıca yerel baytların yanlışlıkla değiştirilememesi için `install --force` işlemini de reddeder.

### `unpin <skill>`

- Gelecekteki güncellemelerin değiştirebilmesi için kurulu bir beceriden lockfile sabitlemesini kaldırır.

### `update [@owner/slug]` / `update --all`

- Yerel dosyalardan fingerprint hesaplar.
- Fingerprint bilinen bir sürümle eşleşirse: istem yok.
- Fingerprint eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş beceriler `--force` ile asla güncellenmez.
- `update <skill>` sabitlenmiş beceriler için hızlıca başarısız olur ve önce `clawhub unpin <skill>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve neyin dondurulmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- Yerel bundle fingerprint'ini ClawHub ile karşılaştırır ve içerik zaten yayımlanmışsa
  başarıyla çıkar.
- Yeni beceriler varsayılan olarak `1.0.0`; değişen beceriler varsayılan olarak bir sonraki patch
  sürüm olur.
- `--version <version>` açıkça bir sürüm seçer ve içerik mevcut bir sürümle
  eşleşse bile yayımlar.
- `--dry-run` yükleme yapmadan publish işlemini çözer; `--json` makine tarafından
  okunabilir bir sonuç yazdırır.
- `--owner <handle>` aktörün publisher erişimi olduğunda bir org/kullanıcı publisher handle'ı altında yayımlar.
- `--migrate-owner` mevcut bir beceriyi yeni bir sürüm yayımlarken `--owner` altına taşır.
  Her iki publisher üzerinde admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir beceriyi yayımlamak, onun ClawHub üzerinde `MIT-0` altında yayımlandığı anlamına gelir.
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
workflow'u, tek bir `skill_path` için veya `root` altındaki (varsayılan: `skills`) her doğrudan beceri
klasörü için `skill publish` çağırır. Değişmemiş becerileri atlar ve aynı
otomatik patch sürümü davranışını kullanır.

Token olmadan önizleme yapmak için `dry_run: true` ayarlayın. Gerçek publish işlemleri
`clawhub_token` secret'ını gerektirir.

### `sync`

- Geçerli workdir'i, yapılandırılmış skills dizinini ve `SKILL.md` veya
  `skill.md` içeren yerel beceri klasörleri için tüm `--root <dir>` klasörlerini tarar.
- Her yerel beceri fingerprint'ini ClawHub ile karşılaştırır ve yalnızca yeni veya
  değişmiş becerileri yayımlar.
- Yeni beceriler `1.0.0` olarak yayımlanır; değişen beceriler varsayılan olarak bir sonraki patch sürümüyle
  yayımlanır. Daha büyük bir semver adımıyla ilerlemesi gereken güncelleme grupları için
  `--bump minor|major` kullanın.
- `--dry-run` yükleme yapmadan publish planını gösterir; `--json` makine tarafından
  okunabilir bir plan yazdırır.
- `--all` her yeni veya değişmiş beceriyi istem göstermeden yayımlar. `--all`
  olmadan, etkileşimli terminaller yayımlanacak becerileri seçmenize izin verir.
- `--owner <handle>` aktörün publisher erişimi olduğunda bir org/kullanıcı publisher handle'ı altında yayımlar.
- `sync` yalnızca tek yönlü publish işlemidir. Kurmaz, güncellemez, indirmez veya
  kurulum/indirme telemetry'si raporlamaz.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` gerektirir.
- ClawHub ClawScan'i `POST /api/v1/skills/-/scan` üzerinden çalıştırır, ardından tarama terminal olana kadar poll eder.
- Taramalar asenkrondur ve tamamlanması zaman alabilir. Kuyruktayken terminal spinner'ı geçerli öncelikli tarama konumunu ve önde kaç tarama olduğunu gösterir.
- Yayımlanmış taramalar sahiplik veya publisher yönetim erişimi gerektirir. Moderatörler/adminler aynı backend'i `clawhub-admin` üzerinden kullanabilir.
- `--update` yalnızca `--slug` ile geçerlidir; başarılı yayımlanmış tarama sonuçlarını seçilen sürüme geri yazar.
- `--output <file.zip>` tam rapor arşivini `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` ile indirir.
- `--json` otomasyon için tam poll yanıtını yazdırır.
- Yerel yol taramaları artık desteklenmez. Yeni bir sürüm yükleyin, ardından gönderilen o sürüm için saklanan tarama sonuçlarını almak üzere `scan download` kullanın.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` gerektirir.
- ClawHub güvenlik kontrolleri tarafından engellenmiş veya gizlenmiş sürümler dahil, gönderilen bir beceri veya Plugin sürümü için saklanan tarama raporu ZIP'ini indirir.
- Beceri indirmeleri beceri slug'ını kullanır ve varsayılan olarak `--kind skill` olur.
- Plugin indirmeleri paket adını kullanır ve `--kind plugin` gerektirir.
- Yazarların ClawHub'ın engellediği tam gönderilen sürümü incelemesi için `--version` gereklidir.
- `--output <file.zip>` hedef yolu seçer.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub, beceri repo'ları ve katalog repo'ları için
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
adresinde resmi bir yeniden kullanılabilir workflow sunar.

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

- `root`, katalog repo'ları için varsayılan olarak `skills` olur.
- Bir beceri klasörünü işlemek için `skill_path: skills/review-helper` geçin.
- `owner`, CLI `--owner` bayrağına eşlenir; kimliği doğrulanmış kullanıcı olarak yayımlamak için atlayın.
- V1 beceri publish işlemi `clawhub_token` kullanır; GitHub OIDC trusted publishing şimdilik yalnızca paketler içindir.

### `delete <skill>`

- `--version` olmadan, bir beceriyi geçici olarak siler (sahip, moderatör veya admin).
- `DELETE /api/v1/skills/{slug}` çağrısını yapar.
- Sahip tarafından başlatılan geçici silmeler, slug değerini 30 gün boyunca ayırır; komut süre sonu zamanını yazdırır.
- `--version <version>`, sahip olunan ve en son olmayan tek bir sürümü hata durumunda kapalı,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Mevcut en son sürümü silmeden önce
  bir yedek yayımlayın. Platform personeli, yalnızca sürüm akışında sahipliği atlayamaz.
- `--reason <text>`, tüm beceriye yönelik geçici silmede ve denetim günlüğünde bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes`, onayı atlar.

### `undelete <skill>`

- Gizli bir beceriyi geri yükler (sahip, moderatör veya admin).
- Sürüm geri silme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- `POST /api/v1/skills/{slug}/undelete` çağrısını yapar.
- `--reason <text>`, beceriye ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes`, onayı atlar.

### `hide <skill>`

- Bir beceriyi gizler (sahip, moderatör veya admin).
- `delete` için takma addır.

### `unhide <skill>`

- Bir beceriyi görünür yapar (sahip, moderatör veya admin).
- `undelete` için takma addır.

### `skill rename <skill> <new-name>`

- Sahip olunan bir beceriyi yeniden adlandırır ve önceki slug değerini yönlendirme takma adı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağrısını yapar.
- `--yes`, onayı atlar.

### `skill merge <source> <target>`

- Sahip olunan bir beceriyi sahip olunan başka bir beceriyle birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendirme takma adı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısını yapar.
- `--yes`, onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayımlayıcı tanıtıcılarına aktarımlar, aktörün hem mevcut sahipte hem de hedef yayımlayıcıda
  admin erişimi olduğunda hemen uygulanır.
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

- Birleşik paket kataloğunda `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden gezinir veya arama yapar.
- Bunu Plugin'ler ve diğer paket ailesi girdileri için kullanın; üst düzey `search`, beceri arama yüzeyi olarak kalır.
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

- Kurulum yapmadan paket meta verilerini getirir.
- Bunu Plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü incele (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (ör. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçili sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü
  `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Yapıyı çözümleyicinin `downloadUrl` değerinden indirir.
- Tüm yapılar için ClawHub SHA-256 doğrulaması yapar.
- ClawPack npm-pack yapıları için ayrıca npm `sha512` bütünlüğünü,
  npm shasum değerini ve tarball içindeki `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri eski ZIP rotası üzerinden indirilir.
- Bayraklar:
  - `--version <version>`: belirli bir sürümü indir.
  - `--tag <tag>`: etiketlenmiş bir sürümü indir (varsayılan: `latest`).
  - `-o, --output <path>`: çıktı dosyası veya dizini.
  - `--force`: mevcut bir çıktı dosyasının üzerine yaz.
  - `--json`: makine tarafından okunabilir çıktı.

Örnekler:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Yerel bir yapı için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve
  yerel dosyayı yayımlanmış yapı meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla, ağ araması yapmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen yapı meta verilerini çözümlemek için paket adı.
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

- ClawHub CLI ile birlikte gelen Plugin Inspector'ı yerel bir Plugin paketi
  klasörüne karşı çalıştırır.
- Yerel bir OpenClaw checkout konumunu bulmadan veya içe aktarmadan, varsayılan olarak çevrimdışı/statik doğrulama yapar.
- Kesin uyumluluk hataları sıfır olmayan çıkış koduyla çıkar. Yalnızca uyarı niteliğindeki bulgular yazdırılır ancak
  sıfır çıkış koduyla çıkar.
- Bayraklar:
  - `--out <dir>`: Plugin Inspector raporlarını bu dizine yaz.
  - `--openclaw <path>`: açık bir yerel OpenClaw checkout'a karşı incele.
  - `--runtime`: çalışma zamanı yakalamayı etkinleştir; Plugin kodunu içe aktarır.
  - `--allow-execute`: yalıtılmış bir çalışma alanında çalışma zamanı yakalamaya izin ver.
  - `--no-mock-sdk`: çalışma zamanı yakalama sırasında sahte OpenClaw SDK'yı devre dışı bırak.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package validate ./example-plugin
```

Doğrulama bir paket, manifest, SDK import veya yapı bulgusu bildirirse
[Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes) bölümüne bakın, ardından komutu yeniden çalıştırın.

### `package delete <name>`

- `--version` olmadan, bir paketi ve tüm sürümleri geçici olarak siler.
- `--version <version>`, sahip olunan ve en son olmayan tek bir sürümü hata durumunda kapalı,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Mevcut en son sürümü silmeden önce
  bir yedek yayımlayın. Bu yalnızca sürüm akışı, paket sahibini veya bir kuruluş yayımlayıcı
  admin'ini gerektirir; platform personeli paket sahipliğini atlayamaz.
- Tüm paket geçici silmesi; paket sahibini, kuruluş yayımlayıcı sahip/admin'ini, platform
  moderatörünü veya platform admin'ini gerektirir.
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

- Geçici olarak silinmiş bir paketi ve sürümleri geri yükler.
- Sürüm geri silme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- Paket sahibini, kuruluş yayımlayıcı sahip/admin'ini, platform moderatörünü
  veya platform admin'ini gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısını yapar.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir yayımlayıcıya aktarır.
- Bir platform admin'i tarafından yapılmadıkça, hem mevcut paket sahibine hem de hedef
  yayımlayıcıya admin erişimi gerektirir.
- Kapsamlı paket adları eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısını yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayımlayıcı tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim gerekçesi.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağrısını yapar.
- Bildirimler paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir ve inceleme için
  moderatörlere görünür olur.
- Bildirimler, tek başına paketleri otomatik olarak gizlemez veya indirmeleri engellemez.
- Bayraklar:
  - `--version <version>`: bildirime eklenecek isteğe bağlı paket sürümü.
  - `--reason <text>`: gerekli bildirim gerekçesi.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısını yapar.
- Mevcut paket tarama durumunu, açık bildirim sayısını, en son sürüm manuel
  moderasyon durumunu, indirme engeli durumunu ve moderasyon gerekçelerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekteki OpenClaw tüketimi için hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısını yapar.
- Resmi durum, ClawPack kullanılabilirliği, yapı özeti,
  kaynak kökeni, OpenClaw uyumluluğu, ana makine hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri bildirir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Birlikte gelen bir OpenClaw Plugin'inin yerini alabilecek bir paket için operatör odaklı
  geçiş durumunu gösterir.
- `package readiness` ile aynı hesaplanmış hazırlık uç noktasını çağırır, ancak
  geçiş odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Kimliği doğrulanmış kullanıcının sahip olduğu bir kuruluş yayımlayıcısı oluşturur.
- Tanıtıcı küçük harfe normalleştirilir ve `@` ile veya olmadan geçirilebilir.
- Yeni oluşturulan kuruluş yayımlayıcıları varsayılan olarak güvenilir/resmi değildir.
- Tanıtıcı mevcut bir yayımlayıcı, kullanıcı veya ayrılmış rota tarafından zaten kullanılıyorsa başarısız olur.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Bir code plugin veya bundle plugin'i `POST /api/v1/packages` üzerinden yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Metadata, `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json`
  gibi gerçek OpenClaw bundle işaretçilerinden otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak değerlendirilir. CLI, tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  metadata ön doldurma için kullanır.
- Code-plugin klasörleri, yüklemeden önce bir ClawPack npm tarball olarak paketlenir; böylece
  OpenClaw kurulumları tam artifact'i doğrulayabilir. Bundle-plugin klasörleri ise hâlâ
  çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı depo, çözümlenmiş commit, ref ve alt yoldan otomatik doldurulur.
- Yerel klasörler için kaynak atfı, origin remote GitHub'ı işaret ettiğinde yerel git üzerinden otomatik algılanır.
- Harici code plugin'ler `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için fallback olarak kullanılmaz.
- `--dry-run`, çözümlenmiş yayımlama payload'unu yüklemeden önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün publisher erişimi olduğunda bir kullanıcı veya kuruluş publisher handle'ı altında yayımlar.
- Kapsamlı paket adları seçilen owner ile eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) override olarak çalışmaya devam eder.
- Private GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Önerilen yerel akış

Canlı release oluşturmadan önce çözümlenmiş paket metadata'sını ve
kaynak atfını doğrulayabilmeniz için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Code plugin'ler için klasör yayımlama, paket klasöründen bir ClawPack artifact'i oluşturup yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için minimal `package.json`

Harici code plugin'lerin `package.json` içinde az miktarda OpenClaw metadata'sına
ihtiyacı vardır. Bu minimal manifest başarılı bir yayımlama için yeterlidir:

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

- `package.json.version`, paket release sürümünüzdür, ancak OpenClaw uyumluluk/build doğrulaması için
  fallback olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı metadata'dır.
  ClawHub mevcut olduklarında bunları gösterebilir, ancak yayımlama için zorunlu değildir.
- `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion`, daha ayrıntılı uyumluluk metadata'sı yayımlamak isterseniz isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI release'i kullanıyorsanız, yerel preflight kontrollerinin yüklemeden önce çalışması için
  yayımlamadan önce yükseltin.
- Doğrulama bir remediation kodu bildirirse bkz.
  [Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub ayrıca plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir workflow da sağlar.

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
- Monorepo'lar için workflow'un plugin paket klasörünü yayımlaması amacıyla `source_path` geçin;
  örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow'u kararlı bir etikete veya tam commit SHA'ya pinleyin. Release yayımlamayı `@main` üzerinden çalıştırmayın.
- `pull_request`, CI'ın kirletici olmaması için `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya tag push'ları gibi güvenilir event'lerle sınırlandırılmalıdır.
- Secret olmadan trusted publishing yalnızca `workflow_dispatch` üzerinde çalışır; tag push'ları hâlâ `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya break-glass yayımlamalar için `clawhub_token` kullanılabilir tutun.
- Workflow, JSON sonucunu artifact olarak yükler ve workflow çıktıları olarak sunar.

### `package trusted-publisher get <name>`

- Bir paket için GitHub Actions trusted publisher yapılandırmasını gösterir.
- Depoyu, workflow dosya adını ve isteğe bağlı environment pin'ini doğrulamak için
  yapılandırmayı ayarladıktan sonra bunu kullanın.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Mevcut bir paket için GitHub Actions trusted publisher yapılandırmasını ekler veya değiştirir.
- Paket önce normal manuel veya token ile kimliği doğrulanmış
  `clawhub package publish` üzerinden oluşturulmalıdır.
- Yapılandırma ayarlandıktan sonra, gelecekte desteklenen GitHub Actions yayımlamaları
  uzun ömürlü bir ClawHub token olmadan OIDC/trusted publishing kullanabilir.
- `--repository <repo>` değeri `owner/repo` olmalıdır.
- `--workflow-filename <file>`, `.github/workflows/` içindeki workflow dosya adıyla eşleşmelidir.
- `--environment <name>` isteğe bağlıdır. Yapılandırıldığında, OIDC claim içindeki GitHub Actions
  environment tam olarak eşleşmelidir.
- ClawHub, bu komut çalıştığında yapılandırılmış GitHub deposunu doğrular.
  Public depolar public GitHub metadata'sı üzerinden doğrulanabilir. Private
  depolar, örneğin gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkili
  GitHub entegrasyonu aracılığıyla ClawHub'ın bu depoya GitHub erişimi olmasını gerektirir.
- Bayraklar:
  - `--repository <repo>`: GitHub deposu, örneğin `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflow dosya adı, örneğin `package-publish.yml`.
  - `--environment <name>`: isteğe bağlı tam eşleşmeli GitHub Actions environment.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Bir paketten trusted publisher yapılandırmasını kaldırır.
- Workflow, depo veya environment pin'in devre dışı bırakılması ya da yeniden oluşturulması gerekiyorsa
  bunu rollback olarak kullanın.
- Gelecekteki gerçek yayımlamalar, yapılandırma tekrar ayarlanana kadar normal kimliği doğrulanmış yayımlamayı kullanmalıdır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Kurulum telemetrisi

- Oturum açıldığında `clawhub install <slug>` sonrasında gönderilir, ancak
  `CLAWHUB_DISABLE_TELEMETRY=1` ayarlanmışsa gönderilmez.
- Raporlama best-effort temelindedir. Telemetri kullanılamazsa kurulum komutları
  başarısız olmaz.
- Ayrıntılar: `docs/telemetry.md`.
