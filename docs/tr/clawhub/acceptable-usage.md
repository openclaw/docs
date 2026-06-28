---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon dokümanları veya inceleyici çalışma kılavuzları yazma
    - Bir skill’in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T00:17:14Z"
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

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl
temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl
kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içeriği memnuniyetle karşılar.

| Kategori                                         | Ne zaman izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç, yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme farklı, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı yapılmıştır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya
rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan
çalıştırma veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak aşma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçilik, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları ya da tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/tahsilat araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler ya da taklit etmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri        | Gizlenmiş kurulum komutları, açıkça incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi shell'e aktaran yükleyiciler, beyan edilmemiş secret veya private-key gereksinimleri, açıkça incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlama; lisans şartlarını ihlal etme; ya da özgün yazarı veya yayıncıyı taklit etme.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, kopya, yer tutucu veya
  makine tarafından üretilmiş listelemeyi toplu olarak yayınlama
- arama veya kategori yüzeylerini birbirine çok benzeyen Skills veya Plugin'lerle doldurma
- çok az kullanım, bakım, kaynak
  açıklığı veya anlamlı farklılaştırma ile yüzlerce listeleme yayınlama
- otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini yapay olarak şişirme
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazaryeri incelemesinden kaçınmak için hesap oluşturma veya döndürme
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki hakkında kullanıcıları yanıltma
- altta yatan sorunu gidermeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yükleme

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru şekilde açıklanmış, bakımı yapılmış
ve gerçek kullanıcılar tarafından kullanılıyorsa kabul edilebilir. Büyük kataloglar,
hacim zayıf, kopya, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılan listelemelerle birleştiğinde güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvenli olmayan,
kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayınlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal
tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizleme, bekletme, kaldırma, soft-delete yapma veya kaynak türü için desteklendiği yerlerde
  hard-delete yapma
- güvenli olmayan sürümler için indirmeleri veya kurulumları engelleme
- API token'larını iptal etme
- ilişkili içeriği soft-delete yapma
- yayınlama erişimini kısıtlama
- tekrarlayan veya ağır ihlalcileri yasaklama

Açık kötüye kullanım için önce uyarı uygulanacağını garanti etmiyoruz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın.
