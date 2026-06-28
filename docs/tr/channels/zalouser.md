---
read_when:
    - OpenClaw için Zalo Personal Kurulumu
    - Zalo Personal giriş veya mesaj akışında hata ayıklama
summary: 'Zalo kişisel hesap desteği: yerel zca-js (QR ile oturum açma), yetenekler ve yapılandırma'
title: Zalo kişisel
x-i18n:
    generated_at: "2026-06-28T00:16:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kullanım riski size aittir.
</Warning>

## Birlikte gelen Plugin

Zalo Personal, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak gönderilir, bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Zalo Personal'ı hariç tutan daha eski bir derlemede veya özel bir kurulumdaysanız,
npm paketini doğrudan kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Veya kaynak checkout üzerinden: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici `zca`/`openzca` CLI ikilisi gerekli değildir.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten birlikte getirir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
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

## Nedir

- Tamamen işlem içinde `zca-js` aracılığıyla çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı "kişisel hesap" kullanım durumları için tasarlanmıştır.

## Adlandırma

Kanal kimliği `zalouser` olarak belirlenmiştir; bunun **kişisel bir Zalo kullanıcı hesabını** otomatikleştirdiğini (resmi olmayan) açıkça belirtir. `zalo` adını gelecekte olası resmi bir Zalo API entegrasyonu için ayırıyoruz.

## Kimlikleri bulma (dizin)

Eşleri/grupları ve kimliklerini keşfetmek için dizin CLI'sini kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin yaklaşık 2000 karakterlik parçalara bölünür (Zalo istemci sınırları).
- Akış varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom` kararlı Zalo kullanıcı kimliklerini kullanmalıdır. Statik gönderici erişim gruplarına da başvurabilir (`accessGroup:<name>`). Etkileşimli kurulum sırasında girilen adlar, Plugin'in işlem içi kişi araması kullanılarak kimliklere çözümlenebilir.

Ham bir ad yapılandırmada kalırsa, başlangıç bunu yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde çözümler. Bu açık onay olmadan, çalışma zamanı gönderici kontrolleri yalnızca kimlik tabanlıdır ve ham adlar yetkilendirme için yok sayılır.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Şunlarla bir izin listesiyle sınırlandırın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; adlar başlangıçta yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi göndericilerin botu tetikleyebileceğini denetler; statik gönderici erişim gruplarına `accessGroup:<name>` ile başvurulabilir)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listeleri için istem gösterebilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik tabanlıdır. Çözümlenmeyen adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değiştirilebilir başlangıç adı çözümlemesini ve çalışma zamanı grup adı eşleştirmesini yeniden etkinleştiren bir acil uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup gönderici kontrolleri için `allowFrom` değerine geri döner.
- Gönderici kontrolleri hem normal grup mesajlarına hem de denetim komutlarına uygulanır (örneğin `/new`, `/reset`).

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

### Grup bahsetme geçidi

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bahsetme gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu hem izin listesine alınmış gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük bir bahsetme sayılır.
- Yetkili denetim komutları (örneğin `/new`) bahsetme geçidini atlayabilir.
- Bir grup mesajı bahsetme gerektiği için atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değeridir (geri dönüş `50`). Hesap başına `channels.zalouser.historyLimit` ile geçersiz kılabilirsiniz.

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

Hesaplar, OpenClaw durumunda `zalouser` profillerine eşlenir. Örnek:

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

Zalo Personal Plugin'i profil seçimini ortam değişkenlerinden de okuyabilir:

- `ZALOUSER_PROFILE`: Kanal veya hesap yapılandırmasında `profile` ayarlanmamışsa kullanılacak profil adı.
- `ZCA_PROFILE`: Eski geri dönüş profil adı; yalnızca `ZALOUSER_PROFILE` ayarlanmadığında kullanılır.

Profil adları, OpenClaw durumunda kaydedilmiş Zalo oturum açma kimlik bilgilerini seçer. Çözümleme sırası şöyledir:

1. Yapılandırmada açık `profile`.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Varsayılan olmayan hesaplar için hesap kimliği veya varsayılan hesap için `default`.

Çoklu hesap kurulumlarında, tek bir ortam değişkeninin birden fazla hesabın aynı oturum açma
oturumunu paylaşmasına neden olmaması için yapılandırmada her hesapta `profile` ayarlamayı tercih edin.

## Yazıyor durumu, tepkiler ve teslim alındıları

- OpenClaw, yanıt göndermeden önce bir yazıyor olayı gönderir (elden geldiğince).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki anlamları: [Tepkiler](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlar için OpenClaw teslim edildi + görüldü alındıları gönderir (elden geldiğince).

## Sorun giderme

**Oturum açma kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden oturum açın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom` içinde sayısal kimlikler ve `groups` içinde kararlı grup kimlikleri kullanın. Bilerek tam arkadaş/grup adlarına ihtiyacınız varsa `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirin.

**Eski CLI tabanlı kurulumdan yükselttiniz:**

- Eski harici `zca` işlem varsayımlarını kaldırın.
- Kanal artık harici CLI ikilileri olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
