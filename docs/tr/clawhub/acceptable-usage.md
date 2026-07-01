---
read_when:
    - Yüklemeleri kötüye kullanım veya ilke ihlalleri açısından inceleme
    - Moderasyon dokümanları veya inceleyici çalışma kılavuzları yazma
    - Bir skillin gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-01T08:21:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, plugins, paketler ve pazaryeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'da yer alıp almaması gerektiğine karar vermek için bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap statüsü için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/clawhub/content-rights).

## İzin verilen içerik

ClawHub; faydalı, anlaşılır ve iyi niyetle yayımlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenmiştir, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme farklı, faydalı, doğru tanımlanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderim, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim girişimleri, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişim girişimiyle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış verilerin veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, indirilen içeriğin açık inceleme olanağı olmadan `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulum betikleri, beyan edilmemiş secret veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzak `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkı ihlal eden veya hakları ihlal eden materyal           | Başkasının skill, plugin, belgeleri, marka varlıkları veya özel mülk kodunu izinsiz yeniden yayımlamak; lisans şartlarını ihlal etmek; ya da asıl yazar veya yayıncı gibi davranmak.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışı şunları içerir:

- gerçek kullanıcı değeri var gibi görünmeyen, düşük emekli, yinelenen, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı skills veya plugins ile doldurmak
- çok az veya hiç kullanım, bakım, kaynak
  netliği ya da anlamlı farklılaşma olmadan yüzlerce listeleme yayımlamak
- otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlar yoluyla kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini yapay olarak şişirmek
- moderasyonu, yasakları, yayıncı limitlerini veya
  pazaryeri incelemesini atlatmak için hesap oluşturmak veya döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda yanıltmak
- temel sorunu düzeltmeden zaten gizlenmiş, kaldırılmış veya engellenmiş
  içerikleri tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar; listelemeler anlamlı şekilde farklı, doğru tanımlanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Hacim; zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılan listelemelerle birleştiğinde büyük kataloglar bir güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazaryeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım niteliğindeki yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve ekip incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, geçici silmek veya kaynak türü için desteklendiğinde
  kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği geçici silmek
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalde bulunanları yasaklamak

Açık kötüye kullanım için önce uyarı uygulamasını garanti etmiyoruz. Raporlar, moderasyon beklemeleri, gizli listelemeler, yasaklar ve hesap statüsü için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
