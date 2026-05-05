---
read_when:
    - Hızlı Plugin yükleme, listeleme, güncelleme veya kaldırma örnekleri istiyorsunuz
    - ClawHub ile npm Plugin dağıtımı arasında seçim yapmak istiyorsunuz
    - Bir Plugin paketi yayımlıyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin'lerini yükleme, listeleme, kaldırma, güncelleme ve yayımlama için hızlı örnekler
title: Plugin'leri yönetin
x-i18n:
    generated_at: "2026-05-05T01:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Çoğu Plugin iş akışı birkaç komuttan oluşur: arama, yükleme, Gateway'i yeniden başlatma,
doğrulama ve Plugin'e artık ihtiyacınız kalmadığında kaldırma.

## Plugin'leri listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Betikler için `--json` kullanın. Plugin paketi `dependencies` veya
`optionalDependencies` bildirdiğinde kayıt tanılamalarını ve her Plugin'in statik
`dependencyStatus` değerini içerir.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` soğuk bir envanter denetimidir. OpenClaw'ın yapılandırmadan,
manifestlerden ve Plugin kayıt defterinden neleri keşfedebileceğini gösterir;
halihazırda çalışan bir Gateway sürecinin Plugin çalışma zamanını içe aktardığını
kanıtlamaz.

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

Plugin'in araçlar, kancalar, hizmetler, Gateway yöntemleri veya Plugin'e ait CLI
komutları gibi çalışma zamanı yüzeylerini kaydettiğine dair kanıt gerektiğinde
`inspect --runtime` kullanın.

## Plugin'leri güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Bir Plugin, `@beta` gibi bir npm dist-tag üzerinden yüklendiyse sonraki
`update <plugin-id>` çağrıları kaydedilen bu etiketi yeniden kullanır. Açık bir npm
özelliği geçirmek, izlenen yüklemeyi gelecekteki güncellemeler için bu özelliğe
geçirir.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, bir Plugin daha önce tam bir sürüme veya etikete sabitlenmişse onu
kayıt defterinin varsayılan yayın hattına geri taşır.

`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub
Plugin kayıtları önce eşleşen Plugin `@beta` yayınını dener. Bu beta yayını yoksa
OpenClaw kaydedilen varsayılan/en son özelliğe geri döner. npm Plugin'leri için
OpenClaw, beta paketi mevcut olup yükleme doğrulamasından geçemediğinde de geri
döner. Tam sürümler ve `@rc` veya `@beta` gibi açık etiketler korunur.

## Plugin'leri kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Kaldırma işlemi, varsa Plugin'in yapılandırma girdisini, Plugin dizin kaydını,
izin/verme listesi girdilerini ve bağlı yükleme yollarını kaldırır. Yönetilen
yükleme dizinleri, `--keep-files` geçmediğiniz sürece kaldırılır.

## Plugin'leri yayımlama

Harici Plugin'leri [ClawHub](https://clawhub.ai), npmjs.com veya her ikisinde
yayımlayabilirsiniz.

### ClawHub'da yayımlama

ClawHub, OpenClaw Plugin'leri için birincil herkese açık keşif yüzeyidir.
Kullanıcılara yüklemeden önce aranabilir meta veriler, sürüm geçmişi ve kayıt
defteri tarama sonuçları sağlar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Kullanıcılar ClawHub'dan şu şekilde yükler:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Çıplak biçim yine önce ClawHub'ı denetler.

### npmjs.com'da yayımlama

Yerel npm Plugin'leri bir Plugin manifesti ve `package.json` OpenClaw giriş noktası
meta verileri içermelidir.

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

Kullanıcılar yalnızca npm'den şu şekilde yükler:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Aynı paket ClawHub'da da mevcutsa `npm:`, ClawHub aramasını atlar ve npm
çözümlemesini zorunlu kılar.

## Kaynak seçimi

- **ClawHub**: OpenClaw'a özgü keşif, tarama özetleri, sürümler ve yükleme ipuçları istediğinizde kullanın.
- **npmjs.com**: Halihazırda JavaScript paketleri yayımlıyorsanız veya npm dist-tag/özel kayıt defteri iş akışlarına ihtiyacınız varsa kullanın.
- **Git**: Doğrudan bir dal, etiket veya commit üzerinden yüklemek istediğinizde kullanın.
- **Yerel yol**: Aynı makinede bir Plugin geliştirirken veya test ederken kullanın.

## İlgili

- [Plugins](/tr/tools/plugin) - genel bakış ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI başvurusu
- [ClawHub](/tr/tools/clawhub) - yayımlama ve kayıt defteri işlemleri
- [Plugin oluşturma](/tr/plugins/building-plugins) - bir Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
