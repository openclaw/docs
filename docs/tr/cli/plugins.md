---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
summary: '`openclaw plugins` için CLI başvurusu (listeleme, kurma, marketplace, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-24T09:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway Plugin'lerini, kanca paketlerini ve uyumlu paketleri yönetin.

İlgili:

- Plugin sistemi: [Plugin'ler](/tr/tools/plugin)
- Paket uyumluluğu: [Plugin paketleri](/tr/plugins/bundles)
- Plugin manifesti + şema: [Plugin manifesti](/tr/plugins/manifest)
- Güvenlik sıkılaştırması: [Güvenlik](/tr/gateway/security)

## Komutlar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı
Plugin'i); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw Plugin'leri, satır içi JSON
Schema ile `openclaw.plugin.json` göndermelidir (`configSchema`, boş olsa bile). Uyumlu paketler bunun yerine kendi paket
manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi
çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket
yeteneklerini gösterir.

### Kurulum

```bash
openclaw plugins install <package>                      # Önce ClawHub, sonra npm
openclaw plugins install clawhub:<package>              # Yalnızca ClawHub
openclaw plugins install <package> --force              # mevcut kurulumu üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açık)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Çıplak paket adları önce ClawHub'a, sonra npm'e karşı denetlenir. Güvenlik notu:
Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.

`plugins` bölümünüz tek dosyalık bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` o dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirilmek yerine güvenli kapanışla başarısız olur. Desteklenen şekiller için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

Yapılandırma geçersizse, `plugins install` normalde güvenli kapanışla başarısız olur ve size önce
`openclaw doctor --fix` çalıştırmanızı söyler. Belgelenmiş tek istisna, açıkça
`openclaw.install.allowInvalidConfigRecovery` kullanan Plugin'ler için dar kapsamlı bir
paketlenmiş-Plugin kurtarma yoludur.

`--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulmuş bir
Plugin'i veya kanca paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilerek yeniden kurarken bunu kullanın.
Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için
`openclaw plugins update <id-or-npm-spec>` tercih edin.

Zaten kurulmuş bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw
normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna,
mevcut kurulumu farklı bir kaynaktan gerçekten üzerine yazmak istiyorsanız da
`plugins install <package> --force` komutuna yönlendirir.

`--pin` yalnızca npm kurulumları için geçerlidir. `--marketplace` ile desteklenmez,
çünkü marketplace kurulumları npm belirteci yerine marketplace kaynak meta verisini kalıcılaştırır.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir.
Yerleşik tarayıcı `critical` bulgular bildirse bile kurulumun sürmesine izin verir, ancak Plugin `before_install` kanca politika engellerini **geçersiz kılmaz** ve tarama
başarısızlıklarını **geçersiz kılmaz**.

Bu CLI bayrağı Plugin kurulum/güncelleme akışları için geçerlidir. Gateway destekli skill
bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill
indirme/kurma akışı olarak kalır.

`plugins install`, `package.json` içinde
`openclaw.hooks` sunan kanca paketleri için de kurulum yüzeyidir. Filtrelenmiş kanca
görünürlüğü ve kanca başına etkinleştirme için paket kurulumu değil, `openclaw hooks` kullanın.

Npm belirteçleri **yalnızca kayıt defteri içindir** (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirteçleri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalıştırılır.

Çıplak belirteçler ve `@latest`, kararlı izde kalır. Npm bunlardan herhangi birini
bir ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketi veya
`@1.2.3-beta.4` gibi tam bir ön sürümle açık katılım yapmanızı ister.

Çıplak bir kurulum belirteci paketlenmiş bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw
paketlenmiş Plugin'i doğrudan kurar. Aynı adlı bir npm paketi kurmak için,
açık kapsamlı bir belirteç kullanın (örneğin `@scope/diffs`).

Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace kurulumları da desteklenir.

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak npm-güvenli Plugin belirteçleri için de ClawHub'ı tercih eder. Yalnızca
ClawHub'da o paket veya sürüm yoksa npm'e geri döner:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw, paket arşivini ClawHub'dan indirir, duyurulan
Plugin API / minimum Gateway uyumluluğunu denetler, ardından normal
arşiv yolu üzerinden kurar. Kaydedilen kurulumlar, daha sonraki güncellemeler için ClawHub kaynak meta verisini korur.

Marketplace adı, Claude'un
`~/.claude/plugins/known_marketplaces.json` içindeki yerel kayıt defteri önbelleğinde varsa `plugin@marketplace` kısa gösterimini kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça geçirmek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace kaynakları şunlar olabilir:

- `~/.claude/plugins/known_marketplaces.json` içinden Claude bilinen-marketplace adı
- yerel bir marketplace kökü veya `marketplace.json` yolu
- `owner/repo` gibi bir GitHub repo kısa gösterimi
- `https://github.com/owner/repo` gibi bir GitHub repo URL'si
- bir git URL'si

GitHub veya git'ten yüklenen uzak marketplace'lerde, Plugin girdileri klonlanmış marketplace deposunun içinde kalmalıdır. OpenClaw, o depodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol dışı Plugin kaynaklarını reddeder.

Yerel yollar ve arşivler için OpenClaw otomatik olarak şunları algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude
  bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Uyumlu paketler normal Plugin köküne kurulur ve
aynı listeleme/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude
command-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` /
manifest tarafından bildirilen `lspServers` varsayılanları, Cursor command-skills ve uyumlu
Codex kanca dizinleri desteklenir; algılanan diğer paket yetenekleri tanılama/bilgi çıktısında gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.

### Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Yalnızca yüklenmiş Plugin'leri göstermek için `--enabled` kullanın. Tablo görünümünden
kaynak/orijin/sürüm/etkinleştirme
meta verisi içeren Plugin başına ayrıntı satırlarına geçmek için `--verbose` kullanın. Makine tarafından okunabilir envanter ve kayıt defteri
tanılamaları için `--json` kullanın.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağlı kurulumlar yönetilen bir kurulum hedefi üzerine kopyalamak yerine
kaynak yolu yeniden kullandığından `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken, npm kurulumlarında çözümlenen tam belirteci (`name@version`) `plugins.installs` içine kaydetmek için `--pin` kullanın.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries`, `plugins.installs`,
Plugin izin listesi ve uygulanabiliyorsa bağlı `plugins.load.paths` girdilerinden kaldırır.
Active Memory Plugin'lerinde, bellek yuvası `memory-core` olarak sıfırlanır.

Varsayılan olarak kaldırma, etkin
durum-dizini Plugin kökü altındaki Plugin kurulum dizinini de siler. Dosyaları diskte tutmak için
`--keep-files` kullanın.

`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler `plugins.installs` içindeki izlenen kurulumlara ve `hooks.internal.installs` içindeki izlenen kanca-paketi
kurulumlarına uygulanır.

Bir Plugin kimliği geçirdiğinizde, OpenClaw o
Plugin için kaydedilmiş kurulum belirtecini yeniden kullanır. Bu, daha önce kaydedilmiş `@beta` gibi dist-tag'lerin ve tam sabitlenmiş
sürümlerin sonraki `update <id>` çalıştırmalarında da kullanılmaya devam ettiği anlamına gelir.

Npm kurulumları için, bir dist-tag
veya tam sürüm içeren açık bir npm paket belirteci de geçirebilirsiniz. OpenClaw, bu paket adını izlenen Plugin
kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki
kimlik tabanlı güncellemeler için yeni npm belirtecini kaydeder.

Sürüm veya etiket olmadan npm paket adını geçirmek de izlenen Plugin
kaydına geri çözümlenir. Bir Plugin tam sürüme sabitlenmişken
onu kayıt defterinin varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

Canlı npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Kurulu sürüm ve kaydedilmiş yapıt
kimliği zaten çözümlenen hedefle eşleşiyorsa, güncelleme indirme,
yeniden kurma veya `openclaw.json` yeniden yazımı olmadan atlanır.

Depolanmış bir bütünlük hash'i varsa ve getirilen yapıt hash'i değişirse,
OpenClaw bunu npm yapıt sapması olarak değerlendirir. Etkileşimli
`openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve
devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça güvenli kapanışla başarısız olur.

`--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taramasındaki yanlış pozitifler için
`plugins update` üzerinde de acil durum geçersiz kılması olarak kullanılabilir. Yine de Plugin `before_install` politika engellerini
veya tarama-başarısızlık engellemelerini geçersiz kılmaz ve yalnızca Plugin güncellemeleri için geçerlidir, kanca-paketi
güncellemeleri için geçerli değildir.

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir Plugin için derin iç gözlem. Kimlik, yükleme durumu, kaynak,
kayıtlı yetenekler, kancalar, araçlar, komutlar, hizmetler, Gateway yöntemleri,
HTTP yolları, politika bayrakları, tanılamalar, kurulum meta verileri, paket yetenekleri
ve algılanan MCP veya LSP sunucu desteğini gösterir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca kancalar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazlası için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

`--json` bayrağı, betik yazma ve
denetim için uygun makine tarafından okunabilir bir rapor verir.

`inspect --all`, şekil, yetenek türleri,
uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunlarıyla filo genelinde bir tablo oluşturur.

`info`, `inspect` için bir takma addır.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve
uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues
detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül-şekli hatalarında, tanılama çıktısına
özet dışa aktarım-şekli bilgisini eklemek için komutu
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listeleme, yerel bir marketplace yolu, bir `marketplace.json` yolu,
`owner/repo` gibi bir GitHub kısa gösterimi, bir GitHub depo URL'si veya bir git URL'si kabul eder. `--json`,
çözümlenen kaynak etiketini ve ayrıştırılmış marketplace manifestini
ve Plugin girdilerini yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Topluluk Plugin'leri](/tr/plugins/community)
