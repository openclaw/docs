---
doc-schema-version: 1
read_when:
    - Hızlı Plugin listeleme, yükleme, güncelleme, inceleme veya kaldırma örnekleri istiyorsunuz
    - Bir Plugin kurulum kaynağı seçmek istiyorsunuz
    - Plugin paketlerini yayımlamak için doğru referansı istiyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin'lerini listeleme, yükleme, güncelleme, inceleme ve kaldırma için hızlı örnekler
title: Pluginleri yönet
x-i18n:
    generated_at: "2026-06-28T00:54:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Bu sayfayı yaygın Plugin yönetimi komutları için kullanın. Kapsamlı komut
sözleşmesi, bayraklar, kaynak seçimi kuralları ve uç durumlar için bkz.
[`openclaw plugins`](/tr/cli/plugins).

Çoğu kurulum iş akışı şöyledir:

1. bir paket bulun
2. paketi ClawHub, npm, git veya yerel bir yoldan kurun
3. yönetilen Gateway'in otomatik yeniden başlamasına izin verin ya da yönetilmiyorsa elle yeniden başlatın
4. Plugin'in çalışma zamanı kayıtlarını doğrulayın

## Pluginleri listeleme ve arama

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Betikler için `--json` kullanın:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` soğuk bir envanter denetimidir. OpenClaw'ın yapılandırma,
manifestler ve Plugin kayıt defterinden neleri keşfedebildiğini gösterir;
zaten çalışan bir Gateway'in Plugin çalışma zamanını içe aktardığını kanıtlamaz.
JSON çıktısı, Plugin paketi `dependencies` veya `optionalDependencies` bildirdiğinde
kayıt defteri tanılamalarını ve her Plugin'in statik `dependencyStatus` değerini içerir.

`plugins search`, kurulabilir Plugin paketleri için ClawHub'ı sorgular ve
`openclaw plugins install clawhub:<package>` gibi kurulum ipuçlarını yazdırır.

## Pluginleri kurma

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Çıplak paket belirtimleri, lansman geçişi sırasında npm'den kurulur. Belirleyici
kaynak seçimi gerektiğinde `clawhub:`, `npm:`, `git:` veya `npm-pack:` kullanın.
Çıplak ad resmi bir Plugin kimliğiyle eşleşirse OpenClaw katalog girdisini
doğrudan kurabilir.

`--force` seçeneğini yalnızca mevcut bir kurulum hedefinin üzerine yazmayı
bilinçli olarak istediğinizde kullanın. İzlenen npm, ClawHub veya hook-pack
kurulumlarının rutin yükseltmeleri için `openclaw plugins update` kullanın.

## Yeniden başlatma ve inceleme

Plugin kodunu kurduktan, güncelledikten veya kaldırdıktan sonra, yapılandırma
yeniden yüklemesi etkin olan çalışan yönetilen Gateway otomatik olarak yeniden
başlar. Gateway yönetilmiyorsa veya yeniden yükleme devre dışıysa, canlı çalışma
zamanı yüzeylerini denetlemeden önce kendiniz yeniden başlatın:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Plugin'in araçlar, hook'lar, servisler, Gateway yöntemleri, HTTP rotaları veya
Plugin'e ait CLI komutları gibi çalışma zamanı yüzeylerini kaydettiğine dair
kanıt gerektiğinde `inspect --runtime` kullanın. Düz `inspect` ve `list`,
soğuk manifest, yapılandırma ve kayıt defteri denetimleridir.

## Pluginleri güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Bir Plugin kimliği verdiğinizde OpenClaw izlenen kurulum belirtimini yeniden
kullanır. `@beta` gibi saklanan dist-tag'ler ve tam sabitlenmiş sürümler,
sonraki `update <plugin-id>` çalıştırmalarında kullanılmaya devam eder.

`openclaw plugins update --all` toplu bakım yoludur. Sıradan izlenen kurulum
belirtimlerine yine saygı duyar, ancak güvenilir resmi OpenClaw Plugin kayıtları
eski bir tam resmi pakette kalmak yerine geçerli resmi katalog hedefine
eşitlenebilir. `update.channel` değeri `beta` olarak ayarlanmışsa bu toplu resmi
eşitleme beta kanal bağlamını kullanır. Tam veya etiketli bir resmi belirtimi
bilinçli olarak değiştirmeden tutmak istediğinizde hedefli `update <plugin-id>`
kullanın.

npm kurulumları için izlenen kaydı değiştirmek üzere açık bir paket belirtimi
verebilirsiniz:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, daha önce tam bir sürüme veya etikete sabitlenmiş bir Plugin'i
kayıt defterinin varsayılan yayın hattına geri taşır.

`openclaw update` beta kanalında çalıştığında, Plugin kayıtları eşleşen `@beta`
yayınlarını tercih edebilir. Tam geri dönüş ve sabitleme kuralları için bkz.
[`openclaw plugins`](/tr/cli/plugins#update).

## Pluginleri kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Kaldırma işlemi, Plugin'in yapılandırma girdisini, kalıcı Plugin dizin kaydını,
izin/ret listesi girdilerini ve uygulanabiliyorsa bağlı yükleme yollarını kaldırır.
`--keep-files` vermediğiniz sürece yönetilen kurulum dizinleri kaldırılır.
Kaldırma işlemi Plugin kaynağını değiştirdiğinde çalışan yönetilen Gateway
otomatik olarak yeniden başlar.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin kurma, güncelleme, kaldırma,
etkinleştirme ve devre dışı bırakma komutları devre dışıdır. Bunun yerine bu
seçimleri kurulumun Nix kaynağında yönetin.

## Kaynak seçme

| Kaynak      | Ne zaman kullanılır                                                                    | Örnek                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw'a özgü keşif, tarama özetleri, sürümler ve ipuçları istediğinizde     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Zaten JavaScript paketleri yayımladığınızda veya npm dist-tag'lerine/özel kayıt defterine ihtiyaç duyduğunuzda | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Bir depodan branch, etiket veya commit istediğinizde                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| yerel yol  | Aynı makinede bir Plugin geliştiriyor veya test ediyorsanız                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Yerel bir paket yapıtını npm kurulum semantiği üzerinden kanıtlıyorsanız      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Claude uyumlu bir marketplace Plugin'i kuruyorsanız                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Yönetilen yerel yol kurulumları Plugin dizinleri veya arşivler olmalıdır.
Bağımsız Plugin dosyalarını `plugins install` ile kurmak yerine
`plugins.load.paths` içine koyun.

## Pluginleri yayımlama

ClawHub, OpenClaw Pluginleri için birincil genel keşif yüzeyidir. Kullanıcıların
kurulum yapmadan önce Plugin meta verilerini, sürüm geçmişini, kayıt defteri
tarama sonuçlarını ve kurulum ipuçlarını bulmasını istediğinizde burada yayımlayın.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Yerel npm Pluginleri, yayımlanmadan önce bir Plugin manifesti ve paket meta
verileri içermelidir:

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

Bu sayfayı yayımlama referansı olarak ele almak yerine, tam yayımlama sözleşmesi
için şu sayfaları kullanın:

- [ClawHub yayımlama](/tr/clawhub/publishing), sahipleri, kapsamları, yayınları,
  incelemeyi, paket doğrulamayı ve paket aktarımını açıklar.
- [Plugin oluşturma](/tr/plugins/building-plugins), Plugin paket şeklini ve ilk
  yayımlama iş akışını gösterir.
- [Plugin manifesti](/tr/plugins/manifest), yerel Plugin manifest alanlarını tanımlar.

Aynı paket hem ClawHub hem de npm üzerinde mevcutsa, tek bir kaynağı zorlamak
gerektiğinde açık `clawhub:` veya `npm:` önekini kullanın.

## İlgili

- [Pluginler](/tr/tools/plugin) - kurma, yapılandırma, yeniden başlatma ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI referansı
- [Topluluk Pluginleri](/tr/plugins/community) - genel keşif ve ClawHub yayımlama
- [ClawHub](/tr/clawhub/cli) - kayıt defteri CLI işlemleri
- [Plugin oluşturma](/tr/plugins/building-plugins) - bir Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
