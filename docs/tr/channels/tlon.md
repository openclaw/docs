---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışma
summary: Tlon/Urbit destek durumu, yetenekleri ve yapılandırması
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Tlon, Urbit üzerine kurulmuş merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit geminize bağlanır ve
DM'lere ve grup sohbeti mesajlarına yanıt verebilir. Grup yanıtları varsayılan olarak @ bahsi gerektirir ve
izin listeleriyle daha da kısıtlanabilir.

Durum: paketle birlikte gelen Plugin. DM'ler, grup bahisleri, ileti dizisi yanıtları, zengin metin biçimlendirmesi ve
görsel yüklemeleri desteklenir. Tepkiler ve anketler henüz desteklenmez.

## Paketle birlikte gelen Plugin

Tlon, güncel OpenClaw sürümlerinde paketle birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş
derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Tlon'u hariç tutan özel bir kurulum kullanıyorsanız,
güncel bir npm paketi kurun:

CLI ile kurulum (npm kayıt deposu):

```bash
openclaw plugins install @openclaw/tlon
```

Güncel resmi sürüm etiketini takip etmek için yalın paketi kullanın. Kesin bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Kurulum

1. Tlon Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Gemi URL'nizi ve oturum açma kodunuzu alın.
3. `channels.tlon` yapılandırmasını ayarlayın.
4. Gateway'i yeniden başlatın.
5. Bota DM gönderin veya bir grup kanalında ondan bahsedin.

En küçük yapılandırma (tek hesap):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Özel/LAN gemileri

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili ana makine adlarını ve IP aralıklarını engeller.
Geminiz özel bir ağda çalışıyorsa (localhost, LAN IP'si veya dahili ana makine adı),
bunu açıkça etkinleştirmeniz gerekir:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Bu, şu gibi URL'ler için geçerlidir:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Bunu yalnızca yerel ağınıza güveniyorsanız etkinleştirin. Bu ayar, gemi URL'nize yapılan
istekler için SSRF korumalarını devre dışı bırakır.

## Grup kanalları

Otomatik keşif varsayılan olarak etkindir. Kanalları elle de sabitleyebilirsiniz:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Otomatik keşfi devre dışı bırakın:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Erişim denetimi

DM izin listesi (boş = DM'lere izin verilmez, onay akışı için `ownerShip` kullanın):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Grup yetkilendirmesi (varsayılan olarak kısıtlı):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Sahip ve onay sistemi

Yetkisiz kullanıcılar etkileşim kurmaya çalıştığında onay isteklerini almak için bir sahip gemi ayarlayın:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Sahip gemi **her yerde otomatik olarak yetkilendirilir** — DM davetleri otomatik kabul edilir ve
kanal mesajlarına her zaman izin verilir. Sahibi `dmAllowlist` veya
`defaultAuthorizedShips` içine eklemeniz gerekmez.

Ayarlandığında, sahip şu durumlar için DM bildirimleri alır:

- İzin listesinde olmayan gemilerden gelen DM istekleri
- Yetkilendirme bulunmayan kanallardaki bahisler
- Grup davet istekleri

## Otomatik kabul ayarları

DM davetlerini otomatik kabul etme (`dmAllowlist` içindeki gemiler için):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Güvenilen gemilerden gelen grup davetlerini otomatik kabul etme:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

`autoAcceptGroupInvites`, `groupInviteAllowlist` boş olduğunda kapalı kalarak başarısız olur. İzin listesini,
grup davetleri otomatik olarak kabul edilecek gemilerle ayarlayın.

## Teslim hedefleri (CLI/Cron)

Bunları `openclaw message send` veya Cron teslimi ile kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Paketle birlikte gelen yetenek

Tlon Plugin'i, Tlon işlemlerine CLI erişimi sağlayan paketle birlikte gelen bir yetenek
([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) içerir:

- **Kişiler**: profilleri alma/güncelleme, kişileri listeleme
- **Kanallar**: listeleme, oluşturma, mesaj gönderme, geçmişi getirme
- **Gruplar**: listeleme, oluşturma, üyeleri yönetme
- **DM'ler**: mesaj gönderme, mesajlara tepki verme
- **Tepkiler**: gönderilere ve DM'lere emoji tepkileri ekleme/kaldırma
- **Ayarlar**: eğik çizgi komutlarıyla Plugin izinlerini yönetme

Bu yetenek, Plugin kurulduğunda otomatik olarak kullanılabilir olur.

## Yetenekler

| Özellik         | Durum                                  |
| --------------- | --------------------------------------- |
| Doğrudan mesajlar | ✅ Desteklenir                            |
| Gruplar/kanallar | ✅ Desteklenir (varsayılan olarak bahis gerektirir) |
| İleti dizileri         | ✅ Desteklenir (ileti dizisinde otomatik yanıtlar)   |
| Zengin metin       | ✅ Markdown, Tlon biçimine dönüştürülür    |
| Görseller          | ✅ Tlon depolamasına yüklenir             |
| Tepkiler       | ✅ [Paketle birlikte gelen yetenek](#bundled-skill) aracılığıyla  |
| Anketler           | ❌ Henüz desteklenmez                    |
| Yerel komutlar | ✅ Desteklenir (varsayılan olarak yalnızca sahip)    |

## Sorun giderme

Önce bu merdiveni çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Yaygın hatalar:

- **DM'ler yok sayılıyor**: gönderen `dmAllowlist` içinde değil ve onay akışı için `ownerShip` yapılandırılmamış.
- **Grup mesajları yok sayılıyor**: kanal keşfedilmemiş veya gönderen yetkilendirilmemiş.
- **Bağlantı hataları**: gemi URL'sinin erişilebilir olduğunu kontrol edin; yerel gemiler için `allowPrivateNetwork` etkinleştirin.
- **Kimlik doğrulama hataları**: oturum açma kodunun güncel olduğunu doğrulayın (kodlar döner).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.tlon.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.tlon.ship`: botun Urbit gemi adı (örn. `~sampel-palnet`).
- `channels.tlon.url`: gemi URL'si (örn. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: gemi oturum açma kodu.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL'lerine izin ver (SSRF atlaması).
- `channels.tlon.ownerShip`: onay sistemi için sahip gemi (her zaman yetkilidir).
- `channels.tlon.dmAllowlist`: DM göndermesine izin verilen gemiler (boş = hiçbiri).
- `channels.tlon.autoAcceptDmInvites`: izin listesindeki gemilerden gelen DM'leri otomatik kabul et.
- `channels.tlon.autoAcceptGroupInvites`: izin listesindeki gemilerden gelen grup davetlerini otomatik kabul et.
- `channels.tlon.groupInviteAllowlist`: grup davetleri otomatik kabul edilebilecek gemiler.
- `channels.tlon.autoDiscoverChannels`: grup kanallarını otomatik keşfet (varsayılan: true).
- `channels.tlon.groupChannels`: elle sabitlenmiş kanal yuvaları.
- `channels.tlon.defaultAuthorizedShips`: tüm kanallar için yetkilendirilmiş gemiler.
- `channels.tlon.authorization.channelRules`: kanal başına kimlik doğrulama kuralları.
- `channels.tlon.showModelSignature`: mesajlara model adını ekle.

## Notlar

- Grup yanıtları, yanıt vermek için bir bahis gerektirir (örn. `~your-bot-ship`).
- İleti dizisi yanıtları: gelen mesaj bir ileti dizisindeyse OpenClaw ileti dizisi içinde yanıtlar.
- Zengin metin: Markdown biçimlendirmesi (kalın, italik, kod, başlıklar, listeler) Tlon'un yerel biçimine dönüştürülür.
- Görseller: URL'ler Tlon depolamasına yüklenir ve görsel blokları olarak gömülür.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahis kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
