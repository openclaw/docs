---
read_when:
    - OpenClaw'ın doğal takip sorularını hatırlamasını istiyorsunuz
    - Çıkarıma dayalı yoklamaların hatırlatıcılardan nasıl farklı olduğunu anlamak istiyorsunuz
    - Takip taahhütlerini gözden geçirmek veya kapatmak istiyorsunuz
sidebarTitle: Commitments
summary: Tam olarak anımsatıcı olmayan durum yoklamaları için çıkarımsal takip belleği
title: Çıkarım yoluyla belirlenen taahhütler
x-i18n:
    generated_at: "2026-07-12T12:12:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Taahhütler, kısa ömürlü takip anılarıdır. Etkinleştirildiğinde OpenClaw, bir konuşmanın gelecekte yeniden iletişim kurma fırsatı oluşturduğunu fark edip bunu daha sonra yeniden gündeme getirmek üzere hatırlayabilir.

Örnekler:

- Yarın bir mülakatınız olduğundan bahsedersiniz. OpenClaw sonrasında nasıl geçtiğini sorabilir.
- Çok yorgun olduğunuzu söylersiniz. OpenClaw daha sonra uyuyup uyumadığınızı sorabilir.
- Agent, bir şey değiştikten sonra takip edeceğini söyler. OpenClaw bu açık döngüyü izleyebilir.

Taahhütler, `MEMORY.md` gibi kalıcı bilgiler veya kesin zamanlı hatırlatıcılar değildir. Bellek ile otomasyon arasında yer alırlar: OpenClaw, konuşmaya bağlı bir yükümlülüğü hatırlar ve zamanı geldiğinde Heartbeat bunu iletir.

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

`commitments.maxPerDay`, kayan bir günlük dönem içinde agent oturumu başına iletilebilecek çıkarımsal takip sayısını sınırlar. Varsayılan değer `3`'tür.

## Nasıl çalışır?

Bir agent yanıtından sonra OpenClaw, araçların devre dışı olduğu ayrı bir bağlamda gizli bir arka plan çıkarım geçişi çalıştırabilir. Bu geçiş yalnızca çıkarımsal takip taahhütlerini arar. Görünür konuşmaya yazmaz ve ana agent'tan çıkarım hakkında akıl yürütmesini istemez.

OpenClaw, yüksek güven düzeyine sahip bir aday bulduğunda şu bilgilerle bir taahhüt saklar:

- agent kimliği
- oturum anahtarı
- özgün kanal ve iletim hedefi
- bir vade aralığı
- önerilen kısa bir durum sorgusu
- Heartbeat'in gönderip göndermemeye karar vermesi için talimat niteliğinde olmayan meta veriler

İletim Heartbeat üzerinden gerçekleşir. Bir taahhüdün zamanı geldiğinde Heartbeat, taahhüdü aynı agent ve kanal kapsamındaki Heartbeat turuna ekler. İstem, taahhüt meta verilerinin güvenilir olmadığı konusunda açıkça uyarır ve modele bunların içindeki talimatları izlememesini veya bunlar nedeniyle araçları kullanmamasını söyler. Model, doğal bir durum sorgusu gönderebilir veya taahhüdü kapatmak için `HEARTBEAT_OK` yanıtını verebilir. Heartbeat `target: "none"` ile yapılandırılmışsa zamanı gelen taahhütler sistem içinde kalır ve harici durum sorguları göndermez. Taahhüt iletim istemleri özgün konuşma metnini yeniden oynatmaz; yalnızca önerilen durum sorgusunu ve meta verileri içerir. Ayrıca zamanı gelen taahhütlere yönelik Heartbeat turları OpenClaw araçları olmadan çalışır.

OpenClaw, çıkarımsal bir taahhüdü kaydettikten hemen sonra asla iletmez. Vade zamanı, taahhüdün oluşturulmasından en az bir Heartbeat aralığı sonrasına sabitlenir; böylece takip, çıkarıldığı anda geri yansıtılamaz.

## Kapsam

Taahhütler, oluşturuldukları agent ve kanal bağlamıyla tam olarak sınırlandırılır. Discord'da bir agent ile konuşurken çıkarılan bir takip; başka bir agent, başka bir kanal veya ilgisiz bir oturum tarafından iletilmez.

Bu kapsam, özelliğin bir parçasıdır. Doğal durum sorguları, küresel bir hatırlatma sistemi gibi değil, aynı konuşmanın devamı gibi hissettirmelidir.

## Taahhütler ile hatırlatıcıların karşılaştırması

| İhtiyaç                                             | Kullanım                                  |
| --------------------------------------------------- | ----------------------------------------- |
| "Bana saat 15.00'te hatırlat"                       | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "20 dakika sonra bana haber ver"                    | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Bu raporu hafta içi her gün çalıştır"              | [Zamanlanmış görevler](/tr/automation/cron-jobs) |
| "Yarın bir mülakatım var"                           | Taahhütler                                |
| "Bütün gece uyumadım"                               | Taahhütler                                |
| "Bu açık konuya yanıt vermezsem takip et"           | Taahhütler                                |

Kullanıcının kesin istekleri zaten zamanlayıcı yoluna aittir. Taahhütler yalnızca çıkarımsal takipler içindir: Kullanıcının bir hatırlatıcı istemediği, ancak konuşmanın gelecekte yararlı olacak bir durum sorgusu için açıkça fırsat oluşturduğu anlar.

## Taahhütleri yönetme

Saklanan taahhütleri incelemek ve temizlemek için CLI'ı kullanın:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Komutların tam başvurusu için [`openclaw commitments`](/tr/cli/commitments) sayfasına bakın.

## Gizlilik ve maliyet

Taahhüt çıkarımı bir LLM geçişi kullanır; dolayısıyla etkinleştirilmesi, uygun turlardan sonra arka planda model kullanımını artırır. Geçiş, kullanıcının gördüğü konuşmada gizlidir ancak bir takibin bulunup bulunmadığına karar vermek için gereken yakın tarihli iletişimi okuyabilir.

Saklanan taahhütler yerel OpenClaw durumudur. Bunlar uzun vadeli bellek değil, operasyonel bellektir. Özelliği şu komutla devre dışı bırakın:

```bash
openclaw config set commitments.enabled false
```

## Sorun giderme

Beklenen takipler görünmüyorsa:

- `commitments.enabled` değerinin `true` olduğunu doğrulayın.
- Bekleyen, kapatılmış, ertelenmiş veya süresi dolmuş kayıtlar için `openclaw commitments --all` çıktısını kontrol edin.
- Agent için Heartbeat'in çalıştığından emin olun.
- Söz konusu agent oturumu için `commitments.maxPerDay` sınırına ulaşılıp ulaşılmadığını kontrol edin.
- Kesin zamanlı hatırlatıcıların taahhüt çıkarımı tarafından atlandığını ve bunun yerine [zamanlanmış görevler](/tr/automation/cron-jobs) altında görünmesi gerektiğini unutmayın.

## İlgili içerikler

- [Belleğe genel bakış](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [`openclaw commitments`](/tr/cli/commitments)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#commitments)
