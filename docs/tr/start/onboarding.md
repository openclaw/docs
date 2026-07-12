---
read_when:
    - macOS ilk katılım yardımcısını tasarlama
    - Kimlik doğrulama veya kimlik kurulumunu uygulama
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw için ilk çalıştırma kurulum akışı (macOS uygulaması)
title: İlk kurulum (macOS uygulaması)
x-i18n:
    generated_at: "2026-07-12T12:15:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS uygulamasının ilk çalıştırma akışı: Gateway'in nerede çalışacağını seçin, doğrulanmış bir yapay zekâ arka ucuna bağlanın, izinleri verin ve denetimi ajanın kendi önyükleme ritüeline devredin.
CLI ilk katılımı ve iki yolun karşılaştırması için [İlk Katılıma Genel Bakış](/tr/start/onboarding-overview) bölümüne bakın.

<Steps>
<Step title="macOS uyarısını onaylayın">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Yerel ağları bulma iznini onaylayın">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Karşılama ve güvenlik bildirimi">
<Frame caption="Görüntülenen güvenlik bildirimini okuyun ve buna göre karar verin">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Güvenlik güven modeli:

- OpenClaw varsayılan olarak kişisel bir ajandır: tek bir güvenilir operatör sınırı.
- Paylaşımlı/çok kullanıcılı kurulumların sıkılaştırılması gerekir: güven sınırlarını ayırın, araç erişimini en düşük düzeyde tutun ve [Güvenlik](/tr/gateway/security) yönergelerini izleyin.
- Yerel ilk katılım, yeni yapılandırmalarda varsayılan olarak `tools.profile: "coding"` ayarını kullanır; böylece yeni kurulumlar, sınırsız `full` profili olmadan dosya sistemi/çalışma zamanı araçlarını korur.
- Kancalar/Webhook'lar veya diğer güvenilmeyen içerik akışları etkinleştirilirse güçlü ve modern bir model katmanı kullanın, ayrıca katı araç politikası ve korumalı alan uygulamasını sürdürün.

</Step>
<Step title="Yerel ve uzak">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** nerede çalışır?

- **Bu Mac (Yalnızca yerel):** İlk katılım, kimlik doğrulamayı yapılandırır ve kimlik bilgilerini yerel olarak yazar.
- **Uzak (SSH/Tailnet üzerinden):** İlk katılım yerel kimlik doğrulamayı yapılandırmaz;
  kimlik bilgileri Gateway ana makinesinde önceden mevcut olmalıdır. Uzak Gateway belirteci
  alanı, macOS uygulamasının bu Gateway'e bağlanmak için kullandığı belirteci saklar;
  mevcut `gateway.remote.token` SecretRef değerleri siz
  değiştirene kadar korunur.
- **Daha sonra yapılandır:** Kurulumu atlayın ve uygulamayı yapılandırılmamış durumda bırakın.

<Tip>
**Gateway kimlik doğrulama ipucu:**

- Gateway kimlik doğrulama modu, local loopback bağlamalarında bile varsayılan olarak `token` değerini kullanır; dolayısıyla yerel WS istemcilerinin kimlik doğrulaması gerekir.
- `gateway.auth.mode: "none"` ayarı, tüm yerel işlemlerin bağlanmasına izin verir; bunu yalnızca tamamen güvenilir makinelerde kullanın.
- Birden fazla makineden erişim veya local loopback dışındaki bağlamalar için belirteç kullanın.

</Tip>
</Step>
<Step title="CLI">
  Yerel kurulum, genel `openclaw` CLI'ını npm, pnpm veya bun aracılığıyla yükler
  ve öncelikle npm'i tercih eder. Gateway'in kendisi için önerilen çalışma zamanı
  Node olmaya devam eder. Mevcut uyumlu kurulumlar yeniden kullanılır.
</Step>
<Step title="Yapay zekânızı bağlayın">
  Yapılandırılmış bir ajan modeline zaten sahip olan bağlı bir Gateway, bu
  sayfayı tamamen atlar ve normal ajan kullanıcı arayüzünü açar. Crestodian ve sağlayıcı kurulumu
  yalnızca yeni veya eksik bir Gateway için çalışır.

Gateway hazır olduğunda ilk katılım, hâlihazırda sahip olduğunuz yapay zekâ erişimini arar:
Claude Code veya Codex oturumu ya da `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. En iyi seçenek gerçek bir tamamlama ile test edilir ve
yalnızca yanıt verdikten sonra kaydedilir; bir test başarısız olduğunda uygulama otomatik olarak
sonraki seçeneği dener ve önceki seçeneğin neden başarısız olduğunu gösterir. Birden fazla seçenek
bulunursa devam etmeden önce bunlar arasında geçiş yapabilirsiniz.

Gemini CLI, kurulumdan sonra normal ajanlar için kullanılabilir olmaya devam eder ancak
araçsız çıkarım yoklamasını zorunlu kılamadığı için burada
sunulmaz.

Sağlayıcının kendi OAuth veya cihaz eşleştirme akışı üzerinden de oturum açabilirsiniz.
Yerleşik seçenekler OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global ve CN ile Chutes'ı içerir. Liste, sabit bir uygulama listesinden
değil, Gateway'in etkin metin çıkarımı sağlayıcı Plugin'lerinden gelir;
böylece başka bir sağlayıcı, sağlayıcıya özgü macOS kodu eklenmeden katılabilir.

Manuel anahtar/belirteç seçici aynı sağlayıcı kayıt defterini kullanır. Her yolda
sağlayıcı, başlangıç modelini ve yapılandırmasını sunar; OpenClaw,
kimlik doğrulama profilini saklamadan önce kimlik bilgisini aynı canlı testle doğrular. Bir arka uç
başarılı olana kadar İleri kilitli kalır; böylece çalışan bir çıkarım olmadan
ilk ajan sohbeti başlatılamaz. Bu canlı denetim başarılı olduktan sonra Crestodian,
çalışma alanı, Gateway, kanallar ve diğer isteğe bağlı özelliklerin kalanını
yapılandırmaya yardımcı olmak için kullanılabilir hâle gelir; ayrıca daha sonra Settings → Crestodian altında da kullanılabilir.
</Step>
<Step title="İzinler">

<Frame caption="OpenClaw'a hangi izinleri vermek istediğinizi seçin">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

İlk katılım şu TCC izinlerini ister: Otomasyon (AppleScript), Bildirimler, Erişilebilirlik, Ekran Kaydı, Mikrofon, Konuşma Tanıma, Kamera ve Konum.

</Step>
<Step title="Tamamlayın">
  Çıkarım başarılı olduktan sonra kalan isteğe bağlı kurulumun sorumluluğunu Crestodian üstlenir ve
  sizi normal ajan sohbetine aktarabilir. İzin adımlarının tamamlanması
  aynı sohbeti açar; uygulama, Crestodian'dan önce bir çalışma alanı oluşturmaz veya ayrı bir
  ajan kurulumu konuşması başlatmaz. Ajanın ilk gerçek etkileşimi sırasında
  Gateway ana makinesinde neler olduğunu öğrenmek için
  [Önyükleme](/tr/start/bootstrapping) bölümüne bakın.
</Step>
</Steps>

## İlgili

- [İlk katılıma genel bakış](/tr/start/onboarding-overview)
- [Başlarken](/tr/start/getting-started)
