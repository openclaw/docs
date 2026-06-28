---
read_when:
    - ClawHub güvenlik sorunu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-06-28T00:20:09Z"
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

- ClawHub web sitesi, API'si veya CLI'si
- kayıt defterine yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir becerinin veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub danışmalarını kullanmayın. Bunları doğrudan yayıncıya veya ClawHub listelemesinden bağlantı verilen kaynak deposuna bildirin.

## Güvenlik açığı ifşası

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık şekilde ifşa edilmez. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde ifşa edilirler.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, bir platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu önlemler almasını gerektiren herhangi bir sorun verilebilir.

Kullanıcıların yerel olarak güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer yayın yapıtları gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde ifşa edilir.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk düzeyleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/tr/clawhub/security-audits) bölümüne bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın.
