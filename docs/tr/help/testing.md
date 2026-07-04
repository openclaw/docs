---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test takımları, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-07-04T04:03:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest paketine (birim/entegrasyon, e2e, canlı) ve küçük bir
Docker çalıştırıcı kümesine sahiptir. Bu belge bir "nasıl test ediyoruz"
kılavuzudur:

- Her paketin neleri kapsadığı (ve bilinçli olarak neleri _kapsamadığı_).
- Yaygın iş akışları (yerel, push öncesi, hata ayıklama) için hangi komutların çalıştırılacağı.
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için referans.
- [Olgunluk puan kartı](/tr/maturity/scorecard) - sürüm QA kanıtının kararlılık ve LTS kararlarını nasıl desteklediği.
- [QA kanalı](/tr/channels/qa-channel) - depo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin'i.

Bu sayfa, normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

## Test Geçici Dizinleri

Testlerin sahip olduğu geçici dizinler için `test/helpers/temp-dir.ts` içindeki
paylaşılan yardımcıları tercih edin. Sahipliği açık hale getirirler ve temizliği
aynı test yaşam döngüsünde tutarlar:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` bilinçli olarak elle temizlik yöntemi sunmaz; Vitest
her testten sonra temizliğin sahibidir. Henüz taşınmamış testler için mevcut
daha düşük seviyeli yardımcılar kalır, ancak yeni ve taşınmış testler otomatik
temizlenen izleyiciyi kullanmalıdır. Yeni elle `makeTempDir`, `cleanupTempDirs`
veya `createTempDirTracker` kullanımından ve ham temp-dir davranışını açıkça
doğrulayan bir durum olmadığı sürece testlerde yeni çıplak `fs.mkdtemp*`
çağrılarından kaçının. Bir test bilinçli olarak çıplak bir geçici dizine ihtiyaç
duyduğunda somut gerekçeli, denetlenebilir bir izin yorumu ekleyin:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Geçiş görünürlüğü için `node scripts/report-test-temp-creations.mjs`, mevcut
temizleme stillerini engellemeden eklenen diff satırlarındaki yeni çıplak
temp-dir oluşturmayı ve yeni elle paylaşılan-yardımcı kullanımını raporlar.
Dosya kapsamı, paylaşılan yardımcı uygulamasının kendisini atlayarak ayrı bir
test-yardımcı dosya adı sezgisini sürdürmek yerine `scripts/changed-lanes.mjs`
tarafından kullanılan aynı test-yolu sınıflandırmasını bilinçli olarak izler.
`check:changed`, değişen test yolları için bu raporu yalnızca uyarı olan bir CI
sinyali olarak çalıştırır; bulgular GitHub uyarı açıklamalarıdır, hata değildir.

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefle: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.5` agent dönüşü için
  `live_openai_candidate=true` veya Kova CPU/heap/trace yapıtları için
  `deep_profile=true` ile `OpenClaw Performance` gönderin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.5 hat
  yapıtlarını `openclaw/clawgrit-reports` içine yayımlar. Mock-provider raporu ayrıca
  kaynak düzeyinde Gateway başlatma, bellek, Plugin baskısı, tekrarlanan fake-model
  hello-loop ve CLI başlatma sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü ve küçük bir dosya-okuma tarzı prob çalıştırır.
    Metadatası `image` girdisini ilan eden modeller ayrıca küçük bir görüntü dönüşü çalıştırır.
    Sağlayıcı hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve elle
    `OpenClaw Release Checks`, ikisi de reusable canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre shard edilmiş ayrı Docker canlı model
    matrix işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `include_live_suites: true` ve
    `live_models_only: true` ile `OpenClaw Live And E2E Checks (Reusable)` gönderin.
  - Yeni yüksek-sinyalli sağlayıcı secret'larını `scripts/ci-hydrate-live-auth.sh`
    artı `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı-sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik
    bir Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını dener, ardından
    düz bir yanıtın ve bir görüntü ekinin ACP yerine yerel Plugin bağlaması üzerinden
    yönlendirildiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Plugin'in sahibi olduğu Codex app-server harness üzerinden Gateway agent dönüşleri çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, alt-agent ve Guardian problarını dener. Diğer Codex app-server hatalarını
    izole ederken alt-agent probunu `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile
    devre dışı bırakın. Odaklı bir alt-agent kontrolü için diğer probları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt-agent probundan sonra çıkar.
- Codex isteğe bağlı kurulum smoke testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tarball'ını Docker içinde kurar, OpenAI API-key
    onboarding'i çalıştırır ve Codex Plugin'i ile `@openai/codex` bağımlılığının
    isteğe bağlı olarak yönetilen npm proje köküne indirildiğini doğrular.
- Canlı Plugin araç bağımlılığı smoke testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığına sahip fixture Plugin'i paketler, `npm-pack:`
    üzerinden kurar, yönetilen npm proje kökü altında bağımlılığı doğrular,
    ardından canlı bir OpenAI modelinden Plugin aracını çağırmasını ve gizli slug'ı
    döndürmesini ister.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj-kanalı kurtarma komut yüzeyi için isteğe bağlı belt-and-suspenders kontrolü.
    `/crestodian status` komutunu dener, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` ile yanıtlar ve audit/config yazma yolunu doğrular.
- Crestodian planner Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir container'da çalıştırır
    ve bulanık planner fallback'inin denetlenen tipli bir config yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw state dir'den başlar, modern onboard Crestodian entrypoint'ini doğrular,
    setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular, config'i doğrular ve audit
    girdilerini doğrular. Aynı Ring 0 setup yolu QA Lab'de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile de kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` komutunu çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve assistant transkriptinin normalize edilmiş
  `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan allowlist env var'ları ile daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında durur:

CI, QA Lab'i özel iş akışlarında çalıştırır. Agentic eşdeğerlik, bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulamasının altında iç içedir. Geniş doğrulama,
`rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu
kullanmalıdır. Kararlı/varsayılan sürüm kontrolleri, kapsamlı canlı/Docker soak'ı
`run_release_soak=true` arkasında tutar; `full` profili soak'ı zorlar. `QA-Lab - All Lanes`
`main` üzerinde gecelik ve elle gönderimden mock parity hattı, canlı Matrix hattı,
Convex yönetimli canlı Telegram hattı ve Convex yönetimli canlı Discord hattı paralel işler
olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix'e açıkça `--profile fast` geçirirken,
Matrix CLI ve elle iş akışı girdisi varsayılanı `all` olarak kalır; elle gönderim `all` değerini
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard edebilir.
`OpenClaw Release Checks`, sürüm onayından önce parity ile hızlı Matrix ve Telegram hatlarını
çalıştırır; release transport kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece
deterministik kalırlar ve normal sağlayıcı-Plugin başlatmasını önlerler. Bu canlı taşıma
Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA parity paketleri tarafından
kapsanmaya devam eder.

Tam sürüm canlı medya shard'ları, zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı
model/backend shard'ları, seçilen commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` imajını kullanır, ardından her shard içinde
yeniden oluşturmak yerine `OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçilen senaryo kümesi için karma akış, Vitest ve Playwright senaryo
    seçimleri dahil olmak üzere üst düzey `qa-evidence.json`,
    `qa-suite-summary.json` ve `qa-suite-report.md` yapıtlarını yazar.
  - `pnpm openclaw qa run --qa-profile <profile>` tarafından tetiklendiğinde,
    seçilen taksonomi profili puan kartını aynı `qa-evidence.json` içine gömer.
    `smoke-ci`, `evidenceMode: "slim"` değerini ayarlayan ve giriş başına
    `execution` alanını atlayan ince kanıt yazar. `release`, seçilmiş sürüme
    hazır olma dilimini kapsar; `all`, her etkin olgunluk kategorisini seçer ve
    tam puan kartı yapıtı gerektiğinde açık QA Profile Evidence iş akışı
    tetiklemeleri için tasarlanmıştır.
  - Varsayılan olarak birden fazla seçili senaryoyu yalıtılmış gateway
    çalışanlarıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık
    4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Çalışan sayısını ayarlamak
    için `--concurrency <count>` veya eski seri hat için `--concurrency 1`
    kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalıklı `mock-openai` hattını değiştirmeden deneysel
    fixture ve protokol taklidi kapsamı için yerel AIMock destekli bir sağlayıcı
    sunucusu başlatır.
- `pnpm openclaw qa coverage --match <query>`
  - Senaryo kimliklerinde, başlıklarda, yüzeylerde, kapsam kimliklerinde, doküman
    referanslarında, kod referanslarında, Plugin'lerde ve sağlayıcı
    gereksinimlerinde arama yapar, ardından eşleşen suite hedeflerini yazdırır.
  - Dokunulan davranışı veya dosya yolunu bildiğiniz, ancak en küçük senaryoyu
    bilmediğiniz durumlarda QA Lab çalıştırmasından önce bunu kullanın. Bu
    yalnızca tavsiye niteliğindedir; mock, canlı, Multipass, Matrix veya taşıma
    kanıtını yine değiştirilen davranışa göre seçin.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin sınavını QA Lab üzerinden çalıştırır. Harici
    Kitchen Sink paketini kurar, Plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, Gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve hasmane tanılamaları kontrol eder.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir.
    Hazırlanmış Testbox oturumlarında, `openclaw-testbox-env` yardımcısı varsa
    Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak olarak alır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç ölçümünü ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` ile `--hot-wall-warn-ms`), bu nedenle kısa başlangıç
    sıçramaları dakikalar süren Gateway kilitlenme regresyonu gibi görünmeden
    metrik olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarını kullanır; çalışma kopyasında zaten güncel
    çalışma zamanı çıktısı yoksa önce derleme çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite'i tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama
    girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
    yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökünün altında kalmalıdır; böylece konuk, bağlı çalışma
    alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetinin yanı sıra Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA işi için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli çalışma kopyasından bir npm tarball derler, bunu Docker içinde genel
    olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır,
    varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin çalışma
    zamanının başlangıç bağımlılığı onarımı olmadan yüklendiğini doğrular,
    doctor çalıştırır ve taklit edilen bir OpenAI uç noktasına karşı bir yerel
    agent turu çalıştırır.
  - Aynı paketli kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı dökümleri için deterministik derlenmiş uygulama
    Docker smoke testi çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının
    görünür kullanıcı turuna sızmak yerine görüntülenmeyen özel bir mesaj olarak
    kalıcılaştırıldığını doğrular, ardından etkilenmiş bozuk bir oturum JSONL'i
    ekler ve `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala
    yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'i
    çalıştırır, Telegram'ı kurulu CLI üzerinden yapılandırır, ardından canlı
    Telegram QA hattını SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Sarmalayıcı, çalışma kopyasından yalnızca `qa-lab` test düzeneği kaynağını
    bağlar; kurulu paket `dist`, `openclaw/plugin-sdk` ve paketlenmiş Plugin
    çalışma zamanına sahip olur, böylece hat geçerli çalışma kopyası
    Plugin'lerini test edilen pakete karıştırmaz.
  - Varsayılan değer `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` olur;
    kayıt defterinden kurmak yerine çözümlenmiş yerel tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ile
    `qa-evidence.json` içinde yinelenen RTT zamanlaması üretir. RTT çalıştırmasını
    ayarlamak için `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` veya
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`, örneklenecek Telegram QA kontrol
    kimliklerinin virgülle ayrılmış listesini kabul eder; ayarlanmadığında
    varsayılan RTT uyumlu kontrol `telegram-mentioned-message-reply` olur.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir rol sırrı ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı varsa Docker
    sarmalayıcısı Convex'i otomatik olarak seçer.
  - Sarmalayıcı, Docker derleme/kurulum işinden önce ana makinede Telegram veya
    Convex kimlik bilgisi env değerlerini doğrular. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    değerini yalnızca kimlik bilgisi öncesi kurulumu kasıtlı olarak debug ederken
    ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
    Convex kimlik bilgileri seçildiğinde ve rol ayarlanmadığında, sarmalayıcı
    CI içinde `ci`, CI dışında `maintainer` kullanır.
  - GitHub Actions bu hattı manuel maintainer iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. İş akışı
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilen bir ref, yayımlanmış npm spec, SHA-256
  ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball yapıtı kabul
  eder, normalleştirilmiş `openclaw-current.tgz` dosyasını
  `package-under-test` olarak yükler, ardından smoke, package, product, full veya
  özel hat profilleriyle mevcut Docker E2E zamanlayıcısını çalıştırır. Telegram
  QA iş akışını aynı `package-under-test` yapıtına karşı çalıştırmak için
  `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
  - En son beta ürün kanıtı:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Tam tarball URL kanıtı bir digest gerektirir ve genel URL güvenlik politikasını
  kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/özel tarball aynaları açık bir güvenilen-kaynak politikası kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`, güvenilen iş akışı ref'inden `.github/package-trusted-sources.json`
okur ve URL kimlik bilgilerini ya da workflow-input özel ağ baypasını kabul etmez.
Adlandırılmış politika bearer auth bildiriyorsa sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN`
sırrını yapılandırın.

- Yapıt kanıtı, başka bir Actions çalıştırmasından tarball yapıtı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, Gateway'i
    OpenAI yapılandırılmış şekilde başlatır, ardından yapılandırma düzenlemeleri
    yoluyla paketlenmiş kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik her indirilebilir Plugin'i açıkça
    kurduğunu ve ikinci yeniden başlatmanın gizli bağımlılık onarımı
    çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm temel sürümü kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası
    doctor işleminin, test düzeneği taraflı postinstall onarımı olmadan eski
    Plugin bağımlılığı kalıntılarını temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels konukları genelinde yerel paketli kurulum güncelleme smoke testini
    çalıştırır. Seçilen her platform önce istenen temel paketi kurar, ardından
    aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü,
    güncelleme durumunu, Gateway hazır oluşunu ve bir yerel agent turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`,
    `--platform windows` veya `--platform linux` kullanın. Özet yapıt yolu ve hat
    başına durum için `--json` kullanın.
  - OpenAI hattı, canlı agent turu kanıtı için varsayılan olarak
    `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini kasıtlı olarak
    doğrularken `--model <provider/model>` geçin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels taşıma takılmalarının test penceresinin kalanını tüketmemesi için
    uzun yerel çalıştırmaları ana makine timeout'u içine alın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında
    yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`,
    `macos-update.log` veya `linux-update.log` dosyalarını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme işi içinde 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü
    ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı ayrı Parallels macOS, Windows veya Linux smoke
    hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri
    yükleme, paket sunma veya konuk Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt normal paketlenmiş Plugin yüzeyini çalıştırır; çünkü
    konuşma, görsel oluşturma ve medya anlama gibi yetenek facade'ları, agent
    turunun kendisi yalnızca basit bir metin yanıtını kontrol etse bile
    paketlenmiş çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol duman testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Tek kullanımlık Docker destekli bir Tuwunel homeserver üzerinde Matrix canlı QA hattını çalıştırır. Yalnızca kaynak checkout'u - paketlenmiş kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, ortam değişkenleri ve yapıt düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ortamdan gelen sürücü ve SUT bot token'larını kullanarak gerçek bir özel gruba karşı Telegram canlı QA hattını çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuz kiralamalarına katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar canary, mention geçitlemesi, komut adresleme, `/status`, bottan bota mention edilmiş yanıtlar ve çekirdek yerel komut yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve Telegram son ileti akışı regresyonlarını kapsar. `session_status` gibi isteğe bağlı yoklamalar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    yapıt istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot ve SUT botunun bir Telegram kullanıcı adı sunmasını gerektirir.
  - Kararlı bottan bota gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve `qa-evidence.json` yazar. Yanıt veren senaryolar, sürücü gönderim isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

`Mantis Telegram Live`, bu hattın etrafındaki PR kanıtı sarmalayıcısıdır. Aday ref'i Convex kiralamalı Telegram kimlik bilgileriyle çalıştırır, redakte edilmiş QA raporu/kanıt paketini Crabbox masaüstü tarayıcısında işler, MP4 kanıtı kaydeder, harekete göre kırpılmış bir GIF üretir, yapıt paketini yükler ve `pr_number` ayarlandığında Mantis GitHub App üzerinden satır içi PR kanıtı gönderir. Bakımcılar bunu Actions UI'dan `Mantis Scenario` (`scenario_id:
telegram-live`) aracılığıyla veya doğrudan bir pull request yorumundan başlatabilir:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`, PR görsel kanıtı için agentik yerel Telegram Desktop
öncesi/sonrası sarmalayıcısıdır. Bunu Actions UI'dan serbest biçimli
`instructions` ile, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) üzerinden veya bir PR yorumundan başlatın:

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent PR'ı okur, hangi Telegram'da görünen davranışın değişikliği
kanıtladığına karar verir, baseline ve aday ref'lerde gerçek kullanıcı Crabbox
Telegram Desktop kanıt hattını çalıştırır, yerel GIF'ler kullanışlı olana kadar yineler, eşlenmiş bir
`motionPreview` manifesti yazar ve `pr_number` ayarlandığında aynı 2 sütunlu GIF tablosunu
Mantis GitHub App üzerinden gönderir.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstünü kiralar veya yeniden kullanır, yerel Telegram Desktop'ı kurar, OpenClaw'u kiralanmış bir Telegram SUT bot token'ı ile yapılandırır, gateway'i başlatır ve görünür VNC masaüstünden ekran görüntüsü/MP4 kanıtı kaydeder.
  - Varsayılan olarak `--credential-source convex` kullanır; böylece iş akışları yalnızca Convex aracı sırrına ihtiyaç duyar. `pnpm openclaw qa telegram` ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenleriyle `--credential-source env` kullanın.
  - Telegram Desktop hâlâ bir kullanıcı oturumu/profili gerektirir. Bot token'ı yalnızca OpenClaw'u yapılandırır. base64 `.tgz` profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya `--keep-lease` kullanıp bir kez VNC üzerinden elle oturum açın.
  - Çıktı dizini altında `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4` yazar.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır; hat başına kapsam matrisi [QA genel bakış → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

Canlı taşıma QA için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralama için heartbeat gönderir ve kapanışta kiralamayı serbest bırakır. Bölüm adı Discord, Slack ve WhatsApp desteğinden daha eskidir; kiralama sözleşmesi türler arasında paylaşılır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı secret'larını,
endpoint önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini secret
değerlerini yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI
yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan endpoint sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Başarı: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca bakımcı secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

Telegram gerçek kullanıcı türü için payload şekli:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal dizeler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256` SHA-256 hex dizeleri olmalıdır.
- `kind: "telegram-user"` Mantis Telegram Desktop kanıt iş akışı için ayrılmıştır. Genel QA Lab hatları bunu almamalıdır.

Aracı tarafından doğrulanan çok kanallı payload'lar:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack hatları da havuzdan kiralama yapabilir, ancak Slack payload doğrulaması şu anda
aracı yerine Slack QA çalıştırıcısında bulunur. Slack satırları için
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
kullanın.

### QA'ya kanal ekleme

Yeni kanal adaptörleri için mimari ve senaryo yardımcısı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari eşik: taşıma çalıştırıcısını paylaşılan `qa-lab` host seam üzerinde uygulayın, plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve `qa/scenarios/` altında senaryolar yazın.

## Test paketleri (nerede ne çalışır)

Paketleri "artan gerçekçilik" (ve artan kırılganlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedefsiz çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki core/unit envanterleri; UI birim testleri ayrılmış `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway auth, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözücü ve genel yüzey yükleyici testleri, geniş `api.js` ve
    `runtime-api.js` fallback davranışını gerçek paketlenmiş plugin kaynak API'leriyle değil,
    üretilmiş küçük plugin fikstürleriyle kanıtlamalıdır. Gerçek plugin API yüklemeleri
    plugin'e ait sözleşme/entegrasyon paketlerinde yer alır.

Yerel bağımlılık ilkesi:

- Varsayılan test kurulumları isteğe bağlı yerel Discord opus derlemelerini atlar. Discord voice paketlenmiş `libopus-wasm` kullanır ve `@discordjs/opus`, yerel testlerin ve Testbox hatlarının yerel addon'ı derlememesi için `allowBuilds` içinde devre dışı kalır.
- Yerel opus performansını varsayılan OpenClaw kurulum/test döngülerinde değil, `libopus-wasm` benchmark reposunda karşılaştırın. Varsayılan `allowBuilds` içinde `@discordjs/opus` değerini `true` olarak ayarlamayın; bu, alakasız kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök-proje işlemi yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yoğun makinelerde tepe RSS değerini düşürür ve auto-reply/extension işlerinin ilgisiz paketleri kaynak açısından aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlangıç maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel denetim kapısıdır. Diff'i core, core testleri, extensions, extension testleri, apps, docs, release metadata, canlı Docker tooling ve tooling olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca release metadata içeren sürüm artışları hedefli version/config/root-dependency denetimleri çalıştırır ve üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard içerir.
    - Canlı Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: canlı Docker auth betikleri için shell sözdizimi ve canlı Docker scheduler dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlıysa dahil edilir; dependency, export, version ve diğer package yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzer saf utility alanlarındaki import açısından hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; stateful/runtime ağırlıklı dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri, o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış bucket'lara sahiptir. CI, ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import açısından ağır tek bir bucket tüm Node kuyruğunu üstlenmez.
    - Normal PR/main CI, extension batch sweep ve yalnızca release için olan `agentic-plugins` shard'ını bilinçli olarak atlar. Full Release Validation, release candidate'larında bu plugin/extension ağırlıklı paketler için ayrı `Plugin Prerelease` child workflow'unu dispatch eder.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Message-tool discovery girdilerini veya compaction runtime
      bağlamını değiştirdiğinizde, iki coverage düzeyini de koruyun.
    - Saf routing ve normalization sınırları için odaklı yardımcı regresyonları
      ekleyin.
    - Embedded runner entegrasyon paketlerini sağlıklı tutun:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` ve
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular; yalnızca yardımcı
      testler bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Temel Vitest config varsayılanı `threads` değeridir.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve
      kök projeler, e2e ve live config'ler genelinde izole olmayan runner'ı kullanır.
    - Kök UI hattı kendi `jsdom` setup ve optimizer ayarlarını korur, ancak o da
      paylaşılan izole olmayan runner üzerinde çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest config'ten aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 compile churn'ünü
      azaltmak için Vitest child Node işlemlerine varsayılan olarak `--no-maglev` ekler.
      Standart V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      ayarlayın.
    - `scripts/run-vitest.mjs`, açık non-watch Vitest çalıştırmalarını stdout veya stderr
      çıktısı olmadan 5 dakika sonra sonlandırır. Bilinçli olarak sessiz bir incelemede
      watchdog'u devre dışı bırakmak için `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`
      ayarlayın.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme içindir. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyaç duyduğunuzda, handoff veya push öncesinde
      `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. Yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş
      Vitest coverage gerektirdiğine karar verdiğinde `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`
      kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı routing davranışını korur,
      sadece daha yüksek worker sınırıyla çalışır.
    - Yerel worker otomatik ölçeklendirmesi bilinçli olarak muhafazakârdır ve host load average
      zaten yüksek olduğunda geri çekilir; böylece birden fazla eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test wiring değiştiğinde changed-mode yeniden çalıştırmalarının
      doğru kalması için projeleri/config dosyalarını `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini etkin tutar;
      doğrudan profiling için tek bir açık cache konumu istiyorsanız
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profiling görünümünü
      `origin/main` sonrasındaki değişen dosyalarla sınırlar.
    - Shard timing verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm-config çalıştırmaları anahtar olarak config yolunu kullanır; include-pattern CI
      shard'ları shard adını ekler, böylece filtrelenmiş shard'lar ayrı
      izlenebilir.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç import'larında harcıyorsa,
      ağır dependency'leri dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      runtime yardımcılarını sadece `vi.mock(...)` içinden geçirmek için deep-import etmek yerine
      o sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` çalıştırmasını o commit'lenmiş diff için yerel kök-proje yolu ile
      karşılaştırır ve wall time ile macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek mevcut
      kirli tree'yi benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıç ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış unit suite için
      runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Synthetic gateway message, memory ve large-payload churn'ünü diagnostic event yolu üzerinden sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle persistence yardımcılarını kapsar
  - Recorder'ın sınırlı kaldığını, synthetic RSS örneklerinin pressure budget altında kaldığını ve session başına queue depth'lerin tekrar sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Tam Gateway paketinin ikamesi değil, stability-regression takibi için dar bir hat

### E2E (repo aggregate)

- Komut: `pnpm test:e2e`
- Kapsam:
  - Gateway smoke E2E hattını çalıştırır
  - Mock'lanmış Control UI browser E2E hattını çalıştırır
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Playwright Chromium'un kurulu olmasını gerektirir

### E2E (gateway smoke)

- Komut: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki bundled-plugin E2E testleri
- Runtime varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Console I/O overhead'ini azaltmak için varsayılan olarak silent mode'da çalışır.
- Yararlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı console çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node pairing ve daha ağır networking
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlere göre daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E (Control UI mocked browser)

- Komut: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Dosyalar: `ui/src/**/*.e2e.test.ts`
- Kapsam:
  - Vite Control UI'ı başlatır
  - Playwright üzerinden gerçek bir Chromium sayfasını sürer
  - Gateway WebSocket'i deterministik tarayıcı içi mock'larla değiştirir
- Beklentiler:
  - `pnpm test:e2e` parçası olarak CI'da çalışır
  - Gerçek Gateway, agents veya provider anahtarları gerekmez
  - Browser dependency mevcut olmalıdır (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Etkin bir yerel OpenShell gateway'i yeniden kullanır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell backend'ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Etkin bir yerel OpenShell gateway ve onun config source'unu gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test sandbox'ını yok eder
- Yararlı override'lar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - Kayıtlı gateway config'ini izole teste açmak için `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - Host policy fixture tarafından kullanılan Docker gateway IP'sini override etmek için `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (gerçek provider'lar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketli Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakala
- Beklentiler:
  - Tasarım gereği CI açısından kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - "her şey" yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, zaten dışa aktarılmış API anahtarlarını ve hazırlanmış kimlik doğrulama profillerini kullanır.
- Varsayılan olarak canlı çalıştırmalar yine `HOME` ortamını izole eder ve birim fixture'larının gerçek `~/.openclaw` dizininizi değiştirememesi için yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek ana dizininizi kullanmasını bilerek istediğinizde ayarlayın.
- `pnpm test:live` varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur ve gateway başlatma günlüklerini/Bonjour konuşmalarını susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlı test başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY` ayarlayın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık stderr'e ilerleme satırları gönderir; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessiz olsa bile görünür şekilde etkin kalır.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının canlı çalıştırmalar sırasında hemen akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat aralıklarını `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat aralıklarını `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağ iletişimi / WS protokolü / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "botum çalışmıyor" / sağlayıcıya özgü hatalar / araç çağırma hata ayıklama: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç duman testleri, ACP duman testleri, Codex app-server
harness, tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness) ve canlı çalıştırmalar için kimlik bilgisi yönetimi için
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
plugin doğrulama kontrol listesi için
[Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi, çalışma alanınızı ve isteğe bağlı profil ortam dosyanızı bağlar. Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları, gerektiğinde kendi pratik sınırlarını korur:
  `test:docker:live-models` varsayılan olarak özenle seçilmiş desteklenen yüksek sinyalli kümeyi kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha küçük bir sınır veya daha büyük bir tarama istediğinizde `OPENCLAW_LIVE_MAX_MODELS`
  ya da gateway ortam değişkenlerini ayarlayın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez oluşturur, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` aracılığıyla npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Yalın imaj yalnızca kurulum/güncelleme/plugin bağımlılığı şeritleri için Node/Git çalıştırıcısıdır; bu şeritler önceden oluşturulmuş tarball'ı bağlar. İşlevsel imaj, yerleşik uygulama işlevselliği şeritleri için aynı tarball'ı `/app` içine kurar. Docker şerit tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yer alır; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yer alır; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını kontrol ederken kaynak sınırları ağır canlı, npm-install ve çok hizmetli şeritlerin aynı anda başlamasını engeller. Tek bir şerit etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalışır durumda tutar. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, eski OpenClaw E2E konteynerlerini kaldırır, her 30 saniyede bir durum yazdırır, başarılı şerit sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun şeritleri önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı şerit manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen şeritler, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" için GitHub'a özgü paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözer, bunu `package-under-test` olarak yükler, ardından yeniden kullanılabilir Docker E2E şeritlerini seçilen ref'i yeniden paketlemek yerine tam olarak o tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/plugin sözleşmesi, yayımlanmış yükseltme sağ kalan matrisi, sürüm varsayılanları ve hata triyajı için [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, statik yerleşik grafiği `dist/entry.js` ve `dist/cli/run-main.js` içinden yürür ve komut dağıtımından önce pre-dispatch başlangıcının Commander, prompt UI, undici veya günlükleme gibi paket bağımlılıklarını içe aktarması durumunda başarısız olur; ayrıca paketli gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk gateway yollarının statik içe aktarımlarını reddeder. Paketlenmiş CLI duman testi ayrıca kök yardım, onboard yardım, doctor yardım, durum, yapılandırma şeması ve model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu sınıra kadar harness yalnızca yayımlanmış paket meta veri boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik yama dosyaları, eksik kalıcı `update.channel`, eski plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi migrasyonu. `2026.4.25` sonrası paketlerde bu yollar katı hatadır.
- Konteyner duman çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek konteyner başlatır ve daha üst düzey entegrasyon yollarını doğrular.
- Paketlenmiş OpenClaw tarball'ını `scripts/lib/openclaw-e2e-instance.sh` üzerinden kuran Docker/Bash E2E şeritleri, `npm install` işlemini `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` ile sınırlar (varsayılan `600s`; hata ayıklamada sarmalayıcıyı devre dışı bırakmak için `0` ayarlayın).

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI kimlik doğrulama ana dizinlerini (veya çalıştırma daraltılmamışsa desteklenen tüm dizinleri) bind-mount eder, ardından dış CLI OAuth'un ana makine kimlik doğrulama deposunu değiştirmeden belirteçleri yenileyebilmesi için çalıştırmadan önce bunları konteyner ana dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; katı Droid/OpenCode kapsamı `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sağlanır)
- CLI arka uç duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testleri: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ve `pnpm qa:observability:smoke` özel QA kaynak checkout şeritleridir. npm tarball QA Lab'i atladığı için bilinçli olarak paket Docker sürüm şeritlerinin parçası değildirler.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, OpenAI'ı env-ref onboarding üzerinden ve varsayılan olarak Telegram'ı yapılandırır, doctor çalıştırır ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın ya da kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` veya `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.

- Sürüm kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-user-journey`, paketlenmiş OpenClaw tarball dosyasını temiz bir Docker home içinde genel olarak kurar, onboarding çalıştırır, taklit edilmiş bir OpenAI sağlayıcısını yapılandırır, bir agent turu çalıştırır, harici Plugin'leri kurar/kaldırır, ClickClack'i yerel bir fixture'a karşı yapılandırır, giden/gelen mesajlaşmayı doğrular, Gateway'i yeniden başlatır ve doctor çalıştırır.
- Sürüm tipli onboarding smoke testi: `pnpm test:docker:release-typed-onboarding`, paketlenmiş tarball dosyasını kurar, `openclaw onboard` komutunu gerçek bir TTY üzerinden yürütür, OpenAI'yi env-ref sağlayıcısı olarak yapılandırır, ham anahtar kalıcılığı olmadığını doğrular ve taklit edilmiş bir agent turu çalıştırır.
- Sürüm medya/bellek smoke testi: `pnpm test:docker:release-media-memory`, paketlenmiş tarball dosyasını kurar, bir PNG ekinden görüntü anlama, OpenAI uyumlu görüntü üretimi çıktısı, bellek arama hatırlaması ve Gateway yeniden başlatması boyunca hatırlamanın korunmasını doğrular.
- Sürüm yükseltme kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-upgrade-user-journey`, varsayılan olarak aday tarball dosyasından daha eski olan en yeni yayımlanmış baseline'ı kurar, yayımlanmış paket üzerinde sağlayıcı/Plugin/ClickClack durumunu yapılandırır, aday tarball dosyasına yükseltir, ardından çekirdek agent/Plugin/kanal yolculuğunu yeniden çalıştırır. Daha eski yayımlanmış baseline yoksa aday sürümü yeniden kullanır. Baseline'ı `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` ile geçersiz kılın.
- Sürüm Plugin marketplace smoke testi: `pnpm test:docker:release-plugin-marketplace`, yerel bir fixture marketplace'ten kurar, kurulu Plugin'i günceller, kaldırır ve kurulum metadata'sı budanmış halde Plugin CLI'sinin kaybolduğunu doğrular.
- Skill kurulum smoke testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tarball dosyasını Docker içinde genel olarak kurar, config içinde yüklenen arşiv kurulumlarını devre dışı bırakır, aramadan geçerli canlı ClawHub skill slug'ını çözer, `openclaw skills install` ile kurar ve kurulu skill ile `.clawhub` origin/lock metadata'sını doğrular.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball dosyasını Docker içinde genel olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası işin doğrulandığını kontrol eder, ardından paket `stable` kanalına geri döner ve güncelleme durumunu denetler.
- Yükseltme sağkalım smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball dosyasını agent'lar, kanal config'i, Plugin izin listeleri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları bulunan kirli bir eski kullanıcı fixture'ı üzerine kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından loopback Gateway başlatır ve config/durum korunumu ile başlatma/durum bütçelerini denetler.
- Yayımlanmış yükseltme sağkalım smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını tohumlar, bu baseline'ı gömülü bir komut reçetesiyle yapılandırır, ortaya çıkan config'i doğrular, bu yayımlanmış kurulumu aday tarball dosyasına günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korunumunu, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini denetler. Tek bir baseline'ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan tam yerel baseline'ları `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve issue biçimli fixture'ları `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; reported-issues kümesi otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Paket Kabulü bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta baseline token'larını çözer ve Tam Sürüm Doğrulaması, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olarak genişletir.
- Oturum runtime context smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime context transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun genel kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball dosyasını `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker image'dan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile `dist/` kopyalayın.
- Kurucu Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm cache paylaşır. Güncelleme smoke testi, aday tarball dosyasına yükseltmeden önce kararlı baseline olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu denetimleri izole bir npm cache tutar; böylece root sahipli cache girdileri kullanıcı yerel kurulum davranışını maskelemez. Yerel yeniden çalıştırmalarda root/update/direct-npm cache'ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm genel güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Agent'lar paylaşılan çalışma alanını siler CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak root Dockerfile image'ını derler, izole bir container home içinde tek çalışma alanına sahip iki agent tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Install-smoke image'ını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E image'ını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri, iframe referanslarını ve frame metadata'sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), taklit edilmiş bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` işlevinin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham ayrıntının Gateway log'larında göründüğünü denetler.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü OpenClaw profil allow/deny smoke testi): `pnpm test:docker:agent-bundle-mcp-tools` (betik: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (yerel path, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, bozuk npm paket metadata'sı, git moving refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmedi smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball dosyasını çıplak bir container içinde kurar, bir npm Plugin'i kurar, etkinleştirme/devre dışı bırakma arasında geçiş yapar, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından kaldırmanın eski durumu hâlâ kaldırdığını doğrular ve her yaşam döngüsü aşaması için RSS/CPU metriklerini log'lar.
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`, yerel path, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, git moving refs, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için değişmeyen güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlemeli npm Plugin kurulumu, etkinleştirme, devre dışı bırakma, yükseltme, düşürme ve eksik kod kaldırmayı kapsar.

Paylaşılan işlevsel image'ı elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü image geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan image'ı gösterdiğinde, betikler zaten yerelde değilse onu çeker. QR ve kurucu Docker testleri kendi Dockerfile'larını korur çünkü paylaşılan derlenmiş uygulama runtime'ı yerine paket/kurulum davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
container içinde geçici bir çalışma dizinine hazırlar. Bu, runtime
imajını yalın tutarken Vitest'i tam olarak yerel kaynak/config'inize karşı çalıştırır.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü
artefaktları kopyalamak için dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`,
`__openclaw_vitest__` ve uygulamaya yerel `.build` ya da Gradle çıktı dizinleri gibi
büyük, yalnızca yerel önbellekleri ve uygulama build çıktılarını atlar.
Ayrıca Gateway canlı yoklamalarının container içinde gerçek
Telegram/Discord/vb. kanal worker'larını başlatmaması için `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle Gateway
canlı kapsamını bu Docker hattından daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu
HTTP endpoint'leri etkinleştirilmiş bir OpenClaw Gateway container'ı başlatır,
bu Gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` çıktısının `openclaw/default` sunduğunu doğrular ve ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
Canlı model tamamlamasını beklemeden Open WebUI oturum açma ve model keşfinden sonra
durması gereken release yolu CI kontrolleri için `OPENWEBUI_SMOKE_MODE=models` ayarlayın.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI imajını çekmesi ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler. Bunu süreç ortamı,
hazırlanmış auth profilleri veya açık bir `OPENCLAW_PROFILE_FILE` üzerinden sağlayın.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload'u yazdırır.
`test:docker:mcp-channels` bilerek deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container'ı başlatır, `openclaw mcp serve` üreten ikinci bir container başlatır ve ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata'sını,
canlı event queue davranışını, outbound send yönlendirmesini ve gerçek stdio MCP bridge üzerinden
Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim kontrolü,
ham stdio MCP frame'lerini doğrudan inceler; böylece duman testi yalnızca belirli bir client SDK'nın
yüzeye çıkardığını değil, bridge'in gerçekten yaydığını doğrular.
`test:docker:agent-bundle-mcp-tools` deterministiktir ve canlı model anahtarı gerektirmez.
Repo Docker imajını build eder, container içinde gerçek bir stdio MCP probe server başlatır,
bu server'ı gömülü OpenClaw bundle MCP runtime üzerinden oluşturur,
aracı yürütür ve ardından `coding` ile `messaging` değerlerinin `bundle-mcp` araçlarını koruduğunu,
`minimal` ile `tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarı gerektirmez.
Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway başlatır, yalıtılmış bir
cron turn ve bir `sessions_spawn` tek seferlik child turn çalıştırır, ardından
MCP child process'inin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil thread duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regresyon/debug workflow'ları için tutun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir; bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` mount edilir ve testler çalıştırılmadan önce source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici config/workspace dizinleri kullanarak ve harici CLI auth mount'ları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden source edilen ortam değişkenlerini doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle manuel olarak override edin
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden build gerektirmeyen tekrar çalıştırmalar için mevcut bir `openclaw:local-live` imajını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` (ortamdan değil)
- Open WebUI duman testi için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI duman testi tarafından kullanılan nonce denetimi prompt'unu override etmek için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini override etmek için `OPENWEBUI_IMAGE=...`

## Dokümantasyon doğruluk kontrolü

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading kontrollerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Offline regresyon (CI açısından güvenli)

Bunlar gerçek sağlayıcılar olmadan "gerçek pipeline" regresyonlarıdır:

- Gateway tool calling (mock OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorlanır): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval'ları (skills)

Halihazırda "agent güvenilirlik eval'ları" gibi davranan birkaç CI açısından güvenli testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** skills prompt içinde listelendiğinde agent doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow sözleşmeleri:** araç sırasını, session geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki eval'lar önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve session wiring'i doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval'lar (opt-in, env-gated), yalnızca CI açısından güvenli paket hazır olduktan sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin'in ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugins üzerinde yineleme yapar ve
bir şekil ve davranış assertion paketi çalıştırır. Varsayılan `pnpm test` unit hattı,
bu paylaşılan seam ve duman testi dosyalarını bilerek atlar; paylaşılan kanal veya sağlayıcı
yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, name, capabilities)
- **setup** - Kurulum wizard sözleşmesi
- **session-binding** - Session binding davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Inbound mesaj işleme
- **actions** - Kanal action handler'ları
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Grup policy uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin registry şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Sağlayıcı runtime'ı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum wizard'ı

### Ne zaman çalıştırılır

- plugin-sdk export'larını veya subpath'lerini değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin'i ekledikten ya da değiştirdikten sonra
- Plugin registration veya discovery refactor'ından sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI açısından güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam request-shape dönüşümünü yakalama)
- Doğası gereği yalnızca canlıysa (rate limit'ler, auth policy'leri), canlı testi dar ve ortam değişkenleri üzerinden opt-in tutun
- Hata yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı request conversion/replay hatası → doğrudan model testi
  - Gateway session/history/tool pipeline hatası → Gateway canlı duman testi veya CI açısından güvenli Gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış hedef id'lerinde bilerek başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugins'i test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
