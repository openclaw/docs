---
read_when:
    - Belirli bir onboarding adımını veya bayrağını arama
    - Etkileşimsiz mod ile onboarding'i otomatikleştirme
    - Onboarding davranışında hata ayıklama
sidebarTitle: Onboarding Reference
summary: 'CLI onboarding için tam referans: her adım, bayrak ve config alanı'
title: Onboarding referansı
x-i18n:
    generated_at: "2026-04-26T11:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

Bu, `openclaw onboard` için tam referanstır.
Yüksek düzey genel bakış için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut config algılama">
    - `~/.openclaw/openclaw.json` varsa **Keep / Modify / Reset** seçin.
    - Onboarding'i yeniden çalıştırmak, siz açıkça **Reset** seçmediğiniz sürece
      (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; workspace'i de kaldırmak için `--reset-scope full`
      kullanın.
    - Config geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve
      devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Reset, `trash` kullanır (`rm` asla kullanılmaz) ve şu kapsamları sunar:
      - Yalnızca config
      - Config + kimlik bilgileri + oturumlar
      - Tam sıfırlama (workspace'i de kaldırır)

  </Step>
  <Step title="Model/Auth">
    - **Anthropic API anahtarı**: mevcutsa `ANTHROPIC_API_KEY` kullanır veya anahtar ister, sonra bunu daemon kullanımı için kaydeder.
    - **Anthropic API anahtarı**: onboarding/configure içinde tercih edilen Anthropic assistant seçeneği.
    - **Anthropic setup-token**: onboarding/configure içinde hâlâ kullanılabilir, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını tercih eder.
    - **OpenAI Code (Codex) subscription (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` yapar.
    - **OpenAI Code (Codex) subscription (device pairing)**: kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` yapar.
    - **OpenAI API anahtarı**: mevcutsa `OPENAI_API_KEY` kullanır veya anahtar ister, sonra bunu auth profillerine kaydeder.
      - Model ayarlanmamışsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.5` yapar.
    - **xAI (Grok) API anahtarı**: `XAI_API_KEY` ister ve xAI'yi model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, şuradan alın: https://opencode.ai/auth) ister ve Zen veya Go kataloğunu seçmenize izin verir.
    - **Ollama**: önce **Cloud + Local**, **Cloud only** veya **Local only** sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; host destekli modlar Ollama base URL'sini ister, mevcut modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik çeker; `Cloud + Local` ayrıca o Ollama host'unun bulut erişimi için oturum açıp açmadığını da denetler.
    - Ayrıntılar: [Ollama](/tr/providers/ollama)
    - **API key**: anahtarı sizin için kaydeder.
    - **Vercel AI Gateway (multi-model proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Ayrıntılar: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Ayrıntılar: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: config otomatik yazılır; barındırılan varsayılan `MiniMax-M2.7` olur.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Ayrıntılar: [MiniMax](/tr/providers/minimax)
    - **StepFun**: config, Çin veya genel uç noktalardaki standart StepFun veya Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    - Ayrıntılar: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: `SYNTHETIC_API_KEY` ister.
    - Ayrıntılar: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: config otomatik yazılır.
    - **Kimi Coding**: config otomatik yazılır.
    - Ayrıntılar: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Skip**: henüz kimlik doğrulama yapılandırılmaz.
    - Algılanan seçeneklerden varsayılan bir model seçin (veya sağlayıcı/model değerini elle girin). En iyi kalite ve daha düşük prompt injection riski için sağlayıcı yığınınızdaki en güçlü yeni nesil modeli seçin.
    - Onboarding bir model denetimi çalıştırır ve yapılandırılmış model bilinmiyorsa veya auth eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin auth-profile değerlerini kullanır. Bunun yerine env destekli ref'ler depolamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski içe aktarma içindir.
    - Ayrıntılar: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Headless/sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, sonra
    o agent'ın `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolu) gateway host'una kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Workspace">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Agent bootstrap ritüeli için gereken workspace dosyalarını tohumlar.
    - Tam workspace yerleşimi + yedekleme kılavuzu: [Agent workspace](/tr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu, Tailscale exposure.
    - Auth önerisi: loopback için bile **Token** kullanın; böylece yerel WS istemcileri kimlik doğrulamak zorunda kalır.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Generate/store plaintext token** (varsayılan)
      - **Use SecretRef** (katılımlı etkinleştirme)
      - Hızlı başlangıç, onboarding probe/dashboard bootstrap için `env`, `file` ve `exec` sağlayıcıları genelindeki mevcut `gateway.auth.token` SecretRef'lerini yeniden kullanır.
      - O SecretRef yapılandırılmışsa ama çözümlenemiyorsa onboarding, çalışma zamanı auth'unu sessizce düşürmek yerine açık düzeltme iletisiyle erken başarısız olur.
    - Parola modunda etkileşimli kurulum da düz metin veya SecretRef depolamayı destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding süreci ortamında boş olmayan bir env değişkeni gerektirir.
      - `--gateway-token` ile birleştirilemez.
    - Yalnızca her yerel sürece tam güveniyorsanız auth'u devre dışı bırakın.
    - Loopback dışı bind'ler yine de auth gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi.
    - [Telegram](/tr/channels/telegram): bot token.
    - [Discord](/tr/channels/discord): bot token.
    - [Google Chat](/tr/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/tr/channels/mattermost) (Plugin): bot token + base URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [BlueBubbles](/tr/channels/bluebubbles): **iMessage için önerilir**; sunucu URL'si + parola + webhook.
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi.
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` ile onaylayın veya allowlist kullanın.

  </Step>
  <Step title="Web arama">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için env değişkenleri veya mevcut config kullanabilir; anahtarsız sağlayıcılar sağlayıcıya özgü önkoşullarını kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; headless için özel bir LaunchDaemon kullanın (paketlenmez).
    - Linux (ve Windows üzerinden WSL2): systemd user unit
      - Onboarding, Gateway'in çıkıştan sonra da çalışması için `loginctl enable-linger <user>` etkinleştirmeyi dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token auth bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa daemon kurulumu bunu doğrular, ancak çözülmüş düz metin token değerlerini supervisor hizmet ortamı metadata'sına kalıcılaştırmaz.
    - Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse daemon kurulumu uygulanabilir rehberlikle engellenir.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.

  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, durum çıktısına canlı gateway sağlık probe'unu ekler; desteklendiğinde kanal probe'ları da dahil edilir (erişilebilir bir gateway gerektirir).

  </Step>
  <Step title="Skills (önerilir)">
    - Mevcut Skills'i okur ve gereksinimleri denetler.
    - Bir node yöneticisi seçmenize izin verir: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).

  </Step>
  <Step title="Bitir">
    - Ek özellikler için iOS/Android/macOS uygulamaları dahil özet + sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa onboarding tarayıcı açmak yerine Control UI için SSH port-forward talimatları yazdırır.
Control UI varlıkları eksikse onboarding bunları build etmeyi dener; fallback `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
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

`--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.

<Note>
`--json`, **etkileşimsiz modu ima etmez**. Betikler için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Automation](/tr/start/wizard-cli-automation#provider-specific-examples) sayfasında bulunur.
Bayrak semantiği ve adım sırası için bu referans sayfasını kullanın.

### Agent ekleme (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway, onboarding akışını RPC üzerinden açığa çıkarır (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI), onboarding mantığını yeniden uygulamadan adımları işleyebilir.

## Signal kurulumu (signal-cli)

Onboarding, `signal-cli` aracını GitHub sürümlerinden kurabilir:

- Uygun sürüm varlığını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- Config'inize `channels.signal.cliPath` yazar.

Notlar:

- JVM build'leri **Java 21** gerektirir.
- Mevcut olduğunda yerel build'ler kullanılır.
- Windows, WSL2 kullanır; signal-cli kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bind, auth, Tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Setup Reference](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katılımlı etkinleştirme yaptığınızda kanal allowlist'leri (Slack/Discord/Matrix/Microsoft Teams) (adlar mümkün olduğunda kimliklere çözülür).
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - Elle config, `skills.install.nodeManager` değerini doğrudan ayarlayarak yine `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

Bazı kanallar Plugin olarak teslim edilir. Kurulum sırasında bunlardan birini seçtiğinizde onboarding,
yapılandırılabilmeden önce onu kurmanızı ister (npm veya yerel yol).

## İlgili dokümanlar

- Onboarding genel bakışı: [Onboarding (CLI)](/tr/start/wizard)
- macOS uygulaması onboarding'i: [Onboarding](/tr/start/onboarding)
- Config referansı: [Gateway configuration](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [BlueBubbles](/tr/channels/bluebubbles) (iMessage), [iMessage](/tr/channels/imessage) (eski)
- Skills: [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config)
