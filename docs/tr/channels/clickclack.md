---
read_when:
    - OpenClaw’ı bir ClickClack çalışma alanına bağlama
    - ClickClack bot kimliklerini test etme
summary: ClickClack bot-token kanal kurulumu ve hedef sözdizimi
title: ClickClack
x-i18n:
    generated_at: "2026-06-28T00:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack, OpenClaw'ı birinci sınıf ClickClack bot token'ları aracılığıyla kendi barındırdığınız bir ClickClack çalışma alanına bağlar.

Bir OpenClaw ajanının ClickClack bot kullanıcısı olarak görünmesini istediğinizde bunu kullanın. ClickClack bağımsız hizmet botlarını ve kullanıcıya ait botları destekler; kullanıcıya ait botlar bir `owner_user_id` tutar ve yalnızca verdiğiniz token kapsamlarını alır.

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

`plugins.allow` boş olmayan kısıtlayıcı bir listeyse, kanal kurulumunda ClickClack'i açıkça seçmek veya `openclaw plugins enable clickclack` çalıştırmak bu listeye `clickclack` ekler. Onboarding kurulumu aynı açık seçim davranışını kullanır. Bu yollar `plugins.deny` ayarını veya genel `plugins.enabled: false` ayarını geçersiz kılmaz. Doğrudan `openclaw plugins install @openclaw/clickclack` normal Plugin kurulum politikasını izler ve ClickClack'i mevcut bir izin listesine de kaydeder.

## Birden fazla bot

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
Bir hesap `agentId` ayarladığında OpenClaw, Plugin'in o bot ajanı için tamamlama çalıştırabilmesi amacıyla açık `plugins.entries.clickclack.llm.allowAgentIdOverride` güven bitini gerektirir. Yalnızca varsayılan ajan rotasını kullanıyorsanız bunu kapalı tutun.

## Hedefler

- `channel:<name-or-id>` bir çalışma alanı kanalına gönderir. Çıplak hedefler varsayılan olarak `channel:` olur.
- `dm:<user_id>` o kullanıcıyla doğrudan bir konuşma oluşturur veya mevcut olanı yeniden kullanır.
- `thread:<message_id>` mevcut bir iş parçacığında yanıtlar.

Örnekler:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## İzinler

ClickClack token kapsamları ClickClack API tarafından uygulanır.

- `bot:read`: çalışma alanı/kanal/mesaj/iş parçacığı/DM/gerçek zamanlı/profil verilerini okur.
- `bot:write`: `bot:read` artı kanal mesajları, iş parçacığı yanıtları, DM'ler ve yüklemeler.
- `bot:admin`: `bot:write` artı kanal oluşturma.

OpenClaw normal ajan sohbeti için yalnızca `bot:write` gerektirir.

## Sorun giderme

- `ClickClack is not configured`: `channels.clickclack.token` veya `CLICKCLACK_BOT_TOKEN` ayarlayın.
- `workspace not found`: `workspace` değerini ClickClack tarafından döndürülen çalışma alanı kimliğine veya slug'ına ayarlayın.
- Gelen yanıt yok: token'ın gerçek zamanlı okuma erişimine sahip olduğunu ve botun kendi mesajlarına yanıt vermediğini doğrulayın.
- Kanal gönderimleri başarısız oluyor: botun çalışma alanının üyesi olduğunu ve `bot:write` iznine sahip olduğunu doğrulayın.
