---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-11T20:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği Skills ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Bizim için en önemli olan, yalnızca ayrı anahtar kelimeler değil, uçtan uca kötüye kullanım iş akışlarıdır. Bir Skills, savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışı mümkün kılmak için oluşturulmuşsa ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz güncel örüntüler

- Gerçek bileşenler, anlamsal token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias’ları ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulan denetim arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti istemleri.
- Açık kimlik bilgileri, şeffaf kurulum ve deneme çalıştırması ya da önizleme modlarıyla kişisel veya ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılıma kapsamlandırılmış dokümantasyon, geçiş runbook’ları, geliştirici yardımcı araçları ve test fixture’ları.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları aşmak için tasarlanmış gizli scraping, canlı arama veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaklardan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı iletişim, sahte sosyal kanıt, net insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeyi mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini geniş ölçekte scraping ile toplama, doxxing, takip, istenmeyen iletişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı taklit veya aldatıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte kişilikler, klonlanmış influencer’lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan Skills.

- Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş secret gereksinimleri, beyan edilmemiş özel anahtar kullanımı, net incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma, Skills’in çalışması için gerçekten neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz güncel örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcıların eşleştirme kodlarını otomatik alacağı şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemez otomasyonla geliştir.”
- “Rastgele kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışıyken NSFW içerik üret.”
- “Potansiyel müşterileri scraping ile topla, kişileri zenginleştir ve geniş ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyenler için notlar

- Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir Skills açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme eğiliminde olmalıyız.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Uygulama

- İhlal eden Skills’i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete ile silebilir ve tekrarlayan ya da ciddi ihlal yapanları yasaklayabiliriz.
- Açık kötüye kullanım durumlarında önce uyarı verme uygulamasını garanti etmeyiz.
