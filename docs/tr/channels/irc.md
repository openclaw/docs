---
read_when:
    - OpenClaw'ı IRC kanallarına veya özel mesajlara bağlamak istiyorsunuz
    - IRC izin listelerini, grup politikasını veya bahsetme kısıtlamasını yapılandırıyorsunuz
summary: IRC plugin kurulumu, erişim denetimleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-07-12T11:28:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Klasik kanallarda (`#oda`) ve doğrudan mesajlarda OpenClaw kullanmak istediğinizde IRC'yi kullanın.
Resmî IRC Plugin'ini yükleyin, ardından `channels.irc` altında yapılandırın.

## Hızlı başlangıç

1. Plugin'i yükleyin:

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` içinde en az sunucuyu, takma adı ve katılınacak kanalları ayarlayın:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

Bot koordinasyonu için özel bir IRC sunucusunu tercih edin. Bilerek herkese açık bir IRC ağı kullanıyorsanız yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya sürü arka kanal trafiği için tahmin edilebilir herkese açık kanallardan kaçının.

## Bağlantı ayarları

| Anahtar                       | Varsayılan                    | Notlar                                                                |
| ----------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `host`                        | yok (zorunlu)                 | IRC sunucusunun ana bilgisayar adı                                    |
| `port`                        | TLS ile `6697`, düz `6667`    | 1-65535                                                               |
| `tls`                         | `true`                        | Yalnızca düz metni bilerek kullanıyorsanız `false` olarak ayarlayın   |
| `nick`                        | yok (zorunlu)                 | Bot takma adı                                                          |
| `username`                    | takma ad, yoksa `openclaw`    | IRC kullanıcı adı                                                     |
| `realname`                    | `OpenClaw`                    | Gerçek ad/GECOS alanı                                                  |
| `password` / `passwordFile`   | yok                           | Sunucu parolası; dosya normal bir dosya olmalıdır                     |
| `channels`                    | yok                           | Katılınacak kanallar (`["#openclaw"]`)                                |
| `accounts` / `defaultAccount` | yok                           | Çoklu hesap kurulumu; ortam değişkenleri yalnızca varsayılan hesabı doldurur |

## Güvenlik varsayılanları

- IRC, OpenClaw operatörü tarafından yönetilen ileri proxy yönlendirmesinin dışında ham TCP/TLS soketleri kullanır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışına açıkça izin verilmediği sürece `channels.irc.enabled=false` ayarlayın.
- `channels.irc.dmPolicy` varsayılan olarak `"pairing"` değerini kullanır: bilinmeyen doğrudan mesaj gönderenler, `openclaw pairing approve irc <code>` komutuyla onaylayacağınız bir eşleştirme kodu alır.
- `channels.irc.groupPolicy` varsayılan olarak `"allowlist"` değerini kullanır.
- `groupPolicy="allowlist"` ile izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Düz metin aktarımını bilerek kabul etmediğiniz sürece TLS (`channels.irc.tls=true`) kullanın.

## Erişim denetimi

IRC kanalları için iki ayrı "kapı" vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen mesajları kabul edip etmeyeceği.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanal içinde botu kimlerin tetiklemesine izin verildiği.

Yapılandırma anahtarları:

- Doğrudan mesaj izin listesi (doğrudan mesaj gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına denetimler (kanal + gönderen + bahsetme kuralları): `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` ve `systemPrompt` ile `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**yine de varsayılan olarak bahsetme gerektirir**)

İzin listesi girdileri kararlı gönderen kimliklerini (`nick!user@host`) kullanmalıdır.
Yalnızca takma adla eşleştirme değişkendir ve ancak `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Yaygın sorun: `allowFrom` kanallar için değil, doğrudan mesajlar içindir

Şuna benzer günlükler görüyorsanız:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bu, gönderenin **grup/kanal** mesajları için izinli olmadığı anlamına gelir. Şunlardan birini yaparak düzeltin:

- `channels.irc.groupAllowFrom` ayarlayın (tüm kanallar için genel) veya
- kanal başına gönderen izin listeleri ayarlayın: `channels.irc.groups["#channel"].allowFrom`

Örnek (`#openclaw` içindeki herkesin botla konuşmasına izin verin):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Yanıt tetikleme (bahsetmeler)

Bir kanala (`groupPolicy` + `groups` aracılığıyla) ve gönderene izin verilmiş olsa bile OpenClaw, grup bağlamlarında varsayılan olarak **bahsetme koşulu** uygular. Mesaj, bağlı botun takma adını içerdiğinde veya yapılandırılmış bahsetme kalıplarınızla eşleştiğinde bottan bahsedilmiş sayılır.

Bu, mesaj botla eşleşen bir bahsetme kalıbı içermedikçe `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetme gerektirmeden** yanıt vermesini sağlamak için o kanalda bahsetme koşulunu devre dışı bırakın:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Alternatif olarak, kanal başına izin listesi olmadan **tüm** IRC kanallarına izin vermek ve yine de bahsetme olmadan yanıtlamak için:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Güvenlik notu (herkese açık kanallar için önerilir)

Herkese açık bir kanalda `allowFrom: ["*"]` kullanımına izin verirseniz herkes bota istem gönderebilir.
Riski azaltmak için o kanala yönelik araçları kısıtlayın.

### Kanaldaki herkes için aynı araçlar

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Gönderen başına farklı araçlar (sahip daha fazla yetkiye sahip olur)

`"*"` için daha katı, kendi takma adınız için daha esnek bir politika uygulamak üzere `toolsBySender` kullanın:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notlar:

- `toolsBySender` anahtarları açık önekler (`channel:`, `id:`, `e164:`, `username:`, `name:`) kullanmalıdır. IRC için gönderen kimliği değeriyle `id:` kullanın: daha güçlü eşleştirme için `id:alice` veya `id:alice!~alice@203.0.113.7`.
- Öneksiz eski anahtarlar hâlâ kabul edilir, yalnızca `id:` olarak eşleştirilir ve kullanımdan kaldırma uyarısı oluşturur.
- Eşleşen ilk gönderen politikası geçerli olur; `"*"` joker geri dönüşüdür.

Grup erişimi ile bahsetme koşulu (ve bunların nasıl etkileştiği) hakkında daha fazla bilgi için bkz.: [/channels/groups](/tr/channels/groups).

## NickServ

Bağlandıktan sonra NickServ ile kimliğinizi doğrulamak için:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Bir parola ayarlandığında NickServ kimlik doğrulaması varsayılan olarak her zaman çalışır (devre dışı bırakmak için yalnızca `enabled` değerinin `false` olması gerekir). `service` varsayılan olarak `NickServ` değerini kullanır; `passwordFile`, satır içi `password` için bir alternatiftir.

Bağlantıda isteğe bağlı tek seferlik kayıt (`register: true`, `registerEmail` gerektirir):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Yinelenen REGISTER girişimlerini önlemek için takma ad kaydedildikten sonra `register` seçeneğini devre dışı bırakın.

## Ortam değişkenleri

Varsayılan hesap şunları destekler:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (virgülle ayrılmış)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sorun giderme

- Bot bağlanıyor ancak kanallarda hiç yanıt vermiyorsa `channels.irc.groups` ayarını **ve** bahsetme koşulunun mesajları düşürüp düşürmediğini (`missing-mention`) doğrulayın. Botun bahsetme olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Oturum açma başarısız olursa takma adın kullanılabilirliğini ve sunucu parolasını doğrulayın.
- Özel bir ağda TLS başarısız olursa ana bilgisayar/port ve sertifika kurulumunu doğrulayın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
