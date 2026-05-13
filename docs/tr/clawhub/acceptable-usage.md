---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-13T02:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği beceri ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar kasıtlı olarak pratiktir. Yalıtılmış anahtar sözcüklerden çok, uçtan uca kötüye kullanım iş akışlarıyla ilgileniyoruz. Bir beceri savunmaları atlatmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rızaya dayalı olmayan davranışları mümkün kılmak için oluşturulmuşsa, ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, semantik token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine kurulu kaynak bileşenleri, proje alias’larını ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 türleri kullanan ve oluşturulan kontrol arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını net tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespiti prompt’ları.
- Açık kimlik bilgileri, şeffaf kurulum ve dry-run veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı belgeler, geçiş runbook’ları, geliştirici yardımcı araçları ve test fixture’ları.

## Kabul edilmeyenler

- Güvenlik atlatma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot önleme atlatma, hız sınırı atlatma, korumaları aşmak için tasarlanmış gizli scraping, canlı arama veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, net insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeyi mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için büyük ölçekte iletişim bilgisi scraping’i, doxxing, stalking, istenmeyen erişimle birlikte lead çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rızaya dayalı olmayan taklit veya aldatıcı kimlik manipülasyonu.
  - Örnekler: face swap, dijital ikizler, sahte persona’lar, klonlanmış influencer’lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik wrapper’ları veya birincil amacı açık cinsel içerik olan beceriler.

- Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş secret gereksinimleri, beyan edilmemiş özel anahtar kullanımı, net incelenebilirlik olmadan uzaktan `npx @latest` yürütme, becerinin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar otomatik olarak eşleştirme kodları alacak şekilde değiştir.”
- “Tespit edilemeyen otomasyonla Reddit/Twitter hesapları geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik oluştur.”
- “Lead’leri scrape et, kişileri zenginleştir ve büyük ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla veya indir.”
- “Sentetik kimliklerle veya CAPTCHA çözümüyle toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma veya rızaya dayalı ortamda meşru olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir beceri açıkça atlatma, aldatma veya rızaya dayalı olmayan kullanım için optimize edilmişse, eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriği gizlemek ve hesabı yasaklamak için gerekçedir.

## Yaptırım

- İhlal eden becerileri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan ya da ağır ihlalde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı verme garantisi sunmayız.
