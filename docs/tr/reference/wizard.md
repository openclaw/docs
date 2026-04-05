---
read_when:
    - Belirli bir onboarding adımına veya bayrağa bakıyorsanız
    - Onboarding’i etkileşimsiz modla otomatikleştiriyorsanız
    - Onboarding davranışında hata ayıklıyorsanız
sidebarTitle: Onboarding Reference
summary: 'CLI onboarding için tam başvuru: her adım, bayrak ve yapılandırma alanı'
title: Onboarding Başvurusu
x-i18n:
    generated_at: "2026-04-05T14:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding Başvurusu

Bu, `openclaw onboard` için tam başvurudur.
Üst düzey bir genel bakış için bkz. [Onboarding (CLI)](/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - Eğer `~/.openclaw/openclaw.json` varsa, **Keep / Modify / Reset** seçeneklerinden birini seçin.
    - Onboarding’i yeniden çalıştırmak, siz açıkça **Reset** seçmediğiniz sürece
      (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full`
      kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve
      devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır (`rm` asla kullanılmaz) ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)
  </Step>
  <Step title="Model/Kimlik Doğrulama">
    - **Anthropic API anahtarı**: varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından daemon kullanımı için kaydeder.
    - **Anthropic Claude CLI**: onboarding/configure içinde tercih edilen Anthropic asistan seçimidir. macOS’ta onboarding, Keychain’de "Claude Code-credentials" öğesini kontrol eder ("Always Allow" seçin ki launchd başlatmaları engellenmesin); Linux/Windows’ta varsa `~/.claude/.credentials.json` yeniden kullanılır ve model seçimi kanonik `claude-cli/claude-*` başvurusuna geçirilir.
    - **Anthropic setup-token (eski/el ile)**: onboarding/configure içinde yeniden kullanılabilir, ancak Anthropic OpenClaw kullanıcılarına OpenClaw Claude-login yolunun üçüncü taraf harness kullanımı sayıldığını ve Claude hesabında **Extra Usage** gerektirdiğini bildirdi.
    - **OpenAI Code (Codex) aboneliği (Codex CLI)**: `~/.codex/auth.json` varsa onboarding bunu yeniden kullanabilir. Yeniden kullanılan Codex CLI kimlik bilgileri Codex CLI tarafından yönetilmeye devam eder; süre dolduğunda OpenClaw önce bu kaynağı yeniden okur ve sağlayıcı bunu yenileyebiliyorsa yenilenen kimlik bilgisini sahipliğini devralmak yerine Codex deposuna geri yazar.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Model ayarlı değilse veya `openai/*` ise `agents.defaults.model` değerini `openai-codex/gpt-5.4` olarak ayarlar.
    - **OpenAI API anahtarı**: varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından bunu kimlik doğrulama profillerinde saklar.
      - Model ayarlı değilse, `openai/*` ise veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` olarak ayarlar.
    - **xAI (Grok) API anahtarı**: `XAI_API_KEY` ister ve xAI’ı model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, şuradan alın: https://opencode.ai/auth) ister ve Zen veya Go kataloğunu seçmenize izin verir.
    - **Ollama**: Ollama temel URL’sini ister, **Cloud + Local** veya **Local** modunu sunar, kullanılabilir modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik olarak çeker.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çok modelli proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: yapılandırma otomatik yazılır; barındırılan varsayılan `MiniMax-M2.7` olur.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: yapılandırma, Çin veya küresel uç noktalarda StepFun standard veya Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: yapılandırma otomatik yazılır.
    - **Kimi Coding**: yapılandırma otomatik yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Atla**: henüz kimlik doğrulama yapılandırılmaz.
    - Algılanan seçeneklerden varsayılan bir model seçin (veya sağlayıcı/modeli el ile girin). En iyi kalite ve daha düşük istem enjeksiyonu riski için, sağlayıcı yığınınızda bulunan en güçlü yeni nesil modeli seçin.
    - Onboarding bir model kontrolü çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin auth-profile değerleridir. Bunun yerine ortam destekli ref’ler depolamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Kimlik doğrulama profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski içe aktarma içindir.
    - Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Başsız/sunucu ipucu: OAuth’u tarayıcısı olan bir makinede tamamlayın, sonra
    bu aracının `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya karşılık gelen
    `$OPENCLAW_STATE_DIR/...` yolu) gateway ana makinesine kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Aracı bootstrap ritüeli için gereken çalışma alanı dosyalarını hazırlar.
    - Tam çalışma alanı düzeni + yedekleme kılavuzu: [Aracı çalışma alanı](/tr/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu, Tailscale görünürlüğü.
    - Kimlik doğrulama önerisi: yerel WS istemcilerinin kimlik doğrulaması yapması gerekmesi için local loopback üzerinde bile **Token** kullanın.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Generate/store plaintext token** (varsayılan)
      - **Use SecretRef** (isteğe bağlı)
      - Hızlı başlangıç, onboarding probe/dashboard bootstrap için `env`, `file` ve `exec` sağlayıcılarında mevcut `gateway.auth.token` SecretRef’lerini yeniden kullanır.
      - Bu SecretRef yapılandırılmışsa ancak çözümlenemiyorsa, onboarding çalışma zamanı kimlik doğrulamasını sessizce düşürmek yerine net bir düzeltme mesajıyla erken başarısız olur.
    - Parola modunda etkileşimli kurulum da düz metin veya SecretRef depolamayı destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlem ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca her yerel işleme tamamen güveniyorsanız devre dışı bırakın.
    - local loopback dışı bind’ler yine de kimlik doğrulama gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi.
    - [Telegram](/tr/channels/telegram): bot token’ı.
    - [Discord](/tr/channels/discord): bot token’ı.
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON’u + webhook audience.
    - [Mattermost](/tr/channels/mattermost) (plugin): bot token’ı + temel URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [BlueBubbles](/tr/channels/bluebubbles): **iMessage için önerilir**; sunucu URL’si + parola + webhook.
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi.
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listelerini kullanın.
  </Step>
  <Step title="Web araması">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için ortam değişkenlerini veya mevcut yapılandırmayı kullanabilir; anahtarsız sağlayıcılar bunun yerine sağlayıcıya özgü önkoşullarını kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açılmış bir kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (sağlanmaz).
    - Linux (ve Windows, WSL2 üzerinden): systemd kullanıcı birimi
      - Onboarding, Gateway’in oturum kapatıldıktan sonra da açık kalması için `loginctl enable-linger <user>` etkinleştirmeye çalışır.
      - sudo isteyebilir (`/var/lib/systemd/linger` içine yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
    - Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlı değilse, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
  </Step>
  <Step title="Sağlık kontrolü">
    - Gateway’i başlatır (gerekiyorsa) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, durum çıktısına canlı gateway sağlık probe’unu ekler; desteklendiğinde kanal probe’ları da buna dahildir (erişilebilir bir gateway gerektirir).
  </Step>
  <Step title="Skills (önerilir)">
    - Kullanılabilir Skills’i okur ve gereksinimleri kontrol eder.
    - Bir düğüm yöneticisi seçmenizi sağlar: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları yükler (bazıları macOS’ta Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - Ek özellikler için iOS/Android/macOS uygulamaları dahil olmak üzere özet + sonraki adımlar.
  </Step>
</Steps>

<Note>
GUI algılanmazsa onboarding, tarayıcı açmak yerine Control UI için SSH port-forward yönergeleri yazdırır.
Control UI varlıkları eksikse onboarding bunları derlemeye çalışır; geri dönüş seçeneği `pnpm ui:build` olur (UI bağımlılıklarını otomatik yükler).
</Note>

## Etkileşimsiz mod

Onboarding’i otomatikleştirmek veya komut dosyasıyla çalıştırmak için `--non-interactive` kullanın:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Makine tarafından okunabilir bir özet için `--json` ekleyin.

Etkileşimsiz modda Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.

<Note>
`--json`, etkileşimsiz modu **ima etmez**. Komut dosyaları için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Otomasyonu](/start/wizard-cli-automation#provider-specific-examples) içinde yer alır.
Bayrak anlamları ve adım sıralaması için bu başvuru sayfasını kullanın.

### Aracı ekle (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway sihirbazı RPC

Gateway, onboarding akışını RPC üzerinden sunar (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI) onboarding mantığını yeniden uygulamadan adımları işleyebilir.

## Signal kurulumu (`signal-cli`)

Onboarding, `signal-cli` kurulumunu GitHub sürümlerinden yapabilir:

- Uygun sürüm varlığını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altına depolar.
- Yapılandırmanıza `channels.signal.cliPath` yazar.

Notlar:

- JVM derlemeleri **Java 21** gerektirir.
- Kullanılabildiğinde yerel derlemeler kullanılır.
- Windows WSL2 kullanır; signal-cli kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlı değilse varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bind, auth, tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Kurulum Başvurusu](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında buna katıldığınızda kanal izin listeleri (Slack/Discord/Matrix/Microsoft Teams) mümkün olduğunda adlar kimliklere çözülür.
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - El ile yapılandırma yine de `skills.install.nodeManager` değerini doğrudan ayarlayarak `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında yer alır.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında depolanır.

Bazı kanallar plugin olarak sunulur. Kurulum sırasında bunlardan birini seçtiğinizde onboarding,
yapılandırılmadan önce yüklenmesi için istemde bulunur (npm veya yerel yol).

## İlgili belgeler

- Onboarding genel bakışı: [Onboarding (CLI)](/start/wizard)
- macOS uygulaması onboarding: [Onboarding](/start/onboarding)
- Yapılandırma başvurusu: [Gateway configuration](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [BlueBubbles](/tr/channels/bluebubbles) (iMessage), [iMessage](/tr/channels/imessage) (eski)
- Skills: [Skills](/tools/skills), [Skills config](/tools/skills-config)
