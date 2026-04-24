---
read_when:
    - macOS ilk kullanım asistanını tasarlama
    - Kimlik doğrulama veya kimlik kurulumu uygulama
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw için ilk çalıştırma kurulum akışı (macOS uygulaması)
title: İlk kullanım akışı (macOS uygulaması)
x-i18n:
    generated_at: "2026-04-24T09:31:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Bu belge **geçerli** ilk çalıştırma kurulum akışını açıklar. Amaç,
sorunsuz bir “0. gün” deneyimidir: Gateway'in nerede çalışacağını seçmek, kimlik doğrulamayı bağlamak, sihirbazı çalıştırmak ve
agent'ın kendini bootstrap etmesine izin vermek.
İlk kullanım yollarına genel bakış için bkz. [İlk Kullanım Genel Bakışı](/tr/start/onboarding-overview).

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
<Step title="Hoş geldiniz ve güvenlik bildirimi">
<Frame caption="Gösterilen güvenlik bildirimini okuyun ve buna göre karar verin">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Güvenlik güven modeli:

- Varsayılan olarak OpenClaw kişisel bir agent'tır: tek güvenilen operatör sınırı.
- Paylaşılan/çok kullanıcılı kurulumlar sıkılaştırma gerektirir (güven sınırlarını ayırın, araç erişimini en düşük düzeyde tutun ve [Security](/tr/gateway/security) belgesini izleyin).
- Yerel ilk kullanım akışı artık yeni yapılandırmalarda varsayılan olarak `tools.profile: "coding"` kullanır; böylece yeni yerel kurulumlar sınırsız `full` profilini zorlamadan dosya sistemi/çalışma zamanı araçlarını korur.
- Hooks/Webhook'lar veya güvenilmeyen başka içerik beslemeleri etkinse güçlü, modern bir model katmanı kullanın ve katı araç ilkesi/sandboxing koruyun.

</Step>
<Step title="Yerel ve Uzak">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** nerede çalışıyor?

- **Bu Mac (yalnızca yerel):** ilk kullanım akışı kimlik doğrulamayı yapılandırabilir ve
  kimlik bilgilerini yerelde yazabilir.
- **Uzak (SSH/Tailnet üzerinden):** ilk kullanım akışı yerel kimlik doğrulamayı **yapılandırmaz**;
  kimlik bilgileri gateway ana makinesinde موجود olmalıdır.
- **Daha sonra yapılandır:** kurulumu atlayın ve uygulamayı yapılandırılmamış bırakın.

<Tip>
**Gateway kimlik doğrulama ipucu:**

- Sihirbaz artık loopback için bile bir **token** üretir; bu nedenle yerel WS istemcileri kimlik doğrulaması yapmalıdır.
- Kimlik doğrulamayı devre dışı bırakırsanız herhangi bir yerel işlem bağlanabilir; bunu yalnızca tamamen güvenilen makinelerde kullanın.
- Çok makineli erişim veya loopback olmayan bind'ler için **token** kullanın.

</Tip>
</Step>
<Step title="İzinler">
<Frame caption="OpenClaw'a hangi izinleri vermek istediğinizi seçin">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

İlk kullanım akışı şu izinler için gerekli TCC izinlerini ister:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>Bu adım isteğe bağlıdır</Info>
  Uygulama, global `openclaw` CLI'yi npm, pnpm veya bun ile kurabilir.
  Önce npm'yi, sonra pnpm'yi, bun yalnızca algılanan tek paket yöneticisi ise onu tercih eder.
  Gateway çalışma zamanı için önerilen yol hâlâ Node'dur.
</Step>
<Step title="İlk Kullanım Sohbeti (ayrılmış oturum)">
  Kurulumdan sonra uygulama, agent'ın
  kendini tanıtabilmesi ve sonraki adımlarda rehberlik edebilmesi için ayrılmış bir ilk kullanım sohbet oturumu açar. Bu, ilk çalıştırma rehberliğini
  normal konuşmanızdan ayrı tutar. İlk agent çalıştırması sırasında gateway ana makinesinde neler olduğu için
  bkz. [Bootstrapping](/tr/start/bootstrapping).
</Step>
</Steps>

## İlgili

- [İlk kullanım genel bakışı](/tr/start/onboarding-overview)
- [Başlangıç](/tr/start/getting-started)
