---
read_when:
    - OpenClaw'ın yerel model sunucusunu yalnızca model veya gömme sağlayıcısı seçildiğinde başlatmasını istiyorsunuz
    - ds4, inferrs, vLLM, llama.cpp, MLX veya OpenAI ile uyumlu başka bir yerel sunucu çalıştırıyorsunuz
    - Yerel sağlayıcılar için soğuk başlatmayı, hazır olma durumunu ve boşta kapanmayı denetlemeniz gerekir
summary: OpenClaw model ve embedding isteklerinden önce yerel model sunucularını isteğe bağlı olarak başlatın
title: Yerel model hizmetleri
x-i18n:
    generated_at: "2026-07-12T12:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService`, sağlayıcıya ait yerel model sunucusunu gerektiğinde başlatır. Bir model veya gömme isteği bu sağlayıcıyı seçtiğinde OpenClaw durum uç noktasını yoklar, çalışmıyorsa işlemi başlatır, hazır olmasını bekler ve ardından isteği gönderir. Maliyetli yerel sunucuları gün boyunca çalışır durumda tutmaktan kaçınmak için bunu kullanın.

## Nasıl çalışır?

1. Bir model veya gömme isteği, yapılandırılmış bir sağlayıcıya çözümlenir.
2. Bu sağlayıcıda `localService` varsa OpenClaw, `healthUrl` adresini yoklar.
3. Yoklama başarılı olursa OpenClaw zaten çalışan sunucuyu kullanır.
4. Yoklama başarısız olursa OpenClaw, `command` komutunu `args` bağımsız değişkenleriyle başlatır.
5. OpenClaw, `readyTimeoutMs` süresi dolana kadar durum uç noktasını düzenli olarak yoklar.
6. İstek, normal model veya gömme aktarımı üzerinden ilerler.
7. İşlemi OpenClaw başlattıysa ve `idleStopMs` ayarlanmışsa son devam eden istek belirtilen süre boyunca boşta kaldıktan sonra işlemi durdurur.

OpenClaw bunun için launchd, systemd, Docker veya herhangi bir art alan hizmeti kurmaz. Sunucu, kendisine ilk ihtiyaç duyan OpenClaw işleminin sıradan bir alt işlemidir.

Başlatma, yapılandırılmış sağlayıcı ve komut/bağımsız değişken/ortam kümesi başına sıralı olarak gerçekleştirilir; böylece aynı hizmete yönelik eşzamanlı sohbet ve gömme istekleri yinelenen sunucular başlatmaz. Her istek, yanıt işleme tamamlanana kadar kendi kiralamasını elinde tutar; dolayısıyla boşta kalma nedeniyle kapatma, devam eden tüm model ve gömme isteklerini bekler. Yapılandırılmış sağlayıcı takma adları birbirinden ayrı kalır: iki takma ad, aynı Ollama, LM Studio veya OpenAI uyumlu bağdaştırıcı kimliğinde birleştirilmeden farklı GPU ana makinelerine işaret edebilir.

Başka bir OpenClaw işleminin aynı `healthUrl` adresinde zaten sağlıklı bir sunucusu varsa bu işlem, sunucunun yönetimini devralmadan onu yeniden kullanır (her işlem yalnızca kendisinin başlattığı alt işlemi yönetir). Başlatma ve çıkış günlükleri; sınırlandırılmış, hassas bilgileri ayıklanmış alt işlem çıktı sonlarını, zamanlama ve çıkış ayrıntılarıyla birlikte içerir; yapılandırılmış ortam değerleri hiçbir zaman yayımlanmaz.

## Yapılandırma biçimi

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Yavaş ilk başlatmaların ve uzun üretimlerin varsayılan model isteği zaman aşımına uğramaması için sağlayıcı girdisinde (`localService` içinde değil) `timeoutSeconds` değerini ayarlayın. Sunucunuz hazır olma durumunu temel URL'deki `/models` dışında bir yerde sunuyorsa açıkça bir `healthUrl` ayarlayın.

## Alanlar

| Alan             | Gerekli | Açıklama                                                                                                                                        |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | evet    | Mutlak yürütülebilir dosya yolu. Kabuk PATH araması yapılmaz.                                                                                   |
| `args`           | hayır   | İşlem bağımsız değişkenleri. Kabuk genişletmesi, yöneltme, kalıp eşleştirme veya tırnak işleme yapılmaz.                                         |
| `cwd`            | hayır   | İşlemin çalışma dizini.                                                                                                                         |
| `env`            | hayır   | OpenClaw işlem ortamının üzerine birleştirilen ortam değişkenleri.                                                                               |
| `healthUrl`      | hayır   | Hazır olma URL'si. Varsayılan olarak `baseUrl` sonuna `/models` eklenir (`http://127.0.0.1:8000/v1`, `http://127.0.0.1:8000/v1/models` olur). |
| `readyTimeoutMs` | hayır   | Başlatma hazır olma son süresi. Varsayılan: `120000`.                                                                                           |
| `idleStopMs`     | hayır   | OpenClaw tarafından başlatılan işlem için boşta kalma sonrası kapatma gecikmesi. `0` değeri veya belirtilmemesi, OpenClaw çıkana kadar işlemi çalışır durumda tutar. |

## Inferrs örneği

Inferrs, özel bir OpenAI uyumlu `/v1` arka ucudur; dolayısıyla aynı `localService` API'si bir `inferrs` sağlayıcı girdisiyle çalışır:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

`command` değerini OpenClaw çalıştıran makinedeki `which inferrs` komutunun sonucuyla değiştirin. Eksiksiz inferrs kurulumu: [Inferrs](/tr/providers/inferrs).

## ds4 örneği

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Eksiksiz kurulum, bağlam boyutlandırma ve doğrulama komutları: [ds4](/tr/providers/ds4).

## İlgili

<CardGroup cols={2}>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    Yerel model kurulumu, sağlayıcı seçenekleri ve güvenlik yönergeleri.
  </Card>
  <Card title="Inferrs" href="/tr/providers/inferrs" icon="cpu">
    OpenClaw'ı inferrs OpenAI uyumlu yerel sunucusu üzerinden çalıştırın.
  </Card>
</CardGroup>
