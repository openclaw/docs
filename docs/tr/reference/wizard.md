---
read_when:
    - Belirli bir ilk kurulum adımını veya bayrağını arama
    - Etkileşimsiz modla ilk kurulumu otomatikleştirme
    - İlk kurulum davranışında hata ayıklama
sidebarTitle: Onboarding Reference
summary: 'CLI başlangıç kurulumu için tam referans: her adım, bayrak ve yapılandırma alanı'
title: İlk katılım referansı
x-i18n:
    generated_at: "2026-04-30T09:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Bu, `openclaw onboard` için tam başvurudur.
Üst düzey genel bakış için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa **Tut / Değiştir / Sıfırla** seçeneklerinden birini seçin.
    - Onboarding'i yeniden çalıştırmak, açıkça **Sıfırla** seçmediğiniz sürece hiçbir şeyi **silmez**
      (veya `--reset` geçmediğiniz sürece).
    - CLI `--reset` varsayılanı `config+creds+sessions` olur; workspace'i de kaldırmak için `--reset-scope full`
      kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve devam etmeden önce
      `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır (asla `rm` değil) ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (workspace'i de kaldırır)

  </Step>
  <Step title="Model/Kimlik doğrulama">
    - **Anthropic API anahtarı**: varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından daemon kullanımı için kaydeder.
    - **Anthropic API anahtarı**: onboarding/configure içinde tercih edilen Anthropic asistan seçeneği.
    - **Anthropic setup-token**: OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını tercih etse de onboarding/configure içinde hâlâ kullanılabilir.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.
    - **OpenAI Code (Codex) aboneliği (cihaz eşleştirme)**: kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.
    - **OpenAI API anahtarı**: varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından bunu kimlik doğrulama profillerinde saklar.
      - Model ayarlanmamışsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.
    - **xAI (Grok) API anahtarı**: `XAI_API_KEY` ister ve xAI'ı model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth adresinden alın) ister ve Zen veya Go kataloğunu seçmenizi sağlar.
    - **Ollama**: önce **Cloud + Local**, **Cloud only** veya **Local only** seçeneklerini sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; host destekli modlar Ollama temel URL'sini ister, kullanılabilir modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik çeker; `Cloud + Local` ayrıca bu Ollama host'unun bulut erişimi için oturum açıp açmadığını denetler.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çok modelli proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: yapılandırma otomatik yazılır; barındırılan varsayılan `MiniMax-M2.7` olur.
      API anahtarı kurulumu `minimax/...` kullanır ve OAuth kurulumu
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: yapılandırma, Çin veya küresel uç noktalarda StepFun standard ya da Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: yapılandırma otomatik yazılır.
    - **Kimi Coding**: yapılandırma otomatik yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Atla**: henüz kimlik doğrulama yapılandırılmaz.
    - Algılanan seçeneklerden varsayılan bir model seçin (veya sağlayıcı/modeli elle girin). En iyi kalite ve daha düşük prompt-injection riski için sağlayıcı yığınınızda bulunan en güçlü son nesil modeli seçin.
    - Onboarding bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin kimlik doğrulama profili değerlerini kullanır. Bunun yerine env destekli ref'leri saklamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Kimlik doğrulama profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski içe aktarma kaynağıdır.
    - Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Başsız/sunucu ipucu: OAuth'ı tarayıcısı olan bir makinede tamamlayın, ardından
    o ajanın `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolu) Gateway host'una kopyalayın. `credentials/oauth.json`
    yalnızca eski içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Workspace">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Ajan bootstrap ritüeli için gereken workspace dosyalarını tohumlar.
    - Tam workspace düzeni + yedekleme rehberi: [Ajan workspace'i](/tr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, kimlik doğrulama modu, tailscale görünürlüğü.
    - Kimlik doğrulama önerisi: local loopback için bile **Token** seçeneğini koruyun; böylece yerel WS istemcileri kimlik doğrulamalıdır.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
      - Quickstart, onboarding yoklaması/dashboard bootstrap için `env`, `file` ve `exec` sağlayıcıları genelinde mevcut `gateway.auth.token` SecretRef'lerini yeniden kullanır.
      - Bu SecretRef yapılandırılmışsa ancak çözümlenemiyorsa, onboarding çalışma zamanı kimlik doğrulamasını sessizce zayıflatmak yerine açık bir düzeltme mesajıyla erken başarısız olur.
    - Parola modunda etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlem ortamında boş olmayan bir env var gerektirir.
      - `--gateway-token` ile birleştirilemez.
    - Kimlik doğrulamayı yalnızca her yerel sürece tamamen güveniyorsanız devre dışı bırakın.
    - Loopback dışı bind'lar yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturum açma.
    - [Telegram](/tr/channels/telegram): bot token.
    - [Discord](/tr/channels/discord): bot token.
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON'u + webhook audience.
    - [Mattermost](/tr/channels/mattermost) (plugin): bot token + temel URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [BlueBubbles](/tr/channels/bluebubbles): **iMessage için önerilir**; sunucu URL'si + parola + Webhook.
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi.
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listeleri kullanın.

  </Step>
  <Step title="Web araması">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için env var'ları veya mevcut yapılandırmayı kullanabilir; anahtarsız sağlayıcılar bunun yerine sağlayıcıya özgü önkoşullarını kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (birlikte gönderilmez).
    - Linux (ve WSL2 üzerinden Windows): systemd kullanıcı birimi
      - Onboarding, Gateway'in oturum kapatıldıktan sonra açık kalması için `loginctl enable-linger <user>` üzerinden lingering etkinleştirmeyi dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token kimlik doğrulaması token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması token gerektiriyorsa ve yapılandırılan token SecretRef çözümlenemiyorsa, daemon kurulumu uygulanabilir rehberlikle engellenir.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.

  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sağlık yoklamasını durum çıktısına ekler (erişilebilir bir gateway gerektirir).

  </Step>
  <Step title="Skills (önerilir)">
    - Kullanılabilir skills'i okur ve gereksinimleri denetler.
    - Bir node yöneticisi seçmenizi sağlar: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).

  </Step>
  <Step title="Bitir">
    - Ek özellikler için iOS/Android/macOS uygulamaları dahil özet + sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa, onboarding tarayıcı açmak yerine Control UI için SSH port-forward yönergelerini yazdırır.
Control UI varlıkları eksikse, onboarding bunları derlemeye çalışır; geri dönüş `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
</Note>

## Etkileşimsiz mod

Onboarding'i otomatikleştirmek veya betiklemek için `--non-interactive` kullanın:

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

Makine tarafından okunabilir özet için `--json` ekleyin.

Etkileşimsiz modda Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` ve `--gateway-token-ref-env` karşılıklı olarak dışlayıcıdır.

<Note>
`--json` etkileşimsiz modu **ima etmez**. Betikler için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Automation](/tr/start/wizard-cli-automation#provider-specific-examples) içinde yer alır.
Bayrak semantiği ve adım sıralaması için bu başvuru sayfasını kullanın.

### Ajan ekleme (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway sihirbaz RPC'si

Gateway, onboarding akışını RPC üzerinden sunar (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI), onboarding mantığını yeniden uygulamadan adımları işleyebilir.

## Signal kurulumu (signal-cli)

Onboarding, `signal-cli` aracını GitHub sürümlerinden kurabilir:

- Uygun sürüm varlığını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- Yapılandırmanıza `channels.signal.cliPath` yazar.

Notlar:

- JVM derlemeleri **Java 21** gerektirir.
- Yerel derlemeler mevcut olduğunda kullanılır.
- Windows WSL2 kullanır; signal-cli kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (Minimax seçildiyse)
- `tools.profile` (ayarlanmamışsa yerel ilk kurulum varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında dahil olmayı seçtiğinizde kanal izin listeleri (Slack/Discord/Matrix/Microsoft Teams) (adlar mümkün olduğunda kimliklere çözümlenir).
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel yapılandırma, `skills.install.nodeManager` doğrudan ayarlanarak hâlâ `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında depolanır.

Bazı kanallar Plugin olarak sunulur. Kurulum sırasında birini seçtiğinizde, ilk kurulum
yapılandırılabilmesi için önce onu yüklemeyi (npm veya yerel yol) ister.

## İlgili belgeler

- İlk kurulum özeti: [İlk kurulum (CLI)](/tr/start/wizard)
- macOS uygulaması ilk kurulumu: [İlk kurulum](/tr/start/onboarding)
- Yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [BlueBubbles](/tr/channels/bluebubbles) (iMessage), [iMessage](/tr/channels/imessage) (eski)
- Skills: [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config)
