---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test araç seti: birim/e2e/canlı test takımları, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-01T09:01:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi vardır. Bu belge bir "nasıl test ediyoruz" rehberidir:

- Her paketin neleri kapsadığı (ve bilinçli olarak neleri kapsamadığı).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve model/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) — repo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin'i.

Bu sayfa, normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özgü çalıştırıcılar bölümü ([QA'ya özgü çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık uzantı/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güvence istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller için hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır.
    Meta verileri `image` girdisi duyuran modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını yalıtırken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve elle çalıştırılan
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre parçalanmış ayrı Docker canlı model
    matrix işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet duman testi: `pnpm test:docker:live-codex-bind`
  - Codex uygulama sunucusu yolu üzerinde bir Docker canlı hattı çalıştırır, sentetik bir
    Slack DM'ini `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex uygulama sunucusu harness duman testi: `pnpm test:docker:live-codex-harness`
  - Gateway agent turlarını Plugin'e ait Codex uygulama sunucusu harness'i üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    Cron MCP, alt agent ve Guardian yoklamalarını çalıştırır. Diğer Codex
    uygulama sunucusu hatalarını yalıtırken alt agent yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt agent kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, alt agent yoklamasından sonra çıkar.
- Crestodian kurtarma komutu duman testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı ekstra güvence kontrolü.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker duman testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir konteynerde çalıştırır
    ve bulanık planlayıcı geri dönüşünün denetlenmiş, türlendirilmiş bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker duman testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, yalın `openclaw` komutunu
    Crestodian'a yönlendirir, kurulum/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet duman testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` komutunu çalıştırın, ardından yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  komutunu `moonshot/kimi-k2.6` üzerinde çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve
  assistant transkriptinin normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız vakaya ihtiyacınız olduğunda, aşağıda açıklanan izin listesi ortam değişkenleriyle canlı testleri daraltmayı tercih edin.
</Tip>

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında bulunur:

CI, QA Lab'i ayrılmış iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'larda ve
mock sağlayıcılarla elle tetiklemeden çalışır. `QA-Lab - All Lanes`, her gece
`main` üzerinde ve mock parity geçidi, canlı Matrix hattı,
Convex yönetimli canlı Telegram hattı ve Convex yönetimli canlı Discord hattı ile elle tetiklemeden
paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix `--profile fast`
seçeneğini açıkça geçirirken, Matrix CLI ve elle iş akışı girdisinin varsayılanı
`all` kalır; elle tetikleme `all` değerini `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` ve `e2ee-cli` işlerine parçalayabilir. `OpenClaw Release Checks`, sürüm onayından önce parity ile
hızlı Matrix ve Telegram hatlarını çalıştırır; sürüm taşıma kontrolleri için
`mock-openai/gpt-5.5` kullanır, böylece bunlar deterministik kalır
ve normal sağlayıcı Plugin başlangıcından kaçınır. Bu canlı taşıma Gateway'leri
bellek aramasını devre dışı bırakır; bellek davranışı QA parity paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu imajda zaten
`ffmpeg` ve `ffprobe` bulunur. Docker canlı model/backend parçaları, seçilen
commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` imajını kullanır, ardından her parçada
yeniden derlemek yerine `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçilen birden fazla senaryoyu varsayılan olarak yalıtılmış
    Gateway worker'larıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 yapar (seçilen
    senaryo sayısıyla sınırlı). Worker sayısını ayarlamak için `--concurrency <count>`
    veya eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    artefakt istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkında olan `mock-openai` hattının yerini almadan deneysel
    fixture ve protokol mock kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç kıyaslamasını ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve `.artifacts/gateway-cpu-scenarios/` altında birleşik bir CPU gözlem
    özeti yazar.
  - Varsayılan olarak yalnızca sürdürülebilir sıcak CPU gözlemlerini işaretler (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa başlangıç sıçramaları dakikalar süren Gateway yoğun kullanım regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` artefaktlarını kullanır; checkout zaten taze çalışma zamanı çıktısı içermiyorsa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır ki guest, bağlı çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporu + özeti ve Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, Docker içinde global olarak kurar,
    etkileşimsiz OpenAI API anahtarı ilk kurulumunu çalıştırır, varsayılan olarak Telegram'ı
    yapılandırır, Plugin'i etkinleştirmenin çalışma zamanı bağımlılıklarını ihtiyaç anında kurduğunu doğrular,
    doctor çalıştırır ve mock bir OpenAI endpoint'ine karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı transkriptleri için deterministik bir derlenmiş uygulama Docker duman testi çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının görünür kullanıcı turuna sızmak yerine
    gösterilmeyen özel bir mesaj olarak kalıcılaştırıldığını doğrular,
    ardından etkilenmiş bozuk bir oturum JSONL'si tohumlar ve
    `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket ilk kurulumunu çalıştırır,
    Telegram'ı kurulu CLI üzerinden yapılandırır, ardından canlı Telegram QA hattını
    SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan değer `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` olur; kayıt defterinden kurmak yerine çözülmüş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram ortam kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` artı
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı varsa
    Docker sarmalayıcısı Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı elle çalıştırılan maintainer iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. İş akışı
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalışma ürün kanıtı için `Package Acceptance` sunar.
  Güvenilir bir ref, yayımlanmış npm spec, SHA-256 ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artefaktı kabul eder,
  normalleştirilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product, full veya custom
  hat profilleriyle çalıştırır. Telegram QA iş akışını aynı `package-under-test` artefaktına karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artifact kanıtı, başka bir Actions çalıştırmasından bir tarball artifact indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, Gateway’i
    OpenAI yapılandırılmış şekilde başlatır, ardından yapılandırma
    düzenlemeleriyle paketlenmiş kanal/Plugin’leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış Plugin çalışma zamanı bağımlılıklarını
    yok bıraktığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her
    paketlenmiş Plugin’in çalışma zamanı bağımlılıklarını gerektiğinde
    kurduğunu ve ikinci bir yeniden başlatmanın zaten etkinleştirilmiş
    bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram’ı etkinleştirir ve adayın güncelleme sonrası
    doctor işleminin paketlenmiş kanal çalışma zamanı bağımlılıklarını harness
    tarafı postinstall onarımı olmadan onardığını doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketli kurulum güncelleme smoke testini Parallels konukları boyunca çalıştırır. Seçilen her
    platform önce istenen temel paketi kurar, ardından aynı konukta kurulu
    `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu,
    gateway hazırlığını ve bir yerel ajan turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifact yolu ve
    lane başına durum için `--json` kullanın.
  - OpenAI lane’i, canlı ajan turu kanıtı için varsayılan olarak `openai/gpt-5.5` kullanır.
    Bilerek başka bir OpenAI modelini doğrularken `--model <provider/model>` geçirin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels aktarım takılmalarının test penceresinin kalanını tüketmemesi için uzun yerel çalıştırmaları bir host timeout içine alın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, `/tmp/openclaw-parallels-npm-update.*` altında iç içe lane günlükleri yazar.
    Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log`
    dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor/çalışma zamanı
    bağımlılığı onarımında 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü
    ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke lane’leriyle paralel
    çalıştırmayın. Bunlar VM durumunu paylaşır ve snapshot geri yükleme, paket sunumu
    veya konuk gateway durumu üzerinde çakışabilir.
  - Güncelleme sonrası kanıt, normal paketlenmiş Plugin yüzeyini çalıştırır çünkü
    konuşma, görüntü üretimi ve medya anlama gibi yetenek facade’ları, ajan
    turunun kendisi yalnızca basit bir metin yanıtını denetlese bile paketlenmiş
    çalışma zamanı API’leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA lane’ini, tek kullanımlık Docker destekli bir Tuwunel homeserver’a karşı çalıştırır. Yalnızca kaynak-checkout — paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env vars ve artifact yerleşimi: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA lane’ini, env’den alınan sürücü ve SUT bot token’larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan çıkış yapar. Başarısız bir çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir ve SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode’u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve observed-messages artifact yazar. Yanıtlama senaryoları, sürücü gönderim isteğinden gözlenen SUT yanıtına kadar RTT içerir.

Canlı aktarım lane’leri tek bir standart sözleşme paylaşır, böylece yeni aktarımlar sapmaz; lane başına kapsam matrisi [QA genel bakış → Canlı aktarım kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde bulunur. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, lane çalışırken bu kiralama için Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer’lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL’sini, broker secret’larını,
endpoint prefix’i, HTTP timeout’u ve admin/list erişilebilirliğini secret
değerlerini yazdırmadan denetlemek için `doctor` kullanın. Betikler ve CI
yardımcıları içinde makine tarafından okunabilir çıktı için `--json` kullanın.

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

Telegram kind için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload’ları reddeder.

### QA’ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde bulunur. Asgari eşik: transport runner’ı paylaşılan `qa-lab` host seam üzerinde uygulayın, Plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve senaryoları `qa/scenarios/` altında yazın.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard’ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki core/unit envanterleri; UI unit testleri özel `unit-ui` shard’ında çalışır
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway auth, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözücü ve public-surface loader testleri, geniş `api.js` ve
    `runtime-api.js` fallback davranışını gerçek paketlenmiş Plugin kaynak API’leriyle değil,
    üretilmiş küçük Plugin fixture’larıyla kanıtlamalıdır. Gerçek Plugin API yüklemeleri,
    Plugin sahipli contract/integration paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projeler, shard’lar ve kapsamlı lane’ler">

    - Hedef belirtilmeden çalıştırılan `pnpm test`, tek bir dev yerel kök-proje süreci yerine on iki daha küçük shard yapılandırmasını (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir watch döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import-grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel kontrol kapısıdır. Farkı core, core testleri, extensions, extension testleri, apps, docs, release metadata, canlı Docker araçları ve tooling olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca release metadata sürüm artırımları, üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard ile hedefli sürüm/config/kök-bağımlılık kontrollerini çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth betikleri için shell söz dizimi ve canlı Docker scheduler dry-run. `package.json` değişiklikleri yalnızca fark `scripts["test:docker:live-*"]` ile sınırlıysa dahil edilir; bağımlılık, export, sürüm ve diğer package-yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf utility alanlarından import-hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından yönlendirilir; durum bilgili/runtime-ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`; üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış bucket'lara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import-ağır tek bir bucket tüm Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, extension batch sweep'i ve yalnızca release için olan `agentic-plugins` shard'ını bilinçli olarak atlar. Tam Release Validation, release candidate'larında bu plugin/extension-ağır paketler için ayrı `Plugin Prerelease` alt workflow'unu dispatch eder.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Message-tool discovery girdilerini veya compaction runtime
      bağlamını değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı regresyonları
      ekleyin.
    - Gömülü runner entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı id'lerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca yardımcı testleri,
      bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool ve isolation varsayılanları">

    - Temel Vitest config varsayılanı `threads` olur.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı config'ler genelinde yalıtımsız runner'ı kullanır.
    - Kök UI hattı kendi `jsdom` kurulumunu ve optimizer'ını korur, ancak
      paylaşılan yalıtımsız runner üzerinde de çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest config'ten aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 compile churn'ünü
      azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev`
      ekler. Standart V8 davranışıyla karşılaştırmak için
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme içindir. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel kontrol kapısına ihtiyacınız olduğunda handoff veya push öncesinde
      `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan yönlendirir. Yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi bilinçli olarak muhafazakârdır ve
      host load average zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, projects/config dosyalarını
      `forceRerunTriggers` olarak işaretler; böylece test wiring değiştiğinde changed-mode
      yeniden çalıştırmaları doğru kalır.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` etkin tutar;
      doğrudan profiling için tek bir açık cache konumu istiyorsanız
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profiling görünümünü
      `origin/main` sonrasında değişen dosyalara kapsamlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm-config çalıştırmaları anahtar olarak config yolunu kullanır; include-pattern CI
      shard'ları shard adını ekler, böylece filtrelenmiş shard'lar ayrı
      izlenebilir.
    - Sıcak bir test hâlâ zamanının çoğunu başlatma import'larında harcadığında,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      yalnızca `vi.mock(...)` içinden geçirmek için runtime yardımcılarını deep-import etmek yerine
      bu sınırı doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile o commit'lenmiş fark için yerel kök-proje yolunu karşılaştırır
      ve wall time ile macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek geçerli
      dirty tree'yi benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış unit paketi için
      runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkin gerçek bir loopback Gateway başlatır
  - Sentetik gateway message, memory ve large-payload churn'ünü diagnostic event yolu üzerinden yürütür
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle kalıcılık yardımcılarını kapsar
  - Recorder'ın sınırlı kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve session başına queue depth değerlerinin yeniden sıfıra boşaldığını doğrular
- Beklentiler:
  - CI-safe ve anahtarsız
  - Stability-regression takibi için dar hat; tam Gateway paketinin ikamesi değildir

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki bundled-plugin E2E testleri
- Runtime varsayılanları:
  - Deponun geri kalanıyla eşleşerek Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Console I/O overhead'ini azaltmak için varsayılan olarak silent modda çalışır.
- Yararlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı console çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır networking
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker üzerinden host üzerinde yalıtılmış bir OpenShell gateway başlatır
  - Geçici yerel Dockerfile'dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı override'lar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan CLI binary'sine veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki bundled-plugin live testleri
- Varsayılan: `pnpm test:live` ile **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu provider/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Provider format değişikliklerini, tool-calling tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-stable değildir (gerçek ağlar, gerçek provider politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını source eder.
- Varsayılan olarak, canlı çalıştırmalar hâlâ `HOME` dizinini yalıtır ve unit fixture'larının gerçek `~/.openclaw` dizininizi değiştirememesi için config/auth materyalini geçici bir test home'una kopyalar.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek home dizininizi kullanmasını bilinçli olarak istediğinizde ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ekstra `~/.profile` bildirimini bastırır ve gateway bootstrap log'larını/Bonjour chatter'ını susturur. Tam başlatma log'larını geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API key rotation (provider'a özgü): `*_API_KEYS` değerini virgül/noktalı virgül formatıyla veya `*_API_KEY_1`, `*_API_KEY_2` olarak ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden live başına override kullanın; testler rate limit yanıtlarında yeniden dener.
- Progress/heartbeat çıktısı:
  - Canlı paketler artık stderr'e progress satırları yayar; böylece uzun provider çağrıları, Vitest console capture sessizken bile görünür şekilde aktiftir.
  - `vitest.live.config.ts`, Vitest console interception'ı devre dışı bırakır; böylece provider/gateway progress satırları canlı çalıştırmalar sırasında hemen stream edilir.
  - Doğrudan-model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Düzenleme mantığı/testleri: `pnpm test` çalıştırın (çok fazla değişiklik yaptıysanız `pnpm test:coverage` da)
- Gateway ağ iletişimine / WS protokolüne / eşlemeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “botum çalışmıyor” / sağlayıcıya özgü hatalar / araç çağırma hata ayıklaması: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI backend smoke testleri, ACP smoke testleri, Codex app-server
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness'ı) — ayrıca canlı çalıştırmalar için kimlik bilgisi yönetimi — için
bkz. [Testing — canlı paketler](/tr/help/testing-live).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlandıysa `~/.profile` dosyasını kaynak olarak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır, böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Özellikle daha büyük kapsamlı taramayı
  istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez derler, OpenClaw'u `scripts/package-openclaw-for-docker.mjs` aracılığıyla bir npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı derler/yeniden kullanır. Yalın imaj, install/update/plugin-dependency hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden derlenmiş tarball'u bağlar. İşlevsel imaj, derlenmiş uygulama işlevselliği hatları için aynı tarball'u `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplu çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem slotlarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çok hizmetli hatların aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırır. Varsayılanlar 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker host daha fazla kapasiteye sahipse ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçili hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub'a özgü paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözümler, bunu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak bu tarball'a karşı çalıştırır. `workflow_ref` güvenilir workflow/harness betiklerini seçerken, `package_ref` `source=ref` olduğunda paketlenecek kaynak commit/branch/tag değerini seçer; bu, geçerli kabul mantığının daha eski güvenilir commit'leri doğrulamasını sağlar. Profiller kapsama göre sıralanır: `smoke` hızlı install/channel/agent artı Gateway/config'tir, `package` paket/update/Plugin sözleşmesi artı anahtarsız upgrade-survivor fixture'ı, yayımlanmış baseline upgrade survivor hattı ve çoğu Parallels paket/update kapsamının varsayılan yerel ikamesidir, `product` MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI ekler, `full` ise OpenWebUI ile release-path Docker parçalarını çalıştırır. `published-upgrade-survivor` için Package Acceptance her zaman adayı `package-under-test` olarak ve fallback yayımlanmış baseline'ı `published_upgrade_survivor_baseline` olarak kullanır; varsayılan `openclaw@latest` olur; hattı en son altı kararlı sürüm, `2026.4.23` ve `2026-03-15` öncesindeki en son kararlı sürümden oluşan tekilleştirilmiş bir matrise bölmek için `published_upgrade_survivor_baselines=release-history` ayarlayın. Yayımlanmış hat, baseline'ını yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, ardından tarif adımlarını hat özetine kaydeder. Sürüm doğrulaması, özel bir paket deltası (`bundled-channel-deps-compat plugins-offline`) artı Telegram paket QA çalıştırır; çünkü release-path Docker parçaları çakışan paket/update/Plugin hatlarını zaten kapsar. Artifact'lerden üretilen hedefli GitHub Docker yeniden çalıştırma komutları, önceki paket artifact'ini, hazırlanmış imaj girdilerini ve mevcut olduğunda yayımlanmış upgrade-survivor baseline listesini içerir; böylece başarısız hatlar paketi ve imajları yeniden derlemekten kaçınabilir.
- Derleme ve sürüm kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik derlenmiş grafiği gezer ve komut dispatch öncesi başlatmanın Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını içe aktarması durumunda başarısız olur; ayrıca paketlenmiş Gateway run parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke testi ayrıca kök help, onboard help, doctor help, status, config schema ve bir model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesme noktasına kadar harness yalnızca gönderilmiş paket metadata boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. `2026.4.25` sonrası paketlerde bu yollar katı hata sayılır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth home'larını (veya çalışma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından çalışma öncesinde bunları container home'a kopyalar; böylece external-CLI OAuth, host auth deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar, `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile katı Droid/OpenCode kapsamı sağlar)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball'ı QA Lab'i içermediği için kasıtlı olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskele oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, OpenAI'ı env-ref onboarding ve varsayılan olarak Telegram ile yapılandırır, doctor onarımlarının etkinleştirilmiş Plugin runtime bağımlılıklarını doğrular ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve güncelleme sonrası Plugin çalışmasının doğru olduğunu doğrular, ardından paket `stable` kanalına geri döner ve güncelleme durumunu kontrol eder.
- Yükseltme survivor smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball'ını ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin runtime-deps durumu ve mevcut çalışma alanı/oturum dosyaları içeren kirli bir eski kullanıcı fixture'ı üzerine kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunumu ile başlatma/durum bütçelerini kontrol eder.
- Yayınlanmış yükseltme survivor smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını tohumlar, bu temel sürümü gömülü bir komut tarifiyle yapılandırır, oluşan yapılandırmayı doğrular, yayınlanmış kurulumu aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korunumunu, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Tek bir temel sürümü `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan tam temel sürümleri `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve issue biçimli fixture'ları `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- Oturum runtime context smoke testi: `pnpm test:docker:session-runtime-context`, gizli runtime context transcript kalıcılığını ve etkilenen yinelenmiş prompt-yeniden-yazma dallarının doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker imajından `dist/` dizinini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Kurulum Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm önbelleği paylaşır. Güncelleme smoke testi, aday tarball'a yükseltmeden önce kararlı temel sürüm olarak varsayılan şekilde npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke workflow'unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurulum kontrolleri, root sahipli önbellek girdilerinin kullanıcı-yerel kurulum davranışını maskelememesi için yalıtılmış bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği bu env olmadan yerelde çalıştırın.
- Ajanlar paylaşılan çalışma alanı silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile imajını derler, yalıtılmış bir container home içinde tek çalışma alanına sahip iki ajanı tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri, iframe referanslarını ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) taklit bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü kontrol eder.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (kurulum smoke testi, ClawHub kitchen-sink kurulum/kaldırma, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test hermetik yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmedi smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Yapılandırma yeniden yükleme meta verisi smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş Plugin runtime bağımlılıkları: `pnpm test:docker:bundled-channel-deps` varsayılan olarak küçük bir Docker runner imajı derler, OpenClaw'ı ana makinede bir kez derleyip paketler, ardından bu tarball'ı her Linux kurulum senaryosuna bağlar. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra ana makine yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile gösterin. Tam Docker toplamı ve release-path paketlenmiş-kanal parçaları bu tarball'ı bir kez önceden paketler, ardından paketlenmiş kanal kontrollerini Telegram, Discord, Slack, Feishu, memory-lancedb ve ACPX için ayrı güncelleme hatları dahil bağımsız hatlara böler. Yayın parçaları kanal smoke testlerini, güncelleme hedeflerini ve kurulum/runtime sözleşmelerini `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` ve `bundled-channels-contracts` olarak böler; toplu `bundled-channels` parçası manuel yeniden çalıştırmalar için kullanılabilir kalır. Yayın workflow'u ayrıca sağlayıcı kurulum parçalarını ve paketlenmiş Plugin kurulum/kaldırma parçalarını böler; eski `package-update`, `plugins-runtime` ve `plugins-integrations` parçaları manuel yeniden çalıştırmalar için toplu takma adlar olarak kalır. Paketlenmiş hattı doğrudan çalıştırırken kanal matrisini daraltmak için `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` kullanın veya güncelleme senaryosunu daraltmak için `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` kullanın. Senaryo başına Docker çalıştırmaları varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` kullanır; çok hedefli güncelleme senaryosu varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` kullanır. Hat ayrıca `channels.<id>.enabled=false` ve `plugins.entries.<id>.enabled=false` değerlerinin doctor/runtime-bağımlılığı onarımını bastırdığını doğrular.
- Yineleme sırasında ilgisiz senaryoları devre dışı bırakarak paketlenmiş Plugin runtime bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan işlevsel imajı elle önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özel imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, betikler imaj zaten yerelde değilse onu çeker. QR ve kurulum Docker testleri kendi Dockerfile'larını korur, çünkü paylaşılan derlenmiş uygulama runtime'ı yerine paket/kurulum davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
konteyner içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
imajını küçük tutarken Vitest'i yine de tam yerel kaynak/yapılandırmanız üzerinde çalıştırır.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artefaktları
kopyalamak için dakikalar harcamaması adına `.pnpm-store`, `.worktrees`,
`__openclaw_vitest__` ve uygulamaya yerel `.build` ya da Gradle çıktı dizinleri gibi
büyük, yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı yoklamaları,
konteyner içinde gerçek Telegram/Discord/vb. kanal işçilerini başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden bu Docker
hattından Gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu
HTTP uç noktaları etkinleştirilmiş bir OpenClaw Gateway konteyneri başlatır,
bu Gateway'e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI
üzerinden oturum açar, `/api/models` öğesinin `openclaw/default` değerini sunduğunu
doğrular, ardından Open WebUI'nin `/api/chat/completions` proxy'si üzerinden
gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir çünkü Docker'ın Open WebUI
imajını çekmesi ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(Docker ile çalıştırmalarda varsayılan olarak `~/.profile`) bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` bilinçli olarak deterministiktir ve gerçek bir
Telegram, Discord ya da iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
konteyneri başlatır, `openclaw mcp serve` çalıştıran ikinci bir konteyner başlatır,
ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek metadata'sını,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP
köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim kontrolü,
ham stdio MCP çerçevelerini doğrudan inceler; böylece duman testi yalnızca belirli
bir istemci SDK'sının yüzeye çıkardığını değil, köprünün gerçekten yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarına ihtiyaç duymaz.
Repo Docker imajını derler, konteyner içinde gerçek bir stdio MCP yoklama sunucusu başlatır,
bu sunucuyu gömülü Pi bundle MCP çalışma zamanı üzerinden somutlaştırır,
aracı yürütür, ardından `coding` ve `messaging` öğelerinin `bundle-mcp` araçlarını koruduğunu,
`minimal` ve `tools.deny: ["bundle-mcp"]` öğelerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarına ihtiyaç duymaz.
Gerçek bir stdio MCP yoklama sunucusuyla tohumlanmış bir Gateway başlatır, yalıtılmış
bir cron turu ve bir `/subagents spawn` tek seferlik alt turu çalıştırır, ardından
MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dilli thread duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env var'ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testler çalıştırılmadan önce source edilir
- Yalnızca `OPENCLAW_PROFILE_FILE` dosyasından source edilen env var'larını, geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI auth mount'ları olmadan doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle elle geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içindeki provider'ları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI duman testi için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI duman testinin kullandığı nonce kontrol istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman doğrulaması

Doküman düzenlemelerinden sonra doküman kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI güvenli)

Bunlar gerçek provider'lar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (vaka: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırmayı yazar + auth zorunlu): `src/gateway/gateway.test.ts` (vaka: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (skills)

Zaten “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt'ta listelendiğinde agent doğru skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi taşınmasını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte provider'lar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, gating, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (opt-in, env-gated), yalnızca CI güvenli paket hazır olduktan sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi arayüz sözleşmesine uyduğunu
doğrular. Keşfedilen tüm Plugin'ler üzerinde yineleme yapar ve şekil ile davranış
assertion'larından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` birim hattı
bu paylaşılan seam ve duman dosyalarını bilinçli olarak atlar; paylaşılan kanal
veya provider yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca provider sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - İleti yükü yapısı
- **inbound** - Gelen ileti işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/kadro API'si
- **group-policy** - Grup ilkesi zorlaması

### Provider durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin registry şekli

### Provider sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/seçme
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Provider çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılır

- plugin-sdk dışa aktarımları veya alt yolları değiştirildikten sonra
- Bir kanal veya provider Plugin'i eklendikten ya da değiştirildikten sonra
- Plugin kaydı veya keşfi refactor edildikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (sahte/stub provider veya tam istek şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca canlıysa (rate limit'ler, auth ilkeleri), canlı testi dar ve env var'ları üzerinden opt-in tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - provider istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı duman testi veya CI güvenli Gateway mock testi
- SecretRef dolaşım koruma kuralı:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` öğesini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için sınıflandırılmamış hedef id'lerinde bilinçli olarak başarısız olur.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [CI](/tr/ci)
