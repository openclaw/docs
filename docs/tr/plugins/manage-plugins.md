---
read_when:
    - Hızlı Plugin yükleme, listeleme, güncelleme veya kaldırma örnekleri istiyorsunuz
    - ClawHub ile npm Plugin dağıtımı arasında seçim yapmak istiyorsunuz
    - Bir Plugin paketi yayımlıyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin’lerini yükleme, listeleme, kaldırma, güncelleme ve yayımlama için hızlı örnekler
title: Pluginleri yönet
x-i18n:
    generated_at: "2026-05-10T19:46:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Çoğu Plugin iş akışı birkaç komuttan oluşur: ara, yükle, Gateway'i yeniden başlat,
doğrula ve Plugin'e artık ihtiyacın kalmadığında kaldır.

## Plugin'leri listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Betikler için `--json` kullanın. Plugin paketi `dependencies` veya
`optionalDependencies` bildirdiğinde kayıt defteri tanılamalarını ve her Plugin'in
statik `dependencyStatus` değerini içerir.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` soğuk bir envanter kontrolüdür. OpenClaw'ın config,
manifestler ve Plugin kayıt defterinden neleri keşfedebildiğini gösterir; halihazırda
çalışan bir Gateway sürecinin Plugin runtime'ını içe aktardığını kanıtlamaz.

## Plugin'leri yükleme

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin kodunu yükledikten sonra kanallarınıza hizmet veren Gateway'i yeniden başlatın:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Plugin'in araçlar, hook'lar, servisler, Gateway yöntemleri veya Plugin'e ait CLI
komutları gibi runtime yüzeylerini kaydettiğine dair kanıt gerektiğinde
`inspect --runtime` kullanın.

## Plugin'leri güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Bir Plugin `@beta` gibi bir npm dist-tag'den yüklendiyse sonraki
`update <plugin-id>` çağrıları kaydedilmiş bu etiketi yeniden kullanır. Açık bir npm spec
geçmek, izlenen yüklemeyi gelecekteki güncellemeler için bu spec'e geçirir.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, daha önce kesin bir sürüme veya etikete sabitlenmiş bir Plugin'i
kayıt defterinin varsayılan sürüm hattına geri taşır.

`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub
Plugin kayıtları önce eşleşen Plugin `@beta` sürümünü dener. Bu beta sürümü
yoksa OpenClaw kaydedilmiş varsayılan/latest spec'e geri döner.
npm Plugin'leri için, beta paketi mevcut olsa ancak yükleme doğrulaması başarısız
olsa da OpenClaw geri döner. Kesin sürümler ve `@rc` veya `@beta` gibi açık
etiketler korunur.

## Plugin'leri kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Kaldırma işlemi, Plugin'in config girişini, Plugin dizin kaydını, izin/ret listesi
girişlerini ve geçerliyse bağlı yükleme yollarını kaldırır. Yönetilen yükleme
dizinleri, `--keep-files` geçmediğiniz sürece kaldırılır.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yükleme, güncelleme, kaldırma, etkinleştirme
ve devre dışı bırakma komutları devre dışıdır. Bunun yerine bu seçimleri yükleme için
Nix kaynağında yönetin; nix-openclaw için ajan öncelikli
[Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.

## Plugin'leri yayımlama

Harici Plugin'leri [ClawHub](https://clawhub.ai), npmjs.com veya her ikisine
yayımlayabilirsiniz.

### ClawHub'a yayımlama

ClawHub, OpenClaw Plugin'leri için birincil herkese açık keşif yüzeyidir. Kullanıcılara
yüklemeden önce aranabilir meta veriler, sürüm geçmişi ve kayıt defteri tarama sonuçları
sağlar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Kullanıcılar ClawHub'dan şu komutla yükler:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Yalın biçim hâlâ önce ClawHub'ı kontrol eder.

### npmjs.com'a yayımlama

Yerel npm Plugin'leri bir Plugin manifesti ve `package.json` OpenClaw giriş noktası
meta verilerini içermelidir.

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
```

Kullanıcılar yalnızca npm'den şu komutlarla yükler:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Aynı paket ClawHub'da da mevcutsa `npm:` ClawHub aramasını atlar ve
npm çözümlemesini zorlar.

## Kaynak seçimi

- **ClawHub**: OpenClaw'a özgü keşif, tarama özetleri,
  sürümler ve yükleme ipuçları istediğinizde kullanın.
- **npmjs.com**: Zaten JavaScript paketleri yayımlıyorsanız veya npm
  dist-tag/private kayıt defteri iş akışlarına ihtiyacınız varsa kullanın.
- **Git**: Doğrudan bir branch, tag veya commit'ten yüklemek istediğinizde kullanın.
- **Yerel yol**: Aynı makinede bir Plugin geliştirirken veya test ederken kullanın.

## İlgili

- [Plugin'ler](/tr/tools/plugin) - genel bakış ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI referansı
- [ClawHub](/tr/clawhub/cli) - yayımlama ve kayıt defteri işlemleri
- [Plugin oluşturma](/tr/plugins/building-plugins) - Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
