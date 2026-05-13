---
read_when:
    - ClawHub CLI'yi Kullanma
    - Kurulum, güncelleme, yayımlama veya eşitleme işlemlerinde hata ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-13T04:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, çalıştırılabilir dosya: `clawhub`.

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
- `--site <url>`: tarayıcı oturum açma için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL’si (varsayılan: keşfedilen, aksi halde `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırak

Ortam eşdeğerleri:

- `CLAWHUB_SITE` (eski `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (eski `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (eski `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI, kurumsal proxy’lerin veya kısıtlı ağların arkasındaki sistemler için
standart HTTP proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Bu değişkenlerden herhangi biri ayarlandığında, CLI giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli ana bilgisayarlar veya etki alanları için
proxy’yi atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(örn. Docker container’ları, yalnızca proxy üzerinden internete çıkan Hetzner VPS,
kurumsal güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Hiçbir proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API token’ınızı + önbelleğe alınmış registry URL’sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa, CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve loopback callback üzerinden tamamlar.
- Başsız: `clawhub login --token clh_...`
- Uzak/başsız etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token’ı `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Öne çıkardıklarınıza bir beceri ekler veya oradan kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token’ı, `amap` içindeki alt dizeden daha güçlü şekilde `personal-map` ile eşleşir.
- İndirmeler küçük bir popülerlik önceliğidir, üst sırada yer alma garantisi değildir.
- Bir becerinin görünmesi gerekiyor ama görünmüyorsa, metadata’yı yeniden adlandırmadan önce sahibin görebildiği moderasyon tanılamalarını kontrol etmek için oturum açmışken `clawhub inspect <slug>` çalıştırın.

### `explore`

- En yeni becerileri `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan sıralı).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Kurulum yapmadan beceri metadata’sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek maksimum sürüm sayısı (1-200).
- `--files`: seçilen sürümün dosyalarını listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200 KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install <slug>`

- En son sürümü `/api/v1/skills/<slug>` üzerinden çözer.
- Zip dosyasını `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş becerilerin üzerine yazmayı reddeder; önce `clawhub unpin <slug>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- `clawhub pin` ile dondurulmuş skill'lerin yanında, isteğe bağlı neden dahil olmak üzere `pinned` gösterir.

### `pin <slug>`

- Yüklü bir skill'i kilit dosyasında sabitlenmiş olarak işaretler.
- `--reason <text>` skill'in neden dondurulduğunu kaydeder.
- Sabitlenmiş skill'ler `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Sabitlenmiş skill'ler ayrıca `install --force` komutunu da reddeder; böylece yerel baytlar yanlışlıkla değiştirilemez.

### `unpin <slug>`

- Yüklü bir skill'den kilit dosyası sabitlemesini kaldırır; böylece gelecekteki güncellemeler onu değiştirebilir.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izini hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istem gösterir)
- Sabitlenmiş skill'ler `--force` tarafından asla güncellenmez.
- `update <slug>` sabitlenmiş slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin donmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayımlar.
- Semver gerektirir: `--version 1.2.3`.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı tanıtıcısı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir skill'i `--owner` konumuna taşır. Her iki yayımcıda da admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir skill yayımlamak, onun ClawHub'da `MIT-0` altında yayımlandığı anlamına gelir.
- Yayımlanmış skill'ler atıf gerektirmeden kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli skill'leri veya skill başına fiyatlandırmayı desteklemez.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek davranışlar için ClawScan'e bağlam sağlar. Not, yayımlanan sürümde saklanır.
- Eski takma ad: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Bir skill'i geçici olarak siler (sahip, moderatör veya admin).
- `DELETE /api/v1/skills/{slug}` çağrısı yapar.
- Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--reason <text>` skill'e ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizlenmiş bir skill'i geri yükler (sahip, moderatör veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağrısı yapar.
- `--reason <text>` skill'e ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir skill'i gizler (sahip, moderatör veya admin).
- `delete` için takma addır.

### `unhide <slug>`

- Bir skill'in gizliliğini kaldırır (sahip, moderatör veya admin).
- `undelete` için takma addır.

### `skill rename <slug> <new-slug>`

- Sahip olunan bir skill'i yeniden adlandırır ve önceki slug'ı yönlendirme takma adı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağrısı yapar.
- `--yes` onayı atlar.

### `skill merge <source-slug> <target-slug>`

- Sahip olunan bir skill'i, sahip olunan başka bir skill ile birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendiren bir takma ad olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısı yapar.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına yapılan aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı tanıtıcılarına yapılan aktarımlar, yalnızca aktörün hem mevcut sahip hem de hedef yayımcı üzerinde admin erişimi olduğunda hemen uygulanır.
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

- `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden birleşik paket kataloğuna göz atar veya katalogda arama yapar.
- Bunu plugin'ler ve diğer paket ailesi girdileri için kullanın; üst düzey `search`, skill arama yüzeyi olarak kalır.
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
- Bunu plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: en son).
- `--tag <tag>`: etiketli bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listeleyin.
- `--file <path>`: ham dosya içeriğini getirir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Yapıtı çözümleyicinin `downloadUrl` adresinden indirir.
- Tüm yapıtlar için ClawHub SHA-256 doğrular.
- ClawPack npm-pack yapıtları için ayrıca npm `sha512` bütünlüğünü, npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri eski ZIP rotası üzerinden indirilir.
- Bayraklar:
  - `--version <version>`: belirli bir sürümü indirin.
  - `--tag <tag>`: etiketli bir sürümü indirin (varsayılan: `latest`).
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
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve yerel dosyayı yayımlanmış yapıt meta verileriyle karşılaştırır.
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

- Bir paketi ve tüm sürümleri soft-delete eder.
- Paket sahibi, org publisher owner/admin, platform moderatörü
  veya platform admin gerektirir.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Soft-delete edilmiş bir paketi ve sürümleri geri yükler.
- Paket sahibi, org publisher owner/admin, platform moderatörü
  veya platform admin gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısı yapar.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir publisher'a aktarır.
- Bir platform admin tarafından yapılmadığı sürece hem geçerli paket sahibine
  hem de hedef publisher'a admin erişimi gerektirir.
- Kapsamlı paket adları eşleşen kapsam sahibine aktarılmalıdır.
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
- Bildirimler paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir
  ve inceleme için moderatörlere görünür olur.
- Bildirimler paketleri kendiliğinden otomatik olarak gizlemez veya indirmeleri engellemez.
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

- Bir paketin gelecekteki OpenClaw kullanımı için hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısı yapar.
- Resmi durum, ClawPack kullanılabilirliği, artifact digest,
  kaynak kökeni, OpenClaw uyumluluğu, host hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri raporlar.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Birlikte gelen bir OpenClaw Plugin'inin yerini alabilecek bir paket için
  operatör odaklı migration durumunu gösterir.
- `package readiness` ile aynı hesaplanmış readiness endpoint'ini çağırır, ancak
  migration odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` aracılığıyla bir kod Plugin'i veya bundle Plugin'i yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` veya `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- Metadata `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve
  `.cursor-plugin/plugin.json` gibi gerçek OpenClaw bundle marker'larından otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak değerlendirilir. CLI tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  metadata ön doldurması için kullanır.
- Kod Plugin'i klasörleri, yüklemeden önce ClawPack npm tarball içine paketlenir; böylece
  OpenClaw kurulumları tam artifact'i doğrulayabilir. Bundle Plugin'i klasörleri ise
  çıkarılmış dosya yayımlama yolunu kullanmaya devam eder.
- GitHub kaynakları için kaynak atfı repo, çözümlenen commit, ref ve alt yoldan otomatik doldurulur.
- Yerel klasörler için origin remote GitHub'ı işaret ettiğinde kaynak atfı yerel git'ten otomatik algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, publish doğrulaması için fallback olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen publish payload'unu önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün publisher erişimi olduğunda bir kullanıcı veya org publisher tanıtıcısı altında yayımlar.
- `--clawscan-note <text>`, bir ClawScan notu ekler. Bu not ClawScan'e
  ağ erişimi, native host erişimi veya sağlayıcıya özel kimlik bilgileri gibi
  aksi halde olağan dışı görünebilecek davranışlar için bağlam sağlar. Not,
  yayımlanan sürümde saklanır.
- Kapsamlı paket adları seçili sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
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

Kod Plugin'leri için klasörden publish, paket klasöründen bir ClawPack artifact oluşturur
ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için minimal `package.json`

Harici kod Plugin'leri `package.json` içinde az miktarda OpenClaw metadata'sına
ihtiyaç duyar. Bu minimal manifest başarılı bir publish için yeterlidir:

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

- `package.json.version` paket sürümünüzdür, ancak OpenClaw uyumluluk/build
  doğrulaması için fallback olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı metadata'dır.
  ClawHub bunlar mevcut olduğunda gösterebilir, ancak publish için zorunlu değildir.
- Daha ayrıntılı uyumluluk metadata'sı yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion` isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel preflight denetimlerinin
  yüklemeden önce çalışması için yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub ayrıca Plugin repoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir workflow sunar.

Tipik caller kurulumu:

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

- Yeniden kullanılabilir workflow, `source` değerini varsayılan olarak caller repo'ya ayarlar.
- Monorepolar için workflow'un Plugin paket klasörünü yayımlaması amacıyla
  `source_path` geçirin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow'u kararlı bir etikete veya tam commit SHA'sına sabitleyin. Release publish'i `@main` üzerinden çalıştırmayın.
- `pull_request`, CI'ın kirletici olmaması için `dry_run: true` kullanmalıdır.
- Gerçek publish işlemleri `workflow_dispatch` veya tag push'ları gibi güvenilir event'lerle sınırlandırılmalıdır.
- Secret olmadan trusted publishing yalnızca `workflow_dispatch` üzerinde çalışır; tag push'ları hâlâ `clawhub_token` gerektirir.
- İlk publish, güvenilmeyen paketler veya break-glass publish'ler için `clawhub_token` kullanılabilir tutun.
- Workflow JSON sonucunu artifact olarak yükler ve workflow çıktıları olarak sunar.

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

- Oturum açıldığında, `CLAWHUB_DISABLE_TELEMETRY=1` olmadığı sürece (`CLAWDHUB_DISABLE_TELEMETRY=1` legacy) `sync` sırasında gönderilir.
- Ayrıntılar: `docs/telemetry.md`.
