---
read_when:
    - '`clawhub package validate` komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor'
    - ClawHub, bir Plugin paketi yayımlama işlemini reddetti veya bu işlem için uyarı verdi
    - Yayın öncesinde Plugin paket meta verilerini güncelliyorsunuz
summary: Yayımlamadan önce ClawHub Plugin paketi doğrulama bulgularını düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-07-04T10:57:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, Plugin paketlerini yayımlamadan önce doğrular ve otomatik paket taramalarından gelen bulguları da gösterebilir. Bu sayfa, yazarın kendi paket meta verilerinde, manifestinde, SDK içe aktarmalarında veya yayımlanan yapıtında düzeltebileceği bulgular anlamına gelen yazar odaklı bulguları kapsar.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam bir rapor, yazar için düzeltme rehberi olmadan tarayıcı bakım kodları içeriyorsa bunlar Plugin yazarları yerine OpenClaw bakımcıları içindir.

Herhangi bir düzeltmeyi uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazar odaklı bulgular

| Kod                                     | Buradan başlayın                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket meta verisi ekle](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekle](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildir](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                   |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayımla](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                           |
| `package-install-metadata-incomplete`   | [Kurulum meta verisini tamamla](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                       |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildir](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                        |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü hizala](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                        |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini hizala](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                     |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verisini kaldır](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [npm yapıtını paketlenebilir yap](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                            |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm paket çıktısına dahil et](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)       |
| `package-npm-pack-metadata-missing`     | [Meta veriyi npm paket çıktısına dahil et](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)              |
| `manifest-name-missing`                 | [Manifest görünen adı ekle](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                         |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldır](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                       |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldır](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                 |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarmalarını değiştir](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                               |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarmalarını kaldır](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                               |
| `sdk-load-session-store`                | [Tüm oturum deposu erişimini değiştir](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                             |
| `sdk-session-store-write`               | [Tüm oturum deposu yazmalarını değiştir](/tr/clawhub/plugin-validation-fixes#sdk-session-store-write)                          |
| `sdk-session-file-helper`               | [Oturum dosya yolu yardımcılarını değiştir](/tr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                       |
| `sdk-session-transcript-file-target`    | [Eski transkript dosyası hedeflerini değiştir](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)         |
| `sdk-session-transcript-low-level`      | [Düşük düzey transkript yardımcılarını değiştir](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)         |
| `legacy-before-agent-start`             | [before_agent_start öğesini değiştir](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                           |
| `provider-auth-env-vars`                | [Sağlayıcı env vars değerlerini kurulum meta verisine taşı](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)         |
| `channel-env-vars`                      | [Kanal env vars değerlerini geçerli meta veriye yansıt](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                   |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifesti şeması başvurularını kaldır](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifesti dosyalarını kaldır](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)     |

## Paket meta verisi

### package-json-missing

Paket kökü `package.json` içermiyor; bu nedenle ClawHub npm paketini, sürümü, giriş noktalarını veya OpenClaw meta verisini tanımlayamaz.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin gönderdiğinde bir `openclaw` bloğu ekleyin.
- Minimal paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins), paket ve manifest ayrımı için [Plugin manifesti](/tr/plugins/manifest#manifest-versus-packagejson) sayfasını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Pakette `package.json` var, ancak OpenClaw paket meta verisini bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası meta verilerini dahil edin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum meta verilerini ekleyin.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verisi mevcut, ancak bir OpenClaw çalışma zamanı giriş noktası bildirmiyor.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayımlanan paket derlenmiş JavaScript yüklemeliyse `openclaw.runtimeExtensions` ekleyin.
- Tüm giriş noktası yollarını paket dizini içinde tutun.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildiriyor, ancak başvurulan dosya doğrulanan pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve `openclaw.runtimeSetupEntry` içindeki her yolu denetleyin.
- Giriş noktası `dist` içine oluşturuluyorsa paketi derleyin.
- Giriş noktası taşındıysa meta veriyi güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulacağını veya güncelleneceğini anlayamıyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı kullanılabiliyorsa `openclaw.install.defaultChoice` değerini ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion` kullanın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` dosyasına `openclaw.compat.pluginApi` ekleyin.
- Derleyip test ettiğiniz OpenClaw Plugin API sürümünü veya semver tabanını kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin sürümünü açıklar; `openclaw.compat.pluginApi` ise ana makine API sözleşmesini açıklar.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paketin minimum ana makine sürümü, paketin derlendiği OpenClaw sürüm meta verisiyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini denetleyin.
- Paketteki, yayın sırasında kullanılan OpenClaw sürümü gibi OpenClaw derleme meta verilerini denetleyin.
- Minimum ana makine sürümünü paketin gerçekten desteklediği ana makine sürümü aralığıyla hizalayın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifest sürümü uyuşmuyor.

- Paket yayın sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` dosyasında da `version` varsa eşleşecek şekilde güncelleyin veya paket meta verisi yetkili kaynak olduğunda eski manifest sürüm meta verisini kaldırın.
- Yayımlanan meta veriyi değiştirdikten sonra yeni bir paket sürümü yayımlayın.
- [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verisi olmayan alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verilerini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluğu, kurulumu, kurulumu ayarlamayı ve katalog meta verilerini desteklenen `package.json#openclaw` alanlarında tutun.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanan yapıt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı yapıta paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemenin başarısız olmasına neden olan geçersiz paket meta verisini, bozuk yaşam döngüsü betiklerini veya files girdilerini düzeltin.
- Bu paket herkese açık yayımlama için tasarlandıysa `private: true` değerini kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş yapıt `package.json#openclaw` içinde bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Oluşturulan giriş noktalarını paketlemeden önce derleyin.
- Bildirilen giriş noktalarının dahil edilmesi için `files`, `.npmignore` veya derleme çıktısını güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş yapıt, kaynak paketinizde bulunan OpenClaw meta verisini içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilen meta veri dosyalarını inceleyin.
- `package.json` dosyasının paketlenmiş yapıtta `openclaw` bloğunu içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin ise `openclaw.plugin.json` dosyasının dahil edildiğinden emin olun.
- Paket meta verisinin dışlanmaması için `files` veya `.npmignore` öğesini güncelleyin.
- [Plugin oluşturma](/tr/plugins/building-plugins) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest meta verisi

### manifest-name-missing

Yerel Plugin manifest bir görüntüleme adı içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` değerini insanlar tarafından okunabilir tutun ve `id` değerini kararlı makine kimliği olarak koruyun.
- Bkz. [Plugin manifest](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifest, OpenClaw tarafından desteklenmeyen üst düzey alanlar içeriyor.

- Her üst düzey alanı
  [manifest alan başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum meta verilerini manifest yerine desteklenen `package.json#openclaw` alanlarına
  taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifest, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [contracts başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts` değerini
  statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel üzerinden içe aktarma yapıyor:
`openclaw/plugin-sdk`.

- Kök barrel içe aktarmalarını odaklanmış genel alt yol içe aktarmalarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar içe aktarmayı bulmak için [İçe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş Plugin'ler veya dahili uyumluluk için ayrılmış bir SDK yolunu
içe aktarıyor.

- Ayrılmış OpenClaw dahili SDK içe aktarmalarını belgelenmiş genel
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın genel bir SDK karşılığı yoksa yardımcıyı paketinizin içinde tutun veya
  genel bir OpenClaw API isteyin.
- Desteklenen bir içe aktarma seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)` kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` öğesini yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-store-write

Plugin hâlâ `saveSessionStore` veya `updateSessionStore` gibi kullanımdan kaldırılmış
tüm oturum deposu yazma yardımcısı kullanıyor.

- Mevcut bir oturum girdisindeki alanları güncellerken `patchSessionEntry(...)` kullanın.
- Bir oturum girdisini değiştirirken veya oluştururken `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- Tüm depo yazma yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunları gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-file-helper

Plugin hâlâ `resolveSessionFilePath` veya `resolveAndPersistSessionFile` gibi
kullanımdan kaldırılmış oturum dosya yolu yardımcılarını kullanıyor.

- Oturum meta verilerini agent ve oturum kimliğine göre okumak için `getSessionEntry(...)` kullanın.
- Oturum meta verilerini kalıcı hale getirmek için `patchSessionEntry(...)` veya
  `upsertSessionEntry(...)` kullanın.
- Kod bir transcript işlemi hazırlıyorsa transcript kimliği veya hedef yardımcılarını kullanın.
- Eski transcript dosya yollarını kalıcı hale getirmeyin veya bunlara bağımlı olmayın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-file-target

Plugin hâlâ kullanımdan kaldırılmış transcript dosya hedefi yardımcısı
`resolveSessionTranscriptLegacyFileTarget` kullanıyor.

- Kod yalnızca genel oturum kimliğine ihtiyaç duyuyorsa `resolveSessionTranscriptIdentity(...)` kullanın.
- Kod yapılandırılmış bir transcript işlem hedefine ihtiyaç duyuyorsa `resolveSessionTranscriptTarget(...)` kullanın.
- Eski transcript dosya hedeflerini doğrudan okumaktan veya oluşturmaktan kaçının.
- Eski yardımcıyı yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-low-level

Plugin hâlâ `appendSessionTranscriptMessage` veya `emitSessionTranscriptUpdate` gibi
kullanımdan kaldırılmış düşük seviyeli transcript yardımcılarını kullanıyor.

- Transcript eklemeleri için `appendSessionTranscriptMessageByIdentity(...)` kullanın.
- Transcript güncelleme bildirimleri için `publishSessionTranscriptUpdateByIdentity(...)` kullanın.
- OpenClaw'ın doğru işlem sınırlarını ve kimlik işlemeyi uygulayabilmesi için
  yapılandırılmış transcript çalışma zamanı yüzeyini tercih edin.
- Düşük seviyeli transcript yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunları gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` hook'unu kullanıyor.

- Model veya sağlayıcı geçersiz kılma işini `before_model_resolve` içine taşıyın.
- Prompt veya bağlam değiştirme işini `before_prompt_build` içine taşıyın.
- `before_agent_start` öğesini yalnızca bildirdiğiniz uyumluluk aralığı hâlâ
  bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Hook'lar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifest hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini kullanıyor.

- Sağlayıcı env-var meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` öğesini yalnızca desteklediğiniz OpenClaw aralığı hâlâ
  buna ihtiyaç duyarken uyumluluk meta verisi olarak tutun.
- Bkz. [setup başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifest, ClawHub'ın beklediği mevcut setup veya yapılandırma meta verileri olmadan
eski ya da daha eski kanal env-var meta verileri kullanıyor.

- OpenClaw'ın kanal çalışma zamanını yüklemeden setup durumunu inceleyebilmesi için
  kanal env-var meta verilerini bildirimsel tutun.
- Env odaklı kanal setup'ını Plugin şeklinizin kullandığı mevcut setup, kanal yapılandırması veya
  paket kanal meta verilerine yansıtın.
- `channelEnvVars` öğesini yalnızca desteklenen eski OpenClaw sürümleri hâlâ
  bunu gerektirirken uyumluluk meta verisi olarak tutun.
- Bkz. [Plugin manifest](/tr/plugins/manifest) ve
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifest

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir şema başvurusuyla
`openclaw.security.json` gönderiyor.

- Yalnızca tavsiye niteliğindeyse şema URL'sini kaldırın.
- Belgelenmiş sürümlü bir şemayı yalnızca OpenClaw bir tane yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket desteklenmeyen bir güvenlik manifest dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik manifest şeması ve ClawHub davranışı belgeleyene kadar
  `openclaw.security.json` dosyasını kaldırın.
- Manifest contract var olana kadar güvenlik açısından hassas davranışı genel paket belgelerinizde veya
  README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifest](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
