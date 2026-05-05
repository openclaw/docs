---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test seti: birim/e2e/canlı paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-05T01:47:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir
Docker çalıştırıcı seti vardır. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neyi kapsadığı (ve kasıtlı olarak neyi _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) — depo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin.

Bu sayfa düzenli test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık uzantı/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` ajan turu için
  `live_gpt54=true` ile veya Kova CPU/yığın/izleme artefaktları için
  `deep_profile=true` ile `OpenClaw Performance` iş akışını tetikleyin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock sağlayıcı, derin profil ve GPT 5.4 hat artefaktlarını
  `openclaw/clawgrit-reports` deposuna yayımlar. Mock sağlayıcı raporu ayrıca kaynak düzeyinde Gateway başlatma, bellek,
  Plugin baskısı, tekrarlanan sahte model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır.
    Meta verileri `image` girdisi bildiren modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre parçalanmış ayrı Docker canlı model
    matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet duman testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendiğini doğrular.
- Codex app-server test düzeneği duman testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan turlarını Plugin sahipli Codex app-server test düzeneği üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, alt ajan ve Guardian yoklamalarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken alt ajan yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Bu, `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece alt ajan yoklamasından sonra çıkar.
- Crestodian kurtarma komutu duman testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı ekstra güvenlik kontrolü.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker duman testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir kapsayıcıda çalıştırır
    ve bulanık planlayıcı yedeğinin denetlenmiş türlendirilmiş bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker duman testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/ajan/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girişlerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet duman testi: `MOONSHOT_API_KEY` ayarlı olduğunda
  `openclaw models list --provider moonshot --json` komutunu çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve asistan transcript'inin normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız vakaya ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan izin listesi ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab'i adanmış iş akışlarında çalıştırır. Ajan tabanlı eşitlik, bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır.
Kararlı/varsayılan sürüm kontrolleri, kapsamlı canlı/Docker soak işlemini `run_release_soak=true` arkasında tutar; `full` profili soak işlemini zorunlu kılar.
`QA-Lab - All Lanes`, `main` üzerinde her gece ve manuel tetiklemeden mock eşitlik hattı, canlı Matrix hattı,
Convex tarafından yönetilen canlı Telegram hattı ve Convex tarafından yönetilen canlı Discord hattı paralel işler olarak çalışır.
Zamanlanmış QA ve sürüm kontrolleri Matrix'e açıkça `--profile fast` geçirirken, Matrix CLI ve manuel iş akışı girdisi varsayılanı `all` olarak kalır; manuel tetikleme `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release
Checks`, sürüm onayından önce eşitlik ile hızlı Matrix ve Telegram hatlarını çalıştırır; deterministik kalmaları ve normal sağlayıcı Plugin başlangıcından kaçınmaları için sürüm taşıma kontrollerinde `mock-openai/gpt-5.5` kullanır.
Bu canlı taşıma Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA eşitlik paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları, zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/arka uç parçaları, seçilen commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak birden çok seçili senaryoyu yalıtılmış Gateway
    worker’larıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 yapar (seçili
    senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>` kullanın veya eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalığı olan
    `mock-openai` hattını değiştirmeden deneysel fixture ve protokol mock kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin deneme serisini QA Lab üzerinden çalıştırır. Harici
    Kitchen Sink paketini yükler, Plugin SDK yüzeyi envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, Gateway CPU/RSS
    kanıtını kaydeder, canlı bir OpenAI turu çalıştırır ve adversarial tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir. Doldurulmuş Testbox
    oturumlarında, `openclaw-testbox-env` yardımcısı mevcut olduğunda Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak olarak kullanır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç karşılaştırmasını ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem
    özetini `.artifacts/gateway-cpu-scenarios/` altına yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini bayraklar (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa başlangıç sıçramaları,
    dakikalar süren Gateway peg regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` artifact’lerini kullanır; checkout’ta zaten taze çalışma zamanı çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite’ini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo kökünün altında kalmalıdır; böylece konuk, bağlı workspace üzerinden geri yazabilir.
  - Normal QA raporu + özetin yanı sıra Multipass loglarını
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout’tan bir npm tarball’ı oluşturur, bunu Docker içinde global olarak yükler,
    etkileşimsiz OpenAI API anahtarı onboarding’i çalıştırır, varsayılan olarak Telegram’ı yapılandırır,
    paketlenmiş Plugin çalışma zamanının başlangıç
    bağımlılık onarımı olmadan yüklendiğini doğrular, doctor çalıştırır ve mock’lanmış bir OpenAI endpoint’ine karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı transcript’leri için deterministik bir derlenmiş uygulama Docker smoke’u çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının,
    görünür kullanıcı turuna sızmak yerine görüntülenmeyen özel bir mesaj olarak kalıcılaştırıldığını doğrular,
    ardından etkilenmiş bozuk bir oturum JSONL’i eker ve
    `openclaw doctor --fix` komutunun bunu bir yedekle etkin branch’e yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını yükler, kurulu paket
    onboarding’ini çalıştırır, kurulu CLI üzerinden Telegram’ı yapılandırır, ardından
    canlı Telegram QA hattını SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanır; registry’den
    yüklemek yerine çözümlenmiş yerel bir tarball’ı test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır.
    CI/release otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret’ını ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret’ı mevcutsa,
    Docker wrapper Convex’i otomatik seçer.
  - Wrapper, Docker build/install çalışmasından önce host üzerindeki Telegram veya Convex kimlik bilgisi env’ini doğrular.
    Yalnızca kimlik bilgisi öncesi kurulumu bilerek debug ederken `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow’u
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow,
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi lease’lerini kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için `Package Acceptance` sunar.
  Güvenilir bir ref, yayımlanmış npm spec’i, SHA-256 ile HTTPS tarball URL’si
  veya başka bir çalıştırmadan tarball artifact’i kabul eder, normalize edilmiş
  `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut
  Docker E2E zamanlayıcısını smoke, package, product, full veya custom
  hat profilleriyle çalıştırır. Telegram QA workflow’unu aynı
  `package-under-test` artifact’ine karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
  - En son beta ürün kanıtı:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Kesin tarball URL kanıtı bir digest gerektirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact kanıtı, başka bir Actions çalıştırmasından tarball artifact’i indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build’ini Docker içinde paketleyip yükler, Gateway’i
    OpenAI yapılandırılmış olarak başlatır, ardından config
    düzenlemeleriyle paketli kanal/Plugin’leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin’leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik her indirilebilir
    Plugin’i açıkça yüklediğini ve ikinci yeniden başlatmanın gizli bağımlılık
    onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline’ı yükler,
    `openclaw update --tag <candidate>` çalıştırmadan önce Telegram’ı etkinleştirir
    ve adayın güncelleme sonrası doctor’ının, harness taraflı postinstall onarımı olmadan eski Plugin bağımlılık kalıntılarını temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Native paketlenmiş kurulum güncelleme smoke’unu Parallels konukları genelinde çalıştırır. Seçilen her platform önce istenen baseline paketini yükler,
    ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve
    kurulu sürümü, güncelleme durumunu, Gateway hazır oluşunu ve bir yerel agent turunu doğrular.
  - Tek bir konuk üzerinde iterasyon yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın.
    Özet artifact yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı, varsayılan olarak canlı agent turu kanıtı için `openai/gpt-5.5` kullanır.
    Bilerek başka bir OpenAI modelini doğrularken `--model <provider/model>` geçirin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels aktarım duraklamalarının test penceresinin geri kalanını tüketmemesi için uzun yerel çalıştırmaları host timeout ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script, iç içe hat loglarını `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış wrapper’ın takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme çalışmasında 10 ila 15 dakika harcayabilir; iç içe npm
    debug logu ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu aggregate wrapper’ı ayrı Parallels macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın.
    VM durumunu paylaşırlar ve snapshot geri yükleme, paket sunumu veya konuk Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketli Plugin yüzeyini çalıştırır; çünkü
    konuşma, görüntü oluşturma ve medya
    anlama gibi capability facade’ları, agent turunun kendisi yalnızca basit bir metin yanıtını denetlese bile paketli çalışma zamanı API’leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli Tuwunel homeserver’a karşı çalıştırır. Yalnızca kaynak checkout’u — paketlenmiş kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env değişkenleri ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env’den alınan driver ve SUT bot token’larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id’si sayısal Telegram sohbet id’si olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış lease’lere katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta, SUT botunun Telegram kullanıcı adı sunduğu iki ayrı bot gerektirir.
  - Kararlı bot-bot gözlemi için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode’u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Bir Telegram QA raporu, özet ve gözlemlenen mesajlar artifact’ini `.artifacts/qa-e2e/...` altına yazar. Yanıtlama senaryoları, driver gönderim isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapma göstermez. Hat başına kapsam matrisi [QA genel bakış → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik suite’tir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu lease’e Heartbeat gönderir
ve kapanışta lease’i serbest bırakır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçili rol için bir secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI`, `ci` için
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışma sırasında `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı sırlarını,
uç nokta önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini gizli
değerleri yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI
yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

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

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) bölümünde yer alır. Asgari gereklilik: taşıma çalıştırıcısını paylaşılan `qa-lab` host seam üzerinde uygulamak, Plugin manifestinde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve senaryoları `qa/scenarios/` altında yazmaktır.

## Test takımları (nerede ne çalışır)

Takımları “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` parça kümesini kullanır ve paralel zamanlama için çok projeli parçaları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri ayrılmış `unit-ui` parçasında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve herkese açık yüzey yükleyici testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil, oluşturulmuş küçük Plugin fixture'larıyla geniş `api.js` ve
    `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri
    Plugin'e ait sözleşme/entegrasyon takımlarına aittir.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Hedeflenmemiş `pnpm test`, tek bir devasa yerel kök-proje süreci yerine on iki daha küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi düşürür ve auto-reply/Plugin çalışmalarının ilgisiz takımları aç bırakmasını önler.
    - `pnpm test --watch` yine de yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports` açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel denetim kapısıdır. Diff'i çekirdek, çekirdek testleri, Plugin'ler, Plugin testleri, uygulamalar, belgeler, sürüm meta verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm meta verisi içeren sürüm artırmaları, üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir korumayla hedefli sürüm/yapılandırma/kök bağımlılık denetimleri çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: canlı Docker kimlik doğrulama betikleri için shell söz dizimi ve canlı Docker zamanlayıcı dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, export, sürüm ve diğer paket yüzeyi düzenlemeleri yine daha geniş korumaları kullanır.
    - Agents, komutlar, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan import açısından hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durum bilgili/runtime açısından ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır takımı yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış gruplara sahiptir. CI, tek bir import açısından ağır grubun tüm Node kuyruğunu sahiplenmemesi için reply alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing parçalarına böler.
    - Normal PR/main CI, Plugin toplu taramasını ve yalnızca sürüme özgü `agentic-plugins` parçasını kasıtlı olarak atlar. Full Release Validation, sürüm adaylarında bu Plugin/extension ağırlıklı takımlar için ayrı `Plugin Prerelease` alt iş akışını dispatch eder.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Mesaj aracı keşif girdilerini veya Compaction runtime
      bağlamını değiştirdiğinizde, her iki kapsama düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme
      sınırları için odaklı yardımcı regresyonları ekleyin.
    - Embedded runner entegrasyon takımlarını sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu takımlar, kapsamlı kimliklerin ve Compaction davranışının hâlâ
      gerçek `run.ts` / `compact.ts` yollarından aktığını doğrular; yalnızca yardımcı
      testler bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar genelinde yalıtılmamış çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve optimizer'ını korur, ancak
      paylaşılan yalıtılmamış çalıştırıcıda da çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 derleme yükünü azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Standart V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme içindir. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyaç duyduğunuzda handoff veya push öncesinde açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. Yalnızca agent
      bir harness, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek bir worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi kasıtlı olarak tutucudur ve host load average zaten yüksek olduğunda
      geri çekilir; böylece birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler; böylece test
      kablolaması değiştiğinde changed-mode yeniden çalıştırmaları doğru kalır.
    - Yapılandırma, desteklenen
      hostlarda `OPENCLAW_VITEST_FS_MODULE_CACHE` öğesini etkin tutar; doğrudan profil çıkarma için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil çıkarma görünümünü
      `origin/main` sonrası değişen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tam yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      parçaları, filtrelenmiş parçaların ayrı izlenebilmesi için parça adını ekler.
    - Bir sıcak test zamanının çoğunu hâlâ başlatma importlarında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` seam arkasında tutun ve
      sırf `vi.mock(...)` üzerinden geçirmek için runtime yardımcılarını deep-import etmek yerine
      bu seam'i doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` çalıştırmasını o commit'lenmiş diff için yerel kök-proje yolu ile karşılaştırır
      ve wall time ile macOS max RSS yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden
      yönlendirerek mevcut kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform yükü için
      ana thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim takımı için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, bir worker'a zorlanır
- Kapsam:
  - Varsayılan olarak tanılama etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik Gateway mesajı, bellek ve büyük-payload churn'ü sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra boşaldığını doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway takımının yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde `isolate: false` ile Vitest `threads` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çoklu örnek Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, düğüm eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (pipeline içinde etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla host üzerinde yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs bridge aracılığıyla uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek provider'lar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin canlı testleri
- Varsayılan: `pnpm test:live` ile **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu provider/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Provider biçim değişikliklerini, araç çağırma tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalama
- Beklentiler:
  - Tasarım gereği CI'da kararlı değildir (gerçek ağlar, gerçek provider politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Her şey” yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynaklar.
- Varsayılan olarak canlı çalıştırmalar hâlâ `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home'una kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek home dizininizi kullanmasını bilinçli olarak istediğinizde ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlüklerini/Bonjour konuşmasını sessize alır. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (provider'a özel): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlıya özel geçersiz kılma kullanın; testler rate limit yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık uzun provider çağrıları Vitest konsol yakalama sessizken bile görünür şekilde etkin olsun diye stderr'e ilerleme satırları yayar.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında provider/Gateway ilerleme satırlarının hemen akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağına / WS protokolüne / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- “Bot'um çalışmıyor” / provider'a özel hatalar / araç çağırma debug işlemleri: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI backend smoke'ları, ACP smoke'ları, Codex app-server
harness'ı ve tüm media-provider canlı testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — ayrıca canlı çalıştırmalar için kimlik bilgisi işleme — için
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker runner'ları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker runner'ları iki gruba ayrılır:

- Canlı-model runner'ları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profil-anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` kaynaklar). Eşleşen yerel entrypoint'ler `test:live:models-profiles` ve `test:live:gateway-profiles` değerleridir.
- Docker canlı runner'ları varsayılan olarak daha küçük bir smoke üst sınırına sahiptir; böylece tam Docker taraması uygulanabilir kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  açıkça istediğinizde bu env var'ları geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez oluşturur, `scripts/package-openclaw-for-docker.mjs` üzerinden OpenClaw'ı bir kez npm tarball olarak paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Bare imaj, install/update/plugin-dependency hatları için yalnızca Node/Git runner'dır; bu hatlar önceden oluşturulmuş tarball'ı bağlar. Functional imaj, built-app functionality hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yer alır; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yer alır; `scripts/test-docker-all.mjs` seçili planı yürütür. Toplam çalıştırma ağırlıklı yerel scheduler kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç slotlarını kontrol ederken, kaynak üst sınırları ağır canlı, npm-install ve çoklu servis hatlarının hepsinin aynı anda başlamasını engeller. Tek bir hat etkin üst sınırlardan daha ağırsa, scheduler havuz boşken yine de onu başlatabilir ve ardından kapasite yeniden kullanılabilir olana kadar tek başına çalıştırmaya devam eder. Varsayılanlar 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker host'unda daha fazla pay olduğunda ayarlayın. Runner varsayılan olarak Docker preflight gerçekleştirir, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde depolar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifest'ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçili hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub-native paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paket çözer, onu `package-under-test` olarak yükler, ardından seçili ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak o tarball'a karşı çalıştırır. Profiller genişliğe göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, published-upgrade survivor matrisi, sürüm varsayılanları ve hata triage için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Build ve release kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Guard, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik oluşturulmuş grafiği gezer ve komut dispatch öncesinde pre-dispatch başlangıç import'ları Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway run chunk'ını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke ayrıca root help, onboard help, doctor help, status, config schema ve model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesme noktasına kadar harness yalnızca yayımlanmış paket metadata boşluklarını tolere eder: atlanmış private QA inventory girdileri, eksik `gateway install --wrapper`, tarball türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. `2026.4.25` sonrasındaki paketlerde bu yollar katı hatadır.
- Container smoke runner'ları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha yüksek seviyeli entegrasyon yollarını doğrular.

Canlı-model Docker runner'ları ayrıca yalnızca gereken CLI auth home'larını (veya çalıştırma daraltılmadığında desteklenen tümünü) bind-mount eder, ardından dış CLI OAuth token'ları host auth store'u değiştirmeden yenileyebilsin diye çalıştırmadan önce bunları container home'una kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar, `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sıkı Droid/OpenCode kapsamı sağlar)
- CLI arka uç duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama sunucusu harness duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testi: `pnpm qa:otel:smoke` özel bir QA kaynak checkout hattıdır. npm tarball'ı QA Lab'i içermediği için bilerek paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde genel olarak kurar, OpenAI'ı env-ref onboarding ve varsayılan olarak Telegram ile yapılandırır, doctor çalıştırır ve bir mock OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.
- Güncelleme kanalı değiştirme duman testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde genel olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası işleyişinin doğrulandığını kontrol eder, sonra yeniden paket `stable` kanalına döner ve güncelleme durumunu denetler.
- Yükseltme sağ kalan duman testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball'ını ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları olan kirli bir eski kullanıcı fixture'ının üzerine kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, sonra bir loopback Gateway başlatır ve yapılandırma/durum korunmasını ve başlatma/durum bütçelerini denetler.
- Yayımlanmış yükseltme sağ kalan duman testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyaları yerleştirir, bu baseline'ı gömülü bir komut tarifiyle yapılandırır, oluşan yapılandırmayı doğrular, yayımlanmış kurulumu aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, sonra bir loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korunmasını, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini denetler. Tek bir baseline'ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile `all-since-2026.4.23` gibi kesin baseline'ları genişletmesini isteyin ve issue biçimli fixture'ları `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile `reported-issues` gibi genişletin; reported-issues kümesi, otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar; Full Release Validation engelleyici yolda varsayılan latest baseline'ı kullanır ve all-since/reported-issues kapsamına yalnızca `run_release_soak=true` veya `release_profile=full` için genişler.
- Oturum çalışma zamanı bağlamı duman testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor ile onarımını doğrular.
- Bun genel kurulum duman testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketli görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile derlenmiş bir Docker imajından `dist/` kopyalayın.
- Kurulum aracı Docker duman testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm kapsayıcıları arasında tek bir npm önbelleği paylaşır. Güncelleme duman testi, aday tarball'a yükseltmeden önce kararlı baseline olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke workflow'unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurulum aracı denetimleri, root sahipli önbellek girdilerinin kullanıcıya yerel kurulum davranışını maskelememesi için izole bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm genel güncellemesini `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanı silme CLI duman testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak root Dockerfile imajını derler, izole bir kapsayıcı home içinde tek çalışma alanına sahip iki ajan yerleştirir, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki kapsayıcı, WS kimlik doğrulaması + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot duman testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri, iframe referanslarını ve frame metaverilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) mock bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` işleminin `reasoning.effort` değerini `minimal` düzeyinden `low` düzeyine yükselttiğini doğrular, sonra sağlayıcı şemasının reddetmesini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (yerleştirilmiş Gateway + stdio köprüsü + ham Claude bildirim-frame duman testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profil allow/deny duman testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP alt süreç sonlandırması): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (yerel path, `file:`, hoisted bağımlılıkları olan npm registry, git hareketli refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme duman testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmemiş duman testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi duman testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'ını boş bir kapsayıcıya kurar, bir npm Plugin kurar, etkinleştir/devre dışı bırak durumunu değiştirir, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından kaldırmanın her yaşam döngüsü aşaması için RSS/CPU metriklerini günlüğe yazarken eski durumu yine de kaldırdığını doğrular.
- Yapılandırma yeniden yükleme metaveri duman testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`, yerel path, `file:`, hoisted bağımlılıkları olan npm registry, git hareketli refs, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme duman testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlemeli npm Plugin kurulumunu, etkinleştirmeyi, devre dışı bırakmayı, yükseltmeyi, düşürmeyi ve eksik kod kaldırmasını kapsar.

Paylaşılan işlevsel imajı elle önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, betikler yerelde yoksa onu çeker. QR ve kurulum aracı Docker testleri, paylaşılan derlenmiş uygulama çalışma zamanı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile'larını korur.

Canlı model Docker çalıştırıcıları ayrıca geçerli çalışma kopyasını salt okunur olarak bağlar ve konteyner içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı imajını küçük tutarken Vitest’in tam olarak yerel kaynak/yapılandırmanız üzerinde çalışmasını sağlar.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü yapıtları kopyalamak için dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya yerel `.build` ya da Gradle çıktı dizinleri gibi büyük yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı yoklamaları konteyner içinde gerçek Telegram/Discord/vb. kanal çalışanlarını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle Docker hattından Gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş bir OpenClaw Gateway konteyneri başlatır, bu Gateway’e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden oturum açar, `/api/models` öğesinin `openclaw/default` değerini sunduğunu doğrular, ardından Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker’ın Open WebUI imajını çekmesi ve Open WebUI’nin kendi soğuk başlatma kurulumunu tamamlaması gerekebilir.
Bu hat, kullanılabilir bir canlı model anahtarı bekler ve Docker ile konteynerleştirilmiş çalıştırmalarda bunu sağlamanın birincil yolu `OPENCLAW_PROFILE_FILE` (`~/.profile` varsayılan) değeridir.
Başarılı çalıştırmalar `{ "ok": true, "model": "openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` özellikle deterministiktir ve gerçek bir Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway konteynerini başlatır, `openclaw mcp serve` sürecini oluşturan ikinci bir konteyner başlatır, ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim denetimi, ham stdio MCP çerçevelerini doğrudan inceler; böylece duman testi, yalnızca belirli bir istemci SDK’sının yüzeye çıkardığını değil, köprünün gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarı gerektirmez. Repo Docker imajını derler, konteyner içinde gerçek bir stdio MCP yoklama sunucusu başlatır, bu sunucuyu gömülü Pi paketi MCP çalışma zamanı üzerinden oluşturur, aracı yürütür, ardından `coding` ve `messaging` öğelerinin `bundle-mcp` araçlarını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarı gerektirmez. Gerçek bir stdio MCP yoklama sunucusuyla tohumlanmış bir Gateway başlatır, izole bir cron turu ve bir `/subagents spawn` tek seferlik alt tur çalıştırır, ardından MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dilli iş parçacığı duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP iş parçacığı yönlendirme doğrulaması için yeniden gerekebilir; bu yüzden silmeyin.

Yararlı env değişkenleri:

- `/home/node/.openclaw` konumuna bağlanan `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`)
- `/home/node/.openclaw/workspace` konumuna bağlanan `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`)
- `/home/node/.profile` konumuna bağlanan ve testler çalıştırılmadan önce source edilen `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`)
- Geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI auth bağlamaları olmadan yalnızca `OPENCLAW_PROFILE_FILE` üzerinden source edilen env değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna bağlanan `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`)
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle elle geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut bir `openclaw:local-live` imajını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env’den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI duman testi için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI duman testinin kullandığı nonce denetimi promptunu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman sağlamlık denetimi

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek gateway + agent döngüsü): `src/gateway/gateway.test.ts` (test durumu: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırma yazar + auth zorlanır): `src/gateway/gateway.test.ts` (test durumu: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (skills)

“Agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI için güvenli testimiz zaten var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills promptta listelendiğinde agent doğru skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyup gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, kapılama, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (opt-in, env ile kapılı) yalnızca CI için güvenli paket hazır olduktan sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde döner ve şekil ile davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` birim hattı, bu paylaşılan sınır ve duman dosyalarını bilinçli olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **plugin** - Temel Plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - İleti yükü yapısı
- **inbound** - Gelen ileti işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - İş parçacığı kimliği işleme
- **directory** - Dizin/kadro API’si
- **group-policy** - Grup ilkesi zorlaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/belirleme
- **catalog** - Model kataloğu API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırmalı

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfini refactor ettikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek şekli dönüşümünü yakalama)
- Doğası gereği yalnızca canlıysa (rate limit’ler, auth ilkeleri), canlı testi dar tutun ve env değişkenleriyle opt-in yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden yürütme hatası → doğrudan model testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı duman testi veya CI için güvenli Gateway mock testi
- SecretRef geçiş koruma sınırı:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için bir örnek hedef türetir, ardından geçiş segmenti exec id’lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` öğesini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde bilerek başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
