---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf skill veya plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman kamuya açık olarak duyurulduğu.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-02T01:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Güvenlik Danışma Bildirimleri üzerinden bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Güvenlik Danışma Bildirimleri'ni kullanın. İyi ClawHub danışma bildirimi raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API veya CLI
- kayıt defteri yayımlama, indirmeler, kurulumlar veya yapı bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub danışma bildirimlerini kullanmayın. Bunları doğrudan ClawHub listelemesinde bağlantısı verilen yayımlayıcıya veya kaynak depoya bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde açıklanırlar.

Gerçek kullanıcı etkisine örnekler arasında doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması veya kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini ya da başka koruyucu işlem yapmasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer yayın yapıları gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk seviyeleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
