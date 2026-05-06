---
read_when:
    - macOS ilk kurulum asistanını tasarlama
    - Kimlik doğrulama veya kimlik kurulumunu uygulama
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw için ilk çalıştırma kurulum akışı (macOS uygulaması)
title: İlk kurulum (macOS uygulaması)
x-i18n:
    generated_at: "2026-05-06T09:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Bu belge **mevcut** ilk çalıştırma kurulum akışını açıklar. Amaç,
sorunsuz bir "0. gün" deneyimidir: Gateway'in nerede çalışacağını seçmek, kimlik doğrulamayı bağlamak, sihirbazı çalıştırmak ve ajanın kendini başlatmasına izin vermek.
Katılım yollarına genel bir bakış için bkz. [Katılım Genel Bakışı](/tr/start/onboarding-overview).

<Steps>
<Step title="macOS uyarısını onaylayın">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Yerel ağları bulmayı onaylayın">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Karşılama ve güvenlik bildirimi">
<Frame caption="Gösterilen güvenlik bildirimini okuyun ve buna göre karar verin">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Güvenlik güven modeli:

- Varsayılan olarak OpenClaw kişisel bir ajandır: tek bir güvenilir operatör sınırı.
- Paylaşılan/çok kullanıcılı kurulumlar sıkılaştırma gerektirir (güven sınırlarını ayırın, araç erişimini minimumda tutun ve [Güvenlik](/tr/gateway/security) yönergelerini izleyin).
- Yerel katılım artık yeni yapılandırmalarda varsayılan olarak `tools.profile: "coding"` kullanır; böylece yeni yerel kurulumlar, sınırsız `full` profilini zorunlu kılmadan dosya sistemi/çalışma zamanı araçlarını korur.
- Hook/webhook'lar veya diğer güvenilmeyen içerik beslemeleri etkinse, güçlü ve modern bir model katmanı kullanın ve sıkı araç politikası/korumalı alan uygulayın.

</Step>
<Step title="Yerel ve Uzak">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** nerede çalışır?

- **Bu Mac (Yalnızca yerel):** katılım, kimlik doğrulamayı yapılandırabilir ve kimlik bilgilerini
  yerel olarak yazabilir.
- **Uzak (SSH/Tailnet üzerinden):** katılım yerel kimlik doğrulamayı yapılandırmaz;
  kimlik bilgilerinin gateway ana makinesinde mevcut olması gerekir.
- **Daha sonra yapılandır:** kurulumu atlayın ve uygulamayı yapılandırılmamış bırakın.

<Tip>
**Gateway kimlik doğrulama ipucu:**

- Sihirbaz artık loopback için bile bir **token** oluşturur, bu yüzden yerel WS istemcilerinin kimlik doğrulaması yapması gerekir.
- Kimlik doğrulamayı devre dışı bırakırsanız herhangi bir yerel süreç bağlanabilir; bunu yalnızca tamamen güvenilir makinelerde kullanın.
- Çok makineli erişim veya loopback dışı bağlamalar için bir **token** kullanın.

</Tip>
</Step>
<Step title="İzinler">
<Frame caption="OpenClaw'a hangi izinleri vermek istediğinizi seçin">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Katılım, şunlar için gereken TCC izinlerini ister:

- Otomasyon (AppleScript)
- Bildirimler
- Erişilebilirlik
- Ekran Kaydı
- Mikrofon
- Konuşma Tanıma
- Kamera
- Konum

</Step>
<Step title="CLI">
  <Info>Bu adım isteğe bağlıdır</Info>
  Uygulama, genel `openclaw` CLI'yi npm, pnpm veya bun aracılığıyla yükleyebilir.
  Önce npm'i, ardından pnpm'i, yalnızca algılanan paket yöneticisi oysa bun'ı tercih eder.
  Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.
</Step>
<Step title="Katılım Sohbeti (adanmış oturum)">
  Kurulumdan sonra uygulama, ajanın kendini tanıtabilmesi ve sonraki adımlara
  rehberlik edebilmesi için adanmış bir katılım sohbet oturumu açar. Bu, ilk çalıştırma rehberliğini
  normal konuşmanızdan ayrı tutar. İlk ajan çalıştırması sırasında gateway ana makinesinde
  neler olduğunu öğrenmek için bkz. [Başlatma](/tr/start/bootstrapping).
</Step>
</Steps>

## İlgili

- [Katılım genel bakışı](/tr/start/onboarding-overview)
- [Başlarken](/tr/start/getting-started)
