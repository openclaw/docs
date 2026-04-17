---
read_when:
    - Testleri yerelde veya CI içinde çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-04-17T08:52:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55483bc68d3b24daca3189fba3af1e896f39b8e83068d102fed06eac05b36102
    source_path: help/testing.md
    workflow: 15
---

# Test Etme

OpenClaw’ın üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı seti vardır.

Bu doküman bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesinde beklenen): `pnpm build && pnpm check && pnpm test`
- Kaynakları geniş bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde iterasyon yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + gateway araç/görüntü probları): `pnpm test:live`
- Tek bir live dosyasını sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleriyle live testleri daraltmayı tercih edin.

## QA’ye özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak, izole gateway worker’larla birden fazla seçilmiş senaryoyu paralel çalıştırır; en fazla 64 worker veya seçilen senaryo sayısı kadar. Worker sayısını ayarlamak için `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler. `aimock`, senaryo farkındalığı olan `mock-openai` hattının yerini almadan deneysel fixture ve protocol-mock kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini geçici bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Live çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır; böylece misafir, bağlanan çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özeti ve Multipass loglarını `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix live QA hattını, Docker destekli geçici bir Tuwunel homeserver’a karşı çalıştırır.
  - Bu QA host bugün yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` içermez, bu yüzden `openclaw qa` sunmaz.
  - Repo checkout’ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda sağlar, ardından gerçek Matrix plugin’i SUT taşıması olarak kullanarak bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel görüntüsü `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir görüntüyü test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hattın yerelde geçici kullanıcılar sağlaması nedeniyle paylaşılan kimlik bilgisi kaynağı bayraklarını sunmaz.
  - Bir Matrix QA raporu, özeti, gözlemlenen olaylar artefaktını ve birleşik stdout/stderr çıktı logunu `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram live QA hattını, env içindeki driver ve SUT bot token’larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerekir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Aynı özel grup içinde iki ayrı bot gerekir ve SUT botunun bir Telegram kullanıcı adını açığa çıkarması gerekir.
  - Kararlı bottan-bota gözlem için, `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode’u etkinleştirin ve driver botunun gruptaki bot trafiğini gözlemleyebildiğinden emin olun.
  - Bir Telegram QA raporu, özeti ve gözlemlenen mesajlar artefaktını `.artifacts/qa-e2e/...` altına yazar.

Live taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapmaz:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve live
taşıma kapsam matrisinin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sürdürme | Thread takip yanıtı | Thread izolasyonu | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | ------------------------- | ------------------- | ----------------- | ------------- | -------------- |
| Matrix   | x      | x              | x               | x               | x                         | x                   | x                 | x             |                |
| Telegram | x      |                |                 |                 |                           |                     |                   |               | x              |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab bir Convex destekli havuzdan özel bir kiralama alır, hat çalışırken bu
kiralamaya heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (varsayılan `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

Normal çalışmada `OPENCLAW_QA_CONVEX_SITE_URL` `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele)
özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer’lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcı araçlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca maintainer secret)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload’ları reddeder.

### QA’ye bir kanal ekleme

Bir kanalı Markdown QA sistemine eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adaptörü.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host akışın sahibi olabiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve sonlandırma
- worker eşzamanlılığı
- artefakt yazımı
- rapor üretimi
- senaryo yürütümü
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin’leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır oluş durumunun nasıl kontrol edildiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transkriptlerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma-özel sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için minimum benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`’ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` host seam’i üzerinde uygulayın.
3. Taşıma-özel mekanikleri çalıştırıcı plugin’i veya kanal harness’i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin’leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve çalıştırıcı yürütümü ayrı giriş noktalarının arkasında kalmalıdır.
5. `qa/scenarios/` altında Markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, bunu o çalıştırıcı plugin’inde veya plugin harness’inde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşıma-özel tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

Yeni senaryolar için tercih edilen genel yardımcı adları şunlardır:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Mevcut senaryolar için uyumluluk takma adları kullanılmaya devam eder, bunlar arasında şunlar vardır:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bir “flag day” geçişini önlemek için vardır; yeni senaryo yazımı
için model olarak kullanılmaları amaçlanmamıştır.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on adet sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan allowlist içindeki `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi entegrasyon testleri (gateway auth, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedef belirtilmemiş `pnpm test` artık tek bir devasa yerel root-project süreci yerine on bir daha küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS’yi azaltır ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel root `vitest.config.ts` proje grafiğini kullanır, çünkü çoklu shard watch döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam root proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri ise yine geniş root-project tekrar çalıştırmasına döner.
  - Agent’lar, komutlar, plugin’ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import yükü hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durumlu/runtime yükü ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketi yeniden çalıştırmaz.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj-aracı keşif girdilerini veya compaction runtime bağlamını değiştirdiğinizde, kapsamanın her iki düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı entegrasyon paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yolları üzerinden hâlâ aktığını doğrular; yalnızca yardımcı testleri bu entegrasyon yolları için yeterli bir ikame değildir.
- Pool notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` sabitler ve root projeler, e2e ve live yapılandırmaları genelinde izole olmayan çalıştırıcıyı kullanır.
  - Root UI hattı `jsdom` kurulumunu ve optimizer’ını korur, ancak artık o da paylaşılan izole olmayan çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` shard’ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme yükünü azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` de ekler. Stok V8 davranışıyla karşılaştırma yapmanız gerekirse `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel iterasyon notu:
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz biçimde eşlendiğinde kapsamlı hatlar üzerinden yönlendirilir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek worker sınırıyla.
  - Yerel worker otomatik ölçekleme artık bilerek daha muhafazakârdır ve host load average zaten yüksek olduğunda da geri çekilir; böylece aynı anda birden fazla Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması proje/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler; böylece test kablolaması değiştiğinde changed-mode tekrar çalıştırmaları doğru kalır.
  - Yapılandırma, desteklenen host’larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil çıkarma için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profil görünümünü `origin/main` sonrası değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş `test:changed` çalıştırmasını o commit edilmiş diff için yerel root-project yoluyla karşılaştırır ve wall time ile macOS max RSS yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve root Vitest yapılandırması üzerinden yönlendirerek mevcut kirli ağacı benchmark eder.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, unit paketi için dosya paralelliği devre dışıyken çalıştırıcı CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Runtime varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir worker’lar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çoklu instance gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ kullanımı
- Beklentiler:
  - CI içinde çalışır (pipeline’da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Docker üzerinden host üzerinde izole bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile’dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw’ın OpenShell backend’ini çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway’ini ve sandbox’ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary’sini veya wrapper script’i göstermek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkindir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, tool-calling tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI açısından kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmak tercih edilir
- Live çalıştırmaları, eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak live çalıştırmaları yine de `HOME` dizinini izole eder ve yapılandırma/auth materyalini geçici bir test home’una kopyalar; böylece unit fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını bilerek istiyorsanız yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap loglarını/Bonjour gürültüsünü susturur. Tam başlatma loglarını geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özel): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler rate limit yanıtlarında yeniden dener.
- İlerleme/heartbeat çıktısı:
  - Live paketleri artık ilerleme satırlarını stderr’e yazar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessiz olsa bile görünür biçimde aktif kalır.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırları live çalıştırmalar sırasında anında aksın diye Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz ayrıca `pnpm test:coverage`)
- Gateway ağı / WS protokolü / eşleştirme yüzeylerine dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özel arızalar / tool-calling hata ayıklaması yapıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından şu anda **ilan edilen her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Önkoşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut komut gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlanmış ve gateway ile eşleştirilmiş olmalıdır.
  - Uygulama ön planda tutulmalıdır.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalıdır.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testleri, arızaları izole edebilmemiz için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+agent hattının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi hâlde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlar
- Modeller nasıl seçilir:
  - Modern allowlist’i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API’si bozuk / anahtar geçersiz” ile “gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, izole regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + geliştirme agent smoke (`@openclaw`’ın gerçekten yaptığı şey)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarı olan modeller üzerinde dönüp şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (`read` probu)
    - isteğe bağlı ek araç probları (`exec+read` probu)
    - OpenAI regresyon yollarının (`yalnızca tool-call → takip`) çalışmaya devam etmesi
- Probe ayrıntıları (böylece hataları hızlıca açıklayabilirsiniz):
  - `read` probu: test, çalışma alanına bir nonce dosyası yazar ve agent’tan bunu `read` etmesini ve nonce’u geri yansıtmasını ister.
  - `exec+read` probu: test, agent’tan bir nonce’u geçici bir dosyaya `exec` ile yazmasını, sonra geri `read` etmesini ister.
  - görüntü probu: test, oluşturulmuş bir PNG’yi (cat + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgülle ayrılmış liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey”den kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + görüntü probları bu live testte her zaman açıktır:
  - `read` probu + `exec+read` probu (araç stresi)
  - görüntü probu, model görüntü girdisi desteğini ilan ettiğinde çalışır
  - Akış (yüksek seviye):
    - Test, “CAT” + rastgele kod ile küçük bir PNG oluşturur (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI backend kullanarak Gateway + agent hattını doğrulamak.
- Backend’e özgü smoke varsayılanları, sahibi olan extension’ın `cli-backend.ts` tanımında bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görüntü davranışı, sahibi olan CLI backend plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Görüntü dosyası yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görüntü argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum sürekliliği probunu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model bir geçiş hedefini desteklediğinde zorla açmak için `1` ayarlayın).

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

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` içinde bulunur.
- Live CLI-backend smoke testini repo Docker görüntüsü içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahibi olan extension’dan CLI smoke meta verisini çözümler, sonra eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içindeki önbelleklenmiş yazılabilir bir prefix’e kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth’u gerektirir; bu da ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` üzerinden ya da `claude setup-token` içinden `CLAUDE_CODE_OAUTH_TOKEN` ile sağlanır. Önce Docker içinde doğrudan `claude -p` çağrısını doğrular, sonra Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI-backend turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik plan sınırları yerine ek kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve görüntü problarını varsayılan olarak devre dışı bırakır.
- Live CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görüntü sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke testi ayrıca oturumu Sonnet’ten Opus’a yamar ve sürdürülmüş oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: gerçek ACP konuşma-bind akışını canlı bir ACP agent ile doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bind et
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takip mesajının bind edilmiş ACP oturum transkriptine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent’lar: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent’ı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin dışarı teslim ediliyormuş gibi davranmadan message-channel bağlamı ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmadığında test, seçilen ACP harness agent için gömülü `acpx` plugin’inin yerleşik agent kayıt defterini kullanır.

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

Tek agent’lı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` içinde bulunur.
- Varsayılan olarak ACP bind smoke testini tüm desteklenen live CLI agent’lara sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynağa alır, eşleşen CLI auth materyalini container içine taşır, `acpx`’i yazılabilir bir npm prefix’ine kurar, sonra eksikse istenen live CLI’ı (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynağa alınan profildeki sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

## Live: Codex app-server harness smoke

- Amaç: plugin sahibi Codex harness’i normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` plugin’ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` modeline ilk gateway agent turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve app-server
    thread’inin sürdürülebildiğini doğrula
  - `/codex status` ve `/codex models` komutlarını aynı gateway komut
    yolu üzerinden çalıştır
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı görüntü probu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probu: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness sessizce PI’ye geri düşerek testi geçemez.
- Auth: shell/profilden gelen `OPENAI_API_KEY`, ayrıca isteğe bağlı kopyalanan
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

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` içinde bulunur.
- Bağlanan `~/.profile` dosyasını kaynağa alır, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  auth dosyalarını kopyalar, `@openai/codex` paketini yazılabilir, bağlanan bir npm
  prefix’ine kurar, kaynak ağacını hazırlar ve ardından yalnızca Codex-harness live testini çalıştırır.
- Docker görüntü ve MCP/araç problarını varsayılan olarak etkinleştirir.
  Daha dar bir hata ayıklama çalıştırması gerektiğinde
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, live
  test yapılandırmasıyla eşleşir; böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen live tarifleri

Dar, açık allowlist’ler en hızlı ve en az oynak olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcıda tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API’yi kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI’ı kullanır (ayrı auth + araç davranışı farkları).
- Gemini API ile Gemini CLI farkı:
  - API: OpenClaw, Google’ın barındırdığı Gemini API’yi HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` binary’sini shell üzerinden çağırır; kendine ait auth’u vardır ve farklı davranabilir (streaming/araç desteği/sürüm kayması).

## Live: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live isteğe bağlıdır), ancak anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (tool calling + görüntü)

Çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile gateway smoke çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: tool calling (Read + isteğe bağlı Exec)

Her sağlayıcı ailesi için en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olursa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz araç yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; tool calling API moduna bağlıdır)

### Vision: görüntü gönderme (ek → çok modlu mesaj)

Görüntü probunu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü destekli model ekleyin (Claude/Gemini/OpenAI’nin vision destekli varyantları vb.).

### Toplayıcılar / alternatif gateway’ler

Anahtarlarınız etkinse, şu yollarla da test etmeyi destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile auth)

Live matrisine dahil edebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu tüm proxy’ler (LM Studio, vLLM, LiteLLM vb.)

İpucu: dokümanlarda “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, live testler aynı anahtarları bulabilmelidir.
- Bir live test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini hata ayıklarken yaptığınız gibi hata ayıklayın.

- Agent başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denildiğinde kastedilen budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan live home içine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Live yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test home’una kopyalar; hazırlanan live home’lar `workspace/` ve `sandboxes/` dizinlerini atlar, ayrıca `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır; böylece problar gerçek host çalışma alanınızdan uzak kalır.

Env anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde export edildiyse), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram live (ses yazıya dökme)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmamışsa her yeteneği atlar
  - Comfy workflow gönderimi, polling, indirmeler veya plugin kaydını değiştirdikten sonra kullanışlıdır

## Görüntü üretimi live

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı plugin’ini numaralandırır
  - Problamadan önce eksik sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Stok görüntü üretimi varyantlarını paylaşılan runtime yeteneği üzerinden çalıştırır:
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
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik üretimi live

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’ı kapsar
  - Problamadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki runtime modunu da çalıştırır:
    - Yalnızca prompt girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy live dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi live

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak release-safe smoke yolunu kullanır: FAL olmayan sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster prompt’u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi release süresine baskın gelebileceği için FAL varsayılan olarak atlanır; bunu açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Problamadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen transform modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada buffer destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görüntü URL’si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak görüntü URL fixture’ı kullanan bir `kling` hattı ile birlikte `veo3` text-to-video çalıştırır
  - Mevcut `videoToVideo` live kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL’leri gerektiriyor
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü mevcut paylaşılan hatta kuruma özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dahil tüm sağlayıcıları dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video live paketlerini tek bir depoya özgü giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth’u olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux’ta çalışıyor” kontrolleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Live model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yalnızca eşleşen profil-anahtarı live dosyalarını repo Docker görüntüsü içinde çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynağa alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles`’dır.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam bir Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  özellikle istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker görüntüsünü bir kez `test:docker:live-build` ile oluşturur, ardından bunu iki live Docker hattı için yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Live model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth home’larını bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), ardından harici CLI OAuth’un host auth deposunu değiştirmeden token’ları yenileyebilmesi için bunları çalıştırma öncesinde container home’una kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent’ı: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Gateway ağı (iki container, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (tohumlanmış Gateway + stdio bridge + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin’ler (kurulum smoke + `/plugin` takma adı + Claude paketi yeniden başlatma semantiği): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Live model Docker çalıştırıcıları ayrıca mevcut checkout’ı salt okunur olarak bağlar ve
onu container içinde geçici bir workdir’e hazırlar. Bu, runtime
görüntüsünü ince tutarken yine de Vitest’i tam olarak yerel kaynak/yapılandırmanız üzerinde çalıştırır.
Hazırlama adımı, Docker live çalıştırmalarının makineye özgü artefaktları
dakikalarca kopyalamaması için `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve
uygulamaya özel `.build` veya Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama build çıktıları
atlanır.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live probları
container içinde gerçek Telegram/Discord vb. kanal worker’larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden
o Docker hattından gateway live kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de geçirin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları
etkin bir OpenClaw gateway container’ı başlatır,
bu gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` içinde `openclaw/default` modelinin sunulduğunu doğrular, ardından
Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma fark edilir derecede daha yavaş olabilir; çünkü Docker’ın
Open WebUI görüntüsünü çekmesi gerekebilir ve Open WebUI’nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Docker’laştırılmış çalıştırmalarda bunu sağlamak için
birincil yol `OPENCLAW_PROFILE_FILE`’dır
(varsayılan `~/.profile`).
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container’ı başlatır, `openclaw mcp serve` başlatan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini,
live olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP köprüsü üzerinden doğrular. Bildirim kontrolü,
ham stdio MCP frame’lerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK’sının
sunabildiğini değil, köprünün gerçekten ne yayımladığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script’i regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`), `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`), `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`), `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynağa alınır
- Yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynağa alınan env değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`; geçici yapılandırma/çalışma alanı dizinleri ve harici CLI auth bağlamaları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`), Docker içindeki önbellekli CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları, `/host-auth...` altında salt okunur olarak bağlanır, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden build gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` görüntüsünü yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env’den değil, profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce denetim prompt’unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI görüntü etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman tutarlılığı

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-safe)

Bunlar, gerçek sağlayıcılar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway tool calling (sahte OpenAI, gerçek gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırma + auth enforced yazar): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

CI-safe “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç testimiz zaten var:

- Gerçek gateway + agent döngüsü üzerinden sahte tool-calling (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt içinde listelendiğinde agent doğru skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor mu ve gereken adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, prompt injection).
- İsteğe bağlı live değerlendirmeler (isteğe bağlı, env ile geçitlenen), ancak CI-safe paket yerleştikten sonra.

## Contract testleri (plugin ve channel şekli)

Contract testleri, kayıtlı her plugin ve channel’ın
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin’ler üzerinde dönerek
şekil ve davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test`
unit hattı, bu paylaşılan seam ve smoke dosyalarını bilerek atlar; paylaşılan channel veya provider yüzeylerine
dokunduğunuzda contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract’lar: `pnpm test:contracts`
- Yalnızca channel contract’ları: `pnpm test:contracts:channels`
- Yalnızca provider contract’ları: `pnpm test:contracts:plugins`

### Channel contract’ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Channel eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası zorlaması

### Provider durum contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel durum probları
- **registry** - Plugin kayıt defteri şekli

### Provider contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/seçim mantığı
- **catalog** - Model katalog API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Provider runtime
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- `plugin-sdk` export’larını veya alt yollarını değiştirdikten sonra
- Bir channel veya provider plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfi yeniden düzenledikten sonra

Contract testleri CI içinde çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Live’da keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse bir CI-safe regresyon ekleyin (sahte/stub sağlayıcı veya tam istek şekli dönüşümünü yakalayın)
- Doğası gereği yalnızca live ise (rate limit’ler, auth politikaları), live testi dar ve env değişkenleriyle isteğe bağlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - provider istek dönüştürme/replay hatası → doğrudan model testi
  - gateway oturum/geçmiş/araç hattı hatası → gateway live smoke veya CI-safe gateway mock testi
- SecretRef dolaşım korkuluğu:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenen bir hedef türetir, ardından traversal-segment exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` fonksiyonunu güncelleyin. Test bilerek sınıflandırılmamış hedef kimliklerinde başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
