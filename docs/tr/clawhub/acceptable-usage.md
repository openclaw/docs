---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill’in gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-03T09:53:03Z"
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

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl
temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl
kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belge hazırlamasına veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme farklı, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu dar kapsamlı bir savunma veya rızaya dayalı ortamda
kabul edilebilir olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; temel amacı kötüye kullanım, aldatma, güvenli olmayan
çalıştırma veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasaktan kaçınma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da net insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, taciz amaçlı takip, istenmeyen erişimle birlikte potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme veya sızdırılmış veri ya da ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya birini taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri        | Gizlenmiş kurulum komutları, açık inceleme yapılabilirliği olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulum araçları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık inceleme yapılabilirliği olmadan uzaktan `npx @latest` çalıştırma ya da listelemenin gerçekten çalışmak için neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayıncıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen düşük emekli, yinelenen, yer tutucu veya
  makine tarafından üretilmiş çok sayıda listelemeyi toplu olarak yayınlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az kullanımı, bakımı, kaynak
  açıklığı veya anlamlı farklılaşması olan yüzlerce listeleme yayınlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazar yeri incelemesinden kaçınmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda yanıltmak
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayıncılık otomatik olarak kötüye kullanım değildir. Listelemeler
anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar
tarafından kullanılıyor olduğunda büyük kataloglar kabul edilebilir. Hacim;
zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak tanıtılan listelemelerle
birleştiğinde büyük kataloglar bir güven ve güvenlik sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı değilse, telif hakkı ya da hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, geçici olarak silmek veya kaynak türü için desteklendiği durumlarda
  kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalde bulunanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmiyoruz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
