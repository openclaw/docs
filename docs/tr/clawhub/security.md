---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-04T04:02:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Güvenlik Danışmaları
üzerinden bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Güvenlik Danışmaları'nı
kullanın. İyi ClawHub danışma bildirimleri şunlardaki hataları içerir:

- ClawHub web sitesi, API veya CLI
- kayıt defteri yayımlama, indirmeler, kurulumlar veya yapıt bütünlüğü
- kimlik doğrulama, yetkilendirme veya API belirteçleri
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir skill veya Plugin'in kendi kaynak kodundaki güvenlik açıkları
için ClawHub danışmalarını kullanmayın. Bunları doğrudan yayıncıya veya ClawHub
listelemesinden bağlantı verilen kaynak deposuna bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğu için ClawHub hizmeti güvenlik
açıkları varsayılan olarak herkese açıklanmaz. Gerçek kullanıcı etkisine dair
kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açıklanır.

Gerçek kullanıcı etkisine örnek olarak doğrulanmış istismar, kullanıcı verilerinin
veya gizli bilgilerinin açığa çıkması, platform hatası nedeniyle kötü amaçlı
içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini
döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu işlem yapmasını
gerektiren herhangi bir sorun verilebilir.

ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya kullanıcıların yerelde
güncellemesi gereken diğer yayın yapıtları gibi kullanıcı tarafından kurulan
yazılımlardaki güvenlik açıkları herkese açıklanır.

## İlgili sayfalar

Kurulum zamanındaki denetim etiketleri, risk düzeyleri, bulgular ve yorumlama
için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve
hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne
bakın.
