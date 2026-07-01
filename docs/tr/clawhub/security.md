---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman herkese açık olarak duyurulacağı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-01T18:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub’ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub danışma raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API’si veya CLI’si
- registry yayınlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya Plugin’in kendi kaynak kodundaki güvenlik açıkları için ClawHub danışma bildirimlerini kullanmayın. Bunları doğrudan ClawHub listesinden bağlantı verilen yayıncıya veya kaynak depoya bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak kamuya açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde kamuya açıklanırlar.

Gerçek kullanıcı etkisi örnekleri arasında doğrulanmış istismar, kullanıcı verilerinin veya gizli bilgilerin açığa çıkması, bir platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlemler almasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerelde güncellemesi gereken ClawHub CLI paketleri, ikili dosyaları, kitaplıkları veya diğer sürüm yapıtları gibi kullanıcı tarafından kurulan yazılımlardaki güvenlik açıkları kamuya açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
