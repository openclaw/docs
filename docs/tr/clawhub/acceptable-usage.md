---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici işlem kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T08:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği Skills ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar özellikle pratiktir. Yalnızca yalıtılmış anahtar sözcükler değil, uçtan uca kötüye kullanım iş akışları bizim için en önemlisidir. Bir skill savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışa olanak sağlamak için oluşturulmuşsa ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son kalıplar

- Gerçek bileşenler, semantik token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias’larını ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulan denetim arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım algılama prompt’ları.
- Açık kimlik bilgileri, şeffaf kurulum ve dry-run veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılıma kapsamı belirlenmiş dokümantasyon, geçiş runbook’ları, geliştirici araçları ve test fixture’ları.

## Kabul edilmez

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları aşmak için tasarlanmış gizli scraping, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim girişimleri, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirme yapılmasını sağlayan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini büyük ölçekte scraping, doxxing, stalking, istenmeyen erişim girişimleriyle birlikte lead çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı kimliğe bürünme veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte person’lar, klonlanmış influencer’lar veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Müstehcen cinsel içerik ve güvenlik devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’leri etrafında yetişkin içerik wrapper’ları veya birincil amacı müstehcen cinsel içerik olan skills.

- Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: obfuscate edilmiş kurulum komutları, `curl | sh`, beyan edilmemiş secret gereksinimleri, beyan edilmemiş private key kullanımı, net incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma, skill’in çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son kalıplar

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar otomatik olarak eşleştirme kodları alacak şekilde değiştir.”
- “Tespit edilemeyen otomasyonla Reddit/Twitter hesapları yetiştir.”
- “Rastgele kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik oluştur.”
- “Lead’leri scrape et, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyenler için notlar

- Bağlam önemlidir. Aynı konu dar bir savunma amaçlı veya rızaya dayalı ortamda meşru olabilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir skill açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eylem alma yönünde hareket etmeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizlemek ve hesabı yasaklamak için gerekçedir.

## Yaptırım

- İhlal eden skills’i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan ya da ağır ihlal yapanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı yapılan yaptırımı garanti etmiyoruz.
