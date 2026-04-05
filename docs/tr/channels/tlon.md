---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışırken
summary: Tlon/Urbit destek durumu, yetenekler ve yapılandırma
title: Tlon
x-i18n:
    generated_at: "2026-04-05T13:46:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon, Urbit üzerinde kurulu merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit geminize bağlanabilir ve
DM'lere ve grup sohbeti iletilerine yanıt verebilir. Grup yanıtları varsayılan olarak bir @ bahsetmesi gerektirir ve
allowlist'ler aracılığıyla daha da kısıtlanabilir.

Durum: paketlenmiş eklenti. DM'ler, grup bahsetmeleri, ileti dizisi yanıtları, zengin metin biçimlendirmesi ve
görsel yüklemeleri desteklenir. Tepkiler ve anketler henüz desteklenmemektedir.

## Paketlenmiş eklenti

Tlon, mevcut OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir; bu nedenle normal paketlenmiş
derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derleme veya Tlon'u içermeyen özel bir kurulum kullanıyorsanız, bunu
manuel olarak yükleyin:

CLI ile yükleyin (`npm` kayıt defteri):

```bash
openclaw plugins install @openclaw/tlon
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugins](/tools/plugin)

## Kurulum

1. Tlon eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. Gemi URL'nizi ve giriş kodunuzu toplayın.
3. `channels.tlon` yapılandırmasını yapın.
4. Gateway'i yeniden başlatın.
5. Bota DM gönderin veya grup kanalında bottan bahsedin.

Minimum yapılandırma (tek hesap):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // önerilir: sizin geminiz, her zaman izinlidir
    },
  },
}
```

## Özel/LAN gemileri

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili ana bilgisayar adlarını ve IP aralıklarını engeller.
Geminiz özel bir ağda çalışıyorsa (localhost, LAN IP'si veya dahili ana bilgisayar adı),
açıkça izin vermeniz gerekir:

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

Bu, şu URL'ler için geçerlidir:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Bunu yalnızca yerel ağınıza güveniyorsanız etkinleştirin. Bu ayar, gemi URL'nize yapılan istekler için SSRF korumalarını
devre dışı bırakır.

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

DM allowlist (boş = DM'lere izin verilmez, onay akışı için `ownerShip` kullanın):

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

Yetkisiz kullanıcılar etkileşime girmeye çalıştığında onay isteklerini almak için bir sahip gemisi ayarlayın:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Sahip gemi **her yerde otomatik olarak yetkilidir** — DM davetleri otomatik kabul edilir ve
kanal iletilerine her zaman izin verilir. Sahibi `dmAllowlist` veya
`defaultAuthorizedShips` listesine eklemeniz gerekmez.

Ayarlanmışsa sahip, şu durumlar için DM bildirimleri alır:

- allowlist'te olmayan gemilerden gelen DM istekleri
- yetkilendirme olmayan kanallardaki bahsetmeler
- grup daveti istekleri

## Otomatik kabul ayarları

DM davetlerini otomatik kabul et ( `dmAllowlist` içindeki gemiler için):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Grup davetlerini otomatik kabul et:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Teslim hedefleri (CLI/cron)

Bunları `openclaw message send` veya cron teslimi ile kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Paketlenmiş beceri

Tlon eklentisi, Tlon işlemlerine CLI erişimi sağlayan paketlenmiş bir Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
içerir:

- **Kişiler**: profilleri al/güncelle, kişileri listele
- **Kanallar**: listele, oluştur, ileti gönder, geçmişi getir
- **Gruplar**: listele, oluştur, üyeleri yönet
- **DM'ler**: ileti gönder, iletilere tepki ver
- **Tepkiler**: gönderilere ve DM'lere emoji tepkileri ekle/kaldır
- **Ayarlar**: eğik çizgi komutlarıyla eklenti izinlerini yönet

Eklenti yüklendiğinde Skill otomatik olarak kullanılabilir olur.

## Yetenekler

| Özellik         | Durum                                     |
| --------------- | ----------------------------------------- |
| Doğrudan mesajlar | ✅ Destekleniyor                        |
| Gruplar/kanallar | ✅ Destekleniyor (varsayılan olarak bahsetme geçitli) |
| İleti dizileri  | ✅ Destekleniyor (ileti dizisinde otomatik yanıtlar) |
| Zengin metin    | ✅ Markdown, Tlon biçimine dönüştürülür   |
| Görseller       | ✅ Tlon depolamasına yüklenir             |
| Tepkiler        | ✅ [paketlenmiş Skill](#bundled-skill) aracılığıyla |
| Anketler        | ❌ Henüz desteklenmiyor                   |
| Yerel komutlar  | ✅ Destekleniyor (varsayılan olarak yalnızca sahip) |

## Sorun giderme

Önce şu sırayı çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Yaygın hatalar:

- **DM'ler yok sayılıyor**: gönderen `dmAllowlist` içinde değil ve onay akışı için `ownerShip` yapılandırılmamış.
- **Grup iletileri yok sayılıyor**: kanal keşfedilmemiş veya gönderen yetkili değil.
- **Bağlantı hataları**: gemi URL'sine erişilebildiğini kontrol edin; yerel gemiler için `allowPrivateNetwork` seçeneğini etkinleştirin.
- **Kimlik doğrulama hataları**: giriş kodunun güncel olduğunu doğrulayın (kodlar döner).

## Yapılandırma başvurusu

Tam yapılandırma: [Configuration](/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.tlon.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.tlon.ship`: botun Urbit gemi adı (ör. `~sampel-palnet`).
- `channels.tlon.url`: gemi URL'si (ör. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: gemi giriş kodu.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL'lerine izin ver (SSRF atlaması).
- `channels.tlon.ownerShip`: onay sistemi için sahip gemi (her zaman yetkili).
- `channels.tlon.dmAllowlist`: DM göndermesine izin verilen gemiler (boş = hiçbiri).
- `channels.tlon.autoAcceptDmInvites`: allowlist içindeki gemilerden gelen DM'leri otomatik kabul et.
- `channels.tlon.autoAcceptGroupInvites`: tüm grup davetlerini otomatik kabul et.
- `channels.tlon.autoDiscoverChannels`: grup kanallarını otomatik keşfet (varsayılan: true).
- `channels.tlon.groupChannels`: manuel olarak sabitlenmiş kanal nest'leri.
- `channels.tlon.defaultAuthorizedShips`: tüm kanallar için yetkili gemiler.
- `channels.tlon.authorization.channelRules`: kanal başına yetkilendirme kuralları.
- `channels.tlon.showModelSignature`: iletilere model adını ekle.

## Notlar

- Grup yanıtları, yanıt vermek için bir bahsetme gerektirir (ör. `~your-bot-ship`).
- İleti dizisi yanıtları: gelen ileti bir ileti dizisindeyse OpenClaw ileti dizisinde yanıt verir.
- Zengin metin: Markdown biçimlendirmesi (kalın, italik, kod, başlıklar, listeler) Tlon'un yerel biçimine dönüştürülür.
- Görseller: URL'ler Tlon depolamasına yüklenir ve görsel blokları olarak gömülür.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Channel Routing](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
