---
read_when:
    - '`clawhub package validate` komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor'
    - ClawHub, bir Plugin paketi yayımlamasını reddetti veya yayımlama sırasında uyarı verdi
    - Yayın öncesinde Plugin paket meta verilerini güncelliyorsunuz
summary: Yayımlamadan önce ClawHub Plugin paket doğrulama bulgularını düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-06-28T05:07:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, yayımlamadan önce Plugin paketlerini doğrular ve otomatik paket taramalarından gelen bulguları da gösterebilir. Bu sayfa, yazar odaklı bulguları kapsar; yani Plugin yazarının paket meta verilerinde, manifestinde, SDK içe aktarmalarında veya yayımlanan artefaktında düzeltebileceği bulguları.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam bir raporda yazar için düzeltme rehberi olmayan tarayıcı bakım kodları varsa, bunlar Plugin yazarları yerine OpenClaw bakımcıları içindir.

Herhangi bir düzeltmeyi uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazar odaklı bulgular

| Kod                                     | Buradan başlayın                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket meta verisi ekleyin](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                          |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekleyin](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                        |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildirin](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayımlayın](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Kurulum meta verisini tamamlayın](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                    |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildirin](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                      |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü hizalayın](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                    |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini hizalayın](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                  |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verisini kaldırın](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [npm artefaktını paketlenebilir hale getirin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)      |
| `package-npm-pack-metadata-missing`     | [Meta veriyi npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)             |
| `manifest-name-missing`                 | [Manifest görünen adı ekleyin](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                      |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                     |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)               |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                             |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarmalarını kaldırın](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                             |
| `sdk-load-session-store`                | [Tüm oturum deposu erişimini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `legacy-before-agent-start`             | [before_agent_start öğesini değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                         |
| `provider-auth-env-vars`                | [Sağlayıcı env değişkenlerini kurulum meta verisine taşıyın](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)        |
| `channel-env-vars`                      | [Kanal env değişkenlerini geçerli meta veride yansıtın](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                  |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifest şeması başvurularını kaldırın](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifest dosyalarını kaldırın](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)     |

## Paket meta verisi

### package-json-missing

Paket kökü `package.json` içermez, bu nedenle ClawHub npm paketini, sürümünü, giriş noktalarını veya OpenClaw meta verisini tanımlayamaz.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin gönderiyorsa bir `openclaw` bloğu ekleyin.
- Minimal paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins) ve paket ile manifest ayrımı için [Plugin manifesti](/tr/plugins/manifest#manifest-versus-packagejson) sayfasını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Pakette `package.json` var, ancak OpenClaw paket meta verisini bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası meta verilerini dahil edin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum meta verisi ekleyin.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verisi var, ancak bir OpenClaw çalışma zamanı giriş noktası bildirmiyor.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayımlanan paket derlenmiş JavaScript yüklemeliyse `openclaw.runtimeExtensions` ekleyin.
- Tüm giriş noktası yollarını paket dizininin içinde tutun.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildiriyor, ancak başvurulan dosya doğrulanan pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve `openclaw.runtimeSetupEntry` içindeki her yolu kontrol edin.
- Giriş noktası `dist` içine üretiliyorsa paketi derleyin.
- Giriş noktası taşındıysa meta veriyi güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulması veya güncellenmesi gerektiğini belirleyemiyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı kullanılabiliyorsa `openclaw.install.defaultChoice` değerini ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion` kullanın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket, desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` içine `openclaw.compat.pluginApi` ekleyin.
- Üzerine geliştirme yaptığınız ve test ettiğiniz OpenClaw Plugin API sürümünü veya semver tabanını kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin yayınını açıklar; `openclaw.compat.pluginApi` ana makine API sözleşmesini açıklar.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paket minimum ana makine sürümü, paketin temel aldığı OpenClaw sürüm meta verisiyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Yayın sırasında kullanılan OpenClaw sürümü gibi paketteki tüm OpenClaw derleme meta verilerini kontrol edin.
- Minimum ana makine sürümünü paketin gerçekte desteklediği ana makine sürüm aralığıyla hizalayın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifest sürümü uyuşmuyor.

- Paket yayın sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` içinde de `version` varsa, eşleşecek şekilde güncelleyin veya paket meta verisi yetkiliyse eski manifest sürüm meta verisini kaldırın.
- Yayımlanmış meta veriyi değiştirdikten sonra yeni bir paket sürümü yayımlayın.
- [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verisi olmayan alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verisini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluğu, kurulumu, kurulumu ve katalog meta verisini desteklenen `package.json#openclaw` alanlarında tutun.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanan artefakt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı artefakta paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemeyi başarısız kılan geçersiz paket meta verisini, bozuk yaşam döngüsü betiklerini veya files girdilerini düzeltin.
- Bu paket herkese açık yayımlama için tasarlandıysa `private: true` değerini kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş artefakt `package.json#openclaw` içinde bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Paketlemeden önce üretilen giriş noktalarını derleyin.
- Bildirilen giriş noktalarının dahil edilmesi için `files`, `.npmignore` veya derleme çıktısını güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş artefakta, kaynak paketinizde bulunan OpenClaw meta verisi eksik.

- `npm pack --dry-run` çalıştırın ve dahil edilen meta veri dosyalarını inceleyin.
- Paketlenmiş artefakta `package.json` dosyasının `openclaw` bloğunu içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin ise `openclaw.plugin.json` dosyasının dahil edildiğinden emin olun.
- Paket meta verisinin dışlanmaması için `files` veya `.npmignore` değerini güncelleyin.
- [Plugin oluşturma](/tr/plugins/building-plugins) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest meta verisi

### manifest-name-missing

Yerel Plugin manifesti bir görünen ad içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` alanını insan tarafından okunabilir tutun ve `id` alanını kararlı makine kimliği olarak tutun.
- [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifestinde OpenClaw'ın desteklemediği üst düzey alanlar var.

- Her üst düzey alanı
  [manifest alanı başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum metadata bilgilerini manifest yerine desteklenen
  `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifest, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [contracts başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts`
  alanını statik yetenek sahipliği metadata bilgileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk migrasyonu

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel'ından import ediyor:
`openclaw/plugin-sdk`.

- Kök barrel import'larını odaklanmış genel alt yol import'larıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar import'u bulmak için [Import kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) belgelerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş Plugin'ler veya dahili uyumluluk için ayrılmış bir SDK yolunu
import ediyor.

- Ayrılmış OpenClaw dahili SDK import'larını belgelenmiş genel
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın genel bir SDK'sı yoksa yardımcıyı paketinizin içinde tutun veya
  genel bir OpenClaw API isteyin.
- Desteklenen bir import seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK migrasyonu](/tr/plugins/sdk-migration) belgelerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` öğesini kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)`
  kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)`
  kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` öğesini yalnızca bildirdiğiniz uyumluluk aralığı
  bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` hook'unu kullanıyor.

- Model veya sağlayıcı geçersiz kılma işlerini `before_model_resolve` öğesine taşıyın.
- Prompt veya context değiştirme işlerini `before_prompt_build` öğesine taşıyın.
- `before_agent_start` öğesini yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- [Hook'lar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifest hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama metadata bilgilerini kullanıyor.

- Sağlayıcı env-var metadata bilgilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` öğesini yalnızca desteklediğiniz OpenClaw aralığı
  hâlâ buna ihtiyaç duyarken uyumluluk metadata bilgisi olarak tutun.
- [setup başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK migrasyonu](/tr/plugins/sdk-migration) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifest, ClawHub'ın beklediği güncel setup veya yapılandırma metadata bilgileri olmadan
eski ya da daha eski kanal env-var metadata bilgilerini kullanıyor.

- OpenClaw'ın kanal çalışma zamanını yüklemeden setup durumunu inceleyebilmesi için
  kanal env-var metadata bilgilerini bildirimsel tutun.
- Env odaklı kanal setup'ını Plugin şeklinizin kullandığı güncel setup, kanal yapılandırması veya
  paket kanal metadata bilgilerine yansıtın.
- `channelEnvVars` öğesini yalnızca desteklenen eski OpenClaw sürümleri
  hâlâ gerektirirken uyumluluk metadata bilgisi olarak tutun.
- [Plugin manifest](/tr/plugins/manifest) ve
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifesti

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir schema referansıyla
`openclaw.security.json` gönderiyor.

- Yalnızca tavsiye amaçlıysa schema URL'sini kaldırın.
- Belgelenmiş sürümlü bir schema'yı yalnızca OpenClaw bir tane yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket, desteklenmeyen bir güvenlik manifesti dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik manifesti schema'sını ve ClawHub davranışını belgeleyene kadar
  `openclaw.security.json` dosyasını kaldırın.
- Manifest sözleşmesi mevcut olana kadar güvenlik açısından hassas davranışı herkese açık paket belgelerinizde veya
  README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifest](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
