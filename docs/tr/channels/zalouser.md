---
read_when:
    - OpenClaw için Zalo Personal kurulurken
    - Zalo Personal giriş veya mesaj akışı sorunları giderilirken
summary: Yerel `zca-js` aracılığıyla Zalo kişisel hesap desteği (QR ile giriş), yetenekler ve yapılandırma
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T13:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (resmi olmayan)

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

> **Uyarı:** Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına/banlanmasına yol açabilir. Riski size aittir.

## Paketlenmiş eklenti

Zalo Personal, mevcut OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derleme veya Zalo Personal’ı içermeyen özel bir kurulum kullanıyorsanız, elle yükleyin:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Ya da kaynak kod checkout’undan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tools/plugin)

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç seviyesi)

1. Zalo Personal eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
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

4. Gateway’i yeniden başlatın (veya kurulumu tamamlayın).
5. DM erişimi varsayılan olarak eşleme kullanır; ilk temasta eşleme kodunu onaylayın.

## Nedir

- Tamamen işlem içinde `zca-js` aracılığıyla çalışır.
- Gelen mesajları almak için yerel olay dinleyicilerini kullanır.
- Yanıtları doğrudan JS API üzerinden gönderir (metin/medya/bağlantı).
- Zalo Bot API’nin mevcut olmadığı “kişisel hesap” kullanım senaryoları için tasarlanmıştır.

## Adlandırma

Kanal kimliği, bunun **kişisel bir Zalo kullanıcı hesabını** (resmi olmayan) otomatikleştirdiğini açıkça belirtmek için `zalouser` olarak ayarlanmıştır. `zalo` adını, gelecekteki olası resmi Zalo API entegrasyonu için saklı tutuyoruz.

## Kimlikleri bulma (dizin)

Eşleri/grupları ve kimliklerini keşfetmek için dizin CLI’sini kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin yaklaşık 2000 karaktere bölünür (Zalo istemci sınırları).
- Streaming varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom`, kullanıcı kimliklerini veya adlarını kabul eder. Kurulum sırasında adlar, eklentinin işlem içi kişi araması kullanılarak kimliklere çözümlenir.

Şununla onaylayın:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Bir izin listesiyle kısıtlamak için:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup kimlikleri olmalıdır; mümkün olduğunda adlar başlangıçta kimliklere çözümlenir)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi gönderenlerin botu tetikleyebileceğini denetler)
- Tüm grupları engellemek için: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup izin listelerini sorabilir.
- Başlangıçta OpenClaw, izin listelerindeki grup/kullanıcı adlarını kimliklere çözümler ve eşlemeyi günlüğe yazar.
- Grup izin listesi eşleştirmesi varsayılan olarak yalnızca kimlik üzerinden yapılır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkin değilse yetkilendirme için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişebilir grup adı eşleştirmesini yeniden etkinleştiren son çare uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa, çalışma zamanı grup gönderen denetimleri için `allowFrom` değerine geri döner.
- Gönderen denetimleri hem normal grup mesajları hem de kontrol komutları için geçerlidir (örneğin `/new`, `/reset`).

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
- Çözümleme sırası: tam grup kimliği/adı -> normalize edilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu hem izin listesine alınmış gruplar hem de açık grup modu için geçerlidir.
- Yetkili kontrol komutları (örneğin `/new`) bahsetme geçidini atlayabilir.
- Bir grup mesajı, bahsetme gerektiği için atlandığında OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına ekler.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değeridir (geri dönüş: `50`). Hesap başına geçersiz kılmak için `channels.zalouser.historyLimit` kullanabilirsiniz.

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

## Yazıyor, tepkiler ve teslim alındı bildirimleri

- OpenClaw, bir yanıt göndermeden önce bir yazıyor olayı gönderir (best-effort).
- Kanal eylemlerinde `zalouser` için `react` mesaj tepki eylemi desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Reactions](/tools/reactions)
- Olay meta verisi içeren gelen mesajlarda OpenClaw, teslim edildi + görüldü bildirimleri gönderir (best-effort).

## Sorun giderme

**Giriş kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden giriş yapın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**İzin listesi/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom`/`groups` içinde sayısal kimlikler veya tam arkadaş/grup adları kullanın.

**Eski CLI tabanlı kurulumdan yükseltildi:**

- Eski harici `zca` süreci varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
