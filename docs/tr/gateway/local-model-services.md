---
read_when:
    - OpenClaw'ın yerel model sunucusunu yalnızca modeli seçildiğinde başlatmasını istiyorsunuz
    - ds4, inferrs, vLLM, llama.cpp, MLX veya başka bir OpenAI uyumlu yerel sunucu çalıştırıyorsunuz
    - Yerel sağlayıcılar için soğuk başlangıcı, hazır olma durumunu ve boşta kapanmayı denetlemeniz gerekir
summary: OpenClaw model isteklerinden önce yerel model sunucularını talep üzerine başlatın
title: Yerel model hizmetleri
x-i18n:
    generated_at: "2026-06-28T00:35:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService`, OpenClaw'ın sağlayıcıya ait yerel
model sunucusunu gerektiğinde başlatmasını sağlar. Bu, sağlayıcı düzeyinde bir
yapılandırmadır: seçilen model o sağlayıcıya ait olduğunda OpenClaw hizmeti
yoklar, uç nokta kapalıysa süreci başlatır, hazır olmasını bekler ve ardından
model isteğini gönderir.

Bunu, bütün gün çalışır durumda tutması maliyetli olan yerel sunucular için ya da
model seçiminin arka ucu ayağa kaldırmak için yeterli olması gereken manuel
kurulumlar için kullanın.

## Nasıl çalışır

1. Bir model isteği yapılandırılmış bir sağlayıcıya çözümlenir.
2. Bu sağlayıcıda `localService` varsa OpenClaw `healthUrl` adresini yoklar.
3. Yoklama başarılı olursa OpenClaw mevcut sunucuyu kullanır.
4. Yoklama başarısız olursa OpenClaw `command` komutunu `args` ile başlatır.
5. OpenClaw, `readyTimeoutMs` süresi dolana kadar hazır olma durumunu yoklar.
6. Model isteği normal sağlayıcı aktarımı üzerinden gönderilir.
7. OpenClaw süreci başlattıysa ve `idleStopMs` pozitifse süreç, uçuşta olan son
   istek o kadar süre boyunca boşta kaldıktan sonra durdurulur.

OpenClaw bunun için launchd, systemd, Docker veya bir daemon kurmaz. Sunucu, ona
ilk ihtiyaç duyan OpenClaw sürecinin alt sürecidir.

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

## Alanlar

- `command`: mutlak yürütülebilir dosya yolu. Kabuk araması kullanılmaz.
- `args`: süreç argümanları. Kabuk genişletmesi, borular, globbing veya alıntılama
  kuralları uygulanmaz.
- `cwd`: süreç için isteğe bağlı çalışma dizini.
- `env`: OpenClaw süreci ortamının üzerine birleştirilen isteğe bağlı ortam
  değişkenleri.
- `healthUrl`: hazır olma URL'si. Atlanırsa OpenClaw `baseUrl` sonuna `/models`
  ekler; böylece `http://127.0.0.1:8000/v1`,
  `http://127.0.0.1:8000/v1/models` olur.
- `readyTimeoutMs`: başlatma hazır olma son süresi. Varsayılan: `120000`.
- `idleStopMs`: OpenClaw tarafından başlatılan süreçler için boşta kapatma gecikmesi. `0` veya
  atlanmış olması, OpenClaw çıkana kadar süreci canlı tutar.

## Inferrs örneği

Inferrs özel, OpenAI uyumlu bir `/v1` arka ucudur; bu nedenle aynı yerel hizmet
API'si `inferrs` sağlayıcı girdisiyle çalışır.

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

`command` değerini OpenClaw'ın çalıştığı makinede `which inferrs` sonucuyla
değiştirin.

## ds4 örneği

Tam kurulum, bağlam boyutlandırma rehberi ve doğrulama komutları için
[ds4](/tr/providers/ds4) sayfasına bakın.

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

## Operasyonel notlar

- Bir OpenClaw süreci başlattığı alt süreci yönetir. Aynı sağlık URL'sini zaten
  canlı gören başka bir OpenClaw süreci, onu devralmadan yeniden kullanır.
- Başlatma, sağlayıcı komutu ve argüman kümesi başına serileştirilir; böylece
  eşzamanlı istekler aynı yapılandırma için yinelenen sunucular başlatmaz.
- Etkin akış yanıtları bir kiralama tutar; boşta kapatma, yanıt gövdesi işleme
  tamamlanana kadar bekler.
- Yavaş yerel sağlayıcılarda `timeoutSeconds` kullanın; böylece soğuk başlatmalar
  ve uzun üretimler varsayılan model isteği zaman aşımına takılmaz.
- Sunucunuz hazır olma durumunu `/v1/models` dışında bir yerde sunuyorsa açık bir
  `healthUrl` kullanın.

## İlgili

<CardGroup cols={2}>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    Yerel model kurulumu, sağlayıcı seçenekleri ve güvenlik rehberi.
  </Card>
  <Card title="Inferrs" href="/tr/providers/inferrs" icon="cpu">
    OpenClaw'ı inferrs OpenAI uyumlu yerel sunucusu üzerinden çalıştırın.
  </Card>
</CardGroup>
