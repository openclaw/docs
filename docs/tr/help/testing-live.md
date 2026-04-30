---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / media-provider duman testleri çalıştırılıyor
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Yeni bir sağlayıcıya özgü canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı test paketleri'
x-i18n:
    generated_at: "2026-04-30T09:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için bkz.
[Test Etme](/tr/help/testing). Bu sayfa **live** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı live testleri, ayrıca
kimlik bilgisi yönetimi.

## Live: yerel profil smoke komutları

Geçici live kontrollerinden önce `~/.profile` dosyasını kaynak olarak yükleyin; böylece sağlayıcı anahtarları ve yerel araç
yolları kabuğunuzla eşleşir:

```bash
source ~/.profile
```

Güvenli medya smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Güvenli sesli arama hazırlığı smoke:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de yoksa kuru çalıştırmadır. `--yes` seçeneğini yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık kontrolü genel bir webhook URL'si gerektirir; yalnızca yerel
loopback/özel yedekler tasarım gereği reddedilir.

## Live: Android düğüm yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Hedef: bağlı bir Android düğümü tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket uygulamayı yüklemez/çalıştırmaz/eşleştirmez).
  - Seçilen Android düğümü için komut komut Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway'e bağlı ve eşleştirilmiş.
  - Uygulama ön planda tutulmuş.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testleri iki katmana ayrılır, böylece hataları izole edebiliriz:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla yanıt verip veremediğini söyler.
- “Gateway smoke”, o model için tam gateway+ajan hattının çalışıp çalışmadığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Hedef:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, modern için takma ad) ayarlayın; aksi halde `pnpm test:live` komutunu gateway smoke'a odaklı tutmak için atlar
- Modeller nasıl seçilir:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgüllü izin listesi)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model test zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model probları varsayılan olarak 20'li paralellik ile çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgüllü izin listesi)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposu**nu zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Neden var:
  - “Sağlayıcı API bozuk / anahtar geçersiz” durumunu “gateway ajan hattı bozuk” durumundan ayırır
  - Küçük, izole regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatması + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme ajanı smoke ("@openclaw" gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Hedef:
  - Süreç içinde çalışan bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamamak (her çalıştırma için model geçersiz kılma)
  - Anahtarlı modeller üzerinde yineleme yapmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma probu)
    - isteğe bağlı ek araç probları (exec+read probu)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam eder
- Prob ayrıntıları (hataları hızlıca açıklayabilmeniz için):
  - `read` probu: test çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` etmesini ve nonce'u geri yankılamasını ister.
  - `exec+read` probu: test ajandan bir geçici dosyaya nonce'u `exec` ile yazmasını, ardından bunu geri `read` etmesini ister.
  - görüntü probu: test üretilmiş bir PNG (cat + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey”den kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgüllü izin listesi)
- Bu live testte araç + görüntü probları her zaman açıktır:
  - `read` probu + `exec+read` probu (araç stresi)
  - model görüntü girdisi desteği duyurduğunda görüntü probu çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI arka uç smoke (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Hedef: varsayılan yapılandırmanıza dokunmadan yerel bir CLI arka ucu kullanarak Gateway + ajan hattını doğrulamak.
- Arka uca özgü smoke varsayılanları, sahip olan Plugin'in `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argümanlar/görüntü davranışı, sahip olan CLI arka uç Plugin meta verilerinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt'a enjekte edilir). Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.
  - Görüntü dosyası yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görüntü argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum sürekliliği probuna katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri, toplu güvenilirlik için bunu varsayılan olarak kapalı tutar.
  - MCP/araç loopback probuna katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ucuz Gemini MCP yapılandırma smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu, Gemini'den bir yanıt üretmesini istemez. OpenClaw'ın Gemini'ye verdiği aynı sistem
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
- Live CLI arka uç smoke testini repo Docker görüntüsü içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verilerini sahip olan Plugin'den çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` konumundaki önbelleğe alınmış yazılabilir öneke yükler (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` veya `claude setup-token` kaynaklı `CLAUDE_CODE_OAUTH_TOKEN` üzerinden taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` komutunu kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı limitleri yerine ek kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve görüntü problarını varsayılan olarak devre dışı bırakır.
- Live CLI arka uç smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görüntü sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamar ve sürdürülen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Live: ACP bağlama smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Hedef: canlı bir ACP ajanıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturumu dökümüne ulaştığını doğrula
- Etkinleştirme:
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
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticilere açık sentetik kaynak rota alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP test düzeneği ajanı için gömülü `acpx` Plugin'inin yerleşik ajan kayıt defterini kullanır.
  - Bağlı oturum Cron MCP oluşturma, varsayılan olarak en iyi çaba esaslıdır çünkü harici ACP test düzenekleri bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bu bağlama sonrası Cron yoklamasını katı yapmak için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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
- Varsayılan olarak ACP bağlama duman testini toplu canlı CLI ajanlarına sırayla karşı çalıştırır: `claude`, `codex`, sonra `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını kaynak alır, eşleşen CLI kimlik doğrulama malzemesini kapsayıcıya hazırlar, ardından eksikse istenen canlı CLI'yı (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` üzerinden Factory Droid, `@google/gemini-cli` veya `opencode-ai`) yükler. ACP arka ucunun kendisi, `acpx` Plugin'inden paketlenmiş gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` hazırlar, `FACTORY_API_KEY` iletir ve yerel Factory OAuth/keyring kimlik doğrulaması kapsayıcıya taşınabilir olmadığı için bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt defteri girdisini kullanır.
- OpenCode Docker varyantı katı bir tek ajanlı regresyon hattıdır. `~/.profile` kaynak alındıktan sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode` genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan dökümü gerektirir.
- Doğrudan `acpx` CLI çağrıları, Gateway dışında davranışı karşılaştırmak için yalnızca manuel/geçici çözüm yoludur. Docker ACP bağlama duman testi, OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex uygulama sunucusu test düzeneği duman testi

- Hedef: Plugin'e ait Codex test düzeneğini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - Codex test düzeneği zorlanmış şekilde `openai/gpt-5.5` modeline ilk gateway ajan turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve uygulama sunucusu
    iş parçacığının sürdürülebileceğini doğrula
  - aynı gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken zararsız bir
    komut ve reddedilmesi gereken sahte gizli bilgi yüklemesi; böylece ajan geri soru sorar
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Duman testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  test düzeneği sessizce PI'ya geri düşerek geçemez.
- Kimlik doğrulama: yerel Codex abonelik oturum açmasından Codex uygulama sunucusu kimlik doğrulaması. Docker
  duman testleri, uygulanabilir olduğunda Codex dışı yoklamalar için `OPENAI_API_KEY` de sağlayabilir;
  ayrıca isteğe bağlı olarak `~/.codex/auth.json` ve `~/.codex/config.toml` kopyalanabilir.

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
- Bağlanan `~/.profile` dosyasını kaynak alır, `OPENAI_API_KEY` iletir, varsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm
  önekine yükler, kaynak ağacını hazırlar, ardından yalnızca Codex test düzeneği canlı testini çalıştırır.
- Docker, görüntü, MCP/araç ve Guardian yoklamalarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama
  çalıştırmasına ihtiyaç duyduğunuzda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, canlı
  test yapılandırmasıyla eşleşir ve eski takma adların veya PI geri düşmesinin bir Codex test düzeneği
  regresyonunu gizlemesini engeller.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway duman testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlanabilir düşünme duman testi:
  - Yerel anahtarlar kabuk profilindeyse: `source ~/.profile`
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yı kullanır (ayrı kimlik doğrulama + araç kullanımı tuhaflıkları).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikilisini kabuk üzerinden çalıştırır; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm uyumsuzluğu).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern duman testi kümesi (araç çağırma + görüntü)

Bu, çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex olmayan): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (daha eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile Gateway duman testini çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az birini seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni)
- Mistral: `mistral/`… (etkinleştirdiğiniz, “araçlar” destekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Görsel işleme: görüntü gönderimi (ek → çok modlu mesaj)

Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü destekli model ekleyin (Claude/Gemini/OpenAI görsel destekli varyantları vb.).

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse, şunlar üzerinden test etmeyi de destekleriz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` üzerinden kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir vekil sunucu (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde “tüm modeller” ifadesini sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa canlı testler aynı anahtarları bulmalıdır.
- Bir canlı test “kimlik bilgisi yok” diyorsa, `openclaw models list` / model seçimini nasıl ayıklıyorsanız aynı şekilde ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcut olduğunda aşamalı canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar, varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; aşamalı canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar ve yoklamaların gerçek ana makine çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Ortam anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` dosyanızda dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını konteynere bağlayabilir).

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
  - Birlikte gelen comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra yararlıdır

## Görüntü üretimi canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Test düzeneği: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı Plugin’ini listeler
  - Yoklamadan önce eksik sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Her yapılandırılmış sağlayıcıyı paylaşılan görüntü üretimi çalışma zamanı üzerinden çalıştırır:
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
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Gönderilen CLI yolu için, sağlayıcı/çalışma zamanı canlı testi geçtikten sonra bir `infer` smoke testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu, CLI argüman ayrıştırmayı, yapılandırma/varsayılan ajan çözümlemeyi, birlikte gelen Plugin etkinleştirmeyi, isteğe bağlı birlikte gelen çalışma zamanı bağımlılığı onarımını, paylaşılan görüntü üretimi çalışma zamanını ve canlı sağlayıcı isteğini kapsar.

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan birlikte gelen müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’i kapsar
  - Yoklamadan önce sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki çalışma zamanı modunu da çalıştırır:
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
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Test düzeneği: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan birlikte gelen video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya istek, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebileceği için varsayılan olarak FAL’ı atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçirin
  - Yoklamadan önce sağlayıcı ortam değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada tampon destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada tampon destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda bildirilen ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`; çünkü birlikte gelen `veo3` yalnızca metin destekler ve birlikte gelen `kling` uzak görüntü URL’si gerektirir
  - Sağlayıcıya özel Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya, `veo3` metinden videoya yolunu ve varsayılan olarak uzak görüntü URL’si fikstürü kullanan bir `kling` hattını çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - Yalnızca seçili model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilen ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL’leri gerektirir
    - `google`; çünkü mevcut paylaşılan Gemini/Veo hattı yerel tampon destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`; çünkü mevcut paylaşılan hatta kuruluşa özel video inpaint/remix erişim garantileri yoktur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için her sağlayıcı işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortamdan gelen geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı test düzeneği

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı paketlerini tek bir repo yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test](/tr/help/testing) — birim, entegrasyon, QA ve Docker paketleri
