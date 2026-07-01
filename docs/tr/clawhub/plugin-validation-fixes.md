---
read_when:
    - '`clawhub package validate` komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor'
    - ClawHub, bir Plugin paketi yayımlamasını reddetti veya uyarı verdi
    - Plugin paket meta verilerini yayın öncesinde güncelliyorsunuz
summary: ClawHub Plugin paketi doğrulama bulgularını yayımlamadan önce düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-07-01T13:16:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, yayımlamadan önce Plugin paketlerini doğrular ve otomatik paket taramalarından gelen bulguları da gösterebilir. Bu sayfa, yazarın paket meta verilerinde, manifestinde, SDK içe aktarmalarında veya yayımlanmış yapıtında düzeltebileceği bulgular anlamına gelen, yazara yönelik bulguları kapsar.

Dahili Plugin Inspector kapsama bulgularını kapsamaz. Tam bir rapor, yazarın düzeltebileceği bir rehberlik olmadan tarayıcı bakım kodları içeriyorsa bunlar Plugin yazarlarından ziyade OpenClaw bakımcıları içindir.

Herhangi bir düzeltmeyi uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazara yönelik bulgular

| Kod                                     | Buradan başlayın                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `package-json-missing`                  | [Paket meta verisi ekleyin](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                       |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekleyin](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                     |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildirin](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)             |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayımlayın](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                     |
| `package-install-metadata-incomplete`   | [Kurulum meta verilerini tamamlayın](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)               |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildirin](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                   |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü hizalayın](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                 |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini hizalayın](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)               |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verilerini kaldırın](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [npm yapıtını paketlenebilir hale getirin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)  |
| `package-npm-pack-metadata-missing`     | [Meta verileri npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)        |
| `manifest-name-missing`                 | [Manifest görünen adı ekleyin](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                   |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                  |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)            |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                          |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarmalarını kaldırın](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                          |
| `sdk-load-session-store`                | [Tüm oturum deposu erişimini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                        |
| `sdk-session-store-write`               | [Tüm oturum deposu yazmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-store-write)                     |
| `sdk-session-file-helper`               | [Oturum dosya yolu yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                  |
| `sdk-session-transcript-file-target`    | [Eski transkript dosyası hedeflerini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)    |
| `sdk-session-transcript-low-level`      | [Düşük düzey transkript yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)    |
| `legacy-before-agent-start`             | [before_agent_start değerini değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                     |
| `provider-auth-env-vars`                | [Sağlayıcı ortam değişkenlerini kurulum meta verilerine taşıyın](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Kanal ortam değişkenlerini geçerli meta verilerde yansıtın](/tr/clawhub/plugin-validation-fixes#channel-env-vars)          |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifest şeması başvurularını kaldırın](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifest dosyalarını kaldırın](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Paket meta verileri

### package-json-missing

Paket kökü `package.json` içermiyor; bu nedenle ClawHub npm paketini, sürümü, giriş noktalarını veya OpenClaw meta verilerini tanımlayamaz.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin gönderiyorsa bir `openclaw` bloğu ekleyin.
- Minimal paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins) ve paket ile manifest ayrımı için [Plugin manifesti](/tr/plugins/manifest#manifest-versus-packagejson) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Pakette `package.json` var, ancak OpenClaw paket meta verilerini bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası meta verilerini dahil edin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum meta verilerini ekleyin.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verileri var, ancak bir OpenClaw çalışma zamanı giriş noktası bildirmiyor.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayımlanan paket derlenmiş JavaScript yüklemeliyse `openclaw.runtimeExtensions` ekleyin.
- Tüm giriş noktası yollarını paket dizininin içinde tutun.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildiriyor, ancak başvurulan dosya doğrulanan pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve `openclaw.runtimeSetupEntry` içindeki her yolu kontrol edin.
- Giriş noktası `dist` içine oluşturuluyorsa paketi derleyin.
- Giriş noktası taşındıysa meta verileri güncelleyin.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulması veya güncellenmesi gerektiğini anlayamıyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı varsa `openclaw.install.defaultChoice` değerini ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion` kullanın.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` dosyasına `openclaw.compat.pluginApi` ekleyin.
- Derleyip test ettiğiniz OpenClaw Plugin API sürümünü veya semver alt sınırını kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin sürümünü açıklar; `openclaw.compat.pluginApi` ise ana makine API sözleşmesini açıklar.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paketin minimum ana makine sürümü, paketin karşısında derlendiği OpenClaw sürüm meta verileriyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Yayın sırasında kullanılan OpenClaw sürümü gibi paketteki tüm OpenClaw derleme meta verilerini kontrol edin.
- Minimum ana makine sürümünü, paketin fiilen desteklediği ana makine sürüm aralığıyla hizalayın.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifest sürümü uyuşmuyor.

- Paket yayın sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` içinde de `version` varsa eşleşecek şekilde güncelleyin veya paket meta verileri yetkili kaynaksa eski manifest sürüm meta verilerini kaldırın.
- Yayımlanmış meta verileri değiştirdikten sonra yeni bir paket sürümü yayımlayın.
- Bkz. [Plugin manifesti](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verileri olmayan alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verilerini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluk, kurulum, setup ve katalog meta verilerini desteklenen `package.json#openclaw` alanlarında tutun.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanmış yapıt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı yapıta paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemeyi başarısız yapan geçersiz paket meta verilerini, bozuk yaşam döngüsü betiklerini veya files girdilerini düzeltin.
- Bu paket genel yayımlama için tasarlandıysa `private: true` değerini kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş yapıt `package.json#openclaw` içinde bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Paketlemeden önce oluşturulan giriş noktalarını derleyin.
- Bildirilen giriş noktalarının dahil edilmesi için `files`, `.npmignore` veya derleme çıktısını güncelleyin.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş yapıtta kaynak paketinizde bulunan OpenClaw meta verileri eksik.

- `npm pack --dry-run` çalıştırın ve dahil edilen meta veri dosyalarını inceleyin.
- Paketlenmiş yapıtta `package.json` dosyasının `openclaw` bloğunu içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin ise `openclaw.plugin.json` dosyasının dahil edildiğinden emin olun.
- Paket meta verilerinin dışlanmaması için `files` veya `.npmignore` değerini güncelleyin.
- Bkz. [Plugin oluşturma](/tr/plugins/building-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest meta verileri

### manifest-name-missing

Yerel Plugin manifesti bir görüntüleme adı içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` alanını insanlar tarafından okunabilir tutun ve `id` alanını kararlı makine kimliği olarak koruyun.
- Bkz. [Plugin manifesti](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifesti, OpenClaw tarafından desteklenmeyen üst düzey alanlar içeriyor.

- Her üst düzey alanı
  [manifest alanı başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum meta verilerini manifest yerine desteklenen `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifest, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [contracts başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts` kapsamını statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel'ından içe aktarıyor:
`openclaw/plugin-sdk`.

- Kök barrel içe aktarmalarını odaklı herkese açık alt yol içe aktarmalarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar içe aktarımı bulmak için [İçe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) bölümlerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş Plugin'ler veya dahili uyumluluk için ayrılmış bir SDK yolunu içe aktarıyor.

- Ayrılmış OpenClaw dahili SDK içe aktarmalarını belgelenmiş herkese açık
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın herkese açık SDK karşılığı yoksa yardımcıyı paketinizin içinde tutun veya herkese açık bir OpenClaw API isteyin.
- Desteklenen bir içe aktarım seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) bölümlerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)` kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` öğesini yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-store-write

Plugin hâlâ `saveSessionStore` veya `updateSessionStore` gibi kullanımdan kaldırılmış tüm oturum deposu yazma yardımcılarını kullanıyor.

- Mevcut bir oturum girdisindeki alanları güncellerken `patchSessionEntry(...)` kullanın.
- Bir oturum girdisini değiştirirken veya oluştururken `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- Tüm depo yazma yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-file-helper

Plugin hâlâ `resolveSessionFilePath` veya `resolveAndPersistSessionFile` gibi kullanımdan kaldırılmış oturum dosya yolu yardımcılarını kullanıyor.

- Oturum meta verilerini agent ve oturum kimliğine göre okumak için `getSessionEntry(...)` kullanın.
- Oturum meta verilerini kalıcı hale getirmek için `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Kod bir transcript işlemi hazırlıyorsa transcript kimliği veya hedef yardımcılarını kullanın.
- Eski transcript dosya yollarını kalıcı hale getirmeyin veya bunlara bağımlı olmayın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-file-target

Plugin hâlâ kullanımdan kaldırılmış transcript dosya hedefi yardımcısı
`resolveSessionTranscriptLegacyFileTarget` kullanıyor.

- Kod yalnızca herkese açık oturum kimliğine ihtiyaç duyuyorsa `resolveSessionTranscriptIdentity(...)` kullanın.
- Kod yapılandırılmış bir transcript işlemi hedefine ihtiyaç duyuyorsa `resolveSessionTranscriptTarget(...)` kullanın.
- Eski transcript dosya hedeflerini doğrudan okumaktan veya oluşturmaktan kaçının.
- Eski yardımcıyı yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-low-level

Plugin hâlâ `appendSessionTranscriptMessage` veya `emitSessionTranscriptUpdate` gibi kullanımdan kaldırılmış düşük seviyeli transcript yardımcılarını kullanıyor.

- Transcript eklemeleri için `appendSessionTranscriptMessageByIdentity(...)` kullanın.
- Transcript güncelleme bildirimleri için `publishSessionTranscriptUpdateByIdentity(...)` kullanın.
- OpenClaw'ın doğru transaction sınırlarını ve kimlik işlemeyi uygulayabilmesi için yapılandırılmış transcript çalışma zamanı yüzeyini tercih edin.
- Düşük seviyeli transcript yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` hook'unu kullanıyor.

- Model veya sağlayıcı override işini `before_model_resolve` içine taşıyın.
- Prompt veya context değiştirme işini `before_prompt_build` içine taşıyın.
- `before_agent_start` öğesini yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken tutun.
- Bkz. [Hook'lar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifest hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini kullanıyor.

- Sağlayıcı env-var meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` öğesini yalnızca desteklediğiniz OpenClaw aralığı hâlâ buna ihtiyaç duyarken uyumluluk meta verisi olarak tutun.
- Bkz. [setup başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifest, ClawHub'ın beklediği mevcut setup veya config meta verileri olmadan eski ya da daha eski kanal env-var meta verileri kullanıyor.

- Kanal env-var meta verilerini declarative tutun; böylece OpenClaw kanal çalışma zamanını yüklemeden setup durumunu inceleyebilir.
- Env tarafından yönlendirilen kanal setup'ını, Plugin şeklinizin kullandığı mevcut setup, kanal config veya paket kanal meta verilerine yansıtın.
- `channelEnvVars` öğesini yalnızca desteklenen eski OpenClaw sürümleri hâlâ bunu gerektirirken uyumluluk meta verisi olarak tutun.
- Bkz. [Plugin manifesti](/tr/plugins/manifest) ve
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifesti

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir şema başvurusuyla `openclaw.security.json` gönderiyor.

- Yalnızca danışma amaçlıysa şema URL'sini kaldırın.
- Belgelenmiş sürümlü bir şemayı yalnızca OpenClaw yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket, desteklenmeyen bir güvenlik manifesti dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik manifesti şeması ve ClawHub davranışı belgeleyene kadar `openclaw.security.json` dosyasını kaldırın.
- Manifest contract'ı var olana kadar güvenlik açısından hassas davranışı herkese açık paket belgelerinizde veya README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
