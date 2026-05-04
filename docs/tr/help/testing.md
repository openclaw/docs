---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı paketleri, Docker çalıştırıcıları ve her testin kapsadıkları'
title: Test Etme
x-i18n:
    generated_at: "2026-05-04T07:06:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest test paketine (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her test paketinin neleri kapsadığı (ve özellikle neleri kapsamadığı).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı aktarım hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakış](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) — depo destekli senaryolar tarafından kullanılan sentetik aktarım Plugin'i.

Bu sayfa düzenli test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefle: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` aracı turu için
  `live_gpt54=true` ile veya Kova CPU/heap/trace yapıtları için
  `deep_profile=true` ile `OpenClaw Performance` tetikleyin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.4 hat yapıtlarını
  `openclaw/clawgrit-reports` konumuna yayımlar. mock-provider raporu ayrıca kaynak düzeyinde Gateway açılışı, bellek,
  Plugin baskısı, tekrarlanan sahte model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır.
    Meta verileri `image` girdisi ilan eden modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını yalıtırken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir canlı/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre parçalanmış ayrı Docker canlı model
    matris işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` öğesini
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı gizli değerlerini `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, sentetik bir
    Slack DM'yi `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway aracı turlarını Plugin'e ait Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` öğelerini doğrular ve varsayılan olarak görüntü,
    cron MCP, alt aracı ve Guardian yoklamalarını çalıştırır. Diğer Codex
    app-server hatalarını yalıtırken alt aracı yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt aracı kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, alt aracı yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı, fazladan güvence sağlayan kontrol.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir kapsayıcıda çalıştırır
    ve fuzzy planlayıcı geri dönüşünün denetlenen türlenmiş bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlanmışken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve asistan dökümünün normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız duruma ihtiyaç duyduğunuzda, canlı testleri aşağıda açıklanan izin listesi ortam değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab'i adanmış iş akışlarında çalıştırır. Aracı paritesi bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya
release-checks QA grubunu kullanmalıdır. `QA-Lab - All Lanes`, `main` üzerinde gecelik olarak ve
manuel tetiklemeden mock parity hattı, canlı Matrix hattı, Convex tarafından yönetilen canlı Telegram hattı ve
Convex tarafından yönetilen canlı Discord hattı paralel işler olarak çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix
`--profile fast` değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi
varsayılanı `all` olarak kalır; manuel tetikleme `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release
Checks`, sürüm onayından önce parite ile hızlı Matrix ve Telegram hatlarını çalıştırır;
sürüm aktarım kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar
ve normal sağlayıcı Plugin başlangıcından kaçınırlar. Bu canlı aktarım
Gateway'leri bellek aramayı devre dışı bırakır; bellek davranışı QA parite
paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları,
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu imajda zaten
`ffmpeg` ve `ffprobe` vardır. Docker canlı model/arka uç parçaları, seçilen her
commit için bir kez oluşturulan paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>`
imajını kullanır, ardından her parça içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Seçili birden çok senaryoyu varsayılan olarak yalıtılmış Gateway işçileriyle
    paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 kullanır
    (seçili senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için
    `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan yapıt almak istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalığı olan `mock-openai` hattını değiştirmeden,
    deneysel fixture ve protokol taklidi kapsamı için yerel AIMock destekli bir
    sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma kıyasını ve küçük bir taklit QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altında yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` artı `--hot-wall-warn-ms`), böylece kısa başlatma
    sıçramaları, dakikalarca süren Gateway sabitlenmesi regresyonu gibi görünmeden
    metrik olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarını kullanır; checkout'ta zaten güncel çalışma
    zamanı çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama
    girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
    yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır; böylece misafir, bağlı çalışma
    alanı üzerinden geri yazabilir.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball'ı oluşturur, Docker içinde global olarak
    yükler, etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır, varsayılan
    olarak Telegram'ı yapılandırır, paketlenmiş Plugin çalışma zamanının başlatma
    bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor çalıştırır ve taklit
    edilen bir OpenAI uç noktasına karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş yükleme hattını Discord ile çalıştırmak için
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı transcript'leri için deterministik bir derlenmiş
    uygulama Docker smoke'u çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının
    görünür kullanıcı turuna sızmak yerine görüntülenmeyen özel bir mesaj olarak
    kalıcılaştırıldığını doğrular, ardından etkilenmiş bozuk bir oturum JSONL'i
    seed eder ve `openclaw doctor --fix` komutunun bunu bir yedekle aktif dala
    yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını yükler, yüklü paket onboarding'ini
    çalıştırır, yüklü CLI üzerinden Telegram'ı yapılandırır, ardından bu yüklü
    paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanır;
    registry'den yüklemek yerine çözülmüş bir yerel tarball'ı test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya
    Convex kimlik bilgisi kaynağını kullanır. CI/release otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret'ını ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı varsa Docker sarmalayıcı
    Convex'i otomatik seçer.
  - Sarmalayıcı, Docker build/yükleme işi öncesinde ana makinede Telegram veya
    Convex kimlik bilgisi env'ini doğrular. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    yalnızca kimlik bilgisi öncesi kurulumu bilinçli olarak debug ederken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için
    paylaşılan `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralamalarını kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec'i, SHA-256
  içeren HTTPS tarball URL'si veya başka bir çalıştırmadan tarball yapıtı kabul eder,
  normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak
  yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product, full
  veya özel hat profilleriyle çalıştırır. Telegram QA workflow'unu aynı
  `package-under-test` yapıtına karşı çalıştırmak için `telegram_mode=mock-openai`
  veya `live-frontier` ayarlayın.
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

- Yapıt kanıtı, başka bir Actions çalıştırmasından bir tarball yapıtı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build'ini Docker içinde paketler ve yükler, OpenAI yapılandırılmış
    olarak Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketle gelen
    kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının her eksik indirilebilir Plugin'i açıkça
    yüklediğini ve ikinci yeniden başlatmanın gizli bağımlılık onarımı çalıştırmadığını
    doğrular.
  - Ayrıca bilinen eski bir npm baseline'ı yükler, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor'ının
    harness tarafı postinstall onarımı olmadan eski Plugin bağımlılık kalıntılarını
    temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels misafirleri genelinde native paketli yükleme güncelleme smoke'unu
    çalıştırır. Seçili her platform önce istenen baseline paketini yükler, sonra aynı
    misafirde yüklü `openclaw update` komutunu çalıştırır ve yüklü sürümü, güncelleme
    durumunu, Gateway hazır oluşunu ve bir yerel agent turunu doğrular.
  - Tek bir misafir üzerinde iterasyon yaparken `--platform macos`, `--platform windows`
    veya `--platform linux` kullanın. Özet yapıt yolu ve hat başına durum için `--json`
    kullanın.
  - OpenAI hattı, varsayılan olarak canlı agent turu kanıtı için `openai/gpt-5.5`
    kullanır. Başka bir OpenAI modelini bilinçli olarak doğrularken
    `--model <provider/model>` geçin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels aktarım takılmalarının test penceresinin kalanını tüketmemesi için uzun
    yerel çalıştırmaları ana makine timeout'u ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`,
    `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir misafirde güncelleme sonrası doctor ve paket
    güncelleme işinde 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü
    ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke hatlarıyla
    paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot restore, paket sunumu
    veya misafir Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketle gelen Plugin yüzeyini çalıştırır; çünkü
    konuşma, görüntü oluşturma ve medya anlama gibi capability facade'ları, agent turu
    yalnızca basit bir metin yanıtını kontrol etse bile paketle gelen çalışma zamanı
    API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u — paketlenmiş yüklemeler `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env vars ve yapıt yerleşimi: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env'den gelen sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram chat id olmalıdır.
  - Paylaşılan havuzlu kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlu kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan yapıt almak istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özeti ve gözlemlenen mesajlar yapıtını `.artifacts/qa-e2e/...` altına yazar. Yanıt veren senaryolar, sürücü gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı aktarım hatları tek bir standart sözleşmeyi paylaşır; böylece yeni aktarımlar sapma yaşamaz. Hat başına kapsam matrisi [QA overview → Live transport coverage](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde bulunur. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken
bu kiralama için Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçili rol için bir secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI` `ci` için
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz id'si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Maintainer admin komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, aracı sırlarını,
uç nokta önekini, HTTP zaman aşımını ve admin/liste erişilebilirliğini gizli
değerleri yazdırmadan denetlemek için `doctor` kullanın. Betikler ve CI
yardımcıları içinde makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `POST /admin/add` (yalnızca bakımcı sırrı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca bakımcı sırrı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram türü için yük biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcılarının mimarisi ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari çıta: paylaşılan `qa-lab` ana makine arayüzünde aktarım çalıştırıcısını uygulayın, Plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve senaryoları `qa/scenarios/` altında yazın.

## Test takımları (nerede ne çalışır)

Takımları “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedef belirtilmemiş çalıştırmalar `vitest.full-*.config.ts` parça kümesini kullanır ve paralel zamanlama için çoklu proje parçalarını proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri ayrılmış `unit-ui` parçasında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için belirleyici regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil, üretilmiş küçük Plugin fikstürleriyle geniş `api.js` ve
    `runtime-api.js` geri dönüş davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri,
    Plugin sahibi sözleşme/entegrasyon takımlarına aittir.

<AccordionGroup>
  <Accordion title="Projeler, parçalar ve kapsamlı hatlar">

    - Hedef belirtilmemiş `pnpm test`, tek bir dev yerel kök proje süreci yerine on iki küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/uzantı işlerinin ilgisiz takımları aç bırakmasını önler.
    - Çok parçalı bir izleme döngüsü pratik olmadığı için `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamlı çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel denetim geçididir. Farkı çekirdek, çekirdek testleri, uzantılar, uzantı testleri, uygulamalar, belgeler, sürüm metaverileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm metaverisi olan sürüm yükseltmeleri, üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir korumayla hedefli sürüm/yapılandırma/kök bağımlılık denetimleri çalıştırır.
    - Canlı Docker ACP donanımı düzenlemeleri odaklı denetimler çalıştırır: canlı Docker kimlik doğrulama betikleri için kabuk söz dizimi ve canlı Docker zamanlayıcı kuru çalıştırması. `package.json` değişiklikleri yalnızca fark `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, dışa aktarma, sürüm ve diğer paket yüzeyi düzenlemeleri hâlâ daha geniş korumaları kullanır.
    - Agent'lar, komutlar, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan import hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durum bilgili/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da değişen kip çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır takımı yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey çekirdek yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış kovalara sahiptir. CI, import ağır tek bir kovanın tüm Node kuyruğunu sahiplenmemesi için yanıt alt ağacını agent-runner, dispatch ve commands/state-routing parçalarına ayrıca böler.
    - Normal PR/main CI, uzantı toplu taramasını ve yalnızca sürüme özel `agentic-plugins` parçasını bilerek atlar. Full Release Validation, sürüm adaylarında bu Plugin/uzantı ağırlıklı takımlar için ayrı `Plugin Prerelease` alt iş akışını gönderir.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - Mesaj aracı keşif girdilerini veya compaction çalışma zamanı
      bağlamını değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı
      regresyonları ekleyin.
    - Gömülü çalıştırıcı entegrasyon takımlarını sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu takımlar, kapsamlı kimliklerin ve compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca
      yardımcı testleri bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve izolasyon varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve kök projeler, e2e ve canlı yapılandırmalar genelinde
      izole olmayan çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve iyileştiricisini korur, ancak o da
      paylaşılan izole olmayan çalıştırıcıda çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 derleme dalgalanmasını azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Stok V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel iterasyon">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme içindir. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya testleri çalıştırmaz.
    - Akıllı yerel denetim geçidine ihtiyacınız olduğunda handoff veya push öncesinde açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` yalnızca agent
      bir donanım, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamı gerektirdiğine karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek bir worker sınırıyla.
    - Yerel worker otomatik ölçekleme bilerek muhafazakârdır ve ana makine yük ortalaması zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test
      kablolaması değiştiğinde değişen kip yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` etkin tutar; doğrudan profilleme için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve
      import dökümü çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü
      `origin/main` sonrasında değişen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      parçaları, filtrelenmiş parçaların ayrı izlenebilmesi için parça adını ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç import'larında harcadığında,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` arayüzünün arkasında tutun ve
      çalışma zamanı yardımcılarını sadece `vi.mock(...)` içinden geçirmek için derin import etmek yerine
      o arayüzü doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile o commit edilmiş fark için yerel kök proje yolunu karşılaştırır
      ve duvar süresiyle macOS maksimum RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek mevcut
      kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve dönüştürme yükü için
      ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken birim takımı için
      çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Tanılamalar varsayılan olarak etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik Gateway mesajı, bellek ve büyük yük dalgalanması yürütür
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Tam Gateway takımının yerine geçmeyen, kararlılık regresyonu takibi için dar hat

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki birlikte gelen Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` değerini `isolate: false` ile kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çoklu örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç duman testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker üzerinden host üzerinde izole bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell arka ucunu çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary dosyasına veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki birlikte gelen Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı format değişikliklerini, tool-calling tuhaflıklarını, kimlik doğrulama sorunlarını ve oran sınırı davranışını yakalar
- Beklentiler:
  - Tasarımı gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / oran sınırlarını kullanır
  - "Her şey" yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynak olarak kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini izole eder ve yapılandırma/kimlik doğrulama materyalini geçici bir test home dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek home dizininizi kullanmasına bilinçli olarak ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlüklerini/Bonjour gevezeliğini susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` ya da `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) veya `OPENCLAW_LIVE_*_KEY` üzerinden canlıya özgü geçersiz kılma kullanın; testler oran sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık stderr'e ilerleme satırları yayar; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessizken bile görünür biçimde etkin kalır.
  - `vitest.live.config.ts`, sağlayıcı/Gateway ilerleme satırlarının canlı çalıştırmalar sırasında hemen akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan-model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/prob Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok değişiklik yaptıysanız `pnpm test:coverage` da çalıştırın)
- Gateway ağ işlemleri / WS protokolü / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- "Botum kapalı" / sağlayıcıya özgü hatalar / tool calling hata ayıklama: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç duman testleri, ACP duman testleri, Codex app-server
harness'ı ve tüm medya-sağlayıcı canlı testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) için, ayrıca canlı çalıştırmalarda kimlik bilgisi işleme için bkz.
[Canlı paketleri test etme](/tr/help/testing-live). Özel güncelleme ve
Plugin doğrulama kontrol listesi için bkz.
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profile-key canlı dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` kaynak olarak kullanır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` değerleridir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir duman sınırına sahiptir; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez derler, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` aracılığıyla npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Çıplak imaj yalnızca install/update/plugin-dependency hatları için Node/Git çalıştırıcısıdır; bu hatlar önceden derlenmiş tarball'ı bağlar. İşlevsel imaj, built-app işlevsellik hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplu çalışma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çoklu-servis hatlarının hepsinin aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken onu yine de başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırmayı sürdürür. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker host'ta daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak Docker ön kontrolü yapar, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen hatlar, paket/imaj ihtiyaçları ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub-native paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` üzerinden bir aday paketi çözer, onu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine bu tam tarball'a karşı yeniden kullanılabilir Docker E2E hatlarını çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış-yükseltme survivor matrisi, release varsayılanları ve hata triyajı için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).
- Derleme ve release kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Guard, statik derlenmiş grafiği `dist/entry.js` ve `dist/cli/run-main.js` üzerinden gezer ve komut dispatch öncesindeki başlangıç import'ları Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını komut dispatch'ten önce içeri alırsa başarısız olur; ayrıca birlikte gelen Gateway run chunk'ını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik import'larını reddeder. Paketlenmiş CLI duman testi ayrıca root help, onboard help, doctor help, status, config schema ve model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlandırılmıştır (`2026.4.25-beta.*` dahil). Bu sınıra kadar harness yalnızca gönderilmiş-paket meta veri boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config meta veri migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı hatalardır.
- Container duman testi çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı-model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama home dizinlerini (veya çalışma daraltılmamışsa desteklenenlerin tümünü) bind-mount yapar, ardından bunları çalıştırmadan önce container home dizinine kopyalar; böylece harici-CLI OAuth, host kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile katı Droid/OpenCode kapsamı sağlar)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke`, özel bir QA kaynak-checkout kulvarıdır. npm tarball'u QA Lab'i dışarıda bıraktığı için bilinçli olarak paket Docker yayın kulvarlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk kurulum sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball ilk kurulum/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'unu Docker içinde global olarak yükler, OpenAI'yi env-ref ilk kurulumuyla ve varsayılan olarak Telegram ile yapılandırır, doctor çalıştırır ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'u `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'unu Docker içinde global olarak yükler, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın korunduğunu doğrular, sonra paket `stable` kanalına geri döner ve güncelleme durumunu denetler.
- Yükseltme sağ kalan smoke testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball'unu; ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları içeren kirli bir eski kullanıcı fikstürünün üzerine yükler. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum koruması ile başlangıç/durum bütçelerini denetler.
- Yayınlanmış yükseltme sağ kalan smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` yükler, gerçekçi mevcut kullanıcı dosyalarını tohumlar, bu temeli gömülü bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, bu yayınlanmış yüklemeyi aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum bütçelerini denetler. Bir temeli `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan `all-since-2026.4.23` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin temelleri genişletmesini isteyin ve `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile sorun biçimli fikstürleri genişletin; reported-issues kümesi, otomatik harici OpenClaw Plugin yükleme onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- Oturum çalışma zamanı bağlamı smoke testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global yükleme smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, yalıtılmış bir ana dizinde `bun install -g` ile yükler ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker imajından `dist/` öğesini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Yükleyici Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, güncelleme ve doğrudan-npm container'ları arasında tek bir npm önbelleği paylaşır. Güncelleme smoke testi, aday tarball'a yükseltmeden önce kararlı temel olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan yükleyici denetimleri, root'a ait önbellek girdilerinin kullanıcı-yerel yükleme davranışını maskelememesi için yalıtılmış bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/güncelleme/doğrudan-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen doğrudan-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanı silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile imajını derler, yalıtılmış bir container ana dizininde tek çalışma alanına sahip iki ajanı tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağı (iki container, WS kimlik doğrulama + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP anlık görüntü smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilir öğeleri, iframe ref'lerini ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway üzerinden taklit bir OpenAI sunucusu çalıştırır, `web_search` işleminin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şemasını ret durumuna zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP alt süreç sökümü): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref'leri, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için yükleme/güncelleme smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fikstür sunucusu kullanır.
- Plugin güncellemesi değişmemiş smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi smoke testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'unu çıplak bir container'a yükler, bir npm Plugin'i yükler, etkinleştirme/devre dışı bırakma durumunu değiştirir, yerel bir npm registry üzerinden onu yükseltir ve düşürür, yüklenmiş kodu siler, ardından her yaşam döngüsü aşaması için RSS/CPU metriklerini günlüğe yazarken kaldırma işleminin eski durumu hâlâ kaldırdığını doğrular.
- Yapılandırma yeniden yükleme meta veri smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`, yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref'leri, ClawHub fikstürleri, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için yükleme/güncelleme smoke testini kapsar. `pnpm test:docker:plugin-update`, yüklü Plugin'ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlenen npm Plugin yükleme, etkinleştirme, devre dışı bırakma, yükseltme, düşürme ve eksik-kod kaldırma işlemlerini kapsar.

Paylaşılan işlevsel imajı önceden derlemek ve elle yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi süite özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak paylaşılan bir imaja işaret ettiğinde, betikler imaj zaten yerelde değilse onu çeker. QR ve yükleyici Docker testleri, paylaşılan derlenmiş uygulama çalışma zamanı yerine paket/yükleme davranışını doğruladıkları için kendi Dockerfile'larını korur.

Live model Docker runner'ları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
container içindeki geçici bir workdir'e hazırlar. Bu, runtime
image'ını ince tutarken Vitest'i tam olarak yerel source/config'inize karşı çalıştırmayı sağlar.
Hazırlama adımı, Docker live çalıştırmalarının
makineye özgü artifact'leri kopyalamak için dakikalar harcamaması adına
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve app-local `.build` ya da
Gradle output dizinleri gibi büyük, yalnızca yerel cache'leri ve app build output'larını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live probe'ları
container içinde gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden o Docker lane'inde
gateway live coverage'ı daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de geçirin.
`test:docker:openwebui` daha üst düzey bir uyumluluk duman testidir: OpenAI uyumlu HTTP endpoint'leri etkinleştirilmiş bir
OpenClaw gateway container'ı başlatır,
bu gateway'e karşı pinlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` endpoint'inin `openclaw/default` sunduğunu doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir chat isteği gönderir.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI image'ını çekmesi ve Open WebUI'nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu lane kullanılabilir bir live model key bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) Dockerized çalıştırmalarda bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` özellikle deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway
container'ı boot eder, `openclaw mcp serve` başlatan ikinci bir container başlatır, ardından
gerçek stdio MCP bridge üzerinden yönlendirilmiş conversation discovery'yi, transcript okumalarını, attachment metadata'sını,
live event queue davranışını, outbound send routing'i ve Claude tarzı kanal +
permission bildirimlerini doğrular. Bildirim kontrolü
ham stdio MCP frame'lerini doğrudan inceler; böylece duman testi, belirli bir client SDK'sının yüzeye çıkardığı şeyi değil,
bridge'in gerçekten yaydığı şeyi doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve live
model key gerektirmez. Repo Docker image'ını build eder, container içinde gerçek bir stdio MCP probe server'ı başlatır,
bu server'ı gömülü Pi bundle
MCP runtime üzerinden materyalize eder, tool'u çalıştırır, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` tool'larını tuttuğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve live model
key gerektirmez. Gerçek bir stdio MCP probe server'ı ile seed edilmiş bir Gateway başlatır,
izole bir cron turn ve bir `/subagents spawn` tek seferlik child turn çalıştırır, ardından
MCP child process'inin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil konu duman testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regression/debug workflow'ları için tutun. ACP konu yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı env var'lar:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testler çalıştırılmadan önce source edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici config/workspace dizinleri kullanarak ve harici CLI auth mount'ları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden source edilen env var'ları doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cache'lenmiş CLI kurulumları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir liste ile manuel olarak override edin
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` container içinde provider'ları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1` yeniden build gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` image'ını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` credential'ların profile store'dan geldiğinden emin olmak için (env'den değil)
- `OPENCLAW_OPENWEBUI_MODEL=...` Open WebUI duman testi için gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...` Open WebUI duman testinin kullandığı nonce-check prompt'unu override etmek için
- `OPENWEBUI_IMAGE=...` pinlenmiş Open WebUI image tag'ini override etmek için

## Docs sağlamlık kontrolü

Doc düzenlemelerinden sonra docs kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi heading kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Bunlar gerçek provider olmadan “real pipeline” regression'lardır:

- Gateway tool calling (mock OpenAI, gerçek gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu tutulur): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval'leri (skills)

Zaten “agent güvenilirlik eval'leri” gibi davranan birkaç CI-safe testimiz var:

- Gerçek gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan end-to-end wizard flow'ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** skills prompt'ta listelendiğinde agent doğru skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **Workflow contract'ları:** tool sırasını, session history carryover'ını ve sandbox sınırlarını assert eden multi-turn senaryolar.

Gelecekteki eval'ler önce deterministik kalmalı:

- Tool call'ları + sırasını, skill file okumalarını ve session wiring'i assert etmek için mock provider'lar kullanan bir senaryo runner'ı.
- Skill odaklı küçük bir senaryo suite'i (kullanma vs kaçınma, gating, prompt injection).
- Opsiyonel live eval'ler (opt-in, env-gated) yalnızca CI-safe suite hazırlandıktan sonra.

## Contract testleri (plugin ve kanal şekli)

Contract testleri, her kayıtlı plugin ve kanalın kendi
interface contract'ına uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde iterasyon yapar ve
bir shape ve behavior assertion suite'i çalıştırırlar. Varsayılan `pnpm test` unit lane'i özellikle
bu shared seam ve smoke dosyalarını atlar; shared kanal veya provider yüzeylerine dokunduğunuzda
contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract'lar: `pnpm test:contracts`
- Yalnızca kanal contract'ları: `pnpm test:contracts:channels`
- Yalnızca provider contract'ları: `pnpm test:contracts:plugins`

### Kanal contract'ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, ad, capability'ler)
- **setup** - Setup wizard contract'ı
- **session-binding** - Session binding davranışı
- **outbound-payload** - Message payload yapısı
- **inbound** - Inbound message handling
- **actions** - Kanal action handler'ları
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contract'ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal status probe'ları
- **registry** - Plugin registry şekli

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

- plugin-sdk export'ları veya subpath'leri değiştirildikten sonra
- Bir kanal ya da provider plugin eklendikten veya değiştirildikten sonra
- Plugin registration veya discovery refactor edildikten sonra

Contract testleri CI'da çalışır ve gerçek API key'leri gerektirmez.

## Regression ekleme (rehberlik)

Live'da keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regression ekleyin (mock/stub provider veya exact request-shape transformation'ı yakalayın)
- Doğası gereği yalnızca live ise (rate limit'ler, auth policy'leri), live testi dar ve env var'larla opt-in tutun
- Bug'ı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - provider request conversion/replay bug'ı → doğrudan models testi
  - gateway session/history/tool pipeline bug'ı → gateway live duman testi veya CI-safe gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için örneklenmiş bir target türetir, ardından traversal-segment exec id'lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef target family eklerseniz, o testteki `classifyTargetClass` fonksiyonunu güncelleyin. Test, sınıflandırılmamış target id'lerinde özellikle başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Testing live](/tr/help/testing-live)
- [Testing updates and plugins](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
