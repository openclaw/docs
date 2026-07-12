---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test paketleri, Docker çalıştırıcıları ve her testin kapsadığı alanlar'
title: Test Etme
x-i18n:
    generated_at: "2026-07-12T12:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw, üç Vitest paketine (birim/entegrasyon, uçtan uca, canlı) ve Docker
çalıştırıcılarına sahiptir. Bu sayfa, her paketin neleri kapsadığını, belirli
bir iş akışı için hangi komutun çalıştırılacağını, canlı testlerin kimlik
bilgilerini nasıl bulduğunu ve gerçek dünyadaki sağlayıcı/model hataları için
regresyon testlerinin nasıl ekleneceğini açıklar.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi ve senaryo yazımı.
- [Matris QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için başvuru kaynağı.
- [Olgunluk puan kartı](/tr/maturity/scorecard) - sürüm QA kanıtlarının kararlılık ve LTS kararlarını nasıl desteklediği.
- [QA kanalı](/tr/channels/qa-channel) - depo destekli senaryoların kullandığı sentetik aktarım Plugin'i.

Bu sayfa, standart test paketlerini ve Docker/Parallels çalıştırıcılarını kapsar. Aşağıdaki [QA'ya özgü çalıştırıcılar](#qa-specific-runners), somut `qa` çağrılarını listeler ve yukarıdaki başvuru kaynaklarına yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam geçiş kontrolü (gönderimden önce beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklara sahip bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme, Plugin/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux sanal makine destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güvence istediğinizde:

- Bilgilendirme amaçlı V8 kapsam raporu: `pnpm test:coverage`
- Uçtan uca test paketi: `pnpm test:e2e`

## Test Geçici Dizinleri

Sahipliğin açık olması ve temizliğin test yaşam döngüsü içinde kalması için
testlerin sahip olduğu geçici dizinlerde `test/helpers/temp-dir.ts` içindeki
paylaşılan yardımcıları kullanın:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` kasıtlı olarak elle temizlik yöntemi
sunmaz; her testten sonra temizliğin sahibi Vitest'tir. Eski alt düzey
yardımcılar (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) henüz
taşınmamış testler için hâlâ mevcuttur; bunları yeni kodlarda kullanmaktan ve
bir test ham geçici dizin davranışını açıkça doğrulamıyorsa yeni yalın
`fs.mkdtemp*` çağrıları eklemekten kaçının. Yalın bir geçici dizin gerçekten
gerektiğinde, gerekçesiyle birlikte denetlenebilir bir izin yorumu ekleyin:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs`, mevcut temizlik biçimlerini
engellemeden eklenen fark satırlarındaki yeni yalın geçici dizin oluşturma
işlemlerini ve paylaşılan yardımcının yeni elle kullanımını bildirir.
`scripts/changed-lanes.mjs` ile aynı test yolu sınıflandırmasını izler ve
paylaşılan yardımcı uygulamasının kendisini atlar. `check:changed`, değişen
test yolları için bu raporu yalnızca uyarı veren bir CI sinyali olarak
çalıştırır (hatalar değil, GitHub uyarı ek açıklamaları).

## Canlı ve Docker/Parallels iş akışları

Gerçek sağlayıcılarda/modellerde hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleme: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.6-luna` aracı dönüşü için
  `live_openai_candidate=true` veya Kova CPU/yığın/iz yapıtları için
  `deep_profile=true` ile `OpenClaw Performance` iş akışını tetikleyin. Günlük
  zamanlanmış çalıştırmalar, sahte sağlayıcı, ayrıntılı profil ve GPT-5.6 Luna
  hattı raporlarını, yapıtları tüketen ayrı bir yayımlayıcı iş üzerinden
  `openclaw/clawgrit-reports` deposunda yayımlar; eksik veya geçersiz yayımlayıcı
  kimlik doğrulaması, zamanlanmış çalıştırmaların ve `profile=release`
  çalıştırmalarının başarısız olmasına neden olur. Sürüm dışı elle tetiklemeler
  GitHub yapıtlarını korur ve rapor yayımlamayı tavsiye niteliğinde değerlendirir.
  Sahte sağlayıcı raporu ayrıca kaynak düzeyinde Gateway başlatma, bellek,
  Plugin baskısı, tekrarlanan sahte model merhaba döngüsü ve CLI başlangıç
  ölçümlerini içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model bir metin dönüşü ve küçük bir dosya okuma tarzı yoklama
    çalıştırır. Meta verileri `image` girdisini belirten modeller ayrıca küçük
    bir görüntü dönüşü çalıştırır. Sağlayıcı hatalarını yalıtırken ek yoklamaları
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve elle
    çalıştırılan `OpenClaw Release Checks`, sağlayıcıya göre parçalara ayrılmış
    Docker canlı model matris işlerini içeren yeniden kullanılabilir canlı/uçtan
    uca iş akışını `include_live_suites: true` ile çağırır.
  - Odaklanmış CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yüksek sinyal değerine sahip yeni sağlayıcı gizli bilgilerini
    `scripts/ci-hydrate-live-auth.sh` ile
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve
    bu dosyanın zamanlanmış/sürüm çağıranlarına ekleyin.
- Yerel Codex bağlı sohbet duman testi: `pnpm test:docker:live-codex-bind`
  - Codex uygulama sunucusu yoluna karşı bir Docker canlı hattı çalıştırır,
    sentetik bir Slack özel mesajını `/codex bind` ile bağlar, `/codex fast`
    ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın
    ve görüntü ekinin ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini
    doğrular.
- Codex uygulama sunucusu test düzeneği duman testi: `pnpm test:docker:live-codex-harness`
  - Gateway aracı dönüşlerini Plugin'in sahip olduğu Codex uygulama sunucusu
    test düzeneği üzerinden çalıştırır, `/codex status` ve `/codex models`
    komutlarını doğrular ve varsayılan olarak görüntü, cron MCP, alt aracı ve
    Guardian yoklamalarını çalıştırır. Diğer hataları yalıtırken alt aracı
    yoklamasını `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı
    bırakın. Odaklanmış bir alt aracı kontrolü için diğer yoklamaları devre dışı
    bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu,
    alt aracı yoklamasından sonra çıkar.
- İstek üzerine Codex kurulum duman testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tar arşivini Docker'a kurar, OpenAI API anahtarıyla
    ilk kurulumu çalıştırır ve Codex Plugin'i ile `@openai/codex` bağımlılığının
    istek üzerine yönetilen npm proje köküne indirildiğini doğrular.
- Canlı Plugin aracı bağımlılığı duman testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığına sahip örnek Plugin'i paketler,
    `npm-pack:` üzerinden kurar, yönetilen npm proje kökü altındaki bağımlılığı
    doğrular, ardından canlı bir OpenAI modelinden Plugin aracını çağırmasını
    ve gizli kısa adı döndürmesini ister.
- Crestodian kurtarma komutu duman testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı, fazladan güvenlik
    sağlayan bir kontroldür. `/crestodian status` komutunu çalıştırır, kalıcı
    bir model değişikliğini kuyruğa alır, `/crestodian yes` yanıtını verir ve
    denetim/yapılandırma yazma yolunu doğrular.
- Crestodian ilk çalıştırma Docker duman testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum diziniyle başlar ve önce paketlenmiş
    `openclaw crestodian` CLI'nin çıkarım olmadan güvenli biçimde başarısız
    olduğunu kanıtlar. Ardından paketlenmiş etkinleştirme modülü üzerinden
    sahte Claude'u test eder ve etkinleştirir. Ancak bundan sonra yaklaşık
    eşleşmeli paketlenmiş bir CLI isteği planlayıcıya ulaşır ve tipli kuruluma
    çözümlenir; bunu tek seferlik model, aracı, Discord Plugin'i ve SecretRef
    işlemleri izler. Yapılandırmayı ve denetim girdilerini doğrular. Bu,
    etkileşimli ilk kurulum veya Crestodian aracısı/araç/onay kanıtı değil,
    destekleyici geçiş kontrolü/işlem kanıtıdır. Aynı hat QA Lab içinde
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` komutuyla sunulur.
- Moonshot/Kimi maliyet duman testi: `MOONSHOT_API_KEY` ayarlanmışken
  `openclaw models list --provider moonshot --json` komutunu çalıştırın,
  ardından `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  komutu çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve yardımcı
  transkriptinin normalleştirilmiş `usage.cost` değerini sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan izin listesi ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özgü çalıştırıcılar

QA Lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin
yanında yer alır.

CI, QA Lab'i özel iş akışlarında çalıştırır. Aracılı eşdeğerlik, bağımsız bir
PR iş akışı olarak değil, `QA-Lab - All Lanes` ve sürüm doğrulaması altında
yer alır. Geniş kapsamlı doğrulama, `rerun_group=qa-parity` ile
`Full Release Validation` veya sürüm kontrollerinin QA grubunu kullanmalıdır.
Kararlı/varsayılan sürüm kontrolleri kapsamlı canlı/Docker dayanıklılık
testlerini `run_release_soak=true` arkasında tutar; `full` profili dayanıklılık
testini zorunlu olarak etkinleştirir. `QA-Lab - All Lanes`, `main` üzerinde
her gece ve elle tetiklendiğinde sahte eşdeğerlik hattını, canlı Matrix hattını,
Convex tarafından yönetilen canlı Telegram hattını ve Convex tarafından
yönetilen canlı Discord hattını paralel işler olarak çalıştırır. Zamanlanmış
QA ve sürüm kontrolleri Matrix'e açıkça `--profile fast` iletirken Matrix CLI
ve elle çalıştırılan iş akışı girdisinin varsayılanı `all` olarak kalır; elle
tetikleme, `all` seçeneğini `transport`, `media`, `e2ee-smoke`, `e2ee-deep`
ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release Checks`, sürüm onayından
önce eşdeğerliği, hızlı Matrix hattını ve Telegram hattını çalıştırır; sürüm
aktarım kontrollerinin belirlenimci kalması ve normal sağlayıcı Plugin'i
başlangıcından kaçınması için `mock-openai/gpt-5.6-luna` kullanır. Bu canlı
aktarım Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı
QA eşdeğerlik paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları, `ffmpeg` ve `ffprobe` araçlarını hazır olarak
içeren `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` görüntüsünü
kullanır. Docker canlı model/arka uç parçaları, seçilen her kayıt için bir kez
oluşturulan ortak `ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü
kullanır ve her parçanın içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile bu görüntüyü çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana sistemde çalıştırır.
  - Seçilen senaryo kümesi için karma akış, Vitest ve Playwright senaryo seçimleri dahil olmak üzere üst düzey `qa-evidence.json`, `qa-suite-summary.json` ve
    `qa-suite-report.md` yapıtlarını yazar.
  - `pnpm openclaw qa run --qa-profile <profile>` tarafından başlatıldığında,
    seçilen sınıflandırma profili puan kartını aynı `qa-evidence.json` dosyasına gömer.
    `smoke-ci`, sadeleştirilmiş kanıt yazar (`evidenceMode: "slim"`, giriş başına
    `execution` yoktur). `release`, özenle seçilmiş sürüme hazır olma kesitini kapsar; `all`,
    tüm etkin olgunluk kategorilerini seçer ve tam puan kartı yapıtı gerektiğinde açık
    QA Profili Kanıtı iş akışı başlatmalarını hedefler.
  - Seçilen birden fazla senaryoyu varsayılan olarak yalıtılmış gateway
    işçileriyle paralel çalıştırır. `qa-channel`, varsayılan olarak 4 eşzamanlılık kullanır
    (seçilen senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için
    `--concurrency <count>`, eski seri hat içinse `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan bir kodla çıkar. Başarısız
    çıkış kodu olmadan yapıt üretmek için `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo duyarlı `mock-openai` hattının yerini almadan deneysel
    sabit veri ve protokol taklidi kapsamı için AIMock destekli yerel bir sağlayıcı
    sunucusu başlatır.
- `pnpm openclaw qa coverage --match <query>`
  - Senaryo kimliklerinde, başlıklarında, yüzeylerinde, kapsam kimliklerinde, belge
    referanslarında, kod referanslarında, Plugin'lerde ve sağlayıcı gereksinimlerinde
    arama yapar, ardından eşleşen paket hedeflerini yazdırır.
  - Etkilenen davranışı veya dosya yolunu bildiğiniz ancak en küçük senaryoyu
    bilmediğiniz durumlarda QA Lab çalıştırmasından önce bunu kullanın. Yalnızca
    yol göstericidir; yine de değiştirilen davranışa göre taklit, canlı, Multipass,
    Matrix veya taşıma katmanı kanıtını seçin.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin kapsamlı sınamasını QA Lab üzerinden çalıştırır.
    Harici Kitchen Sink paketini kurar, Plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI etkileşimi çalıştırır ve saldırgan tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir.
    Hazırlanmış Testbox oturumlarında `openclaw-testbox-env` yardımcısı varsa
    Testbox canlı kimlik doğrulama profilini otomatik olarak yükler.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma karşılaştırmalı ölçümünü ve küçük bir taklit QA Lab senaryo
    paketini (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli yüksek CPU gözlemlerini işaretler
    (`--cpu-core-warn`, varsayılan `0.9`; `--hot-wall-warn-ms`, varsayılan
    `30000`); böylece kısa başlatma sıçramaları, dakikalar süren gateway
    kilitlenme gerilemesi gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarıyla çalışır; çalışma kopyasında güncel çalışma zamanı
    çıktısı yoksa önce derleme çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux sanal makinesinde,
    `qa suite` ile aynı senaryo seçimi ve sağlayıcı/model bayraklarını koruyarak
    çalıştırır.
  - Canlı çalıştırmalar, konuk sistem için kullanılabilir QA kimlik doğrulama
    girdilerini iletir: ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
    yapılandırma yolu ve varsa `CODEX_HOME`.
  - Konuk sistemin bağlı çalışma alanı üzerinden geri yazabilmesi için çıktı
    dizinleri depo kökünün altında kalmalıdır.
  - Normal QA raporu ve özetine ek olarak Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli çalışma kopyasından bir npm tar arşivi oluşturur, bunu Docker'a genel
    olarak kurar, etkileşimsiz OpenAI API anahtarı ilk kurulumunu çalıştırır,
    varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin çalışma zamanının
    başlatma bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor'ı çalıştırır
    ve taklit edilmiş bir OpenAI uç noktasına karşı bir yerel ajan etkileşimi çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı dökümleri için belirlenimci bir derlenmiş uygulama
    Docker duman testi çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının görünür
    kullanıcı etkileşimine sızmak yerine görüntülenmeyen özel bir ileti olarak
    korunduğunu doğrular; ardından etkilenmiş bozuk bir oturum JSONL dosyası oluşturur
    ve `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala yeniden yazdığını
    doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker'a bir OpenClaw paket adayını kurar, kurulu paket ilk kurulumunu çalıştırır,
    kurulu CLI üzerinden Telegram'ı yapılandırır, ardından kurulu paketi test edilen
    sistem Gateway'i olarak kullanarak canlı Telegram QA hattını yeniden kullanır.
  - Sarmalayıcı, çalışma kopyasından yalnızca `qa-lab` test düzeneği kaynağını bağlar;
    kurulu paket `dist`, `openclaw/plugin-sdk` ve paketle gelen Plugin çalışma
    zamanının sahibidir; böylece hat, geçerli çalışma kopyisındaki Plugin'leri test
    edilen pakete karıştırmaz.
  - Varsayılan değer `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` şeklindedir;
    kayıt defterinden kurmak yerine çözümlenmiş yerel bir tar arşivini test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ile
    `qa-evidence.json` içinde yinelenen RTT zamanlaması yayınlar. Çalıştırmayı
    ayarlamak için `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` veya
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`, örneklenecek Telegram QA denetim
    kimliklerinin virgülle ayrılmış listesini kabul eder; ayarlanmadığında,
    varsayılan RTT özellikli denetim `telegram-mentioned-message-reply` olur.
  - `pnpm openclaw qa telegram` ile aynı Telegram ortam kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir rol gizli değeri ayarlayın.
    CI ortamında `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol gizli değeri
    mevcutsa Docker sarmalayıcısı Convex'i otomatik olarak seçer.
  - Sarmalayıcı, Docker derleme/kurulum çalışmasından önce ana sistemde Telegram
    veya Convex kimlik bilgisi ortamını doğrular.
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca kimlik
    bilgileri öncesi kurulumu bilinçli olarak hata ayıklarken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için
    paylaşılan `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar. Convex
    kimlik bilgileri seçildiğinde ve rol ayarlanmadığında sarmalayıcı, CI ortamında
    `ci`, CI dışında ise `maintainer` kullanır.
  - GitHub Actions bu hattı `NPM Telegram Beta E2E` adlı elle çalıştırılan bakımcı
    iş akışı olarak sunar. Birleştirme sırasında çalışmaz. İş akışı
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırmalı ürün kanıtı için
  `Package Acceptance` seçeneğini sunar. Bir Git referansı, yayımlanmış npm
  belirtimi, SHA-256 ile birlikte HTTPS tar arşivi URL'si, güvenilir URL ilkesi
  veya başka bir çalıştırmadan tar arşivi yapıtı
  (`source=ref|npm|url|trusted-url|artifact`) kabul eder, normalleştirilmiş
  `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler ve ardından
  mevcut Docker E2E zamanlayıcısını `smoke`, `package`, `product`, `full` veya
  `custom` hat profilleriyle çalıştırır. Telegram QA iş akışını aynı
  `package-under-test` yapıtına karşı çalıştırmak için
  `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
  - En son beta ürün kanıtı:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Tam tar arşivi URL'si kanıtı bir özet gerektirir ve genel URL güvenlik ilkesini
  kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Kurumsal/özel tar arşivi yansıları açık bir güvenilir kaynak ilkesi kullanır:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`, güvenilir iş akışı referansından
`.github/package-trusted-sources.json` dosyasını okur ve URL kimlik bilgilerini
veya iş akışı girdisiyle özel ağ atlamasını kabul etmez. Adlandırılmış ilke bearer
kimlik doğrulaması bildiriyorsa sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` gizli
değerini yapılandırın.

- Yapıt kanıtı, başka bir Actions çalıştırmasından tar arşivi yapıtı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw derlemesini paketleyip Docker'a kurar, OpenAI yapılandırılmış
    halde Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketle gelen
    kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri mevcut bırakmadığını,
    ilk yapılandırılmış doctor onarımının eksik indirilebilir her Plugin'i açıkça
    kurduğunu ve ikinci yeniden başlatmanın gizli bağımlılık onarımı çalıştırmadığını
    doğrular.
  - Ayrıca bilinen eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor
    işleminin, test düzeneği tarafında postinstall onarımı olmadan eski Plugin
    bağımlılığı kalıntılarını temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketlenmiş kurulum güncelleme duman testini Parallels konukları genelinde
    çalıştırır. Seçilen her platform önce istenen temel paketi kurar, ardından aynı
    konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme
    durumunu, gateway hazır olma durumunu ve bir yerel ajan etkileşimini doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`,
    `--platform windows` veya `--platform linux` kullanın. Özet yapıtının yolu ve
    her hat durumu için `--json` kullanın.
  - OpenAI hattı, canlı ajan etkileşimi kanıtı için varsayılan olarak
    `openai/gpt-5.6-luna` kullanır. Başka bir OpenAI modelini doğrulamak için
    `--model <provider/model>` iletin veya `OPENCLAW_PARALLELS_OPENAI_MODEL`
    ayarlayın.
  - Parallels taşıma katmanı takılmalarının test süresinin kalanını tüketememesi
    için uzun yerel çalıştırmaları ana sistem zaman aşımıyla sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında
    yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`,
    `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme çalışmasına 10 ila 15 dakika harcayabilir; iç içe npm hata ayıklama
    günlüğü ilerlediği sürece bu durum normaldir.
  - Bu toplu sarmalayıcıyı bağımsız Parallels macOS, Windows veya Linux duman
    hatlarıyla paralel çalıştırmayın. Bunlar sanal makine durumunu paylaşır ve anlık
    görüntü geri yükleme, paket sunumu veya konuk gateway durumu konusunda
    çakışabilir.
  - Güncelleme sonrası kanıt normal paketle gelen Plugin yüzeyini çalıştırır; çünkü
    konuşma, görüntü oluşturma ve medya anlama gibi yetenek cepheleri, ajan
    etkileşiminin kendisi yalnızca basit bir metin yanıtını denetlese bile paketle
    gelen çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol hızlı doğrulama testi için yalnızca yerel AIMock sağlayıcı
    sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, geçici ve Docker destekli bir Tuwunel ana
    sunucusuna karşı çalıştırır. Yalnızca kaynak kod deposundan çalıştırılabilir;
    paketlenmiş kurulumlar `qa-lab` içermez.
  - Tam CLI, profil/senaryo kataloğu, ortam değişkenleri ve yapıt düzeni:
    [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortam değişkenlerinden alınan sürücü ve SUT bot
    belirteçlerini kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği, sayısal
    Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex`
    seçeneğini destekler. Varsayılan olarak ortam değişkeni modunu kullanın
    veya havuz kiralamalarını etkinleştirmek için
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar; canary, bahsetme geçidi, komut adresleme, `/status`,
    botlar arası bahsetmeli yanıtlar ve temel yerel komut yanıtlarını kapsar.
    `mock-openai` varsayılanları ayrıca belirlenimsel yanıt zinciri ve
    Telegram son ileti akışı regresyonlarını kapsar. `session_status` gibi
    isteğe bağlı yoklamalar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfırdan farklı bir kodla çıkar.
    Başarısız çıkış kodu olmadan yapıt üretmek için `--allow-failures`
    kullanın.
  - Aynı özel grupta iki farklı bot bulunmasını ve SUT botunun bir Telegram
    kullanıcı adı sunmasını gerektirir.
  - Botlar arası kararlı gözlem için her iki botta da `@BotFather` içindeki
    Bot-to-Bot Communication Mode seçeneğini etkinleştirin ve sürücü botun
    gruptaki bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve
    `qa-evidence.json` yazar. Yanıt içeren senaryolar, sürücünün gönderme
    isteğinden gözlemlenen SUT yanıtına kadar geçen RTT'yi içerir.

`Mantis Telegram Live`, bu hattın PR kanıtı sarmalayıcısıdır. Aday ref'i
Convex üzerinden kiralanan Telegram kimlik bilgileriyle çalıştırır, gizliliği
korunmuş QA raporu/kanıt paketini bir Crabbox masaüstü tarayıcısında işler,
MP4 kanıtı kaydeder, hareket bölümleri kırpılmış bir GIF oluşturur, yapıt
paketini yükler ve `pr_number` ayarlandığında Mantis GitHub App aracılığıyla
satır içi PR kanıtı gönderir. Bakımcılar bunu Actions UI üzerinden `Mantis Scenario`
(`scenario_id: telegram-live`) ile veya doğrudan bir çekme isteği yorumundan
başlatabilir:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`, PR görsel kanıtı için işlemsel yerel Telegram
Desktop önce/sonra sarmalayıcısıdır. Bunu Actions UI üzerinden serbest biçimli
`instructions` ile, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) aracılığıyla veya bir PR yorumundan başlatın:

```text
@openclaw-mantis telegram desktop proof
```

Mantis aracısı PR'yi okur, değişikliği hangi Telegram'da görünür davranışın
kanıtladığına karar verir, gerçek kullanıcıya yönelik Crabbox Telegram Desktop
kanıt hattını temel ve aday ref'lerde çalıştırır, yerel GIF'ler kullanışlı
olana kadar yineler, eşleştirilmiş bir `motionPreview` manifesti yazar ve
`pr_number` ayarlandığında aynı 2 sütunlu GIF tablosunu Mantis GitHub App
aracılığıyla gönderir.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstü kiralar veya mevcut kiralamayı yeniden kullanır,
    yerel Telegram Desktop'ı kurar, OpenClaw'ı kiralanmış bir Telegram SUT bot
    belirteciyle yapılandırır, Gateway'i başlatır ve görünür VNC masaüstünden
    ekran görüntüsü/MP4 kanıtı kaydeder.
  - İş akışlarının yalnızca Convex aracı sırrına ihtiyaç duyması için varsayılan
    olarak `--credential-source convex` kullanır. `pnpm openclaw qa telegram`
    ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenlerini kullanmak için
    `--credential-source env` seçeneğini kullanın.
  - Telegram Desktop yine de bir kullanıcı oturumu/profili gerektirir. Bot
    belirteci yalnızca OpenClaw'ı yapılandırır. Base64 biçiminde bir `.tgz`
    profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya
    `--keep-lease` kullanarak VNC üzerinden bir kez elle oturum açın.
  - Çıktı dizini altında `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4`
    dosyalarını yazar.

Canlı aktarım hatları, yeni aktarımların farklılaşmasını önlemek için tek bir
standart sözleşmeyi paylaşır; hat başına kapsam matrisi
[QA genel bakışı - Canlı aktarım kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage)
bölümündedir. `qa-channel`, geniş kapsamlı sentetik test paketidir ve bu
matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

Canlı aktarım QA'sı için `--credential-source convex` (veya
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde QA laboratuvarı,
Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu
kiralamaya Heartbeat gönderir ve kapanış sırasında kiralamayı serbest bırakır.
Bölümün adı Discord, Slack ve WhatsApp desteğinden daha eskidir; kiralama
sözleşmesi türler arasında paylaşılır.

Referans Convex proje iskelesi: `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir sır:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Ortam değişkeni varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan
    `ci`, diğer durumlarda `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback
  `http://` Convex URL'lerine izin verir.

Normal işletimde `OPENCLAW_QA_CONVEX_SITE_URL`, `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuza ekleme/havuzdan kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı sırlarını, uç nokta
önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini sır değerlerini
yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI yardımcılarında
makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
İstekler bir `Authorization: Bearer <role secret>` üstbilgisiyle kimlik
doğrular; aşağıdaki gövdelerde bu üstbilgi gösterilmemiştir:

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
- `POST /admin/add` (yalnızca bakımcı sırrı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı sırrı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için yük biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş
  yükleri reddeder.

Gerçek Telegram kullanıcısı türü için yük biçimi:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal dizeler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256`, SHA-256 onaltılık dizeleri
  olmalıdır.
- `kind: "telegram-user"`, Mantis Telegram Desktop kanıt iş akışı için
  ayrılmıştır. Genel QA Lab hatları bunu almamalıdır.

Aracı tarafından doğrulanan çok kanallı yükler:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack hatları da havuzdan kiralama yapabilir ancak Slack yük doğrulaması şu
anda aracı yerine Slack QA çalıştırıcısında bulunur. Slack satırları için
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
kullanın.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcılarının mimarisi ve senaryo yardımcısı adları
[QA genel bakışı - Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel)
bölümündedir. Asgari gereklilikler: aktarım çalıştırıcısını paylaşılan `qa-lab`
ana bilgisayar bağlantı noktasında uygulayın, paylaşılan senaryolar için bir
`adapterFactory` ekleyin, Plugin manifestinde `qaRunners` bildirin,
`openclaw qa <runner>` olarak bağlayın ve `qa/scenarios/` altında senaryolar
yazın.

## Test paketleri (hangisi nerede çalışır)

Paketleri, “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün.

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` parça
  kümesini kullanır ve paralel zamanlama için çok projeli parçaları proje
  başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve
  `test/**/*.test.ts` altındaki temel/birim envanterleri; kullanıcı arayüzü
  birim testleri özel `unit-ui` parçasında çalışır
- Kapsam:
  - Saf birim testleri
  - İşlem içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme,
    araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için belirlenimsel regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtarlar gerekmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve herkese açık yüzey yükleyici testleri, gerçek paketlenmiş
    Plugin kaynak API'leriyle değil, oluşturulmuş küçük Plugin fikstürleriyle
    geniş `api.js` ve `runtime-api.js` geri dönüş davranışını kanıtlamalıdır.
    Gerçek Plugin API yüklemeleri, Plugin'in sahip olduğu sözleşme/entegrasyon
    paketlerinde yer almalıdır.

Yerel bağımlılık ilkesi:

- Varsayılan test kurulumları, isteğe bağlı yerel Discord opus derlemelerini
  atlar. Discord ses işlevi paketlenmiş `libopus-wasm` kullanır ve yerel
  testlerle Testbox hatlarının yerel eklentiyi derlememesi için
  `@discordjs/opus`, `allowBuilds` içinde devre dışı kalır.
- Yerel opus performansını varsayılan OpenClaw kurulum/test döngülerinde değil,
  `libopus-wasm` kıyaslama deposunda karşılaştırın. Varsayılan `allowBuilds`
  içinde `@discordjs/opus` değerini `true` olarak ayarlamayın; bu, ilgisiz
  kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projeler, parçalar ve kapsamlı hatlar">

    - Hedef belirtilmeden çalıştırılan `pnpm test`, tek bir devasa yerel kök proje işlemi yerine on üç küçük parça yapılandırmasını (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yük altındaki makinelerde en yüksek RSS değerini düşürür ve otomatik yanıt/Plugin işlerinin ilgisiz test paketlerini kaynak yetersizliğine uğratmasını önler.
    - Çok parçalı bir izleme döngüsü pratik olmadığından `pnpm test --watch`, yerel kök `vitest.config.ts` proje grafiğini kullanmaya devam eder.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, kök projenin tam başlatma maliyetini ödemez.
    - `pnpm test:changed`, değiştirilen git yollarını varsayılan olarak düşük maliyetli kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiğindeki bağımlılar. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu açıkça kullanmadığınız sürece yapılandırma/kurulum/paket düzenlemeleri testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar kapsamlı çalışmalar için normal akıllı yerel denetim kapısıdır. Farkı çekirdek, çekirdek testleri, eklentiler, eklenti testleri, uygulamalar, belgeler, sürüm meta verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen tür denetimi, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açıkça `pnpm test <target>` komutunu çağırın. Yalnızca sürüm meta verilerini değiştiren sürüm artırımları, paket değişikliklerini en üst düzey sürüm alanı dışında reddeden bir korumayla birlikte hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini çalıştırır.
    - Canlı Docker ACP test düzeneği düzenlemeleri, odaklanmış denetimler çalıştırır: canlı Docker kimlik doğrulama betikleri için kabuk söz dizimi ve canlı Docker zamanlayıcısının deneme çalıştırması. `package.json` değişiklikleri yalnızca fark `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, dışa aktarma, sürüm ve diğer paket yüzeyi düzenlemeleri daha geniş korumaları kullanmaya devam eder.
    - Aracılar, komutlar, eklentiler, otomatik yanıt yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardaki içe aktarma açısından hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durum bilgili/çalışma zamanı açısından ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da değişiklik modu çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri söz konusu dizinin ağır test paketinin tamamını yeniden çalıştırmaz.
    - `auto-reply`, üst düzey çekirdek yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için özel gruplara sahiptir. CI ayrıca yanıt alt ağacını aracı çalıştırıcısı, dağıtım ve komutlar/durum yönlendirme parçalarına böler; böylece içe aktarma açısından ağır tek bir grup Node kuyruğunun tamamını üstlenmez.
    - Normal PR/ana dal CI'ı, paketlenmiş Plugin toplu taramasını ve yalnızca sürüme özel `agentic-plugins` parçasını kasıtlı olarak atlar. Tam Sürüm Doğrulaması, sürüm adaylarında Plugin ağırlıklı bu test paketleri için ayrı `Plugin Prerelease` alt iş akışını tetikler.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - İleti aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklanmış yardımcı
      regresyon testleri ekleyin.
    - Gömülü çalıştırıcı entegrasyon test paketlerini sağlıklı tutun:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` ve
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Bu test paketleri, kapsamlı kimliklerin ve Compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından geçmeye devam ettiğini doğrular;
      yalnızca yardımcıları test eden testler, bu entegrasyon yollarının
      yeterli bir alternatifi değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve yalıtım varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projelerde, uçtan uca testlerde ve canlı yapılandırmalarda
      yalıtılmamış çalıştırıcıyı kullanır.
    - Kök kullanıcı arayüzü hattı kendi `jsdom` kurulumunu ve iyileştiricisini
      korur ancak paylaşılan yalıtılmamış çalıştırıcıda da çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı
      `threads` + `isolate: false` varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme
      yükünü azaltmak için Vitest alt Node işlemlerine varsayılan olarak
      `--no-maglev` ekler. Standart V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarını kullanın.
    - `scripts/run-vitest.mjs`, 5 dakika boyunca stdout veya stderr çıktısı
      üretmeyen açık izleme dışı Vitest çalıştırmalarını sonlandırır. Bilerek
      sessiz yürütülen bir inceleme için gözetim mekanizmasını devre dışı
      bırakmak üzere `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` ayarını kullanın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Ön işleme kancası yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları
      yeniden hazırlar; lint, tür denetimi veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyaç duyduğunuzda teslimden veya
      göndermeden önce `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak düşük maliyetli kapsamlı hatlar
      üzerinden yönlendirilir. Yalnızca aracı bir test düzeneği, yapılandırma,
      paket veya sözleşme düzenlemesinin gerçekten daha geniş Vitest kapsamına
      ihtiyaç duyduğuna karar verdiğinde
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max`, yalnızca daha yüksek çalışan
      sınırıyla aynı yönlendirme davranışını korur.
    - Yerel çalışanların otomatik ölçeklendirmesi kasıtlı olarak ölçülüdür ve
      ana makinenin yük ortalaması zaten yüksek olduğunda geri çekilir; böylece
      aynı anda çalışan birden fazla Vitest çalıştırması varsayılan olarak daha
      az zarar verir.
    - Temel Vitest yapılandırması, test bağlantıları değiştiğinde değişiklik
      modu yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma
      dosyalarını `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen ana makinelerde
      `OPENCLAW_VITEST_FS_MODULE_CACHE` seçeneğini etkin tutar; doğrudan
      profilleme için tek bir açık önbellek konumu belirlemek üzere
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarını kullanın.

  </Accordion>

  <Accordion title="Performans hata ayıklaması">

    - `pnpm test:perf:imports`, Vitest içe aktarma süresi raporlamasını ve içe
      aktarma dökümü çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü
      `origin/main` sonrasında değiştirilen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına
      yazılır. Tüm yapılandırmayı çalıştıran işlemler anahtar olarak yapılandırma
      yolunu kullanır; dahil etme deseni kullanan CI parçaları, filtrelenmiş
      parçaların ayrı olarak izlenebilmesi için parça adını sona ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç içe aktarmalarında
      harcıyorsa ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının
      arkasında tutun ve çalışma zamanı yardımcılarını yalnızca
      `vi.mock(...)` üzerinden geçirmek için derinlemesine içe aktarmak yerine
      doğrudan bu sınırın sahtesini oluşturun.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, kaydedilmiş söz konusu
      fark için yönlendirilmiş `test:changed` ile yerel kök proje yolunu
      karşılaştırır ve geçen süreyle birlikte macOS en yüksek RSS değerini
      yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değiştirilen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden
      yönlendirerek geçerli kirli çalışma ağacının performansını ölçer.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıç ve dönüştürme ek yükü
      için ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim test paketi için çalıştırıcı CPU+bellek profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` ve `test/vitest/vitest.infra.config.ts`; her biri tek çalışan kullanmaya zorlanır
- Kapsam:
  - Tanılama varsayılan olarak etkin biçimde gerçek bir local loopback Gateway başlatır
  - Yapay Gateway iletisi, bellek ve büyük yük hareketliliğini tanılama olay yolu üzerinden yürütür
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgusu yapar
  - Tanılama kararlılığı paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, yapay RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenlidir ve anahtar gerektirmez
  - Kararlılık regresyonu takibi için dar kapsamlı bir hattır; tam Gateway test paketinin alternatifi değildir

### Uçtan uca (depo toplamı)

- Komut: `pnpm test:e2e`
- Kapsam:
  - Gateway duman uçtan uca test hattını çalıştırır
  - Sahte Control UI tarayıcı uçtan uca test hattını çalıştırır
- Beklentiler:
  - CI için güvenlidir ve anahtar gerektirmez
  - Playwright Chromium'un yüklü olmasını gerektirir

### Uçtan uca (Gateway duman testi)

- Komut: `pnpm test:e2e:gateway`
- Yapılandırma: `test/vitest/vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş Plugin uçtan uca testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir çalışanlar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç ek yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Kullanışlı geçersiz kılmalar:
  - Çalışan sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (işlem hattında etkinleştirildiğinde)
  - Gerçek anahtarlar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### Uçtan uca (Control UI sahte tarayıcı)

- Komut: `pnpm test:ui:e2e`
- Yapılandırma: `test/vitest/vitest.ui-e2e.config.ts`
- Dosyalar: `ui/src/**/*.e2e.test.ts`
- Kapsam:
  - Vite Control UI'ı başlatır
  - Playwright üzerinden gerçek bir Chromium sayfasını çalıştırır
  - Gateway WebSocket'i tarayıcı içindeki deterministik sahtelerle değiştirir
- Beklentiler:
  - `pnpm test:e2e` kapsamında CI'da çalışır
  - Gerçek Gateway, aracılar veya sağlayıcı anahtarları gerekmez
  - Tarayıcı bağımlılığı mevcut olmalıdır (`pnpm --dir ui exec playwright install chromium`)

### Uçtan uca: OpenShell arka uç duman testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Etkin bir yerel OpenShell Gateway'i yeniden kullanır
  - Geçici bir yerel Dockerfile'dan korumalı alan oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH yürütmesi üzerinden kullanır
  - Korumalı alan dosya sistemi köprüsü üzerinden uzak sistemin esas alındığı dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ile çalışan bir Docker arka plan programı gerektirir
  - Etkin bir yerel OpenShell Gateway ve yapılandırma kaynağını gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test korumalı alanını yok eder
- Kullanışlı geçersiz kılmalar:
  - Daha geniş uçtan uca test paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyasını veya sarmalayıcı betiği göstermek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - Kayıtlı Gateway yapılandırmasını yalıtılmış teste sunmak için `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - Ana makine ilkesi test verisinin kullandığı Docker Gateway IP adresini geçersiz kılmak için `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `test/vitest/vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketle birlikte sunulan Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` olarak ayarlanır)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı biçimi değişikliklerini, araç çağırma davranışlarındaki farklılıkları, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalama
- Beklentiler:
  - Tasarım gereği CI ortamında kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Maliyete yol açar / hız sınırlarını tüketir
  - "Her şeyi" çalıştırmak yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, önceden dışa aktarılmış API anahtarlarını ve hazırlanmış kimlik doğrulama profillerini kullanır.
- Canlı çalıştırmalar varsayılan olarak `HOME` dizinini yalıtmaya ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalamaya devam eder; böylece birim testi düzenekleri gerçek `~/.openclaw` dizininizi değiştiremez.
- Yalnızca canlı testlerin gerçek ana dizininizi kullanmasına bilerek ihtiyaç duyduğunuzda `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarını kullanın.
- `pnpm test:live` varsayılan olarak daha sessiz bir kip kullanır: `[live] ...` ilerleme çıktısını korur ve Gateway önyükleme günlükleriyle Bonjour mesajlarını susturur. Başlangıç günlüklerinin tamamını yeniden görmek istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` olarak ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ayarlayın ya da canlı çalıştırmaya özel geçersiz kılma için `OPENCLAW_LIVE_*_KEY` kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı test paketleri ilerleme satırlarını standart hata akışına gönderir; böylece Vitest konsol yakalama sessizken bile uzun sağlayıcı çağrılarının etkin olduğu görünür.
  - `test/vitest/vitest.live.config.ts`, sağlayıcı/Gateway ilerleme satırlarının canlı çalıştırmalar sırasında anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat aralıklarını `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/yoklama Heartbeat aralıklarını `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi test paketini çalıştırmalıyım?

Şu karar tablosunu kullanın:

- Mantığı/testleri düzenleme: `pnpm test` çalıştırın (çok fazla değişiklik yaptıysanız ayrıca `pnpm test:coverage`)
- Gateway ağ iletişimine / WS protokolüne / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "Botum çalışmıyor" durumunda hata ayıklama / sağlayıcıya özgü hatalar / araç çağırma: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa erişen) testler

Canlı model matrisi, CLI arka uç duman testleri, ACP duman testleri, Codex app-server
test düzeneği ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI,
görüntü, müzik, video, medya test düzeneği) ile canlı çalıştırmaların kimlik bilgisi yönetimi için

- [Canlı test paketlerini test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
  Plugin doğrulama denetim listesi için
  [Güncellemeleri ve Pluginleri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" denetimleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker görüntüsü içinde yalnızca eşleşen profil anahtarlı canlı dosyayı (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi, çalışma alanınızı ve isteğe bağlı profil ortam dosyanızı bağlar. Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları, gerektiği yerlerde kendi pratik sınırlarını korur:
  `test:docker:live-models` varsayılan olarak özenle seçilmiş, desteklenen ve güçlü sinyal veren kümeyi kullanır;
  `test:docker:live-gateway` ise varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha küçük bir sınır veya daha geniş bir tarama istediğinizde `OPENCLAW_LIVE_MAX_MODELS`
  ya da Gateway ortam değişkenlerini ayarlayın.
- `test:docker:all`, canlı Docker görüntüsünü `test:docker:live-build` aracılığıyla bir kez oluşturur, `scripts/package-openclaw-for-docker.mjs` üzerinden OpenClaw'ı bir kez npm tar arşivi olarak paketler ve ardından iki `scripts/e2e/Dockerfile` görüntüsünü oluşturur/yeniden kullanır. Temel görüntü, yükleme/güncelleme/Plugin bağımlılığı hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden oluşturulmuş tar arşivini bağlar. İşlevsel görüntü, derlenmiş uygulama işlevselliği hatları için aynı tar arşivini `/app` içine yükler. Docker hattı tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçili planı yürütür. Toplu çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını denetlerken kaynak sınırları ağır canlı, npm yükleme ve çok hizmetli hatların aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa zamanlayıcı, havuz boşken yine de hattı başlatabilir ve kapasite yeniden kullanılabilir olana kadar hattı tek başına çalıştırır. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (ve diğer `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` geçersiz kılmalarını) yalnızca Docker ana makinesinde daha fazla kullanılabilir kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön denetimi gerçekleştirir, eski OpenClaw E2E konteynerlerini kaldırır, her 30 saniyede bir durum bilgisi yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker'ı oluşturmadan veya çalıştırmadan ağırlıklı hat bildirimini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, seçili hatlara yönelik CI planını, paket/görüntü gereksinimlerini ve kimlik bilgilerini yazdırmak için `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu yüklenebilir tar arşivi ürün olarak çalışıyor mu?" sorusuna yönelik GitHub yerel paket doğrulama kapısıdır. `source=npm`, `source=ref`, `source=url`, `source=trusted-url` veya `source=artifact` kaynaklarından tek bir aday paketi çözümler, bunu `package-under-test` olarak yükler ve ardından seçili referansı yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak bu tar arşivine karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full` (ayrıca açık bir hat listesi için `custom`). Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme dayanıklılık matrisi, sürüm varsayılanları ve hata triyajı için [Güncellemeleri ve Pluginleri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm denetimleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` dosyalarından başlayarak statik derlenmiş grafiği tarar ve komut yönlendirmesinden önce bu yönlendirme öncesi önyükleme grafiği herhangi bir harici paketi (Commander, istem kullanıcı arayüzü, undici, günlükleme ve benzeri başlangıç maliyeti yüksek bağımlılıkların tümü buna dahildir) statik olarak içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını 70 KB ile sınırlar ve bu parçadan bilinen soğuk Gateway yollarının (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) statik olarak içe aktarılmasını reddeder. `scripts/release-check.ts`, paketlenmiş CLI'ı ayrıca `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` ve `models list --provider openai` ile duman testinden geçirir.
- Package Acceptance eski sürüm uyumluluğu `2026.4.25` ile sınırlandırılmıştır (`2026.4.25-beta.*` dahildir). Bu son sınıra kadar test düzeneği yalnızca yayımlanmış paket meta verilerindeki eksikliklere tolerans gösterir: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tar arşivinden türetilen git düzeneğindeki eksik yama dosyaları, kalıcılaştırılmış `update.channel` değerinin eksikliği, eski Plugin yükleme kaydı konumları, pazar yeri yükleme kaydı kalıcılığının eksikliği ve `plugins update` sırasındaki yapılandırma meta verisi geçişi. `2026.4.25` sonrasındaki paketlerde bu yollar kesin hata sayılır.
- Konteyner duman testi çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload`, bir veya daha fazla gerçek konteyneri başlatır ve üst düzey entegrasyon yollarını doğrular.
- Paketlenmiş OpenClaw tar arşivini `scripts/lib/openclaw-e2e-instance.sh` üzerinden yükleyen Docker/Bash E2E hatları, `npm install` işlemini `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` ile sınırlar (varsayılan `600s`; hata ayıklama amacıyla sarmalayıcıyı devre dışı bırakmak için `0` ayarlayın).

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama ana dizinlerini
(veya çalıştırma daraltılmadığında desteklenenlerin tümünü) bağlar ve ardından harici CLI OAuth'un ana makinedeki kimlik doğrulama deposunu değiştirmeden tokenları
yenileyebilmesi için bunları çalıştırmadan önce konteyner ana dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'ı kapsar; `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` aracılığıyla katı Droid/OpenCode kapsamı sunar)
- CLI arka uç duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server test düzeneği duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme aracısı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testleri: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ve `pnpm qa:observability:smoke`, özel QA kaynak kullanıma alma hatlarıdır. npm tar arşivi QA Lab'ı içermediğinden bunlar bilinçli olarak paket Docker sürüm hatlarının parçası değildir.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk katılım sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tar arşivi ilk katılım/kanal/aracı duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tar arşivini Docker'a genel olarak yükler, OpenAI'ı ortam değişkeni başvurulu ilk katılım ve varsayılan olarak Telegram ile yapılandırır, doctor çalıştırır ve taklit edilmiş bir OpenAI aracı turu çalıştırır. Önceden oluşturulmuş bir tar arşivini `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.

- Sürüm kullanıcı yolculuğu duman testi: `pnpm test:docker:release-user-journey`, paketlenmiş OpenClaw tar arşivini temiz bir Docker ana dizinine genel olarak kurar, ilk kurulumu çalıştırır, taklit bir OpenAI sağlayıcısı yapılandırır, bir ajan turu çalıştırır, harici Plugin'leri kurar/kaldırır, ClickClack'i yerel bir fikstüre göre yapılandırır, giden/gelen mesajlaşmayı doğrular, Gateway'i yeniden başlatır ve doctor'ı çalıştırır.
- Sürüm tür belirtilmiş ilk kurulum duman testi: `pnpm test:docker:release-typed-onboarding`, paketlenmiş tar arşivini kurar, gerçek bir TTY üzerinden `openclaw onboard` komutunu yürütür, OpenAI'ı env-ref sağlayıcısı olarak yapılandırır, ham anahtarların kalıcı olarak saklanmadığını doğrular ve taklit bir ajan turu çalıştırır.
- Sürüm medya/bellek duman testi: `pnpm test:docker:release-media-memory`, paketlenmiş tar arşivini kurar; bir PNG ekinden görüntü anlamayı, OpenAI uyumlu görüntü oluşturma çıktısını, bellek aramasında hatırlamayı ve Gateway yeniden başlatıldıktan sonra hatırlamanın korunmasını doğrular.
- Sürüm yükseltme kullanıcı yolculuğu duman testi: `pnpm test:docker:release-upgrade-user-journey`, varsayılan olarak aday tar arşivinden eski olan yayımlanmış en yeni temel sürümü kurar, yayımlanmış pakette sağlayıcı/Plugin/ClickClack durumunu yapılandırır, aday tar arşivine yükseltir ve ardından temel ajan/Plugin/kanal yolculuğunu yeniden çalıştırır. Yayımlanmış daha eski bir temel sürüm yoksa aday sürümü yeniden kullanır. Temel sürümü `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` ile geçersiz kılın.
- Sürüm Plugin pazaryeri duman testi: `pnpm test:docker:release-plugin-marketplace`, yerel bir fikstür pazaryerinden kurulum yapar, kurulu Plugin'i günceller, kaldırır ve kurulum meta verileri temizlendiğinde Plugin CLI'sinin kaybolduğunu doğrular.
- Skill kurulum duman testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tar arşivini Docker'a genel olarak kurar, yapılandırmada yüklenen arşivlerden kurulumu devre dışı bırakır, arama üzerinden güncel canlı ClawHub skill kısa adını çözümler, `openclaw skills install` ile kurar ve kurulu skill'i, `.clawhub` kaynak/kilit meta verileriyle birlikte doğrular.
- Güncelleme kanalı değiştirme duman testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tar arşivini Docker'a genel olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve güncelleme sonrası Plugin işlemlerinin çalıştığını doğrular, ardından yeniden paket `stable` kanalına geçip güncelleme durumunu denetler.
- Yükseltmeden sağ çıkma duman testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tar arşivini; ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin bağımlılığı durumu ve mevcut çalışma alanı/oturum dosyaları içeren temiz olmayan eski kullanıcı fikstürünün üzerine kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir local loopback Gateway başlatır ve yapılandırma/durum korumasıyla birlikte başlangıç/durum süre sınırlarını denetler.
- Yayımlanmış sürümden yükseltmede sağ çıkma duman testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` sürümünü kurar, gerçekçi mevcut kullanıcı dosyalarını hazırlar, bu temel sürümü yerleşik bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, yayımlanmış kurulumu aday tar arşivine günceller, etkileşimsiz doctor'ı çalıştırır, `.artifacts/upgrade-survivor/summary.json` dosyasını yazar, ardından bir local loopback Gateway başlatıp yapılandırılmış amaçları, durum korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum süre sınırlarını denetler. Tek bir temel sürümü `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın; toplu zamanlayıcıdan kesin yerel temel sürümleri genişletmesini `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile, sorun biçimli fikstürleri genişletmesini ise `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile isteyin; bildirilen sorunlar kümesi, harici OpenClaw Plugin kurulumlarının otomatik onarımı için `configured-plugin-installs` öğesini içerir. Paket Kabulü bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta temel sürüm belirteçlerini çözümler ve Tam Sürüm Doğrulaması, sürüm dayanıklılık paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` ile `reported-issues` değerlerini kapsayacak şekilde genişletir.
- Oturum çalışma zamanı bağlamı duman testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transkriptinin kalıcı olarak saklanmasını ve etkilenen yinelenmiş istem yeniden yazma dallarının doctor tarafından onarılmasını doğrular.
- Bun genel kurulum duman testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir ana dizinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketle gelen görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tar arşivini `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya oluşturulmuş bir Docker imajındaki `dist/` dizinini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Yükleyici Docker duman testi: `bash scripts/test-install-sh-docker.sh`, kök, güncelleme ve doğrudan npm konteynerleri arasında tek bir npm önbelleğini paylaşır. Güncelleme duman testi, aday tar arşivine yükseltmeden önce kararlı temel sürüm olarak varsayılan biçimde npm `latest` sürümünü kullanır. Yerel olarak `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'daki Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Kök olmayan yükleyici denetimleri, köke ait önbellek girdilerinin kullanıcıya yerel kurulum davranışını gizlememesi için yalıtılmış bir npm önbelleği kullanır. Yerel yeniden çalıştırmalarda kök/güncelleme/doğrudan npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` değerini ayarlayın.
- Install Smoke CI, yinelenen doğrudan npm genel güncellemesini `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği bu ortam değişkeni olmadan yerel olarak çalıştırın.
- Ajanların paylaşılan çalışma alanını silmesi CLI duman testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak kök Dockerfile imajını oluşturur, yalıtılmış bir konteyner ana dizininde tek çalışma alanına sahip iki ajan hazırlar, `agents delete --json` komutunu çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Kurulum duman testi imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi ve ana makine yaşam döngüsü: `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`), iki konteynerli LAN WebSocket kimlik doğrulama/sağlık duman testini korur; ardından hazırlama engellemesini, korunan denetim erişimini, sürdürme kurtarmasını ve hazırlanmış aynı konteyner durdurma/başlatma işlemini kanıtlamak için local loopback Yönetici HTTP'sini kullanır. Yeniden başlatma denetimi, özgün kiralama süresi dolmadan tamamlanmalıdır; askıya alma durumunun sürece yerel olduğunu, kalıcı Gateway yapılandırması ile konteyner kimliğinin ise korunduğunu doğrular ve makine tarafından okunabilir aşama zamanlaması JSON'u üretir.
- Tarayıcı CDP anlık görüntü duman testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajıyla birlikte bir Chromium katmanı oluşturur, Chromium'u ham CDP ile başlatır, `browser doctor --deep` komutunu çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'lerini, imleçle tıklanabilir hâle getirilen öğeleri, iframe başvurularını ve çerçeve meta verilerini kapsadığını doğrular.
- OpenAI Responses `web_search` asgari akıl yürütme regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), taklit bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` düzeyinden `low` düzeyine yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (hazırlanmış Gateway + stdio köprüsü + ham Claude bildirim çerçevesi duman testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw paket MCP araçları (gerçek stdio MCP sunucusu + gömülü OpenClaw profili izin verme/reddetme duman testi): `pnpm test:docker:agent-bundle-mcp-tools` (betik: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/alt ajan MCP temizliği (gerçek Gateway + yalıtılmış Cron ve tek seferlik alt ajan çalıştırmalarından sonra stdio MCP alt sürecinin sonlandırılması): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm kayıt defteri, hatalı npm paket meta verileri, hareketli git başvuruları, kapsamlı ClawHub, pazaryeri güncellemeleri ve Claude paketi etkinleştirme/inceleme için kurulum/güncelleme duman testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` değerini ayarlayın veya varsayılan kapsamlı paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fikstür sunucusu kullanır.
- Değişiklik içermeyen Plugin güncelleme duman testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi duman testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tar arşivini boş bir konteynere kurar, bir npm Plugin'i kurar, etkinleştirme/devre dışı bırakma durumunu değiştirir, yerel bir npm kayıt defteri üzerinden yükseltir ve önceki sürüme düşürür, kurulu kodu siler, ardından her yaşam döngüsü aşaması için RSS/CPU metriklerini günlüğe kaydederken kaldırma işleminin eski durumu yine de sildiğini doğrular.
- Yapılandırma yeniden yükleme meta verileri duman testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`; yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm kayıt defteri, hareketli git başvuruları, ClawHub fikstürleri, pazaryeri güncellemeleri ve Claude paketi etkinleştirme/inceleme için kurulum/güncelleme duman testlerini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için değişiklik içermeyen güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak kullanımı izlenen npm Plugin kurulumu, etkinleştirme, devre dışı bırakma, yükseltme, önceki sürüme düşürme ve kod eksikken kaldırma işlemlerini kapsar.

Paylaşılan işlevsel imajı önceden oluşturup elle yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi test paketine özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, imaj zaten yerel değilse betikler onu çeker. QR ve yükleyici Docker testleri, paylaşılan oluşturulmuş uygulama çalışma zamanı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile'larını kullanmayı sürdürür.

Canlı model Docker çalıştırıcıları ayrıca mevcut çalışma kopyasını salt okunur olarak bağlar
ve konteyner içindeki geçici bir çalışma dizinine hazırlar. Bu, Vitest'i tam olarak
yerel kaynak/yapılandırmanızla çalıştırmaya devam ederken çalışma zamanı imajını
küçük tutar. Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü
yapıtları kopyalamak için dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`,
`__openclaw_vitest__` gibi büyük yalnızca yerel önbellekleri ve uygulama derleme
çıktılarını, ayrıca uygulamaya yerel `.build` veya Gradle çıktı dizinlerini atlar.
Ayrıca Gateway canlı yoklamalarının konteyner içinde gerçek Telegram/Discord/vb.
kanal işçilerini başlatmaması için `OPENCLAW_SKIP_CHANNELS=1` değerini ayarlarlar.
`test:docker:live-models` yine de `pnpm test:live` komutunu çalıştırır; dolayısıyla bu
Docker hattındaki Gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.

`test:docker:openwebui`, daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş bir OpenClaw Gateway konteyneri başlatır, bu Gateway'e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden oturum açar, `/api/models` uç noktasının `openclaw/default` modelini sunduğunu doğrular ve ardından Open WebUI'ın `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir. Canlı model tamamlamasını beklemeden Open WebUI oturum açma ve model keşfinden sonra durması gereken sürüm yolu CI kontrolleri için `OPENWEBUI_SMOKE_MODE=models` ayarını kullanın. Docker'ın Open WebUI imajını çekmesi ve Open WebUI'ın kendi soğuk başlangıç kurulumunu tamamlaması gerekebileceğinden ilk çalıştırma belirgin ölçüde daha yavaş olabilir. Bu hat; işlem ortamı, hazırlanmış kimlik doğrulama profilleri veya açıkça belirtilmiş bir `OPENCLAW_PROFILE_FILE` aracılığıyla sağlanan, kullanılabilir bir canlı model anahtarı bekler. Başarılı çalıştırmalar `{ "ok": true, "model": "openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.

`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir Telegram, Discord veya iMessage hesabı gerektirmez. Önceden verilerle hazırlanmış bir Gateway konteynerini başlatır, `openclaw mcp serve` komutunu çalıştıran ikinci bir konteyner başlatır ve ardından gerçek stdio MCP köprüsü üzerinden yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim kontrolü, ham stdio MCP çerçevelerini doğrudan inceler; böylece duman testi yalnızca belirli bir istemci SDK'sının göstermeyi başardıklarını değil, köprünün gerçekten ürettiklerini doğrular.

`test:docker:agent-bundle-mcp-tools` deterministiktir ve canlı bir model anahtarı gerektirmez. Deponun Docker imajını oluşturur, konteyner içinde gerçek bir stdio MCP yoklama sunucusu başlatır, bu sunucuyu gömülü OpenClaw paket MCP çalışma zamanı üzerinden somutlaştırır, aracı çalıştırır ve ardından `minimal` ile `tools.deny: ["bundle-mcp"]` bunları filtrelerken `coding` ile `messaging` seçeneklerinin `bundle-mcp` araçlarını koruduğunu doğrular.

`test:docker:cron-mcp-cleanup` deterministiktir ve canlı bir model anahtarı gerektirmez. Gerçek bir stdio MCP yoklama sunucusuyla önceden verilerle hazırlanmış bir Gateway başlatır, yalıtılmış bir Cron turu ve tek seferlik bir `sessions_spawn` alt turu çalıştırır, ardından MCP alt işleminin her çalıştırmadan sonra sonlandığını doğrular.

Manuel ACP doğal dil iş parçacığı duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP iş parçacığı yönlendirme doğrulaması için yeniden gerekebilir; bu nedenle silmeyin.

Yararlı ortam değişkenleri:

- `/home/node/.openclaw` konumuna bağlanan `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`)
- `/home/node/.openclaw/workspace` konumuna bağlanan `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`)
- Testler çalıştırılmadan önce bağlanan ve kaynak olarak yüklenen `OPENCLAW_PROFILE_FILE=...`
- Geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI kimlik doğrulama bağlamaları olmadan yalnızca `OPENCLAW_PROFILE_FILE` kaynağından yüklenen ortam değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- Docker içindeki önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna bağlanan `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (çalıştırma zaten bir CI/yönetilen bağlama dizini kullanmıyorsa varsayılan: `~/.cache/openclaw/docker-cli-tools`)
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler (çalıştırma belirli sağlayıcılarla sınırlandırılmadığında kullanılır): `.factory`, `.gemini`, `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Sağlayıcılarla sınırlandırılmış çalıştırmalar yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle elle geçersiz kılın
- Çalıştırmayı sınırlandırmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden oluşturma gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin ortamdan değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI duman testi için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI duman testinin kullandığı tek kullanımlık değer kontrolü istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman tutarlılığı

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrollerine de ihtiyaç duyduğunuzda tam Mintlify bağlantı noktası doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI açısından güvenli)

Bunlar, gerçek sağlayıcılar olmadan çalışan "gerçek işlem hattı" regresyonlarıdır:

- Gateway araç çağrısı (sahte OpenAI, gerçek Gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (vaka: "Gateway ajan döngüsü üzerinden uçtan uca sahte bir OpenAI araç çağrısı çalıştırır")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırmayı yazar + kimlik doğrulamasını zorunlu kılar): `src/gateway/gateway.test.ts` (vaka: "Sihirbazı ws üzerinden çalıştırır ve kimlik doğrulama belirteci yapılandırmasını yazar")

## Ajan güvenilirliği değerlendirmeleri (Skills)

"ajan güvenilirliği değerlendirmeleri" gibi davranan, CI açısından güvenli birkaç testimiz zaten var:

- Gerçek Gateway + ajan döngüsü üzerinden sahte araç çağrısı (`src/gateway/gateway.test.ts`).
- Oturum bağlantılarını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde ajan doğru beceriyi seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** Ajan kullanımdan önce `SKILL.md` dosyasını okuyup gerekli adımları/bağımsız değişkenleri izliyor mu?
- **İş akışı sözleşmeleri:** Araç sırasını, oturum geçmişinin aktarımını ve korumalı alan sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler öncelikle deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, beceri dosyası okumalarını ve oturum bağlantılarını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Beceri odaklı küçük bir senaryo paketi (kullanma ya da kaçınma, geçitleme, istem enjeksiyonu).
- Yalnızca CI açısından güvenli paket hazır olduğunda isteğe bağlı canlı değerlendirmeler (açık katılımlı, ortam değişkeniyle denetlenen).

## Sözleşme testleri (Plugin ve kanal biçimi)

Sözleşme testleri, kayıtlı her Plugin'in ve kanalın kendi arayüz sözleşmesine uygun olduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde yineleme yapar ve bir biçim ve davranış doğrulamaları paketi çalıştırırlar. Varsayılan `pnpm test` birim hattı, bu paylaşılan birleşim noktası ve duman testi dosyalarını kasıtlı olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` konumunda bulunur. Geçerli üst düzey kategoriler:

- **channel-catalog** - paketlenmiş/kayıt defteri kanal kataloğu girdisi meta verileri
- **plugin** (kayıt defteri destekli, parçalanmış) - temel Plugin kayıt biçimi
- **surfaces-only** (kayıt defteri destekli, parçalanmış) - `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` ve `gateway` için yüzey başına biçim kontrolleri
- **session-binding** (kayıt defteri destekli) - oturum bağlama davranışı
- **outbound-payload** - ileti yükü yapısı ve normalleştirme
- **group-policy** (geri dönüş) - kanal başına varsayılan grup politikası uygulaması
- **threading** (kayıt defteri destekli, parçalanmış) - iş parçacığı kimliği işleme
- **directory** (kayıt defteri destekli, parçalanmış) - dizin/liste API'si
- **registry** ve **plugins-core.\*** - kanal Plugin kayıt defteri, yükleyici ve yapılandırma yazma yetkilendirmesi iç işleyişleri

Bu paketlerin kullandığı gelen gönderim-yakalama ve giden-yük test düzeneği yardımcıları, `src/plugin-sdk/channel-contract-testing.ts` üzerinden dahili olarak sunulur (npm kapsamı dışında, herkese açık bir SDK alt yolu değildir); bu dizinde bağımsız bir `inbound.contract.test.ts` dosyası yoktur.

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur. Geçerli kategoriler şunları içerir:

- **shape** - Plugin manifestosu, API ve çalışma zamanı dışa aktarma biçimi
- **plugin-registration** (+ paralel) - manifesto kayıt vakaları
- **package-manifest** - paket manifestosu gereksinimleri
- **loader** - Plugin yükleyici kurulum/kapatma davranışı
- **registry** - Plugin sözleşme kayıt defteri içerikleri ve araması
- **providers** - paketlenmiş sağlayıcılar genelinde paylaşılan sağlayıcı davranışı ve web araması sağlayıcıları
- **auth-choice** - kimlik doğrulama seçimi meta verileri ve kurulum davranışı
- **provider-catalog-deprecation** - kullanımdan kaldırılmış sağlayıcı kataloğu meta verileri
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - sağlayıcı kurulum sihirbazı sözleşmeleri
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - yeteneğe özgü sağlayıcı sözleşmeleri
- **session-actions**, **session-attachments**, **session-entry-projection** - Plugin'in sahip olduğu oturum durumu sözleşmeleri
- **scheduled-turns** - Plugin zamanlanmış tur meta verileri ve zaman damgası sınırları
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - Plugin ana bilgisayar/çalışma zamanı yaşam döngüsü ve içe aktarma sınırı sözleşmeleri
- **extension-runtime-dependencies** - eklentilerin çalışma zamanı bağımlılıklarının yerleşimi

### Ne zaman çalıştırılmalı

- Plugin SDK dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Canlı ortamda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI açısından güvenli bir regresyon ekleyin (sahte/taklit sağlayıcı veya istek biçiminin tam dönüşümünü yakalayın)
- Doğası gereği yalnızca canlı ortamda oluşuyorsa (hız sınırları, kimlik doğrulama politikaları), canlı testi dar kapsamlı tutun ve ortam değişkenleri aracılığıyla isteğe bağlı çalıştırın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası -> doğrudan model testi
  - Gateway oturum/geçmiş/araç işlem hattı hatası -> Gateway canlı duman testi veya CI açısından güvenli Gateway sahte testi
- SecretRef dolaşım koruması:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için örneklenmiş bir hedef türetir ve ardından dolaşım segmentli çalıştırma kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` dosyasına yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz bu testteki `classifyTargetClass` öğesini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
