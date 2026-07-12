---
doc-schema-version: 1
read_when:
    - Control UI'da Plugin'lere göz atmak, bunları yüklemek, etkinleştirmek veya devre dışı bırakmak istiyorsunuz
    - Hızlı Plugin listeleme, yükleme, güncelleme, inceleme veya kaldırma örnekleri istiyorsunuz
    - Bir Plugin yükleme kaynağı seçmek istiyorsunuz
    - Plugin paketlerini yayımlamak için doğru referansı istiyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin'lerini Denetim Arayüzü veya CLI üzerinden yönetin
title: Pluginleri yönet
x-i18n:
    generated_at: "2026-07-12T12:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI, yaygın keşfetme, yükleme, etkinleştirme ve devre dışı bırakma
iş akışını kapsar. CLI; güncelleme, kaldırma, gelişmiş yapılandırma ve açık
yükleme kaynağı denetimleri ekler. Komut sözleşmesinin, bayrakların, kaynak seçimi
kurallarının ve uç durumların tamamı için [`openclaw plugins`](/tr/cli/plugins)
sayfasına bakın.

Tipik CLI iş akışı: bir paket bulun, ClawHub, npm, git veya yerel bir yoldan
yükleyin, yönetilen Gateway'in otomatik olarak yeniden başlamasını bekleyin
(ya da elle yeniden başlatın), ardından Plugin'in çalışma zamanı kayıtlarını
doğrulayın.

## Control UI'ı kullanma

Control UI'da **Pluginler** bölümünü açın veya yapılandırılmış Control UI temel
yoluna göre `/settings/plugins` yolunu kullanın. Örneğin, `/openclaw` temel yolu
`/openclaw/settings/plugins` yolunu kullanır. Sayfada iki sekme vardır:

- **Yüklü**, kategorilere göre gruplandırılmış tam yerel envanteri gösterir
  (kanallar, model sağlayıcıları, bellek, araçlar). Her satır bir ayrıntı
  görünümü açar; taşma (`…`) menüsü Plugin'i etkinleştirir veya devre dışı bırakır
  ve haricî olarak yüklenen Pluginler için **Kaldır** seçeneğini sunar. Bu sekme
  ayrıca yapılandırılmış [MCP sunucularını](/tr/cli/mcp), Gateway yapılandırmasındaki
  `mcp.servers` alanını düzenleyen aynı menü tabanlı etkinleştirme, devre dışı
  bırakma ve kaldırma eylemleriyle listeler.
- **Keşfet** mağazadır: OpenClaw ile birlikte gelen öne çıkan Pluginler, resmî
  haricî Pluginler ve özenle seçilmiş bir bağlayıcı rafı. Bağlayıcı kartları
  tek tıklamayla barındırılan bir MCP sunucusu ekler (GitHub, Notion, Linear,
  Sentry, Home Assistant) veya önceden doldurulmuş bir ClawHub aramasına
  yönlendirir. Arama kutusuna yazmak [ClawHub](https://clawhub.ai/plugins)
  üzerinde satır içi sorgu çalıştırır ve indirme sayıları ile kaynak doğrulama
  rozetlerini içeren bir **ClawHub'dan** bölümü ekler.

Dâhil edilen Pluginler için paket yüklemesi gerekmez. Menü eylemleri
**Etkinleştir** veya **Devre Dışı Bırak** şeklindedir. Örneğin Workboard,
OpenClaw ile birlikte gelir ve varsayılan olarak devre dışıdır; açmak için
**Etkinleştir** seçeneğini kullanın. Paketle birlikte gelen Pluginler
kaldırılamaz, yalnızca devre dışı bırakılabilir.

Katalog ve arama erişimi için `operator.read` gerekir. Yükleme, etkinleştirme,
devre dışı bırakma, kaldırma ve MCP sunucusu değişiklikleri için
`operator.admin` gerekir. ClawHub yüklemesi Gateway tarafından gerçekleştirilir
ve güven, bütünlük ve Plugin yükleme ilkesi denetimleri korunur.

Plugin kodunun yüklenmesi veya kaldırılması Gateway'in yeniden başlatılmasını
gerektirir. Yüklü Plugin ve geçerli Gateway çalışma zamanı destekliyorsa
etkinleştirme değişiklikleri yeniden başlatma olmadan uygulanabilir; aksi
takdirde UI, yeniden başlatma gerektiğini bildirir. OAuth destekli MCP
bağlayıcıları eklendikten sonra yine de CLI'dan bir kez
`openclaw mcp login <name>` çalıştırılması gerekir.

Control UI, rastgele npm, git veya yerel yol kaynaklarından yükleme yapmaz,
Pluginleri güncellemez veya zengin Plugin yapılandırmasını kullanıma sunmaz.
Bu işlemler için aşağıdaki CLI iş akışlarını kullanın.

## Pluginleri listeleme ve arama

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Betikler için `--json`:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` soğuk bir envanter denetimidir: OpenClaw'un yapılandırmadan,
manifestlerden ve kalıcı Plugin kayıt defterinden keşfedebildiklerini gösterir.
Çalışmakta olan bir Gateway'in Plugin çalışma zamanını içe aktardığını
kanıtlamaz. JSON çıktısı, kayıt defteri tanılamalarını ve her Plugin'in
`dependencyStatus` değerini (bildirilen `dependencies`/`optionalDependencies`
bağımlılıklarının diskte çözümlenip çözümlenmediğini) içerir.

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve her
sonuç için bir yükleme ipucu
(`openclaw plugins install clawhub:<package>`) yazdırır.

## Pluginleri etkinleştirme ve devre dışı bırakma

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Yüklü dosyalara dokunmadan bir Plugin'in yapılandırma girdisini değiştirir.
Paketle birlikte gelen bazı Pluginler (paketle birlikte gelen model/konuşma
sağlayıcıları ve tarayıcı Plugin'i) varsayılan olarak etkindir; diğerleri
yüklemeden sonra `enable` gerektirir.

## Pluginleri yükleme

```bash
# ClawHub'da Plugin paketlerini arayın.
openclaw plugins search "calendar"

# ClawHub'dan yükleyin.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# npm'den yükleyin.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Yerel bir npm-pack yapısından yükleyin.
openclaw plugins install npm-pack:<path.tgz>

# git'ten veya yerel bir geliştirme çalışma kopyasından yükleyin.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Öneksiz paket belirtimleri, ad paketle birlikte gelen veya resmî bir Plugin
kimliğiyle eşleşmediği sürece başlatma geçişi sırasında npm'den yüklenir;
eşleşmesi durumunda OpenClaw bunun yerine yerel/resmî kopyayı kullanır.
Belirlenimci kaynak seçimi için `clawhub:`, `npm:`, `git:` veya `npm-pack:`
kullanın.

`--force` seçeneğini yalnızca farklı bir kaynaktan gelen mevcut bir yükleme
hedefinin üzerine yazmak için kullanın. İzlenen bir npm, ClawHub veya hook-pack
yüklemesinin rutin yükseltmeleri için bunun yerine `openclaw plugins update`
kullanın; `--force`, `--link` ile desteklenmez.

## Yeniden başlatma ve inceleme

Yapılandırma yeniden yüklemesi etkin olan, çalışır durumdaki yönetilen Gateway;
Plugin kodu yüklendikten, güncellendikten veya kaldırıldıktan sonra otomatik
olarak yeniden başlar. Gateway yönetilmiyorsa veya yeniden yükleme devre dışıysa
canlı çalışma zamanı yüzeylerini denetlemeden önce kendiniz yeniden başlatın:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime`, Plugin modülünü yükler ve çalışma zamanı yüzeylerini
(araçlar, kancalar, hizmetler, Gateway yöntemleri, HTTP rotaları, Plugin'e ait
CLI komutları) kaydettiğini kanıtlar. Düz `inspect` ve `list` yalnızca soğuk
manifest/yapılandırma/kayıt defteri denetimleridir.

## Pluginleri güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Bir Plugin kimliği iletildiğinde izlenen yükleme belirtimi yeniden kullanılır:
saklanan dist-tag'ler (`@beta`) ve sabitlenmiş tam sürümler sonraki
`update <plugin-id>` çalıştırmalarına aktarılır.

`openclaw plugins update --all`, toplu bakım yoludur. Normal izlenen yükleme
belirtimlerine uymaya devam eder, ancak güvenilir resmî OpenClaw Plugin
kayıtları eski bir tam resmî pakete sabitlenmek yerine geçerli resmî katalog
hedefiyle eşitlenir; `update.channel` değeri `beta` olduğunda bu eşitleme beta
sürüm hattını tercih eder. Tam veya etiketli bir resmî belirtimi değiştirmeden
korumak için hedefli bir `update <plugin-id>` kullanın.

npm yüklemelerinde izlenen kaydı değiştirmek için açık bir paket belirtimi
iletin:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, daha önce tam bir sürüme veya etikete sabitlenmiş Plugin'i kayıt
defterinin varsayılan sürüm hattına geri taşır.

Tam geri dönüş ve sabitleme kuralları için
[`openclaw plugins`](/tr/cli/plugins#update) sayfasına bakın.

## Pluginleri kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Kaldırma işlemi; Plugin'in yapılandırma girdisini, kalıcı Plugin dizin kaydını,
izin/verme listesi girdilerini ve uygun olduğunda bağlantılı
`plugins.load.paths` girdilerini kaldırır. `--keep-files` iletmediğiniz sürece
yönetilen yükleme dizini kaldırılır. Kaldırma işlemi Plugin kaynağını
değiştirdiğinde çalışır durumdaki yönetilen Gateway otomatik olarak yeniden
başlar.

Nix modunda (`OPENCLAW_NIX_MODE=1`) Plugin yükleme, güncelleme, kaldırma,
etkinleştirme ve devre dışı bırakma işlemlerinin tümü devre dışıdır; bu
seçimleri yüklemenin Nix kaynağında yönetin.

## Kaynak seçme

| Kaynak      | Kullanım durumu                                                                    | Örnek                                                          |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw'a özgü keşif, tarama özetleri, sürümler ve ipuçları istediğinizde        | `openclaw plugins install clawhub:<package>`                   |
| git         | Bir depodan dal, etiket veya commit istediğinizde                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| yerel yol   | Aynı makinede bir Plugin geliştirirken veya test ederken                          | `openclaw plugins install --link ./my-plugin`                  |
| pazar yeri  | Claude uyumlu bir pazar yeri Plugin'i yüklerken                                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm paketi  | Yerel bir paket yapısını npm yükleme semantiğiyle doğrularken                     | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Zaten JavaScript paketleri yayımlıyorsanız veya npm dist-tag'lerine/özel kayıt defterine ihtiyacınız varsa | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Yönetilen yerel yol yüklemeleri Plugin dizinleri veya arşivleri olmalıdır.
Bağımsız Plugin dosyalarını `plugins install` ile yüklemek yerine
`plugins.load.paths` içine yerleştirin.

## Pluginleri yayımlama

ClawHub, OpenClaw Pluginleri için birincil herkese açık keşif yüzeyidir.
Kullanıcıların yüklemeden önce Plugin meta verilerini, sürüm geçmişini, kayıt
defteri tarama sonuçlarını ve yükleme ipuçlarını bulmasını istediğinizde orada
yayımlayın.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Yerel npm Pluginleri yayımlanmadan önce bir Plugin manifesti
(`openclaw.plugin.json`) ile `package.json` meta verilerini içermelidir:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Bu sayfayı yayımlama başvurusu olarak kullanmak yerine yayımlama sözleşmesinin
tamamı için şu sayfaları kullanın:

- [ClawHub'da yayımlama](/tr/clawhub/publishing); sahipleri, kapsamları,
  sürümleri, incelemeyi, paket doğrulamayı ve paket aktarımını açıklar.
- [Plugin geliştirme](/tr/plugins/building-plugins), tam Plugin paket yapısını
  (`openclaw.plugin.json` dâhil) ve ilk yayımlama iş akışını gösterir.
- [Plugin manifesti](/tr/plugins/manifest), yerel Plugin manifesti alanlarını
  tanımlar.

Aynı paket hem ClawHub'da hem de npm'de mevcutsa tek bir kaynağı zorunlu kılmak
için açık `clawhub:` veya `npm:` önekini kullanın.

## İlgili

- [Pluginler](/tr/tools/plugin) - yükleme, yapılandırma, yeniden başlatma ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI başvurusu
- [Topluluk Pluginleri](/tr/plugins/community) - herkese açık keşif ve ClawHub'da yayımlama
- [ClawHub](/tr/clawhub/cli) - kayıt defteri CLI işlemleri
- [Plugin geliştirme](/tr/plugins/building-plugins) - bir Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
