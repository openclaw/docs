---
read_when:
    - CLI ilk katılımını çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ilk katılımı: çıkarımı doğrulayın, ardından kalan kurulumu OpenClaw''a devredin'
title: İlk Kurulum (CLI)
x-i18n:
    generated_at: "2026-07-16T17:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI ilk kurulumu; macOS, Linux ve Windows'ta (yerel veya WSL2) önerilen terminal kurulum yoludur. Varsayılan olarak makinede zaten kullanılabilir olan yapay zekâ erişimini algılar, gerçek bir tamamlama ile doğrular ve çalışma alanını, Gateway'i ve isteğe bağlı özellikleri yapılandırmak için OpenClaw'u başlatır. `openclaw setup` aynı akışı çalıştırır ([Kurulum](/tr/cli/setup), yalnızca yapılandırma yapan `--baseline` çeşidini ele alır). Windows masaüstü kullanıcıları [Windows Hub](/tr/platforms/windows) üzerinden de başlayabilir.

Kılavuzlu ilk kurulum, önce çıkarımı hazırlar. Kullanılabilir yapay zekâ erişimini algılar, gerçek bir tamamlama gerektirir ve ancak bundan sonra OpenClaw'un geri kalanını yapılandırmak üzere [OpenClaw](/cli/openclaw) işlemini başlatır. **Şimdilik atla** seçildiğinde OpenClaw başlatılmadan ilk kurulumdan çıkılır.

Klasik sihirbaz; özel sağlayıcılar, uzak Gateway kurulumu, kanal eşleştirme, daemon denetimleri, Skills ve içe aktarma işlemleri için kullanılabilir olmaya devam eder. `openclaw onboard --classic` ile açıkça çalıştırın; kılavuzlu çıkarım seçici bu sihirbaza devretmez. Çıkarım başarılı olduktan sonra OpenClaw, gizli bilgiler gerektiren kanal kurulumunu maskeli bir terminal sihirbazına devretmek için `open channel wizard for
<channel>` kullanabilir. Model sağlayıcısını veya kimlik doğrulamasını değiştirmek için OpenClaw'dan çıkıp `openclaw onboard` komutunu çalıştırın; OpenClaw, kılavuzlu veya klasik sağlayıcı akışlarını açmaz.

<Info>
En hızlı ilk sohbet: kılavuzlu kurulumu tamamlayın, `openclaw dashboard` komutunu çalıştırın ve Control UI üzerinden tarayıcıda sohbet edin. Belgeler: [Kontrol Paneli](/tr/web/dashboard).
</Info>

## Yerel ayar

Sihirbaz, sabit ilk kurulum metinlerini yerelleştirir. Çözümleme sırası: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`, ardından İngilizce. Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Ürün adları, komutlar, yapılandırma anahtarları, URL'ler, sağlayıcı kimlikleri, model kimlikleri ve plugin/kanal etiketleri yerel ayardan bağımsız olarak İngilizce kalır.

Çıkarım dışındaki ayarları daha sonra yeniden yapılandırmak için:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz mod anlamına gelmez. Betikler için `--non-interactive` kullanın (bkz. [CLI otomasyonu](/tr/start/wizard-cli-automation)).
</Note>

<Tip>
Klasik sihirbaz, sağlayıcı seçebileceğiniz bir web araması adımı içerir: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily. Bazıları API anahtarı gerektirir; diğerleri anahtarsızdır. Bunu daha sonra `openclaw configure --section web` ile yapılandırın. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## Kılavuzlu varsayılan

Yalın `openclaw onboard` şu yolu izler:

1. Güvenlik bildirimini kabul edin.
2. Yapılandırılmış modelleri, API anahtarı ortam değişkenlerini, desteklenen yerel yapay zekâ CLI'larını ve Gateway ana makinesindeki erişilebilir Ollama veya LM Studio sunucularında önceden kurulmuş, araç kullanabilen modelleri algılayın. Bu salt okunur geçiş hiçbir zaman model indirmez. Gemini CLI ve Antigravity kurulumları bildirilir ancak araçsız bir yoklamayı zorunlu kılamadıkları için otomatik olarak test edilmez.
3. Algılanan ilk adayı gerçek bir tamamlama ile test edin. Başarısızlık durumunda nedeni gösterin ve kullanılabilir bir sonraki adayla devam edin.
4. Algılama seçenekleri tükendiğinde OpenAI, Anthropic, xAI (Grok), Google veya OpenRouter'ı seçin ya da kalan sağlayıcılar için **Diğer…** seçeneğini belirleyin. Her sağlayıcının bölgeleri, planları ve desteklenen tarayıcı, cihaz, API anahtarı veya token yöntemleri ikinci bir menüde görünür ve aynı gerçek tamamlama ile test edilir. OpenClaw'u başlatmadan çıkmak için **Şimdilik atla** seçeneğini belirleyin.
5. Yalnızca doğrulanmış model rotasını ve gerektirdiği kimlik bilgisi/plugin durumunu kalıcı hâle getirin. Çalışma alanı ve Gateway ayarlarına dokunulmaz.
6. Çalışma alanını, Gateway'i, kanalları, agent'ları, plugin'leri ve kalan isteğe bağlı kurulumu yapılandırabilmesi için OpenClaw'u doğrulanmış modelle başlatın.

Komut yapılandırılmış bir kurulumda yeniden çalıştırıldığında önce geçerli varsayılan model test edilir; böylece kılavuzlu akış bir doğrulama ve onarım geçişi işlevi görür. Başarısız bir denetim, yapılandırılmış modeli hiçbir zaman otomatik olarak değiştirmez; ilk kurulum durur ve nasıl devam edileceğini sorar. Daha sonra çıkarım dışı eklemeler yapmak için `openclaw channels add` veya `openclaw configure`; sağlayıcı ya da kimlik doğrulama rotası değişiklikleri için `openclaw onboard` kullanın.

## Klasik sihirbaz: QuickStart ve Advanced

Tam sihirbazı açmak için `openclaw onboard --classic` komutunu çalıştırın. Sihirbaz, **QuickStart** (varsayılanlar) ile **Advanced** (tam denetim) arasında bir seçimle başlar. Klasik akışı seçip bu istemi atlamak için `--flow quickstart` veya `--flow advanced` (`manual` diğer adı) iletin.

<Tabs>
  <Tab title="QuickStart (varsayılanlar)">
    - Yerel Gateway, geri döngü bağlaması
    - Varsayılan çalışma alanı (veya mevcut çalışma alanı)
    - Gateway bağlantı noktası **18789**
    - Gateway kimlik doğrulaması **Token** (geri döngüde bile otomatik oluşturulur)
    - Araç politikası: yeni kurulumlar için `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı: yeni kurulumlar için `session.dmScope: "per-channel-peer"`. Ayrıntılar: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale erişimi **Kapalı**
    - Telegram ve WhatsApp DM'leri varsayılan olarak **izin listesi** kullanır: Telegram sayısal bir Telegram kullanıcı kimliği, WhatsApp ise bir telefon numarası ister

  </Tab>
  <Tab title="Advanced (tam denetim)">
    - Her adımı gösterir: mod, çalışma alanı, Gateway, kanallar, daemon, Skills

  </Tab>
</Tabs>

Uzak mod (`--mode remote`) her zaman gelişmiş akışı kullanır; yalnızca bu makineyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır ve uzak ana makineye hiçbir şey kurmaz veya orada hiçbir şeyi değiştirmez.

## Klasik ilk kurulumun yapılandırdıkları

Yerel mod (varsayılan) şu adımlardan geçer:

1. **Model/Kimlik Doğrulama** - Özel Sağlayıcı (OpenAI uyumlu, OpenAI Responses uyumlu, Anthropic uyumlu veya Bilinmeyen otomatik algılama) dâhil olmak üzere bir sağlayıcı kimlik doğrulama akışı (API anahtarı, OAuth veya sağlayıcıya özgü manuel kimlik doğrulama) seçin. Varsayılan bir model seçin.
   Yeni OpenAI API anahtarı kurulumu varsayılan olarak `openai/gpt-5.6` kullanır (yalın doğrudan API kimliği Sol'a çözümlenir); yeni ChatGPT/Codex kurulumu varsayılan olarak `openai/gpt-5.6-sol` kullanır. Kurulumun yeniden çalıştırılması, `openai/gpt-5.5` dâhil olmak üzere mevcut açık modeli korur. Hesap GPT-5.6'yı sunmuyorsa `openai/gpt-5.5` seçeneğini açıkça belirleyin.
   Güvenlik notu: Bu agent araç çalıştıracak veya webhook/hook içeriğini işleyecekse kullanılabilir en güçlü ve en yeni nesil modeli tercih edin ve araç politikasını katı tutun; daha zayıf veya eski katmanlar istem enjeksiyonuna daha açıktır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine ortam destekli başvuruları saklar; başvurulan ortam değişkeni önceden ayarlanmış olmalıdır, aksi takdirde ilk kurulum hızla başarısız olur. Etkileşimli gizli bilgi başvuru modu, kaydetmeden önce hızlı bir ön denetimle bir ortam değişkenine veya yapılandırılmış bir sağlayıcı başvurusuna (`file` ya da `exec`) işaret edebilir. Model/kimlik doğrulama kurulumundan sonra sihirbaz isteğe bağlı bir canlı tamamlama testi sunar; başarısızlık durumunda model/kimlik doğrulama kurulumuna bir kez dönülebilir veya klasik sihirbazın geri kalanı engellenmeden hata yok sayılabilir. Hatayı yok saymak OpenClaw'un kilidini açmaz; konuşmalı kurulum yine de başarılı bir çıkarım denetimi gerektirir.
2. **Çalışma alanı** - agent dosyalarının dizini (varsayılan `~/.openclaw/workspace`). Önyükleme dosyalarını oluşturur.
3. **Gateway** - bağlantı noktası, bağlama adresi, kimlik doğrulama modu, Tailscale erişimi. Etkileşimli token modunda düz metin token depolamayı (varsayılan) seçin veya SecretRef kullanmayı tercih edin. Etkileşimsiz SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** - Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası dâhil yerleşik ve resmî plugin sohbet kanalları.
5. **Daemon** - bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Başlangıç klasörü geri dönüşüyle yerel bir Windows Zamanlanmış Görevi kurar.
   Token kimlik doğrulaması gerekliyse ve `gateway.auth.token` SecretRef ile yönetiliyorsa daemon kurulumu bunu doğrular ancak çözümlenmiş token'ı gözetmen hizmetinin ortam meta verilerinde kalıcı hâle getirmez; çözümlenmemiş bir SecretRef, yönlendirme sunarak kurulumu engeller. `gateway.auth.mode` ayarlanmamışken hem `gateway.auth.token` hem de `gateway.auth.password` ayarlanmışsa mod açıkça belirlenene kadar kurulum engellenir.
6. **Sistem durumu denetimi** - Gateway'i başlatır ve erişilebilir olduğunu doğrular.
7. **Skills** - önerilen Skills öğelerini ve isteğe bağlı bağımlılıklarını kurar.

<Note>
İlk kurulumu yeniden çalıştırmak, açıkça **Sıfırla** seçeneğini belirlemediğiniz (veya `--reset` iletmediğiniz) sürece hiçbir şeyi silmez. CLI `--reset` varsayılan olarak yapılandırmayı, kimlik bilgilerini ve oturumları sıfırlar; çalışma alanını da kaldırmak için `--reset-scope full` kullanın. Yapılandırma geçersizse veya eski anahtarlar içeriyorsa ilk kurulum önce `openclaw doctor` komutunu çalıştırmanızı ister.
</Note>

`--flow import`, yeni kurulum yerine klasik sihirbazda algılanan bir geçiş akışını (örneğin Hermes) çalıştırır; [Geçiş](/tr/cli/migrate) ve [Kurulum](/tr/install/migrating-hermes) altındaki geçiş kılavuzlarına bakın. `openclaw onboard --modern`, [OpenClaw](/cli/openclaw) için bir uyumluluk diğer adıdır. `openclaw setup` ile aynı çıkarım geçidini kullanır: doğrulanmış çıkarım asistanı başlatırken etkileşimli bir başarısızlık kılavuzlu çıkarım kurulumuna döner.

## Başka bir agent ekleme

Kendi çalışma alanına, oturumlarına ve kimlik doğrulama profillerine sahip ayrı bir agent oluşturmak için `openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırıldığında ad, çalışma alanı, kimlik doğrulama, kanallar ve bağlamalar için etkileşimli bir akış başlatılır; bu, tam `openclaw onboard` sihirbazı değildir.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanı: `~/.openclaw/workspace-<agentId>` (veya ayarlanmışsa `agents.defaults.workspace` altında).
- Gelen iletileri bu agent'a yönlendirmek için `bindings` ekleyin (ilk kurulum bunu sizin için yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım davranış ve yapılandırma çıktıları için [CLI kurulum başvurusu](/tr/start/wizard-cli-reference) bölümüne bakın.
Etkileşimsiz örnekler için [CLI otomasyonu](/tr/start/wizard-cli-automation) bölümüne bakın.
Tam bayrak başvurusu için [`openclaw onboard`](/tr/cli/onboard) bölümüne bakın.

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk kurulum genel bakışı: [İlk kurulum genel bakışı](/tr/start/onboarding-overview)
- macOS uygulaması ilk kurulumu: [İlk kurulum](/tr/start/onboarding)
- Agent ilk çalıştırma ritüeli: [Agent Önyükleme](/tr/start/bootstrapping)
