---
read_when:
    - OpenClaw'ı yerel bir inferrs sunucusuyla çalıştırmak istiyorsunuz
    - inferrs üzerinden Gemma veya başka bir model sunuyorsunuz
    - inferrs için tam OpenClaw uyumluluk bayraklarına ihtiyacınız var
summary: OpenClaw’u inferrs (OpenAI uyumlu yerel sunucu) üzerinden çalıştırın
title: Çıkarım yapar
x-i18n:
    generated_at: "2026-05-10T19:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs), yerel modelleri OpenAI uyumlu bir `/v1` API arkasında sunabilir. OpenClaw, genel `openai-completions` yolu üzerinden `inferrs` ile çalışır.

| Özellik           | Değer                                                              |
| ------------------ | ------------------------------------------------------------------ |
| Sağlayıcı kimliği        | `inferrs` (özel; `models.providers.inferrs` altında yapılandırın)     |
| Plugin             | yok — `inferrs`, paketlenmiş bir OpenClaw sağlayıcı plugin'i değildir         |
| Kimlik doğrulama ortam değişkeni       | İsteğe bağlı. inferrs sunucunuzda kimlik doğrulama yoksa herhangi bir değer çalışır       |
| API                | OpenAI uyumlu (`openai-completions`)                           |
| Önerilen temel URL | `http://127.0.0.1:8080/v1` (veya inferrs sunucunuzun bulunduğu yer) |

<Note>
  `inferrs` şu anda adanmış bir OpenClaw sağlayıcı plugin'i yerine özel, kendi barındırdığınız OpenAI uyumlu bir backend olarak ele alınmalıdır. Bunu bir onboarding seçim bayrağı yerine `models.providers.inferrs` üzerinden yapılandırırsınız. Otomatik keşif özellikli gerçek bir paketlenmiş plugin'e ihtiyacınız varsa [SGLang](/tr/providers/sglang) veya [vLLM](/tr/providers/vllm) bölümüne bakın.
</Note>

## Başlarken

<Steps>
  <Step title="inferrs'i bir modelle başlatın">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Sunucuya erişilebildiğini doğrulayın">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Bir OpenClaw sağlayıcı girdisi ekleyin">
    Açık bir sağlayıcı girdisi ekleyin ve varsayılan modelinizi ona yönlendirin. Aşağıdaki tam yapılandırma örneğine bakın.
  </Step>
</Steps>

## Tam yapılandırma örneği

Bu örnek, yerel bir `inferrs` sunucusunda Gemma 4 kullanır.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
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

## İstek üzerine başlatma

Inferrs, yalnızca bir `inferrs/...` modeli seçildiğinde OpenClaw tarafından da
başlatılabilir. Aynı sağlayıcı girdisine `localService` ekleyin:

```json5
{
  models: {
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

`command` mutlak olmalıdır. Gateway ana makinesinde `which inferrs` kullanın ve bu
yolu yapılandırmaya koyun. Tam alan başvurusu için
[Yerel model hizmetleri](/tr/gateway/local-model-services) bölümüne bakın.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="requiresStringContent neden önemlidir">
    Bazı `inferrs` Chat Completions rotaları, yapılandırılmış içerik parçası dizileri
    yerine yalnızca dize `messages[].content` kabul eder.

    <Warning>
    OpenClaw çalıştırmaları şu tür bir hatayla başarısız olursa:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    model girdinizde `compat.requiresStringContent: true` ayarlayın.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw, isteği göndermeden önce saf metin içerik parçalarını düz dizelere
    dönüştürür.

  </Accordion>

  <Accordion title="Gemma ve araç şeması uyarısı">
    Bazı mevcut `inferrs` + Gemma kombinasyonları küçük doğrudan
    `/v1/chat/completions` isteklerini kabul eder, ancak tam OpenClaw agent-runtime
    turlarında yine de başarısız olur.

    Bu olursa önce şunu deneyin:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Bu, model için OpenClaw'ın araç şeması yüzeyini devre dışı bırakır ve daha katı
    yerel backend'lerde prompt baskısını azaltabilir.

    Küçük doğrudan istekler hâlâ çalışıyor ancak normal OpenClaw ajan turları
    `inferrs` içinde çökmeye devam ediyorsa, kalan sorun genellikle OpenClaw'ın
    taşıma katmanından ziyade upstream model/sunucu davranışıdır.

  </Accordion>

  <Accordion title="Manuel smoke testi">
    Yapılandırdıktan sonra iki katmanı da test edin:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    İlk komut çalışıp ikincisi başarısız olursa aşağıdaki sorun giderme bölümünü kontrol edin.

  </Accordion>

  <Accordion title="Proxy tarzı davranış">
    `inferrs`, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu
    bir `/v1` backend olarak ele alınır.

    - Yalnızca yerel OpenAI istek şekillendirmesi burada uygulanmaz
    - `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok ve
      OpenAI reasoning-compat payload şekillendirmesi yok
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      özel `inferrs` temel URL'lerine eklenmez

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="curl /v1/models başarısız oluyor">
    `inferrs` çalışmıyor, erişilemiyor veya beklenen host/port'a bağlanmamış.
    Sunucunun başlatıldığından ve yapılandırdığınız adreste dinlediğinden emin olun.
  </Accordion>

  <Accordion title="messages[].content bir dize bekliyordu">
    Model girdisinde `compat.requiresStringContent: true` ayarlayın. Ayrıntılar için
    yukarıdaki `requiresStringContent` bölümüne bakın.
  </Accordion>

  <Accordion title="Doğrudan /v1/chat/completions çağrıları geçiyor ancak openclaw infer model run başarısız oluyor">
    Araç şeması yüzeyini devre dışı bırakmak için `compat.supportsTools: false` ayarlamayı deneyin.
    Yukarıdaki Gemma araç şeması uyarısına bakın.
  </Accordion>

  <Accordion title="inferrs daha büyük ajan turlarında hâlâ çöküyor">
    OpenClaw artık şema hataları almıyorsa ancak `inferrs` daha büyük ajan
    turlarında hâlâ çöküyorsa, bunu upstream `inferrs` veya model sınırlaması olarak ele alın.
    Prompt baskısını azaltın veya farklı bir yerel backend'e ya da modele geçin.
  </Accordion>
</AccordionGroup>

<Tip>
Genel yardım için [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq) bölümlerine bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    OpenClaw'ı yerel model sunucularına karşı çalıştırma.
  </Card>
  <Card title="Yerel model hizmetleri" href="/tr/gateway/local-model-services" icon="play">
    Yapılandırılmış sağlayıcılar için yerel model sunucularını istek üzerine başlatma.
  </Card>
  <Card title="Gateway sorun giderme" href="/tr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Sınamalardan geçen ancak ajan çalıştırmalarında başarısız olan yerel OpenAI uyumlu backend'lerde hata ayıklama.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model ref'lerine ve failover davranışına genel bakış.
  </Card>
</CardGroup>
