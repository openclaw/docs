---
read_when:
    - Mayıs 2026 performans ve paket boyutu temizliğini doğruluyorsunuz
    - OpenClaw performans ve bağımlılık blog yazısının arkasındaki sayılara ihtiyacınız var
    - OpenClaw sürüm kapılarını, paket shrinkwrap'unu veya Plugin bağımlılık sınırlarını değiştiriyorsunuz
summary: Mayıs 2026 performans, paket boyutu, bağımlılık ve shrinkwrap temizliği için görsel özet ve teknik kanıt
title: Sürüm performans taraması
x-i18n:
    generated_at: "2026-06-28T01:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Bu sayfa, Mayıs 2026 OpenClaw performans, paket boyutu, bağımlılık ve
shrinkwrap temizliğinin arkasındaki kanıtları kaydeder. Herkese açık blog
yazısının teknik eşlikçisidir.

Burada iki denetim birleştirilmiştir:

- **Sürüm performans taraması:** `v2026.5.28` sürümünden kararlı
  `v2026.4.23` sürümüne kadar GitHub Releases; `OpenClaw Performance` iş akışı,
  `profile=smoke`, sahte sağlayıcı hattı kullanılarak. Çoğu etiket satırı tek
  örnektir; `v2026.5.27` ve `v2026.5.28` satırları en son repeat-3 sürüm dalı
  yapıtlarını kullanır.
- **Önceki Nisan bağlamı:** `v2026.4.1` ile `v2026.5.2` arasındaki yayımlanmış
  `clawgrit-reports` sahte sağlayıcı temel değerleri; yalnızca bozuk Nisan sonu
  sürümlerini herkese açık performans temel değeri olarak ele almamak için
  kullanılmıştır.
- **Kurulum ayak izi taraması:** boyut için `du -sk node_modules` ve paket
  örneği sayımları için bir `node_modules` yürüyüşüyle, geçici paketlere taze
  `npm install --ignore-scripts` kurulumları.
- **npm paket boyutu taraması:** yayımlanmış sürümler için
  `npm pack openclaw@<version> --dry-run --json`; sıkıştırılmış tarball boyutu,
  açılmış boyut ve dosya sayısı kaydedilerek.

<Warning>
Ana performans taraması, `v2026.5.27` ve `v2026.5.28` satırları dışında etiket
başına bir smoke örneği kullanır; bu iki satır en son repeat-3 sürüm dalı
yapıtlarını kullanır. Önceki Nisan bağlamı, `clawgrit-reports` içindeki
yayımlanmış repeat-3 medyanlarını kullanır. Sayıları sürüm geçidi istatistikleri
olarak değil, eğilim kanıtı ve regresyon avlama sinyali olarak ele alın.
</Warning>

## Anlık Görünüm

Performans kapsamı: **77 istenen sürüm**, **74 yapıt destekli nokta** ve
**3 kullanılamayan CI çalıştırması**. Ölçülen en son kararlı nokta: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **5,1 kat daha hızlı soğuk dönüş**

    - `v2026.4.14`: 9,8 sn
    - `v2026.5.28`: 1,9 sn

  </Card>
  <Card title="Published package" icon="package">
    **17,9 MB tarball**

    En son kararlı paket, Mart ayındaki 43,3 MB paket boyutu zirvesinden aşağıda.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **361,7 MiB taze kurulum**

    `v2026.5.28` iç içe OpenClaw bağımlılık ağacını keskin biçimde azaltır,
    ancak yerel kurulum denetiminde daha küçük bir 259,7 MiB iç içe ağaç hâlâ
    kalır.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 kurulu paket**

    En son kararlı sürüm; betikler devre dışı bırakılmış taze bir kurulumda
    benzersiz paket adı/sürüm kökleri olarak ölçülmüştür.

  </Card>
</CardGroup>

## Kurulum Ayak İzi Zaman Çizelgesi

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 bağımlılık**

    `2026.2.26`, bu örnekte aylık bağımlılık sayısı zirvesiydi.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **1.020,6 MB kurulum**

    `2026.5.22`, kök shrinkwrap ekledi ve bir paket şekli sorununu açığa
    çıkardı: 911,8 MB, iç içe `openclaw/node_modules` altına indi.

  </Card>
  <Card title="Latest stable" icon="tag">
    **361,7 MiB kurulum**

    `2026.5.28`, taze kurulum boyutunu `2026.5.27` sürümüne göre %52,8 azaltır,
    ancak hâlâ 259,7 MiB iç içe OpenClaw ağacı kurar.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 paket kökü**

    `2026.5.28`, `2026.5.27` sürümünden 71 daha az benzersiz paket adı/sürüm
    kökü kurar.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap tek başına sorun değildi. Kötü paket şekli sorundu. `v2026.5.28`
hâlâ shrinkwrap ile gelir, ancak iç içe bağımlılık ağacı çok daha küçüktür ve
yerel denetimde tüm platformları kapsayan canvas yayılımı kaybolmuştur.
</Tip>

## 5.28'de Neler Değişti

`v2026.5.27` ile `v2026.5.28` arasındaki temizlik, yeteneklerin kendisini
kaldırmak yerine varsayılan kurulum grafiğini azalttı.

<CardGroup cols={2}>
  <Card title="Kök varsayılan grafik" icon="git-branch">
    Benzersiz paket adı/sürüm kökleri **371**'den **300**'e düştü. Paket
    örnekleri **372**'den **301**'e düştü.
  </Card>
  <Card title="İç içe ağaç" icon="unplug">
    İç içe `openclaw/node_modules`, aynı yerel kurulum denetiminde
    **656.1MiB**'den **259.7MiB**'ye düştü.
  </Card>
  <Card title="Yerel isteğe bağlı koniler" icon="cpu">
    Tüm platformları kapsayan `@napi-rs/canvas` yerel paket konisi artık
    varsayılan kuruluma dahil olmuyor.
  </Card>
  <Card title="Tedarik zinciri yüzeyi" icon="shield">
    Daha az varsayılan paket; varsayılan olarak güvenilecek daha az tarball,
    bakımcı, yerel ikili dosya, kurulum zamanı davranışı ve geçişli güncelleme
    yolu demektir.
  </Card>
</CardGroup>

## Öne Çıkan Sayılar

Nisan sonundaki bozuk satırları herkese açık performans temel çizgileri olarak
kullanmayın. `v2026.4.23` ve `v2026.4.29` yararlı regresyon kanıtlarıdır, ancak
büyük `14x` tarzı deltalar çoğunlukla kötü bir yayın hattından toparlanmayı
açıklar.

Blog anlatımı için ölçek olarak daha erken Nisan yayımlanmış temel çizgisini
kullanın:

| Metrik          | Erken Nisan temel çizgisi | `v2026.5.28` |                    Delta |
| --------------- | ------------------------: | -----------: | -----------------------: |
| Soğuk ajan turu |                   9,819ms |      1,908ms | %80.6 daha düşük, 5.1x daha hızlı |
| Sıcak ajan turu |                   7,458ms |      1,870ms | %74.9 daha düşük, 4.0x daha hızlı |
| Ajan tepe RSS   |                   686.2MB |      581.0MB |              %15.3 daha düşük |

Erken Nisan temel çizgisi, yayımlanmış `clawgrit-reports` sahte sağlayıcı
çalıştırmasındaki `v2026.4.14` sürümüdür. Bu çalıştırma repeat 3 kullandı ve
yalnızca tanılama zaman çizelgesi yayımlanmadığı için başarısız oldu; soğuk,
sıcak ve RSS medyanları kaba ölçek olarak hâlâ yararlıdır. Bunu yayın kapısı
istatistiği değil, anlatı bağlamı olarak değerlendirin.

Mayıs taraması içinde en son yayın dalı satırı `v2026.5.2`'den belirgin şekilde
ilerledi:

| Metrik          | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Soğuk ajan turu |     3,897ms |      1,908ms | %51.0 daha düşük |
| Sıcak ajan turu |     3,610ms |      1,870ms | %48.2 daha düşük |
| Ajan tepe RSS   |     613.7MB |      581.0MB |  %5.3 daha düşük |

Önceki kararlı yayınla karşılaştırıldığında:

| Metrik          | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Soğuk ajan turu |      2,231ms |      1,908ms | %14.5 daha düşük |
| Sıcak ajan turu |      2,226ms |      1,870ms | %16.0 daha düşük |
| Ajan tepe RSS   |      649.0MB |      581.0MB | %10.5 daha düşük |

### Kurulum ayak izi

| Metrik                                          |  Temel çizgi | `v2026.5.28` |       Delta |
| ----------------------------------------------- | -----------: | -----------: | ----------: |
| `2026.5.22` zirvesinden kurulum boyutu          |    1,020.6MB |     361.7MiB | %64.6 daha düşük |
| En son yayın `2026.5.27`'den kurulum boyutu     |     767.1MiB |     361.7MiB | %52.8 daha düşük |
| Aylık yüksek `2026.2.26`'dan bağımlılıklar      |          645 |          300 | %53.5 daha düşük |
| En son yayın `2026.5.27`'den bağımlılıklar      |          371 |          300 | %19.1 daha düşük |
| `2026.5.22`'den iç içe `openclaw/node_modules`  |      911.8MB |     259.7MiB | %71.5 daha düşük |
| `2026.5.27`'den iç içe `openclaw/node_modules`  |     656.1MiB |     259.7MiB | %60.4 daha düşük |

### npm paket boyutu

| Sürüm       | Sıkıştırılmış tarball | Açılmış paket | Dosyalar | Notlar                            |
| ----------- | --------------------: | ------------: | -------: | --------------------------------- |
| `2026.1.30` |                12.8MB |        33.5MB |    4,607 | erken yeniden markalanmış paket   |
| `2026.2.26` |                23.6MB |        82.9MB |   10,125 | özellik büyümesi                  |
| `2026.3.31` |                43.3MB |       182.6MB |   21,037 | paket boyutu en yüksek noktası    |
| `2026.4.29` |                22.9MB |        74.6MB |    9,309 | paket budaması görünür            |
| `2026.5.12` |                23.4MB |        80.1MB |   12,035 | büyük harici Plugin ayrımı        |
| `2026.5.22` |                17.2MB |        76.9MB |   12,386 | dokümanlar/varlıklar paketten çıkarıldı |
| `2026.5.27` |                17.8MB |        79.0MB |   12,509 | önceki kararlı paket              |
| `2026.5.28` |                17.9MB |        81.0MB |    9,082 | en son kararlı paket              |

`2026.5.12`, değişiklik günlüğündeki görünür Plugin çıkarma kilometre taşıdır:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix ve WhatsApp çekirdek bağımlılık yolundan çıkarıldı; böylece bağımlılık
konileri her çekirdek kurulum yerine bu Plugin'lerle birlikte kurulur.

## Kova ajan turu özeti

Nisan kararlı hattı iki farklı hikaye içerir. Erken Nisan yavaştı ama tanınır
durumdaydı. Nisan sonu bir regresyon uçurumuna dönüştü. `v2026.5.2`, sahte
sağlayıcı hattının ilk kez 3-5s aralığına düştüğü ve sağlanan taramada tutarlı
şekilde geçmeye başladığı noktadır.

Daha önce yayımlanmış bağlam:

| Yayın        | Kova | Soğuk tur | Sıcak tur | Ajan tepe RSS |
| ------------ | ---- | --------: | --------: | -------------: |
| `v2026.4.10` | BAŞARISIZ |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | BAŞARISIZ |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | BAŞARISIZ |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | BAŞARISIZ |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | BAŞARISIZ |   9,630ms |   7,459ms |        743.0MB |

Sağlanan tarama:

| Yayın               | Kova | Soğuk tur | Sıcak tur | Ajan tepe RSS |
| ------------------- | ---- | --------: | --------: | -------------: |
| `v2026.4.23`        | BAŞARISIZ |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | BAŞARISIZ |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | BAŞARISIZ |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | BAŞARISIZ |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | BAŞARISIZ |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | BAŞARISIZ |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | BAŞARILI |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | BAŞARILI |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | BAŞARILI |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | BAŞARILI |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | BAŞARILI |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | BAŞARILI |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | BAŞARILI |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | BAŞARILI |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | BAŞARILI |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | BAŞARILI |   1,908ms |   1,870ms |        581.0MB |

## Kaynak probları

Kaynak probları, gerekli prob giriş noktaları bu kaynak ağaçlarında henüz
bulunmadığı için 17 başarılı eski ref için atlandı. Ajan turu metrikleri bu
ref'ler için hâlâ mevcuttur.

Temsili kaynak prob noktaları:

| Yayın               | Varsayılan `readyz` p50 | 50 Plugin `readyz` p50 | CLI sağlık p50 | Plugin maks RSS |
| ------------------- | ----------------------: | ---------------------: | -------------: | --------------: |
| `v2026.4.29`        |                 2,819ms |                2,618ms |        1,679ms |         389.0MB |
| `v2026.5.2`         |                 2,324ms |                2,013ms |        1,384ms |         377.2MB |
| `v2026.5.7`         |                 1,649ms |                1,540ms |        1,175ms |         387.6MB |
| `v2026.5.18`        |                 1,942ms |                1,927ms |          607ms |         426.5MB |
| `v2026.5.20`        |                 1,966ms |                1,987ms |          621ms |         455.0MB |
| `v2026.5.22`        |                 2,081ms |                1,884ms |        5,095ms |         444.2MB |
| `v2026.5.26`        |                 1,546ms |                1,634ms |          656ms |         400.4MB |
| `v2026.5.27-beta.1` |                 1,462ms |                1,548ms |          548ms |         394.0MB |
| `v2026.5.27`        |                 1,491ms |                1,571ms |          553ms |         401.5MB |
| `v2026.5.28`        |                 1,457ms |                1,474ms |          623ms |         386.1MB |

`v2026.5.22` CLI sağlık sıçraması, agent-turn hattı hâlâ geçmiş olsa da bu tabloda
görünür. Hedefli CLI veya Gateway regresyonlarını araştırırken kaynak problarını
koruyun.

## Kurulum alanı denetimi

Bağımlılık örnekleri ayda bir kararlı sürümün yanı sıra
`2026.5.22` shrinkwrap tanıtım olayını ve en son `2026.5.28` sürümünü kullanır.

| Nokta              | Kurulu bağımlılıklar | Temiz kurulum | OpenClaw paketi | İç içe `openclaw/node_modules` | Kök shrinkwrap | Canvas kurulum davranışı                  |
| ------------------ | -------------------: | ------------: | ---------------: | -----------------------------: | --------------- | ----------------------------------------- |
| Oca `2026.1.30`    |                  605 |       438.4MB |           45.8MB |                          2.4MB | hayır           | üst düzey sarmalayıcı + `darwin-arm64`    |
| Şub `2026.2.26`    |                  645 |       575.7MB |          110.1MB |                          3.5MB | hayır           | üst düzey sarmalayıcı + `darwin-arm64`    |
| Mar `2026.3.31`    |                  438 |       584.1MB |          234.8MB |                            0MB | hayır           | hiçbiri kurulmadı                         |
| Nis `2026.4.29`    |                  392 |       335.0MB |           97.4MB |                            0MB | hayır           | hiçbiri kurulmadı                         |
| `2026.5.22`        |                  401 |     1,020.6MB |        1,020.4MB |                        911.8MB | evet            | iç içe: 12 `@napi-rs/canvas` paketinin tümü |
| May `2026.5.26`    |                  371 |       767.5MB |          767.4MB |                        656.4MB | evet            | iç içe: 12 `@napi-rs/canvas` paketinin tümü |
| `2026.5.27`        |                  371 |      767.1MiB |         766.9MiB |                       656.1MiB | evet            | iç içe: 12 `@napi-rs/canvas` paketinin tümü |
| En son `2026.5.28` |                  300 |      361.7MiB |         361.6MiB |                       259.7MiB | evet            | hiçbiri kurulmadı                         |

### Shrinkwrap sınırı

<CardGroup cols={2}>
  <Card title="Shrinkwrap öncesi" icon="unlock">
    `2026.5.20` kök shrinkwrap içermez ve büyük bir iç içe OpenClaw bağımlılık
    ağacı yoktur.
  </Card>
  <Card title="Tanıtıldı" icon="lock">
    `2026.5.22` kök shrinkwrap ekler ve iç içe `openclaw/node_modules` altında
    911.8MB kurar.
  </Card>
  <Card title="En son kararlı" icon="tag">
    `2026.5.28` shrinkwrap kullanmayı sürdürür ve iç içe
    `openclaw/node_modules` altında hâlâ 259.7MiB kurar.
  </Card>
  <Card title="Canvas yayılımı düzeltildi" icon="check">
    `2026.5.28` yerel temiz kurulum denetiminde artık hiçbir `@napi-rs/canvas`
    paketi kurmaz.
  </Card>
</CardGroup>

Yayımlanmış tarball incelemesi sınırı doğrular:

| Sürüm       | Yayımlanmış kararlı mı? | Kök `npm-shrinkwrap.json` | Notlar                                  |
| ----------- | ----------------------- | -------------------------- | --------------------------------------- |
| `2026.5.20` | evet                    | hayır                      | shrinkwrap öncesindeki son kararlı sürüm |
| `2026.5.21` | hayır                   | geçerli değil              | kararlı npm sürümü yok                  |
| `2026.5.22` | evet                    | evet                       | shrinkwrap tanıtıldı                    |
| `2026.5.23` | hayır                   | geçerli değil              | kararlı npm sürümü yok                  |
| `2026.5.24` | hayır                   | geçerli değil              | kararlı npm sürümü yok                  |
| `2026.5.25` | hayır                   | geçerli değil              | kararlı npm sürümü yok                  |
| `2026.5.26` | evet                    | evet                       | iç içe bağımlılık ağacı hâlâ mevcut     |
| `2026.5.27` | evet                    | evet                       | iç içe bağımlılık ağacı hâlâ mevcut     |
| `2026.5.28` | evet                    | evet                       | iç içe bağımlılık ağacı çok daha küçük  |

Önemli ayrım: **sorun shrinkwrap'ın kendisi değildir**.
`v2026.5.28` hâlâ kök shrinkwrap ile gelir. Sorun, npm'in büyük bir iç içe
OpenClaw bağımlılık ağacı ve 12 `@napi-rs/canvas` platform paketinin tümünü
oluşturmasına neden olan paket biçimiydi. İç içe ağaç `v2026.5.28` içinde daha
küçüktür ve canvas platform yayılımı artık yerel denetime düşmez.

Shrinkwrap ve bakımcı düzeyindeki paket denetimlerinin sade dille açıklaması
için [npm shrinkwrap](/tr/gateway/security/shrinkwrap) bölümüne bakın.

## Tedarik zinciri yorumu

Bağımlılık sayısı yalnızca bir kurulum boyutu metriği değil, operasyonel bir
güvenlik metriğidir. Her paket; operatörlerin güvenmesi gereken bakımcılar,
tarball'lar, geçişli güncellemeler, isteğe bağlı yerel ikililer ve kurulum
zamanı davranışları kümesini genişletir.

Temizlik yönü şudur:

- ağır ve isteğe bağlı yetenekleri varsayılan çekirdek kurulumun dışında tutmak
- Plugin paketlerinin kendi çalışma zamanı bağımlılık grafiğine sahip olmasını sağlamak
- Gateway başlatması sırasında çalışma zamanı paket yöneticisi onarımından kaçınmak
- tüm platformlara ait yerel paketlerin somutlaşmasına neden olmadan deterministik kurulumları korumak
- paket kabulü ve ölçüm yollarında kurulum betiklerini devre dışı tutmak
- iç içe bağımlılık ağaçlarını ve isteğe bağlı yerel bağımlılık patlamalarını
  yayımlamadan önce yakalamak

İlgili dokümanlar:

- [Plugin bağımlılık çözümlemesi](/tr/plugins/dependency-resolution)
- [Plugin envanteri](/tr/plugins/plugin-inventory)
- [Tam sürüm doğrulaması](/tr/reference/full-release-validation)
