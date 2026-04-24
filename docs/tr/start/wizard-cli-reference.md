---
read_when:
    - '`openclaw onboard` için ayrıntılı davranışlara ihtiyacınız var'
    - Onboarding sonuçlarında hata ayıklıyorsunuz veya onboarding istemcileri entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve iç yapılar için tam başvuru
title: CLI kurulum başvurusu
x-i18n:
    generated_at: "2026-04-24T09:32:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Bu sayfa, `openclaw onboard` için tam başvurudur.
Kısa kılavuz için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Sihirbaz ne yapar

Yerel mod (varsayılan) size şu adımlarda rehberlik eder:

- Model ve kimlik doğrulama kurulumu (OpenAI Code abonelik OAuth'u, Anthropic Claude CLI veya API key, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve önyükleme dosyaları
- Gateway ayarları (port, bind, auth, tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles ve diğer paketlenmiş kanal Plugin'leri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup klasörü fallback'li yerel Windows Scheduled Task)
- Sağlık denetimi
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa Keep, Modify veya Reset seçin.
    - Sihirbazı yeniden çalıştırmak, açıkça Reset seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Reset, `trash` kullanır ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)
  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Tam seçenek matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma önyükleme ritüeli için gerekli çalışma alanı dosyalarını oluşturur.
    - Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu ve Tailscale görünürlüğü için istemde bulunur.
    - Önerilen: yerel WS istemcilerinin kimlik doğrulaması yapması gerekmesi için local loopback üzerinde bile token kimlik doğrulamasını etkin bırakın.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Generate/store plaintext token** (varsayılan)
      - **Use SecretRef** (isteğe bağlı)
    - Parola modunda etkileşimli kurulum da düz metin veya SecretRef depolamayı destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlem ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca tüm yerel süreçlere tamamen güveniyorsanız devre dışı bırakın.
    - local loopback dışı bind'ler yine de kimlik doğrulaması gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturum açma
    - [Telegram](/tr/channels/telegram): bot token
    - [Discord](/tr/channels/discord): bot token
    - [Google Chat](/tr/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/tr/channels/mattermost): bot token + base URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için önerilir; sunucu URL'si + parola + Webhook
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi
    - DM güvenliği: varsayılan eşlemedir. İlk DM bir kod gönderir; şu komutla onaylayın:
      `openclaw pairing approve <channel> <code>` veya allowlist kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; headless için özel bir LaunchDaemon kullanın (paketlenmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, çıkış yaptıktan sonra Gateway'in açık kalması için `loginctl enable-linger <user>` çalıştırmayı dener.
      - Sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Görev oluşturma reddedilirse OpenClaw, kullanıcı başına Startup klasörü oturum açma öğesine fallback yapar ve Gateway'i hemen başlatır.
      - Scheduled Task'lar daha iyi supervisor durumu sağladıkları için tercih edilir.
    - Çalışma zamanı seçimi: Node (önerilir; WhatsApp ve Telegram için gereklidir). Bun önerilmez.
  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i başlatır (gerekiyorsa) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal probe'ları da dahil olmak üzere canlı Gateway sağlık probe'unu durum çıktısına ekler.
  </Step>
  <Step title="Skills">
    - Mevcut Skills'i okur ve gereksinimleri denetler.
    - Düğüm yöneticisini seçmenize izin verir: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'te Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.
  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz tarayıcı açmak yerine Control UI için SSH port-forward yönergelerini yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeye çalışır; fallback `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.

<Info>
Uzak mod, uzak ana makinede hiçbir şey kurmaz veya değiştirmez.
</Info>

Ayarladıklarınız:

- Uzak gateway URL'si (`ws://...`)
- Uzak gateway kimlik doğrulaması gerekiyorsa token (önerilir)

<Note>
- Gateway yalnızca local loopback ise SSH tünelleme veya bir tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleme)">
    Kısa ömürlü bir cihaz koduyla tarayıcı eşleme akışı.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API key">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, sonra kimlik bilgisini auth profile'larında saklar.

    Model ayarlanmamışsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` ister ve xAI'ı model sağlayıcısı olarak yapılandırır.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenize izin verir.
    Kurulum URL'si: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (genel)">
    Anahtarı sizin için saklar.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Hesap kimliği, gateway kimliği ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Yapılandırma otomatik yazılır. Hosted varsayılan `MiniMax-M2.7`'dir; API-key kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya global uç noktalardaki standart StepFun ya da Step Plan için otomatik yazılır.
    Standard şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` ister.
    `Cloud only`, `https://ollama.com` ile `OLLAMA_API_KEY` kullanır.
    Ana makine destekli modlar base URL ister (varsayılan `http://127.0.0.1:11434`), mevcut modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, ayrıca o Ollama ana makinesinin cloud erişimi için oturum açıp açmadığını da denetler.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli onboarding, diğer sağlayıcı API key akışlarıyla aynı API key depolama seçeneklerini destekler:
    - **Paste API key now** (düz metin)
    - **Use secret reference** (env ref veya yapılandırılmış sağlayıcı ref'i, ön kontrol doğrulamasıyla)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` için fallback yapar)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırılmamış bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ile modeli elle girin.
- Onboarding bir sağlayıcı kimlik doğrulama seçeneğinden başladığında model seçici otomatik olarak
  o sağlayıcıyı tercih eder. Volcengine ve BytePlus için aynı tercih
  onların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş olursa seçici model göstermemek yerine
  tam kataloğa fallback yapar.
- Sihirbaz bir model denetimi çalıştırır ve yapılandırılmış model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Auth profile'ları (API key'ler + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan onboarding davranışı, API key'leri auth profile'larında düz metin değerler olarak kalıcılaştırır.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine başvuru modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni ref'i (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - yapılandırılmış sağlayıcı ref'i (`file` veya `exec`) sağlayıcı takma adı + kimlik ile
- Etkileşimli başvuru modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Env ref'leri: değişken adını + mevcut onboarding ortamında boş olmayan değeri doğrular.
  - Sağlayıcı ref'leri: sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözümler.
  - Ön kontrol başarısız olursa onboarding hatayı gösterir ve yeniden denemenize izin verir.
- Etkileşimsiz modda `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env değişkenini onboarding işlem ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) bu env değişkeninin ayarlanmasını gerektirir; aksi halde onboarding hızlı şekilde başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu, `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` ayarlanmış olmasını gerektirir; aksi halde onboarding hızlı şekilde başarısız olur.
- Gateway kimlik doğrulama kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Generate/store plaintext token** (varsayılan) veya **Use SecretRef**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Headless ve sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, sonra
o ajanın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) gateway ana makinesine kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç yapılar

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (yerel onboarding, ayarlanmamışsa varsayılan olarak `per-channel-peer` kullanır; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında etkinleştirdiğinizde kanal allowlist'leri (Slack, Discord, Matrix, Microsoft Teams) (adlar mümkün olduğunda kimliklere çözülür)
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırma daha sonra yine `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında bulunur.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

<Note>
Bazı kanallar Plugin olarak teslim edilir. Kurulum sırasında seçildiklerinde sihirbaz,
kanal yapılandırmasından önce Plugin'i kurmanız için istemde bulunur (npm veya yerel yol).
</Note>

Gateway sihirbaz RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), onboarding mantığını yeniden uygulamadan adımları işleyebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Mümkün olduğunda yerel derlemeler kullanılır
- Windows, WSL2 kullanır ve WSL içinde Linux signal-cli akışını izler

## İlgili belgeler

- Onboarding merkezi: [Onboarding (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Automation](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
