---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kitapları yazma
    - Bir skill'in gizlenmesi mi yoksa bir kullanıcının yasaklanması mı gerektiğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-02T08:42:08Z"
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

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, yükleme ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içeriği memnuniyetle kabul eder.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunmaya yönelik güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenmiştir, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayırt edilebilir, yararlı, doğru tanımlanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunmaya yönelik veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, temel amacı kötüye kullanım, aldatma, güvenli olmayan çalıştırma
veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak aşma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya yetiştirme, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları ya da tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/tahsilat araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişiler ya da kimliğe bürünmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri        | Karartılmış yükleme komutları, açıkça incelenebilirlik sağlamadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi kabuk komutuna borulanan yükleyiciler, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açıkça incelenebilirlik sağlamadan uzaktan `npx @latest` çalıştırma ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Bir başkasının skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans şartlarını ihlal etmek; ya da özgün yazarın veya yayıncının kimliğine bürünmek.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışı şunları içerir:

- gerçek kullanıcı değeri var gibi görünmeyen, düşük emekli, yinelenen, yer tutucu veya
  makine tarafından üretilmiş çok sayıda listelemeyi topluca yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- az ya da hiç kullanım, bakım, kaynak netliği veya anlamlı farklılaşma olmadan
  yüzlerce listeleme yayımlamak
- yüklemeleri, indirmeleri, yıldızları veya diğer etkileşim metriklerini
  otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı limitlerinden veya pazaryeri incelemesinden kaçmak için
  hesap oluşturmak veya hesapları döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  yükleme gereksinimleri ya da başka bir proje veya yayıncıyla bağlantı konusunda kullanıcıları yanıltmak
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı
şekilde farklı, doğru tanımlanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından
kullanılıyorsa büyük kataloglar kabul edilebilir. Hacim; yüzeysel, yinelenen,
yanıltıcı, bakımsız veya yapay olarak öne çıkarılan listelemelerle birleştiğinde
büyük kataloglar bir güven ve güvenlik sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvenli olmayan,
kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanıma yönelik yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, geçici olarak silmek veya,
  kaynak türü tarafından desteklendiğinde, kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya yüklemeleri engellemek
- API belirteçlerini iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz. Raporlar,
moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
