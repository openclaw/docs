---
read_when:
    - ClawHub CLI Kullanımı
    - Kurulum, güncelleme, yayımlama veya eşitlemede hata ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-12T23:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, ikili dosya: `clawhub`.

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

## Genel bayraklar

- `--workdir <dir>`: çalışma dizini (varsayılan: cwd; yapılandırılmışsa Clawdbot çalışma alanına geri döner)
- `--dir <dir>`: workdir altında kurulum dizini (varsayılan: `skills`)
- `--site <url>`: tarayıcı oturum açma için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL’si (varsayılan: keşfedilen, aksi halde `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırakır

Ortam eşdeğerleri:

- `CLAWHUB_SITE` (eski `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (eski `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (eski `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI, kurumsal proxy’lerin veya kısıtlı ağların arkasındaki sistemler için
standart HTTP proxy ortam değişkenlerine uyar:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Bu değişkenlerden herhangi biri ayarlandığında, CLI giden istekleri
belirtilen proxy üzerinden yönlendirir. `HTTPS_PROXY` HTTPS istekleri için,
`HTTP_PROXY` düz HTTP için kullanılır. Belirli ana makineler veya etki alanları
için proxy’yi atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(örn. Docker kapsayıcıları, yalnızca proxy üzerinden internete sahip Hetzner VPS,
kurumsal güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Hiçbir proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API belirtecinizi + önbelleğe alınmış registry URL’sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa, CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresinde açar ve loopback geri çağrısı üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz bunu `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan belirteci `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Öne çıkanlarınıza bir Skill ekler veya kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Arama, indirme popülerliğinden önce tam slug/ad belirteci eşleşmelerini tercih eder. `map` gibi bağımsız bir slug belirteci, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- İndirmeler küçük bir popülerlik önceliğidir, en üst sıraya yerleşme garantisi değildir.
- Bir Skill görünmesi gerekirken görünmüyorsa, metadata’yı yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect <slug>` çalıştırın.

### `explore`

- En yeni Skills kayıtlarını `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan sıralanır).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Skill metadata’sını ve sürüm dosyalarını kurulum yapmadan getirir.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçili sürüm için dosyaları listeleyin.
- `--file <path>`: ham dosya içeriğini getirin (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install <slug>`

- En son sürümü `/api/v1/skills/<slug>` üzerinden çözer.
- Zip dosyasını `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş Skills kayıtlarının üzerine yazmayı reddeder; önce `clawhub unpin <slug>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` dizinini kaldırır ve lockfile girdisini siler.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- `clawhub pin` ile dondurulmuş skills öğelerinin yanında, isteğe bağlı nedenle birlikte `pinned` gösterir.

### `pin <slug>`

- Yüklü bir skill öğesini lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` skill öğesinin neden dondurulduğunu kaydeder.
- Sabitlenmiş skills, `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Sabitlenmiş skills ayrıca yerel baytların yanlışlıkla değiştirilememesi için `install --force` işlemini de reddeder.

### `unpin <slug>`

- Gelecekteki güncellemelerin değiştirebilmesi için yüklü bir skill öğesinden lockfile sabitlemesini kaldırır.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem göstermez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş skills hiçbir zaman `--force` ile güncellenmez.
- `update <slug>` sabitlenmiş slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin donmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayımlar.
- semver gerektirir: `--version 1.2.3`.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı tanıtıcısı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir skill öğesini `--owner` hedefine taşır. Her iki yayımcıda da admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir skill yayımlamak, onun ClawHub üzerinde `MIT-0` kapsamında yayımlandığı anlamına gelir.
- Yayımlanmış skills, atıf olmadan kullanmak, değiştirmek ve yeniden dağıtmak için serbesttir.
- ClawHub ücretli skills veya skill başına fiyatlandırmayı desteklemez.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek davranışlar için bağlam sağlar. Not yayımlanan sürümde saklanır.
- Eski takma ad: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Bir skill öğesini geçici olarak siler (sahip, moderatör veya admin).
- `DELETE /api/v1/skills/{slug}` çağırır.
- Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca rezerve eder; komut sona erme zamanını yazdırır.
- `--reason <text>` skill üzerinde ve denetim günlüğünde bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizlenmiş bir skill öğesini geri yükler (sahip, moderatör veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağırır.
- `--reason <text>` skill üzerinde ve denetim günlüğünde bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir skill öğesini gizler (sahip, moderatör veya admin).
- `delete` için takma addır.

### `unhide <slug>`

- Bir skill öğesini görünür yapar (sahip, moderatör veya admin).
- `undelete` için takma addır.

### `skill rename <slug> <new-slug>`

- Sahip olunan bir skill öğesini yeniden adlandırır ve önceki slug'ı yönlendirme takma adı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağırır.
- `--yes` onayı atlar.

### `skill merge <source-slug> <target-slug>`

- Sahip olunan bir skill öğesini sahip olunan başka bir skill öğesiyle birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendirme takma adı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağırır.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı tanıtıcılarına aktarımlar yalnızca aktörün hem mevcut sahipte hem de hedef yayımcıda admin erişimi olduğunda hemen uygulanır.
- Alt komutlar:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Uç noktalar:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Birleşik paket kataloğuna `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden göz atar veya arama yapar.
- Bunu plugin'ler ve diğer paket ailesi girdileri için kullanın; üst düzey `search` skill arama yüzeyi olarak kalır.
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

- Paketi yüklemeden paket meta verilerini getirir.
- Bunu plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü inceler (varsayılan: latest).
- `--tag <tag>`: etiketli bir sürümü inceler (örn. `latest`).
- `--versions`: sürüm geçmişini listeler (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçili sürümün dosyalarını listeler.
- `--file <path>`: ham dosya içeriğini getirir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözer.
- Çözücünün `downloadUrl` değerinden yapıtı indirir.
- Tüm yapıtlar için ClawHub SHA-256 değerini doğrular.
- ClawPack npm-pack yapıtları için ayrıca npm `sha512` bütünlüğünü, npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri eski ZIP rotası üzerinden indirilir.
- Bayraklar:
  - `--version <version>`: belirli bir sürümü indirir.
  - `--tag <tag>`: etiketli bir sürümü indirir (varsayılan: `latest`).
  - `-o, --output <path>`: çıktı dosyası veya dizini.
  - `--force`: mevcut bir çıktı dosyasının üzerine yazar.
  - `--json`: makine tarafından okunabilir çıktı.

Örnekler:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Yerel bir yapıt için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum değerini hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözer ve yerel dosyayı yayımlanmış yapıt meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla ağ araması yapmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen yapıt meta verilerini çözmek için paket adı.
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

### `package delete <name>`

- Bir paketi ve tüm sürümlerini geçici olarak siler.
- Paket sahibi, org publisher sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- Bayraklar:
  - `--yes`: onayı atlar.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Geçici olarak silinmiş bir paketi ve sürümleri geri yükler.
- Paket sahibi, org publisher sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısı yapar.
- Bayraklar:
  - `--yes`: onayı atlar.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir publisher'a aktarır.
- Platform yöneticisi tarafından yapılmadığı sürece hem mevcut paket sahibine hem de hedef
  publisher'a yönetici erişimi gerektirir.
- Kapsamlı paket adları, eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısı yapar.
- Bayraklar:
  - `--to <owner>`: hedef publisher tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağrısı yapar.
- Bildirimler paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir ve inceleme için
  moderatörlere görünür hale gelir.
- Bildirimler tek başına paketleri otomatik olarak gizlemez veya indirmeleri engellemez.
- Bayraklar:
  - `--version <version>`: bildirime eklenecek isteğe bağlı paket sürümü.
  - `--reason <text>`: zorunlu bildirim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısı yapar.
- Geçerli paket tarama durumunu, açık bildirim sayısını, en son sürümün manuel
  moderasyon durumunu, indirme engelleme durumunu ve moderasyon nedenlerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekteki OpenClaw tüketimi için hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısı yapar.
- Resmi durum, ClawPack kullanılabilirliği, artifact digest,
  kaynak kökeni, OpenClaw uyumluluğu, host hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri bildirir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Paket halinde gelen bir OpenClaw plugin'inin yerini alabilecek bir paket için operatör odaklı geçiş durumunu gösterir.
- `package readiness` ile aynı hesaplanmış hazırlık endpoint'ini çağırır, ancak
  geçiş odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Bir kod plugin'ini veya bundle plugin'ini `POST /api/v1/packages` üzerinden yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball'ı: `./my-plugin-1.2.3.tgz`
  - GitHub reposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json` gibi
  gerçek OpenClaw bundle işaretçilerinden otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak değerlendirilir. CLI tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  meta veri ön doldurma için kullanır.
- Kod plugin klasörleri yüklemeden önce bir ClawPack npm tarball'ına paketlenir; böylece
  OpenClaw kurulumları tam artifact'i doğrulayabilir. Bundle plugin klasörleri ise yine
  çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı repodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik doldurulur.
- Yerel klasörler için origin remote GitHub'ı işaret ettiğinde kaynak atfı yerel git'ten otomatik algılanır.
- Harici kod plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için fallback olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen yayımlama payload'unu önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün publisher erişimi olduğunda bir kullanıcı veya org publisher tanıtıcısı altında yayımlar.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi,
  yerel host erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde alışılmadık görünebilecek
  davranışlar için ClawScan'e bağlam sağlar. Not,
  yayımlanan sürümde saklanır.
- Kapsamlı paket adları seçilen sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) override olarak çalışmaya devam eder.
- Özel GitHub repoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
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

Kod plugin'leri için klasörden yayımlama, paket klasöründen bir ClawPack artifact'i oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için minimal `package.json`

Harici kod plugin'leri `package.json` içinde az miktarda OpenClaw meta verisine
ihtiyaç duyar. Bu minimal manifest, başarılı bir yayımlama için yeterlidir:

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

Zorunlu alanlar:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notlar:

- `package.json.version` paket sürümünüzdür, ancak OpenClaw uyumluluk/derleme doğrulaması için
  fallback olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub mevcut olduklarında bunları gösterebilir, ancak yayımlama için zorunlu değildirler.
- Daha ayrıntılı uyumluluk meta verisi yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion` isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön denetimlerin yüklemeden önce çalışması için
  yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub, plugin repoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir workflow da sunar.

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

- Yeniden kullanılabilir workflow, `source` değerini varsayılan olarak çağıran repoya ayarlar.
- Monorepolar için workflow'un plugin paket klasörünü yayımlaması amacıyla `source_path` iletin;
  örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow'u kararlı bir etikete veya tam commit SHA'sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- `pull_request`, CI'ın kirletici olmaması için `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya etiket push'ları gibi güvenilir event'lerle sınırlı olmalıdır.
- Gizli olmadan trusted publishing yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları yine de `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` kullanılabilir durumda tutun.
- Workflow, JSON sonucunu artifact olarak yükler ve workflow çıktıları olarak sunar.

### `sync`

- Yerel skill klasörlerini tarar ve yeni/değişmiş olanları yayımlar.
- Kökler herhangi bir klasör olabilir: bir skills dizini veya `SKILL.md` içeren tek bir skill klasörü.
- `~/.clawdbot/clawdbot.json` mevcut olduğunda Clawdbot skill köklerini otomatik ekler:
  - `agent.workspace/skills` (ana agent)
  - `routing.agents.*.workspace/skills` (agent başına)
  - `~/.clawdbot/skills` (paylaşılan)
  - `skills.load.extraDirs` (paylaşılan paketler)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` ve `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` değerlerine uyar.
- Bayraklar:
  - `--root <dir...>` ek tarama kökleri
  - `--all` sormadan yükle
  - `--dry-run` yalnızca planı göster
  - `--bump patch|minor|major` (varsayılan: patch)
  - `--changelog <text>` (etkileşimsiz)
  - `--tags a,b,c` (varsayılan: latest)
  - `--concurrency <n>` (varsayılan: 4)

Telemetri:

- Oturum açıldığında, `CLAWHUB_DISABLE_TELEMETRY=1` olmadığı sürece (`CLAWDHUB_DISABLE_TELEMETRY=1` legacy), `sync` sırasında gönderilir.
- Ayrıntılar: `docs/telemetry.md`.
