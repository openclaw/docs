---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirirken
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal Yönlendirme
x-i18n:
    generated_at: "2026-04-05T13:42:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanallar ve yönlendirme

OpenClaw, yanıtları **bir mesajın geldiği kanala geri** yönlendirir. Model bir kanal seçmez; yönlendirme deterministiktir ve ana makine yapılandırması tarafından kontrol edilir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` ve ayrıca uzantı kanalları. `webchat`, dahili WebChat UI kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (destekleniyorsa).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, giden bir yol `accountId` belirtmediğinde hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan ayarlayın (`defaultAccount` veya `accounts.default`). Bu yapılmazsa, yedek yönlendirme ilk normalize edilmiş hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu (“beyin”).
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı kontrol etmek için kullanılan kova anahtarı.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar, ajanın **ana** oturumunda birleştirilir:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Gruplar ve kanallar, kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

İş parçacıkları:

- Slack/Discord iş parçacıkları, temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları, grup anahtarına `:topic:<topicId>` gömer.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir ana oturumu paylaşabilir. Oturumun `lastRoute` değerinin sahip olmayan DM'ler tarafından üzerine yazılmasını önlemek için OpenClaw, aşağıdaki koşulların tümü doğru olduğunda `allowFrom` içinden sabitlenmiş bir sahip çıkarır:

- `allowFrom` tam olarak bir adet joker olmayan girdi içerir.
- Bu girdi, o kanal için somut bir gönderen kimliğine normalize edilebilir.
- Gelen DM göndereni, bu sabitlenmiş sahip ile eşleşmez.

Bu eşleşmeme durumunda OpenClaw yine de gelen oturum meta verilerini kaydeder, ancak ana oturum `lastRoute` değerini güncellemeyi atlar.

## Yönlendirme kuralları (bir ajan nasıl seçilir)

Yönlendirme, her gelen mesaj için **bir ajan** seçer:

1. **Tam eşleşen eş** (`peer.kind` + `peer.id` içeren `bindings`).
2. **Üst eş eşleşmesi** (iş parçacığı kalıtımı).
3. **Sunucu + roller eşleşmesi** (Discord) `guildId` + `roles` üzerinden.
4. **Sunucu eşleşmesi** (Discord) `guildId` üzerinden.
5. **Takım eşleşmesi** (Slack) `teamId` üzerinden.
6. **Hesap eşleşmesi** (kanaldaki `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan ajan** (`agents.list[].default`, aksi halde listedeki ilk girdi, son çare olarak `main`).

Bir binding birden fazla eşleşme alanı içerdiğinde (`peer`, `guildId`, `teamId`, `roles`), o binding'in uygulanabilmesi için **sağlanan tüm alanların eşleşmesi gerekir**.

Eşleşen ajan, hangi çalışma alanı ve oturum deposunun kullanılacağını belirler.

## Broadcast grupları (birden fazla ajan çalıştırma)

Broadcast grupları, OpenClaw'ın normalde yanıt vereceği durumlarda aynı eş için **birden fazla ajan** çalıştırmanıza olanak tanır (örneğin: WhatsApp gruplarında, mention/activation geçitlemesinden sonra).

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

Bkz.: [Broadcast Grupları](/channels/broadcast-groups).

## Yapılandırmaya genel bakış

- `agents.list`: adlandırılmış ajan tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eşleri ajanlara eşler.

Örnek:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
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
- JSONL transkriptleri depo ile aynı yerde bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlaması ile geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi ayrıca varsayılan `agents/` kökü altındaki ve şablonlanmış `session.store` kökleri altındaki disk destekli ajan depolarını da tarar. Keşfedilen depolar, çözümlenmiş ajan kökünün içinde kalmalı ve normal bir `sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışı yollar yok sayılır.

## WebChat davranışı

WebChat, **seçili ajana** bağlanır ve varsayılan olarak ajanın ana oturumunu kullanır. Bu nedenle WebChat, o ajan için kanallar arası bağlamı tek bir yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Kullanılabiliyorsa `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` sonuna bir `[Replying to ...]` bloğu olarak eklenir.

Bu davranış kanallar arasında tutarlıdır.
