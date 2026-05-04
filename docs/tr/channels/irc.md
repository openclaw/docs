---
read_when:
    - OpenClaw’u IRC kanallarına veya DM’lere bağlamak istiyorsunuz
    - IRC izin listelerini, grup ilkesini veya bahsetme kısıtlamasını yapılandırıyorsunuz
summary: IRC Plugin kurulumu, erişim denetimleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

OpenClaw'ı klasik kanallarda (`#room`) ve doğrudan mesajlarda kullanmak istediğinizde IRC kullanın.
IRC, paketle birlikte gelen bir Plugin olarak sunulur, ancak ana yapılandırmada `channels.irc` altında yapılandırılır.

## Hızlı başlangıç

1. `~/.openclaw/openclaw.json` içinde IRC yapılandırmasını etkinleştirin.
2. En az şunları ayarlayın:

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

Bot koordinasyonu için özel bir IRC sunucusu tercih edin. Bilerek herkese açık bir IRC ağı kullanıyorsanız yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya sürü arka kanal trafiği için tahmin edilebilir herkese açık kanallardan kaçının.

3. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

## Güvenlik varsayılanları

- IRC, OpenClaw operatör yönetimli ileri proxy yönlendirmesi dışında ham TCP/TLS soketleri kullanır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışına açıkça onay verilmedikçe `channels.irc.enabled=false` ayarlayın.
- `channels.irc.dmPolicy` varsayılan olarak `"pairing"` değerindedir.
- `channels.irc.groupPolicy` varsayılan olarak `"allowlist"` değerindedir.
- `groupPolicy="allowlist"` ile izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Bilerek düz metin aktarımı kabul etmiyorsanız TLS (`channels.irc.tls=true`) kullanın.

## Erişim denetimi

IRC kanalları için iki ayrı “kapı” vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen mesajları hiç kabul edip etmeyeceği.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanalda botu kimin tetikleyebileceği.

Yapılandırma anahtarları:

- DM izin listesi (DM gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına denetimler (kanal + gönderen + bahsetme kuralları): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**yine de varsayılan olarak bahsetme kapısına tabidir**)

İzin listesi girdileri kararlı gönderen kimlikleri (`nick!user@host`) kullanmalıdır.
Yalın nick eşleştirmesi değiştirilebilir niteliktedir ve yalnızca `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Yaygın hata: `allowFrom` DM'ler içindir, kanallar için değil

Şuna benzer günlükler görürseniz:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bu, gönderenin **grup/kanal** mesajları için izinli olmadığı anlamına gelir. Şunlardan biriyle düzeltin:

- `channels.irc.groupAllowFrom` ayarlamak (tüm kanallar için genel), veya
- kanal başına gönderen izin listeleri ayarlamak: `channels.irc.groups["#channel"].allowFrom`

Örnek (`#tuirc-dev` içindeki herkesin botla konuşmasına izin ver):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Yanıt tetikleme (bahsetmeler)

Bir kanala izin verilmiş olsa (`groupPolicy` + `groups` üzerinden) ve gönderen izinli olsa bile OpenClaw, grup bağlamlarında varsayılan olarak **bahsetme kapısı** uygular.

Bu, mesaj botla eşleşen bir bahsetme deseni içermediği sürece `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetme gerektirmeden** yanıt vermesini sağlamak için o kanal için bahsetme kapısını devre dışı bırakın:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Veya **tüm** IRC kanallarına izin vermek (kanal başına izin listesi olmadan) ve yine de bahsetme olmadan yanıtlamak için:

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

Herkese açık bir kanalda `allowFrom: ["*"]` izni verirseniz herkes botu istemleyebilir.
Riski azaltmak için o kanalın araçlarını kısıtlayın.

### Kanaldaki herkes için aynı araçlar

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### Gönderen başına farklı araçlar (sahip daha fazla yetki alır)

`"*"` için daha sıkı, nick'iniz için daha gevşek bir ilke uygulamak üzere `toolsBySender` kullanın:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- `toolsBySender` anahtarları IRC gönderen kimliği değerleri için `id:` kullanmalıdır:
  Daha güçlü eşleştirme için `id:eigen` veya `id:eigen!~eigen@174.127.248.171`.
- Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.
- İlk eşleşen gönderen ilkesi kazanır; `"*"` joker yedektir.

Grup erişimi ile bahsetme kapısı hakkında daha fazla bilgi (ve nasıl etkileştikleri) için bkz.: [/channels/groups](/tr/channels/groups).

## NickServ

Bağlandıktan sonra NickServ ile kimlik doğrulamak için:

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

Bağlanırken isteğe bağlı tek seferlik kayıt:

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

Yinelenen REGISTER denemelerini önlemek için nick kaydedildikten sonra `register` değerini devre dışı bırakın.

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

`IRC_HOST`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sorun giderme

- Bot bağlanıyor ama kanallarda hiç yanıt vermiyorsa `channels.irc.groups` ayarını **ve** bahsetme kapısının mesajları düşürüp düşürmediğini (`missing-mention`) doğrulayın. Ping olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Oturum açma başarısız olursa nick kullanılabilirliğini ve sunucu parolasını doğrulayın.
- Özel bir ağda TLS başarısız olursa host/port ve sertifika kurulumunu doğrulayın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
