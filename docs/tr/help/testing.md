---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyon testleri ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı test takımları, Docker çalıştırıcıları ve her testin neyi kapsadığı'
title: Test Etme
x-i18n:
    generated_at: "2026-04-30T09:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw üç Vitest paketine (unit/integration, e2e, live) ve küçük bir Docker runner kümesine sahiptir. Bu doküman bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neleri kapsadığı (ve bilinçli olarak neleri _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Live testlerin kimlik bilgilerini nasıl keşfettiği ve model/provider seçtiği.
- Gerçek dünyadaki model/provider sorunları için regresyonların nasıl ekleneceği.

<Note>
**QA yığını (qa-lab, qa-channel, live transport yolları)** ayrı olarak belgelenmiştir:

- [QA genel bakış](/tr/concepts/qa-e2e-automation) — mimari, komut yüzeyi, senaryo yazımı.
- [Matrix QA](/tr/concepts/qa-matrix) — `pnpm openclaw qa matrix` için başvuru.
- [QA channel](/tr/channels/qa-channel) — repo destekli senaryolar tarafından kullanılan sentetik transport Plugin.

Bu sayfa düzenli test paketlerini ve Docker/Parallels runner'larını çalıştırmayı kapsar. Aşağıdaki QA'ya özgü runner'lar bölümü ([QA'ya özgü runner'lar](#qa-specific-runners)) somut `qa` çağrılarını listeler ve yukarıdaki başvurulara geri yönlendirir.
</Note>

## Hızlı başlangıç

Çoğu gün:

- Tam gate (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest watch döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde iterasyon yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA yolu: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güvence istediğinizde:

- Coverage gate: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek provider'lar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paket (modeller + Gateway tool/image probları): `pnpm test:live`
- Tek bir live dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı prob çalıştırır.
    Metadata'sı `image` girdisini duyuran modeller ayrıca küçük bir image turu çalıştırır.
    Provider hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI coverage: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir live/E2E workflow'unu
    `include_live_suites: true` ile çağırır; buna provider'a göre shard edilmiş ayrı Docker live model
    matrix işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)` workflow'unu
    `include_live_suites: true` ve `live_models_only: true` ile dispatch edin.
  - Yeni yüksek sinyalli provider secret'larını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    scheduled/release çağırıcılarına ekleyin.
- Yerel Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server yolu üzerinde bir Docker live yolu çalıştırır, sentetik bir
    Slack DM'yi `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını çalıştırır, ardından düz bir yanıtın ve bir image attachment'ın
    ACP yerine yerel Plugin binding üzerinden yönlendirildiğini doğrular.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Gateway agent turlarını Plugin'e ait Codex app-server harness üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak image,
    Cron MCP, sub-agent ve Guardian problarını çalıştırır. Diğer Codex
    app-server hatalarını izole ederken sub-agent probunu
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir sub-agent kontrolü için diğer probları devre dışı bırakın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ayarlanmadıkça bu, sub-agent probundan sonra çıkar.
- Crestodian rescue komutu smoke: `pnpm test:live:crestodian-rescue-channel`
  - Message-channel rescue komutu
    yüzeyi için isteğe bağlı, ek güvenlik kontrolü. `/crestodian status` komutunu çalıştırır, kalıcı bir model
    değişikliğini kuyruğa alır, `/crestodian yes` yanıtını verir ve audit/config yazma yolunu doğrular.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile config'siz bir container'da çalıştırır
    ve fuzzy planner fallback'in audit'lenmiş typed
    config yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw state dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    config'i doğrular ve audit girdilerini doğrular. Aynı Ring 0 setup yolu
    QA Lab'de de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` ile kapsanır.
- Moonshot/Kimi maliyet smoke: `MOONSHOT_API_KEY` ayarlıyken
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'ın Moonshot/K2.6 raporladığını ve
  assistant transcript'in normalize edilmiş `usage.cost` sakladığını doğrulayın.

<Tip>
Yalnızca tek bir hatalı vaka gerektiğinde, live testleri aşağıda açıklanan allowlist env değişkenleriyle daraltmayı tercih edin.
</Tip>

## QA'ya özgü runner'lar

Bu komutlar, QA-lab gerçekçiliği gerektiğinde ana test paketlerinin yanında yer alır:

CI, QA Lab'i özel workflow'larda çalıştırır. `Parity gate` eşleşen PR'larda ve
manuel dispatch'ten mock provider'larla çalışır. `QA-Lab - All Lanes` her gece
`main` üzerinde ve manuel dispatch'ten mock parity gate, live Matrix yolu,
Convex yönetimli live Telegram yolu ve Convex yönetimli live Discord yolu ile
paralel işler olarak çalışır. Scheduled QA ve release kontrolleri Matrix `--profile fast`
değerini açıkça geçirirken, Matrix CLI ve manuel workflow input varsayılanı
`all` olarak kalır; manuel dispatch `all` değerini `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` ve `e2ee-cli` işlerine shard edebilir. `OpenClaw Release Checks`, release onayı öncesinde parity ile
fast Matrix ve Telegram yollarını çalıştırır; release transport kontrolleri için
`mock-openai/gpt-5.5` kullanır, böylece deterministik kalırlar
ve normal provider-Plugin başlangıcından kaçınırlar. Bu live transport Gateway'leri
memory search'ü devre dışı bırakır; memory davranışı QA parity paketleri tarafından kapsanmaya devam eder.

Tam release live media shard'ları
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` kullanır; bu image içinde zaten
`ffmpeg` ve `ffprobe` bulunur. Docker live model/backend shard'ları, seçilen
commit başına bir kez oluşturulan paylaşılan
`ghcr.io/openclaw/openclaw-live-test:<sha>` image'ını kullanır, ardından her shard içinde yeniden build etmek yerine
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile çeker.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Seçilen birden çok senaryoyu varsayılan olarak izole
    Gateway worker'larıyla paralel çalıştırır. `qa-channel` varsayılan concurrency değeri 4'tür (seçilen senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>` kullanın veya eski serial yol için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır dışı kodla çıkar. Hata çıkış kodu olmadan artifact istediğinizde
    `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` provider modlarını destekler.
    `aimock`, senaryo farkındalığına sahip
    `mock-openai` yolunun yerine geçmeden deneysel
    fixture ve protocol-mock coverage için yerel AIMock destekli bir provider server başlatır.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway startup bench'i ve küçük bir mock QA Lab senaryo paketini
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) çalıştırır ve `.artifacts/gateway-cpu-scenarios/` altında birleşik bir CPU gözlem
    özeti yazar.
  - Varsayılan olarak yalnızca sürekli hot CPU gözlemlerini işaretler (`--cpu-core-warn`
    artı `--hot-wall-warn-ms`), böylece kısa startup patlamaları, dakikalarca süren Gateway peg regresyonu gibi görünmeden metrik olarak kaydedilir.
  - Build edilmiş `dist` artifact'lerini kullanır; checkout'ta zaten taze runtime output yoksa önce build çalıştırın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı provider/model seçim flag'lerini yeniden kullanır.
  - Live çalıştırmalar, guest için pratik olan desteklenen QA auth input'larını iletir:
    env tabanlı provider key'leri, QA live provider config yolu ve mevcut olduğunda `CODEX_HOME`.
  - Output dizinleri repo root altında kalmalıdır, böylece guest, mount edilmiş workspace üzerinden geri yazabilir.
  - Normal QA report + summary ve Multipass log'larını
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operator tarzı QA işi için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Mevcut checkout'tan bir npm tarball oluşturur, Docker içinde global olarak kurar, etkileşimsiz OpenAI API-key onboarding çalıştırır, varsayılan olarak Telegram'ı yapılandırır, Plugin'i etkinleştirmenin runtime dependency'lerini gerektiğinde kurduğunu doğrular, doctor çalıştırır ve mock OpenAI endpoint'e karşı bir yerel agent turu çalıştırır.
  - Aynı packaged-install yolunu Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Embedded runtime context transcript'leri için deterministik built-app Docker smoke çalıştırır. Gizli OpenClaw runtime context'in görünür user turn'e sızmak yerine görüntülenmeyen custom message olarak kalıcılaştırıldığını doğrular, ardından etkilenmiş bozuk bir session JSONL'i seed eder ve
    `openclaw doctor --fix` komutunun onu bir backup ile active branch'e yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Docker içinde bir OpenClaw package candidate kurar, installed-package onboarding çalıştırır, Telegram'ı installed CLI üzerinden yapılandırır, ardından live Telegram QA yolunu SUT Gateway olarak bu kurulu package ile yeniden kullanır.
  - Varsayılan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` değeridir; registry'den kurmak yerine çözümlenmiş yerel tarball test etmek için
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` veya
    `OPENCLAW_CURRENT_PACKAGE_TGZ` ayarlayın.
  - `pnpm openclaw qa telegram` ile aynı Telegram env kimlik bilgilerini veya Convex credential source'u kullanır. CI/release automation için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ve
    `OPENCLAW_QA_CONVEX_SITE_URL` ile role secret'ı ayarlayın. CI'da
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex role secret mevcutsa,
    Docker wrapper Convex'i otomatik olarak seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, yalnızca bu yol için paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini override eder.
  - GitHub Actions bu yolu manuel maintainer workflow'u
    `NPM Telegram Beta E2E` olarak sunar. Merge sırasında çalışmaz. Workflow,
    `qa-live-shared` environment'ını ve Convex CI credential lease'lerini kullanır.
- GitHub Actions ayrıca tek bir candidate package'a karşı side-run product proof için
  `Package Acceptance` sunar. Güvenilir bir ref, yayımlanmış npm spec,
  HTTPS tarball URL'si artı SHA-256 veya başka bir run'dan tarball artifact kabul eder,
  normalize edilmiş `openclaw-current.tgz` dosyasını `package-under-test` olarak yükler, ardından
  mevcut Docker E2E scheduler'ı smoke, package, product, full veya custom
  lane profile'larıyla çalıştırır. Telegram QA workflow'unu aynı `package-under-test` artifact'ına karşı çalıştırmak için
  `telegram_mode=mock-openai` veya `live-frontier` ayarlayın.
  - En yeni beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Tam tarball URL proof'u digest gerektirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artefakt kanıtı, başka bir Actions çalıştırmasından bir tarball artefaktı indirir:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış olarak Gateway'i başlatır, ardından yapılandırma düzenlemeleriyle paketli kanal/plugin'leri etkinleştirir.
  - Kurulum keşfinin, yapılandırılmamış plugin çalışma zamanı bağımlılıklarını yok bıraktığını; ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketli plugin'in çalışma zamanı bağımlılıklarını isteğe bağlı olarak kurduğunu; ikinci yeniden başlatmanın ise zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram'ı etkinleştirir ve aday sürümün güncelleme sonrası doctor işleminin paketli kanal çalışma zamanı bağımlılıklarını, test donanımı tarafında postinstall onarımı olmadan onardığını doğrular.
- `pnpm test:parallels:npm-update`
  - Parallels konukları genelinde yerel paketli kurulum güncelleme smoke testini çalıştırır. Seçilen her platform önce istenen temel paketi kurar, ardından aynı konukta kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu, gateway hazır olma durumunu ve bir yerel ajan turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın. Özet artefakt yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı, canlı ajan turu kanıtı için varsayılan olarak `openai/gpt-5.5` kullanır. Bilerek başka bir OpenAI modelini doğrularken `--model <provider/model>` geçirin veya `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels taşıma takılmalarının test penceresinin kalanını tüketmemesi için uzun yerel çalıştırmaları bir ana makine zaman aşımıyla sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik, iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altında yazar. Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log` dosyasını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor/çalışma zamanı bağımlılığı onarımında 10 ila 15 dakika harcayabilir; iç içe npm hata ayıklama günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. VM durumunu paylaşırlar ve anlık görüntü geri yükleme, paket sunma veya konuk gateway durumunda çakışabilirler.
  - Güncelleme sonrası kanıt, normal paketli plugin yüzeyini çalıştırır; çünkü konuşma, görüntü oluşturma ve medya anlama gibi yetenek cepheleri, ajan turunun kendisi yalnızca basit bir metin yanıtını denetlese bile paketli çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır. Yalnızca kaynak checkout'u; paketli kurulumlar `qa-lab` göndermez.
  - Tam CLI, profil/senaryo kataloğu, ortam değişkenleri ve artefakt düzeni: [Matrix QA](/tr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortamdan gelen sürücü ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamaları seçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artefaktlar istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki ayrı bot gerektirir; SUT botu bir Telegram kullanıcı adı sunmalıdır.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve sürücü botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve gözlenen iletiler artefaktı yazar. Yanıt senaryoları, sürücü gönderme isteğinden gözlenen SUT yanıtına kadar RTT içerir.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır; hat başına kapsam matrisi [QA genel bakış → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde bulunur. `qa-channel` geniş sentetik pakettir ve bu matrisin parçası değildir.

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskelesi:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli değer:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Varsayılan env: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL` normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker gizli değerlerini, uç nokta önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini gizli değerleri yazdırmadan denetlemek için `doctor` kullanın. Betikler ve CI yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `POST /admin/add` (yalnızca maintainer gizli değeri)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer gizli değeri)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer gizli değeri)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload'ları reddeder.

### QA'ya kanal ekleme

Yeni kanal bağdaştırıcıları için mimari ve senaryo yardımcısı adları [QA genel bakış → Kanal ekleme](/tr/concepts/qa-e2e-automation#adding-a-channel) içinde bulunur. Asgari çıta: taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine yüzeyinde uygulayın, plugin manifestinde `qaRunners` bildirin, `openclaw qa <runner>` olarak bağlayın ve senaryoları `qa/scenarios/` altında yazın.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel zamanlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts` ve `test/**/*.test.ts` altında core/birim envanterleri; UI birim testleri ayrılmış `unit-ui` shard'ında çalışır
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway kimlik doğrulaması, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerektirmez
  - Hızlı ve kararlı olmalıdır
  - Çözümleyici ve genel yüzey yükleyici testleri, gerçek paketli plugin kaynak API'leriyle değil, oluşturulmuş küçük plugin fikstürleriyle geniş `api.js` ve `runtime-api.js` fallback davranışını kanıtlamalıdır. Gerçek plugin API yüklemeleri, plugin'e ait sözleşme/entegrasyon paketlerine aittir.

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedef belirtilmeyen `pnpm test`, tek bir dev yerel kök proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini düşürür ve auto-reply/uzantı işlerinin ilgisiz suite'leri aç bırakmasını önler.
    - `pnpm test --watch`, çok shard'lı bir izleme döngüsü pratik olmadığı için hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı lane'ler üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
    - `pnpm test:changed`, değişen git yollarını varsayılan olarak ucuz kapsamlı lane'lere genişletir: doğrudan test düzenlemeleri, kardeş `*.test.ts` dosyaları, açık kaynak eşlemeleri ve yerel import grafiği bağımlıları. Config/setup/package düzenlemeleri, açıkça `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanmadığınız sürece testleri geniş kapsamda çalıştırmaz.
    - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel kontrol kapısıdır. Diff'i core, core testleri, uzantılar, uzantı testleri, uygulamalar, dokümanlar, release metadata, canlı Docker araçları ve araçlar olarak sınıflandırır; ardından eşleşen typecheck, lint ve guard komutlarını çalıştırır. Vitest testlerini çalıştırmaz; test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` çağırın. Yalnızca release metadata sürüm artırımları, üst düzey version alanı dışındaki package değişikliklerini reddeden bir guard ile hedeflenmiş version/config/root-dependency kontrollerini çalıştırır.
    - Canlı Docker ACP harness düzenlemeleri odaklı kontroller çalıştırır: canlı Docker auth script'leri için shell söz dizimi ve canlı Docker scheduler dry-run. `package.json` değişiklikleri yalnızca diff `scripts["test:docker:live-*"]` ile sınırlı olduğunda dahil edilir; dependency, export, version ve diğer package yüzeyi düzenlemeleri hâlâ daha geniş guard'ları kullanır.
    - Agents, komutlar, plugins, auto-reply helper'ları, `plugin-sdk` ve benzer saf yardımcı alanlardan import-light unit testler, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` lane'i üzerinden yönlendirilir; stateful/runtime-heavy dosyalar mevcut lane'lerde kalır.
    - Seçili `plugin-sdk` ve `commands` helper kaynak dosyaları da changed-mode çalıştırmalarını bu hafif lane'lerde açık kardeş testlere eşler; böylece helper düzenlemeleri, o dizin için tam ağır suite'i yeniden çalıştırmaz.
    - `auto-reply`, üst düzey core helper'lar, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı için özel bucket'lara sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler; böylece import-heavy tek bir bucket tam Node kuyruğunu sahiplenmez.
    - Normal PR/main CI, uzantı batch sweep'ini ve yalnızca release için olan `agentic-plugins` shard'ını bilinçli olarak atlar. Full Release Validation, release candidate'larında bu plugin/uzantı ağırlıklı suite'ler için ayrı `Plugin Prerelease` child workflow'unu dispatch eder.

  </Accordion>

  <Accordion title="Gömülü runner kapsamı">

    - Message-tool discovery girdilerini veya Compaction runtime
      bağlamını değiştirdiğinizde, iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalizasyon sınırları için odaklı helper regresyonları
      ekleyin.
    - Gömülü runner integration suite'lerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu suite'ler, kapsamlı id'lerin ve Compaction davranışının gerçek
      `run.ts` / `compact.ts` yolları üzerinden hâlâ aktığını doğrular; yalnızca
      helper testleri bu integration yollarının yeterli bir yerine geçmez.

  </Accordion>

  <Accordion title="Vitest pool ve isolation varsayılanları">

    - Temel Vitest config varsayılanı `threads` değeridir.
    - Paylaşılan Vitest config `isolate: false` değerini sabitler ve kök projelerde,
      e2e'de ve canlı config'lerde izole olmayan runner'ı kullanır.
    - Kök UI lane'i kendi `jsdom` setup'ını ve optimizer'ını korur, ancak o da
      paylaşılan izole olmayan runner üzerinde çalışır.
    - Her `pnpm test` shard'ı, paylaşılan Vitest config'ten aynı `threads` + `isolate: false`
      varsayılanlarını devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 compile churn'ünü
      azaltmak için varsayılan olarak Vitest child Node süreçlerine `--no-maglev`
      ekler. Stock V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel iterasyon">

    - `pnpm changed:lanes`, bir diff'in hangi mimari lane'leri tetiklediğini gösterir.
    - Pre-commit hook yalnızca formatlama yapar. Formatlanan dosyaları yeniden stage eder ve
      lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel kontrol kapısına ihtiyacınız olduğunda handoff veya push öncesinde
      `pnpm check:changed` komutunu açıkça çalıştırın.
    - `pnpm test:changed`, varsayılan olarak ucuz kapsamlı lane'ler üzerinden yönlendirilir. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` komutunu yalnızca agent bir harness, config, package veya contract düzenlemesinin gerçekten daha geniş Vitest kapsamına ihtiyaç duyduğuna karar verdiğinde kullanın.
    - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur,
      yalnızca daha yüksek bir worker sınırıyla.
    - Yerel worker otomatik ölçekleme bilinçli olarak muhafazakârdır ve host load average
      zaten yüksek olduğunda geri çekilir; bu yüzden birden fazla eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest config, test bağlantıları değiştiğinde changed-mode yeniden çalıştırmalarının
      doğru kalması için projeleri/config dosyalarını `forceRerunTriggers` olarak işaretler.
    - Config, desteklenen host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` değerini etkin tutar;
      doğrudan profiling için tek bir açık cache konumu istiyorsanız
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Perf hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-duration raporlamasını ve
      import-breakdown çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profiling görünümünü `origin/main` sonrası
      değişen dosyalarla sınırlar.
    - Shard timing verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Whole-config çalıştırmaları anahtar olarak config yolunu kullanır; include-pattern CI
      shard'ları, filtrelenmiş shard'ların ayrı izlenebilmesi için shard adını ekler.
    - Sıcak bir test hâlâ zamanının çoğunu başlatma import'larında harcıyorsa,
      ağır dependency'leri dar bir yerel `*.runtime.ts` seam'inin arkasında tutun ve
      sırf `vi.mock(...)` üzerinden geçirmek için runtime helper'larını deep-import etmek yerine
      o seam'i doğrudan mock edin.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, routed
      `test:changed` değerini o commit'lenmiş diff için yerel kök proje yolu ile karşılaştırır
      ve wall time ile macOS max RSS yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek mevcut
      dirty tree'yi benchmark eder.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform overhead'i için
      main-thread CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken unit suite için
      runner CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak diagnostics etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Diagnostic event yolu üzerinden sentetik gateway mesajı, memory ve large-payload churn'ü yürütür
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Diagnostic stability bundle persistence helper'larını kapsar
  - Recorder'ın sınırlı kaldığını, sentetik RSS örneklerinin pressure budget altında kaldığını ve session başına queue depth'lerin tekrar sıfıra indiğini assert eder
- Beklentiler:
  - CI-safe ve anahtarsız
  - Stability-regression takibi için dar lane; tam Gateway suite'inin yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketli Plugin E2E testleri
- Runtime varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Console I/O overhead'ini azaltmak için varsayılan olarak silent modda çalışır.
- Kullanışlı override'lar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlıdır).
  - Ayrıntılı console çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node pairing ve daha ağır networking
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlere göre daha fazla hareketli parçaya sahiptir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla host üzerinde izole bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan sandbox oluşturur
  - OpenClaw'ın OpenShell backend'ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs bridge üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca opt-in; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway'ini ve sandbox'ı yok eder
- Kullanışlı override'lar:
  - Daha geniş e2e suite'i manuel çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya wrapper script'e işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek providers + gerçek models)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketli Plugin canlı testleri
- Varsayılan: `pnpm test:live` tarafından **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu provider/model gerçek kimlik bilgileriyle _bugün_ gerçekten çalışıyor mu?”
  - Provider format değişikliklerini, tool-calling tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-stable değildir (gerçek ağlar, gerçek provider politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri çalıştırmayı tercih edin
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını source eder.
- Varsayılan olarak, canlı çalıştırmalar yine de `HOME` değerini izole eder ve unit fixture'larının gerçek `~/.openclaw` dizininizi mutate edememesi için config/auth material'ını geçici bir test home'a kopyalar.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` değerini yalnızca canlı testlerin bilerek gerçek home dizininizi kullanmasına ihtiyacınız olduğunda ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir moda geçer: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap log'larını/Bonjour chatter'ını susturur. Tam startup log'larını geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (provider'a özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da `OPENCLAW_LIVE_*_KEY` ile canlıya özel override kullanın; testler rate limit yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı suite'ler artık stderr'e ilerleme satırları yayar; böylece uzun provider çağrıları Vitest console capture sessiz olsa bile görünür şekilde aktiftir.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında provider/Gateway ilerleme satırlarının hemen stream edilmesi için Vitest console interception'ı devre dışı bırakır.
  - Direct-model Heartbeat'leri `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'leri `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi suite'i çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Düzenleme mantığı/testleri: `pnpm test` çalıştırın (çok değişiklik yaptıysanız `pnpm test:coverage` da çalıştırın)
- Gateway ağına / WS protokolüne / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü hatalar / araç çağırma hata ayıklaması: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke testleri, ACP smoke testleri, Codex uygulama sunucusu
koşumu ve tüm medya sağlayıcısı canlı testleri (Deepgram, BytePlus, ComfyUI, görüntü,
müzik, video, medya koşumu) — ayrıca canlı çalıştırmalar için kimlik bilgisi yönetimi — için
bkz. [Test — canlı paketler](/tr/help/testing-live).

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki gruba ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil anahtarlı canlı dosyalarını (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`) çalıştırır; yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynak olarak kullanır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam bir Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça
  istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını `test:docker:live-build` üzerinden bir kez derler, `scripts/package-openclaw-for-docker.mjs` ile OpenClaw'ı bir kez npm tarball olarak paketler, ardından iki `scripts/e2e/Dockerfile` imajı derler/yeniden kullanır. Yalın imaj, kurulum/güncelleme/Plugin bağımlılığı kulvarları için yalnızca Node/Git çalıştırıcısıdır; bu kulvarlar önceden derlenmiş tarball'u bağlar. İşlevsel imaj, derlenmiş uygulama işlevselliği kulvarları için aynı tarball'u `/app` içine kurar. Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. Toplu çalışma ağırlıklı bir yerel zamanlayıcı kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` işlem yuvalarını kontrol ederken, kaynak sınırları ağır canlı, npm-kurulum ve çok hizmetli kulvarların hepsinin aynı anda başlamasını engeller. Tek bir kulvar etkin sınırlardan daha ağırsa, zamanlayıcı havuz boşken yine de onu başlatabilir ve kapasite yeniden kullanılabilir olana kadar tek başına çalışır durumda tutar. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` değerlerini yalnızca Docker ana makinesinde daha fazla pay olduğunda ayarlayın. Çalıştırıcı varsayılan olarak bir Docker ön kontrolü yapar, eski OpenClaw E2E konteynerlerini kaldırır, her 30 saniyede bir durumu yazdırır, başarılı kulvar sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar ve sonraki çalıştırmalarda daha uzun kulvarları önce başlatmak için bu süreleri kullanır. Docker derlemeden veya çalıştırmadan ağırlıklı kulvar manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın ya da seçilen kulvarlar, paket/imaj ihtiyaçları ve kimlik bilgileri için CI planını yazdırmak üzere `node scripts/test-docker-all.mjs --plan-json` çalıştırın.
- `Package Acceptance`, "bu kurulabilir tarball bir ürün olarak çalışıyor mu?" sorusu için GitHub yerel paket kapısıdır. `source=npm`, `source=ref`, `source=url` veya `source=artifact` üzerinden bir aday paketi çözer, onu `package-under-test` olarak yükler, ardından seçilen ref'i yeniden paketlemek yerine yeniden kullanılabilir Docker E2E kulvarlarını tam olarak bu tarball'a karşı çalıştırır. `workflow_ref` güvenilen iş akışı/koşum betiklerini seçerken, `package_ref` `source=ref` olduğunda paketlenecek kaynak commit/branch/tag değerini seçer; bu, güncel kabul mantığının daha eski güvenilir commit'leri doğrulamasını sağlar. Profiller genişliğe göre sıralanır: `smoke` hızlı kurulum/kanal/agent artı Gateway/yapılandırmadır, `package` paket/güncelleme/Plugin sözleşmesidir ve çoğu Parallels paket/güncelleme kapsamı için varsayılan yerel ikamedir, `product` MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI ekler, `full` ise OpenWebUI ile yayın yolu Docker parçalarını çalıştırır. Yayın doğrulaması özel bir paket deltası (`bundled-channel-deps-compat plugins-offline`) artı Telegram paket QA çalıştırır; çünkü yayın yolu Docker parçaları çakışan paket/güncelleme/Plugin kulvarlarını zaten kapsar. Artefaktlardan üretilen hedefli GitHub Docker yeniden çalıştırma komutları, varsa önceki paket artefaktını ve hazırlanmış imaj girdilerini içerir; böylece başarısız kulvarlar paketi ve imajları yeniden derlemekten kaçınabilir.
- Derleme ve yayın kontrolleri, tsdown sonrasında `scripts/check-cli-bootstrap-imports.mjs` çalıştırır. Koruma, `dist/entry.js` ve `dist/cli/run-main.js` üzerinden statik derlenmiş grafiği dolaşır ve komut dağıtımından önceki başlangıç aşaması Commander, prompt UI, undici veya günlükleme gibi paket bağımlılıklarını komut dağıtımından önce içe aktarırsa başarısız olur; ayrıca paketlenmiş Gateway çalıştırma parçasını bütçe altında tutar ve bilinen soğuk Gateway yollarının statik içe aktarımlarını reddeder. Paketlenmiş CLI smoke ayrıca kök yardımını, onboarding yardımını, doctor yardımını, durumu, yapılandırma şemasını ve bir model listesi komutunu kapsar.
- Package Acceptance eski uyumluluğu `2026.4.25` ile sınırlıdır (`2026.4.25-beta.*` dahil). Bu sınıra kadar koşum yalnızca gönderilmiş paket metadata boşluklarını tolere eder: atlanmış özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture içinde eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma metadata migrasyonu. `2026.4.25` sonrasındaki paketlerde bu yollar katı başarısızlıktır.
- Konteyner smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload` bir veya daha fazla gerçek konteyner başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth ana dizinlerini (veya çalışma daraltılmamışsa desteklenenlerin tamamını) bind-mount eder, ardından harici CLI OAuth'un ana makine auth deposunu değiştirmeden token yenileyebilmesi için bunları çalıştırmadan önce konteyner ana dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini'yi kapsar; Droid/OpenCode kapsamı için `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode` ile sıkı kapsam sağlar)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme aracısı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Gözlemlenebilirlik smoke: `pnpm qa:otel:smoke` özel bir QA kaynak-checkout hattıdır. npm tarball QA Lab'ı dışarıda bıraktığı için kasıtlı olarak paket Docker sürüm hatlarının parçası değildir.
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Başlatma sihirbazı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball başlatma/kanal/aracı smoke: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, env-ref başlatma üzerinden OpenAI'yi ve varsayılan olarak Telegram'ı yapılandırır, doctor onarımlarının etkinleştirilmiş Plugin çalışma zamanı bağımlılıklarını doğrular ve bir taklit OpenAI aracı turu çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Güncelleme kanalı değiştirme smoke: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, paket `stable` kanalından git `dev` kanalına geçer, kalıcı kanalın ve Plugin güncelleme sonrası çalışmanın doğrulandığını doğrular, ardından paket `stable` kanalına geri döner ve güncelleme durumunu denetler.
- Oturum çalışma zamanı bağlamı smoke: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı transkript kalıcılığını ve etkilenen yinelenmiş prompt-yeniden-yazma dallarının doctor onarımını doğrular.
- Bun global kurulum smoke: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, yalıtılmış bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine paketlenmiş görüntü sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya derlenmiş bir Docker görüntüsünden `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` ile `dist/` kopyalayın.
- Kurucu Docker smoke: `bash scripts/test-install-sh-docker.sh`, root, update ve direct-npm container'ları arasında tek bir npm cache paylaşır. Update smoke, aday tarball'a yükseltmeden önce kararlı temel olarak varsayılan şekilde npm `latest` kullanır. Yerelde `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ile veya GitHub'da Install Smoke iş akışının `update_baseline_version` girdisiyle geçersiz kılın. Root olmayan kurucu denetimleri, root'a ait cache girdilerinin kullanıcı-yerel kurulum davranışını maskelememesi için yalıtılmış bir npm cache tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm cache'i yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, yinelenen direct-npm global güncellemeyi `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile atlar; doğrudan `npm install -g` kapsamı gerektiğinde betiği yerelde bu env olmadan çalıştırın.
- Agents paylaşılan workspace CLI silme smoke: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) varsayılan olarak kök Dockerfile görüntüsünü derler, yalıtılmış bir container home içinde tek workspace'e sahip iki aracı tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunmuş workspace davranışını doğrular. Install-smoke görüntüsünü `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağ iletişimi (iki container, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Tarayıcı CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`) kaynak E2E görüntüsünü ve bir Chromium katmanını derler, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, cursor-promoted tıklanabilirleri, iframe ref'lerini ve frame metadata'sını kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway üzerinden taklit bir OpenAI sunucusu çalıştırır, `web_search` işleminin `reasoning.effort` değerini `minimal` değerinden `low` değerine yükselttiğini doğrular, ardından sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginler (kurulum smoke, ClawHub kitchen-sink kurma/kaldırma, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan kitchen-sink paket/çalışma zamanı çiftini `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` olmadan test, hermetik bir yerel ClawHub fixture sunucusu kullanır.
- Plugin güncelleme değişmemiş smoke: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş Plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps` varsayılan olarak küçük bir Docker runner görüntüsü derler, OpenClaw'ı ana makinede bir kez derleyip paketler, ardından bu tarball'ı her Linux kurulum senaryosuna mount eder. Görüntüyü `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra ana makine yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'ı `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile gösterin. Tam Docker agregası ve sürüm-yolu paketlenmiş-kanal parçaları bu tarball'ı bir kez önceden paketler, ardından paketlenmiş kanal denetimlerini Telegram, Discord, Slack, Feishu, memory-lancedb ve ACPX için ayrı güncelleme hatları dahil olmak üzere bağımsız hatlara böler. Sürüm parçaları kanal smoke'larını, güncelleme hedeflerini ve kurulum/çalışma zamanı sözleşmelerini `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` ve `bundled-channels-contracts` olarak ayırır; agrega `bundled-channels` parçası manuel yeniden çalıştırmalar için kullanılabilir kalır. Sürüm iş akışı ayrıca sağlayıcı kurucu parçalarını ve paketlenmiş Plugin kurma/kaldırma parçalarını ayırır; eski `package-update`, `plugins-runtime` ve `plugins-integrations` parçaları manuel yeniden çalıştırmalar için agrega alias'ları olarak kalır. Paketlenmiş hattı doğrudan çalıştırırken kanal matrisini daraltmak için `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` kullanın veya güncelleme senaryosunu daraltmak için `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` kullanın. Senaryo başına Docker çalıştırmaları varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` kullanır; çok hedefli güncelleme senaryosu varsayılan olarak `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` kullanır. Hat ayrıca `channels.<id>.enabled=false` ve `plugins.entries.<id>.enabled=false` değerlerinin doctor/çalışma zamanı-bağımlılığı onarımını bastırdığını doğrular.
- Yineleme sırasında alakasız senaryoları devre dışı bırakarak paketlenmiş Plugin çalışma zamanı bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan işlevsel görüntüyü elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi suite'e özgü görüntü geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan görüntüyü gösterdiğinde, betikler görüntü zaten yerelde değilse onu çeker. QR ve kurucu Docker testleri kendi Dockerfile'larını korur; çünkü paylaşılan derlenmiş-uygulama çalışma zamanı yerine paket/kurulum davranışını doğrularlar.

Canlı-model Docker runner'ları ayrıca geçerli checkout'ı salt okunur bind-mount eder ve
container içinde geçici bir workdir'e stage eder. Bu, tam yerel source/config'inize
karşı Vitest çalıştırmaya devam ederken çalışma zamanı görüntüsünü küçük tutar.
Stage adımı, `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve app-local `.build` veya
Gradle çıktı dizinleri gibi büyük yerel-özel cache'leri ve uygulama derleme çıktılarını atlar;
böylece Docker canlı çalıştırmaları makineye özgü artifact'leri kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı prob'ları container içinde
gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden Docker hattından
Gateway canlı kapsamını daraltmanız veya dışlamanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*`
değerlerini de geçirin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke'udur: OpenAI uyumlu HTTP
endpoint'leri etkinleştirilmiş bir OpenClaw Gateway container'ı başlatır, bu Gateway'e karşı
sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` yolunun `openclaw/default` sunduğunu doğrular, ardından Open WebUI'nin
`/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker'ın Open WebUI görüntüsünü
çekmesi ve Open WebUI'nin kendi soğuk-başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) Docker'laştırılmış çalıştırmalarda bunu sağlamanın birincil yoludur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container'ı başlatır, `openclaw mcp serve` oluşturan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transkript okumalarını, ek metadata'sını,
canlı event queue davranışını, dışa gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden
Claude tarzı kanal + izin bildirimlerini doğrular. Bildirim denetimi ham stdio MCP frame'lerini
doğrudan inceler; böylece smoke, yalnızca belirli bir client SDK'nın yüzeye çıkardığını değil,
köprünün gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı model anahtarına ihtiyaç duymaz.
Repo Docker görüntüsünü derler, container içinde gerçek bir stdio MCP prob sunucusu başlatır,
bu sunucuyu gömülü Pi bundle MCP çalışma zamanı üzerinden somutlaştırır, aracı yürütür,
ardından `coding` ve `messaging` değerlerinin `bundle-mcp` araçlarını koruduğunu,
`minimal` ve `tools.deny: ["bundle-mcp"]` değerlerinin ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model anahtarına ihtiyaç duymaz.
Gerçek bir stdio MCP prob sunucusuyla tohumlanmış bir Gateway başlatır, yalıtılmış bir cron turu
ve bir `/subagents spawn` tek seferlik child turu çalıştırır, ardından MCP child sürecinin
her çalıştırmadan sonra çıktığını doğrular.

Manuel ACP düz-dil thread smoke (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için tutun. ACP iş parçacığı yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env var’ları:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` içine bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` içine bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` içine bağlanır ve testleri çalıştırmadan önce kaynak olarak yüklenir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici yapılandırma/çalışma alanı dizinleri kullanarak ve harici CLI kimlik doğrulama bağlamaları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynak olarak yüklenen env var’larını doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` içine bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altına salt okunur bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir listeyle elle geçersiz kılın
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, çalıştırmayı daraltmak için
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, kapsayıcı içinde sağlayıcıları filtrelemek için
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut bir `openclaw:local-live` imajını yeniden kullanmak için
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, kimlik bilgilerinin profilden geldiğinden emin olmak için (env’den değil)
- `OPENCLAW_OPENWEBUI_MODEL=...`, Open WebUI smoke için Gateway tarafından sunulan modeli seçmek için
- `OPENCLAW_OPENWEBUI_PROMPT=...`, Open WebUI smoke tarafından kullanılan nonce denetimi istemini geçersiz kılmak için
- `OPENWEBUI_IMAGE=...`, sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için

## Doküman sağlamlık kontrolü

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrim dışı regresyon (CI güvenli)

Bunlar gerçek sağlayıcılar olmadan çalışan “gerçek pipeline” regresyonlarıdır:

- Gateway tool calling (sahte OpenAI, gerçek Gateway + aracı döngüsü): `src/gateway/gateway.test.ts` (vaka: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırma yazar + kimlik doğrulama zorunlu kılınır): `src/gateway/gateway.test.ts` (vaka: "runs wizard over ws and writes auth token config")

## Aracı güvenilirlik değerlendirmeleri (Skills)

Zaten “aracı güvenilirlik değerlendirmeleri” gibi davranan birkaç CI güvenli testimiz var:

- Gerçek Gateway + aracı döngüsü üzerinden sahte tool-calling (`src/gateway/gateway.test.ts`).
- Oturum bağlantılarını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar ([Skills](/tr/tools/skills) sayfasına bakın):

- **Karar verme:** Skills istemde listelendiğinde, aracı doğru Skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** aracı kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırayı, Skill dosyası okumalarını ve oturum bağlantılarını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcı.
- Skill odaklı küçük bir senaryo paketi (kullanma ve kaçınma, geçitleme, istem enjeksiyonu).
- İsteğe bağlı canlı değerlendirmeler (isteğe bağlı, env ile kapılı) yalnızca CI güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve kanal biçimi)

Sözleşme testleri, kayıtlı her Plugin’in ve kanalın kendi arayüz
sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde döner ve bir
biçim ile davranış doğrulaması paketi çalıştırırlar. Varsayılan `pnpm test`
birim hattı bu paylaşılan bağlantı noktası ve smoke dosyalarını bilinçli olarak
atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme
komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin biçimi (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - İş parçacığı kimliği işleme
- **directory** - Dizin/kadro API’si
- **group-policy** - Grup politikası uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probları
- **registry** - Plugin kayıt defteri biçimi

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçme
- **catalog** - Model katalog API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin biçimi/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılır

- plugin-sdk dışa aktarımları veya alt yolları değiştirildikten sonra
- Bir kanal ya da sağlayıcı Plugin’i eklendikten veya değiştirildikten sonra
- Plugin kaydı veya keşfi yeniden düzenlendikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (kılavuz)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek biçimi dönüşümünü yakalayın)
- Doğası gereği yalnızca canlıysa (hız sınırları, kimlik doğrulama politikaları), canlı testi dar tutun ve env var’larıyla isteğe bağlı yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - Gateway oturum/geçmiş/araç pipeline hatası → Gateway canlı smoke veya CI güvenli Gateway sahte testi
- SecretRef dolaşma güvenlik rayı:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri metadata’sından (`listSecretTargetRegistryEntries()`) her SecretRef sınıfı için örneklenmiş bir hedef türetir, ardından dolaşma segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` öğesini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için sınıflandırılmamış hedef kimliklerinde bilinçli olarak başarısız olur.

## İlgili

- [Canlı test](/tr/help/testing-live)
- [CI](/tr/ci)
