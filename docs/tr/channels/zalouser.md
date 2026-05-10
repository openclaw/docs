---
read_when:
    - OpenClaw için Zalo Personal kurulumu
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js (QR ile oturum açma) üzerinden Zalo kişisel hesap desteği, yetenekler ve yapılandırma
title: Zalo kişisel
x-i18n:
    generated_at: "2026-05-10T19:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla **kişisel bir Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kendi riskinizle kullanın.
</Warning>

## Birlikte gelen Plugin

Zalo Personal, güncel OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur, bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Zalo Personal'ı hariç tutan eski bir derlemede veya özel bir kurulumdaysanız,
npm paketini doğrudan kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Veya kaynak denetiminden: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu manuel olarak ekleyebilir.
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
5. DM erişimi varsayılan olarak eşleştirmeye ayarlıdır; ilk temasta eşleştirme kodunu onaylayın.

## Nedir?

- Tamamen süreç içinde `zca-js` aracılığıyla çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılabilir olmadığı "kişisel hesap" kullanım durumları için tasarlanmıştır.

## Adlandırma

Kanal kimliği `zalouser` şeklindedir; bu, bunun **kişisel bir Zalo kullanıcı hesabını** (resmi olmayan) otomatikleştirdiğini açıkça belirtir. `zalo` adını gelecekteki olası resmi bir Zalo API entegrasyonu için ayrılmış tutuyoruz.

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

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom` kararlı Zalo kullanıcı kimlikleri kullanmalıdır. Ayrıca statik gönderen erişim gruplarına da başvurabilir (`accessGroup:<name>`). Etkileşimli kurulum sırasında, girilen adlar Plugin'in süreç içi kişi araması kullanılarak kimliklere çözümlenebilir.

Yapılandırmada ham bir ad kalırsa, başlangıç bunu yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde çözümler. Bu açık katılım olmadan, çalışma zamanı gönderen kontrolleri yalnızca kimlik bazlıdır ve ham adlar yetkilendirme için yok sayılır.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Şunlarla bir izin listesiyle sınırlandırın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; adlar, yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde başlangıçta kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplardaki hangi gönderenlerin botu tetikleyebileceğini denetler; statik gönderen erişim gruplarına `accessGroup:<name>` ile başvurulabilir)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listelerini sorabilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde günlüğe kaydeder.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik bazlıdır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değiştirilebilir başlangıç adı çözümlemesini ve çalışma zamanı grup adı eşleştirmesini yeniden etkinleştiren bir acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup gönderen kontrolleri için `allowFrom` değerine geri döner.
- Gönderen kontrolleri hem normal grup mesajları hem de denetim komutları için geçerlidir (örneğin `/new`, `/reset`).

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

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bir bahsetme gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu hem izin listesine alınmış gruplar hem de açık grup modu için geçerlidir.
- Bir bot mesajını alıntılamak, grup etkinleştirme için örtük bir bahsetme sayılır.
- Yetkili denetim komutları (örneğin `/new`) bahsetme geçidini atlayabilir.
- Bir grup mesajı bahsetme gerektiği için atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değeridir (geri dönüş `50`). Bunu hesap başına `channels.zalouser.historyLimit` ile geçersiz kılabilirsiniz.

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

Hesaplar OpenClaw durumunda `zalouser` profillerine eşlenir. Örnek:

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

## Yazıyor göstergesi, tepkiler ve teslim alındıları

- OpenClaw, bir yanıtı göndermeden önce bir yazıyor olayı gönderir (en iyi çaba).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Tepkiler](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlar için OpenClaw teslim edildi + görüldü alındıları gönderir (en iyi çaba).

## Sorun giderme

**Oturum açma kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden oturum açın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom` içinde sayısal kimlikler ve `groups` içinde kararlı grup kimlikleri kullanın. Özellikle tam arkadaş/grup adlarına ihtiyacınız varsa `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirin.

**Eski CLI tabanlı kurulumdan yükseltildi:**

- Eski harici `zca` süreç varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
