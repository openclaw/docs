---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / medya sağlayıcısı smoke testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesini hata ayıklama
    - Sağlayıcıya özgü yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa dokunan) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı paketler'
x-i18n:
    generated_at: "2026-04-26T11:32:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için
bkz. [Testing](/tr/help/testing). Bu sayfa **canlı** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri, ayrıca
kimlik bilgisi işleme.

## Canlı: yerel profil smoke komutları

Sağlayıcı anahtarları ve yerel araç
yolları kabuğunuzla eşleşsin diye geçici canlı kontrollerden önce `~/.profile` dosyasını kaynak olarak yükleyin:

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

`voicecall smoke`, `--yes` da eklenmedikçe kuru çalıştırmadır. `--yes` seçeneğini yalnızca
gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık kontrolü genel bir Webhook URL'si gerektirir; yalnızca yerel
loopback/özel geri dönüşler tasarım gereği reddedilir.

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından şu anda ilan edilen **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway'e bağlı ve eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Canlı: model smoke testi (profil anahtarları)

Canlı testler, hataları izole edebilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcı/modelin verilen anahtarla gerçekten yanıt verebildiğini gösterir.
- “Gateway smoke”, tam gateway+aracı işlem hattısının bu model için çalıştığını gösterir (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli gerilemeler)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` komutunun gateway smoke testine odaklı kalması için atlanır
- Model seçimi:
  - modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model testi zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model probları varsayılan olarak 20 yönlü paralellikte çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçimi:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “sağlayıcı API'si bozuk / anahtar geçersiz” ile “gateway aracı işlem hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış gerilemeleri içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatma + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme aracısı smoke testi (`@openclaw`ın gerçekten yaptığı şey)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - İşlem içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/düzeltmek (çalıştırma başına model geçersiz kılması)
  - Anahtarlı modelleri yinelemek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (okuma probu)
    - isteğe bağlı ek araç probları (`exec+read` probu)
    - OpenAI gerileme yollarının (yalnızca araç çağrısı → takip) çalışmaya devam etmesi
- Prob ayrıntıları (böylece hataları hızlıca açıklayabilirsiniz):
  - `read` probu: test çalışma alanına nonce içeren bir dosya yazar ve aracıdan bunu `read` ile okumasını ve nonce değerini geri yankılamasını ister.
  - `exec+read` probu: test, aracıdan bir nonce değerini geçici dosyaya `exec` ile yazmasını, sonra `read` ile geri okumasını ister.
  - görsel probu: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelden `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçimi:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi (“her şey için OpenRouter” olmaktan kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Araç + görsel probları bu canlı testte her zaman açıktır:
  - `read` probu + `exec+read` probu (araç baskı testi)
  - görsel probu, model görsel girişi desteği ilan ettiğinde çalışır
  - Akış (yüksek seviye):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` olarak gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü aracı, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI arka uç smoke testi (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan Gateway + aracı işlem hattısını yerel bir CLI arka ucu kullanarak doğrulamak.
- Arka uca özgü varsayılan smoke ayarları, ilgili extension'ın `cli-backend.ts` tanımında bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argümanlar/görsel davranışı ilgili CLI arka ucu Plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir). Docker tarifleri, açıkça istenmedikçe bunu varsayılan olarak kapalı tutar.
  - Görsel dosya yollarını isteme enjekte etmek yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görsel argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir dönüş gönderip devam akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum süreklilik probuna katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tarifleri bunu toplu güvenilirlik için varsayılan olarak kapalı tutar.
  - MCP/araç loopback probuna katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tarifleri bunu açıkça istenmedikçe varsayılan olarak kapalı tutar.

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ucuz Gemini MCP yapılandırma smoke testi:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Bu, Gemini'den yanıt üretmesini istemez. OpenClaw'ın Gemini'ye verdiği sistem
ayarlarının aynısını yazar, sonra kaydedilmiş
`transport: "streamable-http"` sunucusunun Gemini'nin HTTP MCP biçimine normalize edildiğini ve yerel bir streamable-HTTP MCP sunucusuna bağlanabildiğini kanıtlamak için `gemini --debug mcp list` çalıştırır.

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

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` içinde bulunur.
- Canlı CLI arka uç smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- İlgili extension'dan CLI smoke meta verisini çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içinde önbelleklenmiş yazılabilir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth'unu ya `~/.claude/.credentials.json` içindeki `claudeAiOauth.subscriptionType` üzerinden ya da `claude setup-token` komutundan gelen `CLAUDE_CODE_OAUTH_TOKEN` ile gerektirir. Önce Docker içinde doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI arka uç dönüşü çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik plan sınırları yerine ek kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve görsel problarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı test eder: metin dönüşü, görsel sınıflandırma dönüşü, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a düzeltir ve sürdürülmüş oturumun önceki notu hâlâ hatırladığını doğrular.

## Canlı: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP aracısıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum transkriptine düştüğünü doğrula
- Etkinleştirme:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Notlar:
  - Bu hat, testlerin harici teslim yapıyormuş gibi davranmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticiye açık sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmadığında test, seçilen ACP harness aracısı için gömülü `acpx` Plugin'inin yerleşik aracı kayıt defterini kullanır.

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

Tek aracı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` içinde bulunur.
- Varsayılan olarak ACP bağlama smoke testini toplu canlı CLI aracılarına sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını kaynak olarak yükler, eşleşen CLI kimlik doğrulama malzemesini container içine hazırlar, ardından istenen canlı CLI eksikse kurar (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` üzerinden Factory Droid, `@google/gemini-cli` veya `opencode-ai`). ACP arka ucunun kendisi, `acpx` Plugin'indeki paketlenmiş gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` dizinini hazırlar, `FACTORY_API_KEY` değişkenini iletir ve bu API anahtarını zorunlu kılar; çünkü yerel Factory OAuth/keyring kimlik doğrulaması container içine taşınabilir değildir. ACPX'in yerleşik `droid exec --output-format acp` kayıt girdisini kullanır.
- OpenCode Docker varyantı katı bir tek aracı gerileme hattıdır. `~/.profile` yüklendikten sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` değerinden (varsayılan `opencode/kimi-k2.6`) geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan transkripti gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için manuel/geçici çözüm yoludur. Docker ACP bağlama smoke testi OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu kullanır.

## Canlı: Codex app-server harness smoke testi

- Amaç: Plugin'e ait Codex harness'ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - Codex harness zorlanmış halde `openai/gpt-5.2` için gateway agent'a ilk dönüşü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    iş parçacığının sürdürülebildiğini doğrula
  - aynı gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından gözden geçirilen iki yükseltilmiş shell probu çalıştır: biri
    onaylanması gereken zararsız bir komut, diğeri ise aracının geri sorması için
    reddedilmesi gereken sahte bir gizli bilgi yükleme denemesi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.2`
- İsteğe bağlı görsel probu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probu: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian probu: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness'i sessizce PI'a geri dönerek testi geçemez.
- Kimlik doğrulama: yerel Codex abonelik oturumundan gelen Codex app-server kimlik doğrulaması. Docker
  smoke testleri, uygun olduğunda Codex dışı problar için `OPENAI_API_KEY` de sağlayabilir;
  ayrıca isteğe bağlı olarak kopyalanmış `~/.codex/auth.json` ve `~/.codex/config.toml` dosyaları kullanılabilir.

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` içinde bulunur.
- Bağlanmış `~/.profile` dosyasını kaynak olarak yükler, `OPENAI_API_KEY` değerini geçirir, varsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış bir npm
  önekine kurar, kaynak ağacını hazırlar, sonra yalnızca Codex-harness canlı testini çalıştırır.
- Docker varsayılan olarak görsel, MCP/araç ve Guardian problarını etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ya da
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca canlı
  test yapılandırmasıyla eşleşecek şekilde `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; böylece eski takma adlar veya PI geri dönüşü bir Codex harness
  gerilemesini gizleyemez.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az sorun çıkaran seçenektir:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı arasında araç çağrısı:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlanabilir düşünme smoke testi:
  - Yerel anahtarlar shell profilinde yaşıyorsa: `source ~/.profile`
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...`, Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı aracı uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'ı kullanır (ayrı kimlik doğrulama + araç davranışı farkları).
- Gemini API ile Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcı “Gemini” derken bunu kasteder.
  - CLI: OpenClaw, yerel `gemini` ikili dosyasını shell üzerinden çalıştırır; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (streaming/araç desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı test isteğe bağlıdır), ancak geliştirme makinesinde anahtarlarla düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (araç çağrısı + görsel)

Bu, çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- z.ai (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görsel ile gateway smoke testi çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağrısı (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- z.ai (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” destekli bir modeli seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağrısı API moduna bağlıdır)

### Vision: görsel gönderme (ek → çok modlu mesaj)

Görsel probunu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görsel destekli model ekleyin (Claude/Gemini/OpenAI görsel destekli varyantları vb.).

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse, şu yollarla da test desteğimiz vardır:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görsel destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Kimlik bilgileriniz/yapılandırmanız varsa canlı matrise dahil edebileceğiniz daha fazla sağlayıcı:

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API) ve herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM, vb.)

İpucu: belgelerde “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa, canlı testler de aynı anahtarları bulmalıdır.
- Bir canlı test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde hata ayıklayın.

- Aracı başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan canlı ev dizinine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, aracı başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test ev dizinine kopyalar; hazırlanan canlı ev dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar ve probların gerçek ana makine çalışma alanınızın dışında kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları çıkarılır.

Env anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` dosyanızda dışa aktarılmışsa), `source ~/.profile` sonrasında yerel testleri çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram canlı testi (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı testi

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya canlı testi

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görsel, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy iş akışı gönderimi, polling, indirmeler veya Plugin kaydını değiştirdikten sonra yararlıdır

## Görsel üretimi canlı testi

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görsel üretimi sağlayıcı Plugin'ini numaralandırır
  - Prob yapmadan önce eksik sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profilleri yerine canlı/env API anahtarlarını öncelikli kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Her yapılandırılmış sağlayıcıyı paylaşılan görsel üretim çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - Sağlayıcı düzenleme desteği bildiriyorsa `<provider>:edit`
- Şu anda kapsanan paketlenmiş sağlayıcılar:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env tabanlı geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

Dağıtılmış CLI yolu için sağlayıcı/çalışma zamanı canlı
testi geçtikten sonra bir `infer` smoke testi ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu; CLI argüman ayrıştırmayı, yapılandırma/varsayılan-aracı çözümlemeyi, paketlenmiş
Plugin etkinleştirmeyi, isteğe bağlı paketlenmiş çalışma zamanı bağımlılığı onarımını, paylaşılan
görsel üretim çalışma zamanını ve canlı sağlayıcı isteğini kapsar.

## Müzik üretimi canlı testi

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'i kapsar
  - Prob yapmadan önce sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profilleri yerine canlı/env API anahtarlarını öncelikli kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Kullanılabilir olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca istem girdili `generate`
    - sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyasıdır, bu paylaşılan tarama değildir
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env tabanlı geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı testi

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` değerinden gelen sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın çıkabildiği için varsayılan olarak FAL'i atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Prob yapmadan önce sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profilleri yerine canlı/env API anahtarlarını öncelikli kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görsel girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilen ama atlanan `imageToVideo` sağlayıcıları:
    - paketlenmiş `veo3` yalnızca metin olduğu ve paketlenmiş `kling` uzak görsel URL'si gerektirdiği için `vydra`
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` text-to-video artı uzak görsel URL fixture'ı kullanan bir `kling` hattı çalıştırır
  - Mevcut `videoToVideo` canlı kapsamı:
    - seçilen model `runway/gen4_aleph` olduğunda yalnızca `runway`
  - Paylaşılan taramada şu anda bildirilen ama atlanan `videoToVideo` sağlayıcıları:
    - bu yollar şu anda uzak `http(s)` / MP4 başvuru URL'leri gerektirdiği için `alibaba`, `qwen`, `xai`
    - mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullandığı ve bu yol paylaşılan taramada kabul edilmediği için `google`
    - mevcut paylaşılan hatta kuruluşa özgü video inpaint/remix erişim garantileri bulunmadığı için `openai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dahil tüm sağlayıcıları eklemek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif smoke çalıştırması için sağlayıcı başına işlem sınırını düşürmek üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env tabanlı geçersiz kılmaları yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness'i

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görsel, müzik ve video canlı paketlerini tek bir depo-yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth'u olan sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır, böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Testing](/tr/help/testing) — birim, entegrasyon, QA ve Docker paketleri
