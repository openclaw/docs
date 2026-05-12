---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T15:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub'ın kabul ettiği beceri ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Yalnızca izole anahtar kelimeleri değil, en çok uçtan uca kötüye kullanım iş akışlarını önemseriz. Bir beceri savunmaları aşmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları etkinleştirmek için oluşturulmuşsa ClawHub'da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal token'lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias'larını ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 tipleri kullanan ve oluşturulan kontrol arayüzlerini incelenebilir tutan UI5 JavaScript'ten TypeScript'e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını açık tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım algılama prompt'ları.
- Açık kimlik bilgileri, şeffaf kurulum ve deneme çalıştırması veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı belgelendirme, geçiş runbook'ları, geliştirici yardımcı araçları ve test fixture'ları.

## Kabul edilmez

- Güvenliği aşma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya anti-bot kaçınması, hız sınırı atlatma, korumaları yenmek için tasarlanmış gizli scraping, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaklardan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu paylaşım, spam botları, tespit edilmekten kaçınacak şekilde oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeyi etkinleştiren araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini büyük ölçekte scraping ile toplama, doxxing, takip etme, istenmeyen erişimle eşleştirilmiş lead çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonelleştirme.

- Rıza dışı kimliğe bürünme veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: face swap, dijital ikizler, sahte personalar, klonlanmış influencer'lar veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görüntü/video/içerik üretimi, üçüncü taraf API'lerin etrafındaki yetişkin içerik wrapper'ları veya birincil amacı açık cinsel içerik olan beceriler.

- Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş secret gereksinimleri, beyan edilmemiş private key kullanımı, açık incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma, becerinin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- "Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur."
- "Onaylanmamış kullanıcıların eşleştirme kodlarını otomatik alması için Telegram eşleştirmesini değiştir."
- "Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir."
- "Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur."
- "Güvenlik denetimleri devre dışı bırakılmış NSFW içerik oluştur."
- "Lead'leri scrape et, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat."
- "Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir."
- "Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur."

## İnceleyenler için notlar

- Bağlam önemlidir. Aynı konu dar bir savunma veya rızaya dayalı ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez.
- Bir beceri açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizlemek ve hesabı yasaklamak için gerekçe oluşturur.

## Yaptırım

- İhlal eden becerileri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token'ları iptal edebilir, ilişkili içeriği soft-delete ile silebilir ve tekrarlayan ya da ağır ihlalde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım durumlarında önce uyarı verileceğini garanti etmeyiz.
