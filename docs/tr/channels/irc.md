---
read_when:
    - OpenClaw'ı IRC kanallarına veya DM'lere bağlamak istiyorsanız
    - IRC izin listelerini, grup ilkesini veya bahsetme geçitlemesini yapılandırıyorsanız
summary: IRC eklentisi kurulumu, erişim kontrolleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-04-05T13:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

OpenClaw'ı klasik kanallarda (`#room`) ve doğrudan mesajlarda kullanmak istediğinizde IRC kullanın.
IRC bir uzantı eklentisi olarak gelir, ancak ana yapılandırmada `channels.irc` altında yapılandırılır.

## Hızlı başlangıç

1. `~/.openclaw/openclaw.json` içinde IRC yapılandırmasını etkinleştirin.
2. En azından şunları ayarlayın:

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

Bot koordinasyonu için özel bir IRC sunucusu tercih edin. Bilerek genel bir IRC ağı kullanıyorsanız yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya sürü arka kanal trafiği için öngörülebilir genel kanallardan kaçının.

3. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

## Varsayılan güvenlik ayarları

- `channels.irc.dmPolicy` varsayılan olarak `"pairing"` değerini kullanır.
- `channels.irc.groupPolicy` varsayılan olarak `"allowlist"` değerini kullanır.
- `groupPolicy="allowlist"` olduğunda izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Bilerek düz metin taşımasını kabul etmiyorsanız TLS kullanın (`channels.irc.tls=true`).

## Erişim denetimi

IRC kanalları için iki ayrı “geçit” vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen mesajları hiç kabul edip etmemesi.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanal içinde botu kimin tetiklemeye yetkili olduğu.

Yapılandırma anahtarları:

- DM izin listesi (DM gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına denetimler (kanal + gönderen + bahsetme kuralları): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**varsayılan olarak yine de bahsetme geçitlemesi uygulanır**)

İzin listesi girdileri kararlı gönderen kimliklerini kullanmalıdır (`nick!user@host`).
Yalın takma ad eşleştirmesi değiştirilebilir olduğundan yalnızca `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Sık karşılaşılan hata: `allowFrom` DM'ler içindir, kanallar için değil

Şu gibi günlükler görüyorsanız:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bu, gönderenin **grup/kanal** mesajları için izinli olmadığı anlamına gelir. Bunu şu yollarla düzeltin:

- `channels.irc.groupAllowFrom` ayarlayarak (tüm kanallar için genel), veya
- kanal başına gönderen izin listeleri ayarlayarak: `channels.irc.groups["#channel"].allowFrom`

Örnek (`#tuirc-dev` içindeki herkesin botla konuşmasına izin vermek için):

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

Bir kanala izin verilmiş olsa bile (`groupPolicy` + `groups` aracılığıyla) ve gönderen izinli olsa bile, OpenClaw grup bağlamlarında varsayılan olarak **bahsetme geçitlemesi** kullanır.

Bu, mesaj botla eşleşen bir bahsetme kalıbı içermiyorsa `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetme gerektirmeden** yanıt vermesini sağlamak için, o kanal için bahsetme geçitlemesini devre dışı bırakın:

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

Veya **tüm** IRC kanallarına izin verip (kanal başına izin listesi olmadan) yine de bahsetme olmadan yanıt vermesini istiyorsanız:

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

## Güvenlik notu (genel kanallar için önerilir)

Genel bir kanalda `allowFrom: ["*"]` ayarına izin verirseniz herkes botu yönlendirebilir.
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

`"*"` için daha sıkı, kendi takma adınız için daha gevşek bir ilke uygulamak üzere `toolsBySender` kullanın:

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
  daha güçlü eşleştirme için `id:eigen` veya `id:eigen!~eigen@174.127.248.171`.
- Eski, öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.
- İlk eşleşen gönderen ilkesi kazanır; `"*"` joker geri dönüşüdür.

Grup erişimi ile bahsetme geçitlemesi hakkında daha fazla bilgi için (ve bunların nasıl etkileştiğini öğrenmek için) bkz.: [/channels/groups](/channels/groups).

## NickServ

Bağlantıdan sonra NickServ ile kimlik doğrulamak için:

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

Bağlantı sırasında isteğe bağlı tek seferlik kayıt:

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

Takma ad kaydedildikten sonra tekrarlanan REGISTER girişimlerini önlemek için `register` ayarını devre dışı bırakın.

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

## Sorun giderme

- Bot bağlanıyor ama kanallarda hiç yanıt vermiyorsa `channels.irc.groups` değerini **ve** bahsetme geçitlemesinin mesajları düşürüp düşürmediğini (`missing-mention`) doğrulayın. Ping olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Giriş başarısız olursa takma adın kullanılabilirliğini ve sunucu parolasını doğrulayın.
- Özel bir ağda TLS başarısız olursa ana makine/bağlantı noktası ve sertifika kurulumunu doğrulayın.

## İlgili

- [Channels Overview](/channels) — desteklenen tüm kanallar
- [Pairing](/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Groups](/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Channel Routing](/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Security](/gateway/security) — erişim modeli ve sertleştirme
