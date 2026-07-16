---
read_when:
    - Belirli bir `openclaw onboard` adımının ayrıntılı davranışına ihtiyacınız var
    - Onboarding sonuçlarında hata ayıklıyorsunuz veya onboarding istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: 'openclaw onboard için adım adım davranış: her adımın ne yaptığı, yazdığı yapılandırma ve iç işleyişi'
title: CLI kurulum referansı
x-i18n:
    generated_at: "2026-07-16T17:40:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Bu sayfa, adım adım ilk katılım davranışını, çıktılarını ve iç işleyişini kapsar.
Adım adım açıklama için [İlk Katılım (CLI)](/tr/start/wizard) sayfasına bakın. Tam CLI bayrak
referansı (her `--flag`, etkileşimsiz örnekler, sağlayıcıya özgü
komutlar) için [`openclaw onboard`](/tr/cli/onboard) sayfasına bakın.

## Sihirbaz ne yapar?

Yerel mod (varsayılan) şu adımlarda size rehberlik eder:

- Model ve kimlik doğrulama kurulumu (Anthropic, OpenAI Code aboneliği OAuth, xAI, OpenCode, özel uç noktalar ve sağlayıcıların yönettiği diğer kimlik doğrulama akışları)
- Çalışma alanı konumu ve önyükleme dosyaları
- Gateway ayarları (bağlantı noktası, bağlama, kimlik doğrulama, Tailscale)
- Kanallar ve sağlayıcılar (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve diğer paketlenmiş kanallar veya Plugin kanalları)
- Web arama sağlayıcısı (isteğe bağlı)
- Arka plan hizmeti kurulumu (LaunchAgent, systemd kullanıcı birimi veya Başlangıç klasörü yedek seçeneğine sahip yerel Windows Zamanlanmış Görevi)
- Sistem durumu denetimi
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır. Uzak
ana bilgisayarda hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırmayı algılama">
    - `~/.openclaw/openclaw.json` mevcutsa **Geçerli değerleri koru**, **İncele ve güncelle** veya **Kurulumdan önce sıfırla** seçeneklerinden birini belirleyin.
    - Sihirbazı yeniden çalıştırmak, açıkça Sıfırla'yı seçmediğiniz (veya `--reset` iletmediğiniz) sürece hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama, durumu Çöp Kutusu'na taşır (asla doğrudan silmez) ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)

  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Seçeneklerin tam matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.

  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma önyüklemesi için gereken çalışma alanı dosyalarını oluşturur.
    - Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Bağlantı noktası, bağlama, kimlik doğrulama modu ve Tailscale erişimi için istemde bulunur.
    - Önerilen: yerel WS istemcilerinin kimlik doğrulaması yapmasını zorunlu kılmak için geri döngüde bile belirteç kimlik doğrulamasını etkin tutun.
    - Belirteç modunda etkileşimli kurulum şunları sunar:
      - **Düz metin belirteci oluştur/depolayın** (varsayılan)
      - **SecretRef kullanın** (isteğe bağlı)
    - Parola modunda etkileşimli kurulum, düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz belirteç SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - İlk katılım işleminin ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca tüm yerel işlemlere tamamen güveniyorsanız devre dışı bırakın.
    - Geri döngü dışı bağlamalar yine de kimlik doğrulama gerektirir.

  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR ile giriş
    - [Telegram](/tr/channels/telegram): bot belirteci
    - [Discord](/tr/channels/discord): bot belirteci
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON'u + Webhook hedef kitlesi
    - [Mattermost](/tr/channels/mattermost): bot belirteci + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [iMessage](/tr/channels/imessage): `imsg` CLI yolu + Mesajlar veritabanına erişim; Gateway Mac dışında çalışıyorsa bir SSH sarmalayıcısı kullanın
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; şu komutla onaylayın:
      `openclaw pairing approve <channel> <code>` veya izin listelerini kullanın.
  </Step>
  <Step title="Web araması">
    - Bir sağlayıcı seçin (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) veya atlayın.
    - Bu adımı `--skip-search` ile atlayın; daha sonra `openclaw configure --section web` ile yeniden yapılandırın.

  </Step>
  <Step title="Arka plan hizmeti kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; ekransız kullanım için özel bir LaunchDaemon kullanın (birlikte sunulmaz).
    - WSL2 aracılığıyla Linux ve Windows: systemd kullanıcı birimi
      - Sihirbaz, oturum kapatıldıktan sonra Gateway'in çalışmaya devam etmesi için `loginctl enable-linger <user>` komutunu çalıştırmayı dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` dosyasına yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Zamanlanmış Görev
      - Görev oluşturmaya izin verilmezse OpenClaw, kullanıcı başına Başlangıç klasörü oturum açma öğesine geri döner ve Gateway'i hemen başlatır.
      - Zamanlanmış Görevler, daha iyi denetleyici durumu sağladıkları için tercih edilmeye devam eder.
    - Çalışma zamanı seçimi: OpenClaw'ın standart çalışma zamanı durum deposu `node:sqlite` kullandığı için Node gereklidir.

  </Step>
  <Step title="Sistem durumu denetimi">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal yoklamaları dâhil olmak üzere canlı Gateway sistem durumu yoklamasını durum çıktısına ekler.

  </Step>
  <Step title="Skills">
    - Kullanılabilir skills öğelerini okur ve gereksinimleri denetler.
    - Node yöneticisini seçmenize olanak tanır: npm, pnpm veya bun.
    - Gerekli yükleyici kullanılabiliyorsa güvenilir paketlenmiş skills için isteğe bağlı
      bağımlılıkları kurar.
    - Kullanılamayan Homebrew, uv ve Go yükleyicilerini atlar, ardından etkilenen
      skills öğelerini elle kurulum yönergeleriyle gruplandırır. Eksik
      ön koşulları kurduktan sonra `openclaw doctor` çalıştırın.

  </Step>
  <Step title="Tamamlama">
    - iOS, Android ve macOS uygulama seçenekleri dâhil özet ve sonraki adımlar.

  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz, tarayıcı açmak yerine Control UI için SSH bağlantı noktası yönlendirme talimatlarını yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeyi dener; yedek seçenek `pnpm ui:build` komutudur (UI bağımlılıklarını otomatik olarak kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır. Uzak
ana bilgisayarda hiçbir şey kurmaz veya değiştirmez.

Ayarladıklarınız:

- Uzak Gateway URL'si (`ws://...` veya `wss://...`)
- Uzak Gateway yapılandırmasıyla eşleşen belirteç, parola veya kimlik doğrulamasız kullanım

<Steps>
  <Step title="Keşif (isteğe bağlı)">
    `dns-sd` (macOS) veya `avahi-browse` (Linux) kullanılabiliyorsa ilk katılım,
    elle URL girişine dönmeden önce Bonjour/mDNS Gateway işaretçilerini
    aramayı önerir. Yapılandırıldığında geniş alan DNS-SD keşfi de
    denenir. Belgeler: [Gateway keşfi](/tr/gateway/discovery), [Bonjour](/tr/gateway/bonjour).
  </Step>
  <Step title="Bağlantı yöntemi">
    Bir işaretçi seçildiğinde doğrudan WebSocket veya SSH tünelini seçin:
    - **Doğrudan**: `wss://` üzerinden bağlanır ve keşfedilen
      TLS parmak izine güvenmenizi ister (ilk kullanımda güven sabitlemesi; yalnızca kabul ederseniz sabitlenir).
    - **SSH tüneli**: önce çalıştırılacak bir `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      komutu yazdırır, ardından yerel tünel uç noktasına bağlanır.
  </Step>
  <Step title="Kimlik doğrulama">
    Belirteç (önerilen), parola veya kimlik doğrulamasız kullanımı seçin; ardından isteğe bağlı olarak bunu
    düz metin yerine SecretRef olarak depolayın.
  </Step>
</Steps>

<Note>
Gateway yalnızca geri döngüye bağlıysa ve keşfedilemiyorsa SSH tünellemeyi veya bir tailnet'i elle kullanın.
Düz metin `ws://`; geri döngü, özel IP değişmezleri, `.local` ve Tailnet `*.ts.net` URL'leri için kabul edilir; diğer özel DNS adları `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` gerektirir.
</Note>

## Kimlik doğrulama ve model seçenekleri

Etkileşimli ilk katılım sırasında bir sağlayıcı kurulum adımı başarısız olursa (örneğin yerel oturum açma
olmadan bir CLI yeniden kullanım seçeneği), sihirbaz çıkmak yerine hatayı gösterir ve sağlayıcı seçicisine
döner. Açık `--auth-choice` çalıştırmaları, otomasyon için yine hızla başarısız olur.

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından arka plan hizmetinin kullanımı için kaydeder.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Etkileşimli ilk katılım/yapılandırmada tercih edilen yerel yoldur; varsa mevcut bir Claude CLI oturumunu yeniden kullanır.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Birincil modeli olmayan yeni bir kurulumda `agents.defaults.model` değerini
    Codex çalışma zamanı aracılığıyla `openai/gpt-5.6-sol` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü bir cihaz koduyla tarayıcı eşleştirme akışı.

    Birincil modeli olmayan yeni bir kurulumda `agents.defaults.model` değerini
    Codex çalışma zamanı aracılığıyla `openai/gpt-5.6-sol` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından kimlik bilgisini kimlik doğrulama profillerinde depolar.

    Birincil modeli olmayan yeni bir kurulumda `agents.defaults.model` değerini
    `openai/gpt-5.6` olarak ayarlar; yalın doğrudan API model kimliği Sol katmanına çözümlenir.

    OpenAI eklemek veya yeniden kimlik doğrulamak, `openai/gpt-5.5` dâhil olmak üzere
    mevcut açık birincil modeli korur. Hesap GPT-5.6'yı sunmuyorsa
    `openai/gpt-5.5` değerini açıkça seçin; OpenClaw bunu sessizce daha düşük bir sürüme geçirmez.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Uygun SuperGrok veya X Premium hesapları için tarayıcıda oturum açma. Bu,
    çoğu kullanıcı için önerilen xAI yoludur. OpenClaw, ortaya çıkan kimlik doğrulama
    profilini Grok modelleri, Grok `web_search`, `x_search` ve `code_execution` için saklar.
  </Accordion>
  <Accordion title="xAI (Grok) cihaz kodu">
    Localhost geri çağırması yerine kısa bir kodla, uzak ortamlara uygun tarayıcıda
    oturum açma. Bunu SSH, Docker veya VPS ana bilgisayarlarından kullanın.
  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI'ı model sağlayıcısı olarak yapılandırır. Abonelik OAuth'u
    yerine bir xAI Console API anahtarı istediğinizde bunu kullanın.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenize olanak tanır (tek API anahtarı her ikisini de kapsar).
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
    Yapılandırma otomatik olarak yazılır. Barındırılan varsayılan `MiniMax-M3`; API anahtarı kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya küresel uç noktalarda StepFun standard ya da Step Plan için otomatik olarak yazılır.
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
    Ana bilgisayar destekli modlar temel URL'yi (varsayılan `http://127.0.0.1:11434`) ister, kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local` ayrıca bu Ollama ana bilgisayarında bulut erişimi için oturum açılıp açılmadığını denetler.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik olarak yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu, OpenAI Responses uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli ilk katılım, diğer sağlayıcı API anahtarı akışlarıyla aynı API anahtarı saklama seçeneklerini destekler:
    - **API anahtarını şimdi yapıştır** (düz metin)
    - **Gizli bilgi başvurusu kullan** (ortam değişkeni başvurusu veya yapılandırılmış sağlayıcı başvurusu; ön kontrol doğrulamasıyla)

    İlk katılım, yaygın görüntü modeli kimlikleri (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral ve benzerleri) için görüntü desteğini çıkarır ve yalnızca model adı bilinmiyorsa sorar.

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (isteğe bağlı; varsayılan `openai`)
    - `--custom-image-input` / `--custom-text-input` (isteğe bağlı; çıkarılan model giriş yeteneğini geçersiz kılar)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırmadan bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcıyı ve modeli elle girin.
- İlk katılım bir sağlayıcı kimlik doğrulama seçeneğinden başlatıldığında model seçici,
  bu sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus için aynı tercih,
  kodlama planı çeşitleriyle de eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Tercih edilen sağlayıcı filtresi boş sonuç verecekse seçici, hiç model
  göstermemek yerine tam kataloğa geri döner.
- Sihirbaz bir model denetimi çalıştırır ve yapılandırılan model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Kimlik doğrulama profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma kaynağı: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi saklama modu:

- Varsayılan ilk katılım davranışı, API anahtarlarını kimlik doğrulama profillerinde düz metin değerler olarak kalıcılaştırır.
- `--secret-input-mode ref`, düz metin anahtar saklama yerine başvuru modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni başvurusu (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - sağlayıcı takma adı + kimlik içeren yapılandırılmış sağlayıcı başvurusu (`file` veya `exec`)
- Etkileşimli başvuru modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Ortam değişkeni başvuruları: Geçerli ilk katılım ortamında değişken adını ve değerin boş olmadığını doğrular.
  - Sağlayıcı başvuruları: Sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözümler.
  - Ön kontrol başarısız olursa ilk katılım hatayı gösterir ve yeniden denemenize olanak tanır.
- Etkileşimsiz modda `--secret-input-mode ref` yalnızca ortam değişkeni desteklidir.
  - Sağlayıcının ortam değişkenini ilk katılım işleminin ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) bu ortam değişkeninin ayarlanmasını gerektirir; aksi takdirde ilk katılım hemen başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu, `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` değerinin ayarlanmasını gerektirir; aksi takdirde ilk katılım hemen başarısız olur.
- Gateway kimlik doğrulama bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token oluştur/sakla** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Başsız sistemler ve sunucular için ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, ardından
bu ajanın `auth-profiles.json` öğesini (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolunu) gateway ana bilgisayarına kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç işleyiş

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax seçilmişse)
- `tools.profile` (ayarlanmamışsa yerel ilk katılım varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bağlama, kimlik doğrulama, Tailscale)
- `session.dmScope` (ayarlanmamışsa yerel ilk katılım bunu varsayılan olarak `per-channel-peer` değerine ayarlar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında kabul ettiğinizde kanal izin listeleri (Discord, iMessage, Signal, Slack, Telegram, WhatsApp); Discord ve Slack ayrıca girilen adları kimliklere çözümler
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırma daha sonra yine `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında bulunur.
Etkin oturumlar ve transkriptler
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde saklanır.
`~/.openclaw/agents/<agentId>/sessions/` dizini, eski geçiş
girdileri ve arşiv/destek yapıtları için kullanılır.

<Note>
Bazı kanallar Plugin olarak sunulur. Kurulum sırasında seçildiğinde sihirbaz,
kanal yapılandırmasından önce Plugin'i yüklemenizi (npm veya yerel yol) ister.
</Note>

## Etkileşimsiz kurulum

`--non-interactive`, `--accept-risk` gerektirir (ajanların
güçlü olduğunu ve tam sistem erişiminin riskli olduğunu kabul eder):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Tüm bayrak başvurusu ve sağlayıcıya özgü örnekler: [`openclaw onboard`](/tr/cli/onboard), [CLI otomasyonu](/tr/start/wizard-cli-automation).

## Gateway sihirbazı RPC'si

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), ilk katılım mantığını yeniden uygulamadan adımları oluşturabilir.

## Signal kurulum davranışı

- Resmî `signal-cli` GitHub sürümlerinden uygun sürüm varlığını indirir (yerel derleme, yalnızca Linux x86-64)
- Diğer platformlarda (macOS, x64 olmayan Linux) bunun yerine Homebrew aracılığıyla yükler
- Sürüm varlığı kurulumunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar
- Yapılandırmaya `channels.signal.cliPath` yazar
- Yerel Windows henüz desteklenmiyor; Linux kurulum yolunu edinmek için ilk katılımı WSL2 içinde çalıştırın

## İlgili belgeler

- İlk katılım merkezi: [İlk katılım (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Otomasyonu](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
