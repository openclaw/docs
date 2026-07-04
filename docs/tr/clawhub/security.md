---
read_when:
    - ClawHub güvenlik sorunu bildirme
    - ClawHub güvenlik açığı bildiriminin anlaşılması
    - ClawHub platform sorunlarını üçüncü taraf beceri veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-04T10:58:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub içindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub advisory raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API'si veya CLI'ı
- kayıt yayınlama, indirmeler, kurulumlar veya artifact bütünlüğü
- kimlik doğrulama, yetkilendirme veya API tokenları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf Skills veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub advisories kullanmayın. Bunları doğrudan yayıncıya veya ClawHub listelemesinden bağlantı verilen kaynak deposuna bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde açıklanırlar.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin veya gizli bilgilerinin açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlemler almasını gerektiren herhangi bir sorun verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer release artifact'leri gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Marketplace raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap durumu için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
