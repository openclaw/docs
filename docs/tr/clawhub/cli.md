---
read_when:
    - ClawHub CLI'yi Kullanma
    - Yükleme, güncelleme, yayımlama veya eşitlemede hata ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-12T12:48:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, ikili: `clawhub`.

npm veya pnpm ile sistem genelinde kurun:

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
- `--site <url>`: tarayıcı oturumu açma için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, yoksa `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırak

Env eşdeğerleri:

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
`HTTP_PROXY` kullanılır. Belirli ana makineler veya alan adları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(örn. Docker kapsayıcıları, yalnızca proxy üzerinden internete çıkan Hetzner VPS,
kurumsal güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Hiçbir proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API token'ınızı + önbelleğe alınmış kayıt URL'sini depolar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ama `clawdhub/config.json` varsa, CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve loopback geri çağrısı üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Bir skill'i öne çıkanlarınıza ekler/kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- İndirmeler küçük bir popülerlik önceliğidir, en üst sırada yer alma garantisi değildir.
- Bir skill görünmesi gerekirken görünmüyorsa, metadata'yı yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect <slug>` çalıştırın.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` üzerinden en yeni skill'leri listeler (`createdAt` azalan sıralı).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Kurulum yapmadan skill metadata'sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketli bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm (1-200).
- `--files`: seçilen sürümün dosyalarını listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install <slug>`

- En son sürümü `/api/v1/skills/<slug>` üzerinden çözer.
- Zip'i `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş skill'lerin üzerine yazmayı reddeder; önce `clawhub unpin <slug>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- `clawhub pin` ile dondurulan becerilerin yanında, isteğe bağlı gerekçe dahil olmak üzere `pinned` gösterir.

### `pin <slug>`

- Kurulu bir beceriyi lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` becerinin neden dondurulduğunu kaydeder.
- Sabitlenmiş beceriler `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Sabitlenmiş beceriler ayrıca `install --force` komutunu da reddeder, böylece yerel baytlar yanlışlıkla değiştirilemez.

### `unpin <slug>`

- Kurulu bir beceriden lockfile sabitlemesini kaldırır, böylece gelecekteki güncellemeler onu değiştirebilir.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş beceriler `--force` tarafından hiçbir zaman güncellenmez.
- `update <slug>` sabitlenmiş slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin dondurulmuş kaldığının özetini yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayımlar.
- Semver gerektirir: `--version 1.2.3`.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı tanıtıcısı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir beceriyi `--owner` konumuna taşır. Her iki yayımcıda da admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir beceriyi yayımlamak, onun ClawHub üzerinde `MIT-0` altında yayımlandığı anlamına gelir.
- Yayımlanan beceriler atıf gerektirmeden kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli becerileri veya beceri başına fiyatlandırmayı desteklemez.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek davranışlar için ClawScan'e bağlam sağlar. Not, yayımlanan sürümde saklanır.
- Eski alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Bir beceriyi geçici olarak siler (sahip, moderatör veya admin).
- `DELETE /api/v1/skills/{slug}` çağırır.
- Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca rezerve eder; komut sona erme zamanını yazdırır.
- `--reason <text>` beceriye ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizlenmiş bir beceriyi geri yükler (sahip, moderatör veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağırır.
- `--reason <text>` beceriye ve denetim günlüğüne bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir beceriyi gizler (sahip, moderatör veya admin).
- `delete` için alias.

### `unhide <slug>`

- Bir beceriyi yeniden görünür yapar (sahip, moderatör veya admin).
- `undelete` için alias.

### `skill rename <slug> <new-slug>`

- Sahip olunan bir beceriyi yeniden adlandırır ve önceki slug'ı yönlendirme alias'ı olarak korur.
- `POST /api/v1/skills/{slug}/rename` çağırır.
- `--yes` onayı atlar.

### `skill merge <source-slug> <target-slug>`

- Sahip olunan bir beceriyi, sahip olunan başka bir beceriyle birleştirir.
- Kaynak slug herkese açık listelenmeyi bırakır ve hedefe yönlendirme alias'ı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağırır.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı tanıtıcılarına yapılan aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı tanıtıcılarına yapılan aktarımlar, yalnızca aktörün hem mevcut sahipte hem de hedef yayımcıda admin erişimi varsa hemen uygulanır.
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

- Paketi kurmadan paket meta verilerini getirir.
- Bunu Plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listeleyin.
- `--file <path>`: ham dosya içeriğini getirir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözer.
- Çözücünün `downloadUrl` değerinden artifact'i indirir.
- Tüm artifact'ler için ClawHub SHA-256 doğrular.
- ClawPack npm-pack artifact'leri için ayrıca npm `sha512` bütünlüğünü, npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
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

- Yerel bir artifact için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözer ve yerel dosyayı yayımlanmış artifact meta verileriyle karşılaştırır.
- Doğrudan digest bayraklarıyla, ağ araması olmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen artifact meta verilerini çözmek için paket adı.
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

- Bir paketi ve tüm sürümleri geçici olarak siler.
- Paket sahibini, kuruluş yayımcısı sahibini/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Geçici olarak silinmiş bir paketi ve sürümleri geri yükler.
- Paket sahibini, kuruluş yayımcısı sahibini/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağırır.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir yayımcıya aktarır.
- Platform yöneticisi tarafından yapılmadığı sürece, hem mevcut paket sahibine
  hem de hedef yayımcıya yönetici erişimi gerektirir.
- Kapsamlı paket adları, eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağırır.
- Bayraklar:
  - `--to <owner>`: hedef yayımcı tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağırır.
- Bildirimler paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanır ve
  inceleme için moderatörlere görünür hale gelir.
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
- `GET /api/v1/packages/{name}/moderation` çağırır.
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
- `GET /api/v1/packages/{name}/readiness` çağırır.
- Resmi durum, ClawPack kullanılabilirliği, yapıt özeti, kaynak menşei,
  OpenClaw uyumluluğu, ana makine hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri bildirir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Paketle birlikte gelen bir OpenClaw Plugin'inin yerini alabilecek bir paket için
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

- `POST /api/v1/packages` üzerinden bir kod Plugin'i veya paket Plugin'i yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball'ı: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve
  `.cursor-plugin/plugin.json` gibi gerçek OpenClaw paket işaretçilerinden
  otomatik olarak algılanır.
- `.tgz` kaynakları ClawPack olarak ele alınır. CLI tam npm-pack baytlarını
  yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  meta veri ön doldurması için kullanır.
- Kod Plugin'i klasörleri yüklemeden önce bir ClawPack npm tarball'ına paketlenir;
  böylece OpenClaw kurulumları tam yapıtı doğrulayabilir. Paket Plugin'i klasörleri
  ise çıkarılmış dosyayla yayımlama yolunu kullanmaya devam eder.
- GitHub kaynakları için kaynak atfı depodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik olarak doldurulur.
- Yerel klasörler için origin remote GitHub'ı işaret ettiğinde kaynak atfı yerel git'ten otomatik olarak algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen yayımlama yükünü önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kullanıcı veya kuruluş yayımcı tanıtıcısı altında yayımlar.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ağ erişimi,
  yerel ana makine erişimi veya sağlayıcıya özel kimlik bilgileri gibi aksi halde
  olağandışı görünebilecek davranışlar için ClawScan'e bağlam sağlar. Not,
  yayımlanan sürümde saklanır.
- Kapsamlı paket adları seçilen sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) geçersiz kılmalar olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Önerilen yerel akış

Canlı bir sürüm oluşturmadan önce çözümlenen paket meta verilerini ve
kaynak atfını onaylayabilmeniz için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod Plugin'leri için klasörle yayımlama, paket klasöründen bir ClawPack yapıtı
oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için en küçük `package.json`

Harici kod Plugin'leri `package.json` içinde az miktarda OpenClaw meta verisine
ihtiyaç duyar. Bu en küçük manifest, başarılı bir yayımlama için yeterlidir:

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

- `package.json.version` paket sürümünüzdür, ancak OpenClaw uyumluluk/derleme
  doğrulaması için yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub mevcut olduklarında bunları gösterebilir, ancak yayımlama için gerekli değildir.
- Daha ayrıntılı uyumluluk meta verileri yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve `openclaw.build.pluginSdkVersion`
  isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön uçuş denetimleri
  yüklemeden önce çalışsın diye yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir iş akışı sunar.

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
- Monorepo'lar için iş akışının Plugin paket klasörünü yayımlaması adına
  `source_path` geçirin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir iş akışını kararlı bir etikete veya tam commit SHA'sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- CI'ın kirlenmemesi için `pull_request`, `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya etiket push'ları gibi güvenilir olaylarla sınırlanmalıdır.
- Sır olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları yine de `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` değerini kullanılabilir tutun.
- İş akışı JSON sonucunu bir yapıt olarak yükler ve iş akışı çıktıları olarak sunar.

### `sync`

- Yerel skill klasörlerini tarar ve yeni/değişmiş olanları yayımlar.
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

- Oturum açılmışken `sync` sırasında, `CLAWHUB_DISABLE_TELEMETRY=1` olmadığı sürece gönderilir (eski `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Ayrıntılar: `docs/telemetry.md`.
