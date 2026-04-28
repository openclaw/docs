---
read_when:
    - '`openclaw onboard` için ayrıntılı davranışa ihtiyacınız var'
    - Onboarding sonuçlarını hata ayıklıyor veya onboarding istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, auth/model kurulumu, çıktılar ve iç yapılar için tam başvuru
title: CLI kurulum başvurusu
x-i18n:
    generated_at: "2026-04-26T11:41:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Bu sayfa `openclaw onboard` için tam başvurudur.
Kısa rehber için [Onboarding (CLI)](/tr/start/wizard) belgesine bakın.

## Sihirbaz ne yapar

Yerel mod (varsayılan) sizi şu konularda yönlendirir:

- Model ve auth kurulumu (OpenAI Code abonelik OAuth'u, Anthropic Claude CLI veya API anahtarı, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve bootstrap dosyaları
- Gateway ayarları (port, bind, auth, tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles ve diğer paketlenmiş kanal Plugin'leri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup klasörü geri dönüşüyle yerel Windows Scheduled Task)
- Sağlık kontrolü
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.
Uzak host üzerinde hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - Eğer `~/.openclaw/openclaw.json` varsa Sakla, Değiştir veya Sıfırla seçeneklerinden birini seçin.
    - Sihirbazı yeniden çalıştırmak, açıkça Sıfırla seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model ve auth">
    - Tam seçenek matrisi [Auth ve model seçenekleri](#auth-and-model-options) bölümündedir.

  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma bootstrap ritüeli için gereken çalışma alanı dosyalarını hazırlar.
    - Çalışma alanı düzeni: [Agent workspace](/tr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu ve tailscale sunumu için sorular sorar.
    - Önerilen: yerel WS istemcilerinin auth yapması gereksin diye loopback için bile token auth'u etkin bırakın.
    - Token modunda, etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Parola modunda, etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding süreci ortamında boş olmayan bir env değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Auth'u yalnızca tüm yerel süreçlere tamamen güveniyorsanız devre dışı bırakın.
    - Loopback olmayan bind'lerde auth yine de gereklidir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi
    - [Telegram](/tr/channels/telegram): bot token'ı
    - [Discord](/tr/channels/discord): bot token'ı
    - [Google Chat](/tr/channels/googlechat): service account JSON + Webhook audience
    - [Mattermost](/tr/channels/mattermost): bot token'ı + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için önerilir; sunucu URL'si + parola + Webhook
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; bunu
      `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listeleri kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (paketlenmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, gateway'in oturum kapandıktan sonra da çalışmaya devam etmesi için `loginctl enable-linger <user>` denemesi yapar.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Görev oluşturma reddedilirse, OpenClaw kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır.
      - Scheduled Task'lar daha iyi supervisor durumu sağladıkları için tercih edilir.
    - Çalışma zamanı seçimi: Node (önerilen; WhatsApp ve Telegram için gereklidir). Bun önerilmez.

  </Step>
  <Step title="Sağlık kontrolü">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal probları dahil canlı gateway sağlık probunu durum çıktısına ekler.

  </Step>
  <Step title="Skills">
    - Kullanılabilir Skills'i okur ve gereksinimleri kontrol eder.
    - Düğüm yöneticisi seçmenizi sağlar: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).

  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz bir tarayıcı açmak yerine Control UI için SSH port-forward yönergelerini yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeye çalışır; geri dönüş olarak `pnpm ui:build` kullanılır (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.

<Info>
Uzak mod, uzak host üzerinde hiçbir şey kurmaz veya değiştirmez.
</Info>

Ayarladıklarınız:

- Uzak gateway URL'si (`ws://...`)
- Uzak gateway auth gerektiriyorsa token (önerilir)

<Note>
- Gateway yalnızca loopback ise SSH tünelleme veya bir tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Auth ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü bir cihaz koduyla tarayıcı eşleştirme akışı.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, sonra kimlik bilgisini auth profile'larına kaydeder.

    Model ayarlanmamışsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI'ı model sağlayıcısı olarak yapılandırır.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenizi sağlar.
    Kurulum URL'si: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API anahtarı (genel)">
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
    Yapılandırma otomatik yazılır. Barındırılan varsayılan `MiniMax-M2.7`'dir; API anahtarı kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya genel uç noktalardaki StepFun standardı veya Step Plan için otomatik yazılır.
    Standard şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic uyumlu)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud ve yerel açık modeller)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` ister.
    `Cloud only`, `OLLAMA_API_KEY` ile `https://ollama.com` kullanır.
    Host destekli modlar temel URL'yi ister (varsayılan `http://127.0.0.1:11434`), kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, bu Ollama host'unun cloud erişimi için oturum açıp açmadığını da kontrol eder.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli onboarding, diğer sağlayıcı API anahtarı akışlarıyla aynı API anahtarı depolama seçeneklerini destekler:
    - **API anahtarını şimdi yapıştır** (düz metin)
    - **Gizli başvurusu kullan** (env başvurusu veya yapılandırılmış sağlayıcı başvurusu, ön kontrol doğrulaması ile)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri düşer)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)

  </Accordion>
  <Accordion title="Atla">
    Auth yapılandırılmadan bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Onboarding bir sağlayıcı auth seçeneğinden başladığında, model seçici
  otomatik olarak o sağlayıcıyı tercih eder. Volcengine ve BytePlus için aynı tercih
  onların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş kalacaksa, seçici hiçbir model göstermemek yerine tam kataloğa geri döner.
- Sihirbaz model kontrolü çalıştırır ve yapılandırılmış model bilinmiyorsa veya auth eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Auth profile'ları (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan onboarding davranışı, API anahtarlarını auth profile'larında düz metin değerler olarak kalıcılaştırır.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine başvuru modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni başvurusu (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - yapılandırılmış sağlayıcı başvurusu (`file` veya `exec`) sağlayıcı takma adı + kimlik ile
- Etkileşimli başvuru modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Env başvuruları: değişken adını + geçerli onboarding ortamında boş olmayan değeri doğrular.
  - Sağlayıcı başvuruları: sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözer.
  - Ön kontrol başarısız olursa onboarding hatayı gösterir ve yeniden denemenize izin verir.
- Etkileşimsiz modda `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env değişkenini onboarding süreci ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) o env değişkeninin ayarlı olmasını gerektirir; aksi halde onboarding hızlıca başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` ayarlı olmasını gerektirir; aksi halde onboarding hızlıca başarısız olur.
- Gateway auth kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token oluştur/sakla** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları olduğu gibi çalışmaya devam eder.

<Note>
Başsız ve sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, sonra
o ajanın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) gateway host'una kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç yapılar

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (yerel onboarding, ayarlanmamışsa bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katıldığınızda kanal izin listeleri (Slack, Discord, Matrix, Microsoft Teams) mümkün olduğunda adlar kimliklere çözülür
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - El ile yapılandırma daha sonra yine de `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

<Note>
Bazı kanallar Plugin olarak sunulur. Kurulum sırasında seçildiklerinde sihirbaz,
kanal yapılandırmasından önce Plugin'i kurmanızı ister (npm veya yerel yol).
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), onboarding mantığını yeniden uygulamadan adımları oluşturabilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altına kaydeder
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Mümkün olduğunda yerel derlemeler kullanılır
- Windows, WSL2 kullanır ve WSL içinde Linux signal-cli akışını izler

## İlgili belgeler

- Onboarding merkezi: [Onboarding (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Automation](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
