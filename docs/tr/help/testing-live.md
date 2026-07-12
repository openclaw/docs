---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcısı smoke testlerini çalıştırma
    - Canlı test kimlik bilgileri çözümlemesinde hata ayıklama
    - Sağlayıcıya özgü yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağ erişimi gerektiren) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı paketler'
x-i18n:
    generated_at: "2026-07-12T11:50:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için
[Test Etme](/tr/help/testing) bölümüne bakın. Bu sayfa **canlı** (ağa erişen) testleri kapsar:
model matrisi, CLI arka uçları, ACP, medya sağlayıcıları ve kimlik bilgisi yönetimi.

## Canlı: yerel duman testi komutları

Geçici canlı kontrollerden önce gerekli sağlayıcı anahtarını işlem ortamına aktarın.

Güvenli medya duman testi:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazırlık duman testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de belirtilmediği sürece deneme çalıştırmasıdır; `--yes` seçeneğini yalnızca
gerçek bir arama yapmak istediğinizde kullanın. Twilio, Telnyx ve Plivo için
başarılı bir hazırlık kontrolü, herkese açık bir webhook URL'si gerektirir; bu
sağlayıcılar yerel/özel local loopback URL'lerine erişemediği için bunlar reddedilir.

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket, uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut bazında Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması Gateway'e zaten bağlı ve eşleştirilmiş olmalıdır.
  - Uygulama ön planda tutulmalıdır.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmelidir.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Android kurulumunun tüm ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model duman testi (profil anahtarları)

Canlı model testleri, hataları birbirinden ayırmak için iki katmana bölünmüştür:

- "Doğrudan model", sağlayıcının/modelin verilen anahtarla herhangi bir yanıt verip veremediğini gösterir.
- "Gateway duman testi", söz konusu model için tüm Gateway+ajan işlem hattının (oturumlar, geçmiş, araçlar, korumalı alan politikası vb.) çalışıp çalışmadığını gösterir.

Aşağıdaki seçilmiş model listeleri `src/agents/live-model-filter.ts` içinde bulunur ve
zamanla değişir; bu sayfayı değil, oradaki dizileri doğru bilgi kaynağı olarak kabul edin.

MiniMax M3, varsayılan sağlayıcı/model başvurusu olarak `minimax/MiniMax-M3` kullanır.

### Katman 1: Doğrudan model tamamlama (Gateway olmadan)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgilerinizin bulunduğu modelleri seçmek için `getApiKeyForModel` kullanmak
  - Her model için küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonları çalıştırmak)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern`, `small` veya `all` (`modern` için takma ad) ayarlayın; aksi takdirde paket atlanır ve tek başına `pnpm test:live`, Gateway duman testine odaklanmayı sürdürür.
- Model seçimi:
  - `OPENCLAW_LIVE_MODELS=modern`, seçilmiş yüksek sinyalli öncelik listesini çalıştırır (bkz. [Canlı: model matrisi](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small`, seçilmiş küçük model öncelik listesini çalıştırır
  - `OPENCLAW_LIVE_MODELS=all`, `modern` için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin verilenler listesi)
  - Yerel Ollama küçük model çalıştırmaları varsayılan olarak `http://127.0.0.1:11434` kullanır; `OPENCLAW_LIVE_OLLAMA_BASE_URL` değerini yalnızca LAN, özel veya Ollama Cloud uç noktaları için ayarlayın.
  - Modern/all ve small taramaları, varsayılan olarak kendi seçilmiş liste uzunluklarını üst sınır olarak kullanır; seçilen profillerin kapsamlı taraması için `OPENCLAW_LIVE_MAX_MODELS=0`, daha düşük bir üst sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, doğrudan model testinin tamamının zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20 yönlü paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçimi:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin verilenler listesi)
- Anahtarların kaynağı:
  - Varsayılan olarak: profil deposu ve ortam geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Var olma nedeni:
  - "Sağlayıcı API'si bozuk / anahtar geçersiz" durumunu "Gateway ajan işlem hattı bozuk" durumundan ayırır
  - Küçük ve yalıtılmış regresyonları içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatma + araç çağırma akışları)

### Katman 2: Gateway + geliştirme ajanı duman testi ("@openclaw"ın gerçekte yaptığı)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - İşlem içinde bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılması)
  - Anahtarı bulunan modeller üzerinde yineleme yapmak ve şunları doğrulamak:
    - "anlamlı" yanıt (araçsız)
    - gerçek bir araç çağrısının çalışması (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (çalıştırma+okuma yoklaması)
    - OpenAI regresyon yollarının (yalnızca araç çağrısı -> takip) çalışmayı sürdürmesi
- Yoklama ayrıntıları (hataları hızla açıklayabilmeniz için):
  - `read` yoklaması: test, çalışma alanına bir nonce dosyası yazar ve ajandan dosyayı `read` ile okuyup nonce değerini geri yansıtmasını ister.
  - `exec+read` yoklaması: test, ajandan bir nonce değerini `exec` ile geçici bir dosyaya yazmasını, ardından `read` ile geri okumasını ister.
  - görüntü yoklaması: test, oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `test/helpers/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçimi:
  - Varsayılan: seçilmiş yüksek sinyalli (`modern`) öncelik listesi
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, seçilmiş küçük model listesini tüm Gateway+ajan işlem hattında çalıştırır
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, `modern` için bir takma addır
  - Kapsamı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgülle ayrılmış liste) de ayarlanabilir
  - Modern/all ve small Gateway taramaları, varsayılan olarak kendi seçilmiş liste uzunluklarını üst sınır olarak kullanır; seçilenlerin kapsamlı taraması için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha düşük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi ("her şey OpenRouter" yaklaşımından kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin verilenler listesi)
- Bu canlı testte araç + görüntü yoklamaları her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç yük testi)
  - model görüntü girdisi desteği duyurduğunda görüntü yoklaması çalışır
  - Akış (üst düzey):
    - Test, "CAT" + rastgele kod içeren küçük bir PNG oluşturur (`test/helpers/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` biçiminde gönderir
    - Gateway, ekleri `images[]` biçimine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan, çok kipli bir kullanıcı mesajını modele iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI arka ucu duman testi (Claude, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI arka ucu kullanarak Gateway + ajan işlem hattını doğrulamak.
- Arka uca özgü duman testi varsayılanları, sahip olan Plugin'in `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/bağımsız değişken/görüntü davranışı, sahip olan CLI arka uç Plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - Gerçek bir görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme eklenir). Docker tariflerinde varsayılan olarak kapalıdır.
  - Görüntü dosyası yollarını isteme eklemek yerine CLI bağımsız değişkenleri olarak iletmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görüntü bağımsız değişkenlerinin nasıl iletileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde, aynı oturumdaki Claude Sonnet -> Opus süreklilik yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri dahil varsayılan olarak kapalıdır.
  - MCP/araç local loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tariflerinde varsayılan olarak kapalıdır.

Örnek:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Düşük maliyetli Gemini MCP yapılandırma duman testi:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu işlem Gemini'dan bir yanıt oluşturmasını istemez. OpenClaw'ın Gemini'a verdiği sistem
ayarlarının aynısını yazar, ardından kaydedilmiş bir `transport: "streamable-http"`
sunucusunun Gemini'ın HTTP MCP biçimine normalleştirildiğini ve yerel bir
akışlı HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Tek sağlayıcılı Docker tarifleri:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumundadır.
- Canlı CLI arka ucu duman testini, depo Docker görüntüsü içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI duman testi meta verilerini sahip olan Plugin'den çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki (varsayılan: `~/.cache/openclaw/docker-cli-tools`) önbelleğe alınmış, yazılabilir bir ön eke kurar.
- `codex-cli` artık paketle birlikte gelen bir CLI arka ucu değildir; bunun yerine Codex uygulama sunucusu çalışma zamanı ile `openai/*` kullanın (bkz. [Canlı: Codex uygulama sunucusu test düzeneği duman testi](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` veya `claude setup-token` kaynaklı `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth'ı gerektirir. Önce Docker içinde doğrudan `claude -p` komutunu kanıtlar, ardından Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI arka ucu turu çalıştırır. Bu abonelik hattı, oturum açılmış aboneliğin kullanım sınırlarını tükettiği ve Anthropic, Claude Agent SDK / `claude -p` faturalandırma ve hız sınırı davranışını bir OpenClaw sürümü olmadan değiştirebildiği için Claude MCP/araç ve görüntü yoklamalarını varsayılan olarak devre dışı bırakır.
- Claude ve Gemini, yukarıdaki bayraklar aracılığıyla aynı yoklama kümesini (metin turu, görüntü sınıflandırması, MCP `cron` araç çağrısı, model geçişi sürekliliği) destekler; ancak bu yoklamaların hiçbiri varsayılan olarak çalışmaz; gerektiğinde ilgili bayrakla etkinleştirin.

## Canlı: APNs HTTP/2 proxy erişilebilirliği

- Test: `src/infra/push-apns-http2.live.test.ts`
- Amaç: yerel bir HTTP CONNECT proxy'si üzerinden Apple'ın korumalı alan APNs uç noktasına tünel açmak, APNs HTTP/2 doğrulama isteğini göndermek ve Apple'ın gerçek `403 InvalidProviderToken` yanıtının proxy yolu üzerinden geri geldiğini doğrulamak.
- Etkinleştirme:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- İsteğe bağlı zaman aşımı:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Canlı: ACP bağlama duman testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: gerçek ACP konuşma bağlama akışını canlı bir ACP aracısıyla doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum dökümüne ulaştığını doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker'daki ACP aracıları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP aracısı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP arka ucu: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - Görüntü yoklamasını zorunlu olarak açmak için `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (veya `on`/`true`/`yes`); diğer tüm değerler yoklamayı zorunlu olarak kapatır. `opencode` dışındaki her aracı için varsayılan olarak çalışır.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Notlar:
  - Bu hat, testlerin harici teslimat yapıyormuş gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticiye açık sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP test düzeneği aracısı için gömülü `acpx` Plugin'inin yerleşik aracı kayıt defterini kullanır.
  - Harici ACP test düzenekleri bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebildiğinden, bağlı oturum Cron MCP oluşturma işlemi varsayılan olarak en iyi çaba esasına dayanır; bağlama sonrası Cron yoklamasını katı hâle getirmek için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

Örnek:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-acp-bind
```

Tek aracılı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumundadır.
- Varsayılan olarak ACP bağlama duman testini toplu canlı CLI aracılarına karşı sırayla çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- Eşleşen CLI kimlik doğrulama malzemesini kapsayıcıya hazırlar, ardından eksikse istenen canlı CLI'ı (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` üzerinden Factory Droid, `@google/gemini-cli` veya `opencode-ai`) yükler. ACP arka ucunun kendisi, resmî `acpx` Plugin'indeki gömülü `acpx/runtime` paketidir.
- Droid Docker çeşidi ayarlar için `~/.factory` dizinini hazırlar, `FACTORY_API_KEY` değişkenini iletir ve yerel Factory OAuth/anahtarlık kimlik doğrulaması kapsayıcıya taşınabilir olmadığından bu API anahtarını zorunlu tutar. ACPX'in yerleşik `droid exec --output-format acp` kayıt girdisini kullanır.
- OpenCode Docker çeşidi, katı bir tek aracılı regresyon hattıdır. `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değişkeninden geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar (varsayılan `opencode/kimi-k2.6`).
- Doğrudan `acpx` CLI çağrıları, yalnızca Gateway dışındaki davranışları karşılaştırmaya yönelik manuel/geçici çözüm yoludur. Docker ACP bağlama duman testi, OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex uygulama sunucusu test düzeneği duman testi

- Amaç: Plugin'e ait Codex test düzeneğini normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketle gelen `codex` Plugin'ini yükle
  - `/model <ref> --runtime codex` üzerinden bir OpenAI modeli seç
  - istenen düşünme düzeyiyle ilk Gateway aracı turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve uygulama sunucusu
    ileti dizisinin sürdürülebildiğini doğrula
  - aynı Gateway komut yolu üzerinden `/codex status` ve `/codex models`
    komutlarını çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen, yükseltilmiş iki kabuk yoklaması çalıştır: onaylanması
    gereken zararsız bir komut ve reddedilerek aracının kullanıcıya
    geri sormasını sağlaması gereken sahte gizli bilgi yüklemesi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Test düzeneği temel modeli: `openai/gpt-5.6-luna`
- Yeni OpenAI API anahtarı seçiminin varsayılanı: `openai/gpt-5.6`
- Varsayılan düşünme: `low`
- Model geçersiz kılma: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Düşünme geçersiz kılma: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Matris geçersiz kılma: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Kimlik doğrulama modu: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (varsayılan), kopyalanmış Codex oturum açma bilgilerini kullanır; `api-key`, Codex uygulama sunucusu üzerinden `OPENAI_API_KEY` kullanır.
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Duman testi, bozuk bir Codex test düzeneğinin sessizce OpenClaw'a geri dönerek
  geçememesi için sağlayıcı/model `agentRuntime.id: "codex"` değerini zorunlu kılar.
- Kimlik doğrulama: yerel Codex abonelik oturumundan Codex uygulama sunucusu kimlik doğrulaması veya
  `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` olduğunda `OPENAI_API_KEY`. Docker, abonelik
  çalıştırmaları için `~/.codex/auth.json` ve `~/.codex/config.toml` dosyalarını kopyalayabilir.

Yerel tarif:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-codex-harness
```

GPT-5.6 yerel Codex matrisi:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Yeni OpenAI API anahtarı varsayılanı:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Bu kanıt `OPENCLAW_LIVE_GATEWAY_MODELS` değişkenini ayarlanmamış bırakır, modeli
yeni ilk katılım çıkarım seçimi bağlantı noktası üzerinden çözümler, `openai/gpt-5.6` değerini doğrular ve ardından
çözümlenen modelle gerçek bir Gateway turu çalıştırır.

GPT-5.6 gömülü OpenClaw matrisi:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumundadır.
- `OPENAI_API_KEY` değişkenini iletir, mevcut olduğunda Codex CLI kimlik doğrulama dosyalarını kopyalar,
  `@openai/codex` paketini yazılabilir, bağlanmış bir npm
  önekine yükler, kaynak ağacını hazırlar ve ardından yalnızca Codex test düzeneği canlı testini çalıştırır.
- Docker, görüntü, MCP/araç ve Guardian yoklamalarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır; böylece eski takma adlar veya OpenClaw
  geri dönüşü, bir Codex test düzeneği regresyonunu gizleyemez.
- Matris hedefleri tek bir kapsayıcıda sırayla çalışır. Docker betiği, varsayılan
  35 dakikalık zaman aşımını hedef sayısına göre ölçeklendirir; dış kabuk veya CI zaman aşımı da
  aynı toplam süreye izin vermelidir. Standart CI, her GPT-5.6 hedefini ayrı bir parçaya ayırır.

### Önerilen canlı tarifler

Dar ve açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway olmadan):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Küçük model doğrudan profili:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Küçük model Gateway profili:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API duman testi:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Tek model, Gateway duman testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden çok sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 doğrudan duman testi:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlanabilir düşünme duman testi (özel QA CLI'dan `qa manual` — `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ve kaynak kod çalışma kopyası gerektirir; bkz. [QA'ya genel bakış](/tr/concepts/qa-e2e-automation)):
  - Gemini 3 dinamik varsayılanı: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...`, Gemini API'sini (API anahtarı) kullanır.
- `google-antigravity/...`, Antigravity OAuth köprüsünü (Cloud Code Assist tarzı aracı uç noktası) kullanır.
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'ı kullanır (ayrı kimlik doğrulama + araç kullanımına özgü farklılıklar).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının "Gemini" ile kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikili dosyasını kabuk üzerinden çalıştırır; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (akış/araç desteği/sürüm uyumsuzluğu).

## Canlı: model matrisi (kapsadıklarımız)

Canlı test isteğe bağlıdır, dolayısıyla sabit bir "CI model listesi" yoktur. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (ve bunların `all` takma adı), `src/agents/live-model-filter.ts` içindeki `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` listesinden özenle seçilmiş öncelik listesini şu öncelik sırasıyla çalıştırır:

| Sağlayıcı/model                              | Notlar     |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

`SMALL_LIVE_MODEL_PRIORITY` içindeki seçilmiş **küçük model** listesi (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`):

| Sağlayıcı/model              |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Modern listeyle ilgili notlar:

- `codex` ve `codex-cli` sağlayıcıları varsayılan modern taramanın dışında tutulur (bunlar yukarıda ayrı olarak test edilen CLI arka ucu/ACP davranışını kapsar). `openai/gpt-5.5` ise varsayılan olarak Codex uygulama sunucusu test düzeneği üzerinden yönlendirilir; bkz. [Canlı: Codex uygulama sunucusu test düzeneği duman testi](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` ve `xai`, modern taramada yalnızca açıkça seçilmiş model kimliklerini çalıştırır (otomatik olarak "bu sağlayıcının tüm modelleri" genişletmesi yapılmaz).
- Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine görüntü destekleyen en az bir model (Claude/Gemini/OpenAI ailesi görüntü varyantları vb.) ekleyin.

Elle seçilmiş, sağlayıcılar arası bir kümede araçlar ve görüntü desteğiyle Gateway duman testini çalıştırın:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Seçilmiş listelerin dışında isteğe bağlı ek kapsam (olması faydalıdır; etkinleştirdiğiniz, "araçlar" özelliğini destekleyen bir model seçin):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (erişiminiz varsa)
- LM Studio: `lmstudio/...` (yerel; araç çağırma API moduna bağlıdır)

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse şunlar üzerinden de test yapabilirsiniz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç ve görüntü desteğine sahip adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (kimlik doğrulama `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden yapılır)

Canlı matrise ekleyebileceğiniz diğer sağlayıcılar (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API) ve OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde "tüm modelleri" sabit kodlamayın. Geçerli liste, makinenizde `discoverModels(...)` tarafından döndürülenlerle kullanılabilir anahtarların birleşimidir.
</Tip>

## Kimlik bilgileri (asla işlemeyin)

Canlı testler, kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa canlı testler de aynı anahtarları bulabilmelidir.
- Canlı test "kimlik bilgisi yok" diyorsa sorunu `openclaw models list` / model seçimi için uygulayacağınız yöntemle ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde "profil anahtarları" bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski OAuth dizini: `~/.openclaw/credentials/` (mevcutsa hazırlanmış canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Yerel canlı çalıştırmalar; etkin yapılandırmayı (`agents.*.workspace` / `agentDir` geçersiz kılmaları çıkarılmış şekilde) ve her ajanın `auth-profiles.json` dosyasını kopyalar. Ajanın geri kalan dizini kopyalanmaz; dolayısıyla `workspace/` ve `sandboxes/` verileri hazırlanmış ana dizine hiçbir zaman ulaşmaz. Ayrıca eski `credentials/` dizini ve desteklenen harici CLI kimlik doğrulama dosyaları/dizinleri (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) geçici bir test ana dizinine kopyalanır.

Ortam anahtarlarına güvenmek istiyorsanız bunları yerel testlerden önce dışa aktarın veya
aşağıdaki Docker çalıştırıcılarını açıkça belirtilmiş bir `OPENCLAW_PROFILE_FILE` ile kullanın.

## Deepgram canlı testi (ses dökümü)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus kodlama planı canlı testi

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya canlı testi

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Birlikte gelen comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra faydalıdır

## Görüntü oluşturma canlı testi

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Test düzeneği: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü oluşturma sağlayıcısı Plugin'ini listeler
  - Yoklamadan önce önceden dışa aktarılmış sağlayıcı ortam değişkenlerini kullanır
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini gölgelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görüntü oluşturma çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - Sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan mevcut birlikte gelen sağlayıcılar:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Dağıtılan CLI yolu için, sağlayıcı/çalışma zamanı canlı testi
geçtikten sonra bir `infer` duman testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Beyaz arka plan üzerinde tek bir mavi kare bulunan, metin içermeyen minimal düz test görüntüsü." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu; CLI bağımsız değişken ayrıştırmasını, yapılandırma/varsayılan ajan çözümlemesini, birlikte gelen
Plugin etkinleştirmesini, paylaşılan görüntü oluşturma çalışma zamanını ve canlı sağlayıcı
isteğini kapsar. Plugin bağımlılıklarının çalışma zamanı yüklemesinden önce mevcut olması beklenir.

## Müzik oluşturma canlı testi

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media music`
- Kapsam:
  - Birlikte gelen paylaşılan müzik oluşturma sağlayıcısı yolunu çalıştırır
  - Şu anda `fal`, `google`, `minimax` ve `openrouter` sağlayıcılarını kapsar
  - Yoklamadan önce önceden dışa aktarılmış sağlayıcı ortam değişkenlerini kullanır
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini gölgelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Kullanılabilir olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - Yalnızca istem girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - `comfy`, bu paylaşılan taramanın değil, kendine ait ayrı bir canlı dosyanın kapsamındadır
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video oluşturma canlı testi

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video oluşturma sağlayıcısı yolunu `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai` genelinde çalıştırır
  - Varsayılan olarak sürüm için güvenli hızlı kontrol yolunu kullanır: sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafındaki kuyruk gecikmesi sürüm süresine baskın gelebileceğinden varsayılan olarak FAL'ı atlar; açıkça çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` değerini iletin (veya atlama listesini temizleyin)
  - Yoklama yapmadan önce dışa aktarılmış mevcut sağlayıcı ortam değişkenlerini kullanır
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanan kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilmiş dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` değerini ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada arabellek destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ancak atlanan `imageToVideo` sağlayıcısı:
    - `vydra` (bu test hattında arabellek destekli yerel görüntü girdisi desteklenmez)
  - Vydra'ya özgü sağlayıcı kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Bu dosya, `veo3` metinden videoya test hattının yanı sıra varsayılan olarak uzak bir görüntü URL'si fikstürü kullanan bir `kling` görüntüden videoya test hattını çalıştırır (geçersiz kılmak için `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`).
  - xAI'ya özgü sağlayıcı kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Klasik durum önce kare biçimli yerel bir PNG ilk karesi oluşturur, geometriyi belirtmez, bir saniyelik görüntüden videoya klibi ister, tamamlanana kadar yoklar ve indirilen arabelleği doğrular.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 durumu yerel bir PNG ilk karesi oluşturur, bir saniyelik 1080P görüntüden videoya klibi ister, tamamlanana kadar yoklar ve indirilen arabelleği doğrular.
  - Mevcut `videoToVideo` canlı kapsamı:
    - Yalnızca seçilen model `gen4_aleph` olarak çözümlendiğinde `runway`
  - Paylaşılan taramada şu anda bildirilmiş ancak atlanan `videoToVideo` sağlayıcıları:
    - Bu yollar şu anda arabellek destekli yerel girdi yerine uzak `http(s)` başvuru URL'leri gerektirdiğinden `alibaba`, `google`, `openai`, `qwen`, `xai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dâhil her sağlayıcıyı varsayılan taramaya dâhil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Yoğun bir hızlı kontrol çalıştırmasında her sağlayıcının işlem sınırını azaltmak için `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca ortam değişkenlerine dayalı geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı test düzeneği

- Komut: `pnpm test:live:media`
- Giriş noktası: Seçilen her test paketi için `pnpm test:live -- <suite-test-file>` çalıştıran `test/e2e/qa-lab/media/hosted-media-provider-live.ts`; böylece Heartbeat ve sessiz mod davranışı diğer `pnpm test:live` çalıştırmalarıyla tutarlı kalır.
- Amaç:
  - Paylaşılan canlı görüntü, müzik ve video test paketlerini depoya özgü tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` dosyasından otomatik olarak yükler
  - Varsayılan olarak her test paketini o anda kullanılabilir kimlik doğrulaması bulunan sağlayıcılarla otomatik olarak sınırlar
- Bayraklar:
  - `--providers <csv>` genel sağlayıcı filtresi; `--image-providers` / `--music-providers` / `--video-providers`, filtreyi tek bir test paketiyle sınırlar
  - `--all-providers`, kimlik doğrulamasına dayalı otomatik filtreyi atlar
  - Filtreleme sonucunda çalıştırılabilir sağlayıcı kalmadığında `--allow-empty`, `0` koduyla çıkar
  - `--quiet` / `--no-quiet`, `test:live` komutuna aktarılır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test](/tr/help/testing) - birim, entegrasyon, kalite güvencesi ve Docker test paketleri
