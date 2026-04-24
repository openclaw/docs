---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışıyorsunuz
summary: Tlon/Urbit desteği durumu, yetenekleri ve yapılandırması
title: Tlon
x-i18n:
    generated_at: "2026-04-24T09:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon, Urbit üzerinde kurulu merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit geminize bağlanabilir ve
DM'lere ile grup sohbeti mesajlarına yanıt verebilir. Grup yanıtları varsayılan olarak bir @ mention gerektirir ve
izin listeleri aracılığıyla daha da kısıtlanabilir.

Durum: paketlenmiş Plugin. DM'ler, grup mention'ları, thread yanıtları, zengin metin biçimlendirme ve
görsel yüklemeleri desteklenir. Tepkiler ve anketler henüz desteklenmemektedir.

## Paketlenmiş Plugin

Tlon, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal paketlenmiş
derlemelerde ayrı bir kurulum gerekmez.

Eski bir derleme veya Tlon'u hariç tutan özel bir kurulum kullanıyorsanız, bunu
elle kurun:

CLI ile kurulum (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Yerel checkout (bir git reposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Kurulum

1. Tlon Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
2. Gemi URL'nizi ve giriş kodunuzu toplayın.
3. `channels.tlon` yapılandırmasını yapın.
4. Gateway'i yeniden başlatın.
5. Bota DM gönderin veya bir grup kanalında ondan mention ile bahsedin.

En düşük yapılandırma (tek hesap):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // önerilir: geminiz, her zaman izinlidir
    },
  },
}
```

## Özel/LAN gemileri

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili ana bilgisayar adlarını ve IP aralıklarını engeller.
Geminiz özel bir ağda çalışıyorsa (localhost, LAN IP'si veya dahili ana bilgisayar adı),
açıkça katılmanız gerekir:

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

Bu, şu tür URL'lere uygulanır:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Bunu yalnızca yerel ağınıza güveniyorsanız etkinleştirin. Bu ayar, gemi URL'nize yapılan istekler için
SSRF korumalarını devre dışı bırakır.

## Grup kanalları

Otomatik keşif varsayılan olarak etkindir. Kanalları manuel olarak da sabitleyebilirsiniz:

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

Yetkisiz kullanıcılar etkileşim kurmaya çalıştığında onay isteklerini almak için bir sahip gemisi ayarlayın:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Sahip gemisi **her yerde otomatik olarak yetkilidir** — DM davetleri otomatik kabul edilir ve
kanal mesajlarına her zaman izin verilir. Sahibi `dmAllowlist` veya
`defaultAuthorizedShips` içine eklemeniz gerekmez.

Ayarlandığında sahip, şu durumlar için DM bildirimleri alır:

- İzin listesinde olmayan gemilerden gelen DM istekleri
- Yetkilendirme olmayan kanallardaki mention'lar
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

Grup davetlerini otomatik kabul etme:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Teslim hedefleri (CLI/Cron)

Bunları `openclaw message send` veya Cron teslimi ile kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Paketlenmiş Skill

Tlon Plugin'i, Tlon işlemlerine CLI erişimi sağlayan paketlenmiş bir Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
içerir:

- **Kişiler**: profilleri al/güncelle, kişileri listele
- **Kanallar**: listele, oluştur, mesaj gönder, geçmişi getir
- **Gruplar**: listele, oluştur, üyeleri yönet
- **DM'ler**: mesaj gönder, mesajlara tepki ver
- **Tepkiler**: gönderilere ve DM'lere emoji tepkileri ekle/kaldır
- **Ayarlar**: slash komutları aracılığıyla Plugin izinlerini yönet

Plugin kurulduğunda Skill otomatik olarak kullanılabilir olur.

## Yetenekler

| Özellik         | Durum                                      |
| --------------- | ------------------------------------------ |
| Doğrudan mesajlar | ✅ Desteklenir                            |
| Gruplar/kanallar | ✅ Desteklenir (varsayılan olarak mention ile sınırlı) |
| Thread'ler      | ✅ Desteklenir (thread içinde otomatik yanıtlar) |
| Zengin metin    | ✅ Markdown, Tlon biçimine dönüştürülür    |
| Görseller       | ✅ Tlon depolamasına yüklenir              |
| Tepkiler        | ✅ [paketlenmiş Skill](#bundled-skill) aracılığıyla |
| Anketler        | ❌ Henüz desteklenmiyor                    |
| Yerel komutlar  | ✅ Desteklenir (varsayılan olarak yalnızca sahip) |

## Sorun giderme

Önce bu sırayı çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Yaygın hatalar:

- **DM'ler yok sayılıyor**: gönderen `dmAllowlist` içinde değil ve onay akışı için `ownerShip` yapılandırılmamış.
- **Grup mesajları yok sayılıyor**: kanal keşfedilmemiş veya gönderen yetkili değil.
- **Bağlantı hataları**: gemi URL'sine erişilebildiğini kontrol edin; yerel gemiler için `allowPrivateNetwork` etkinleştirin.
- **Kimlik doğrulama hataları**: giriş kodunun güncel olduğunu doğrulayın (kodlar döner).

## Yapılandırma başvurusu

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.tlon.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.tlon.ship`: botun Urbit gemi adı (ör. `~sampel-palnet`).
- `channels.tlon.url`: gemi URL'si (ör. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: gemi giriş kodu.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL'lerine izin ver (SSRF atlatma).
- `channels.tlon.ownerShip`: onay sistemi için sahip gemi (her zaman yetkili).
- `channels.tlon.dmAllowlist`: DM göndermesine izin verilen gemiler (boş = hiçbiri).
- `channels.tlon.autoAcceptDmInvites`: izin listesindeki gemilerden gelen DM'leri otomatik kabul et.
- `channels.tlon.autoAcceptGroupInvites`: tüm grup davetlerini otomatik kabul et.
- `channels.tlon.autoDiscoverChannels`: grup kanallarını otomatik keşfet (varsayılan: true).
- `channels.tlon.groupChannels`: manuel olarak sabitlenmiş kanal nest'leri.
- `channels.tlon.defaultAuthorizedShips`: tüm kanallar için yetkili gemiler.
- `channels.tlon.authorization.channelRules`: kanal başına kimlik doğrulama kuralları.
- `channels.tlon.showModelSignature`: mesajlara model adını ekle.

## Notlar

- Grup yanıtları yanıt vermek için bir mention gerektirir (ör. `~your-bot-ship`).
- Thread yanıtları: gelen mesaj bir thread içindeyse OpenClaw thread içinde yanıt verir.
- Zengin metin: Markdown biçimlendirmesi (kalın, italik, kod, başlıklar, listeler) Tlon'un yerel biçimine dönüştürülür.
- Görseller: URL'ler Tlon depolamasına yüklenir ve görsel blokları olarak gömülür.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention ile sınırlama
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Security](/tr/gateway/security) — erişim modeli ve sertleştirme
