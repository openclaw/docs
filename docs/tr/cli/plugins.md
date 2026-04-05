---
read_when:
    - Gateway eklentilerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Eklenti yükleme hatalarını hata ayıklamak istiyorsunuz
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, doctor)'
title: plugins
x-i18n:
    generated_at: "2026-04-05T13:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway eklentilerini/uzantılarını, hook paketlerini ve uyumlu paketleri yönetin.

İlgili:

- Eklenti sistemi: [Plugins](/tools/plugin)
- Paket uyumluluğu: [Plugin bundles](/plugins/bundles)
- Eklenti manifesti + şema: [Plugin manifest](/plugins/manifest)
- Güvenlik güçlendirmesi: [Security](/gateway/security)

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
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Paketlenmiş eklentiler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak
etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı
eklentisi); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw eklentileri, satır içi bir JSON
Schema (`configSchema`, boş olsa bile) ile birlikte `openclaw.plugin.json` içermelidir. Uyumlu paketler bunun yerine kendi paket
manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı list/info
çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket
yeteneklerini de gösterir.

### Yükleme

```bash
openclaw plugins install <package>                      # önce ClawHub, sonra npm
openclaw plugins install clawhub:<package>              # yalnızca ClawHub
openclaw plugins install <package> --force              # mevcut kurulumu üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açık)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Çıplak paket adları önce ClawHub, sonra npm üzerinde denetlenir. Güvenlik notu:
eklenti kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.

Yapılandırma geçersizse, `plugins install` normalde güvenli şekilde başarısız olur ve size önce
`openclaw doctor --fix` çalıştırmanızı söyler. Belgelenmiş tek istisna,
açıkça
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan eklentiler için dar kapsamlı bir
paketlenmiş eklenti kurtarma yoludur.

`--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulu olan bir
eklentiyi veya hook paketini yerinde üzerine yazar. Aynı kimliği
yeni bir yerel yol, arşiv, ClawHub paketi veya npm artefaktından kasıtlı olarak yeniden kurarken kullanın.

`--pin` yalnızca npm kurulumları için geçerlidir. `--marketplace` ile desteklenmez,
çünkü marketplace kurulumları bir
npm spec'i yerine marketplace kaynak meta verisini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için
camı kır seçeneğidir.
Yerleşik tarayıcı `critical` bulgular bildirse bile kurulumun devam etmesine izin verir, ancak plugin `before_install` hook ilke engellerini **atlatmaz**
ve tarama
başarısızlıklarını da atlatmaz.

Bu CLI bayrağı eklenti kurma/güncelleme akışları için geçerlidir. Gateway destekli skill
bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill
indirme/kurma akışı olmaya devam eder.

`plugins install`, `package.json` içinde
`openclaw.hooks` açığa çıkaran hook paketleri için de kurulum yüzeyidir. Filtrelenmiş hook
görünürlüğü ve hook başına etkinleştirme için paket kurulumu değil `openclaw hooks` kullanın.

Npm spec'leri **yalnızca registry içindir** (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalıştırılır.

Çıplak spec'ler ve `@latest` kararlı kanalda kalır. npm bunlardan herhangi birini
ön sürüme çözerse, OpenClaw durur ve sizden
`@beta`/`@rc` gibi bir ön sürüm etiketi veya `@1.2.3-beta.4` gibi tam bir ön sürüm ile açıkça katılmanızı ister.

Çıplak bir kurulum spec'i paketlenmiş bir eklenti kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw
paketlenmiş eklentiyi doğrudan kurar. Aynı adda bir npm paketi kurmak için,
açık bir kapsamlı spec kullanın (örneğin `@scope/diffs`).

Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace kurulumları da desteklenir.

ClawHub kurulumları açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak, npm açısından güvenli eklenti spec'leri için de ClawHub'ı tercih eder. Yalnızca
ClawHub'da bu paket veya sürüm yoksa npm'ye geri döner:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw paket arşivini ClawHub'dan indirir, ilan edilen
plugin API / minimum gateway uyumluluğunu denetler, ardından bunu normal
arşiv yolu üzerinden kurar. Kaydedilen kurulumlar daha sonraki güncellemeler için ClawHub
kaynak meta verilerini saklar.

Marketplace adı Claude'un yerel kayıt defteri önbelleğinde `~/.claude/plugins/known_marketplaces.json` içinde varsa
`plugin@marketplace` kısaltmasını kullanın:

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
- `owner/repo` gibi bir GitHub depo kısaltması
- `https://github.com/owner/repo` gibi bir GitHub depo URL'si
- bir git URL'si

GitHub veya git üzerinden yüklenen uzak marketplace'lerde, eklenti girdileri
klonlanan marketplace deposunun içinde kalmalıdır. OpenClaw, bu depodan gelen göreli yol kaynaklarını kabul eder
ve uzak manifestlerdeki HTTP(S), mutlak yol, git, GitHub ve diğer yol dışı
eklenti kaynaklarını reddeder.

Yerel yollar ve arşivler için OpenClaw otomatik olarak şunları algılar:

- yerel OpenClaw eklentileri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude
  bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Uyumlu paketler normal uzantılar köküne kurulur ve aynı list/info/enable/disable akışına katılır. Şu anda, paket skill'leri, Claude
command-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` /
manifestte bildirilen `lspServers` varsayılanları, Cursor command-skills ve uyumlu
Codex hook dizinleri desteklenmektedir; algılanan diğer paket yetenekleri
tanılama/info içinde gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Yalnızca yüklenen eklentileri göstermek için `--enabled` kullanın. Tablo görünümünden
eklenti başına ayrıntı satırlarına geçmek için `--verbose` kullanın; bu satırlarda kaynak/orijin/sürüm/etkinleştirme
meta verileri bulunur. Makine tarafından okunabilir envanter ve kayıt defteri
tanılamaları için `--json` kullanın.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağlantılı kurulumlar, yönetilen bir kurulum hedefinin üzerine kopyalamak yerine
kaynak yolu yeniden kullandığından `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen tam spec'i (`name@version`)
`plugins.installs` içine kaydetmek için npm kurulumlarında `--pin` kullanın.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, eklenti kayıtlarını `plugins.entries`, `plugins.installs`,
eklenti izin listesi ve uygulanabiliyorsa bağlantılı `plugins.load.paths` girdilerinden kaldırır.
Etkin bellek eklentileri için bellek yuvası `memory-core` olarak sıfırlanır.

Varsayılan olarak uninstall, etkin
state-dir eklenti kökü altındaki eklenti kurulum dizinini de kaldırır. Diskteki dosyaları korumak için
`--keep-files` kullanın.

`--keep-config`, `--keep-files` için kullanım dışı bırakılmış bir takma ad olarak desteklenir.

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, `plugins.installs` içindeki izlenen kurulumlara ve
`hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

Bir eklenti kimliği geçirdiğinizde, OpenClaw o
eklenti için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, daha önce depolanmış `@beta` gibi dist-tag'lerin ve
tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında da kullanılmaya devam edeceği anlamına gelir.

Npm kurulumları için, dist-tag
veya tam sürüm içeren açık bir npm paket spec'i de geçirebilirsiniz. OpenClaw bu paket adını izlenen eklenti
kaydına geri çözer, kurulu eklentiyi günceller ve gelecekteki
kimlik tabanlı güncellemeler için yeni npm spec'ini kaydeder.

Depolanmış bir bütünlük karması varsa ve getirilen artefakt karması değişirse,
OpenClaw bir uyarı yazdırır ve devam etmeden önce onay ister. CI/etkileşimsiz çalıştırmalarda
istemleri atlamak için genel `--yes` kullanın.

`--dangerously-force-unsafe-install`, plugin güncellemeleri sırasında
yerleşik tehlikeli kod taraması yanlış pozitifleri için camı kır geçersiz kılması olarak
`plugins update` üzerinde de kullanılabilir. Yine de plugin `before_install` ilke engellerini
veya tarama-başarısızlığı engellemelerini atlatmaz ve yalnızca plugin güncellemeleri için geçerlidir, hook paketi
güncellemeleri için değil.

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir eklenti için derin içgözlem. Kimliği, yük durumu, kaynağı,
kayıtlı yetenekleri, hook'ları, araçları, komutları, servisleri, gateway yöntemlerini,
HTTP rotalarını, ilke bayraklarını, tanılamaları, kurulum meta verilerini, paket yeteneklerini
ve algılanan MCP veya LSP sunucu desteğini gösterir.

Her eklenti, çalışma zamanında gerçekte ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir eklenti)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — yetenek yok, ama araçlar/komutlar/servisler var

Yetenek modeli hakkında daha fazla bilgi için [Plugin shapes](/plugins/architecture#plugin-shapes) bölümüne bakın.

`--json` bayrağı, betik yazma ve
denetim için uygun, makine tarafından okunabilir bir rapor çıktısı verir.

`inspect --all`, şekil, yetenek türleri,
uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo oluşturur.

`info`, `inspect` için bir takma addır.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, eklenti yükleme hatalarını, manifest/keşif tanılamalarını ve
uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues
detected.` yazdırır.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir marketplace yolunu, bir `marketplace.json` yolunu,
`owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`,
çözümlenen kaynak etiketini, ayrıştırılmış marketplace manifestini ve
eklenti girdilerini yazdırır.
