---
read_when:
    - openclaw onboard için ayrıntılı davranış bilgilerine ihtiyacınız var
    - İlk kurulum sonuçlarında hata ayıklıyor veya ilk kurulum istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve iç işleyişler için eksiksiz başvuru
title: CLI kurulum referansı
x-i18n:
    generated_at: "2026-04-30T09:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Bu sayfa, `openclaw onboard` için tam referanstır.
Kısa kılavuz için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Sihirbaz ne yapar

Yerel mod (varsayılan) sizi şu adımlardan geçirir:

- Model ve kimlik doğrulama kurulumu (OpenAI Code aboneliği OAuth, Anthropic Claude CLI veya API anahtarı, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve bootstrap dosyaları
- Gateway ayarları (bağlantı noktası, bind, kimlik doğrulama, Tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles ve diğer paketli kanal Pluginleri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Başlangıç klasörü yedeğiyle yerel Windows Scheduled Task)
- Sağlık denetimi
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki Gateway’e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa Keep, Modify veya Reset seçin.
    - Sihirbazı yeniden çalıştırmak, siz açıkça Reset seçmediğiniz sürece (veya `--reset` iletmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Reset, `trash` kullanır ve kapsamlar sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Tam seçenek matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.

  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma bootstrap ritüeli için gereken çalışma alanı dosyalarını başlatır.
    - Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Bağlantı noktası, bind, kimlik doğrulama modu ve Tailscale erişimi için istemler gösterir.
    - Öneri: local loopback için bile token kimlik doğrulamasını etkin tutun; böylece yerel WS istemcileri kimlik doğrulamak zorunda kalır.
    - Token modunda, etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Parola modunda, etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlemi ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca her yerel işleme tamamen güveniyorsanız devre dışı bırakın.
    - local loopback olmayan bind’ler yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturumu açma
    - [Telegram](/tr/channels/telegram): bot token
    - [Discord](/tr/channels/discord): bot token
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON’u + Webhook hedef kitlesi
    - [Mattermost](/tr/channels/mattermost): bot token + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için önerilir; sunucu URL’si + parola + Webhook
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; şu komutla onaylayın:
      `openclaw pairing approve <channel> <code>` veya izin listelerini kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (pakette gönderilmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, Gateway’in oturum kapatıldıktan sonra da açık kalması için `loginctl enable-linger <user>` denemesi yapar.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Görev oluşturma reddedilirse, OpenClaw kullanıcı başına Başlangıç klasörü oturum açma öğesine geri döner ve Gateway’i hemen başlatır.
      - Scheduled Tasks daha iyi gözetmen durumu sağladıkları için tercih edilmeye devam eder.
    - Çalışma zamanı seçimi: Node (önerilir; WhatsApp ve Telegram için gereklidir). Bun önerilmez.

  </Step>
  <Step title="Sağlık denetimi">
    - Gateway’i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı Gateway sağlık yoklamasını durum çıktısına ekler.

  </Step>
  <Step title="Skills">
    - Kullanılabilir Skills öğelerini okur ve gereksinimleri denetler.
    - Node yöneticisi seçmenizi sağlar: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS’ta Homebrew kullanır).

  </Step>
  <Step title="Bitiş">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa, sihirbaz tarayıcı açmak yerine Control UI için SSH bağlantı noktası yönlendirme talimatlarını yazdırır.
Control UI varlıkları eksikse, sihirbaz bunları derlemeyi dener; yedek seçenek `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki Gateway’e bağlanacak şekilde yapılandırır.

<Info>
Uzak mod, uzak ana makinede hiçbir şey kurmaz veya değiştirmez.
</Info>

Ayarladıklarınız:

- Uzak Gateway URL’si (`ws://...`)
- Uzak Gateway kimlik doğrulaması gerekiyorsa token (önerilir)

<Note>
- Gateway yalnızca local loopback ise SSH tünelleme veya bir tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, sonra kimlik bilgisini kimlik doğrulama profillerinde saklar.

    Model ayarlanmamışsa, `openai/*` ya da `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI’ı model sağlayıcısı olarak yapılandırır.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen ya da Go kataloğunu seçmenizi sağlar.
    Kurulum URL’si: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API anahtarı (genel)">
    Anahtarı sizin için saklar.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Hesap ID’si, Gateway ID’si ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Yapılandırma otomatik yazılır. Barındırılan varsayılan `MiniMax-M2.7` olur; API anahtarı kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya global uç noktalardaki StepFun standard ya da Step Plan için otomatik yazılır.
    Standard şu anda `step-3.5-flash` içerir; Step Plan ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic uyumlu)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Bulut ve yerel açık modeller)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` ister.
    `Cloud only`, `https://ollama.com` ile `OLLAMA_API_KEY` kullanır.
    Ana makine destekli modlar temel URL ister (varsayılan `http://127.0.0.1:11434`), kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, ilgili Ollama ana makinesinin bulut erişimi için oturum açıp açmadığını da denetler.
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
    - **Gizli referans kullan** (ön denetim doğrulamalı env ref veya yapılandırılmış sağlayıcı ref)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)
    - `--custom-image-input` / `--custom-text-input` (isteğe bağlı; çıkarılan model giriş yeteneğini geçersiz kılar)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırılmamış bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Özel sağlayıcı onboarding, yaygın model ID’leri için görüntü desteğini çıkarır ve yalnızca model adı bilinmiyorsa sorar.
- Onboarding bir sağlayıcı kimlik doğrulama seçimiyle başladığında, model seçici
  o sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus için aynı tercih
  onların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş olursa, seçici hiç model göstermemek yerine
  tam kataloğa geri döner.
- Sihirbaz bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Kimlik doğrulama profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarımı: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan onboarding davranışı, API anahtarlarını kimlik doğrulama profillerinde düz metin değerleri olarak kalıcı hale getirir.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine referans modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni ref (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - sağlayıcı takma adı + id ile yapılandırılmış sağlayıcı ref (`file` veya `exec`)
- Etkileşimli referans modu, kaydetmeden önce hızlı bir ön denetim doğrulaması çalıştırır.
  - Env refs: geçerli onboarding ortamında değişken adını + boş olmayan değeri doğrular.
  - Provider refs: sağlayıcı yapılandırmasını doğrular ve istenen id değerini çözümler.
  - Ön denetim başarısız olursa, onboarding hatayı gösterir ve yeniden denemenizi sağlar.
- Etkileşimsiz modda, `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env var değerini onboarding işlemi ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) ilgili env var değerinin ayarlanmış olmasını gerektirir; aksi halde onboarding hızlıca başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu, `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda, `--custom-api-key` için `CUSTOM_API_KEY` değerinin ayarlanmış olması gerekir; aksi halde onboarding hızlıca başarısız olur.
- Gateway kimlik doğrulama bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token oluştur/sakla** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumlar değişmeden çalışmaya devam eder.

<Note>
Başsız ve sunucu ipucu: OAuth işlemini tarayıcısı olan bir makinede tamamlayın, ardından
o aracının `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ya da eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) gateway ana makinesine kopyalayın. `credentials/oauth.json`
yalnızca eski içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç ayrıntılar

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax seçildiyse)
- `tools.profile` (yerel başlangıç kurulumu, ayarlı değilse varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (yerel başlangıç kurulumu, ayarlı değilse bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemlerde katılmayı seçtiğinizde kanal izin listeleri (Slack, Discord, Matrix, Microsoft Teams) (adlar mümkün olduğunda kimliklere çözümlenir)
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel yapılandırma daha sonra yine de `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

<Note>
Bazı kanallar Plugin olarak sunulur. Kurulum sırasında seçildiğinde sihirbaz,
kanal yapılandırmasından önce Plugin'i (npm veya yerel yol) yüklemenizi ister.
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), başlangıç kurulum mantığını yeniden uygulamadan adımları işleyebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Yerel derlemeler mevcut olduğunda kullanılır
- Windows, WSL2 kullanır ve WSL içinde Linux signal-cli akışını izler

## İlgili belgeler

- Başlangıç kurulumu merkezi: [Başlangıç kurulumu (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Otomasyonu](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
