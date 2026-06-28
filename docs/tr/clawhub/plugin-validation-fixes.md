---
read_when:
    - clawhub package validate çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor
    - ClawHub bir Plugin paketi yayımlama işlemini reddetti veya uyarı verdi
    - Yayın öncesinde Plugin paket meta verilerini güncelliyorsunuz
summary: ClawHub Plugin paketi doğrulama bulgularını yayımlamadan önce düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-06-28T00:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, yayımlamadan önce Plugin paketlerini doğrular ve otomatik paket taramalarından
gelen bulguları da gösterebilir. Bu sayfa yazara yönelik bulguları kapsar; yani
Plugin yazarının kendi paket meta verilerinde, manifestosunda, SDK içe
aktarımlarında veya yayımlanmış yapıtında düzeltebileceği bulguları.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam bir rapor, yazar için
düzeltme rehberi olmadan tarayıcı bakım kodları içeriyorsa bunlar Plugin yazarları
yerine OpenClaw bakımcıları içindir.

Herhangi bir düzeltme uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazara yönelik bulgular

| Kod                                     | Buradan başlayın                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket meta verisi ekle](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                           |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekle](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                         |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildir](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayımla](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                         |
| `package-install-metadata-incomplete`   | [Kurulum meta verilerini tamamla](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                   |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildir](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                      |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü hizala](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                     |
| `package-manifest-version-drift`        | [Paket ve manifesto sürümlerini hizala](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                  |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verilerini kaldır](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [npm yapıtını paketlenebilir hale getir](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                   |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm pack çıktısına dahil et](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)     |
| `package-npm-pack-metadata-missing`     | [Meta verileri npm pack çıktısına dahil et](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)           |
| `manifest-name-missing`                 | [Manifestoya görünen ad ekle](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                     |
| `manifest-unknown-fields`               | [Desteklenmeyen manifesto alanlarını kaldır](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                    |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldır](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)               |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarımlarını değiştir](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                             |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarımlarını kaldır](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                             |
| `sdk-load-session-store`                | [Tüm oturum deposu erişimini değiştir](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `legacy-before-agent-start`             | [before_agent_start öğesini değiştir](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                         |
| `provider-auth-env-vars`                | [Sağlayıcı env değişkenlerini kurulum meta verilerine taşı](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)      |
| `channel-env-vars`                      | [Kanal env değişkenlerini güncel meta verilerde yansıt](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifestosu şema referanslarını kaldır](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifestosu dosyalarını kaldır](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Paket meta verileri

### package-json-missing

Paket kökü `package.json` içermiyor; bu nedenle ClawHub npm paketini, sürümü,
giriş noktalarını veya OpenClaw meta verilerini tanımlayamaz.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin'i gönderiyorsa bir `openclaw` bloğu ekleyin.
- Minimal paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins) ve
  paket ile manifesto ayrımı için [Plugin manifestosu](/tr/plugins/manifest#manifest-versus-packagejson)
  sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Pakette `package.json` var, ancak OpenClaw paket meta verilerini bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası
  meta verilerini dahil edin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum
  meta verilerini ekleyin.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verileri mevcut, ancak bir OpenClaw çalışma zamanı giriş noktası
bildirmiyor.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayımlanan paketin derlenmiş JavaScript yüklemesi gerekiyorsa
  `openclaw.runtimeExtensions` ekleyin.
- Tüm giriş noktası yollarını paket dizininin içinde tutun.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve
  [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery)
  bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildiriyor, ancak başvurulan dosya doğrulanan
pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` ve `openclaw.runtimeSetupEntry` içindeki her yolu
  kontrol edin.
- Giriş noktası `dist` içine üretiliyorsa paketi derleyin.
- Giriş noktası taşındıysa meta verileri güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulması veya güncellenmesi gerektiğini belirleyemiyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi
  desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı mevcutsa `openclaw.install.defaultChoice`
  değerini ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion`
  kullanın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket, desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` dosyasına `openclaw.compat.pluginApi` ekleyin.
- Derleyip test ettiğiniz OpenClaw Plugin API sürümünü veya semver tabanını
  kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin sürümünü açıklar;
  `openclaw.compat.pluginApi` ise ana makine API sözleşmesini açıklar.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paket minimum ana makine sürümü, paketin temel aldığı OpenClaw sürüm meta
verileriyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Paketteki, sürüm sırasında kullanılan OpenClaw sürümü gibi OpenClaw derleme
  meta verilerini kontrol edin.
- Minimum ana makine sürümünü paketin gerçekten desteklediği ana makine sürüm
  aralığıyla hizalayın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifestosu sürümü uyuşmuyor.

- Paket yayımlama sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` içinde de `version` varsa, paket meta verileri
  yetkili kaynak olduğunda bunu eşleşecek şekilde güncelleyin veya eski
  manifesto sürüm meta verilerini kaldırın.
- Yayımlanmış meta verileri değiştirdikten sonra yeni bir paket sürümü
  yayımlayın.
- [Plugin manifestosu](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verisi olmayan
alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verilerini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluğu, kurulumu, kurulumu başlatma işlemini ve
  katalog meta verilerini desteklenen `package.json#openclaw` alanlarında tutun.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanmış yapıt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı yapıt haline paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemeyi başarısız kılan geçersiz paket meta verilerini, bozuk yaşam
  döngüsü betiklerini veya files girdilerini düzeltin.
- Bu paket herkese açık yayımlanmak üzere tasarlandıysa `private: true`
  öğesini kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş yapıt `package.json#openclaw` içinde
bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Paketlemeden önce üretilen giriş noktalarını derleyin.
- Bildirilen giriş noktalarının dahil edilmesi için `files`, `.npmignore` veya
  derleme çıktısını güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş yapıt, kaynak paketinizde bulunan OpenClaw meta verilerini eksik
içeriyor.

- `npm pack --dry-run` çalıştırın ve dahil edilen meta veri dosyalarını
  inceleyin.
- Paketlenmiş yapıtta `package.json` dosyasının `openclaw` bloğunu içerdiğinden
  emin olun.
- Paket yerel bir OpenClaw Plugin'i olduğunda `openclaw.plugin.json` dosyasının
  dahil edildiğinden emin olun.
- Paket meta verilerinin dışlanmaması için `files` veya `.npmignore` öğesini
  güncelleyin.
- [Plugin oluşturma](/tr/plugins/building-plugins) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifesto meta verileri

### manifest-name-missing

Yerel Plugin manifestosu bir görünen ad içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` değerini insan tarafından okunabilir tutun ve `id` değerini kararlı
  makine kimliği olarak tutun.
- [Plugin manifestosu](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifestosu, OpenClaw'ın desteklemediği üst düzey alanlara sahip.

- Her üst düzey alanı
  [manifest alan başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- `openclaw.plugin.json` içinden özel alanları kaldırın.
- Paket veya kurulum meta verilerini manifest yerine desteklenen
  `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifest, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [`contracts` başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts`
  içeriğini statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel'ından içe aktarma yapıyor:
`openclaw/plugin-sdk`.

- Kök barrel içe aktarmalarını odaklanmış herkese açık alt yol içe aktarmalarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar içe aktarmayı bulmak için [İçe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş Plugin'ler veya dahili uyumluluk için ayrılmış bir SDK yolunu
içe aktarıyor.

- Ayrılmış OpenClaw dahili SDK içe aktarmalarını belgelenmiş herkese açık
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın herkese açık bir SDK karşılığı yoksa yardımcıyı kendi paketinizde
  tutun veya herkese açık bir OpenClaw API isteyin.
- Desteklenen bir içe aktarma seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)`
  kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)`
  kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` kullanımını yalnızca bildirdiğiniz uyumluluk aralığı
  bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfalarına bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` hook'unu kullanıyor.

- Model veya sağlayıcı geçersiz kılma işini `before_model_resolve` içine taşıyın.
- Prompt veya bağlam değiştirme işini `before_prompt_build` içine taşıyın.
- `before_agent_start` kullanımını yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunu gerektiren eski OpenClaw sürümlerini desteklerken koruyun.
- [Hook'lar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility) sayfalarına bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifest hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini kullanıyor.

- Sağlayıcı ortam değişkeni meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` değerini yalnızca desteklediğiniz OpenClaw aralığı hâlâ
  buna ihtiyaç duyarken uyumluluk meta verisi olarak koruyun.
- [Kurulum başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration) sayfalarına bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifest, ClawHub'ın beklediği güncel kurulum veya yapılandırma meta verileri
olmadan eski ya da daha eski kanal ortam değişkeni meta verilerini kullanıyor.

- Kanal ortam değişkeni meta verilerini bildirimsel tutun; böylece OpenClaw kanal çalışma zamanını
  yüklemeden kurulum durumunu inceleyebilir.
- Ortam değişkeni odaklı kanal kurulumunu, Plugin biçiminizin kullandığı güncel kurulum,
  kanal yapılandırması veya paket kanal meta verilerine yansıtın.
- `channelEnvVars` değerini yalnızca desteklenen eski OpenClaw sürümleri hâlâ
  bunu gerektirirken uyumluluk meta verisi olarak koruyun.
- [Plugin manifesti](/tr/plugins/manifest) ve
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) sayfalarına bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifesti

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir şema başvurusuyla
`openclaw.security.json` gönderiyor.

- Yalnızca öneri amaçlıysa şema URL'sini kaldırın.
- Belgelenmiş sürümlü bir şemayı yalnızca OpenClaw yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket, desteklenmeyen bir güvenlik manifesti dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik manifesti şemasını ve ClawHub davranışını belgeleyene kadar
  `openclaw.security.json` dosyasını kaldırın.
- Manifest sözleşmesi oluşana kadar güvenlik açısından hassas davranışı herkese açık paket
  belgelerinizde veya README dosyanızda belgelenmiş tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
