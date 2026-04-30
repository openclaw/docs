---
read_when:
    - Birlikte gelen memory-lancedb Plugin yapılandırmasını yapıyorsunuz
    - Otomatik geri çağırma veya otomatik yakalama özellikli, LanceDB destekli uzun süreli bellek istiyorsunuz
    - Ollama gibi yerel, OpenAI ile uyumlu gömme modelleri kullanıyorsunuz
sidebarTitle: Memory LanceDB
summary: Paketle gelen LanceDB bellek Plugin'ini, yerel Ollama uyumlu embedding'ler dahil olmak üzere yapılandırın
title: Bellek LanceDB
x-i18n:
    generated_at: "2026-04-30T09:35:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb`, uzun süreli belleği LanceDB içinde depolayan ve geri çağırma için embedding kullanan, paketle birlikte gelen bir bellek Plugin'idir. Model turundan önce ilgili anıları otomatik olarak geri çağırabilir ve bir yanıttan sonra önemli olguları yakalayabilir.

Bellek için yerel bir vektör veritabanı istediğinizde, OpenAI uyumlu bir embedding uç noktasına ihtiyaç duyduğunuzda veya bir bellek veritabanını varsayılan yerleşik bellek deposunun dışında tutmak istediğinizde kullanın.

<Note>
`memory-lancedb` bir etkin bellek Plugin'idir. `plugins.slots.memory = "memory-lancedb"` ile bellek yuvasını seçerek etkinleştirin. `memory-wiki` gibi yardımcı Plugin'ler onun yanında çalışabilir, ancak etkin bellek yuvasına yalnızca bir Plugin sahip olur.
</Note>

## Hızlı başlangıç

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın:

```bash
openclaw gateway restart
```

Ardından Plugin'in yüklendiğini doğrulayın:

```bash
openclaw plugins list
```

## Sağlayıcı destekli embedding'ler

`memory-lancedb`, `memory-core` ile aynı bellek embedding sağlayıcı bağdaştırıcılarını kullanabilir. Sağlayıcının yapılandırılmış kimlik doğrulama profilini, ortam değişkenini veya `models.providers.<provider>.apiKey` değerini kullanmak için `embedding.provider` ayarlayın ve `embedding.apiKey` değerini atlayın.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

Bu yol, embedding kimlik bilgilerini açığa çıkaran sağlayıcı kimlik doğrulama profilleriyle çalışır. Örneğin, Copilot profili/planı embedding'leri desteklediğinde GitHub Copilot kullanılabilir:

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) bir OpenAI Platform embedding kimlik bilgisi değildir. OpenAI embedding'leri için bir OpenAI API anahtarı kimlik doğrulama profili, `OPENAI_API_KEY` veya `models.providers.openai.apiKey` kullanın. Yalnızca OAuth kullanan kullanıcılar, GitHub Copilot veya Ollama gibi embedding özellikli başka bir sağlayıcı kullanabilir.

## Ollama embedding'leri

Ollama embedding'leri için paketle birlikte gelen Ollama embedding sağlayıcısını tercih edin. Yerel Ollama `/api/embed` uç noktasını kullanır ve [Ollama](/tr/providers/ollama) içinde belgelenen Ollama sağlayıcısıyla aynı kimlik doğrulama/temel URL kurallarını izler.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Standart olmayan embedding modelleri için `dimensions` ayarlayın. OpenClaw, `text-embedding-3-small` ve `text-embedding-3-large` için boyutları bilir; özel modellerde LanceDB'nin vektör sütununu oluşturabilmesi için bu değerin yapılandırmada verilmesi gerekir.

Küçük yerel embedding modellerinde, yerel sunucudan bağlam uzunluğu hataları görürseniz `recallMaxChars` değerini düşürün.

## OpenAI uyumlu sağlayıcılar

Bazı OpenAI uyumlu embedding sağlayıcıları `encoding_format` parametresini reddederken, bazıları bunu yok sayar ve her zaman `number[]` vektörleri döndürür. Bu nedenle `memory-lancedb`, embedding isteklerinde `encoding_format` değerini atlar ve hem kayan nokta dizisi yanıtlarını hem de base64 kodlanmış float32 yanıtlarını kabul eder.

Paketle birlikte gelen bir sağlayıcı bağdaştırıcısı olmayan ham bir OpenAI uyumlu embedding uç noktanız varsa `embedding.provider` değerini atlayın (veya `openai` olarak bırakın) ve `embedding.apiKey` ile `embedding.baseUrl` ayarlayın. Bu, doğrudan OpenAI uyumlu istemci yolunu korur.

Model boyutları yerleşik olmayan sağlayıcılar için `embedding.dimensions` ayarlayın. Örneğin, ZhiPu `embedding-3` `2048` boyut kullanır:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Geri çağırma ve yakalama sınırları

`memory-lancedb` iki ayrı metin sınırına sahiptir:

| Ayar              | Varsayılan | Aralık    | Şuna uygulanır                               |
| ----------------- | ---------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`     | 100-10000 | geri çağırma için embedding API'sine gönderilen metin |
| `captureMaxChars` | `500`      | 100-10000 | yakalama için uygun asistan mesajı uzunluğu   |

`recallMaxChars` otomatik geri çağırmayı, `memory_recall` aracını, `memory_forget` sorgu yolunu ve `openclaw ltm search` komutunu denetler. Otomatik geri çağırma, turdaki en son kullanıcı mesajını tercih eder ve yalnızca kullanıcı mesajı yoksa tam prompt'a geri döner. Bu, kanal meta verilerini ve büyük prompt bloklarını embedding isteğinin dışında tutar.

`captureMaxChars`, bir yanıtın otomatik yakalama için değerlendirilebilecek kadar kısa olup olmadığını denetler. Geri çağırma sorgusu embedding'lerini sınırlamaz.

## Komutlar

`memory-lancedb` etkin bellek Plugin'i olduğunda `ltm` CLI ad alanını kaydeder:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin ayrıca `openclaw memory` komutunu, doğrudan LanceDB tablosuna karşı çalışan vektör olmayan bir `query` alt komutuyla genişletir:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: virgülle ayrılmış sütun izin listesi (varsayılan olarak `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL tarzı WHERE yan tümcesi; 200 karakterle sınırlıdır ve alfasayısal karakterler, karşılaştırma işleçleri, tırnak işaretleri, parantezler ve küçük bir güvenli noktalama kümesiyle kısıtlanır.
- `--limit <n>`: pozitif tam sayı; varsayılan `10`.
- `--order-by <column>:<asc|desc>`: filtreden sonra uygulanan bellek içi sıralama; sıralama sütunu projeksiyona otomatik olarak dahil edilir.

Ajanlar ayrıca etkin bellek Plugin'inden LanceDB bellek araçlarını alır:

- LanceDB destekli geri çağırma için `memory_recall`
- önemli olguları, tercihleri, kararları ve varlıkları kaydetmek için `memory_store`
- eşleşen anıları kaldırmak için `memory_forget`

## Depolama

Varsayılan olarak LanceDB verileri `~/.openclaw/memory/lancedb` altında bulunur. Yolu `dbPath` ile geçersiz kılın:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions`, LanceDB depolama arka uçları için dize anahtar/değer çiftlerini kabul eder ve `${ENV_VAR}` genişletmesini destekler:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Çalışma zamanı bağımlılıkları

`memory-lancedb`, yerel `@lancedb/lancedb` paketine bağlıdır. Paketlenmiş OpenClaw kurulumları önce paketle birlikte gelen çalışma zamanı bağımlılığını denemeye çalışır ve paketle gelen içe aktarma kullanılamadığında OpenClaw durumu altında Plugin çalışma zamanı bağımlılığını onarabilir.

Daha eski bir kurulum, Plugin yükleme sırasında eksik `dist/package.json` veya eksik `@lancedb/lancedb` hatası günlüğe yazarsa OpenClaw'ı yükseltin ve Gateway'i yeniden başlatın.

Plugin, LanceDB'nin `darwin-x64` üzerinde kullanılamadığını günlüğe yazarsa o makinede varsayılan bellek arka ucunu kullanın, Gateway'i desteklenen bir platforma taşıyın veya `memory-lancedb` öğesini devre dışı bırakın.

## Sorun giderme

### Girdi uzunluğu bağlam uzunluğunu aşıyor

Bu genellikle embedding modelinin geri çağırma sorgusunu reddettiği anlamına gelir:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Daha düşük bir `recallMaxChars` ayarlayın, ardından Gateway'i yeniden başlatın:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Ollama için embedding sunucusuna Gateway ana makinesinden erişilebildiğini de doğrulayın:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Desteklenmeyen embedding modeli

`dimensions` olmadan yalnızca yerleşik OpenAI embedding boyutları bilinir. Yerel veya özel embedding modelleri için `embedding.dimensions` değerini o modelin bildirdiği vektör boyutuna ayarlayın.

### Plugin yükleniyor ancak hiç anı görünmüyor

`plugins.slots.memory` değerinin `memory-lancedb` öğesini işaret ettiğini kontrol edin, ardından şunu çalıştırın:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` devre dışıysa Plugin mevcut anıları geri çağırır ancak yenilerini otomatik olarak depolamaz. Otomatik yakalama istiyorsanız `memory_store` aracını kullanın veya `autoCapture` değerini etkinleştirin.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Etkin bellek](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Bellek Wiki'si](/tr/plugins/memory-wiki)
- [Ollama](/tr/providers/ollama)
