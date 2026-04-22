---
read_when:
    - Testleri yerelde veya CI içinde çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadığı alanlar'
title: Test etme
x-i18n:
    generated_at: "2026-04-22T04:23:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw'ın üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neyi kapsadığı (ve özellikle neyi _kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hatayı yinelediğinizde önce hedeflenmiş çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Coverage geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılarda/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + gateway araç/görsel yoklamaları): `pnpm test:live`
- Tek bir live dosyasını sessiz çalıştırın: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıysa
  `openclaw models list --provider moonshot --json` çalıştırın, sonra da
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve
  assistant transcript'inin normalize edilmiş `usage.cost` sakladığını doğrulayın.

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız varsa, live testleri aşağıda açıklanan allowlist ortam değişkenleriyle daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak seçilen birden çok senaryoyu yalıtılmış
    gateway worker'larıyla paralel çalıştırır. `qa-channel` varsayılanı eşzamanlılık 4'tür (seçilen
    senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat içinse `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel
    fixture ve protokol mock kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır; senaryo farkındalıklı
    `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini geçici bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçimi bayraklarını yeniden kullanır.
  - Live çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı config yolu ve mevcutsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır ki misafir bunları bağlanmış çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini de
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:bundled-channel-deps`
  - Mevcut OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış
    Gateway'i başlatır, ardından Telegram ve Discord'u config düzenlemeleriyle etkinleştirir.
  - İlk Gateway yeniden başlatmasının her paketle gelen kanal plugin'inin
    çalışma zamanı bağımlılıklarını isteğe bağlı kurduğunu ve ikinci yeniden başlatmanın
    zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen eski bir npm taban sürümünü kurar, aday
    `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın
    güncelleme sonrası doctor onarımının, harness tarafında postinstall onarımı olmadan
    paketle gelen kanal çalışma zamanı bağımlılıklarını düzelttiğini doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix live QA hattını geçici, Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA host bugün yalnızca repo/dev içindir. Paketlenmiş OpenClaw kurulumları
    `qa-lab` ile gelmez, dolayısıyla `openclaw qa` sunmaz.
  - Repo checkout'ları paketle gelen çalıştırıcıyı doğrudan yükler; ayrı bir plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda hazırlar, ardından gerçek Matrix plugin'i SUT taşıması olarak kullanılan bir QA gateway child başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel görseli `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanır. Başka bir görseli test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, paylaşılan kimlik bilgisi kaynağı bayraklarını sunmaz çünkü hat geçici kullanıcıları yerelde hazırlar.
  - Bir Matrix QA raporu, özet, observed-events artifact'i ve birleşik stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram live QA hattını env'den gelen driver ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuz kiralamalarını etkinleştirmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir; ayrıca SUT botu bir Telegram kullanıcı adı sunmalıdır.
  - Kararlı bottan bota gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Bir Telegram QA raporu, özet ve observed-messages artifact'ini `.artifacts/qa-e2e/...` altına yazar.

Live taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşıyıcılar sapmaz:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve live
taşıma kapsam matriksinin parçası değildir.

| Hat      | Canary | Bahsetme geçitlemesi | Allowlist engelleme | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | Thread takibi | Thread yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------------- | ------------------- | --------------- | --------------------------------- | ------------- | --------------- | ------------- | ------------- |
| Matrix   | x      | x                    | x                   | x               | x                                 | x             | x               | x             |               |
| Telegram | x      |                      |                     |                 |                                   |               |                 |               | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya heartbeat gönderir
ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Varsayılan env: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betikler ve CI yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı payload'ları reddeder.

### QA'ya bir kanal ekleme

Bir kanalı Markdown QA sistemine eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host akışın sahibi olabiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniğinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway'in bu taşıma için nasıl yapılandırıldığı
- hazırlığın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript'lerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma özelindeki sıfırlama veya temizliğin nasıl işlendiği

Yeni bir kanal için asgari benimseme çıtası:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` host seam'i üzerinde uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı plugin veya kanal harness'i içinde tutun.
4. Çakışan bir kök komut kaydetmek yerine çalıştırıcıyı `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; lazy CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında Markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo kasıtlı bir geçiş yapmadığı sürece mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa bunu ilgili çalıştırıcı plugin veya plugin harness'i içinde tutun.
- Bir senaryonun birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyacı varsa `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılmaya devam eder; bunlar arasında şunlar vardır:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları, bayrak günü tarzı bir geçişi önlemek içindir; yeni senaryo yazımı için model değildir.

## Test paketleri (neyin nerede çalıştığı)

Paketleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on adet sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/unit envanteri ve `vitest.unit.config.ts` kapsamında olan allowlist'li `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway kimlik doğrulama, yönlendirme, araçlar, ayrıştırma, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedefsiz `pnpm test` artık tek devasa yerel root-project süreci yerine on bir küçük shard config'i (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yoğun makinelerde tepe RSS'yi düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel root `vitest.config.ts` proje grafiğini kullanır, çünkü çoklu shard watch döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam root proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; config/kurulum düzenlemeleri hâlâ geniş root-project yeniden çalıştırmasına geri döner.
  - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel geçittir. Diff'i çekirdek, çekirdek testleri, extensions, extension testleri, apps, docs, sürüm meta verisi ve araçlar olarak sınıflandırır; ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri, extensions bu çekirdek sözleşmelere bağlı olduğundan extension doğrulamasını içerir. Yalnızca sürüm meta verisi içeren version bump'ları, üst düzey sürüm alanı dışındaki package değişikliklerini reddeden bir korumayla tam paket yerine hedefli version/config/root-dependency denetimleri çalıştırır.
  - Agent'ler, komutlar, plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import açısından hafif unit testleri `unit-fast` hattı üzerinden yönlenir; bu hat `test/setup-openclaw-runtime.ts` dosyasını atlar. Durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaz.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işlerini ucuz durum/parça/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirirken her iki kapsam düzeyini de koruyun.
  - Saf yönlendirme/normalizasyon sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı integration paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular; yalnızca yardımcı testler bu integration yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest config'i artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest config'i ayrıca `isolate: false` değerini sabitler ve root projeler, e2e ve live config'lerinde yalıtımsız çalıştırıcıyı kullanır.
  - Root UI hattı `jsdom` kurulumunu ve optimizer'ını korur, ancak artık o da paylaşılan yalıtımsız çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` shard'ı, paylaşılan Vitest config'inden aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için varsayılan olarak Vitest child Node süreçlerine `--no-maglev` de ekler. Standart V8 davranışıyla karşılaştırma yapmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
  - Pre-commit hook, staged format/lint işleminden sonra `pnpm check:changed --staged` çalıştırır; böylece yalnızca çekirdeğe ait commit'ler, extension'lara dönük genel sözleşmelere dokunmadıkları sürece extension test maliyeti ödemez. Yalnızca sürüm meta verisi commit'leri hedefli version/config/root-dependency hattında kalır.
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz biçimde eşlendiğinde kapsamlı hatlar üzerinden yönlenir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur; sadece worker üst sınırı daha yüksektir.
  - Yerel worker otomatik ölçeklendirmesi artık kasıtlı olarak daha tutucudur ve host load average zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest config'i, test kablolaması değiştiğinde changed-mode yeniden çalıştırmaların doğru kalması için proje/config dosyalarını `forceRerunTriggers` olarak işaretler.
  - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profilleme için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, o commit edilmiş diff için yönlendirilmiş `test:changed` ile yerel root-project yolunu karşılaştırır ve duvar süresi ile macOS max RSS'yi yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, mevcut kirli ağacı değişen dosya listesini `scripts/test-projects.mjs` ve root Vitest config üzerinden yönlendirerek kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve dönüştürme yükü için ana thread CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış unit paketi için çalıştırıcı CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Çalışma zamanı varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlamalı worker kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI içinde çalışır (pipeline'da etkinse)
  - Gerçek anahtar gerekmez
  - Unit testlerine göre daha çok hareketli parça vardır (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Host üzerinde Docker aracılığıyla yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs bridge aracılığıyla remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca katılımlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'ine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model _bugün_ gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve oran sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / oran sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri tercih edin
- Live çalıştırmalar eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak alır.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home'una kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını bilerek istiyorsanız yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gevezeliğini susturur. Tam başlatma günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler oran sınırı yanıtlarında yeniden dener.
- İlerleme/heartbeat çıktısı:
  - Live paketleri artık uzun sağlayıcı çağrılarının Vitest konsol yakalaması sessizken bile görünür şekilde etkin olması için ilerleme satırlarını stderr'e yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının live çalıştırmalar sırasında anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/yoklama heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağı / WS protokolü / eşleştirmeye dokunuyorsanız: buna `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü hatalar / araç çağırma sorunlarını hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından **şu anda ilan edilen her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı + gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testler, hataları yalıtabilmek için iki katmana ayrılır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+agent hattının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgilerine sahip olduğunuz modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlanır
- Model seçimi:
  - Modern allowlist'i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API bozuk / anahtar geçersiz” ile “gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + dev agent smoke (yani "@openclaw" gerçekte ne yapıyor)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılması)
  - Anahtarı olan modeller üzerinde dolaşmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yollarının (yalnızca tool-call → takip) çalışmaya devam etmesi
- Yoklama ayrıntıları (böylece hataları hızlı açıklayabilirsiniz):
  - `read` yoklaması: test çalışma alanına bir nonce dosyası yazar ve agent'ten bunu `read` ile okuyup nonce'ı geri yansıtmasını ister.
  - `exec+read` yoklaması: test agent'ten geçici bir dosyaya nonce yazmak için `exec`, sonra geri okumak için `read` ister.
  - Görsel yoklaması: test oluşturulmuş bir PNG ekler (kedi + rastgeleleştirilmiş kod) ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Model seçimi:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi (“OpenRouter her şey”den kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + görsel yoklamaları bu live testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stresi)
  - Görsel yoklaması, model görsel girdi desteği ilan ettiğinde çalışır
  - Akış (yüksek seviye):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI'ler)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan config'inize dokunmadan bir yerel CLI backend kullanarak Gateway + agent hattını doğrulamak.
- Backend'e özgü smoke varsayılanları, sahibi olan extension'ın `cli-backend.ts` tanımı içinde yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argümanlar/görsel davranışı, sahibi olan CLI backend plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir).
  - Görsel dosya yollarını istem enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci turu göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum süreklilik yoklamasını devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model değişim hedefini desteklediğinde zorla açmak için `1` ayarlayın).

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
- Live CLI-backend smoke testini repo Docker görseli içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahibi olan extension'dan CLI smoke meta verisini çözümler, ardından eşleşen Linux CLI package'ını (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) önbelleğe alınmış yazılabilir bir önek olan `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içine kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth'u gerektirir; bu ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` ya da `claude setup-token` içinden gelen `CLAUDE_CODE_OAUTH_TOKEN` ile sağlanmalıdır. Önce Docker içinde doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI-backend turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı limitleri yerine ek kullanım faturalandırmasına yönlendirdiği için Claude MCP/araç ve görsel yoklamalarını varsayılan olarak devre dışı bırakır.
- Live CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görsel sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamar ve sürdürülen oturumun daha önceki bir notu hâlâ hatırladığını doğrular.

## Live: ACP bağlama smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP agent ile gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takibin bağlı ACP oturumu transcript'ine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent'leri: `claude,codex,gemini`
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
  - Bu hat, testlerin harici teslimat yapıyormuş gibi davranmadan message-channel bağlamı ekleyebilmesi için yöneticiye özel sentetik kaynak yönlendirme alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse test seçilen ACP harness agent'i için gömülü `acpx` plugin'inin yerleşik agent kayıt defterini kullanır.

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

Tek agent'li Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` içinde bulunur.
- Varsayılan olarak ACP bağlama smoke testini desteklenen tüm canlı CLI agent'lerine sırayla çalıştırır: `claude`, `codex`, sonra `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynak alır, eşleşen CLI kimlik doğrulama materyalini container içine hazırlar, `acpx`'i yazılabilir bir npm önekine kurar, ardından eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynak alınan profildeki sağlayıcı env değişkenlerini child harness CLI için erişilebilir tutar.

## Live: Codex app-server harness smoke

- Amaç: plugin'e ait Codex harness'ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketle gelen `codex` plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk gateway agent turunu gönder
  - aynı OpenClaw oturumuna ikinci turu gönder ve app-server
    thread'inin sürdürülebildiğini doğrula
  - aynı gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştır
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı görsel yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness'i sessizce PI'a geri dönerek testi geçemez.
- Kimlik doğrulama: shell/profile'dan `OPENAI_API_KEY`, ayrıca isteğe bağlı olarak kopyalanan
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
- Bağlı `~/.profile` dosyasını kaynak alır, `OPENAI_API_KEY` geçirir, mevcutsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir, bağlanmış bir npm
  önekine kurar, kaynak ağacı hazırlar, sonra yalnızca Codex-harness live testini çalıştırır.
- Docker, görsel ve MCP/araç yoklamalarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama çalıştırması gerektiğinde
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, live
  test config'iyle eşleşir; böylece `openai-codex/*` veya PI geri dönüşü bir Codex harness
  regresyonunu gizleyemez.

### Önerilen live tarifleri

Dar, açık allowlist'ler en hızlı ve en az oynaktır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden çok sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...` Gemini API kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç farkları).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` binary'sini shell üzerinden çağırır; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (akış/araç desteği/sürüm kayması).

## Live: model matriksi (neyi kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live katılımlıdır), ancak anahtarları olan bir geliştirici makinede düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke kümesi (araç çağırma + görsel)

Çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex olmayan): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görselle gateway smoke çalıştırın:
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
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir modeli seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görsel gönderimi (ek → çok kipli mesaj)

Görsel yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görsel yetenekli model ekleyin (Claude/Gemini/OpenAI görsel yetenekli varyantları vb.).

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görsel yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Live matrikse ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/config'iniz varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelerde “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa live testlerin de aynı anahtarları bulması gerekir.
- Bir live test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız öyle hata ayıklayın.

- Agent başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denirken kastedilen budur)
- Config: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcutsa hazırlanan live home içine kopyalanır, ancak ana profil-anahtarı deposu bu değildir)
- Live yerel çalıştırmalar varsayılan olarak etkin config'i, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test home'una kopyalar; hazırlanan live home'lar `workspace/` ve `sandboxes/` dizinlerini atlar ve `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır; böylece yoklamalar gerçek host çalışma alanınızdan uzak kalır.

Env anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram live (ses yazıya dökme)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketle gelen comfy görsel, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy workflow gönderimi, yoklama, indirmeler veya plugin kaydı değiştirildikten sonra yararlıdır

## Görsel üretimi live

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görsel üretimi sağlayıcı plugin'ini numaralandırır
  - Yoklamadan önce eksik sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Stok görsel üretimi varyantlarını paylaşılan çalışma zamanı yeteneği üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Kapsanan mevcut paketle gelen sağlayıcılar:
  - `openai`
  - `google`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik üretimi live

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketle gelen müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax kapsanır
  - Yoklamadan önce sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy live dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi live

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketle gelen video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL olmayan sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem üst sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın olabildiği için FAL varsayılan olarak atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` kullanın
  - Yoklamadan önce sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilmiş dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görsel girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketle gelen `veo3` yalnızca metindir ve paketle gelen `kling` uzak görsel URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Bu dosya `veo3` text-to-video ve varsayılan olarak uzak görsel URL fixture'ı kullanan bir `kling` hattı çalıştırır
  - Mevcut `videoToVideo` live kapsamı:
    - Yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`; çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`; çünkü mevcut paylaşılan hat org'a özgü video inpaint/remix erişim garantilerinden yoksundur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramada FAL dahil her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Daha agresif bir smoke çalıştırması için sağlayıcı başına işlem üst sınırını azaltmak amacıyla `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya live harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görsel, müzik ve video live paketlerini repo-yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulamaya sahip sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux'ta çalışıyor” denetimleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Live-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker görseli içinde yalnızca eşleşen profil-anahtarı live dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` dosyasını kaynak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles`'tır.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker görselini `test:docker:live-build` ile bir kez derler, ardından bunu iki live Docker hattında yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins` bir veya daha fazla gerçek container başlatır ve daha yüksek düzeyli integration yollarını doğrular.

Live-model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home'larını bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra harici CLI OAuth'un host auth deposunu değiştirmeden token yenileyebilmesi için çalıştırmadan önce bunları container home'una kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, tam iskelet): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağı (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (seed edilmiş Gateway + stdio bridge + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin'ler (kurulum smoke + `/plugin` takma adı + Claude bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Live-model Docker çalıştırıcıları ayrıca mevcut checkout'u salt okunur olarak bağlar ve
container içinde geçici bir workdir içine hazırlar. Bu, çalışma zamanı
görselini ince tutarken yine de Vitest'i tam yerel kaynak/config'inize karşı çalıştırır.
Hazırlama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama derleme çıktıları atlar;
böylece Docker live çalıştırmaları makineye özgü artifact'leri kopyalamak için
dakikalar harcamaz.
Ayrıca gateway live yoklamalarının
container içinde gerçek Telegram/Discord vb. kanal worker'larını başlatmaması için `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattından gateway
live kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de geçirin.
`test:docker:openwebui`, daha yüksek düzeyli bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin bir
OpenClaw gateway container'ı başlatır,
o gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` içinde `openclaw/default` açığa çıktığını doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI görselini çekmesi gerekebilir ve Open WebUI kendi soğuk başlatma kurulumunu tamamlamak zorunda olabilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Docker'lı çalıştırmalarda bunu sağlamak için temel yol
`OPENCLAW_PROFILE_FILE`'dır
(varsayılan `~/.profile`).
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container'ı başlatır, ardından `openclaw mcp serve` başlatan ikinci bir container çalıştırır; sonra
gerçek stdio MCP köprüsü üzerinden yönlendirilmiş konuşma keşfi, transcript okumaları, ek meta verileri,
live olay kuyruğu davranışı, giden gönderim yönlendirmesi ve Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi,
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK'sının yüzeye çıkardığını değil,
köprünün gerçekten ne yaydığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için tutun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir; bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` içine bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` içine bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` içine bağlanır ve testler çalıştırılmadan önce kaynak alınır
- Yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynak alınan env değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`; geçici config/workspace dizinleri ve harici CLI auth bağlamaları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` içine bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur bağlanır, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılma için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut `openclaw:local-live` görselini yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından açığa çıkarılan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce-check istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI görsel etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler mantıklılık denetimi

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config + auth yazımlarını zorlar): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

Şimdiden “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz var:

- Gerçek gateway + agent döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve config etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** istemde Skills listelendiğinde agent doğru Skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, Skill dosyası okumalarını ve oturum kablolamasını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, istem enjeksiyonu).
- İsteğe bağlı live değerlendirmeler (katılımlı, env geçitli) yalnızca CI güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde dolaşır
ve bir şekil ve davranış doğrulamaları paketi çalıştırır. Varsayılan `pnpm test` unit hattı kasıtlı olarak
bu paylaşılan seam ve smoke dosyalarını atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda
sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası uygulama

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçme
- **catalog** - Model katalog API
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI içinde çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (kılavuz)

Live içinde keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek şekli dönüşümünü yakalama)
- Sorun doğası gereği yalnızca live ise (oran sınırları, kimlik doğrulama politikaları), live testi dar ve env değişkenleriyle katılımlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan modeller testi
  - gateway oturumu/geçmiş/araç hattı hatası → gateway live smoke veya CI güvenli gateway mock testi
- SecretRef geçiş koruması:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenen bir hedef türetir, sonra geçiş segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testte `classifyTargetClass` öğesini güncelleyin. Test kasıtlı olarak sınıflandırılmamış hedef kimliklerinde başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
