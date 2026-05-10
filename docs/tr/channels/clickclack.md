---
read_when:
    - OpenClaw'ı bir ClickClack çalışma alanına bağlama
    - ClickClack bot kimliklerini test etme
summary: ClickClack bot-token kanalı kurulumu ve hedef söz dizimi
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack, OpenClaw'ı birinci sınıf ClickClack bot token'ları aracılığıyla self-hosted bir ClickClack çalışma alanına bağlar.

Bir OpenClaw agent'ının ClickClack bot kullanıcısı olarak görünmesini istediğinizde bunu kullanın. ClickClack bağımsız hizmet botlarını ve kullanıcıya ait botları destekler; kullanıcıya ait botlar bir `owner_user_id` tutar ve yalnızca verdiğiniz token kapsamlarını alır.

## Hızlı kurulum

ClickClack içinde bir bot token'ı oluşturun:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Kullanıcıya ait bir bot için `--owner <user_id>` ekleyin.

OpenClaw'ı yapılandırın:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Ardından şunu çalıştırın:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Birden çok bot

Her hesap kendi ClickClack gerçek zamanlı bağlantısını açar ve kendi bot token'ını kullanır.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"`, kısa bot yanıtları için doğrudan `api.runtime.llm.complete` kullanır.
Bir hesap `agentId` ayarladığında, OpenClaw açık
`plugins.entries.clickclack.llm.allowAgentIdOverride` güven bitini gerektirir; böylece Plugin
bu bot agent'ı için tamamlamaları çalıştırabilir. Yalnızca varsayılan
agent rotasını kullanıyorsanız bunu kapalı tutun.

## Hedefler

- `channel:<name-or-id>` bir çalışma alanı kanalına gönderir. Düz hedefler varsayılan olarak `channel:` kullanır.
- `dm:<user_id>` bu kullanıcıyla doğrudan bir konuşma oluşturur veya mevcut olanı yeniden kullanır.
- `thread:<message_id>` mevcut bir thread içinde yanıt verir.

Örnekler:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## İzinler

ClickClack token kapsamları ClickClack API tarafından zorunlu kılınır.

- `bot:read`: çalışma alanı/kanal/mesaj/thread/DM/gerçek zamanlı/profil verilerini okuyun.
- `bot:write`: `bot:read` artı kanal mesajları, thread yanıtları, DM'ler ve yüklemeler.
- `bot:admin`: `bot:write` artı kanal oluşturma.

OpenClaw normal agent sohbeti için yalnızca `bot:write` gerektirir.

## Sorun giderme

- `ClickClack is not configured`: `channels.clickclack.token` veya `CLICKCLACK_BOT_TOKEN` ayarlayın.
- `workspace not found`: `workspace` değerini ClickClack tarafından döndürülen çalışma alanı kimliğine veya kısa adına ayarlayın.
- Gelen yanıt yok: token'ın gerçek zamanlı okuma erişimi olduğunu ve botun kendi mesajlarına yanıt vermediğini doğrulayın.
- Kanal gönderimleri başarısız oluyor: botun çalışma alanının üyesi olduğunu ve `bot:write` iznine sahip olduğunu doğrulayın.
