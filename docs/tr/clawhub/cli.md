---
read_when:
    - ClawHub CLI'sini Kullanma
    - Yükleme, güncelleme, yayımlama veya eşitlemede hata ayıklama
summary: 'CLI başvurusu: komutlar, bayraklar, yapılandırma, kilit dosyası, eşitleme davranışı.'
x-i18n:
    generated_at: "2026-05-13T05:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI paketi: `clawhub`, ikili dosya: `clawhub`.

npm veya pnpm ile global olarak yükleyin:

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
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, aksi halde `https://clawhub.ai`)
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

Bu değişkenlerden herhangi biri ayarlandığında, CLI giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli ana makineler veya alan adları için proxy'yi
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

API token'ınızı + önbelleğe alınmış registry URL'sini depolar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve loopback geri çağrısı üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `star <slug>` / `unstar <slug>`

- Öne çıkardıklarınıza bir beceri ekler/kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağırır.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağırır.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- İndirmeler, üst sıralarda yer almanın garantisi değil, küçük bir popülerlik önceliğidir.
- Bir becerinin görünmesi gerekiyor ancak görünmüyorsa, metadata'yı yeniden adlandırmadan önce sahibi tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açıkken `clawhub inspect <slug>` çalıştırın.

### `explore`

- En yeni becerileri `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` azalan sıralanır).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (varsayılan: newest)
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect <slug>`

- Kurulum yapmadan beceri metadata'sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü inceleyin (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçilen sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
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
- `clawhub pin` ile dondurulmuş skills için, isteğe bağlı neden dahil olmak üzere `pinned` gösterir.

### `pin <slug>`

- Yüklü bir skill'i kilit dosyasında pinned olarak işaretler.
- `--reason <text>` skill'in neden dondurulduğunu kaydeder.
- Pinned skills, `update --all` tarafından atlanır ve doğrudan `update <slug>` tarafından reddedilir.
- Pinned skills ayrıca `install --force` komutunu reddeder; böylece yerel baytlar yanlışlıkla değiştirilemez.

### `unpin <slug>`

- Gelecekteki güncellemelerin değiştirebilmesi için yüklü bir skill'den kilit dosyası pin'ini kaldırır.

### `update [slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Pinned skills hiçbir zaman `--force` ile güncellenmez.
- `update <slug>`, pinned slug'lar için hızlıca başarısız olur ve önce `clawhub unpin <slug>` çalıştırmanızı söyler.
- `update --all`, pinned slug'ları atlar ve nelerin donmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- `POST /api/v1/skills` (multipart) üzerinden yayımlar.
- Semver gerektirir: `--version 1.2.3`.
- `--owner <handle>`, aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı tanıtıcısı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir skill'i `--owner` konumuna taşır. Her iki yayımcıda da admin/owner erişimi gerektirir.
- Sahiplik ve inceleme davranışı `docs/publishing.md` içinde açıklanmıştır.
- Bir skill yayımlamak, onun ClawHub üzerinde `MIT-0` kapsamında yayımlandığı anlamına gelir.
- Yayımlanan skills, atıf gerektirmeden kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
- ClawHub ücretli skills veya skill başına fiyatlandırmayı desteklemez.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not, ClawScan'e ağ erişimi, yerel host erişimi veya sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek davranışlar için bağlam sağlar. Not yayımlanan sürümde saklanır.
- Eski alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Bir skill'i soft-delete yapar (owner, moderator veya admin).
- `DELETE /api/v1/skills/{slug}` çağrısı yapar.
- Owner tarafından başlatılan soft delete işlemleri slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--reason <text>`, skill ve audit log üzerinde bir moderation notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `undelete <slug>`

- Gizli bir skill'i geri yükler (owner, moderator veya admin).
- `POST /api/v1/skills/{slug}/undelete` çağrısı yapar.
- `--reason <text>`, skill ve audit log üzerinde bir moderation notu kaydeder.
- `--note <text>`, `--reason` için bir alias'tır.
- `--yes` onayı atlar.

### `hide <slug>`

- Bir skill'i gizler (owner, moderator veya admin).
- `delete` için alias.

### `unhide <slug>`

- Bir skill'i yeniden görünür yapar (owner, moderator veya admin).
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
- Kullanıcı tanıtıcılarına yapılan aktarımlar, alıcının kabul edeceği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı tanıtıcılarına yapılan aktarımlar yalnızca aktörün hem geçerli sahibine hem de hedef yayımcıya admin erişimi olduğunda hemen uygulanır.
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

- Birleşik paket kataloğunu `GET /api/v1/packages` ve `GET /api/v1/packages/search` üzerinden gözden geçirir veya arar.
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

- Yüklemeden paket metadata'sını getirir.
- Bunu plugin metadata'sı, uyumluluk, doğrulama, kaynak ve sürüm/dosya incelemesi için kullanın.
- `--version <version>`: belirli bir sürümü incele (varsayılan: en son).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek maksimum sürüm sayısı (1-100).
- `--files`: seçili sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözer.
- Artifact'i resolver'ın `downloadUrl` değerinden indirir.
- Tüm artifact'ler için ClawHub SHA-256 değerini doğrular.
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
- `--package` ile, ClawHub'dan beklenen metadata'yı çözer ve yerel dosyayı yayımlanan artifact metadata'sıyla karşılaştırır.
- Doğrudan digest bayraklarıyla, ağ araması yapmadan doğrular.
- Bayraklar:
  - `--package <name>`: beklenen artifact metadata'sını çözmek için paket adı.
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
- Paket sahibi, bir kuruluş yayınlayıcısı sahibi/yöneticisi, platform moderatörü
  veya platform yöneticisi gerektirir.
- Bayraklar:
  - `--yes`: onayı atla.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Geçici olarak silinmiş bir paketi ve sürümleri geri yükler.
- Paket sahibi, bir kuruluş yayınlayıcısı sahibi/yöneticisi, platform moderatörü
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
- Platform yöneticisi tarafından yapılmadığı sürece hem geçerli paket sahibine hem de hedef
  yayıncıya yönetici erişimi gerektirir.
- Kapsamlı paket adları eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısı yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayıncı tanıtıcısı.
  - `--reason <text>`: isteğe bağlı denetim gerekçesi.
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
  - `--reason <text>`: gerekli bildirim gerekçesi.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü denetlemek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısı yapar.
- Geçerli paket tarama durumunu, açık bildirim sayısını, en son sürümün manuel
  moderasyon durumunu, indirme engelleme durumunu ve moderasyon gerekçelerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekteki OpenClaw tüketimi için hazır olup olmadığını denetler.
- `GET /api/v1/packages/{name}/readiness` çağrısı yapar.
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

- Birlikte gelen bir OpenClaw plugin’inin yerini alabilecek bir paket için operatör odaklı geçiş durumunu gösterir.
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

- `POST /api/v1/packages` aracılığıyla bir kod plugin’i veya paket plugin’i yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball’ı: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL’si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json`
  gibi gerçek OpenClaw paket işaretçilerinden otomatik olarak algılanır.
- `.tgz` kaynakları ClawPack olarak işlenir. CLI tam npm-pack
  baytlarını yükler ve çıkarılmış `package/` içeriğini yalnızca doğrulama ve
  meta veri ön doldurması için kullanır.
- Kod plugin’i klasörleri, OpenClaw kurulumlarının tam yapıtı doğrulayabilmesi için yüklemeden önce
  bir ClawPack npm tarball’ına paketlenir. Paket plugin’i klasörleri ise hâlâ
  çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı depo, çözümlenen commit, ref ve alt yoldan otomatik olarak doldurulur.
- Yerel klasörler için, origin remote GitHub’ı gösterdiğinde kaynak atfı yerel git’ten otomatik algılanır.
- Harici kod plugin’leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, çözümlenmiş yayımlama yükünü yüklemeden önce önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün yayıncı erişimi olduğunda bir kullanıcı veya kuruluş yayıncı tanıtıcısı altında yayımlar.
- `--clawscan-note <text>` bir ClawScan notu ekler. Bu not ClawScan’e
  ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri gibi
  aksi halde olağandışı görünebilecek davranışlar için bağlam sağlar. Not,
  yayımlanan sürümde saklanır.
- Kapsamlı paket adları seçilen sahiple eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) geçersiz kılma olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Önerilen yerel akış

Canlı bir sürüm oluşturmadan önce çözümlenmiş paket meta verilerini ve
kaynak atfını doğrulayabilmeniz için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod plugin’leri için klasör yayımlama, paket klasöründen bir ClawPack yapıtı oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için minimal `package.json`

Harici kod plugin’lerinin `package.json` içinde az miktarda OpenClaw meta verisine ihtiyacı vardır.
Bu minimal manifest başarılı bir yayımlama için yeterlidir:

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

- `package.json.version`, paket sürümünüzdür; ancak OpenClaw uyumluluğu/derleme doğrulaması için
  yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub bunları mevcut olduklarında gösterebilir, ancak yayımlama için gerekli değildir.
- Daha ayrıntılı uyumluluk meta verileri yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion` isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız yerel ön kontrol denetimlerinin yüklemeden önce
  çalışması için yayımlamadan önce yükseltin.

#### GitHub Actions

ClawHub, plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
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
- Monorepo’lar için workflow’un plugin
  paket klasörünü yayımlaması amacıyla `source_path` geçin; örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow’u kararlı bir etikete veya tam commit SHA’sına sabitleyin. Sürüm yayımlamayı `@main` üzerinden çalıştırmayın.
- CI’ın kirletici olmaması için `pull_request`, `dry_run: true` kullanmalıdır.
- Gerçek yayımlar `workflow_dispatch` veya etiket push’ları gibi güvenilir olaylarla sınırlandırılmalıdır.
- Gizli anahtar olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push’ları hâlâ `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımları için `clawhub_token` değerini kullanılabilir tutun.
- Workflow JSON sonucunu bir yapıt olarak yükler ve workflow çıktıları olarak sunar.

### `sync`

- Yerel skill klasörlerini tarar ve yeni/değişmiş olanları yayımlar.
- Kökler herhangi bir klasör olabilir: bir skills dizini veya `SKILL.md` içeren tek bir skill klasörü.
- `~/.clawdbot/clawdbot.json` mevcut olduğunda Clawdbot skill köklerini otomatik olarak ekler:
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

- Oturum açıkken `sync` sırasında gönderilir; `CLAWHUB_DISABLE_TELEMETRY=1` (eski `CLAWDHUB_DISABLE_TELEMETRY=1`) olmadığı sürece.
- Ayrıntılar: `docs/telemetry.md`.
