---
read_when:
    - Belirli bir ilk katılım adımını veya bayrağı arama
    - Etkileşimsiz modla ilk katılımı otomatikleştirme
    - İlk katılım davranışında hata ayıklama
sidebarTitle: Onboarding Reference
summary: 'CLI başlangıç yapılandırması için tam başvuru: her adım, bayrak ve yapılandırma alanı'
title: İlk kurulum referansı
x-i18n:
    generated_at: "2026-07-16T17:37:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Bu, `openclaw onboard` için tam başvuru belgesidir.
Üst düzey bir genel bakış için [İlk katılım (CLI)](/tr/start/wizard) bölümüne bakın. Adım adım
davranış ve çıktılar için [CLI kurulum başvurusu](/tr/start/wizard-cli-reference) bölümüne bakın.

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Sıfırlama (isteğe bağlı)">
    - `--reset`, kurulum çalışmadan önce durumu sıfırlar; bu olmadan ilk katılımı yeniden çalıştırmak,
      mevcut yapılandırmayı korur ve varsayılanlar olarak yeniden kullanır.
    - `--reset-scope`, `--reset` komutunun neyi kaldıracağını denetler: `config` (yalnızca yapılandırma
      dosyası), `config+creds+sessions` (varsayılan) veya `full` (çalışma alanını da
      kaldırır).
    - Yapılandırma dosyası geçersizse ilk katılım durur ve önce
      `openclaw doctor` komutunu çalıştırmanızı, ardından kurulumu yeniden çalıştırmanızı ister.
    - Sıfırlama, durumu Çöp Kutusu'na taşır (asla doğrudan silmez).

  </Step>
  <Step title="Risk onayı">
    - İlk çalıştırma (veya `wizard.securityAcknowledgedAt` ayarlanmadan önceki herhangi bir çalıştırma),
      ajanların güçlü olduğunu ve tam sistem erişiminin risk taşıdığını
      anladığınızı onaylamanızı ister.
    - `--non-interactive`, `--accept-risk` değerinin açıkça belirtilmesini gerektirir; bu olmadan
      ilk katılım istem göstermek yerine bir hatayla çıkar.
    - Etkileşimli çalıştırmalarda bayrak yerine bir onay istemi gösterilir; reddedilmesi
      kurulumu iptal eder.

  </Step>
  <Step title="Model/Kimlik doğrulama">
    - **Anthropic API anahtarı**: varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından daemon kullanımı için kaydeder.
    - **Anthropic Claude CLI**: Claude CLI oturumu zaten açıksa tercih edilen yerel yoldur; OpenClaw alternatif olarak Anthropic kurulum belirteciyle kimlik doğrulamayı da destekler.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Birincil modeli olmayan yeni bir kurulumda, Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.6-sol` olarak ayarlar.
    - **OpenAI Code (Codex) aboneliği (cihaz eşleştirme)**: kısa ömürlü bir cihaz koduyla tarayıcı eşleştirme akışı.
      - Birincil modeli olmayan yeni bir kurulumda, Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.6-sol` olarak ayarlar.
    - **OpenAI API anahtarı**: varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından kimlik doğrulama profillerinde saklar.
      - Birincil modeli olmayan yeni bir kurulumda `agents.defaults.model` değerini `openai/gpt-5.6` olarak ayarlar; yalın doğrudan API model kimliği Sol katmanına çözümlenir.
    - OpenAI eklemek veya yeniden kimlik doğrulamak, `openai/gpt-5.5` dahil olmak üzere açıkça belirtilmiş mevcut birincil modeli korur. Hesap GPT-5.6'yı sunmuyorsa `openai/gpt-5.5` değerini açıkça seçin; OpenClaw modeli sessizce daha düşük bir sürüme geçirmez.
    - **xAI OAuth**: localhost geri çağırması gerektirmeyen cihaz kodlu tarayıcı oturumu; bu nedenle SSH/Docker/VPS üzerinden de çalışır (`--auth-choice xai-oauth`).
    - **xAI API anahtarı**: `XAI_API_KEY` ister (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code`, aynı xAI OAuth cihaz kodu akışı için yalnızca elle kullanılan bir uyumluluk diğer adı olarak hâlâ çalışır; yeni betikler için `xai-oauth` kullanın.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth adresinden edinin) ister ve Zen ya da Go kataloğunu seçmenize olanak tanır.
    - **Ollama**: önce **Bulut + Yerel**, **Yalnızca bulut** veya **Yalnızca yerel** seçeneklerini sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; ana makine destekli modlar Ollama temel URL'sini (varsayılan `http://127.0.0.1:11434`) ister, kullanılabilir modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik olarak çeker; `Cloud + Local` ayrıca söz konusu Ollama ana makinesinde bulut erişimi için oturum açılıp açılmadığını denetler.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çok modelli proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Hesap Kimliği, Gateway Kimliği ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: yapılandırma otomatik olarak yazılır; barındırılan varsayılan `MiniMax-M3` değeridir.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: yapılandırma, Çin veya küresel uç noktalardaki StepFun standard ya da Step Plan için otomatik olarak yazılır.
    - Standard şu anda varsayılan olarak `step-3.5-flash` kullanır; Step Plan ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: yapılandırma otomatik olarak yazılır.
    - **Kimi Coding**: yapılandırma otomatik olarak yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Özel Sağlayıcı**: OpenAI uyumlu, OpenAI Responses uyumlu veya Anthropic uyumlu uç noktalarla çalışır. Etkileşimsiz bayraklar: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner), `--custom-provider-id` (isteğe bağlı; temel URL'den otomatik olarak türetilir), `--custom-compatibility openai|openai-responses|anthropic` (varsayılan `openai`), `--custom-image-input` / `--custom-text-input` (çıkarılan görsel model algılamasını geçersiz kılar).
    - **Atla**: henüz kimlik doğrulama yapılandırılmaz.
    - Algılanan seçeneklerden bir varsayılan model seçin (veya sağlayıcı/modeli elle girin). En iyi kalite ve daha düşük istem enjeksiyonu riski için sağlayıcı yığınınızda bulunan en güçlü, en yeni nesil modeli seçin.
    - İlk katılım bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin kimlik doğrulama profili değerlerini kullanır. Bunun yerine ortam destekli başvuruları (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`) saklamak için `--secret-input-mode ref` kullanın; başvurulan ortam değişkeni önceden ayarlanmış olmalıdır, aksi takdirde ilk katılım hemen başarısız olur.
    - Kimlik doğrulama profilleri `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` yalnızca eski verileri içe aktarmak içindir.
    - Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)
    <Note>
    Başsız/sunucu ipucu: OAuth işlemini tarayıcısı olan bir makinede tamamlayın, ardından
    söz konusu ajanın `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolunu) gateway ana makinesine kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Ajan önyükleme yordamı için gereken çalışma alanı dosyalarını oluşturur.
    - Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Bağlantı noktası (varsayılan **18789**), bağlama, kimlik doğrulama modu, Tailscale erişimi.
    - Kimlik doğrulama önerisi: yerel WS istemcilerinin kimlik doğrulaması yapması için geri döngüde bile **Belirteç** seçeneğini koruyun.
    - Belirteç modunda etkileşimli kurulum şunları sunar:
      - **Düz metin belirteç oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
      - Hızlı başlangıç, ilk katılım yoklaması/pano önyüklemesi için `env`, `file` ve `exec` sağlayıcılarında mevcut `gateway.auth.token` SecretRef değerlerini yeniden kullanır.
      - Bu SecretRef yapılandırılmış ancak çözümlenemiyorsa ilk katılım, çalışma zamanı kimlik doğrulamasını sessizce zayıflatmak yerine açık bir düzeltme mesajıyla erken başarısız olur.
    - Parola modunda etkileşimli kurulum, düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz belirteç SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - İlk katılım işleminin ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca tüm yerel işlemlere tamamen güveniyorsanız devre dışı bırakın.
    - Geri döngü dışındaki bağlamalar yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR ile oturum açma.
    - [Telegram](/tr/channels/telegram): bot belirteci.
    - [Discord](/tr/channels/discord): bot belirteci.
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON'u + Webhook hedef kitlesi.
    - [Mattermost](/tr/channels/mattermost) (plugin): bot belirteci + temel URL.
    - [Signal](/tr/channels/signal) (plugin): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [iMessage](/tr/channels/imessage): `imsg` CLI yolu + Messages DB erişimi; Gateway Mac dışında çalışıyorsa bir SSH sarmalayıcısı kullanın.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack ve diğer kanallar,
      ilk katılımın sizin için kurabileceği plugin'ler olarak sunulur. Tam katalog: [Kanallar](/tr/channels).
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` aracılığıyla onaylayın veya izin verilenler listelerini kullanın.

  </Step>
  <Step title="Web araması">
    - Brave, Codex (Barındırılan Arama), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (ya da atlayın).
    - API destekli sağlayıcılar hızlı kurulum için ortam değişkenlerini veya mevcut yapılandırmayı kullanabilir; anahtar gerektirmeyen sağlayıcılar ise kendi sağlayıcılarına özgü ön koşulları kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (birlikte sunulmaz).
    - Linux (ve WSL2 üzerinden Windows): systemd kullanıcı birimi
      - İlk katılım, Gateway oturum kapatıldıktan sonra da çalışmayı sürdürsün diye `loginctl enable-linger <user>` aracılığıyla kalıcı kullanıcı oturumunu etkinleştirmeye çalışır.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Zamanlanmış Görev; görev oluşturma reddedilirse OpenClaw, kullanıcı başına Başlangıç klasörü oturum açma öğesine geri döner ve Gateway'i hemen başlatır.
    - **Çalışma zamanı seçimi:** standart çalışma zamanı durum deposu `node:sqlite` kullandığından Node gereklidir. Eski Bun hizmetleri onarım sırasında Node'a taşınır.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa daemon kurulumu bunu doğrular ancak çözümlenen düz metin belirteç değerlerini gözetmen hizmet ortamı meta verilerinde kalıcı olarak saklamaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılan belirteç SecretRef'i çözümlenemiyorsa daemon kurulumu, uygulanabilir yönlendirmelerle engellenir.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa mod açıkça ayarlanana kadar daemon kurulumu engellenir.

  </Step>
  <Step title="Sistem durumu denetimi">
    - Gateway'i başlatır (gerekiyorsa) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sistem durumu yoklamasını durum çıktısına ekler (erişilebilir bir gateway gerektirir).

  </Step>
  <Step title="Skills (önerilen)">
    - Kullanılabilir becerileri okur ve gereksinimleri denetler.
    - Bir Node yöneticisi seçmenize olanak tanır: **npm / pnpm / bun**.
    - Güvenilir, birlikte sunulan beceriler için isteğe bağlı bağımlılıkları otomatik olarak kurar (bazıları macOS'ta Homebrew kullanır).
    - Homebrew, uv veya Go yükleyicisi ön koşulu bulunmayan becerileri atlar, bunları elle kurulum yönlendirmeleriyle gruplandırır ve ön koşul kurulduktan sonra sizi `openclaw doctor` komutuna yönlendirir.

  </Step>
  <Step title="Tamamlama">
    - Terminal, Tarayıcı veya daha sonra seçenekleri için **Ajanınızı nasıl oluşturmak istiyorsunuz?** istemi dahil özet + sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa ilk katılım, tarayıcı açmak yerine Control UI için SSH bağlantı noktası yönlendirme talimatlarını yazdırır.
Control UI varlıkları eksikse ilk katılım bunları derlemeyi dener; yedek seçenek `pnpm ui:build` şeklindedir (UI bağımlılıklarını otomatik olarak yükler).
</Note>

## Etkileşimsiz mod

İlk katılımı otomatikleştirmek veya betiklemek için `--non-interactive --accept-risk` kullanın (
bayrak, gerekli risk onayıdır; bu bayrak olmadan ilk katılım
bir hatayla sonlanır):

```bash
openclaw onboard --non-interactive --accept-risk \
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

Etkileşimsiz modda Gateway belirteci SecretRef'i:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.

<Note>
`--json`, etkileşimsiz modu **ifade etmez**. Betikler için `--non-interactive --accept-risk` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Otomasyonu](/tr/start/wizard-cli-automation#provider-specific-examples) sayfasında yer alır.
Bayrakların anlamları ve adım sıralaması için bu başvuru sayfasını kullanın.

### Aracı ekleme (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` ayrılmış bir aracı kimliğidir ve `openclaw agents add` için kullanılamaz.

## Gateway sihirbazı RPC'si

Gateway, ilk katılım akışını RPC üzerinden sunar (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI), ilk katılım mantığını yeniden uygulamadan adımları görüntüleyebilir.

## Signal kurulumu (signal-cli)

İlk katılım, `signal-cli` öğesinin `PATH` üzerinde olup olmadığını algılar ve eksikse yüklemeyi önerir:

- Linux x86-64: Resmî yerel GraalVM derlemesini `signal-cli` GitHub sürümlerinden indirir ve `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- macOS ve diğer mimariler: Bunun yerine Homebrew aracılığıyla yükler.
- Yerel Windows: Henüz desteklenmiyor; Linux yükleme yolunu kullanmak için ilk katılımı WSL2 içinde çalıştırın.
- Her iki durumda da yapılandırmanıza `channels.signal.cliPath` yazar.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax seçildiyse)
- `tools.profile` (ayarlanmamışsa yerel ilk katılım varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (ayarlanmamışsa yerel ilk katılım bunu varsayılan olarak `"per-channel-peer"` değerine ayarlar; mevcut açık değerler korunur. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal istemleri sırasında kabul ettiğinizde kanal DM izin listeleri. Discord, Matrix, Microsoft Teams ve Slack mümkün olduğunda adları kimliklere çözümler; diğer kanallar kimlikleri doğrudan alır (örneğin sayısal Telegram gönderen kimlikleri veya WhatsApp telefon numaraları).
- `skills.install.nodeManager`
  - `setup --node-manager`; `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırmada `skills.install.nodeManager` doğrudan ayarlanarak `yarn` kullanılmaya devam edilebilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında yer alır.
Etkin oturumlar ve dökümler
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde saklanır.
`~/.openclaw/agents/<agentId>/sessions/` dizini, eski sistem geçişi
girdileri ve arşiv/destek yapıtları için kullanılır.

Bazı kanallar plugin olarak sunulur. Kurulum sırasında bunlardan birini seçtiğinizde ilk katılım,
yapılandırılabilmesi için önce onu yüklemenizi (npm veya yerel bir yol üzerinden) ister.

## İlgili belgeler

- İlk katılıma genel bakış: [İlk Katılım (CLI)](/tr/start/wizard)
- CLI kurulum başvurusu: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference)
- macOS uygulamasında ilk katılım: [İlk Katılım](/tr/start/onboarding)
- Yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [iMessage](/tr/channels/imessage)
- Skills: [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config)
