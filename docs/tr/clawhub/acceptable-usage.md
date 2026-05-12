---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T23:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub'ın hangi tür Skills ve içerikleri kabul ettiğini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar özellikle pratiktir. Yalnızca yalıtılmış anahtar sözcükler değil, en çok uçtan uca kötüye kullanım iş akışlarıyla ilgileniriz. Bir Skill savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulmuşsa ClawHub'da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, semantik belirteçler, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje takma adlarını ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 türleri kullanan ve üretilen denetim arayüzlerini incelenebilir tutan UI5 JavaScript'ten TypeScript'e dönüşümü.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti istemleri.
- Açık kimlik bilgileri, şeffaf kurulum ve dry-run ya da önizleme modlarıyla kişisel veya ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı dokümantasyon, geçiş runbook'ları, geliştirici yardımcı araçları ve test fixture'ları.

## Kabul edilmez

- Güvenliği atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları aşmak üzere tasarlanmış gizli scraping, canlı arama veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaktan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak üzere oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, net insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirme yapılmasını sağlayan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini büyük ölçekte scraping ile toplama, doxxing, takipçilik, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı taklit veya aldatıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte personalar, klonlanmış influencer'lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan Skills.

- Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, bildirilmemiş gizli anahtar gereksinimleri, bildirilmemiş özel anahtar kullanımı, net incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma, Skill'in gerçekten çalışmak için neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcıların otomatik olarak eşleştirme kodları alacağı şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir.”
- “Rastgele kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik üret.”
- “Potansiyel müşterileri scrape et, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla veya indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile e-posta ya da sosyal hesapları toplu oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir Skill açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme eğiliminde olmalıyız.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Yaptırım

- İhlal eden Skills'i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token'ları iptal edebilir, ilişkili içeriği soft-delete edebilir ve tekrarlayan ya da ağır ihlalde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım durumlarında önce uyarı yapılacağını garanti etmeyiz.
