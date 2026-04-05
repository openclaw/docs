---
read_when:
    - macOS onboarding asistanını tasarlarken
    - Kimlik doğrulama veya kimlik kurulumunu uygularken
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw için ilk çalıştırma kurulum akışı (macOS uygulaması)
title: Onboarding (macOS Uygulaması)
x-i18n:
    generated_at: "2026-04-05T14:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (macOS Uygulaması)

Bu belge, **mevcut** ilk çalıştırma kurulum akışını açıklar. Amaç; akıcı bir
“0. gün” deneyimi sunmaktır: Gateway'in nerede çalışacağını seçin, kimlik doğrulamayı bağlayın, sihirbazı çalıştırın ve ajanın kendini önyüklemesine izin verin.
Onboarding yollarına genel bakış için bkz. [Onboarding Genel Bakış](/start/onboarding-overview).

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

- Varsayılan olarak OpenClaw kişisel bir ajandır: tek bir güvenilen operatör sınırı.
- Paylaşılan/çok kullanıcılı kurulumlar sıkılaştırma gerektirir (güven sınırlarını ayırın, araç erişimini minimumda tutun ve [Security](/tr/gateway/security) belgesini izleyin).
- Yerel onboarding artık yeni config'lerde varsayılan olarak `tools.profile: "coding"` kullanır; böylece yeni yerel kurulumlar, sınırsız `full` profilini zorunlu kılmadan dosya sistemi/çalışma zamanı araçlarını korur.
- Hooks/webhooks veya güvenilmeyen başka içerik beslemeleri etkinse, güçlü ve modern bir model katmanı kullanın ve araç politikasını/sandboxing'i sıkı tutun.

</Step>
<Step title="Yerel ve Uzak">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** nerede çalışıyor?

- **Bu Mac'te (yalnızca yerel):** onboarding, kimlik doğrulamayı yapılandırabilir ve kimlik bilgilerini yerel olarak yazabilir.
- **Uzakta (SSH/Tailnet üzerinden):** onboarding yerel kimlik doğrulamayı **yapılandırmaz**; kimlik bilgilerinin gateway host üzerinde mevcut olması gerekir.
- **Daha sonra yapılandır:** kurulumu atlayın ve uygulamayı yapılandırılmamış bırakın.

<Tip>
**Gateway kimlik doğrulama ipucu:**

- Sihirbaz artık loopback için bile bir **token** oluşturur; bu yüzden yerel WS istemcileri kimlik doğrulaması yapmalıdır.
- Kimlik doğrulamayı devre dışı bırakırsanız, herhangi bir yerel süreç bağlanabilir; bunu yalnızca tamamen güvenilen makinelerde kullanın.
- Çok makineli erişim veya loopback dışı bind'ler için bir **token** kullanın.

</Tip>
</Step>
<Step title="İzinler">
<Frame caption="OpenClaw'a hangi izinleri vermek istediğinizi seçin">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding, şunlar için gereken TCC izinlerini ister:

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
  Uygulama, global `openclaw` CLI aracını npm, pnpm veya bun üzerinden kurabilir.
  Önce npm'yi, sonra pnpm'yi, yalnızca tespit edilen paket yöneticisi buysa en son bun'ı tercih eder.
  Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.
</Step>
<Step title="Onboarding Sohbeti (ayrı oturum)">
  Kurulumdan sonra uygulama, ajanın kendini tanıtması ve sonraki adımları yönlendirmesi için ayrı bir onboarding sohbet oturumu açar.
  Bu, ilk çalıştırma yönlendirmesini normal sohbetinizden ayrı tutar. İlk ajan çalıştırmasında gateway host üzerinde neler olduğunu görmek için [Bootstrapping](/start/bootstrapping) belgesine bakın.
</Step>
</Steps>
