---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici runbook'ları yazma
    - Bir becerinin gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
summary: 'Pazar yeri politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T00:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği beceri ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar özellikle pratiktir. Yalıtılmış anahtar kelimelerden çok, uçtan uca kötüye kullanım iş akışlarını önemseriz. Bir beceri savunmaları aşmak, platformları kötüye kullanmak, insanları dolandırmak, mahremiyeti ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulduysa ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias’larını ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulan kontrol arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti istemleri.
- Açık kimlik bilgileri, şeffaf kurulum ve kuru çalıştırma ya da önizleme modlarıyla kişisel veya ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı dokümantasyon, geçiş çalışma kılavuzları, geliştirici araçları ve test fikstürleri.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları yenmek için tasarlanmış gizli kazıma, canlı arama veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaklardan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çok hesaplı otomasyon, toplu gönderi, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazaryeri veya sosyal otomasyon.

- Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirme yapılmasını sağlayan araçlar ya da dolandırıcılık için hesap oluşturmak üzere hazırlanmış sentetik kimlik iş akışları.

- Mahremiyeti ihlal eden kazıma, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerinin büyük ölçekte kazınması, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonelleştirme.

- Rıza dışı kimliğe bürünme veya aldatıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte kişiler, klonlanmış influencer’lar veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenlikleri devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan beceriler.

- Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş gizli bilgi gereksinimleri, beyan edilmemiş özel anahtar kullanımı, açık incelenebilirlik olmadan uzak `npx @latest` çalıştırma, becerinin çalışmak için gerçekten neye ihtiyaç duyduğunu saklayan yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazaryeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcıların eşleştirme kodlarını otomatik alacağı şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir.”
- “Herhangi bir kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik oluştur.”
- “Potansiyel müşterileri kazı, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir beceri açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Yaptırım

- İhlal eden becerileri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan ya da ağır ihlallerde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı verilmesini garanti etmeyiz.
