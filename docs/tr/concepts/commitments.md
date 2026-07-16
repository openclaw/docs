---
read_when:
    - OpenClaw'un doğal takip sorularını hatırlamasını istiyorsunuz
    - Çıkarıma dayalı yoklamaların hatırlatıcılardan nasıl farklı olduğunu anlamak istiyorsunuz
    - Takip taahhütlerini gözden geçirmek veya reddetmek istiyorsunuz
sidebarTitle: Commitments
summary: Tam olarak anımsatıcı olmayan durum yoklamaları için çıkarımsanan takip belleği
title: Çıkarılan taahhütler
x-i18n:
    generated_at: "2026-07-16T17:03:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Taahhütler, kısa ömürlü takip anılarıdır. Etkinleştirildiğinde OpenClaw,
bir konuşmanın gelecekte durum sormak için bir fırsat oluşturduğunu fark edip
bunu daha sonra yeniden gündeme getirmeyi hatırlayabilir.

Örnekler:

- Yarın bir mülakattan söz edersiniz. OpenClaw sonrasında nasıl geçtiğini sorabilir.
- Çok yorgun olduğunuzu söylersiniz. OpenClaw daha sonra uyuyup uyumadığınızı sorabilir.
- Aracı, bir şey değiştikten sonra takip edeceğini söyler. OpenClaw bu
  açık konuyu izleyebilir.

Taahhütler, `MEMORY.md` gibi kalıcı bilgiler değildir ve kesin
hatırlatıcılar da değildir. Bellek ile otomasyon arasında yer alırlar: OpenClaw,
konuşmaya bağlı bir yükümlülüğü hatırlar, ardından zamanı geldiğinde heartbeat
bunu iletir.

## Taahhütleri etkinleştirme

Taahhütler varsayılan olarak kapalıdır (`commitments.enabled: false`). Yapılandırmada etkinleştirin:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Eşdeğer `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay`, hareketli bir günlük dönem içinde her aracı oturumunda
iletilebilecek çıkarımsal takiplerin sayısını sınırlar. Varsayılan değer
`3` şeklindedir.

## Nasıl çalışır?

Bir aracı yanıtından sonra OpenClaw, araçların devre dışı olduğu ayrı bir
bağlamda gizli bir arka plan çıkarım geçişi çalıştırabilir. Bu geçiş yalnızca
çıkarımsal takip taahhütlerini arar. Görünür konuşmaya yazmaz ve ana aracıdan
çıkarım hakkında akıl yürütmesini istemez.

OpenClaw, yüksek güvenilirlikli bir aday bulduğunda şu bilgilerle bir taahhüt saklar:

- aracı kimliği
- oturum anahtarı
- özgün kanal ve iletim hedefi
- bir vade aralığı
- önerilen kısa bir durum sorusu
- heartbeat'in gönderip göndermemeye karar vermesi için talimat niteliğinde olmayan meta veriler

İletim heartbeat üzerinden gerçekleşir. Bir taahhüdün zamanı geldiğinde heartbeat,
taahhüdü aynı aracı ve kanal kapsamındaki heartbeat turuna ekler. İstem,
taahhüt meta verilerinin güvenilmez olduğu konusunda açıkça uyarır ve modele
bunlardaki talimatları izlememesini veya bunlar nedeniyle araçları kullanmamasını
söyler. Model, doğal bir durum sorusu gönderebilir veya reddetmek için
`HEARTBEAT_OK` yanıtını verebilir. Heartbeat `target: "none"` ile
yapılandırılmışsa, zamanı gelen taahhütler dahili kalır ve harici durum soruları
göndermez. Taahhüt iletim istemleri özgün konuşma metnini yeniden oynatmaz;
yalnızca önerilen durum sorusunu ve meta verileri içerir. Ayrıca, zamanı gelen
taahhütlere ilişkin heartbeat turları OpenClaw araçları olmadan çalışır.

OpenClaw, çıkarımsal bir taahhüdü yazdıktan hemen sonra hiçbir zaman iletmez.
Vade zamanı, taahhüt oluşturulduktan sonra en az bir heartbeat aralığı olacak
şekilde sınırlandırılır; böylece takip, çıkarıldığı anda geri yansıtılamaz.

## Kapsam

Taahhütler, oluşturuldukları tam aracı ve kanal bağlamıyla sınırlıdır.
Discord'da bir aracıyla konuşurken çıkarılan bir takip; başka bir aracı,
başka bir kanal veya ilgisiz bir oturum tarafından iletilmez.

Bu kapsam, özelliğin bir parçasıdır. Doğal durum soruları, küresel bir
hatırlatma sistemi gibi değil, aynı konuşmanın devamı gibi hissettirmelidir.

## Taahhütler ve hatırlatıcılar

| İhtiyaç                                         | Kullanım                                 |
| ----------------------------------------------- | ---------------------------------------- |
| "Bana saat 15.00'te hatırlat"                   | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "20 dakika içinde bana mesaj gönder"            | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Bu raporu hafta içi her gün çalıştır"           | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Yarın bir mülakatım var"                       | Taahhütler                               |
| "Bütün gece uyumadım"                           | Taahhütler                               |
| "Bu açık konuya yanıt vermezsem takip et"       | Taahhütler                               |

Kesin kullanıcı istekleri zaten zamanlayıcı yoluna aittir. Taahhütler yalnızca
çıkarımsal takipler içindir: kullanıcının bir hatırlatıcı istemediği, ancak
konuşmanın gelecekte yararlı bir durum sorma fırsatı oluşturduğu anlar.

## Taahhütleri yönetme

Saklanan taahhütleri incelemek ve temizlemek için CLI'ı kullanın:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Komutların tam başvurusu için [`openclaw commitments`](/tr/cli/commitments) bölümüne bakın.

## Gizlilik ve maliyet

Taahhüt çıkarımı bir LLM geçişi kullanır; dolayısıyla etkinleştirilmesi, uygun
turlardan sonra arka planda model kullanımını artırır. Geçiş, kullanıcının
görebildiği konuşmada gizlidir ancak bir takibin bulunup bulunmadığına karar
vermek için gereken son yazışmaları okuyabilir.

Saklanan taahhütler, uzun süreli bellek değil, paylaşılan SQLite durum
veritabanındaki yerel OpenClaw operasyonel belleğidir. Özelliği şu komutla
devre dışı bırakın:

```bash
openclaw config set commitments.enabled false
```

## Sorun giderme

Beklenen takipler görünmüyorsa:

- `commitments.enabled` değerinin `true` olduğunu doğrulayın.
- Bekleyen, reddedilmiş, ertelenmiş veya süresi dolmuş kayıtlar için
  `openclaw commitments --all` değerini kontrol edin.
- Aracı için heartbeat'in çalıştığından emin olun.
- Söz konusu aracı oturumu için `commitments.maxPerDay` değerine daha önce
  ulaşılıp ulaşılmadığını kontrol edin.
- Kesin hatırlatıcıların taahhüt çıkarımı tarafından atlandığını ve bunun yerine
  [zamanlanmış görevler](/tr/automation/cron-jobs) altında görünmesi gerektiğini unutmayın.

## İlgili konular

- [Belleğe genel bakış](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [`openclaw commitments`](/tr/cli/commitments)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#commitments)
