---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-05T06:18:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir
Docker çalıştırıcı grubu vardır. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matris QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) — repo destekli senaryolar tarafından kullanılan sentetik aktarım plugin'i.

Bu sayfa, normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde iterasyon yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + gateway aracı/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` agent turu için
  `live_gpt54=true` ile veya Kova CPU/heap/iz artefaktları için
  `deep_profile=true` ile `OpenClaw Performance` gönderin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-sağlayıcı, derin profil ve GPT 5.4 hat artefaktlarını
  `openclaw/clawgrit-reports` içine yayımlar. Mock-sağlayıcı raporu ayrıca kaynak düzeyinde gateway açılışı, bellek,
  plugin baskısı, yinelenen sahte-model merhaba döngüsü ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır.
    Meta verileri `image` girdisi duyuran modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre bölümlenmiş ayrı Docker canlı model
    matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile gönderin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik
    bir Slack DM bağlar, `/codex fast` ve
    `/codex permissions` çalıştırır, ardından düz bir yanıtın ve görüntü ekinin
    ACP yerine yerel plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway agent turlarını plugin'in sahibi olduğu Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` doğrular ve varsayılan olarak görüntü,
    cron MCP, alt agent ve Guardian yoklamalarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken alt agent yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt agent kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt agent yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı, ek güvenlikli kontroldür.
    `/crestodian status` çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI bulunan yapılandırmasız bir konteynerde çalıştırır
    ve bulanık planlayıcı geri dönüşünün denetlenen yazılmış bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/agent/Discord plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve
  asistan transkriptinin normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız olaya ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan izin listesi env değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab'i özel iş akışlarında çalıştırır. Agentic eşdeğerlik, bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation`
veya release-checks QA grubu kullanmalıdır. Kararlı/varsayılan sürüm
kontrolleri, kapsamlı canlı/Docker bekleme testini `run_release_soak=true` arkasında tutar;
`full` profili bekleme testini zorunlu kılar. `QA-Lab - All Lanes`,
`main` üzerinde gecelik olarak ve manuel gönderimden mock eşdeğerlik hattı, canlı
Matrix hattı, Convex tarafından yönetilen canlı Telegram hattı ve Convex tarafından yönetilen canlı Discord
hattı paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix
`--profile fast` değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi
varsayılanı `all` olarak kalır; manuel gönderim `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release
Checks`, sürüm onayından önce eşdeğerliği, hızlı Matrix ve Telegram hatlarıyla birlikte çalıştırır;
sürüm aktarım kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar
ve normal sağlayıcı-plugin başlangıcından kaçınırlar. Bu canlı aktarım
gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA eşdeğerlik
paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları,
zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/backend parçaları, seçilen
commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden oluşturmak
yerine `OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Seçilen birden fazla senaryoyu varsayılan olarak yalıtılmış gateway worker'larıyla
    paralel çalıştırır. `qa-channel` varsayılan olarak concurrency 4 kullanır (seçilen
    senaryo sayısıyla sınırlıdır). Worker sayısını ayarlamak için `--concurrency <count>`
    kullanın veya eski seri lane için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` provider modlarını destekler.
    `aimock`, senaryo farkındalıklı `mock-openai` lane'inin yerine geçmeden deneysel
    fixture ve protokol mock kapsamı için yerel AIMock destekli bir provider sunucusu başlatır.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin gauntlet'ini QA Lab üzerinden çalıştırır. Harici
    Kitchen Sink paketini kurar, Plugin SDK yüzey envanterini doğrular, `/healthz` ve
    `/readyz` uçlarını yoklar, Gateway CPU/RSS kanıtı kaydeder, canlı bir OpenAI turn'ü
    çalıştırır ve adversarial tanılamaları denetler. `OPENAI_API_KEY` gibi canlı OpenAI
    auth gerektirir. Hydrate edilmiş Testbox oturumlarında `openclaw-testbox-env`
    helper'ı mevcut olduğunda Testbox live-auth profilini otomatik olarak kaynak alır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma bench'ini ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altına yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa başlatma patlamaları dakikalarca süren
    gateway peg regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` artifact'lerini kullanır; checkout'ta halihazırda taze runtime çıktısı
    yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite'ini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı provider/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı provider anahtarları, QA canlı provider config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo root altında kalmalıdır, böylece guest mount edilmiş workspace üzerinden geri yazabilir.
  - Normal QA raporu ve özetini, ayrıca Multipass loglarını `.artifacts/qa-e2e/...`
    altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Mevcut checkout'tan bir npm tarball oluşturur, bunu Docker içinde global olarak
    kurar, etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır, varsayılan olarak
    Telegram'ı yapılandırır, paketlenmiş Plugin runtime'ın başlangıç dependency onarımı
    olmadan yüklendiğini doğrular, doctor çalıştırır ve mock edilmiş bir OpenAI endpoint'ine
    karşı bir yerel agent turn'ü çalıştırır.
  - Aynı paketlenmiş kurulum lane'ini Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Embedded runtime context transcript'leri için deterministik bir built-app Docker smoke çalıştırır.
    Gizli OpenClaw runtime context'in görünür kullanıcı turn'üne sızmak yerine gösterilmeyen
    bir custom message olarak kalıcılaştırıldığını doğrular, ardından etkilenen bozuk bir
    oturum JSONL'i seed eder ve `openclaw doctor --fix` komutunun bunu backup ile active branch'e
    yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, installed-package onboarding'i çalıştırır,
    kurulu CLI üzerinden Telegram'ı yapılandırır, ardından canlı Telegram QA lane'ini SUT Gateway
    olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir; registry'den
    kurmak yerine çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env credential'larını veya Convex credential
    kaynağını kullanır. CI/release otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`
    ile `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret'ını ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı mevcutsa Docker wrapper Convex'i
    otomatik olarak seçer.
  - Wrapper, Docker build/install çalışmasından önce host üzerinde Telegram veya Convex credential
    env'ini doğrular. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca
    credential öncesi kurulumu bilerek debug ederken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu lane için paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu lane'i manuel maintainer workflow'u `NPM Telegram Beta E2E` olarak sunar.
    Merge sırasında çalışmaz. Workflow, `qa-live-shared` environment'ını ve Convex CI credential
    lease'lerini kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalıştırma ürün kanıtı için `Package Acceptance`
  sunar. Güvenilir bir ref, yayımlanmış npm spec'i, SHA-256 ile HTTPS tarball URL'si veya başka
  bir run'dan tarball artifact'i kabul eder, normalize edilmiş `openclaw-current.tgz` dosyasını
  `package-under-test` olarak yükler, ardından mevcut Docker E2E scheduler'ı smoke, package,
  product, full veya custom lane profilleriyle çalıştırır. Telegram QA workflow'unu aynı
  `package-under-test` artifact'ine karşı çalıştırmak için `telegram_mode=mock-openai` veya
  `live-frontier` ayarlayın.
  - En son beta ürün kanıtı:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Tam tarball URL kanıtı bir digest gerektirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact kanıtı, başka bir Actions run'ından bir tarball artifact'i indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mevcut OpenClaw build'ini Docker içinde paketler ve kurar, OpenAI yapılandırılmış halde
    Gateway'i başlatır, ardından config düzenlemeleriyle bundled channel/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını, ilk yapılandırılmış
    doctor onarımının her eksik indirilebilir Plugin'i açıkça kurduğunu ve ikinci restart'ın gizli
    dependency onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline kurar, `openclaw update --tag <candidate>` çalıştırmadan
    önce Telegram'ı etkinleştirir ve adayın update sonrası doctor'ının harness taraflı postinstall
    onarımı olmadan legacy Plugin dependency kalıntılarını temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Native paketli kurulum update smoke'unu Parallels guest'leri genelinde çalıştırır. Seçilen
    her platform önce istenen baseline paketi kurar, ardından aynı guest içinde kurulu
    `openclaw update` komutunu çalıştırır ve kurulu sürümü, update durumunu, gateway readiness'ı
    ve bir yerel agent turn'ünü doğrular.
  - Tek bir guest üzerinde iterasyon yaparken `--platform macos`, `--platform windows` veya
    `--platform linux` kullanın. Özet artifact yolu ve lane başına durum için `--json` kullanın.
  - OpenAI lane'i, canlı agent-turn kanıtı için varsayılan olarak `openai/gpt-5.5` kullanır.
    Başka bir OpenAI modelini bilerek doğrularken `--model <provider/model>` geçirin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels transport duraklamalarının test penceresinin geri kalanını tüketmemesi için
    uzun yerel çalıştırmaları host timeout ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script, iç içe lane loglarını `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış wrapper'ın takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya
    `linux-update.log` dosyasını inceleyin.
  - Windows update, soğuk bir guest üzerinde update sonrası doctor ve paket update çalışmasında
    10 ila 15 dakika harcayabilir; iç npm debug log'u ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu aggregate wrapper'ı bireysel Parallels macOS, Windows veya Linux smoke lane'leriyle
    paralel çalıştırmayın. Bunlar VM state'ini paylaşır ve snapshot restore, paket sunumu veya
    guest gateway state'i üzerinde çakışabilir.
  - Update sonrası kanıt normal bundled Plugin yüzeyini çalıştırır, çünkü speech, image generation
    ve media understanding gibi capability facade'ları, agent turn'ünün kendisi yalnızca basit
    bir metin yanıtını denetlediğinde bile bundled runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protocol smoke testi için yalnızca yerel AIMock provider sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA lane'ini tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır. Yalnızca source-checkout — paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profile/scenario catalog, env vars ve artifact layout: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA lane'ini env'den gelen driver ve SUT bot token'larıyla gerçek bir private group'a karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Group id sayısal Telegram chat id olmalıdır.
  - Paylaşılan pooled credential'lar için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya pooled lease'leri kullanmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı private group içinde iki ayrı bot gerektirir; SUT bot bir Telegram username sunmalıdır.
  - Kararlı bot-to-bot gözlemi için her iki botta `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve driver bot'un group bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altına Telegram QA raporu, özeti ve observed-messages artifact'i yazar. Yanıt veren senaryolar, driver send request'ten gözlemlenen SUT reply'a kadar RTT içerir.

Canlı transport lane'leri tek bir standart contract paylaşır, böylece yeni transport'lar drift etmez; lane başına coverage matrix [QA genel bakış → Canlı transport coverage](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik suite'tir ve bu matrix'in parçası değildir.

### Convex üzerinden paylaşılan Telegram credential'ları (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir pool'dan exclusive lease alır, lane çalışırken bu lease için Heartbeat gönderir ve shutdown sırasında lease'i serbest bırakır.

Referans Convex proje scaffold'u:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI` `ci` için
- Credential rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gizli değerleri yazdırmadan Convex site URL'sini, broker gizlerini,
uç nokta ön ekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini
kontrol etmek için canlı çalıştırmalardan önce `doctor` kullanın. Betiklerde ve CI
yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarılı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarılı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarılı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı gizli anahtarı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram türü için yük biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcılarına yönelik mimari ve senaryo yardımcısı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari gereklilik: taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine seam'i üzerinde uygulamak, Plugin manifestinde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve senaryoları `qa/scenarios/` altında yazmaktır.

## Test paketleri (nerede ne çalışır)

Paketleri “gerçekçiliği artan” (ve kararsızlığı/maliyeti artan) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway kimlik doğrulama, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve herkese açık yüzey yükleyici testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil, üretilmiş küçük Plugin fikstürleriyle geniş `api.js` ve
    `runtime-api.js` geri dönüş davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri,
    Plugin sahipli sözleşme/entegrasyon paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Hedeflenmemiş `pnpm test`, tek bir dev yerel kök proje işlemi yerine on iki daha küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde en yüksek RSS değerini düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel kontrol kapısıdır. Diff'i core, core testleri, extensions, extension testleri, apps, docs, sürüm metaverileri, canlı Docker araçları ve tooling olarak sınıflandırır; ardından eşleşen typecheck, lint ve koruma komutlarını çalıştırır. Vitest testleri çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm metaverisi içeren version bump'ları hedefli version/config/root-dependency kontrolleri çalıştırır ve üst düzey version alanı dışındaki package değişikliklerini reddeden bir koruma içerir.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker kimlik doğrulama betikleri için shell sözdizimi ve canlı Docker scheduler dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package yüzeyi düzenlemeleri hâlâ daha geniş korumaları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan import-light birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçirilir; stateful/runtime-heavy dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlerle eşler; böylece yardımcı düzenlemeleri, o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için özel bölümlere sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing parçalarına ayırır; böylece import-heavy tek bir bölüm, tüm Node kuyruğunu üstlenmez.
    - Normal PR/main CI, extension batch sweep ve yalnızca sürüme özel `agentic-plugins` parçasını bilinçli olarak atlar. Full Release Validation, sürüm adaylarında bu plugin/extension-heavy paketler için ayrı `Plugin Prerelease` alt workflow'unu tetikler.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - Message-tool keşif girdilerini veya compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyonları ekleyin.
    - Gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından geçmeye devam ettiğini doğrular;
      yalnızca yardımcı testleri bu entegrasyon yolları için yeterli bir
      ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool ve izolasyon varsayılanları">

    - Temel Vitest config varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve kök
      projelerde, e2e'de ve canlı config'lerde izole olmayan çalıştırıcıyı
      kullanır.
    - Kök UI hattı `jsdom` setup ve optimizer ayarlarını korur, ancak o da
      paylaşılan izole olmayan çalıştırıcıda çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest config'den aynı `threads` +
      `isolate: false` varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme
      dalgalanmasını azaltmak için Vitest alt Node işlemlerine varsayılan
      olarak `--no-maglev` ekler. Stok V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları
      yeniden stage eder ve lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel kontrol kapısına ihtiyaç duyduğunuzda handoff veya push
      öncesinde `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer.
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha
      geniş Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max`, aynı yönlendirme
      davranışını korur; yalnızca daha yüksek bir worker sınırı kullanır.
    - Yerel worker otomatik ölçeklendirmesi bilinçli olarak tutucudur ve host
      load average zaten yüksek olduğunda geri çekilir; böylece birden fazla
      eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test kablolaması değiştiğinde changed-mode yeniden
      çalıştırmalarının doğru kalması için projeleri/config dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini
      etkin tutar; doğrudan profilleme için tek bir açık cache konumu
      istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü
      `origin/main` sonrasındaki değişen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json`
      dosyasına yazılır. Tüm config çalıştırmaları anahtar olarak config yolunu
      kullanır; include-pattern CI parçaları, filtrelenmiş parçaların ayrı ayrı
      izlenebilmesi için parça adını ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç import'larında
      harcadığında, ağır dependency'leri dar bir yerel `*.runtime.ts` sınırının
      arkasında tutun ve runtime yardımcılarını yalnızca `vi.mock(...)`
      üzerinden geçirmek için deep-import etmek yerine bu sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` komutunu o commit'lenmiş diff için yerel kök proje yoluyla
      karşılaştırır ve duvar saati süresini ve macOS maksimum RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek
      mevcut kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıç ve transform
      overhead'i için main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim paketi için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanmış
- Kapsam:
  - Varsayılan olarak diagnostics etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Sentetik gateway message, memory ve large-payload churn işlemlerini diagnostic event yolundan geçirir
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle persistence yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve session başına queue depth değerlerinin yeniden sıfıra boşaldığını assert eder
- Beklentiler:
  - CI için güvenli ve keyless
  - Stability-regression takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketli Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde `isolate: false` ile Vitest `threads` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (iş hattında etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla ana makinede yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan bir sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca açıkça seçilir; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketli Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, tool-calling tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalamak
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynağını okur.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` değerini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin bilerek gerçek ana dizininizi kullanmasına ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını tutar, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlüklerini/Bonjour konuşmalarını sessize alır. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlıya özel geçersiz kılma ayarlayın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e yazar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalama sessiz olsa bile görünür şekilde etkin kalır.
  - `vitest.live.config.ts`, Vitest konsol yakalamasını devre dışı bırakır; böylece sağlayıcı/Gateway ilerleme satırları canlı çalıştırmalar sırasında hemen akar.
  - Doğrudan-model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağ işlemleri / WS protokolü / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü hatalar / tool calling hata ayıklama: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex app-server
harness, tüm medya sağlayıcı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness) ve canlı çalıştırmalar için kimlik bilgisi işleme hakkında bilgi için
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil-anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlandıysa `~/.profile` kaynağını okur). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` değerleridir.
- Docker canlı çalıştırıcıları, tam Docker taramasının pratik kalması için varsayılan olarak daha küçük bir smoke sınırı kullanır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  açıkça istediğinizde bu env var'ları geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez derler, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden bir npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajını derler/yeniden kullanır. Yalın imaj yalnızca kurulum/güncelleme/Plugin-bağımlılığı hatları için Node/Git çalıştırıcısıdır; bu hatlar önceden derlenmiş tarball'ı bağlar. İşlevsel imaj, derlenmiş uygulama işlevselliği hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçili planı yürütür. Toplam, ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç slotlarını denetlerken kaynak sınırları ağır canlı, npm-install ve çok hizmetli hatların hepsinin birden başlamasını engeller. Tek bir hat etkin sınır değerlerinden daha ağırsa zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırmayı sürdürür. Varsayılanlar 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak Docker preflight yapar, eski OpenClaw E2E konteynerlerini kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu zamanlamaları kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın veya seçili hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub-yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` üzerinden bir aday paketi çözer, onu `package-under-test` olarak yükler, ardından seçili ref'i yeniden paketlemek yerine bu kesin tarball'a karşı yeniden kullanılabilir Docker E2E hatlarını çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme survivor matrisi, yayın varsayılanları ve hata triyajı için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve yayın kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Guard, statik derlenmiş grafiği `dist/entry.js` ve `dist/cli/run-main.js` üzerinden yürür ve komut dispatch öncesi başlangıç import'ları Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını komut dispatch'ten önce içeri alırsa başarısız olur; ayrıca paketli Gateway run chunk'ını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke ayrıca root help, onboard help, doctor help, status, config schema ve bir model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu eşik boyunca harness yalnızca yayımlanmış-paket meta veri boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. `2026.4.25` sonrasındaki paketler için bu yollar kesin hatadır.
- Konteyner smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek konteyner başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı-model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama ana dizinlerini (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından bunları çalıştırmadan önce konteyner ana dizinine kopyalar; böylece harici-CLI OAuth, ana makine kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini kapsamını içerir; `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` üzerinden sıkı Droid/OpenCode kapsamıyla)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball'ı QA Lab'i atladığı için kasıtlı olarak paket Docker sürüm hatlarının parçası değildir.
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan smoke: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, varsayılan olarak env-ref onboarding ve Telegram ile OpenAI'yi yapılandırır, doctor çalıştırır ve bir mocked OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.
- Güncelleme kanalı değiştirme smoke: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın doğru olduğunu doğrular, ardından tekrar paket `stable` kanalına döner ve güncelleme durumunu kontrol eder.
- Yükseltmeden sağ kalan smoke: `pnpm test:docker:upgrade-survivor`, ajanlar, kanal yapılandırması, Plugin allowlist'leri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları olan kirli bir eski kullanıcı fixture'ının üzerine paketlenmiş OpenClaw tarball'ını kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunmasını, başlatma/durum bütçeleriyle birlikte kontrol eder.
- Yayınlanmış yükseltmeden sağ kalan smoke: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyaları tohumlar, bu temel sürümü gömülü bir komut tarifiyle yapılandırır, oluşan yapılandırmayı doğrular, yayınlanmış kurulumu aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış amaçları, durum korunmasını, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Tek bir temel sürümü `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi tam yerel temel sürümleri `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve `reported-issues` gibi issue biçimli fixture'ları `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; reported-issues kümesi, otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta temel sürüm token'larını çözer ve Full Release Validation, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olacak şekilde genişletir.
- Oturum çalışma zamanı bağlamı smoke: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transkript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global kurulum smoke: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `dist/` dizinini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile derlenmiş bir Docker imajından kopyalayın.
- Kurucu Docker smoke: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm cache paylaşır. Güncelleme smoke varsayılan olarak aday tarball'a yükseltmeden önce kararlı temel sürüm olarak npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke workflow'unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu kontrolleri, root sahipli cache girdilerinin kullanıcı yerel kurulum davranışını maskelememesi için izole bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache'ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanını silme CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak root Dockerfile imajını derler, izole bir container home içinde bir çalışma alanına sahip iki ajan tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri, iframe ref'lerini ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), mocked bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü kontrol eder.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profil allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (gerçek Gateway + izole cron ve tek seferlik alt ajan çalıştırmalarından sonra stdio MCP çocuk süreç sonlandırması): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (yerel yol, `file:`, hoisted bağımlılıklarla npm registry, git hareketli ref'leri, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik yerel bir ClawHub fixture sunucusu kullanır.
- Plugin güncellemesi değişmemiş smoke: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi smoke: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'ını boş bir container'a kurar, bir npm Plugin kurar, enable/disable durumunu değiştirir, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından her yaşam döngüsü aşaması için RSS/CPU metriklerini günlüğe yazarken uninstall işleminin eski durumu yine de kaldırdığını doğrular.
- Yapılandırma yeniden yükleme meta verisi smoke: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`, yerel yol, `file:`, hoisted bağımlılıklarla npm registry, git hareketli ref'leri, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke kapsamını içerir. `pnpm test:docker:plugin-update`, kurulu Plugins için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlenen npm Plugin kurulumu, enable, disable, yükseltme, düşürme ve eksik kod uninstall kapsamını içerir.

Paylaşılan işlevsel imajı manuel olarak önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak paylaşılan bir imajı gösterdiğinde, betikler imaj zaten yerel değilse onu çeker. QR ve kurucu Docker testleri kendi Dockerfile'larını tutar çünkü paylaşılan derlenmiş uygulama çalışma zamanı yerine paket/kurulum davranışını doğrular.

Live model Docker çalıştırıcıları ayrıca geçerli checkout’u salt okunur olarak bind-mount eder ve
container içindeki geçici bir workdir’e hazırlar. Bu, runtime image’ını ince tutarken
Vitest’in yine de tam yerel source/config’inize karşı çalışmasını sağlar.
Hazırlama adımı, Docker live çalıştırmalarının makineye özgü artifact’leri kopyalamak için
dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve
app-local `.build` ya da Gradle output dizinleri gibi büyük local-only cache’leri ve app build output’larını atlar.
Bunlar ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlar; böylece Gateway live probe’ları
container içinde gerçek Telegram/Discord/vb. kanal worker’larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden o Docker lane’inden
Gateway live coverage’ını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de aktarın.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint’leri etkinleştirilmiş
bir OpenClaw Gateway container’ı başlatır, bu Gateway’e karşı pinlenmiş bir Open WebUI container’ı başlatır,
Open WebUI üzerinden oturum açar, `/api/models` öğesinin `openclaw/default` değerini sunduğunu doğrular,
ardından Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir chat request’i gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir çünkü Docker’ın
Open WebUI image’ını pull etmesi ve Open WebUI’nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu lane kullanılabilir bir live model key bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) Docker’laştırılmış çalıştırmalarda bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` özellikle deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway
container’ını boot eder, `openclaw mcp serve` başlatan ikinci bir container başlatır, ardından
gerçek stdio MCP bridge üzerinden yönlendirilmiş conversation discovery, transcript okumaları, attachment metadata’sı,
live event queue davranışı, outbound send routing ve Claude-style channel +
permission notification’larını doğrular. Notification check’i ham stdio MCP frame’lerini
doğrudan inceler; böylece smoke, yalnızca belirli bir client SDK’sının yüzeye çıkardığını değil,
bridge’in gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve live model key gerektirmez.
Repo Docker image’ını build eder, container içinde gerçek bir stdio MCP probe server başlatır,
bu server’ı gömülü Pi bundle MCP runtime üzerinden materialize eder,
tool’u yürütür, ardından `coding` ve `messaging` değerlerinin `bundle-mcp` tool’larını tuttuğunu,
`minimal` ve `tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve live model
key gerektirmez. Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway başlatır, izole bir cron turn ve
bir `/subagents spawn` one-shot child turn çalıştırır, ardından
MCP child process’in her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP sade dil thread smoke’u (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script’i regression/debug workflow’ları için tutun. ACP thread routing validation için tekrar gerekebilir, bu yüzden silmeyin.

Kullanışlı env var’lar:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testleri çalıştırmadan önce source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici config/workspace dizinleri kullanarak ve external CLI auth mount’ları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden source edilen env var’ları doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache’lenmiş CLI install’ları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki external CLI auth dizinleri/dosyaları salt okunur olarak `/host-auth...` altına mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle elle override edin
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, container içinde provider’ları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, rebuild gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` image’ını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, kimlik bilgilerinin env’den değil profile store’dan geldiğinden emin olmak için
- `OPENCLAW_OPENWEBUI_MODEL=...`, Open WebUI smoke için Gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...`, Open WebUI smoke tarafından kullanılan nonce-check prompt’unu override etmek için
- `OPENWEBUI_IMAGE=...`, pinlenmiş Open WebUI image tag’ini override etmek için

## Docs sağlamlık kontrolü

Doc düzenlemelerinden sonra docs check’lerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading check’lerine de ihtiyacınız olduğunda tam Mintlify anchor validation çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regression (CI-safe)

Bunlar gerçek provider’lar olmadan “real pipeline” regression’lardır:

- Gateway tool calling (mock OpenAI, gerçek Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu kılınır): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability eval’leri (skills)

“agent reliability evals” gibi davranan birkaç CI-safe testimiz zaten var:

- Gerçek Gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan end-to-end wizard flow’ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt’ta skill’ler listelendiğinde agent doğru skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanımdan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow contract’ları:** tool order, session history carryover ve sandbox boundary’lerini assert eden multi-turn scenario’lar.

Gelecekteki eval’ler önce deterministik kalmalıdır:

- Tool call’ları + sıralamayı, skill file okumalarını ve session wiring’i assert etmek için mock provider’lar kullanan bir scenario runner.
- Skill odaklı küçük bir scenario paketi (kullan vs kaçın, gating, prompt injection).
- İsteğe bağlı live eval’ler (opt-in, env-gated) yalnızca CI-safe paket hazır olduktan sonra.

## Contract test’leri (Plugin ve kanal şekli)

Contract test’leri, kayıtlı her Plugin ve kanalın kendi
interface contract’ına uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde iterasyon yapar ve
bir shape ve behavior assertion paketi çalıştırır. Varsayılan `pnpm test` unit lane’i bu paylaşılan
seam ve smoke dosyalarını kasıtlı olarak atlar; shared channel veya provider surface’lerine dokunduğunuzda
contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract’lar: `pnpm test:contracts`
- Yalnızca channel contract’ları: `pnpm test:contracts:channels`
- Yalnızca provider contract’ları: `pnpm test:contracts:plugins`

### Channel contract’ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, capability’ler)
- **setup** - Setup wizard contract
- **session-binding** - Session binding davranışı
- **outbound-payload** - Message payload yapısı
- **inbound** - Inbound message handling
- **actions** - Channel action handler’ları
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel status probe’ları
- **registry** - Plugin registry şekli

### Provider contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Ne zaman çalıştırılır

- plugin-sdk export’ları veya subpath’leri değiştirildikten sonra
- Bir channel veya provider Plugin eklendikten ya da değiştirildikten sonra
- Plugin registration veya discovery refactor edildikten sonra

Contract test’leri CI’da çalışır ve gerçek API key gerektirmez.

## Regression ekleme (rehberlik)

Live’da keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe regression ekleyin (mock/stub provider veya tam request-shape transformation’ı yakalayın)
- Doğası gereği yalnızca live ise (rate limit’ler, auth policy’leri), live test’i dar ve env var’lar üzerinden opt-in tutun
- Hatanın yakalanacağı en küçük katmanı hedeflemeyi tercih edin:
  - provider request conversion/replay bug → doğrudan models test
  - Gateway session/history/tool pipeline bug → Gateway live smoke veya CI-safe Gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata’sından (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için örneklenmiş bir target türetir, ardından traversal-segment exec id’lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef target family eklerseniz, o testteki `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış target id’lerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Live test etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
