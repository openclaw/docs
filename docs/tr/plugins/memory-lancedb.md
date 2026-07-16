---
read_when:
    - memory-lancedb pluginini yapılandırıyorsunuz
    - Otomatik hatırlama veya otomatik yakalama özellikli, LanceDB destekli uzun süreli bellek istiyorsunuz
    - Ollama gibi yerel OpenAI uyumlu gömmeler kullanıyorsunuz
sidebarTitle: Memory LanceDB
summary: Yerel Ollama uyumlu gömmeler dâhil olmak üzere resmî harici LanceDB bellek Plugin'ini yapılandırın
title: LanceDB Belleği
x-i18n:
    generated_at: "2026-07-16T17:21:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb`, uzun süreli belleği vektör aramasıyla LanceDB'de depolayan
resmî bir harici plugindir. Bir model sırasından önce ilgili anıları otomatik
olarak çağırabilir ve bir yanıttan sonra önemli olguları otomatik olarak yakalayabilir.

Yerel bir vektör veritabanı, OpenAI uyumlu bir gömme uç noktası veya varsayılan
yerleşik bellek arka ucunun dışında bir bellek deposu için kullanın.

## Kurulum

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin npm'de yayımlanır; OpenClaw çalışma zamanı imajına dahil değildir.
Kurulması plugin girdisini yazar, etkinleştirir ve `plugins.slots.memory` değerini
`memory-lancedb` olarak değiştirir. Bellek yuvası hâlihazırda başka bir
pluginin sahipliğindeyse bu plugin bir uyarıyla devre dışı bırakılır.

<Note>
`memory-wiki` gibi yardımcı pluginler `memory-lancedb` ile birlikte çalışabilir,
ancak etkin bellek yuvasının sahipliğini aynı anda yalnızca bir plugin üstlenebilir.
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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın, ardından
yüklendiğini doğrulayın:

```bash
openclaw gateway restart
openclaw plugins list
```

## Gömme yapılandırması

`embedding` gereklidir ve en az bir alan içermelidir. `provider`
varsayılan olarak `openai`; `model` ise varsayılan olarak
`text-embedding-3-small` değerini kullanır.

| Alan                   | Tür           | Notlar                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | dize          | Bağdaştırıcı kimliği; ör. `openai`, `github-copilot`, `ollama`. Varsayılan: `openai`. |
| `embedding.model`      | dize          | Varsayılan: `text-embedding-3-small`.                                    |
| `embedding.apiKey`     | dize          | İsteğe bağlıdır; `${ENV_VAR}` genişletmesini destekler.                  |
| `embedding.baseUrl`    | dize          | İsteğe bağlıdır; `${ENV_VAR}` genişletmesini destekler.                  |
| `embedding.dimensions` | tam sayı (>=1) | Yerleşik tabloda bulunmayan modeller için gereklidir (aşağıya bakın).     |

İki istek yolu vardır:

- **Sağlayıcı bağdaştırıcısı yolu** (varsayılan): `embedding.provider` değerini ayarlayın ve
  `embedding.apiKey`/`embedding.baseUrl` değerlerini atlayın. Plugin, sağlayıcının
  yapılandırılmış kimlik doğrulama profilini, ortam değişkenini veya
  `models.providers.<provider>.apiKey` değerini `memory-core` tarafından kullanılan
  bellek gömme bağdaştırıcıları üzerinden çözümler. Bu yol `github-copilot`,
  `ollama` ve gömme desteğine sahip diğer tüm paketlenmiş sağlayıcılar içindir.
- **Doğrudan OpenAI uyumlu istemci yolu**: `embedding.provider` değerini ayarlamadan bırakın
  (veya `"openai"`) ve `embedding.apiKey` ile `embedding.baseUrl` değerlerini
  ayarlayın. Bunu, paketlenmiş sağlayıcı bağdaştırıcısı bulunmayan ham bir
  OpenAI uyumlu gömme uç noktası için kullanın.

OpenAI Codex / ChatGPT OAuth, bir OpenAI Platform gömme kimlik bilgisi değildir.
OpenAI gömmeleri için bir OpenAI API anahtarı kimlik doğrulama profili,
`OPENAI_API_KEY` veya `models.providers.openai.apiKey` kullanın. Yalnızca OAuth kullananlar,
`github-copilot` veya `ollama` gibi gömme yeteneğine sahip başka bir
sağlayıcı seçmelidir.

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

Bazı OpenAI uyumlu gömme uç noktaları `encoding_format` parametresini
reddeder; diğerleri bunu yok sayar ve her zaman `number[]` döndürür.
`memory-lancedb`, isteklerde `encoding_format` değerini atlar ve hem kayan
noktalı sayı dizisi hem de base64 kodlu float32 yanıtlarını kabul eder; böylece
her iki yanıt biçimi de yapılandırma olmadan çalışır.

### Boyutlar

OpenClaw yalnızca `text-embedding-3-small` (1536) ve `text-embedding-3-large` (3072) için
yerleşik bir boyuta sahiptir. Diğer tüm modellerde LanceDB'nin vektör sütununu
oluşturabilmesi için açık bir `embedding.dimensions` gerekir; örneğin 2048 boyutlu
ZhiPu `embedding-3`:

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

Paketlenmiş Ollama sağlayıcı bağdaştırıcısı yolunu (`embedding.provider: "ollama"`) kullanın.
Bu yol, Ollama'nın yerel `/api/embed` uç noktasını çağırır ve [Ollama](/tr/providers/ollama)
sağlayıcısıyla aynı kimlik doğrulama/temel URL kurallarını izler.

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
gereklidir. Küçük yerel gömme modellerinde, yerel sunucu bağlam uzunluğu
hataları döndürürse `recallMaxChars` değerini düşürün.

## Geri çağırma ve yakalama sınırları

| Ayar              | Varsayılan | Aralık                       | Uygulandığı yer                                             |
| ----------------- | ---------- | ---------------------------- | ----------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Geri çağırma için gömme API'sine gönderilen metin.          |
| `captureMaxChars` | `500`   | 100-10000                    | Otomatik yakalamaya uygun ileti uzunluğu.                   |
| `customTriggers`  | `[]`    | 0-50 öğe, her biri <=100 karakter | Otomatik yakalamanın bir iletiyi değerlendirmesini sağlayan değişmez ifadeler. |

`recallMaxChars`; `before_prompt_build` otomatik geri çağırma sorgusunu,
`memory_recall` aracını, `memory_forget` sorgu yolunu ve
`openclaw ltm
search` değerini sınırlar. Otomatik geri çağırma, sıradaki en son
kullanıcı iletisini gömer ve yalnızca kullanıcı iletisi bulunmadığında tam isteme
geri döner; böylece kanal meta verileri ve büyük istem blokları gömme isteğinin
dışında tutulur.

`captureMaxChars`, sıranın `agent_end` olayındaki bir kullanıcı
iletisinin otomatik yakalama için değerlendirilebilecek kadar kısa olup olmadığını
belirler; geri çağırma sorgularını etkilemez.

`customTriggers`, regex kullanmadan değişmez otomatik yakalama ifadeleri ekler.
Yerleşik tetikleyiciler yaygın İngilizce, Çekçe, Çince, Japonca ve Korece bellek
ifadelerini (`remember`, `prefer`, `记住`,
`覚えて`, `기억해` ve benzerlerini) kapsar.

Otomatik yakalama ayrıca zarf/aktarım meta verilerine, istem enjeksiyonu yüklerine
veya önceden eklenmiş `<relevant-memories>` bağlamına benzeyen metinleri reddeder
ve her ajan sırası için yakalanan bellek sayısını 3 ile sınırlar.

Her bellek bir ajana aittir. Geri çağırma, yinelenenleri algılama, yakalama,
listeleme, ham sorgular ve silme işlemlerinin tümü satırları döndürmeden veya
değiştirmeden önce bu sahipliği zorunlu kılar. `memorySearch.enabled: false` değerine
(`agents.list[]` içinde veya `agents.defaults` üzerinden) sahip bir ajan,
`memory_recall`, `memory_store` veya `memory_forget` araçlarından
hiçbirini alamaz ve plugin düzeyindeki `autoRecall`/`autoCapture`
bayrakları açık olsa bile otomatik geri çağırma veya yakalamaya katılmaz.

## Komutlar

`memory-lancedb`, yalnızca etkin bellek yuvasının sahibi olduğunda değil,
kurulu olduğu her durumda `ltm` CLI ad alanını kaydeder:

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query`, doğrudan LanceDB tablosunda vektörsüz bir sorgu çalıştırır:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Bayrak                            | Varsayılan                              | Notlar                                                                                                                                    |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | yapılandırılmış varsayılan ajan         | Özel ajan ad alanını seçer. `list`, `search`, `query` ve `stats` üzerinde kullanılabilir.                                     |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Virgülle ayrılmış sütun izin listesi.                                                                                                     |
| `--filter <condition>`            | yok                                     | Bir çıktı sütunu üzerinde `category = 'preference'` veya `importance >= 0.8` gibi tek bir karşılaştırma. Dize değerleri tırnak içine alınmalıdır. |
| `--limit <n>`                     | `10`                     | Pozitif tam sayı.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | yok                                     | Filtre çalıştıktan sonra bellekte sıralanır; sıralama sütunu projeksiyona otomatik olarak eklenir ve istenmediyse çıktıdan çıkarılır.       |

Ajanlar etkin bellek plugininden üç araç alır:

- `memory_recall`: depolanan bellekler üzerinde vektör araması.
- `memory_store`: bir olguyu, tercihi, kararı veya varlığı kaydeder
  (istem enjeksiyonu yüküne benzeyen metinleri reddeder; neredeyse yinelenen
  kayıtları atlar).
- `memory_forget`: `memoryId` veya `query` ile siler
  (%90'ın üzerindeki tek bir eşleşmeyi otomatik olarak siler; aksi hâlde belirsizliği
  gidermek için aday kimlikleri listeler).

## Depolama

LanceDB verileri varsayılan olarak `~/.openclaw/memory/lancedb` konumunda tutulur.
`dbPath` ile geçersiz kılın:

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

Plugin tek bir LanceDB tablosu tutar ve her satırda normalleştirilmiş bir ajan
sahibi depolar. Bu, arama sonrası bir filtre değil, bir depolama sınırıdır: ajan
sahipliği vektör sıralamasından önce uygulanır ve listeleme, sorgu, sayım ve silme
koşullarına dahil edilir. `ltm query --filter`, genel çıktı sütunları üzerinde
doğrulanmış tek bir karşılaştırmayı kabul eder. Depo, bu karşılaştırmayı zorunlu
sahip koşulundan ayrı olarak oluşturur; böylece bir filtre sorguyu başka bir
ajana genişletemez.

Ajan başına sahiplikten önce oluşturulan veritabanlarında güvenilir satır kökeni
bilgisi bulunmaz. Yükseltme sırasında `openclaw doctor --fix`, bu eski satırları bir
kez yapılandırılmış varsayılan ajana atar. Çalışma zamanı erişimi bu taşıma
tamamlanana kadar güvenli biçimde kapalı kalır; diğer ajanlar eski paylaşılan
satırları hiçbir zaman devralmaz.

`storageOptions`, LanceDB depolama arka uçları (ör. S3 uyumlu nesne depolama)
için dize anahtar/değer çiftlerini kabul eder ve `${ENV_VAR}`
genişletmesini destekler:

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

`memory-lancedb`, plugin paketinin sahip olduğu (OpenClaw çekirdek dağıtımının değil)
yerel `@lancedb/lancedb` paketine bağlıdır. Gateway başlatılırken plugin
bağımlılıkları onarılmaz; yerel bağımlılık eksikse veya yüklenemezse
plugin paketini yeniden yükleyin ya da güncelleyin ve Gateway'i yeniden başlatın.

`@lancedb/lancedb`, `darwin-x64` (Intel Mac) için yerel bir derleme
yayımlamaz. Bu platformda plugin, yükleme sırasında LanceDB'nin kullanılamadığını
günlüğe kaydeder; varsayılan bellek arka ucunu kullanın, Gateway'i desteklenen
bir platformda/mimaride çalıştırın veya `memory-lancedb` seçeneğini devre dışı bırakın.

## Sorun giderme

### Girdi uzunluğu bağlam uzunluğunu aşıyor

Gömme modeli, geri çağırma sorgusunu reddetti:

```text
memory-lancedb: geri çağırma başarısız oldu: Hata: 400 girdi uzunluğu bağlam uzunluğunu aşıyor
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

Ollama için ayrıca gömme sunucusuna, yerel gömme uç noktası kullanılarak Gateway
ana makinesinden erişilebildiğini doğrulayın:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Desteklenmeyen gömme modeli

`embedding.dimensions` olmadan yalnızca yerleşik OpenAI gömme boyutları
bilinir (`text-embedding-3-small`, `text-embedding-3-large`). Diğer tüm
modellerde `embedding.dimensions` değerini modelin bildirdiği vektör boyutuna ayarlayın.

### Plugin yükleniyor ancak hiçbir bellek görünmüyor

`plugins.slots.memory` değerinin `memory-lancedb` değerini gösterdiğini doğrulayın, ardından şunları çalıştırın:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` devre dışıysa plugin mevcut bellekleri yine geri çağırır ancak
yenilerini otomatik olarak depolamaz. `memory_store` aracını kullanın veya
`autoCapture` seçeneğini etkinleştirin.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Active Memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Bellek Wiki'si](/tr/plugins/memory-wiki)
- [Ollama](/tr/providers/ollama)
