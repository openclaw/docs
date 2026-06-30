---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-30T22:30:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub; OpenClaw için skills, plugin'ler, paketler ve pazaryeri metaverilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar; bir listenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini
nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini
nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak
talepleri için bkz. [İçerik Hakları Talepleri](/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanmış içerikleri memnuniyetle kabul eder.

| Kategori                                         | İzin verildiği durumlar                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Liste, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hatalarını ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunmaya yönelik güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenir, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı sürdürülen kataloglar                              | Her liste ayırt edilebilir, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı sürdürülmüştür.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunmaya yönelik veya
rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan
çalıştırma veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı veya onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu paylaşım, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları veya net insan onayı olmadan harcama/tahsilat araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi toplama, doxxing, takip, istenmeyen erişimle birlikte potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme veya sızdırılmış veri ya da ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişiler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafındaki yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri        | Gizlenmiş kurulum komutları, net incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell kurucuları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzak `npx @latest` çalıştırma veya listenin gerçekten çalışmak için neye ihtiyaç duyduğunu gizleyen metaveriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başka birinin skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazar veya yayıncıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen, düşük emekli, yinelemeli, yer tutucu veya
  makine tarafından oluşturulmuş listeleri çok sayıda toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı skills veya plugin'lerle doldurmak
- çok az veya hiç kullanım, bakım, kaynak
  açıklığı ya da anlamlı farklılaşma içermeyen yüzlerce liste yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazaryeri incelemesinden kaçmak için hesap oluşturmak veya döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda kullanıcıları yanıltmak
- altta yatan sorunu düzeltmeden, daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listeler anlamlı şekilde
farklı, doğru açıklanmış, bakımı sürdürülen ve gerçek kullanıcılar tarafından kullanılıyorsa
büyük kataloglar kabul edilebilir. Hacim; zayıf, yinelemeli, yanıltıcı, bakımı sürdürülmeyen veya
yapay olarak tanıtılan listelerle birleştiğinde büyük kataloglar bir güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Liste aynı zamanda güvenli olmayan,
kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içerikleri veya kötüye kullanım niteliğindeki yayımlama davranışlarını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiğinde
  hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalcileri yasaklamak

Açık kötüye kullanım için önce uyarı yaptırımı uygulayacağımızı garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
