---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı paketler, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-07-02T08:43:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest paketine (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu belge bir "nasıl test ederiz" rehberidir:

- Her paketin neleri kapsadığı (ve özellikle neleri kapsamadığı).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için başvuru.
- [Olgunluk puan kartı](/tr/maturity/scorecard) - sürüm QA kanıtının kararlılık ve LTS kararlarını nasıl desteklediği.
- [QA kanalı](/tr/channels/qa-channel) - depo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin’i.

Bu sayfa, normal test paketlerinin ve Docker/Parallels çalıştırıcılarının çalıştırılmasını kapsar. Aşağıdaki QA’ya özgü çalıştırıcılar bölümü ([QA’ya özgü çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık uzantı/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ekstra güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

## Test Geçici Dizinleri

Testlere ait geçici dizinler için `test/helpers/temp-dir.ts` içindeki paylaşılan yardımcıları tercih edin. Bunlar sahipliği açık hale getirir ve temizliği aynı test yaşam döngüsünde tutar:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` bilinçli olarak manuel temizleme yöntemi sunmaz; Vitest her testten sonra temizliği üstlenir. Henüz taşınmamış testler için mevcut daha düşük seviyeli yardımcılar kalır, ancak yeni ve geçirilmiş testler otomatik temizlenen izleyiciyi kullanmalıdır. Bir durum ham temp-dir davranışını açıkça doğrulamıyorsa, testlerde yeni manuel `makeTempDir`, `cleanupTempDirs` veya `createTempDirTracker` kullanımlarından ve yeni çıplak `fs.mkdtemp*` çağrılarından kaçının. Bir test bilinçli olarak çıplak bir geçici dizine ihtiyaç duyduğunda somut gerekçeli, denetlenebilir bir izin yorumu ekleyin:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Geçiş görünürlüğü için `node scripts/report-test-temp-creations.mjs`, mevcut temizlik stillerini engellemeden eklenen diff satırlarında yeni çıplak temp-dir oluşturma ve yeni manuel paylaşılan-yardımcı kullanımını raporlar. Dosya kapsamı, ayrı bir test-yardımcı dosya adı sezgisi tutmak yerine bilinçli olarak `scripts/changed-lanes.mjs` tarafından kullanılan aynı test-yolu sınıflandırmasını izler ve paylaşılan yardımcı uygulamanın kendisini atlar. `check:changed`, değişen test yolları için bu raporu yalnızca uyarı CI sinyali olarak çalıştırır; bulgular başarısızlık değil, GitHub uyarı anotasyonlarıdır.

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefle: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.5` ajan turu için `live_openai_candidate=true` veya Kova CPU/heap/trace yapıtları için `deep_profile=true` ile `OpenClaw Performance` çalıştırın. Günlük zamanlanmış çalıştırmalar, `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.5 hat yapıtlarını `openclaw/clawgrit-reports` içine yayımlar. mock-provider raporu ayrıca kaynak düzeyinde Gateway önyükleme, bellek, Plugin baskısı, tekrarlanan fake-model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya-okuma tarzı prob çalıştırır. Meta verileri `image` girdisi ilan eden modeller ayrıca küçük bir görüntü turu çalıştırır. Sağlayıcı hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel `OpenClaw Release Checks`, her ikisi de ayrı Docker canlı model matrisi işlerini sağlayıcıya göre bölümlenmiş olarak içeren yeniden kullanılabilir canlı/E2E iş akışını `include_live_suites: true` ile çağırır.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını `include_live_suites: true` ve `live_models_only: true` ile çalıştırın.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` dosyasına, ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet duman testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik bir Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından ACP yerine yerel Plugin bağlaması üzerinden düz bir yanıtı ve bir görüntü eki rotasını doğrular.
- Codex app-server harness duman testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan turlarını Plugin’e ait Codex app-server harness üzerinden çalıştırır, `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü, cron MCP, alt ajan ve Guardian problarını çalıştırır. Diğer Codex app-server hatalarını izole ederken alt ajan probunu `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan kontrolü için diğer probları devre dışı bırakın: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt ajan probundan sonra çıkar.
- Codex isteğe bağlı kurulum duman testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tarball’ını Docker içinde kurar, OpenAI API anahtarı onboarding’i çalıştırır ve Codex Plugin’i ile `@openai/codex` bağımlılığının gerektiğinde yönetilen npm proje köküne indirildiğini doğrular.
- Canlı Plugin araç bağımlılığı duman testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığı olan bir fixture Plugin’i paketler, `npm-pack:` üzerinden kurar, yönetilen npm proje kökü altındaki bağımlılığı doğrular, ardından canlı bir OpenAI modelinden Plugin aracını çağırmasını ve gizli slug’ı döndürmesini ister.
- Crestodian kurtarma komutu duman testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj-kanalı kurtarma komutu yüzeyi için isteğe bağlı, ek güvenlik sağlayan kontrol. `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliği sıraya alır, `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker duman testi: `pnpm test:docker:crestodian-planner`
  - Crestodian’ı yapılandırmasız bir konteynerde, `PATH` üzerinde sahte bir Claude CLI ile çalıştırır ve fuzzy planlayıcı fallback’inin denetlenmiş typed yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker duman testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar; modern onboard Crestodian giriş noktasını doğrular, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular, yapılandırmayı doğrular ve denetim kayıtlarını doğrular. Aynı Ring 0 setup yolu QA Lab’de şu komutla da kapsanır:
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi maliyet duman testi: `MOONSHOT_API_KEY` ayarlı olduğunda `openclaw models list --provider moonshot --json` çalıştırın, ardından `moonshot/kimi-k2.6` için izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON’un Moonshot/K2.6 raporladığını ve asistan transkriptinin normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan allowlist env var’larıyla daraltmayı tercih edin.
</Tip>

## QA’ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab’i ayrılmış iş akışlarında çalıştırır. Agentic eşdeğerlik, tek başına bir PR iş akışı olarak değil, `QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir. Geniş doğrulama `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır. Kararlı/varsayılan sürüm kontrolleri kapsamlı canlı/Docker soak’u `run_release_soak=true` arkasında tutar; `full` profili soak’u zorunlu kılar. `QA-Lab - All Lanes`, `main` üzerinde gecelik olarak ve manuel çalıştırmadan; mock parity hattı, canlı Matrix hattı, Convex yönetimli canlı Telegram hattı ve Convex yönetimli canlı Discord hattı paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix’e açıkça `--profile fast` geçirirken, Matrix CLI ve manuel iş akışı girdisi varsayılanı `all` olarak kalır; manuel çalıştırma `all` öğesini `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release Checks`, sürüm onayından önce parity ile hızlı Matrix ve Telegram hatlarını çalıştırır; sürüm taşıma kontrolleri için deterministik kalmaları ve normal sağlayıcı-Plugin başlangıcından kaçınmaları amacıyla `mock-openai/gpt-5.5` kullanır. Bu canlı taşıma Gateway’leri bellek aramasını devre dışı bırakır; bellek davranışı QA parity paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya bölümleri, zaten `ffmpeg` ve `ffprobe` içeren `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/backend bölümleri, seçilen commit başına bir kez oluşturulan paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her bölüm içinde yeniden derlemek yerine `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçilen senaryo kümesi için karışık akış, Vitest ve Playwright senaryo
    seçimleri dahil olmak üzere üst düzey `qa-evidence.json`,
    `qa-suite-summary.json` ve `qa-suite-report.md` artefaktlarını yazar.
  - `pnpm openclaw qa run --qa-profile <profile>` tarafından çalıştırıldığında,
    seçilen taksonomi profili puan kartını aynı `qa-evidence.json` içine gömer.
    `smoke-ci`, `evidenceMode: "slim"` ayarlayan ve giriş başına `execution`
    alanını atlayan dar kanıt yazar. `release`, seçilmiş yayın hazırlığı
    dilimini kapsar; `all`, her etkin olgunluk kategorisini seçer ve tam puan
    kartı artefaktı gerektiğinde açık QA Profile Evidence iş akışı
    çalıştırmaları için tasarlanmıştır.
  - Varsayılan olarak birden çok seçili senaryoyu yalıtılmış gateway işçileriyle
    paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 yapar
    (seçilen senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için
    `--concurrency <count>` kullanın veya eski seri hat için `--concurrency 1`
    kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artefakt istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalığı olan `mock-openai` hattının yerine geçmeden
    deneysel fixture ve protokol mock kapsamı için yerel AIMock destekli bir
    sağlayıcı sunucusu başlatır.
- `pnpm openclaw qa coverage --match <query>`
  - Senaryo ID'lerinde, başlıklarda, yüzeylerde, kapsam ID'lerinde, doküman
    referanslarında, kod referanslarında, Plugin'lerde ve sağlayıcı
    gereksinimlerinde arama yapar, ardından eşleşen suite hedeflerini yazdırır.
  - Dokunulan davranışı veya dosya yolunu bildiğiniz ama en küçük senaryoyu
    bilmediğiniz durumlarda QA Lab çalıştırmasından önce bunu kullanın. Bu
    yalnızca tavsiye niteliğindedir; değiştirilen davranışa göre yine de mock,
    canlı, Multipass, Matrix veya taşıma kanıtını seçin.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab üzerinden canlı OpenAI Kitchen Sink Plugin zorlu testini çalıştırır.
    Harici Kitchen Sink paketini kurar, plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve karşıt tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir. Hazırlanmış
    Testbox oturumlarında `openclaw-testbox-env` yardımcısı varsa Testbox canlı
    kimlik doğrulama profilini otomatik olarak kaynak alır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç ölçümünü ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` artı `--hot-wall-warn-ms`), böylece kısa başlangıç
    patlamaları, dakikalar süren gateway sabit yük regresyonu gibi görünmeden
    metrik olarak kaydedilir.
  - Oluşturulmuş `dist` artefaktlarını kullanır; checkout zaten güncel çalışma
    zamanı çıktısına sahip değilse önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite'ini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçimi bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama
    girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
    config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır; böylece konuk, bağlanmış çalışma
    alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetine ek olarak Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, Docker içinde global olarak
    kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan
    olarak Telegram'ı yapılandırır, paketlenmiş plugin çalışma zamanının
    başlangıç bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor
    çalıştırır ve mock OpenAI uç noktasına karşı bir yerel ajan turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı transcript'leri için deterministik bir
    oluşturulmuş uygulama Docker smoke testi çalıştırır. Gizli OpenClaw çalışma
    zamanı bağlamının görünür kullanıcı turuna sızmak yerine görüntülenmeyen
    özel mesaj olarak kalıcılaştırıldığını doğrular, ardından etkilenmiş bozuk
    bir oturum JSONL'si ekler ve `openclaw doctor --fix` komutunun bunu yedekle
    birlikte etkin dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini
    çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından canlı
    Telegram QA hattını o kurulu paketi SUT Gateway olarak kullanarak yeniden
    kullanır.
  - Sarmalayıcı checkout'tan yalnızca `qa-lab` harness kaynağını bağlar; kurulu
    paket `dist`, `openclaw/plugin-sdk` ve paketlenmiş plugin çalışma zamanının
    sahibidir, bu nedenle hat geçerli checkout Plugin'lerini test edilen pakete
    karıştırmaz.
  - Varsayılan değer `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` olur;
    kayıt defterinden kurmak yerine çözümlenmiş yerel tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ile
    `qa-evidence.json` içinde yinelenen RTT zamanlaması yayar. RTT çalıştırmasını
    ayarlamak için `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` veya
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`, örneklenecek Telegram QA denetim
    ID'lerinin virgülle ayrılmış listesini kabul eder; ayarlanmadığında
    varsayılan RTT destekli denetim `telegram-mentioned-message-reply` olur.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/yayın otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir rol secret'ı ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı varsa Docker
    sarmalayıcısı Convex'i otomatik olarak seçer.
  - Sarmalayıcı, Docker build/kurulum çalışmasından önce ana makinede Telegram
    veya Convex kimlik bilgisi env değerlerini doğrular.
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca kimlik
    bilgisi öncesi kurulumu bilinçli olarak debug ederken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
    Convex kimlik bilgileri seçildiğinde ve rol ayarlanmadığında, sarmalayıcı
    CI içinde `ci`, CI dışında `maintainer` kullanır.
  - GitHub Actions bu hattı manuel maintainer iş akışı `NPM Telegram Beta E2E`
    olarak sunar. Merge sırasında çalışmaz. İş akışı `qa-live-shared` ortamını
    ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir ref, yayımlanmış npm spec, SHA-256 ile
  HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artefaktı kabul eder,
  normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak
  yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product,
  full veya custom hat profilleriyle çalıştırır. Telegram QA iş akışını aynı
  `package-under-test` artefaktına karşı çalıştırmak için
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

- Enterprise/özel tarball aynaları açık bir güvenilir kaynak politikası kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`, güvenilir iş akışı ref'inden `.github/package-trusted-sources.json`
okur ve URL kimlik bilgilerini veya iş akışı girdisi özel ağ baypasını kabul
etmez. Adlandırılmış politika bearer auth bildiriyorsa sabit
`OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını yapılandırın.

- Artefakt kanıtı başka bir Actions çalıştırmasından tarball artefaktı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build'ini Docker içinde paketler ve kurar, OpenAI
    yapılandırılmış olarak Gateway'i başlatır, ardından config düzenlemeleriyle
    paketlenmiş kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik her indirilebilir Plugin'i açıkça
    kurduğunu ve ikinci yeniden başlatmanın gizli bağımlılık onarımı
    çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası
    doctor'ının eski plugin bağımlılığı artıklarını harness tarafı postinstall
    onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels konukları genelinde yerel paketli kurulum güncelleme smoke testini
    çalıştırır. Seçilen her platform önce istenen baseline paketini kurar,
    ardından aynı konuk içinde kurulu `openclaw update` komutunu çalıştırır ve
    kurulu sürümü, güncelleme durumunu, gateway hazır olma durumunu ve bir yerel
    ajan turunu doğrular.
  - Tek bir konuk üzerinde iterasyon yaparken `--platform macos`,
    `--platform windows` veya `--platform linux` kullanın. Özet artefakt yolu ve
    hat başına durum için `--json` kullanın.
  - OpenAI hattı, canlı ajan turu kanıtı için varsayılan olarak `openai/gpt-5.5`
    kullanır. Başka bir OpenAI modelini bilinçli olarak doğrularken
    `--model <provider/model>` iletin veya `OPENCLAW_PARALLELS_OPENAI_MODEL`
    ayarlayın.
  - Parallels taşıma duraklamalarının test penceresinin geri kalanını tüketmesini
    önlemek için uzun yerel çalıştırmaları ana makine timeout'u ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında
    yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`,
    `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme çalışmasında 10 ila 15 dakika geçirebilir; iç içe npm debug günlüğü
    ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke
    hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri
    yükleme, paket sunma veya konuk gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketlenmiş Plugin yüzeyini çalıştırır çünkü
    konuşma, görüntü üretimi ve medya anlama gibi yetenek cepheleri, ajan turunun
    kendisi yalnızca basit bir metin yanıtını denetlese bile paketlenmiş çalışma
    zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, tek kullanımlık Docker destekli bir Tuwunel homeserver üzerinde çalıştırır. Yalnızca kaynak checkout - paketlenmiş kurulumlar `qa-lab` içermez.
  - Tam CLI, profil/senaryo kataloğu, env değişkenleri ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env üzerinden gelen driver ve SUT bot token’larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id’si sayısal Telegram sohbet id’si olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuz kiralamalarına katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar canary, bahsetme geçidi, komut adresleme, `/status`, botlar arası bahsedilmiş yanıtlar ve çekirdek yerel komut yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve Telegram son ileti streaming regresyonlarını kapsar. `session_status` gibi isteğe bağlı problar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olursa sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız
    `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için `@BotFather` içinde her iki bot için Bot-to-Bot Communication Mode’u etkinleştirin ve driver botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve `qa-evidence.json` yazar. Yanıtlayan senaryolar, driver gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

`Mantis Telegram Live`, bu hattın etrafındaki PR kanıtı sarmalayıcısıdır. Aday ref’i
Convex ile kiralanmış Telegram kimlik bilgileriyle çalıştırır, redakte edilmiş QA
raporunu/kanıt paketini bir Crabbox masaüstü tarayıcısında işler, MP4 kanıt kaydeder,
hareket kırpılmış bir GIF üretir, artifact paketini yükler ve `pr_number` ayarlandığında
Mantis GitHub App üzerinden satır içi PR kanıtı gönderir. Bakımcılar bunu Actions UI
üzerinden `Mantis Scenario` (`scenario_id:
telegram-live`) ile veya doğrudan bir pull request yorumundan başlatabilir:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`, PR görsel kanıtı için ajansal yerel Telegram Desktop
önce/sonra sarmalayıcısıdır. Bunu Actions UI’dan serbest biçimli `instructions` ile,
`Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) üzerinden veya bir PR yorumundan başlatın:

```text
@openclaw-mantis telegram desktop proof
```

Mantis ajanı PR’ı okur, değişikliği hangi Telegram görünür davranışın kanıtladığına
karar verir, baseline ve aday ref’lerde gerçek kullanıcı Crabbox Telegram Desktop
kanıt hattını çalıştırır, yerel GIF’ler kullanışlı olana kadar yineleme yapar, eşleştirilmiş
bir `motionPreview` manifesti yazar ve `pr_number` ayarlandığında aynı 2 sütunlu GIF
tablosunu Mantis GitHub App üzerinden gönderir.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstünü kiralar veya yeniden kullanır, yerel Telegram Desktop kurar, OpenClaw’ı kiralanmış bir Telegram SUT bot token’ıyla yapılandırır, gateway’i başlatır ve görünür VNC masaüstünden ekran görüntüsü/MP4 kanıtı kaydeder.
  - Varsayılan olarak `--credential-source convex` kullanır; böylece workflow’lar yalnızca Convex aracı gizlisine ihtiyaç duyar. `pnpm openclaw qa telegram` ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenleriyle `--credential-source env` kullanın.
  - Telegram Desktop yine de bir kullanıcı oturumu/profili gerektirir. Bot token’ı yalnızca OpenClaw’ı yapılandırır. base64 `.tgz` profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya `--keep-lease` kullanıp VNC üzerinden bir kez manuel oturum açın.
  - Çıkış dizininin altında `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4` yazar.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır; hat başına kapsam matrisi [QA genel bakış → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

Canlı taşıma QA için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde
QA lab, Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu
kiralama için Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır. Bölüm adı
Discord, Slack ve WhatsApp desteğinden öncedir; kiralama sözleşmesi türler arasında paylaşılır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme id’si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Bakımcı admin komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Convex site URL’sini, aracı secret’larını, endpoint önekini, HTTP zaman aşımını
ve admin/liste erişilebilirliğini secret değerleri yazdırmadan denetlemek için canlı
çalıştırmalardan önce `doctor` kullanın. Betiklerde ve CI araçlarında makinece
okunabilir çıktı için `--json` kullanın.

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
- `groupId` sayısal bir Telegram sohbet id string’i olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload’ları reddeder.

Telegram gerçek kullanıcı türü için payload şekli:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal string’ler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256` SHA-256 hex string’leri olmalıdır.
- `kind: "telegram-user"` Mantis Telegram Desktop kanıt workflow’u için ayrılmıştır. Genel QA Lab hatları bunu almamalıdır.

Aracı tarafından doğrulanan çok kanallı payload’lar:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack hatları da havuzdan kiralama alabilir, ancak Slack payload doğrulaması şu anda
aracı yerine Slack QA runner içinde bulunur. Slack satırları için
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
kullanın.

### QA’ya kanal ekleme

Yeni kanal adapter’ları için mimari ve senaryo yardımcı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari çıta: taşıma runner’ını paylaşılan `qa-lab` host seam üzerinde uygulamak, Plugin manifestinde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve `qa/scenarios/` altında senaryolar yazmaktır.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Unit / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard setini kullanır ve paralel zamanlama için çok projeli shard’ları proje başına config’lere genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altında çekirdek/unit envanterleri; UI unit testleri ayrılmış `unit-ui` shard’ında çalışır
- Kapsam:
  - Saf unit testleri
  - İşlem içi entegrasyon testleri (gateway auth, routing, tooling, parsing, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
  - Resolver ve public-surface loader testleri, gerçek paketli Plugin kaynak API’leri yerine
    üretilmiş küçük Plugin fixture’larıyla geniş `api.js` ve
    `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri
    Plugin sahibine ait sözleşme/entegrasyon paketlerine aittir.

Yerel bağımlılık politikası:

- Varsayılan test kurulumları isteğe bağlı yerel Discord opus derlemelerini atlar. Discord voice paketlenmiş `libopus-wasm` kullanır ve `@discordjs/opus`, yerel testler ile Testbox hatlarının yerel addon’ı derlememesi için `allowBuilds` içinde devre dışı kalır.
- Yerel opus performansını varsayılan OpenClaw kurulum/test döngülerinde değil, `libopus-wasm` benchmark reposunda karşılaştırın. Varsayılan `allowBuilds` içinde `@discordjs/opus` değerini `true` yapmayın; bu, ilgisiz kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök proje işlemi yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/plugin çalışmalarının ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel denetim kapısıdır. Diff'i core, core testleri, plugin'ler, plugin testleri, uygulamalar, dokümanlar, yayın metadatası, canlı Docker araçları ve araçlama olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca yayın metadatası sürüm artırımları, en üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard ile hedefli version/config/root-dependency denetimleri çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: canlı Docker auth betikleri için shell söz dizimi ve canlı Docker scheduler kuru çalıştırması. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı program alanlarından import-light birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; stateful/runtime-ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için özel bucket'lara sahiptir. CI, reply alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import-ağır tek bir bucket tüm Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, extension batch sweep'i ve yalnızca yayın amaçlı `agentic-plugins` shard'ını kasıtlı olarak atlar. Tam Yayın Doğrulaması, yayın adaylarında bu plugin/extension-ağır paketler için ayrı `Plugin Prerelease` alt iş akışını dispatch eder.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Message-tool keşif girdilerini veya compaction runtime
      context'ini değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyonları ekleyin.
    - Gömülü runner entegrasyon paketlerini sağlıklı tutun:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` ve
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca
      yardımcı testler bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool ve izolasyon varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projelerde, e2e'de ve canlı yapılandırmalarda izole olmayan runner'ı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve optimizer'ını korur, ancak o da
      paylaşılan izole olmayan runner üzerinde çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı
      `threads` + `isolate: false` varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 derleme
      yükünü azaltmak için Vitest alt Node işlemlerine varsayılan olarak
      `--no-maglev` ekler. Stok V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
    - `scripts/run-vitest.mjs`, açık non-watch Vitest çalıştırmalarını stdout
      veya stderr çıktısı olmadan 5 dakika sonra sonlandırır. Kasıtlı olarak
      sessiz bir inceleme için watchdog'u devre dışı bırakmak üzere
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel iterasyon">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları
      yeniden stage eder ve lint, typecheck veya test çalıştırmaz.
    - Handoff veya push öncesinde akıllı yerel denetim kapısına ihtiyaç
      duyduğunuzda `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer.
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha
      geniş Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını
      korur, yalnızca daha yüksek bir worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi kasıtlı olarak muhafazakârdır ve
      host load average zaten yüksek olduğunda geri çekilir; bu nedenle birden
      fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test kablolaması değiştiğinde changed-mode
      yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma
      dosyalarını `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE`
      etkin kalacak şekilde ayarlanmıştır; doğrudan profil çıkarma için tek
      bir açık cache konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil çıkarma görünümünü
      `origin/main` sonrasındaki değişen dosyalarla sınırlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tam yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      shard'ları shard adını ekler, böylece filtrelenmiş shard'lar ayrı izlenebilir.
    - Tek bir sıcak test hâlâ zamanının çoğunu başlatma import'larında
      harcıyorsa, ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının
      arkasında tutun ve runtime yardımcılarını yalnızca `vi.mock(...)` üzerinden
      geçirmek için deep-import etmek yerine bu sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` yolunu o commit'lenmiş diff için yerel kök proje yoluyla
      karşılaştırır ve wall time ile macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden
      yönlendirerek mevcut kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform
      overhead'i için main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim paketi için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Stabilite (gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanmış
- Kapsam:
  - Varsayılan olarak diagnostics etkin gerçek bir loopback Gateway başlatır
  - Diagnostic event yolu üzerinden sentetik Gateway mesajı, memory ve büyük payload yükü sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle kalıcılık yardımcılarını kapsar
  - Recorder'ın sınırlı kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve oturum başına queue derinliklerinin tekrar sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Stabilite regresyonu takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (repo toplamı)

- Komut: `pnpm test:e2e`
- Kapsam:
  - Gateway smoke E2E hattını çalıştırır
  - Mock'lanmış Control UI tarayıcı E2E hattını çalıştırır
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Playwright Chromium'un kurulu olmasını gerektirir

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e:gateway`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki bundled-plugin E2E testleri
- Runtime varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç overhead'ini azaltmak için varsayılan olarak silent mode'da çalışır.
- Yararlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlandırılır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok instance'lı Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır networking
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E (Control UI mock'lanmış tarayıcı)

- Komut: `pnpm test:ui:e2e`
- Yapılandırma: `test/vitest/vitest.ui-e2e.config.ts`
- Dosyalar: `ui/src/**/*.e2e.test.ts`
- Kapsam:
  - Vite Control UI'ı başlatır
  - Playwright üzerinden gerçek bir Chromium sayfasını sürer
  - Gateway WebSocket'i deterministik tarayıcı içi mock'larla değiştirir
- Beklentiler:
  - `pnpm test:e2e` parçası olarak CI'da çalışır
  - Gerçek Gateway, agent veya provider anahtarı gerekmez
  - Tarayıcı bağımlılığı mevcut olmalıdır (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Etkin bir yerel OpenShell Gateway'i yeniden kullanır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell backend'ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Etkin bir yerel OpenShell Gateway ve onun config kaynağını gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test sandbox'ını yok eder
- Yararlı override'lar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - Kayıtlı Gateway config'ini izole teste göstermek için `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - Host policy fixture tarafından kullanılan Docker Gateway IP'sini override etmek için `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Canlı (gerçek provider'lar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı biçimi değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalamak
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - "Her şey" yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar zaten dışa aktarılmış API anahtarlarını ve hazırlanmış kimlik doğrulama profillerini kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` değerini yalıtır ve yapılandırma/kimlik doğrulama malzemesini geçici bir test ana dizinine kopyalar; böylece birim fikstürleri gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek ana dizininizi kullanmasına bilinçli olarak ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını tutar ve gateway başlangıç günlüklerini/Bonjour gevezeliğini susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlı çalıştırmaya özel geçersiz kılma için `OPENCLAW_LIVE_*_KEY` ayarlayın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e yazar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessizken bile görünür şekilde etkin kalır.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının canlı çalıştırmalar sırasında hemen akması için Vitest konsol müdahalesini devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/yoklama Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağ iletişimi / WS protokolü / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "botum çalışmıyor" hata ayıklama / sağlayıcıya özgü hatalar / araç çağırma: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness'ı) - ayrıca canlı çalıştırmalar için kimlik bilgisi işleme - için
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi, çalışma alanınızı ve isteğe bağlı profil env dosyanızı bağlar. Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` değerleridir.
- Docker canlı çalıştırıcıları, gerektiği yerlerde kendi pratik sınırlarını korur:
  `test:docker:live-models` varsayılan olarak seçilmiş, desteklenen, yüksek sinyalli kümeyi kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` değerlerini kullanır. Açıkça daha küçük bir sınır veya daha büyük tarama istediğinizde `OPENCLAW_LIVE_MAX_MODELS`
  ya da gateway env değişkenlerini ayarlayın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez oluşturur, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden bir kez npm tarball olarak paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Çıplak imaj, kurulum/güncelleme/Plugin bağımlılığı hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden oluşturulmuş tarball'ı bağlar. İşlevsel imaj, oluşturulmuş uygulama işlevselliği hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yaşar; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yaşar; `scripts/test-docker-all.mjs` seçilen planı yürütür. Birleşik çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çok servisli hatların hepsinin aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, havuz boşken zamanlayıcı yine de onu başlatabilir ve ardından kapasite tekrar kullanılabilir olana kadar tek başına çalıştırır. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, bayat OpenClaw E2E kapsayıcılarını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu zamanlamaları kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, ya da seçilen hatlar, paket/imaj ihtiyaçları ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözer, onu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak o tarball'a karşı çalıştırır. Profiller kapsama genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme sağ kalan matrisi, sürüm varsayılanları ve hata triyajı için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, statik oluşturulmuş grafiği `dist/entry.js` ve `dist/cli/run-main.js` üzerinden gezer ve komut dağıtımından önce Dispatcher öncesi başlangıç içe aktarımları Commander, istem UI, undici veya günlükleme gibi paket bağımlılıklarını içe aktarırsa başarısız olur; ayrıca paketlenmiş gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk gateway yollarının statik içe aktarımlarını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımını, onboard yardımını, doctor yardımını, durumu, yapılandırma şemasını ve bir model-list komutunu kapsar.
- Paket Kabulü eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesme noktasına kadar harness yalnızca yayımlanmış paket meta veri boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türevli git fikstüründe eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta veri migrasyonu. `2026.4.25` sonrasındaki paketlerde bu yollar katı hatalardır.
- Kapsayıcı smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek kapsayıcıyı başlatır ve üst düzey entegrasyon yollarını doğrular.
- Paketlenmiş OpenClaw tarball'ını `scripts/lib/openclaw-e2e-instance.sh` üzerinden kuran Docker/Bash E2E hatları, `npm install` için `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` sınırını uygular (varsayılan `600s`; hata ayıklama için sarmalayıcıyı devre dışı bırakmak üzere `0` ayarlayın).

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama ana dizinlerini (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalıştırmadan önce bunları kapsayıcı ana dizinine kopyalar; böylece harici CLI OAuth, ana makine kimlik doğrulama deposunu değiştirmeden token yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; Droid/OpenCode için katı kapsam `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` üzerinden sağlanır)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama sunucusu harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testleri: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ve `pnpm qa:observability:smoke` özel QA kaynak-checkout hatlarıdır. npm tarball QA Lab'i atladığı için bunlar bilinçli olarak paket Docker sürüm hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, varsayılan olarak env-ref onboarding üzerinden OpenAI'ı ve Telegram'ı yapılandırır, doctor çalıştırır ve bir sahte OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.

- Sürüm kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-user-journey`, paketlenmiş OpenClaw tarball’unu temiz bir Docker home içinde global olarak kurar, onboarding çalıştırır, taklit edilmiş bir OpenAI provider yapılandırır, bir agent turu çalıştırır, harici plugin’leri kurar/kaldırır, ClickClack’i yerel bir fixture’a karşı yapılandırır, giden/gelen mesajlaşmayı doğrular, Gateway’i yeniden başlatır ve doctor çalıştırır.
- Sürüm tipli onboarding smoke testi: `pnpm test:docker:release-typed-onboarding`, paketlenmiş tarball’u kurar, `openclaw onboard` komutunu gerçek bir TTY üzerinden yürütür, OpenAI’yi env-ref provider olarak yapılandırır, ham anahtarın kalıcılaştırılmadığını doğrular ve taklit edilmiş bir agent turu çalıştırır.
- Sürüm medya/bellek smoke testi: `pnpm test:docker:release-media-memory`, paketlenmiş tarball’u kurar, bir PNG ekinden görüntü anlamayı, OpenAI uyumlu görüntü üretimi çıktısını, bellek araması geri çağırmasını ve Gateway yeniden başlatması boyunca geri çağırmanın korunmasını doğrular.
- Sürüm yükseltme kullanıcı yolculuğu smoke testi: `pnpm test:docker:release-upgrade-user-journey`, varsayılan olarak aday tarball’dan daha eski olan en yeni yayımlanmış tabanı kurar, yayımlanmış paket üzerinde provider/plugin/ClickClack durumunu yapılandırır, aday tarball’a yükseltir ve ardından temel agent/plugin/channel yolculuğunu yeniden çalıştırır. Daha eski yayımlanmış taban yoksa aday sürümü yeniden kullanır. Tabanı `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` ile geçersiz kılın.
- Sürüm plugin marketplace smoke testi: `pnpm test:docker:release-plugin-marketplace`, yerel bir fixture marketplace’ten kurulum yapar, kurulu plugin’i günceller, kaldırır ve kurulum metadata’sı budanmış halde plugin CLI’nın kaybolduğunu doğrular.
- Skill kurulum smoke testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tarball’unu Docker içinde global olarak kurar, yapılandırmada yüklenen arşiv kurulumlarını devre dışı bırakır, aramadan mevcut canlı ClawHub skill slug’ını çözümler, `openclaw skills install` ile kurar ve kurulu skill ile `.clawhub` origin/lock metadata’sını doğrular.
- Güncelleme channel değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball’unu Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcılaştırılmış channel ve plugin güncelleme sonrası çalışmasını doğrular, ardından tekrar paket `stable` kanalına geçer ve güncelleme durumunu kontrol eder.
- Yükseltme sağ kalan smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball’unu agent’lar, channel yapılandırması, plugin allowlist’leri, eski plugin bağımlılık durumu ve mevcut workspace/session dosyaları içeren kirli bir eski kullanıcı fixture’ı üzerine kurar. Canlı provider veya channel anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum koruması ile başlangıç/durum bütçelerini kontrol eder.
- Yayımlanmış yükseltme sağ kalan smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını hazırlar, bu tabanı gömülü bir komut tarifiyle yapılandırır, oluşan yapılandırmayı doğrular, yayımlanmış kurulumu aday tarball’a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’leri, durum korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Tek bir tabanı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan kesin yerel tabanları `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve issue biçimli fixture’ları `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; reported-issues kümesi otomatik harici OpenClaw plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta taban token’larını çözümler ve Full Release Validation, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olacak şekilde genişletir.
- Session runtime context smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime context transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine bundled görüntü provider’larını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball’u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile oluşturulmuş bir Docker imajından `dist/` kopyalayın.
- Installer Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container’ları arasında tek bir npm cache paylaşır. Update smoke varsayılan olarak aday tarball’a yükseltmeden önce stable taban olarak npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub’da Install Smoke workflow’unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan installer kontrolleri, root sahipli cache girdilerinin kullanıcı yerel kurulum davranışını maskelememesi için yalıtılmış bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache’ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde script’i bu env olmadan yerelde çalıştırın.
- Agents paylaşılan workspace silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak root Dockerfile imajını oluşturur, yalıtılmış bir container home içinde tek workspace’e sahip iki agent hazırlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş workspace davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını oluşturur, Chromium’u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP role snapshot’larının link URL’lerini, cursor-promoted tıklanabilirleri, iframe ref’lerini ve frame metadata’sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`), taklit edilmiş bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` seviyesinden `low` seviyesine yükselttiğini doğrular, ardından provider schema reddini zorlar ve ham ayrıntının Gateway log’larında göründüğünü kontrol eder.
- MCP channel bridge (hazırlanmış Gateway + stdio bridge + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü OpenClaw profil allow/deny smoke testi): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin’ler (yerel yol, `file:`, hoisted bağımlılıklara sahip npm registry, hatalı biçimli npm paket metadata’sı, git moving refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için install/update smoke testi): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink package/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` yoksa test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmemiş smoke testi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball’unu çıplak bir container’a kurar, bir npm plugin’i kurar, enable/disable arasında geçiş yapar, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından her lifecycle aşaması için RSS/CPU metriklerini log’larken uninstall işleminin eski durumu hâlâ kaldırdığını doğrular.
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin’ler: `pnpm test:docker:plugins`, yerel yol, `file:`, hoisted bağımlılıklara sahip npm registry, git moving refs, ClawHub fixture’ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için install/update smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu plugin’ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlemeli npm plugin kurulumu, enable, disable, upgrade, downgrade ve eksik kod uninstall işlemini kapsar.

Paylaşılan işlevsel imajı elle önceden oluşturmak ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite’e özgü imaj geçersiz kılmaları ayarlandığında hâlâ önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, script’ler imaj zaten yerel değilse onu çeker. QR ve installer Docker testleri, paylaşılan derlenmiş uygulama runtime’ı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile’larını tutar.

Canlı model Docker runner’ları ayrıca mevcut checkout’u salt okunur olarak bind-mount eder ve
container içinde geçici bir workdir’e hazırlar. Bu, runtime image’ını küçük tutarken
Vitest’i tam olarak yerel kaynak/config’inize karşı çalıştırmaya devam eder.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artifact’leri
kopyalamak için dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`,
`__openclaw_vitest__` ve app’e yerel `.build` ya da Gradle çıktı dizinleri gibi
büyük, yalnızca yerel cache’leri ve app build çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı probe’ları
container içinde gerçek Telegram/Discord/vb. kanal worker’larını başlatmaz.
`test:docker:live-models` yine `pnpm test:live` çalıştırır; bu nedenle bu Docker
lane’inde gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de geçirin.
`test:docker:openwebui` daha yüksek seviyeli bir uyumluluk smoke testidir:
OpenAI uyumlu HTTP endpoint’leri etkinleştirilmiş bir OpenClaw gateway container’ı
başlatır, bu gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır,
Open WebUI üzerinden oturum açar, `/api/models` endpoint’inin `openclaw/default`
sunduğunu doğrular, ardından Open WebUI’nin `/api/chat/completions` proxy’si
üzerinden gerçek bir chat isteği gönderir.
Canlı model completion’ı beklemeden Open WebUI oturum açma ve model keşfinden
sonra durması gereken release-path CI kontrolleri için
`OPENWEBUI_SMOKE_MODE=models` ayarlayın.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker’ın Open WebUI
image’ını çekmesi ve Open WebUI’nin kendi cold-start kurulumunu bitirmesi
gerekebilir.
Bu lane kullanılabilir bir canlı model anahtarı bekler. Bunu process environment,
hazırlanmış auth profilleri veya açık bir `OPENCLAW_PROFILE_FILE` üzerinden sağlayın.
Başarılı çalıştırmalar `{ "ok": true, "model": "openclaw/default", ... }` gibi
küçük bir JSON payload’ı yazdırır.
`test:docker:mcp-channels` özellikle deterministiktir ve gerçek bir Telegram,
Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway container’ını
boot eder, `openclaw mcp serve` spawn eden ikinci bir container başlatır, ardından
gerçek stdio MCP köprüsü üzerinden yönlendirilmiş conversation keşfini, transcript
okumalarını, attachment metadata’sını, canlı event queue davranışını, outbound send
routing’i ve Claude tarzı kanal + permission bildirimlerini doğrular. Bildirim
kontrolü ham stdio MCP frame’lerini doğrudan inceler; böylece smoke testi yalnızca
belirli bir client SDK’sının yüzeye çıkardığını değil, köprünün gerçekten ne
yayınladığını doğrular.
`test:docker:agent-bundle-mcp-tools` deterministiktir ve canlı model anahtarı
gerektirmez. Repo Docker image’ını build eder, container içinde gerçek bir stdio
MCP probe server’ı başlatır, bu server’ı gömülü OpenClaw bundle MCP runtime’ı
üzerinden materialize eder, tool’u yürütür, ardından `coding` ve `messaging`
değerlerinin `bundle-mcp` tool’larını tuttuğunu, `minimal` ve
`tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarı
gerektirmez. Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway
başlatır, izole bir cron turn ve bir `sessions_spawn` tek seferlik child turn
çalıştırır, ardından MCP child process’inin her çalıştırmadan sonra çıktığını
doğrular.

Manuel ACP doğal dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script’i regresyon/debug workflow’ları için tutun. ACP thread routing doğrulaması için yeniden gerekebilir; bu nedenle silmeyin.

Yararlı env var’ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` testleri çalıştırmadan önce mount edilir ve source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` geçici config/workspace dizinleri ve harici CLI auth mount’ları olmadan, yalnızca `OPENCLAW_PROFILE_FILE` içinden source edilen env var’larını doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache’lenmiş CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - Manuel olarak `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle override edin
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde provider’ları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Rebuild gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` image’ını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Cred’lerin env’den değil profile store’dan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinin kullandığı nonce-check prompt’unu override etmek için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI image tag’ini override etmek için `OPENWEBUI_IMAGE=...`

## Doküman sağlama kontrolü

Doküman düzenlemelerinden sonra docs kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-safe)

Bunlar gerçek provider’lar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway tool calling (mock OpenAI, gerçek gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu kılınır): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval’ları (skills)

Zaten “agent güvenilirlik eval’ları” gibi davranan birkaç CI-safe testimiz var:

- Gerçek gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan uçtan uca wizard flow’ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt’ta listelendiğinde agent doğru skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow contract’ları:** tool sırası, session history aktarımı ve sandbox sınırlarını assert eden çok turlu senaryolar.

Gelecekteki eval’lar önce deterministik kalmalıdır:

- Tool call’ları + sırasını, skill dosyası okumalarını ve session wiring’i assert etmek için mock provider’lar kullanan bir senaryo runner’ı.
- Skill odaklı küçük bir senaryo paketi (kullanma vs kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval’lar (opt-in, env-gated), yalnızca CI-safe paket hazır olduktan sonra.

## Contract testleri (plugin ve kanal şekli)

Contract testleri, kayıtlı her plugin ve kanalın kendi interface contract’ına
uyduğunu doğrular. Keşfedilen tüm plugin’ler üzerinde iterasyon yapar ve bir dizi
şekil ve davranış assertion’ı çalıştırırlar. Varsayılan `pnpm test` unit lane’i
bu paylaşılan seam ve smoke dosyalarını bilinçli olarak atlar; paylaşılan kanal
veya provider yüzeylerine dokunduğunuzda contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract’lar: `pnpm test:contracts`
- Yalnızca kanal contract’ları: `pnpm test:contracts:channels`
- Yalnızca provider contract’ları: `pnpm test:contracts:plugins`

### Kanal contract’ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, name, capabilities)
- **setup** - Kurulum wizard contract’ı
- **session-binding** - Session binding davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Inbound mesaj işleme
- **actions** - Kanal action handler’ları
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Grup policy enforcement

### Provider durum contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probe’ları
- **registry** - Plugin registry şekli

### Provider contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth flow contract’ı
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Kurulum wizard’ı

### Ne zaman çalıştırılmalı

- plugin-sdk export’ları veya subpath’leri değiştirildikten sonra
- Bir kanal veya provider plugin’i eklendikten ya da değiştirildikten sonra
- Plugin registration veya discovery refactor edildikten sonra

Contract testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regresyon ekleyin (mock/stub provider veya tam request-shape dönüşümünü capture edin)
- Doğası gereği yalnızca canlıysa (rate limit’ler, auth policy’leri), canlı testi dar tutun ve env var’larıyla opt-in yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - provider request conversion/replay bug → doğrudan models test’i
  - gateway session/history/tool pipeline bug → gateway live smoke veya CI-safe gateway mock test’i
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata’sından (`listSecretTargetRegistryEntries()`) SecretRef class başına bir örnek target türetir, ardından traversal-segment exec id’lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef target family eklerseniz, o testteki `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış target id’lerinde bilinçli olarak başarısız olur; böylece yeni class’lar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve plugin’leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
