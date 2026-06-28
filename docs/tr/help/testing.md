---
read_when:
    - Testleri yerelde veya CI’da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadıkları'
title: Test etme
x-i18n:
    generated_at: "2026-06-28T00:41:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest paketine (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri _kapsamadığı_).
- Yaygın iş akışları (yerel, push öncesi, hata ayıklama) için hangi komutların çalıştırılacağı.
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakış](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için başvuru.
- [Olgunluk puan kartı](/tr/maturity/scorecard) - sürüm QA kanıtının kararlılık ve LTS kararlarını nasıl desteklediği.
- [QA kanalı](/tr/channels/qa-channel) - depo destekli senaryolar tarafından kullanılan sentetik aktarım Plugin'i.

Bu sayfa, normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hatada yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

## Test Geçici Dizinleri

Testlerin sahip olduğu geçici dizinler için `test/helpers/temp-dir.ts` içindeki paylaşılan yardımcıları tercih edin. Bunlar sahipliği açık hale getirir ve temizliği aynı test yaşam döngüsünde tutar:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Bir test zaten bir yol dizisine veya kümesine sahipse `makeTempDir(tempDirs, prefix)` ve `cleanupTempDirs(tempDirs)` kullanın. Bir durum açıkça ham temp-dir davranışını doğrulamıyorsa testlerde yeni çıplak `fs.mkdtemp*` çağrılarından kaçının. Bir test kasıtlı olarak çıplak geçici dizine ihtiyaç duyduğunda somut bir nedenle denetlenebilir bir izin yorumu ekleyin:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Geçiş görünürlüğü için `node scripts/report-test-temp-creations.mjs`, mevcut temizleme stillerini engellemeden eklenen diff satırlarındaki yeni çıplak temp-dir oluşturmayı raporlar. Dosya kapsamı, paylaşılan yardımcı uygulamasının kendisini atlarken ayrı bir test-helper dosya adı sezgisini sürdürmek yerine `scripts/changed-lanes.mjs` tarafından kullanılan aynı test yolu sınıflandırmasını bilerek izler. `check:changed`, bu raporu değişen test yolları için yalnızca uyarı niteliğinde bir CI sinyali olarak çalıştırır; bulgular hata değil, GitHub uyarı anotasyonlarıdır.

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.5` aracı dönüşü için `live_openai_candidate=true` veya Kova CPU/heap/trace artefaktları için `deep_profile=true` ile `OpenClaw Performance` gönderin. Günlük zamanlanmış çalıştırmalar, `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.5 hat artefaktlarını `openclaw/clawgrit-reports` deposuna yayımlar. mock-provider raporu ayrıca kaynak düzeyinde gateway önyükleme, bellek, Plugin baskısı, yinelenen fake-model hello-loop ve CLI başlatma sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü ve küçük bir dosya okuma tarzı prob çalıştırır.
    Meta verisi `image` girdisi bildiren modeller ayrıca küçük bir görüntü dönüşü çalıştırır.
    Sağlayıcı hatalarını yalıtırken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre parçalara ayrılmış ayrı Docker canlı model
    matrix işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `include_live_suites: true` ve `live_models_only: true` ile
    `OpenClaw Live And E2E Checks (Reusable)` gönderin.
  - Yeni yüksek sinyalli sağlayıcı secret'larını `scripts/ci-hydrate-live-auth.sh` dosyasına,
    ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway aracı dönüşlerini Plugin'in sahip olduğu Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` doğrular ve varsayılan olarak görüntü,
    cron MCP, alt aracı ve Guardian problarını çalıştırır. Diğer Codex
    app-server hatalarını yalıtırken alt aracı probunu
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt aracı kontrolü için diğer probları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt aracı probundan sonra çıkar.
- Codex isteğe bağlı kurulum smoke testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tarball'unu Docker'da kurar, OpenAI API-key
    onboarding çalıştırır ve Codex Plugin'i ile `@openai/codex` bağımlılığının
    isteğe bağlı olarak yönetilen npm proje köküne indirildiğini doğrular.
- Canlı Plugin araç bağımlılığı smoke testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığı olan bir fixture Plugin'i paketler, bunu
    `npm-pack:` üzerinden kurar, yönetilen npm proje kökü altındaki bağımlılığı doğrular,
    ardından canlı bir OpenAI modelinden Plugin aracını çağırmasını ve gizli slug'ı döndürmesini ister.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı ek güvence kontrolü.
    `/crestodian status` çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtı verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir kapsayıcıda Crestodian çalıştırır
    ve bulanık planlayıcı fallback'inin denetlenmiş tipli bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, modern onboard
    Crestodian giriş noktasını doğrular, setup/model/agent/Discord Plugin + SecretRef
    yazımlarını uygular, yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum
    yolu QA Lab'de şu komutla da kapsanır:
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlı olarak
  `openclaw models list --provider moonshot --json` çalıştırın, ardından `moonshot/kimi-k2.6` karşısında yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve asistan transkriptinin normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyaç duyduğunuzda, canlı testleri aşağıda açıklanan allowlist ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında durur:

CI, QA Lab'i özel iş akışlarında çalıştırır. Agentic eşdeğerlik, bağımsız bir PR iş akışı değil, `QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir. Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır. Kararlı/varsayılan sürüm kontrolleri, kapsamlı canlı/Docker soak işlemini `run_release_soak=true` arkasında tutar; `full` profili soak'ı zorlar. `QA-Lab - All Lanes`, `main` üzerinde gecelik olarak ve manuel gönderimden mock parity hattı, canlı Matrix hattı, Convex tarafından yönetilen canlı Telegram hattı ve Convex tarafından yönetilen canlı Discord hattı paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix'e açıkça `--profile fast` geçirir; Matrix CLI ve manuel iş akışı girdisi varsayılanı ise `all` olarak kalır; manuel gönderim `all` değerini `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release Checks`, sürüm onayından önce eşdeğerliği, hızlı Matrix ve Telegram hatlarıyla birlikte çalıştırır; sürüm aktarım kontrolleri için deterministik kalmaları ve normal sağlayıcı-Plugin başlatmasını önlemeleri amacıyla `mock-openai/gpt-5.5` kullanır. Bu canlı aktarım gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA parity paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları, zaten `ffmpeg` ve `ffprobe` içeren `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/backend parçaları, seçilen commit başına bir kez oluşturulan paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden oluşturmak yerine bunu `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Seçilen senaryo kümesi için karışık akış, Vitest ve Playwright senaryo
    seçimleri dahil üst düzey `qa-evidence.json`, `qa-suite-summary.json` ve
    `qa-suite-report.md` yapıtlarını yazar.
  - `pnpm openclaw qa run --qa-profile <profile>` tarafından çalıştırıldığında,
    seçilen taksonomi profil puan kartını aynı `qa-evidence.json` içine gömer.
    `smoke-ci`, `evidenceMode: "slim"` ayarlayan ve giriş başına `execution`
    alanını atlayan ince kanıt yazar. `release`, özenle seçilmiş yayın
    hazırlığı dilimini kapsar; `all` tüm etkin olgunluk kategorilerini seçer ve
    tam puan kartı yapıtı gerektiğinde açık QA Profile Evidence iş akışı
    çalıştırmaları için tasarlanmıştır.
  - Seçilen birden fazla senaryoyu varsayılan olarak yalıtılmış gateway
    worker'larıyla paralel çalıştırır. `qa-channel`, varsayılan olarak eşzamanlılık
    4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Worker sayısını ayarlamak
    için `--concurrency <count>` veya eski seri hat için `--concurrency 1`
    kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Hatalı
    çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalığı olan `mock-openai` hattını değiştirmeden
    deneysel fixture ve protokol-mock kapsamı için yerel AIMock destekli bir
    sağlayıcı sunucusu başlatır.
- `pnpm openclaw qa coverage --match <query>`
  - Senaryo ID'leri, başlıklar, yüzeyler, kapsam ID'leri, docs referansları, kod
    referansları, plugins ve sağlayıcı gereksinimlerinde arama yapar, ardından
    eşleşen suite hedeflerini yazdırır.
  - Dokunulan davranışı veya dosya yolunu bildiğiniz ama en küçük senaryoyu
    bilmediğiniz durumlarda QA Lab çalıştırmasından önce bunu kullanın. Bu
    yalnızca tavsiye niteliğindedir; yine de mock, live, Multipass, Matrix veya
    transport kanıtını değiştirilen davranışa göre seçin.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin gauntlet'ini QA Lab üzerinden çalıştırır.
    Harici Kitchen Sink paketini kurar, plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve hasmane tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir.
    Hazır Testbox oturumlarında, `openclaw-testbox-env` yardımcı aracı mevcutsa
    Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak gösterir.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç bench'ini ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altına yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` artı `--hot-wall-warn-ms`), böylece kısa başlangıç
    sıçramaları dakikalar süren gateway peg regresyonu gibi görünmeden metrik
    olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarını kullanır; checkout zaten taze runtime çıktısına
    sahip değilse önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite'i tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini
    iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma
    yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır, böylece guest bağlı çalışma
    alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetiyle birlikte Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Mevcut checkout'tan bir npm tarball oluşturur, bunu Docker içinde global
    olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding'ini çalıştırır,
    varsayılan olarak Telegram'ı yapılandırır, paketlenmiş plugin runtime'ın
    başlangıç bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor
    çalıştırır ve mock'lanmış bir OpenAI endpoint'e karşı bir yerel agent turu
    çalıştırır.
  - Aynı paketli kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime bağlam transcript'leri için deterministik bir built-app
    Docker smoke çalıştırır. Gizli OpenClaw runtime bağlamının görünür kullanıcı
    turuna sızmak yerine görüntülenmeyen özel bir mesaj olarak kalıcı hale
    getirildiğini doğrular, ardından etkilenen bozuk bir oturum JSONL dosyası
    seed eder ve `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala
    yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini
    çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından bu kurulu
    paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden
    kullanır.
  - Wrapper, checkout'tan yalnızca `qa-lab` harness kaynağını mount eder;
    kurulu paket `dist`, `openclaw/plugin-sdk` ve paketlenmiş plugin runtime'ın
    sahibidir, böylece hat mevcut checkout plugins'lerini test edilen pakete
    karıştırmaz.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir;
    registry'den kurmak yerine çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ile
    `qa-evidence.json` içinde tekrarlı RTT zamanlaması yayar. RTT çalıştırmasını
    ayarlamak için `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` veya
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini override edin.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`, örneklenecek Telegram QA denetim
    ID'lerinin virgülle ayrılmış listesini kabul eder; ayarlanmamışsa varsayılan
    RTT uyumlu denetim `telegram-mentioned-message-reply` olur.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/yayın otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir rol secret'ı ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı mevcutsa Docker
    wrapper Convex'i otomatik olarak seçer.
  - Wrapper, Docker build/kurulum çalışmasından önce host üzerinde Telegram veya
    Convex kimlik bilgisi env'ini doğrular.
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca kimlik
    bilgisi öncesi kurulumu bilinçli olarak hata ayıklarken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için override eder.
    Convex kimlik bilgileri seçildiğinde ve rol ayarlanmadığında wrapper CI'da
    `ci`, CI dışında `maintainer` kullanır.
  - GitHub Actions bu hattı manuel maintainer iş akışı `NPM Telegram Beta E2E`
    olarak sunar. Merge sırasında çalışmaz. İş akışı `qa-live-shared` ortamını
    ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalışma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256
  ile birlikte HTTPS tarball URL'si veya başka bir çalıştırmadan tarball yapıtı
  kabul eder, normalize edilmiş `openclaw-current.tgz` dosyasını
  `package-under-test` olarak yükler, ardından smoke, package, product, full
  veya custom hat profilleriyle mevcut Docker E2E zamanlayıcısını çalıştırır.
  Telegram QA iş akışını aynı `package-under-test` yapıtına karşı çalıştırmak
  için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
  - En son beta ürün kanıtı:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Tam tarball URL kanıtı bir digest gerektirir ve genel URL güvenlik ilkesini kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/özel tarball aynaları açık bir güvenilir kaynak ilkesi kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`, güvenilir iş akışı ref'inden `.github/package-trusted-sources.json` okur ve URL kimlik bilgilerini veya workflow-input özel ağ bypass'ını kabul etmez. Adlandırılmış ilke bearer auth bildiriyorsa sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını yapılandırın.

- Yapıt kanıtı başka bir Actions çalıştırmasından tarball yapıtı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mevcut OpenClaw build'ini Docker içinde paketler ve kurar, OpenAI
    yapılandırılmış şekilde Gateway'i başlatır, ardından config düzenlemeleri
    üzerinden paketli channel/plugins'i etkinleştirir.
  - Kurulum discovery'sinin yapılandırılmamış indirilebilir plugins'i yok
    bıraktığını, ilk yapılandırılmış doctor onarımının her eksik indirilebilir
    plugin'i açıkça kurduğunu ve ikinci yeniden başlatmanın gizli bağımlılık
    onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası
    doctor'ının eski plugin bağımlılık kalıntılarını harness taraflı postinstall
    onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketli kurulum güncelleme smoke'unu Parallels guest'leri genelinde
    çalıştırır. Seçilen her platform önce istenen baseline paketi kurar,
    ardından aynı guest içinde kurulu `openclaw update` komutunu çalıştırır ve
    kurulu sürümü, güncelleme durumunu, gateway hazırlığını ve bir yerel agent
    turunu doğrular.
  - Tek bir guest üzerinde iterasyon yaparken `--platform macos`,
    `--platform windows` veya `--platform linux` kullanın. Özet yapıt yolu ve
    hat başına durum için `--json` kullanın.
  - OpenAI hattı, canlı agent turu kanıtı için varsayılan olarak
    `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini bilinçli olarak
    doğrularken `--model <provider/model>` geçin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels transport takılmalarının test penceresinin kalanını tüketmemesi
    için uzun yerel çalıştırmaları host timeout içine alın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*`
    altına yazar. Dış wrapper'ın takıldığını varsaymadan önce
    `windows-update.log`, `macos-update.log` veya `linux-update.log`
    dosyalarını inceleyin.
  - Windows güncellemesi, soğuk bir guest üzerinde güncelleme sonrası doctor ve
    paket güncelleme çalışmasında 10 ila 15 dakika harcayabilir; iç içe npm
    debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu wrapper'ı tekil Parallels macOS, Windows veya Linux smoke hatlarıyla
    paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri yükleme,
    paket sunumu veya guest gateway durumunda çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketli plugin yüzeyini çalıştırır çünkü
    konuşma, image generation ve medya anlama gibi capability facades, agent
    turunun kendisi yalnızca basit bir metin yanıtını denetlese bile paketli
    runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, tek kullanımlık Docker destekli bir Tuwunel homeserver üzerinde çalıştırır. Yalnızca kaynak checkout - paketlenmiş kurulumlar `qa-lab` içermez.
  - Tam CLI, profil/senaryo kataloğu, ortam değişkenleri ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env üzerinden gelen sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram sohbet id'si olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış lease'leri seçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar canary, mention gating, komut adresleme, `/status`, botlar arası mention'lı yanıtlar ve çekirdek yerel komut yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve Telegram son mesaj streaming regresyonlarını kapsar. `session_status` gibi isteğe bağlı probe'lar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istediğinizde
    `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve `qa-evidence.json` yazar. Yanıt veren senaryolar, sürücü gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

`Mantis Telegram Live`, bu hattın etrafındaki PR kanıtı wrapper'ıdır. Aday ref'i
Convex tarafından lease edilen Telegram kimlik bilgileriyle çalıştırır, redakte edilmiş QA
raporunu/kanıt paketini bir Crabbox masaüstü tarayıcısında render eder, MP4 kanıtı kaydeder,
hareketi kırpılmış bir GIF oluşturur, artifact paketini yükler ve `pr_number` ayarlandığında
Mantis GitHub App üzerinden satır içi PR kanıtı gönderir. Maintainer'lar bunu
Actions kullanıcı arayüzünden `Mantis Scenario` (`scenario_id:
telegram-live`) aracılığıyla veya doğrudan bir pull request yorumundan başlatabilir:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`, PR görsel kanıtı için agentic yerel Telegram Desktop
öncesi/sonrası wrapper'ıdır. Bunu Actions kullanıcı arayüzünden
serbest biçimli `instructions` ile, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) üzerinden veya bir PR yorumundan başlatın:

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent'ı PR'ı okur, hangi Telegram'da görünür davranışın değişikliği kanıtladığına
karar verir, gerçek kullanıcı Crabbox Telegram Desktop kanıt hattını baseline ve
aday ref'lerde çalıştırır, yerel GIF'ler kullanışlı olana kadar iterasyon yapar, eşlenmiş bir
`motionPreview` manifest'i yazar ve `pr_number` ayarlandığında aynı 2 sütunlu GIF tablosunu
Mantis GitHub App üzerinden gönderir.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstünü lease eder veya yeniden kullanır, yerel Telegram Desktop'ı kurar, OpenClaw'ı lease edilmiş bir Telegram SUT bot token'ı ile yapılandırır, Gateway'i başlatır ve görünür VNC masaüstünden ekran görüntüsü/MP4 kanıtı kaydeder.
  - Varsayılan olarak `--credential-source convex` kullanır; böylece workflow'lar yalnızca Convex broker secret'ına ihtiyaç duyar. `pnpm openclaw qa telegram` ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenleriyle `--credential-source env` kullanın.
  - Telegram Desktop hâlâ bir kullanıcı oturumu/profili gerektirir. Bot token'ı yalnızca OpenClaw'ı yapılandırır. Base64 `.tgz` profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya `--keep-lease` kullanıp VNC üzerinden bir kez elle oturum açın.
  - Çıktı dizini altında `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4` yazar.

Canlı transport hatları, yeni transport'ların sapmaması için tek bir standart sözleşmeyi paylaşır; hat başına coverage matrisi [QA genel bakışı → Canlı transport coverage](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik suite'tir ve bu matrisin parçası değildir.

### Convex aracılığıyla paylaşılan Telegram kimlik bilgileri (v1)

Canlı transport QA için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu
lease için Heartbeat gönderir ve kapanışta lease'i serbest bırakır. Bölüm adı
Discord, Slack ve WhatsApp desteğinden önce gelir; lease sözleşmesi türler arasında paylaşılır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI`, `ci` için
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme id'si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker secret'larını,
endpoint prefix'ini, HTTP timeout'unu ve admin/list erişilebilirliğini secret değerlerini
yazdırmadan kontrol etmek için `doctor` kullanın. Betikler ve CI yardımcıları için
makine tarafından okunabilir çıktı almak üzere `--json` kullanın.

Varsayılan endpoint sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarılı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Başarılı: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarılı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarılı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca maintainer secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Aktif lease koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal Telegram sohbet id'si string'i olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

Telegram gerçek kullanıcı türü için payload şekli:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal string'ler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256`, SHA-256 hex string'leri olmalıdır.
- `kind: "telegram-user"`, Mantis Telegram Desktop kanıt workflow'u için ayrılmıştır. Genel QA Lab hatları bunu almamalıdır.

Broker tarafından doğrulanan çok kanallı payload'lar:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack hatları da havuzdan lease alabilir, ancak Slack payload doğrulaması şu anda
broker yerine Slack QA runner içinde yer alır. Slack satırları için
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
kullanın.

### QA'ya kanal ekleme

Yeni kanal adapter'ları için mimari ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari eşik: transport runner'ı paylaşılan `qa-lab` host seam'i üzerinde uygulamak, Plugin manifest'inde `qaRunners` bildirmek, `openclaw qa <runner>` olarak mount etmek ve `qa/scenarios/` altında senaryolar yazmaktır.

## Test suite'leri (nerede ne çalışır)

Suite'leri "artan gerçekçilik" (ve artan kırılganlık/maliyet) olarak düşünün:

### Unit / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Config: hedefsiz çalıştırmalar `vitest.full-*.config.ts` shard setini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına config'lere genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altında core/unit envanterleri; UI unit testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf unit testleri
  - In-process entegrasyon testleri (gateway auth, routing, tooling, parsing, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Resolver ve public-surface loader testleri, geniş `api.js` ve
    `runtime-api.js` fallback davranışını gerçek bundled plugin source API'leriyle değil,
    üretilmiş küçük plugin fixture'larıyla kanıtlamalıdır. Gerçek Plugin API yüklemeleri
    plugin sahibi contract/entegrasyon suite'lerine aittir.

Yerel bağımlılık politikası:

- Varsayılan test kurulumları isteğe bağlı yerel Discord opus build'lerini atlar. Discord voice, bundled `libopus-wasm` kullanır ve `@discordjs/opus`, yerel testler ve Testbox hatları native addon'ı derlemesin diye `allowBuilds` içinde devre dışı kalır.
- Yerel opus performansını varsayılan OpenClaw kurulum/test döngülerinde değil, `libopus-wasm` benchmark reposunda karşılaştırın. Varsayılan `allowBuilds` içinde `@discordjs/opus` değerini `true` yapmayın; bu, alakasız kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/uzantı işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel denetim kapısıdır. Diff'i core, core testleri, uzantılar, uzantı testleri, uygulamalar, dokümanlar, sürüm metaverileri, canlı Docker araçları ve araçlama olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm metaverisi içeren version bump'ları, üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard ile hedefli version/config/kök bağımlılık denetimleri çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: canlı Docker auth betikleri için shell söz dizimi ve canlı Docker scheduler dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan import açısından hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durumlu/runtime ağırlıklı dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları, changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere de eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için özel bucket'lara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import ağırlıklı tek bir bucket tüm Node kuyruğunu üstlenmez.
    - Normal PR/main CI, uzantı toplu taramasını ve yalnızca sürüme özel `agentic-plugins` shard'ını bilerek atlar. Full Release Validation, release candidate'lar için bu plugin/uzantı ağırlıklı paketlere ayrı `Plugin Prerelease` alt iş akışını dispatch eder.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Message-tool keşif girdilerini veya compaction runtime bağlamını
      değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyonları ekleyin.
    - Gömülü runner entegrasyon paketlerini sağlıklı tutun:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` ve
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca
      yardımcı testleri bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve yalıtım varsayılanları">

    - Temel Vitest config varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı config'ler genelinde yalıtılmamış runner'ı kullanır.
    - Kök UI hattı kendi `jsdom` kurulumunu ve optimizer'ını korur, ancak
      paylaşılan yalıtılmamış runner üzerinde de çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest config'ten aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme churn'ünü
      azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` ekler.
      Standart V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      ayarlayın.
    - `scripts/run-vitest.mjs`, stdout veya stderr çıktısı olmadan 5 dakika geçen
      açık non-watch Vitest çalıştırmalarını sonlandırır. Bilerek sessiz bir
      inceleme için watchdog'u devre dışı bırakmak üzere
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilen dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Handoff veya push öncesinde akıllı yerel denetim kapısına
      ihtiyacınız olduğunda `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. Yalnızca agent,
      bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş
      Vitest kapsamı gerektirdiğine karar verdiğinde
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max`, yalnızca daha yüksek bir worker sınırıyla
      aynı yönlendirme davranışını korur.
    - Yerel worker otomatik ölçeklendirmesi bilerek muhafazakârdır ve host load average
      zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı Vitest
      çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test bağlantıları değiştiğinde changed-mode yeniden çalıştırmalarının
      doğru kalması için projeleri/config dosyalarını `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini etkin tutar;
      doğrudan profil çıkarma için tek bir açık cache konumu istiyorsanız
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil görünümünü
      `origin/main` sonrasında değişen dosyalarla sınırlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm-config çalıştırmaları anahtar olarak config yolunu kullanır; include-pattern CI
      shard'ları, filtrelenmiş shard'ların ayrı izlenebilmesi için shard adını ekler.
    - Sıcak bir test zamanının çoğunu hâlâ başlangıç import'larında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      runtime yardımcılarını yalnızca `vi.mock(...)` içinden geçirmek için deep-import etmek
      yerine o sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile o commit'lenmiş diff için yerel kök-proje yolunu karşılaştırır
      ve duvar saatini artı macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek mevcut
      kirli tree'yi benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış unit paketi için
      runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Sentetik gateway message, memory ve large-payload churn'ünü diagnostic event yolu üzerinden sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin basınç bütçesinin altında kaldığını ve oturum başına queue derinliklerinin tekrar sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (repo toplamı)

- Komut: `pnpm test:e2e`
- Kapsam:
  - Gateway smoke E2E hattını çalıştırır
  - Mock'lanmış Control UI tarayıcı E2E hattını çalıştırır
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
  - Konsol I/O overhead'ini azaltmak için varsayılan olarak silent mode'da çalışır.
- Yararlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlı).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ kullanımı
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Unit testlerden daha fazla hareketli parçaya sahiptir (daha yavaş olabilir)

### E2E (Control UI mock'lanmış tarayıcı)

- Komut: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Dosyalar: `ui/src/**/*.e2e.test.ts`
- Kapsam:
  - Vite Control UI'ı başlatır
  - Playwright üzerinden gerçek bir Chromium sayfasını sürer
  - Gateway WebSocket'i deterministik tarayıcı içi mock'larla değiştirir
- Beklentiler:
  - CI'da `pnpm test:e2e` parçası olarak çalışır
  - Gerçek Gateway, agent veya provider anahtarı gerektirmez
  - Tarayıcı bağımlılığı mevcut olmalıdır (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Etkin bir yerel OpenShell gateway'i yeniden kullanır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Etkin bir yerel OpenShell gateway ve onun config kaynağını gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test sandbox'ını yok eder
- Yararlı override'lar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - Kayıtlı gateway config'ini yalıtılmış teste açmak için `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - Host policy fixture tarafından kullanılan Docker gateway IP'sini override etmek için `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Canlı (gerçek provider'lar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin canlı testleri
- Varsayılan: `pnpm test:live` ile **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı biçimi değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarımı gereği CI açısından kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - "her şey" yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, zaten dışa aktarılmış API anahtarlarını ve hazırlanmış kimlik doğrulama profillerini kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar; böylece birim fikstürleri gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin kasıtlı olarak gerçek ana dizininizi kullanmasına ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur ve Gateway başlangıç günlüklerini/Bonjour konuşmalarını susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` ile canlı test başına geçersiz kılın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık stderr'e ilerleme satırları yayar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessiz olsa bile görünür biçimde etkin kalır.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/Gateway ilerleme satırlarının hemen akması için Vitest konsol kesmesini devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/prob Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/testleri düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağına / WS protokolüne / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- "botum çalışmıyor" / sağlayıcıya özgü hatalar / araç çağırma sorunlarını ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness'ı) ve canlı çalıştırmalar için kimlik bilgisi işleme için bkz.
[Canlı test paketlerini test etme](/tr/help/testing-live). Özel güncelleme ve
Plugin doğrulama kontrol listesi için bkz.
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yerel yapılandırma dizininizi, çalışma alanınızı ve isteğe bağlı profil env dosyasını bağlayarak repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları, gerektiğinde kendi pratik sınırlarını korur:
  `test:docker:live-models` varsayılan olarak küratörlüğü yapılmış desteklenen yüksek sinyalli kümeyi kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha küçük bir sınır veya daha büyük bir tarama istediğinizde `OPENCLAW_LIVE_MAX_MODELS`
  ya da Gateway env değişkenlerini ayarlayın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez oluşturur, `scripts/package-openclaw-for-docker.mjs` aracılığıyla OpenClaw'ı bir npm tarball'ı olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Çıplak imaj yalnızca kurulum/güncelleme/Plugin bağımlılığı şeritleri için Node/Git çalıştırıcısıdır; bu şeritler önceden oluşturulmuş tarball'ı bağlar. İşlevsel imaj, oluşturulmuş uygulama işlevselliği şeritleri için aynı tarball'ı `/app` içine kurar. Docker şeridi tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam, ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını denetlerken kaynak sınırları ağır canlı, npm kurulumu ve çok hizmetli şeritlerin hepsinin aynı anda başlamasını engeller. Tek bir şerit etkin sınırlardan daha ağırsa zamanlayıcı, havuz boş olduğunda yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalışır durumda tutar. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı şerit sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun şeritleri önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı şerit manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen şeritler, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` üzerinden bir aday paket çözer, bunu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E şeritlerini tam olarak bu tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme survivor matrisi, sürüm varsayılanları ve hata triyajı için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).
- Derleme ve sürüm kontrolleri tsdown'dan sonra `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik oluşturulmuş grafiği dolaşır ve komut dağıtımından önceki başlangıç içe aktarmaları Commander, istem UI'si, undici veya günlükleme gibi paket bağımlılıklarını komut dağıtımından önce içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarmalarını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımı, onboard yardımı, doctor yardımı, durum, yapılandırma şeması ve bir model listeleme komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesme noktasına kadar harness yalnızca gönderilmiş paket meta veri boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türetilmiş git fikstüründe eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta veri migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı hatalardır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.
- Paketlenmiş OpenClaw tarball'ını `scripts/lib/openclaw-e2e-instance.sh` üzerinden kuran Docker/Bash E2E şeritleri, `npm install` için `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` sınırını uygular (varsayılan `600s`; hata ayıklama için sarmalayıcıyı devre dışı bırakmak üzere `0` ayarlayın).

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama ana dizinlerini (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalıştırmadan önce bunları container ana dizinine kopyalar; böylece harici CLI OAuth, ana makine kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; Droid/OpenCode için katı kapsam `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` üzerinden sağlanır)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama sunucusu harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testleri: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ve `pnpm qa:observability:smoke` özel QA kaynak checkout şeritleridir. npm tarball'ı QA Lab'i atladığı için kasıtlı olarak paket Docker sürüm şeritlerinin parçası değildirler.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde genel olarak kurar, env-ref onboarding ile OpenAI'yi ve varsayılan olarak Telegram'ı yapılandırır, doctor çalıştırır ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.

- Sürüm kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-user-journey`, paketlenmiş OpenClaw tarball dosyasını temiz bir Docker ana dizinine global olarak kurar, onboarding’i çalıştırır, mock edilmiş bir OpenAI provider yapılandırır, bir agent turu çalıştırır, harici plugin’leri kurar/kaldırır, ClickClack’i yerel bir fixture’a göre yapılandırır, giden/gelen mesajlaşmayı doğrular, Gateway’i yeniden başlatır ve doctor’ı çalıştırır.
- Sürüm tipli onboarding smoke testi: `pnpm test:docker:release-typed-onboarding`, paketlenmiş tarball dosyasını kurar, `openclaw onboard` komutunu gerçek bir TTY üzerinden yürütür, OpenAI’yi env-ref provider olarak yapılandırır, ham anahtar kalıcılığı olmadığını doğrular ve mock edilmiş bir agent turu çalıştırır.
- Sürüm medya/bellek smoke testi: `pnpm test:docker:release-media-memory`, paketlenmiş tarball dosyasını kurar, bir PNG ekinden görüntü anlama, OpenAI uyumlu görüntü üretim çıktısı, bellek aramasıyla hatırlama ve Gateway yeniden başlatması boyunca hatırlamanın korunmasını doğrular.
- Sürüm yükseltme kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-upgrade-user-journey`, varsayılan olarak aday tarball’dan daha eski yayımlanmış en yeni temel sürümü kurar, yayımlanmış paket üzerinde provider/plugin/ClickClack durumunu yapılandırır, aday tarball’a yükseltir, ardından temel agent/plugin/kanal yolculuğunu yeniden çalıştırır. Daha eski yayımlanmış bir temel sürüm yoksa aday sürümü yeniden kullanır. Temel sürümü `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` ile geçersiz kılın.
- Sürüm plugin marketplace smoke testi: `pnpm test:docker:release-plugin-marketplace`, yerel bir fixture marketplace’ten kurulum yapar, kurulu plugin’i günceller, kaldırır ve kurulum meta verileri budanmış halde plugin CLI’sinin kaybolduğunu doğrular.
- Skill kurulum smoke testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tarball dosyasını Docker’da global olarak kurar, yapılandırmada yüklenen arşiv kurulumlarını devre dışı bırakır, aramadan geçerli canlı ClawHub skill slug’ını çözer, `openclaw skills install` ile kurar ve kurulu skill ile `.clawhub` kaynak/kilit meta verilerini doğrular.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball dosyasını Docker’da global olarak kurar, package `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve plugin güncelleme sonrası işleyişin çalıştığını doğrular, ardından yeniden package `stable` kanalına döner ve güncelleme durumunu kontrol eder.
- Yükseltme survivor smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball dosyasını agent’lar, kanal yapılandırması, plugin allowlist’leri, bayat plugin bağımlılık durumu ve mevcut workspace/session dosyaları içeren kirli bir eski kullanıcı fixture’ının üzerine kurar. Canlı provider veya kanal anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum koruması ile başlangıç/durum bütçelerini kontrol eder.
- Yayımlanmış yükseltme survivor smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyaları eker, bu temel sürümü gömülü bir komut tarifiyle yapılandırır, oluşan yapılandırmayı doğrular, yayımlanmış kurulumu aday tarball’a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’leri, durum korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Tek bir temel sürümü `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, aggregate scheduler’dan `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi değerlerle `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` üzerinden kesin yerel temel sürümleri genişletmesini isteyin ve `reported-issues` gibi değerlerle `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` üzerinden issue biçimli fixture’ları genişletin; reported-issues kümesi, otomatik harici OpenClaw plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta temel sürüm token’larını çözer ve Full Release Validation, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` ile `reported-issues` değerini içerecek şekilde genişletir.
- Session runtime context smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime context transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, izole bir ana dizinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü provider’larını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball’ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host build’i `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya oluşturulmuş bir Docker imajından `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile `dist/` kopyalayın.
- Installer Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container’ları arasında tek bir npm cache paylaşır. Update smoke testi, aday tarball’a yükseltmeden önce stable temel sürüm olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub’da Install Smoke workflow’unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan installer kontrolleri, root sahipli cache girdilerinin kullanıcı yerelindeki kurulum davranışını maskelememesi için izole bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache’i yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde script’i yerelde bu env olmadan çalıştırın.
- Agents delete shared workspace CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak root Dockerfile imajını oluşturur, izole bir container ana dizininde tek workspace’e sahip iki agent eker, `agents delete --json` çalıştırır ve geçerli JSON ile workspace’in korunması davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ bağlantısı (iki container, WS kimlik doğrulaması + sağlık): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını oluşturur, Chromium’u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının link URL’lerini, imleçle öne çıkarılmış tıklanabilirleri, iframe referanslarını ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`), Gateway üzerinden mock edilmiş bir OpenAI sunucusu çalıştırır, `web_search` değerinin `reasoning.effort` seviyesini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından provider schema reddini zorlar ve ham ayrıntının Gateway log’larında göründüğünü kontrol eder.
- MCP kanal köprüsü (seed edilmiş Gateway + stdio bridge + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü OpenClaw profil allow/deny smoke testi): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin’ler (yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hatalı biçimlendirilmiş npm paket meta verileri, git moving refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testi): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball dosyasını boş bir container’a kurar, bir npm plugin’i kurar, etkinleştirme/devre dışı bırakmayı değiştirir, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından her yaşam döngüsü aşaması için RSS/CPU metriklerini log’larken kaldırma işleminin bayat durumu hâlâ kaldırdığını doğrular.
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin’ler: `pnpm test:docker:plugins`, yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, git moving refs, ClawHub fixture’ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu plugin’ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlenen npm plugin kurulumu, etkinleştirme, devre dışı bırakma, yükseltme, düşürme ve kod eksikken kaldırma işlemlerini kapsar.

Paylaşılan işlevsel imajı manuel olarak önceden oluşturup yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite’e özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, script’ler imaj zaten yerel değilse onu çeker. QR ve installer Docker testleri kendi Dockerfile’larını korur çünkü paylaşılan oluşturulmuş uygulama runtime’ı yerine paket/kurulum davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli çalışma kopyasını salt okunur olarak bind mount ile bağlar ve
container içinde geçici bir workdir içine hazırlar. Bu, çalışma zamanı
imajını ince tutarken Vitest'i tam yerel kaynak/config dosyanıza karşı çalıştırmayı sürdürür.
Hazırlama adımı, `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya yerel `.build` ya da
Gradle çıktı dizinleri gibi büyük, yalnızca yerel cache'leri ve uygulama build çıktılarını atlar; böylece Docker canlı çalıştırmaları
makineye özgü artifact'leri kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı yoklamaları container içinde
gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle o Docker kulvarından gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş
bir OpenClaw gateway container'ı başlatır,
bu gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` öğesinin `openclaw/default` sunduğunu doğrular, ardından Open WebUI'nin
`/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
Canlı model tamamlamasını beklemeden Open WebUI oturum açma ve model keşfinden sonra durması gereken
release yolu CI denetimleri için `OPENWEBUI_SMOKE_MODE=models` ayarlayın.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI imajını çekmesi ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu kulvar kullanılabilir bir canlı model anahtarı bekler. Bunu süreç
ortamı, hazırlanmış auth profilleri veya açık bir `OPENCLAW_PROFILE_FILE` üzerinden sağlayın.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload'u yazdırır.
`test:docker:mcp-channels` bilinçli olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway
container'ı başlatır, `openclaw mcp serve` başlatan ikinci bir container'ı başlatır, ardından
gerçek stdio MCP köprüsü üzerinden yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metadata'sını,
canlı event queue davranışını, outbound gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi ham stdio MCP frame'lerini doğrudan inceler; böylece duman testi,
yalnızca belirli bir istemci SDK'sının yüzeye çıkardığını değil, köprünün gerçekten ne yaydığını doğrular.
`test:docker:agent-bundle-mcp-tools` deterministiktir ve canlı model anahtarı gerektirmez. Repo Docker imajını build eder,
container içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü OpenClaw bundle MCP çalışma zamanı üzerinden somutlaştırır,
aracı yürütür, ardından `coding` ve `messaging` öğelerinin `bundle-mcp` araçlarını tuttuğunu,
`minimal` ve `tools.deny: ["bundle-mcp"]` öğelerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarı gerektirmez.
Gerçek bir stdio MCP probe sunucusuyla seed edilmiş bir Gateway başlatır, izole bir cron turn ve
`sessions_spawn` one-shot child turn çalıştırır, ardından MCP child process'in her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil thread duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regression/debug workflow'ları için saklayın. ACP thread yönlendirme doğrulaması için tekrar gerekebilir; bu nedenle silmeyin.

Yararlı env var'ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` testleri çalıştırmadan önce mount edilir ve source edilir
- Geçici config/workspace dizinleri ve harici CLI auth mount'ları kullanmadan, yalnızca `OPENCLAW_PROFILE_FILE` üzerinden source edilen env var'larını doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache'lenmiş CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarımlanan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle elle override edin
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Rebuild gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil store'dan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI duman testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI duman testinin kullandığı nonce denetimi istemini override etmek için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj tag'ini override etmek için `OPENWEBUI_IMAGE=...`

## Dokümantasyon sağlamlık denetimi

Dokümantasyon düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading denetimlerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan "gerçek pipeline" regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorlanır): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval'leri (skills)

Zaten "agent güvenilirlik eval'leri" gibi davranan birkaç CI için güvenli testimiz var:

- Gerçek gateway + agent loop üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan uçtan uca wizard flow'ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt'ta skills listelendiğinde agent doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/arg'leri izliyor mu?
- **Workflow sözleşmeleri:** tool sırasını, session history aktarımını ve sandbox sınırlarını assert eden çok turlu senaryolar.

Gelecek eval'ler önce deterministik kalmalıdır:

- Tool çağrılarını + sırasını, skill dosyası okumalarını ve session wiring'i assert etmek için mock sağlayıcılar kullanan bir senaryo runner'ı.
- Skill odaklı küçük bir senaryo paketi (kullanma vs kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval'ler (opt-in, env-gated) yalnızca CI için güvenli paket hazır olduktan sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde iterasyon yapar ve
şekil ile davranış assertion'larından oluşan bir paket çalıştırır. Varsayılan `pnpm test` unit kulvarı
bu paylaşılan seam ve duman dosyalarını bilinçli olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda
sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, capability'ler)
- **setup** - Setup wizard sözleşmesi
- **session-binding** - Session binding davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Inbound mesaj işleme
- **actions** - Kanal action handler'ları
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Grup politikası uygulama

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probe'ları
- **registry** - Plugin registry şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth flow sözleşmesi
- **auth-choice** - Auth seçimi/seçme
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Sağlayıcı runtime'ı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Setup wizard

### Ne zaman çalıştırılır

- plugin-sdk export'larını veya subpath'lerini değiştirdikten sonra
- Bir kanal ya da sağlayıcı Plugin'i ekledikten veya değiştirdikten sonra
- Plugin registration veya discovery üzerinde refactor yaptıktan sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam request-shape dönüşümünü yakalayın)
- Doğası gereği yalnızca canlıysa (rate limit'ler, auth politikaları), canlı testi dar tutun ve env var'larıyla opt-in yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı request conversion/replay hatası → doğrudan models testi
  - gateway session/history/tool pipeline hatası → gateway canlı duman testi veya CI için güvenli gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` öğesini güncelleyin. Test, sınıflandırılmamış hedef id'lerinde bilinçli olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
