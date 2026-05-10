---
read_when:
    - Aynı izin listesini birden fazla mesaj kanalı genelinde yapılandırma
    - Özel mesaj ve grup göndereni erişim kurallarını paylaşma
    - Mesaj kanalı erişim denetimini gözden geçirme
summary: Mesaj kanalları için yeniden kullanılabilir gönderen izin listeleri
title: Erişim grupları
x-i18n:
    generated_at: "2026-05-10T19:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

Erişim grupları, bir kez tanımlayıp kanal izin listelerinden `accessGroup:<name>` ile başvurduğunuz adlandırılmış gönderen listeleridir.

Aynı kişilere birkaç ileti kanalında izin verilmesi gerektiğinde veya tek bir güvenilir kümenin hem DM'lere hem de grup gönderen yetkilendirmesine uygulanması gerektiğinde bunları kullanın.

Erişim grupları tek başlarına erişim vermez. Bir grup yalnızca bir izin listesi alanı ona başvurduğunda önem kazanır.

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

| Anahtar   | Anlam                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Gruba başvuran her ileti kanalı için denetlenen paylaşılan girdiler. |
| `discord`  | Yalnızca Discord izin listesi eşleştirmesi için denetlenen girdiler.                    |
| `telegram` | Yalnızca Telegram izin listesi eşleştirmesi için denetlenen girdiler.                   |
| `whatsapp` | Yalnızca WhatsApp izin listesi eşleştirmesi için denetlenen girdiler.                   |

Girdiler, hedef kanalın normal `allowFrom` kurallarıyla eşleştirilir. OpenClaw gönderen kimliklerini kanallar arasında çevirmez. Alice'in bir Telegram kimliği ve bir Discord kimliği varsa, her iki kimliği de uygun anahtarların altında listeleyin.

## İzin listelerinden gruplara başvurma

İleti kanalı yolunun gönderen izin listelerini desteklediği her yerde `accessGroup:<name>` ile bir gruba başvurun.

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

Grupları ve doğrudan girdileri birlikte kullanabilirsiniz:

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

Erişim grupları, aşağıdakiler dahil olmak üzere paylaşılan ileti kanalı yetkilendirme yollarında kullanılabilir:

- `channels.<channel>.allowFrom` gibi DM gönderen izin listeleri
- `channels.<channel>.groupAllowFrom` gibi grup gönderen izin listeleri
- aynı gönderen eşleştirme kurallarını kullanan kanala özgü oda başına gönderen izin listeleri
- ileti kanalı gönderen izin listelerini yeniden kullanan komut yetkilendirme yolları

Kanal desteği, ilgili kanalın paylaşılan OpenClaw gönderen yetkilendirme yardımcıları üzerinden bağlanıp bağlanmadığına bağlıdır. Mevcut paketli destek Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo ve Zalo Personal'ı içerir. Statik `message.senders` grupları kanaldan bağımsız olacak şekilde tasarlanmıştır; bu nedenle yeni ileti kanalları, özel izin listesi genişletmesi yerine paylaşılan Plugin SDK yardımcılarını kullanarak bunları desteklemelidir.

## Plugin tanılamaları

Plugin yazarları, yapılandırılmış erişim grubu durumunu düz bir izin listesine geri genişletmeden inceleyebilir:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Sonuç, başvurulan, eşleşen, eksik, desteklenmeyen ve başarısız olan grupları bildirir. Tanılama veya uyumluluk testleri gerektiğinde bunu kullanın. `expandAllowFromWithAccessGroups(...)` öğesini yalnızca hâlâ düz bir `allowFrom` dizisi bekleyen uyumluluk yolları için kullanın.

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

`discord.channelAudience`, "şu anda bu lonca kanalını görüntüleyebilen Discord DM gönderenlerine izin ver" anlamına gelir. OpenClaw, göndereni yetkilendirme sırasında Discord üzerinden çözer ve Discord `ViewChannel` izin kurallarını uygular.

Bunu, bir Discord kanalı `#maintainers` veya `#on-call` gibi bir ekip için zaten doğruluk kaynağı olduğunda kullanın.

Gereksinimler ve başarısızlık davranışı:

- Botun loncaya ve kanala erişmesi gerekir.
- Botun Discord Developer Portal **Server Members Intent** iznine ihtiyacı vardır.
- Discord `Missing Access` döndürdüğünde, gönderen bir lonca üyesi olarak çözülemediğinde veya kanal başka bir loncaya ait olduğunda erişim grubu kapalı biçimde başarısız olur.

Discord'a özgü daha fazla örnek: [Discord erişim denetimi](/tr/channels/discord#access-control-and-routing)

## Güvenlik notları

- Erişim grupları rol değil, izin listesi takma adlarıdır. Tek başlarına sahip oluşturmaz, eşleştirme isteklerini onaylamaz veya araç izinleri vermezler.
- `dmPolicy: "open"` hâlâ etkin DM izin listesinde `"*"` gerektirir. Bir erişim grubuna başvurmak, genel erişimle aynı şey değildir.
- Eksik grup adları kapalı biçimde başarısız olur. `allowFrom` içinde `accessGroup:operators` varsa ve `accessGroups.operators` yoksa, bu girdi hiç kimseyi yetkilendirmez.
- Kanal kimliklerini kararlı tutun. Kanal her ikisini de desteklediğinde görünen adlar yerine sayısal/kullanıcı kimliklerini tercih edin.

## Sorun giderme

Bir gönderenin eşleşmesi gerekirken engelleniyorsa:

1. İzin listesi alanının tam `accessGroup:<name>` başvurusunu içerdiğini doğrulayın.
2. `accessGroups.<name>.type` değerinin doğru olduğunu doğrulayın.
3. Gönderen kimliğinin eşleşen kanal anahtarının altında veya `"*"` altında listelendiğini doğrulayın.
4. Girdinin ilgili kanalın normal izin listesi söz dizimini kullandığını doğrulayın.
5. Discord kanal kitleleri için botun lonca kanalını görebildiğini ve Server Members Intent'in etkin olduğunu doğrulayın.

Erişim denetimi yapılandırmasını düzenledikten sonra `openclaw doctor` çalıştırın. Çalışma zamanından önce birçok geçersiz izin listesi ve ilke birleşimini yakalar.
