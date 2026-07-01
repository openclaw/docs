---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kitapları yazma
    - Bir becerinin gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-01T15:29:33Z"
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

Bu kurallar bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını
istediğine, kendini nasıl temsil ettiğine ve yayıncıların ClawHub'ın keşif, kurulum
ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap
itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak
talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içeriği memnuniyetle karşılar.

| Kategori                                         | İzin verilen durum                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam açıktır, gerekli kimlik bilgileri belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                                        |
| Bakımı yapılan kataloglar                        | Her listeleme farklı, yararlı, doğru tanımlanmış ve makul ölçüde bakımı yapılmış durumdadır.                                    |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan çalıştırma veya hak ihlali
olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı arama veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                        |
| Platform kötüye kullanımı ve yasaklardan kaçınma            | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu gönderi, spam botları ya da tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                           |
| Dolandırıcılık, sahtekarlıklar ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş müşteri adayı çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                      |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                |
| Açık cinsel içerik veya güvenlik önlemleri devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'lerin etrafındaki yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri | Gizlenmiş kurulum komutları, indirilen içeriğin açık incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulum araçları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları çiğneyen materyal     | Başkasının becerisini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlamak; lisans koşullarını ihlal etmek; ya da özgün yazarın veya yayıncının kimliğine bürünmek.                                                                                                    |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. Keşfi, metrikleri,
güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek
için ClawHub'ı kullanmayın.

İzin verilmeyen pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, yinelenen,
  yer tutucu veya makine tarafından oluşturulmuş listelemeyi toplu olarak yayınlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak açıklığı veya anlamlı farklılaşma içeren yüzlerce
  listeleme yayınlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon,
  kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik, ücretli
  etkileşim ya da diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazar yeri incelemesinden
  kaçınmak için hesap oluşturmak veya hesapları döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri
  veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- zaten gizlenmiş, kaldırılmış veya engellenmiş içeriği, altta yatan sorunu düzeltmeden
  tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru tanımlanmış, bakımı yapılmış ve gerçek
kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar;
hacim, zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak tanıtılan listelemelerle
birlikte olduğunda güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda
güvenli değil, kötü amaçlı veya yanıltıcı değilse, telif hakkı ya da hak talepleri için
normal pazar yeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayınlama davranışını belirlemek
için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları
ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, geçici olarak silmek veya
  kaynak türü destekliyorsa kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalcileri yasaklamak

Açık kötüye kullanım için önce uyarı uygulanacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
