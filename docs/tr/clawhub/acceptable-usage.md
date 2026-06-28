---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya incelemeci çalışma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace ilkesi: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T20:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazaryeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını istediğine, kendisini nasıl
temsil ettiğine ve yayımcıların ClawHub'ın keşif, kurulum ve
güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya çalıştırmasına yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                        | Her listeleme ayırt edilebilir, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılmıştır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya
rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvensiz
çalıştırma veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama. |
| Platform kötüye kullanımı ve yasak atlatma                  | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları ya da tespit edilmekten kaçınmak için oluşturulmuş otomasyon. |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları. |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı. |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler ya da birini taklit etmek veya yanıltmak için kullanılan diğer araçlar. |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafındaki yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler. |
| Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri    | Gizlenmiş kurulum komutları, indirilen içeriğin açıkça incelenebilir olmadan `sh` veya `bash` ile çalıştırıldığı pipe-to-shell kurucular, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, açıkça incelenebilir olmadan uzaktan `npx @latest` çalıştırma ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal   | Başkasının skill'ini, Plugin'ini, dokümanlarını, marka varlıklarını veya özel mülk kodunu izinsiz yeniden yayımlama; lisans koşullarını ihlal etme; ya da özgün yazarı veya yayımcıyı taklit etme. |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayımcıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıdığı görünmeyen, düşük emekli, birbirini tekrar eden, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listelemeyi toplu yayımlama
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurma
- çok az kullanımı, bakımı, kaynak
  açıklığı veya anlamlı farklılaşması olan ya da hiç olmayan yüzlerce listeleme yayımlama
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak artırma
- moderasyonu, yasakları, yayımcı sınırlarını veya
  pazaryeri incelemesini atlatmak için hesap oluşturma ya da döndürme
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri ya da başka bir proje veya yayımcıyla ilişki konusunda yanıltma
- daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği,
  altta yatan sorunu düzeltmeden tekrar tekrar yükleme

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış
ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar,
hacim ince, birbirini tekrar eden, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılmış listelemelerle birleştiğinde güven ve emniyet sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvensiz,
kötü amaçlı veya yanıltıcı değilse, telif hakkı veya hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvensiz içerikleri veya kötüye kullanıma dayalı yayımlama davranışlarını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizleme, beklemeye alma, kaldırma, yumuşak silme veya kaynak türü için desteklendiği durumlarda
  kalıcı silme
- güvensiz sürümler için indirmeleri veya kurulumları engelleme
- API token'larını iptal etme
- ilişkili içeriği yumuşak silme
- yayımlama erişimini kısıtlama
- tekrar eden veya ciddi ihlalcileri yasaklama

Açık kötüye kullanım için önce uyarı verilen yaptırımı garanti etmiyoruz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) bölümüne bakın.
