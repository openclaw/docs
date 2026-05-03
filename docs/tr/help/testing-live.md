---
read_when:
    - Canlı model matrisi / CLI arka ucu / ACP / media-provider duman testlerini çalıştırma
    - Canlı test kimlik bilgisi çözümlemesinde hata ayıklama
    - Sağlayıcıya özel yeni bir canlı test ekleme
sidebarTitle: Live tests
summary: 'Canlı (ağa erişen) testler: model matrisi, CLI arka uçları, ACP, medya sağlayıcıları, kimlik bilgileri'
title: 'Test: canlı test paketleri'
x-i18n:
    generated_at: "2026-05-03T08:56:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

Hızlı başlangıç, QA çalıştırıcıları, birim/entegrasyon paketleri ve Docker akışları için bkz.
[Testing](/tr/help/testing). Bu sayfa **canlı** (ağa dokunan) test
paketlerini kapsar: model matrisi, CLI arka uçları, ACP ve medya sağlayıcısı canlı testleri, ayrıca
kimlik bilgisi işleme.

## Canlı: yerel profil smoke komutları

Geçici canlı kontrollerden önce `~/.profile` dosyasını kaynak olarak yükleyin; böylece sağlayıcı anahtarları ve yerel araç
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

Güvenli sesli arama hazırlık smoke testi:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`, `--yes` de yoksa kuru çalıştırmadır. `--yes` seçeneğini yalnızca
bilerek gerçek bir bildirim araması yapmak istediğinizde kullanın. Twilio, Telnyx ve
Plivo için başarılı bir hazırlık kontrolü herkese açık bir webhook URL'si gerektirir; yalnızca yerel
loopback/özel yedekler tasarım gereği reddedilir.

## Canlı: Android düğümü yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Hedef: bağlı bir Android düğümü tarafından **şu anda duyurulan her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/manuel kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android düğümü için komut komut gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten Gateway'e bağlı ve eşleştirilmiş.
  - Uygulama ön planda tutulmuş.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke testi (profil anahtarları)

Canlı testler iki katmana ayrılmıştır; böylece hataları yalıtabiliriz:

- "Doğrudan model", sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini gösterir.
- "Gateway smoke", tam gateway+agent işlem hattının o model için çalıştığını gösterir (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Hedef:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, modern için takma ad) ayarlayın; aksi halde `pnpm test:live` odağını Gateway smoke testinde tutmak için atlar
- Model seçme:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (virgüllü izin listesi)
  - Modern/all taramaları varsayılan olarak düzenlenmiş yüksek sinyalli bir sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0` veya daha küçük bir sınır için pozitif bir sayı ayarlayın.
  - Kapsamlı taramalar, tüm doğrudan model testi zaman aşımı için `OPENCLAW_LIVE_TEST_TIMEOUT_MS` kullanır. Varsayılan: 60 dakika.
  - Doğrudan model yoklamaları varsayılan olarak 20'li paralellikle çalışır; geçersiz kılmak için `OPENCLAW_LIVE_MODEL_CONCURRENCY` ayarlayın.
- Sağlayıcı seçme:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgüllü izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposu** kullanımını zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - "sağlayıcı API'si bozuk / anahtar geçersiz" durumunu "Gateway agent işlem hattı bozuk" durumundan ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme yeniden oynatma + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme agent smoke testi ("@openclaw" gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Hedef:
  - İşlem içi bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamamak (çalıştırma başına model geçersiz kılması)
  - Anahtarlı modeller üzerinde yinelemek ve şunları doğrulamak:
    - "anlamlı" yanıt (araç yok)
    - gerçek bir araç çağrısı çalışır (okuma yoklaması)
    - isteğe bağlı ek araç yoklamaları (exec+read yoklaması)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam eder
- Yoklama ayrıntıları (hataları hızlıca açıklayabilmeniz için):
  - `read` yoklaması: test, çalışma alanına bir nonce dosyası yazar ve agent'tan bunu `read` edip nonce değerini geri yankılamasını ister.
  - `exec+read` yoklaması: test, agent'tan bir geçici dosyaya nonce değerini `exec` ile yazmasını, sonra geri `read` etmesini ister.
  - görüntü yoklaması: test üretilmiş bir PNG (cat + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama referansı: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçme:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak düzenlenmiş yüksek sinyalli bir sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` veya daha küçük bir sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçme ("OpenRouter her şey" durumundan kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgüllü izin listesi)
- Araç + görüntü yoklamaları bu canlı testte her zaman açıktır:
  - `read` yoklaması + `exec+read` yoklaması (araç stres testi)
  - görüntü yoklaması, model görüntü girişi desteği duyurduğunda çalışır
  - Akış (üst düzey):
    - Test, "CAT" + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` olarak gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, çok modlu bir kullanıcı mesajını modele iletir
    - Doğrulama: yanıt `cat` + kod içerir (OCR toleransı: küçük hatalara izin verilir)

<Tip>
Makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Canlı: CLI arka uç smoke testi (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Hedef: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI arka ucu kullanarak Gateway + agent işlem hattını doğrulamak.
- Arka uca özel smoke varsayılanları, sahibi olan Plugin'in `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görüntü davranışı, sahibi olan CLI arka uç Plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir). Docker tariflerinde bu, açıkça istenmedikçe varsayılan olarak kapalıdır.
  - Görüntü dosyası yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında görüntü argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve sürdürme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Seçilen model bir geçiş hedefini desteklediğinde Claude Sonnet -> Opus aynı oturum süreklilik yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker tariflerinde bu, toplu güvenilirlik için varsayılan olarak kapalıdır.
  - MCP/araç loopback yoklamasına katılmak için `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker tariflerinde bu, açıkça istenmedikçe varsayılan olarak kapalıdır.

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
ayarlarını yazar, ardından kayıtlı bir `transport: "streamable-http"` sunucusunun Gemini'nin HTTP MCP
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
- Canlı CLI arka uç smoke testini repo Docker görüntüsünün içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verisini sahibi olan Plugin'den çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içindeki önbelleğe alınmış yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` veya `claude setup-token` üzerinden `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code aboneliği OAuth gerektirir. Önce Docker içinde doğrudan `claude -p` kanıtı alır, ardından Anthropic API anahtarı env var'larını korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalaması üzerinden yönlendirdiği için Claude MCP/araç ve görüntü yoklamalarını varsayılan olarak devre dışı bırakır.
- Canlı CLI arka uç smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görüntü sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve sürdürülen oturumun daha önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Hedef: canlı bir ACP aracısıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj kanalı konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturumu dökümüne ulaştığını doğrula
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Notlar:
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi yapmadan mesaj kanalı bağlamı ekleyebilmesi için yalnızca yöneticiye açık sentetik kaynak rota alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçili ACP koşum aracısı için gömülü `acpx` Plugin'inin yerleşik aracı kaydını kullanır.
  - Bağlı oturum Cron MCP oluşturma varsayılan olarak en iyi çaba esaslıdır, çünkü harici ACP koşumları bağlama/görüntü kanıtı geçtikten sonra MCP çağrılarını iptal edebilir; bağlama sonrası Cron yoklamasını katı hale getirmek için `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` ayarlayın.

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
- Varsayılan olarak ACP bağlama duman testini toplu canlı CLI aracılarına sırasıyla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` kullanın.
- `~/.profile` dosyasını kaynak olarak alır, eşleşen CLI kimlik doğrulama materyalini konteynere hazırlar, ardından eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` veya `opencode-ai`) kurar. ACP arka ucunun kendisi, resmi `acpx` Plugin'inden gömülü `acpx/runtime` paketidir.
- Droid Docker varyantı ayarlar için `~/.factory` hazırlar, `FACTORY_API_KEY` iletir ve yerel Factory OAuth/keyring kimlik doğrulaması konteynere taşınabilir olmadığından bu API anahtarını gerektirir. ACPX'in yerleşik `droid exec --output-format acp` kayıt girdisini kullanır.
- OpenCode Docker varyantı katı bir tek aracılı regresyon hattıdır. `~/.profile` kaynak olarak alındıktan sonra `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` üzerinden geçici bir `OPENCODE_CONFIG_CONTENT` varsayılan modeli yazar (varsayılan `opencode/kimi-k2.6`) ve `pnpm test:docker:live-acp-bind:opencode`, genel bağlama sonrası atlamayı kabul etmek yerine bağlı bir asistan dökümü gerektirir.
- Doğrudan `acpx` CLI çağrıları yalnızca Gateway dışındaki davranışı karşılaştırmak için manuel/geçici çözüm yoludur. Docker ACP bağlama duman testi OpenClaw'ın gömülü `acpx` çalışma zamanı arka ucunu çalıştırır.

## Canlı: Codex uygulama sunucusu koşumu duman testi

- Hedef: Plugin'e ait Codex koşumunu normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - Codex koşumu zorunlu kılınmış şekilde `openai/gpt-5.5` hedefine ilk gateway aracı turunu gönder
  - aynı OpenClaw oturumuna ikinci bir tur gönder ve uygulama sunucusu
    iş parçacığının sürdürülebildiğini doğrula
  - aynı gateway komut yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen iki yükseltilmiş kabuk yoklaması çalıştır: onaylanması gereken zararsız bir komut ve reddedilmesi gereken sahte gizli bilgi yüklemesi, böylece aracı geri soru sorar
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `openai/gpt-5.5`
- İsteğe bağlı görüntü yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian yoklaması: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Duman testi `agentRuntime.id: "codex"` kullanır; böylece bozuk bir Codex koşumu sessizce PI'ye geri düşerek geçemez.
- Kimlik doğrulama: Yerel Codex abonelik oturum açmasından Codex uygulama sunucusu kimlik doğrulaması. Docker duman testleri, geçerli olduğunda Codex dışı yoklamalar için `OPENAI_API_KEY` ve isteğe bağlı kopyalanmış `~/.codex/auth.json` ile `~/.codex/config.toml` da sağlayabilir.

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
- Bağlanan `~/.profile` dosyasını kaynak olarak alır, `OPENAI_API_KEY` iletir, mevcut olduğunda Codex CLI kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm ön ekine kurar, kaynak ağacını hazırlar ve ardından yalnızca Codex koşumu canlı testini çalıştırır.
- Docker varsayılan olarak görüntü, MCP/araç ve Guardian yoklamalarını etkinleştirir. Daha dar bir hata ayıklama çalıştırmasına ihtiyaç duyduğunuzda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker aynı açık Codex çalışma zamanı yapılandırmasını kullanır; bu nedenle eski takma adlar veya PI geri dönüşü bir Codex koşumu regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar ve açık izin listeleri en hızlı ve en az kırılgandır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway duman testi:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı genelinde araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google uyarlamalı düşünme duman testi:
  - Yerel anahtarlar kabuk profilindeyse: `source ~/.profile`
  - Gemini 3 dinamik varsayılanı: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dinamik bütçesi: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı aracı uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı kimlik doğrulama + araç kullanımı özellikleri).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel bir `gemini` ikilisine kabuk üzerinden çağrı yapar; kendi kimlik doğrulaması vardır ve farklı davranabilir (akış/araç desteği/sürüm uyumsuzluğu).

## Canlı: model matrisi (kapsadıklarımız)

Sabit bir “CI model listesi” yoktur (canlı isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern duman testi kümesi (araç çağırma + görüntü)

Bu, çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (daha eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile gateway duman testini çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel çizgi: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az birini seçin:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4.3` (veya mevcut en yeni)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Görü: görüntü gönderme (ek → çok modlu mesaj)

Görüntü yoklamasını çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI görüntü yetenekli varyantları vb.).

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse şu yollarla testi de destekleriz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), artı OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

<Tip>
Belgelerde "all models" sabit kodlamayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.
</Tip>

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, canlı testler aynı anahtarları bulmalıdır.
- Bir canlı test “kimlik bilgisi yok” diyorsa, `openclaw models list` / model seçimi sorununu nasıl ayıklıyorsanız aynı şekilde ayıklayın.

- Aracı başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” ile kastedilen budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa aşamalanmış canlı ana dizine kopyalanır, ancak ana profil anahtarı deposu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, aracı başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; aşamalanmış canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar, ayrıca `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır, böylece yoklamalar gerçek ana makine çalışma alanınızdan uzak kalır.

Env anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` içinde dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını konteyner içine bağlayabilir).

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
  - Paketlenmiş comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `plugins.entries.comfy.config.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü oluşturma canlı

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Donanım: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü oluşturma sağlayıcı Plugin'ini listeler
  - Yoklama öncesinde eksik sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Yapılandırılmış her sağlayıcıyı paylaşılan görüntü oluşturma çalışma zamanı üzerinden çalıştırır:
    - `<provider>:generate`
    - Sağlayıcı düzenleme desteği bildirdiğinde `<provider>:edit`
- Kapsanan güncel paketli sağlayıcılar:
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

Gönderilen CLI yolu için, sağlayıcı/çalışma zamanı canlı testi geçtikten sonra bir `infer` smoke ekleyin:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Bu, CLI argüman ayrıştırmayı, yapılandırma/varsayılan aracı çözümlemeyi, paketlenmiş Plugin etkinleştirmeyi, paylaşılan görüntü oluşturma çalışma zamanını ve canlı sağlayıcı isteğini kapsar. Plugin bağımlılıklarının çalışma zamanı yüklemesinden önce mevcut olması beklenir.

## Müzik oluşturma canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Donanım: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketli müzik oluşturma sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'i kapsar
  - Yoklama öncesinde sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki çalışma zamanı modunu da çalıştırır:
    - Yalnızca istem girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Güncel paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video oluşturma canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Donanım: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketli video oluşturma sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir metinden videoya isteği, bir saniyelik ıstakoz istemi ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` değerinden sağlayıcı başına işlem sınırı (varsayılan olarak `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresini baskılayabildiği için FAL varsayılan olarak atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` iletin
  - Yoklama öncesinde sağlayıcı env değişkenlerini oturum açma kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/env API anahtarlarını kullanır, böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulaması/profili/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada arabellek destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada güncel bildirilen ama atlanan `imageToVideo` sağlayıcıları:
    - Paketli `veo3` yalnızca metin olduğu ve paketli `kling` uzak bir görüntü URL'si gerektirdiği için `vydra`
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Bu dosya, `veo3` metinden videoya ve varsayılan olarak uzak görüntü URL fikstürü kullanan bir `kling` hattı çalıştırır
  - Güncel `videoToVideo` canlı kapsamı:
    - Yalnızca seçili model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada güncel bildirilen ama atlanan `videoToVideo` sağlayıcıları:
    - Bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektirdiği için `alibaba`, `qwen`, `xai`
    - Güncel paylaşılan Gemini/Veo hattı yerel arabellek destekli girdi kullandığı ve bu yol paylaşılan taramada kabul edilmediği için `google`
    - Güncel paylaşılan hatta kuruluşa özgü video inpaint/remix erişim garantileri bulunmadığı için `openai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL dahil varsayılan taramadaki her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için her sağlayıcı işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorunlu kılmak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı donanımı

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı takımlarını tek bir repo yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` içinden otomatik yükler
  - Her takımı varsayılan olarak şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılarla otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır, böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## İlgili

- [Test Etme](/tr/help/testing) — birim, entegrasyon, QA ve Docker takımları
