---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcısı hızlı doğrulama testlerini çalıştırma
    - Canlı test kimlik bilgilerinin çözümlenmesinde hata ayıklama
    - Yeni bir sağlayıcıya özgü canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test etme: canlı test paketleri'
x-i18n:
    generated_at: "2026-05-06T09:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon takımları ve Docker akışları için
[Testing](/tr/help/testing) bölümüne bakın. Bu sayfa **canlı** (ağa dokunan) test
takımlarını kapsar: model matrisi, CLI backend'leri, ACP ve medya sağlayıcı canlı testleri, ayrıca
kimlik bilgisi işleme.

## Canlı: yerel profil smoke komutları

Geçici canlı kontrollerden önce `~/.profile` dosyasını kaynak olarak alın; böylece sağlayıcı anahtarları ve yerel araç
yolları shell'inizle eşleşir:

```bash
source ~/.profile
```

Güvenli medya smoke testi:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazırlık smoke testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de mevcut olmadıkça bir kuru çalıştırmadır. `--yes` seçeneğini yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık kontrolü herkese açık bir Webhook URL'si gerektirir; yalnızca yerel
loopback/özel geri dönüşler tasarım gereği reddedilir.

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (takım uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut komut Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması Gateway'e zaten bağlı ve eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke testi (profil anahtarları)

Canlı testler, hataları izole edebilmemiz için iki katmana ayrılır:

- "Direct model", sağlayıcının/modelin verilen anahtarla genel olarak yanıt verebildiğini gösterir.
- "Gateway smoke", o model için tam Gateway+ajan hattının çalıştığını gösterir (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Her model için küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu takımı gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, modern için alias) ayarlayın; aksi halde `pnpm test:live` komutunu Gateway smoke testine odaklı tutmak için atlar
- Model seçme:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir alias'tır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/all taramaları varsayılan olarak seçilmiş yüksek sinyalli bir sınır kullanır; kapsamlı modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model test zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20'li paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçme:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - "sağlayıcı API'si bozuk / anahtar geçersiz" durumunu "Gateway ajan hattı bozuk" durumundan ayırır
  - Küçük, izole regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme tekrar oynatma + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme ajanı smoke testi ("@openclaw" gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamamak (her çalıştırmada model geçersiz kılma)
  - Anahtarı olan modeller üzerinde yinelemek ve şunları doğrulamak:
    - "anlamlı" yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+okuma yoklaması)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam eder
- Yoklama ayrıntıları (hataları hızlıca açıklayabilmeniz için):
  - `read` yoklaması: test çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` edip nonce'u geri yankılamasını ister.
  - `exec+read` yoklaması: test ajandan bir temp dosyasına `exec` ile nonce yazmasını, sonra bunu geri `read` etmesini ister.
  - görsel yoklaması: test üretilmiş bir PNG (kedi + rastgeleleştirilmiş kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçme:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir alias'tır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgül listesi) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak seçilmiş yüksek sinyalli bir sınır kullanır; kapsamlı modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçme ("OpenRouter her şey" durumundan kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Araç + görsel yoklamaları bu canlı testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stresi)
  - model görsel girdi desteği duyurduğunda görsel yoklaması çalışır
  - Akış (üst düzey):
    - Test, "CAT" + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` aracılığıyla `attachments: [{ mimeType: "image/png", content: "<base64>" }]` olarak gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kod içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI backend smoke testi (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI backend kullanarak Gateway + ajan hattını doğrulamak.
- Backend'e özgü smoke varsayılanları, sahibi olan Plugin'in `cli-backend.ts` tanımıyla birlikte yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, sahibi olan CLI backend Plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt'a enjekte edilir). Docker tariflerinde bu, açıkça istenmediği sürece varsayılan olarak kapalıdır.
  - Görsel dosya yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum süreklilik yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tariflerinde bu, toplu güvenilirlik için varsayılan olarak kapalıdır.
  - MCP/araç loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tariflerinde bu, açıkça istenmediği sürece varsayılan olarak kapalıdır.

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ucuz Gemini MCP yapılandırma smoke testi:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu, Gemini'den yanıt üretmesini istemez. OpenClaw'ın Gemini'ye verdiği aynı sistem
ayarlarını yazar, ardından kaydedilmiş bir `transport: "streamable-http"` sunucusunun Gemini'nin HTTP MCP
şekline normalleştirildiğini ve yerel bir streamable-HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Tek sağlayıcılı Docker tarifleri:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumundadır.
- Canlı CLI backend smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verilerini sahibi olan Plugin'den çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki önbelleğe alınmış yazılabilir prefix'e kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` veya `claude setup-token` çıktısından `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI backend turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı limitleri yerine ekstra kullanım faturalamasından yönlendirdiği için Claude MCP/araç ve görsel yoklamalarını varsayılan olarak devre dışı bırakır.
- Canlı CLI backend smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görsel sınıflandırma turu, ardından Gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamar ve sürdürülen oturumun daha önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: APNs HTTP/2 proxy erişilebilirliği

- Test: `src/infra/push-apns-http2.live.test.ts`
- Amaç: yerel bir HTTP CONNECT proxy üzerinden Apple'ın sandbox APNs uç noktasına tünellemek, APNs HTTP/2 doğrulama isteğini göndermek ve Apple'ın gerçek `403 InvalidProviderToken` yanıtının proxy yolu üzerinden geri geldiğini doğrulamak.
- Etkinleştirme:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- İsteğe bağlı zaman aşımı:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Canlı: ACP bind smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Hedef: canlı bir ACP aracısıyla gerçek ACP konuşma-bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum transkriptine ulaştığını doğrula
- Etkinleştir:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP aracıları: `claude,codex,gemini`
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Notlar:
  - Bu hat, testlerin dışarıya teslimat yapıyor gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticilere açık sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmadığında test, seçilen ACP test düzeneği aracısı için gömülü `acpx` Plugin'inin yerleşik aracı kayıt defterini kullanır.
  - Bağlı oturum cron MCP oluşturma varsayılan olarak en iyi çaba şeklindedir, çünkü harici ACP test düzenekleri bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bu bağlama sonrası cron yoklamasını katı yapmak için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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
- Varsayılan olarak, ACP bağlama smoke testini toplu canlı CLI aracılarına sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını kaynak olarak alır, eşleşen CLI kimlik doğrulama materyalini konteynere hazırlar, ardından eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` veya `opencode-ai`) kurar. ACP arka ucunun kendisi, resmi `acpx` Plugin'inden gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` dosyasını hazırlar, `FACTORY_API_KEY` iletir ve yerel Factory OAuth/keyring kimlik doğrulaması konteynere taşınabilir olmadığı için bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt girdisini kullanır.
- OpenCode Docker varyantı, katı bir tek aracılı regresyon hattıdır. `~/.profile` kaynak olarak alındıktan sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değişkeninden geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar (varsayılan `opencode/kimi-k2.6`) ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan transkripti gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için manuel/geçici çözüm yoludur. Docker ACP bağlama smoke testi, OpenClaw'un gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex uygulama sunucusu test düzeneği smoke testi

- Hedef: Plugin'e ait Codex test düzeneğini normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - Codex test düzeneği zorlanmış şekilde `openai/gpt-5.5` modeline ilk Gateway aracı turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve uygulama sunucusu iş parçacığının sürdürülebildiğini doğrula
  - aynı Gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian incelemeli iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken zararsız bir komut ve reddedilmesi gereken, böylece aracının geri sormasını sağlayan sahte gizli bilgi yüklemesi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştir: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `agentRuntime.id: "codex"` kullanır, böylece bozuk bir Codex test düzeneği sessizce PI'ye geri düşerek geçemez.
- Kimlik doğrulama: yerel Codex abonelik oturum açmasından Codex uygulama sunucusu kimlik doğrulaması. Docker smoke testleri, uygulanabilir olduğunda Codex dışı yoklamalar için `OPENAI_API_KEY` ve ayrıca isteğe bağlı kopyalanmış `~/.codex/auth.json` ile `~/.codex/config.toml` sağlayabilir.

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumundadır.
- Bağlanan `~/.profile` dosyasını kaynak olarak alır, `OPENAI_API_KEY` iletir, varsa Codex CLI kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış bir npm önekine kurar, kaynak ağacını hazırlar, ardından yalnızca Codex test düzeneği canlı testini çalıştırır.
- Docker görüntü, MCP/araç ve Guardian yoklamalarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama çalıştırmasına ihtiyacınız olduğunda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır, bu nedenle eski takma adlar veya PI geri dönüşü bir Codex test düzeneği regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az kırılgan olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, Gateway smoke testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlanabilir düşünme smoke testi:
  - Yerel anahtarlar kabuk profilindeyse: `source ~/.profile`
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı aracı uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç davranışı farkları).
- Gemini API ve Gemini CLI karşılaştırması:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının "Gemini" derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikili dosyasını kabuk üzerinden çalıştırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm uyuşmazlığı).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir "CI model listesi" yoktur (canlı test isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern smoke seti (araç çağırma + görüntü)

Çalışır durumda tutmayı beklediğimiz "yaygın modeller" çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (daha eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway smoke testini araçlar + görüntü ile çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4.3` (veya mevcut en son sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz, "tools" yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Görü: görüntü gönderme (ek → çok modlu mesaj)

Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI görü yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden kimlik doğrulama)

Canlı matrise ekleyebileceğiniz diğer sağlayıcılar (kimlik bilgileri/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde "all models" sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` çağrısının döndürdüğü değerler ile mevcut anahtarların birleşimidir.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa canlı testler aynı anahtarları bulmalıdır.
- Canlı test "no creds" diyorsa, `openclaw models list` / model seçimini nasıl hata ayıklayacaksanız aynı şekilde hata ayıklayın.

- Aracı başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde "profil anahtarları" bundan kasıt)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcut olduğunda hazırlanan canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar, varsayılan olarak etkin yapılandırmayı, aracı başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; hazırlanan canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar ve yoklamaların gerçek ana makine çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları çıkarılır.

Env anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını kapsayıcının içine bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus kodlama planı canlı

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medyası canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketle gelen comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü üretimi canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Test takımı: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı Pluginini listeler
  - Yoklamadan önce eksik sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görüntü üretimi çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan mevcut paket sağlayıcıları:
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
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Gönderilen CLI yolu için, sağlayıcı/çalışma zamanı canlı testi geçtikten sonra bir `infer` duman testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu; CLI argüman ayrıştırmayı, yapılandırma/varsayılan aracı çözümlemeyi, paket Plugin etkinleştirmeyi, paylaşılan görüntü üretimi çalışma zamanını ve canlı sağlayıcı isteğini kapsar. Plugin bağımlılıklarının çalışma zamanı yüklemesinden önce mevcut olması beklenir.

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Test takımı: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paket müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax kapsam dahilindedir
  - Yoklamadan önce sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki çalışma zamanı modunu da çalıştırır:
    - Yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan kulvar kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Test takımı: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paket video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm açısından güvenli duman testi yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebileceği için varsayılan olarak FAL atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçirin
  - Yoklamadan önce sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada arabellek destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada bildirilen ancak atlanan mevcut `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paket `veo3` yalnızca metin destekler ve paket `kling` uzak bir görüntü URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak bir görüntü URL fikstürü kullanan bir `kling` kulvarına ek olarak `veo3` metinden videoya çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada bildirilen ancak atlanan mevcut `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`; çünkü mevcut paylaşılan Gemini/Veo kulvarı yerel arabellek destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`; çünkü mevcut paylaşılan kulvarda kuruluşa özgü video inpaint/remix erişim garantileri yoktur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir duman testi çalıştırması için her sağlayıcı işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı test takımı

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı test paketlerini tek bir repo yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test Etme](/tr/help/testing) - birim, entegrasyon, QA ve Docker paketleri
