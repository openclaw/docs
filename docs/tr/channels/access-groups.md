---
read_when:
    - Aynı izin listesini birden fazla mesaj kanalında yapılandırma
    - Paylaşımda doğrudan mesaj ve grup göndereni erişim kuralları
    - Mesaj kanalı erişim denetimini inceleme
summary: Mesaj kanalları için yeniden kullanılabilir gönderen izin listeleri
title: Erişim grupları
x-i18n:
    generated_at: "2026-05-02T08:47:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Erişim grupları, bir kez tanımladığınız ve kanal izin listelerinden `accessGroup:<name>` ile başvurduğunuz adlandırılmış gönderen listeleridir.

Aynı kişilere birden fazla ileti kanalında izin verilmesi gerektiğinde veya güvenilir bir kümenin hem DM hem de grup gönderen yetkilendirmesine uygulanması gerektiğinde bunları kullanın.

Erişim grupları tek başına erişim vermez. Bir grup yalnızca bir izin listesi alanı ona başvurduğunda anlamlıdır.

## Statik ileti gönderen grupları

Statik gönderen grupları `type: "message.senders"` kullanır.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Üye listeleri ileti kanalı kimliğine göre anahtarlanır:

| Anahtar    | Anlam                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Gruba başvuran her ileti kanalı için denetlenen paylaşılan girdiler. |
| `discord`  | Yalnızca Discord izin listesi eşleştirmesi için denetlenen girdiler.                    |
| `telegram` | Yalnızca Telegram izin listesi eşleştirmesi için denetlenen girdiler.                   |
| `whatsapp` | Yalnızca WhatsApp izin listesi eşleştirmesi için denetlenen girdiler.                   |

Girdiler, hedef kanalın normal `allowFrom` kurallarıyla eşleştirilir. OpenClaw gönderen kimliklerini kanallar arasında çevirmez. Alice'in bir Telegram kimliği ve bir Discord kimliği varsa, iki kimliği de uygun anahtarların altında listeleyin.

## İzin listelerinden gruplara başvurma

İleti kanalı yolunun gönderen izin listelerini desteklediği herhangi bir yerde `accessGroup:<name>` ile bir gruba başvurun.

DM izin listesi örneği:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Grup gönderen izin listesi örneği:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Grupları ve doğrudan girdileri karıştırabilirsiniz:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Desteklenen ileti kanalı yolları

Erişim grupları, paylaşılan ileti kanalı yetkilendirme yollarında kullanılabilir; bunlara şunlar dahildir:

- `channels.<channel>.allowFrom` gibi DM gönderen izin listeleri
- `channels.<channel>.groupAllowFrom` gibi grup gönderen izin listeleri
- aynı gönderen eşleştirme kurallarını kullanan, kanala özgü oda başına gönderen izin listeleri
- ileti kanalı gönderen izin listelerini yeniden kullanan komut yetkilendirme yolları

Kanal desteği, ilgili kanalın paylaşılan OpenClaw gönderen yetkilendirme yardımcılarına bağlanıp bağlanmadığına bağlıdır. Mevcut paketlenmiş destek Discord, Google Chat, Nostr, WhatsApp, Zalo ve Zalo Personal içerir. Statik `message.senders` grupları kanaldan bağımsız olacak şekilde tasarlanmıştır; bu nedenle yeni ileti kanalları, özel izin listesi genişletmesi yerine paylaşılan Plugin SDK yardımcılarını kullanarak bunları desteklemelidir.

## Discord kanal kitleleri

Discord ayrıca dinamik bir erişim grubu türünü destekler:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience`, "bu sunucu kanalını şu anda görüntüleyebilen Discord DM gönderenlerine izin ver" anlamına gelir. OpenClaw, yetkilendirme anında göndereni Discord üzerinden çözümler ve Discord `ViewChannel` izin kurallarını uygular.

Bunu, bir Discord kanalı `#maintainers` veya `#on-call` gibi bir ekip için zaten doğruluk kaynağı olduğunda kullanın.

Gereksinimler ve hata davranışı:

- Botun sunucuya ve kanala erişimi gerekir.
- Botun Discord Developer Portal **Server Members Intent** yetkisine ihtiyacı vardır.
- Discord `Missing Access` döndürdüğünde, gönderen bir sunucu üyesi olarak çözümlenemediğinde veya kanal başka bir sunucuya ait olduğunda erişim grubu kapalı başarısız olur.

Daha fazla Discord'a özgü örnek: [Discord erişim denetimi](/tr/channels/discord#access-control-and-routing)

## Güvenlik notları

- Erişim grupları rol değil, izin listesi takma adlarıdır. Tek başlarına sahip oluşturmaz, eşleştirme isteklerini onaylamaz veya araç izinleri vermezler.
- `dmPolicy: "open"` yine de etkin DM izin listesinde `"*"` bulunmasını gerektirir. Bir erişim grubuna başvurmak herkese açık erişimle aynı şey değildir.
- Eksik grup adları kapalı başarısız olur. `allowFrom`, `accessGroup:operators` içeriyorsa ve `accessGroups.operators` yoksa, bu girdi hiç kimseyi yetkilendirmez.
- Kanal kimliklerini kararlı tutun. Kanal her ikisini de desteklediğinde görünen adlar yerine sayısal/kullanıcı kimliklerini tercih edin.

## Sorun giderme

Bir gönderenin eşleşmesi gerekirken engelleniyorsa:

1. İzin listesi alanının tam `accessGroup:<name>` başvurusunu içerdiğini doğrulayın.
2. `accessGroups.<name>.type` değerinin doğru olduğunu doğrulayın.
3. Gönderen kimliğinin eşleşen kanal anahtarının altında veya `"*"` altında listelendiğini doğrulayın.
4. Girdinin o kanalın normal izin listesi söz dizimini kullandığını doğrulayın.
5. Discord kanal kitleleri için botun sunucu kanalını görebildiğini ve Server Members Intent özelliğinin etkin olduğunu doğrulayın.

Erişim denetimi yapılandırmasını düzenledikten sonra `openclaw doctor` çalıştırın. Çalışma zamanından önce birçok geçersiz izin listesi ve ilke kombinasyonunu yakalar.
