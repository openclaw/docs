---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live test paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-05-02T20:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw'da üç Vitest test takımı (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı grubu vardır. Bu doküman bir "nasıl test ederiz" rehberidir:

- Her test takımının neleri kapsadığı (ve bilerek neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Live testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünyadaki model/sağlayıcı sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, live transport hatları)** ayrı olarak belgelenmiştir:

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için referans.
- [QA kanalı](/tr/channels/qa-channel) — repo destekli senaryolar tarafından kullanılan sentetik transport Plugin'i.

Bu sayfa, normal test takımlarını ve Docker/Parallels çalıştırıcılarını çalıştırmayı kapsar. Aşağıdaki QA'ya özel çalıştırıcılar bölümü ([QA'ya özel çalıştırıcılar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki referanslara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam test takımı çalıştırması: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hatada yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam kapısı: `pnpm test:coverage`
- E2E test takımı: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller için hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live test takımı (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Bir live dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Çalışma zamanı performans raporları: gerçek bir `openai/gpt-5.4` agent dönüşü için
  `live_gpt54=true` ile veya Kova CPU/heap/trace artifaktları için
  `deep_profile=true` ile `OpenClaw Performance` dispatch edin. Günlük zamanlanmış çalıştırmalar,
  `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında mock-provider, deep-profile ve GPT 5.4 hat artifaktlarını
  `openclaw/clawgrit-reports` deposuna yayımlar. mock-provider raporu ayrıca kaynak düzeyinde Gateway başlatma, bellek,
  Plugin baskısı, tekrarlanan fake-model hello-loop ve CLI başlangıç sayılarını içerir.
- Docker live model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin dönüşü ve küçük bir dosya-okuma tarzı yoklama çalıştırır.
    Metadata'sı `image` girdisi bildiren modeller ayrıca küçük bir görüntü dönüşü çalıştırır.
    Sağlayıcı hatalarını izole ederken ek yoklamaları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, ikisi de yeniden kullanılabilir live/E2E workflow'unu
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre shard edilmiş ayrı Docker live model
    matrix işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` workflow'unu
    `include_live_suites: true` ve `live_models_only: true` ile dispatch edin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` dosyasına,
    ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/release çağırıcılarına ekleyin.
- Native Codex bağlı sohbet smoke testi: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinden bir Docker live hattı çalıştırır, `/codex bind` ile sentetik bir
    Slack DM bağlar, `/codex fast` ve `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir görüntü ekinin
    ACP yerine native Plugin binding üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness`
  - Gateway agent dönüşlerini Plugin'e ait Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görüntü,
    cron MCP, alt agent ve Guardian yoklamalarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken alt agent yoklamasını
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt agent kontrolü için diğer yoklamaları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, alt agent yoklamasından sonra çıkar.
- Crestodian kurtarma komutu smoke testi: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komut yüzeyi için isteğe bağlı ek güvence kontrolü.
    `/crestodian status` komutunu çalıştırır, kalıcı bir model değişikliğini kuyruğa alır,
    `/crestodian yes` yanıtını verir ve audit/config yazma yolunu doğrular.
- Crestodian planner Docker smoke testi: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI bulunan yapılandırmasız bir container'da çalıştırır
    ve fuzzy planner fallback'in denetlenmiş tipli config yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke testi: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw state dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    config'i doğrular ve audit girdilerini doğrular. Aynı Ring 0 kurulum yolu QA Lab'de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile de kapsanır.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` için izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 raporladığını ve assistant transcript'in normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca bir başarısız vakaya ihtiyacınız olduğunda, live testleri aşağıda açıklanan allowlist env değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test takımlarının yanında yer alır:

CI, QA Lab'i özel workflow'larda çalıştırır. Agentic parity, bağımsız bir PR workflow'u olarak değil,
`QA-Lab - All Lanes` ve release doğrulaması altında iç içe bulunur.
Geniş doğrulama, `rerun_group=qa-parity` ile `Full Release Validation` veya release-checks QA grubunu kullanmalıdır.
`QA-Lab - All Lanes`, `main` üzerinde gecelik olarak ve manuel dispatch üzerinden mock parity hattı, live
Matrix hattı, Convex tarafından yönetilen live Telegram hattı ve Convex tarafından yönetilen live Discord
hattı paralel işler olarak çalışır. Zamanlanmış QA ve release kontrolleri Matrix
`--profile fast` seçeneğini açıkça geçirirken, Matrix CLI ve manuel workflow girdisi
varsayılanı `all` olarak kalır; manuel dispatch, `all` değerini `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard edebilir. `OpenClaw Release
Checks`, release onayı öncesinde parity ile hızlı Matrix ve Telegram hatlarını çalıştırır;
release transport kontrolleri deterministik kalsın ve normal sağlayıcı-Plugin başlangıcından kaçınsın diye
`mock-openai/gpt-5.5` kullanır. Bu live transport
Gateway'leri bellek aramasını devre dışı bırakır; bellek davranışı QA parity
test takımları tarafından kapsanmaya devam eder.

Tam release live media shard'ları,
zaten `ffmpeg` ve `ffprobe` içeren
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır. Docker live model/backend shard'ları, seçilen
commit başına bir kez oluşturulan paylaşımlı
`ghcr.io/openclaw/openclaw-live-test:<sha>` imajını kullanır, ardından her shard içinde yeniden build etmek yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile onu çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak seçilen birden çok senaryoyu yalıtılmış Gateway işçileriyle paralel çalıştırır. `qa-channel`, varsayılan olarak eşzamanlılığı 4 yapar (seçilen senaryo sayısıyla sınırlıdır). İşçi sayısını ayarlamak için `--concurrency <count>` kullanın veya eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan değerle çıkar. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler. `aimock`, senaryo farkındalığı olan `mock-openai` hattının yerini almadan deneysel fixture ve protokol mock kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway başlatma benchmark'ını ve küçük bir mock QA Lab senaryo paketini (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) çalıştırır ve `.artifacts/gateway-cpu-scenarios/` altında birleştirilmiş CPU gözlem özeti yazar.
  - Varsayılan olarak yalnızca sürekli sıcak CPU gözlemlerini işaretler (`--cpu-core-warn` artı `--hot-wall-warn-ms`), böylece kısa başlatma sıçramaları, dakikalar süren Gateway sabit yük regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Oluşturulmuş `dist` artifact'lerini kullanır; çalışma kopyasında zaten güncel runtime çıktısı yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA suite'i tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim flag'lerini yeniden kullanır.
  - Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır; böylece misafir, bağlanmış çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini `.artifacts/qa-e2e/...` altında yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli çalışma kopyasından bir npm tarball oluşturur, bunu Docker içinde global olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding'i çalıştırır, varsayılan olarak Telegram'ı yapılandırır, paketlenmiş Plugin runtime'ının başlatma bağımlılığı onarımı olmadan yüklendiğini doğrular, doctor çalıştırır ve mock'lanmış bir OpenAI endpoint'ine karşı bir yerel agent turu çalıştırır.
  - Aynı paketli kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü runtime context transcript'leri için deterministik, oluşturulmuş uygulama Docker smoke'u çalıştırır. Gizli OpenClaw runtime context'inin görünür kullanıcı turuna sızmak yerine görüntülenmeyen özel mesaj olarak kalıcılaştırıldığını doğrular; ardından etkilenmiş bozuk bir oturum JSONL'si tohumlar ve `openclaw doctor --fix` komutunun bunu bir yedekle etkin dala yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw paket adayını kurar, kurulu paket onboarding'ini çalıştırır, kurulu CLI üzerinden Telegram'ı yapılandırır, ardından bu kurulu paketi SUT Gateway olarak kullanarak canlı Telegram QA hattını yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanır; registry'den kurmak yerine çözümlenmiş yerel bir tarball test etmek için `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır. CI/release otomasyonu için `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte `OPENCLAW_QA_CONVEX_SITE_URL` ve rol secret'ını ayarlayın. CI'da `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol secret'ı mevcutsa Docker sarmalayıcısı Convex'i otomatik olarak seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu hat için paylaşılan `OPENCLAW_QA_CREDENTIAL_ROLE` değerini geçersiz kılar.
  - GitHub Actions bu hattı manuel maintainer workflow'u `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow, `qa-live-shared` environment'ını ve Convex CI kimlik bilgisi lease'lerini kullanır.
- GitHub Actions ayrıca tek bir aday pakete karşı yan çalıştırma ürün kanıtı için `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec, SHA-256 ile HTTPS tarball URL'si veya başka bir çalıştırmadan tarball artifact'i kabul eder, normalleştirilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından mevcut Docker E2E zamanlayıcısını smoke, package, product, full veya custom hat profilleriyle çalıştırır. Telegram QA workflow'unu aynı `package-under-test` artifact'ine karşı çalıştırmak için `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
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

- Artifact kanıtı başka bir Actions çalıştırmasından bir tarball artifact'i indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Geçerli OpenClaw build'ini Docker içinde paketler ve kurar, OpenAI yapılandırılmış halde Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketli kanal/Plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış indirilebilir Plugin'leri bulunmaz bıraktığını, ilk yapılandırılmış doctor onarımının her eksik indirilebilir Plugin'i açıkça kurduğunu ve ikinci bir yeniden başlatmanın gizli bağımlılık onarımı çalıştırmadığını doğrular.
  - Ayrıca bilinen eski bir npm baseline'ı kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve adayın güncelleme sonrası doctor'ının legacy Plugin bağımlılığı kalıntılarını harness tarafı postinstall onarımı olmadan temizlediğini doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels misafirleri genelinde yerel paketli kurulum güncelleme smoke'unu çalıştırır. Seçilen her platform önce istenen baseline paketi kurar, ardından aynı misafirde kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, Gateway hazır olma durumunu ve bir yerel agent turunu doğrular.
  - Tek bir misafir üzerinde iterasyon yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artifact yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı, canlı agent turu kanıtı için varsayılan olarak `openai/gpt-5.5` kullanır. Bilerek başka bir OpenAI modelini doğrularken `--model <provider/model>` iletin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Uzun yerel çalıştırmaları ana makine timeout'u ile sarın; böylece Parallels aktarım takılmaları test penceresinin geri kalanını tüketemez:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir misafirde güncelleme sonrası doctor ve paket güncelleme çalışmasında 10 ila 15 dakika harcayabilir; iç içe npm debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı bireysel Parallels macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve snapshot geri yükleme, paket sunma veya misafir Gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketli Plugin yüzeyini çalıştırır; çünkü konuşma, görüntü üretimi ve medya anlama gibi capability facade'ları, agent turunun kendisi yalnızca basit bir metin yanıtını kontrol etse bile paketli runtime API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak çalışma kopyası; paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, env vars ve artifact düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını env'den gelen driver ve SUT bot token'larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup id'si sayısal Telegram chat id'si olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış lease'lere katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan değerle çıkar. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botu bir Telegram kullanıcı adı sunmalıdır.
  - Kararlı bottan bota gözlem için her iki botta da `@BotFather` içinde Bottan Bota İletişim Modu'nu etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve observed-messages artifact'i yazar. Yanıtlama senaryoları, driver gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapmaz. Hat başına kapsam matrisi [QA genel bakışı → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde bulunur. `qa-channel` geniş sentetik suite'tir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir lease alır, hat çalışırken bu lease için heartbeat gönderir ve kapanışta lease'i serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir secret:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal işletimde `https://` kullanmalıdır.

Maintainer admin komutları (havuz ekleme/kaldırma/listeleme) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker secret'larını, endpoint prefix'ini, HTTP timeout'u ve admin/list erişilebilirliğini secret değerleri yazdırmadan kontrol etmek için `doctor` kullanın. Betiklerde ve CI yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `groupId`, sayısal bir Telegram sohbet kimliği dizgesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcısı adları [QA genel bakışı → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) bölümünde bulunur. Asgari gereklilik: taşıma çalıştırıcısını paylaşılan `qa-lab` ana bilgisayar seam'i üzerinde uygulamak, Plugin bildiriminde `qaRunners` tanımlamak, `openclaw qa <runner>` olarak bağlamak ve senaryoları `qa/scenarios/` altında yazmak.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kırılganlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altındaki çekirdek/birim envanterleri; UI birim testleri ayrılmış `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulama, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, gerçek paketli Plugin kaynak API'leriyle değil, üretilmiş küçük Plugin fikstürleriyle geniş `api.js` ve
    `runtime-api.js` yedek davranışını kanıtlamalıdır. Gerçek Plugin API yüklemeleri
    Plugin sahibindeki sözleşme/entegrasyon paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedeflenmemiş `pnpm test`, tek bir dev yerel kök proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'i düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports` açık dosya/dizin hedeflerini önce kapsamlı hatlardan geçirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı hatlara genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel içe aktarma grafiği bağımlıları. Yapılandırma/kurulum/paket düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar işler için normal akıllı yerel denetim kapısıdır. Diff'i çekirdek, çekirdek testleri, extensions, extension testleri, uygulamalar, dokümanlar, sürüm meta verileri, canlı Docker araçları ve araçlar olarak sınıflandırır; sonra eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca sürüm meta verisi olan sürüm artırımları, üst düzey version alanı dışındaki paket değişikliklerini reddeden bir guard ile hedefli sürüm/yapılandırma/kök bağımlılık kontrollerini çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth betikleri için kabuk söz dizimi ve canlı Docker zamanlayıcı dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; bağımlılık, dışa aktarma, sürüm ve diğer paket yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, komutlar, Plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan içe aktarması hafif birim testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattından geçer; durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri ilgili dizin için tüm ağır paketi yeniden çalıştırmaktan kaçınır.
    - `auto-reply`, üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış bucket'lara sahiptir. CI, yanıt alt ağacını ayrıca agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece içe aktarması ağır tek bir bucket tüm Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, extension toplu taramasını ve yalnızca sürüme özel `agentic-plugins` shard'ını bilerek atlar. Full Release Validation, sürüm adaylarında bu Plugin/extension ağırlıklı paketler için ayrı `Plugin Prerelease` alt iş akışını dispatch eder.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - Mesaj aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme sınırları için odaklı yardımcı regresyonlar ekleyin.
    - Gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yollarından akmaya devam ettiğini doğrular; yalnızca yardımcı testleri
      bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve izolasyon varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projelerde, e2e'de ve canlı yapılandırmalarda izole olmayan çalıştırıcıyı kullanır.
    - Kök UI hattı `jsdom` kurulumunu ve iyileştiricisini korur, ancak
      paylaşılan izole olmayan çalıştırıcıda da çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme churn'ünü azaltmak için Vitest alt Node
      süreçlerine varsayılan olarak `--no-maglev` ekler.
      Standart V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit hook yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel denetim kapısına ihtiyacınız olduğunda handoff veya push öncesinde açıkça `pnpm check:changed` çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı hatlardan geçer. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` değerini yalnızca agent,
      bir harness, yapılandırma, paket veya sözleşme düzenlemesinin gerçekten daha geniş
      Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme
      davranışını korur, yalnızca daha yüksek worker sınırıyla.
    - Yerel worker otomatik ölçeklendirmesi bilerek muhafazakârdır ve
      ana bilgisayar yük ortalaması zaten yüksek olduğunda geri çekilir; böylece birden fazla eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması, test
      kablolaması değiştiğinde changed-mode yeniden çalıştırmalarının doğru kalması için projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler.
    - Yapılandırma, desteklenen ana bilgisayarlarda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil çıkarma için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest içe aktarma süresi raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil görünümünü
      `origin/main` sonrasında değişen dosyalarla sınırlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm yapılandırma çalıştırmaları anahtar olarak yapılandırma yolunu kullanır; include-pattern CI
      shard'ları, filtrelenmiş shard'ların ayrı izlenebilmesi için shard adını ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlangıç içe aktarmalarında harcadığında,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` seam'inin arkasında tutun ve
      runtime yardımcılarını yalnızca `vi.mock(...)` üzerinden geçirmek için derin içe aktarmak yerine
      bu seam'i doğrudan mock'layın.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` değerini o commit'lenmiş diff için yerel kök proje yoluyla karşılaştırır
      ve duvar saatini artı macOS azami RSS'i yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırmasından geçirerek mevcut
      kirli ağacı benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform overhead'i için
      ana thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış birim paketi için
      çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Tanılamalar varsayılan olarak etkin halde gerçek bir loopback Gateway başlatır
  - Sentetik Gateway mesajını, belleği ve büyük yük churn'ünü tanılama olay yolundan geçirir
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin basınç bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketli Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Depodaki geri kalanla eşleşecek şekilde Vitest `threads` değerini `isolate: false` ile kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol I/O overhead'ini azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla ana makinede yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca katılımla etkinleşir; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, tool-calling tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “her şey” yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` kaynak gösterir.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin özellikle gerçek home dizininizi kullanmasına ihtiyacınız olduğunda yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını tutar, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlüklerini/Bonjour konuşmalarını susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` ile canlıya özel geçersiz kılma kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr'e yazar; böylece Vitest konsol yakalaması sessiz olsa bile uzun sağlayıcı çağrıları görünür biçimde etkin kalır.
  - `vitest.live.config.ts`, Vitest konsol kesmesini devre dışı bırakır; böylece sağlayıcı/gateway ilerleme satırları canlı çalıştırmalar sırasında hemen akar.
  - Doğrudan-model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenleme: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da çalıştırın)
- Gateway ağ iletişimine / WS protokolüne / eşleştirmeye dokunma: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü hatalar / tool calling hata ayıklama: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex app-server
harness'ı ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) ve canlı çalıştırmalar için kimlik bilgisi işleme hakkında bkz.
[Canlı paketleri test etme](/tr/help/testing-live). Özel güncelleme ve
Plugin doğrulama kontrol listesi için bkz.
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışır" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel config dizininizi ve çalışma alanınızı mount eder (mount edilmişse `~/.profile` kaynak gösterilir). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` olur.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırına sahiptir; böylece tam bir Docker taraması uygulanabilir kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu env var'ları geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` aracılığıyla bir kez derler, `scripts/package-openclaw-for-docker.mjs` üzerinden OpenClaw'ı bir kez npm tarball olarak paketler, ardından iki `scripts/e2e/Dockerfile` imajı derler/yeniden kullanır. Yalın imaj, install/update/plugin-dependency şeritleri için yalnızca Node/Git çalıştırıcısıdır; bu şeritler önceden derlenmiş tarball'ı mount eder. İşlevsel imaj, derlenmiş uygulama işlevsellik şeritleri için aynı tarball'ı `/app` içine kurar. Docker şerit tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplam, ağırlıklı yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını denetlerken, kaynak sınırları ağır canlı, npm-install ve çok servisli şeritlerin hepsinin aynı anda başlamasını önler. Tek bir şerit etkin sınırlardan daha ağırsa, havuz boş olduğunda zamanlayıcı yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalıştırır. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak Docker ön kontrolü gerçekleştirir, eski OpenClaw E2E container'larını kaldırır, her 30 saniyede durum yazdırır, başarılı şerit zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun şeritleri önce başlatmak için bu zamanlamaları kullanır. Docker'ı derlemeden veya çalıştırmadan ağırlıklı şerit manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen şeritler, paket/imaj ihtiyaçları ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` kullanın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" için GitHub-yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` içinden bir aday paket çözer, onu `package-under-test` olarak yükler, ardından yeniden kullanılabilir Docker E2E şeritlerini seçilen ref'i yeniden paketlemek yerine tam olarak o tarball'a karşı çalıştırır. Profiller genişliğe göre sıralanır: `smoke`, `package`, `product` ve `full`. Paket/güncelleme/Plugin sözleşmesi, yayımlanmış-yükseltme sağ kalan matrisi, yayın varsayılanları ve hata triajı için bkz. [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins).
- Derleme ve yayın kontrolleri tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, statik derlenmiş grafiği `dist/entry.js` ve `dist/cli/run-main.js` üzerinden dolaşır ve komut gönderiminden önce pre-dispatch başlangıcının Commander, prompt UI, undici veya logging gibi paket bağımlılıklarını import etmesi durumunda başarısız olur; ayrıca paketlenmiş gateway run chunk'ını bütçe altında tutar ve bilinen soğuk gateway yollarının statik import'larını reddeder. Paketlenmiş CLI smoke testi ayrıca root help, onboard help, doctor help, status, config schema ve bir model-list komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu sınıra kadar harness yalnızca gönderilmiş paket metadata boşluklarını tolere eder: atlanmış özel QA envanteri girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migrasyonu. `2026.4.25` sonrasındaki paketler için bu yollar katı hatadır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload` bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı-model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home dizinlerini (veya çalıştırma daraltılmamışsa desteklenen tümünü) bind-mount eder, ardından bunları çalıştırmadan önce container home dizinine kopyalar; böylece harici-CLI OAuth, ana makine auth deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini’yi kapsar; `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sıkı Droid/OpenCode kapsamı sağlar)
- CLI backend smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server test düzeneği smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke testi: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball QA Lab’i içermediği için kasıtlı olarak paket Docker yayın hatlarının parçası değildir.
- Open WebUI canlı smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk katılım sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball ilk katılım/kanal/ajan smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball’ını Docker içinde global olarak yükler, OpenAI’yi env-ref ilk katılımı ve varsayılan olarak Telegram ile yapılandırır, doctor çalıştırır ve bir sahte OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball’ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme smoke testi: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball’ını Docker içinde global olarak yükler, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın doğrulandığını kontrol eder, ardından paket `stable` kanalına geri döner ve güncelleme durumunu denetler.
- Yükseltme sağ kalım smoke testi: `pnpm test:docker:upgrade-survivor`, ajanlar, kanal yapılandırması, Plugin izin listeleri, bayat Plugin bağımlılık durumu ve mevcut workspace/oturum dosyaları içeren kirli bir eski kullanıcı fikstürünün üzerine paketlenmiş OpenClaw tarball’ını yükler. Canlı provider veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından bir loopback Gateway başlatır ve yapılandırma/durum korunmasını ve başlatma/durum bütçelerini denetler.
- Yayınlanmış yükseltme sağ kalım smoke testi: `pnpm test:docker:published-upgrade-survivor`, varsayılan olarak `openclaw@latest` yükler, gerçekçi mevcut kullanıcı dosyaları tohumlar, bu baseline’ı gömülü bir komut tarifiyle yapılandırır, ortaya çıkan yapılandırmayı doğrular, bu yayınlanmış kurulumu aday tarball’a günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’leri, durum korunmasını, başlatmayı, `/healthz`, `/readyz` ve RPC durum bütçelerini denetler. Tek bir baseline’ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, toplu zamanlayıcıdan tam baseline’ları `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile, örneğin `all-since-2026.4.23`, genişletmesini isteyin ve issue biçimli fikstürleri `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ile, örneğin `reported-issues`, genişletin; reported-issues kümesi otomatik harici OpenClaw Plugin yükleme onarımı için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- Oturum çalışma zamanı bağlamı smoke testi: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transcript kalıcılığını ve etkilenen yinelenmiş prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global yükleme smoke testi: `bash scripts/e2e/bun-global-install-smoke.sh`, mevcut ağacı paketler, izole bir home içinde `bun install -g` ile yükler ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görsel provider’ları döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball’ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile derlenmiş bir Docker imajından `dist/` kopyalayın.
- Kurucu Docker smoke testi: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container’ları arasında tek bir npm önbelleği paylaşır. Update smoke testi, aday tarball’a yükseltmeden önce stable baseline olarak varsayılan olarak npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub’da Install Smoke workflow’unun `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu denetimleri, root’a ait önbellek girdilerinin kullanıcı-yerel yükleme davranışını maskelememesi için izole bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Ajanların paylaşılan workspace silme CLI smoke testi: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak root Dockerfile imajını derler, izole bir container home içinde tek workspace’e sahip iki ajan tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş workspace davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke testi: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını derler, Chromium’u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının bağlantı URL’lerini, imleçle yükseltilmiş tıklanabilirleri, iframe referanslarını ve frame metaverilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), Gateway üzerinden sahte bir OpenAI sunucusu çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından provider şemasının reddetmesini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paketi MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP alt süreç sonlandırma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin’ler (yerel path, `file:`, hoist edilmiş bağımlılıklı npm registry, git moving ref’leri, ClawHub kitchen-sink, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için yükleme/güncelleme smoke testi): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fikstür sunucusu kullanır.
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Yapılandırma yeniden yükleme metaverisi smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin’ler: `pnpm test:docker:plugins`, yerel path, `file:`, hoist edilmiş bağımlılıklı npm registry, git moving ref’leri, ClawHub fikstürleri, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için yükleme/güncelleme smoke testini kapsar. `pnpm test:docker:plugin-update`, yüklü Plugin’ler için değişmemiş güncelleme davranışını kapsar.

Paylaşılan işlevsel imajı elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite’e özel imaj geçersiz kılmaları ayarlandığında hâlâ önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan imaja işaret ettiğinde, betikler imaj zaten yerelde değilse onu çeker. QR ve kurucu Docker testleri, paylaşılan derlenmiş uygulama çalışma zamanı yerine paket/yükleme davranışını doğruladıkları için kendi Dockerfile’larını tutar.

Canlı model Docker çalıştırıcıları ayrıca mevcut checkout’u salt okunur olarak bind-mount eder ve
container içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
imajını küçük tutarken Vitest’i tam yerel kaynak/yapılandırmanız üzerinde çalıştırmaya devam eder.
Hazırlama adımı büyük yerel-özel önbellekleri ve uygulama derleme çıktılarını, örneğin
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulama-yerel `.build` veya
Gradle çıktı dizinlerini atlar; böylece Docker canlı çalıştırmaları dakikalarca
makineye özgü artifact’leri kopyalamaz.
Container içinde gateway canlı probe’larının gerçek Telegram/Discord/vb. kanal worker’larını
başlatmaması için ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar.
`test:docker:live-models` hâlâ `pnpm test:live` çalıştırır; bu nedenle bu Docker hattından gateway
canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de aktarın.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint’leri
etkinleştirilmiş bir OpenClaw gateway container’ı başlatır,
bu gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` öğesinin `openclaw/default` sunduğunu doğrular, ardından Open WebUI’nin
`/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker’ın
Open WebUI imajını çekmesi ve Open WebUI’nin kendi cold-start kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) Docker’lı çalıştırmalarda bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway
container’ı başlatır, `openclaw mcp serve` çalıştıran ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metaverilerini,
canlı event queue davranışını, outbound gönderme yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden
Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim denetimi
ham stdio MCP frame’lerini doğrudan inceler; böylece smoke testi, yalnızca belirli bir client SDK’sının
yüzeye çıkardığını değil, köprünün gerçekten yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı bir model
anahtarı gerektirmez. Repo Docker imajını derler, container içinde gerçek bir stdio MCP probe sunucusu
başlatır, bu sunucuyu gömülü Pi paketi MCP çalışma zamanı üzerinden somutlaştırır,
aracı yürütür, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` araçlarını tuttuğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` öğelerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model
anahtarı gerektirmez. Gerçek bir stdio MCP probe sunucusuyla tohumlanmış bir Gateway başlatır, izole bir cron turu
ve bir `/subagents spawn` tek seferlik alt tur çalıştırır, ardından
MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için tutun. ACP thread yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı env var’lar:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynak olarak yüklenir
- Yalnızca `OPENCLAW_PROFILE_FILE` kaynaklı ortam değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`; geçici yapılandırma/çalışma alanı dizinleri kullanılır ve harici CLI kimlik doğrulama bağlamaları kullanılmaz
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içindeki önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir listeyle elle geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` görüntüsünü yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin ortamdan değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke için Gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke tarafından kullanılan nonce denetimi istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI görüntü etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Dokümantasyon sağlamlık kontrolü

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI güvenli)

Bunlar gerçek sağlayıcılar olmadan yapılan “gerçek pipeline” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (test durumu: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırmayı yazar + kimlik doğrulama zorunlu tutulur): `src/gateway/gateway.test.ts` (test durumu: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

“Agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz zaten var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum bağlantılarını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde agent doğru Skills’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyup gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skills dosyası okumalarını ve oturum bağlantılarını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcı.
- Skills odaklı küçük bir senaryo paketi (kullanma ve kaçınma, kapılama, istem enjeksiyonu).
- İsteğe bağlı canlı değerlendirmeler (opt-in, ortam değişkeniyle kapılı) yalnızca CI güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve kanal biçimi)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde iterasyon yapar ve biçim ile davranış doğrulamalarından oluşan bir paket çalıştırır. Varsayılan `pnpm test` birim lane’i bu paylaşılan arayüz ve smoke dosyalarını bilinçli olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin biçimi (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - İleti yükü yapısı
- **inbound** - Gelen ileti işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Konu kimliği işleme
- **directory** - Dizin/kadro API’si
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt defteri biçimi

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi
- **catalog** - Model kataloğu API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı runtime’ı
- **shape** - Plugin biçimi/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılır

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydını veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek biçimi dönüşümünü yakalama)
- Sorun doğası gereği yalnızca canlıysa (hız sınırları, kimlik doğrulama ilkeleri), canlı testi dar tutun ve ortam değişkenleriyle opt-in yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan model testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı smoke veya CI güvenli Gateway sahte testi
- SecretRef gezinme koruma hattı:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından gezinme segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testteki `classifyTargetClass` değerini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde bilinçli olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins)
- [CI](/tr/ci)
