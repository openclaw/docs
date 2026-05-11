---
read_when:
    - ClawHub CLI Kullanımı
    - Kurulum, güncelleme, yayımlama veya eşitleme hata ayıklaması
summary: 'CLI referansı: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-11T22:19:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, bin: `clawhub`.

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
- `--no-input`: istemleri devre dışı bırak

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

Bu değişkenlerden herhangi biri ayarlandığında, CLI giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli ana makineler veya etki alanları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

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

API token'ınızı + önbelleğe alınmış registry URL'sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresinde açar ve loopback geri çağrısı üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Bir skill'i öne çıkanlarınıza ekler veya kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü şekilde `personal-map` ile eşleşir.
- İndirmeler küçük bir popülerlik önceliğidir, en üst sırada yer almanın garantisi değildir.
- Bir skill görünmesi gerekirken görünmüyorsa, meta verileri yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect <slug>` çalıştırın.

### `explore`

- En yeni skill'leri `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan sırada sıralanır).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Kurulum yapmadan skill meta verilerini ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçilen sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install <slug>`

- En son sürümü `/api/v1/skills/<slug>` üzerinden çözer.
- Zip dosyasını `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş skill'lerin üzerine yazmayı reddeder; önce `clawhub unpin <slug>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` dizinini kaldırır ve lockfile girdisini siler.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını (eski `.clawdhub`) okur.
- `clawhub pin` ile dondurulan Skills öğelerinin yanında, isteğe bağlı gerekçe dahil `pinned` gösterir.

### `pin <slug>`

- Yüklü bir skill'i lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` skill'in neden dondurulduğunu kaydeder.
- Sabitlenmiş skill'ler `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Sabitlenmiş skill'ler ayrıca yerel baytların yanlışlıkla değiştirilememesi için `install --force` komutunu da reddeder.

### `unpin <slug>`

- Yüklü bir skill'den lockfile sabitlemesini kaldırır, böylece gelecekteki güncellemeler onu değiştirebilir.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş skill'ler `--force` tarafından asla güncellenmez.
- `update <slug>` sabitlenmiş slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin donmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayınlar.
- Semver gerektirir: `--version 1.2.3`.
- Aktörün yayıncı erişimi olduğunda `--owner <handle>`, bir kuruluş/kullanıcı yayıncı tanıtıcısı altında yayınlar.
- `--migrate-owner`, yeni bir sürüm yayınlarken mevcut bir skill'i `--owner` konumuna taşır. Her iki yayıncıda da admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanmıştır.
- Bir skill yayınlamak, onun ClawHub üzerinde `MIT-0` kapsamında yayımlandığı anlamına gelir.
- Yayınlanan skill'ler atıf olmadan kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli skill'leri veya skill başına fiyatlandırmayı desteklemez.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi, yerel host erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek davranışlar için ClawScan'e bağlam sağlar. Not, yayınlanan sürümde saklanır.
- Eski alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Bir skill'i soft-delete eder (sahip, moderator veya admin).
- `DELETE /api/v1/skills/{slug}` çağrısı yapar.
- Sahip tarafından başlatılan soft delete işlemleri slug'ı 30 gün boyunca rezerve eder; komut sona erme zamanını yazdırır.
- `--reason <text>` skill ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizlenmiş bir skill'i geri yükler (sahip, moderator veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağrısı yapar.
- `--reason <text>` skill ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir skill'i gizler (sahip, moderator veya admin).
- `delete` için alias.

### `unhide <slug>`

- Bir skill'i görünür yapar (sahip, moderator veya admin).
- `undelete` için alias.

### `skill rename <slug> <new-slug>`

- Sahip olunan bir skill'i yeniden adlandırır ve önceki slug'ı yönlendirme alias'ı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağrısı yapar.
- `--yes` onayı atlar.

### `skill merge <source-slug> <target-slug>`

- Sahip olunan bir skill'i, sahip olunan başka bir skill ile birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendirme alias'ı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısı yapar.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına aktarımlar, alıcının kabul ettiği bekleyen bir istek oluşturur.
- Kuruluş/yayıncı tanıtıcılarına aktarımlar, yalnızca aktörün hem mevcut sahipte hem de hedef yayıncıda admin erişimi olduğunda hemen uygulanır.
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

- Birleşik paket kataloğuna `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden göz atar veya katalogda arama yapar.
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

- Yüklemeden paket meta verilerini getirir.
- Bunu plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçili sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Yapıtı çözümleyicinin `downloadUrl` değerinden indirir.
- Tüm yapıtlar için ClawHub SHA-256 doğrulaması yapar.
- ClawPack npm-pack yapıtları için ayrıca npm `sha512` bütünlüğünü, npm shasum değerini ve tarball içindeki `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri, eski ZIP rotası üzerinden indirilir.
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

- Yerel bir yapıt için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve yerel dosyayı yayınlanan yapıt meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla, ağ araması yapmadan doğrular.
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

### `package delete <name>`

- Bir paketi ve tüm sürümlerini geçici olarak siler.
- Paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Geçici olarak silinmiş bir paketi ve sürümlerini geri yükler.
- Paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısı yapar.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir yayıncıya aktarır.
- Platform yöneticisi tarafından yapılmadığı sürece hem mevcut paket sahibine
  hem de hedef yayıncıya yönetici erişimi gerektirir.
- Scope'lu paket adları eşleşen scope sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısı yapar.
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
- `POST /api/v1/packages/{name}/report` çağrısı yapar.
- Bildirimler paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir
  ve inceleme için moderatörlere görünür hale gelir.
- Bildirimler paketleri kendiliğinden otomatik olarak gizlemez veya indirmeleri engellemez.
- Bayraklar:
  - `--version <version>`: bildirime eklenecek isteğe bağlı paket sürümü.
  - `--reason <text>`: gerekli bildirim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısı yapar.
- Mevcut paket tarama durumunu, açık bildirim sayısını, en son sürümün manuel
  moderasyon durumunu, indirme engelleme durumunu ve moderasyon nedenlerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekte OpenClaw tarafından tüketilmeye hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısı yapar.
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

- Paketlenmiş bir OpenClaw Plugin'inin yerini alabilecek bir paket için
  operatör odaklı geçiş durumunu gösterir.
- `package readiness` ile aynı hesaplanmış hazırlık uç noktasını çağırır, ancak
  geçiş odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` aracılığıyla bir kod Plugin'i veya paket Plugin'i yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball'ı: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve
  `.cursor-plugin/plugin.json` gibi gerçek OpenClaw paket işaretçilerinden otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak değerlendirilir. CLI tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  meta veri ön doldurması için kullanır.
- Kod Plugin'i klasörleri yüklemeden önce bir ClawPack npm tarball'ına paketlenir;
  böylece OpenClaw kurulumları tam yapıtı doğrulayabilir. Paket Plugin'i klasörleri
  hâlâ çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı depodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik doldurulur.
- Yerel klasörler için kaynak atfı, origin uzak deposu GitHub'ı gösterdiğinde yerel git'ten otomatik algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen yayımlama yükünü önizler.
- `--json`, CI için makine tarafından okunabilir çıktı yayar.
- `--owner <handle>`, aktörün yayıncı erişimi olduğunda bir kullanıcı veya kuruluş yayıncı tanıtıcısı altında yayımlar.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi,
  yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde
  olağandışı görünebilecek davranışlar için ClawScan'e bağlam sağlar. Not,
  yayımlanan sürümde saklanır.
- Scope'lu paket adları seçilen sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) geçersiz kılma olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Önerilen yerel akış

Canlı bir sürüm oluşturmadan önce çözümlenen paket meta verilerini ve
kaynak atfını doğrulayabilmeniz için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod Plugin'leri için klasörden yayımlama, paket klasöründen bir ClawPack yapıtı
oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için en küçük `package.json`

Harici kod Plugin'leri `package.json` içinde küçük miktarda OpenClaw meta verisine
ihtiyaç duyar. Bu en küçük bildirim, başarılı bir yayımlama için yeterlidir:

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

- `package.json.version` paket sürüm numaranızdır, ancak OpenClaw uyumluluğu/derleme
  doğrulaması için yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub mevcut olduklarında bunları gösterebilir, ancak yayımlama için gerekli değildir.
- `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion`, daha ayrıntılı uyumluluk meta verisi yayımlamak
  isterseniz isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön uçuş denetimlerinin
  yüklemeden önce çalışması için yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir iş akışı da sağlar.

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

- Yeniden kullanılabilir iş akışı varsayılan olarak `source` değerini çağıran depoya ayarlar.
- Monorepo'lar için iş akışının Plugin paket klasörünü yayımlaması amacıyla
  `source_path` iletin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir iş akışını kararlı bir etikete veya tam commit SHA'sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- CI'ın kirletici olmaması için `pull_request`, `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya etiket push'ları gibi güvenilir olaylarla sınırlandırılmalıdır.
- Gizli anahtar olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları hâlâ `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` kullanılabilir durumda tutun.
- İş akışı JSON sonucunu yapıt olarak yükler ve iş akışı çıktıları olarak sunar.

### `sync`

- Yerel skill klasörlerini tarar ve yeni/değişenleri yayımlar.
- Kökler herhangi bir klasör olabilir: bir skills dizini veya `SKILL.md` içeren tek bir skill klasörü.
- `~/.clawdbot/clawdbot.json` mevcut olduğunda Clawdbot skill köklerini otomatik ekler:
  - `agent.workspace/skills` (ana ajan)
  - `routing.agents.*.workspace/skills` (ajan başına)
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

- Oturum açılmışken `sync` sırasında gönderilir; `CLAWHUB_DISABLE_TELEMETRY=1` olmadığı sürece (eski `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Ayrıntılar: `docs/telemetry.md`.
