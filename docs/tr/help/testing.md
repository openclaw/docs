---
read_when:
    - Testleri yerelde veya CI içinde çalıştırma
    - Model/sağlayıcı hataları için gerileme testleri ekleme
    - Gateway + ajan davranışını hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadığı alanlar'
title: Test etme
x-i18n:
    generated_at: "2026-04-26T11:33:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw, üç Vitest paketine (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesine sahiptir. Bu belge bir "nasıl test ediyoruz" kılavuzudur:

- Her paketin neyi kapsadığı (ve özellikle neyi _kapsamadığı_).
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama).
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve modelleri/sağlayıcıları nasıl seçtiği.
- Gerçek dünya model/sağlayıcı sorunları için gerilemelerin nasıl ekleneceği.

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push'tan önce beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + gateway araç/görsel sondaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker canlı model taraması: `pnpm test:docker:live-models`
  - Seçilen her model artık bir metin turu ve küçük bir dosya okuma tarzı sonda çalıştırır.
    Meta verileri `image` girdisini duyuran modeller ayrıca küçük bir görsel turu da çalıştırır.
    Sağlayıcı hatalarını izole ederken ek sondaları
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, `include_live_suites: true` ile yeniden kullanılabilir live/E2E iş akışını çağırır;
    buna sağlayıcıya göre parçalanmış ayrı Docker canlı model
    matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true`
    ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    ile `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dosyasına ve onun
    zamanlanmış/sürüm çağıranlarına ekleyin.
- Yerel Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Docker canlı hattını Codex uygulama sunucusu yoluna karşı çalıştırır, sentetik
    bir Slack DM'yi `/codex bind` ile bağlar, `/codex fast` ve
    `/codex permissions` komutlarını dener, ardından düz bir yanıtın ve görsel ekinin
    ACP yerine yerel Plugin binding üzerinden yönlendirildiğini doğrular.
- Codex uygulama sunucusu harness smoke: `pnpm test:docker:live-codex-harness`
  - Gateway ajan turlarını Plugin'e ait Codex uygulama sunucusu harness'i üzerinden çalıştırır,
    `/codex status` ve `/codex models` komutlarını doğrular ve varsayılan olarak görsel,
    cron MCP, alt ajan ve Guardian sondalarını dener. Alt ajan sondasını
    diğer Codex uygulama sunucusu hatalarını izole ederken
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ile devre dışı bırakın. Odaklı bir alt ajan denetimi için diğer sondaları kapatın:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Bu, `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
    ayarlanmadıkça alt ajan sondasından sonra çıkar.
- Crestodian kurtarma komutu smoke: `pnpm test:live:crestodian-rescue-channel`
  - Mesaj kanalı kurtarma komutu yüzeyi için isteğe bağlı ek güvenlik denetimi.
    `/crestodian status` komutunu dener, kalıcı bir model
    değişikliğini kuyruğa alır, `/crestodian yes` yanıtını verir ve denetim/yapılandırma yazma yolunu doğrular.
- Crestodian planlayıcı Docker smoke: `pnpm test:docker:crestodian-planner`
  - Crestodian'ı `PATH` üzerinde sahte bir Claude CLI ile yapılandırmasız bir kapsayıcıda çalıştırır
    ve bulanık planlayıcı yedeğinin denetlenmiş, türlenmiş
    bir yapılandırma yazımına çevrildiğini doğrular.
- Crestodian ilk çalıştırma Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Boş bir OpenClaw durum dizininden başlar, çıplak `openclaw` komutunu
    Crestodian'a yönlendirir, setup/model/agent/Discord Plugin + SecretRef yazımlarını uygular,
    yapılandırmayı doğrular ve denetim girdilerini doğrular. Aynı Ring 0 kurulum yolu
    QA Lab içinde de
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
    ile kapsanır.
- Moonshot/Kimi maliyet smoke: `MOONSHOT_API_KEY` ayarlıysa,
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` karşısında izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON çıktısının Moonshot/K2.6 bildirdiğini ve
  asistan dökümünün normalize edilmiş `usage.cost` sakladığını doğrulayın.

İpucu: yalnızca tek bir başarısız olaya ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleriyle canlı testleri daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'ı ayrılmış iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'larda ve
manuel tetiklemede mock sağlayıcılarla çalışır. `QA-Lab - All Lanes`, gecelik olarak
`main` üzerinde ve manuel tetiklemede mock parity gate, canlı Matrix hattı ve
Convex tarafından yönetilen canlı Telegram hattını paralel işler olarak çalıştırır. `OpenClaw Release Checks`
aynı hatları sürüm onayından önce çalıştırır.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak birden fazla seçili senaryoyu yalıtılmış
    gateway worker'ları ile paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır
    (seçilen senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat için ise `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır dışı kodla çıkar. Başarısız çıkış kodu olmadan yapıt istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı kiplerini destekler.
    `aimock`, deneysel fixture ve protokol-mock kapsamı için yerel AIMock destekli
    bir sağlayıcı sunucusu başlatır; senaryo farkındalıklı
    `mock-openai` hattının yerine geçmez.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA auth girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır, böylece konuk bağlanan çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özeti ile Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde küresel olarak kurar,
    etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram'ı yapılandırır,
    Plugin'i etkinleştirmenin çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu doğrular,
    doctor çalıştırır ve mock edilmiş bir OpenAI
    uç noktasına karşı bir yerel ajan turu çalıştırır.
  - Aynı paketli-kurulum
    hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:session-runtime-context`
  - Gömülü çalışma zamanı bağlamı dökümleri için deterministik bir built-app Docker smoke çalıştırır.
    Gizli OpenClaw çalışma zamanı bağlamının görünür kullanıcı turuna sızmak yerine
    görüntülenmeyen özel bir mesaj olarak kalıcılaştırıldığını doğrular,
    sonra etkilenmiş bozuk bir oturum JSONL'sini tohumlar ve
    `openclaw doctor --fix` komutunun bunu aktif dala yedekle birlikte yeniden yazdığını doğrular.
- `pnpm test:docker:npm-telegram-live`
  - Yayınlanmış bir OpenClaw paketini Docker içinde kurar, kurulu paket
    onboarding çalıştırır, Telegram'ı kurulu CLI üzerinden yapılandırır, sonra
    canlı Telegram QA hattını SUT Gateway olarak bu kurulu paketle yeniden kullanır.
  - Varsayılan olarak `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` kullanır.
  - `pnpm openclaw qa telegram` ile aynı Telegram ortam kimlik bilgilerini veya Convex kimlik bilgisi kaynağını kullanır.
    CI/sürüm otomasyonu için
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ile birlikte
    `OPENCLAW_QA_CONVEX_SITE_URL` ve rol sırrını ayarlayın. Eğer
    `OPENCLAW_QA_CONVEX_SITE_URL` ve bir Convex rol sırrı CI içinde mevcutsa,
    Docker sarmalayıcısı Convex'i otomatik seçer.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`, paylaşılan
    `OPENCLAW_QA_CREDENTIAL_ROLE` değerini yalnızca bu hat için geçersiz kılar.
  - GitHub Actions bu hattı manuel bakımcı iş akışı
    `NPM Telegram Beta E2E` olarak sunar. Birleştirmede çalışmaz. İş akışı,
    `qa-live-shared` ortamını ve Convex CI kimlik bilgisi kiralarını kullanır.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketleyip kurar, Gateway'i
    OpenAI yapılandırılmış şekilde başlatır, ardından birlikte gelen kanal/Plugin'leri config
    düzenlemeleriyle etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış Plugin çalışma zamanı bağımlılıklarını
    mevcut bırakmadığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her birlikte gelen
    Plugin'in çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu ve ikinci yeniden başlatmanın
    zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temel sürümünü kurar, Telegram'ı
    `openclaw update --tag <candidate>` çalıştırmadan önce etkinleştirir ve adayın
    güncelleme sonrası doctor işleminin birlikte gelen kanal çalışma zamanı bağımlılıklarını
    harness tarafında bir postinstall onarımı olmadan düzelttiğini doğrular.
- `pnpm test:parallels:npm-update`
  - Yerel paketli-kurulum güncelleme smoke'unu Parallels konukları arasında çalıştırır. Her
    seçili platform önce istenen temel paketi kurar, ardından aynı konuk içinde
    kurulu `openclaw update` komutunu çalıştırır ve kurulu sürümü, güncelleme durumunu,
    gateway hazır olma durumunu ve bir yerel ajan turunu doğrular.
  - Tek bir konuk üzerinde yineleme yaparken `--platform macos`, `--platform windows` veya `--platform linux` kullanın.
    Özet yapıt yolu ve hat başına durum için `--json` kullanın.
  - OpenAI hattı, varsayılan olarak canlı ajan-turu kanıtı için `openai/gpt-5.5` kullanır.
    Bilinçli olarak başka bir OpenAI modelini doğrularken `--model <provider/model>` geçin veya
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ayarlayın.
  - Parallels taşıma duraklamalarının test penceresinin geri kalanını tüketememesi için
    uzun yerel çalıştırmaları host zaman aşımı ile sarın:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Betik iç içe hat günlüklerini `/tmp/openclaw-parallels-npm-update.*` altına yazar.
    Dış sarmalayıcının takıldığını varsaymadan önce `windows-update.log`, `macos-update.log` veya `linux-update.log`
    dosyalarını inceleyin.
  - Windows güncellemesi, soğuk bir konukta güncelleme sonrası doctor/çalışma zamanı
    bağımlılığı onarımında 10 ila 15 dakika geçirebilir; içteki
    npm debug günlüğü ilerliyorsa bu hâlâ sağlıklıdır.
  - Bu toplu sarmalayıcıyı tekil Parallels
    macOS, Windows veya Linux smoke hatlarıyla paralel çalıştırmayın. Aynı VM durumunu paylaşırlar ve
    anlık görüntü geri yükleme, paket sunumu veya konuk gateway durumu üzerinde çakışabilirler.
  - Güncelleme sonrası kanıt, normal birlikte gelen Plugin yüzeyini çalıştırır çünkü
    konuşma, görsel üretimi ve medya
    anlama gibi yetenek facade'ları, ajan turunun kendisi yalnızca basit bir metin yanıtını denetlese bile
    birlikte gelen çalışma zamanı API'leri üzerinden yüklenir.

- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA host'u bugün yalnızca repo/geliştirme içindir. Paketli OpenClaw kurulumları
    `qa-lab` ile gelmez, bu yüzden `openclaw qa` sunmazlar.
  - Repo checkout'ları birlikte gelen çalıştırıcıyı doğrudan yükler; ayrı bir Plugin kurulum
    adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda hazırlar, sonra SUT taşıması olarak gerçek Matrix Plugin'i ile bir QA gateway child başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanır. Farklı bir imaj test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hat geçici kullanıcıları yerel olarak hazırladığı için paylaşılan kimlik bilgisi kaynağı bayraklarını açığa çıkarmaz.
  - Matrix QA raporu, özet, gözlenen olaylar yapıtı ve birleşik stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
  - Varsayılan olarak ilerleme yayar ve `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ile katı bir çalışma zaman aşımı uygular (varsayılan 30 dakika). Temizlik `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ile sınırlandırılır ve başarısızlıklarda kurtarma için `docker compose ... down --remove-orphans` komutu da verilir.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını ortam değişkenlerinden gelen driver ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env kipini kullanın veya havuzlanmış kiralamalara geçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır dışı kodla çıkar. Başarısız çıkış kodu olmadan yapıt istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir ve SUT bot'unun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı botlar arası gözlem için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve driver bot'unun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özeti ve gözlenen mesajlar yapıtını `.artifacts/qa-e2e/...` altına yazar. Yanıt senaryolarında driver gönderim isteğinden gözlenen SUT yanıtına kadar RTT de dahildir.

Canlı taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve canlı
taşıma kapsamı matrisinin parçası değildir.

| Hat      | Canary | Bahsetme sınırlaması | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sonrası devam | Konu takibi | Konu yalıtımı | Reaksiyon gözlemi | Yardım komutu |
| -------- | ------ | -------------------- | ---------------- | --------------- | ------------------------------ | ----------- | ------------- | ----------------- | ------------- |
| Matrix   | x      | x                    | x                | x               | x                              | x           | x             | x                 |               |
| Telegram | x      |                      |                  |                 |                                |             |               |                   | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkin olduğunda,
QA lab Convex destekli bir havuzdan özel bir kira alır, hat çalışırken
o kiraya Heartbeat gönderir ve kapanışta kirayı serbest bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir sır:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Ortam varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Canlı çalıştırmalardan önce Convex site URL'sini, broker sırlarını,
uç nokta önekini, HTTP zaman aşımını ve yönetici/liste erişilebilirliğini gizli değerleri yazdırmadan kontrol etmek için `doctor` kullanın. Betikler ve CI
yardımcı araçlarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
  - Etkin kira koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca bakımcı sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için yük şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği string'i olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı yükleri reddeder.

### QA'ya kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışın sahibi olabildiğinde yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlangıcı ve kapanışı
- worker eşzamanlılığı
- yapıt yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altında nasıl bağlandığı
- gateway'in o taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlendiği
- dökümlerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için en düşük benimseme eşiği şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` host dikişinde uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugin veya kanal harness'i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı Plugin'leri `openclaw.plugin.json` içinde `qaRunners` tanımlamalı ve `runtime-api.ts` içinden buna karşılık gelen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Tematik `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Bir davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış bir kanal taşımaya bağlıysa, bunu o çalıştırıcı Plugin veya Plugin harness'i içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

Yeni senaryolar için tercih edilen genel yardımcı adları şunlardır:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Uyumluluk takma adları mevcut senaryolar için kullanılabilir olmaya devam eder; bunlara şunlar dahildir:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bir bayrak günü geçişinden kaçınmak için vardır, yeni senaryo yazımı için model olmak için değil.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel planlama için çok projeli shard'ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` ve `vitest.unit.config.ts` tarafından kapsanan izinli `ui` node testleri altındaki core/unit envanterleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi entegrasyon testleri (gateway auth, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik gerilemeler
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır

<AccordionGroup>
  <Accordion title="Projeler, shard'lar ve kapsamlı hatlar">

    - Hedeflenmemiş `pnpm test`, tek bir dev yerel kök-proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
    - `pnpm test --watch` yine yerel kök `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard'lı bir izleme döngüsü pratik değildir.
    - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; bu sayede `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlangıç maliyetini ödemez.
    - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri hâlâ geniş kök-proje yeniden çalıştırmasına geri döner.
    - `pnpm check:changed`, dar işler için normal akıllı yerel geçittir. Farkı core, core testleri, extensions, extension testleri, uygulamalar, belgeler, sürüm meta verileri, canlı Docker araçları ve araçlama olarak sınıflandırır; ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri, extensions bu core sözleşmelerine bağlı olduğundan bir extension doğrulama geçişi içerir. Yalnızca sürüm meta verisine ait sürüm artışları, tam paket yerine hedefli sürüm/yapılandırma/kök bağımlılık denetimleri çalıştırır ve üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir korumaya sahiptir.
    - Canlı Docker ACP harness düzenlemeleri odaklı bir yerel geçit çalıştırır: canlı Docker auth betikleri için shell sözdizimi, canlı Docker scheduler dry-run, ACP bind unit testleri ve ACPX extension testleri. `package.json` değişiklikleri yalnızca fark `scripts["test:docker:live-*"]` ile sınırlıysa dahil edilir; bağımlılık, export, sürüm ve diğer paket yüzeyi düzenlemeleri hâlâ daha geniş korumaları kullanır.
    - Ajanlar, komutlar, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardaki import-light unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durumsal/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
    - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaz.
    - `auto-reply`; üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı için ayrılmış kümelere sahiptir. CI ayrıca reply alt ağacını agent-runner, dispatch ve commands/state-routing shard'larına böler, böylece import-ağır tek bir küme tüm Node kuyruğuna sahip olmaz.

  </Accordion>

  <Accordion title="Gömülü çalıştırıcı kapsamı">

    - Mesaj-aracı keşif girdilerini veya Compaction çalışma zamanı
      bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
    - Saf yönlendirme ve normalleştirme
      sınırları için odaklı yardımcı gerilemeleri ekleyin.
    - Gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının hâlâ
      gerçek `run.ts` / `compact.ts` yolları üzerinden aktığını doğrular; yalnızca yardımcı testleri
      bu entegrasyon yolları için yeterli bir ikame değildir.

  </Accordion>

  <Accordion title="Vitest havuzu ve yalıtım varsayılanları">

    - Temel Vitest yapılandırması varsayılan olarak `threads` kullanır.
    - Paylaşılan Vitest yapılandırması `isolate: false` değerini sabitler ve
      kök projeler, e2e ve live yapılandırmalarında
      yalıtılmamış çalıştırıcıyı kullanır.
    - Kök UI hattı kendi `jsdom` kurulumu ve optimizer'ını korur, ancak
      paylaşılan yalıtılmamış çalıştırıcı üzerinde çalışır.
    - Her `pnpm test` shard'ı aynı `threads` + `isolate: false`
      varsayılanlarını paylaşılan Vitest yapılandırmasından devralır.
    - `scripts/run-vitest.mjs`, büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için
      Vitest child Node süreçlerine varsayılan olarak `--no-maglev` ekler.
      Varsayılan V8 davranışıyla karşılaştırmak için `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      ayarlayın.

  </Accordion>

  <Accordion title="Hızlı yerel yineleme">

    - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
    - Pre-commit kancası yalnızca biçimlendirme yapar. Biçimlendirilmiş dosyaları yeniden stage eder
      ve lint, typecheck veya test çalıştırmaz.
    - Akıllı yerel geçide ihtiyacınız olduğunda,
      devretmeden veya push etmeden önce `pnpm check:changed` komutunu açıkça çalıştırın.
      Genel Plugin SDK ve plugin-contract
      değişiklikleri bir extension doğrulama geçişi içerir.
    - `pnpm test:changed`, değişen yollar daha küçük bir pakete
      temiz şekilde eşlendiğinde kapsamlı hatlar üzerinden yönlendirilir.
    - `pnpm test:max` ve `pnpm test:changed:max`, aynı yönlendirme
      davranışını korur, yalnızca daha yüksek worker sınırıyla.
    - Yerel worker otomatik ölçekleme bilinçli olarak tutucudur ve
      host yük ortalaması zaten yüksek olduğunda geri çekilir; böylece birden fazla eşzamanlı
      Vitest çalıştırması varsayılan olarak daha az zarar verir.
    - Temel Vitest yapılandırması projeleri/yapılandırma dosyalarını
      `forceRerunTriggers` olarak işaretler; böylece test bağlantıları değiştiğinde changed-mode yeniden çalıştırmalar doğru kalır.
    - Yapılandırma, desteklenen
      host'larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil oluşturma için
      tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.

  </Accordion>

  <Accordion title="Performans hata ayıklama">

    - `pnpm test:perf:imports`, Vitest import-süresi raporlamasını
      ve import döküm çıktısını etkinleştirir.
    - `pnpm test:perf:imports:changed`, aynı profil görünümünü
      `origin/main` sonrasındaki değişen dosyalara sınırlar.
    - Shard zamanlama verileri `.artifacts/vitest-shard-timings.json` dosyasına yazılır.
      Tüm yapılandırma çalıştırmaları yapılandırma yolunu anahtar olarak kullanır; include-pattern CI
      shard'ları filtrelenmiş shard'ların ayrı izlenebilmesi için
      shard adını ekler.
    - Hâlâ sıcak olan bir test zamanının çoğunu başlangıç import'larında harcıyorsa,
      ağır bağımlılıkları dar bir yerel `*.runtime.ts` dikişinin arkasında tutun ve
      bunları yalnızca `vi.mock(...)` içinden geçirmek için çalışma zamanı yardımcılarını derin import etmek yerine
      bu dikişi doğrudan mock edin.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş
      `test:changed` ile yerel kök-proje yolunu bu commit edilmiş fark için karşılaştırır
      ve duvar süresi ile macOS maksimum RSS'yi yazdırır.
    - `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini
      `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek
      geçerli kirli ağacı kıyaslar.
    - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform yükü için
      bir ana iş parçacığı CPU profili yazar.
    - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış
      unit paketi için çalıştırıcı CPU+heap profilleri yazar.

  </Accordion>
</AccordionGroup>

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak tanılamalar etkin gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik gateway mesajı, bellek ve büyük yük dalgalanması sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin tekrar sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Kararlılık gerilemesi takibi için dar hat; tam Gateway paketinin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki birlikte gelen Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Repo'nun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz kipte çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çoklu örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ davranışı
- Beklentiler:
  - CI içinde çalışır (iş hattında etkin olduğunda)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - İzole bir OpenShell gateway'i Docker üzerinden host üzerinde başlatır
  - Geçici yerel bir Dockerfile'dan sandbox oluşturur
  - OpenClaw'un OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden dener
  - Uzak-kurallı dosya sistemi davranışını sandbox fs bridge üzerinden doğrular
- Beklentiler:
  - Yalnızca açık katılım; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyasına veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki birlikte gelen Plugin live testleri
- Varsayılan: `pnpm test:live` ile **etkindir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırı kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri çalıştırmak tercih edilir
- Live çalıştırmalar eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini yalıtır ve yapılandırma/auth materyalini geçici bir test home'una kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını bilinçli olarak istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir kip kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini gizler ve gateway bootstrap günlüklerini/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özel): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY` kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Live paketleri artık uzun sağlayıcı çağrıları, Vitest konsol yakalama sessiz olduğunda bile görünür şekilde etkin olsun diye stderr'e ilerleme satırları yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının live çalıştırmalar sırasında anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/sonda Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/testler düzenleniyorsa: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağı / WS protokolü / eşleştirme dokunuluyorsa: `pnpm test:e2e` ekleyin
- “Botum kapalı” / sağlayıcıya özel hatalar / araç çağırmayı hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live (ağa dokunan) testler

Canlı model matrisi, CLI arka uç smoke'ları, ACP smoke'ları, Codex uygulama sunucusu
harness'i ve tüm medya sağlayıcısı live testleri (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) ile live çalıştırmalar için kimlik bilgisi işleme hakkında
bkz. [Testing — live suites](/tr/help/testing-live).

## Docker çalıştırıcıları (isteğe bağlı “Linux'ta çalışıyor” denetimleri)

Bu Docker çalıştırıcıları iki kümeye ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profile-key live dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker live çalıştırıcıları, tam Docker taramasının pratik kalması için varsayılan olarak daha küçük bir smoke sınırı kullanır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını bir kez `test:docker:live-build` ile oluşturur, sonra bunu canlı Docker hatları için yeniden kullanır. Ayrıca `test:docker:e2e-build` ile paylaşılan bir `scripts/e2e/Dockerfile` imajı oluşturur ve bunu built app'i deneyen E2E kapsayıcı smoke çalıştırıcıları için yeniden kullanır. Toplu çalıştırma ağırlıklı bir yerel scheduler kullanır: `OPENCLAW_DOCKER_ALL_PARALLELISM` süreç yuvalarını kontrol ederken, kaynak sınırları ağır live, npm-install ve çok hizmetli hatların aynı anda başlamasını engeller. Varsayılanlar 10 yuva, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; Docker host'unda daha fazla boşluk olduğunda yalnızca `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` ayarlayın. Çalıştırıcı varsayılan olarak Docker preflight yapar, bayat OpenClaw E2E kapsayıcılarını kaldırır, her 30 saniyede bir durum yazar, başarılı hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içine kaydeder ve sonraki çalıştırmalarda daha uzun hatları önce başlatmak için bu zamanlamaları kullanır. Docker oluşturmadan veya çalıştırmadan ağırlıklı hat manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` kullanın.
- Kapsayıcı smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek kapsayıcı başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth home'larını bağlayarak mount eder (veya çalışma daraltılmamışsa desteklenenlerin tümünü), sonra dış CLI OAuth'un host auth deposunu değiştirmeden token yenileyebilmesi için bunları çalıştırma öncesinde kapsayıcı home'una kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`; varsayılan olarak Claude, Codex ve Gemini kapsar; sıkı Droid/OpenCode kapsamı için `pnpm test:docker:live-acp-bind:droid` ve `pnpm test:docker:live-acp-bind:opencode`)
- CLI arka uç smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex uygulama sunucusu harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskeletleme): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'unu Docker içinde küresel olarak kurar, varsayılan olarak OpenAI'yi env-ref onboarding ve Telegram ile yapılandırır, doctor onarımının etkinleştirilmiş Plugin çalışma zamanı bağımlılıklarını düzelttiğini doğrular ve mock edilmiş bir OpenAI ajan turu çalıştırır. Önceden oluşturulmuş bir tarball'u `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch`, paketlenmiş OpenClaw tarball'unu Docker içinde küresel olarak kurar, paket `stable`dan git `dev`e geçer, kalıcı kanal ve Plugin'in güncelleme sonrası çalıştığını doğrular, sonra tekrar paket `stable`a döner ve güncelleme durumunu denetler.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context`, gizli çalışma zamanı bağlamı dökümünün kalıcılığını ve etkilenen çoğaltılmış prompt-rewrite dallarının doctor onarımını doğrular.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh`, geçerli ağacı paketler, izole bir home içinde `bun install -g` ile kurar ve `openclaw infer image providers --json` komutunun takılmak yerine birlikte gelen image sağlayıcılarını döndürdüğünü doğrular. Önceden oluşturulmuş bir tarball'u `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host derlemesini `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ile atlayın veya oluşturulmuş bir Docker imajından `dist/` kopyalamak için `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` kullanın.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh`, kök, güncelleme ve direct-npm kapsayıcıları arasında tek bir npm önbelleği paylaşır. Update smoke, aday tarball'a yükseltmeden önce kararlı temel olarak varsayılan npm `latest` kullanır. Root olmayan installer denetimleri, root'a ait önbellek girdilerinin kullanıcı yerel kurulum davranışını maskelemesini önlemek için izole bir npm önbelleği tutar. Yerel yeniden çalıştırmalarda root/update/direct-npm önbelleğini yeniden kullanmak için `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` ayarlayın.
- Install Smoke CI, `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ile yinelenen direct-npm genel güncellemesini atlar; doğrudan `npm install -g` kapsamı gerektiğinde bu ortam değişkeni olmadan betiği yerelde çalıştırın.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (betik: `scripts/e2e/agents-delete-shared-workspace-docker.sh`), varsayılan olarak kök Dockerfile imajını oluşturur, izole kapsayıcı home'unda tek çalışma alanına sahip iki ajan tohumlar, `agents delete --json` çalıştırır ve geçerli JSON ile korunan çalışma alanı davranışını doğrular. Install-smoke imajını `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` ile yeniden kullanın.
- Gateway ağı (iki kapsayıcı, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (betik: `scripts/e2e/browser-cdp-snapshot-docker.sh`), kaynak E2E imajını ve bir Chromium katmanını oluşturur, Chromium'u ham CDP ile başlatır, `browser doctor --deep` çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilirleri, iframe referanslarını ve frame meta verilerini kapsadığını doğrular.
- OpenAI Responses web_search minimal reasoning gerilemesi: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), mock edilmiş bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` özelliğinin `reasoning.effort` değerini `minimal`dan `low`a yükselttiğini doğrular, sonra sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP channel bridge (tohumlanmış Gateway + stdio bridge + ham Claude bildirim-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (gerçek stdio MCP sunucusu + gömülü Pi profil allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (gerçek Gateway + izole cron ve tek seferlik subagent çalıştırmalarından sonra stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, ClawHub install/uninstall, marketplace güncellemeleri ve Claude-bundle enable/inspect): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
  Canlı ClawHub bloğunu atlamak için `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` ayarlayın veya varsayılan paketi `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` ve `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` ile geçersiz kılın.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Birlikte gelen Plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps`, varsayılan olarak küçük bir Docker çalıştırıcı imajı oluşturur, OpenClaw'u host üzerinde bir kez oluşturup paketler, ardından bu tarball'u her Linux kurulum senaryosuna mount eder. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra host yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'a `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile işaret edin. Tam Docker toplu çalıştırması bu tarball'u bir kez önceden paketler, sonra birlikte gelen kanal denetimlerini bağımsız hatlara böler; buna Telegram, Discord, Slack, Feishu, memory-lancedb ve ACPX için ayrı update hatları da dahildir. Birlikte gelen hattı doğrudan çalıştırırken kanal matrisini daraltmak için `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` veya update senaryosunu daraltmak için `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` kullanın. Bu hat ayrıca `channels.<id>.enabled=false` ve `plugins.entries.<id>.enabled=false` değerlerinin doctor/çalışma zamanı bağımlılığı onarımını bastırdığını doğrular.
- Yineleme yaparken birlikte gelen Plugin çalışma zamanı bağımlılıklarını, ilgisiz senaryoları kapatarak daraltın; örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan built-app imajını elle önceden oluşturup yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü imaj geçersiz kılmaları ayarlıysa hâlâ önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak paylaşılan bir imaja işaret ettiğinde, betikler imaj zaten yerelde yoksa onu çeker. QR ve installer Docker testleri kendi Dockerfile'larını korur çünkü paylaşılan built-app çalışma zamanı yerine paket/kurulum davranışını doğrularlar.

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bağlayıp
kapsayıcı içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
imajını ince tutarken yine de Vitest'i tam sizin yerel kaynak/yapılandırmanızla çalıştırır.
Hazırlama adımı, Docker live çalıştırmalarının dakikalarca makineye özgü yapıtları kopyalamaması için
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya yerel `.build` veya
Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live sondaları
kapsayıcı içinde gerçek Telegram/Discord/vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır, bu yüzden
o Docker hattında gateway live kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke'udur: OpenAI uyumlu HTTP uç noktaları etkin bir
OpenClaw gateway kapsayıcısı başlatır,
o gateway'e karşı sabitlenmiş bir Open WebUI kapsayıcısı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` yolunun `openclaw/default` sunduğunu doğrular, sonra
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI kendi soğuk başlangıç kurulumunu tamamlamak zorunda kalabilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve Docker içindeki çalıştırmalarda
bunu sağlamanın birincil yolu `OPENCLAW_PROFILE_FILE`
(varsayılan `~/.profile`) değeridir.
Başarılı çalıştırmalar genellikle `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` bilinçli olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
kapsayıcısı başlatır, sonra `openclaw mcp serve` başlatan ikinci bir kapsayıcı başlatır, ardından
yönlendirilmiş konuşma keşfini, döküm okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi
ham stdio MCP frame'lerini doğrudan inceler; böylece smoke, belirli bir istemci SDK'sının neyi yüzeye çıkardığını değil
köprünün gerçekte ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı
model anahtarına ihtiyaç duymaz. Repo Docker imajını oluşturur, kapsayıcı içinde gerçek bir stdio MCP sonda sunucusu başlatır,
bu sunucuyu gömülü Pi bundle
MCP çalışma zamanı üzerinden somutlaştırır, aracı çalıştırır, sonra `coding` ve `messaging` profilinin
`bundle-mcp` araçlarını koruduğunu; `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı model
anahtarına ihtiyaç duymaz. Gerçek bir stdio MCP sonda sunucusuyla tohumlanmış bir Gateway başlatır,
izole bir cron turu ve `/subagents spawn` tek seferlik child turu çalıştırır, sonra
MCP child sürecinin her çalıştırmadan sonra kapandığını doğrular.

Elle ACP düz dil konu smoke'u (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği gerileme/hata ayıklama iş akışları için saklayın. ACP konu yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` yoluna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` yoluna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` yoluna bağlanır ve testler çalıştırılmadan önce kaynak alınır
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynaklanan ortam değişkenlerini doğrulamak için; geçici config/çalışma alanı dizinleri ve harici CLI auth mount'ları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` yoluna bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur olarak bağlanır, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` içinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Kapsayıcı içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin ortamdan değil profil deposundan gelmesini zorlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke'u için gateway'in sunduğu modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke'unda kullanılan nonce denetim istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler akıl sağlığı denetimi

Belge düzenlemelerinden sonra belge denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı gerileme (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek iş hattı” gerilemeleridir:

- Gateway araç çağırma (mock OpenAI, gerçek gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config yazar + auth zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirlik değerlendirmeleri (Skills)

Zaten “ajan güvenilirliği değerlendirmeleri” gibi davranan birkaç CI için güvenli testimiz var:

- Gerçek gateway + ajan döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum bağlantısını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde, ajan doğru Skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** ajan kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları takip ediyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skill dosyası okumalarını ve oturum bağlantılarını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, sınırlama, prompt injection).
- İsteğe bağlı live değerlendirmeler (açık katılımlı, env ile sınırlı) yalnızca CI için güvenli paket yerleştirildikten sonra.

## Contract testleri (Plugin ve kanal şekli)

Contract testleri, kayıtlı her Plugin ve kanalın
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde dolaşır ve
şekil ile davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` unit hattı
bilinçli olarak bu paylaşılan seam ve smoke dosyalarını atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda
contract komutlarını açıkça çalıştırın.

### Komutlar

- Tüm contract'lar: `pnpm test:contracts`
- Yalnızca kanal contract'ları: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı contract'ları: `pnpm test:contracts:plugins`

### Kanal contract'ları

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (`id`, `name`, `capabilities`)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj yükü yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Konu kimliği işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası uygulaması

### Sağlayıcı durum contract'ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum sondaları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı contract'ları

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçicisi
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılır

- plugin-sdk export'larını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin'i ekledikten veya değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Contract testleri CI içinde çalışır ve gerçek API anahtarları gerektirmez.

## Gerileme ekleme (rehberlik)

Live içinde keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir gerileme ekleyin (mock/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca live ise (hız sınırları, auth politikaları), live testi dar tutun ve env değişkenleriyle açık katılımlı yapın
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan models testi
  - gateway session/history/tool pipeline hatası → gateway live smoke veya CI için güvenli gateway mock testi
- SecretRef traversal koruması:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verilerinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, sonra traversal-segment exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testte `classifyTargetClass` işlevini güncelleyin. Test bilinçli olarak sınıflandırılmamış hedef kimliklerinde başarısız olur; böylece yeni sınıflar sessizce atlanamaz.

## İlgili

- [Testing live](/tr/help/testing-live)
- [CI](/tr/ci)
