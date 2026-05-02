---
read_when:
    - OpenClaw için Zalo Personal kurulumu
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js (QR ile oturum açma) aracılığıyla Zalo kişisel hesabı desteği, yetenekleri ve yapılandırması
title: Zalo kişisel
x-i18n:
    generated_at: "2026-05-02T22:17:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla **kişisel bir Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına neden olabilir. Kendi sorumluluğunuzda kullanın.
</Warning>

## Paketle gelen Plugin

Zalo Personal, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derleme kullanıyorsanız veya Zalo Personal'ı hariç tutan özel bir kurulumunuz varsa npm paketini doğrudan kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Sabitlenmiş sürüm: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ya da kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'in kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketle birlikte içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Giriş yapın (QR, Gateway makinesinde):
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

## Nedir

- Tamamen işlem içinde `zca-js` üzerinden çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı “kişisel hesap” kullanım durumları için tasarlanmıştır.

## Adlandırma

Kanal kimliği, bunun **kişisel bir Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça göstermek için `zalouser` şeklindedir (resmi olmayan). `zalo` adını gelecekteki olası resmi Zalo API entegrasyonu için ayrılmış tutuyoruz.

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

`channels.zalouser.allowFrom`, kullanıcı kimliklerini veya adlarını kabul eder. Kurulum sırasında adlar, Plugin'in işlem içi kişi araması kullanılarak kimliklere çözümlenir.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamış olduğunda varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- İzin verilenler listesiyle sınırlayın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; mümkün olduğunda adlar başlangıçta kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplardaki hangi gönderenlerin botu tetikleyebileceğini denetler)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listeleri için istem gösterebilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik bazlıdır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmediği sürece kimlik doğrulama için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişken grup adı eşleştirmesini yeniden etkinleştiren acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa çalışma zamanı, grup gönderen denetimleri için `allowFrom` değerine geri döner.
- Gönderen denetimleri hem normal grup mesajlarına hem de denetim komutlarına uygulanır (örneğin `/new`, `/reset`).

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

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bir bahis gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup kısa adı -> `*` -> varsayılan (`true`).
- Bu, hem izin verilen listedeki gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajından alıntı yapmak, grup etkinleştirmesi için örtük bir bahis sayılır.
- Yetkili denetim komutları (örneğin `/new`) bahis geçidini atlayabilir.
- Bir grup mesajı bahis gerektiği için atlandığında OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
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

Hesaplar, OpenClaw durumundaki `zalouser` profilleriyle eşlenir. Örnek:

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

## Yazıyor durumu, tepkiler ve teslim alındıları

- OpenClaw, bir yanıt göndermeden önce yazıyor olayı gönderir (en iyi çabayla).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Tepkiler](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlar için OpenClaw, teslim edildi + görüldü alındıları gönderir (en iyi çabayla).

## Sorun giderme

**Giriş kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden giriş yapın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom`/`groups` içinde sayısal kimlikler ya da tam arkadaş/grup adları kullanın.

**Eski CLI tabanlı kurulumdan yükseltildi:**

- Eski harici `zca` süreci varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahis geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
