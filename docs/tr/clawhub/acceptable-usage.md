---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill’in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-04T20:39:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve marketplace meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar bir listenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl
temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve
güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici verimliliği                           | Liste, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıktır ve riskli eylemler inceleme, kuru çalışma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her liste ayrı, yararlı, doğru tanımlanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya
rızaya dayalı bir ortamda kabul edilebilir olabilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan
çalıştırma veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu gönderi, spam botları ya da tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlıklar ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı iletişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da net insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen iletişimle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler ya da kimliğe bürünmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'lerin etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri        | Karartılmış kurulum komutları, net incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilen içerik gibi pipe-to-shell kurucuları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma ya da listenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlama; lisans koşullarını ihlal etme; ya da özgün yazar veya yayıncı gibi davranma.                                                                                                                            |

## İzin verilmeyen marketplace davranışı

ClawHub, yayıncıların marketplace'i nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen marketplace davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, yinelenen, yer tutucu veya
  makine tarafından oluşturulmuş listeyi toplu yayınlama
- arama veya kategori yüzeylerini neredeyse aynı Skills veya Plugin'lerle doldurma
- çok az kullanım, bakım, kaynak
  netliği veya anlamlı farklılaşma içeren ya da hiç içermeyen yüzlerce liste yayınlama
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirme
- moderasyonu, yasakları, yayıncı sınırlarını veya
  marketplace incelemesini atlatmak için hesap oluşturma veya döndürme
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki hakkında yanıltma
- altta yatan sorunu düzeltmeden zaten gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yükleme

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listeler anlamlı biçimde farklı, doğru tanımlanmış, bakımı yapılan
ve gerçek kullanıcılar tarafından kullanılan listeler olduğunda kabul edilebilir. Büyük kataloglar,
hacim zayıf, yinelenen, yanıltıcı, bakımı yapılmayan veya
yapay olarak öne çıkarılan listelerle eşleştiğinde bir güven ve emniyet sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Liste aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal marketplace
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım içeren yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın
neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listeleri gizleme, beklemeye alma, kaldırma, geçici olarak silme veya kaynak türü için desteklendiği durumlarda
  kalıcı olarak silme
- güvenli olmayan sürümler için indirmeleri veya kurulumları engelleme
- API token'larını iptal etme
- ilişkili içeriği geçici olarak silme
- yayınlama erişimini kısıtlama
- tekrarlayan veya ağır ihlal yapanları yasaklama

Açık kötüye kullanım için önce uyarı uygulanacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
