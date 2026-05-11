---
read_when:
    - ClawHub CLI'yi kullanma
    - Kurulum, güncelleme, yayımlama veya eşitlemede hata ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-11T20:24:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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
- `--dir <dir>`: workdir altında kurulum dizini (varsayılan: `skills`)
- `--site <url>`: tarayıcı oturum açma için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, aksi halde `https://clawhub.ai`)
- `--no-input`: istemleri devre dışı bırakır

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

Bu değişkenlerden herhangi biri ayarlandığında CLI, giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli host'lar veya alan adları için proxy'yi atlamak
üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(örn. Docker container'ları, yalnızca proxy internet erişimi olan Hetzner VPS,
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
- Eski yedek: `clawhub/config.json` henüz yoksa ama `clawdhub/config.json` varsa, CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve loopback callback ile tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Vurgularınıza bir beceri ekler veya kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağırır.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağırır.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- İndirmeler küçük bir popülerlik önceliğidir, en üst sırada yer alma garantisi değildir.
- Bir becerinin görünmesi gerekiyor ama görünmüyorsa, metadata'yı yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılarını kontrol etmek için oturum açmışken `clawhub inspect <slug>` çalıştırın.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` üzerinden en yeni becerileri listeler (`createdAt` azalan sıralı).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Kurulum yapmadan beceri metadata'sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçili sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200 KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install <slug>`

- En son sürümü `/api/v1/skills/<slug>` üzerinden çözer.
- Zip'i `/api/v1/download` üzerinden indirir.
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
- `clawhub pin` ile dondurulmuş Skills'lerin yanında, isteğe bağlı gerekçeyle birlikte `pinned` gösterir.

### `pin <slug>`

- Yüklü bir skill'i lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` skill'in neden dondurulduğunu kaydeder.
- Sabitlenmiş Skills'ler `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Sabitlenmiş Skills'ler ayrıca yerel baytların yanlışlıkla değiştirilmemesi için `install --force` komutunu reddeder.

### `unpin <slug>`

- Gelecekteki güncellemelerin değiştirebilmesi için yüklü bir skill'den lockfile sabitlemesini kaldırır.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istem gösterir)
- Sabitlenmiş Skills'ler `--force` ile asla güncellenmez.
- `update <slug>` sabitlenmiş slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin dondurulmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayımlar.
- Semver gerektirir: `--version 1.2.3`.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı handle'ı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir skill'i `--owner` değerine taşır. Her iki yayımcıda da admin/owner erişimi gerektirir.
- Owner ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir skill yayımlamak, onun ClawHub üzerinde `MIT-0` kapsamında yayınlandığı anlamına gelir.
- Yayımlanmış Skills'ler atıf gerektirmeden kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli Skills'leri veya skill başına fiyatlandırmayı desteklemez.
- Eski alias: `publish <path>`.

### `delete <slug>`

- Bir skill'i yumuşak siler (owner, moderator veya admin).
- `DELETE /api/v1/skills/{slug}` çağırır.
- Owner tarafından başlatılan yumuşak silmeler slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--reason <text>` skill ve audit log üzerinde bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizli bir skill'i geri yükler (owner, moderator veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağırır.
- `--reason <text>` skill ve audit log üzerinde bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir skill'i gizler (owner, moderator veya admin).
- `delete` için alias.

### `unhide <slug>`

- Bir skill'i görünür yapar (owner, moderator veya admin).
- `undelete` için alias.

### `skill rename <slug> <new-slug>`

- Sahip olunan bir skill'i yeniden adlandırır ve önceki slug'ı yönlendirme alias'ı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağırır.
- `--yes` onayı atlar.

### `skill merge <source-slug> <target-slug>`

- Sahip olunan bir skill'i sahip olunan başka bir skill ile birleştirir.
- Kaynak slug genel listelenmeyi durdurur ve hedefe yönlendiren bir alias olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağırır.
- `--yes` onayı atlar.

### `skill rescan <slug>`

- En son yayımlanmış skill sürümü için güvenlik yeniden taraması ister.
- Owners ve yayımcı admin'leri kendi Skills'lerini sürüm başına kurtarma sınırına kadar yeniden tarayabilir.
- Platform moderator'ları ve admin'leri herhangi bir skill'i yeniden tarayabilir ve owner kurtarma sınırı tarafından engellenmez, ancak her sürüm için aynı anda yalnızca bir yeniden tarama çalışabilir.
- `POST /api/v1/skills/{slug}/rescan` çağırır.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Sahiplik transferi iş akışı.
- Kullanıcı handle'larına yapılan transferler, alıcının kabul ettiği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı handle'larına yapılan transferler, yalnızca aktörün hem mevcut owner hem de hedef yayımcı üzerinde admin erişimi olduğunda hemen uygulanır.
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
- Bunu plugins ve diğer paket ailesi girdileri için kullanın; üst düzey `search`, skill arama yüzeyi olarak kalır.
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
- Bunu Plugin meta verileri, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü incele (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek maksimum sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Artifact'i çözümleyicinin `downloadUrl` değerinden indirir.
- Tüm artifact'ler için ClawHub SHA-256 doğrulaması yapar.
- ClawPack npm-pack artifact'leri için ayrıca npm `sha512` bütünlüğünü, npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
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

- Yerel bir artifact için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve yerel dosyayı yayımlanmış artifact meta verileriyle karşılaştırır.
- Doğrudan digest bayraklarıyla ağ araması yapmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen artifact meta verilerini çözümlemek için paket adı.
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

- Bir paketi ve tüm sürümlerini geri alınabilir şekilde siler.
- Paket sahibini, kuruluş yayıncısı sahibi/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Geri alınabilir şekilde silinmiş bir paketi ve sürümlerini geri yükler.
- Paket sahibini, kuruluş yayıncısı sahibi/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
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
- Platform yöneticisi tarafından yapılmadığı sürece hem geçerli paket sahibine hem de hedef
  yayıncıya yönetici erişimi gerektirir.
- Kapsamlı paket adları eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısını yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayıncı tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- En son yayımlanmış paket sürümü için güvenlik yeniden taraması ister.
- Sahipler ve yayıncı yöneticileri kendi paketlerini sürüm başına kurtarma
  sınırına kadar yeniden tarayabilir.
- Platform moderatörleri ve yöneticileri herhangi bir paketi yeniden tarayabilir ve sahip
  kurtarma sınırıyla engellenmez; ancak sürüm başına aynı anda yalnızca bir yeniden tarama çalışabilir.
- `POST /api/v1/packages/{name}/rescan` çağrısını yapar.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağrısını yapar.
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

### `package appeal`

- Sürüm moderasyonuna itiraz etmek için sahip/yayıncı komutu.
- `POST /api/v1/packages/{name}/appeal` çağrısını yapar.
- İtirazlar karantinaya alınmış, iptal edilmiş, şüpheli veya kötü amaçlı
  sürümler için kabul edilir.
- Bayraklar:
  - `--version <version>`: zorunlu paket sürümü.
  - `--message <text>`: zorunlu itiraz mesajı.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısını yapar.
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
- `GET /api/v1/packages/{name}/readiness` çağrısını yapar.
- Resmi durum, ClawPack kullanılabilirliği, yapıt özeti,
  kaynak kökeni, OpenClaw uyumluluğu, ana makine hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri bildirir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Paketle birlikte gelen bir OpenClaw Plugin'inin yerini alabilecek bir paket için
  operatör odaklı taşıma durumunu gösterir.
- `package readiness` ile aynı hesaplanan hazırlık uç noktasını çağırır, ancak
  taşıma odaklı durumu, en son sürümü, resmi paket durumunu, denetimleri ve
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
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json`
  gibi gerçek OpenClaw paket işaretçilerinden otomatik olarak algılanır.
- `.tgz` kaynakları ClawPack olarak ele alınır. CLI tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriklerini yalnızca doğrulama ve
  meta veri ön doldurma için kullanır.
- Kod Plugin'i klasörleri, yüklemeden önce bir ClawPack npm tarball'ına paketlenir; böylece
  OpenClaw kurulumları tam yapıtı doğrulayabilir. Paket Plugin'i klasörleri ise hâlâ
  çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı depodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik doldurulur.
- Yerel klasörler için kaynak atfı, origin uzak ucu GitHub'ı gösterdiğinde yerel git'ten otomatik algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça beyan etmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen yayımlama yükünü önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün yayıncı erişimi olduğunda bir kullanıcı veya kuruluş yayıncı tanıtıcısı altında yayımlar.
- Kapsamlı paket adları seçilen sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) geçersiz kılma olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

#### Önerilen yerel akış

Canlı bir sürüm oluşturmadan önce çözümlenen paket meta verilerini ve
kaynak atfını doğrulayabilmek için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod Plugin'leri için klasörden yayımlama, paket klasöründen bir ClawPack yapıtı oluşturur
ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için en küçük `package.json`

Harici kod Plugin'leri `package.json` içinde az miktarda OpenClaw meta verisine ihtiyaç duyar.
Bu en küçük manifest başarılı bir yayımlama için yeterlidir:

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

- `package.json.version` paket sürümünüzdür, ancak OpenClaw uyumluluk/derleme
  doğrulaması için yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub bunları mevcut olduklarında gösterebilir, ancak yayımlama için gerekli değildir.
- Daha ayrıntılı uyumluluk meta verileri yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve `openclaw.build.pluginSdkVersion`
  isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön uçuş denetimleri
  yüklemeden önce çalışsın diye yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir iş akışı da sunar.

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

- Yeniden kullanılabilir iş akışı, `source` değerini varsayılan olarak çağıran depoya ayarlar.
- Monorepo'lar için, iş akışının Plugin paket klasörünü yayımlaması adına
  `source_path` geçirin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir iş akışını kararlı bir etikete veya tam commit SHA'sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- CI'ın kirletici olmaması için `pull_request` `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya etiket push'ları gibi güvenilir etkinliklerle sınırlandırılmalıdır.
- Giz olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları yine de `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` erişilebilir tutun.
- İş akışı JSON sonucunu yapıt olarak yükler ve iş akışı çıktıları olarak sunar.

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

- Oturum açıkken `sync` sırasında gönderilir; `CLAWHUB_DISABLE_TELEMETRY=1` (eski `CLAWDHUB_DISABLE_TELEMETRY=1`) değilse.
- Ayrıntılar: `docs/telemetry.md`.
