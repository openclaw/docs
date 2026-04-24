---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/canlı paketler, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-24T09:14:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw'ın üç Vitest paketi vardır (unit/integration, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi bulunur. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neyi kapsadığı (ve bilerek neyi kapsamadığı).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve model/sağlayıcıları nasıl seçtiği.
- Gerçek dünya model/sağlayıcı sorunları için nasıl regresyon ekleneceği.

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırma: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde çalışırken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü probe'ları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı probe çalıştırır.
    Meta verileri `image` girdisi bildiren modeller ayrıca küçük bir görüntü turu da çalıştırır.
    Sağlayıcı hatalarını izole ederken ek probe'ları
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre shard'lanmış ayrı Docker canlı model
    matrix işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true` ile dispatch edin.
  - Yeni yüksek sinyalli sağlayıcı secret'larını `scripts/ci-hydrate-live-auth.sh`
    dosyasına ve `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ile onun
    zamanlanmış/sürüm çağıranlarına ekleyin.
- Yerel Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server yoluna karşı bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik
    bir Slack DM'yi bağlar, `/codex fast` ve
    `/codex permissions` komutlarını dener, sonra düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel plugin binding üzerinden yönlendiğini doğrular.
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` ayarlıysa
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` için yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırması yapın. JSON çıktısının Moonshot/K2.6 raporladığını ve
  assistant dökümünün normalize edilmiş `usage.cost` sakladığını doğrulayın.

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan allowlist ortam değişkenleriyle daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'ı özel iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'lerde ve
manuel dispatch ile sahte sağlayıcılarla çalışır. `QA-Lab - All Lanes`, `main`
üzerinde gecelik ve manuel dispatch ile sahte parity gate, canlı Matrix hattı ve
Convex yönetimli canlı Telegram hattını paralel işler olarak çalıştırır. `OpenClaw Release Checks`
yayın onayından önce aynı hatları çalıştırır.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Birden fazla seçili senaryoyu varsayılan olarak yalıtılmış
    Gateway worker'ları ile paralel çalıştırır. `qa-channel` varsayılan olarak 4 eşzamanlılık kullanır (seçili senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel fixture ve protokol taklidi kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır; ancak senaryo farkındalıklı `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Guest'in bağlanmış çalışma alanı üzerinden geri yazabilmesi için çıktı dizinleri repo kökü altında kalmalıdır.
  - Normal QA raporu + özeti ve Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball derler, bunu
    Docker içinde global kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram'ı yapılandırır,
    plugin'i etkinleştirmenin çalışma zamanı bağımlılıklarını isteğe bağlı kurduğunu doğrular, doctor çalıştırır ve taklit edilmiş bir OpenAI
    uç noktasına karşı yerel bir agent turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde yayımlanmış bir OpenClaw paketi kurar, kurulu paket onboarding çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, sonra
    canlı Telegram QA hattını SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanır.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret'ını ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı varsa,
    Docker wrapper Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
  - GitHub Actions, bu hattı manuel maintainer iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge'de çalışmaz. İş akışı
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış halde Gateway'i başlatır, sonra paketli kanal/plugin'leri config düzenlemeleriyle etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış plugin çalışma zamanı bağımlılıklarını
    kurulu bırakmadığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketli plugin'in çalışma zamanı bağımlılıklarını isteğe bağlı kurduğunu ve ikinci yeniden başlatmanın zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temelini kurar, Telegram'ı
    `openclaw update --tag <candidate>` çalıştırmadan önce etkinleştirir ve adayın
    güncelleme sonrası doctor ile paketli kanal çalışma zamanı bağımlılıklarını harness tarafı postinstall onarımı olmadan onardığını doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA host şu anda yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları
    `qa-lab` ile gelmez, dolayısıyla `openclaw qa` sunmaz.
  - Repo checkout'ları paketli çalıştırıcıyı doğrudan yükler; ayrı plugin kurulumu gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ile bir özel oda oluşturur, sonra gerçek Matrix plugin'ini SUT taşıması olarak kullanan bir QA Gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel image'ı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanır. Farklı bir image test etmeniz gerekiyorsa `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, kullanıcıları yerel olarak tek kullanımlık oluşturduğu için paylaşılan kimlik bilgisi kaynağı bayraklarını açığa çıkarmaz.
  - Matrix QA raporunu, özeti, gözlenen olaylar artifact'ini ve birleşik stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını env'den alınan driver ve SUT bot token'larıyla gerçek özel bir gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış lease'lere dahil olmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir ve SUT botunun bir Telegram kullanıcı adı açığa çıkarması gerekir.
  - Kararlı botlar arası gözlem için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporunu, özetini ve gözlenen mesajlar artifact'ini `.artifacts/qa-e2e/...` altına yazar. Yanıtlama senaryoları, driver gönderim isteğinden gözlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve canlı
taşıma kapsam matrix'inin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde
QA lab, Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu
lease için Heartbeat gönderir ve kapanışta lease'i serbest bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için tek bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Havuz tükendi/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca maintainer secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin lease koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği string'i olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı payload'ları reddeder.

### QA'ya kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini deneyen bir senaryo paketi.

Paylaşılan `qa-lab` host akışın sahibi olabilecekken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniğinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve sonlandırma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>`'ın paylaşılan `qa` kökü altında nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazırlığın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- dökümlerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizlemenin nasıl işlendiği

Yeni bir kanal için minimum benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` host dikişi üzerinde uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı plugin'i veya kanal harness'i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen `qaRunnerCliRegistrations` dizisini dışa aktarmalıdır.
   `runtime-api.ts` hafif kalmalıdır; lazy CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Tematik `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa bunu o çalıştırıcı plugin'i veya plugin harness'i içinde tutun.
- Bir senaryonun birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyacı varsa `suite.ts` içinde kanala özgü dallanma yerine genel bir yardımcı ekleyin.
- Davranış yalnızca bir taşıma için anlamlıysa senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılabilir olmaya devam eder, bunlar arasında şunlar vardır:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bayrak günü tarzı bir geçişten kaçınmak içindir, yeni
senaryo yazımının modeli olmak için değil.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/unit envanterleri ve `vitest.unit.config.ts` kapsamındaki allowlist'lenmiş `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (Gateway auth, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
    <AccordionGroup>
    <Accordion title="Projeler, shard'lar ve kapsamlı hatlar"> - Hedeflenmemiş `pnpm test` çalıştırmaları, tek bir devasa yerel root-project süreci yerine on iki küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi azaltır ve auto-reply/extension çalışmalarının alakasız paketleri aç bırakmasını önler. - `pnpm test --watch`, çok shard'lı watch döngüsü pratik olmadığı için yine yerel root `vitest.config.ts` proje grafiğini kullanır. - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam root proje başlangıç maliyetini ödemez. - `pnpm test:changed`, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri yine geniş root-project yeniden çalıştırmasına geri düşer. - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel geçittir. Diff'i çekirdek, çekirdek testleri, extensions, extension testleri, apps, docs, sürüm meta verisi ve araçlar olarak sınıflandırır; ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için bir extension doğrulama geçişi içerir. Yalnızca sürüm meta verisi sürüm artırımları, üst düzey sürüm alanı dışındaki package değişikliklerini reddeden bir korumayla tam paket yerine hedefli sürüm/config/root-dependency denetimleri çalıştırır. - Agent'ler, komutlar, plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan gelen import hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattına yönlendirilir; durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır. - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaz. - `auto-reply` üç özel kovaya sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.
    </Accordion>

      <Accordion title="Gömülü çalıştırıcı kapsamı">
        - Message-tool discovery girdilerini veya Compaction çalışma zamanı
          bağlamını değiştirdiğinizde her iki kapsam düzeyini de koruyun.
        - Saf yönlendirme ve normalleştirme
          sınırları için odaklı yardımcı regresyonları ekleyin.
        - Gömülü çalıştırıcı integration paketlerini sağlıklı tutun:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek
          `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca yardımcı testleri
          bu integration yolları için yeterli bir ikame değildir.
      </Accordion>

      <Accordion title="Vitest havuzu ve yalıtım varsayılanları">
        - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
        - Paylaşılan Vitest yapılandırması `isolate: false` sabitler ve
          yalıtılmamış çalıştırıcıyı root projeler, e2e ve canlı yapılandırmalar genelinde kullanır.
        - Root UI hattı kendi `jsdom` kurulumu ve optimizer'ını korur, ama
          paylaşılan yalıtılmamış çalıştırıcıda da çalışır.
        - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
          varsayılanlarını devralır.
        - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8
          derleme yükünü azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` ekler.
          Stok V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
      </Accordion>

      <Accordion title="Hızlı yerel yineleme">
        - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
        - Pre-commit hook'u yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder
          ve lint, typecheck veya test çalıştırmaz.
        - Dar işlerde akıllı yerel geçide ihtiyaç duyduğunuzda
          teslim veya push öncesi `pnpm check:changed` komutunu açıkça çalıştırın. Genel Plugin SDK ve plugin-contract
          değişiklikleri bir extension doğrulama geçişi içerir.
        - `pnpm test:changed`, değişen yollar daha küçük bir pakete temizce eşleniyorsa
          kapsamlı hatlar üzerinden yönlendirme yapar.
        - `pnpm test:max` ve `pnpm test:changed:max`, aynı yönlendirme
          davranışını korur; yalnızca daha yüksek bir worker üst sınırıyla.
        - Yerel worker otomatik ölçekleme kasıtlı olarak temkinlidir ve host load average zaten yüksekse geri çekilir; böylece birden fazla eşzamanlı
          Vitest çalıştırması varsayılan olarak daha az zarar verir.
        - Temel Vitest yapılandırması proje/yapılandırma dosyalarını
          `forceRerunTriggers` olarak işaretler; böylece test kablolaması değiştiğinde changed-mode yeniden çalıştırmalar doğru kalır.
        - Yapılandırma, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar;
          doğrudan profil çıkarma için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
      </Accordion>

      <Accordion title="Performans hata ayıklama">
        - `pnpm test:perf:imports`, Vitest import süre raporlamasını ve
          import-breakdown çıktısını etkinleştirir.
        - `pnpm test:perf:imports:changed`, aynı profil görünümünü
          `origin/main`'den beri değişen dosyalara sınırlar.
        - Tek bir sıcak test zamanının çoğunu yine başlangıç import'larında harcıyorsa,
          ağır bağımlılıkları dar bir yerel `*.runtime.ts` dikişinin arkasında tutun ve
          bunları yalnızca `vi.mock(...)` içinden geçirmek için çalışma zamanı yardımcılarını derin import etmek yerine
          doğrudan o dikişi mock'layın.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
          `test:changed` çalıştırmasını o commit edilmiş diff için yerel root-project yolu ile karşılaştırır
          ve duvar süresi artı macOS maksimum RSS değerini yazdırır.
        - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
          `scripts/test-projects.mjs` ve root Vitest yapılandırması üzerinden yönlendirerek
          mevcut kirli ağacı ölçer.
        - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve dönüşüm yükü için
          ana iş parçacığı CPU profili yazar.
        - `pnpm test:perf:profile:runner`, unit paketi için dosya paralelliği devre dışıyken
          çalıştırıcı CPU+heap profilleri yazar.
      </Accordion>
    </AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Tanılamalar varsayılan olarak etkin olan gerçek bir local loopback Gateway başlatır
  - Sentetik Gateway mesajı, bellek ve büyük payload yükünü tanılama olay yolundan geçirir
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınır içinde kaldığını, sentetik RSS örneklerinin basınç bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar bir hat, tam Gateway paketinin yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketli plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Reponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol I/O yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Kullanışlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ davranışı
- Beklentiler:
  - CI'da çalışır (ardışık düzende etkin olduğunda)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Host üzerinde Docker aracılığıyla yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini dener
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test Gateway'i ve sandbox'ı yok eder
- Kullanışlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan CLI binary'sine veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketli plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, auth sorunlarını ve hız sınırı davranışını yakalamak
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “her şeyi” çalıştırmak yerine daraltılmış alt kümeleri tercih edin
- Canlı çalıştırmalar eksik API anahtarlarını almak için `~/.profile` kaynağını yükler.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home'una kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek home dizininizi kullanmasını yalnızca bilinçli olarak istediğinizde `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): `*_API_KEYS` değerini virgül/noktalı virgül biçiminde veya `*_API_KEY_1`, `*_API_KEY_2` olarak ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlı override için `OPENCLAW_LIVE_*_KEY` kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e yazar; böylece Vitest konsol yakalaması sessizken bile uzun sağlayıcı çağrılarının görünür şekilde etkin olduğu anlaşılır.
  - `vitest.live.config.ts`, Vitest konsol yakalamasını devre dışı bırakır; böylece sağlayıcı/Gateway ilerleme satırları canlı çalıştırmalar sırasında hemen akar.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Şu karar tablosunu kullanın:

- Mantığı/testleri düzenliyorsanız: `pnpm test` çalıştırın (çok değişiklik yaptıysanız `pnpm test:coverage` da)
- Gateway ağı / WS protokolü / eşleştirme alanlarına dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum kapalı” / sağlayıcıya özgü hatalar / araç çağırma sorunlarını hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrix'i, CLI backend smoke'ları, ACP smoke'ları, Codex app-server
harness'i ve tüm medya sağlayıcı canlı testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) ile canlı çalıştırmalar için kimlik bilgisi işleme hakkında
bkz. [Testing — live suites](/tr/help/testing-live).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" denetimleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker image'ı içinde yalnızca kendi eşleşen profil anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlayarak (ve bağlandıysa `~/.profile` kaynağını yükleyerek). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles`'tır.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Bilerek daha geniş kapsamlı tarama istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker image'ını bir kez `test:docker:live-build` ile derler, sonra bunu iki canlı Docker hattında yeniden kullanır. Ayrıca `test:docker:e2e-build` üzerinden tek bir paylaşılan `scripts/e2e/Dockerfile` image'ı derler ve bunu derlenmiş uygulamayı deneyen E2E container smoke çalıştırıcıları için yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha yüksek seviyeli integration yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home dizinlerini bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra harici CLI OAuth'un token'ları host auth deposunu değiştirmeden yenileyebilmesi için çalıştırma öncesi bunları container home'una kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent'i: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/agent smoke: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global kurar, env-ref onboarding ile OpenAI'yi ve varsayılan olarak Telegram'ı yapılandırır, doctor'ın etkinleştirilmiş plugin çalışma zamanı bağımlılıklarını onardığını doğrular ve taklit edilmiş bir OpenAI agent turu çalıştırır. Önceden derlenmiş bir tarball'ı `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, bunu yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketli görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden derlenmiş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `dist/` çıktısını derlenmiş bir Docker image'ından `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh`, kök, güncelleme ve doğrudan npm container'ları arasında tek bir npm önbelleği paylaşır. Güncelleme smoke'u, aday tarball'a yükseltmeden önce kararlı temel olarak varsayılan npm `latest` kullanır. Root olmayan installer denetimleri, root sahipli önbellek girdilerinin kullanıcı yerel kurulum davranışını maskelemesini önlemek için yalıtılmış npm önbelleği tutar. Yerel yeniden çalıştırmalar arasında kök/güncelleme/doğrudan-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen doğrudan-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamına ihtiyaç olduğunda betiği bu env olmadan yerelde çalıştırın.
- Gateway ağı (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), taklit edilmiş bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search`'ün `reasoning.effort` değerini `minimal`'dan `low`'a yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü kontrol eder.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio bridge + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (gerçek stdio MCP sunucusu + gömülü Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (gerçek Gateway + yalıtılmış Cron ve tek seferlik alt agent çalıştırmalarından sonra stdio MCP alt sürecini sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (install smoke + `/plugin` takma adı + Claude bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketli plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps`, varsayılan olarak küçük bir Docker çalıştırıcı image'ı derler, OpenClaw'ı host üzerinde bir kez derleyip paketler, sonra o tarball'ı her Linux kurulum senaryosuna bağlar. Image'ı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra host yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'a `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile işaret edin.
- Yineleme yaparken alakasız senaryoları devre dışı bırakarak paketli plugin çalışma zamanı bağımlılıklarını daraltın; örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan built-app image'ını elle önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü image geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan image'ı gösterdiğinde, image henüz yerelde değilse betikler bunu çeker. QR ve installer Docker testleri, paylaşılan built-app çalışma zamanı yerine package/install davranışını doğruladıkları için kendi Dockerfile'larını korur.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur bağlar ve
bunu container içinde geçici bir workdir'e aşamalar. Bu, çalışma zamanı
image'ını ince tutarken yine de Vitest'i tam sizin yerel kaynak/yapılandırmanıza karşı çalıştırır.
Aşamalama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve
uygulamaya özgü `.build` veya Gradle çıktı dizinleri gibi büyük yerel-only önbellekleri ve derleme çıktılarını atlar; böylece Docker canlı çalıştırmaları makineye özgü artifact'leri kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı probe'ları
container içinde gerçek Telegram/Discord vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattında Gateway canlı kapsamını daraltmanız veya dışlamanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.
`test:docker:openwebui`, daha yüksek seviyeli bir uyumluluk smoke testidir: Açık OpenAI uyumlu HTTP uç noktaları etkin olan bir
OpenClaw Gateway container'ı başlatır,
o Gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` içinde `openclaw/default` göründüğünü doğrular, sonra
gerçek bir sohbet isteğini Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker'ın
Open WebUI image'ını çekmesi ve Open WebUI'nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(Docker'lı çalıştırmalarda varsayılan `~/.profile`) bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` bilerek deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container'ı başlatır, sonra `openclaw mcp serve` oluşturan ikinci bir container başlatır,
ardından yönlendirilmiş konuşma keşfini, döküm okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi,
duman testi belirli bir istemci SDK'sının neyi yüzeye çıkardığını değil, köprünün gerçekte ne yaydığını doğrulasın diye
ham stdio MCP frame'lerini doğrudan inceler.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı
model anahtarı gerektirmez. Repo Docker image'ını derler, container içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü Pi bundle
MCP çalışma zamanı üzerinden somutlaştırır, aracı yürütür, sonra `coding` ve `messaging` yapılandırmalarının
`bundle-mcp` araçlarını tuttuğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` yapılandırmalarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model
anahtarı gerektirmez. Gerçek stdio MCP probe sunucusu olan tohumlanmış bir Gateway başlatır, yalıtılmış bir Cron turu ve `/subagents spawn` tek seferlik çocuk turu çalıştırır, sonra
MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Elle ACP düz dil thread smoke (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP thread yönlendirme doğrulaması için yine gerekebilir, bu yüzden silmeyin.

Kullanışlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` yoluna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` yoluna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` yoluna bağlanır ve testler çalıştırılmadan önce kaynağı yüklenir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, `OPENCLAW_PROFILE_FILE` içinden kaynaklanan yalnızca env değişkenlerini doğrulamak için geçici config/workspace dizinleri ve harici CLI auth bağlamaları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` yoluna bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları salt okunur şekilde `/host-auth...` altına bağlanır, sonra testler başlamadan önce `/home/node/...` altına kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Sağlayıcıları container içinde filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` image'ını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil, profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testinde Gateway'in açığa çıkaracağı modeli seçmek için `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce-check prompt'unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI image etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler akıl sağlığı

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek ardışık düzen” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config + auth enforced yazar): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

Zaten “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI için güvenli testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum bağlamasını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt içinde listelendiğinde agent doğru skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent, kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, skill dosyası okumalarını ve oturum bağlamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (opt-in, env ile kapılanmış), yalnızca CI için güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kaydedilen her plugin'in ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'leri yineleyip
şekil ve davranış doğrulamaları paketi çalıştırırlar. Varsayılan `pnpm test` unit hattı
bu paylaşılan seam ve smoke dosyalarını bilerek atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (`id`, `name`, `capabilities`)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probe'ları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/seçim mantığı
- **catalog** - Model katalog API'si
- **discovery** - Plugin discovery
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- Plugin-sdk dışa aktarımlarını veya alt yolları değiştirdikten sonra
- Bir kanal veya sağlayıcı plugin'i ekledikten veya değiştirdikten sonra
- Plugin kaydı veya discovery sürecini refactor ettikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarı gerektirmez.

## Regresyon ekleme (yönergeler)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek şekli dönüşümünü yakalayın)
- Doğası gereği yalnızca canlıya özgüyse (hız sınırları, auth ilkeleri), canlı testi dar ve env değişkenleriyle opt-in tutun
- Hatanın yakalandığı en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan model testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı smoke veya CI için güvenli Gateway sahte testi
- SecretRef traversal korkuluğu:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, sonra traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` fonksiyonunu güncelleyin. Test, yeni sınıfların sessizce atlanmaması için sınıflandırılmamış hedef kimliklerinde bilerek başarısız olur.

## İlgili

- [Testing live](/tr/help/testing-live)
- [CI](/tr/ci)
