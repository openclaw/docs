---
read_when:
    - macOS işe alıştırma asistanını tasarlama
    - Kimlik doğrulama veya kimlik kurulumu uygulama
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw için ilk çalıştırma kurulum akışı (macOS uygulaması)
title: İlk Kurulum (macOS uygulaması)
x-i18n:
    generated_at: "2026-06-28T01:19:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Bu belge **mevcut** ilk çalıştırma kurulum akışını açıklar. Amaç,
sorunsuz bir "0. gün" deneyimidir: Gateway'in nerede çalışacağını seçmek, kimlik doğrulamayı bağlamak, sihirbazı çalıştırmak
ve aracının kendini başlatmasına izin vermek.
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

- Varsayılan olarak OpenClaw kişisel bir aracıdır: tek bir güvenilir operatör sınırı.
- Paylaşımlı/çok kullanıcılı kurulumlar sıkılaştırma gerektirir (güven sınırlarını ayırın, araç erişimini en düşük düzeyde tutun ve [Güvenlik](/tr/gateway/security) yönergelerini izleyin).
- Yerel katılım artık yeni yapılandırmalarda varsayılan olarak `tools.profile: "coding"` kullanır; böylece yeni yerel kurulumlar, sınırsız `full` profilini zorunlu kılmadan dosya sistemi/çalışma zamanı araçlarını korur.
- Hook'lar/Webhook'lar veya diğer güvenilmeyen içerik akışları etkinse, güçlü ve modern bir model katmanı kullanın ve sıkı araç politikası/sandboxing uygulayın.

</Step>
<Step title="Yerel ve Uzak">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** nerede çalışır?

- **Bu Mac (Yalnızca yerel):** katılım, kimlik doğrulamayı yapılandırabilir ve kimlik bilgilerini
  yerel olarak yazabilir.
- **Uzak (SSH/Tailnet üzerinden):** katılım, yerel kimlik doğrulamayı **yapılandırmaz**;
  kimlik bilgileri gateway ana makinesinde mevcut olmalıdır. Uzak gateway token alanı,
  macOS uygulamasının bu Gateway'e bağlanmak için kullandığı token'ı depolar; mevcut
  düz metin olmayan `gateway.remote.token` değerleri siz değiştirene kadar korunur.
- **Daha sonra yapılandır:** kurulumu atlayın ve uygulamayı yapılandırılmamış bırakın.

<Tip>
**Gateway kimlik doğrulama ipucu:**

- Sihirbaz artık loopback için bile bir **token** oluşturur; bu nedenle yerel WS istemcileri kimlik doğrulaması yapmalıdır.
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
  Uygulama, global `openclaw` CLI'ını npm, pnpm veya bun üzerinden yükleyebilir.
  Önce npm'i, ardından pnpm'i, yalnızca algılanan paket yöneticisi buysa bun'ı tercih eder.
  Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.
</Step>
<Step title="Katılım Sohbeti (özel oturum)">
  Kurulumdan sonra uygulama, aracının kendini tanıtabilmesi ve sonraki adımları yönlendirebilmesi için
  özel bir katılım sohbet oturumu açar. Bu, ilk çalıştırma yönlendirmesini
  normal konuşmanızdan ayrı tutar. İlk aracı çalıştırması sırasında gateway ana makinesinde
  neler olduğunu görmek için bkz. [Önyükleme](/tr/start/bootstrapping).
</Step>
</Steps>

## İlgili

- [Katılım genel bakışı](/tr/start/onboarding-overview)
- [Başlarken](/tr/start/getting-started)
