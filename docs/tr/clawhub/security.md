---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-01T08:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub’ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub güvenlik danışmanlığı raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API veya CLI
- kayıt yayınlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token’ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir becerinin veya plugin’in kendi kaynak kodundaki güvenlik açıkları için ClawHub danışmanlıklarını kullanmayın. Bunları doğrudan yayıncıya veya ClawHub listesinden bağlantı verilen kaynak deposuna bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğu için ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde açıklanırlar.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlemler almasını gerektiren herhangi bir sorun verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kütüphaneler veya diğer yayın yapıtları gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk seviyeleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listeler, yasaklar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
