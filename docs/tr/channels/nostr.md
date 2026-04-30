---
read_when:
    - OpenClaw'ın Nostr üzerinden doğrudan mesajlar almasını istiyorsunuz
    - Merkeziyetsiz mesajlaşmayı kuruyorsunuz
summary: NIP-04 şifreli mesajları üzerinden Nostr DM kanalı
title: Nostr
x-i18n:
    generated_at: "2026-04-30T09:07:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Durum:** İsteğe bağlı birlikte gelen Plugin (yapılandırılana kadar varsayılan olarak devre dışıdır).

Nostr, sosyal ağ için merkeziyetsiz bir protokoldür. Bu kanal, OpenClaw'un NIP-04 üzerinden şifrelenmiş doğrudan iletileri (DM'ler) almasını ve yanıtlamasını sağlar.

## Birlikte gelen Plugin

Güncel OpenClaw sürümleri Nostr'ı birlikte gelen bir Plugin olarak gönderir, bu yüzden normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

### Eski/özel kurulumlar

- Onboarding (`openclaw onboard`) ve `openclaw channels add`, Nostr'ı paylaşılan kanal kataloğundan hâlâ gösterir.
- Derlemeniz birlikte gelen Nostr'ı hariç tutuyorsa, yayımlandığında güncel bir npm paketi kurun.

```bash
openclaw plugins install @openclaw/nostr
```

npm, OpenClaw'a ait paketi kullanım dışı olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel bir checkout kullanın.

Yerel bir checkout kullanın (geliştirme iş akışları):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin'leri kurduktan veya etkinleştirdikten sonra Gateway'i yeniden başlatın.

### Etkileşimsiz kurulum

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Anahtarı yapılandırmada saklamak yerine `NOSTR_PRIVATE_KEY` değerini ortamda tutmak için `--use-env` kullanın.

## Hızlı kurulum

1. Bir Nostr anahtar çifti oluşturun (gerekirse):

```bash
# Using nak
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

| Anahtar      | Tür      | Varsayılan                                  | Açıklama                            |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | gerekli                                     | `nsec` veya hex biçiminde özel anahtar |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL'leri (WebSocket)          |
| `dmPolicy`   | string   | `pairing`                                   | DM erişim ilkesi                    |
| `allowFrom`  | string[] | `[]`                                        | İzin verilen gönderici pubkey'leri  |
| `enabled`    | boolean  | `true`                                      | Kanalı etkinleştir/devre dışı bırak |
| `name`       | string   | -                                           | Görünen ad                          |
| `profile`    | object   | -                                           | NIP-01 profil meta verileri         |

## Profil meta verileri

Profil verileri, NIP-01 `kind:0` olayı olarak yayımlanır. Bunları Control UI'dan (Channels -> Nostr -> Profile) yönetebilir veya doğrudan yapılandırmada ayarlayabilirsiniz.

Örnek:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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
- Relay'lerden içe aktarma alanları birleştirir ve yerel geçersiz kılmaları korur.

## Erişim denetimi

### DM ilkeleri

- **pairing** (varsayılan): bilinmeyen göndericiler bir eşleştirme kodu alır.
- **allowlist**: yalnızca `allowFrom` içindeki pubkey'ler DM gönderebilir.
- **open**: herkese açık gelen DM'ler (`allowFrom: ["*"]` gerektirir).
- **disabled**: gelen DM'leri yok sayar.

Uygulama notları:

- Gelen olay imzaları, gönderici ilkesi ve NIP-04 şifre çözmeden önce doğrulanır; bu yüzden sahte olaylar erken reddedilir.
- Eşleştirme yanıtları, özgün DM gövdesi işlenmeden gönderilir.
- Gelen DM'ler hız sınırlamasına tabidir ve aşırı büyük yükler şifre çözmeden önce atılır.

### Allowlist örneği

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

- **Özel anahtar:** `nsec...` veya 64 karakterlik hex
- **Pubkey'ler (`allowFrom`):** `npub...` veya hex

## Relay'ler

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

- Yedeklilik için 2-3 relay kullanın.
- Çok fazla relay kullanmaktan kaçının (gecikme, yinelenme).
- Ücretli relay'ler güvenilirliği artırabilir.
- Yerel relay'ler test için uygundur (`ws://localhost:7777`).

## Protokol desteği

| NIP    | Durum      | Açıklama                              |
| ------ | ---------- | ------------------------------------- |
| NIP-01 | Desteklenir | Temel olay biçimi + profil meta verileri |
| NIP-04 | Desteklenir | Şifrelenmiş DM'ler (`kind:4`)         |
| NIP-17 | Planlandı  | Hediye paketli DM'ler                 |
| NIP-44 | Planlandı  | Sürümlü şifreleme                     |

## Test

### Yerel relay

```bash
# Start strfry
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

### Manuel test

1. Günlüklerden bot pubkey'ini (npub) not edin.
2. Bir Nostr istemcisi açın (Damus, Amethyst vb.).
3. Bot pubkey'ine DM gönderin.
4. Yanıtı doğrulayın.

## Sorun giderme

### İletiler alınmıyor

- Özel anahtarın geçerli olduğunu doğrulayın.
- Relay URL'lerinin erişilebilir olduğundan ve `wss://` kullandığından emin olun (veya yerel için `ws://`).
- `enabled` değerinin `false` olmadığını doğrulayın.
- Relay bağlantı hataları için Gateway günlüklerini kontrol edin.

### Yanıtlar gönderilmiyor

- Relay'in yazmaları kabul ettiğini kontrol edin.
- Giden bağlantıyı doğrulayın.
- Relay hız sınırlarına dikkat edin.

### Yinelenen yanıtlar

- Birden fazla relay kullanırken beklenen bir durumdur.
- İletiler olay kimliğine göre tekilleştirilir; yalnızca ilk teslim yanıtı tetikler.

## Güvenlik

- Özel anahtarları asla commit etmeyin.
- Anahtarlar için ortam değişkenleri kullanın.
- Üretim botları için `allowlist` kullanmayı değerlendirin.
- İmzalar gönderici ilkesinden önce doğrulanır ve gönderici ilkesi şifre çözmeden önce uygulanır; bu yüzden sahte olaylar erken reddedilir ve bilinmeyen göndericiler tam kripto işini zorlayamaz.

## Sınırlamalar (MVP)

- Yalnızca doğrudan iletiler (grup sohbeti yok).
- Medya ekleri yok.
- Yalnızca NIP-04 (NIP-17 hediye paketleme planlandı).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
