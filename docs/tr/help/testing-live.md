---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / media-provider smoke testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Sağlayıcıya özgü yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı paketler'
x-i18n:
    generated_at: "2026-05-10T19:40:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için
[Test Etme](/tr/help/testing) bölümüne bakın. Bu sayfa **canlı** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri ile
kimlik bilgisi yönetimi.

## Canlı: yerel profil duman komutları

Geçici canlı kontrollerden önce `~/.profile` dosyasını kaynak olarak yükleyin; böylece sağlayıcı anahtarları ve yerel araç
yolları kabuğunuzla eşleşir:

```bash
source ~/.profile
```

Güvenli medya duman testi:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazır olma duman testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de bulunmadığı sürece kuru çalıştırmadır. `--yes` seçeneğini yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazır olma kontrolü herkese açık bir webhook URL'si gerektirir; yalnızca local loopback/özel
geri dönüşler tasarım gereği reddedilir.

## Canlı: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket uygulamayı yüklemez/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut komut Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı ve Gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model duman testi (profil anahtarları)

Hataları yalıtabilmemiz için canlı testler iki katmana ayrılır:

- "Doğrudan model", sağlayıcının/modelin verilen anahtarla hiç yanıt verip veremediğini söyler.
- "Gateway duman testi", o model için tam gateway+agent işlem hattının çalışıp çalışmadığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` odağını Gateway duman testinde tutmak için atlar
- Model seçme:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgüllü izin listesi)
  - Modern/all taramaları varsayılan olarak seçilmiş yüksek sinyalli bir sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model testi zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20 yönlü paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçme:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgüllü izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - "sağlayıcı API'si bozuk / anahtar geçersiz" durumunu "gateway agent işlem hattı bozuk" durumundan ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatma + araç çağrısı akışları)

### Katman 2: Gateway + dev agent duman testi ("@openclaw" gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - İşlem içi bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamak (çalıştırma başına model geçersiz kılma)
  - Anahtarı olan modeller üzerinde yineleme yapmak ve şunları doğrulamak:
    - "anlamlı" yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam eder
- Yoklama ayrıntıları (hataları hızlıca açıklayabilmeniz için):
  - `read` yoklaması: test çalışma alanına bir nonce dosyası yazar ve agent'tan onu `read` etmesini ve nonce'u geri yansıtmasını ister.
  - `exec+read` yoklaması: test agent'tan bir temp dosyasına nonce `exec` ile yazmasını, ardından onu geri `read` etmesini ister.
  - görsel yoklaması: test üretilmiş bir PNG (cat + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçme:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak seçilmiş yüksek sinyalli bir sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçme ("OpenRouter her şey" durumundan kaçınma):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgüllü izin listesi)
- Araç + görsel yoklamaları bu canlı testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stresi)
  - görsel yoklaması, model görsel giriş desteği duyurduğunda çalışır
  - Akış (üst düzey):
    - Test, "CAT" + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` aracılığıyla `attachments: [{ mimeType: "image/png", content: "<base64>" }]` olarak gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent modele çok modlu bir kullanıcı iletisi iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI arka uç duman testi (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: Varsayılan yapılandırmanıza dokunmadan, yerel bir CLI arka ucu kullanarak Gateway + agent işlem hattını doğrulamak.
- Arka uca özgü duman testi varsayılanları, sahip uzantının `cli-backend.ts` tanımında yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı, sahip CLI arka uç plugin metadata'sından gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir). Docker tarifleri açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.
  - Görsel dosya yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum sürekliliği yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri toplam güvenilirlik için bunu varsayılan olarak kapalı tutar.
  - MCP/araç loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tarifleri açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ucuz Gemini MCP yapılandırma duman testi:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu, Gemini'den yanıt üretmesini istemez. OpenClaw'ın Gemini'ye verdiği aynı sistem
ayarlarını yazar, ardından kaydedilmiş bir `transport: "streamable-http"` sunucusunun Gemini'nin HTTP MCP
biçimine normalize edildiğini ve yerel bir streamable-HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

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
- Canlı CLI arka uç duman testini repo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI duman testi metadata'sını sahip uzantıdan çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki önbelleğe alınmış yazılabilir öneke (varsayılan: `~/.cache/openclaw/docker-cli-tools`) yükler.
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` ya da `claude setup-token` kaynaklı `CLAUDE_CODE_OAUTH_TOKEN` üzerinden taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalaması üzerinden yönlendirdiği için Claude MCP/araç ve görsel yoklamalarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç duman testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı uygular: metin turu, görsel sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan duman testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve sürdürülen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: APNs HTTP/2 proxy erişilebilirliği

- Test: `src/infra/push-apns-http2.live.test.ts`
- Amaç: yerel bir HTTP CONNECT proxy üzerinden Apple'ın sandbox APNs uç noktasına tünellemek, APNs HTTP/2 doğrulama isteğini göndermek ve Apple'ın gerçek `403 InvalidProviderToken` yanıtının proxy yolu üzerinden geri geldiğini doğrulamak.
- Etkinleştirme:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- İsteğe bağlı zaman aşımı:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Canlı: ACP bind duman testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Hedef: canlı bir ACP ajanıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum dökümüne ulaştığını doğrula
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
  - Bu kulvar, testlerin dışarıya teslim ediyormuş gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticiye açık sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmadığında test, seçili ACP harness ajanı için gömülü `acpx` Plugin'inin yerleşik ajan kayıt defterini kullanır.
  - Bağlı oturum Cron MCP oluşturma varsayılan olarak en iyi çaba şeklindedir, çünkü harici ACP harness'leri bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bu bağlama sonrası Cron yoklamasını katı hale getirmek için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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
- `~/.profile` dosyasını kaynak olarak alır, eşleşen CLI kimlik doğrulama materyalini konteynere hazırlar, ardından eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` veya `opencode-ai`) kurar. ACP arka ucunun kendisi, resmi `acpx` Plugin'inden gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` hazırlar, `FACTORY_API_KEY` iletir ve yerel Factory OAuth/keyring kimlik doğrulaması konteynere taşınabilir olmadığı için bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt girdisini kullanır.
- OpenCode Docker varyantı katı bir tek ajanlı regresyon kulvarıdır. `~/.profile` kaynak olarak alındıktan sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan dökümü gerektirir.
- Doğrudan `acpx` CLI çağrıları, Gateway dışındaki davranışı karşılaştırmak için yalnızca manuel/geçici çözüm yoludur. Docker ACP bağlama smoke testi, OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex uygulama sunucusu harness smoke testi

- Hedef: Plugin'e ait Codex harness'ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - OpenAI ajan turlarını varsayılan olarak Codex üzerinden yönlendiren `openai/gpt-5.5` seç
  - Codex harness seçiliyken `openai/gpt-5.5` hedefine ilk gateway ajan turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve uygulama sunucusu
    iş parçacığının devam edebildiğini doğrula
  - aynı gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenmiş iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken zararsız
    bir komut ve reddedilmesi gereken sahte gizli bilgi yükleme; böylece ajan geri soru sorar
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştir: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi, bozuk bir Codex harness'in sessizce PI'ye geri düşerek geçememesi için sağlayıcı/model `agentRuntime.id: "codex"` değerini zorlar.
- Kimlik doğrulama: yerel Codex abonelik oturum açmasından Codex uygulama sunucusu kimlik doğrulaması. Docker
  smoke testleri, geçerli olduğunda Codex dışı yoklamalar için `OPENAI_API_KEY` ve ayrıca isteğe bağlı kopyalanmış `~/.codex/auth.json` ve `~/.codex/config.toml` sağlayabilir.

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
- Bağlanan `~/.profile` dosyasını kaynak olarak alır, `OPENAI_API_KEY` iletir, mevcut olduğunda Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm
  önekine kurar, kaynak ağacını hazırlar, ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker varsayılan olarak görüntü, MCP/araç ve Guardian yoklamalarını etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır; bu nedenle eski takma adlar veya PI
  geri dönüşü bir Codex harness regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke testi:
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
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç davranışı özellikleri).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının "Gemini" derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikili dosyasını kabuk üzerinden çalıştırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm kayması).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir "CI model listesi" yoktur (canlı isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern smoke seti (araç çağırma + görüntü)

Bu, çalışır durumda tutmayı beklediğimiz "yaygın modeller" çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile gateway smoke testi çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az birini seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4.3` (veya mevcut en son sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz "tools" yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Görüntü: görüntü gönderme (ek → çok modlu mesaj)

Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI görüntü yetenekli varyantları vb.).

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde "tüm modeller" ifadesini sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa canlı testler aynı anahtarları bulmalıdır.
- Bir canlı test "no creds" diyorsa, `openclaw models list` / model seçimini nasıl hata ayıklarsanız aynı şekilde hata ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde "profil anahtarları" bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcut olduğunda aşamalı canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini varsayılan olarak geçici bir test ana dizinine kopyalar; aşamalı canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar ve probların gerçek ana makine çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları çıkarılır.

Ortam anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` dosyanızda dışa aktarılmış), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (`~/.profile` dosyasını konteynere bağlayabilirler).

## Deepgram canlı (ses dökümü)

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
  - Paketle birlikte gelen comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü oluşturma canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Test düzeneği: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü oluşturma sağlayıcı Plugin'ini listeler
  - Yoklamadan önce eksik sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model bulunmayan sağlayıcıları atlar
  - Yapılandırılan her sağlayıcıyı paylaşılan görüntü oluşturma çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan mevcut paketli sağlayıcılar:
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
  - profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Dağıtılan CLI yolu için, sağlayıcı/çalışma zamanı canlı testi geçtikten sonra bir `infer` hızlı testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu; CLI argüman ayrıştırmayı, yapılandırma/varsayılan ajan çözümlemeyi, paketle birlikte gelen Plugin etkinleştirmesini, paylaşılan görüntü oluşturma çalışma zamanını ve canlı sağlayıcı isteğini kapsar. Plugin bağımlılıklarının çalışma zamanı yüklemesinden önce mevcut olması beklenir.

## Müzik oluşturma canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketli müzik oluşturma sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'i kapsar
  - Yoklamadan önce sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model bulunmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdisiyle `generate`
    - sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video oluşturma canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketli video oluşturma sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli hızlı test yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve sağlayıcı başına `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden işlem sınırı (varsayılan olarak `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın olabileceğinden varsayılan olarak FAL'ı atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçirin
  - Yoklamadan önce sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model bulunmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramadaki mevcut bildirilen ancak atlanan `imageToVideo` sağlayıcıları:
    - `vydra`; çünkü paketli `veo3` yalnızca metin destekler ve paketli `kling` uzak görüntü URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` metinden videoya yolunu ve uzak görüntü URL fixture'ı kullanan bir `kling` hattını çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - seçilen model `runway/gen4_aleph` olduğunda yalnızca `runway`
  - Paylaşılan taramadaki mevcut bildirilen ancak atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirir
    - `google`; çünkü mevcut paylaşılan Gemini/Veo hattı yerel tampon destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`; çünkü mevcut paylaşılan hatta kuruluşa özgü video inpaint/remix erişim garantileri yoktur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil olmak üzere varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - agresif bir hızlı test çalıştırması için her sağlayıcı işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı test düzeneği

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı paketlerini tek bir depo yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test Etme](/tr/help/testing) - birim, entegrasyon, QA ve Docker paketleri
