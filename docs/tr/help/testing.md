---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-06T09:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'ın üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker runner kümesi vardır. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri kapsamadığı).
- Yaygın iş akışları (yerel, push öncesi, hata ayıklama) için hangi komutların çalıştırılacağı.
- Live testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, live transport hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) - mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) - `pnpm openclaw qa matrix` için referans.
- [QA kanalı](/tr/channels/qa-channel) - repo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin'i.

Bu sayfa normal test paketlerini ve Docker/Parallels runner'larını çalıştırmayı kapsar. Aşağıdaki QA'ya özel runner'lar bölümü ([QA'ya özel runner'lar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedeflenmiş çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ekstra güven istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Live paketi (modeller + gateway araç/görüntü yoklamaları): `pnpm test:live`
- Bir live dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` agent turu için
  `live_gpt54=true` ile veya Kova CPU/heap/trace artefaktları için
  `deep_profile=true` ile `OpenClaw Performance` tetikleyin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.4 hattı artefaktlarını
  `openclaw/clawgrit-reports` konumuna yayımlar. mock-provider raporu ayrıca kaynak düzeyi gateway açılışı, bellek,
  plugin-pressure, yinelenen fake-model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker live model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır.
    Metadata'sı `image` girdisi ilan eden modeller ayrıca küçük bir görüntü turu çalıştırır.
    Sağlayıcı hatalarını izole ederken ekstra yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks` ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre shard edilmiş ayrı Docker live model
    matrix işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` iş akışını
    `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/release çağırıcılarına ekleyin.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker live hattı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine native Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Gateway agent turlarını Plugin sahipliğindeki Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, alt agent ve Guardian yoklamalarını çalıştırır. Diğer Codex app-server hatalarını izole ederken
    alt agent yoklamasını `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt agent kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt agent yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı kuşak ve askı kontrolü.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve audit/config yazma yolunu doğrular.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir container içinde çalıştırır
    ve fuzzy planner fallback'inin denetlenmiş tipli config yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    config'i doğrular ve audit kayıtlarını doğrular. Aynı Ring 0 kurulum yolu QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke: `MOONSHOT_API_KEY` ayarlanmışken
  `openclaw models list --provider moonshot --json` komutunu çalıştırın, ardından
  `moonshot/kimi-k2.6` karşısında izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve asistan transcript'inin normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız vakaya ihtiyacınız olduğunda, live testleri aşağıda açıklanan allowlist env vars ile daraltmayı tercih edin.
</Tip>

## QA'ya özel runner'lar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında durur:

CI, QA Lab'i ayrılmış iş akışlarında çalıştırır. Agentic parity, bağımsız bir PR iş akışı değil,
`QA-Lab - All Lanes` ve release doğrulaması altında iç içedir.
Geniş doğrulama `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır.
Stable/default release kontrolleri kapsamlı live/Docker soak'ı `run_release_soak=true` arkasında tutar;
`full` profili soak'ı zorunlu kılar. `QA-Lab - All Lanes`
`main` üzerinde gecelik olarak ve mock parity hattı, live Matrix hattı, Convex tarafından yönetilen live Telegram hattı ve Convex tarafından yönetilen live Discord hattı paralel işler olarak manuel tetiklemeyle çalışır. Zamanlanmış QA ve release kontrolleri Matrix
`--profile fast` değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi
varsayılanı `all` kalır; manuel tetikleme `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard edebilir. `OpenClaw Release
Checks`, release onayı öncesinde parity artı fast Matrix ve Telegram hatlarını çalıştırır;
release taşıma kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar ve normal provider-plugin başlangıcından kaçınırlar. Bu live taşıma
gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA parity
paketleri tarafından kapsanmaya devam eder.

Tam release live media shard'ları
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu imajda zaten
`ffmpeg` ve `ffprobe` vardır. Docker live model/backend shard'ları, seçilen her
commit için bir kez oluşturulan paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>`
imajını kullanır, ardından her shard içinde yeniden oluşturmak yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak birden fazla seçili senaryoyu yalıtılmış
    gateway çalışanlarıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 olarak kullanır (seçili senaryo sayısıyla sınırlıdır). Çalışan
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat için
    `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, senaryo farkındalığı olan `mock-openai` hattını değiştirmeden deneysel
    fixture ve protokol taklidi kapsamı için yerel AIMock destekli bir sağlayıcı
    sunucusu başlatır.
- `pnpm test:plugins:kitchen-sink-live`
  - Canlı OpenAI Kitchen Sink Plugin sınavını QA Lab üzerinden çalıştırır. Harici
    Kitchen Sink paketini kurar, Plugin SDK yüzey envanterini doğrular,
    `/healthz` ve `/readyz` yoklamaları yapar, Gateway CPU/RSS kanıtını kaydeder,
    canlı bir OpenAI turu çalıştırır ve karşıt tanılamaları denetler.
    `OPENAI_API_KEY` gibi canlı OpenAI kimlik doğrulaması gerektirir. Hidrate
    edilmiş Testbox oturumlarında, `openclaw-testbox-env` yardımcısı mevcut
    olduğunda Testbox canlı kimlik doğrulama profilini otomatik olarak kaynak alır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç karşılaştırmasını ve küçük bir taklit QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve birleşik CPU gözlem özetini
    `.artifacts/gateway-cpu-scenarios/` altına yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler
    (`--cpu-core-warn` ve `--hot-wall-warn-ms`), böylece kısa başlangıç sıçramaları
    dakikalar süren Gateway sabitlenmesi regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarını kullanır; checkout zaten güncel çalışma zamanı
    çıktısına sahip değilse önce bir derleme çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo kökünün altında kalmalıdır, böylece konuk bağlanan çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetinin yanı sıra Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Mevcut checkout'tan bir npm tarball derler, Docker içinde global olarak kurar,
    etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır, varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin çalışma zamanının başlangıçta bağımlılık onarımı olmadan yüklendiğini doğrular, doctor çalıştırır ve taklit edilmiş bir OpenAI endpoint'ine karşı bir yerel ajan turu çalıştırır.
  - Aynı paketli kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlam transcript'leri için deterministik bir derlenmiş uygulama Docker smoke testi çalıştırır. Gizli OpenClaw çalışma zamanı bağlamının görünür kullanıcı turuna sızmak yerine gösterilmeyen özel bir mesaj olarak kalıcılaştırıldığını doğrular, ardından etkilenmiş bozuk bir oturum JSONL dosyası tohumlar ve
    `openclaw doctor --fix` komutunun bunu yedekle birlikte etkin dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından bu kurulu paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir; kayıt defterinden kurmak yerine çözümlenmiş yerel bir tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için,
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. CI içinde
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı mevcutsa,
    Docker sarmalayıcısı Convex'i otomatik olarak seçer.
  - Sarmalayıcı, Docker derleme/kurulum işi öncesinde ana makinede Telegram veya Convex kimlik bilgisi env değerlerini doğrular. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` değerini yalnızca kimlik bilgisi öncesi kurulumu özellikle hata ayıklarken ayarlayın.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u
    `NPM Telegram Beta E2E` olarak sunar. Birleştirmede çalışmaz. Workflow,
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralarını kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalıştırma ürün kanıtı için `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256 ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball yapıtı kabul eder, normalleştirilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product, full veya özel hat profilleriyle çalıştırır. Telegram QA workflow'unu aynı `package-under-test` yapıtına karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Yapıt kanıtı, başka bir Actions çalıştırmasından bir tarball yapıtı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mevcut OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış olarak Gateway'i başlatır, ardından config düzenlemeleriyle paketli kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını,
    ilk yapılandırılmış doctor onarımının eksik her indirilebilir
    Plugin'i açıkça kurduğunu ve ikinci bir yeniden başlatmanın gizli bağımlılık onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm baseline kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor'ının eski Plugin bağımlılığı kalıntılarını harness taraflı postinstall onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels konukları genelinde yerel paketli kurulum güncelleme smoke testini çalıştırır. Seçili her platform önce istenen baseline paketi kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, Gateway hazır oluşunu ve bir yerel ajan turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet yapıt yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı, varsayılan olarak canlı ajan turu kanıtı için `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini özellikle doğrularken `--model <provider/model>` geçin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels taşıma takılmalarının test penceresinin kalanını tüketememesi için uzun yerel çalıştırmaları ana makine timeout'u içine alın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyalarını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket güncelleme işinde 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri yükleme, paket sunma veya konuk Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketli Plugin yüzeyini çalıştırır çünkü konuşma, görüntü üretimi ve medya anlama gibi yetenek cepheleri, ajan turu yalnızca basit bir metin yanıtını denetlediğinde bile paketli çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout - paketli kurulumlar `qa-lab` içermez.
  - Tam CLI, profil/senaryo kataloğu, env vars ve yapıt düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env'den gelen sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id değeri sayısal Telegram chat id olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuz kiralarına katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot ve SUT botunun bir Telegram kullanıcı adı sunmasını gerektirir.
  - Kararlı bot-bot gözlemi için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve gözlemlenen mesajlar yapıtı yazar. Yanıt veren senaryolar, sürücü gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır; hat başına kapsam matrisi [QA overview → Live transport coverage](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde bulunur. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kira alır, hat çalışırken
bu kira için Heartbeat gönderir ve kapanışta kirayı serbest bırakır.

Referans Convex proje scaffold'u:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçili rol için bir sır:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI`, `ci` için
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi durumda `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (pool add/remove/list) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gizli değerleri yazdırmadan Convex site URL'sini, broker sırlarını,
uç nokta önekini, HTTP zaman aşımını ve admin/list erişilebilirliğini denetlemek
için canlı çalıştırmalardan önce `doctor` kullanın. Betiklerde ve CI
yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükendi/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram türü için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcı adıları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde yer alır. Asgari gereksinim: paylaşılan `qa-lab` host seam üzerinde taşıma çalıştırıcısını uygulayın, Plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve senaryoları `qa/scenarios/` altında yazın.

## Test paketleri (nerede ne çalışır)

Paketleri "gerçekçilik artışı" (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri özel `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözücü ve genel yüzey yükleyici testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil, üretilmiş küçük Plugin fixture'larıyla geniş `api.js` ve
    `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri
    Plugin'e ait sözleşme/entegrasyon paketlerinde yer alır.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı lane'ler">

    - Hedeflenmemiş `pnpm test`, tek bir devasa yerel kök-proje süreci yerine on iki daha küçük shard yapılandırmasını (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde en yüksek RSS değerini azaltır ve auto-reply/extension işinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch`, çok shard'lı bir izleme döngüsü pratik olmadığı için yerel kök `vitest.config.ts` proje grafiğini kullanmaya devam eder.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı lane'ler üzerinden yönlendirir; bu nedenle `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetinden kaçınır.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı lane'lere genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import-grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel denetim kapısıdır. Diff'i çekirdek, çekirdek testleri, extension'lar, extension testleri, uygulamalar, dokümanlar, sürüm meta verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm meta verisi olan sürüm artışları, paket değişikliklerini üst düzey version alanı dışında reddeden bir korumayla hedefli version/config/kök-bağımlılık denetimlerini çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı denetimler çalıştırır: canlı Docker auth betikleri için kabuk sözdizimi ve canlı Docker zamanlayıcı dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlıysa dahil edilir; bağımlılık, export, version ve diğer paket yüzeyi düzenlemeleri daha geniş korumaları kullanmaya devam eder.
    - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import-hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` lane'i üzerinden yönlendirilir; durumlu/runtime-ağır dosyalar mevcut lane'lerde kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmaları bu hafif lane'lerdeki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri, o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey çekirdek yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için özel kovalara sahiptir. CI, import-ağır tek bir kovanın tam Node kuyruğuna sahip olmaması için reply alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing shard'larına böler.
    - Normal PR/main CI, extension toplu taramasını ve yalnızca sürüme özel `agentic-plugins` shard'ını kasıtlı olarak atlar. Tam Sürüm Doğrulaması, sürüm adaylarında bu Plugin/extension-ağır paketler için ayrı `Plugin Prerelease` alt iş akışını tetikler.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - Mesaj aracı keşif girdilerini veya Compaction runtime
      bağlamını değiştirdiğinizde, iki kapsama düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı regresyonları
      ekleyin.
    - Gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca yardımcı testler
      bu entegrasyon yollarının yeterli bir ikamesi değildir.

  </Accordion>

  <Accordion title="Vitest pool ve yalıtım varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar genelinde yalıtılmamış çalıştırıcıyı kullanır.
    - Kök UI lane'i `jsdom` kurulumunu ve iyileştiricisini korur, ancak o da
      paylaşılan yalıtılmamış çalıştırıcıda çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme churn'ünü azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Stok V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari lane'leri tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyaç duyduğunuzda handoff veya push öncesinde
      açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed` varsayılan olarak ucuz kapsamlı lane'ler üzerinden yönlendirilir. Yalnızca agent
      bir harness, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi kasıtlı olarak muhafazakârdır ve host load average zaten yüksek olduğunda
      geri çekilir; bu nedenle birden çok eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test
      wiring'i değiştiğinde changed-mode yeniden çalıştırmaların doğru kalması için projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen
      host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` öğesini etkin tutar; doğrudan profil oluşturma için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-süresi raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil oluşturma görünümünü
      `origin/main` sonrasında değişen dosyalarla sınırlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      shard'ları, filtrelenmiş shard'ların ayrı ayrı izlenebilmesi için shard adını ekler.
    - Bir sıcak test hâlâ zamanının çoğunu başlatma import'larında harcadığında,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` seam arkasında tutun ve
      yalnızca `vi.mock(...)` içinden geçirmek için runtime yardımcılarını deep-import etmek yerine
      bu seam'i doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` sonucunu o commit'lenmiş diff için yerel kök-proje yoluyla karşılaştırır
      ve geçen süreyle macOS max RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek mevcut
      kirli tree'yi benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      birim paketi için runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanmış
- Kapsam:
  - Varsayılan olarak tanılama etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Sentetik gateway mesajını, belleği ve büyük-payload churn'ünü tanılama olay yolu üzerinden sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılığı bundle kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin sıfıra geri boşaldığını doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar lane; tam Gateway paketinin ikamesi değildir

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki pakete dahil Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde `isolate: false` ile Vitest `threads` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç ek yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ işlemleri
- Beklentiler:
  - CI'da çalışır (pipeline içinde etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla ana makinede yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki pakete dahil Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - "Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?"
  - Sağlayıcı biçimi değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalama
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - "Her şey" yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test home dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin gerçek home dizininizi kullanmasını bilinçli olarak istediğinizde ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını tutar, ancak ekstra `~/.profile` bildirimini bastırır ve gateway bootstrap günlüklerini/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özel): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` üzerinden canlı çalıştırmaya özel geçersiz kılma kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e gönderir; böylece uzun sağlayıcı çağrıları, Vitest konsol yakalama sessiz olsa bile görünür şekilde etkin kalır.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/gateway ilerleme satırlarının hemen akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağ işlemlerine / WS protokolüne / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- "Bot'um kapalı" / sağlayıcıya özel hatalar / araç çağırma hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex app-server
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görsel,
müzik, video, medya harness'ı) - ayrıca canlı çalıştırmalar için kimlik bilgisi yönetimi - için bkz.
[Canlı paketleri test etme](/tr/help/testing-live). Özel güncelleme ve
Plugin doğrulama kontrol listesi için bkz.
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışır" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profil-anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı mount eder (ve mount edilmişse `~/.profile` kaynağını kullanır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` olur.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam bir Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez oluşturur, OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` imajı oluşturur/yeniden kullanır. Bare imaj, install/update/plugin-dependency hatları için yalnızca Node/Git çalıştırıcısıdır; bu hatlar önceden oluşturulmuş tarball'ı mount eder. Functional imaj, built-app işlevselliği hatları için aynı tarball'ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam çalıştırma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` process slotlarını kontrol ederken, kaynak sınırları ağır canlı, npm-install ve çok servisli hatların aynı anda başlamasını engeller. Tek bir hat etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite tekrar kullanılabilir olana kadar tek başına çalışır halde tutar. Varsayılanlar 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla boş kapasite olduğunda ayarlayın. Çalıştırıcı varsayılan olarak Docker preflight yapar, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen hatlar, package/image gereksinimleri ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball ürün olarak çalışıyor mu?" sorusu için GitHub-yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paketi çözümler, onu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak o tarball'a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayınlanmış-yükseltme survivor matrisi, sürüm varsayılanları ve hata triyajı için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).
- Derleme ve sürüm kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Guard, `dist/entry.js` ve `dist/cli/run-main.js` dosyalarından statik oluşturulmuş grafiği yürür ve komut dispatch öncesi başlangıç import'ları Commander, prompt UI, undici veya logging gibi package dependency'lerini komut dispatch'ten önce import ederse başarısız olur; ayrıca paketlenmiş gateway run chunk'ını bütçe altında tutar ve bilinen soğuk gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke testi ayrıca root help, onboard help, doctor help, status, config schema ve model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesme noktasına kadar harness yalnızca gönderilmiş paket metadata boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türevi git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. `2026.4.25` sonrası paketler için bu yollar katı başarısızlıklardır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home'larını (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından dış CLI OAuth'un ana makine auth deposunu değiştirmeden token'ları yenileyebilmesi için çalıştırma öncesinde bunları container home içine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; katı Droid/OpenCode kapsamı `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sağlanır)
- CLI backend duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent'ı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball'ı QA Lab'i içermediği için kasıtlı olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, OpenAI'yi env-ref onboarding üzerinden ve varsayılan olarak Telegram'ı yapılandırır, doctor'ı çalıştırır ve mock'lanmış bir OpenAI agent turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya channel'ı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ya da `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` ile değiştirin.
- Update channel geçiş duman testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, package `stable` kanalından git `dev` kanalına geçer, kalıcı channel'ı ve Plugin post-update çalışmasını doğrular, ardından package `stable` kanalına geri döner ve update durumunu denetler.
- Upgrade survivor duman testi: `pnpm test:docker:upgrade-survivor`, paketlenmiş OpenClaw tarball'ını agent'lar, channel config'i, Plugin allowlist'leri, eski Plugin dependency durumu ve mevcut workspace/session dosyaları içeren kirli bir eski kullanıcı fixture'ı üzerine kurar. Canlı provider veya channel anahtarları olmadan package update ve non-interactive doctor çalıştırır, ardından bir loopback Gateway başlatır ve config/state korunumu ile startup/status bütçelerini denetler.
- Published upgrade survivor duman testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını seed eder, bu baseline'ı gömülü bir command recipe ile yapılandırır, ortaya çıkan config'i doğrular, yayımlanmış bu kurulumu candidate tarball'a günceller, non-interactive doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, state korunumu, startup, `/healthz`, `/readyz` ve RPC status bütçelerini denetler. Tek bir baseline'ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile override edin, aggregate scheduler'dan `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi exact local baseline'ları `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletmesini isteyin ve issue biçimli fixture'ları `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile genişletin; reported-issues kümesi, automatic external OpenClaw Plugin install repair için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar, `last-stable-4` veya `all-since-2026.4.23` gibi meta baseline token'larını çözer ve Full Release Validation, release-soak package gate'i `last-stable-4 2026.4.23 2026.5.2 2026.4.15` artı `reported-issues` olarak genişletir.
- Session runtime context duman testi: `pnpm test:docker:session-runtime-context`, gizli runtime context transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite branch'lerinin doctor onarımını doğrular.
- Bun global install duman testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` çıktısının takılmak yerine bundled image provider'ları döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host build'i `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `dist/` dizinini oluşturulmuş bir Docker image'ından `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile kopyalayın.
- Installer Docker duman testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm cache paylaşır. Update duman testi, candidate tarball'a upgrade etmeden önce stable baseline olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'daki Install Smoke workflow'unun `update_baseline_version` girdisiyle override edin. Non-root installer denetimleri, root'a ait cache girdilerinin user-local install davranışını maskelememesi için izole bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache'ini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global update'i `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Agents delete shared workspace CLI duman testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak root Dockerfile image'ını oluşturur, izole bir container home içinde tek workspace'e sahip iki agent seed eder, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş workspace davranışını doğrular. Install-smoke image'ını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway networking (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot duman testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E image'ını ve bir Chromium katmanını oluşturur, Chromium'u raw CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP role snapshot'larının link URL'lerini, cursor-promoted tıklanabilirleri, iframe ref'lerini ve frame metadata'sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), mock'lanmış bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` seviyesinden `low` seviyesine yükselttiğini doğrular, ardından provider schema reject'i zorlar ve raw detail'in Gateway günlüklerinde göründüğünü denetler.
- MCP channel bridge (seed edilmiş Gateway + stdio bridge + raw Claude notification-frame duman testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (gerçek stdio MCP sunucusu + gömülü Pi profile allow/deny duman testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (gerçek Gateway + izole cron ve one-shot subagent çalıştırmalarından sonra stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (local path, `file:`, hoisted dependency'lerle npm registry, git moving refs, ClawHub kitchen-sink, marketplace update'leri ve Claude-bundle enable/inspect için install/update duman testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink package/runtime çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile override edin. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin update unchanged duman testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix duman testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'ını boş bir container'a kurar, bir npm Plugin'i kurar, enable/disable geçişi yapar, yerel bir npm registry üzerinden upgrade ve downgrade eder, kurulu kodu siler, ardından uninstall'ın stale state'i hâlâ kaldırdığını doğrularken her lifecycle aşaması için RSS/CPU metriklerini günlüğe yazar.
- Config reload metadata duman testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`, local path, `file:`, hoisted dependency'lerle npm registry, git moving refs, ClawHub fixture'ları, marketplace update'leri ve Claude-bundle enable/inspect için install/update duman testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için unchanged update davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, resource-tracked npm Plugin install, enable, disable, upgrade, downgrade ve missing-code uninstall'ı kapsar.

Paylaşılan functional image'ı elle önceden oluşturup yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü image override'ları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan image'ı gösterdiğinde, betikler image zaten yerelde yoksa onu pull eder. QR ve installer Docker testleri, paylaşılan built-app runtime yerine package/install davranışını doğruladıkları için kendi Dockerfile'larını tutar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
container içindeki geçici bir workdir'e hazırlar. Bu, runtime
imajını küçük tutarken Vitest'i yine de tam olarak yerel source/config'inize karşı çalıştırır.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artifact'leri kopyalamak için
dakikalar harcamaması amacıyla `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya yerel `.build` ya da
Gradle output dizinleri gibi büyük, yalnızca yerel cache'leri ve uygulama build output'larını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı yoklamaları container içinde
gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle o Docker lane'inde gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint'leri etkinleştirilmiş
bir OpenClaw gateway container'ı başlatır,
bu gateway'e karşı pinned bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` öğesinin `openclaw/default` sunduğunu doğrular, ardından Open WebUI'nin
`/api/chat/completions` proxy'si üzerinden gerçek bir chat isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker'ın
Open WebUI imajını çekmesi ve Open WebUI'nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu lane kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) Dockerized çalıştırmalarda bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` bilerek deterministic yapıdadır ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
container'ını boot eder, `openclaw mcp serve` başlatan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata'sını,
canlı event queue davranışını, outbound send routing'i ve gerçek stdio MCP bridge üzerinden Claude tarzı kanal +
permission bildirimlerini doğrular. Bildirim kontrolü
ham stdio MCP frame'lerini doğrudan inceler; böylece smoke, belirli bir client SDK'nin tesadüfen yüzeye çıkardığını değil,
bridge'in gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministic yapıdadır ve canlı bir
model anahtarına ihtiyaç duymaz. Repo Docker imajını build eder, container içinde gerçek bir stdio MCP probe server başlatır,
bu server'ı gömülü Pi bundle
MCP runtime üzerinden materialize eder, tool'u yürütür, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` tool'larını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministic yapıdadır ve canlı bir model
anahtarına ihtiyaç duymaz. Gerçek bir stdio MCP probe server ile seed edilmiş bir Gateway başlatır, izole bir cron turn ve bir
`/subagents spawn` tek seferlik child turn çalıştırır, ardından
MCP child process'inin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu script'i regression/debug workflow'ları için saklayın. ACP thread routing doğrulaması için yeniden gerekebilir; bu yüzden silmeyin.

Kullanışlı env var'lar:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna mount edilir ve testler çalıştırılmadan önce sourced edilir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici config/workspace dizinleri ve harici CLI auth mount'ları olmadan yalnızca `OPENCLAW_PROFILE_FILE` üzerinden sourced edilen env var'ları doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde cached CLI install'ları için `/home/node/.npm-global` konumuna mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış provider çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle elle override edin
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` container içinde provider'ları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1` rebuild gerektirmeyen yeniden çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` creds'in env'den değil profile store'dan geldiğinden emin olmak için
- `OPENCLAW_OPENWEBUI_MODEL=...` Open WebUI smoke için gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...` Open WebUI smoke tarafından kullanılan nonce-check prompt'unu override etmek için
- `OPENWEBUI_IMAGE=...` pinned Open WebUI image tag'ini override etmek için

## Docs sağlamlık kontrolü

Doc düzenlemelerinden sonra docs kontrollerini çalıştırın: `pnpm check:docs`.
In-page heading kontrolleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Bunlar gerçek provider'lar olmadan "gerçek pipeline" regression'larıdır:

- Gateway tool calling (mock OpenAI, gerçek gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability eval'ları (skills)

"Agent reliability eval'ları" gibi davranan birkaç CI-safe testimiz zaten var:

- Gerçek gateway + agent loop üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Session wiring ve config etkilerini doğrulayan end-to-end wizard flow'ları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt'ta listelendiğinde agent doğru Skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/arg'ları izliyor mu?
- **Workflow contract'ları:** tool sırası, session history carryover ve sandbox sınırlarını assert eden multi-turn senaryolar.

Gelecekteki eval'lar önce deterministic kalmalıdır:

- Tool call'ları + sırasını, skill file okumalarını ve session wiring'i assert etmek için mock provider'lar kullanan bir scenario runner.
- Skill odaklı küçük bir senaryo suite'i (kullanma ve kaçınma, gating, prompt injection).
- İsteğe bağlı canlı eval'lar (opt-in, env-gated) yalnızca CI-safe suite hazır olduktan sonra.

## Contract testleri (Plugin ve kanal şekli)

Contract testleri, kayıtlı her Plugin ve kanalın kendi
interface contract'ına uyduğunu doğrular. Bulunan tüm Plugin'ler üzerinde iterasyon yapar ve bir
shape ve behavior assertion suite'i çalıştırırlar. Varsayılan `pnpm test` unit lane'i bilerek
bu paylaşılan seam ve smoke dosyalarını atlar; paylaşılan kanal veya provider surface'lerine dokunduğunuzda
contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract'lar: `pnpm test:contracts`
- Yalnızca kanal contract'ları: `pnpm test:contracts:channels`
- Yalnızca provider contract'ları: `pnpm test:contracts:plugins`

### Kanal contract'ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, name, capabilities)
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

- plugin-sdk export'larını veya subpath'lerini değiştirdikten sonra
- Bir kanal veya provider Plugin'i ekledikten ya da değiştirdikten sonra
- Plugin registration veya discovery refactor işleminden sonra

Contract testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regression ekleme (rehberlik)

Canlıda keşfedilen bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regression ekleyin (mock/stub provider veya tam request-shape transformation'ını capture edin)
- Doğası gereği yalnızca canlıysa (rate limit'ler, auth policy'leri), canlı testi dar tutun ve env var'lar üzerinden opt-in yapın
- Hatanın yakalandığı en küçük layer'ı hedeflemeyi tercih edin:
  - provider request conversion/replay bug → doğrudan models test
  - gateway session/history/tool pipeline bug → gateway live smoke veya CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry metadata'sından (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için bir örnek hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini assert eder.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef target family eklerseniz, o testteki `classifyTargetClass` öğesini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için sınıflandırılmamış target id'lerinde bilerek başarısız olur.

## İlgili

- [Testing live](/tr/help/testing-live)
- [Testing updates and plugins](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
