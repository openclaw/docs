---
read_when:
    - Hızlı Plugin yükleme, listeleme, güncelleme veya kaldırma örnekleri istiyorsunuz
    - ClawHub ile npm Plugin dağıtımı arasında seçim yapmak istiyorsunuz
    - Bir Plugin paketi yayımlıyorsunuz
sidebarTitle: Manage plugins
summary: OpenClaw Plugin'lerini yükleme, listeleme, kaldırma, güncelleme ve yayımlama için hızlı örnekler
title: Pluginleri yönet
x-i18n:
    generated_at: "2026-05-06T17:59:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Çoğu Plugin iş akışı birkaç komuttan oluşur: arama, yükleme, Gateway'i yeniden başlatma, doğrulama ve Plugin'e artık ihtiyacınız kalmadığında kaldırma.

## Plugin'leri listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Betikler için `--json` kullanın. Plugin paketi `dependencies` veya `optionalDependencies` bildirdiğinde kayıt defteri tanılamalarını ve her Plugin'in statik `dependencyStatus` bilgisini içerir.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` soğuk bir envanter kontrolüdür. OpenClaw'ın yapılandırmadan, manifestlerden ve Plugin kayıt defterinden ne keşfedebildiğini gösterir; halihazırda çalışan bir Gateway sürecinin Plugin çalışma zamanını içe aktardığını kanıtlamaz.

## Plugin'leri yükleme

```bash
# Plugin paketleri için ClawHub'da arama yapın.
openclaw plugins search "calendar"

# Yalın paket belirtimleri önce ClawHub'ı, sonra npm yedeğini dener.
openclaw plugins install <package>

# Tek bir kaynağı zorunlu kılın.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Belirli bir sürümü veya dist-tag'i yükleyin.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Git'ten veya yerel bir geliştirme çalışma kopyasından yükleyin.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin kodunu yükledikten sonra kanallarınızı sunan Gateway'i yeniden başlatın:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Plugin'in araçlar, kancalar, hizmetler, Gateway yöntemleri veya Plugin'e ait CLI komutları gibi çalışma zamanı yüzeylerini kaydettiğine dair kanıta ihtiyacınız olduğunda `inspect --runtime` kullanın.

## Plugin'leri güncelleme

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Bir Plugin `@beta` gibi bir npm dist-tag'inden yüklendiyse, sonraki `update <plugin-id>` çağrıları kaydedilen bu etiketi yeniden kullanır. Açık bir npm belirtimi geçirmek, izlenen yüklemeyi gelecekteki güncellemeler için bu belirtime geçirir.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

İkinci komut, daha önce kesin bir sürüme veya etikete sabitlenmiş bir Plugin'i kayıt defterinin varsayılan yayın hattına geri taşır.

`openclaw update` beta kanalında çalıştığında, varsayılan hat npm ve ClawHub Plugin kayıtları önce eşleşen Plugin `@beta` yayınını dener. Bu beta yayını yoksa OpenClaw kaydedilmiş varsayılan/en son belirtime geri döner. npm Plugin'leri için OpenClaw, beta paketi mevcut olsa ancak yükleme doğrulamasında başarısız olsa da geri döner. Kesin sürümler ve `@rc` veya `@beta` gibi açık etiketler korunur.

## Plugin'leri kaldırma

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Kaldırma işlemi, geçerli olduğunda Plugin'in yapılandırma girdisini, Plugin dizin kaydını, izin/verme listesi girdilerini ve bağlı yükleme yollarını kaldırır. Yönetilen yükleme dizinleri, `--keep-files` geçmediğiniz sürece kaldırılır.

Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yükleme, güncelleme, kaldırma, etkinleştirme ve devre dışı bırakma komutları devre dışıdır. Bunun yerine bu seçimleri yüklemenin Nix kaynağında yönetin; nix-openclaw için ajan öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.

## Plugin'leri yayımlama

Harici Plugin'leri [ClawHub](https://clawhub.ai), npmjs.com veya her ikisine yayımlayabilirsiniz.

### ClawHub'a yayımlama

ClawHub, OpenClaw Plugin'leri için birincil herkese açık keşif yüzeyidir. Kullanıcılara yüklemeden önce aranabilir meta veriler, sürüm geçmişi ve kayıt defteri tarama sonuçları sağlar.

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

Yalın biçim yine de önce ClawHub'ı kontrol eder.

### npmjs.com'a yayımlama

Yerel npm Plugin'leri bir Plugin manifesti ve `package.json` OpenClaw giriş noktası meta verileri içermelidir.

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

Aynı paket ClawHub'da da mevcutsa, `npm:` ClawHub aramasını atlar ve npm çözümlemesini zorunlu kılar.

## Kaynak seçimi

- **ClawHub**: OpenClaw'a özgü keşif, tarama özetleri, sürümler ve yükleme ipuçları istediğinizde kullanın.
- **npmjs.com**: Zaten JavaScript paketleri yayımlıyorsanız veya npm dist-tag/özel kayıt defteri iş akışlarına ihtiyacınız varsa kullanın.
- **Git**: Doğrudan bir branch, etiket veya commit'ten yüklemek istediğinizde kullanın.
- **Yerel yol**: Aynı makinede bir Plugin geliştirirken veya test ederken kullanın.

## İlgili

- [Plugin'ler](/tr/tools/plugin) - genel bakış ve sorun giderme
- [`openclaw plugins`](/tr/cli/plugins) - tam CLI başvurusu
- [ClawHub](/tr/tools/clawhub) - yayımlama ve kayıt defteri işlemleri
- [Plugin oluşturma](/tr/plugins/building-plugins) - bir Plugin paketi oluşturma
- [Plugin manifesti](/tr/plugins/manifest) - manifest ve paket meta verileri
