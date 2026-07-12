---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir Skills öğesinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-12T11:31:34Z"
    model: gpt-5.6
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

Bu kurallar; bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendisini
nasıl tanıttığı ve yayıncıların ClawHub'ın keşif, yükleme ve
güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap durumu için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasına bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içerikleri kabul eder.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.     |
| Kullanıcı arayüzü, veri ve otomasyon iş akışları  | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç, yetkili inceleme amacıyla sunulur, kanıtları korur ve insan onayı sınırlarını açık tutar.                                      |
| Kişisel veya ekip iş akışları                     | İş akışı, rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                                                        |
| Bakımı yapılan kataloglar                         | Her listeleme farklı, yararlı, doğru biçimde açıklanmış ve makul ölçüde bakımı yapılmış olmalıdır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya
rızaya dayalı bir ortamda kabul edilebilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez.

## Yasaklanan içerik

ClawHub, temel amacı kötüye kullanım, aldatma, güvenli olmayan
çalıştırma veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Yetkisiz erişim veya güvenlik önlemlerini aşma              | Kimlik doğrulamayı aşma, hesap ele geçirme, hız sınırını kötüye kullanma, canlı aramayı veya ajanı ele geçirme, yeniden kullanılabilir oturum çalma ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik olarak onaylama.                                                                                  |
| Platformun kötüye kullanılması ve yasaklardan kaçınma       | Yasaklardan sonra gizli hesaplar kullanma, hesap hazırlama veya toplama, sahte etkileşim, çoklu hesap otomasyonu, toplu paylaşım, istenmeyen ileti botları ya da tespit edilmekten kaçınmak üzere oluşturulmuş otomasyon.                                                                                                   |
| Dolandırıcılık, sahtekârlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı iletişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama veya ücretlendirme yapan araçlar.                                                                                  |
| Gizliliği ihlal eden veri zenginleştirme veya gözetim       | İstenmeyen ileti için kişi bilgilerini kazıma, kişisel bilgileri ifşa etme, takip etme, talep edilmemiş iletişimle birlikte potansiyel müşteri verisi çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış verileri veya veri ihlali dökümlerini kullanma.                                             |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu         | Yüz değiştirme, dijital ikizler, klonlanmış fenomenler, sahte kişilikler ya da kimliğe bürünmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                             |
| Açık cinsel içerik veya güvenlik önlemleri devre dışı bırakılmış yetişkin içerik üretimi | İş yerinde görüntülenmesi uygun olmayan görsel, video veya içerik üretimi; üçüncü taraf API'leri çevreleyen yetişkin içerik araçları ya da temel amacı açık cinsel içerik olan listelemeler.                                                                                                               |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri | Gizlenmiş yükleme komutları; açıkça incelenebilir olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi doğrudan kabuğa aktaran yükleyiciler; beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri; açıkça incelenebilir olmadan uzaktan `npx @latest` çalıştırılması ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını veya diğer hakları ihlal eden materyaller     | Başkasına ait Skills, Plugin, belgeler, marka varlıkları veya özel mülk kodu izinsiz olarak yeniden yayımlama; lisans koşullarını ihlal etme ya da asıl yazarın veya yayıncının kimliğine bürünme.                                                                                                                         |

## Yasaklanan pazar yeri davranışları

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşif mekanizmalarını, ölçümleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcıların
dikkatini manipüle etmek için kullanmayın.

Yasaklanan pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıdığı görülmeyen, düşük emekli, yinelenen, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listelemeyi toplu olarak yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- kullanım, bakım, kaynak
  açıklığı veya anlamlı farklılaşma düzeyi çok az olan ya da hiç olmayan yüzlerce listeleme yayımlamak
- otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yükleme, indirme, yıldız ya da diğer etkileşim
  ölçümlerini yapay olarak artırmak
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazar yeri incelemesinden kaçınmak için hesaplar oluşturmak ya da dönüşümlü olarak kullanmak
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  yükleme gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda kullanıcıları yanıltmak
- daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği
  temel sorunu düzeltmeden tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım sayılmaz. Listelemelerin anlamlı ölçüde farklı,
doğru biçimde açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olması hâlinde büyük kataloglar kabul edilebilir.
Hacim; yüzeysel, yinelenen, yanıltıcı, bakımı yapılmayan veya
yapay olarak tanıtılan listelemelerle birleştiğinde büyük kataloglar bir güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı olmadığı sürece telif hakkı ya da diğer hak talepleri için normal pazar yeri
bildirimlerini kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içerikleri veya kötüye kullanılan yayımlama davranışlarını belirlemek için otomatik denetimler, istatistiksel kötüye kullanım sinyalleri, kullanıcı bildirimleri ve
personel incelemesi kullanabilir. Bir sinyal
tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın nelerin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlalde bulunan listelemeleri gizlemek, beklemeye almak, kaldırmak, geçici olarak silmek veya kaynak türü destekliyorsa
  kalıcı olarak silmek
- güvenli olmayan sürümlerin indirilmesini veya yüklenmesini engellemek
- API belirteçlerini iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlallerde bulunanları yasaklamak

Açık kötüye kullanım durumlarında önce uyarı verileceğini garanti etmiyoruz. Bildirimler, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap durumu için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
