---
read_when:
    - Belirli bir onboarding adımını veya bayrağını arıyorsunuz
    - Etkileşimsiz modla onboarding'i otomatikleştirme
    - Onboarding davranışını hata ayıklama
sidebarTitle: Onboarding Reference
summary: 'CLI onboarding için tam başvuru: her adım, bayrak ve config alanı'
title: Onboarding başvurusu
x-i18n:
    generated_at: "2026-04-24T09:31:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Bu, `openclaw onboard` için tam başvurudur.
Üst düzey genel bakış için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut config algılama">
    - `~/.openclaw/openclaw.json` varsa **Keep / Modify / Reset** seçin.
    - Onboarding'i yeniden çalıştırmak, açıkça **Reset** seçmediğiniz sürece
      (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset`, varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full`
      kullanın.
    - Config geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve
      devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır (`rm` asla kullanılmaz) ve şu kapsamları sunar:
      - Yalnızca config
      - Config + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API anahtarı**: mevcutsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
    - **Anthropic API anahtarı**: onboarding/configure içinde tercih edilen Anthropic asistan seçeneğidir.
    - **Anthropic setup-token**: onboarding/configure içinde hâlâ mevcuttur, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını tercih eder.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` yapıştırılır.
      - Model ayarsızsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` yapar.
    - **OpenAI Code (Codex) aboneliği (cihaz eşleştirmesi)**: kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.
      - Model ayarsızsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` yapar.
    - **OpenAI API anahtarı**: mevcutsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, sonra bunu auth profillerinde saklar.
      - Model ayarsızsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` yapar.
    - **xAI (Grok) API anahtarı**: `XAI_API_KEY` ister ve xAI'yi model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth adresinden alın) ister ve Zen veya Go kataloğunu seçmenizi sağlar.
    - **Ollama**: önce **Cloud + Local**, **Cloud only** veya **Local only** sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; sunucu destekli modlar Ollama base URL'sini ister, kullanılabilir modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik çeker; `Cloud + Local` ayrıca bu Ollama sunucusunun bulut erişimi için oturum açıp açmadığını da kontrol eder.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çoklu model proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: config otomatik yazılır; barındırılan varsayılan `MiniMax-M2.7`'dir.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: config, Çin veya global uç noktalarda StepFun standard veya Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash`, Step Plan ise ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: config otomatik yazılır.
    - **Kimi Coding**: config otomatik yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Skip**: henüz auth yapılandırılmaz.
    - Algılanan seçeneklerden varsayılan modeli seçin (veya elle provider/model girin). En iyi kalite ve daha düşük prompt-injection riski için, sağlayıcı yığınınızda mevcut olan en güçlü son nesil modeli seçin.
    - Onboarding model denetimi çalıştırır ve yapılandırılmış model bilinmiyorsa veya auth eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin auth-profile değerleri kullanır. Bunun yerine env destekli ref'ler saklamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski içe aktarma içindir.
    - Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Headless/sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, sonra
    o aracının `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolu) gateway sunucusuna kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Aracı bootstrap ritüeli için gereken çalışma alanı dosyalarını tohumlar.
    - Tam çalışma alanı düzeni + yedekleme kılavuzu: [Agent workspace](/tr/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu, Tailscale açılımı.
    - Auth önerisi: loopback için bile **Token** kullanın ki yerel WS istemcileri kimlik doğrulaması yapmak zorunda kalsın.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Düz metin token üret/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
      - Quickstart, onboarding probe/dashboard bootstrap için `env`, `file` ve `exec` sağlayıcıları genelinde mevcut `gateway.auth.token` SecretRef'lerini yeniden kullanır.
      - Bu SecretRef yapılandırılmış ama çözümlenemiyorsa, onboarding çalışma zamanı auth'unu sessizce bozmak yerine açık bir düzeltme mesajıyla erken başarısız olur.
    - Password modunda etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding süreç ortamında boş olmayan bir env değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Auth'u yalnızca tüm yerel süreçlere tamamen güveniyorsanız devre dışı bırakın.
    - Loopback dışı bind'ler yine de auth gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi.
    - [Telegram](/tr/channels/telegram): bot token'ı.
    - [Discord](/tr/channels/discord): bot token'ı.
    - [Google Chat](/tr/channels/googlechat): service account JSON + webhook audience.
    - [Mattermost](/tr/channels/mattermost) (Plugin): bot token + base URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap config'i.
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için **önerilir**; sunucu URL'si + parola + Webhook.
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi.
    - DM güvenliği: varsayılan pairing'dir. İlk DM bir kod gönderir; bunu `openclaw pairing approve <channel> <code>` ile onaylayın veya allowlist kullanın.
  </Step>
  <Step title="Web araması">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için env değişkenleri veya mevcut config kullanabilir; anahtarsız sağlayıcılar ise sağlayıcıya özgü ön koşullarını kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Giriş yapılmış bir kullanıcı oturumu gerektirir; headless için özel bir LaunchDaemon kullanın (gönderilmez).
    - Linux (ve Windows üzerinden WSL2): systemd kullanıcı birimi
      - Onboarding, Gateway'in çıkış yaptıktan sonra da açık kalması için `loginctl enable-linger <user>` etkinleştirmeye çalışır.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token auth bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, daemon kurulumu eyleme dönük yönlendirmeyle engellenir.
    - Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarsızsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i (gerekirse) başlatır ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, durum çıktısına canlı gateway sağlık probe'unu ekler; destekleniyorsa kanal probe'ları da dahil edilir (erişilebilir bir gateway gerektirir).
  </Step>
  <Step title="Skills (önerilir)">
    - Mevcut Skills'i okur ve gereksinimleri kontrol eder.
    - Bir Node yöneticisi seçmenizi sağlar: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - Özet + sonraki adımlar; ek özellikler için iOS/Android/macOS uygulamaları da dahil.
  </Step>
</Steps>

<Note>
GUI algılanmazsa onboarding tarayıcı açmak yerine Control UI için SSH port yönlendirme yönergeleri yazdırır.
Control UI varlıkları eksikse onboarding bunları derlemeye çalışır; fallback `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
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

`--gateway-token` ile `--gateway-token-ref-env` birbirini dışlar.

<Note>
`--json`, etkileşimsiz modu **ima etmez**. Betikler için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Automation](/tr/start/wizard-cli-automation#provider-specific-examples) içinde bulunur.
Bayrak semantiği ve adım sıralaması için bu başvuru sayfasını kullanın.

### Aracı ekle (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway, onboarding akışını RPC üzerinden sunar (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI), onboarding mantığını yeniden uygulamadan adımları render edebilir.

## Signal kurulumu (`signal-cli`)

Onboarding, GitHub sürümlerinden `signal-cli` kurabilir:

- Uygun sürüm yapıtını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- Config'inize `channels.signal.cliPath` yazar.

Notlar:

- JVM derlemeleri **Java 21** gerektirir.
- Mevcut olduğunda yerel derlemeler kullanılır.
- Windows, WSL2 kullanır; signal-cli kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarsızsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Setup Reference](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katılmayı seçtiğinizde kanal allowlist'leri (Slack/Discord/Matrix/Microsoft Teams) (adlar mümkün olduğunda kimliklere çözülür).
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel config, `skills.install.nodeManager` değerini doğrudan ayarlayarak yine `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında tutulur.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

Bazı kanallar Plugin olarak sunulur. Kurulum sırasında bunlardan birini seçtiğinizde onboarding,
yapılandırılabilmeden önce kurmanızı ister (npm veya yerel yol).

## İlgili belgeler

- Onboarding genel bakışı: [Onboarding (CLI)](/tr/start/wizard)
- macOS uygulaması onboarding: [Onboarding](/tr/start/onboarding)
- Config başvurusu: [Gateway configuration](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [BlueBubbles](/tr/channels/bluebubbles) (iMessage), [iMessage](/tr/channels/imessage) (eski)
- Skills: [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config)
