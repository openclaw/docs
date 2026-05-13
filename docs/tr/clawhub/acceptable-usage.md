---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici operasyon kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-13T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği beceri ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Yalnızca izole anahtar kelimelerden ziyade, uçtan uca kötüye kullanım iş akışlarına en çok önem veririz. Bir beceri savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rızaya dayalı olmayan davranışlara olanak sağlamak için oluşturulmuşsa, ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias’larını ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulan denetim arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti prompt’ları.
- Açık kimlik bilgileri, şeffaf kurulum ve deneme çalıştırması ya da önizleme modlarıyla kişisel veya ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı dokümantasyon, geçiş runbook’ları, geliştirici araçları ve test fikstürleri.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları aşmak üzere tasarlanmış gizli kazıma, canlı arama veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim girişimleri, sahte sosyal kanıt, net insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeye olanak sağlayan araçlar ya da dolandırıcılık için hesap oluşturmak üzere geliştirilmiş sentetik kimlik iş akışları.

- Gizliliği ihlal eden kazıma, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini ölçekli olarak kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rızaya dayalı olmayan taklit veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: face swap, dijital ikizler, sahte kişilikler, klonlanmış influencer’lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan beceriler.

- Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: karartılmış kurulum komutları, `curl | sh`, beyan edilmemiş gizli bilgi gereksinimleri, beyan edilmemiş özel anahtar kullanımı, açık incelenebilirlik olmadan uzak `npx @latest` çalıştırma, becerinin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar eşleştirme kodlarını otomatik alacak şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik üret.”
- “Potansiyel müşterileri kazı, kişileri zenginleştir ve ölçekli soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimliklerle veya CAPTCHA çözmeyle toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma amaçlı veya rızaya dayalı ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez.
- Bir beceri açıkça kaçınma, aldatma veya rızaya dayalı olmayan kullanım için optimize edilmişse, aksiyon alma yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizlemek ve hesabı yasaklamak için gerekçedir.

## Yaptırım

- İhlal eden becerileri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete edebilir ve tekrarlayan ya da ağır ihlalde bulunanları yasaklayabiliriz.
- Bariz kötüye kullanım için önce uyarı verilmesini garanti etmeyiz.
