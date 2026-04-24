---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal yönlendirme
x-i18n:
    generated_at: "2026-04-24T08:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanallar ve yönlendirme

OpenClaw, yanıtları **mesajın geldiği kanala geri** yönlendirir. Model bir kanal seçmez; yönlendirme belirlenimlidir ve ana makine yapılandırması tarafından kontrol edilir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` ve ayrıca Plugin kanalları. `webchat`, dahili WebChat UI kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (desteklendiğinde).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, bir giden yol `accountId` belirtmediğinde hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan ayarlayın (`defaultAccount` veya `accounts.default`). Bu ayarlanmazsa, yedek yönlendirme ilk normalize edilmiş hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu (“beyin”).
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı kontrol etmek için kullanılan kova anahtarı.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak ajanın **ana** oturumunda birleştirilir:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Doğrudan mesaj konuşma geçmişi ana oturumla paylaşıldığında bile, dış DM'ler için sandbox ve araç politikası türetilmiş, hesap başına bir doğrudan sohbet çalışma zamanı anahtarı kullanır; böylece kanaldan gelen mesajlar yerel ana oturum çalıştırmaları gibi ele alınmaz.

Gruplar ve kanallar, kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

İş parçacıkları:

- Slack/Discord iş parçacıkları temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları grup anahtarına `:topic:<topicId>` gömer.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir ana oturumu paylaşabilir. Oturumun `lastRoute` değerinin sahip olmayan DM'ler tarafından üzerine yazılmasını önlemek için OpenClaw, aşağıdaki koşulların tümü doğru olduğunda `allowFrom` içinden sabitlenmiş bir sahip çıkarır:

- `allowFrom` tam olarak bir adet joker karakter içermeyen girişe sahiptir.
- Bu giriş, o kanal için somut bir gönderici kimliğine normalize edilebilir.
- Gelen DM göndericisi, bu sabitlenmiş sahip ile eşleşmez.

Bu eşleşmeme durumunda OpenClaw yine de gelen oturum meta verilerini kaydeder, ancak ana oturum `lastRoute` değerini güncellemeyi atlar.

## Yönlendirme kuralları (bir ajan nasıl seçilir)

Yönlendirme, her gelen mesaj için **bir ajan** seçer:

1. **Tam eş düzeyi eşleşmesi** (`peer.kind` + `peer.id` ile `bindings`).
2. **Üst eş düzeyi eşleşmesi** (iş parçacığı devralma).
3. **Sunucu + roller eşleşmesi** (Discord) `guildId` + `roles` aracılığıyla.
4. **Sunucu eşleşmesi** (Discord) `guildId` aracılığıyla.
5. **Takım eşleşmesi** (Slack) `teamId` aracılığıyla.
6. **Hesap eşleşmesi** (kanalda `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan ajan** (`agents.list[].default`, aksi halde listedeki ilk giriş, yedek olarak `main`).

Bir binding birden fazla eşleşme alanı içerdiğinde (`peer`, `guildId`, `teamId`, `roles`), bu binding'in uygulanması için **sağlanan tüm alanlar eşleşmelidir**.

Eşleşen ajan, hangi çalışma alanı ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden çok ajan çalıştırma)

Yayın grupları, OpenClaw'ın normalde yanıt vereceği durumlarda (örneğin: WhatsApp gruplarında, bahsetme/etkinleştirme geçidinden sonra) aynı eş düzeyi için **birden çok ajan** çalıştırmanıza olanak tanır.

Yapılandırma:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Bkz.: [Yayın Grupları](/tr/channels/broadcast-groups).

## Yapılandırma genel bakışı

- `agents.list`: adlandırılmış ajan tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eş düzeyleri ajanlara eşler.

Örnek:

```json5
{
  agents: {
    list: [{ id: "support", name: "Destek", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Oturum depolama

Oturum depoları durum dizini altında bulunur (varsayılan `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transkriptleri de deponun yanında bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlamasıyla geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi ayrıca varsayılan `agents/` kökü altındaki ve şablonlanmış `session.store` kökleri altındaki disk tabanlı ajan depolarını da tarar. Keşfedilen depolar bu çözümlenmiş ajan kökü içinde kalmalı ve normal bir `sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışı yollar yok sayılır.

## WebChat davranışı

WebChat, **seçili ajana** bağlanır ve varsayılan olarak ajanın ana oturumunu kullanır. Bu nedenle WebChat, o ajan için kanallar arası bağlamı tek bir yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Mevcut olduğunda `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` sonuna `[... yanıtlanıyor]` bloğu olarak eklenir.

Bu, kanallar arasında tutarlıdır.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Eşleştirme](/tr/channels/pairing)
