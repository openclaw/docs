---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-11T20:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir
Docker çalıştırıcı kümesi vardır. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve kasıtlı olarak neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, gönderim öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım kulvarları)** ayrıca belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) - depo destekli senaryoların kullandığı sentetik aktarım Plugin'i.

Bu sayfa, düzenli test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (gönderimden önce beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık eklenti/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA kulvarı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ekstra güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılarda/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` ajan dönüşü için
  `live_gpt54=true` ile veya Kova CPU/heap/trace yapıtları için
  `deep_profile=true` ile `OpenClaw Performance` gönderin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında sahte sağlayıcı, derin profil ve GPT 5.4 kulvarı yapıtlarını
  `openclaw/clawgrit-reports` üzerinde yayımlar. Sahte sağlayıcı raporu ayrıca kaynak düzeyinde Gateway başlatma, bellek,
  Plugin baskısı, yinelenen sahte model merhaba döngüsü ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü artı küçük bir dosya okuma tarzı prob çalıştırır.
    Meta verisi `image` girdisini duyuran modeller ayrıca küçük bir görüntü dönüşü çalıştırır.
    Sağlayıcı hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre parçalara ayrılmış ayrı Docker canlı model
    matris işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile gönderin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` dosyasına,
    ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex uygulama sunucusu yolu üzerinde bir Docker canlı kulvarı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağı üzerinden yönlendiğini doğrular.
- Codex uygulama sunucusu harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan dönüşlerini Plugin'in sahip olduğu Codex uygulama sunucusu harness'ı üzerinden çalıştırır,
    `/codex status` ve `/codex models` doğrular ve varsayılan olarak görüntü,
    cron MCP, alt ajan ve Guardian problarını çalıştırır. Diğer Codex
    uygulama sunucusu hatalarını izole ederken alt ajan probunu
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan kontrolü için diğer probları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, alt ajan probundan sonra çıkar.
- Codex isteğe bağlı kurulum smoke testi: `pnpm test:docker:codex-on-demand`
  - Paketlenmiş OpenClaw tarball'ını Docker içinde kurar, OpenAI API anahtarı
    ilk kurulumunu çalıştırır ve Codex Plugin'i ile `@openai/codex` bağımlılığının
    istek üzerine yönetilen npm köküne indirildiğini doğrular.
- Canlı Plugin araç bağımlılığı smoke testi: `pnpm test:docker:live-plugin-tool`
  - Gerçek bir `slugify` bağımlılığına sahip bir fixture Plugin'i paketler, onu
    `npm-pack:` üzerinden kurar, yönetilen npm kökü altındaki bağımlılığı doğrular, ardından
    canlı bir OpenAI modelinden Plugin aracını çağırmasını ve gizli slug'ı döndürmesini ister.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komut yüzeyi için isteğe bağlı, ek güvence kontrolü.
    `/crestodian status` çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtlar ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı yapılandırmasız bir kapsayıcıda, `PATH` üzerinde sahte bir Claude CLI ile çalıştırır
    ve bulanık planlayıcı geri dönüşünün denetimli, tipli bir yapılandırma yazmasına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, yalın `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/ajan/Discord Plugin + SecretRef yazmalarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından izole edilmiş bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  komutunu `moonshot/kimi-k2.6` üzerinde çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve
  asistan transkriptinin normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan izin listesi ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'i ayrılmış iş akışlarında çalıştırır. Ajanik eşdeğerlik bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır.
Kararlı/varsayılan sürüm kontrolleri kapsamlı canlı/Docker soak'ı `run_release_soak=true` arkasında tutar;
`full` profili soak'ı zorunlu kılar. `QA-Lab - All Lanes`,
`main` üzerinde gecelik olarak ve manuel gönderimden; sahte eşdeğerlik kulvarı, canlı
Matrix kulvarı, Convex tarafından yönetilen canlı Telegram kulvarı ve Convex tarafından yönetilen canlı Discord
kulvarı paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix'e
`--profile fast` değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi
varsayılanı `all` olarak kalır; manuel gönderim `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release
Checks`, sürüm onayından önce eşdeğerliği ve hızlı Matrix ile Telegram kulvarlarını çalıştırır;
sürüm aktarım kontrolleri deterministik kalsın ve normal sağlayıcı Plugin başlangıcından kaçınsın diye
`mock-openai/gpt-5.5` kullanır. Bu canlı aktarım
Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA eşdeğerlik
paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları,
zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/arka uç parçaları,
seçilen her commit için bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden derlemek yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak birden çok seçili senaryoyu yalıtılmış Gateway
    işçileriyle paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı
    4 yapar (seçili senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için
    `--concurrency <count>` kullanın veya eski seri hat için `--concurrency 1`
    kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Hata
    veren bir çıkış kodu olmadan artifact istediğinizde `--allow-failures`
    kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryodan haberdar `mock-openai` hattını değiştirmeden deneysel
    fixture ve protokol mock kapsamı için yerel AIMock destekli bir sağlayıcı
    sunucusu başlatır.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin sınama dizisini QA Lab üzerinden çalıştırır.
    Harici Kitchen Sink paketini kurar, Plugin SDK yüzeyi envanterini doğrular,
    `/healthz` ve `/readyz` uçlarını yoklar, Gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve adversarial tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir. Hydrate
    edilmiş Testbox oturumlarında, `openclaw-testbox-env` yardımcısı mevcut
    olduğunda Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak
    alır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç karşılaştırmasını ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini bayraklar
    (`--cpu-core-warn` ile `--hot-wall-warn-ms`), böylece kısa başlangıç
    patlamaları dakikalar süren Gateway peg regresyonu gibi görünmeden metrik
    olarak kaydedilir.
  - Oluşturulmuş `dist` artifact'lerini kullanır; checkout'ta zaten taze çalışma
    zamanı çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama
    girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
    yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıkış dizinleri repo kökü altında kalmalıdır, böylece konuk bağlı çalışma
    alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetine ek olarak Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global
    olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır,
    varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin çalışma
    zamanının başlangıç bağımlılık onarımı olmadan yüklendiğini doğrular, doctor
    çalıştırır ve mock edilmiş bir OpenAI uç noktasına karşı bir yerel ajan turu
    çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı transcript'leri için deterministik bir
    oluşturulmuş uygulama Docker smoke testi çalıştırır. Gizli OpenClaw çalışma
    zamanı bağlamının görünür kullanıcı turuna sızmak yerine görüntülenmeyen
    özel bir mesaj olarak kalıcılaştırıldığını doğrular, ardından etkilenmiş
    bozuk bir oturum JSONL dosyası seed eder ve `openclaw doctor --fix`
    komutunun bunu yedekle birlikte aktif dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini
    çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından bu kurulu
    paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden
    kullanır.
  - Sarmalayıcı, checkout'tan yalnızca `qa-lab` harness kaynağını bağlar;
    kurulu paket `dist`, `openclaw/plugin-sdk` ve paketlenmiş Plugin çalışma
    zamanına sahip olur, böylece hat geçerli checkout Plugin'lerini test
    altındaki paketle karıştırmaz.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir;
    registry'den kurmak yerine çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/release otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı mevcutsa Docker
    sarmalayıcı Convex'i otomatik olarak seçer.
  - Sarmalayıcı, Docker build/kurulum çalışmasından önce ana makinede Telegram
    veya Convex kimlik bilgisi env değerlerini doğrular. Yalnızca kimlik bilgisi
    öncesi kurulumu bilinçli olarak hata ayıklarken
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow,
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256
  ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artifact'i kabul
  eder, normalize edilmiş `openclaw-current.tgz` dosyasını
  `package-under-test` olarak yükler, ardından mevcut Docker E2E scheduler'ını
  smoke, package, product, full veya özel hat profilleriyle çalıştırır. Telegram
  QA workflow'unu aynı `package-under-test` artifact'ine karşı çalıştırmak için
  `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artifact kanıtı, başka bir Actions çalıştırmasından tarball artifact'i indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build'ini Docker içinde paketleyip kurar, OpenAI
    yapılandırılmış olarak Gateway'i başlatır, ardından yapılandırma
    düzenlemeleriyle paketlenmiş kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri bulunmaz
    bıraktığını, ilk yapılandırılmış doctor onarımının eksik indirilebilir her
    Plugin'i açıkça kurduğunu ve ikinci bir yeniden başlatmanın gizli bağımlılık
    onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm baseline kurar, `openclaw update --tag
    <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme
    sonrası doctor komutunun eski Plugin bağımlılık kalıntılarını harness
    tarafı bir postinstall onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Native paketlenmiş kurulum güncelleme smoke testini Parallels konukları
    genelinde çalıştırır. Seçilen her platform önce istenen baseline paketini
    kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve
    kurulu sürümü, güncelleme durumunu, Gateway hazır olma durumunu ve bir yerel
    ajan turunu doğrular.
  - Tek bir konuk üzerinde iterasyon yaparken `--platform macos`, `--platform
    windows` veya `--platform linux` kullanın. Özet artifact yolu ve hat başına
    durum için `--json` kullanın.
  - OpenAI hattı, varsayılan olarak canlı ajan turu kanıtı için `openai/gpt-5.5`
    kullanır. Bilinçli olarak başka bir OpenAI modelini doğrularken `--model
    <provider/model>` geçirin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels taşıma takılmalarının test penceresinin geri kalanını tüketmemesi
    için uzun yerel çalıştırmaları ana makine timeout'u ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*`
    altında yazar. Dış sarmalayıcının takıldığını varsaymadan önce
    `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını
    inceleyin.
  - Windows güncellemesi soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme çalışmasında 10 ila 15 dakika harcayabilir; iç içe npm debug
    günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu aggregate sarmalayıcıyı bireysel Parallels macOS, Windows veya Linux
    smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot
    geri yükleme, paket sunumu veya konuk Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt normal paketlenmiş Plugin yüzeyini çalıştırır,
    çünkü konuşma, görüntü oluşturma ve medya anlama gibi capability facade'ları,
    ajan turunun kendisi yalnızca basit bir metin yanıtını denetlese bile
    paketlenmiş çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel
    homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u - paketlenmiş
    kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env vars ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env'den gelen sürücü ve SUT bot token'larını
    kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal
    Telegram sohbet id'si olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex`
    destekler. Varsayılan olarak env modunu kullanın veya havuz lease'lerine
    katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Varsayılanlar canary, mention gating, command addressing, `/status`,
    bot-to-bot belirtilmiş yanıtlar ve core native komut yanıtlarını kapsar.
    `mock-openai` varsayılanları ayrıca deterministik reply-chain ve Telegram
    final-message streaming regresyonlarını kapsar. `session_status` gibi
    isteğe bağlı yoklamalar için `--list-scenarios` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Hata
    veren bir çıkış kodu olmadan artifact istediğinizde `--allow-failures`
    kullanın.
  - Aynı özel grupta iki farklı bot ve SUT botunun bir Telegram kullanıcı adı
    sunmasını gerektirir.
  - Kararlı bot-to-bot gözlemi için her iki botta da `@BotFather` içinde
    Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot
    trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve gözlenen
    mesajlar artifact'i yazar. Yanıt veren senaryolar, sürücü gönderme isteğinden
    gözlenen SUT yanıtına kadar RTT içerir.

`Mantis Telegram Live`, bu hattın çevresindeki PR kanıtı sarmalayıcısıdır. Aday
ref'i Convex lease'li Telegram kimlik bilgileriyle çalıştırır, redakte edilmiş
gözlenen mesaj transcript'ini Crabbox masaüstü tarayıcısında render eder, MP4
kanıtı kaydeder, hareket kırpılmış bir GIF oluşturur, artifact paketini yükler ve
`pr_number` ayarlandığında Mantis GitHub App üzerinden satır içi PR kanıtı
gönderir. Maintainer'lar bunu Actions UI üzerinden `Mantis Scenario`
(`scenario_id: telegram-live`) ile veya doğrudan bir pull request yorumundan
başlatabilir:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`, PR görsel kanıtı için ajanlı native Telegram
Desktop önce/sonra sarmalayıcısıdır. Actions UI üzerinden serbest biçimli
`instructions` ile, `Mantis Scenario` (`scenario_id: telegram-desktop-proof`)
üzerinden veya bir PR yorumundan başlatın:

```text
@Mantis telegram desktop proof
```

Mantis ajanı PR'ı okur, değişikliği hangi Telegram görünür davranışının
kanıtladığına karar verir, temel ve aday ref'lerde gerçek kullanıcı Crabbox Telegram Desktop
kanıt hattını çalıştırır, yerel GIF'ler işe yarar hale gelene kadar yineler, eşleştirilmiş bir
`motionPreview` manifesti yazar ve `pr_number` ayarlandığında aynı 2 sütunlu GIF tablosunu
Mantis GitHub App üzerinden gönderir.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Bir Crabbox Linux masaüstü kiralar veya yeniden kullanır, yerel Telegram Desktop'ı kurar, OpenClaw'ı kiralanmış bir Telegram SUT bot belirteciyle yapılandırır, Gateway'i başlatır ve görünür VNC masaüstünden ekran görüntüsü/MP4 kanıtı kaydeder.
  - Varsayılan olarak `--credential-source convex` kullanır; böylece iş akışları yalnızca Convex aracı sırrına ihtiyaç duyar. `pnpm openclaw qa telegram` ile aynı `OPENCLAW_QA_TELEGRAM_*` değişkenleriyle `--credential-source env` kullanın.
  - Telegram Desktop hâlâ bir kullanıcı oturumu/profili gerektirir. Bot belirteci yalnızca OpenClaw'ı yapılandırır. base64 `.tgz` profil arşivi için `--telegram-profile-archive-env <name>` kullanın veya `--keep-lease` kullanıp VNC üzerinden bir kez elle oturum açın.
  - Çıktı dizini altında `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` ve `telegram-desktop-builder.mp4` yazar.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşıyıcılar sapmaz. Hat başına kapsam matrisi [QA overview → Live transport coverage](/tr/concepts/qa-e2e-automation#live-transport-coverage) bölümünde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

Canlı taşıma QA için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kira alır, hat çalışırken
bu kiraya Heartbeat gönderir ve kapanışta kirayı serbest bırakır. Bölüm adı
Discord, Slack ve WhatsApp desteğinden önce gelir; kira sözleşmesi türler arasında ortaktır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir sır:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI`, `ci` için
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

Normal çalışmada `OPENCLAW_QA_CONVEX_SITE_URL` `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı sırlarını,
uç nokta önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini
sır değerlerini yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI
yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (yalnızca bakımcı sırrı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı sırrı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Etkin kira koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram türü için yük biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

Telegram gerçek kullanıcı türü için yük biçimi:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` ve `telegramApiId` sayısal dizeler olmalıdır.
- `tdlibArchiveSha256` ve `desktopTdataArchiveSha256` SHA-256 hex dizeleri olmalıdır.
- `kind: "telegram-user"` bir Telegram geçici hesabını temsil eder. Kirayı hesap genelinde kabul edin: TDLib CLI sürücüsü ve Telegram Desktop görsel tanığı aynı yükten geri yüklenir ve aynı anda yalnızca bir iş kirayı tutmalıdır.

Telegram gerçek kullanıcı kira geri yüklemesi:

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

Görsel kayıt gerektiğinde geri yüklenmiş Desktop profilini `Telegram -workdir "$tmp/desktop"` ile kullanın. Yerel operatör ortamlarında, süreç env değişkenleri yoksa `scripts/e2e/telegram-user-credential.ts` varsayılan olarak `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` dosyasını okur.

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

`start`, `telegram-user` kimlik bilgisini kiralar, aynı hesabı bir Crabbox Linux masaüstünde
TDLib ve Telegram Desktop içine geri yükler, mevcut checkout'tan yerel bir sahte SUT
Gateway başlatır, görünür Telegram sohbetini açar, masaüstü kaydını
başlatır ve özel bir `session.json` yazar. Oturum canlıyken bir ajan
tatmin olana kadar test etmeye devam edebilir:

- `send --session <file> --text <message>`, gerçek TDLib kullanıcısı üzerinden gönderir ve SUT yanıtını bekler.
- `run --session <file> -- <remote command>`, Crabbox üzerinde rastgele bir komut çalıştırır ve çıktısını kaydeder; örneğin `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` mevcut görünür masaüstünü yakalar.
- `status --session <file>` kirayı ve WebVNC komutunu yazdırır.
- `finish --session <file>` kaydediciyi durdurur, ekran görüntüsü/video/hareket-kırpma artifaktlarını yakalar, Convex kimlik bilgisini serbest bırakır, yerel SUT süreçlerini durdurur ve `--keep-box` geçirilmedikçe Crabbox kirasını durdurur.
- `publish --session <file> --pr <number>` varsayılan olarak yalnızca GIF içeren bir PR yorumu yayımlar. Günlükler veya JSON artifaktları kasıtlı olarak gerektiğinde yalnızca `--full-artifacts` geçirin.

Deterministik görsel yeniden üretimler için `start` komutuna veya tek komutluk
`probe` kısayoluna `--mock-response-file <path>` geçirin. Çalıştırıcı varsayılan olarak standart bir
Crabbox sınıfı, 24fps kayıt, 24fps hareket GIF önizlemeleri ve 1920px GIF
genişliği kullanır. Yalnızca kanıt farklı yakalama ayarları gerektirdiğinde
`--class`, `--record-fps`, `--preview-fps` ve `--preview-width` ile geçersiz kılın.

Tek komutluk Crabbox kanıtı:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Varsayılan `probe` komutu, tek bir start/send/finish döngüsünün kısaltmasıdır. Hızlı bir
`/status` duman testi için kullanın. PR incelemesi, hata yeniden üretme çalışması
veya kanıtın tamamlandığına karar vermeden önce ajanın dakikalarca rastgele
deneme yapması gereken herhangi bir durum için oturum komutlarını kullanın. Sıcak bir masaüstü kirasını
yeniden kullanmak için `--id <cbx_...>`, bitirdikten sonra VNC'yi açık tutmak için `--keep-box`,
görünür sohbeti seçmek için `--desktop-chat-title <name>` ve taze bir kutuda TDLib derlemek yerine
önceden pişirilmiş Linux `libtdjson.so` arşivi kullanırken `--tdlib-url <tgz>`
kullanın. Çalıştırıcı `--tdlib-url` değerini `--tdlib-sha256 <hex>` ile veya
varsayılan olarak kardeş bir `<url>.sha256` dosyasıyla doğrular.

Aracı tarafından doğrulanan çok kanallı yükler:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack hatları da havuzdan kira alabilir, ancak Slack yük doğrulaması şu anda
aracı yerine Slack QA çalıştırıcısında yer alır. Slack satırları için
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
kullanın.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcı adları [QA overview → Adding a channel](/tr/concepts/qa-e2e-automation#adding-a-channel) bölümünde yer alır. Asgari gereklilik: taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine seam'i üzerinde uygulayın, Plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve `qa/scenarios/` altında senaryolar yazın.

## Test paketleri (nerede ne çalışır)

Paketleri "artan gerçekçilik" (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard setini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altında core/birim envanterleri; UI birim testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araçlama, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, geniş `api.js` ve
    `runtime-api.js` yedek davranışını gerçek paketlenmiş Plugin kaynak API'leriyle değil,
    oluşturulmuş küçük Plugin fikstürleriyle kanıtlamalıdır. Gerçek Plugin API yükleri
    Plugin sahipli sözleşme/entegrasyon paketlerine aittir.

Yerel bağımlılık ilkesi:

- Varsayılan test kurulumları, isteğe bağlı yerel Discord opus derlemelerini atlar. Discord ses alma, saf JS `opusscript` kod çözücüsünü kullanır ve `@discordjs/opus`, yerel testlerin ve Testbox hatlarının yerel eklentiyi derlememesi için `allowBuilds` içinde devre dışı kalır.
- Bilerek yerel bir opus derlemesini karşılaştırmanız gerekiyorsa ayrılmış bir Discord ses performansı veya canlı hattı kullanın. Varsayılan `allowBuilds` içinde `@discordjs/opus` değerini `true` yapmayın; bu, ilgisiz kurulum/test döngülerinin yerel kod derlemesine neden olur.

<AccordionGroup>
  <Accordion title="Projeler, parçalar ve kapsamlı hatlar">

    - Hedeflenmemiş `pnpm test`, tek bir devasa yerel kök proje süreci yerine on iki daha küçük parça yapılandırmasını (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde en yüksek RSS değerini düşürür ve auto-reply/uzantı işlerinin ilgisiz test kümelerini aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlangıç maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel kontrol kapısıdır. Diff'i core, core testleri, uzantılar, uzantı testleri, uygulamalar, dokümanlar, yayın üst verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca yayın üst verisi olan sürüm artışları, en üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir korumayla hedefli sürüm/yapılandırma/kök bağımlılık kontrollerini çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth betikleri için shell sözdizimi ve canlı Docker zamanlayıcı kuru çalıştırması. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, dışa aktarma, sürüm ve diğer paket yüzeyi düzenlemeleri hâlâ daha geniş korumaları kullanır.
    - Agents, komutlar, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan içe aktarma açısından hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durumlu/çalışma zamanı açısından ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır test kümesini yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış kovalara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing parçalarına böler; böylece içe aktarma açısından ağır tek bir kova tüm Node kuyruğunu üstlenmez.
    - Normal PR/main CI, uzantı toplu taramasını ve yalnızca yayına özel `agentic-plugins` parçasını kasıtlı olarak atlar. Tam Yayın Doğrulaması, yayın adaylarında bu Plugin/uzantı ağırlıklı test kümeleri için ayrı `Plugin Prerelease` alt iş akışını tetikler.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - İleti aracı keşif girdilerini veya compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyonları ekleyin.
    - Gömülü çalıştırıcı entegrasyon test kümelerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu test kümeleri, kapsamlı kimliklerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca
      yardımcı testleri bu entegrasyon yollarının yeterli yerine geçmez.

  </Accordion>

  <Accordion title="Vitest havuzu ve izolasyon varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar genelinde izole olmayan
      çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve optimizer'ını korur, ancak o da
      paylaşılan izole olmayan çalıştırıcıda çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı
      `threads` + `isolate: false` varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme
      dalgalanmasını azaltmak için Vitest alt Node süreçlerine varsayılan
      olarak `--no-maglev` ekler. Standart V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları
      yeniden stage eder ve lint, typecheck ya da test çalıştırmaz.
    - Devirden veya push'tan önce akıllı yerel kontrol kapısına ihtiyacınız
      olduğunda açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer.
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca agent
      bir harness, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten
      daha geniş Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max`, yalnızca daha yüksek bir
      worker sınırıyla aynı yönlendirme davranışını korur.
    - Yerel worker otomatik ölçeklendirmesi kasıtlı olarak muhafazakârdır ve
      host yük ortalaması zaten yüksek olduğunda geri çekilir; böylece birden
      fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test bağlantıları değiştiğinde changed-mode
      yeniden çalıştırmaların doğru kalması için projeleri/yapılandırma
      dosyalarını `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE`
      özelliğini etkin tutar; doğrudan profilleme için tek bir açık önbellek
      konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest içe aktarma süresi raporlamasını ve
      içe aktarma dökümü çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü
      `origin/main` sonrasında değişen dosyalarla kapsamlandırır.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json`
      dosyasına yazılır. Tüm yapılandırma çalıştırmaları anahtar olarak
      yapılandırma yolunu kullanır; include-pattern CI parçaları, filtrelenmiş
      parçaların ayrı izlenebilmesi için parça adını ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç içe aktarmalarında
      harcıyorsa, ağır bağımlılıkları dar bir yerel `*.runtime.ts` seam'inin
      arkasında tutun ve çalışma zamanı yardımcılarını yalnızca `vi.mock(...)`
      içinden geçirmek için derin içe aktarmak yerine bu seam'i doğrudan
      mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` çalışmasını o commit'lenmiş diff için yerel kök proje
      yoluyla karşılaştırır ve duvar süresini artı macOS maksimum RSS değerini
      yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden
      yönlendirerek mevcut kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform
      yükü için bir ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim test kümesi için çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak tanılamalar etkinleştirilmiş gerçek bir local loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik gateway ileti, bellek ve büyük yük dalgalanmasını sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin basınç bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway test kümesinin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (pipeline içinde etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Host üzerinde Docker aracılığıyla izole bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e test kümesini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketle gelen Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı formatı değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalayın
- Beklentiler:
  - Tasarım gereği CI açısından kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - "Her şey" yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` değerini izole eder ve yapılandırma/kimlik doğrulama materyalini geçici bir test giriş dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek giriş dizininizi kullanmasını bilinçli olarak istediğinizde ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını tutar, ancak ek `~/.profile` bildirimini bastırır ve Gateway önyükleme günlüklerini/Bonjour konuşmalarını sessize alır. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özel): virgül/noktalı virgül formatıyla `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ayarlayın ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlıya özel geçersiz kılma kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık stderr'e ilerleme satırları yayar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalama sessiz olsa bile görünür biçimde etkin kalır.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/Gateway ilerleme satırlarının hemen akması için Vitest konsol müdahalesini devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/prob Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok fazla şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağına / WS protokolüne / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "botum kapalı" / sağlayıcıya özel hatalar / araç çağırma hata ayıklaması: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness'ı) ile canlı çalıştırmalar için kimlik bilgisi yönetimi için
bkz. [Canlı paketleri test etme](/tr/help/testing-live). Özel güncelleme ve
Plugin doğrulama kontrol listesi için bkz.
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yerel yapılandırma dizininizi ve çalışma alanınızı bağlayarak (ve bağlanmışsa `~/.profile` kaynağını kullanarak) repo Docker görüntüsünün içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` değerleridir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırına geçer; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Özellikle daha büyük kapsamlı taramayı
  istediğinizde bu env vars değerlerini geçersiz kılın.
- `test:docker:all`, canlı Docker görüntüsünü `test:docker:live-build` üzerinden bir kez derler, `scripts/package-openclaw-for-docker.mjs` aracılığıyla OpenClaw'ı npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` görüntüsü derler/yeniden kullanır. Yalın görüntü, install/update/plugin-dependency şeritleri için yalnızca Node/Git çalıştırıcısıdır; bu şeritler önceden derlenmiş tarball'ı bağlar. İşlevsel görüntü, derlenmiş uygulama işlevselliği şeritleri için aynı tarball'ı `/app` içine yükler. Docker şerit tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yaşar; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yaşar; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam, ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çok servisli şeritlerin hepsinin aynı anda başlamasını engeller. Tek bir şerit etkin sınırların üzerindeyse zamanlayıcı, havuz boşken yine de onu başlatabilir ve ardından kapasite yeniden kullanılabilir olana kadar onu tek başına çalıştırmaya devam eder. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker konağında daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak Docker ön kontrolü yapar, eski OpenClaw E2E konteynerlerini kaldırır, her 30 saniyede bir durum yazdırır, başarılı şerit sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun şeritleri önce başlatmak için bu süreleri kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı şerit bildirimini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen şeritler, paket/görüntü gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözer, bunu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E şeritlerini tam olarak bu tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme sağ kalan matrisi, sürüm varsayılanları ve hata triyajı için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).
- Derleme ve yayın kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik derlenmiş grafiği gezer ve komut dağıtımından önceki başlangıcın, komut dağıtımından önce Commander, prompt UI, undici veya günlükleme gibi paket bağımlılıklarını içe aktarması durumunda başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarmalarını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımını, onboard yardımını, doctor yardımını, durumu, yapılandırma şemasını ve bir model listesi komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesim tarihine kadar harness yalnızca gönderilmiş paket meta verisi boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türevi git fixture'ında eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi migrasyonu. `2026.4.25` sonrasındaki paketlerde bu yollar katı hatalardır.
- Konteyner smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek konteyneri başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI kimlik doğrulama giriş dizinlerini (veya çalıştırma daraltılmamışsa desteklenenlerin tamamını) bind-mount eder, ardından çalıştırmadan önce bunları konteyner giriş dizinine kopyalar; böylece harici CLI OAuth, konak kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini’yi kapsar; `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sıkı Droid/OpenCode kapsamı sağlar)
- CLI backend smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball QA Lab’i dışarıda bıraktığı için kasıtlı olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/agent smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball’unu Docker’da global olarak kurar, OpenAI’yi env-ref onboarding üzerinden ve varsayılan olarak Telegram’ı yapılandırır, doctor çalıştırır ve bir mock’lanmış OpenAI agent turu çalıştırır. Önceden oluşturulmuş bir tarball’u `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.
- Skill kurulum smoke testi: `pnpm test:docker:skill-install`, paketlenmiş OpenClaw tarball’unu Docker’da global olarak kurar, yapılandırmada yüklenen arşiv kurulumlarını devre dışı bırakır, aramadan mevcut canlı ClawHub skill slug’ını çözer, bunu `openclaw skills install` ile kurar ve kurulu skill ile `.clawhub` kaynak/kilit metadata’sını doğrular.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball’unu Docker’da global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın doğruluğunu denetler, ardından paket `stable` kanalına geri döner ve güncelleme durumunu kontrol eder.
- Yükseltme survivor smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball’unu agent’lar, kanal yapılandırması, Plugin allowlist’leri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları içeren kirli bir eski-kullanıcı fixture’ının üzerine kurar. Canlı provider veya kanal anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunmasını, başlangıç/durum bütçelerini kontrol eder.
- Yayımlanmış yükseltme survivor smoke testi: `pnpm test:docker:published-upgrade-survivor` varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut-kullanıcı dosyalarını seed eder, bu baseline’ı gömülü bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, yayımlanmış kurulumu aday tarball’a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’leri, durum korunmasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Bir baseline’ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile override edin, toplu zamanlayıcıdan `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi tam yerel baseline’ları `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve issue biçimli fixture’ları `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; reported-issues kümesi otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta baseline token’larını çözer ve Full Release Validation, release-soak paket kapısını `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olarak genişletir.
- Oturum runtime bağlamı smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketle gelen görüntü provider’larını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball’u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `dist/` dizinini derlenmiş bir Docker imajından `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Installer Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container’ları arasında tek bir npm cache paylaşır. Update smoke testi, aday tarball’a yükseltmeden önce kararlı baseline olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub’da Install Smoke workflow’unun `update_baseline_version` girdisiyle override edin. Root olmayan installer kontrolleri, root’a ait cache girdilerinin kullanıcı-yerel kurulum davranışını maskelememesi için izole bir npm cache tutar. Yerel tekrar çalıştırmalarda root/update/direct-npm cache’ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği bu env olmadan yerelde çalıştırın.
- Agents paylaşılan çalışma alanı silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak root Dockerfile imajını derler, izole bir container home içinde tek çalışma alanına sahip iki agent seed eder, `agents delete --json` çalıştırır ve geçerli JSON ile çalışma alanı koruma davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium’u raw CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının bağlantı URL’lerini, cursor ile öne çıkarılmış tıklanabilirleri, iframe ref’lerini ve frame metadata’sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway üzerinden mock’lanmış bir OpenAI sunucusu çalıştırır, `web_search`’ün `reasoning.effort` değerini `minimal`’dan `low`’a yükselttiğini doğrular, ardından provider şema reddini zorlar ve raw ayrıntının Gateway loglarında göründüğünü kontrol eder.
- MCP kanal köprüsü (seed edilmiş Gateway + stdio köprüsü + raw Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin’ler (yerel path, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref’leri, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile override edin. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball’unu çıplak bir container’a kurar, bir npm Plugin’i kurar, etkinleştir/devre dışı bırak geçişi yapar, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından her lifecycle aşaması için RSS/CPU metriklerini loglarken kaldırmanın eski durumu hâlâ temizlediğini doğrular.
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin’ler: `pnpm test:docker:plugins`, yerel path, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref’leri, ClawHub fixture’ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin’ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlenen npm Plugin kurulumunu, etkinleştirmeyi, devre dışı bırakmayı, yükseltmeyi, düşürmeyi ve eksik-kod kaldırmasını kapsar.

Paylaşılan işlevsel imajı elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite’e özgü imaj override’ları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı işaret ettiğinde, betikler imaj zaten yerel değilse onu çeker. QR ve installer Docker testleri kendi Dockerfile’larını korur, çünkü paylaşılan derlenmiş-uygulama runtime’ı yerine paket/kurulum davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur şekilde bind-mount eder ve
container içindeki geçici bir workdir'e hazırlar. Bu, Vitest'i tam olarak yerel kaynak/config'inize
karşı çalıştırırken runtime image'ını ince tutar.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özel artifact'leri kopyalamak için
dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve app'e yerel `.build` ya da
Gradle output directory'leri gibi büyük, yalnızca yerel cache'leri ve app build output'larını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarını yaparlar; böylece Gateway canlı probe'ları container içinde
gerçek Telegram/Discord/vb. channel worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle o Docker lane'inde Gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint'leri etkinleştirilmiş
bir OpenClaw Gateway container'ı başlatır,
bu Gateway'e karşı pinlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` öğesinin `openclaw/default` sunduğunu doğrular, ardından Open WebUI'nin `/api/chat/completions`
proxy'si üzerinden gerçek bir chat isteği gönderir.
Canlı model completion'ını beklemeden Open WebUI oturum açma ve model keşfinden sonra durması gereken
release-path CI kontrolleri için `OPENWEBUI_SMOKE_MODE=models` ayarını yapın.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker'ın Open WebUI image'ını çekmesi ve
Open WebUI'nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu lane kullanılabilir bir canlı model key'i bekler ve Dockerized çalıştırmalarda bunu sağlamanın birincil yolu
`OPENCLAW_PROFILE_FILE` (`~/.profile` varsayılan) değeridir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload'u yazdırır.
`test:docker:mcp-channels` özellikle deterministiktir ve gerçek bir Telegram, Discord veya iMessage hesabı gerektirmez.
Seed edilmiş bir Gateway container'ı boot eder, `openclaw mcp serve` spawn eden ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata'sını,
canlı event queue davranışını, outbound send routing'i ve gerçek stdio MCP bridge üzerinden Claude tarzı channel +
permission bildirimlerini doğrular. Bildirim kontrolü ham stdio MCP frame'lerini doğrudan inceler; böylece smoke testi
yalnızca belirli bir client SDK'nin yüzeye çıkardığını değil, bridge'in gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model key'i gerektirmez.
Repo Docker image'ını build eder, container içinde gerçek bir stdio MCP probe server'ı başlatır,
bu server'ı gömülü Pi bundle MCP runtime üzerinden materyalize eder, tool'u yürütür, ardından
`coding` ve `messaging`'in `bundle-mcp` tool'larını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model key'i gerektirmez.
Gerçek bir stdio MCP probe server'ı olan seed edilmiş bir Gateway başlatır, izole bir Cron turn'ü ve
`/subagents spawn` tek seferlik child turn'ü çalıştırır, ardından MCP child process'inin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP sade dil thread smoke'u (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regression/debug workflow'ları için tutun. ACP thread routing doğrulaması için tekrar gerekebilir; bu nedenle silmeyin.

Yararlı env var'lar:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testleri çalıştırmadan önce source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, yalnızca `OPENCLAW_PROFILE_FILE` üzerinden source edilen env var'ları doğrulamak için; geçici config/workspace dir'leri kullanır ve harici CLI auth mount'ları kullanmaz
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache'lenmiş CLI install'ları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dir/file'ları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dir'ler: `.minimax`
  - Varsayılan file'lar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dir/file'ları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgül listesiyle manuel override edin
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, container içinde provider'ları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, rebuild gerektirmeyen yeniden çalıştırmalar için mevcut bir `openclaw:local-live` image'ını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, cred'lerin env'den değil profile store'dan geldiğinden emin olmak için
- `OPENCLAW_OPENWEBUI_MODEL=...`, Open WebUI smoke'u için Gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...`, Open WebUI smoke'u tarafından kullanılan nonce-check prompt'unu override etmek için
- `OPENWEBUI_IMAGE=...`, pinlenmiş Open WebUI image tag'ini override etmek için

## Docs doğrulaması

Doc edit'lerinden sonra docs check'lerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading kontrollerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regression (CI-safe)

Bunlar gerçek provider'lar olmadan "gerçek pipeline" regression'larıdır:

- Gateway tool calling (mock OpenAI, gerçek Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval'ları (skills)

Zaten "agent güvenilirlik eval'ları" gibi davranan birkaç CI-safe testimiz var:

- Gerçek Gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan end-to-end wizard flow'ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** skills prompt'ta listelendiğinde agent doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow contract'ları:** tool order, session history carryover ve sandbox boundary'lerini assert eden çok turlu scenario'lar.

Gelecekteki eval'lar önce deterministik kalmalıdır:

- Tool call'larını + sırasını, skill file okumalarını ve session wiring'i assert etmek için mock provider'lar kullanan bir scenario runner.
- Skill odaklı küçük bir scenario suite'i (kullanma vs kaçınma, gating, prompt injection).
- Opsiyonel canlı eval'lar (opt-in, env-gated) yalnızca CI-safe suite hazır olduktan sonra.

## Contract testleri (plugin ve channel shape)

Contract testleri, kayıtlı her plugin ve channel'ın kendi interface contract'ına uyduğunu doğrular.
Keşfedilen tüm plugin'ler üzerinde iterasyon yapar ve shape ile davranış assertion'larından oluşan bir suite çalıştırır.
Varsayılan `pnpm test` unit lane'i bu paylaşılan seam ve smoke file'larını bilerek atlar; paylaşılan channel veya provider surface'lerine dokunduğunuzda
contract command'larını açıkça çalıştırın.

### Komutlar

- Tüm contract'lar: `pnpm test:contracts`
- Yalnızca channel contract'ları: `pnpm test:contracts:channels`
- Yalnızca provider contract'ları: `pnpm test:contracts:plugins`

### Channel contract'ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin shape'i (id, name, capabilities)
- **setup** - Setup wizard contract'ı
- **session-binding** - Session binding davranışı
- **outbound-payload** - Message payload yapısı
- **inbound** - Inbound message işleme
- **actions** - Channel action handler'ları
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contract'ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel status probe'ları
- **registry** - Plugin registry shape'i

### Provider contract'ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth flow contract'ı
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Ne zaman çalıştırılır

- plugin-sdk export'larını veya subpath'lerini değiştirdikten sonra
- Bir channel veya provider plugin ekledikten ya da değiştirdikten sonra
- Plugin registration veya discovery refactor'ından sonra

Contract testleri CI'da çalışır ve gerçek API key'leri gerektirmez.

## Regression ekleme (rehberlik)

Canlıda keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regression ekleyin (mock/stub provider veya tam request-shape transformation'ını capture edin)
- Doğası gereği yalnızca canlıysa (rate limit'ler, auth policy'leri), live test'i dar ve env var'larla opt-in tutun
- Bug'ı yakalayan en küçük layer'ı hedeflemeyi tercih edin:
  - provider request conversion/replay bug'ı → doğrudan models testi
  - gateway session/history/tool pipeline bug'ı → Gateway live smoke veya CI-safe Gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) her SecretRef class'ı için bir sampled target türetir, ardından traversal-segment exec id'lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef target family eklerseniz, bu testteki `classifyTargetClass` değerini güncelleyin. Test, yeni class'ların sessizce atlanamaması için sınıflandırılmamış target id'lerinde bilerek başarısız olur.

## İlgili

- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
