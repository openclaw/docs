---
read_when:
    - OpenClaw için Zalo Personal kurulumu
    - Zalo Personal girişini veya mesaj akışını hata ayıklama
summary: Yerli zca-js (QR giriş) aracılığıyla Zalo kişisel hesap desteği, yetenekleri ve yapılandırması
title: Zalo kişisel hesabı
x-i18n:
    generated_at: "2026-04-24T09:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (resmi olmayan)

Durum: deneysel. Bu entegrasyon, OpenClaw içinde yerel `zca-js` aracılığıyla bir **kişisel Zalo hesabını** otomatikleştirir.

> **Uyarı:** Bu resmi olmayan bir entegrasyondur ve hesabın askıya alınmasına/yasaklanmasına yol açabilir. Riski size aittir.

## Paketlenmiş Plugin

Zalo Personal, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir, bu yüzden normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derleme veya Zalo Personal'ı hariç tutan özel bir kurulum kullanıyorsanız,
bunu manuel olarak kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalouser`
- Veya kaynak checkout'tan: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

Harici bir `zca`/`openzca` CLI ikili dosyası gerekmez.

## Hızlı kurulum (başlangıç)

1. Zalo Personal Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
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
5. DM erişimi varsayılan olarak eşleştirmedir; ilk temasta eşleştirme kodunu onaylayın.

## Nedir

- Tamamen `zca-js` aracılığıyla süreç içinde çalışır.
- Gelen mesajları almak için yerel olay dinleyicileri kullanır.
- Yanıtları JS API aracılığıyla doğrudan gönderir (metin/medya/bağlantı).
- Zalo Bot API'nin mevcut olmadığı “kişisel hesap” kullanım senaryoları için tasarlanmıştır.

## Adlandırma

Kanal kimliği `zalouser` olarak belirlenmiştir; bunun **kişisel bir Zalo kullanıcı hesabını** (resmi olmayan) otomatikleştirdiğini açıkça belirtir. `zalo` adını gelecekte olası resmi bir Zalo API entegrasyonu için saklı tutuyoruz.

## ID'leri bulma (dizin)

Eşleri/grupları ve bunların ID'lerini keşfetmek için dizin CLI'ını kullanın:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Sınırlar

- Giden metin yaklaşık 2000 karaktere bölünür (Zalo istemci sınırları).
- Akış varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

`channels.zalouser.dmPolicy` şunları destekler: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).

`channels.zalouser.allowFrom`, kullanıcı ID'lerini veya adlarını kabul eder. Kurulum sırasında adlar, Plugin'in süreç içi kişi araması kullanılarak ID'lere çözülür.

Onaylamak için:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Grup erişimi (isteğe bağlı)

- Varsayılan: `channels.zalouser.groupPolicy = "open"` (gruplara izin verilir). Ayarlanmamışsa varsayılanı geçersiz kılmak için `channels.defaults.groupPolicy` kullanın.
- Bir allowlist ile kısıtlamak için:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (anahtarlar kararlı grup ID'leri olmalıdır; adlar mümkün olduğunda başlangıçta ID'lere çözülür)
  - `channels.zalouser.groupAllowFrom` (izin verilen gruplarda hangi gönderenlerin botu tetikleyebileceğini denetler)
- Tüm grupları engelleyin: `channels.zalouser.groupPolicy = "disabled"`.
- Yapılandırma sihirbazı grup allowlist'leri için istem gösterebilir.
- Başlangıçta OpenClaw, allowlist'lerdeki grup/kullanıcı adlarını ID'lere çözer ve eşlemeyi günlüğe kaydeder.
- Grup allowlist eşleştirmesi varsayılan olarak yalnızca ID tabanlıdır. Çözümlenmemiş adlar, `channels.zalouser.dangerouslyAllowNameMatching: true` etkinleştirilmedikçe kimlik doğrulaması için yok sayılır.
- `channels.zalouser.dangerouslyAllowNameMatching: true`, değişebilir grup adı eşleştirmesini yeniden etkinleştiren acil durum uyumluluk modudur.
- `groupAllowFrom` ayarlanmamışsa çalışma zamanı, grup göndereni kontrolleri için `allowFrom` değerine fallback yapar.
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

### Grup mention sınırlaması

- `channels.zalouser.groups.<group>.requireMention`, grup yanıtlarının mention gerektirip gerektirmediğini denetler.
- Çözümleme sırası: tam grup id/adı -> normalize edilmiş grup slug'ı -> `*` -> varsayılan (`true`).
- Bu, hem allowlist'teki gruplara hem de açık grup moduna uygulanır.
- Bir bot mesajını alıntılamak, grup etkinleştirmesi için örtük mention sayılır.
- Yetkili denetim komutları (örneğin `/new`), mention sınırlamasını atlayabilir.
- Bir grup mesajı mention gerektiği için atlandığında OpenClaw bunu bekleyen grup geçmişi olarak saklar ve bir sonraki işlenen grup mesajına dahil eder.
- Grup geçmişi sınırı varsayılan olarak `messages.groupChat.historyLimit` değeridir (fallback `50`). Hesap başına geçersiz kılmak için `channels.zalouser.historyLimit` kullanabilirsiniz.

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

Hesaplar, OpenClaw durumundaki `zalouser` profillerine eşlenir. Örnek:

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

## Yazıyor durumu, tepkiler ve teslim onayları

- OpenClaw, bir yanıt göndermeden önce bir yazıyor olayı gönderir (best-effort).
- Mesaj tepki eylemi `react`, kanal eylemlerinde `zalouser` için desteklenir.
  - Bir mesajdan belirli bir tepki emojisini kaldırmak için `remove: true` kullanın.
  - Tepki semantiği: [Reactions](/tr/tools/reactions)
- Olay meta verisi içeren gelen mesajlarda OpenClaw, teslim edildi + görüldü onayları gönderir (best-effort).

## Sorun giderme

**Giriş kalıcı olmuyor:**

- `openclaw channels status --probe`
- Yeniden giriş yapın: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/grup adı çözümlenmedi:**

- `allowFrom`/`groupAllowFrom`/`groups` içinde sayısal ID'ler veya tam arkadaş/grup adları kullanın.

**Eski CLI tabanlı kurulumdan yükselttiniz:**

- Eski harici `zca` süreci varsayımlarını kaldırın.
- Kanal artık harici CLI ikili dosyaları olmadan tamamen OpenClaw içinde çalışır.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention sınırlaması
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Security](/tr/gateway/security) — erişim modeli ve sertleştirme
