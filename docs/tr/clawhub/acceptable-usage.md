---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici operasyon kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-13T04:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub'ın kabul ettiği Skills türlerini ve içerikleri, ayrıca barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Bizim için en önemli olan, yalnızca izole anahtar sözcükler değil, uçtan uca kötüye kullanım iş akışlarıdır. Bir Skill savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulmuşsa ClawHub'da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal token'lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine yüklü kaynak bileşenleri, proje alias'larını ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulmuş kontrol arayüzlerini gözden geçirilebilir tutan UI5 JavaScript'ten TypeScript'e dönüşüm.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti prompt'ları.
- Açık kimlik bilgileri, şeffaf kurulum ve dry-run ya da önizleme modlarıyla kişisel veya ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılıma kapsamlandırılmış dokümantasyon, geçiş runbook'ları, geliştirici yardımcı araçları ve test fixture'ları.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları yenmek için tasarlanmış gizli scraping, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaklardan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/yetiştirme, sahte etkileşim, karma veya takipçi geliştirme, çok hesaplı otomasyon, toplu gönderim, spam botları, tespit edilmekten kaçınacak şekilde oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, sahtekarlıklar ve aldatıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya tahsilat yapmayı mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini ölçekli biçimde scraping ile toplama, doxxing, stalking, istenmeyen erişimle eşleştirilmiş lead çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı taklit veya aldatıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte person'lar, klonlanmış influencer'lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenlik devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görüntü/video/içerik üretimi, üçüncü taraf API'lerin etrafındaki yetişkin içerik wrapper'ları veya birincil amacı açık cinsel içerik olan Skills.

- Gizli, güvensiz veya yanıltıcı yürütme gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş gizli bilgi gereksinimleri, beyan edilmemiş özel anahtar kullanımı, net gözden geçirilebilirlik olmadan uzak `npx @latest` yürütmesi, Skill'in çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar otomatik olarak eşleştirme kodları alacak şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik oluştur.”
- “Lead'leri scrape et, kişileri zenginleştir ve ölçekli soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla veya indir.”
- “Sentetik kimlikler veya CAPTCHA çözümüyle toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyenler için notlar

- Bağlam önemlidir. Aynı konu dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir Skill açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizlemek ve hesabı yasaklamak için gerekçedir.

## Yaptırım

- İhlal eden Skills'i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token'ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan ya da ağır ihlal yapanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı verme garantisi sunmayız.
