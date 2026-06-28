---
read_when:
    - ClawHub güvenlik sorunu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf skill veya plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman herkese açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-06-28T08:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub güvenlik bildirimi raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API veya CLI
- kayıt defteri yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub bildirimlerini kullanmayın. Bunları doğrudan ClawHub listesinden bağlantı verilen yayıncıya veya kaynak depoya bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde açıklanırlar.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu işlem yapmasını gerektiren herhangi bir sorun verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kütüphaneler veya diğer sürüm yapıtları gibi kullanıcı tarafından kurulan yazılımlardaki güvenlik açıkları herkese açık şekilde açıklanır.

## İlgili sayfalar

Kurulum zamanındaki denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için bkz. [Güvenlik Denetimleri](/tr/clawhub/security-audits).

Pazar yeri raporları, moderasyon bekletmeleri, gizli listeler, yasaklamalar ve hesap durumu için bkz. [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).
