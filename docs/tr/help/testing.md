---
read_when:
    - Testleri yerelde veya CI içinde çalıştırma
    - Model/sağlayıcı hataları için regresyon ekleme
    - gateway + ajan davranışında hata ayıklama
summary: 'Test paketi: unit/e2e/live suiteleri, Docker çalıştırıcıları ve her testin neyi kapsadığı'
title: Testing
x-i18n:
    generated_at: "2026-04-05T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Testing

OpenClaw üç Vitest suite'i (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcıları kümesi içerir.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her suite'in neyi kapsadığı (ve özellikle neyi _kapsamadığı_)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve modelleri/sağlayıcıları nasıl seçtiği
- Gerçek dünyadaki model/sağlayıcı sorunları için nasıl regresyon ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam gate (push öncesinde beklenir): `pnpm build && pnpm check && pnpm test`
- Güçlü bir makinede daha hızlı yerel tam-suite çalıştırma: `pnpm test:max`
- Doğrudan Vitest watch döngüsü (modern project yapılandırması): `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Testlere dokunduğunuzda veya daha fazla güven istediğinizde:

- Coverage gate: `pnpm test:coverage`
- E2E suite'i: `pnpm test:e2e`

Gerçek sağlayıcılarda/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live suite (modeller + gateway araç/görsel yoklamaları): `pnpm test:live`
- Tek bir live dosyayı sessiz çalıştırma: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist env değişkenleriyle live testleri daraltmayı tercih edin.

## Test suiteleri (nerede ne çalışır)

Suiteleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: `vitest.config.ts` aracılığıyla doğal Vitest `projects`
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/unit envanterleri ve `vitest.unit.config.ts` kapsamındaki izin listesine alınmış `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway auth, routing, tooling, parsing, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projects notu:
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:changed` artık aynı doğal Vitest kök `projects` yapılandırmasını kullanır.
  - Doğrudan dosya filtreleri kök proje grafiği üzerinden doğal olarak yönlendirilir, bu nedenle `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` özel bir sarmalayıcı olmadan çalışır.
- Gömülü runner notu:
  - Mesaj aracı keşif girdilerini veya sıkıştırma çalışma zamanı bağlamını değiştirirken,
    her iki kapsama düzeyini de koruyun.
  - Saf yönlendirme/normalizasyon sınırları için odaklı yardımcı regresyonlar ekleyin.
  - Ayrıca gömülü runner integration suitelerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu suiteler, kapsamlı kimliklerin ve sıkıştırma davranışının hâlâ gerçek
    `run.ts` / `compact.ts` yollarından aktığını doğrular; yalnızca yardımcı testler bu
    integration yolları için yeterli bir ikame değildir.
- Pool notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` değerini sabitler ve kök projects, e2e ve live yapılandırmalarında yalıtımsız runner kullanır.
  - Kök UI şeridi `jsdom` kurulumunu ve optimizer'ını korur, ancak artık paylaşılan yalıtımsız runner üzerinde çalışır.
  - `pnpm test`, kök `vitest.config.ts` projects yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme dalgalanmasını azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` da ekler. Varsayılan V8 davranışıyla karşılaştırma yapmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm test:changed`, doğal projects yapılandırmasını `--changed origin/main` ile çalıştırır.
  - `pnpm test:max` ve `pnpm test:changed:max`, aynı doğal projects yapılandırmasını korur; yalnızca daha yüksek bir worker sınırıyla.
  - Yerel worker otomatik ölçeklendirmesi artık bilinçli olarak daha muhafazakârdır ve ana makine yük ortalaması zaten yüksekken de geri çekilir; böylece eşzamanlı birden fazla Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, test kablolaması değiştiğinde changed-mode yeniden çalıştırmaların doğru kalması için projects/config dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profiling için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Perf-debug notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profiling görünümünü `origin/main` sonrasında değişen dosyalarla sınırlar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlangıcı ve transform ek yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken unit suite'i için runner CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Çalışma zamanı varsayılanları:
  - Depodaki geri kalanla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir worker kullanır (CI: en fazla 2, yerelde varsayılan 1).
  - Konsol G/Ç ek yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (en fazla 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, düğüm eşleştirme ve daha ağır ağ davranışı
- Beklentiler:
  - CI içinde çalışır (işlem hattında etkinse)
  - Gerçek anahtar gerekmez
  - Unit testlerden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Ana makinede Docker üzerinden yalıtılmış bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile'dan bir sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü aracılığıyla uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test gateway'i ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e suite'ini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlanır)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten gerçek kimlik bilgileriyle çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, tool-calling farklılıklarını, auth sorunlarını ve rate limit davranışını yakalamak
- Beklentiler:
  - Tasarım gereği CI içinde kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Hepsini” çalıştırmak yerine daraltılmış alt kümeleri tercih edin
- Live çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını source eder.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home dizinine kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını bilinçli olarak istediğiniz durumlarda yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tüm başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): `*_API_KEYS` değerini virgül/noktalı virgül biçiminde veya `*_API_KEY_1`, `*_API_KEY_2` biçiminde ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler rate limit yanıtlarında yeniden dener.
- İlerleme/heartbeat çıktısı:
  - Live suiteleri artık uzun sağlayıcı çağrılarının Vitest konsol yakalaması sessizken bile görünür şekilde etkin olduğunu göstermek için stderr'e ilerleme satırları yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının live çalıştırmalarda hemen akması için Vitest konsol yakalamayı devre dışı bırakır.
  - Doğrudan model heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi suite'i çalıştırmalıyım?

Şu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağı / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum kapalı” / sağlayıcıya özgü hatalar / tool calling hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android düğüm capability taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android düğümün **şu anda bildirdiği her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Önkoşullu/el ile kurulum (suite uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android düğümü için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması gateway'e zaten bağlı + eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz capability'ler için izinler/ekran yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/platforms/android)

## Live: model smoke (profil anahtarları)

Live testler, hataları yalıtabilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, verilen anahtarla sağlayıcının/modelin en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+ajan işlem hattısının bu model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model completion (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir completion çalıştırmak (ve gerektiğinde hedeflenmiş regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu suite'in gerçekten çalışması için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi takdirde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlanır
- Model seçimi:
  - Modern allowlist'i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
- Sağlayıcı seçimi:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve env fallback'leri
  - Yalnızca **profil deposunu** zorlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun nedeni:
  - “Sağlayıcı API bozuk / anahtar geçersiz” ile “gateway ajan işlem hattısı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + dev agent smoke (`@openclaw` gerçekte ne yapıyor)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içinde bir gateway başlatmak
  - `agent:dev:*` oturumu oluşturmak/yamamak (çalıştırma başına model geçersiz kılma)
  - Anahtarı olan modelleri dolaşmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (read probe)
    - isteğe bağlı ek araç yoklamaları (exec+read probe)
    - OpenAI regresyon yollarının (yalnızca tool-call → follow-up) çalışmaya devam etmesi
- Probe ayrıntıları (hataları hızlı açıklayabilmeniz için):
  - `read` probe: test, çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` ile okuyup nonce'ı geri yansıtmasını ister.
  - `exec+read` probe: test, ajandan bir temp dosyaya `exec` ile nonce yazmasını, sonra `read` ile geri okumasını ister.
  - image probe: test, oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Model seçimi:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgül listesi) ayarlayın
- Sağlayıcı seçimi (“OpenRouter her şey” durumundan kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + image probe'lar bu live testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - Model image input desteği bildirdiğinde image probe çalışır
  - Akış (yüksek seviye):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: Makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI arka uç smoke (Claude CLI veya başka yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI arka ucu kullanarak Gateway + ajan işlem hattısını doğrulamak.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Model: `claude-cli/claude-sonnet-4-6`
  - Komut: `claude`
  - Argümanlar: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - Gerçek bir görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar isteme enjekte edilir).
  - Görsel dosya yollarını istem enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur gönderip resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`, Claude CLI MCP yapılandırmasını etkin tutar (varsayılan davranış, ortam/genel MCP sunucularının smoke sırasında devre dışı kalmasını sağlamak için geçici, katı boş bir `--mcp-config` enjekte eder).

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` içinde bulunur.
- Canlı CLI arka uç smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır, çünkü Claude CLI root olarak çağrıldığında `bypassPermissions` seçeneğini reddeder.
- `claude-cli` için Linux `@anthropic-ai/claude-code` paketini önbelleğe alınmış yazılabilir bir öneke, `OPENCLAW_DOCKER_CLI_TOOLS_DIR` altına kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `claude-cli` için live smoke, `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` ayarlamadığınız sürece katı boş bir MCP yapılandırması enjekte eder.
- Mevcutsa `~/.claude` dizinini kapsayıcıya kopyalar, ancak Claude auth'un `ANTHROPIC_API_KEY` ile desteklendiği makinelerde alt Claude CLI için `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` değerlerini `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV` ile de korur.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP ajanıyla gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir follow-up gönder
  - follow-up mesajının bağlı ACP oturum dökümüne düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - ACP ajanı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP arka ucu: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Notlar:
  - Bu şerit, testlerin harici teslimatı taklit etmeden message-channel bağlamı ekleyebilmesi için yalnızca admin kullanımına açık sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` ayarlı değilse test yapılandırılmış/paketlenmiş acpx komutunu kullanır. Harness auth'unuz `~/.profile` içindeki env değişkenlerine bağlıysa sağlayıcı env değişkenlerini koruyan özel bir `acpx` komutu tercih edin.

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

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` içinde bulunur.
- `~/.profile` dosyasını source eder, eşleşen CLI auth home dizinini (`~/.claude` veya `~/.codex`) kapsayıcıya kopyalar, acpx'i yazılabilir bir npm önekine kurar, ardından eksikse istenen live CLI'yi (`@anthropic-ai/claude-code` veya `@openai/codex`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar, böylece acpx sourced profile'dan gelen sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

### Önerilen live tarifleri

Dar, açık allowlist'ler en hızlı ve en az oynak olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı üzerinde tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'yi kullanır (ayrı auth + tooling farklılıkları).
- Gemini API ile Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcı “Gemini” derken bunu kasteder.
  - CLI: OpenClaw, yerel bir `gemini` ikilisini shell üzerinden çağırır; kendi auth'una sahiptir ve farklı davranabilir (streaming/tool desteği/sürüm kayması).

## Live: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live isteğe bağlıdır), ancak geliştirici makinesinde anahtarlarla düzenli kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (tool calling + image)

Çalışmasını korumayı beklediğimiz “yaygın modeller” çalıştırması şudur:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + image ile gateway smoke çalıştırma:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: tool calling (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsama (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en son sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” destekli modellerden birini seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; tool calling API moduna bağlıdır)

### Vision: görsel gönderimi (ek → çok modlu mesaj)

Image probe'u çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir image destekli model (Claude/Gemini/OpenAI'nin image destekli varyantları vb.) ekleyin.

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse, şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; tool+image destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile auth)

Live matrisine ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` aracılığıyla (özel uç noktalar): `minimax` (cloud/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelere “tüm modeller” için sabit bir liste gömmeye çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler, kimlik bilgilerini CLI ile aynı şekilde bulur. Pratik sonuçlar:

- CLI çalışıyorsa, live testler de aynı anahtarları bulmalıdır.
- Bir live test “anahtar yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde hata ayıklayın.

- Ajan başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denince kastedilen budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan live home dizinine kopyalanır, ancak ana profil-anahtar deposu değildir)
- Live yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test home dizinine kopyalar; böylece bu hazırlanmış yapılandırmada `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır ve probe'lar gerçek ana makine çalışma alanınıza uğramaz.

Env anahtarlarına güvenmek istiyorsanız (ör. `~/.profile` içinde export edilmişlerse), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını kapsayıcıya mount edebilir).

## Deepgram live (ses dökümü)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Kapsam:
  - Kayıtlı her image-generation sağlayıcı eklentisini listeler
  - Yoklama yapmadan önce eksik sağlayıcı env değişkenlerini login shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profillerinin önünde live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Stok image-generation varyantlarını paylaşılan çalışma zamanı capability'si üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Kapsanan mevcut paketlenmiş sağlayıcılar:
  - `openai`
  - `google`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Docker çalıştırıcıları (isteğe bağlı “Linux içinde çalışıyor” kontrolleri)

Bu Docker çalıştırıcıları iki kümeye ayrılır:

- Live-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yalnızca eşleşen profil-anahtar live dosyalarını depo Docker imajı içinde çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı mount eder (ve mount edilmişse `~/.profile` dosyasını source eder). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı özellikle istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker imajını bir kez `test:docker:live-build` ile oluşturur, ardından iki live Docker şeridinde yeniden kullanır.
- Kapsayıcı smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek kapsayıcı başlatır ve daha yüksek seviyeli integration yollarını doğrular.

Live-model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home dizinlerini bind-mount eder (ya da çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra harici CLI OAuth'un ana makine auth deposunu değiştirmeden token yenileyebilmesi için çalıştırma öncesinde bunları kapsayıcı home dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI arka uç smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard'ı (TTY, tam iskelet): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağı (iki kapsayıcı, WS auth + health): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP channel bridge (tohumlanmış Gateway + stdio bridge + ham Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (kurulum smoke + `/plugin` takma adı + Claude-bundle restart semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Live-model Docker çalıştırıcıları ayrıca mevcut checkout'u salt okunur olarak bind-mount eder ve
bunu kapsayıcı içinde geçici bir workdir içine hazırlar. Bu, çalışma zamanı
imajını ince tutarken Vitest'i tam yerel kaynak/yapılandırmanıza karşı çalıştırmayı sağlar.
Ayrıca gateway live probe'larının kapsayıcı içinde gerçek Telegram/Discord vb. kanal worker'ları başlatmaması için `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır, bu yüzden bu Docker şeridindeki
gateway live kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui`, daha yüksek seviyeli bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin olan bir
OpenClaw gateway kapsayıcısı başlatır, bu gateway'e karşı sabitlenmiş bir Open WebUI kapsayıcısı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` içinde `openclaw/default` modelinin sunulduğunu doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma fark edilir şekilde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi veya Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu şerit kullanılabilir bir live model anahtarı bekler ve Docker içi çalıştırmalarda bunu sağlamak için
birincil yol `OPENCLAW_PROFILE_FILE` (`~/.profile` varsayılan) değeridir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` bilinçli olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway
kapsayıcısı başlatır, `openclaw mcp serve` başlatan ikinci bir kapsayıcı başlatır, ardından
yönlendirilmiş konuşma keşfini, döküm okumalarını, ek meta verisini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP bridge üzerinden doğrular. Bildirim kontrolü
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke test, belirli bir istemci SDK'sının
tesadüfen yüzeye çıkardığını değil, bridge'in gerçekten ne yaydığını doğrular.

El ile ACP plain-language thread smoke (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP thread routing doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`), `/home/node/.openclaw` dizinine mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`), `/home/node/.openclaw/workspace` dizinine mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`), `/home/node/.profile` dizinine mount edilir ve testler çalıştırılmadan önce source edilir
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`), Docker içindeki önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` dizinine mount edilir
- `$HOME` altındaki harici CLI auth dizinleri `/host-auth/...` altında salt okunur olarak mount edilir, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan: desteklenen tüm dizinleri mount et (`.codex`, `.claude`, `.minimax`)
  - Daraltılmış sağlayıcı çalıştırmaları, `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` değerlerinden çıkarılan yalnızca gerekli dizinleri mount eder
  - Elle geçersiz kılma: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgül listesi
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Kapsayıcı içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Kimlik bilgilerinin env'den değil profil deposundan gelmesini sağlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway'in sunacağı modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce-check istemini geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler için temel doğrulama

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek işlem hattı” regresyonlarıdır:

- Gateway tool calling (sahte OpenAI, gerçek gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, yapılandırma yazar + auth zorlamalı): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirlik değerlendirmeleri (Skills)

Şimdiden “ajan güvenilirlik değerlendirmeleri” gibi davranan birkaç CI-güvenli testimiz var:

- Gerçek gateway + ajan döngüsü üzerinden sahte tool-calling (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tools/skills)):

- **Karar verme:** Skills istemde listelendiğinde ajan doğru skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** Ajan kullanımdan önce `SKILL.md` okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo suite'i (kullan vs kaçın, geçitleme, prompt injection).
- Yalnızca CI-güvenli suite yerinde olduktan sonra isteğe bağlı live değerlendirmeler (opt-in, env geçitli).

## Sözleşme testleri (plugin ve channel şekli)

Sözleşme testleri, kayıtlı her plugin ve channel'ın
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde dolaşır ve
şekil ile davranış doğrulamalarından oluşan bir suite çalıştırır. Varsayılan `pnpm test`
unit şeridi bu paylaşılan seam ve smoke dosyalarını bilinçli olarak atlar; paylaşılan
channel veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca channel sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca provider sözleşmeleri: `pnpm test:contracts:plugins`

### Channel sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, name, capabilities)
- **setup** - Setup wizard sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Channel eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Directory/roster API
- **group-policy** - Grup ilkesi zorlaması

### Provider status sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel status probe'ları
- **registry** - Plugin kayıt şekli

### Provider sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akış sözleşmesi
- **auth-choice** - Auth choice/seçim
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Provider çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Setup wizard

### Ne zaman çalıştırılmalı

- plugin-sdk export'larını veya alt yolları değiştirdikten sonra
- Bir channel veya provider plugin ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfi yeniden düzenlendikten sonra

Sözleşme testleri CI içinde çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (yönlendirme)

Live içinde keşfettiğiniz bir provider/model sorununu düzelttiğinizde:

- Mümkünse CI-güvenli bir regresyon ekleyin (sağlayıcıyı mock/stub yapın veya tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca live ise (rate limit'ler, auth politikaları), live testi dar ve env değişkenleriyle opt-in olacak şekilde tutun
- Hatanın yakalandığı en küçük katmanı hedeflemeyi tercih edin:
  - provider istek dönüştürme/replay hatası → direct models testi
  - gateway oturum/geçmiş/araç işlem hattısı hatası → gateway live smoke veya CI-güvenli gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, registry meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testteki `classifyTargetClass` değerini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için sınıflandırılmamış hedef kimliklerinde bilinçli olarak başarısız olur.
