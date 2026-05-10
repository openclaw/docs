---
read_when:
    - openclaw onboard için ayrıntılı davranış gerekir
    - İlk katılım sonuçlarında hata ayıklıyorsunuz veya ilk katılım istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve dahili işleyiş için eksiksiz başvuru kaynağı
title: CLI kurulum referansı
x-i18n:
    generated_at: "2026-05-10T19:55:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Bu sayfa, `openclaw onboard` için eksiksiz başvuru kaynağıdır.
Kısa kılavuz için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Sihirbaz ne yapar

Yerel mod (varsayılan) size şunlarda rehberlik eder:

- Model ve kimlik doğrulama kurulumu (OpenAI Code aboneliği OAuth, Anthropic Claude CLI veya API anahtarı, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve önyükleme dosyaları
- Gateway ayarları (port, bağlama, kimlik doğrulama, Tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage ve diğer paketli kanal Plugin'leri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup klasörü yedeğiyle yerel Windows Zamanlanmış Görevi)
- Sağlık denetimi
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şeyi kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa Koru, Değiştir veya Sıfırla seçeneklerinden birini seçin.
    - Sihirbazı yeniden çalıştırmak, açıkça Sıfırla'yı seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama `trash` kullanır ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Tüm seçenek matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.

  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma önyükleme ritüeli için gereken çalışma alanı dosyalarını ekler.
    - Çalışma alanı düzeni: [Aracı çalışma alanı](/tr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Port, bağlama, kimlik doğrulama modu ve Tailscale ile dışa açma için istemler gösterir.
    - Önerilen: local loopback için bile token kimlik doğrulamasını etkin tutun; böylece yerel WS istemcileri kimlik doğrulamak zorunda kalır.
    - Token modunda, etkileşimli kurulum şunları sunar:
      - **Düz metin token üret/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Parola modunda, etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlemi ortamında boş olmayan bir env var gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca her yerel sürece tamamen güveniyorsanız devre dışı bırakın.
    - Loopback olmayan bağlamalar yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturumu açma
    - [Telegram](/tr/channels/telegram): bot token
    - [Discord](/tr/channels/discord): bot token
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON + Webhook hedef kitlesi
    - [Mattermost](/tr/channels/mattermost): bot token + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [iMessage](/tr/channels/imessage): `imsg` CLI yolu + Messages DB erişimi; Gateway Mac dışında çalıştığında bir SSH sarmalayıcısı kullanın
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; şu komutla onaylayın:
      `openclaw pairing approve <channel> <code>` veya izin listeleri kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (paketle birlikte gönderilmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, gateway oturum kapatıldıktan sonra da açık kalsın diye `loginctl enable-linger <user>` çalıştırmayı dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Zamanlanmış Görev
      - Görev oluşturma reddedilirse OpenClaw, kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır.
      - Zamanlanmış Görevler, daha iyi supervisor durumu sağladıkları için tercih edilmeye devam eder.
    - Çalışma zamanı seçimi: Node (önerilir; WhatsApp ve Telegram için gereklidir). Bun önerilmez.

  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sağlık yoklamasını durum çıktısına ekler.

  </Step>
  <Step title="Skills">
    - Kullanılabilir Skills'i okur ve gereksinimleri denetler.
    - Node yöneticisini seçmenizi sağlar: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'te Homebrew kullanır).

  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz, tarayıcı açmak yerine Control UI için SSH port yönlendirme yönergelerini yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeyi dener; yedek seçenek `pnpm ui:build` şeklindedir (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki gateway'e bağlanacak şekilde yapılandırır.

<Info>
Uzak mod, uzak ana makinede hiçbir şeyi kurmaz veya değiştirmez.
</Info>

Ayarladıklarınız:

- Uzak gateway URL'si (`ws://...`)
- Uzak gateway kimlik doğrulaması gerekiyorsa token (önerilir)

<Note>
- Gateway yalnızca loopback ise SSH tünelleme veya tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya anahtar ister, ardından daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse, Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.

    Model ayarlanmamışsa veya zaten OpenAI ailesindeyse, Codex çalışma zamanı üzerinden `agents.defaults.model` değerini `openai/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya anahtar ister, ardından kimlik bilgisini kimlik doğrulama profillerinde saklar.

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
    Yapılandırma otomatik yazılır. Barındırılan varsayılan `MiniMax-M2.7` değeridir; API anahtarı kurulumu
    `minimax/...` kullanır, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya küresel uç noktalarda StepFun standart ya da Step Plan için otomatik yazılır.
    Standart şu anda `step-3.5-flash` içerir; Step Plan ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic uyumlu)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud ve yerel açık modeller)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` ister.
    `Cloud only`, `https://ollama.com` ile `OLLAMA_API_KEY` kullanır.
    Ana makine destekli modlar temel URL ister (varsayılan `http://127.0.0.1:11434`), kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, ilgili Ollama ana makinesinin bulut erişimi için oturum açmış olup olmadığını da denetler.
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
    - **Gizli başvurusu kullan** (ön kontrol doğrulamasıyla env ref veya yapılandırılmış sağlayıcı ref)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)
    - `--custom-image-input` / `--custom-text-input` (isteğe bağlı; çıkarımlanan model giriş yeteneğini geçersiz kılar)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırılmamış bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Özel sağlayıcı onboarding, yaygın model kimlikleri için görüntü desteğini çıkarımlar ve yalnızca model adı bilinmiyorsa sorar.
- Onboarding bir sağlayıcı kimlik doğrulama seçiminden başladığında, model seçici
  bu sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus için aynı tercih
  bunların kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Tercih edilen sağlayıcı filtresi boş olacaksa seçici, hiç model göstermemek yerine
  tam kataloğa geri döner.
- Sihirbaz bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Kimlik doğrulama profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan onboarding davranışı, API anahtarlarını kimlik doğrulama profillerinde düz metin değerler olarak kalıcı hale getirir.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine başvuru modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni başvurusu (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - sağlayıcı takma adı + kimlik ile yapılandırılmış sağlayıcı başvurusu (`file` veya `exec`)
- Etkileşimli başvuru modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Env refs: geçerli onboarding ortamında değişken adını + boş olmayan değeri doğrular.
  - Provider refs: sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözümler.
  - Ön kontrol başarısız olursa onboarding hatayı gösterir ve yeniden denemenizi sağlar.
- Etkileşimsiz modda `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env var değerini onboarding işlem ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) ilgili env var değerinin ayarlanmış olmasını gerektirir; aksi takdirde onboarding hızlıca başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` değerinin ayarlanmış olmasını gerektirir; aksi takdirde onboarding hızlıca başarısız olur.
- Gateway kimlik doğrulama kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token üret/sakla** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Başsız ve sunucu ipucu: OAuth işlemini tarayıcısı olan bir makinede tamamlayın, ardından
o ajanın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) Gateway ana makinesine kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç işleyiş

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax seçildiyse)
- `tools.profile` (ayarlanmadığında yerel ilk kurulum varsayılan olarak `"coding"` olur; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, tailscale)
- `session.dmScope` (ayarlanmadığında yerel ilk kurulum bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katılmayı seçtiğinizde kanal izin listeleri (Slack, Discord, Matrix, Microsoft Teams) (mümkün olduğunda adlar kimliklere çözümlenir)
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel yapılandırma daha sonra yine `skills.install.nodeManager: "yarn"` ayarlayabilir.
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
kanal yapılandırmasından önce Plugin'i yüklemeyi (npm veya yerel yol) ister.
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), ilk kurulum mantığını yeniden uygulamadan adımları işleyebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Kullanılabilir olduğunda yerel derlemeler kullanılır
- Windows, WSL2 kullanır ve WSL içinde Linux signal-cli akışını izler

## İlgili belgeler

- İlk kurulum merkezi: [İlk Kurulum (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Otomasyonu](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
