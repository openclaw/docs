---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildiriminin anlaşılması
    - ClawHub platform sorunlarını üçüncü taraf skill veya plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya duyurulacağı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-16T16:45:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, GitHub Security Advisories aracılığıyla
`openclaw/clawhub` için bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi
ClawHub güvenlik bildirimi raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API'si veya CLI'si
- kayıt defterinde yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token'ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill'in veya
plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub bildirimlerini kullanmayın. Bunları doğrudan ClawHub listelemesinde bağlantısı verilen yayıncıya veya kaynak
deposuna bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları
varsayılan olarak kamuya açıklanmaz. Gerçek kullanıcı etkisine dair
kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde kamuya açıklanır.

Gerçek kullanıcı etkisi örnekleri arasında doğrulanmış istismar, kullanıcı
verilerinin veya gizli bilgilerinin açığa çıkması, bir platform arızası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması
ya da kullanıcıların kimlik bilgilerini yenilemesini, yerel yazılımı güncellemesini veya
başka bir koruyucu önlem almasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerel olarak
güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer sürüm yapıtları gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları kamuya açıklanır.

## İlgili sayfalar

Kurulum sırasındaki denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için
[Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap
durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
