---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya duyurulduğu.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-12T12:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories aracılığıyla bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub güvenlik bildirimi raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API'si veya CLI'ı
- kayıt defterinde yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub güvenlik bildirimlerini kullanmayın. Bunları doğrudan ClawHub listelemesinde bağlantısı verilen yayıncıya veya kaynak kod deposuna bildirin.

## Güvenlik açığı bildirimi

ClawHub, barındırılan bir bulut uygulaması olduğundan ClawHub hizmetindeki güvenlik açıkları varsayılan olarak kamuya açıklanmaz. Gerçek kullanıcı etkisine dair kanıt bulunduğunda veya kullanıcıların işlem yapması gerektiğinde kamuya açıklanırlar.

Gerçek kullanıcı etkisine; doğrulanmış istismar, kullanıcı verilerinin veya gizli bilgilerinin açığa çıkması, platformdaki bir arıza nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini yenilemesini, yerel yazılımı güncellemesini veya başka bir koruyucu önlem almasını gerektiren herhangi bir sorun örnek verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer sürüm yapıtları gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları kamuya açıklanır.

## İlgili sayfalar

Kurulum sırasındaki denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) sayfasına bakın.
