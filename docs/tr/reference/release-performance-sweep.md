---
read_when:
    - Mayıs 2026 performans ve paket boyutu temizliğini doğruluyorsunuz
    - OpenClaw performans ve bağımlılık blog yazısının temelindeki sayılara ihtiyacınız var
    - Sürüm kapılarını, paket shrinkwrap dosyasını veya plugin bağımlılık sınırlarını değiştiriyorsunuz
summary: Mayıs 2026 performans, paket boyutu, bağımlılık ve shrinkwrap temizliği için görsel özet ve teknik kanıtlar
title: Sürüm performansı taraması
x-i18n:
    generated_at: "2026-07-12T12:45:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Bu sayfa, Mayıs 2026 OpenClaw performans, paket boyutu, bağımlılık ve shrinkwrap temizliğinin dayandığı kanıtları sunar. Herkese açık blog yazısının teknik tamamlayıcısıdır.

Burada iki denetim birleştirilmiştir:

- **Sürüm performansı taraması:** `OpenClaw Performance` iş akışı, `profile=smoke` ve sahte sağlayıcı hattı kullanılarak `v2026.5.28` sürümünden kararlı `v2026.4.23` sürümüne kadar olan GitHub Releases. Çoğu etiket satırı tek örnek kullanır; `v2026.5.27` ve `v2026.5.28` satırları ise en son 3 tekrarlı sürüm dalı yapıtlarını kullanır.
- **Önceki Nisan bağlamı:** Bozuk Nisan sonu sürümlerini herkese açık performans referans noktası olarak değerlendirmemek için yalnızca `v2026.4.1` ile `v2026.5.2` arasındaki yayımlanmış `clawgrit-reports` sahte sağlayıcı referans ölçümleri kullanılmıştır.
- **Kurulum alanı taraması:** Geçici paketlere yeni `npm install --ignore-scripts` kurulumları yapılarak boyut için `du -sk node_modules`, paket örneği sayıları içinse `node_modules` dizin taraması kullanılmıştır.
- **npm paket boyutu taraması:** Yayımlanmış sürümler için `npm pack openclaw@<version> --dry-run --json` çalıştırılarak sıkıştırılmış tar arşivi boyutu, açılmış boyut ve dosya sayısı kaydedilmiştir.

<Warning>
Ana performans taraması, en son 3 tekrarlı sürüm dalı yapıtlarını kullanan `v2026.5.27` ve `v2026.5.28` satırları dışında etiket başına tek bir smoke örneği kullanır. Önceki Nisan bağlamı, `clawgrit-reports` kaynağındaki yayımlanmış 3 tekrarlı medyanları kullanır. Sayıları sürüm geçidi istatistikleri olarak değil, eğilim kanıtı ve regresyon arama sinyali olarak değerlendirin.
</Warning>

## Anlık görünüm

Performans kapsamı: **istenen 77 sürüm**, **yapıtlarla desteklenen 74 nokta** ve **kullanılamayan 3 CI çalıştırması**. Ölçülen en son kararlı nokta: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Kararlı ajan turu" icon="gauge">
    **Soğuk turda 5,1 kat daha hızlı**

    - `v2026.4.14`: 9,8 sn
    - `v2026.5.28`: 1,9 sn

  </Card>
  <Card title="Yayımlanmış paket" icon="package">
    **17,9 MB tar arşivi**

    En son kararlı paket, Mart ayındaki 43,3 MB'lık paket boyutu zirvesinden daha küçük.

  </Card>
  <Card title="En son kararlı kurulum" icon="hard-drive">
    **361,7 MiB yeni kurulum**

    İç içe OpenClaw bağımlılık ağacını `2026.5.22` shrinkwrap ekleme zirvesine göre önemli ölçüde küçültür; ancak yerel kurulum denetiminde 259,7 MiB boyutunda daha küçük bir iç içe ağaç hâlâ bulunur.

  </Card>
  <Card title="Bağımlılık grafiği" icon="boxes">
    **300 kurulu paket**

    Betikleri devre dışı bırakılmış yeni bir kurulumdaki benzersiz paket adı/sürüm kökleri olarak ölçülmüştür; önceki kararlı sürüme göre 71 kök daha azdır.

  </Card>
</CardGroup>

## 5.28'de Neler Değişti?

`v2026.5.27` ile `v2026.5.28` arasındaki temizlik, yetenekleri kaldırmak yerine varsayılan kurulum grafiğini küçülttü.

<CardGroup cols={2}>
  <Card title="Kök varsayılan grafik" icon="git-branch">
    Benzersiz paket adı/sürüm kökleri **371**'den **300**'e düştü. Paket örnekleri **372**'den **301**'e düştü.
  </Card>
  <Card title="İç içe ağaç" icon="unplug">
    Aynı yerel kurulum denetiminde iç içe `openclaw/node_modules` boyutu **656,1 MiB**'den **259,7 MiB**'ye düştü.
  </Card>
  <Card title="İsteğe bağlı yerel bağımlılık konileri" icon="cpu">
    Tüm platformlara yönelik `@napi-rs/canvas` yerel paket konisi artık varsayılan kurulumda yer almıyor.
  </Card>
  <Card title="Tedarik zinciri yüzeyi" icon="shield">
    Varsayılan paket sayısının azalması; varsayılan olarak güvenilmesi gereken tar arşivlerinin, bakımcıların, yerel ikililerin, kurulum zamanı davranışlarının ve geçişli güncelleme yollarının da azalması anlamına gelir.
  </Card>
</CardGroup>

<Tip>
Sorun tek başına shrinkwrap değildi. Sorun, hatalı paket yapısıydı. `v2026.5.28` hâlâ shrinkwrap ile dağıtılıyor; ancak yerel denetimde iç içe bağımlılık ağacı çok daha küçük ve tüm platformlara yönelik canvas dallanması ortadan kalkmış durumda.
</Tip>

## Öne Çıkan Rakamlar

Bozuk Nisan sonu satırlarını herkese açık performans referans noktaları olarak kullanmayın. `v2026.4.23` ve `v2026.4.29` yararlı regresyon kanıtlarıdır; ancak `14x` benzeri büyük farklar çoğunlukla kötü bir sürüm serisinden toparlanmayı gösterir.

Blog anlatısında ölçek için Nisan ayının başındaki yayımlanmış referans noktasını kullanın. Referans noktası, yayımlanmış `clawgrit-reports` sahte sağlayıcı çalıştırmasındaki `v2026.4.14` sürümüdür (3 tekrar; bu çalıştırma yalnızca tanılama zaman çizelgesi yayımlanmadığı için başarısız oldu; dolayısıyla soğuk, sıcak ve RSS medyanları yaklaşık ölçek olarak hâlâ yararlıdır). Bunu sürüm geçidi istatistiği olarak değil, anlatı bağlamı olarak değerlendirin.

| Ölçüm           | Önceki Nisan referans noktası | `v2026.5.28` |                    Fark |
| --------------- | ----------------------------: | -----------: | ----------------------: |
| Soğuk ajan turu |                       9.819 ms |     1.908 ms | %80,6 düşük, 5,1 kat hızlı |
| Sıcak ajan turu |                       7.458 ms |     1.870 ms | %74,9 düşük, 4,0 kat hızlı |
| Ajan tepe RSS'i |                       686,2 MB |     581,0 MB |             %15,3 düşük |

Mayıs taramasında, en son sürüm dalı satırı `v2026.5.2` sürümünden bu yana önemli ölçüde ilerledi:

| Ölçüm           | `v2026.5.2` | `v2026.5.28` |       Fark |
| --------------- | -----------: | ------------: | ---------: |
| Soğuk ajan turu |     3.897 ms |      1.908 ms | %51,0 düşük |
| Sıcak ajan turu |     3.610 ms |      1.870 ms | %48,2 düşük |
| Ajan tepe RSS'i |      613,7 MB |       581,0 MB |  %5,3 düşük |

Önceki kararlı sürümle karşılaştırıldığında:

| Ölçüm           | `v2026.5.27` | `v2026.5.28` |        Fark |
| --------------- | ------------: | ------------: | ----------: |
| Soğuk ajan turu |      2.231 ms |      1.908 ms | %14,5 düşük |
| Sıcak ajan turu |      2.226 ms |      1.870 ms | %16,0 düşük |
| Ajan tepe RSS'i |       649,0 MB |       581,0 MB | %10,5 düşük |

### Kurulum alanı

| Ölçüm                                           | Referans | `v2026.5.28` |        Fark |
| ----------------------------------------------- | -------: | ------------: | ----------: |
| `2026.5.22` zirvesinden kurulum boyutu          | 1.020,6 MB |     361,7 MiB | %64,6 düşük |
| En son `2026.5.27` sürümünden kurulum boyutu    | 767,1 MiB |     361,7 MiB | %52,8 düşük |
| Aylık en yüksek `2026.2.26` değerinden bağımlılıklar |      645 |          300 | %53,5 düşük |
| En son `2026.5.27` sürümünden bağımlılıklar     |      371 |          300 | %19,1 düşük |
| `2026.5.22` sürümünden iç içe `openclaw/node_modules` | 911,8 MB |     259,7 MiB | %71,5 düşük |
| `2026.5.27` sürümünden iç içe `openclaw/node_modules` | 656,1 MiB |     259,7 MiB | %60,4 düşük |

### npm paket boyutu

| Sürüm        | Sıkıştırılmış tar arşivi | Açılmış paket | Dosya | Notlar                                   |
| ------------ | -----------------------: | ------------: | -----: | ---------------------------------------- |
| `2026.1.30`  |                  12,8 MB |       33,5 MB |  4.607 | yeniden markalanan ilk paket             |
| `2026.2.26`  |                  23,6 MB |       82,9 MB | 10.125 | özellik artışı                           |
| `2026.3.31`  |                  43,3 MB |      182,6 MB | 21.037 | paket boyutunun zirve noktası            |
| `2026.4.29`  |                  22,9 MB |       74,6 MB |  9.309 | paket budaması görünür hâle geldi        |
| `2026.5.12`  |                  23,4 MB |       80,1 MB | 12.035 | büyük harici Plugin ayrımı               |
| `2026.5.22`  |                  17,2 MB |       76,9 MB | 12.386 | belgeler/varlıklar paketten çıkarıldı    |
| `2026.5.27`  |                  17,8 MB |       79,0 MB | 12.509 | önceki kararlı paket                     |
| `2026.5.28`  |                  17,9 MB |       81,0 MB |  9.082 | en son kararlı paket                     |

`2026.5.12`, değişiklik günlüğündeki görünür Plugin çıkarma kilometre taşıdır: Amazon Bedrock, Bedrock Mantle, Slack, OpenShell korumalı alanı, Anthropic Vertex, Matrix ve WhatsApp çekirdek bağımlılık yolundan çıkarıldı; böylece bağımlılık konileri her çekirdek kurulumuyla değil, ilgili Pluginlerle birlikte kurulur.

## Kova ajan turu özeti

Nisan ayının kararlı serisi iki farklı hikâye içerir. Nisan ayının başı yavaştı ancak olağan dışı değildi. Nisan sonu ise keskin bir regresyona dönüştü. `v2026.5.2`, sağlanan taramada sahte sağlayıcı hattının ilk kez 3-5 saniye aralığına düştüğü ve tutarlı biçimde başarılı olmaya başladığı noktadır.

Önceki yayımlanmış bağlam:

| Sürüm        | Kova      | Soğuk tur | Sıcak tur | Ajan tepe RSS'i |
| ------------ | --------- | --------: | --------: | --------------: |
| `v2026.4.10` | BAŞARISIZ | 11.031 ms |  7.962 ms |        679,0 MB |
| `v2026.4.12` | BAŞARISIZ | 11.965 ms |  8.289 ms |        713,5 MB |
| `v2026.4.14` | BAŞARISIZ |  9.819 ms |  7.458 ms |        686,2 MB |
| `v2026.4.20` | BAŞARISIZ | 22.314 ms | 18.811 ms |        810,8 MB |
| `v2026.4.22` | BAŞARISIZ |  9.630 ms |  7.459 ms |        743,0 MB |

Sağlanan tarama:

| Sürüm               | Kova      | Soğuk tur | Sıcak tur | Ajan tepe RSS'i |
| ------------------- | --------- | --------: | --------: | --------------: |
| `v2026.4.23`        | BAŞARISIZ | 47.847 ms |  8.010 ms |      1.082,7 MB |
| `v2026.4.24`        | BAŞARISIZ | 48.264 ms | 25.483 ms |        996,0 MB |
| `v2026.4.25`        | BAŞARISIZ | 81.080 ms | 59.172 ms |      1.113,9 MB |
| `v2026.4.26`        | BAŞARISIZ | 76.771 ms | 54.941 ms |      1.140,8 MB |
| `v2026.4.27`        | BAŞARISIZ | 60.902 ms | 33.699 ms |      1.156,0 MB |
| `v2026.4.29`        | BAŞARISIZ | 94.031 ms | 57.334 ms |      3.613,7 MB |
| `v2026.5.2`         | BAŞARILI  |  3.897 ms |  3.610 ms |        613,7 MB |
| `v2026.5.7`         | BAŞARILI  |  3.923 ms |  3.693 ms |        654,1 MB |
| `v2026.5.12`        | BAŞARILI  |  7.248 ms |  6.629 ms |        834,8 MB |
| `v2026.5.18`        | BAŞARILI  |  3.301 ms |  2.913 ms |        630,3 MB |
| `v2026.5.20`        | BAŞARILI  |  3.413 ms |  2.952 ms |        643,2 MB |
| `v2026.5.22`        | BAŞARILI  |  4.494 ms |  4.093 ms |        654,3 MB |
| `v2026.5.26`        | BAŞARILI  |  2.626 ms |  2.282 ms |        660,4 MB |
| `v2026.5.27-beta.1` | BAŞARILI  |  2.575 ms |  2.217 ms |        635,3 MB |
| `v2026.5.27`        | BAŞARILI  |  2.231 ms |  2.226 ms |        649,0 MB |
| `v2026.5.28`        | BAŞARILI  |  1.908 ms |  1.870 ms |        581,0 MB |

## Kaynak ölçümleri

Başarılı olan eski 17 referans için kaynak ölçümleri atlandı; çünkü bu kaynak ağaçlarında gerekli ölçüm giriş noktaları henüz yoktu. Bu referanslar için ajan turu ölçümleri yine de mevcuttur.

Temsilî kaynak ölçüm noktaları:

| Sürüm               | Varsayılan `readyz` p50 | 50 Plugin `readyz` p50 | CLI sağlık p50 | Plugin azami RSS'i |
| ------------------- | ----------------------: | ---------------------: | --------------: | -----------------: |
| `v2026.4.29`        |                2.819 ms |               2.618 ms |        1.679 ms |           389,0 MB |
| `v2026.5.2`         |                2.324 ms |               2.013 ms |        1.384 ms |           377,2 MB |
| `v2026.5.7`         |                1.649 ms |               1.540 ms |        1.175 ms |           387,6 MB |
| `v2026.5.18`        |                1.942 ms |               1.927 ms |          607 ms |           426,5 MB |
| `v2026.5.20`        |                1.966 ms |               1.987 ms |          621 ms |           455,0 MB |
| `v2026.5.22`        |                2.081 ms |               1.884 ms |        5.095 ms |           444,2 MB |
| `v2026.5.26`        |                1.546 ms |               1.634 ms |          656 ms |           400,4 MB |
| `v2026.5.27-beta.1` |                1.462 ms |               1.548 ms |          548 ms |           394,0 MB |
| `v2026.5.27`        |                1.491 ms |               1.571 ms |          553 ms |           401,5 MB |
| `v2026.5.28`        |                1.457 ms |               1.474 ms |          623 ms |           386,1 MB |

Ajan turu hattı başarılı olmasına rağmen `v2026.5.22` CLI sağlık sıçraması bu tabloda görülebilir. Hedefli CLI veya Gateway regresyonlarını araştırırken kaynak ölçümlerini kullanmaya devam edin.

## Kurulum alanı denetimi

Bağımlılık örnekleri, ay başına bir kararlı sürümün yanı sıra `2026.5.22` shrinkwrap ekleme olayını ve en son `2026.5.28` sürümünü kullanır.

| Nokta                | Kurulu bağımlılıklar | Temiz kurulum | OpenClaw paketi | İç içe `openclaw/node_modules` | Kök shrinkwrap | Canvas kurulum davranışı                         |
| -------------------- | --------------------: | -------------: | --------------: | -----------------------------: | -------------- | ------------------------------------------------ |
| Oca `2026.1.30`      |                   605 |        438.4MB |          45.8MB |                          2.4MB | hayır          | üst düzey sarmalayıcı + `darwin-arm64`           |
| Şub `2026.2.26`      |                   645 |        575.7MB |         110.1MB |                          3.5MB | hayır          | üst düzey sarmalayıcı + `darwin-arm64`           |
| Mar `2026.3.31`      |                   438 |        584.1MB |         234.8MB |                            0MB | hayır          | üst düzey sarmalayıcı + `darwin-arm64`           |
| Nis `2026.4.29`      |                   392 |        335.0MB |          97.4MB |                            0MB | hayır          | hiçbiri kurulmadı                                 |
| `2026.5.22`          |                   401 |      1,020.6MB |       1,020.4MB |                        911.8MB | evet           | iç içe: 12 `@napi-rs/canvas` paketinin tamamı    |
| May `2026.5.26`      |                   371 |        767.5MB |         767.4MB |                        656.4MB | evet           | iç içe: 12 `@napi-rs/canvas` paketinin tamamı    |
| `2026.5.27`          |                   371 |       767.1MiB |        766.9MiB |                       656.1MiB | evet           | iç içe: 12 `@napi-rs/canvas` paketinin tamamı    |
| En son `2026.5.28`   |                   300 |       361.7MiB |        361.6MiB |                       259.7MiB | evet           | hiçbiri kurulmadı                                 |

### Shrinkwrap sınırı

`2026.5.20`, kök shrinkwrap ve büyük bir iç içe OpenClaw bağımlılık ağacı
olmadan yayımlandı. `2026.5.22`, kök shrinkwrap'ı kullanıma sundu ve iç içe
`openclaw/node_modules` altına 911.8MB kurdu. `2026.5.28`, shrinkwrap'ı koruyor
ve iç içe `openclaw/node_modules` altına hâlâ 259.7MiB kuruyor, ancak yerel
temiz kurulum denetiminde artık hiçbir `@napi-rs/canvas` paketi kurmuyor.

Yayımlanmış tarball incelemesi sınırı doğruluyor:

| Sürüm       | Kararlı olarak yayımlandı mı? | Kök `npm-shrinkwrap.json` | Notlar                                           |
| ----------- | ----------------------------- | -------------------------- | ------------------------------------------------ |
| `2026.5.20` | evet                          | hayır                      | shrinkwrap öncesindeki son kararlı sürüm          |
| `2026.5.21` | hayır                         | geçerli değil              | kararlı npm sürümü yok                            |
| `2026.5.22` | evet                          | evet                       | shrinkwrap kullanıma sunuldu                      |
| `2026.5.23` | hayır                         | geçerli değil              | kararlı npm sürümü yok                            |
| `2026.5.24` | hayır                         | geçerli değil              | kararlı npm sürümü yok                            |
| `2026.5.25` | hayır                         | geçerli değil              | kararlı npm sürümü yok                            |
| `2026.5.26` | evet                          | evet                       | iç içe bağımlılık ağacı hâlâ mevcut               |
| `2026.5.27` | evet                          | evet                       | iç içe bağımlılık ağacı hâlâ mevcut               |
| `2026.5.28` | evet                          | evet                       | iç içe bağımlılık ağacı çok daha küçük            |

Önemli ayrım: **sorun shrinkwrap'ın kendisi değildir**.
`v2026.5.28` hâlâ kök shrinkwrap ile yayımlanıyor. Sorun, npm'in büyük bir iç
içe OpenClaw bağımlılık ağacını ve 12 `@napi-rs/canvas` platform paketinin
tamamını somutlaştırmasına neden olan paket yapısıydı. İç içe ağaç
`v2026.5.28` sürümünde daha küçüktür ve canvas platform dağılımı artık yerel
denetime dahil olmamaktadır.

Shrinkwrap'ın sade bir dille açıklaması ve bakımcı düzeyindeki paket
kontrolleri için [npm shrinkwrap](/tr/gateway/security/shrinkwrap) sayfasına bakın.

## Tedarik zinciri yorumu

Bağımlılık sayısı yalnızca bir kurulum boyutu ölçütü değil, operasyonel bir
güvenlik ölçütüdür. Her paket; operatörlerin güvenmesi gereken bakımcıların,
tarball'ların, geçişli güncellemelerin, isteğe bağlı yerel ikili dosyaların ve
kurulum zamanı davranışlarının kapsamını genişletir.

Temizleme yönü şöyledir:

- ağır ve isteğe bağlı yetenekleri varsayılan çekirdek kurulumun dışında tutmak
- Plugin paketlerinin kendi çalışma zamanı bağımlılık grafiğine sahip olmasını sağlamak
- Gateway başlatılırken çalışma zamanında paket yöneticisiyle onarımdan kaçınmak
- tüm platformlara ait yerel paketlerin somutlaştırılmasına yol açmadan belirlenebilir kurulumları korumak
- paket kabulü ve ölçüm yollarında kurulum betiklerini devre dışı tutmak
- yayımlamadan önce iç içe bağımlılık ağaçlarını ve isteğe bağlı yerel bağımlılık patlamalarını tespit etmek

İlgili belgeler:

- [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution)
- [Plugin envanteri](/tr/plugins/plugin-inventory)
- [Tam sürüm doğrulaması](/tr/reference/full-release-validation)
