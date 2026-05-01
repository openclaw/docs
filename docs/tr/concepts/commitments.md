---
read_when:
    - OpenClaw'ın doğal takip sorularını hatırlamasını istiyorsunuz
    - Çıkarıma dayalı durum yoklamalarının hatırlatıcılardan nasıl farklı olduğunu anlamak istiyorsunuz
    - Takip taahhütlerini gözden geçirmek veya reddetmek istiyorsunuz
sidebarTitle: Commitments
summary: Kesin hatırlatma olmayan durum yoklamaları için çıkarımsal takip belleği
title: Çıkarılan taahhütler
x-i18n:
    generated_at: "2026-05-01T09:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Taahhütler kısa ömürlü takip bellekleridir. Etkinleştirildiğinde OpenClaw,
bir konuşmanın gelecekte bir kontrol fırsatı oluşturduğunu fark edip bunu
daha sonra yeniden gündeme getirmeyi hatırlayabilir.

Örnekler:

- Yarın bir görüşmeden bahsedersiniz. OpenClaw sonrasında kontrol edebilir.
- Bitkin olduğunuzu söylersiniz. OpenClaw daha sonra uyuyup uyumadığınızı sorabilir.
- Ajan, bir şey değiştikten sonra takip edeceğini söyler. OpenClaw bu açık
  döngüyü takip edebilir.

Taahhütler, `MEMORY.md` gibi kalıcı gerçekler değildir ve kesin hatırlatıcılar
da değildir. Bellek ile otomasyon arasında dururlar: OpenClaw konuşmaya bağlı
bir yükümlülüğü hatırlar, ardından zamanı geldiğinde Heartbeat bunu iletir.

## Taahhütleri etkinleştirme

Taahhütler varsayılan olarak kapalıdır. Bunları yapılandırmada etkinleştirin:

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

`commitments.maxPerDay`, kayan bir gün içinde ajan oturumu başına kaç çıkarımsal
takibin iletilebileceğini sınırlar. Varsayılan değer `3`'tür.

## Nasıl çalışır

Bir ajan yanıtından sonra OpenClaw, ayrı bir bağlamda gizli bir arka plan çıkarma
geçişi çalıştırabilir. Bu geçiş yalnızca çıkarımsal takip taahhütlerini arar.
Görünür konuşmaya yazmaz ve ana ajandan çıkarma hakkında akıl yürütmesini istemez.

Yüksek güvenilirlikte bir aday bulduğunda OpenClaw şu bilgilerle bir taahhüt saklar:

- ajan kimliği
- oturum anahtarı
- özgün kanal ve teslim hedefi
- vade penceresi
- kısa bir önerilen kontrol
- Heartbeat'in gönderip göndermemeye karar vermesi için yönerge olmayan meta veriler

Teslimat Heartbeat aracılığıyla gerçekleşir. Bir taahhüdün zamanı geldiğinde,
Heartbeat taahhüdü aynı ajan ve kanal kapsamı için Heartbeat turuna ekler.
Model doğal bir kontrol mesajı gönderebilir veya bunu kapatmak için `HEARTBEAT_OK`
yanıtını verebilir. Heartbeat `target: "none"` ile yapılandırılmışsa, zamanı
gelen taahhütler dahili kalır ve harici kontrol mesajları göndermez. Taahhüt
teslimi istemleri özgün konuşma metnini yeniden oynatmaz ve zamanı gelen taahhüt
Heartbeat turları OpenClaw araçları olmadan çalışır.

OpenClaw, çıkarımsal bir taahhüdü yazdıktan hemen sonra asla iletmez. Vade
zamanı, taahhüt oluşturulduktan sonra en az bir Heartbeat aralığı sonrasına
sabitlenir; böylece takip, çıkarıldığı aynı anda geri yankılanamaz.

## Kapsam

Taahhütler, oluşturuldukları tam ajan ve kanal bağlamıyla sınırlıdır. Discord'da
bir ajanla konuşurken çıkarılan bir takip, başka bir ajan, başka bir kanal veya
ilgisiz bir oturum tarafından iletilmez.

Bu kapsam özelliğin bir parçasıdır. Doğal kontroller, küresel bir hatırlatma
sistemi gibi değil, aynı konuşmanın devamı gibi hissettirmelidir.

## Taahhütler ve hatırlatıcılar

| İhtiyaç                                         | Kullanım                                 |
| ----------------------------------------------- | ---------------------------------------- |
| "Bana saat 15.00'te hatırlat"                   | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "20 dakika içinde bana ping at"                 | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Bu raporu her iş günü çalıştır"                | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Yarın bir görüşmem var"                        | Taahhütler                               |
| "Bütün gece ayaktaydım"                         | Taahhütler                               |
| "Bu açık başlığı yanıtlamazsam takip et"        | Taahhütler                               |

Kesin kullanıcı istekleri zaten zamanlayıcı yoluna aittir. Taahhütler yalnızca
çıkarımsal takipler içindir: kullanıcının bir hatırlatıcı istemediği, ancak
konuşmanın açıkça yararlı bir gelecek kontrolü oluşturduğu anlar.

## Taahhütleri yönetme

Saklanan taahhütleri incelemek ve temizlemek için CLI'ı kullanın:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Komut başvurusu için [`openclaw commitments`](/tr/cli/commitments) bölümüne bakın.

## Gizlilik ve maliyet

Taahhüt çıkarma bir LLM geçişi kullanır; bu nedenle bunu etkinleştirmek, uygun
turlardan sonra arka plan model kullanımı ekler. Geçiş, kullanıcıya görünen
konuşmadan gizlidir, ancak bir takibin var olup olmadığını belirlemek için
gereken son alışverişi okuyabilir.

Saklanan taahhütler yerel OpenClaw durumudur. Bunlar işletimsel bellektir,
uzun süreli bellek değildir. Özelliği şu komutla devre dışı bırakın:

```bash
openclaw config set commitments.enabled false
```

## Sorun giderme

Beklenen takipler görünmüyorsa:

- `commitments.enabled` değerinin `true` olduğunu doğrulayın.
- Bekleyen, kapatılmış, ertelenmiş veya süresi dolmuş kayıtlar için
  `openclaw commitments --all` komutunu kontrol edin.
- Heartbeat'in ajan için çalıştığından emin olun.
- `commitments.maxPerDay` sınırına o ajan oturumu için zaten ulaşılıp
  ulaşılmadığını kontrol edin.
- Kesin hatırlatıcıların taahhüt çıkarma tarafından atlandığını ve bunun yerine
  [zamanlanmış görevler](/tr/automation/cron-jobs) altında görünmesi gerektiğini unutmayın.

## İlgili

- [Bellek genel bakışı](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [`openclaw commitments`](/tr/cli/commitments)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#commitments)
