---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcısı smoke testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Yeni sağlayıcıya özgü canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı paketler'
x-i18n:
    generated_at: "2026-06-28T00:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için
[Test Etme](/tr/help/testing) sayfasına bakın. Bu sayfa **canlı** (ağa erişen) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri, ayrıca
kimlik bilgisi yönetimi.

## Canlı: yerel smoke komutları

Geçici canlı kontrollerden önce gerekli sağlayıcı anahtarını işlem ortamında dışa aktarın.

Güvenli medya smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazırlık smoke'u:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de verilmediği sürece kuru çalıştırmadır. `--yes` bayrağını yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık kontrolü herkese açık bir webhook URL'si gerektirir; yalnızca yerel
loopback/özel geri dönüşler tasarım gereği reddedilir.

## Canlı: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından **şu anda ilan edilen her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket uygulamayı yüklemez/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması gateway'e zaten bağlı + eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model smoke'u (profil anahtarları)

Canlı testler iki katmana ayrılır; böylece hataları yalıtabiliriz:

- "Doğrudan model", sağlayıcının/modelin verilen anahtarla hiç yanıt verip veremediğini gösterir.
- "Gateway smoke", o model için tam gateway+agent işlem hattının çalışıp çalışmadığını gösterir (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgilerine sahip olduğunuz modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern`, `small` veya `all` (modern için takma ad) ayarlayın; aksi halde `pnpm test:live` komutunu gateway smoke'a odaklı tutmak için atlanır
- Model seçme:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - Kısıtlı küçük model izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=small` (Qwen 8B/9B yerel uyumlu rotalar, Ollama Gemma, OpenRouter Qwen/GLM ve Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgüllü izin listesi)
  - Yerel Ollama küçük model çalıştırmaları varsayılan olarak `http://127.0.0.1:11434` kullanır; `OPENCLAW_LIVE_OLLAMA_BASE_URL` değerini yalnızca LAN, özel veya Ollama Cloud uç noktaları için ayarlayın.
  - Modern/all ve small taramaları varsayılan olarak kendi seçilmiş sınırlarını kullanır; kapsamlı bir seçili profil taraması için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, doğrudan model testinin tamamı için zaman aşımı olarak `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20'li paralellik ile çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçme:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgüllü izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Neden var:
  - "sağlayıcı API bozuk / anahtar geçersiz" durumunu "gateway agent işlem hattı bozuk" durumundan ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme tekrar oynatma + araç çağrısı akışları)

### Katman 2: Gateway + dev agent smoke'u ("@openclaw"ın gerçekten yaptığı şey)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - İşlem içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller üzerinde dolaşıp şunları doğrulamak:
    - "anlamlı" yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam eder
- Yoklama ayrıntıları (hataları hızlıca açıklayabilmeniz için):
  - `read` yoklaması: test çalışma alanına tek kullanımlık bir dosya yazar ve agent'tan onu `read` etmesini ve tek kullanımlık değeri geri yankılamasını ister.
  - `exec+read` yoklaması: test agent'tan bir geçici dosyaya tek kullanımlık değer `exec` ile yazmasını, ardından onu `read` ile geri okumasını ister.
  - görsel yoklaması: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `test/helpers/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçme:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - Aynı kısıtlı küçük model izin listesini tam gateway+agent işlem hattı üzerinden çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS=small`
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all ve small gateway taramaları varsayılan olarak kendi seçilmiş sınırlarını kullanır; kapsamlı bir seçili tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçme ("OpenRouter her şey" durumundan kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgüllü izin listesi)
- Araç + görsel yoklamaları bu canlı testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stresi)
  - görsel yoklaması, model görsel girdisi desteği ilan ettiğinde çalışır
  - Akış (üst düzey):
    - Test, "CAT" + rastgele kod içeren küçük bir PNG oluşturur (`test/helpers/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI arka uç smoke'u (Claude, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: Varsayılan yapılandırmanıza dokunmadan yerel bir CLI arka ucu kullanarak Gateway + agent işlem hattını doğrulamak.
- Arka uca özgü smoke varsayılanları, sahip olan extension'ın `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, sahip olan CLI arka uç plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir). Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.
  - Görsel dosya yollarını istem enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçili model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum süreklilik yoklamasına dahil olmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri, toplu güvenilirlik için bunu varsayılan olarak kapalı tutar.
  - MCP/araç loopback yoklamasına dahil olmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.

Örnek:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ucuz Gemini MCP yapılandırma smoke'u:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu, Gemini'dan bir yanıt üretmesini istemez. OpenClaw'ın Gemini'ya verdiği aynı sistem
ayarlarını yazar, ardından kaydedilmiş bir `transport: "streamable-http"` sunucusunun Gemini'nın HTTP MCP
şekline normalleştirildiğini ve yerel bir streamable-HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

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
- Canlı CLI arka uç smoke'unu depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verilerini sahip olan extension'dan çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki önbelleğe alınmış yazılabilir bir öneke yükler (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` üzerinden ya da `claude setup-token` çıktısından `CLAUDE_CODE_OAUTH_TOKEN` ile taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik yolu, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı limitleri yerine ek kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve görsel yoklamalarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç smoke'u artık Claude ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görsel sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke'u ayrıca oturumu Sonnet'ten Opus'a yamalar ve sürdürülen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: APNs HTTP/2 proxy erişilebilirliği

- Test: `src/infra/push-apns-http2.live.test.ts`
- Amaç: Yerel bir HTTP CONNECT proxy üzerinden Apple'ın sandbox APNs uç noktasına tünel açmak, APNs HTTP/2 doğrulama isteğini göndermek ve Apple'ın gerçek `403 InvalidProviderToken` yanıtının proxy yolu üzerinden geri geldiğini doğrulamak.
- Etkinleştirme:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- İsteğe bağlı zaman aşımı:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Canlı: ACP bağlama smoke'u (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: gerçek ACP konuşma bağlama akışını canlı bir ACP ajanıyla doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturumu dökümüne ulaştığını doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içinde ACP ajanları: `claude,codex,gemini`
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
  - Bu hat, testlerin dışarıya teslimat yapıyormuş gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticilere yönelik sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP harness ajanı için gömülü `acpx` Plugin'inin yerleşik ajan kayıt defterini kullanır.
  - Bağlı oturum Cron MCP oluşturma varsayılan olarak en iyi çaba esaslıdır çünkü dış ACP harness'ları bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bu bağlama sonrası Cron probunu katı hale getirmek için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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
- Varsayılan olarak ACP bağlama smoke testini toplu canlı CLI ajanlarına sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- Eşleşen CLI kimlik doğrulama materyalini konteynere yerleştirir, ardından eksikse istenen canlı CLI'ı (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` üzerinden Factory Droid, `@google/gemini-cli` veya `opencode-ai`) kurar. ACP arka ucunun kendisi, resmi `acpx` Plugin'inden gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` konumunu hazırlar, `FACTORY_API_KEY` iletir ve yerel Factory OAuth/keyring kimlik doğrulaması konteynere taşınabilir olmadığı için bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt defteri girdisini kullanır.
- OpenCode Docker varyantı katı bir tek ajanlı regresyon hattıdır. `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir yardımcı dökümü gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için manuel/geçici çözüm yoludur. Docker ACP bağlama smoke testi, OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex app-server harness smoke testi

- Amaç: Plugin'e ait Codex harness'ını normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketli `codex` Plugin'ini yükle
  - OpenAI ajan dönüşlerini varsayılan olarak Codex üzerinden yönlendiren `openai/gpt-5.5` seç
  - Codex harness seçiliyken `openai/gpt-5.5` hedefine ilk Gateway ajan dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    iş parçacığının sürdürülebildiğini doğrula
  - aynı Gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen iki yükseltilmiş kabuk probu çalıştır: onaylanması gereken zararsız bir
    komut ve reddedilmesi gereken sahte gizli yükleme; böylece ajan geri soru sorar
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü probu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probu: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian probu: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi, bozuk bir Codex harness'ının sessizce OpenClaw'a geri düşerek geçememesi için sağlayıcı/model `agentRuntime.id: "codex"` değerini zorlar.
- Kimlik doğrulama: Yerel Codex abonelik oturum açmasından Codex app-server kimlik doğrulaması. Docker
  smoke testleri, uygulanabilir olduğunda Codex dışı problar için `OPENAI_API_KEY` ve isteğe bağlı kopyalanmış `~/.codex/auth.json` ile `~/.codex/config.toml` da sağlayabilir.

Yerel tarif:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumundadır.
- `OPENAI_API_KEY` geçirir, varsa Codex CLI kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış bir npm
  önekine kurar, kaynak ağacını hazırlar ve ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker, görüntü, MCP/araç ve Guardian problarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama
  çalıştırmasına ihtiyaç duyduğunuzda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ya da
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır, bu nedenle eski takma adlar veya OpenClaw
  geri düşmesi bir Codex harness regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar ve açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Küçük model doğrudan profili:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Küçük model Gateway profili:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API smoke testi:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Tek model, Gateway smoke testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 doğrudan smoke testi:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlamalı düşünme smoke testi:
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...`, Gemini API'yi kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'ı kullanır (ayrı kimlik doğrulama + araç davranışı farklılıkları).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının "Gemini" derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikilisini kabuk üzerinden çalıştırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm uyumsuzluğu).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir "CI model listesi" yoktur (canlı opt-in'dir), ancak anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (araç çağırma + görüntü)

Çalışır durumda tutmayı beklediğimiz "yaygın modeller" çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (genel API) veya `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Araçlar + görüntü ile Gateway smoke testini çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (genel API) veya `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4.3` (veya mevcut en son)
- Mistral: `mistral/`… (etkinleştirdiğiniz "tools" yetenekli modellerden birini seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Görüntü: görüntü gönderme (ek → çok modlu mesaj)

Görüntü probunu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI görüntü yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse şunlar üzerinden test etmeyi de destekleriz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden kimlik doğrulama)

Canlı matrise ekleyebileceğiniz diğer sağlayıcılar (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Dokümanlarda "tüm modeller" ifadesini sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar kullanılabiliyorsa odur.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa canlı testler aynı anahtarları bulmalıdır.
- Bir canlı test "no creds" diyorsa, `openclaw models list` / model seçimini nasıl ayıklarsanız aynı şekilde ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde "profile keys" ifadesi bunu belirtir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanmış canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar, varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; hazırlanmış canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar ve probların gerçek ana makine çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Env anahtarlarına güvenmek istiyorsanız, yerel testlerden önce bunları dışa aktarın veya aşağıdaki
Docker çalıştırıcılarını açık bir `OPENCLAW_PROFILE_FILE` ile kullanın.

## Deepgram canlı (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus kodlama planı canlı

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü üretimi canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı Plugin'ini listeler
  - Prob işleminden önce zaten dışa aktarılmış sağlayıcı env değişkenlerini kullanır
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görüntü üretimi runtime'ından geçirir:
    - `<provider>:generate`
    - Sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan mevcut paketlenmiş sağlayıcılar:
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

Gönderilen CLI yolu için, sağlayıcı/runtime canlı testi geçtikten sonra bir `infer` smoke
ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu, CLI argüman ayrıştırmayı, yapılandırma/varsayılan ajan çözümlemeyi, paketlenmiş
Plugin etkinleştirmeyi, paylaşılan görüntü üretimi runtime'ını ve canlı sağlayıcı
isteğini kapsar. Plugin bağımlılıklarının runtime yüklenmeden önce mevcut olması beklenir.

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'i kapsar
  - Prob işleminden önce zaten dışa aktarılmış sağlayıcı env değişkenlerini kullanır
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Kullanılabilir olduğunda bildirilen iki runtime modunu da çalıştırır:
    - Yalnızca istem girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan hat kapsamı:
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
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebileceği için varsayılan olarak FAL'ı atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçirin
  - Prob işleminden önce zaten dışa aktarılmış sağlayıcı env değişkenlerini kullanır
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada mevcut bildirilmiş ancak atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak görüntü URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` metinden videoya ve uzak görüntü URL'si fixture'ı kullanan bir `kling` hattı çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada mevcut bildirilmiş ancak atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`, çünkü mevcut paylaşılan hatta kuruluşa özgü video düzenleme erişim garantileri yoktur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için her sağlayıcı işlem sınırını düşürmek üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı paketlerini repo'ya özgü tek bir giriş noktası üzerinden çalıştırır
  - Zaten dışa aktarılmış sağlayıcı env değişkenlerini kullanır
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test Etme](/tr/help/testing) - birim, entegrasyon, QA ve Docker paketleri
