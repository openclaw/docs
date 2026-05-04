---
read_when:
    - OpenClaw için Zalo Personal kurulumu
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js (QR ile oturum açma) üzerinden Zalo kişisel hesabı desteği, yetenekleri ve yapılandırması
title: Zalo kişisel
x-i18n:
    generated_at: "2026-05-04T18:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Status: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına neden olabilir. Kullanım riski size aittir.
</Warning>

## Birlikte gelen Plugin

Zalo Personal, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur, bu nedenle normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Zalo Personal'ı hariç tutan özel bir kurulum kullanıyorsanız, npm paketini doğrudan kurun:

- CLI ile kurulum: `openclaw plugins install @openclaw/zalouser`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Veya kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
   - Daha eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
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
5. DM erişimi varsayılan olarak eşleştirmeye ayarlıdır; ilk iletişimde eşleştirme kodunu onaylayın.

## Nedir

- Tamamen süreç içinde `zca-js` üzerinden çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı “kişisel hesap” kullanım senaryoları için tasarlanmıştır.

## Adlandırma

Kanal kimliği, bunun bir **kişisel Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça belirtmek için `zalouser` şeklindedir (resmi olmayan). `zalo` adını gelecekteki olası resmi bir Zalo API entegrasyonu için ayrılmış tutuyoruz.

## Kimlikleri bulma (dizin)

Eşleri/grupları ve kimliklerini keşfetmek için dizin CLI'ını kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin ~2000 karakterlik parçalara bölünür (Zalo istemci sınırları).
- Streaming varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom` kararlı Zalo kullanıcı kimliklerini kullanmalıdır. Etkileşimli kurulum sırasında girilen adlar, Plugin'in süreç içi kişi araması kullanılarak kimliklere çözümlenebilir.

Yapılandırmada ham bir ad kalırsa, başlangıç bunu yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde çözümler. Bu açık onay olmadan, çalışma zamanı gönderici denetimleri yalnızca kimlik tabanlıdır ve ham adlar yetkilendirme için yok sayılır.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Bir izin listesiyle sınırlandırın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; adlar yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde başlangıçta kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi göndericilerin botu tetikleyebileceğini denetler)
- Tüm grupları engelle: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listelerini sorabilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi yalnızca `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirildiğinde günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik tabanlıdır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değiştirilebilir başlangıç ad çözümlemesini ve çalışma zamanı grup adı eşleştirmesini yeniden etkinleştiren acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup gönderici denetimleri için `allowFrom` değerine geri döner.
- Gönderici denetimleri hem normal grup mesajlarına hem de denetim komutlarına uygulanır (örneğin `/new`, `/reset`).

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

### Grup bahsi kapısı

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bir bahsetme gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu hem izin listesindeki gruplar hem de açık grup modu için geçerlidir.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük bir bahsetme sayılır.
- Yetkili denetim komutları (örneğin `/new`) bahsetme kapısını atlayabilir.
- Bahsetme gerektiği için bir grup mesajı atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
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

- OpenClaw, bir yanıt göndermeden önce yazıyor olayı gönderir (en iyi çabayla).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Tepkiler](/tr/tools/reactions)
- Olay meta verileri içeren gelen mesajlar için OpenClaw teslim edildi + görüldü alındıları gönderir (en iyi çabayla).

## Sorun giderme

**Oturum açma kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden oturum açın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom` içinde sayısal kimlikleri ve `groups` içinde kararlı grup kimliklerini kullanın. Özellikle tam arkadaş/grup adlarına ihtiyacınız varsa `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirin.

**Eski CLI tabanlı kurulumdan yükseltildi:**

- Eski harici `zca` süreç varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
