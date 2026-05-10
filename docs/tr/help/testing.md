---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-05-10T19:41:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest test paketine (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu doküman bir "nasıl test ederiz" kılavuzudur:

- Her test paketinin neyi kapsadığı (ve bilinçli olarak neyi _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Live testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için referans.
- [QA kanalı](/tr/channels/qa-channel) - repo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin'i.

Bu sayfa normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özgü çalıştırıcılar bölümü ([QA'ya özgü çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam test paketi çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık eklenti/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E test paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Live test paketi (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir live dosyasını sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` ajan dönüşü için
  `live_gpt54=true` ile veya Kova CPU/heap/trace yapıtları için
  `deep_profile=true` ile `OpenClaw Performance` gönderin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.4 hat yapıtlarını
  `openclaw/clawgrit-reports` konumunda yayımlar. mock-provider raporu ayrıca kaynak düzeyinde Gateway açılışı, bellek,
  Plugin baskısı, yinelenen sahte model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü ve küçük bir dosya okuma tarzı prob çalıştırır.
    Metadata'sı `image` girdisi ilan eden modeller ayrıca küçük bir görüntü dönüşü çalıştırır.
    Sağlayıcı hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre parçalanmış ayrı Docker canlı model
    matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile gönderin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    dosyasına, ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker live hattı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan dönüşlerini Plugin'e ait Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, alt ajan ve Guardian problarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken alt ajan probunu
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan kontrolü için diğer probları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, alt ajan probundan sonra çıkar.
- Codex isteğe bağlı kurulum smoke testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tarball'ını Docker içinde kurar, OpenAI API anahtarı
    ilk kurulumunu çalıştırır ve Codex Plugin'i ile `@openai/codex` bağımlılığının
    isteğe bağlı olarak yönetilen npm köküne indirildiğini doğrular.
- Live Plugin araç bağımlılığı smoke testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığı olan bir fixture Plugin'i paketler, bunu
    `npm-pack:` üzerinden kurar, yönetilen npm kökü altındaki bağımlılığı doğrular, ardından canlı bir
    OpenAI modelinden Plugin aracını çağırmasını ve gizli slug'ı döndürmesini ister.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için katılımlı, ek güvenlik amaçlı kontrol.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir container içinde çalıştırır
    ve bulanık planlayıcı fallback'inin denetimli, tipli bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/ajan/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu,
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve asistan dökümünün normalize edilmiş
  `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız olguya ihtiyacınız olduğunda, live testleri aşağıda açıklanan allowlist ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'i özel iş akışlarında çalıştırır. Ajanlı parite, bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır. Kararlı/varsayılan sürüm
kontrolleri, kapsamlı live/Docker soak'ı `run_release_soak=true` arkasında tutar; `full` profili soak'ı zorunlu kılar. `QA-Lab - All Lanes`,
mock parite hattı, live Matrix hattı, Convex yönetimli live Telegram hattı ve Convex yönetimli live Discord
hattı paralel işler olarak `main` üzerinde gecelik ve manuel gönderimle çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix'e
açıkça `--profile fast` geçirirken, Matrix CLI ve manuel iş akışı girdisi
varsayılanı `all` olarak kalır; manuel gönderim `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release
Checks`, sürüm onayından önce pariteyi, hızlı Matrix'i ve Telegram hatlarını çalıştırır; sürüm taşıma kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar ve normal sağlayıcı Plugin başlangıcından kaçınırlar. Bu canlı taşıma
Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA parite
test paketleri tarafından kapsanmaya devam eder.

Tam sürüm live medya parçaları,
zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/backend parçaları, seçilen her commit için bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden oluşturmak yerine bunu `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçilen birden çok senaryoyu varsayılan olarak yalıtılmış gateway
    worker'larıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık
    4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Worker sayısını ayarlamak
    için `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artefakt almak istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` provider modlarını destekler.
    `aimock`, senaryo farkındalıklı `mock-openai` hattını değiştirmeden deneysel
    fixture ve protocol-mock kapsamı için yerel AIMock destekli bir provider
    sunucusu başlatır.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin sınama koşusunu QA Lab üzerinden çalıştırır.
    Harici Kitchen Sink paketini kurar, Plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, Gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve adversarial tanıları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir. Hydrate
    edilmiş Testbox oturumlarında, `openclaw-testbox-env` yardımcısı mevcutsa
    Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak gösterir.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç bench'ini ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` ve `--hot-wall-warn-ms`), böylece kısa başlangıç
    sıçramaları, dakikalar süren Gateway sabitlenme regresyonu gibi görünmeden
    metrik olarak kaydedilir.
  - Derlenmiş `dist` artefaktlarını kullanır; checkout zaten güncel runtime
    çıktısına sahip değilse önce bir build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı provider/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama
    girdilerini iletir: env tabanlı provider anahtarları, QA canlı provider
    config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri, konuğun bağlı çalışma alanı üzerinden geri yazabilmesi için
    repo kökü altında kalmalıdır.
  - Normal QA raporu ve özetinin yanı sıra Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global
    olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır,
    varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin runtime'ının
    başlangıç dependency onarımı olmadan yüklendiğini doğrular, doctor çalıştırır
    ve mock'lanmış bir OpenAI endpoint'ine karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime context transcript'leri için deterministik bir built-app
    Docker smoke çalıştırır. Gizli OpenClaw runtime context'inin görünür kullanıcı
    turuna sızmak yerine gösterilmeyen özel bir mesaj olarak kalıcılaştırıldığını
    doğrular, ardından etkilenmiş bozuk bir session JSONL tohumu ekler ve
    `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala yeniden
    yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini
    çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından bu kurulu
    paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden
    kullanır.
  - Wrapper, checkout'tan yalnızca `qa-lab` harness kaynağını bağlar; kurulu
    paket `dist`, `openclaw/plugin-sdk` ve paketlenmiş Plugin runtime'ının
    sahibidir, böylece hat geçerli checkout Plugin'lerini test edilen pakete
    karıştırmaz.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir;
    registry'den kurmak yerine çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/release otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret'ını ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı varsa Docker wrapper
    Convex'i otomatik olarak seçer.
  - Wrapper, Docker build/install çalışmasından önce ana makinedeki Telegram veya
    Convex kimlik bilgisi env'ini doğrular.
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca
    kimlik bilgisi öncesi kurulumu bilinçli olarak debug ederken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için
    paylaşılan `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow,
    `qa-live-shared` environment'ını ve Convex CI kimlik bilgisi lease'lerini
    kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256
  ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artefaktı kabul
  eder, normalize edilmiş `openclaw-current.tgz` dosyasını
  `package-under-test` olarak yükler, ardından smoke, package, product, full veya
  custom hat profilleriyle mevcut Docker E2E scheduler'ını çalıştırır. Telegram
  QA workflow'unu aynı `package-under-test` artefaktına karşı çalıştırmak için
  `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artefakt kanıtı, başka bir Actions çalıştırmasından tarball artefaktı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build'ini Docker içinde paketleyip kurar, OpenAI
    yapılandırılmış olarak Gateway'i başlatır, ardından paketlenmiş
    channel/Plugin'leri config düzenlemeleriyle etkinleştirir.
  - Setup discovery'nin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik indirilebilir Plugin'lerin her
    birini açıkça kurduğunu ve ikinci bir restart'ın gizli dependency onarımı
    çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın update sonrası
    doctor'ının legacy Plugin dependency kalıntılarını harness taraflı postinstall
    onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Native paketlenmiş kurulum update smoke'unu Parallels konuklarında çalıştırır.
    Seçilen her platform önce istenen baseline paketi kurar, ardından aynı
    konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, update
    durumunu, Gateway hazır oluşunu ve bir yerel agent turunu doğrular.
  - Tek bir konuk üzerinde iterasyon yaparken `--platform macos`,
    `--platform windows` veya `--platform linux` kullanın. Özet artefakt yolu ve
    hat başına durum için `--json` kullanın.
  - OpenAI hattı, canlı agent turu kanıtı için varsayılan olarak
    `openai/gpt-5.5` kullanır. Bilinçli olarak başka bir OpenAI modelini
    doğrularken `--model <provider/model>` iletin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels transport duraksamalarının test penceresinin geri kalanını
    tüketememesi için uzun yerel çalıştırmaları bir ana makine timeout'u ile
    sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*`
    altında yazar. Dış wrapper'ın takıldığını varsaymadan önce
    `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını
    inceleyin.
  - Windows update, soğuk bir konukta update sonrası doctor ve package update
    çalışmasında 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü
    ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu wrapper'ı ayrı Parallels macOS, Windows veya Linux smoke hatlarıyla
    paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot restore, package
    serving veya konuk Gateway durumu üzerinde çakışabilirler.
  - Update sonrası kanıt, normal paketlenmiş Plugin yüzeyini çalıştırır çünkü
    konuşma, image generation ve media understanding gibi capability facade'ları,
    agent turu yalnızca basit bir metin yanıtını denetlese bile paketlenmiş
    runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protocol smoke testi için yalnızca yerel AIMock provider sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u - paketlenmiş kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env var'ları ve artefakt düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını env'den gelen driver ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram chat id'si olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuz lease'lerine geçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar canary, mention gating, command addressing, `/status`, bot'tan bot'a mention edilmiş yanıtlar ve core native command yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik reply-chain ve Telegram final-message streaming regresyonlarını kapsar. `session_status` gibi isteğe bağlı yoklamalar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artefakt almak istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı göstermesi gerekir.
  - Kararlı bot'tan bot'a gözlem için `@BotFather` içinde her iki bot için Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve observed-messages artefaktı yazar. Yanıt veren senaryolar, driver gönderme isteğinden gözlenen SUT yanıtına kadar RTT içerir.

`Mantis Telegram Live`, bu hattın etrafındaki PR kanıtı wrapper'ıdır. Aday ref'i
Convex lease'li Telegram kimlik bilgileriyle çalıştırır, redakte edilmiş
observed-message transcript'ini bir Crabbox masaüstü tarayıcısında render eder,
MP4 kanıtı kaydeder, hareket kırpılmış GIF oluşturur, artefakt paketini yükler
ve `pr_number` ayarlandığında Mantis GitHub App üzerinden satır içi PR kanıtı
gönderir. Maintainer'lar bunu Actions UI üzerinden `Mantis Scenario`
(`scenario_id: telegram-live`) ile veya doğrudan bir pull request yorumundan
başlatabilir:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstünü kiralar veya yeniden kullanır, yerel Telegram Desktop kurar, OpenClaw'ı kiralanmış bir Telegram SUT bot token'ı ile yapılandırır, gateway'i başlatır ve görünür VNC masaüstünden ekran görüntüsü/MP4 kanıtı kaydeder.
  - Varsayılan olarak `--credential-source convex` kullanır; böylece iş akışları yalnızca Convex aracı secret'ına ihtiyaç duyar. `pnpm openclaw qa telegram` ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenleriyle `--credential-source env` kullanın.
  - Telegram Desktop yine de kullanıcı oturumu açma/profil gerektirir. Bot token'ı yalnızca OpenClaw'ı yapılandırır. Base64 `.tgz` profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya `--keep-lease` kullanıp VNC üzerinden bir kez elle oturum açın.
  - Çıktı dizini altında `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4` yazar.

Canlı aktarım kulvarları, yeni aktarımların sapmaması için tek bir standart sözleşme paylaşır; kulvar başına kapsama matrisi [QA genel bakışı → Canlı aktarım kapsaması](/tr/concepts/qa-e2e-automation#live-transport-coverage) bölümünde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

Canlı aktarım QA için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kira alır, kulvar çalışırken bu kiraya heartbeat gönderir ve kapanışta kirayı serbest bırakır. Bölüm adı Discord, Slack ve WhatsApp desteğinden eskidir; kira sözleşmesi türler arasında paylaşılır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

Normal çalışmada `OPENCLAW_QA_CONVEX_SITE_URL` `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı secret'larını, endpoint önekini, HTTP zaman aşımını ve admin/list erişilebilirliğini secret değerlerini yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `POST /admin/add` (yalnızca bakımcı secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Aktif kira koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram türü için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

Telegram gerçek kullanıcı türü için payload biçimi:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal dizeler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256` SHA-256 hex dizeleri olmalıdır.
- `kind: "telegram-user"` bir Telegram burner hesabını temsil eder. Kirayı hesap geneline ait kabul edin: TDLib CLI sürücüsü ve Telegram Desktop görsel tanığı aynı payload'dan geri yüklenir ve aynı anda kirayı yalnızca bir iş tutmalıdır.

Telegram gerçek kullanıcı kira geri yükleme:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Görsel kayıt gerektiğinde geri yüklenen Desktop profilini `Telegram -workdir "$tmp/desktop"` ile kullanın. Yerel operatör ortamlarında, süreç env değişkenleri yoksa `scripts/e2e/telegram-user-credential.ts` varsayılan olarak `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` dosyasını okur.

Ajan güdümlü Crabbox oturumu:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start`, `telegram-user` kimlik bilgisini kiralar, aynı hesabı bir Crabbox Linux masaüstünde TDLib ve Telegram Desktop içine geri yükler, geçerli checkout'tan yerel bir mock SUT gateway başlatır, görünür Telegram sohbetini açar, masaüstü kaydını başlatır ve özel bir `session.json` yazar. Oturum canlıyken bir ajan tatmin olana kadar test etmeyi sürdürebilir:

- `send --session <file> --text <message>`, gerçek TDLib kullanıcısı üzerinden gönderir ve SUT yanıtını bekler.
- `run --session <file> -- <remote command>`, Crabbox üzerinde rastgele bir komut çalıştırır ve çıktısını kaydeder; örneğin `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` geçerli görünür masaüstünü yakalar.
- `status --session <file>` kira ve WebVNC komutunu yazdırır.
- `finish --session <file>` kaydediciyi durdurur, ekran görüntüsü/video/hareket kırpma artefaktlarını yakalar, Convex kimlik bilgisini serbest bırakır, yerel SUT süreçlerini durdurur ve `--keep-box` geçirilmediği sürece Crabbox kirasını durdurur.
- `publish --session <file> --pr <number>` varsayılan olarak yalnızca GIF içeren bir PR yorumu yayımlar. `--full-artifacts` seçeneğini yalnızca günlükler veya JSON artefaktları kasıtlı olarak gerektiğinde geçirin.

Deterministik görsel yeniden üretimler için `start` komutuna veya tek komutluk `probe` kısayoluna `--mock-response-file <path>` geçirin. Çalıştırıcı varsayılan olarak standart bir Crabbox sınıfı, 24fps kayıt, 24fps hareket GIF önizlemeleri ve 1920px GIF genişliği kullanır. Yalnızca kanıt farklı yakalama ayarları gerektirdiğinde `--class`, `--record-fps`, `--preview-fps` ve `--preview-width` ile geçersiz kılın.

Tek komutluk Crabbox kanıtı:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Varsayılan `probe` komutu, tek bir start/send/finish döngüsü için kısayoldur. Hızlı bir `/status` smoke için kullanın. PR incelemesi, hata yeniden üretme çalışması veya ajanın kanıtın tamamlandığına karar vermeden önce dakikalarca rastgele deney yapması gereken her durumda oturum komutlarını kullanın. Sıcak bir masaüstü kirasını yeniden kullanmak için `--id <cbx_...>`, bitişten sonra VNC'yi açık tutmak için `--keep-box`, görünür sohbeti seçmek için `--desktop-chat-title <name>` ve yeni bir kutuda TDLib derlemek yerine önceden hazırlanmış Linux `libtdjson.so` arşivi kullanırken `--tdlib-url <tgz>` kullanın. Çalıştırıcı `--tdlib-url` değerini `--tdlib-sha256 <hex>` ile veya varsayılan olarak kardeş bir `<url>.sha256` dosyasıyla doğrular.

Aracı tarafından doğrulanmış çok kanallı payload'lar:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack kulvarları da havuzdan kira alabilir, ancak Slack payload doğrulaması şu anda aracı yerine Slack QA çalıştırıcısında yaşar. Slack satırları için `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` kullanın.

### QA'ya kanal ekleme

Yeni kanal adaptörleri için mimari ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) bölümünde yer alır. Asgari eşik: aktarım çalıştırıcısını paylaşılan `qa-lab` host seam üzerinde uygulamak, Plugin bildiriminde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve senaryoları `qa/scenarios/` altında yazmaktır.

## Test paketleri (nerede ne çalışır)

Paketleri "artan gerçekçilik" (ve artan kararsızlık/maliyet) olarak düşünün:

### Unit / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedefsiz çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki core/unit envanterleri; UI unit testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf unit testleri
  - Süreç içi entegrasyon testleri (gateway kimlik doğrulaması, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, gerçek bundled Plugin kaynak API'leriyle değil, üretilmiş küçük Plugin fixture'larıyla geniş `api.js` ve
    `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri,
    Plugin'e ait sözleşme/entegrasyon paketlerine aittir.

Yerel bağımlılık ilkesi:

- Varsayılan test kurulumları isteğe bağlı yerel Discord opus derlemelerini atlar. Discord voice receive saf JS `opusscript` decoder'ını kullanır ve `@discordjs/opus` `ignoredBuiltDependencies` içinde kalır; böylece yerel testler ve Testbox kulvarları yerel addon'u derlemez.
- Yerel opus derlemesini kasıtlı olarak karşılaştırmanız gerekiyorsa özel bir Discord ses performansı veya canlı kulvar kullanın. `@discordjs/opus` öğesini varsayılan `onlyBuiltDependencies` içine geri eklemeyin; bu, ilgisiz kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı kulvarlar">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök proje süreci yerine on iki küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yük altındaki makinelerde en yüksek RSS değerini azaltır ve auto-reply/extension çalışmalarının ilgisiz suiteleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı lane'ler üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı lane'lere genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel denetim kapısıdır. Diff'i core, core testleri, extensions, extension testleri, apps, docs, release metadata, live Docker tooling ve tooling olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca release metadata içeren sürüm artışları, üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard ile hedefli version/config/root-dependency denetimleri çalıştırır.
    - Live Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: live Docker auth script'leri için shell söz dizimi ve live Docker scheduler dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package-surface düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf utility alanlarından import-light unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` lane'i üzerinden yönlendirilir; stateful/runtime-heavy dosyalar mevcut lane'lerde kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif lane'lerdeki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır suiti yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış bucket'lara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import-heavy tek bir bucket tam Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, extension toplu taramasını ve yalnızca release için olan `agentic-plugins` shard'ını bilinçli olarak atlar. Tam Release Validation, release candidate'larında bu plugin/extension ağırlıklı suiteler için ayrı `Plugin Prerelease` child workflow'unu dispatch eder.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Message-tool discovery girdilerini veya compaction runtime
      context'ini değiştirdiğinizde, her iki coverage düzeyini de koruyun.
    - Saf routing ve normalization
      sınırları için odaklı yardımcı regresyonlar ekleyin.
    - Embedded runner entegrasyon suitelerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu suiteler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca yardımcı
      testleri bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Temel Vitest config varsayılanı `threads` değeridir.
    - Paylaşılan Vitest config, `isolate: false` değerini sabitler ve kök projeler,
      e2e ve live config'ler genelinde yalıtımsız runner'ı kullanır.
    - Kök UI lane'i `jsdom` setup ve optimizer'ını korur, ancak o da paylaşılan
      yalıtımsız runner üzerinde çalışır.
    - Her `pnpm test` shard'ı aynı `threads` + `isolate: false`
      varsayılanlarını paylaşılan Vitest config'den devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 compile churn'ünü azaltmak için Vitest child Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Stok V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes`, bir diff'in hangi mimari lane'leri tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Handoff veya push öncesinde akıllı yerel denetim kapısına
      ihtiyacınız olduğunda `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı lane'ler üzerinden yönlendirilir. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş
      Vitest coverage gerektirdiğine karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı routing
      davranışını korur, yalnızca daha yüksek bir worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi bilinçli olarak muhafazakârdır ve host load average zaten yüksek olduğunda geri çekilir; böylece birden fazla eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test
      wiring değiştiğinde changed-mode yeniden çalıştırmalarının doğru kalması için project/config dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini etkin tutar;
      doğrudan profiling için tek bir açık cache konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profiling görünümünü
      `origin/main` sonrasından beri değişen dosyalara kapsamlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Whole-config çalıştırmaları anahtar olarak config yolunu kullanır; include-pattern CI
      shard'ları shard adını ekler, böylece filtrelenmiş shard'lar ayrı ayrı izlenebilir.
    - Tek bir sıcak test hâlâ zamanının çoğunu başlatma import'larında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      runtime yardımcılarını yalnızca `vi.mock(...)` üzerinden geçirmek için deep-import etmek yerine
      o sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` çalıştırmasını o commit'lenmiş diff için yerel kök proje yoluyla karşılaştırır ve wall time ile macOS max RSS yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek mevcut
      kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış unit suite için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Diagnostic event yolu üzerinden sentetik gateway message, memory ve large-payload churn çalıştırır
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle persistence yardımcılarını kapsar
  - Recorder'ın bounded kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve session başına queue depth'lerin tekrar sıfıra boşaldığını doğrular
- Beklentiler:
  - CI-safe ve keyless
  - Stability-regression takibi için dar lane; tam Gateway suite'inin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki bundled-plugin E2E testleri
- Runtime varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde `isolate: false` ile Vitest `threads` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, local: varsayılan olarak 1).
  - Console I/O overhead'ini azaltmak için varsayılan olarak silent mode'da çalışır.
- Yararlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Verbose console çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Multi-instance gateway end-to-end davranışı
  - WebSocket/HTTP yüzeyleri, node pairing ve daha ağır networking
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek key gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker üzerinden host'ta yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical filesystem davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı override'lar:
  - Daha geniş e2e suite'i manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (real providers + real models)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki bundled-plugin live testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu provider/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Provider format değişikliklerini, tool-calling quirks'lerini, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-stable değildir (gerçek ağlar, gerçek provider politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - "Her şey" yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Live çalıştırmalar, eksik API key'leri almak için `~/.profile` dosyasını source eder.
- Varsayılan olarak live çalıştırmalar yine `HOME` değerini yalıtır ve config/auth materyalini geçici bir test home dizinine kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca live testlerin bilerek gerçek home dizininizi kullanmasına ihtiyacınız olduğunda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` progress çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap log'larını/Bonjour chatter'ını susturur. Tam startup log'larını geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API key rotation (provider-specific): virgül/noktalı virgül formatıyla `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden live başına override kullanın; testler rate limit yanıtlarında yeniden dener.
- Progress/heartbeat çıktısı:
  - Live suiteler artık progress satırlarını stderr'e yazar; böylece uzun provider çağrıları, Vitest console capture sessiz olduğunda bile görünür şekilde aktiftir.
  - `vitest.live.config.ts`, live çalıştırmalar sırasında provider/gateway progress satırlarının hemen stream edilmesi için Vitest console interception'ı devre dışı bırakır.
  - Direct-model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi suite'i çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Düzenleme mantığı/testleri: `pnpm test` çalıştırın (çok fazla değişiklik yaptıysanız `pnpm test:coverage` da)
- Gateway ağ iletişimine / WS protokolüne / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "botum kapalı" / sağlayıcıya özgü hatalar / araç çağırma hata ayıklaması: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç duman testleri, ACP duman testleri, Codex uygulama sunucusu
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görsel,
müzik, video, medya harness'ı) - canlı çalıştırmalar için kimlik bilgisi yönetimiyle birlikte - için
[Canlı test paketlerini test etme](/tr/help/testing-live) bölümüne bakın. Ayrılmış güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışır" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel config dizininizi ve çalışma alanınızı bağlar (bağlanmışsa `~/.profile` kaynağını da alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` olur.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir duman sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük, kapsamlı taramayı
  açıkça istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez derler, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` ile bir kez npm tarball olarak paketler, ardından iki `scripts/e2e/Dockerfile` imajını derler/yeniden kullanır. Çıplak imaj, install/update/plugin-dependency hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden derlenmiş tarball'ı bağlar. İşlevsel imaj, derlenmiş uygulama işlevselliği hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplu çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çok servisli hatların aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırır. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker host'unda daha fazla kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, bayat OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusuna yanıt veren GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözer, onu `package-under-test` olarak yükler, ardından yeniden kullanılabilir Docker E2E hatlarını seçilen ref'i yeniden paketlemek yerine tam olarak o tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme kalıcılık matrisi, sürüm varsayılanları ve hata triyajı için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik derlenmiş grafiği gezer ve komut yönlendirmesinden önceki başlangıç, Commander, prompt UI, undici veya günlükleme gibi paket bağımlılıklarını içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarmalarını reddeder. Paketlenmiş CLI duman testi ayrıca kök yardım, onboard yardımı, doctor yardımı, durum, config şeması ve bir model-list komutunu kapsar.
- Paket Kabulü eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu sınıra kadar harness yalnızca yayımlanmış paket metadata boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında config metadata migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı hata sayılır.
- Container duman çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home'larını (veya çalışma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalıştırmadan önce bunları container home'una kopyalar; böylece harici CLI OAuth, host auth deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; Droid/OpenCode için katı kapsam `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sağlanır)
- CLI backend smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent'ı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball QA Lab'i dışarıda bıraktığı için özellikle paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Katılım sihirbazı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball katılım/kanal/agent smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, varsayılan olarak env-ref katılımı üzerinden OpenAI'ı ve Telegram'ı yapılandırır, doctor çalıştırır ve bir mocked OpenAI agent turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.
- Skill kurulum smoke testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, config içinde yüklenen arşiv kurulumlarını devre dışı bırakır, aramadan mevcut canlı ClawHub skill slug'ını çözümler, `openclaw skills install` ile kurar ve kurulu skill ile `.clawhub` origin/lock metadata'sını doğrular.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalı ve Plugin güncelleme sonrası çalışmayı doğrular, ardından tekrar paket `stable` kanalına döner ve güncelleme durumunu kontrol eder.
- Yükseltme kurtulan smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball'ını agent'lar, kanal config'i, Plugin allowlist'leri, stale Plugin bağımlılık durumu ve mevcut workspace/session dosyaları içeren kirli bir eski kullanıcı fixture'ının üzerine kurar. Canlı provider veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve config/state korumasını, başlangıç/status bütçelerini kontrol eder.
- Yayınlanmış yükseltme kurtulan smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını seed eder, bu baseline'ı yerleşik bir komut tarifiyle yapılandırır, ortaya çıkan config'i doğrular, bu yayınlanmış kurulumu aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, state korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC status bütçelerini kontrol eder. Tek bir baseline'ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile override edin, aggregate scheduler'dan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi kesin yerel baseline'ları genişletmesini isteyin ve issue biçimli fixture'ları `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile `reported-issues` gibi genişletin; reported-issues seti, otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta baseline token'larını çözümler ve Full Release Validation, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olarak genişletir.
- Session runtime bağlamı smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite branch'lerinin doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş image provider'larını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker imajından `dist/` kopyalamak için `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` kullanın.
- Installer Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm cache paylaşır. Update smoke testi, aday tarball'a yükseltmeden önce stable baseline olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke workflow'unun `update_baseline_version` input'u ile override edin. Non-root installer kontrolleri, root'a ait cache girişlerinin kullanıcı yerel kurulum davranışını maskelememesi için yalıtılmış bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache'ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği bu env olmadan yerelde çalıştırın.
- Agents paylaşılan workspace silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak root Dockerfile imajını derler, yalıtılmış bir container home içinde bir workspace'e sahip iki agent seed eder, `agents delete --json` çalıştırır ve geçerli JSON ile korunan workspace davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ bağlantısı (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u raw CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının link URL'lerini, cursor-promoted tıklanabilirleri, iframe ref'lerini ve frame metadata'sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway üzerinden mocked bir OpenAI server çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` seviyesinden `low` seviyesine yükselttiğini doğrular, ardından provider schema reddini zorlar ve raw ayrıntının Gateway log'larında göründüğünü kontrol eder.
- MCP kanal köprüsü (seed edilmiş Gateway + stdio bridge + raw Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP server + gömülü Pi profil allow/deny smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra gerçek Gateway + stdio MCP child kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (yerel path, `file:`, hoisted bağımlılıklı npm registry, git moving refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink package/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile override edin. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetic yerel bir ClawHub fixture server kullanır.
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'ını bare bir container'a kurar, bir npm Plugin'i kurar, enable/disable arasında geçiş yapar, yerel bir npm registry üzerinden onu yükseltir ve düşürür, kurulu kodu siler, ardından uninstall'ın her yaşam döngüsü aşaması için RSS/CPU metriklerini log'larken stale state'i yine de kaldırdığını doğrular.
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`, yerel path, `file:`, hoisted bağımlılıklı npm registry, git moving refs, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle enable/inspect için install/update smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugins için unchanged update davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak takibi yapılan npm Plugin install, enable, disable, upgrade, downgrade ve missing-code uninstall işlemlerini kapsar.

Paylaşılan functional imajı elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özel imaj override'ları ayarlandıklarında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı işaret ettiğinde, yerelde yoksa betikler onu çeker. QR ve installer Docker testleri kendi Dockerfile'larını korur çünkü paylaşılan derlenmiş uygulama runtime'ı yerine paket/install davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind mount eder ve
container içinde geçici bir workdir'e hazırlar. Bu, runtime image'ını
ince tutarken Vitest'i yine de tam olarak yerel source/config'inize karşı çalıştırır. Hazırlama
adımı, Docker canlı çalıştırmalarının makineye özgü artifact'leri kopyalamakla
dakikalar harcamaması için `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`
ve app'e yerel `.build` ya da Gradle çıktı dizinleri gibi büyük yalnızca yerel
cache'leri ve app build çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı probe'ları
container içinde gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattından gateway canlı kapsamını daraltmanız veya hariç tutmanız
gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de geçirin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu
HTTP endpoint'leri etkin olan bir OpenClaw gateway container'ı başlatır,
bu gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI
üzerinden oturum açar, `/api/models`'ın `openclaw/default` sunduğunu doğrular
ve ardından Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir
sohbet isteği gönderir.
Canlı model tamamlamasını beklemeden Open WebUI oturum açma ve model keşfinden
sonra durması gereken release-path CI kontrolleri için `OPENWEBUI_SMOKE_MODE=models`
ayarlayın.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın Open WebUI
image'ını çekmesi ve Open WebUI'nin kendi cold-start kurulumunu tamamlaması
gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(Docker'laştırılmış çalıştırmalarda varsayılan olarak `~/.profile`) bunu sağlamanın
birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload'u yazdırır.
`test:docker:mcp-channels` bilerek deterministiktir ve gerçek bir Telegram,
Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container'ı başlatır, `openclaw mcp serve` üreten ikinci bir container başlatır
ve ardından gerçek stdio MCP bridge'i üzerinden yönlendirilmiş konuşma keşfini,
transcript okumalarını, attachment metadata'sını, canlı event queue davranışını,
outbound send yönlendirmesini ve Claude tarzı kanal + izin bildirimlerini
doğrular. Bildirim kontrolü ham stdio MCP frame'lerini doğrudan inceler; böylece
smoke testi, yalnızca belirli bir client SDK'sının yüzeye çıkarmayı tesadüfen
başardığını değil, bridge'in gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarına
ihtiyaç duymaz. Repo Docker image'ını build eder, container içinde gerçek bir
stdio MCP probe server başlatır, bu server'ı gömülü Pi bundle MCP runtime'ı
üzerinden materialize eder, tool'u yürütür ve ardından `coding` ile `messaging`'in
`bundle-mcp` tool'larını tuttuğunu, `minimal` ve `tools.deny: ["bundle-mcp"]`'in
ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarına ihtiyaç
duymaz. Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway başlatır,
izole bir cron turn ve bir `/subagents spawn` tek seferlik child turn çalıştırır,
ardından MCP child process'in her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regresyon/debug workflow'ları için saklayın. ACP thread routing doğrulaması için yeniden gerekebilir; bu yüzden silmeyin.

Yararlı env var'ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testler çalıştırılmadan önce source edilir
- Yalnızca `OPENCLAW_PROFILE_FILE` üzerinden source edilen env var'larını, geçici config/workspace dizinleri kullanarak ve harici CLI auth mount'ları olmadan doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache'lenmiş CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle manuel olarak override edin
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Rebuild gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` image'ını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profile store'dan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce-check prompt'unu override etmek için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI image tag'ini override etmek için `OPENWEBUI_IMAGE=...`

## Doküman sanity kontrolü

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-safe)

Bunlar gerçek sağlayıcılar olmadan "gerçek pipeline" regresyonlarıdır:

- Gateway tool calling (mock OpenAI, gerçek gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

Zaten "agent reliability evals" gibi davranan birkaç CI-safe testimiz var:

- Gerçek gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan uçtan uca wizard flow'ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt'ta skills listelendiğinde, agent doğru skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow sözleşmeleri:** tool sırasını, session history carryover'ını ve sandbox sınırlarını doğrulayan multi-turn senaryolar.

Gelecekteki eval'lar önce deterministik kalmalıdır:

- Tool call'larını + sırasını, skill dosyası okumalarını ve session wiring'i doğrulamak için mock sağlayıcılar kullanan bir senaryo runner'ı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval'lar (opt-in, env-gated) yalnızca CI-safe paket yerine oturduktan sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi interface sözleşmesine
uyduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde iterasyon yapar ve bir
shape ve davranış assertion paketi çalıştırırlar. Varsayılan `pnpm test` unit
hattı bu paylaşılan seam ve smoke dosyalarını bilerek atlar; paylaşılan kanal
veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, capability'ler)
- **setup** - Setup wizard sözleşmesi
- **session-binding** - Session binding davranışı
- **outbound-payload** - Message payload yapısı
- **inbound** - Inbound message işleme
- **actions** - Kanal action handler'ları
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal status probe'ları
- **registry** - Plugin registry şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth flow sözleşmesi
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Ne zaman çalıştırılır

- plugin-sdk export'ları veya subpath'leri değiştirildikten sonra
- Bir kanal veya sağlayıcı Plugin'i eklendikten ya da değiştirildikten sonra
- Plugin registration veya discovery refactor edildikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regresyon ekleyin (mock/stub sağlayıcı veya tam request-shape transformation'ı yakalayın)
- Doğası gereği yalnızca canlı ise (rate limit'ler, auth politikaları), canlı testi dar ve env var'ları üzerinden opt-in tutun
- Bug'ı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı request conversion/replay bug'ı → doğrudan models test
  - gateway session/history/tool pipeline bug'ı → gateway canlı smoke testi veya CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) her SecretRef class için örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef target family eklerseniz, o testteki `classifyTargetClass` değerini güncelleyin. Yeni class'ların sessizce atlanamaması için test, sınıflandırılmamış target id'lerinde bilerek başarısız olur.

## İlgili

- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
