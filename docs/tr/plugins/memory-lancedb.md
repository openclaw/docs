---
read_when:
    - memory-lancedb Plugin’ini yapılandırıyorsunuz
    - Otomatik hatırlama veya otomatik yakalama özellikli LanceDB destekli uzun süreli bellek istiyorsunuz
    - Ollama gibi yerel OpenAI uyumlu gömmeler kullanıyorsunuz
sidebarTitle: Memory LanceDB
summary: Yerel Ollama uyumlu gömmeler de dahil olmak üzere resmi harici LanceDB bellek Plugin'ini yapılandırın
title: Belleк LanceDB
x-i18n:
    generated_at: "2026-07-12T12:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb`, uzun süreli belleği vektör aramasıyla LanceDB'de depolayan
resmî bir harici plugindir. Bir model sırasından önce ilgili anıları otomatik
olarak hatırlayabilir ve bir yanıttan sonra önemli bilgileri otomatik olarak
yakalayabilir.

Yerel bir vektör veritabanı, OpenAI uyumlu bir gömme uç noktası veya varsayılan
yerleşik bellek arka ucunun dışında bir bellek deposu için kullanın.

## Kurulum

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin npm'de yayımlanır; OpenClaw çalışma zamanı imajına dahil değildir. Kurulum,
plugin girdisini yazar, etkinleştirir ve `plugins.slots.memory` değerini
`memory-lancedb` olarak değiştirir. Bellek yuvası o anda başka bir plugine aitse,
bu plugin bir uyarıyla devre dışı bırakılır.

<Note>
`memory-wiki` gibi tamamlayıcı pluginler `memory-lancedb` ile birlikte
çalışabilir, ancak etkin bellek yuvası aynı anda yalnızca bir plugine ait olabilir.
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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın ve
yüklendiğini doğrulayın:

```bash
openclaw gateway restart
openclaw plugins list
```

## Gömme yapılandırması

`embedding` zorunludur ve en az bir alan içermelidir. `provider` varsayılan olarak
`openai`, `model` ise `text-embedding-3-small` değerini kullanır.

| Alan                   | Tür             | Notlar                                                                    |
| ---------------------- | --------------- | ------------------------------------------------------------------------- |
| `embedding.provider`   | dize            | Bağdaştırıcı kimliği; ör. `openai`, `github-copilot`, `ollama`. Varsayılan: `openai`. |
| `embedding.model`      | dize            | Varsayılan: `text-embedding-3-small`.                                     |
| `embedding.apiKey`     | dize            | İsteğe bağlıdır; `${ENV_VAR}` genişletmesini destekler.                    |
| `embedding.baseUrl`    | dize            | İsteğe bağlıdır; `${ENV_VAR}` genişletmesini destekler.                    |
| `embedding.dimensions` | tamsayı (>=1)   | Yerleşik tabloda bulunmayan modeller için zorunludur (aşağıya bakın).      |

İki istek yolu vardır:

- **Sağlayıcı bağdaştırıcısı yolu** (varsayılan): `embedding.provider` değerini
  ayarlayın ve `embedding.apiKey`/`embedding.baseUrl` alanlarını atlayın. Plugin,
  sağlayıcının yapılandırılmış kimlik doğrulama profilini, ortam değişkenini veya
  `models.providers.<provider>.apiKey` değerini `memory-core` tarafından
  kullanılan bellek gömme bağdaştırıcıları üzerinden çözümler. Bu yol,
  `github-copilot`, `ollama` ve gömme desteğine sahip diğer tüm paketlenmiş
  sağlayıcılar içindir.
- **Doğrudan OpenAI uyumlu istemci yolu**: `embedding.provider` değerini
  ayarlamadan bırakın (veya `"openai"` olarak ayarlayın) ve
  `embedding.apiKey` ile `embedding.baseUrl` değerlerini belirleyin. Paketlenmiş
  bir sağlayıcı bağdaştırıcısı olmayan ham bir OpenAI uyumlu gömme uç noktası
  için bunu kullanın.

OpenAI Codex / ChatGPT OAuth, OpenAI Platform gömme kimlik bilgisi değildir.
OpenAI gömmeleri için bir OpenAI API anahtarı kimlik doğrulama profili,
`OPENAI_API_KEY` veya `models.providers.openai.apiKey` kullanın. Yalnızca OAuth
kullanan kullanıcılar `github-copilot` veya `ollama` gibi gömme özelliğine sahip
başka bir sağlayıcı seçmelidir.

```json5
{
  plugins: {
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

Bazı OpenAI uyumlu gömme uç noktaları `encoding_format` parametresini reddeder;
diğerleri bunu yok sayar ve her zaman `number[]` döndürür. `memory-lancedb`,
isteklerde `encoding_format` alanını atlar ve hem kayan noktalı sayı dizisi hem
de base64 kodlu float32 yanıtlarını kabul eder; böylece her iki yanıt biçimi de
yapılandırma gerektirmeden çalışır.

### Boyutlar

OpenClaw yalnızca `text-embedding-3-small` (1536) ve
`text-embedding-3-large` (3072) için yerleşik boyut bilgisine sahiptir. Diğer
tüm modellerde LanceDB'nin vektör sütununu oluşturabilmesi için açık bir
`embedding.dimensions` değeri gerekir; örneğin 2048 boyutlu ZhiPu
`embedding-3`:

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

## Ollama gömmeleri

Paketlenmiş Ollama sağlayıcı bağdaştırıcısı yolunu
(`embedding.provider: "ollama"`) kullanın. Bu yol, Ollama'nın yerel `/api/embed`
uç noktasını çağırır ve [Ollama](/tr/providers/ollama) sağlayıcısıyla aynı kimlik
doğrulama/temel URL kurallarını izler.

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

`mxbai-embed-large` yerleşik boyut tablosunda bulunmadığından `dimensions`
zorunludur. Küçük yerel gömme modellerinde, yerel sunucu bağlam uzunluğu hataları
döndürürse `recallMaxChars` değerini düşürün.

## Hatırlama ve yakalama sınırları

| Ayar              | Varsayılan | Aralık                       | Uygulandığı alan                                             |
| ----------------- | ---------- | ---------------------------- | ------------------------------------------------------------ |
| `recallMaxChars`  | `1000`     | 100-10000                    | Hatırlama için gömme API'sine gönderilen metin.              |
| `captureMaxChars` | `500`      | 100-10000                    | Otomatik yakalamaya uygun ileti uzunluğu.                     |
| `customTriggers`  | `[]`       | 0-50 öğe, her biri <=100 karakter | Otomatik yakalamanın bir iletiyi değerlendirmesini sağlayan değişmez ifadeler. |

`recallMaxChars`; `before_prompt_build` otomatik hatırlama sorgusunu,
`memory_recall` aracını, `memory_forget` sorgu yolunu ve `openclaw ltm
search` komutunu sınırlar. Otomatik hatırlama, sıradaki en son kullanıcı
iletisini gömer ve yalnızca kullanıcı iletisi yoksa tam isteme geri döner;
böylece kanal meta verileri ile büyük istem blokları gömme isteğinin dışında
tutulur.

`captureMaxChars`, sıranın `agent_end` olayındaki bir kullanıcı iletisinin
otomatik yakalama için değerlendirilebilecek kadar kısa olup olmadığını
belirler; hatırlama sorgularını etkilemez.

`customTriggers`, düzenli ifade kullanmadan değişmez otomatik yakalama ifadeleri
ekler. Yerleşik tetikleyiciler İngilizce, Çekçe, Çince, Japonca ve Korecedeki
yaygın bellek ifadelerini (`remember`, `prefer`, `记住`, `覚えて`, `기억해` ve
benzerlerini) kapsar.

Otomatik yakalama ayrıca zarf/taşıma meta verilerine, istem enjeksiyonu yüklerine
veya önceden eklenmiş `<relevant-memories>` bağlamına benzeyen metinleri reddeder
ve her ajan sırasında en fazla 3 anı yakalar.

## Komutlar

`memory-lancedb`, etkin bellek yuvasına yalnızca sahip olduğunda değil,
kurulu olduğu her durumda `ltm` CLI ad alanını kaydeder:

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query`, doğrudan LanceDB tablosunda vektör dışı bir sorgu çalıştırır:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Bayrak                            | Varsayılan                              | Notlar                                                                                                                                                   |
| --------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Virgülle ayrılmış sütun izin listesi.                                                                                                                     |
| `--filter <condition>`            | yok                                     | SQL tarzı WHERE yan tümcesi. En fazla 200 karakterdir; yalnızca alfasayısal karakterlere, `_-`, boşluklara ve `='"<>!.,()%*` karakterlerine izin verilir. |
| `--limit <n>`                     | `10`                                    | Pozitif tamsayı.                                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | yok                                     | Filtre çalıştıktan sonra bellekte sıralanır; sıralama sütunu izdüşüme otomatik olarak eklenir ve istenmemişse çıktıdan kaldırılır.                         |

Ajanlar, etkin bellek plugininden üç araç alır:

- `memory_recall`: depolanan anılar üzerinde vektör araması.
- `memory_store`: bir bilgiyi, tercihi, kararı veya varlığı kaydeder (istem
  enjeksiyonu yüküne benzeyen metinleri reddeder; neredeyse yinelenen kayıtları
  atlar).
- `memory_forget`: `memoryId` ile veya `query` aracılığıyla siler (%90 puanın
  üzerindeki tek bir eşleşmeyi otomatik olarak siler; aksi hâlde belirsizliği
  gidermek için aday kimlikleri listeler).

## Depolama

LanceDB verileri varsayılan olarak `~/.openclaw/memory/lancedb` konumunda
saklanır. `dbPath` ile geçersiz kılın:

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

`storageOptions`, LanceDB depolama arka uçları (ör. S3 uyumlu nesne depolama)
için dize anahtar/değer çiftlerini kabul eder ve `${ENV_VAR}` genişletmesini
destekler:

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

## Çalışma zamanı bağımlılıkları ve platform desteği

`memory-lancedb`, plugin paketine ait olan (OpenClaw çekirdek dağıtımına ait
olmayan) yerel `@lancedb/lancedb` paketine bağlıdır. Gateway başlangıcı plugin
bağımlılıklarını onarmaz; yerel bağımlılık eksikse veya yüklenemezse plugin
paketini yeniden kurun ya da güncelleyin ve Gateway'i yeniden başlatın.

`@lancedb/lancedb`, `darwin-x64` (Intel Mac) için yerel bir derleme yayımlamaz.
Bu platformda plugin, yükleme sırasında LanceDB'nin kullanılamadığını günlüğe
kaydeder; varsayılan bellek arka ucunu kullanın, Gateway'i desteklenen bir
platformda/mimaride çalıştırın veya `memory-lancedb` pluginini devre dışı
bırakın.

## Sorun giderme

### Girdi uzunluğu bağlam uzunluğunu aşıyor

Gömme modeli hatırlama sorgusunu reddetti:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` değerini düşürün, ardından Gateway'i yeniden başlatın:

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

Ollama için ayrıca yerel gömme uç noktasını kullanarak gömme sunucusuna Gateway
ana makinesinden erişilebildiğini doğrulayın:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Desteklenmeyen gömme modeli

`embedding.dimensions` olmadan yalnızca yerleşik OpenAI gömme boyutları
(`text-embedding-3-small`, `text-embedding-3-large`) bilinir. Diğer tüm modeller
için `embedding.dimensions` değerini modelin bildirdiği vektör boyutuna
ayarlayın.

### Plugin yükleniyor ancak hiçbir anı görünmüyor

`plugins.slots.memory` değerinin `memory-lancedb` öğesini gösterdiğini doğrulayın, ardından şunları çalıştırın:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` devre dışıysa Plugin mevcut anıları yine hatırlar ancak
yenilerini otomatik olarak saklamaz. `memory_store` aracını kullanın veya
`autoCapture` özelliğini etkinleştirin.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Bellek Wiki'si](/tr/plugins/memory-wiki)
- [Ollama](/tr/providers/ollama)
