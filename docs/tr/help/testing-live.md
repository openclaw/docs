---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcı duman testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Sağlayıcıya özgü yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı test paketleri'
x-i18n:
    generated_at: "2026-05-04T18:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için bkz.
[Testing](/tr/help/testing). Bu sayfa **canlı** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri, ayrıca
kimlik bilgisi işleme.

## Canlı: yerel profil smoke komutları

Geçici canlı kontrollerden önce `~/.profile` kaynağını yükleyin; böylece sağlayıcı anahtarları ve yerel araç
yolları kabuğunuzla eşleşir:

```bash
source ~/.profile
```

Güvenli medya smoke testi:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazır olma smoke testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de bulunmadıkça bir dry run’dır. `--yes` seçeneğini yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazır olma kontrolü herkese açık bir webhook URL’si gerektirir; yalnızca yerel
loopback/özel yedekler tasarım gereği reddedilir.

## Canlı: Android düğüm yeteneği taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android düğümü tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Önkoşullu/manuel kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android düğümü için komut bazında Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı ve gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model smoke testi (profil anahtarları)

Canlı testler, hataları yalıtabilmemiz için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla hiç yanıt verip veremediğini gösterir.
- “Gateway smoke”, o model için tam gateway+agent işlem hattının çalıştığını gösterir (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlar
- Model seçme:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan-model test zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan-model yoklamaları varsayılan olarak 20’li paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçme:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “sağlayıcı API’si bozuk / anahtar geçersiz” durumunu “gateway agent işlem hattı bozuk” durumundan ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + geliştirme agent smoke testi ("@openclaw"ın gerçekte yaptığı)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - İşlem içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamamak (çalıştırma başına model geçersiz kılması)
  - Anahtarları olan modeller üzerinde yinelemek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yolları (yalnızca tool-call → takip) çalışmaya devam eder
- Yoklama ayrıntıları (hataları hızlı açıklayabilmeniz için):
  - `read` yoklaması: test çalışma alanına bir nonce dosyası yazar ve agent’tan bunu `read` etmesini ve nonce’u geri yankılamasını ister.
  - `exec+read` yoklaması: test agent’tan bir geçici dosyaya `exec` ile nonce yazmasını, ardından onu geri `read` etmesini ister.
  - image yoklaması: test üretilmiş bir PNG (cat + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Model seçme:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgülle ayrılmış liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçme (“OpenRouter her şey” durumundan kaçınma):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Bu canlı testte araç + image yoklamaları her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stres testi)
  - model image girdisi desteği duyurduğunda image yoklaması çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` aracılığıyla `attachments: [{ mimeType: "image/png", content: "<base64>" }]` olarak gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, çok modlu bir kullanıcı iletisini modele iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI arka uç smoke testi (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan yerel bir CLI arka ucu kullanarak Gateway + agent işlem hattını doğrulamak.
- Arka uca özgü smoke varsayılanları, sahip uzantının `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/args/image davranışı, sahip CLI arka uç plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir image eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir). Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.
  - Image dosyası yollarını prompt enjeksiyonu yerine CLI args olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında image args değerlerinin nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum sürekliliği yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri, toplu güvenilirlik için bunu varsayılan olarak kapalı tutar.
  - MCP/araç loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.

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

Bu, Gemini’den yanıt üretmesini istemez. OpenClaw’ın Gemini’ye verdiği aynı sistem
ayarlarını yazar, ardından kaydedilmiş bir `transport: "streamable-http"` sunucusunun Gemini’nin HTTP MCP
biçimine normalleştirildiğini ve yerel bir streamable-HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

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
- Canlı CLI arka uç smoke testini repo Docker image’ı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verilerini sahip uzantıdan çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki önbelleğe alınmış yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` veya `claude setup-token` kaynaklı `CLAUDE_CODE_OAUTH_TOKEN` üzerinden taşınabilir Claude Code abonelik OAuth’u gerektirir. Önce Docker’da doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı env vars değerlerini korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik şeridi, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ekstra kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve image yoklamalarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı uygular: metin turu, image sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke testi ayrıca oturumu Sonnet’ten Opus’a yamalar ve sürdürülmüş oturumun daha önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: APNs HTTP/2 proxy erişilebilirliği

- Test: `src/infra/push-apns-http2.live.test.ts`
- Amaç: yerel bir HTTP CONNECT proxy üzerinden Apple’ın sandbox APNs uç noktasına tünel açmak, APNs HTTP/2 doğrulama isteğini göndermek ve Apple’ın gerçek `403 InvalidProviderToken` yanıtının proxy yolu üzerinden geri geldiğini doğrulamak.
- Etkinleştirme:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- İsteğe bağlı zaman aşımı:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Canlı: ACP bind smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Hedef: canlı bir ACP ajanıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturumu transkriptine ulaştığını doğrula
- Etkinleştir:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP ajanları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP ajanı: `claude`
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
  - Bu hat, testlerin dışarıya teslim ediyor gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticilere açık sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP donanım ajanı için gömülü `acpx` Plugin'inin yerleşik ajan kayıt defterini kullanır.
  - Bağlı oturum Cron MCP oluşturma varsayılan olarak en iyi çaba şeklindedir, çünkü harici ACP donanımları bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bağlama sonrası Cron yoklamasını katı hale getirmek için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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

Tek ajanlı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumundadır.
- Varsayılan olarak ACP bağlama smoke testini toplu canlı CLI ajanlarına sırasıyla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını kaynak olarak alır, eşleşen CLI kimlik doğrulama materyalini kapsayıcıya hazırlar, ardından istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` üzerinden Factory Droid, `@google/gemini-cli` veya `opencode-ai`) eksikse yükler. ACP arka ucunun kendisi resmi `acpx` Plugin'inden gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` dosyasını hazırlar, `FACTORY_API_KEY` değerini iletir ve yerel Factory OAuth/keyring kimlik doğrulaması kapsayıcıya taşınabilir olmadığı için bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt defteri girdisini kullanır.
- OpenCode Docker varyantı katı bir tek ajan regresyon hattıdır. `~/.profile` kaynak olarak alındıktan sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan transkripti gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için manuel/geçici çözüm yoludur. Docker ACP bağlama smoke testi, OpenClaw'un gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex app-server donanımı smoke testi

- Hedef: Plugin'e ait Codex donanımını normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - Codex donanımı zorunlu kılınmış olarak `openai/gpt-5.5` modeline ilk Gateway ajan turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve app-server
    iş parçacığının devam edebildiğini doğrula
  - aynı Gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian incelemeli iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken zararsız
    bir komut ve reddedilmesi gereken sahte gizli bilgi yüklemesi, böylece ajan geri soru sorar
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştir: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `agentRuntime.id: "codex"` kullanır; böylece bozuk bir Codex donanımı
  sessizce PI'a geri düşerek geçemez.
- Kimlik doğrulama: yerel Codex abonelik oturum açmasından Codex app-server kimlik doğrulaması. Docker
  smoke testleri, uygulanabilir olduğunda Codex dışı yoklamalar için `OPENAI_API_KEY` de sağlayabilir;
  ayrıca isteğe bağlı olarak kopyalanmış `~/.codex/auth.json` ve `~/.codex/config.toml` dosyaları kullanılabilir.

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
- Bağlanmış `~/.profile` dosyasını kaynak olarak alır, `OPENAI_API_KEY` değerini geçirir, varsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm
  önekine yükler, kaynak ağacını hazırlar, ardından yalnızca Codex donanımı canlı testini çalıştırır.
- Docker varsayılan olarak görüntü, MCP/araç ve Guardian yoklamalarını etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ya da
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır; bu nedenle eski takma adlar veya PI
  geri dönüşü bir Codex donanımı regresyonunu gizleyemez.

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

- Google uyarlamalı düşünme smoke testi:
  - Yerel anahtarlar kabuk profilindeyse: `source ~/.profile`
  - Gemini 3 dinamik varsayılan: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçe: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç kullanımı ayrıntıları).
- Gemini API ile Gemini CLI:
  - API: OpenClaw, HTTP üzerinden Google'ın barındırılan Gemini API'sini çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikili dosyasını kabukta çalıştırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm uyuşmazlığı).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modeller şunlardır.

### Modern smoke seti (araç çağırma + görüntü)

Çalışır durumda kalmasını beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (daha eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway smoke testini araçlar + görüntü ile çalıştır:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4.3` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görüntü gönderimi (ek → çok modlu mesaj)

Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI vision yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse şunlar üzerinden testi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde "all models" değerini sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` tarafından döndürülenler ve mevcut anahtarlardır.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, canlı testler aynı anahtarları bulmalıdır.
- Bir canlı test “no creds” diyorsa, `openclaw models list` / model seçimi için hata ayıklarken kullanacağınız aynı yöntemle hata ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profile keys” ifadesi bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (var olduğunda hazırlanmış canlı home içine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test home içine kopyalar; hazırlanmış canlı home'lar `workspace/` ve `sandboxes/` dizinlerini atlar ve probların gerçek ana makine çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları çıkarılır.

Env anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` içinde dışa aktarılmış), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus kodlama planı canlı

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Yerleşik comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadığı sürece her yeteneği atlar
  - Comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü üretimi canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Çalıştırma düzeneği: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı Plugin'ini listeler
  - Prob yapmadan önce eksik sağlayıcı env değişkenlerini oturum açma shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görüntü üretimi runtime'ı üzerinden çalıştırır:
    - `<provider>:generate`
    - Sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan mevcut yerleşik sağlayıcılar:
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
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Gönderilen CLI yolu için, sağlayıcı/runtime canlı testi geçtikten sonra bir `infer` duman testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu, CLI argüman ayrıştırmasını, yapılandırma/varsayılan ajan çözümlemeyi, yerleşik Plugin etkinleştirmeyi, paylaşılan görüntü üretimi runtime'ını ve canlı sağlayıcı isteğini kapsar. Plugin bağımlılıklarının runtime yüklemesinden önce mevcut olması beklenir.

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Çalıştırma düzeneği: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan yerleşik müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'i kapsar
  - Prob yapmadan önce sağlayıcı env değişkenlerini oturum açma shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen her iki runtime modunu çalıştırır:
    - Yalnızca prompt girişli `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan kulvar kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Çalıştırma düzeneği: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan yerleşik video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli duman testi yolunu kullanır: FAL olmayan sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik lobster prompt'u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafındaki kuyruk gecikmesi sürüm süresine baskın olabileceği için varsayılan olarak FAL'ı atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` iletin
  - Prob yapmadan önce sağlayıcı env değişkenlerini oturum açma shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada buffer destekli yerel görüntü girişini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada buffer destekli yerel video girişini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada mevcut bildirilen-ancak-atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü yerleşik `veo3` yalnızca metin desteklidir ve yerleşik `kling` uzak bir görüntü URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` metinden videoya ve uzak görüntü URL fikstürü kullanan bir `kling` kulvarı çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - yalnızca seçili model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada mevcut bildirilen-ancak-atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`, çünkü mevcut paylaşılan Gemini/Veo kulvarı yerel buffer destekli giriş kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`, çünkü mevcut paylaşılan kulvarda kuruluşa özgü video inpaint/remix erişim garantileri yoktur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir duman testi çalıştırmasında her sağlayıcı işlem sınırını düşürmek için `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı çalıştırma düzeneği

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı paketlerini tek bir repo yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` üzerinden otomatik yükler
  - Her paketi varsayılan olarak şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` öğesini yeniden kullanır, böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test Etme](/tr/help/testing) — birim, entegrasyon, QA ve Docker paketleri
