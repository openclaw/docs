---
read_when:
    - ClawHub güvenlik sorununu bildirme
    - ClawHub güvenlik açığı ifşasını anlama
    - ClawHub platform sorunlarını üçüncü taraf beceri veya Plugin sorunlarından ayırt etme
sidebarTitle: Security
summary: ClawHub güvenlik sorunlarını nasıl bildireceğiniz ve güvenlik açıklarının ne zaman kamuya açık olarak duyurulduğu.
title: Güvenlik
x-i18n:
    generated_at: "2026-06-28T07:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik

ClawHub güvenlik sorunları, `openclaw/clawhub` için GitHub Güvenlik Danışma Bildirimleri üzerinden bildirilebilir.

ClawHub'ın kendisindeki güvenlik açıkları için GitHub Güvenlik Danışma Bildirimleri'ni kullanın. İyi ClawHub güvenlik danışma bildirimi raporları şunlardaki hataları içerir:

- ClawHub web sitesi, API'si veya CLI'ı
- kayıt yayımlama, indirmeler, kurulumlar veya artifact bütünlüğü
- kimlik doğrulama, yetkilendirme veya API token'ları
- tarama, moderasyon veya rapor işleme

Üçüncü taraf bir becerinin veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub güvenlik danışma bildirimlerini kullanmayın. Bunları doğrudan ClawHub listesinden bağlantısı verilen yayımcıya veya kaynak deposuna bildirin.

## Güvenlik açığı açıklaması

ClawHub barındırılan bir bulut uygulaması olduğundan, ClawHub hizmet güvenlik açıkları varsayılan olarak herkese açık biçimde açıklanmaz. Gerçek kullanıcı etkisine dair kanıt olduğunda veya kullanıcıların işlem yapması gerektiğinde herkese açık biçimde açıklanırlar.

Gerçek kullanıcı etkisi örnekleri arasında doğrulanmış istismar, kullanıcı verilerinin veya sırlarının açığa çıkması, bir platform arızası nedeniyle kötü amaçlı içeriğin kullanıcılara ulaşması ya da kullanıcıların kimlik bilgilerini döndürmesini, yerel yazılımı güncellemesini veya başka koruyucu işlem yapmasını gerektiren herhangi bir sorun yer alır.

Kullanıcıların yerelde güncellemesi gereken ClawHub CLI paketleri, ikili dosyalar, kitaplıklar veya diğer sürüm artifact'leri gibi kullanıcı tarafından kurulan yazılımlardaki güvenlik açıkları herkese açık biçimde açıklanır.

## İlgili sayfalar

Kurulum zamanı denetim etiketleri, risk seviyeleri, bulgular ve yorumlama için [Güvenlik Denetimleri](/tr/clawhub/security-audits) bölümüne bakın.

Pazar yeri raporları, moderasyon bekletmeleri, gizli listeler, yasaklamalar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın.
