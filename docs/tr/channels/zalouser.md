---
read_when:
    - OpenClaw için Zalo Personal kurulumu
    - Zalo Personal oturum açma veya mesaj akışında hata ayıklama
summary: Yerel zca-js (QR girişi) aracılığıyla Zalo kişisel hesap desteği, yetenekler ve yapılandırma
title: Zalo kişisel
x-i18n:
    generated_at: "2026-04-30T09:10:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla **kişisel bir Zalo hesabını** otomatikleştirir.

<Warning>
Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına veya yasaklanmasına yol açabilir. Kullanım riski size aittir.
</Warning>

## Birlikte gelen Plugin

Zalo Personal, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur; bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Zalo Personal'ı hariç tutan özel bir kurulum kullanıyorsanız,
yayımlandığında güncel bir npm paketini kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Veya kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, daha yeni bir npm paketi
yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel checkout yolunu kullanın.

Harici bir `zca`/`openzca` CLI ikilisi gerekli değildir.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar.
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
5. DM erişimi varsayılan olarak eşleştirmeye ayarlıdır; ilk temasta eşleştirme kodunu onaylayın.

## Nedir

- Tamamen işlem içinde `zca-js` aracılığıyla çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin kullanılamadığı “kişisel hesap” kullanım durumları için tasarlanmıştır.

## Adlandırma

Kanal kimliği, bunun **kişisel bir Zalo kullanıcı hesabını** otomatikleştirdiğini açıkça belirtmek için `zalouser` şeklindedir (resmi değildir). `zalo` kimliğini gelecekteki olası resmi bir Zalo API entegrasyonu için ayırıyoruz.

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

`channels.zalouser.allowFrom` kullanıcı kimliklerini veya adları kabul eder. Kurulum sırasında adlar, Plugin'in işlem içi kişi araması kullanılarak kimliklere çözümlenir.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmadığında varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Bir izin listesiyle sınırlandırın:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; mümkün olduğunda başlangıçta adlar kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi gönderenlerin botu tetikleyebileceğini denetler)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listeleri için istem gösterebilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi günlüğe kaydeder.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimliğe göre yapılır. `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe çözümlenmemiş adlar kimlik doğrulaması için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişebilir grup adı eşleştirmesini yeniden etkinleştiren bir uyumluluk kurtarma modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup göndereni denetimleri için `allowFrom` değerine geri döner.
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

### Grup mention geçidi

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının bir mention gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup kimliği/adı -> normalleştirilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu, hem izin listesine alınmış gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajından alıntı yapmak, grup etkinleştirmesi için örtük mention sayılır.
- Yetkili denetim komutları (örneğin `/new`) mention geçidini atlayabilir.
- Bir grup mesajı mention gerektiği için atlandığında, OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değeridir (fallback `50`). Hesap başına `channels.zalouser.historyLimit` ile geçersiz kılabilirsiniz.

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

## Yazıyor göstergesi, tepkiler ve teslim onayları

- OpenClaw, bir yanıtı göndermeden önce bir yazıyor olayı gönderir (en iyi çaba).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Tepkiler](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlar için OpenClaw teslim edildi + görüldü onayları gönderir (en iyi çaba).

## Sorun giderme

**Oturum kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden oturum açın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom`/`groups` içinde sayısal kimlikler veya tam arkadaş/grup adları kullanın.

**Eski CLI tabanlı kurulumdan yükselttiniz:**

- Eski harici `zca` süreç varsayımlarını kaldırın.
- Kanal artık harici CLI ikilileri olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
