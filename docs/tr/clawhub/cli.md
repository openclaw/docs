---
read_when:
    - ClawHub CLI Kullanımı
    - Kurulum, güncelleme veya yayınlama hata ayıklama
summary: 'CLI referansı: komutlar, bayraklar, yapılandırma ve kilit dosyası davranışı.'
x-i18n:
    generated_at: "2026-07-01T08:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
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
`HTTP_PROXY` kullanılır. Belirli ana makineler veya etki alanları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(örn. Docker kapsayıcıları, yalnızca proxy ile internet erişimi olan Hetzner VPS,
kurumsal güvenlik duvarları).

Örnek:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Proxy değişkeni ayarlanmadığında davranış değişmez (doğrudan bağlantılar).

## Yapılandırma dosyası

API token'ınızı + önbelleğe alınmış registry URL'sini saklar.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve local loopback geri çağrısı üzerinden tamamlar.
- Başsız: `clawhub login --token clh_...`
- Uzak/başsız etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `token`

- Saklanan API token'ını stdout'a yazdırır.
- Yerel oturum açma token'ını CI secret kurulum komutlarına aktarmak için kullanışlıdır.

### `star <skill>` / `unstar <skill>`

- Bir beceriyi öne çıkanlarınıza ekler veya kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Çıktı beceri slug'ını, sahip handle'ını, görünen adı ve alaka puanını içerir.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- Popülerlik küçük bir sıralama önceliğidir; en üst sırayı garanti etmez.
- Bir becerinin görünmesi gerekiyor ama görünmüyorsa, meta veriyi yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılamalarını kontrol etmek için oturum açmışken `clawhub inspect @owner/slug` çalıştırın.

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` üzerinden en yeni becerileri listeler (`createdAt` azalan sıralı).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|rating|downloads|trending` (varsayılan: newest). Eski kurulum sıralama takma adları uyumluluk için çalışmaya devam eder.
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect @owner/slug`

- Kurulum yapmadan beceri meta verilerini ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketlenmiş bir sürümü incele (örn. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-200).
- `--files`: seçili sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install @owner/slug`

- Adlandırılmış sahip ve beceri için en son sürümü çözer.
- Zip'i `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Sabitlenmiş becerilerin üzerine yazmayı reddeder; önce `clawhub unpin <skill>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Oturum açıkken mevcut kurulum sayılarının devre dışı bırakılabilmesi için
  en iyi çabayla telemetri gönderir.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- İsteğe bağlı neden dahil olmak üzere `clawhub pin` ile dondurulmuş becerilerin yanında `pinned` gösterir.

### `pin <skill>`

- Kurulu bir beceriyi lockfile içinde sabitlenmiş olarak işaretler.
- `--reason <text>` becerinin neden dondurulduğunu kaydeder.
- Sabitlenmiş beceriler `update --all` tarafından atlanır ve doğrudan `update <skill>` tarafından reddedilir.
- Sabitlenmiş beceriler ayrıca yerel baytların yanlışlıkla değiştirilememesi için `install --force` komutunu reddeder.

### `unpin <skill>`

- Gelecekteki güncellemelerin değiştirebilmesi için kurulu bir beceriden lockfile sabitlemesini kaldırır.

### `update [@owner/slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem gösterilmez.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Sabitlenmiş beceriler `--force` ile asla güncellenmez.
- `update <skill>` sabitlenmiş beceriler için hızlıca başarısız olur ve önce `clawhub unpin <skill>` çalıştırmanızı söyler.
- `update --all` sabitlenmiş slug'ları atlar ve nelerin donmuş kaldığına dair bir özet yazdırır.

### `skill publish <path>`

- Yerel paket parmak izini ClawHub ile karşılaştırır ve içerik zaten yayımlanmışsa
  başarıyla çıkar.
- Yeni beceriler varsayılan olarak `1.0.0` olur; değiştirilmiş beceriler varsayılan olarak bir sonraki patch
  sürümüne geçer.
- `--version <version>` açıkça bir sürüm seçer ve içerik mevcut bir sürümle
  eşleşse bile yayımlar.
- `--dry-run` yükleme yapmadan yayımlamayı çözer; `--json` makine tarafından
  okunabilir bir sonuç yazdırır.
- `--owner <handle>` aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı handle'ı altında yayımlar.
- `--migrate-owner` yeni bir sürüm yayımlarken mevcut bir beceriyi `--owner` altına taşır. Her iki yayımcıda da admin/sahip erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir beceriyi yayımlamak, onun ClawHub üzerinde `MIT-0` altında yayımlandığı anlamına gelir.
- Yayımlanan beceriler atıf olmadan ücretsiz kullanılabilir, değiştirilebilir ve yeniden dağıtılabilir.
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
iş akışı, bir `skill_path` için veya `root` (varsayılan: `skills`) altındaki her doğrudan beceri
klasörü için `skill publish` çağrısı yapar. Değişmeyen becerileri atlar ve aynı
otomatik patch sürümü davranışını kullanır.

Token olmadan önizlemek için `dry_run: true` ayarlayın. Gerçek yayımlar
`clawhub_token` secret'ını gerektirir.

### `sync`

- Geçerli workdir'i, yapılandırılmış beceriler dizinini ve `SKILL.md` veya
  `skill.md` içeren yerel beceri klasörleri için tüm `--root <dir>` klasörlerini tarar.
- Her yerel beceri parmak izini ClawHub ile karşılaştırır ve yalnızca yeni veya
  değiştirilmiş becerileri yayımlar.
- Yeni beceriler `1.0.0` olarak yayımlanır; değiştirilmiş beceriler varsayılan olarak bir sonraki patch sürümünü
  yayımlar. Daha büyük bir semver adımıyla ilerlemesi gereken güncelleme grupları için `--bump minor|major` kullanın.
- `--dry-run` yükleme yapmadan yayımlama planını gösterir; `--json` makine tarafından
  okunabilir bir plan yazdırır.
- `--all` her yeni veya değiştirilmiş beceriyi istem göstermeden yayımlar. `--all`
  olmadan, etkileşimli terminaller yayımlanacak becerileri seçmenize izin verir.
- `--owner <handle>` aktörün yayımcı erişimi olduğunda bir kuruluş/kullanıcı yayımcı handle'ı altında yayımlar.
- `sync` yalnızca tek yönlü yayımlamadır. Kurulum yapmaz, güncellemez, indirmez veya
  kurulum/indirme telemetrisi raporlamaz.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` gerektirir.
- `POST /api/v1/skills/-/scan` üzerinden ClawHub ClawScan'i çalıştırır, ardından tarama terminal olana kadar yoklama yapar.
- Taramalar asenkrondur ve tamamlanmaları zaman alabilir. Kuyruktayken terminal spinner'ı geçerli önceliklendirilmiş tarama konumunu ve önde kaç tarama olduğunu gösterir.
- Yayımlanmış taramalar sahiplik veya yayımcı yönetim erişimi gerektirir. Moderatörler/adminler aynı backend'i `clawhub-admin` üzerinden kullanabilir.
- `--update` yalnızca `--slug` ile geçerlidir; başarılı yayımlanmış tarama sonuçlarını seçili sürüme geri yazar.
- `--output <file.zip>` tam rapor arşivini `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` ile indirir.
- `--json` otomasyon için tam yoklama yanıtını yazdırır.
- Yerel yol taramaları artık desteklenmiyor. Yeni bir sürüm yükleyin, ardından gönderilen bu sürüm için saklanan tarama sonuçlarını almak üzere `scan download` kullanın.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` gerektirir.
- ClawHub güvenlik kontrolleri tarafından engellenmiş veya gizlenmiş sürümler dahil olmak üzere, gönderilmiş bir beceri veya eklenti sürümü için saklanan tarama raporu ZIP'ini indirir.
- Beceri indirmeleri beceri slug'ını kullanır ve varsayılan olarak `--kind skill` olur.
- Eklenti indirmeleri paket adını kullanır ve `--kind plugin` gerektirir.
- Yazarların ClawHub'ın engellediği tam gönderilen sürümü incelemesi için `--version` gereklidir.
- `--output <file.zip>` hedef yolu seçer.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub, beceri depoları ve katalog depoları için
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
adresinde resmi bir yeniden kullanılabilir iş akışı sunar.

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

- `root`, katalog depoları için varsayılan olarak `skills` olur.
- Tek bir beceri klasörünü işlemek için `skill_path: skills/review-helper` geçin.
- `owner`, CLI `--owner` bayrağıyla eşleşir; kimliği doğrulanmış kullanıcı olarak yayımlamak için bunu atlayın.
- V1 beceri yayımlama `clawhub_token` kullanır; GitHub OIDC güvenilir yayımlama şimdilik yalnızca paketler içindir.

### `delete <skill>`

- `--version` olmadan, bir beceriyi geçici olarak siler (sahip, moderatör veya yönetici).
- `DELETE /api/v1/skills/{slug}` çağrısı yapar.
- Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--version <version>`, sahip olunan en son olmayan tek bir sürümü fail-closed,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce
  bir yedek yayımlayın. Platform personeli bu yalnızca sürüme yönelik akışta sahipliği atlayamaz.
- `--reason <text>`, tüm becerinin geçici silinmesi ve denetim günlüğü için bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes` onayı atlar.

### `undelete <skill>`

- Gizli bir beceriyi geri yükler (sahip, moderatör veya yönetici).
- Sürüm geri yükleme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- `POST /api/v1/skills/{slug}/undelete` çağrısı yapar.
- `--reason <text>`, beceriye ve denetim günlüğüne bir moderasyon notu kaydeder.
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
- `POST /api/v1/skills/{slug}/rename` çağrısı yapar.
- `--yes` onayı atlar.

### `skill merge <source> <target>`

- Sahip olunan bir beceriyi sahip olunan başka bir beceriyle birleştirir.
- Kaynak slug herkese açık listelenmeyi bırakır ve hedefe yönlendirme takma adı olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısı yapar.
- `--yes` onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı handle'larına aktarımlar, alıcının kabul ettiği bekleyen bir istek oluşturur.
- Kuruluş/yayımcı handle'larına aktarımlar yalnızca aktörün hem mevcut sahip hem de hedef yayımcı üzerinde
  yönetici erişimi olduğunda hemen uygulanır.
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
- Bunu plugin'ler ve diğer paket ailesi girdileri için kullanın; üst düzey `search` beceri arama yüzeyi olarak kalır.
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
- `--tag <tag>`: etiketlenmiş bir sürümü inceleyin (örn. `latest`).
- `--versions`: sürüm geçmişini listeleyin (ilk sayfa).
- `--limit <n>`: listelenecek azami sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listeleyin.
- `--file <path>`: ham dosya içeriğini getirin (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü
  `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözümler.
- Artifact'i çözümleyicinin `downloadUrl` değerinden indirir.
- Tüm artifact'ler için ClawHub SHA-256 değerini doğrular.
- ClawPack npm-pack artifact'leri için ayrıca npm `sha512` bütünlüğünü,
  npm shasum değerini ve tarball'ın `package.json` adını/sürümünü doğrular.
- Eski ZIP sürümleri eski ZIP rotası üzerinden indirilir.
- Bayraklar:
  - `--version <version>`: belirli bir sürümü indirin.
  - `--tag <tag>`: etiketlenmiş bir sürümü indirin (varsayılan: `latest`).
  - `-o, --output <path>`: çıktı dosyası veya dizini.
  - `--force`: mevcut bir çıktı dosyasının üzerine yazın.
  - `--json`: makine tarafından okunabilir çıktı.

Örnekler:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Yerel bir artifact için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözümler ve
  yerel dosyayı yayımlanmış artifact meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla, ağ araması yapmadan doğrular.
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

### `package validate <source>`

- ClawHub CLI'ın paketlenmiş Plugin Inspector aracını yerel bir plugin paketi
  klasörüne karşı çalıştırır.
- Yerel bir OpenClaw checkout'unu bulmadan veya içe aktarmadan, varsayılan olarak çevrimdışı/statik doğrulama yapar.
- Katı uyumluluk hataları sıfır olmayan çıkış koduyla çıkar. Yalnızca uyarı bulguları yazdırılır ancak
  sıfır çıkış koduyla çıkar.
- Bayraklar:
  - `--out <dir>`: Plugin Inspector raporlarını bu dizine yazın.
  - `--openclaw <path>`: açık bir yerel OpenClaw checkout'una karşı inceleyin.
  - `--runtime`: runtime yakalamayı etkinleştirir; plugin kodunu içe aktarır.
  - `--allow-execute`: yalıtılmış bir çalışma alanında runtime yakalamaya izin verir.
  - `--no-mock-sdk`: runtime yakalama sırasında mock OpenClaw SDK'yı devre dışı bırakır.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package validate ./example-plugin
```

Doğrulama bir paket, manifest, SDK içe aktarma veya artifact bulgusu bildirirse,
[Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes) bölümüne bakın, ardından komutu yeniden çalıştırın.

### `package delete <name>`

- `--version` olmadan, bir paketi ve tüm yayınları geçici olarak siler.
- `--version <version>`, sahip olunan en son olmayan tek bir yayını fail-closed,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce
  bir yedek yayımlayın. Bu yalnızca sürüme yönelik akış, paket sahibini veya bir kuruluş yayımcısı
  yöneticisini gerektirir; platform personeli paket sahipliğini atlayamaz.
- Tüm paketin geçici silinmesi için paket sahibi, bir kuruluş yayımcısı sahibi/yöneticisi, platform
  moderatörü veya platform yöneticisi gerekir.
- Bayraklar:
  - `--version <version>`: en son olmayan tek bir sürümü kalıcı olarak silin.
  - `--yes`: onayı atlayın.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Geçici olarak silinmiş bir paketi ve yayınları geri yükler.
- Sürüm geri yükleme yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- Paket sahibini, bir kuruluş yayımcısı sahibini/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
- `POST /api/v1/packages/{name}/undelete` çağrısı yapar.
- Bayraklar:
  - `--yes`: onayı atlayın.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Bir paketi başka bir yayımcıya aktarır.
- Platform yöneticisi tarafından yapılmadığı sürece, hem mevcut paket sahibi hem de hedef
  yayımcı üzerinde yönetici erişimi gerektirir.
- Scoped paket adları eşleşen scope sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısı yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayımcı handle'ı.
  - `--reason <text>`: isteğe bağlı denetim nedeni.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimlik doğrulamalı komut.
- `POST /api/v1/packages/{name}/report` çağrısı yapar.
- Raporlar paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanabilir ve inceleme için
  moderatörlere görünür hale gelir.
- Raporlar tek başlarına paketleri otomatik olarak gizlemez veya indirmeleri engellemez.
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
- `GET /api/v1/packages/{name}/moderation` çağrısı yapar.
- Geçerli paket tarama durumunu, açık rapor sayısını, en son yayının manuel
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
- Resmi durum, ClawPack kullanılabilirliği, artifact özeti,
  kaynak kökeni, OpenClaw uyumluluğu, ana makine hedefleri, ortam meta verileri
  ve tarama durumu için engelleyicileri bildirir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Paketlenmiş bir OpenClaw plugin'inin yerini alabilecek bir paket için operatör odaklı geçiş durumunu gösterir.
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

- Kimliği doğrulanmış kullanıcıya ait bir kuruluş yayımcısı oluşturur.
- Handle küçük harfe normalize edilir ve `@` ile veya olmadan geçirilebilir.
- Yeni oluşturulan kuruluş yayımcıları varsayılan olarak güvenilir/resmi değildir.
- Handle mevcut bir yayımcı, kullanıcı veya ayrılmış rota tarafından zaten kullanılıyorsa başarısız olur.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Bir kod Plugin'ini veya bundle Plugin'ini `POST /api/v1/packages` üzerinden yayımlar.
- `<source>` şunları kabul eder:
  - Yerel klasör yolu: `./my-plugin`
  - Yerel ClawPack npm-pack tarball dosyası: `./my-plugin-1.2.3.tgz`
  - GitHub deposu: `owner/repo` veya `owner/repo@ref`
  - GitHub URL'si: `https://github.com/owner/repo`
- Meta veriler `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve `.cursor-plugin/plugin.json`
  gibi gerçek OpenClaw bundle işaretçilerinden otomatik olarak algılanır.
- `.tgz` kaynakları ClawPack olarak değerlendirilir. CLI, npm-pack baytlarını
  aynen yükler ve çıkarılan `package/` içeriğini yalnızca doğrulama ve
  meta veri ön doldurması için kullanır.
- Kod Plugin'i klasörleri, yüklemeden önce bir ClawPack npm tarball dosyasına
  paketlenir; böylece OpenClaw kurulumları tam yapıtı doğrulayabilir. Bundle
  Plugin'i klasörleri ise çıkarılmış dosya yayımlama yolunu kullanmaya devam eder.
- GitHub kaynakları için kaynak atfı depodan, çözümlenen commit'ten, ref'ten ve alt yoldan otomatik olarak doldurulur.
- Yerel klasörler için origin uzak deposu GitHub'ı gösterdiğinde kaynak atfı yerel git'ten otomatik olarak algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça belirtmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için yedek olarak kullanılmaz.
- `--dry-run`, çözümlenen yayımlama yükünü yükleme yapmadan önizler.
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

Kod Plugin'leri için klasörden yayımlama, paket klasöründen bir ClawPack yapıtı
oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için asgari `package.json`

Harici kod Plugin'leri `package.json` içinde az miktarda OpenClaw meta verisine
ihtiyaç duyar. Bu asgari manifest başarılı bir yayımlama için yeterlidir:

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

- `package.json.version`, paket sürümünüzdür; ancak OpenClaw uyumluluk/derleme
  doğrulaması için yedek olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
  ClawHub bunlar mevcut olduğunda gösterebilir, ancak yayımlama için zorunlu değildir.
- `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion`, daha ayrıntılı uyumluluk meta verisi
  yayımlamak istiyorsanız isteğe bağlı eklerdir.
- Daha eski bir `clawhub` CLI sürümü kullanıyorsanız, yerel ön denetimlerin
  yüklemeden önce çalışması için yayımlamadan önce yükseltin.
- Doğrulama bir düzeltme kodu bildirirse bkz.
  [Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
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
- Gizli anahtar olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; etiket push'ları yine de `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` değerini hazır tutun.
- İş akışı JSON sonucunu yapıt olarak yükler ve iş akışı çıktıları olarak sunar.

### `package trusted-publisher get <name>`

- Bir paket için GitHub Actions güvenilir yayımcı yapılandırmasını gösterir.
- Yapılandırmayı ayarladıktan sonra depo, iş akışı dosya adı ve isteğe bağlı
  ortam sabitlemesini doğrulamak için bunu kullanın.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Mevcut bir paket için GitHub Actions güvenilir yayımcı yapılandırmasını ekler
  veya değiştirir.
- Paket önce normal elle yayımlama ya da token ile kimliği doğrulanmış
  `clawhub package publish` üzerinden oluşturulmalıdır.
- Yapılandırma ayarlandıktan sonra, desteklenen gelecekteki GitHub Actions
  yayımlamaları uzun ömürlü bir ClawHub token'ı olmadan OIDC/güvenilir yayımlama kullanabilir.
- `--repository <repo>`, `owner/repo` olmalıdır.
- `--workflow-filename <file>`, `.github/workflows/` içindeki iş akışı dosya adıyla eşleşmelidir.
- `--environment <name>` isteğe bağlıdır. Yapılandırıldığında, OIDC talebindeki
  GitHub Actions ortamı tam olarak eşleşmelidir.
- ClawHub, bu komut çalıştığında yapılandırılan GitHub deposunu doğrular.
  Herkese açık depolar herkese açık GitHub meta verileri üzerinden doğrulanabilir.
  Özel depolar için ClawHub'ın bu depoya GitHub erişimi olması gerekir; örneğin
  gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkili GitHub
  entegrasyonu üzerinden.
- Bayraklar:
  - `--repository <repo>`: GitHub deposu, örneğin `openclaw/example-plugin`.
  - `--workflow-filename <file>`: iş akışı dosya adı, örneğin `package-publish.yml`.
  - `--environment <name>`: isteğe bağlı tam eşleşmeli GitHub Actions ortamı.
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
- İş akışı, depo veya ortam sabitlemesinin devre dışı bırakılması ya da yeniden
  oluşturulması gerekiyorsa bunu geri alma için kullanın.
- Gelecekteki gerçek yayımlamalar, yapılandırma yeniden ayarlanana kadar normal
  kimliği doğrulanmış yayımlamayı kullanmalıdır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Kurulum telemetrisi

- Oturum açılmışsa, `CLAWHUB_DISABLE_TELEMETRY=1` ayarlı olmadığı sürece
  `clawhub install <slug>` sonrasında gönderilir.
- Raporlama en iyi çaba ilkesine göre yapılır. Telemetri kullanılamıyorsa
  kurulum komutları başarısız olmaz.
- Ayrıntılar: `docs/telemetry.md`.
