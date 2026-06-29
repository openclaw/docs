---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - OpenClaw belgeleri veya gözden geçiren çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmemesi veya bir kullanıcının yasaklanıp yasaklanmaması gerektiğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T22:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar, bir liste kaydının ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayımcıların ClawHub'ın keşif, kurulum ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Liste kaydı kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı, rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her liste kaydı ayrıdır, yararlıdır, doğru açıklanmıştır ve makul ölçüde bakımı yapılır.                                                |

Bağlam önemlidir. Aynı konu dar bir savunma amaçlı veya rızaya dayalı ortamda kabul edilebilir
olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, temel amacı kötüye kullanım, aldatma, güvensiz çalıştırma veya hak ihlali olan
içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasaklardan kaçınma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları veya açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte müşteri adayı çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme veya sızdırılmış verilerin ya da ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'leri etrafındaki yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan liste kayıtları.                                                                                                                                                       |
| Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri        | İncelenebilirliği net olmayan gizlenmiş kurulum komutları, indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulumları, beyan edilmemiş gizli değer veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma ya da liste kaydının çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayımcıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayımcıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, yinelenen,
  yer tutucu veya makine tarafından oluşturulmuş liste kaydını toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı skill'ler ya da Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak netliği veya anlamlı farklılaşma içeren ya da hiç içermeyen
  yüzlerce liste kaydı yayımlamak
- otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlar yoluyla
  kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini yapay olarak şişirmek
- moderasyondan, yasaklardan, yayımcı sınırlarından veya pazar yeri incelemesinden
  kaçınmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayımcıyla ilişki konusunda yanıltmak
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
liste kayıtları anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılan ve gerçek
kullanıcılar tarafından kullanılan içerikler olduğunda kabul edilebilir. Büyük kataloglar,
hacim zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış liste
kayıtlarıyla birleştiğinde bir güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Liste kaydı aynı zamanda
güvensiz, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvensiz içeriği veya kötüye kullanımlı yayımlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın nelerin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden liste kayıtlarını gizlemek, bekletmek, kaldırmak, soft-delete yapmak veya,
  kaynak türü destekliyorsa, hard-delete yapmak
- güvensiz sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalcileri yasaklamak

Açık kötüye kullanım için önce uyarı verilen yaptırımı garanti etmiyoruz. Raporlar,
moderasyon bekletmeleri, gizli liste kayıtları, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın.
