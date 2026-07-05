---
read_when:
    - Kötüye kullanım veya politika ihlalleri için yüklemeleri inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazaryeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-05T07:57:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için skills, Plugin’ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub’a ait olup olmadığına karar vermek için bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayıncıların ClawHub’ın keşif, kurulum ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın. Telif hakkı veya diğer hak talepleri için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasına bakın.

## İzin Verilen İçerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanmış içerikleri memnuniyetle karşılar.

| Kategori | İzin verildiği durumlar |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici verimliliği | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar. |
| Kişisel veya ekip iş akışları | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır. |
| Bakımı yapılan kataloglar | Her listeleme farklı, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı yapılan niteliktedir. |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin Verilmeyen İçerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içerikleri barındırmaz.

| Kategori | İzin verilmez |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama. |
| Platform kötüye kullanımı ve yasak atlatma | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya toplama, sahte etkileşim, çok hesaplı otomasyon, toplu gönderi paylaşımı, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon. |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim girişimleri, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da net insan onayı olmadan harcama/tahsilat araçları. |
| Gizliliği ihlal eden zenginleştirme veya gözetim | Spam için kişi toplama, doxxing, stalking, istenmeyen erişim girişimiyle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı. |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu | Face swap, dijital ikizler, klonlanmış influencer’lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar. |
| Açık cinsel içerik veya güvenlik devre dışı yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler. |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri | Gizlenmiş kurulum komutları, net incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilen içerik gibi pipe-to-shell kurulum araçları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzak `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal | Başkasının skill’ini, Plugin’ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarın veya yayıncının kimliğine bürünmek. |

## İzin Verilmeyen Pazar Yeri Davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub’ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıdığı görünmeyen, düşük emekli, tekrarlı, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listelemeyi toplu olarak yayımlamak
- arama veya kategori yüzeylerini birbirine neredeyse aynı skills veya Plugin’lerle doldurmak
- kullanım, bakım, kaynak netliği veya anlamlı farklılaşması çok az olan ya da hiç olmayan yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazar yeri incelemesinden kaçınmak için hesap oluşturmak veya döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- altta yatan sorunu düzeltmeden, daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar, listelemeler anlamlı biçimde farklı, doğru şekilde açıklanmış, bakımı yapılan ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar, hacim zayıf, tekrarlı, yanıltıcı, bakımı yapılmayan veya yapay olarak öne çıkarılan listelemelerle birleştiğinde güven ve güvenlik sorunu haline gelir.

## İçerik Hakları

ClawHub’daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse, telif hakkı veya hak talepleri için normal pazar yeri raporlarını kullanmayın.

## İnceleme ve Yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanıma yönelik yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub’ın nelerin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, soft-delete yapmak veya kaynak türü destekliyorsa
  hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token’larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalde bulunanları yasaklamak

Açık kötüye kullanım için önce uyarı yaptırımı uygulayacağımızı garanti etmeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
