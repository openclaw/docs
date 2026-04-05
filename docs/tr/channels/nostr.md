---
read_when:
    - OpenClaw'ın Nostr üzerinden DM almasını istiyorsunuz
    - Merkezi olmayan mesajlaşmayı kuruyorsunuz
summary: NIP-04 şifreli mesajlar üzerinden Nostr DM kanalı
title: Nostr
x-i18n:
    generated_at: "2026-04-05T13:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Durum:** İsteğe bağlı olarak pakete dahil plugin (yapılandırılana kadar varsayılan olarak devre dışı).

Nostr, sosyal ağlar için merkezi olmayan bir protokoldür. Bu kanal, OpenClaw'ın NIP-04 üzerinden şifrelenmiş doğrudan mesajları (DM) almasını ve yanıtlamasını sağlar.

## Pakete dahil plugin

Mevcut OpenClaw sürümleri Nostr'u pakete dahil bir plugin olarak sunar, bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

### Eski/özel kurulumlar

- Onboarding (`openclaw onboard`) ve `openclaw channels add`, Nostr'u paylaşılan kanal kataloğunda göstermeye devam eder.
- Derlemeniz pakete dahil Nostr'u içermiyorsa, manuel olarak yükleyin.

```bash
openclaw plugins install @openclaw/nostr
```

Yerel bir checkout kullanın (geliştirme iş akışları):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin'leri yükledikten veya etkinleştirdikten sonra Gateway'i yeniden başlatın.

### Etkileşimsiz kurulum

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Anahtarı config içinde saklamak yerine ortamda tutmak için `--use-env` kullanın.

## Hızlı kurulum

1. Bir Nostr anahtar çifti oluşturun (gerekirse):

```bash
# nak kullanarak
nak key generate
```

2. Config'e ekleyin:

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

| Anahtar      | Tür      | Varsayılan                                  | Açıklama                             |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | gerekli                                     | `nsec` veya hex biçiminde özel anahtar |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL'leri (WebSocket)           |
| `dmPolicy`   | string   | `pairing`                                   | DM erişim ilkesi                     |
| `allowFrom`  | string[] | `[]`                                        | İzin verilen gönderen pubkey'leri    |
| `enabled`    | boolean  | `true`                                      | Kanalı etkinleştir/devre dışı bırak  |
| `name`       | string   | -                                           | Görünen ad                           |
| `profile`    | object   | -                                           | NIP-01 profil meta verileri          |

## Profil meta verileri

Profil verileri NIP-01 `kind:0` olayı olarak yayımlanır. Bunu Control UI üzerinden (Channels -> Nostr -> Profile) yönetebilir veya doğrudan config içinde ayarlayabilirsiniz.

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

- **pairing** (varsayılan): bilinmeyen gönderenler bir eşleştirme kodu alır.
- **allowlist**: yalnızca `allowFrom` içindeki pubkey'ler DM gönderebilir.
- **open**: herkese açık gelen DM'ler (`allowFrom: ["*"]` gerektirir).
- **disabled**: gelen DM'leri yok say.

Zorunlu kılma notları:

- Gelen olay imzaları, gönderen ilkesi ve NIP-04 çözmesinden önce doğrulanır; bu nedenle sahte olaylar erken reddedilir.
- Eşleştirme yanıtları, özgün DM gövdesi işlenmeden gönderilir.
- Gelen DM'ler oran sınırlamasına tabidir ve aşırı büyük payload'lar çözmeden önce düşürülür.

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
- Çok fazla relay kullanmaktan kaçının (gecikme, çoğaltma).
- Ücretli relay'ler güvenilirliği artırabilir.
- Yerel relay'ler test için uygundur (`ws://localhost:7777`).

## Protokol desteği

| NIP    | Durum      | Açıklama                              |
| ------ | ---------- | ------------------------------------- |
| NIP-01 | Desteklenir | Temel olay biçimi + profil meta verileri |
| NIP-04 | Desteklenir | Şifrelenmiş DM'ler (`kind:4`)         |
| NIP-17 | Planlandı  | Hediye paketli DM'ler                 |
| NIP-44 | Planlandı  | Sürümlenmiş şifreleme                 |

## Test

### Yerel relay

```bash
# strfry başlatın
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

1. Günlüklerden bot pubkey'sini (npub) not edin.
2. Bir Nostr istemcisi açın (Damus, Amethyst vb.).
3. Bot pubkey'sine DM gönderin.
4. Yanıtı doğrulayın.

## Sorun giderme

### Mesajlar alınmıyor

- Özel anahtarın geçerli olduğunu doğrulayın.
- Relay URL'lerinin erişilebilir olduğundan ve `wss://` kullandığından emin olun (yerel için `ws://`).
- `enabled` değerinin `false` olmadığını doğrulayın.
- Relay bağlantı hataları için Gateway günlüklerini kontrol edin.

### Yanıtlar gönderilmiyor

- Relay'in yazma işlemlerini kabul ettiğini kontrol edin.
- Giden bağlantıyı doğrulayın.
- Relay oran sınırlarına dikkat edin.

### Yinelenen yanıtlar

- Birden fazla relay kullanıldığında beklenir.
- Mesajlar olay kimliğine göre tekilleştirilir; yalnızca ilk teslimat bir yanıtı tetikler.

## Güvenlik

- Özel anahtarları asla commit etmeyin.
- Anahtarlar için ortam değişkenleri kullanın.
- Üretim botları için `allowlist` kullanmayı değerlendirin.
- İmzalar gönderen ilkesinden önce doğrulanır ve gönderen ilkesi çözmeden önce uygulanır; bu nedenle sahte olaylar erken reddedilir ve bilinmeyen gönderenler tam kripto işlemini zorlayamaz.

## Sınırlamalar (MVP)

- Yalnızca doğrudan mesajlar (grup sohbeti yok).
- Medya eki yok.
- Yalnızca NIP-04 (NIP-17 gift-wrap planlanmıştır).

## İlgili

- [Kanal Genel Bakışı](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve mention kapılaması
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
