---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-18T08:32:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cdd2048ba58e606fd68703977c2b33000abdb1826b6589ce25a35c53468726a
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw’ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu belge, “nasıl test ediyoruz” kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Canlı testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünyadaki model/sağlayıcı sorunları için nasıl regresyon ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırma: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık eklenti/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görsel probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: Yalnızca tek bir başarısız duruma ihtiyacınız varsa, aşağıda açıklanan allowlist ortam değişkenleriyle canlı testleri daraltmayı tercih edin.

## QA'ye özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak birden çok seçili senaryoyu yalıtılmış Gateway worker’larıyla paralel çalıştırır; en fazla 64 worker veya seçili senaryo sayısı kadar. Worker sayısını ayarlamak için `--concurrency <count>`, eski seri hat için ise `--concurrency 1` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler. `aimock`, senaryo farkındalıklı `mock-openai` hattının yerini almadan deneysel fixture ve protokol-mock kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcutsa `CODEX_HOME`.
  - Çıktı dizinleri, misafirin bağlanmış çalışma alanı üzerinden geri yazabilmesi için depo kökü altında kalmalıdır.
  - Normal QA raporu + özeti ve ayrıca Multipass günlüklerini `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm openclaw qa aimock`
  - Yalnızca doğrudan protokol smoke testi için yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver’a karşı çalıştırır.
  - Bu QA host’u şu anda yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` göndermez, bu yüzden `openclaw qa` sunmazlar.
  - Repo checkout’ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir eklenti kurulum adımına gerek yoktur.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda sağlar; ardından gerçek Matrix eklentisini SUT taşıması olarak kullanan bir QA Gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerekiyorsa `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hat geçici kullanıcıları yerel olarak sağladığı için paylaşılan kimlik bilgisi kaynağı bayrakları sunmaz.
  - Matrix QA raporu, özeti, gözlemlenen olaylar artefaktı ve birleştirilmiş stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortamdaki driver ve SUT bot token’larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerekir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` desteklenir. Varsayılan olarak ortam modunu kullanın veya havuzlanmış lease’lere katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Aynı özel grupta iki farklı bot gerekir ve SUT bot’unun bir Telegram kullanıcı adı olmalıdır.
  - Kararlı bottan-bota gözlem için `@BotFather` içinde her iki botta da Bot-to-Bot Communication Mode’u etkinleştirin ve driver bot’un grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özeti ve gözlemlenen mesajlar artefaktını `.artifacts/qa-e2e/...` altına yazar.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve canlı taşıma kapsam matriksinin bir parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası devam | Thread devamı | Thread yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | ------------------------------ | ------------- | --------------- | -------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                              | x             | x               | x              |               |
| Telegram | x      |                |                 |                 |                                |               |                 |                | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu lease’e Heartbeat gönderir ve kapanışta lease’i serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Ortam varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (varsayılan `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer’lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `POST /admin/add` (yalnızca maintainer secret’ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret’ı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin lease koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret’ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload’ları reddeder.

### QA'ye kanal ekleme

Bir kanalı Markdown QA sistemine eklemek için tam olarak iki şey gerekir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host akışın sahibi olabiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artefakt yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Runner Plugin’leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway’in bu taşıma için nasıl yapılandırıldığı
- hazırlığın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transkriptlerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma-özel sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` kalmalı.
2. Taşıma runner’ını paylaşılan `qa-lab` host katmanında uygulayın.
3. Taşıma-özel mekanikleri runner Plugin veya kanal harness’i içinde tutun.
4. Runner’ı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Runner Plugin’leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden buna karşılık gelen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve runner yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında Markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde tek seferde ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o runner Plugin veya Plugin harness’inde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılmaya devam eder; bunlar şunları içerir:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları, bayrak günü tarzı bir geçişi önlemek için vardır; yeni senaryo yazımı için model olarak değil.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on adet sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/birim envanterleri ve `vitest.unit.config.ts` kapsamında yer alan allowlist’lenmiş `ui` node testleri
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulama, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI’da çalışır
  - Gerçek anahtarlar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedef belirtilmemiş `pnpm test`, artık tek dev bir yerel root-project süreci yerine on bir küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır; çünkü çoklu shard izleme döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam root project başlangıç maliyetini ödemez.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri ise yine geniş root-project yeniden çalıştırmasına geri düşer.
  - Agent’lar, komutlar, Plugin’ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardaki import açısından hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durumlu/runtime açısından ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketi yeniden çalıştırmaz.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır yanıt harness işlerini ucuz durum/parça/token testlerinden uzak tutar.
- Gömülü runner notu:
  - Mesaj-aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde, her iki kapsama düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü runner entegrasyon paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular; yalnızca yardımcı testleri bu entegrasyon yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` ayarlar ve kök projeler, e2e ve canlı yapılandırmalar genelinde izole edilmemiş runner kullanır.
  - Kök UI hattı kendi `jsdom` kurulumunu ve optimize edicisini korur, ancak artık paylaşılan izole edilmemiş runner üzerinde çalışır.
  - Her `pnpm test` shard’ı, aynı `threads` + `isolate: false` varsayılanlarını paylaşılan Vitest yapılandırmasından devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme churn’ünü azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` de ekler. Stok V8 davranışıyla karşılaştırma yapmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz şekilde eşleniyorsa kapsamlı hatlar üzerinden yönlendirir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek worker sınırıyla.
  - Yerel worker otomatik ölçekleme artık kasıtlı olarak daha muhafazakâr ve host load average zaten yüksek olduğunda da geri çekiliyor; böylece birden çok eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, test kablolaması değiştiğinde changed-mode yeniden çalıştırmalarının doğru kalması için proje/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen host’larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profilleme için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans-hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import dökümü çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, o commit edilmiş diff için yönlendirilmiş `test:changed` ile yerel root-project yolunu karşılaştırır ve duvar saati süresiyle macOS azami RSS değerini yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek mevcut kirli ağacı kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform ek yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış şekilde birim paketi için runner CPU+heap profilleri yazar.

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Runtime varsayılanları:
  - Deponun geri kalanıyla uyumlu olacak şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker’lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç ek yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI’da çalışır (hattayken etkinleştirildiğinde)
  - Gerçek anahtarlar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Ana makinede Docker üzerinden yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile’dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw’ın OpenShell backend’ini çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway’ini ve sandbox’ı yok eder
- Yararlı geçersiz kılmalar:
  - Testi daha geniş e2e paketi içinde elle çalıştırırken etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyası veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkindir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten gerçek kimlik bilgileriyle çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI’da kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Paraya mal olur / rate limit kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmak tercih edilir
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynağını yükler.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test home’una kopyalar; böylece birim fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek home dizininizi kasıtlı olarak kullanması gerektiğinde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini gizler ve Gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini yeniden görmek istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özel): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlıya özel geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler rate limit yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr’e yazar; böylece Vitest konsol yakalaması sessizken bile uzun sağlayıcı çağrılarının etkin olduğu görünür.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/Gateway ilerleme satırlarının anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat’lerini ayarlamak için `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Gateway/probe Heartbeat’lerini ayarlamak için `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/testler düzenleniyorsa: `pnpm test` çalıştırın (çok fazla değişiklik yaptıysanız `pnpm test:coverage` da)
- Gateway ağ iletişimi / WS protokolü / eşleştirme alanlarına dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Bot’um çalışmıyor” / sağlayıcıya özgü başarısızlıklar / araç çağırma sorunlarını ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node’un şu anda ilan ettiği **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut bazında Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı ve Gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke (profil anahtarları)

Canlı testler, hataları ayırabilmek için iki katmana bölünmüştür:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam Gateway+agent hattının o modelle çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model completion (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgilerinizin bulunduğu modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir completion çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, modern için takma ad) ayarlayın; aksi halde `pnpm test:live` komutunun Gateway smoke’a odaklı kalması için atlanır
- Modeller nasıl seçilir:
  - Modern allowlist’i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için ise pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve ortam fallback’leri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun varlık nedeni:
  - “Sağlayıcı API’si bozuk / anahtar geçersiz” ile “Gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonları içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + dev agent smoke (`@openclaw` gerçekte ne yapıyor)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir Gateway başlatmak
  - `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarı olan modeller üzerinde dolaşmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalıştığı (`read` probe)
    - isteğe bağlı ek araç probları (`exec+read` probe)
    - OpenAI regresyon yollarının (`tool-call-only → follow-up`) çalışmaya devam ettiği
- Probe ayrıntıları (başarısızlıkları hızlı açıklayabilmeniz için):
  - `read` probe: test, çalışma alanına nonce dosyası yazar ve agent’tan bunu `read` etmesini ve nonce’u geri yankılamasını ister.
  - `exec+read` probe: test, agent’tan bir nonce’u geçici bir dosyaya `exec` ile yazmasını, ardından bunu geri `read` etmesini ister.
  - image probe: test, oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için ise pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey” yaklaşımından kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + görsel probları bu canlı testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - Model görsel girdi desteğini ilan ettiğinde image probe çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI backend kullanarak Gateway + agent hattını doğrulamak.
- Backend’e özgü smoke varsayılanları, ilgili eklentinin sahip olduğu `cli-backend.ts` tanımıyla birlikte yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, ilgili CLI backend Plugin metadatasından gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Görsel dosya yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görsel argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci tur göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum süreklilik probe’unu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçili model bir geçiş hedefini destekliyorsa zorla açmak için `1` ayarlayın).

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

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumunda bulunur.
- Canlı CLI-backend smoke’u, repo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- İlgili eklentiden CLI smoke metadatasını çözer, sonra eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içinde önbelleklenmiş yazılabilir bir prefix’e kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth’u gerektirir; bu ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` üzerinden ya da `claude setup-token` içinden gelen `CLAUDE_CODE_OAUTH_TOKEN` ile sağlanır. Önce Docker içinde doğrudan `claude -p` komutunu doğrular, sonra Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI-backend turu çalıştırır. Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı limitleri yerine ek kullanım ücretlendirmesi üzerinden yönlendirdiği için bu abonelik hattı, varsayılan olarak Claude MCP/tool ve image problarını devre dışı bırakır.
- Canlı CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görsel sınıflandırma turu, ardından Gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke’u ayrıca oturumu Sonnet’ten Opus’a yamalar ve resume edilen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP agent ile gerçek ACP konuşma-bind akışını doğrulamak:
  - `/acp spawn <agent> --bind here` göndermek
  - sentetik bir message-channel konuşmasını yerinde bind etmek
  - aynı konuşma üzerinde normal bir devam mesajı göndermek
  - devam mesajının bind edilmiş ACP oturum transkriptine düştüğünü doğrulamak
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent’ları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi yapmadan message-channel bağlamı ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse, test seçili ACP harness agent için gömülü `acpx` eklentisinin yerleşik agent registry’sini kullanır.

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

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumunda bulunur.
- Varsayılan olarak ACP bind smoke’u tüm desteklenen canlı CLI agent’larına karşı sırayla çalıştırır: `claude`, `codex`, sonra `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` kaynağını yükler, eşleşen CLI kimlik doğrulama materyalini container’a taşır, `acpx`’i yazılabilir npm prefix’ine kurar, ardından istenen canlı CLI eksikse onu kurar (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`).
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynak alınmış profildeki sağlayıcı ortam değişkenlerini alt harness CLI için kullanılabilir tutar.

## Canlı: Codex app-server harness smoke

- Amaç: Plugin’in sahip olduğu Codex harness’ini normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` eklentisini yüklemek
  - `OPENCLAW_AGENT_RUNTIME=codex` seçmek
  - `codex/gpt-5.4` için ilk Gateway agent turunu göndermek
  - aynı OpenClaw oturumuna ikinci turu göndermek ve app-server
    thread’inin resume edebildiğini doğrulamak
  - `/codex status` ve `/codex models` komutlarını aynı Gateway komut
    yolu üzerinden çalıştırmak
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke, bozuk bir Codex
  harness’inin sessizce PI’a fallback yaparak başarılı görünememesi için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar.
- Kimlik doğrulama: shell/profile içinden `OPENAI_API_KEY`, ayrıca isteğe bağlı kopyalanmış
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

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumunda bulunur.
- Bağlanan `~/.profile` kaynağını yükler, `OPENAI_API_KEY` geçirir, mevcutsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış bir npm
  prefix’ine kurar, kaynak ağacını hazırlar, ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker, image ve MCP/tool problarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama çalıştırması gerektiğinde
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, canlı
  test yapılandırmasıyla eşleşir, böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar ve açık allowlist’ler en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden çok sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API’sini kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI’ı kullanır (ayrı kimlik doğrulama + araç kullanımı tuhaflıkları).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google’ın barındırılan Gemini API’sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikili dosyasını shell üzerinden çalıştırır; bunun kendi kimlik doğrulaması vardır ve farklı davranabilir (streaming/tool desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak geliştirici makinesinde anahtarlarla düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (araç çağırma + görsel)

Çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex olmayan): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görsel ile Gateway smoke çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz araç yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görsel gönderme (ek → çok kipli mesaj)

Image probe’u çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görsel yetenekli model ekleyin (Claude/Gemini/OpenAI görsel yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway’ler

Anahtarlarınız etkinse, şu yollarla test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görsel yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API) ve ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: Belgelerde “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler, kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, canlı testler de aynı anahtarları bulabilmelidir.
- Canlı test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde hata ayıklayın.

- Agent başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” ifadesinin anlamı budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan canlı home’a kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Canlı yerel çalıştırmalar, varsayılan olarak etkin yapılandırmayı, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen dış CLI kimlik doğrulama dizinlerini geçici bir test home’una kopyalar; hazırlanan canlı home’lar `workspace/` ve `sandboxes/` dizinlerini atlar ve probe’ların gerçek host çalışma alanınıza gitmemesi için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Ortam anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde export edilmişse), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görsel, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmamışsa her yeteneği atlar
  - Comfy workflow gönderimi, polling, indirmeler veya eklenti kaydı değiştirildikten sonra kullanışlıdır

## Görsel üretimi canlı

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görsel üretimi sağlayıcı eklentisini listeler
  - Probe’dan önce eksik sağlayıcı ortam değişkenlerini login shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Standart görsel üretim varyantlarını paylaşılan runtime yeteneği üzerinden çalıştırır:
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
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’ı kapsar
  - Probe’dan önce sağlayıcı ortam değişkenlerini login shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen her iki runtime modunu da çalıştırır:
    - yalnızca prompt girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm açısından güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster prompt’u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın çıkabildiği için FAL varsayılan olarak atlanır; bunu açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Probe’dan önce sağlayıcı ortam değişkenlerini login shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görsel girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metin desteklidir ve paketlenmiş `kling` uzak görsel URL’si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` text-to-video ve uzak görsel URL fixture’ı kullanan bir `kling` hattı çalıştırır
  - Şu anki `videoToVideo` canlı kapsamı:
    - seçilen model `runway/gen4_aleph` olduğunda yalnızca `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 başvuru URL’leri gerektiriyor
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü mevcut paylaşılan hatta kuruma özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dahil her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif smoke çalıştırması için sağlayıcı başına işlem sınırını düşürmek üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media canlı harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görsel, müzik ve video canlı paketlerini depo-yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` üzerinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux'ta çalışıyor” kontrolleri)

Bu Docker çalıştırıcıları iki kümeye ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil-anahtarı canlı dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` kaynağını yükler). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır, böylece tam Docker taraması uygulanabilir kalır:
  `test:docker:live-models`, varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway`, varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük, kapsamlı taramayı
  açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını bir kez `test:docker:live-build` ile oluşturur, sonra bunu iki canlı Docker hattında yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI kimlik doğrulama home dizinlerini (veya çalışma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalıştırmadan önce bunları container home’una kopyalar; böylece dış CLI OAuth, host kimlik doğrulama deposunu değiştirmeden token’ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (seed edilmiş Gateway + stdio bridge + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin’ler (kurulum smoke + `/plugin` takma adı + Claude-bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Canlı model Docker çalıştırıcıları ayrıca mevcut checkout’u salt okunur olarak bind-mount eder ve
bunu container içinde geçici bir workdir’e hazırlar. Bu, çalışma zamanı
imajını ince tutarken yine de Vitest’i tam yerel kaynak/yapılandırmanız üzerinde çalıştırır.
Hazırlama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama build çıktılarını atlar; böylece Docker canlı çalıştırmaları
makineye özgü artefaktları kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlar; böylece Gateway canlı probları
container içinde gerçek Telegram/Discord vb. kanal worker’larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
bu Docker hattında Gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de geçirin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke’udur: OpenAI uyumlu HTTP uç noktaları etkin bir
OpenClaw Gateway container’ı başlatır,
o Gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` üzerinde `openclaw/default` modelinin göründüğünü doğrular, ardından
Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma gözle görülür derecede daha yavaş olabilir; çünkü Docker’ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI kendi cold-start kurulumunu tamamlamak zorunda olabilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(Docker’lı çalıştırmalarda varsayılan olarak `~/.profile`) bunu sağlamak için birincil yoldur.
Başarılı çalıştırmalar genellikle `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels`, kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container’ı başlatır, sonra `openclaw mcp serve` çalıştıran ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transkript okumalarını, ek metadata’sını,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP köprüsü üzerinden doğrular. Bildirim kontrolü
ham stdio MCP framelerini doğrudan inceler; böylece smoke, yalnızca belirli bir istemci SDK’sının
yüzeye çıkardığını değil, köprünün gerçekten ne yaydığını doğrular.

Elle ACP sade dilli thread smoke (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynağı yüklenir
- Yalnızca `OPENCLAW_PROFILE_FILE` içinden yüklenen ortam değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`; geçici yapılandırma/çalışma alanı dizinleri ve harici CLI kimlik doğrulama mount’ları olmadan
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbellekli CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden build gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` imajını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin ortamdan değil profil deposundan gelmesini sağlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke tarafından kullanılan nonce-kontrol prompt’unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Dokümantasyon sağlamlık kontrolü

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrollerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (`wizard.start`/`wizard.next` üzerinden WS, yapılandırma + kimlik doğrulama yazımı zorlanır): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

Zaten “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI için güvenli testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt içinde Skills listelendiğinde, agent doğru Skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, kapılama, prompt injection).
- Yalnızca CI için güvenli paket yerleştirildikten sonra isteğe bağlı canlı değerlendirmeler (opt-in, env-gated).

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde yineleme yapar ve
şekil ile davranış doğrulamalarından oluşan bir paketi çalıştırır. Varsayılan `pnpm test` birim hattı
bu paylaşılan seam ve smoke dosyalarını kasıtlı olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine
dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup ilkesi zorlaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probları
- **registry** - Plugin registry şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/tercihi
- **catalog** - Model kataloğu API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- `plugin-sdk` export’larını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (kılavuz)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalama)
- Doğası gereği yalnızca canlıya özgüyse (rate limit’ler, kimlik doğrulama ilkeleri), canlı testi dar ve env var’larla opt-in olacak şekilde tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan model testi
  - Gateway oturum/geçmiş/araç hattı hatası → Gateway canlı smoke veya CI için güvenli Gateway mock testi
- SecretRef geçiş guardrail’i:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata’sından (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id’lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` fonksiyonunu güncelleyin. Test, yeni sınıfların sessizce atlanamaması için kasıtlı olarak sınıflandırılmamış hedef id’lerinde başarısız olur.
