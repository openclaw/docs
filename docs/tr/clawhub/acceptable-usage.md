---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçirenlere yönelik operasyon kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-11T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği skill ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Bizim için en önemli olan, yalnızca yalıtılmış anahtar kelimeler değil, uçtan uca kötüye kullanım iş akışlarıdır. Bir skill savunmaları aşmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rızaya dayanmayan davranışı mümkün kılmak için oluşturulmuşsa ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal belirteçler, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan ön uç ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje takma adlarını ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulmuş denetim arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını açık tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım algılama prompt’ları.
- Açık kimlik bilgileri, şeffaf kurulum ve kuru çalıştırma veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı dokümantasyon, geçiş runbook’ları, geliştirici yardımcı araçları ve test fikstürleri.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot önleme sistemlerini aşma, hız sınırı atlatma, korumaları yenmek üzere tasarlanmış gizli scraping, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çok hesaplı otomasyon, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama yapmayı veya ücretlendirmeyi mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için büyük ölçekte iletişim bilgisi scraping, doxxing, stalking, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rızaya dayanmayan taklit veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: birini taklit etmek veya yanıltmak için kullanılan yüz değiştirme, dijital ikizler, sahte kişilikler, klonlanmış influencer’lar veya diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenlikleri devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan skill’ler.

- Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş secret gereksinimleri, beyan edilmemiş private-key kullanımı, açık incelenebilirlik olmadan uzaktan `npx @latest` yürütme, skill’in çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar eşleştirme kodlarını otomatik alacak şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla büyüt.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik üret.”
- “Potansiyel müşterileri scrape et, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma veya rızaya dayalı ortamda meşru olabilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir skill açıkça kaçınma, aldatma veya rızaya dayanmayan kullanım için optimize edilmişse eyleme geçme yönünde ağırlık vermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizleme ve hesabı yasaklama gerekçesidir.

## Yaptırım

- İhlal eden skill’leri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrar eden ya da ağır ihlallerde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı yapacağımızı garanti etmeyiz.
