---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren çalıştırma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-03T23:40:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazaryeri meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanmış içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici verimliliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenmiştir, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı, rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı sürdürülen kataloglar                              | Her listeleme ayrı, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı sürdürülen niteliktedir.                                                |

Bağlam önemlidir. Aynı konu, dar bir savunma amaçlı veya rızaya dayalı ortamda kabul edilebilir
olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; temel amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan
içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu gönderi, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlıklar ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları veya açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme veya sızdırılmış veri ya da ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'leri çevreleyen yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, açıkça incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilen içerik gibi pipe-to-shell kurucular, beyan edilmemiş gizli değer veya özel anahtar gereksinimleri, açıkça incelenebilirlik olmadan uzaktan `npx @latest` yürütmesi ya da listelemenin gerçekten çalışmak için neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları çiğneyen materyal           | Başkasının Skills'ini, Plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlama; lisans koşullarını ihlal etme; ya da özgün yazar veya yayıncı gibi davranma.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub ayrıca yayıncıların pazaryerini nasıl kullandığını inceler. ClawHub'ı keşfi,
metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini
manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen, düşük emekli, tekrarlı, yer tutucu veya
  makine tarafından üretilmiş çok sayıda listelemeyi toplu olarak yayınlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak netliği veya anlamlı farklılaşma içeren yüzlerce
  listeleme yayınlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon,
  kendi kendine kurulum döngüleri, sahte hesaplar, koordine faaliyet,
  ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazaryeri incelemesinden kaçmak için
  hesap oluşturmak veya hesapları döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda yanıltmak
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı şekilde
farklı, doğru açıklanmış, bakımı sürdürülen ve gerçek kullanıcılar tarafından kullanılıyorsa
büyük kataloglar kabul edilebilir. Hacim; zayıf, tekrarlı, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılmış listelemelerle birleştiğinde büyük kataloglar bir güven ve
emniyet sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı değilse, telif hakkı ya da hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın
neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak veya,
  kaynak türü tarafından desteklendiği yerlerde hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalcileri yasaklamak

Açık kötüye kullanım için önce uyarı uygulamasını garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
