---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışma
summary: Tlon/Urbit destek durumu, yetenekleri ve yapılandırması
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon, Urbit üzerinde inşa edilmiş merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit ship'inize bağlanır ve
DM'lere ve grup sohbeti mesajlarına yanıt verebilir. Grup yanıtları varsayılan olarak @ mention gerektirir ve
allowlist'ler aracılığıyla daha da kısıtlanabilir.

Durum: birlikte gelen Plugin. DM'ler, grup mention'ları, thread yanıtları, zengin metin biçimlendirmesi ve
görsel yüklemeleri desteklenir. Reaksiyonlar ve anketler henüz desteklenmiyor.

## Birlikte gelen Plugin

Tlon, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş
derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Tlon'u hariç tutan özel bir kurulum kullanıyorsanız,
güncel bir npm paketi kurun:

CLI üzerinden kurulum (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Mevcut resmi sürüm etiketini takip etmek için yalın paketi kullanın. Kesin bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Kurulum

1. Tlon Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
2. Ship URL'nizi ve oturum açma kodunuzu alın.
3. `channels.tlon` yapılandırmasını yapın.
4. Gateway'i yeniden başlatın.
5. Bota DM gönderin veya bir grup kanalında ondan mention ile bahsedin.

Minimal yapılandırma (tek hesap):

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

## Özel/LAN ship'leri

Varsayılan olarak OpenClaw, SSRF koruması için özel/dahili host adlarını ve IP aralıklarını engeller.
Ship'iniz özel bir ağda çalışıyorsa (localhost, LAN IP veya dahili hostname),
açıkça etkinleştirmeniz gerekir:

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

Bu, aşağıdaki gibi URL'ler için geçerlidir:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Bunu yalnızca yerel ağınıza güveniyorsanız etkinleştirin. Bu ayar, ship URL'nize yapılan
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

DM allowlist'i (boş = DM'lere izin verilmez, onay akışı için `ownerShip` kullanın):

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

Yetkisiz kullanıcılar etkileşim kurmaya çalıştığında onay istekleri almak için bir sahip ship ayarlayın:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Sahip ship **her yerde otomatik olarak yetkilidir** — DM davetleri otomatik kabul edilir ve
kanal mesajlarına her zaman izin verilir. Sahibi `dmAllowlist` veya
`defaultAuthorizedShips` içine eklemeniz gerekmez.

Ayarlandığında, sahip aşağıdakiler için DM bildirimleri alır:

- Allowlist'te olmayan ship'lerden gelen DM istekleri
- Yetkilendirmesi olmayan kanallardaki mention'lar
- Grup daveti istekleri

## Otomatik kabul ayarları

DM davetlerini otomatik kabul edin (`dmAllowlist` içindeki ship'ler için):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Grup davetlerini otomatik kabul edin:

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

Bunları `openclaw message send` veya cron teslimiyle kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Birlikte gelen skill

Tlon Plugin'i, Tlon işlemlerine CLI erişimi sağlayan birlikte gelen bir skill
([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) içerir:

- **Kişiler**: profilleri alın/güncelleyin, kişileri listeleyin
- **Kanallar**: listeleyin, oluşturun, mesaj gönderin, geçmişi getirin
- **Gruplar**: listeleyin, oluşturun, üyeleri yönetin
- **DM'ler**: mesaj gönderin, mesajlara reaksiyon verin
- **Reaksiyonlar**: gönderilere ve DM'lere emoji reaksiyonları ekleyin/kaldırın
- **Ayarlar**: slash komutları aracılığıyla Plugin izinlerini yönetin

Plugin kurulduğunda skill otomatik olarak kullanılabilir olur.

## Yetenekler

| Özellik         | Durum                                           |
| --------------- | ----------------------------------------------- |
| Doğrudan mesajlar | ✅ Desteklenir                                |
| Gruplar/kanallar | ✅ Desteklenir (varsayılan olarak mention kapılı) |
| Thread'ler      | ✅ Desteklenir (thread içinde otomatik yanıtlar) |
| Zengin metin    | ✅ Markdown Tlon biçimine dönüştürülür          |
| Görseller       | ✅ Tlon depolamasına yüklenir                   |
| Reaksiyonlar    | ✅ [birlikte gelen skill](#bundled-skill) aracılığıyla |
| Anketler        | ❌ Henüz desteklenmiyor                         |
| Yerel komutlar  | ✅ Desteklenir (varsayılan olarak yalnızca sahip) |

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
- **Grup mesajları yok sayılıyor**: kanal keşfedilmemiş veya gönderen yetkili değil.
- **Bağlantı hataları**: ship URL'sinin erişilebilir olduğunu kontrol edin; yerel ship'ler için `allowPrivateNetwork` etkinleştirin.
- **Kimlik doğrulama hataları**: oturum açma kodunun güncel olduğunu doğrulayın (kodlar döndürülür).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.tlon.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.tlon.ship`: botun Urbit ship adı (ör. `~sampel-palnet`).
- `channels.tlon.url`: ship URL'si (ör. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: ship oturum açma kodu.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL'lerine izin ver (SSRF atlatma).
- `channels.tlon.ownerShip`: onay sistemi için sahip ship (her zaman yetkili).
- `channels.tlon.dmAllowlist`: DM göndermesine izin verilen ship'ler (boş = hiçbiri).
- `channels.tlon.autoAcceptDmInvites`: allowlist'teki ship'lerden gelen DM'leri otomatik kabul et.
- `channels.tlon.autoAcceptGroupInvites`: tüm grup davetlerini otomatik kabul et.
- `channels.tlon.autoDiscoverChannels`: grup kanallarını otomatik keşfet (varsayılan: true).
- `channels.tlon.groupChannels`: elle sabitlenmiş kanal yuvaları.
- `channels.tlon.defaultAuthorizedShips`: tüm kanallar için yetkili ship'ler.
- `channels.tlon.authorization.channelRules`: kanal başına kimlik doğrulama kuralları.
- `channels.tlon.showModelSignature`: mesajlara model adını ekle.

## Notlar

- Grup yanıtları, yanıt vermek için bir mention gerektirir (ör. `~your-bot-ship`).
- Thread yanıtları: gelen mesaj bir thread içindeyse, OpenClaw thread içinde yanıtlar.
- Zengin metin: Markdown biçimlendirmesi (kalın, italik, kod, başlıklar, listeler) Tlon'un yerel biçimine dönüştürülür.
- Görseller: URL'ler Tlon depolamasına yüklenir ve görsel blokları olarak gömülür.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
