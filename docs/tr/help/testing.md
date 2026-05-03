---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-03T08:57:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest test paketine (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcıları kümesine sahiptir. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, canlı taşıma hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakış](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA kanalı](/tr/channels/qa-channel) — depo destekli senaryolar tarafından kullanılan sentetik taşıma Plugin’i.

Bu sayfa, normal test paketlerini ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA’ya özel çalıştırıcılar bölümü ([QA’ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güvence istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefle: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` ajan turu için `live_gpt54=true` veya Kova CPU/heap/trace artefaktları için `deep_profile=true` ile `OpenClaw Performance` tetikleyin. Günlük zamanlanmış çalıştırmalar, `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.4 hat artefaktlarını `openclaw/clawgrit-reports` içinde yayımlar. mock-provider raporu ayrıca kaynak düzeyi Gateway başlatma, bellek, Plugin baskısı, tekrarlanan fake-model hello-loop ve CLI başlatma sayılarını içerir.
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı yoklama çalıştırır. Metaverisi `image` girdisini duyuran modeller ayrıca küçük bir görüntü turu çalıştırır. Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel `OpenClaw Release Checks`, her ikisi de `include_live_suites: true` ile yeniden kullanılabilir canlı/E2E iş akışını çağırır; bu, sağlayıcıya göre parçalanmış ayrı Docker canlı model matrix işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `include_live_suites: true` ve `live_models_only: true` ile `OpenClaw Live And E2E Checks (Reusable)` tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve bunun zamanlanmış/sürüm çağırıcılarına ekleyin.
- Yerel Codex bağlı sohbet duman testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker canlı hattı çalıştırır, `/codex bind` ile sentetik bir Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve görüntü ekinin ACP yerine yerel Plugin bağlaması üzerinden yönlendirildiğini doğrular.
- Codex app-server harness duman testi: `pnpm test:docker:live-codex-harness`
  - Gateway ajan turlarını Plugin’e ait Codex app-server harness üzerinden çalıştırır, `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü, cron MCP, alt ajan ve Guardian yoklamalarını çalıştırır. Diğer Codex app-server hatalarını izole ederken alt ajan yoklamasını `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan kontrolü için diğer yoklamaları devre dışı bırakın: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadığı sürece bu, alt ajan yoklamasından sonra çıkar.
- Crestodian kurtarma komutu duman testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı, ek güvenlikli kontrol. `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır, `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker duman testi: `pnpm test:docker:crestodian-planner`
  - Crestodian’ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir konteynerde çalıştırır ve bulanık planlayıcı yedeğinin denetlenmiş, tipli bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker duman testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu Crestodian’a yönlendirir, kurulum/model/ajan/Discord Plugin + SecretRef yazımlarını uygular, yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu QA Lab içinde de `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet duman testi: `MOONSHOT_API_KEY` ayarlı iken `openclaw models list --provider moonshot --json` çalıştırın, ardından `moonshot/kimi-k2.6` üzerinde izole bir `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` çalıştırın. JSON’un Moonshot/K2.6 raporladığını ve asistan transkriptinin normalleştirilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir başarısız vakaya ihtiyacınız olduğunda, canlı testleri aşağıda açıklanan allowlist env var’ları üzerinden daraltmayı tercih edin.
</Tip>

## QA’ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyacınız olduğunda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab’i özel iş akışlarında çalıştırır. Ajanik parite, bağımsız bir PR iş akışı değil, `QA-Lab - All Lanes` ve sürüm doğrulaması altında iç içedir. Geniş doğrulama `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır. `QA-Lab - All Lanes`, mock parite hattı, canlı Matrix hattı, Convex yönetimli canlı Telegram hattı ve Convex yönetimli canlı Discord hattı paralel işler olarak `main` üzerinde gecelik ve manuel tetiklemeden çalışır. Zamanlanmış QA ve sürüm kontrolleri Matrix `--profile fast` değerini açıkça geçirirken, Matrix CLI ve manuel iş akışı girdisi varsayılanı `all` olarak kalır; manuel tetikleme `all` değerini `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine parçalayabilir. `OpenClaw Release Checks`, sürüm onayından önce pariteyi, hızlı Matrix ve Telegram hatlarını çalıştırır; sürüm taşıma kontrolleri için `mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar ve normal sağlayıcı-Plugin başlangıcından kaçınırlar. Bu canlı taşıma Gateway’leri bellek aramasını devre dışı bırakır; bellek davranışı QA parite paketleri tarafından kapsanmaya devam eder.

Tam sürüm canlı medya parçaları, zaten `ffmpeg` ve `ffprobe` içeren `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker canlı model/arka uç parçaları, seçilen commit başına bir kez oluşturulan paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` görüntüsünü kullanır, ardından her parça içinde yeniden oluşturmak yerine `OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak, yalıtılmış gateway işçileriyle seçilen birden fazla senaryoyu paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılığı 4 yapar (seçilen senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için `--concurrency <count>` kullanın veya eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler. `aimock`, senaryo farkındalığı olan `mock-openai` hattının yerini almadan deneysel fixture ve protokol mock kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlangıç benchmark'ını ve küçük bir mock QA Lab senaryo paketini (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) çalıştırır ve `.artifacts/gateway-cpu-scenarios/` altında birleşik bir CPU gözlem özeti yazar.
  - Varsayılan olarak yalnızca sürekli yüksek CPU gözlemlerini işaretler (`--cpu-core-warn` ve `--hot-wall-warn-ms`), böylece kısa başlangıç patlamaları dakikalar süren Gateway peg regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Derlenmiş `dist` yapıtlarını kullanır; checkout zaten güncel runtime çıktısına sahip değilse önce bir derleme çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır, böylece konuk bağlanan çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu ve özetinin yanı sıra Multipass günlüklerini `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin runtime'ının başlangıç bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor çalıştırır ve mock'lanmış bir OpenAI uç noktasına karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime context transcript'leri için belirleyici bir derlenmiş uygulama Docker smoke testi çalıştırır. Gizli OpenClaw runtime context'inin görünür kullanıcı turuna sızmak yerine görüntülenmeyen özel bir mesaj olarak kalıcılaştırıldığını doğrular, ardından etkilenen bozuk bir oturum JSONL'si seed eder ve `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'i çalıştırır, Telegram'ı kurulu CLI üzerinden yapılandırır, ardından o kurulu paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanılır; kayıt defterinden kurmak yerine çözümlenmiş yerel bir tarball test etmek için `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/sürüm otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. CI içinde `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı varsa Docker sarmalayıcı Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için paylaşılan `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow, `qa-live-shared` ortamını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- GitHub Actions ayrıca bir aday pakete karşı yan çalıştırma ürün kanıtı için `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256 ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artifact kabul eder, normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product, full veya custom hat profilleriyle çalıştırır. Telegram QA workflow'unu aynı `package-under-test` yapıtına karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış olarak Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketli kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri yok bıraktığını, ilk yapılandırılmış doctor onarımının eksik her indirilebilir Plugin'i açıkça kurduğunu ve ikinci bir yeniden başlatmanın gizli bağımlılık onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor'ının legacy Plugin bağımlılığı kalıntılarını harness tarafı postinstall onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketli kurulum güncelleme smoke testini Parallels konukları üzerinde çalıştırır. Seçilen her platform önce istenen baseline paketi kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, Gateway hazır oluşunu ve bir yerel agent turunu doğrular.
  - Tek bir konuk üzerinde iterasyon yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifact yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı varsayılan olarak canlı agent turu kanıtı için `openai/gpt-5.5` kullanır. Başka bir OpenAI modelini bilinçli olarak doğrularken `--model <provider/model>` iletin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Uzun yerel çalıştırmaları bir ana makine timeout'u içine sarın, böylece Parallels aktarım takılmaları test penceresinin geri kalanını tüketemez:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor ve paket güncelleme işinde 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri yükleme, paket sunma veya konuk Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt normal paketli Plugin yüzeyini çalıştırır, çünkü konuşma, görüntü oluşturma ve medya anlama gibi capability facade'ları agent turunun kendisi yalnızca basit bir metin yanıtını kontrol etse bile paketli runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı Matrix canlı QA hattını çalıştırır. Yalnızca kaynak checkout'u — paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env değişkenleri ve artifact yerleşimi: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, env'den alınan sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram chat id'si olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış lease'leri seçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve observed-messages artifact yazar. Yanıtlayan senaryolar, sürücü gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı aktarım hatları, yeni aktarımların sapmaması için tek bir standart sözleşme paylaşır; hat başına kapsam matrisi [QA genel bakışı → Canlı aktarım kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde yer alır. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu lease için Heartbeat gönderir ve kapanışta lease'i serbest bırakır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI içinde varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme id'si)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker secret'larını, endpoint önekini, HTTP timeout'unu ve admin/liste erişilebilirliğini secret değerleri yazdırmadan kontrol etmek için `doctor` kullanın. Betikler ve CI yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

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

Telegram türü için yük şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcılarına ilişkin mimari ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) bölümünde bulunur. Asgari gereklilik: taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine sınırında uygulamak, Plugin manifestinde `qaRunners` bildirmek, `openclaw qa <runner>` olarak bağlamak ve `qa/scenarios/` altında senaryolar yazmaktır.

## Test paketleri (nerede ne çalışır)

Paketleri "artan gerçekçilik" (ve artan kararsızlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedefsiz çalıştırmalar `vitest.full-*.config.ts` parça kümesini kullanır ve paralel zamanlama için çok projeli parçaları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri ayrılmış `unit-ui` parçasında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulaması, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, gerçek paketlenmiş Plugin kaynak API'leriyle değil, oluşturulmuş küçük Plugin fixture'larıyla geniş `api.js` ve
    `runtime-api.js` geri dönüş davranışını kanıtlamalıdır. Gerçek Plugin API yükleri
    Plugin sahibinin sözleşme/entegrasyon paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projeler, parçalar ve kapsamlı hatlar">

    - Hedefsiz `pnpm test`, tek bir dev yerel kök-proje süreci yerine on iki daha küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/Plugin işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlatma maliyetini ödemekten kaçınır.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel denetim kapısıdır. Farkı çekirdek, çekirdek testleri, Plugin'ler, Plugin testleri, uygulamalar, dokümanlar, sürüm meta verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen tip denetimi, lint ve koruma komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm meta verisi içeren sürüm artışları, üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir korumayla birlikte hedefli sürüm/yapılandırma/kök-bağımlılık denetimleri çalıştırır.
    - Canlı Docker ACP koşum düzenlemeleri odaklı denetimler çalıştırır: canlı Docker kimlik doğrulama betikleri için kabuk sözdizimi ve canlı Docker zamanlayıcı kuru çalıştırması. `package.json` değişiklikleri yalnızca fark `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, dışa aktarma, sürüm ve diğer paket yüzeyi düzenlemeleri daha geniş korumaları kullanmaya devam eder.
    - Aracılardan, komutlardan, Plugin'lerden, auto-reply yardımcılarından, `plugin-sdk` ve benzeri saf yardımcı alanlardan içe aktarması hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da değişen mod çalıştırmalarını bu hafif hatlardaki açık kardeş testlerle eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış kovalara sahiptir. CI, içe aktarma açısından ağır tek bir kovanın tam Node kuyruğunu sahiplenmemesi için reply alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing parçalarına böler.
    - Normal PR/main CI, Plugin toplu taramasını ve yalnızca sürüme özel `agentic-plugins` parçasını bilinçli olarak atlar. Tam Sürüm Doğrulaması, sürüm adaylarında bu Plugin/Plugin ağırlıklı paketler için ayrı `Plugin Prerelease` alt iş akışını tetikler.

  </Accordion>

  <Accordion title="Yerleşik çalıştırıcı kapsamı">

    - Mesaj aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı regresyonlar ekleyin.
    - Yerleşik çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek
      `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular; yalnızca yardımcı testler
      bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve izolasyon varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve canlı yapılandırmalar genelinde izole olmayan çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve iyileştiricisini korur, ancak o da
      paylaşılan izole olmayan çalıştırıcıda çalışır.
    - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Standart V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Ön işleme kancası yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden sahneler ve
      lint, tip denetimi veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyaç duyduğunuzda, devir veya push öncesinde
      `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca aracı
      bir koşum, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek bir işçi sınırıyla.
    - Yerel işçi otomatik ölçeklendirmesi bilinçli olarak muhafazakârdır ve
      ana makine yük ortalaması zaten yüksek olduğunda geri çekilir; böylece eşzamanlı birden çok
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test bağlantıları değiştiğinde değişen mod yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini etkin tutar; doğrudan profil çıkarma için tek bir açık önbellek konumu istiyorsanız
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest içe aktarma süresi raporlamasını ve
      içe aktarma dökümü çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil görünümünü
      `origin/main` tarihinden beri değişen dosyalarla sınırlar.
    - Parça zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tam yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      parçaları, filtrelenmiş parçaların ayrı izlenebilmesi için parça adını ekler.
    - Sıcak bir test zamanının çoğunu hâlâ başlangıç içe aktarmalarında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` sınırının arkasında tutun ve
      yalnızca `vi.mock(...)` üzerinden geçirmek için çalışma zamanı yardımcılarını derin içe aktarmak yerine
      bu sınırı doğrudan taklit edin.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` komutunu o işlenmiş fark için yerel kök-proje yolu ile karşılaştırır ve duvar süresi ile macOS maksimum RSS değerini yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek mevcut
      kirli ağacı kıyaslar.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıç ve dönüştürme yükü için
      ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken
      birim paketi için çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek işçiye zorlanmış
- Kapsam:
  - Varsayılan olarak tanılamalar etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Sentetik gateway mesajı, bellek ve büyük-yük döngüsünü tanılama olay yolu üzerinden sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra boşaldığını doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway paketinin ikamesi değildir

### E2E (Gateway duman testi)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş-Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlamalı işçiler kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - İşçi sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlı).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI'da çalışır (iş hattında etkinleştirildiğinde)
  - Gerçek anahtar gerektirmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç duman testi

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla ana makinede yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile’dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw’ın OpenShell arka ucunu çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway’ini ve sandbox’ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyasını veya sarmalayıcı betiğini göstermek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketli-Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalamak
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “Her şey” yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak olarak kullanır.
- Varsayılan olarak, canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar; böylece birim fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Yalnızca canlı testlerin gerçek ana dizininizi kullanmasına bilinçli olarak ihtiyaç duyduğunuzda `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway önyükleme günlüklerini/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özel): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` ile canlıya özel geçersiz kılma kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık stderr’e ilerleme satırları yayar; böylece uzun sağlayıcı çağrıları Vitest konsol yakalaması sessizken bile görünür biçimde aktiftir.
  - `vitest.live.config.ts`, Vitest konsol araya girmesini devre dışı bırakır; böylece sağlayıcı/Gateway ilerleme satırları canlı çalıştırmalar sırasında hemen akar.
  - Doğrudan-model Heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/sonda Heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok fazla değişiklik yaptıysanız `pnpm test:coverage` da çalıştırın)
- Gateway ağ iletişimine / WS protokolüne / eşlemeye dokunma: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü arızalar / araç çağırma hata ayıklaması: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama-sunucusu
harness’ı ve tüm medya-sağlayıcı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya harness’ı) ve canlı çalıştırmalar için kimlik bilgisi işleme hakkında
[Canlı paketleri test etme](/tr/help/testing-live) bölümüne bakın. Ayrılmış güncelleme ve
Plugin doğrulama kontrol listesi için
[Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

## Docker çalıştırıcıları (isteğe bağlı "Linux’ta çalışıyor" denetimleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker görüntüsü içinde yalnızca eşleşen profil-anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` dosyasını kaynak olarak kullanır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Açıkça daha büyük kapsamlı taramayı
  istediğinizde bu env var’ları geçersiz kılın.
- `test:docker:all`, canlı Docker görüntüsünü `test:docker:live-build` üzerinden bir kez oluşturur, `scripts/package-openclaw-for-docker.mjs` aracılığıyla OpenClaw’ı bir npm tarball olarak bir kez paketler, ardından iki `scripts/e2e/Dockerfile` görüntüsü oluşturur/yeniden kullanır. Yalın görüntü yalnızca kurulum/güncelleme/Plugin-bağımlılık hatları için Node/Git çalıştırıcısıdır; bu hatlar önceden oluşturulmuş tarball’ı bağlar. İşlevsel görüntü, yerleşik uygulama işlevsellik hatları için aynı tarball’ı `/app` içine kurar. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam çalışma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını denetlerken, kaynak sınırları ağır canlı, npm-install ve çoklu-hizmet hatlarının hepsinin aynı anda başlamasını engeller. Tek bir hat etkin sınırların üzerinde daha ağırsa, zamanlayıcı havuz boşken onu yine de başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırmaya devam eder. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön denetimi yapar, eski OpenClaw E2E container’larını kaldırır, her 30 saniyede bir durum yazdırır, başarılı hat sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu süreleri kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat bildirimini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçili hatlar, paket/görüntü ihtiyaçları ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub’a özgü paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paket çözer, bunu `package-under-test` olarak yükler, ardından seçili ref’i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E hatlarını tam olarak bu tarball’a karşı çalıştırır. Profiller kapsam genişliğine göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış-yükseltme hayatta kalan matrisi, sürüm varsayılanları ve arıza triyajı için [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.
- Derleme ve sürüm denetimleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik yerleşik grafiği dolaşır ve komut yönlendirmeden önce Commander, prompt UI, undici veya günlükleme gibi paket bağımlılıkları ön-yönlendirme başlangıcında içe aktarılırsa başarısız olur; ayrıca paketli Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarımlarını reddeder. Paketlenmiş CLI smoke testi ayrıca kök yardımını, onboard yardımını, doctor yardımını, durumu, yapılandırma şemasını ve bir model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu kesim tarihine kadar harness yalnızca yayımlanmış-paket meta verisi boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball’dan türetilmiş git fixture’ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum-kaydı konumları, eksik marketplace kurulum-kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı başarısızlıklardır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı-model Docker çalıştırıcıları ayrıca yalnızca gereken CLI kimlik doğrulama ana dizinlerini (veya çalışma daraltılmamışsa desteklenen tümünü) bind-mount eder, ardından çalıştırmadan önce bunları container ana dizinine kopyalar; böylece harici-CLI OAuth, ana makine kimlik doğrulama deposunu değiştirmeden token’ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama duman testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar, Droid/OpenCode için katı kapsam `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sağlanır)
- CLI arka uç duman testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama sunucusu donanımı duman testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik duman testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball'u QA Lab'i atladığı için bilinçli olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı duman testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk kurulum sihirbazı (TTY, tam iskele oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball ilk kurulum/kanal/ajan duman testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'unu Docker'da global olarak kurar, env-ref ilk kurulumu ve varsayılan olarak Telegram ile OpenAI'yi yapılandırır, doctor çalıştırır ve bir taklit OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'u `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme duman testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'unu Docker'da global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve güncelleme sonrası Plugin çalışmasının doğruluğunu denetler, ardından tekrar paket `stable` kanalına döner ve güncelleme durumunu kontrol eder.
- Yükseltme sağ kalım duman testi: `pnpm test:docker:upgrade-survivor`, ajanlar, kanal yapılandırması, Plugin izin listeleri, eski Plugin bağımlılık durumu ve mevcut çalışma alanı/oturum dosyaları içeren kirli bir eski kullanıcı fikstürü üzerine paketlenmiş OpenClaw tarball'unu kurar. Canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesi ve etkileşimsiz doctor çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunmasını, başlatma/durum bütçelerini kontrol eder.
- Yayınlanmış yükseltme sağ kalım duman testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyaları tohumlar, bu taban çizgisini gömülü bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, yayınlanmış bu kurulumu aday tarball'a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'leri, durum korunmasını, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini kontrol eder. Tek bir taban çizgisini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan `all-since-2026.4.23` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin taban çizgilerini genişletmesini isteyin ve `reported-issues` gibi `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile sorun biçimli fikstürleri genişletin; reported-issues kümesi, otomatik harici OpenClaw Plugin kurulum onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- Oturum çalışma zamanı bağlamı duman testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transkript kalıcılığını ve etkilenen yinelenmiş prompt-yeniden yazma dallarının doctor onarımını doğrular.
- Bun global kurulum duman testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketli görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker imajından `dist/` kopyalamak için `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` kullanın.
- Kurucu Docker duman testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm önbelleği paylaşır. Güncelleme duman testi, aday tarball'a yükseltmeden önce kararlı taban çizgisi olarak varsayılan npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu kontrolleri, root sahipli önbellek girdilerinin kullanıcı-yerel kurulum davranışını maskelememesi için izole bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemesini `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanlar paylaşılan çalışma alanını silme CLI duman testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile imajını derler, izole bir container home içinde tek çalışma alanına sahip iki ajan tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ bağlantısı (iki container, WS kimlik doğrulaması + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP anlık görüntü duman testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E imajını ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilirleri, iframe referanslarını ve çerçeve meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal akıl yürütme regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway üzerinden taklit bir OpenAI sunucusu çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` seviyesinden `low` seviyesine yükselttiğini doğrular, ardından sağlayıcı şemasının reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü kontrol eder.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude bildirim-çerçevesi duman testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paketi MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme duman testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/alt ajan MCP temizliği (gerçek Gateway + izole cron ve tek seferlik alt ajan çalıştırmalarından sonra stdio MCP alt süreç kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (yerel path, `file:`, hoisted bağımlılıkları olan npm registry, git moving refs, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme duman testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fikstür sunucusu kullanır.
- Plugin güncelleme değişmedi duman testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin yaşam döngüsü matrisi duman testi: `pnpm test:docker:plugin-lifecycle-matrix`, paketlenmiş OpenClaw tarball'unu çıplak bir container'a kurar, bir npm Plugin'i kurar, etkinleştirme/devre dışı bırakmayı açıp kapatır, yerel bir npm registry üzerinden yükseltir ve düşürür, kurulu kodu siler, ardından her yaşam döngüsü aşaması için RSS/CPU metriklerini günlüğe yazarken kaldırmanın eski durumu yine de temizlediğini doğrular.
- Yapılandırma yeniden yükleme meta verisi duman testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin'ler: `pnpm test:docker:plugins`, yerel path, `file:`, hoisted bağımlılıkları olan npm registry, git moving refs, ClawHub fikstürleri, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme duman testini kapsar. `pnpm test:docker:plugin-update`, kurulu Plugin'ler için değişmemiş güncelleme davranışını kapsar. `pnpm test:docker:plugin-lifecycle-matrix`, kaynak izlemeli npm Plugin kurulumu, etkinleştirme, devre dışı bırakma, yükseltme, düşürme ve eksik-kod kaldırmayı kapsar.

Paylaşılan işlevsel imajı elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü imaj geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imajı gösterdiğinde, betikler imaj zaten yerelde değilse onu çeker. QR ve kurucu Docker testleri, paylaşılan derlenmiş-uygulama çalışma zamanı yerine paket/kurulum davranışını doğruladıkları için kendi Dockerfile'larını korur.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve konteyner içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı imajını küçük tutarken Vitest'i tam olarak yerel kaynak/yapılandırmanız üzerinde çalıştırmayı sürdürür. Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artifaktları kopyalamaya dakikalar harcamaması için `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya yerel `.build` ya da Gradle çıktı dizinleri gibi büyük, yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı yoklamaları konteyner içinde gerçek Telegram/Discord/vb. kanal çalışanlarını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle Gateway canlı kapsamını bu Docker kulvarından daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de aktarın.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş bir OpenClaw Gateway konteyneri başlatır, bu Gateway'e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden oturum açar, `/api/models` uç noktasının `openclaw/default` değerini sunduğunu doğrular ve ardından Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker'ın Open WebUI imajını çekmesi ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu kulvar kullanılabilir bir canlı model anahtarı bekler ve Docker'laştırılmış çalıştırmalarda bunu sağlamanın birincil yolu `OPENCLAW_PROFILE_FILE` (`~/.profile` varsayılan) değeridir.
Başarılı çalıştırmalar `{ "ok": true, "model": "openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir Telegram, Discord veya iMessage hesabı gerektirmez. Seed edilmiş bir Gateway konteyneri başlatır, `openclaw mcp serve` üreten ikinci bir konteyner başlatır, ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim denetimi ham stdio MCP karelerini doğrudan inceler; böylece smoke testi, yalnızca belirli bir istemci SDK'sının göstermiş olduğu şeyi değil, köprünün gerçekte ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarı gerektirmez. Repo Docker imajını derler, konteyner içinde gerçek bir stdio MCP yoklama sunucusu başlatır, bu sunucuyu gömülü Pi paketi MCP çalışma zamanı üzerinden somutlaştırır, aracı yürütür ve ardından `minimal` ile `tools.deny: ["bundle-mcp"]` bunları filtrelerken `coding` ve `messaging` yapılandırmalarının `bundle-mcp` araçlarını koruduğunu doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarı gerektirmez. Gerçek bir stdio MCP yoklama sunucusuyla seed edilmiş bir Gateway başlatır, yalıtılmış bir cron dönüşü ve tek seferlik bir `/subagents spawn` alt dönüşü çalıştırır, ardından MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için tutun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir; bu nedenle silmeyin.

Yararlı env değişkenleri:

- `/home/node/.openclaw` konumuna mount edilen `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`)
- `/home/node/.openclaw/workspace` konumuna mount edilen `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`)
- `/home/node/.profile` konumuna mount edilen ve testleri çalıştırmadan önce source edilen `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`)
- Geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI kimlik doğrulama mount'ları olmadan yalnızca `OPENCLAW_PROFILE_FILE` değerinden source edilen env değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna mount edilen `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`)
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları mount eder
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle manuel olarak geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan geldiğini garanti etmek için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce denetimi prompt'unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman sağlama

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, yapılandırma yazar + auth zorunlu): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent güvenilirliği değerlendirmeleri (skills)

Zaten “agent güvenilirliği değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum bağlantısını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt içinde skills listelendiğinde agent doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, skill dosyası okumalarını ve oturum bağlantısını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcı.
- Skill odaklı küçük bir senaryo takımı (kullanma ve kaçınma, gating, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (opt-in, env-gated) yalnızca CI güvenli takım yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde yineleme yapar ve şekil ile davranış doğrulamalarından oluşan bir takım çalıştırır. Varsayılan `pnpm test` unit kulvarı bu paylaşılan seam ve smoke dosyalarını kasıtlı olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum wizard sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj yükü yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API'si
- **group-policy** - Grup politikası yaptırımı

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth tercihi/seçimi
- **catalog** - Model kataloğu API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum wizard'ı

### Ne zaman çalıştırılır

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek şekli dönüşümünü yakalama)
- Doğası gereği yalnızca canlı ise (rate limit'ler, auth politikaları), canlı testi dar ve env değişkenleriyle opt-in tutun
- Hata yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan model testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı smoke testi veya CI güvenli Gateway mock testi
- SecretRef geçiş guardrail'i:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından geçiş segmenti exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testte `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış hedef id'lerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
