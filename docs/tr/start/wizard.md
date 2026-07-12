---
read_when:
    - CLI başlangıç kurulumunu çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ilk katılımı: çıkarımı doğrulayın, ardından kalan kurulumu Crestodian’a devredin'
title: İlk katılım (CLI)
x-i18n:
    generated_at: "2026-07-12T12:50:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI ilk katılımı; macOS, Linux ve Windows'ta (yerel veya WSL2) önerilen terminal kurulum yoludur. Varsayılan olarak makinede zaten kullanılabilir olan yapay zekâ erişimini algılar, gerçek bir tamamlama ile doğrular ve çalışma alanını, Gateway'i ve isteğe bağlı özellikleri yapılandırmak için Crestodian'ı başlatır. `openclaw setup` aynı akışı çalıştırır ([Kurulum](/tr/cli/setup), yalnızca yapılandırmaya yönelik `--baseline` çeşidini açıklar). Windows masaüstü kullanıcıları [Windows Hub](/tr/platforms/windows) üzerinden de başlayabilir.

Yönlendirmeli ilk katılım önce çıkarım bağlantısını kurar. Kullanılabilir yapay zekâ erişimini algılar, gerçek bir tamamlama gerektirir ve ancak bundan sonra OpenClaw'ın geri kalanını yapılandırmak üzere [Crestodian](/tr/cli/crestodian) aracını başlatır. Yönlendirmeli akışta çıkarım öncesi Crestodian veya yapay zekâyı atlama yolu yoktur.

Klasik sihirbaz; sağlayıcıda oturum açma, uzak Gateway kurulumu, kanal eşleştirme, arka plan hizmeti denetimleri, Skills ve içe aktarmalar için kullanılabilir olmaya devam eder. `openclaw onboard --classic` ile açıkça çalıştırın; yönlendirmeli çıkarım adayı ekranı işlemi bu sihirbaza devretmez. Çıkarım başarılı olduktan sonra Crestodian, gizli bilgiler gerektiren kanal kurulumunu maskeli bir terminal sihirbazına devretmek için `open channel wizard for <channel>` komutunu kullanabilir. Model sağlayıcısını veya kimlik doğrulamasını değiştirmek için Crestodian'dan çıkın ve `openclaw onboard` komutunu çalıştırın; Crestodian, yönlendirmeli veya klasik sağlayıcı akışlarını açmaz.

<Info>
İlk sohbete ulaşmanın en hızlı yolu: yönlendirmeli kurulumu tamamlayın, `openclaw dashboard` komutunu çalıştırın ve tarayıcıda Denetim Arayüzü üzerinden sohbet edin. Belgeler: [Gösterge Paneli](/tr/web/dashboard).
</Info>

## Yerel ayar

Sihirbaz, sabit ilk katılım metinlerini yerelleştirir. Çözümleme sırası: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`, ardından İngilizce. Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Ürün adları, komutlar, yapılandırma anahtarları, URL'ler, sağlayıcı kimlikleri, model kimlikleri ve plugin/kanal etiketleri yerel ayardan bağımsız olarak İngilizce kalır.

Çıkarımla ilgili olmayan ayarları daha sonra yeniden yapılandırmak için:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz mod anlamına gelmez. Betikler için `--non-interactive` kullanın (bkz. [CLI otomasyonu](/tr/start/wizard-cli-automation)).
</Note>

<Tip>
Klasik sihirbaz, bir sağlayıcı seçebileceğiniz bir web araması adımı içerir: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily. Bazıları API anahtarı gerektirir; diğerleri anahtarsızdır. Bunu daha sonra `openclaw configure --section web` ile yapılandırın. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## Yönlendirmeli varsayılan

Düz `openclaw onboard` şu yolu izler:

1. Güvenlik bildirimini kabul edin.
2. Yapılandırılmış modelleri, API anahtarı ortam değişkenlerini ve desteklenen yerel yapay zekâ CLI'larını algılayın.
3. Algılanan ilk adayı gerçek bir tamamlama ile test edin. Başarısız olursa nedeni gösterin ve kullanılabilir sonraki adayla devam edin.
4. Algılama seçenekleri tükendiğinde, algılanan bir adayı yeniden deneyin veya maskeli istemde bir sağlayıcı API anahtarı girin. Yönlendirmeli ilk katılım, çıkarım çalışmadan önce Crestodian'ı veya yapay zekâyı atlayan bir çıkış seçeneğini sunmaz.
5. Yalnızca doğrulanmış model yolunu ve bunun gerektirdiği kimlik bilgisi/plugin durumunu kalıcı hâle getirin. Çalışma alanı ve Gateway ayarlarına dokunulmaz.
6. Çalışma alanını, Gateway'i, kanalları, ajanları, plugin'leri ve kalan isteğe bağlı kurulumu yapılandırabilmesi için Crestodian'ı doğrulanmış modelle başlatın.

Komutun yapılandırılmış bir kurulumda yeniden çalıştırılması önce geçerli varsayılan modeli test eder; böylece yönlendirmeli akış bir doğrulama ve onarım geçişi hâline gelir. Başarısız bir denetim, yapılandırılmış modeli hiçbir zaman otomatik olarak değiştirmez; ilk katılım durur ve nasıl devam edileceğini sorar. Daha sonra çıkarımla ilgili olmayan eklemeler için `openclaw channels add` veya `openclaw configure`, sağlayıcı ya da kimlik doğrulama yolu değişiklikleri için `openclaw onboard` kullanın.

## Klasik sihirbaz: Hızlı Başlangıç ve Gelişmiş

Tam sihirbazı açmak için `openclaw onboard --classic` komutunu çalıştırın. Sihirbaz, **Hızlı Başlangıç** (varsayılanlar) ve **Gelişmiş** (tam denetim) seçenekleriyle başlar. Klasik akışı seçip bu istemi atlamak için `--flow quickstart` veya `--flow advanced` (`manual` diğer adı) geçirin.

<Tabs>
  <Tab title="Hızlı Başlangıç (varsayılanlar)">
    - Yerel Gateway, local loopback bağlaması
    - Varsayılan çalışma alanı (veya mevcut çalışma alanı)
    - Gateway bağlantı noktası **18789**
    - Gateway kimlik doğrulaması **Jeton** (local loopback üzerinde bile otomatik oluşturulur)
    - Araç politikası: yeni kurulumlar için `tools.profile: "coding"` (açıkça belirtilmiş mevcut bir profil korunur)
    - DM yalıtımı: yeni kurulumlar için `session.dmScope: "per-channel-peer"`. Ayrıntılar: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale erişimi **Kapalı**
    - Telegram ve WhatsApp DM'leri varsayılan olarak **izin listesi** kullanır: Telegram sayısal bir Telegram kullanıcı kimliği, WhatsApp ise bir telefon numarası ister

  </Tab>
  <Tab title="Gelişmiş (tam denetim)">
    - Her adımı sunar: mod, çalışma alanı, Gateway, kanallar, arka plan hizmeti, Skills

  </Tab>
</Tabs>

Uzak mod (`--mode remote`) her zaman gelişmiş akışı kullanır; yalnızca bu makineyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır ve uzak ana makineye hiçbir şey yüklemez veya orada hiçbir şeyi değiştirmez.

## Klasik ilk katılımın yapılandırdıkları

Yerel mod (varsayılan) şu adımlardan geçer:

1. **Model/Kimlik Doğrulama** - Özel Sağlayıcı (OpenAI uyumlu, OpenAI Responses uyumlu, Anthropic uyumlu veya Bilinmeyeni otomatik algılama) dâhil olmak üzere bir sağlayıcı kimlik doğrulama akışı (API anahtarı, OAuth veya sağlayıcıya özgü elle kimlik doğrulama) seçin. Varsayılan bir model seçin.
   Yeni OpenAI API anahtarı kurulumu varsayılan olarak `openai/gpt-5.6` kullanır (yalın doğrudan API kimliği Sol'a çözümlenir); yeni ChatGPT/Codex kurulumu varsayılan olarak `openai/gpt-5.6-sol` kullanır. Kurulumun yeniden çalıştırılması, `openai/gpt-5.5` dâhil olmak üzere açıkça belirtilmiş mevcut bir modeli korur. Hesap GPT-5.6 modelini sunmuyorsa `openai/gpt-5.5` modelini açıkça seçin.
   Güvenlik notu: Bu ajan araç çalıştıracak veya Webhook/hook içeriği işleyecekse kullanılabilir en güçlü, en yeni nesil modeli tercih edin ve araç politikasını sıkı tutun; daha zayıf veya eski katmanlara istem enjeksiyonu uygulamak daha kolaydır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine ortam destekli başvurular depolar; başvurulan ortam değişkeni önceden ayarlanmış olmalıdır, aksi takdirde ilk katılım hızla başarısız olur. Etkileşimli gizli bilgi başvurusu modu, bir ortam değişkenine veya yapılandırılmış bir sağlayıcı başvurusuna (`file` veya `exec`) işaret edebilir ve kaydetmeden önce hızlı bir ön denetim gerçekleştirir. Model/kimlik doğrulama kurulumundan sonra sihirbaz, isteğe bağlı bir canlı tamamlama testi sunar; başarısızlık durumunda model/kimlik doğrulama kurulumuna bir kez dönülebilir veya klasik sihirbazın geri kalanı engellenmeden hata yok sayılabilir. Hatayı yok saymak Crestodian'ın kilidini açmaz; sohbet tabanlı kurulum yine de başarılı bir çıkarım denetimi gerektirir.
2. **Çalışma Alanı** - Ajan dosyalarının dizini (varsayılan `~/.openclaw/workspace`). Başlangıç dosyalarını oluşturur.
3. **Gateway** - Bağlantı noktası, bağlama adresi, kimlik doğrulama modu, Tailscale erişimi. Etkileşimli jeton modunda düz metin jeton depolamayı (varsayılan) seçin veya SecretRef kullanmayı tercih edin. Etkileşimsiz SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** - Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası dâhil olmak üzere yerleşik ve resmî plugin sohbet kanalları.
5. **Arka Plan Hizmeti** - Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Başlangıç klasörü yedeğine sahip yerel bir Windows Zamanlanmış Görevi yükler.
   Jeton kimlik doğrulaması gerekliyse ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa arka plan hizmeti kurulumu bunu doğrular ancak çözümlenmiş jetonu gözetmen hizmetinin ortam meta verilerine kaydetmez; çözümlenemeyen bir SecretRef, yönlendirme sunarak kurulumu engeller. `gateway.auth.mode` ayarlanmamışken hem `gateway.auth.token` hem de `gateway.auth.password` ayarlanmışsa mod açıkça ayarlanana kadar kurulum engellenir.
6. **Durum denetimi** - Gateway'i başlatır ve erişilebilir olduğunu doğrular.
7. **Skills** - Önerilen Skills öğelerini ve bunların isteğe bağlı bağımlılıklarını yükler.

<Note>
İlk katılımı yeniden çalıştırmak, açıkça **Sıfırla** seçeneğini belirlemediğiniz (veya `--reset` geçirmediğiniz) sürece hiçbir şeyi silmez. CLI `--reset` varsayılan olarak yapılandırmayı, kimlik bilgilerini ve oturumları sıfırlar; çalışma alanını da kaldırmak için `--reset-scope full` kullanın. Yapılandırma geçersizse veya eski anahtarlar içeriyorsa ilk katılım önce `openclaw doctor` komutunu çalıştırmanızı ister.
</Note>

`--flow import`, yeni kurulum yerine klasik sihirbazda algılanan bir geçiş akışını (örneğin Hermes) çalıştırır; [Geçiş](/tr/cli/migrate) bölümüne ve [Kurulum](/tr/install/migrating-hermes) altındaki geçiş kılavuzlarına bakın. `openclaw onboard --modern`, [Crestodian](/tr/cli/crestodian) için bir uyumluluk diğer adıdır. `openclaw crestodian` ile aynı çıkarım kapısını kullanır: doğrulanmış çıkarım asistanı başlatırken etkileşimli bir başarısızlık yönlendirmeli çıkarım kurulumuna döner.

## Başka bir ajan ekleme

Kendi çalışma alanına, oturumlarına ve kimlik doğrulama profillerine sahip ayrı bir ajan oluşturmak için `openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırıldığında ad, çalışma alanı, kimlik doğrulama, kanallar ve bağlamalar için etkileşimli bir akış başlatılır; bu, tam `openclaw onboard` sihirbazı değildir.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanı: `~/.openclaw/workspace-<agentId>` (veya ayarlanmışsa `agents.defaults.workspace` altında).
- Gelen mesajları bu ajana yönlendirmek için `bindings` ekleyin (ilk katılım bunu sizin için yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım davranış ve yapılandırma çıktıları için [CLI kurulum başvurusuna](/tr/start/wizard-cli-reference) bakın.
Etkileşimsiz örnekler için [CLI otomasyonuna](/tr/start/wizard-cli-automation) bakın.
Tam bayrak başvurusu için [`openclaw onboard`](/tr/cli/onboard) bölümüne bakın.

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk katılıma genel bakış: [İlk katılıma genel bakış](/tr/start/onboarding-overview)
- macOS uygulamasında ilk katılım: [İlk katılım](/tr/start/onboarding)
- Ajanın ilk çalıştırma ritüeli: [Ajan Başlangıç Kurulumu](/tr/start/bootstrapping)
