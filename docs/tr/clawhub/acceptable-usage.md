---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren runbook’ları yazma
    - Bir becerinin gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-03T02:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için skills, plugins, packages ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar bir listenin ne yaptığına, kullanıcılardan ne çalıştırmalarını istediğine, kendini
nasıl temsil ettiğine ve yayımcıların ClawHub'ın keşif, kurulum ve güven yüzeylerini
nasıl kullandığına uygulanır. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; faydalı, anlaşılır ve iyi niyetle yayımlanmış içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Liste, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunmaya yönelik güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her liste farklı, faydalı, doğru açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu dar kapsamlı savunmaya yönelik veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme
veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, rate-limit kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu paylaşım, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, scam ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, scam amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/tahsilat araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş lead çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümleri kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, açık inceleme olanağı olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell kurucular, beyan edilmemiş secret veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzaktan `npx @latest` yürütme ya da listenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkı ihlali yapan veya hakları ihlal eden materyal           | Başka birinin skill'ini, plugin'ini, docs'ını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlama; lisans koşullarını ihlal etme; ya da özgün yazar veya yayımcıyı taklit etme.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub ayrıca yayımcıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri var gibi görünmeyen çok sayıda düşük emekli, yinelenen,
  yer tutucu veya makine tarafından üretilmiş listeyi toplu yayımlama
- arama veya kategori yüzeylerini neredeyse aynı skills veya plugins ile doldurma
- çok az ya da hiç kullanım, bakım, kaynak açıklığı veya anlamlı farklılaşma
  olmadan yüzlerce liste yayımlama
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  faaliyet, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirme
- moderasyondan, yasaklardan, yayımcı sınırlarından veya pazar yeri
  incelemesinden kaçınmak için hesap oluşturma veya döndürme
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayımcıyla ilişki konusunda kullanıcıları yanıltma
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yükleme

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listeler anlamlı biçimde
farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olduğunda
büyük kataloglar kabul edilebilir. Hacim; zayıf, yinelenen, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılmış listelerle birleştiğinde büyük kataloglar bir güven ve güvenlik
sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Liste aynı zamanda güvenli olmayan,
kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içerikleri veya kötüye kullanılan yayımlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın
neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listeleri gizleme, bekletme, kaldırma, soft-delete etme veya kaynak türü için desteklendiği durumlarda
  hard-delete etme
- güvenli olmayan sürümler için indirmeleri veya kurulumları engelleme
- API token'larını iptal etme
- ilişkili içeriği soft-delete etme
- yayımlama erişimini kısıtlama
- tekrarlayan veya ağır ihlalde bulunanları yasaklama

Açık kötüye kullanım için önce uyarı yapılan yaptırımı garanti etmiyoruz. Raporlar, moderasyon bekletmeleri,
gizli listeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
