---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı açıklamasını anlama
    - ClawHub platform sorunlarını üçüncü taraf skill veya plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-04T20:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub güvenlik danışma raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API veya CLI
- kayıt yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token'ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill ya da plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub danışma raporlarını kullanmayın. Bunları doğrudan ClawHub listesinden bağlantısı verilen yayıncıya veya kaynak depoya bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğu için ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açıklanırlar.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlem almasını gerektiren herhangi bir sorun verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kütüphaneler veya diğer sürüm yapıtları gibi kullanıcı tarafından kurulan yazılımlardaki güvenlik açıkları herkese açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Pazar yeri raporları, moderasyon bekletmeleri, gizli listeler, yasaklamalar ve hesap durumu için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
