---
read_when:
    - OpenClaw'u bir ClickClack çalışma alanına bağlama
    - ClickClack bot kimliklerini test etme
summary: ClickClack bot tokeni kanalı kurulumu ve hedef söz dizimi
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T11:28:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack, birinci sınıf ClickClack bot belirteçleri aracılığıyla OpenClaw'u kendi barındırdığınız bir ClickClack çalışma alanına bağlar.

Bir OpenClaw aracısının ClickClack bot kullanıcısı olarak görünmesini istediğinizde bunu kullanın. ClickClack, bağımsız hizmet botlarını ve kullanıcıya ait botları destekler; kullanıcıya ait botlar bir `owner_user_id` tutar ve yalnızca verdiğiniz belirteç kapsamlarını alır.

## Hızlı kurulum

ClickClack sunucusunda bir bot belirteci oluşturun:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Kullanıcıya ait bir bot için `--owner <user_id>` ekleyin.

OpenClaw'u yapılandırın:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Ardından şunu çalıştırın:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Bir hesap yalnızca `baseUrl`, `token` ve `workspace` değerlerinin tümü ayarlandığında yapılandırılmış sayılır. `workspace`, çalışma alanı kimliğini (`wsp_...`), kısa adını veya adını kabul eder; Gateway bunu başlangıçta kimliğe çözümler.

### Hesap yapılandırma anahtarları

| Anahtar                 | Varsayılan          | Notlar                                                                                             |
| ----------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `baseUrl`               | yok (gerekli)       | ClickClack sunucu URL'si.                                                                          |
| `token`                 | yok (gerekli)       | Düz metin veya gizli değer başvurusu (`source: "env" \| "file" \| "exec"`).                        |
| `workspace`             | yok (gerekli)       | Çalışma alanı kimliği, kısa adı veya adı.                                                          |
| `replyMode`             | `"agent"`           | `"agent"` tam aracı işlem hattını çalıştırır; `"model"` kısa ve doğrudan model tamamlamaları yollar. |
| `defaultTo`             | `"channel:general"` | Giden bir yol hedef belirtmediğinde kullanılan hedef.                                              |
| `allowFrom`             | `["*"]`             | Gelen DM'ler ve kanal mesajları için kullanıcı kimliği izin listesi.                               |
| `botUserId`             | otomatik algılanır  | Başlangıçta bot belirteci kimliğinden çözümlenir.                                                   |
| `agentId`               | rota varsayılanı    | Bu hesabın gelen mesajlarını tek bir aracıya sabitler.                                              |
| `toolsAllow`            | yok                 | Bu hesaptan gelen aracı yanıtları için araç izin listesi.                                          |
| `model`, `systemPrompt` | yok                 | `replyMode: "model"` tamamlamalarında kullanılır.                                                   |
| `reconnectMs`           | `1500`              | Gerçek zamanlı yeniden bağlanma gecikmesi (100 ile 60000 arası).                                   |

`plugins.allow` boş olmayan kısıtlayıcı bir listeyse kanal kurulumunda ClickClack'i açıkça seçmek veya `openclaw plugins enable clickclack` komutunu çalıştırmak, bu listeye `clickclack` ekler. İlk katılım kurulumu da aynı açık seçim davranışını kullanır. Bu yollar `plugins.deny` ayarını veya genel bir `plugins.enabled: false` ayarını geçersiz kılmaz. Doğrudan `openclaw plugins install @openclaw/clickclack` komutu normal Plugin kurulum politikasını izler ve ClickClack'i mevcut bir izin listesine de kaydeder.

## Birden fazla bot

Her hesap kendi ClickClack gerçek zamanlı bağlantısını açar ve kendi bot belirtecini kullanır.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Yanıt modları

- `replyMode: "agent"` (varsayılan), gelen mesajları oturum kaydı ve araç politikası dâhil olmak üzere normal aracı işlem hattından geçirir.
- `replyMode: "model"`, aracı işlem hattını atlar ve kısa, doğrudan bot yanıtları için Plugin çalışma zamanının `llm.complete` işlevini kullanır (isteğe bağlı olarak `model` ve `systemPrompt` ile biçimlendirilir).

Model modu, tamamlamaları çözümlenmiş bot aracısı kimliğiyle çalıştırır ve bunun için açık `plugins.entries.clickclack.llm.allowAgentIdOverride: true` güven bitinin ayarlanması gerekir:

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
}
```

Yalnızca varsayılan `agent` yanıt modunu kullanıyorsanız güven bitini kapalı tutun; bu modda gerekli değildir.

Hizmetler arası ilişkilendirme kanıtı için `agent` modunu kullanın. Standart `msg_<ulid>` biçimindeki yetkili bir ClickClack mesaj kimliği için kanal, belirlenimci OpenClaw çalıştırma kimliği `clickclack:<message-id>` değerini türetir. Ardından her model çağrısı tanılamalarda `clickclack:<message-id>:model:<n>` olarak görünür; bu tur ClawRouter kullandığında aynı model çağrısı kimliği `X-Request-ID` olarak gönderilir. `model` modu normal aracı çalıştırma/oturum tanılamalarını atladığından bu kanıt yolu için uygun değildir.

Gerçek zamanlı bir olay doğrulanmış bir `payload.correlation_id` içerdiğinde kanal, bunu yetkili mesaj getirme isteğinde ve bunun sonucunda oluşan ClickClack yanıt isteklerinde `X-Correlation-ID` olarak taşır. Değerler ClickClack'in güvenli 128 karakterlik kümesini (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` ve `-`) kullanır; geçersiz değerler atlanır. Bu birleştirmeler yalnızca tanımlayıcıları içerir; hiçbir zaman mesaj gövdelerini, istemleri, tamamlamaları, kimlik bilgilerini veya araç çıktısını içermez.

## Aracı etkinliği satırları

Varsayılan olarak, bir aracı turu çalışırken ClickClack kanalı hiçbir şey göstermez; yalnızca son yanıt iletilir. Tur devam ederken kalıcı `agent_commentary` ve `agent_tool` mesaj satırlarını yayımlamak için bir hesapta `agentActivity: true` ayarını kullanın:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Gereksinimler ve davranış:

- **Varsayılan olarak kapalıdır.** Standart kurulumlara ve eski ClickClack sunucularına dokunulmaz.
- **`agent_activity:write` belirteç kapsamını gerektirir.** Bu kapsam `bot:write` kapsamından ayrıdır ve ondan devralınmaz; seçeneği etkinleştirmeden önce bot belirtecini `--scopes bot:write,agent_activity:write` ile oluşturun (veya kapsamı mevcut bir belirtece verin).
- **En iyi çabayla çalışmayı sürdürme.** Belirteçte `agent_activity:write` yoksa veya sunucu etkinlik yazma işlemlerini reddederse hatalar günlüğe kaydedilir ve son yanıt yine normal şekilde iletilir; etkinlik satırları görünmez.
- Satırlar tur başına (`turn_id`) gruplandırılır, mantıksal her adım tek satır olacak şekilde birleştirilir ve araç satırları Discord/Slack/Telegram ile aynı ilerleme biçimlendirmesini kullanır (araç adı ve komut ayrıntısı).
- **Atıf meta verileri.** Aracı tarafından yazılan gönderiler (etkinlik satırları ve son yanıt), turda gerçekten kullanılan modelden çözümlenen `author_model` ve `author_thinking` alanlarını taşır (yedek modele geçildikten sonraki durum dâhil). Bu sütunları tanımlamayan sunucular bilinmeyen JSON alanlarını yok sayar; bunları kalıcılaştıran sunucular mesaj başına "bu satırı hangi model, hangi düşünme düzeyinde söyledi" sorusunu yanıtlayabilir.

## Hedefler

- `channel:<name-or-id>`, bir çalışma alanı kanalına gönderir. Öneksiz hedefler varsayılan olarak `channel:` kullanır.
- `dm:<user_id>`, bu kullanıcıyla doğrudan bir görüşme oluşturur veya mevcut görüşmeyi yeniden kullanır.
- `thread:<message_id>`, belirtilen mesajın kök olduğu ileti dizisinde yanıt verir.

Açık giden hedefler ayrıca `clickclack:` veya `cc:` sağlayıcı önekini taşıyabilir.

Örnekler:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## İzinler

ClickClack belirteç kapsamları ClickClack API'si tarafından uygulanır.

- `bot:read`: çalışma alanı/kanal/mesaj/ileti dizisi/DM/gerçek zamanlı/profil verilerini okur.
- `bot:write`: `bot:read` kapsamına ek olarak kanal mesajları, ileti dizisi yanıtları, DM'ler ve yüklemeler sağlar.
- `bot:admin`: `bot:write` kapsamına ek olarak kanal oluşturma yetkisi sağlar.
- `agent_activity:write`: kalıcı aracı etkinliği satırları (`agent_commentary` / `agent_tool`). `bot:write` veya `bot:admin` tarafından devralınmaz; yalnızca `agentActivity: true` ayarlandığında gereklidir.

OpenClaw'un normal aracı sohbeti için yalnızca `bot:write` kapsamına ihtiyacı vardır. [Aracı etkinliği satırlarını](#agent-activity-rows) etkinleştirirken `agent_activity:write` ekleyin.

## Sorun giderme

- `ClickClack is not configured for account "<id>"`: bu hesap için `baseUrl`, `token` (örneğin `CLICKCLACK_BOT_TOKEN` aracılığıyla) ve `workspace` değerlerini ayarlayın.
- `ClickClack workspace not found: <value>`: `workspace` değerini ClickClack tarafından döndürülen çalışma alanı kimliği, kısa adı veya adı olarak ayarlayın.
- Gelen yanıt yoksa: belirtecin gerçek zamanlı okuma erişimine sahip olduğunu doğrulayın ve botun kendi mesajlarını ve diğer botlardan gelen mesajları yok saydığını unutmayın.
- Kanala gönderimler başarısız oluyorsa: botun çalışma alanının üyesi olduğunu ve `bot:write` kapsamına sahip olduğunu doğrulayın.
