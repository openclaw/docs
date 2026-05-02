---
read_when:
    - Hızlı Plugin yükleme, listeleme, güncelleme veya kaldırma örnekleri istiyorsunuz
    - ClawHub ile npm Plugin dağıtımı arasında seçim yapmak istiyorsunuz
    - Bir Plugin paketi yayımlıyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin'lerini yükleme, listeleme, kaldırma, güncelleme ve yayımlama için hızlı örnekler
title: Plugin'leri yönetin
x-i18n:
    generated_at: "2026-05-02T22:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Çoğu Plugin iş akışı birkaç komuttan oluşur: arama, yükleme, Gateway’i yeniden başlatma,
doğrulama ve Plugin’e artık ihtiyacınız kalmadığında kaldırma.

## Plugin’leri Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Betikler için `--json` kullanın. Plugin paketi `dependencies` veya
`optionalDependencies` bildirdiğinde kayıt tanılarını ve her Plugin’in statik
`dependencyStatus` değerini içerir.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`, soğuk bir envanter denetimidir. OpenClaw’ın yapılandırmadan,
manifestlerden ve Plugin kayıt defterinden neleri keşfedebileceğini gösterir;
halihazırda çalışan bir Gateway sürecinin Plugin çalışma zamanını içe aktardığını
kanıtlamaz.

## Plugin’leri Yükleme

```bash
# Plugin paketleri için ClawHub’da arama yapın.
openclaw plugins search "calendar"

# Yalın paket belirtimleri önce ClawHub’ı, sonra npm yedeğini dener.
openclaw plugins install <package>

# Tek bir kaynağı zorunlu kılın.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Belirli bir sürüm veya dist-tag yükleyin.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Git’ten veya yerel bir geliştirme çalışma kopyasından yükleyin.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin kodunu yükledikten sonra kanallarınıza hizmet veren Gateway’i yeniden başlatın:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Plugin’in araçlar, kancalar, hizmetler, Gateway yöntemleri veya Plugin’e ait CLI
komutları gibi çalışma zamanı yüzeylerini kaydettiğine dair kanıta ihtiyaç
duyduğunuzda `inspect --runtime` kullanın.

## Plugin’leri Güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Bir Plugin `@beta` gibi bir npm dist-tag üzerinden yüklendiyse sonraki
`update <plugin-id>` çağrıları kaydedilmiş bu etiketi yeniden kullanır. Açık bir
npm belirtimi geçirmek, izlenen kurulumu gelecekteki güncellemeler için bu
belirtime geçirir.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, daha önce kesin bir sürüme veya etikete sabitlenmiş bir Plugin’i
kayıt defterinin varsayılan yayın hattına geri taşır.

`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub
Plugin kayıtları önce eşleşen Plugin `@beta` sürümünü dener. Bu beta sürüm yoksa
OpenClaw kaydedilmiş varsayılan/latest belirtimine geri döner. Kesin sürümler ve
`@rc` veya `@beta` gibi açık etiketler korunur.

## Plugin’leri Kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Kaldırma işlemi, uygulanabilir olduğunda Plugin’in yapılandırma girdisini, Plugin
dizin kaydını, izin/red listesi girdilerini ve bağlı yükleme yollarını kaldırır.
Yönetilen yükleme dizinleri, `--keep-files` geçmediğiniz sürece kaldırılır.

## Plugin’leri Yayımlama

Harici Plugin’leri [ClawHub](https://clawhub.ai), npmjs.com veya her ikisinde
yayımlayabilirsiniz.

### ClawHub’da Yayımlama

ClawHub, OpenClaw Plugin’leri için birincil herkese açık keşif yüzeyidir.
Kullanıcılara yüklemeden önce aranabilir metadata, sürüm geçmişi ve kayıt defteri
tarama sonuçları sunar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Kullanıcılar ClawHub’dan şu şekilde yükler:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Yalın biçim yine de önce ClawHub’ı denetler.

### npmjs.com’da Yayımlama

Yerel npm Plugin’leri bir Plugin manifesti ve `package.json` OpenClaw giriş
noktası metadata’sı içermelidir.

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

Kullanıcılar yalnızca npm’den şu şekilde yükler:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Aynı paket ClawHub’da da mevcutsa `npm:`, ClawHub aramasını atlar ve npm
çözümlemesini zorunlu kılar.

## Kaynak Seçimi

- **ClawHub**: OpenClaw’a özgü keşif, tarama özetleri, sürümler ve yükleme
  ipuçları istediğinizde kullanın.
- **npmjs.com**: Halihazırda JavaScript paketleri yayımlıyorsanız veya npm
  dist-tag/özel kayıt defteri iş akışlarına ihtiyacınız varsa kullanın.
- **Git**: Doğrudan bir daldan, etiketten veya commit’ten yüklemek istediğinizde kullanın.
- **Yerel yol**: Aynı makinede bir Plugin geliştirirken veya test ederken kullanın.

## İlgili

- [Plugin’ler](/tr/tools/plugin) - genel bakış ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI başvurusu
- [ClawHub](/tr/tools/clawhub) - yayımlama ve kayıt defteri işlemleri
- [Plugin geliştirme](/tr/plugins/building-plugins) - bir Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket metadata’sı
