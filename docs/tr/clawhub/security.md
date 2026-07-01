---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı bildirimini anlama
    - ClawHub platform sorunlarını üçüncü taraf Skills veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarının nasıl bildirileceği ve güvenlik açıklarının ne zaman kamuya açıklandığı.
title: Güvenlik
x-i18n:
    generated_at: "2026-07-01T20:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Security Advisories aracılığıyla bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Security Advisories kullanın. İyi ClawHub advisory raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API'si veya CLI'si
- registry yayımlama, indirmeler, kurulumlar veya artifact bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token'ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf skill veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub advisories kullanmayın. Bunları doğrudan yayımcıya veya ClawHub kaydından bağlantı verilen kaynak repository'ye bildirin.

## Güvenlik açığı bildirimi

ClawHub barındırılan bir bulut uygulaması olduğu için ClawHub servis güvenlik açıkları varsayılan olarak herkese açık şekilde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık şekilde açıklanırlar.

Gerçek kullanıcı etkisine örnekler arasında doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, bir platform hatası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu işlem yapmasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerelde güncellemesi gereken ClawHub CLI paketleri, binary'ler, kitaplıklar veya diğer release artifact'leri gibi kullanıcı tarafından yüklenen yazılımlardaki güvenlik açıkları herkese açık şekilde açıklanır.

## İlgili sayfalar

Kurulum zamanı audit etiketleri, risk düzeyleri, bulgular ve yorumlama için [Security Audits](/clawhub/security-audits) bölümüne bakın.

Marketplace raporları, moderasyon bekletmeleri, gizli listeler, yasaklamalar ve hesap durumu için [Moderation and Account Safety](/clawhub/moderation) bölümüne bakın.
