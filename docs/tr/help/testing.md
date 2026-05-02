---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test takımları, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-02T08:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest test paketine (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu doküman bir "nasıl test ediyoruz" rehberidir:

- Her paketin neyi kapsadığı (ve özellikle neyi _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Live testlerin kimlik bilgilerini nasıl keşfettiği ve model/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, live transport yolları)** ayrı olarak belgelenmiştir:

- [QA genel bakış](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için referans.
- [QA channel](/tr/channels/qa-channel) — repo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin'i.

Bu sayfa düzenli test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde iterasyon yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA yolu: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Live paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Bir live dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya-okuma tarzı yoklama çalıştırır.
    Meta verisi `image` girdisini duyuran modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsaması: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre parçalanmış ayrı Docker live model
    matrix işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` dosyasına,
    ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/release çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker live yolu çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır,
    ardından düz bir yanıtın ve bir görüntü ekinin ACP yerine yerel Plugin bağlaması
    üzerinden yönlendiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway agent turlarını Plugin'in sahip olduğu Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, sub-agent ve Guardian yoklamalarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken sub-agent yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir sub-agent kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, sub-agent yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı çift emniyetli kontrol.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve denetim/config yazma yolunu doğrular.
- Crestodian planner Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI bulunan config'siz bir container içinde çalıştırır
    ve bulanık planner yedeğinin denetlenmiş tipli bir config yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw state dizininden başlar, yalın `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    config'i doğrular ve denetim girdilerini doğrular. Aynı Ring 0 setup yolu QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  komutunu `moonshot/kimi-k2.6` üzerinde çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve
  assistant transcript'inin normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir hatalı duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist env var'larıyla live testleri daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'i özel iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'larda ve
manuel tetiklemede mock sağlayıcılarla çalışır. `QA-Lab - All Lanes`, her gece
`main` üzerinde ve manuel tetiklemede mock parity gate, live Matrix yolu,
Convex tarafından yönetilen live Telegram yolu ve Convex tarafından yönetilen live Discord yolunu
paralel işler olarak çalıştırır. Zamanlanmış QA ve release kontrolleri Matrix'e `--profile fast`
değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi varsayılanı
`all` olarak kalır; manuel tetikleme `all` değerini `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` ve `e2ee-cli` işlerine bölebilir. `OpenClaw Release Checks`, release onayından önce parity ile
fast Matrix ve Telegram yollarını çalıştırır; release transport kontrolleri için
`mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar ve normal sağlayıcı-Plugin
başlatmasını önlerler. Bu live transport Gateway'leri bellek aramayı devre dışı bırakır;
bellek davranışı QA parity paketleri tarafından kapsanmaya devam eder.

Tam release live media parçaları
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu imajda zaten
`ffmpeg` ve `ffprobe` bulunur. Docker live model/backend parçaları, seçilen
commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` imajını kullanır; ardından her parça içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak seçilen birden çok senaryoyu izole Gateway worker'larıyla paralel çalıştırır.
    `qa-channel` varsayılan olarak eşzamanlılık 4'tür (seçilen senaryo sayısıyla sınırlıdır).
    Worker sayısını ayarlamak için `--concurrency <count>` kullanın veya eski seri yol için
    `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
    artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalıklı `mock-openai` yolunu değiştirmeden deneysel
    fixture ve protocol-mock kapsaması için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma bench'ini ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve `.artifacts/gateway-cpu-scenarios/` altında birleşik CPU gözlem
    özetini yazar.
  - Varsayılan olarak yalnızca sürdürülen sıcak CPU gözlemlerini işaretler (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa başlatma patlamaları, dakikalar süren Gateway sabitleme regresyonu gibi görünmeden
    metrik olarak kaydedilir.
  - Oluşturulmuş `dist` artifact'lerini kullanır; checkout'ta taze runtime çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçimi flag'lerini yeniden kullanır.
  - Live çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo root altında kalmalıdır, böylece guest mounted workspace üzerinden geri yazabilir.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, Docker içinde global kurar,
    etkileşimsiz OpenAI API-key onboarding çalıştırır, varsayılan olarak Telegram'ı yapılandırır,
    paketlenmiş Plugin runtime'ın başlatma dependency repair olmadan yüklendiğini doğrular,
    doctor çalıştırır ve mocked OpenAI endpoint'e karşı bir yerel agent turu çalıştırır.
  - Aynı paketli-kurulum yolunu Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime context transcript'leri için deterministik bir built-app Docker smoke testi çalıştırır.
    Gizli OpenClaw runtime context'in görünür kullanıcı turuna sızmak yerine
    görüntülenmeyen custom message olarak kalıcılaştırıldığını doğrular,
    ardından etkilenmiş bozuk bir session JSONL ekler ve
    `openclaw doctor --fix` komutunun onu bir backup ile aktif branch'e yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Bir OpenClaw paket adayını Docker içinde kurar, installed-package onboarding çalıştırır,
    Telegram'ı kurulu CLI üzerinden yapılandırır, ardından live Telegram QA yolunu
    SUT Gateway olarak o kurulu paketle yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir; registry'den kurmak yerine çözümlenmiş bir yerel tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır.
    CI/release otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı mevcutsa,
    Docker wrapper Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu yol için geçersiz kılar.
  - GitHub Actions bu yolu manuel maintainer iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Merge üzerinde çalışmaz. İş akışı
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalışma ürün kanıtı için `Package Acceptance` sunar.
  Güvenilen ref, yayımlanmış npm spec, HTTPS tarball URL'si artı SHA-256 veya başka bir çalıştırmadan tarball artifact kabul eder,
  normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E scheduler'ı
  smoke, package, product, full veya custom yol profilleriyle çalıştırır.
  Telegram QA iş akışını aynı `package-under-test` artifact'ine karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artifakt kanıtı, başka bir Actions çalıştırmasından bir tarball artifaktı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış olarak Gateway'i başlatır, ardından yapılandırma
    düzenlemeleriyle paketlenmiş kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri eksik bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik indirilebilir her
    Plugin'i açıkça kurduğunu ve ikinci yeniden başlatmanın gizli bağımlılık
    onarımını çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm temel sürümü kurar, `openclaw update --tag <candidate>`
    çalıştırmadan önce Telegram'ı etkinleştirir ve adayın
    güncelleme sonrası doctor işleminin eski Plugin bağımlılığı kalıntılarını
    harness taraflı postinstall onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketli kurulum güncelleme smoke testini Parallels konuklarında çalıştırır. Seçilen
    her platform önce istenen temel paketi kurar, ardından aynı konukta kurulu
    `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu,
    Gateway hazır oluşunu ve bir local agent dönüşünü doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifakt yolu ve
    her lane durumu için `--json` kullanın.
  - OpenAI lane'i, canlı agent-turn kanıtı için varsayılan olarak
    `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini bilinçli olarak doğrularken
    `--model <provider/model>` geçirin veya `OPENCLAW_PARALLELS_OPENAI_MODEL`
    ayarlayın.
  - Parallels aktarım takılmalarının test penceresinin kalanını tüketmemesi için
    uzun yerel çalıştırmaları bir host zaman aşımıyla sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik iç içe lane günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında yazar.
    Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log`
    dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket
    güncelleme işlerinde 10 ila 15 dakika harcayabilir; iç içe npm
    debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı ayrı Parallels macOS, Windows veya Linux smoke lane'leriyle
    paralel çalıştırmayın. Bunlar VM durumunu paylaşır ve snapshot geri yükleme,
    paket sunumu veya konuk Gateway durumu üzerinde çakışabilir.
  - Güncelleme sonrası kanıt normal paketlenmiş Plugin yüzeyini çalıştırır çünkü
    konuşma, görüntü oluşturma ve medya
    anlama gibi yetenek cepheleri, agent
    dönüşünün kendisi yalnızca basit bir metin yanıtını denetlese bile paketlenmiş runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu
    başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA lane'ini tek kullanımlık Docker destekli Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u — paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env var'ları ve artifakt düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA lane'ini, env'den alınan sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram sohbet id'si olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız
    çıkış kodu olmadan artifakt istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı göstermesi gerekir.
  - Kararlı bottan bota gözlem için her iki botta `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve observed-messages artifaktı yazar. Yanıt verme senaryoları, sürücü gönderme isteğinden gözlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma lane'leri tek bir standart sözleşmeyi paylaşır, böylece yeni taşımalar sapmaz; lane başına kapsam matrisi [QA genel bakışı → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab Convex destekli bir havuzdan özel bir kiralama alır, lane çalışırken
bu kiralama için Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env var'ları:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçili rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env var'ları:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme id'si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker secret'larını,
endpoint prefix'ini, HTTP zaman aşımını ve admin/list erişilebilirliğini secret
değerlerini yazdırmadan denetlemek için `doctor` kullanın. Betiklerde ve CI
yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan endpoint sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (yalnızca maintainer secret'ı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarılı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret'ı)
  - İstek: `{ credentialId, actorId }`
  - Başarılı: `{ status: "ok", changed, credential }`
  - Aktif kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret'ı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarılı: `{ status: "ok", credentials, count }`

Telegram kind için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet id'si dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo-yardımcı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari eşik: taşıma çalıştırıcısını paylaşılan `qa-lab` host seam üzerinde uygulamak, Plugin manifestinde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve `qa/scenarios/` altında senaryolar yazmaktır.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altında core/unit envanterleri; UI birim testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - İşlem içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Resolver ve public-surface loader testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil,
    üretilmiş küçük Plugin fixture'larıyla geniş `api.js` ve
    `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri,
    Plugin sahibi sözleşme/entegrasyon paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı lane'ler">

    - Hedeflenmemiş `pnpm test`, tek bir dev yerel kök-proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yük altındaki makinelerde tepe RSS değerini düşürür ve auto-reply/uzantı işlerinin ilgisiz takımları aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çoklu-shard izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş çalıştırmaz.
    - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel kontrol kapısıdır. Diff’i core, core testleri, uzantılar, uzantı testleri, uygulamalar, docs, release metadata, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca release metadata version bump’ları, top-level version alanı dışındaki package değişikliklerini reddeden bir guard ile hedefli version/config/root-dependency kontrolleri çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth betikleri için shell söz dizimi ve canlı Docker scheduler kuru çalıştırması. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package-yüzeyi düzenlemeleri hâlâ daha geniş guard’ları kullanır.
    - agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan import-light birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durum bilgili/runtime-ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır takımı yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, top-level core yardımcıları, top-level `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış bucket’lara sahiptir. CI, tek bir import-ağır bucket’ın tam Node kuyruğunu sahiplenmemesi için reply alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing shard’larına böler.
    - Normal PR/main CI, uzantı toplu taramasını ve yalnızca release’e özel `agentic-plugins` shard’ını bilerek atlar. Full Release Validation, release candidate’larında bu Plugin/uzantı ağırlıklı takımlar için ayrı `Plugin Prerelease` alt workflow’unu tetikler.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Message-tool keşif girdilerini veya compaction runtime
      bağlamını değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalizasyon sınırları için odaklı yardımcı regresyonları
      ekleyin.
    - Gömülü runner entegrasyon takımlarını sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu takımlar, kapsamlı id’lerin ve compaction davranışının hâlâ gerçek
      `run.ts` / `compact.ts` yollarından aktığını doğrular; yalnızca yardımcı testleri
      bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest pool ve isolation varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar boyunca izole olmayan runner’ı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve optimizer’ını korur, ancak
      paylaşılan izole olmayan runner üzerinde de çalışır.
    - Her `pnpm test` shard’ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını miras alır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalarda V8 derleme churn’ünü azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Stok V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff’in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Handoff veya push öncesinde akıllı yerel kontrol kapısına ihtiyaç duyduğunuzda
      açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. Yalnızca agent
      bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur; yalnızca daha yüksek worker sınırı kullanır.
    - Yerel worker otomatik ölçeklendirmesi bilerek muhafazakârdır ve host load average
      zaten yüksek olduğunda geri çekilir; böylece birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test
      bağlantıları değiştiğinde changed-mode yeniden çalıştırmalarının doğru kalması için projeleri/config dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen host’larda `OPENCLAW_VITEST_FS_MODULE_CACHE` etkin tutar;
      doğrudan profiling için tek bir açık cache konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profiling görünümünü
      `origin/main` sonrasındaki değişen dosyalara daraltır.
    - Shard zamanlama verisi `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Whole-config çalıştırmaları config yolunu anahtar olarak kullanır; include-pattern CI
      shard’ları, filtrelenmiş shard’ların ayrı izlenebilmesi için shard adını ekler.
    - Bir sıcak test hâlâ zamanının çoğunu başlatma import’larında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` seam’inin arkasında tutun ve
      runtime yardımcılarını yalnızca `vi.mock(...)` içinden geçirmek için deep-import yapmak yerine
      o seam’i doğrudan mock’layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, route edilmiş
      `test:changed` ile o commit’lenmiş diff için yerel kök-proje yolunu karşılaştırır
      ve wall time ile macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek
      mevcut dirty tree için benchmark çalıştırır.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform overhead’i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim takımı için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker’a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkin gerçek bir loopback Gateway başlatır
  - Diagnostic event yolu üzerinden sentetik gateway mesajı, memory ve büyük-payload churn’ü sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle kalıcılığı yardımcılarını kapsar
  - Recorder’ın sınırlı kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve oturum başına queue depth’lerin tekrar sıfıra boşaldığını assert eder
- Beklentiler:
  - CI-safe ve keyless
  - Kararlılık-regresyon takibi için dar hat; tam Gateway takımının yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki bundled-plugin E2E testleri
- Runtime varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde `isolate: false` ile Vitest `threads` kullanır.
  - Uyarlanabilir worker’lar kullanır (CI: 2’ye kadar, yerel: varsayılan olarak 1).
  - Console I/O overhead’ini azaltmak için varsayılan olarak silent mode’da çalışır.
- Yararlı override’lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı console çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çoklu-instance gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node pairing ve daha ağır networking
- Beklentiler:
  - CI’da çalışır (pipeline’da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla host üzerinde izole bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile’dan sandbox oluşturur
  - OpenClaw’ın OpenShell backend’ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway’ini ve sandbox’ı yok eder
- Yararlı override’lar:
  - Daha geniş e2e takımını manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary’sini veya wrapper script’i işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki bundled-plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Sağlayıcı format değişikliklerini, tool-calling tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-stable değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Her şey” yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak canlı çalıştırmalar hâlâ `HOME` değerini izole eder ve config/auth materyalini geçici bir test home’una kopyalar; böylece birim fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin bilinçli olarak gerçek home dizininizi kullanmasına ihtiyaç duyduğunuzda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap loglarını/Bonjour sohbetini sessize alır. Tam başlatma loglarını geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlıya özel override kullanın; testler rate limit yanıtlarında yeniden dener.
- Progress/heartbeat çıktısı:
  - Canlı takımlar artık stderr’e progress satırları yayar; böylece uzun sağlayıcı çağrıları, Vitest console capture sessizken bile görünür şekilde aktiftir.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/gateway progress satırlarının hemen stream edilmesi için Vitest console interception’ını devre dışı bırakır.
  - Doğrudan model heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi takımı çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Düzenleme mantığı/testleri: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağını / WS protokolünü / eşleştirmeyi değiştiriyorsanız: `pnpm test:e2e` ekleyin
- “botum çöktü” / sağlayıcıya özgü hatalar / araç çağırma sorunlarını ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa temas eden) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness'ı) ve canlı çalıştırmalar için kimlik bilgisi yönetimi hakkında
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Özel güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışır" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (bağlandıysa `~/.profile` dosyasını da kaynak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları, tam bir Docker taramasını pratik tutmak için varsayılan olarak daha küçük bir smoke sınırı kullanır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük ve kapsamlı taramayı
  açıkça istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` ile bir kez derler, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden bir npm tarball'ı olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı derler/yeniden kullanır. Çıplak imaj, install/update/plugin-bağımlılık hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden derlenmiş tarball'ı bağlar. İşlevsel imaj, derlenmiş uygulama işlevsellik hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam, ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını denetlerken, kaynak sınırları ağır canlı, npm-install ve çok hizmetli hatların hepsinin aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, havuz boşken zamanlayıcı yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalışır halde tutar. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker host'unda daha fazla kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, bayat OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen hatlar, paket/imaj gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paket çözer, bunu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak bu tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış yükseltme survivor matrisi, sürüm varsayılanları ve hata triage'ı için [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik derlenmiş grafiği gezer ve komut dispatch öncesi başlangıç Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını komut dispatch'ten önce içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarımlarını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımı, onboard yardımı, doctor yardımı, durum, yapılandırma şeması ve bir model listesi komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu sınıra kadar harness yalnızca yayımlanmış paket metadata boşluklarını tolere eder: atlanmış özel QA envanteri girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma metadata migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı hatalardır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama home'larını (veya çalıştırma daraltılmamışsa desteklenen tüm home'ları) bind-mount eder, ardından çalıştırmadan önce bunları container home'una kopyalar; böylece harici CLI OAuth, host kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar, `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` üzerinden katı Droid/OpenCode kapsamıyla)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball'u QA Lab'i dışarıda bıraktığı için kasıtlı olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk katılım sihirbazı (TTY, tam iskele kurma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball ilk katılım/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'unu Docker içinde global olarak kurar, env-ref ilk katılımı ve varsayılan olarak Telegram üzerinden OpenAI'yi yapılandırır, doctor'ı çalıştırır ve bir sahte OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'u `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'unu Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın doğrulanmasını yapar, ardından paket `stable` kanalına geri döner ve güncelleme durumunu denetler.
- Yükseltme sağ kalım smoke testi: `pnpm test:docker:upgrade-survivor`, ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları olan kirli bir eski kullanıcı fixture'ının üzerine paketlenmiş OpenClaw tarball'unu kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korumasını, başlangıç/durum bütçelerini denetler.
- Yayınlanmış yükseltme sağ kalım smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını seed eder, bu başlangıç çizgisini gömülü bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, bu yayınlanmış kurulumu aday tarball'a günceller, etkileşimsiz doctor'ı çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korumasını, başlangıcı, `/healthz`, `/readyz` ve RPC durum bütçelerini denetler. Bir başlangıç çizgisini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan kesin başlangıç çizgilerini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve sorun biçimli fixture'ları `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile, örneğin `reported-issues`, genişletin; Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- Oturum çalışma zamanı bağlamı smoke testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-yeniden-yazma dallarının doctor onarımını doğrular.
- Bun global kurulum smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketli görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker imajından `dist/` dizinini `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Kurucu Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm konteynerleri arasında tek bir npm önbelleğini paylaşır. Güncelleme smoke testi, aday tarball'a yükseltmeden önce stable başlangıç çizgisi olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu denetimleri, root'a ait önbellek girdilerinin kullanıcı yerel kurulum davranışını maskelememesi için yalıtılmış bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemesini `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanı silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak root Dockerfile imajını derler, yalıtılmış bir konteyner home içinde tek çalışma alanına sahip iki ajanı seed eder, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Kurulum-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki konteyner, WS kimlik doğrulama + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilir öğeleri, iframe ref'lerini ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), sahte bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şemasının reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (seed edilmiş Gateway + stdio köprüsü + ham Claude bildirim-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profil izin verme/reddetme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP alt süreç sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref'leri, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmemiş smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Yapılandırma yeniden yükleme meta verisi smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`, yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry, hareketli git ref'leri, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için değişmemiş güncelleme davranışını kapsar.

Paylaşılan işlevsel imajı elle önceden derleyip yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, betikler yerelde yoksa onu çeker. QR ve kurucu Docker testleri, paylaşılan derlenmiş uygulama çalışma zamanı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile'larını tutar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
onu konteyner içinde geçici bir workdir'e aşamalar. Bu, çalışma zamanı
imajını küçük tutarken Vitest'i tam yerel kaynak/yapılandırmanız üzerinde çalıştırmaya devam eder.
Aşama adımı, Docker canlı çalıştırmalarının makineye özgü
artifact'ları kopyalamak için dakikalar harcamaması adına `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` gibi büyük yerel-özel önbellekleri ve uygulama derleme çıktıları ile app-local `.build` veya
Gradle çıktı dizinlerini atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar, böylece gateway canlı probe'ları konteyner içinde
gerçek Telegram/Discord/vb. kanal worker'ları başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır, bu yüzden bu Docker hattından gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de geçirin.
`test:docker:openwebui` daha yüksek seviyeli bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint'leri etkinleştirilmiş bir
OpenClaw gateway konteyneri başlatır,
bu gateway'e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden oturum açar,
`/api/models` öğesinin `openclaw/default` sunduğunu doğrular, ardından Open WebUI'nin `/api/chat/completions` proxy'si üzerinden
gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) bunu Docker'laştırılmış çalıştırmalarda sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload'u yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway
konteynerini başlatır, `openclaw mcp serve` oluşturan ikinci bir konteyneri başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, outbound gönderme yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi,
ham stdio MCP frame'lerini doğrudan inceler; böylece smoke testi, belirli bir istemci SDK'sının yüzeye çıkardıklarından ziyade
köprünün gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model
anahtarı gerektirmez. Repo Docker imajını derler, konteyner içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü Pi paketi
MCP çalışma zamanı üzerinden materyalize eder, aracı yürütür, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` araçlarını tuttuğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` değerlerinin ise onları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model
anahtarı gerektirmez. Gerçek bir stdio MCP probe sunucusuyla seed edilmiş bir Gateway başlatır, yalıtılmış bir cron turu
ve bir `/subagents spawn` tek seferlik alt tur çalıştırır, ardından
MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için tutun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynak olarak yüklenir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI kimlik doğrulama bağlamaları olmadan yalnızca `OPENCLAW_PROFILE_FILE` kaynağından alınan ortam değişkenlerini doğrulamak için kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle elle geçersiz kılın
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, kapsayıcı içinde sağlayıcıları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, yeniden derleme gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, kimlik bilgilerinin profil deposundan geldiğinden emin olmak için (ortamdan değil)
- `OPENCLAW_OPENWEBUI_MODEL=...`, Open WebUI smoke testi için Gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...`, Open WebUI smoke testi tarafından kullanılan nonce denetimi istemini geçersiz kılmak için
- `OPENWEBUI_IMAGE=...`, sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için

## Dokümantasyon akıl sağlığı denetimi

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek işlem hattı” regresyonlarıdır:

- Gateway araç çağrısı (sahte OpenAI, gerçek Gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "Gateway ajan döngüsü aracılığıyla sahte bir OpenAI araç çağrısını uçtan uca çalıştırır")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırma yazar + kimlik doğrulama zorunlu kılınır): `src/gateway/gateway.test.ts` (durum: "sihirbazı ws üzerinden çalıştırır ve kimlik doğrulama belirteci yapılandırmasını yazar")

## Ajan güvenilirliği değerlendirmeleri (Skills)

Zaten “ajan güvenilirliği değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz var:

- Gerçek Gateway + ajan döngüsü üzerinden sahte araç çağrısı (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hala eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde ajan doğru Skills öğesini seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** ajan kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, kapılama, istem enjeksiyonu).
- İsteğe bağlı canlı değerlendirmeler (opt-in, ortam değişkeniyle kapılı) yalnızca CI güvenli paket hazır olduktan sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi arayüz sözleşmesine
uyduğunu doğrular. Keşfedilen tüm Plugin öğeleri üzerinde gezinir ve bir dizi
şekil ve davranış doğrulaması çalıştırır. Varsayılan `pnpm test` birim şeridi,
bu paylaşılan bağlantı ve smoke dosyalarını bilerek atlar; paylaşılan kanal
veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **plugin** - Temel Plugin şekli (kimlik, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - İleti yükü yapısı
- **inbound** - Gelen ileti işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Konu kimliği işleme
- **directory** - Dizin/kadro API’si
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi
- **catalog** - Model kataloğu API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek şekli dönüşümünü yakalama)
- Sorun doğası gereği yalnızca canlıysa (hız sınırları, kimlik doğrulama ilkeleri), canlı testi dar tutun ve ortam değişkenleriyle opt-in yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan model testi
  - Gateway oturumu/geçmişi/araç işlem hattı hatası → Gateway canlı smoke testi veya CI güvenli Gateway sahte testi
- SecretRef dolaşımı koruma rayı:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenen bir hedef türetir, ardından dolaşım segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` işlevini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde bilerek başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlıyı test etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin öğelerini test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
