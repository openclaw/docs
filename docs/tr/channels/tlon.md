---
read_when:
    - Tlon/Urbit kanal özellikleri üzerinde çalışma
summary: Tlon/Urbit destek durumu, yetenekleri ve yapılandırması
title: Tlon
x-i18n:
    generated_at: "2026-07-12T12:05:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon, Urbit üzerinde oluşturulmuş merkeziyetsiz bir mesajlaşma uygulamasıdır. OpenClaw, Urbit geminize bağlanır ve
DM'lere ve grup sohbeti mesajlarına yanıt verir. Grup yanıtları varsayılan olarak @ bahsetmesi gerektirir;
bunun üzerine yetkilendirme kuralları ve sahip onayı akışı uygulanır.

Durum: paketle birlikte gelen Plugin. DM'ler, grup bahsetmeleri, ileti dizileri, zengin metin, görsel
yükleme/indirme ve sahip onayı sistemi desteklenir. Tepkiler ve anketler desteklenmez.

## Paketle birlikte gelen Plugin

Tlon, güncel OpenClaw sürümleriyle birlikte gelir; paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Tlon'u içermeyen eski bir derlemede veya özel kurulumda npm üzerinden yükleyin:

```bash
openclaw plugins install @openclaw/tlon
```

Güncel sürüm etiketini takip etmek için yalnızca paket adını kullanın. Bir sürümü (`@openclaw/tlon@x.y.z`)
yalnızca yeniden üretilebilir kurulumlar için sabitleyin.

Yerel bir kaynak kod kopyasından:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Kurulum

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Alternatif olarak yapılandırmayı doğrudan düzenleyin:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // önerilen: geminiz, her zaman yetkilendirilir
    },
  },
}
```

Yapılandırmayı doğrudan düzenledikten sonra Gateway'i yeniden başlatın. Ardından bota DM gönderin veya bir
grup kanalında bottan @ ile bahsedin.

## Özel/LAN gemileri

OpenClaw, SSRF koruması için özel/dahili ana makine adlarını ve IP aralıklarını varsayılan olarak engeller.
Geminiz özel bir ağda (localhost, LAN IP'si, dahili ana makine adı) çalışıyorsa açıkça izin verin:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Bu ayar `http://localhost:8080`, `http://192.168.x.x:8080` ve
`http://my-ship.local:8080` gibi hedefler için geçerlidir. Bunu yalnızca güvendiğiniz bir gemi URL'si için
etkinleştirin; ilgili hesabın HTTP istekleri için SSRF korumasını devre dışı bırakır.

<Note>
`channels.tlon.allowPrivateNetwork` (düz anahtar) kullanımdan kaldırılmıştır. `openclaw doctor --fix`, bu anahtarı
otomatik olarak `channels.tlon.network.dangerouslyAllowPrivateNetwork` konumuna taşır.
</Note>

## Grup kanalları

Kanalları elle sabitleyin veya otomatik keşfi açın:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels`, yapılandırmada belirtilmediğinde varsayılan olarak `false` değerini alır; kurulum sihirbazı
istem için varsayılan olarak evet seçeneğini kullanır ve açıkça `true` yazar. Etkinleştirildiğinde OpenClaw,
başlangıçta katılınan grupları scry yöntemiyle sorgular, grup davetleri kabul edildikçe yeni kanalları izler
ve her 2 dakikada bir yeniden denetler.

## Erişim denetimi

DM izin listesi (boş = gönderen `ownerShip` olmadığı sürece hiçbir DM'ye izin verilmez):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Grup yetkilendirmesi, kanal başına varsayılan olarak `restricted` değerini kullanır. Bir temel değer için
`defaultAuthorizedShips` ayarını belirleyin ve kanal yuvası başına geçersiz kılın:

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

Bot bir ileti dizisinde yanıt verdikten sonra, başka bir bahsetme gerektirmeden o ileti dizisindeki sonraki
mesajlara yanıt vermeyi sürdürür.

## Sahip ve onay sistemi

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Sahip gemisi her yerde yetkilidir: DM davetleri her zaman otomatik olarak kabul edilir, grup davetleri
her zaman otomatik olarak kabul edilir ve kanal mesajları her zaman yetkilendirmeden geçer. Sahibin
`dmAllowlist`, `defaultAuthorizedShips` veya `groupInviteAllowlist` içinde olması gerekmez.

`ownerShip` ayarlandığında yetkisiz istekler yalnızca yok sayılmaz; bekleyen onay kuyruğuna alınır ve
sahibe DM gönderilir:

- `dmAllowlist` içinde olmayan gemilerden gelen DM istekleri
- Gönderenin yetkilendirmeyi geçemediği kanallardaki bahsetmeler
- `groupInviteAllowlist` içinde olmayan gemilerden gelen grup davetleri (otomatik kabul kapalıysa veya açık
  olmasına rağmen davet eden izin listesinde değilse)

Sahip, bir istek üzerinde işlem yapmak için DM üzerinden yanıt verir:

| Sahip yanıtı                  | Etki                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `approve` / `deny` / `block`  | En son bekleyen onay üzerinde işlem yapar                     |
| `approve <id>` / `deny <id>`  | Kimliğine göre belirli bir onay üzerinde işlem yapar          |
| `block`                       | Geminin yeniden bağlanamaması için onu yerel olarak da engeller |
| `unblock ~ship`               | Yerel engeli kaldırır                                         |
| `blocked`                     | Şu anda engellenmiş gemileri listeler                         |
| `pending`                     | Bekleyen onay isteklerini listeler                            |

`ownerShip` yapılandırılmadığında yetkisiz DM'ler ve kanal bahsetmeleri yalnızca yok sayılır ve günlüğe kaydedilir;
onay istemi gösterilmez.

## Otomatik kabul ayarları

Zaten `dmAllowlist` içinde bulunan gemilerden gelen DM davetlerini otomatik olarak kabul edin (bu bayraktan
bağımsız olarak sahip her zaman otomatik kabul edilir):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Bir izin listesindeki grup davetlerini otomatik olarak kabul edin (güvenli biçimde kapalı kalır:
`autoAcceptGroupInvites: true` ve boş bir `groupInviteAllowlist` ile sahip dışındaki hiçbir davet kabul edilmez):

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

## Urbit ayar deposu üzerinden çalışırken yeniden yükleme

Yukarıdaki ayarların çoğu (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) ilk çalıştırmada geminin
`%settings` aracısına (masa `moltbot`, bölüm `tlon`) yansıtılır ve sonrasında canlı olarak oradan okunur.
Bu nedenle bir Landscape istemcisi veya paketle gelen Skill'ın ayar komutları üzerinden yapılan değişiklikler
Gateway yeniden başlatılmadan uygulanır. `channelRules` ve bekleyen onaylar da burada JSON olarak kalıcı hâle
getirilir. Ayar deposuna hiçbir zaman yazılmayan değerler için dosya yapılandırması doğruluk kaynağı olmaya devam eder.

## Teslimat hedefleri (CLI/cron)

`openclaw message send` veya cron teslimatıyla kullanın:

- DM: `~sampel-palnet` veya `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` veya `group:~host-ship/channel`

## Paketle birlikte gelen Skill

Plugin, doğrudan Urbit işlemleri için bir CLI olan
[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill) paketini içerir ve Plugin yüklendikten sonra
otomatik olarak kullanılabilir:

- **Etkinlik**: bahsetmeler, yanıtlar, okunmamışlar
- **Kanallar**: listeleme, oluşturma, yeniden adlandırma
- **Kişiler**: profilleri listeleme/alma/güncelleme
- **Gruplar**: oluşturma, katılma, davet/istek akışları, roller
- **Kancalar**: kanal kancalarını yönetme
- **Mesajlar**: geçmiş, arama
- **DM'ler**: gönderme, tepki verme, kabul etme/reddetme
- **Gönderiler**: tepki verme, silme
- **Not Defteri**: günlük kanallarına gönderme
- **Ayarlar**: yukarıdaki ayar deposu üzerinden Plugin yapılandırmasını çalışırken yeniden yükleme

## Yetenekler

| Özellik          | Durum                                                       |
| ---------------- | ----------------------------------------------------------- |
| Doğrudan mesajlar | Desteklenir                                                 |
| Gruplar/kanallar | Desteklenir (varsayılan olarak bahsetme gerektirir)         |
| İleti dizileri   | Desteklenir (katıldıktan sonra yanıt vermeyi sürdürür)      |
| Zengin metin     | Markdown, Tlon'un yerel biçimine dönüştürülür               |
| Görseller        | Gelenler indirilir, gidenler yüklenir                       |
| Tepkiler         | Yalnızca [paketle birlikte gelen Skill](#bundled-skill) aracılığıyla |
| Anketler         | Desteklenmez                                                |
| Yerel komutlar   | Varsayılan olarak yalnızca sahip tarafından kullanılabilir  |

## Sorun giderme

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Yaygın hatalar:

- **DM'ler yok sayılıyor**: gönderen `dmAllowlist` içinde değil ve onay akışı için `ownerShip`
  yapılandırılmamış.
- **Grup mesajları yok sayılıyor**: kanal keşfedilmemiş/sabitlenmemiş veya gönderen yetkilendirmeyi geçemiyor
  ve onayı kuyruğa almak için bir `ownerShip` yok.
- **Bağlantı hataları**: gemi URL'sinin erişilebilir olduğunu denetleyin; yerel gemiler için
  `network.dangerouslyAllowPrivateNetwork` ayarını belirleyin.
- **Kimlik doğrulama hataları**: oturum açma kodları dönüşümlü olarak değişir; güncel kodu geminizden kopyalayın.

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

| Anahtar                                                | Anlam                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Kanal başlangıcını etkinleştirir/devre dışı bırakır.            |
| `channels.tlon.ship`                                   | Botun Urbit gemi adı (ör. `~sampel-palnet`).                    |
| `channels.tlon.url`                                    | Gemi URL'si (ör. `https://sampel-palnet.tlon.network`).         |
| `channels.tlon.code`                                   | Gemi oturum açma kodu.                                         |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Localhost/LAN gemi URL'lerine izin verir (SSRF için açık izin). |
| `channels.tlon.ownerShip`                              | Sahip gemisi: her zaman yetkilidir, onay isteklerini alır.      |
| `channels.tlon.dmAllowlist`                            | DM göndermesine izin verilen gemiler (boş = sahip dışında hiçbiri). |
| `channels.tlon.autoAcceptDmInvites`                    | `dmAllowlist` içindeki gemilerden gelen DM'leri otomatik kabul eder. |
| `channels.tlon.autoAcceptGroupInvites`                 | `groupInviteAllowlist` içindeki grup davetlerini otomatik kabul eder. |
| `channels.tlon.groupInviteAllowlist`                   | Grup davetleri otomatik kabul edilen gemiler.                   |
| `channels.tlon.autoDiscoverChannels`                   | Katılınan grup kanallarını otomatik keşfeder (varsayılan: `false`). |
| `channels.tlon.groupChannels`                          | Elle sabitlenen kanal yuvaları.                                 |
| `channels.tlon.defaultAuthorizedShips`                 | Tüm kanallar için yetkili gemiler (hiçbir kural eşleşmediğinde kullanılır). |
| `channels.tlon.authorization.channelRules`             | Kanal yuvası başına kimlik doğrulama modu + izin listesi.       |
| `channels.tlon.showModelSignature`                     | Yanıtlara `_[<model> tarafından oluşturuldu]_` ekler.           |
| `channels.tlon.responsePrefix`                         | Giden yanıtların başına eklenen sabit önek.                     |
| `channels.tlon.accounts.<id>`                          | Ek adlandırılmış hesaplar (çok gemili kurulumlar).              |

## Notlar

- Bot ilgili ileti dizisine zaten katılmadıysa grup yanıtları @ bahsetmesi (ör. `~your-bot-ship`) gerektirir.
- İleti dizisi yanıtları ileti dizisinin içine gönderilir; ayrıca ileti dizisi bağlamının son 10 mesajı aracının
  bağlamının başına eklenir.
- Zengin metin (kalın, italik, kod, başlıklar, listeler) Tlon'un yerel biçimine dönüştürülür.
- Kanal özeti isteyen bir gelen mesajın gönderilmesi (örneğin "bu kanalı özetle"), normal yanıt akışı yerine
  yerleşik geçmiş özetlemeyi tetikler.

## İlgili konular

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme gereksinimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güvenliği güçlendirme
