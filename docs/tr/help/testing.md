---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test takımları, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-04-30T18:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir
Docker çalıştırıcıları kümesi vardır. Bu belge bir "nasıl test ediyoruz" rehberidir:

- Her paketin neleri kapsadığı (ve bilinçli olarak neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım şeritleri)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için referans.
- [QA kanalı](/tr/channels/qa-channel) — depo destekli senaryolar tarafından kullanılan sentetik aktarım Plugin'i.

Bu sayfa normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özgü çalıştırıcılar bölümü ([QA'ya özgü çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık uzantı/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA şeridi: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Bir canlı dosyayı sessizce hedefle: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya-okuma tarzı yoklama çalıştırır.
    Metadata'sı `image` girişini duyuran modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ayrı Docker canlı model
    matris işlerini sağlayıcıya göre parçalanmış halde içeren yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı gizlerini `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde Docker canlı şeridi çalıştırır, sentetik bir
    Slack DM'yi `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını uygular, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server koşum smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan turlarını Plugin'e ait Codex app-server koşumu üzerinden çalıştırır,
    `/codex status` ve `/codex models` öğelerini doğrular ve varsayılan olarak görüntü,
    cron MCP, alt ajan ve Guardian yoklamalarını uygular. Diğer Codex
    app-server hatalarını izole ederken alt ajan yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan denetimi için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt ajan yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj-kanalı kurtarma komutu yüzeyi için isteğe bağlı, ekstra güvence denetimi.
    `/crestodian status` komutunu uygular, kalıcı bir model değişikliğini sıraya alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI bulunan yapılandırmasız bir konteynerde çalıştırır
    ve bulanık planlayıcı geri dönüşünün denetlenmiş tipli bir
    yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, yalın `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/ajan/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve asistan transkriptinin normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca bir başarısız vakaya ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan izin listesi env var'larıyla daraltmayı tercih edin.
</Tip>

## QA'ya özgü çalıştırıcılar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab'i özel iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'larda ve
sahte sağlayıcılarla manuel tetiklemeden çalışır. `QA-Lab - All Lanes`, `main` üzerinde
gece çalışır ve sahte eşlik geçidi, canlı Matrix şeridi,
Convex tarafından yönetilen canlı Telegram şeridi ve Convex tarafından yönetilen canlı Discord şeridi ile
manuel tetiklemeden paralel işler olarak çalışır. Zamanlanmış QA ve sürüm denetimleri Matrix `--profile fast`
seçeneğini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi varsayılanı
`all` olarak kalır; manuel tetikleme `all` öğesini `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` ve `e2ee-cli` işlerine parçalayabilir. `OpenClaw Release Checks`, sürüm onayından önce
eşliği ve hızlı Matrix ile Telegram şeritlerini çalıştırır; sürüm aktarım denetimleri için
`mock-openai/gpt-5.5` kullanır, böylece bunlar deterministik kalır
ve normal sağlayıcı-Plugin başlatmasını atlar. Bu canlı aktarım Gateway'leri
bellek aramasını devre dışı bırakır; bellek davranışı QA eşlik paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu imajda zaten
`ffmpeg` ve `ffprobe` bulunur. Docker canlı model/arka uç parçaları, seçilen
commit başına bir kez oluşturulan ortak
`ghcr.io/openclaw/openclaw-live-test:<sha>` imajını kullanır, ardından her parça içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçilen birden çok senaryoyu varsayılan olarak izole
    Gateway çalışanlarıyla paralel çalıştırır. `qa-channel`, concurrency 4 değerini varsayar (seçilen
    senaryo sayısıyla sınırlıdır). Çalışan sayısını ayarlamak için
    `--concurrency <count>` kullanın veya eski seri şerit için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olursa sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalıklı
    `mock-openai` şeridinin yerine geçmeden deneysel fixture ve protokol-sahte kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma bench'i ile küçük bir sahte QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem
    özetini `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa başlatma patlamaları,
    dakikalar süren Gateway kilitlenme regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Oluşturulmuş `dist` artifact'larını kullanır; checkout'ta zaten taze runtime çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini atılabilir bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo-seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıkış dizinleri depo kökünün altında kalmalıdır ki konuk, bağlanmış çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporu + özeti ve Multipass günlüklerini
    `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global olarak yükler,
    etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır, varsayılan olarak Telegram'ı yapılandırır,
    Plugin'i etkinleştirmenin runtime bağımlılıklarını gerektiğinde yüklediğini doğrular,
    doctor çalıştırır ve sahte bir OpenAI endpoint'ine karşı bir yerel ajan turu çalıştırır.
  - Aynı paketlenmiş-kurulum şeridini Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime context transkriptleri için deterministik oluşturulmuş-uygulama Docker smoke testi çalıştırır.
    Gizli OpenClaw runtime context'inin görünür kullanıcı turuna sızmak yerine
    görüntülenmeyen özel mesaj olarak kalıcılaştırıldığını doğrular,
    ardından etkilenmiş bozuk bir oturum JSONL dosyası tohumlar ve
    `openclaw doctor --fix` komutunun bunu yedekle birlikte aktif dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını yükler, yüklü-paket
    onboarding'i çalıştırır, Telegram'ı yüklü CLI üzerinden yapılandırır, ardından
    canlı Telegram QA şeridini SUT Gateway olarak bu yüklü paketle yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir; registry'den yüklemek yerine
    çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır.
    CI/sürüm otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol gizini ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol gizi mevcutsa,
    Docker sarmalayıcısı Convex'i otomatik olarak seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu şerit için ortak
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu şeridi manuel bakımcı iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. İş akışı
    `qa-live-shared` environment'ını ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec,
  HTTPS tarball URL'si artı SHA-256 veya başka bir çalıştırmadan tarball artifact'ı kabul eder,
  normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E scheduler'ını smoke, package, product, full veya custom
  şerit profilleriyle çalıştırır. Telegram QA iş akışını aynı `package-under-test` artifact'ına karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artifact kanıtı, başka bir Actions çalıştırmasından bir tarball artifact indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış olarak Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketli kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış Plugin çalışma zamanı bağımlılıklarını mevcut bırakmadığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketli Plugin'in çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu ve ikinci yeniden başlatmanın zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor onarımının paketli kanal çalışma zamanı bağımlılıklarını harness tarafında postinstall onarımı olmadan düzelttiğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels konukları genelinde yerel paketli kurulum güncelleme smoke testini çalıştırır. Seçilen her platform önce istenen temel paketi kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, gateway hazır olma durumunu ve bir yerel ajan turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifact yolu ve her lane durumu için `--json` kullanın.
  - OpenAI lane'i varsayılan olarak canlı ajan turu kanıtı için `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini bilinçli olarak doğrularken `--model <provider/model>` geçirin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels aktarım takılmalarının test penceresinin geri kalanını tüketmemesi için uzun yerel çalıştırmaları bir ana makine zaman aşımıyla sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe lane günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor/çalışma zamanı bağımlılığı onarımında 10 ila 15 dakika harcayabilir; iç içe npm hata ayıklama günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke lane'leriyle paralel çalıştırmayın. Bunlar VM durumunu paylaşır ve snapshot geri yükleme, paket sunma veya konuk gateway durumu üzerinde çakışabilir.
  - Güncelleme sonrası kanıt normal paketli Plugin yüzeyini çalıştırır çünkü konuşma, görüntü oluşturma ve medya anlama gibi capability facade'ları, ajan turunun kendisi yalnızca basit bir metin yanıtını kontrol etse bile paketli çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA lane'ini, tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u — paketli kurulumlar `qa-lab` içermez.
  - Tam CLI, profil/senaryo kataloğu, env var'ları ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA lane'ini, env'den gelen sürücü ve SUT bot token'ları kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram sohbet id'si olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve gözlemlenen mesajlar artifact'i yazar. Yanıtlama senaryoları, sürücü gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı aktarım lane'leri tek bir standart sözleşmeyi paylaşır, böylece yeni aktarımlar sapmaz; lane başına kapsama matrisi [QA genel bakış → Canlı aktarım kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik süittir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, lane çalışırken bu kiralama için Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env var'ları:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env var'ları:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme id'si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker secret'larını, endpoint önekini, HTTP zaman aşımını ve admin/liste erişilebilirliğini secret değerlerini yazdırmadan kontrol etmek için `doctor` kullanın. Betikler ve CI yardımcı araçlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan endpoint sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (yalnızca maintainer secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal Telegram sohbet id'si dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

### QA'ya kanal ekleme

Yeni kanal adaptörleri için mimari ve senaryo yardımcı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari gereksinim: aktarım çalıştırıcısını paylaşılan `qa-lab` ana makine seam'i üzerinde uygulamak, Plugin manifest'inde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve `qa/scenarios/` altında senaryolar yazmaktır.

## Test süitleri (nerede ne çalışır)

Süitleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki core/birim envanterleri; UI birim testleri ayrılmış `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway kimlik doğrulama, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Resolver ve public-surface loader testleri, gerçek paketli Plugin kaynak API'leriyle değil, oluşturulmuş küçük Plugin fixture'larıyla geniş `api.js` ve `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri Plugin'e ait contract/entegrasyon süitlerine aittir.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök proje işlemi yerine on iki daha küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/uzantı işinin ilgisiz paketleri kaynak açısından aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamlı çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel kontrol kapısıdır. Diff'i core, core testleri, uzantılar, uzantı testleri, uygulamalar, dokümanlar, yayın meta verisi, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca yayın meta verisi içeren sürüm artırımları, üst düzey version alanı dışındaki paket değişikliklerini reddeden bir guard ile hedefli sürüm/yapılandırma/kök bağımlılık kontrolleri çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth betikleri için kabuk sözdizimi ve canlı Docker zamanlayıcı dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, export, version ve diğer paket yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan içe aktarma yükü hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durum tutan/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da değişiklik modundaki çalıştırmaları bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış gruplara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing parçalarına böler; böylece içe aktarma yükü ağır tek bir grup tüm Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, uzantı toplu taramasını ve yalnızca yayın için olan `agentic-plugins` parçasını bilerek atlar. Tam Yayın Doğrulama, yayın adaylarında bu Plugin/uzantı ağırlıklı paketler için ayrı Plugin Ön Yayın alt iş akışını başlatır.

  </Accordion>

  <Accordion title="Yerleşik çalıştırıcı kapsamı">

    - İleti aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyon testleri ekleyin.
    - Yerleşik çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular;
      yalnızca yardımcı testleri, bu entegrasyon yollarının yeterli bir
      alternatifi değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve yalıtım varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar genelinde yalıtılmamış
      çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve iyileştiricisini korur, ancak o da
      paylaşılan yalıtılmamış çalıştırıcıda çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı
      `threads` + `isolate: false` varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme
      yükünü azaltmak için Vitest alt Node işlemlerine varsayılan olarak
      `--no-maglev` ekler. Standart V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit kancası yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları
      yeniden hazırlama alanına alır ve lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel kontrol kapısına ihtiyacınız olduğunda devretmeden veya uzak
      depoya göndermeden önce `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed` varsayılan olarak ucuz kapsamlı hatlardan yönlendirilir. Ajan
      bir harness, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde yalnızca
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek bir işçi sınırıyla.
    - Yerel işçi otomatik ölçeklendirmesi bilerek tutucudur ve ana makine yük
      ortalaması zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test bağlantıları değiştiğinde değişiklik
      modundaki yeniden çalıştırmalar doğru kalsın diye projeleri/yapılandırma
      dosyalarını `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE`
      etkin tutar; doğrudan profil oluşturma için tek bir açık önbellek konumu
      istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest içe aktarma süresi raporlamasını ve
      içe aktarma dökümü çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil oluşturma görünümünü
      `origin/main` sonrasında değişen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tam yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; dahil etme deseni CI
      parçaları, filtrelenmiş parçalar ayrı izlenebilsin diye parça adını sona ekler.
    - Yoğun bir test hâlâ zamanının çoğunu başlatma içe aktarmalarında harcadığında,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` aralığının arkasında tutun ve
      onları yalnızca `vi.mock(...)` üzerinden geçirmek için çalışma zamanı yardımcılarını
      derinden içe aktarmak yerine bu aralığı doğrudan mock edin.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile o işlenmiş diff için yerel kök proje yolunu karşılaştırır
      ve duvar saati süresini artı macOS maks. RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek
      geçerli kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve dönüştürme ek yükü için
      ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim paketi için çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, bir işçiye zorlanmış
- Kapsam:
  - Tanılamalar varsayılan olarak etkin olacak şekilde gerçek bir geri döngü Gateway'i başlatır
  - Sentetik Gateway iletisi, bellek ve büyük yük hareketliliğini tanılama olay yolu üzerinden sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılığı paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra boşaldığını doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (Gateway duman testi)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` değerini `isolate: false` ile kullanır.
  - Uyarlanabilir işçiler kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç ek yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - İşçi sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlandırılır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI'da çalışır (pipeline içinde etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç duman testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker üzerinden ana makinede yalıtılmış bir OpenShell Gateway'i başlatır
  - Geçici bir yerel Dockerfile'dan korumalı alan oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH yürütmesi üzerinden çalıştırır
  - Uzak-kanonik dosya sistemi davranışını korumalı alan fs köprüsü üzerinden doğrular
- Beklentiler:
  - Yalnızca isteğe bağlı; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker artalan süreci gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway'ini ve korumalı alanı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarımı gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para maliyeti vardır / hız sınırlarını kullanır
  - “Her şey” yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak olarak okur.
- Varsayılan olarak canlı çalıştırmalar hâlâ `HOME` öğesini yalıtır ve yapılandırma/auth malzemesini geçici bir test home dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin kasıtlı olarak gerçek home dizininizi kullanmasına ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway başlatma günlüklerini/Bonjour gürültüsünü sessize alır. Tam başlatma günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özel): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlı test başına geçersiz kılma kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'ye yazar; böylece uzun sağlayıcı çağrıları Vitest konsol yakalaması sessizken bile görünür biçimde etkindir.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/Gateway ilerleme satırlarının hemen akması için Vitest konsol müdahalesini devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/sonda Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Düzenleme mantığı/testleri: `pnpm test` komutunu çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağı / WS protokolü / eşleştirme üzerinde değişiklik yapıyorsanız: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü hatalar / araç çağırma hata ayıklaması yapıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
koşumu ve tüm medya sağlayıcı canlı testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) ve canlı çalıştırmalar için kimlik bilgisi işleme hakkında bilgi için bkz.
[Testing — live suites](/tr/help/testing-live).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (bağlanmışsa `~/.profile` dosyasını da kaynak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam bir Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır; ayrıca
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha büyük ve kapsamlı taramayı
  istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez oluşturur, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden bir npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Yalın imaj, install/update/plugin-dependency hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden oluşturulmuş tarball'ı bağlar. İşlevsel imaj, derlenmiş uygulama işlevselliği hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını denetlerken, kaynak sınırları ağır canlı, npm-install ve çok hizmetli hatların hepsinin aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırmaya devam eder. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla kapasite varsa ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paket çözümler, bunu `package-under-test` olarak yükler, ardından yeniden kullanılabilir Docker E2E hatlarını seçilen ref'i yeniden paketlemek yerine tam olarak bu tarball'a karşı çalıştırır. `workflow_ref` güvenilir workflow/koşum betiklerini seçerken, `package_ref` `source=ref` olduğunda paketlenecek kaynak commit/branch/tag değerini seçer; bu, güncel kabul mantığının eski güvenilir commit'leri doğrulamasını sağlar. Profiller kapsam genişliğine göre sıralanır: `smoke` hızlı kurulum/kanal/agent artı Gateway/config içerir, `package` paket/update/Plugin sözleşmesini, anahtarsız upgrade-survivor fixture'ını ve çoğu Parallels package/update kapsamı için varsayılan yerel değişimi içerir, `product` MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI ekler, `full` ise release-path Docker parçalarını OpenWebUI ile çalıştırır. Yayın doğrulaması, release-path Docker parçaları zaten örtüşen package/update/Plugin hatlarını kapsadığı için özel bir paket deltası (`bundled-channel-deps-compat plugins-offline`) artı Telegram paket QA çalıştırır. Artifact'lerden üretilen hedefli GitHub Docker yeniden çalıştırma komutları, varsa önceki paket artifact'ini ve hazırlanmış imaj girdilerini içerir; böylece başarısız hatlar paketi ve imajları yeniden oluşturmaktan kaçınabilir.
- Derleme ve yayın kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, statik derlenmiş grafiği `dist/entry.js` ve `dist/cli/run-main.js` üzerinden yürür ve komut yönlendirmesinden önce başlatma öncesi import'lar Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımını, onboard yardımını, doctor yardımını, durumu, yapılandırma şemasını ve bir model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlandırılmıştır (`2026.4.25-beta.*` dahil). Bu son tarihe kadar koşum yalnızca gönderilmiş paket metadata boşluklarını tolere eder: atlanan özel QA envanteri girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında yapılandırma metadata migration'ı. `2026.4.25` sonrasındaki paketler için bu yollar kesin hatadır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth home'larını (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalıştırmadan önce bunları container home'una kopyalar; böylece harici CLI OAuth token'ları ana makine auth deposunu değiştirmeden yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini’yi kapsar, Droid/OpenCode için sıkı kapsam `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sağlanır)
- CLI arka uç duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama-sunucusu harness duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testi: `pnpm qa:otel:smoke`, özel bir QA kaynak-checkout hattıdır. npm tarball’ı QA Lab’i içermediği için paket Docker yayın hatlarının bilerek bir parçası değildir.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball’ını Docker içinde global olarak kurar, env-ref onboarding üzerinden OpenAI’ı ve varsayılan olarak Telegram’ı yapılandırır, doctor onarımlarının etkinleştirilmiş plugin çalışma zamanı bağımlılıklarını etkinleştirdiğini doğrular ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball’ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme duman testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball’ını Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve plugin güncelleme sonrası çalışmasının doğrulandığını kontrol eder, ardından tekrar paket `stable` kanalına döner ve güncelleme durumunu denetler.
- Yükseltme sağ kalım duman testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball’ını ajanlar, kanal yapılandırması, plugin izin listeleri, eski plugin çalışma zamanı bağımlılıkları durumu ve mevcut çalışma alanı/oturum dosyaları bulunan kirli bir eski-kullanıcı fixture’ının üzerine kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunmasını ve başlangıç/durum bütçelerini denetler.
- Oturum çalışma zamanı bağlamı duman testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor ile onarılmasını doğrular.
- Bun global kurulum duman testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball’ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya oluşturulmuş bir Docker imajından `dist/` dizinini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Yükleyici Docker duman testi: `bash scripts/test-install-sh-docker.sh`, root, güncelleme ve doğrudan-npm container’ları arasında tek bir npm önbelleği paylaşır. Güncelleme duman testi, aday tarball’a yükseltmeden önce kararlı taban çizgisi olarak varsayılan şekilde npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub’daki Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan yükleyici kontrolleri, root tarafından sahiplenilmiş önbellek girdilerinin kullanıcı-yerel kurulum davranışını maskelememesi için yalıtılmış bir npm önbelleği kullanır. Yerel yeniden çalıştırmalarda root/güncelleme/doğrudan-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen doğrudan-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanını siler CLI duman testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile imajını derler, yalıtılmış bir container home içinde tek bir çalışma alanına sahip iki ajanı seed eder, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot duman testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium’u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının bağlantı URL’lerini, cursor ile yükseltilmiş tıklanabilirleri, iframe refs’lerini ve frame metadatasını kapsadığını doğrular.
- OpenAI Responses `web_search` minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) taklit bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` seviyesinden `low` seviyesine yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham detayın Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (seed edilmiş Gateway + stdio köprüsü + ham Claude notification-frame duman testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/reddet duman testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kurulum duman testi, ClawHub kitchen-sink kurulum/kaldırma, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmedi duman testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Yapılandırma yeniden yükleme metadata duman testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps` varsayılan olarak küçük bir Docker runner imajı derler, OpenClaw’ı ana makinede bir kez derleyip paketler ve ardından bu tarball’ı her Linux kurulum senaryosuna mount eder. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra ana makine yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile mevcut bir tarball’a işaret edin. Tam Docker toplamı ve yayın-yolu paketlenmiş-kanal parçaları bu tarball’ı bir kez önceden paketler, ardından paketlenmiş kanal kontrollerini Telegram, Discord, Slack, Feishu, memory-lancedb ve ACPX için ayrı güncelleme hatları dahil bağımsız hatlara böler. Yayın parçaları kanal duman testlerini, güncelleme hedeflerini ve kurulum/çalışma zamanı sözleşmelerini `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` ve `bundled-channels-contracts` olarak böler; toplam `bundled-channels` parçası manuel yeniden çalıştırmalar için kullanılabilir kalır. Yayın iş akışı ayrıca sağlayıcı yükleyici parçalarını ve paketlenmiş plugin kurulum/kaldırma parçalarını böler; eski `package-update`, `plugins-runtime` ve `plugins-integrations` parçaları manuel yeniden çalıştırmalar için toplam alias’lar olarak kalır. Paketlenmiş hattı doğrudan çalıştırırken kanal matrisini daraltmak için `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` veya güncelleme senaryosunu daraltmak için `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` kullanın. Senaryo başına Docker çalıştırmaları varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` kullanır; çok hedefli güncelleme senaryosu varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` kullanır. Hat ayrıca `channels.<id>.enabled=false` ve `plugins.entries.<id>.enabled=false` değerlerinin doctor/çalışma zamanı bağımlılığı onarımını bastırdığını doğrular.
- İlgisiz senaryoları devre dışı bırakarak yineleme sırasında paketlenmiş plugin çalışma zamanı bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan işlevsel imajı manuel olarak önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite’e özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imaja işaret ettiğinde, betikler imaj zaten yerel değilse onu çeker. QR ve yükleyici Docker testleri, paylaşılan derlenmiş-uygulama çalışma zamanı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile’larını korur.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout’u salt okunur olarak bind-mount eder ve
konteynerin içinde geçici bir workdir’e aşamalandırır. Bu, Vitest’i tam olarak
yerel source/config’inize karşı çalıştırmaya devam ederken runtime imajını ince
tutar. Aşamalandırma adımı, Docker canlı çalıştırmalarının makineye özgü
artifact’ları kopyalamak için dakikalar harcamaması için `.pnpm-store`,
`.worktrees`, `__openclaw_vitest__` ve app’e yerel `.build` ya da Gradle çıktı
dizinleri gibi büyük, yalnızca yerel cache’leri ve app build çıktılarını atlar.
Ayrıca Gateway canlı probe’larının konteyner içinde gerçek Telegram/Discord/vb.
kanal worker’larını başlatmaması için `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle o
Docker lane’inde Gateway canlı kapsamını daraltmanız veya hariç tutmanız
gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de aktarın.
`test:docker:openwebui` daha üst düzey bir compatibility smoke’tur: OpenAI uyumlu
HTTP endpoint’leri etkin olan bir OpenClaw Gateway konteyneri başlatır, o
Gateway’e karşı pinlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden
oturum açar, `/api/models` çıktısının `openclaw/default` sunduğunu doğrular,
ardından Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir
chat isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir çünkü Docker’ın Open WebUI
imajını çekmesi ve Open WebUI’nin kendi soğuk başlatma kurulumunu bitirmesi
gerekebilir.
Bu lane kullanılabilir bir canlı model anahtarı bekler ve Dockerize
çalıştırmalarda bunu sağlamanın birincil yolu `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) kullanmaktır.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
konteynerini boot eder, `openclaw mcp serve` başlatan ikinci bir konteyner
başlatır, ardından routed conversation discovery, transcript okumaları, attachment metadata’sı,
canlı event queue davranışı, outbound send routing ve gerçek stdio MCP bridge
üzerinden Claude tarzı kanal + permission notification’larını doğrular. Notification kontrolü,
raw stdio MCP frame’lerini doğrudan inceler; böylece smoke, yalnızca belirli bir
client SDK’nin yüzeye çıkardıklarını değil, bridge’in gerçekten ne yaydığını
doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarına
ihtiyaç duymaz. Repo Docker imajını build eder, konteyner içinde gerçek bir stdio
MCP probe server başlatır, bu server’ı gömülü Pi bundle MCP runtime üzerinden
materialize eder, tool’u çalıştırır, ardından `coding` ve `messaging` değerlerinin
`bundle-mcp` tool’larını koruduğunu; `minimal` ve `tools.deny: ["bundle-mcp"]`
değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarına ihtiyaç
duymaz. Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway başlatır,
izole bir cron turn ve bir `/subagents spawn` tek seferlik child turn çalıştırır,
ardından MCP child process’inin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP sade dil thread smoke’u (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script’i regression/debug workflow’ları için saklayın. ACP thread routing doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı env var’ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testler çalıştırılmadan önce source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, yalnızca `OPENCLAW_PROFILE_FILE` içinden source edilen env var’larını, geçici config/workspace dizinleri kullanarak ve harici CLI auth mount’ları olmadan doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içindeki cache’lenmiş CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak mount edilir, ardından testler başlamadan önce `/home/node/...` altına kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle elle override edin
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, konteyner içinde provider’ları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, rebuild gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, credentials’ın env’den değil profile store’dan geldiğinden emin olmak için
- `OPENCLAW_OPENWEBUI_MODEL=...`, Open WebUI smoke’u için Gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...`, Open WebUI smoke’u tarafından kullanılan nonce-check prompt’unu override etmek için
- `OPENWEBUI_IMAGE=...`, pinlenmiş Open WebUI imaj etiketini override etmek için

## Docs sanity

Doc düzenlemelerinden sonra docs kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regression (CI-safe)

Bunlar gerçek provider’lar olmadan “gerçek pipeline” regression’larıdır:

- Gateway tool calling (mock OpenAI, gerçek Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu kılınır): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval’leri (skills)

Zaten “agent güvenilirlik eval’leri” gibi davranan birkaç CI-safe testimiz var:

- Gerçek Gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan end-to-end wizard flow’ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt’ta skills listelendiğinde agent doğru skill’i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanımdan önce `SKILL.md` dosyasını okuyup gerekli adımları/argümanları izliyor mu?
- **Workflow contract’ları:** tool sırası, session history carryover ve sandbox sınırlarını assert eden multi-turn senaryolar.

Gelecekteki eval’ler önce deterministik kalmalı:

- Tool çağrılarını + sıralamayı, skill dosyası okumalarını ve session wiring’i assert etmek için mock provider’lar kullanan bir scenario runner.
- Skill odaklı küçük bir senaryo paketi (kullanma vs kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval’ler (opt-in, env-gated), yalnızca CI-safe paket hazır olduktan sonra.

## Contract testleri (Plugin ve kanal şekli)

Contract testleri, kayıtlı her Plugin ve kanalın kendi interface contract’ına uyduğunu
doğrular. Keşfedilen tüm Plugin’ler üzerinde iterasyon yapar ve shape ile behavior
assertion’larından oluşan bir suite çalıştırırlar. Varsayılan `pnpm test` unit lane’i
bu paylaşılan seam ve smoke dosyalarını kasıtlı olarak atlar; paylaşılan kanal
veya provider yüzeylerine dokunduğunuzda contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract’lar: `pnpm test:contracts`
- Yalnızca kanal contract’ları: `pnpm test:contracts:channels`
- Yalnızca provider contract’ları: `pnpm test:contracts:plugins`

### Kanal contract’ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde yer alır:

- **plugin** - Temel Plugin şekli (id, name, capabilities)
- **setup** - Setup wizard contract’ı
- **session-binding** - Session binding davranışı
- **outbound-payload** - Message payload yapısı
- **inbound** - Inbound message handling
- **actions** - Kanal action handler’ları
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde yer alır.

- **status** - Kanal status probe’ları
- **registry** - Plugin registry şekli

### Provider contract’ları

`src/plugins/contracts/*.contract.test.ts` içinde yer alır:

- **auth** - Auth flow contract’ı
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Ne zaman çalıştırılmalı

- plugin-sdk export’ları veya subpath’leri değiştirildikten sonra
- Bir kanal veya provider Plugin’i eklendikten ya da değiştirildikten sonra
- Plugin registration veya discovery refactor edildikten sonra

Contract testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regression ekleme (rehberlik)

Canlıda keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regression ekleyin (mock/stub provider veya tam request-shape transformation’ını yakalayın)
- Sorun doğası gereği yalnızca canlıysa (rate limit’ler, auth policy’leri), canlı testi dar ve env var’ları üzerinden opt-in tutun
- Bug’ı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - provider request conversion/replay bug’ı → doğrudan models testi
  - gateway session/history/tool pipeline bug’ı → Gateway live smoke veya CI-safe Gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata’sından (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id’lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış hedef id’lerinde kasıtlı olarak fail eder; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test etme](/tr/help/testing-live)
- [CI](/tr/ci)
