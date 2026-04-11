---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı paketler, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-11T02:45:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55e75d056306a77b0d112a3902c08c7771f53533250847fc3d785b1df3e0e9e7
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu doküman, “nasıl test ediyoruz” kılavuzudur:

- Her paketin neyi kapsadığı (ve kasıtlı olarak neyi _kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Canlı testlerin kimlik bilgilerini nasıl bulduğu ve modelleri/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için nasıl regresyon ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesinde beklenir): `pnpm build && pnpm check && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık eklenti/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılarda/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + gateway araç/görüntü probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: Yalnızca tek bir başarısız vakaya ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleri aracılığıyla canlı testleri daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA Lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak seçilen birden çok senaryoyu yalıtılmış
    gateway işçileri ile paralel çalıştırır; en fazla 64 işçi veya seçilen senaryo sayısı kadar.
    İşçi sayısını ayarlamak için `--concurrency <count>`, eski seri hat içinse
    `--concurrency 1` kullanın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
    varsa `CODEX_HOME`.
  - Konuğun bağlanmış çalışma alanı üzerinden geri yazabilmesi için çıktı dizinleri
    depo kökü altında kalmalıdır.
  - Normal QA raporu + özetini ve ayrıca Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ile bir özel oda sağlar, ardından gerçek Matrix plugin'i ile bir QA gateway alt sürecini SUT taşıma katmanı olarak başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerekiyorsa `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Bir Matrix QA raporu, özet ve gözlemlenen olaylar varlığını `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortam değişkenlerinden alınan sürücü ve SUT bot token'larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Aynı özel grupta iki farklı bot gerektirir ve SUT botu bir Telegram kullanıcı adını açığa çıkarmalıdır.
  - Kararlı bottan bota gözlem için, her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Bir Telegram QA raporu, özet ve gözlemlenen mesajlar varlığını `.artifacts/qa-e2e/...` altına yazar.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşıma katmanları sapma göstermez:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve canlı
taşıma kapsam matriksinin bir parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                     | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                       |               | x            |

## Test paketleri (hangi test nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/birim envanterleri ve `vitest.unit.config.ts` tarafından kapsanan allowlist içindeki `ui` node testleri
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway auth, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedeflenmemiş `pnpm test` artık tek bir devasa yerel root-project süreci yerine on bir küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi düşürür ve auto-reply/extension çalışmalarının ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel root `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir izleme döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tüm root proje başlangıç maliyetini ödemekten kaçınır.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri ise yine geniş root-project yeniden çalıştırmasına geri döner.
  - Ajanlar, komutlar, eklentiler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan gelen import-light birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattına yönlendirilir; durum bilgili/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da değişiklik modundaki çalıştırmaları bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketin yeniden çalıştırılmasını gerektirmez.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır yanıt harness çalışmasını ucuz durum/parça/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj-aracı keşif girdilerini veya sıkıştırma çalışma zamanı bağlamını değiştirdiğinizde,
    kapsamanın her iki düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı entegrasyon paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve sıkıştırma davranışının hâlâ
    gerçek `run.ts` / `compact.ts` yollarından aktığını doğrular; yalnızca yardımcı testler bu entegrasyon yollarının
    yeterli bir yerine geçemez.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` ayarlar ve root projeler, e2e ve canlı yapılandırmalar genelinde izole olmayan çalıştırıcıyı kullanır.
  - Root UI hattı `jsdom` kurulumunu ve optimizer'ını korur, ancak artık paylaşılan izole olmayan çalıştırıcı üzerinde de çalışır.
  - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` de ekler. Stok V8 davranışıyla karşılaştırmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz şekilde eşleniyorsa kapsamlı hatlar üzerinden yönlendirilir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur; sadece daha yüksek işçi sınırıyla çalışır.
  - Yerel işçi otomatik ölçeklendirmesi artık kasıtlı olarak daha temkinlidir ve ana makine yük ortalaması zaten yüksekse geri çekilir; böylece birden fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, test kablolaması değiştiğinde changed-mode yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil oluşturma için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import-süresi raporlamasını ve import dökümü çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profil görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş `test:changed` ile yerel root-project yolunu o commit edilmiş fark için karşılaştırır ve duvar süresi ile macOS en yüksek RSS değerini yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve root Vitest yapılandırması üzerinden yönlendirerek mevcut kirli ağacı kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve dönüştürme yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, birim paketi için dosya paralelliği devre dışıyken çalıştırıcı CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir işçiler kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - İşçi sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` kullanın (üst sınır 16'dır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1` kullanın.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, düğüm eşleştirme ve daha ağır ağ kullanımı
- Beklentiler:
  - CI'da çalışır (iş hattında etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Ana makinede Docker aracılığıyla yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell arka ucunu test eder
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model _bugün_ gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI açısından kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Maliyetlidir / hız sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak olarak yükler.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek ana dizininizi kullanmasını özellikle istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway önyükleme günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlıya özel geçersiz kılma için `OPENCLAW_LIVE_*_KEY` kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e yazar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalama sessiz olsa bile görünür şekilde etkin kalır.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/gateway ilerleme satırlarının anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok değişiklik yaptıysanız ayrıca `pnpm test:coverage`)
- Gateway ağ iletişimine / WS protokolüne / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü hatalar / araç çağırma sorunlarında hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı: Android düğüm yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android düğümü tarafından **şu anda ilan edilen her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Önkoşullu/manuel kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android düğümü için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway'e bağlı ve eşleştirilmiş olmalıdır.
  - Uygulama ön planda tutulmalıdır.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalıdır.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke (profil anahtarları)

Canlı testler, hataları izole edebilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+ajan hattının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgilerine sahip olduğunuz modelleri seçmek için `getApiKeyForModel` kullanmak
  - Her model için küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, yani modern için takma ad) ayarlayın; aksi halde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern allowlist'i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve ortam geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API'si bozuk / anahtar geçersiz” ile “gateway ajan hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonları içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatma + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme ajanı smoke (\"@openclaw\" gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/düzeltmek (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller arasında dolaşmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışıyor (`read` probe)
    - isteğe bağlı ek araç probları (`exec+read` probe)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → devam yanıtı) çalışmaya devam ediyor
- Probe ayrıntıları (böylece hataları hızlıca açıklayabilirsiniz):
  - `read` probe: test, çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` ile okuyup nonce'u geri yankılamasını ister.
  - `exec+read` probe: test, ajandan `exec` ile geçici bir dosyaya nonce yazmasını, ardından `read` ile geri okumasını ister.
  - görsel probe: test, üretilmiş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey” yaklaşımından kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + görsel probları bu canlı testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - model görsel girişi desteği ilan ettiğinde görsel probe çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan, multimodal kullanıcı mesajını modele iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: Makinenizde neleri test edebileceğinizi görmek için (ve tam `provider/model` kimlikleri için) şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI arka uç smoke (Claude, Codex, Gemini veya diğer yerel CLI'ler)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: Varsayılan yapılandırmanıza dokunmadan Gateway + ajan hattını yerel bir CLI arka ucu kullanarak doğrulamak.
- Arka uca özgü smoke varsayılanları, sahibi olan eklentinin `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, sahibi olan CLI arka uç eklentisi meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir).
  - Görsel dosya yollarını isteme enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir dönüş gönderip devam akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum sürekliliği probunu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model geçiş hedefini desteklediğinde zorla açmak için `1` ayarlayın).

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Tek sağlayıcılı Docker tarifleri:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumundadır.
- Canlı CLI arka uç smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verilerini sahibi olan eklentiden çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içindeki önbellekli yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` ya da `claude setup-token` komutundan `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI arka uç dönüşü çalıştırır. Bu abonelik hattı, Claude'un şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalandırması üzerinden yönlendirmesi nedeniyle Claude MCP/araç ve görsel problarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı test eder: metin dönüşü, görsel sınıflandırma dönüşü, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a geçirir ve devam ettirilen oturumun hâlâ önceki bir notu hatırladığını doğrular.

## Canlı: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP ajanıyla gerçek ACP konuşma-bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj-kanalı konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum transkriptine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP ajanları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP ajanı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP arka ucu: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin harici teslimat yapıyormuş gibi davranmadan mesaj-kanalı bağlamı ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse test, seçilen ACP harness ajanı için gömülü `acpx` eklentisinin yerleşik ajan kayıt defterini kullanır.

Örnek:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-acp-bind
```

Tek ajanlı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumundadır.
- Varsayılan olarak ACP bağlama smoke testini sırasıyla desteklenen tüm canlı CLI ajanlarına karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynak olarak yükler, eşleşen CLI kimlik doğrulama materyalini container içine hazırlar, `acpx`'i yazılabilir bir npm önekine kurar, ardından istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) eksikse kurar.
- Docker içinde çalıştırıcı, kaynak olarak yüklenen profilden gelen sağlayıcı ortam değişkenlerinin alt harness CLI için erişilebilir kalması amacıyla `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar.

## Canlı: Codex app-server harness smoke

- Amaç: eklenti sahibi Codex harness'i normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` eklentisini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk gateway ajan dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    iş parçacığının devam edebildiğini doğrula
  - aynı gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştır
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı görsel probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness PI'ye sessizce geri düşerek başarılı sayılmaz.
- Kimlik doğrulama: shell/profilden gelen `OPENAI_API_KEY`, ayrıca isteğe bağlı olarak kopyalanan
  `~/.codex/auth.json` ve `~/.codex/config.toml`

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumundadır.
- Bağlı `~/.profile` dosyasını kaynak olarak yükler, `OPENAI_API_KEY` geçirir, mevcutsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bir bağlı npm
  önekine kurar, kaynak ağacı hazırlar, ardından yalnızca Codex harness canlı testini çalıştırır.
- Docker varsayılan olarak görsel ve MCP/araç problarını etkinleştirir. Daha dar bir hata ayıklama çalıştırması gerektiğinde
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca canlı
  test yapılandırmasıyla eşleşecek şekilde `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; böylece `openai-codex/*` veya PI geri dönüşü bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar ve açık allowlist'ler en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı arasında araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç kullanımına özgü farklılıklar).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikilisine shell-out yapar; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (streaming/araç desteği/sürüm kayması).

## Canlı: model matriksi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı test isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern smoke seti (araç çağırma + görsel)

Bu, çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görsel ile gateway smoke çalıştırması:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (`Read` + isteğe bağlı `Exec`)

Her sağlayıcı ailesi için en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görsel gönderimi (ek → multimodal mesaj)

Görsel probe'u test etmek için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görsel destekli model ekleyin (Claude/Gemini/OpenAI'nin vision destekli varyantları vb.).

### Aggregator'lar / alternatif gateway'ler

Anahtarlarınızı etkinleştirdiyseniz, şu yollarla test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görsel destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (kimlik doğrulama `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile)

Canlı matrikse ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: dokümanlarda “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, canlı testler aynı anahtarları bulmalıdır.
- Canlı test “kimlik bilgisi yok” diyorsa, `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde hata ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” denilen şey budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanmış canlı ana dizine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; hazırlanmış canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar ve probların gerçek ana makine çalışma alanınıza dokunmaması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Ortam anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görsel, video ve `music_generate` yollarını test eder
  - `models.providers.comfy.<capability>` yapılandırılmamışsa her yeteneği atlar
  - comfy workflow gönderimi, polling, indirmeler veya eklenti kaydı değiştirildikten sonra kullanışlıdır

## Görsel oluşturma canlı

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görsel oluşturma sağlayıcı eklentisini listeler
  - Probe işleminden önce eksik sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Stok görsel oluşturma varyantlarını paylaşılan çalışma zamanı yeteneği üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Şu anda kapsanan paketlenmiş sağlayıcılar:
  - `openai`
  - `google`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik oluşturma canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik oluşturma sağlayıcı yolunu test eder
  - Şu anda Google ve MiniMax'i kapsar
  - Probe işleminden önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Kullanılabildiğinde beyan edilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` beyan ettiğinde `edit`
  - Geçerli paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video oluşturma canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video oluşturma sağlayıcı yolunu test eder
  - Probe işleminden önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Kullanılabildiğinde beyan edilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.imageToVideo.enabled` beyan ettiğinde ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel görsel girdisini kabul ettiğinde `imageToVideo`
    - sağlayıcı `capabilities.videoToVideo.enabled` beyan ettiğinde ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda beyan edilip atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görsel URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak görsel URL fixture'ı kullanan bir `kling` hattının yanı sıra `veo3` metinden videoya hattını çalıştırır
  - Şu anki `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda beyan edilip atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel tampon destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`, çünkü mevcut paylaşılan hat org'a özgü video inpaint/remix erişim garantilerine sahip değildir
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görsel, müzik ve video canlı paketlerini depo yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` üzerinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulamaya sahip sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyayı çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` dosyasını kaynak olarak yükler). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  özellikle istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez derler, ardından bunu iki canlı Docker hattı için yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek container başlatır ve daha yüksek seviyeli entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI kimlik doğrulama ana dizinlerini bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra bunları çalıştırmadan önce container ana dizinine kopyalar; böylece harici CLI OAuth, ana makine kimlik doğrulama deposunu değiştirmeden belirteçleri yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (seed edilmiş Gateway + stdio köprüsü + ham Claude bildirim-çerçevesi smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Eklentiler (kurulum smoke testi + `/plugin` takma adı + Claude bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Canlı model Docker çalıştırıcıları ayrıca mevcut checkout'u salt okunur olarak bağlar ve
container içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
imajını ince tutarken Vitest'i tam olarak yerel kaynak/yapılandırmanız üzerinde çalıştırmaya devam eder.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artifaktları
dakikalarca kopyalamaması için `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yalnızca yerel önbellekleri ve uygulama derleme çıktıları atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı probları container içinde
gerçek Telegram/Discord vb. kanal işçilerini başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle o Docker hattında gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de geçirin.
`test:docker:openwebui`, daha yüksek seviyeli bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş bir
OpenClaw gateway container'ı başlatır,
o gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` içinde `openclaw/default` modelinin açığa çıktığını doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma gözle görülür biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve Docker ile çalıştırılan senaryolarda
bunu sağlamak için birincil yöntem `OPENCLAW_PROFILE_FILE` (`~/.profile` varsayılan) değişkenidir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container'ı başlatır, `openclaw mcp serve` oluşturan ikinci bir container başlatır, ardından
gerçek stdio MCP köprüsü üzerinden yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim kontrolü
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK'sının ortaya çıkardığını değil,
köprünün gerçekten ne yaydığını doğrular.

Manuel ACP doğal dil ileti dizisi smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP ileti dizisi yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynak olarak yüklenir
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbellekli CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur bağlanır, ardından testler başlamadan önce `/home/node/...` konumuna kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir liste ile manuel olarak geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` imajını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin ortamdan değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce-check istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman tutarlılığı

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrollerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI açısından güvenli)

Bunlar, gerçek sağlayıcılar olmadan “gerçek iş hattı” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, yapılandırma + auth yazımı zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirliği değerlendirmeleri (Skills)

Zaten “ajan güvenilirliği değerlendirmeleri” gibi davranan birkaç CI açısından güvenli testimiz var:

- Gerçek gateway + ajan döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde ajan doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** ajan kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralamayı, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan veya kaçın, geçitler, prompt injection).
- Yalnızca CI açısından güvenli paket yerleştiğinde isteğe bağlı canlı değerlendirmeler (opt-in, ortam değişkeni ile korumalı).

## Sözleşme testleri (eklenti ve kanal yapısı)

Sözleşme testleri, kayıtlı her eklenti ve kanalın arayüz
sözleşmesine uyduğunu doğrular. Keşfedilen tüm eklentiler üzerinde dolaşır ve
bir yapı ve davranış doğrulama paketi çalıştırır. Varsayılan `pnpm test` birim hattı
kasıtlı olarak bu paylaşılan seam ve smoke dosyalarını atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça
çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel eklenti yapısı (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - İleti dizisi kimliği işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probları
- **registry** - Eklenti kayıt defteri yapısı

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçenek belirleme
- **catalog** - Model katalog API'si
- **discovery** - Eklenti keşfi
- **loader** - Eklenti yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Eklenti yapısı/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı eklentisi ekledikten ya da değiştirdikten sonra
- Eklenti kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Canlı ortamda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI açısından güvenli bir regresyon ekleyin (sağlayıcıyı sahteleyin/stub kullanın veya tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca canlıysa (hız sınırları, kimlik doğrulama politikaları), canlı testi dar ve ortam değişkenleriyle opt-in tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - gateway oturum/geçmiş/araç hattı hatası → gateway canlı smoke testi veya CI açısından güvenli gateway sahte test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` fonksiyonunu güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
