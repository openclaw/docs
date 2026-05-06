---
read_when:
    - OpenClaw için Zalo Personal Kurulumu
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js aracılığıyla Zalo kişisel hesabı desteği (QR ile oturum açma), yetenekler ve yapılandırma
title: Kişisel Zalo
x-i18n:
    generated_at: "2026-05-06T17:52:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla **kişisel Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına neden olabilir. Kullanım riski size aittir.
</Warning>

## Paketle gelen Plugin

Zalo Personal, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derleme kullanıyorsanız veya Zalo Personal'ı hariç tutan özel bir kurulumunuz varsa,
npm paketini doğrudan kurun:

- CLI ile kurulum: `openclaw plugins install @openclaw/zalouser`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ya da kaynak checkout üzerinden: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici `zca`/`openzca` CLI ikilisine gerek yoktur.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'in kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
2. Oturum açın (QR, Gateway makinesinde):
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

4. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
5. DM erişimi varsayılan olarak eşleştirme kullanır; ilk temasta eşleştirme kodunu onaylayın.

## Nedir?

- Tamamen işlem içinde `zca-js` aracılığıyla çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı "kişisel hesap" kullanım durumları için tasarlanmıştır.

## Adlandırma

Kanal kimliği `zalouser` olarak belirlenmiştir; bu, bunun **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça gösterir (resmi değildir). `zalo` adını olası gelecekteki resmi Zalo API entegrasyonu için ayırıyoruz.

## Kimlikleri bulma (dizin)

Eşleri/grupları ve kimliklerini keşfetmek için dizin CLI'sini kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin ~2000 karakterlik parçalara bölünür (Zalo istemci sınırları).
- Akış varsayılan olarak engellenir.

## Erişim kontrolü (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom` kararlı Zalo kullanıcı kimlikleri kullanmalıdır. Etkileşimli kurulum sırasında girilen adlar, Plugin'in işlem içi kişi araması kullanılarak kimliklere çözümlenebilir.

Ham bir ad yapılandırmada kalırsa, başlangıç bunu yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde çözümler. Bu tercih olmadan, çalışma zamanı gönderen denetimleri yalnızca kimliğe dayalıdır ve ham adlar yetkilendirme için yok sayılır.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamış olduğunda varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Şunlarla bir izin listesiyle sınırlayın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; adlar başlangıçta yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi gönderenlerin botu tetikleyebileceğini denetler)
- Tüm grupları engelle: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listeleri için istem gösterebilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimliğe dayalıdır. `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece çözümlenmemiş adlar kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişebilir başlangıç adı çözümlemesini ve çalışma zamanı grup adı eşleştirmesini yeniden etkinleştiren bir acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup gönderen denetimleri için `allowFrom` değerine geri döner.
- Gönderen denetimleri hem normal grup mesajlarına hem de kontrol komutlarına uygulanır (örneğin `/new`, `/reset`).

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Grup bahsi geçidi

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bir bahsi gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu, hem izin verilen gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük bir bahis sayılır.
- Yetkili kontrol komutları (örneğin `/new`) bahis geçidini atlayabilir.
- Bir grup mesajı bahis gerektiği için atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değerini kullanır (geri dönüş `50`). Hesap başına `channels.zalouser.historyLimit` ile geçersiz kılabilirsiniz.

Örnek:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Çoklu hesap

Hesaplar OpenClaw durumundaki `zalouser` profillerine eşlenir. Örnek:

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

## Yazıyor göstergesi, tepkiler ve teslim onayları

- OpenClaw, bir yanıt göndermeden önce yazıyor olayı gönderir (en iyi çaba).
- `react` mesaj tepki eylemi, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Tepkiler](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlar için OpenClaw teslim edildi + görüldü onayları gönderir (en iyi çaba).

## Sorun giderme

**Oturum açma kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden oturum açma: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom` içinde sayısal kimlikleri ve `groups` içinde kararlı grup kimliklerini kullanın. Bilinçli olarak tam arkadaş/grup adlarına ihtiyacınız varsa `channels.zalouser.dangerouslyAllowNameMatching: true` değerini etkinleştirin.

**Eski CLI tabanlı kurulumdan yükseltildi:**

- Eski harici `zca` süreci varsayımlarını kaldırın.
- Kanal artık harici CLI ikilileri olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahis geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
