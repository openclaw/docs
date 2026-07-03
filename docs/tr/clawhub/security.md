---
read_when:
    - ClawHub güvenlik sorunu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman kamuya açık olarak duyurulduğu.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-03T02:55:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub’ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub advisory raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API’si veya CLI’si
- kayıt yayımlama, indirmeler, kurulumlar veya artifact bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token’ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya Plugin’in kendi kaynak kodundaki güvenlik açıkları için ClawHub advisory’lerini kullanmayın. Bunları doğrudan ClawHub listelemesinden bağlantısı verilen yayıncıya veya kaynak depoya bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde bildirilmez. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde bildirilirler.

Gerçek kullanıcı etkisi örnekleri arasında doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlem almasını gerektiren herhangi bir sorun bulunur.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer sürüm artifact’leri gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde bildirilir.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk seviyeleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Marketplace raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
