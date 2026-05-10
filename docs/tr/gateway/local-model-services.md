---
read_when:
    - OpenClaw'un yerel bir model sunucusunu yalnızca modeli seçildiğinde başlatmasını istiyorsunuz
    - ds4, inferrs, vLLM, llama.cpp, MLX veya OpenAI uyumlu başka bir yerel sunucu çalıştırırsınız
    - Yerel sağlayıcılar için soğuk başlatmayı, hazır olma durumunu ve boşta kapanmayı kontrol etmeniz gerekir
summary: OpenClaw model isteklerinden önce yerel model sunucularını gerektiğinde başlat
title: Yerel model hizmetleri
x-i18n:
    generated_at: "2026-05-10T19:37:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService`, OpenClaw’un sağlayıcıya ait bir yerel
model sunucusunu gerektiğinde başlatmasını sağlar. Bu, sağlayıcı düzeyinde bir yapılandırmadır: seçilen model
o sağlayıcıya ait olduğunda, OpenClaw hizmeti yoklar, uç nokta kapalıysa süreci
başlatır, hazır olmasını bekler ve ardından model isteğini gönderir.

Bunu, gün boyu çalışır halde tutması maliyetli olan yerel sunucular için veya
model seçiminin arka ucu ayağa kaldırmak için yeterli olması gereken
manuel kurulumlar için kullanın.

## Nasıl çalışır

1. Bir model isteği, yapılandırılmış bir sağlayıcıya çözümlenir.
2. Bu sağlayıcıda `localService` varsa, OpenClaw `healthUrl` değerini yoklar.
3. Yoklama başarılı olursa, OpenClaw mevcut sunucuyu kullanır.
4. Yoklama başarısız olursa, OpenClaw `command` değerini `args` ile başlatır.
5. OpenClaw, `readyTimeoutMs` süresi dolana kadar hazır olma durumunu yoklar.
6. Model isteği normal sağlayıcı aktarımı üzerinden gönderilir.
7. OpenClaw süreci başlattıysa ve `idleStopMs` pozitifse, son devam eden istek
   bu süre boyunca boşta kaldıktan sonra süreç durdurulur.

OpenClaw bunun için launchd, systemd, Docker veya bir daemon kurmaz. Sunucu,
ona ilk ihtiyaç duyan OpenClaw sürecinin bir alt sürecidir.

## Yapılandırma şekli

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

## Alanlar

- `command`: mutlak yürütülebilir dosya yolu. Shell araması kullanılmaz.
- `args`: süreç argümanları. Shell genişletmesi, pipe’lar, globbing veya tırnaklama
  kuralları uygulanmaz.
- `cwd`: süreç için isteğe bağlı çalışma dizini.
- `env`: OpenClaw süreç ortamının üzerine birleştirilen isteğe bağlı ortam
  değişkenleri.
- `healthUrl`: hazır olma URL’si. Atlanırsa, OpenClaw `baseUrl` sonuna
  `/models` ekler; bu nedenle `http://127.0.0.1:8000/v1`,
  `http://127.0.0.1:8000/v1/models` olur.
- `readyTimeoutMs`: başlatma hazır olma son tarihi. Varsayılan: `120000`.
- `idleStopMs`: OpenClaw tarafından başlatılan süreçler için boşta kapanma gecikmesi. `0` veya
  atlanmış olması, süreci OpenClaw çıkana kadar canlı tutar.

## Inferrs örneği

Inferrs, özel bir OpenAI uyumlu `/v1` arka ucudur; bu nedenle aynı yerel hizmet
API’si `inferrs` sağlayıcı girdisiyle çalışır.

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` değerini, OpenClaw’u çalıştıran makinede `which inferrs` sonucuyla
değiştirin.

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## Operasyonel notlar

- Bir OpenClaw süreci, başlattığı alt süreci yönetir. Aynı sağlık URL’sinin zaten
  canlı olduğunu gören başka bir OpenClaw süreci, onu devralmadan yeniden kullanır.
- Başlatma, sağlayıcı komutu ve argüman kümesi başına seri hale getirilir; böylece eşzamanlı
  istekler aynı yapılandırma için yinelenen sunucular oluşturmaz.
- Etkin akış yanıtları bir kira tutar; boşta kapanma, yanıt
  gövdesi işleme tamamlanana kadar bekler.
- Soğuk başlatmaların ve uzun üretimlerin varsayılan model isteği zaman aşımına
  takılmaması için yavaş yerel sağlayıcılarda `timeoutSeconds` kullanın.
- Sunucunuz hazır olma durumunu `/v1/models` dışında bir yerde sunuyorsa açık bir
  `healthUrl` kullanın.

## İlgili

<CardGroup cols={2}>
  <Card title="Local models" href="/tr/gateway/local-models" icon="server">
    Yerel model kurulumu, sağlayıcı seçenekleri ve güvenlik yönergeleri.
  </Card>
  <Card title="Inferrs" href="/tr/providers/inferrs" icon="cpu">
    OpenClaw’u inferrs OpenAI uyumlu yerel sunucusu üzerinden çalıştırın.
  </Card>
</CardGroup>
