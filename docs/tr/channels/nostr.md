---
read_when:
    - OpenClaw'un Nostr üzerinden doğrudan mesajlar almasını istiyorsunuz
    - Merkeziyetsiz mesajlaşmayı kuruyorsunuz
summary: NIP-04 ile şifrelenmiş mesajlar üzerinden Nostr DM kanalı
title: Nostr
x-i18n:
    generated_at: "2026-07-12T12:05:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr, OpenClaw'un Nostr aktarıcıları üzerinden NIP-04 ile şifrelenmiş doğrudan mesajları alıp yanıtlamasını sağlayan, indirilebilir bir kanal Plugin'idir (`@openclaw/nostr`). Her Gateway için bir hesap; yalnızca doğrudan mesajlar.

## Kurulum

```bash
openclaw plugins install @openclaw/nostr
```

Güncel resmî sürüm etiketini takip etmek için yalnızca paket belirtimini kullanın. Tam sürümü yalnızca yeniden üretilebilir bir kurulum gerektiğinde sabitleyin.

Yerel bir çalışma kopyasından (geliştirme iş akışları):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin'leri kurduktan veya etkinleştirdikten sonra Gateway'i yeniden başlatın. Plugin kurulduktan sonra ilk kurulum (`openclaw onboard`) ve `openclaw channels add`, paylaşılan kanal kataloğundaki Nostr'u gösterir.

### Etkileşimsiz kurulum

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Anahtarı yapılandırmada saklamak yerine `NOSTR_PRIVATE_KEY` ortam değişkeninde tutmak için `--use-env` kullanın (yalnızca varsayılan hesap).

## Hızlı kurulum

1. Bir Nostr anahtar çifti oluşturun (gerekiyorsa):

```bash
# nak kullanarak
nak key generate
```

2. Yapılandırmaya ekleyin:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Anahtarı dışa aktarın:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway'i yeniden başlatın.

## Yapılandırma başvurusu

| Anahtar      | Tür      | Varsayılan                                  | Açıklama                                                    |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------------------------- |
| `privateKey` | string   | gerekli                                     | `nsec` veya onaltılık biçimde özel anahtar; gizli başvurularına izin verilir |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Aktarıcı URL'leri (WebSocket)                               |
| `dmPolicy`   | string   | `pairing`                                   | Doğrudan mesaj erişim politikası                            |
| `allowFrom`  | string[] | `[]`                                        | İzin verilen gönderen açık anahtarları                      |
| `enabled`    | boolean  | `true`                                      | Kanalı etkinleştirir/devre dışı bırakır                     |
| `name`       | string   | -                                           | Görünen ad                                                  |
| `profile`    | object   | -                                           | NIP-01 profil meta verileri                                 |

## Profil meta verileri

Profil verileri, NIP-01 `kind:0` olayı olarak yayımlanır. Bunları Denetim Arayüzünden (Channels -> Nostr -> Profile) yönetebilir veya doğrudan yapılandırmada ayarlayabilirsiniz.

Örnek:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Kişisel asistan doğrudan mesaj botu",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Notlar:

- Profil URL'leri `https://` kullanmalıdır.
- Aktarıcılardan içe aktarma, alanları birleştirir ve yerel geçersiz kılmaları korur.

## Erişim denetimi

### Doğrudan mesaj politikaları

- **pairing** (varsayılan): bilinmeyen gönderenlere bir eşleştirme kodu verilir.
- **allowlist**: yalnızca `allowFrom` içindeki açık anahtarlar doğrudan mesaj gönderebilir.
- **open**: herkese açık gelen doğrudan mesajlar (`allowFrom: ["*"]` gerektirir).
- **disabled**: gelen doğrudan mesajları yok sayar.

Uygulama notları:

- Gelen olay imzaları, gönderen politikası uygulanmadan ve NIP-04 şifre çözme işleminden önce doğrulanır; böylece sahte olaylar erkenden reddedilir.
- Eşleştirme yanıtları, özgün doğrudan mesaj gövdesinin şifresi çözülmeden veya gövde işlenmeden gönderilir.
- Gelen doğrudan mesajlar için hız sınırı uygulanır (genel olarak ve gönderen başına) ve aşırı büyük yükler şifreleri çözülmeden önce bırakılır.

### İzin verilenler listesi örneği

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Anahtar biçimleri

Kabul edilen biçimler:

- **Özel anahtar:** `nsec...` veya 64 karakterlik onaltılık değer
- **Açık anahtarlar (`allowFrom`):** `npub...` veya onaltılık değer

## Aktarıcılar

Varsayılanlar: `relay.damus.io` ve `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

İpuçları:

- Yedeklilik için 2-3 aktarıcı kullanın.
- Çok fazla aktarıcı kullanmaktan kaçının (gecikme, çoğaltma).
- Ücretli aktarıcılar güvenilirliği artırabilir.
- Yerel aktarıcılar test için uygundur (`ws://localhost:7777`).

## Protokol desteği

| NIP    | Durum        | Açıklama                                       |
| ------ | ------------ | ---------------------------------------------- |
| NIP-01 | Destekleniyor | Temel olay biçimi + profil meta verileri       |
| NIP-04 | Destekleniyor | Şifrelenmiş doğrudan mesajlar (`kind:4`)       |
| NIP-17 | Planlanıyor   | Hediye paketli doğrudan mesajlar               |
| NIP-44 | Planlanıyor   | Sürümlendirilmiş şifreleme                     |

## Test

### Yerel aktarıcı

```bash
# strfry'yi başlatın
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Elle test

1. Gateway günlüklerinden veya `openclaw channels status` çıktısından botun açık anahtarını not edin (onaltılık; gerekirse istemcinizde npub biçimine dönüştürün).
2. Bir Nostr istemcisi açın (Amethyst, Damus vb.).
3. Botun açık anahtarına doğrudan mesaj gönderin.
4. Yanıtı doğrulayın.

## Sorun giderme

### Mesajlar alınmıyor

- Özel anahtarın geçerli olduğunu doğrulayın.
- Aktarıcı URL'lerinin erişilebilir olduğundan ve `wss://` (yerel için `ws://`) kullandığından emin olun.
- `enabled` değerinin `false` olmadığını doğrulayın.
- Aktarıcı bağlantı hataları için Gateway günlüklerini kontrol edin.

### Yanıtlar gönderilmiyor

- Aktarıcının yazma işlemlerini kabul edip etmediğini kontrol edin.
- Giden bağlantıyı doğrulayın.
- Aktarıcı hız sınırlarını izleyin.

### Yinelenen yanıtlar

- Birden fazla aktarıcı kullanıldığında beklenen bir durumdur.
- Mesajların yinelenmesi olay kimliğine göre engellenir; yalnızca ilk teslimat bir yanıtı tetikler.

## Güvenlik

- Özel anahtarları hiçbir zaman işlemeyin.
- Anahtarlar için ortam değişkenlerini kullanın.
- Üretim botları için `allowlist` kullanmayı değerlendirin.
- İmzalar gönderen politikasından önce doğrulanır ve gönderen politikası şifre çözme işleminden önce uygulanır; böylece sahte olaylar erkenden reddedilir ve bilinmeyen gönderenler tüm kriptografik işlemleri zorla çalıştıramaz.

## Sınırlamalar (MVP)

- Yalnızca doğrudan mesajlar (grup sohbetleri yoktur).
- Medya ekleri yoktur.
- Yalnızca NIP-04 (NIP-17 hediye paketleme desteği planlanmaktadır).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
