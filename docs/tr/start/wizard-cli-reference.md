---
read_when:
    - openclaw onboard için ayrıntılı davranışa ihtiyacınız var
    - Onboarding sonuçlarında hata ayıklıyorsunuz veya onboarding istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve iç işleyiş için eksiksiz referans
title: CLI kurulum başvurusu
x-i18n:
    generated_at: "2026-07-04T06:48:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Bu sayfa `openclaw onboard` için tam referanstır.
Kısa kılavuz için bkz. [İlk Katılım (CLI)](/tr/start/wizard).

## Sihirbaz ne yapar

Yerel mod (varsayılan) sizi şunlardan geçirir:

- Model ve kimlik doğrulama kurulumu (OpenAI Code aboneliği OAuth, Anthropic Claude CLI veya API anahtarı, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve başlangıç dosyaları
- Gateway ayarları (bağlantı noktası, bağlama, kimlik doğrulama, tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage ve diğer paketlenmiş kanal pluginleri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup klasörü yedeğiyle yerel Windows Scheduled Task)
- Sağlık kontrolü
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırmayı algılama">
    - `~/.openclaw/openclaw.json` varsa, Koru, Değiştir veya Sıfırla'yı seçin.
    - Sihirbazı yeniden çalıştırmak, açıkça Sıfırla'yı seçmediğiniz (veya `--reset` iletmediğiniz) sürece hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır ve kapsamlar sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Tam seçenek matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.

  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma başlangıç ritüeli için gereken çalışma alanı dosyalarını yerleştirir.
    - Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Bağlantı noktası, bağlama, kimlik doğrulama modu ve tailscale erişimi için sorular sorar.
    - Önerilen: local loopback için bile token kimlik doğrulamasını etkin tutun, böylece yerel WS istemcilerinin kimlik doğrulaması yapması gerekir.
    - Token modunda, etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Parola modunda, etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - İlk katılım süreci ortamında boş olmayan bir env var gerektirir.
      - `--gateway-token` ile birleştirilemez.
    - Kimlik doğrulamayı yalnızca her yerel sürece tamamen güveniyorsanız devre dışı bırakın.
    - local loopback olmayan bağlamalar yine de kimlik doğrulaması gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR ile oturum açma
    - [Telegram](/tr/channels/telegram): bot token
    - [Discord](/tr/channels/discord): bot token
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON + webhook hedef kitlesi
    - [Mattermost](/tr/channels/mattermost): bot token + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [iMessage](/tr/channels/imessage): `imsg` CLI yolu + Messages DB erişimi; Gateway Mac dışında çalıştığında bir SSH sarmalayıcısı kullanın
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; şu komutla onaylayın:
      `openclaw pairing approve <channel> <code>` veya izin listeleri kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (birlikte gönderilmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, gateway'in oturum kapatıldıktan sonra da çalışır durumda kalması için `loginctl enable-linger <user>` denemesi yapar.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Görev oluşturma reddedilirse, OpenClaw kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır.
      - Daha iyi denetleyici durumu sağladıkları için Scheduled Tasks tercih edilir.
    - Çalışma zamanı seçimi: Node (önerilen; WhatsApp ve Telegram için gereklidir). Bun önerilmez.

  </Step>
  <Step title="Sağlık kontrolü">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sağlık yoklamasını durum çıktısına ekler.

  </Step>
  <Step title="Skills">
    - Kullanılabilir skills'i okur ve gereksinimleri kontrol eder.
    - Node yöneticisini seçmenize izin verir: npm, pnpm veya bun.
    - Gerekli yükleyici kullanılabilir olduğunda güvenilir paketlenmiş skills için isteğe bağlı bağımlılıkları kurar.
    - Kullanılamayan Homebrew, uv ve Go yükleyicilerini atlar, ardından etkilenen
      skills'i manuel kurulum rehberliğiyle gruplar. Eksik önkoşulları kurduktan sonra
      `openclaw doctor` çalıştırın.

  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa, sihirbaz tarayıcı açmak yerine Control UI için SSH bağlantı noktası yönlendirme talimatlarını yazdırır.
Control UI varlıkları eksikse, sihirbaz bunları derlemeyi dener; yedek seçenek `pnpm ui:build`'dir (UI bağımlılıklarını otomatik kurar).
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
- Gateway yalnızca local loopback ise SSH tünelleme veya tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlanmamışsa veya zaten OpenAI ailesindense Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.

    Model ayarlanmamışsa veya zaten OpenAI ailesindense Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından kimlik bilgisini kimlik doğrulama profillerinde saklar.

    Model ayarlanmamışsa, `openai/*` ise veya eski Codex model ref'leriyse `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Uygun SuperGrok veya X Premium hesapları için tarayıcıda oturum açma. Bu, çoğu
    kullanıcı için önerilen xAI yoludur. OpenClaw ortaya çıkan kimlik doğrulama
    profilini Grok modelleri, Grok `web_search`, `x_search` ve `code_execution` için saklar.
  </Accordion>
  <Accordion title="xAI (Grok) cihaz kodu">
    localhost geri çağrısı yerine kısa bir kodla uzak kullanım dostu tarayıcı oturum açma.
    Bunu SSH, Docker veya VPS ana makinelerinden kullanın.
  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI'ı bir model sağlayıcı olarak yapılandırır. Bunu
    abonelik OAuth yerine xAI Console API anahtarı istediğinizde kullanın.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenize izin verir.
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
    Yapılandırma otomatik yazılır. Barındırılan varsayılan `MiniMax-M3`'tür; API anahtarı kurulumu
    `minimax/...` kullanır, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya küresel uç noktalarındaki StepFun standart ya da Step Plan için otomatik yazılır.
    Standart şu anda `step-3.5-flash` içerir; Step Plan ayrıca `step-3.5-flash-2603` içerir.
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
    `Cloud + Local`, bu Ollama ana makinesinin bulut erişimi için oturum açmış olup olmadığını da kontrol eder.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli ilk katılım, diğer sağlayıcı API anahtarı akışlarıyla aynı API anahtarı depolama seçeneklerini destekler:
    - **API anahtarını şimdi yapıştır** (düz metin)
    - **Gizli başvuru kullan** (ön kontrol doğrulamasıyla env ref veya yapılandırılmış sağlayıcı ref)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (isteğe bağlı; varsayılan `openai`)
    - `--custom-image-input` / `--custom-text-input` (isteğe bağlı; çıkarılan model giriş kabiliyetini geçersiz kılar)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırılmamış bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Özel sağlayıcı ilk katılımı, yaygın model kimlikleri için görsel desteğini çıkarır ve yalnızca model adı bilinmediğinde sorar.
- İlk katılım bir sağlayıcı kimlik doğrulama seçiminden başladığında, model seçici
  o sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus için aynı tercih
  onların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş olacaksa, seçici hiç model göstermemek yerine
  tam kataloğa geri döner.
- Sihirbaz bir model kontrolü çalıştırır ve yapılandırılmış model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Kimlik doğrulama profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan ilk kurulum davranışı, API anahtarlarını kimlik doğrulama profillerinde düz metin değerler olarak kalıcılaştırır.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine referans modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni referansı (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - sağlayıcı takma adı + id ile yapılandırılmış sağlayıcı referansı (`file` veya `exec`)
- Etkileşimli referans modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Env referansları: geçerli ilk kurulum ortamında değişken adını + boş olmayan değeri doğrular.
  - Sağlayıcı referansları: sağlayıcı yapılandırmasını doğrular ve istenen id'yi çözümler.
  - Ön kontrol başarısız olursa, ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.
- Etkileşimli olmayan modda, `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env değişkenini ilk kurulum işlemi ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`), o env değişkeninin ayarlanmış olmasını gerektirir; aksi halde ilk kurulum hızlıca başarısız olur.
  - Özel sağlayıcılar için, etkileşimli olmayan `ref` modu `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak depolar.
  - Bu özel sağlayıcı durumunda, `--custom-api-key` için `CUSTOM_API_KEY` ayarlanmış olmalıdır; aksi halde ilk kurulum hızlıca başarısız olur.
- Gateway kimlik doğrulama kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token oluştur/depolama** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimli olmayan token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Grafik arayüzsüz ve sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, ardından
o agent'ın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolunu) Gateway host'una kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç yapılar

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax seçilirse)
- `tools.profile` (yerel ilk kurulum, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (yerel ilk kurulum, ayarlanmamışsa bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında kabul ettiğinizde kanal izin listeleri (Slack, Discord, Matrix, Microsoft Teams) (mümkün olduğunda adlar ID'lere çözümlenir)
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırma daha sonra hâlâ `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında depolanır.

<Note>
Bazı kanallar Plugin olarak teslim edilir. Kurulum sırasında seçildiğinde, sihirbaz
kanal yapılandırmasından önce Plugin'i (npm veya yerel yol) yüklemenizi ister.
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), ilk kurulum mantığını yeniden uygulamadan adımları işleyebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında depolar
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Mevcut olduğunda yerel derlemeler kullanılır
- Windows, WSL2 kullanır ve WSL içinde Linux signal-cli akışını izler

## İlgili belgeler

- İlk kurulum merkezi: [İlk Kurulum (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Otomasyonu](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
