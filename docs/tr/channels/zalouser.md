---
read_when:
    - OpenClaw için Zalo Personal'ı ayarlama
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js (QR ile giriş) aracılığıyla Zalo kişisel hesap desteği, yetenekleri ve yapılandırması
title: Zalo kişisel
x-i18n:
    generated_at: "2026-07-12T12:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Durum: deneysel. Bu entegrasyon, harici bir CLI ikili dosyası olmadan, süreç içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

<Warning>
Bu, resmî olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Riski size ait olmak üzere kullanın.
</Warning>

## Kurulum

Zalo Personal, çekirdekle birlikte sunulmayan resmî bir harici plugindir. Kullanmadan önce yükleyin:

```bash
openclaw plugins install @openclaw/zalouser
```

- Belirli bir sürümü sabitleyin: `openclaw plugins install @openclaw/zalouser@<version>`
- Kaynak kod deposundan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı yapılandırma

1. Plugini yükleyin (yukarıda).
2. Oturum açın (QR ile, Gateway makinesinde):
   - `openclaw channels login --channel zalouser`
   - QR kodunu Zalo mobil uygulamasıyla tarayın.
3. Kanalı etkinleştirin:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway'i yeniden başlatın (veya yapılandırmayı tamamlayın).
5. DM erişimi varsayılan olarak eşleştirme kullanır; ilk iletişimde eşleştirme kodunu onaylayın.

## Nedir?

- Tamamen süreç içinde `zca-js` kütüphanesi aracılığıyla çalışır (harici `zca`/`openzca` ikili dosyası yoktur).
- Gelen mesajları almak için yerel olay dinleyicilerini (`message`, `error`) kullanır.
- Yanıtları doğrudan JS API aracılığıyla gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı "kişisel hesap" kullanım senaryoları için tasarlanmıştır.

## Adlandırma

Kanal kimliği, bunun **kişisel bir Zalo kullanıcı hesabını** otomatikleştirdiğini (gayriresmî olarak) açıkça belirtmek için `zalouser` olarak belirlenmiştir. `zalo`, gelecekteki olası bir resmî Zalo API entegrasyonu için ayrılmıştır.

## Kimlikleri bulma (dizin)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin 2000 karakterlik parçalara bölünür (Zalo istemci sınırı).
- Akış desteklenmez.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom`, kararlı Zalo kullanıcı kimliklerini kullanmalıdır. Ayrıca statik gönderen erişim gruplarına (`accessGroup:<name>`) başvurabilir. Etkileşimli yapılandırma sırasında girilen adlar, pluginin süreç içi kişi araması kullanılarak kimliklere çözümlenebilir.

Yapılandırmada ham bir ad kalırsa başlangıçta yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkin olduğunda çözümlenir. Bu açık onay olmadan, çalışma zamanındaki gönderen denetimleri yalnızca kimlik kullanır ve ham adlar yetkilendirme sırasında yok sayılır.

Şunlar aracılığıyla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "allowlist"` (gruplar açık bir izin listesi girdisi gerektirir).
- Tüm grupları açın: `channels.zalouser.groupPolicy = "open"`.
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- `groupPolicy = "allowlist"` ile:
  - `channels.zalouser.groups` anahtarları kararlı grup kimlikleri olmalıdır; adlar başlangıçta yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkin olduğunda kimliklere çözümlenir.
  - `channels.zalouser.groupAllowFrom`, izin verilen gruplarda hangi gönderenlerin botu tetikleyebileceğini denetler; statik gönderen erişim gruplarına `accessGroup:<name>` ile başvurulabilir.
- Yapılandırma sihirbazı grup izin listelerini sorabilir.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik kullanır. `channels.zalouser.dangerouslyAllowNameMatching: true` etkin olmadığı sürece çözümlenmemiş adlar kimlik doğrulama sırasında yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değiştirilebilir başlangıç adı çözümlemesini ve çalışma zamanındaki grup adı eşleştirmesini yeniden etkinleştiren acil durum uyumluluk modudur.
- `groupAllowFrom`, normal grup mesajları için `allowFrom` değerine **geri dönmez**: izin listesindeki bir grupta boş bırakılması, o grubu tüm gönderenlere açar. Yetkili denetim komutları (örneğin `/new`) istisnadır; `groupAllowFrom` boş olduğunda komut göndereni denetimleri `allowFrom` değerine geri döner.

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow`, eski bir alan adıdır; güncel yapılandırma `enabled` kullanır. `openclaw doctor --fix`, `allow` alanını otomatik olarak `enabled` alanına geçirir.
</Note>

### Grup bahsetme geçidi

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bahsetme gerektirip gerektirmediğini denetler.
- Çözümleme sırası: grup kimliği -> `group:<id>` diğer adı -> grup adı/kısa adı (ada dayalı adaylar yalnızca `dangerouslyAllowNameMatching: true` olduğunda uygulanır) -> `*` -> varsayılan (`true`).
- Hem izin listesindeki gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük bir bahsetme sayılır.
- Yetkili denetim komutları (örneğin `/new`) bahsetme geçidini atlayabilir.
- Bahsetme gerektiği için bir grup mesajı atlandığında OpenClaw, bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına ekler.
- Grup geçmişi sınırı: `channels.zalouser.historyLimit`, ardından `messages.groupChat.historyLimit`, ardından yedek değer olarak `50`.

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Çoklu hesap

Hesaplar, OpenClaw durumundaki `zalouser` profilleriyle eşleştirilir. Örnek:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Ortam değişkenleri

Profil seçimi ortam değişkenlerinden de gelebilir:

| Değişken           | Amaç                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Kanal veya hesap yapılandırmasında `profile` ayarlanmadığında kullanılacak profil adı.        |
| `ZCA_PROFILE`      | Yalnızca `ZALOUSER_PROFILE` ayarlanmadığında kullanılan eski yedek değer.                     |

Profil adları, OpenClaw durumunda kayıtlı Zalo oturum açma kimlik bilgilerini seçer. Çözümleme sırası:

1. Yapılandırmadaki açık `profile`.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Varsayılan olmayan hesaplar için hesap kimliği veya varsayılan hesap için `default`.

Çoklu hesap yapılandırmalarında, tek bir ortam değişkeninin birden fazla hesabın aynı oturum açma oturumunu paylaşmasına neden olmaması için yapılandırmada her hesap için `profile` ayarlamayı tercih edin.

## Yazma durumu, tepkiler ve teslim alındıları

- OpenClaw, bir yanıtı göndermeden önce yazma olayı gönderir (mümkün olan en iyi şekilde).
- Kanal eylemlerinde `zalouser` için `react` mesaj tepki eylemi desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki davranışı: [Tepkiler](/tr/tools/reactions)
- Olay meta verileri içeren gelen mesajlar için OpenClaw, teslim edildi + görüldü alındıları gönderir (mümkün olan en iyi şekilde).

## Sorun giderme

**Oturum açık kalmıyor:**

- `openclaw channels status --probe`
- Yeniden oturum açın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom` içinde sayısal kimlikler, `groups` içinde ise kararlı grup kimlikleri kullanın. Tam arkadaş/grup adlarını bilinçli olarak kullanmanız gerekiyorsa `channels.zalouser.dangerouslyAllowNameMatching: true` seçeneğini etkinleştirin.

**Eski bir harici `zca`/CLI tabanlı yapılandırmadan yükseltme yaptınız:**

- Harici `zca` sürecine ilişkin tüm varsayımları kaldırın; kanal artık harici CLI ikili dosyası olmadan tamamen süreç içinde `zca-js` aracılığıyla çalışır.

## İlgili konular

- [Kanallara genel bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Kanal yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
