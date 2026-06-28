---
read_when:
    - Belirli bir ilk kurulum adımını veya bayrağını arama
    - Etkileşimsiz modla onboarding’i otomatikleştirme
    - OpenClaw Docs i18n girdisini hata ayıklama davranışı
sidebarTitle: Onboarding Reference
summary: 'CLI katılımı için tam başvuru: her adım, bayrak ve yapılandırma alanı'
title: OpenClaw'a başlama başvurusu
x-i18n:
    generated_at: "2026-06-28T01:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Bu, `openclaw onboard` için tam başvuru kaynağıdır.
Üst düzey genel bakış için bkz. [Katılım (CLI)](/tr/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa **Geçerli değerleri koru**, **Gözden geçir ve güncelle** veya **Kurulumdan önce sıfırla** seçeneklerinden birini seçin.
    - Katılımı yeniden çalıştırmak, açıkça **Sıfırla** seçeneğini seçmediğiniz sürece hiçbir şeyi silmez
      (veya `--reset` geçmediğiniz sürece).
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için
      `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve devam etmeden önce
      `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır (asla `rm` değil) ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model/Kimlik doğrulama">
    - **Anthropic API anahtarı**: varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
    - **Anthropic API anahtarı**: katılım/yapılandırma sırasında tercih edilen Anthropic asistan seçimi.
    - **Anthropic setup-token**: OpenClaw artık kullanılabiliyorsa Claude CLI yeniden kullanımını tercih etse de katılım/yapılandırma içinde hâlâ kullanılabilir.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.
    - **OpenAI Code (Codex) aboneliği (cihaz eşleştirme)**: kısa ömürlü bir cihaz koduyla tarayıcı eşleştirme akışı.
      - Model ayarlanmamışsa veya zaten OpenAI ailesindeyse Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.
    - **OpenAI API anahtarı**: varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, sonra bunu kimlik doğrulama profillerinde saklar.
      - Model ayarlanmamışsa, `openai/*` ise veya eski Codex model başvurularıysa `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.
    - **xAI (Grok) OAuth / API anahtarı**: seçildiğinde xAI OAuth ile oturum açar veya API anahtarı yolunda `XAI_API_KEY` ister ve xAI’yi model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth adresinden alın) ister ve Zen ya da Go kataloğunu seçmenizi sağlar.
    - **Ollama**: önce **Bulut + Yerel**, **Yalnızca bulut** veya **Yalnızca yerel** seçeneklerini sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; ana makine destekli modlar Ollama temel URL’sini ister, kullanılabilir modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik olarak çeker; `Cloud + Local` ayrıca bu Ollama ana makinesinin bulut erişimi için oturum açıp açmadığını denetler.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çok modelli proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Hesap Kimliği, Gateway Kimliği ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: yapılandırma otomatik yazılır; barındırılan varsayılan `MiniMax-M3` değeridir.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: yapılandırma Çin veya küresel uç noktalarda StepFun standard ya da Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash` içerir; Step Plan ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: yapılandırma otomatik yazılır.
    - **Kimi Coding**: yapılandırma otomatik yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Atla**: henüz kimlik doğrulama yapılandırılmaz.
    - Algılanan seçeneklerden varsayılan bir model seçin (veya sağlayıcı/modeli elle girin). En iyi kalite ve daha düşük prompt enjeksiyonu riski için sağlayıcı yığınınızda mevcut olan en güçlü son nesil modeli seçin.
    - Katılım bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.
    - API anahtarı saklama modu varsayılan olarak düz metin kimlik doğrulama profili değerleridir. Bunun yerine ortam destekli başvuruları saklamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Kimlik doğrulama profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski içe aktarma kaynağıdır.
    - Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Başsız/sunucu ipucu: OAuth’u tarayıcısı olan bir makinede tamamlayın, ardından
    bu ajanın `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolunu) gateway ana makinesine kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Ajan başlatma ritüeli için gereken çalışma alanı dosyalarını tohumlar.
    - Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bağlama, kimlik doğrulama modu, tailscale dışa açma.
    - Kimlik doğrulama önerisi: local loopback için bile **Token** seçeneğini koruyun; böylece yerel WS istemcileri kimlik doğrulamak zorunda kalır.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Düz metin token üret/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
      - Quickstart, katılım yoklaması/pano başlatması için `env`, `file` ve `exec` sağlayıcıları genelinde mevcut `gateway.auth.token` SecretRef’lerini yeniden kullanır.
      - Bu SecretRef yapılandırılmış ancak çözümlenemiyorsa katılım, çalışma zamanı kimlik doğrulamasını sessizce zayıflatmak yerine açık bir düzeltme mesajıyla erken başarısız olur.
    - Parola modunda etkileşimli kurulum düz metin veya SecretRef saklamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Katılım işlemi ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca her yerel sürece tamamen güveniyorsanız devre dışı bırakın.
    - loopback dışı bağlamalar yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturum açma.
    - [Telegram](/tr/channels/telegram): bot token.
    - [Discord](/tr/channels/discord): bot token.
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON + webhook hedef kitlesi.
    - [Mattermost](/tr/channels/mattermost) (plugin): bot token + temel URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [iMessage](/tr/channels/imessage): `imsg` CLI yolu + Messages DB erişimi; Gateway Mac dışında çalışırken bir SSH sarmalayıcı kullanın.
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listeleri kullanın.

  </Step>
  <Step title="Web araması">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için ortam değişkenlerini veya mevcut yapılandırmayı kullanabilir; anahtarsız sağlayıcılar bunun yerine sağlayıcıya özgü ön koşullarını kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (ürünle birlikte gelmez).
    - Linux (ve WSL2 üzerinden Windows): systemd kullanıcı birimi
      - Katılım, Gateway’in oturum kapatıldıktan sonra çalışmaya devam etmesi için `loginctl enable-linger <user>` üzerinden kalıcılığı etkinleştirmeyi dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa daemon kurulumu bunu doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa daemon kurulumu, mod açıkça ayarlanana kadar engellenir.

  </Step>
  <Step title="Sağlık denetimi">
    - Gateway’i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sağlık yoklamasını durum çıktısına ekler (erişilebilir bir gateway gerektirir).

  </Step>
  <Step title="Skills (önerilen)">
    - Kullanılabilir Skills öğelerini okur ve gereksinimleri denetler.
    - Bir node yöneticisi seçmenizi sağlar: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS’ta Homebrew kullanır).

  </Step>
  <Step title="Bitiş">
    - Özet + sonraki adımlar; Terminal, Tarayıcı veya daha sonrası için **Ajanınızı nasıl kuluçkadan çıkarmak istiyorsunuz?** istemi dahil.

  </Step>
</Steps>

<Note>
GUI algılanmazsa katılım, tarayıcı açmak yerine Control UI için SSH port yönlendirme yönergelerini yazdırır.
Control UI varlıkları eksikse katılım bunları derlemeyi dener; yedek seçenek `pnpm ui:build` komutudur (UI bağımlılıklarını otomatik kurar).
</Note>

## Etkileşimsiz mod

Katılımı otomatikleştirmek veya betiklemek için `--non-interactive` kullanın:

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

`--gateway-token` ve `--gateway-token-ref-env` karşılıklı olarak birbirini dışlar.

<Note>
`--json` etkileşimsiz modu **ima etmez**. Betikler için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Otomasyonu](/tr/start/wizard-cli-automation#provider-specific-examples) içinde bulunur.
Bayrak semantiği ve adım sıralaması için bu başvuru sayfasını kullanın.

### Ajan ekle (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway sihirbaz RPC’si

Gateway, katılım akışını RPC üzerinden sunar (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI), katılım mantığını yeniden uygulamadan adımları işleyebilir.

## Signal kurulumu (signal-cli)

Katılım, GitHub sürümlerinden `signal-cli` kurabilir:

- Uygun sürüm varlığını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- Yapılandırmanıza `channels.signal.cliPath` yazar.

Notlar:

- JVM derlemeleri **Java 21** gerektirir.
- Mevcut olduğunda yerel derlemeler kullanılır.
- Windows WSL2 kullanır; signal-cli kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (Minimax seçildiyse)
- `tools.profile` (yerel ilk kurulum, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Kurulum Referansı](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katılmayı seçtiğinizde kanal izin listeleri (Slack/Discord/Matrix/Microsoft Teams) (adlar mümkün olduğunda kimliklere çözümlenir).
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel yapılandırma, `skills.install.nodeManager` değerini doğrudan ayarlayarak yine de `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

Bazı kanallar Plugin olarak teslim edilir. Kurulum sırasında birini seçtiğinizde ilk kurulum,
yapılandırılmadan önce onu yüklemenizi (npm veya yerel bir yol) ister.

## İlgili belgeler

- İlk kurulum genel bakışı: [İlk Kurulum (CLI)](/tr/start/wizard)
- macOS uygulaması ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Yapılandırma referansı: [Gateway yapılandırması](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [iMessage](/tr/channels/imessage)
- Skills: [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config)
