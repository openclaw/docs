---
read_when:
    - OpenClaw içinde OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
summary: OpenClaw içinde OpenAI'ı API anahtarları veya Codex aboneliği ile kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T14:06:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI, GPT modelleri için geliştirici API'leri sağlar. Codex, abonelik
erişimi için **ChatGPT oturum açma** veya kullanıma dayalı erişim için **API anahtarı**
oturum açmayı destekler. Codex cloud, ChatGPT oturum açmayı gerektirir.
OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımını açıkça destekler.

## Varsayılan etkileşim stili

OpenClaw, hem
`openai/*` hem de `openai-codex/*` çalıştırmaları için varsayılan olarak OpenAI'ya özgü küçük bir istem kaplaması ekler. Bu kaplama, temel OpenClaw sistem
isteminin yerini almadan asistanı sıcak, işbirlikçi, özlü ve doğrudan tutar.

Yapılandırma anahtarı:

`plugins.entries.openai.config.personalityOverlay`

İzin verilen değerler:

- `"friendly"`: varsayılan; OpenAI'ya özgü kaplamayı etkinleştirir.
- `"off"`: kaplamayı devre dışı bırakır ve yalnızca temel OpenClaw istemini kullanır.

Kapsam:

- `openai/*` modelleri için geçerlidir.
- `openai-codex/*` modelleri için geçerlidir.
- Diğer sağlayıcıları etkilemez.

Bu davranış varsayılan olarak etkindir:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### OpenAI istem kaplamasını devre dışı bırakın

Değiştirilmemiş temel OpenClaw istemini tercih ediyorsanız, kaplamayı kapatın:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Bunu yapılandırma CLI ile doğrudan da ayarlayabilirsiniz:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Seçenek A: OpenAI API anahtarı (OpenAI Platform)

**En iyisi:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.
API anahtarınızı OpenAI panosundan alın.

### CLI kurulumu

```bash
openclaw onboard --auth-choice openai-api-key
# veya etkileşimsiz
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Yapılandırma örneği

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI'ın güncel API model belgelerinde, doğrudan
OpenAI API kullanımı için `gpt-5.4` ve `gpt-5.4-pro` listelenir. OpenClaw her ikisini de `openai/*` Responses yolu üzerinden iletir.
OpenClaw, eski `openai/gpt-5.3-codex-spark` satırını kasıtlı olarak gizler,
çünkü doğrudan OpenAI API çağrıları canlı trafikte bunu reddeder.

OpenClaw, doğrudan OpenAI
API yolunda `openai/gpt-5.3-codex-spark` sunmaz. `pi-ai` bu model için yerleşik bir satır göndermeye devam eder, ancak canlı OpenAI API
istekleri şu anda bunu reddeder. Spark, OpenClaw içinde yalnızca Codex olarak ele alınır.

## Seçenek B: OpenAI Code (Codex) aboneliği

**En iyisi:** API anahtarı yerine ChatGPT/Codex abonelik erişimini kullanmak.
Codex cloud, ChatGPT oturum açmayı gerektirirken Codex CLI, ChatGPT veya API anahtarı oturum açmayı destekler.

### CLI kurulumu (Codex OAuth)

```bash
# Sihirbazda Codex OAuth çalıştırın
openclaw onboard --auth-choice openai-codex

# Veya OAuth'u doğrudan çalıştırın
openclaw models auth login --provider openai-codex
```

### Yapılandırma örneği (Codex aboneliği)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI'ın güncel Codex belgelerinde `gpt-5.4`, mevcut Codex modeli olarak listelenir. OpenClaw
bunu ChatGPT/Codex OAuth kullanımı için `openai-codex/gpt-5.4` olarak eşler.

Onboarding mevcut bir Codex CLI oturum açmasını yeniden kullanırsa, bu kimlik bilgileri
Codex CLI tarafından yönetilmeye devam eder. Süresi dolduğunda OpenClaw önce harici Codex kaynağını yeniden okur
ve sağlayıcı bunu yenileyebiliyorsa, yenilenen kimlik bilgisini
ayrı bir yalnızca OpenClaw kopyasının sahipliğini almak yerine yeniden Codex depolamasına yazar.

Codex hesabınız Codex Spark için yetkiliyse, OpenClaw şunları da destekler:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw, Codex Spark'ı yalnızca Codex olarak ele alır. Doğrudan bir
`openai/gpt-5.3-codex-spark` API anahtarı yolu sunmaz.

OpenClaw, `pi-ai`
onu keşfettiğinde `openai-codex/gpt-5.3-codex-spark` değerini de korur. Bunu yetkiye bağlı ve deneysel olarak değerlendirin: Codex Spark,
GPT-5.4 `/fast` değerinden ayrıdır ve kullanılabilirliği oturum açmış Codex /
ChatGPT hesabına bağlıdır.

### Codex bağlam penceresi sınırı

OpenClaw, Codex model meta verilerini ve çalışma zamanı bağlam sınırını ayrı
değerler olarak ele alır.

`openai-codex/gpt-5.4` için:

- yerel `contextWindow`: `1050000`
- varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

Bu, model meta verilerini doğru tutarken uygulamada daha iyi gecikme ve kalite özelliklerine sahip olan daha küçük varsayılan çalışma zamanı
penceresini korur.

Farklı bir etkin sınır istiyorsanız, `models.providers.<provider>.models[].contextTokens` ayarlayın:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Yerel model
meta verilerini tanımlarken veya geçersiz kılarken yalnızca `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak istediğinizde `contextTokens` kullanın.

### Varsayılan aktarım

OpenClaw, model akışı için `pi-ai` kullanır. Hem `openai/*` hem de
`openai-codex/*` için varsayılan aktarım `"auto"` değeridir (önce WebSocket, sonra SSE
yedekleme).

`"auto"` modunda OpenClaw, SSE'ye geri dönmeden önce
erken, yeniden denenebilir bir WebSocket hatasını da bir kez yeniden dener. Zorunlu `"websocket"` modu ise aktarım
hatalarını yedekleme arkasına gizlemek yerine doğrudan gösterir.

`"auto"` modunda bir bağlantı veya erken dönüş WebSocket hatasından sonra, OpenClaw
o oturumun WebSocket yolunu yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve
taşıyıcılar arasında gidip gelmek yerine
izleyen dönüşleri bekleme süresi boyunca SSE üzerinden gönderir.

Yerel OpenAI ailesi uç noktaları için (`openai/*`, `openai-codex/*` ve Azure
OpenAI Responses), OpenClaw ayrıca kararlı oturum ve dönüş kimliği durumunu
isteklere ekler; böylece yeniden denemeler, yeniden bağlantılar ve SSE yedekleme aynı
konuşma kimliğiyle hizalı kalır. Yerel OpenAI ailesi rotalarında buna kararlı
oturum/dönüş istek kimliği üstbilgileri ve eşleşen aktarım meta verileri dahildir.

OpenClaw ayrıca OpenAI kullanım sayaçlarını, oturum/durum yüzeylerine ulaşmadan önce aktarım çeşitleri arasında normalize eder. Yerel OpenAI/Codex Responses trafiği
kullanımı ya `input_tokens` / `output_tokens` ya da
`prompt_tokens` / `completion_tokens` olarak bildirebilir; OpenClaw bunları `/status`, `/usage` ve oturum günlükleri için aynı girdi
ve çıktı sayaçları olarak ele alır. Yerel
WebSocket trafiği `total_tokens` değerini atladığında (veya `0` bildirdiğinde), OpenClaw
normalize edilmiş girdi + çıktı toplamına geri döner; böylece oturum/durum görüntüleri dolu kalır.

`agents.defaults.models.<provider/model>.params.transport` ayarlayabilirsiniz:

- `"sse"`: SSE'yi zorla
- `"websocket"`: WebSocket'i zorla
- `"auto"`: WebSocket'i dene, sonra SSE'ye geri dön

`openai/*` için (Responses API), OpenClaw ayrıca
WebSocket aktarımı kullanıldığında varsayılan olarak WebSocket ısınmasını etkinleştirir (`openaiWsWarmup: true`).

İlgili OpenAI belgeleri:

- [WebSocket ile Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
- [Akış API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket ısınması

OpenAI belgeleri ısınmayı isteğe bağlı olarak açıklar. OpenClaw,
WebSocket aktarımı kullanılırken ilk dönüş gecikmesini azaltmak için bunu varsayılan olarak
`openai/*` için etkinleştirir.

### Isınmayı devre dışı bırakın

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Isınmayı açıkça etkinleştirin

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI ve Codex öncelikli işleme

OpenAI'ın API'si, `service_tier=priority` aracılığıyla öncelikli işleme sunar. OpenClaw içinde,
bu alanı yerel OpenAI/Codex Responses uç noktalarına geçirmek için `agents.defaults.models["<provider>/<model>"].params.serviceTier`
ayarlayın.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Desteklenen değerler `auto`, `default`, `flex` ve `priority` şeklindedir.

OpenClaw, `params.serviceTier` değerini hem doğrudan `openai/*` Responses
isteklerine hem de bu modeller yerel OpenAI/Codex uç noktalarını işaret ettiğinde `openai-codex/*` Codex Responses isteklerine iletir.

Önemli davranış:

- doğrudan `openai/*`, `api.openai.com` hedeflemelidir
- `openai-codex/*`, `chatgpt.com/backend-api` hedeflemelidir
- sağlayıcılardan birini başka bir temel URL veya proxy üzerinden yönlendirirseniz, OpenClaw `service_tier` değerini olduğu gibi bırakır

### OpenAI hızlı modu

OpenClaw, hem `openai/*` hem de
`openai-codex/*` oturumları için paylaşılan bir hızlı mod anahtarı sunar:

- Sohbet/UI: `/fast status|on|off`
- Yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Hızlı mod etkinleştirildiğinde OpenClaw bunu OpenAI öncelikli işlemeye eşler:

- `api.openai.com` adresine yapılan doğrudan `openai/*` Responses çağrıları `service_tier = "priority"` gönderir
- `chatgpt.com/backend-api` adresine yapılan `openai-codex/*` Responses çağrıları da `service_tier = "priority"` gönderir
- mevcut yük `service_tier` değerleri korunur
- hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz

Örnek:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Oturum geçersiz kılmaları yapılandırmadan önceliklidir. Sessions UI içinde oturum geçersiz kılmasını temizlemek,
oturumu yapılandırılmış varsayılana döndürür.

### Yerel OpenAI ile OpenAI uyumlu rotalar karşılaştırması

OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını
genel OpenAI uyumlu `/v1` proxy'lerinden farklı şekilde ele alır:

- yerel `openai/*`, `openai-codex/*` ve Azure OpenAI rotaları,
  akıl yürütmeyi açıkça devre dışı bıraktığınızda `reasoning: { effort: "none" }` değerini olduğu gibi korur
- yerel OpenAI ailesi rotaları araç şemalarını varsayılan olarak katı moda alır
- gizli OpenClaw ilişkilendirme üstbilgileri (`originator`, `version` ve
  `User-Agent`) yalnızca doğrulanmış yerel OpenAI ana bilgisayarlarında
  (`api.openai.com`) ve yerel Codex ana bilgisayarlarında (`chatgpt.com/backend-api`) eklenir
- yerel OpenAI/Codex rotaları, `service_tier`, Responses `store`, OpenAI reasoning-uyumlu yükler ve
  istem önbelleği ipuçları gibi yalnızca OpenAI'a özgü istek şekillendirmesini korur
- proxy tarzı OpenAI uyumlu rotalar daha gevşek uyumluluk davranışını korur ve
  katı araç şemalarını, yalnızca yerel isteğe özgü şekillendirmeyi veya gizli
  OpenAI/Codex ilişkilendirme üstbilgilerini zorlamaz

Azure OpenAI, aktarım ve uyumluluk
davranışı açısından yerel yönlendirme grubunda kalır, ancak gizli OpenAI/Codex ilişkilendirme üstbilgilerini almaz.

Bu, mevcut yerel OpenAI Responses davranışını korurken, üçüncü taraf `/v1` arka uçlarına eski
OpenAI uyumlu ara katmanları zorla dayatmaz.

### OpenAI Responses sunucu taraflı sıkıştırma

Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerinde `baseUrl`
ve `api: "openai-responses"` kullanan `openai/*`), OpenClaw artık OpenAI sunucu taraflı
sıkıştırma yük ipuçlarını otomatik olarak etkinleştirir:

- `store: true` zorlar (`supportsStore: false` ayarlayan model uyumluluğu olmadıkça)
- `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler

Varsayılan olarak, `compact_threshold`, model `contextWindow` değerinin `%70`'idir (veya
kullanılamıyorsa `80000`).

### Sunucu taraflı sıkıştırmayı açıkça etkinleştirin

Bunu, uyumlu
Responses modellerinde (örneğin Azure OpenAI Responses) `context_management` eklemeyi zorlamak istediğinizde kullanın:

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Özel bir eşikle etkinleştirin

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Sunucu taraflı sıkıştırmayı devre dışı bırakın

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` yalnızca `context_management` eklemesini kontrol eder.
Doğrudan OpenAI Responses modelleri, uyumluluk
`supportsStore: false` ayarlamadıkça yine de `store: true` zorlar.

## Notlar

- Model başvuruları her zaman `provider/model` kullanır (bkz. [/concepts/models](/tr/concepts/models)).
- Kimlik doğrulama ayrıntıları + yeniden kullanım kuralları [/concepts/oauth](/tr/concepts/oauth) içinde yer alır.
