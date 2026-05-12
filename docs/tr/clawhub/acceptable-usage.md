---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon dokümanları veya inceleyici çalışma kılavuzları yazma
    - Bir Skills öğesinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazaryeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T12:49:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub'ın hangi tür Skills ve içerikleri kabul ettiğini ve hangi kötüye kullanım iş akışlarını barındırmayacağını açıklar.

Bu kurallar bilinçli olarak pratiktir. Yalnızca tekil anahtar sözcüklerden çok, uçtan uca kötüye kullanım iş akışlarını önemsiyoruz. Bir skill savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulmuşsa ClawHub'da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, semantik token'lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik markup yerine yüklü kaynak bileşenleri, proje alias'larını ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulmuş denetim arayüzlerini incelenebilir tutan UI5 JavaScript'ten TypeScript'e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını açık tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım algılama istemleri.
- Açık kimlik bilgileri, şeffaf kurulum ve kuru çalıştırma veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı belgeler, geçiş runbook'ları, geliştirici yardımcı araçları ve test fikstürleri.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı önlemlerden kaçınma, hız sınırı atlatma, korumaları yenmek için tasarlanmış gizli scraping, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazaryeri veya sosyal otomasyon.

- Dolandırıcılık, scam'ler ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, scam amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeyi mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için ölçekte iletişim bilgisi scraping'i, doxxing, stalking, istenmeyen erişimle eşleştirilmiş lead çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonelleştirme.

- Rıza dışı taklit veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: face swap, dijital ikizler, sahte kişilikler, klonlanmış influencer'lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenlik devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görüntü/video/içerik üretimi, üçüncü taraf API'ler etrafındaki yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan skills.

- Gizli, güvensiz veya yanıltıcı yürütme gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş gizli gereksinimleri, beyan edilmemiş özel anahtar kullanımı, açık incelenebilirlik olmadan uzak `npx @latest` yürütmesi, skill'in çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazaryeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Onaylanmamış kullanıcıların eşleştirme kodlarını otomatik alması için Telegram eşleştirmesini değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemez otomasyonla geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışıyken NSFW içerik oluştur.”
- “Lead'leri scrape et, kişileri zenginleştir ve ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla veya indir.”
- “Sentetik kimliklerle veya CAPTCHA çözmeyle e-posta ya da sosyal hesapları toplu oluştur.”

## İnceleyenler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma veya rıza temelli ortamda meşru olabilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir skill kaçınma, aldatma veya rıza dışı kullanım için açıkça optimize edilmişse eylem alma yönünde tercih kullanmalıyız.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Yaptırım

- İhlal eden skills'i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token'ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan ya da ağır ihlal yapanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz.
