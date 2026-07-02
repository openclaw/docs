---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı açıklamasını anlama
    - ClawHub platform sorunlarını üçüncü taraf beceri veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-02T08:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories üzerinden bildirilebilir.

ClawHub’ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub güvenlik danışmanlığı raporları şu alanlardaki hataları içerir:

- ClawHub web sitesi, API’si veya CLI’ı
- kayıt defteri yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token’ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill’in veya plugin’in kendi kaynak kodundaki güvenlik açıkları için ClawHub güvenlik danışmanlıklarını kullanmayın. Bunları doğrudan ClawHub listesinden bağlantı verilen yayıncıya veya kaynak deposuna bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların eylem alması gerektiğinde herkese açıklanırlar.

Gerçek kullanıcı etkisi örnekleri arasında doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, bir platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması veya kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini ya da başka koruyucu eylemler almasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kütüphaneler veya diğer sürüm yapıtları gibi kullanıcı tarafından kurulan yazılımlardaki güvenlik açıkları herkese açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listeler, yasaklar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
