---
read_when:
    - ClawHub CLI'ı Kullanma
    - Kurulum, güncelleme veya yayımlama hata ayıklaması
summary: 'CLI referansı: komutlar, bayraklar, yapılandırma ve kilit dosyası davranışı.'
x-i18n:
    generated_at: "2026-07-03T17:38:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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
- `--site <url>`: tarayıcı girişi için temel URL (varsayılan: `https://clawhub.ai`)
- `--registry <url>`: API temel URL'si (varsayılan: keşfedilen, aksi halde `https://clawhub.ai`)
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

Bu değişkenlerden herhangi biri ayarlandığında CLI, giden istekleri belirtilen
proxy üzerinden yönlendirir. HTTPS istekleri için `HTTPS_PROXY`, düz HTTP için
`HTTP_PROXY` kullanılır. Belirli ana makineler veya alan adları için proxy'yi
atlamak üzere `NO_PROXY` / `no_proxy` dikkate alınır.

Bu, doğrudan giden bağlantıların engellendiği sistemlerde gereklidir
(ör. Docker konteynerleri, yalnızca proxy üzerinden internete sahip Hetzner VPS,
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
- Eski geri dönüş: `clawhub/config.json` henüz yoksa ancak `clawdhub/config.json` varsa, CLI eski yolu yeniden kullanır
- geçersiz kılma: `CLAWHUB_CONFIG_PATH` (eski `CLAWDHUB_CONFIG_PATH`)

## Komutlar

### `login` / `auth login`

- Varsayılan: tarayıcıyı `<site>/cli/auth` adresine açar ve loopback callback üzerinden tamamlar.
- Headless: `clawhub login --token clh_...`
- Uzak/headless etkileşimli: `clawhub login --device` bir kod yazdırır ve siz `<site>/cli/device` adresinde yetkilendirirken bekler.

### `whoami`

- Saklanan token'ı `/api/v1/whoami` üzerinden doğrular.

### `token`

- Saklanan API token'ını stdout'a yazdırır.
- Yerel giriş token'ını CI secret kurulum komutlarına pipe etmek için kullanışlıdır.

### `star <skill>` / `unstar <skill>`

- Öne çıkanlarınıza bir beceri ekler/kaldırır.
- `POST /api/v1/stars/<slug>` ve `DELETE /api/v1/stars/<slug>` çağrılarını yapar.
- `--yes` onayı atlar.

### `search <query...>`

- `/api/v1/search?q=...` çağrısını yapar.
- Çıktı beceri slug'ını, sahip handle'ını, görünen adı ve alaka puanını içerir.
- Arama, indirme popülerliğinden önce tam slug/ad token eşleşmelerini tercih eder. `map` gibi bağımsız bir slug token'ı, `amap` içindeki alt dizeden daha güçlü biçimde `personal-map` ile eşleşir.
- Popülerlik küçük bir sıralama önceliğidir, en üstte yer alma garantisi değildir.
- Bir beceri görünmesi gerekirken görünmüyorsa, metadata'yı yeniden adlandırmadan önce sahip tarafından görülebilen moderasyon tanılarını kontrol etmek için oturum açıkken `clawhub inspect @owner/slug` çalıştırın.

### `explore`

- En yeni Skills listesini `/api/v1/skills?limit=...&sort=createdAt` üzerinden listeler (`createdAt` desc olarak sıralanır).
- Bayraklar:
  - `--limit <n>` (1-200, varsayılan: 25)
  - `--sort newest|updated|rating|downloads|trending` (varsayılan: newest). Eski install sort alias'ları uyumluluk için hâlâ çalışır.
  - `--json` (makine tarafından okunabilir çıktı)
- Çıktı: `<slug>  v<version>  <age>  <summary>` (özet 50 karaktere kısaltılır).

### `inspect @owner/slug`

- Kurulum yapmadan beceri metadata'sını ve sürüm dosyalarını getirir.
- `--version <version>`: belirli bir sürümü incele (varsayılan: latest).
- `--tag <tag>`: etiketli bir sürümü incele (ör. `latest`).
- `--versions`: sürüm geçmişini listele (ilk sayfa).
- `--limit <n>`: listelenecek en fazla sürüm (1-200).
- `--files`: seçilen sürümün dosyalarını listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `install @owner/slug`

- Adlandırılan sahip ve beceri için en son sürümü çözer.
- Zip'i `/api/v1/download` üzerinden indirir.
- `<workdir>/<dir>/<slug>` içine çıkarır.
- Pinlenmiş Skills üzerine yazmayı reddeder; önce `clawhub unpin <skill>` çalıştırın.
- Şunları yazar:
  - `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` öğesini kaldırır ve lockfile girdisini siler.
- Oturum açıkken, mevcut kurulum sayılarının devre dışı bırakılabilmesi için
  en iyi çabayla telemetri gönderir.
- Etkileşimli: onay ister.
- Etkileşimsiz (`--no-input`): `--yes` gerektirir.

### `list`

- `<workdir>/.clawhub/lock.json` dosyasını okur (eski `.clawdhub`).
- `clawhub pin` ile dondurulmuş Skills yanında, isteğe bağlı neden dahil olmak üzere `pinned` gösterir.

### `pin <skill>`

- Kurulu bir beceriyi lockfile içinde pinlenmiş olarak işaretler.
- `--reason <text>` becerinin neden dondurulduğunu kaydeder.
- Pinlenmiş Skills `update --all` tarafından atlanır ve doğrudan `update <skill>` tarafından reddedilir.
- Yerel baytların yanlışlıkla değiştirilememesi için pinlenmiş Skills ayrıca `install --force` komutunu reddeder.

### `unpin <skill>`

- Gelecekteki güncellemelerin onu değiştirebilmesi için kurulu bir beceriden lockfile pin'ini kaldırır.

### `update [@owner/slug]` / `update --all`

- Yerel dosyalardan parmak izi hesaplar.
- Parmak izi bilinen bir sürümle eşleşirse: istem yok.
- Parmak izi eşleşmezse:
  - varsayılan olarak reddeder
  - `--force` ile üzerine yazar (veya etkileşimliyse istemle)
- Pinlenmiş Skills hiçbir zaman `--force` tarafından güncellenmez.
- `update <skill>` pinlenmiş Skills için hızlıca başarısız olur ve önce `clawhub unpin <skill>` çalıştırmanızı söyler.
- `update --all` pinlenmiş slug'ları atlar ve nelerin dondurulmuş kaldığının bir özetini yazdırır.

### `skill publish <path>`

- Yerel paket parmak izini ClawHub ile karşılaştırır ve içerik zaten yayımlanmışsa
  başarıyla çıkar.
- Yeni Skills varsayılan olarak `1.0.0` olur; değiştirilmiş Skills varsayılan olarak sonraki patch
  sürümü olur.
- `--version <version>` açıkça bir sürüm seçer ve içerik mevcut bir sürümle
  eşleşse bile yayımlar.
- `--dry-run` yayımlamayı yükleme yapmadan çözer; `--json` makine tarafından
  okunabilir bir sonuç yazdırır.
- Aktör publisher erişimine sahipse `--owner <handle>` bir org/kullanıcı publisher handle'ı altında yayımlar.
- `--migrate-owner`, yeni bir sürüm yayımlarken mevcut bir beceriyi `--owner` değerine taşır. Her iki publisher üzerinde admin/owner erişimi gerektirir.
- Sahip ve inceleme davranışı `docs/publishing.md` içinde açıklanır.
- Bir beceriyi yayımlamak, onun ClawHub üzerinde `MIT-0` altında yayımlandığı anlamına gelir.
- Yayımlanmış Skills atıf olmadan kullanmak, değiştirmek ve yeniden dağıtmak için ücretsizdir.
- ClawHub ücretli Skills veya beceri başına fiyatlandırmayı desteklemez.
- Eski alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub'ın yeniden kullanılabilir
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
workflow'u, bir `skill_path` için veya `root` altındaki her doğrudan beceri
klasörü için `skill publish` çağrısı yapar (varsayılan: `skills`). Değişmemiş Skills atlar ve
aynı otomatik patch-version davranışını kullanır.

Token olmadan önizleme yapmak için `dry_run: true` ayarlayın. Gerçek yayımlamalar
`clawhub_token` secret'ını gerektirir.

### `sync`

- Geçerli workdir'i, yapılandırılmış Skills dizinini ve `SKILL.md` veya
  `skill.md` içeren yerel beceri klasörleri için tüm `--root <dir>` klasörlerini
  tarar.
- Her yerel beceri parmak izini ClawHub ile karşılaştırır ve yalnızca yeni veya
  değiştirilmiş Skills yayımlar.
- Yeni Skills `1.0.0` olarak yayımlanır; değiştirilmiş Skills varsayılan olarak
  sonraki patch sürümünü yayımlar. Daha büyük bir semver adımıyla ilerlemesi
  gereken güncelleme toplu işleri için `--bump minor|major` kullanın.
- `--dry-run` yayımlama planını yükleme yapmadan gösterir; `--json` makine tarafından
  okunabilir bir plan yazdırır.
- `--all` her yeni veya değiştirilmiş beceriyi istem göstermeden yayımlar. `--all`
  olmadan etkileşimli terminaller yayımlanacak Skills seçmenize izin verir.
- Aktör publisher erişimine sahipse `--owner <handle>` bir org/kullanıcı publisher handle'ı altında yayımlar.
- `sync` yalnızca tek yönlü yayımlamadır. Kurmaz, güncellemez, indirmez veya
  kurulum/indirme telemetrisi raporlamaz.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` gerektirir.
- ClawHub ClawScan'i `POST /api/v1/skills/-/scan` üzerinden çalıştırır, ardından tarama terminal duruma gelene kadar yoklar.
- Taramalar asenkrondur ve tamamlanması zaman alabilir. Kuyruktayken terminal spinner'ı geçerli öncelikli tarama konumunu ve önde kaç tarama olduğunu gösterir.
- Yayımlanmış taramalar sahiplik veya publisher yönetim erişimi gerektirir. Moderatörler/adminler aynı backend'i `clawhub-admin` üzerinden kullanabilir.
- `--update` yalnızca `--slug` ile geçerlidir; başarılı yayımlanmış tarama sonuçlarını seçilen sürüme geri yazar.
- `--output <file.zip>` tam rapor arşivini `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` ile indirir.
- `--json` otomasyon için tam yoklama yanıtını yazdırır.
- Yerel path taramaları artık desteklenmez. Yeni bir sürüm yükleyin, ardından gönderilen o sürüm için saklanan tarama sonuçlarını almak üzere `scan download` kullanın.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` gerektirir.
- ClawHub güvenlik kontrolleri tarafından engellenen veya gizlenen sürümler dahil olmak üzere, gönderilmiş bir beceri veya Plugin sürümü için saklanan tarama raporu ZIP'ini indirir.
- Beceri indirmeleri beceri slug'ını kullanır ve varsayılan olarak `--kind skill` olur.
- Plugin indirmeleri paket adını kullanır ve `--kind plugin` gerektirir.
- Yazarların ClawHub tarafından engellenen tam gönderilmiş sürümü incelemesi için `--version` gereklidir.
- `--output <file.zip>` hedef yolu seçer.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub, beceri depoları ve katalog depoları için
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
adresinde resmi yeniden kullanılabilir bir workflow sağlar.

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
- Bir beceri klasörünü işlemek için `skill_path: skills/review-helper` geçirin.
- `owner`, CLI `--owner` bayrağına eşlenir; kimliği doğrulanmış kullanıcı olarak yayımlamak için bunu atlayın.
- V1 beceri yayımlama `clawhub_token` kullanır; GitHub OIDC güvenilir yayımlama şimdilik yalnızca paket içindir.

### `delete <skill>`

- `--version` olmadan, bir beceriyi geçici olarak siler (sahip, moderatör veya yönetici).
- `DELETE /api/v1/skills/{slug}` çağrısı yapar.
- Sahip tarafından başlatılan geçici silmeler, slug'ı 30 gün boyunca ayırır; komut sona erme zamanını yazdırır.
- `--version <version>`, sahip olunan en son olmayan tek bir sürümü fail-closed,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce
  bir yedek yayımlayın. Platform personeli bu yalnızca sürüm akışı için sahipliği atlayamaz.
- `--reason <text>`, tüm beceri geçici silmesi ve denetim günlüğü için bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes`, onayı atlar.

### `undelete <skill>`

- Gizli bir beceriyi geri yükler (sahip, moderatör veya yönetici).
- Sürüm geri alma yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- `POST /api/v1/skills/{slug}/undelete` çağrısı yapar.
- `--reason <text>`, beceri ve denetim günlüğü için bir moderasyon notu kaydeder.
- `--note <text>`, `--reason` için bir takma addır.
- `--yes`, onayı atlar.

### `hide <skill>`

- Bir beceriyi gizler (sahip, moderatör veya yönetici).
- `delete` için takma addır.

### `unhide <skill>`

- Bir beceriyi görünür yapar (sahip, moderatör veya yönetici).
- `undelete` için takma addır.

### `skill rename <skill> <new-name>`

- Sahip olunan bir beceriyi yeniden adlandırır ve önceki slug'ı bir yönlendirme takma adı olarak tutar.
- `POST /api/v1/skills/{slug}/rename` çağrısı yapar.
- `--yes`, onayı atlar.

### `skill merge <source> <target>`

- Sahip olunan bir beceriyi sahip olunan başka bir beceriyle birleştirir.
- Kaynak slug herkese açık listelenmeyi durdurur ve hedefe yönlendiren bir takma ad olur.
- `POST /api/v1/skills/{sourceSlug}/merge` çağrısı yapar.
- `--yes`, onayı atlar.

### `transfer`

- Sahiplik aktarımı iş akışı.
- Kullanıcı handle'larına aktarımlar, alıcının kabul ettiği bekleyen bir istek oluşturur.
- Org/yayıncı handle'larına aktarımlar, yalnızca aktörün hem mevcut sahibe hem de hedef yayıncıya
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
- Bunu plugins ve diğer paket ailesi girdileri için kullanın; üst düzey `search`, beceri arama yüzeyi olarak kalır.
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
- `--limit <n>`: listelenecek en fazla sürüm sayısı (1-100).
- `--files`: seçilen sürüm için dosyaları listele.
- `--file <path>`: ham dosya içeriğini getir (yalnızca metin dosyaları; 200KB sınırı).
- `--json`: makine tarafından okunabilir çıktı.

### `package download <name>`

- Bir paket sürümünü
  `GET /api/v1/packages/{name}/versions/{version}/artifact` üzerinden çözer.
- Yapıtı çözümleyicinin `downloadUrl` değerinden indirir.
- Tüm yapıtlar için ClawHub SHA-256 değerini doğrular.
- ClawPack npm-pack yapıtları için ayrıca npm `sha512` bütünlüğünü,
  npm shasum değerini ve tarball içindeki `package.json` adını/sürümünü doğrular.
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

- Yerel bir yapıt için ClawHub SHA-256, npm `sha512` bütünlüğü ve npm shasum
  değerini hesaplar.
- `--package` ile beklenen meta verileri ClawHub'dan çözer ve
  yerel dosyayı yayımlanmış yapıt meta verileriyle karşılaştırır.
- Doğrudan özet bayraklarıyla, ağ araması yapmadan doğrular.
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

### `package validate <source>`

- ClawHub CLI'nin paketli Plugin Inspector aracını yerel bir plugin paketi
  klasörüne karşı çalıştırır.
- Yerel bir OpenClaw checkout konumunu bulmadan veya içe aktarmadan, varsayılan olarak
  çevrimdışı/statik doğrulama yapar.
- Sert uyumluluk hataları sıfır olmayan kodla çıkar. Yalnızca uyarı bulguları yazdırılır ancak
  sıfır koduyla çıkar.
- Bayraklar:
  - `--out <dir>`: Plugin Inspector raporlarını bu dizine yaz.
  - `--openclaw <path>`: açıkça belirtilen yerel OpenClaw checkout'ına karşı incele.
  - `--runtime`: çalışma zamanı yakalamayı etkinleştir; plugin kodunu içe aktarır.
  - `--allow-execute`: yalıtılmış bir çalışma alanında çalışma zamanı yakalamaya izin ver.
  - `--no-mock-sdk`: çalışma zamanı yakalama sırasında taklit OpenClaw SDK'sını devre dışı bırak.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package validate ./example-plugin
```

Doğrulama bir paket, manifest, SDK içe aktarma veya yapıt bulgusu bildirirse
[Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes) sayfasına bakın, ardından komutu yeniden çalıştırın.

### `package delete <name>`

- `--version` olmadan, bir paketi ve tüm sürümleri geçici olarak siler.
- `--version <version>`, sahip olunan en son olmayan tek bir sürümü fail-closed,
  sürüme özgü bir rota üzerinden kalıcı olarak siler.
  Silinen sürümler geri yüklenemez veya yeniden yayımlanamaz. Geçerli en son sürümü silmeden önce
  bir yedek yayımlayın. Bu yalnızca sürüm akışı paket sahibini veya bir org yayıncı
  yöneticisini gerektirir; platform personeli paket sahipliğini atlayamaz.
- Tüm paket geçici silmesi paket sahibini, bir org yayıncı sahibi/yöneticisini, platform
  moderatörünü veya platform yöneticisini gerektirir.
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

- Geçici olarak silinmiş bir paketi ve sürümlerini geri yükler.
- Sürüm geri alma yoktur; kalıcı olarak silinen sürümler geri yüklenemez.
- Paket sahibini, bir org yayıncı sahibi/yöneticisini, platform moderatörünü
  veya platform yöneticisini gerektirir.
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
- Platform yöneticisi tarafından yapılmadığı sürece, hem mevcut paket sahibine hem de hedef
  yayıncıya yönetici erişimi gerektirir.
- Kapsamlı paket adları eşleşen kapsam sahibine aktarılmalıdır.
- `POST /api/v1/packages/{name}/transfer` çağrısı yapar.
- Bayraklar:
  - `--to <owner>`: hedef yayıncı handle'ı.
  - `--reason <text>`: isteğe bağlı denetim gerekçesi.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Bir paketi moderatörlere bildirmek için kimliği doğrulanmış komut.
- `POST /api/v1/packages/{name}/report` çağrısı yapar.
- Raporlar paket düzeyindedir, isteğe bağlı olarak bir sürüme bağlanır ve inceleme için
  moderatörlere görünür hale gelir.
- Raporlar tek başına paketleri otomatik gizlemez veya indirmeleri engellemez.
- Bayraklar:
  - `--version <version>`: rapora eklenecek isteğe bağlı paket sürümü.
  - `--reason <text>`: gerekli rapor gerekçesi.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Paket moderasyon görünürlüğünü kontrol etmek için sahip komutu.
- `GET /api/v1/packages/{name}/moderation` çağrısı yapar.
- Geçerli paket tarama durumunu, açık rapor sayısını, en son sürüm manuel
  moderasyon durumunu, indirme engelleme durumunu ve moderasyon gerekçelerini gösterir.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Bir paketin gelecekteki OpenClaw tüketimi için hazır olup olmadığını kontrol eder.
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

- Paketli bir OpenClaw plugin yerine geçebilecek bir paket için operatör odaklı
  geçiş durumunu gösterir.
- `package readiness` ile aynı hesaplanan hazır olma uç noktasını çağırır, ancak
  geçiş odaklı durum, en son sürüm, resmi paket durumu, kontroller ve
  engelleyicileri yazdırır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Kimliği doğrulanmış kullanıcının sahip olduğu bir org yayıncısı oluşturur.
- Handle küçük harfe normalize edilir ve `@` ile veya olmadan geçirilebilir.
- Yeni oluşturulan org yayıncıları varsayılan olarak güvenilir/resmi değildir.
- Handle mevcut bir yayıncı, kullanıcı veya ayrılmış rota tarafından zaten kullanılıyorsa başarısız olur.

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
- Metadata, `package.json`, `openclaw.plugin.json` ve
  `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json` ve
  `.cursor-plugin/plugin.json` gibi gerçek OpenClaw bundle işaretçilerinden otomatik algılanır.
- `.tgz` kaynakları ClawPack olarak ele alınır. CLI, tam npm-pack
  baytlarını yükler ve çıkarılan `package/` içeriğini yalnızca doğrulama ve
  metadata ön doldurması için kullanır.
- Kod Plugin'i klasörleri, yükleme öncesinde ClawPack npm tarball'ı olarak paketlenir; böylece
  OpenClaw kurulumları tam artifact'i doğrulayabilir. Bundle Plugin'i klasörleri ise hâlâ
  çıkarılmış dosya yayımlama yolunu kullanır.
- GitHub kaynakları için kaynak atfı depo, çözümlenen commit, ref ve alt yoldan otomatik doldurulur.
- Yerel klasörler için origin remote GitHub'ı gösterdiğinde kaynak atfı yerel git'ten otomatik algılanır.
- Harici kod Plugin'leri `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` değerlerini açıkça bildirmelidir.
  Üst düzey `package.json.version`, yayımlama doğrulaması için fallback olarak kullanılmaz.
- `--dry-run`, yükleme yapmadan çözümlenen yayımlama payload'unu önizler.
- `--json`, CI için makine tarafından okunabilir çıktı üretir.
- `--owner <handle>`, aktörün publisher erişimi olduğunda bir kullanıcı veya kuruluş publisher handle'ı altında yayımlar.
- Scoped paket adları seçilen owner ile eşleşmelidir. Bkz. `docs/publishing.md`.
- Mevcut bayraklar (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) override olarak çalışmaya devam eder.
- Özel GitHub depoları `GITHUB_TOKEN` gerektirir.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Önerilen yerel akış

Canlı bir release oluşturmadan önce çözümlenen paket metadatasını ve
kaynak atfını doğrulayabilmeniz için önce `--dry-run` kullanın:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Yerel klasör akışı

Kod Plugin'leri için klasör yayımlama, paket klasöründen bir ClawPack artifact'i oluşturur ve yükler:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` için minimal `package.json`

Harici kod Plugin'leri `package.json` içinde az miktarda OpenClaw metadatasına ihtiyaç duyar.
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

Zorunlu alanlar:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notlar:

- `package.json.version`, paket release sürümünüzdür; ancak OpenClaw uyumluluk/build
  doğrulaması için fallback olarak kullanılmaz.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı metadatadır.
  ClawHub bunlar mevcut olduğunda gösterebilir, ancak yayımlama için zorunlu değildir.
- Daha ayrıntılı uyumluluk metadatası yayımlamak istiyorsanız
  `openclaw.compat.minGatewayVersion` ve
  `openclaw.build.pluginSdkVersion` isteğe bağlı ek alanlardır.
- Daha eski bir `clawhub` CLI release'i kullanıyorsanız, yayımlamadan önce yükseltin; böylece
  yerel ön kontroller yüklemeden önce çalışır.
- Doğrulama bir düzeltme kodu bildirirse, bkz.
  [Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub ayrıca Plugin depoları için
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
konumunda resmi bir yeniden kullanılabilir workflow sağlar.

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
- Monorepo'lar için `source_path` geçin; böylece workflow Plugin
  paket klasörünü yayımlar, örneğin `source_path: extensions/codex`.
- Yeniden kullanılabilir workflow'u kararlı bir etikete veya tam commit SHA'sına sabitleyin. Release yayımlamayı `@main` üzerinden çalıştırmayın.
- `pull_request`, CI'ın kirlenmemesi için `dry_run: true` kullanmalıdır.
- Gerçek yayımlamalar `workflow_dispatch` veya tag push'ları gibi güvenilir olaylarla sınırlandırılmalıdır.
- Secret olmadan güvenilir yayımlama yalnızca `workflow_dispatch` üzerinde çalışır; tag push'ları hâlâ `clawhub_token` gerektirir.
- İlk yayımlama, güvenilmeyen paketler veya acil durum yayımlamaları için `clawhub_token` erişilebilir tutun.
- Workflow, JSON sonucunu artifact olarak yükler ve workflow çıktıları olarak sunar.

### `package trusted-publisher get <name>`

- Bir paket için GitHub Actions güvenilir publisher yapılandırmasını gösterir.
- Yapılandırmayı ayarladıktan sonra repository'yi, workflow dosya adını
  ve isteğe bağlı environment pin'ini doğrulamak için bunu kullanın.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Mevcut bir paket için GitHub Actions güvenilir publisher yapılandırması ekler veya değiştirir.
- Paket önce normal manuel veya token ile kimlik doğrulamalı
  `clawhub package publish` üzerinden oluşturulmuş olmalıdır.
- Yapılandırma ayarlandıktan sonra, gelecekte desteklenen GitHub Actions yayımlamaları
  uzun ömürlü ClawHub token'ı olmadan OIDC/güvenilir yayımlama kullanabilir.
- `--repository <repo>` değeri `owner/repo` olmalıdır.
- `--workflow-filename <file>`, `.github/workflows/` içindeki workflow dosya adıyla eşleşmelidir.
- `--environment <name>` isteğe bağlıdır. Yapılandırıldığında, OIDC claim'indeki GitHub Actions
  environment değeri tam olarak eşleşmelidir.
- ClawHub, bu komut çalıştığında yapılandırılan GitHub repository'sini doğrular.
  Public repository'ler public GitHub metadatası üzerinden doğrulanabilir. Private
  repository'ler, örneğin gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkili
  GitHub entegrasyonu yoluyla ClawHub'ın ilgili repository'ye GitHub erişimi olmasını gerektirir.
- Bayraklar:
  - `--repository <repo>`: GitHub repository'si, örneğin `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflow dosya adı, örneğin `package-publish.yml`.
  - `--environment <name>`: isteğe bağlı tam eşleşen GitHub Actions environment'ı.
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Güvenilir publisher yapılandırmasını bir paketten kaldırır.
- Workflow, repository veya environment pin'inin devre dışı bırakılması ya da yeniden oluşturulması gerektiğinde
  bunu rollback olarak kullanın.
- Gelecekteki gerçek yayımlamalar, yapılandırma yeniden ayarlanana kadar normal kimlik doğrulamalı yayımlamayı kullanmalıdır.
- Bayraklar:
  - `--json`: makine tarafından okunabilir çıktı.

Örnek:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Kurulum telemetrisi

- Oturum açılmışken `clawhub install <slug>` sonrasında gönderilir; ancak
  `CLAWHUB_DISABLE_TELEMETRY=1` ayarlıysa gönderilmez.
- Raporlama best-effort yapılır. Telemetri kullanılamıyorsa install komutları başarısız olmaz.
- Ayrıntılar: `docs/telemetry.md`.
