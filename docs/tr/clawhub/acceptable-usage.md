---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-04T10:57:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayırt edilebilir, yararlı, doğru tanımlanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, temel amacı kötüye kullanım, aldatma, güvenli olmayan yürütme
veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak aşma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu paylaşım, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen iletişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı yetişkin üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafındaki yetişkin içerik sarmalayıcıları; ya da temel amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, açık incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell kurucuları, beyan edilmemiş gizli değer veya özel anahtar gereksinimleri, açık incelenebilirlik olmadan uzaktan `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları çiğneyen materyal           | Başkasının skill'ini, Plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlamak; lisans koşullarını ihlal etmek; ya da özgün yazar veya yayıncı gibi davranmak.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen çok sayıda düşük emekli,
  yinelenen, yer tutucu veya makine tarafından oluşturulmuş listelemeyi toplu yayınlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills veya Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak netliği veya anlamlı farklılaşma içeren ya da
  hiç içermeyen yüzlerce listeleme yayınlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon,
  kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik,
  ücretli etkileşim veya diğer organik olmayan davranışlar yoluyla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazar yeri incelemesinden
  kaçınmak için hesap oluşturmak veya hesapları döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- zaten gizlenmiş, kaldırılmış veya engellenmiş içeriği temel sorunu çözmeden
  tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru tanımlanmış, bakımlı ve gerçek kullanıcılar
tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar, hacim zayıf,
yinelenen, yanıltıcı, bakımsız veya yapay olarak tanıtılan listelemelerle birleştiğinde
güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız,
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım içeren yayınlama davranışını
belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiğinde
  hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalcileri yasaklamak

Açık kötüye kullanım için önce uyarı verme garantisi vermeyiz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
