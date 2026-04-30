---
read_when:
    - OpenClaw'un doğal takip sorularını hatırlamasını istiyorsunuz
    - Çıkarımsal yoklamaların hatırlatıcılardan nasıl farklı olduğunu anlamak istiyorsunuz
    - Takip taahhütlerini gözden geçirmek veya kapatmak istiyorsunuz
sidebarTitle: Commitments
summary: Kesin hatırlatıcı olmayan durum yoklamaları için çıkarımlanan takip belleği
title: Çıkarılan taahhütler
x-i18n:
    generated_at: "2026-04-30T09:15:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Taahhütler kısa ömürlü takip bellekleridir. Etkinleştirildiğinde, OpenClaw bir konuşmanın gelecekte kontrol etme fırsatı oluşturduğunu fark edebilir ve bunu daha sonra tekrar gündeme getirmeyi hatırlayabilir.

Örnekler:

- Yarın bir mülakattan söz edersiniz. OpenClaw sonrasında sizi yoklayabilir.
- Bitkin olduğunuzu söylersiniz. OpenClaw daha sonra uyuyup uyumadığınızı sorabilir.
- Ajan, bir şey değiştikten sonra takip edeceğini söyler. OpenClaw bu açık döngüyü takip edebilir.

Taahhütler `MEMORY.md` gibi kalıcı gerçekler değildir ve tam hatırlatıcılar da değildir. Bellek ile otomasyon arasında yer alırlar: OpenClaw konuşmaya bağlı bir yükümlülüğü hatırlar, sonra zamanı geldiğinde Heartbeat bunu teslim eder.

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

`commitments.maxPerDay`, kayan bir gün içinde ajan oturumu başına kaç çıkarımsal takibin teslim edilebileceğini sınırlar. Varsayılan değer `3` şeklindedir.

## Nasıl çalışır

Bir ajan yanıtından sonra OpenClaw, ayrı bir bağlamda gizli bir arka plan çıkarım geçişi çalıştırabilir. Bu geçiş yalnızca çıkarımsal takip taahhütlerini arar. Görünür konuşmaya yazmaz ve ana ajandan çıkarım hakkında akıl yürütmesini istemez.

Yüksek güvenilirlikli bir aday bulduğunda OpenClaw şunlarla birlikte bir taahhüt depolar:

- ajan kimliği
- oturum anahtarı
- özgün kanal ve teslimat hedefi
- vade aralığı
- kısa önerilen kontrol mesajı
- Heartbeat’in bunu gönderip göndermemeye karar vermesi için yeterli kaynak bağlamı

Teslimat Heartbeat üzerinden gerçekleşir. Bir taahhüdün zamanı geldiğinde Heartbeat, taahhüdü aynı ajan ve kanal kapsamı için Heartbeat turuna ekler. Model doğal bir kontrol mesajı gönderebilir veya bunu kapatmak için `HEARTBEAT_OK` yanıtını verebilir.

OpenClaw, çıkarımsal bir taahhüdü yazdıktan hemen sonra asla teslim etmez. Vade zamanı, taahhüt oluşturulduktan sonra en az bir Heartbeat aralığına sıkıştırılır; böylece takip, çıkarıldığı anda aynı şekilde geri yankılanamaz.

## Kapsam

Taahhütler, oluşturuldukları tam ajan ve kanal bağlamına kapsamlanır. Discord’da bir ajanla konuşurken çıkarılan bir takip, başka bir ajan, başka bir kanal veya ilgisiz bir oturum tarafından teslim edilmez.

Bu kapsam özelliğin bir parçasıdır. Doğal yoklamalar, küresel bir hatırlatıcı sistemi gibi değil, aynı konuşmanın devamı gibi hissettirmelidir.

## Taahhütler ve hatırlatıcılar

| İhtiyaç                                         | Kullanım                                 |
| ----------------------------------------------- | ---------------------------------------- |
| "Bana saat 15.00'te hatırlat"                   | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "20 dakika içinde bana ping at"                 | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Bu raporu her hafta içi çalıştır"             | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Yarın bir mülakatım var"                      | Taahhütler                               |
| "Bütün gece ayaktaydım"                         | Taahhütler                               |
| "Bu açık konuya yanıt vermezsem takip et"       | Taahhütler                               |

Kesin kullanıcı istekleri zaten zamanlayıcı yoluna aittir. Taahhütler yalnızca çıkarımsal takipler içindir: kullanıcının hatırlatıcı istemediği, ancak konuşmanın açıkça yararlı bir gelecekte kontrol etme noktası oluşturduğu anlar.

## Taahhütleri yönetme

Depolanan taahhütleri incelemek ve temizlemek için CLI kullanın:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Komut başvurusu için [`openclaw commitments`](/tr/cli/commitments) bölümüne bakın.

## Gizlilik ve maliyet

Taahhüt çıkarımı bir LLM geçişi kullanır; bu nedenle etkinleştirmek, uygun turlardan sonra arka plan model kullanımı ekler. Geçiş, kullanıcının görebildiği konuşmadan gizlidir, ancak bir takibin var olup olmadığına karar vermek için gereken son alışverişi okuyabilir.

Depolanan taahhütler yerel OpenClaw durumudur. Bunlar uzun vadeli bellek değil, operasyonel bellektir. Özelliği şu komutla devre dışı bırakın:

```bash
openclaw config set commitments.enabled false
```

## Sorun giderme

Beklenen takipler görünmüyorsa:

- `commitments.enabled` değerinin `true` olduğunu doğrulayın.
- Bekleyen, kapatılmış, ertelenmiş veya süresi dolmuş kayıtlar için `openclaw commitments --all` komutunu kontrol edin.
- Ajan için Heartbeat’in çalıştığından emin olun.
- Söz konusu ajan oturumu için `commitments.maxPerDay` değerine zaten ulaşılıp ulaşılmadığını kontrol edin.
- Kesin hatırlatıcıların taahhüt çıkarımı tarafından atlandığını ve bunun yerine [zamanlanmış görevler](/tr/automation/cron-jobs) altında görünmesi gerektiğini unutmayın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [`openclaw commitments`](/tr/cli/commitments)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#commitments)
