---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışma
summary: Tlon/Urbit destek durumu, yetenekleri ve yapılandırması
title: Tlon
x-i18n:
    generated_at: "2026-04-30T09:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon, Urbit üzerine inşa edilmiş merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit geminize bağlanır ve
DM'lere ve grup sohbeti mesajlarına yanıt verebilir. Grup yanıtları varsayılan olarak @ mention gerektirir ve
allowlist'ler aracılığıyla daha da kısıtlanabilir.

Durum: paketle gelen plugin. DM'ler, grup mention'ları, thread yanıtları, rich text biçimlendirmesi ve
görsel yüklemeleri desteklenir. Reactions ve anketler henüz desteklenmez.

## Paketle gelen plugin

Tlon, güncel OpenClaw sürümlerinde paketle gelen bir plugin olarak gelir; bu nedenle normal paketlenmiş
build'ler ayrı bir kurulum gerektirmez.

Daha eski bir build'deyseniz veya Tlon'u dışarıda bırakan özel bir kurulum kullanıyorsanız,
yayımlandığında güncel bir npm paketi kurun:

CLI ile kurulum (npm registry, güncel bir paket mevcut olduğunda):

```bash
openclaw plugins install @openclaw/tlon
```

npm, OpenClaw'a ait paketi deprecated olarak bildirirse, daha yeni bir npm paketi
yayımlanana kadar güncel paketlenmiş bir OpenClaw build'i veya yerel checkout yolunu kullanın.

Yerel checkout (bir git repo'sundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Kurulum

1. Tlon plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketle birlikte sunar.
   - Daha eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Gemi URL'nizi ve oturum açma kodunuzu toplayın.
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

## Özel/LAN gemileri

OpenClaw, SSRF koruması için varsayılan olarak özel/dahili host adlarını ve IP aralıklarını engeller.
Geminiz özel bir ağda çalışıyorsa (localhost, LAN IP veya dahili host adı),
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

⚠️ Bunu yalnızca yerel ağınıza güveniyorsanız etkinleştirin. Bu ayar, gemi URL'nize yapılan istekler için
SSRF korumalarını devre dışı bırakır.

## Grup kanalları

Otomatik keşif varsayılan olarak etkindir. Kanalları elle sabitleyebilirsiniz:

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

Yetkisiz kullanıcılar etkileşim kurmaya çalıştığında onay istekleri almak için bir sahip gemi ayarlayın:

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
kanal mesajlarına her zaman izin verilir. Sahibi `dmAllowlist` veya `defaultAuthorizedShips` içine
eklemeniz gerekmez.

Ayarlandığında, sahip şu durumlar için DM bildirimleri alır:

- Allowlist'te olmayan gemilerden gelen DM istekleri
- Yetkilendirmesi olmayan kanallardaki mention'lar
- Grup daveti istekleri

## Otomatik kabul ayarları

DM davetlerini otomatik kabul et (`dmAllowlist` içindeki gemiler için):

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

Bunları `openclaw message send` veya cron teslimiyle kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Paketle gelen beceri

Tlon plugin'i, Tlon işlemlerine CLI erişimi sağlayan paketle gelen bir beceri
([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) içerir:

- **Kişiler**: profilleri al/güncelle, kişileri listele
- **Kanallar**: listele, oluştur, mesaj gönder, geçmişi getir
- **Gruplar**: listele, oluştur, üyeleri yönet
- **DM'ler**: mesaj gönder, mesajlara reaction ekle
- **Reactions**: gönderilere ve DM'lere emoji reactions ekle/kaldır
- **Ayarlar**: slash komutlarıyla plugin izinlerini yönet

Plugin kurulduğunda beceri otomatik olarak kullanılabilir olur.

## Yetenekler

| Özellik          | Durum                                           |
| ---------------- | ----------------------------------------------- |
| Doğrudan mesajlar | ✅ Desteklenir                                  |
| Gruplar/kanallar | ✅ Desteklenir (varsayılan olarak mention kapılı) |
| Thread'ler       | ✅ Desteklenir (thread içinde otomatik yanıtlar) |
| Rich text        | ✅ Markdown, Tlon formatına dönüştürülür         |
| Görseller        | ✅ Tlon depolamasına yüklenir                    |
| Reactions        | ✅ [paketle gelen beceri](#bundled-skill) ile    |
| Anketler         | ❌ Henüz desteklenmez                           |
| Yerel komutlar   | ✅ Desteklenir (varsayılan olarak yalnızca sahip) |

## Sorun giderme

Önce şu merdiveni çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Yaygın hatalar:

- **DM'ler yok sayılıyor**: gönderen `dmAllowlist` içinde değil ve onay akışı için yapılandırılmış `ownerShip` yok.
- **Grup mesajları yok sayılıyor**: kanal keşfedilmemiş veya gönderen yetkilendirilmemiş.
- **Bağlantı hataları**: gemi URL'sinin erişilebilir olduğunu kontrol edin; yerel gemiler için `allowPrivateNetwork` etkinleştirin.
- **Kimlik doğrulama hataları**: oturum açma kodunun güncel olduğunu doğrulayın (kodlar döner).

## Yapılandırma referansı

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Provider seçenekleri:

- `channels.tlon.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.tlon.ship`: botun Urbit gemi adı (örn. `~sampel-palnet`).
- `channels.tlon.url`: gemi URL'si (örn. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: gemi oturum açma kodu.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL'lerine izin ver (SSRF bypass).
- `channels.tlon.ownerShip`: onay sistemi için sahip gemi (her zaman yetkilidir).
- `channels.tlon.dmAllowlist`: DM göndermesine izin verilen gemiler (boş = hiçbiri).
- `channels.tlon.autoAcceptDmInvites`: allowlist'teki gemilerden gelen DM'leri otomatik kabul et.
- `channels.tlon.autoAcceptGroupInvites`: tüm grup davetlerini otomatik kabul et.
- `channels.tlon.autoDiscoverChannels`: grup kanallarını otomatik keşfet (varsayılan: true).
- `channels.tlon.groupChannels`: elle sabitlenmiş kanal nest'leri.
- `channels.tlon.defaultAuthorizedShips`: tüm kanallar için yetkilendirilmiş gemiler.
- `channels.tlon.authorization.channelRules`: kanal başına auth kuralları.
- `channels.tlon.showModelSignature`: mesajlara model adını ekle.

## Notlar

- Grup yanıtları, yanıt vermek için bir mention (örn. `~your-bot-ship`) gerektirir.
- Thread yanıtları: gelen mesaj bir thread içindeyse OpenClaw thread içinde yanıtlar.
- Rich text: Markdown biçimlendirmesi (bold, italic, code, başlıklar, listeler) Tlon'un native formatına dönüştürülür.
- Görseller: URL'ler Tlon depolamasına yüklenir ve görsel blokları olarak embed edilir.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
