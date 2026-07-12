---
read_when:
    - OpenClaw'u yerel bir inferrs sunucusuyla çalıştırmak istiyorsunuz
    - Gemma veya başka bir modeli inferrs üzerinden sunuyorsunuz
    - inferrs için tam OpenClaw uyumluluk bayraklarına ihtiyacınız var
summary: OpenClaw'u inferrs (OpenAI uyumlu yerel sunucu) üzerinden çalıştırın
title: Çıkarım yapar
x-i18n:
    generated_at: "2026-07-12T12:08:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs), yerel modelleri OpenAI uyumlu bir `/v1` API'sinin arkasından sunar. OpenClaw, genel `openai-completions` adaptörü üzerinden onunla iletişim kurar.

| Özellik             | Değer                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Sağlayıcı kimliği   | `inferrs` (özel; `models.providers.inferrs` altında yapılandırılır)   |
| Plugin              | yok — paketle birlikte gelen bir OpenClaw sağlayıcı plugini değildir  |
| Kimlik doğrulama ortam değişkeni | gerekli değil; inferrs sunucunuzda kimlik doğrulama yoksa herhangi bir değer çalışır |
| API                 | OpenAI uyumlu (`openai-completions`)                                  |
| Önerilen temel URL  | `http://127.0.0.1:8080/v1` (veya inferrs sunucunuzun dinlediği adres) |

<Note>
  `inferrs`, özel olarak barındırılan OpenAI uyumlu bir arka uçtur; özel bir OpenClaw sağlayıcı plugini değildir: ilk katılım sırasında bir kimlik doğrulama seçeneği belirlemek yerine onu `models.providers.inferrs` altında yapılandırırsınız. Otomatik keşif özelliğine sahip, paketle birlikte gelen bir plugin için [SGLang](/tr/providers/sglang) veya [vLLM](/tr/providers/vllm) sayfasına bakın.
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
    Açık bir sağlayıcı girdisi ekleyin ve varsayılan modelinizi ona yönlendirin. Aşağıdaki yapılandırma örneğine bakın.
  </Step>
</Steps>

## Tam yapılandırma örneği

Yerel bir `inferrs` sunucusunda Gemma 4:

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

## İsteğe bağlı başlatma

OpenClaw, `inferrs`'i yalnızca bir `inferrs/...` modeli seçildiğinde kendisi başlatabilir. Aynı sağlayıcı girdisine `localService` ekleyin:

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

`command` mutlak bir yol olmalıdır. Gateway ana makinesinde `which inferrs` komutunu çalıştırın ve döndürülen yolu kullanın. Tüm alanların başvurusu: [Yerel model hizmetleri](/tr/gateway/local-model-services).

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="requiresStringContent neden önemlidir?">
    Bazı `inferrs` Chat Completions rotaları, yapılandırılmış içerik parçası dizileri yerine yalnızca dize biçimindeki `messages[].content` değerlerini kabul eder.

    <Warning>
    OpenClaw çalıştırmaları şu hatayla başarısız olursa:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    model girdisinde `compat.requiresStringContent: true` ayarını kullanın. OpenClaw daha sonra isteği göndermeden önce yalnızca metin içeren içerik parçalarını düz dizelere dönüştürür.
    </Warning>

  </Accordion>

  <Accordion title="Gemma ve araç şemasıyla ilgili dikkat edilmesi gereken nokta">
    Bazı `inferrs` + Gemma birleşimleri küçük ve doğrudan `/v1/chat/completions` isteklerini kabul ederken tam OpenClaw aracı çalışma zamanı turlarında başarısız olur. Önce araç şeması yüzeyini devre dışı bırakmayı deneyin:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Bu, daha katı yerel arka uçlar üzerindeki istem baskısını azaltır. Küçük doğrudan istekler çalışmaya devam ettiği hâlde normal OpenClaw aracı turları `inferrs` içinde çökmeye devam ediyorsa bunu bir OpenClaw aktarım sorunu yerine üst kaynaklı bir model/sunucu sınırlaması olarak değerlendirin.

  </Accordion>

  <Accordion title="Elle temel doğrulama testi">
    Yapılandırmadan sonra her iki katmanı da bir kez test edin:

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

    İlk komut çalışıyor ancak ikincisi başarısız oluyorsa aşağıdaki Sorun giderme bölümüne bakın.

  </Accordion>

  <Accordion title="Proxy tarzı davranış">
    `inferrs`, `openai-responses` yerine genel `openai-completions` adaptörünü kullandığından yalnızca yerel OpenAI'ye özgü istek biçimlendirmesi hiçbir zaman uygulanmaz: `service_tier`, Responses `store`, istem önbelleği ipuçları ve OpenAI akıl yürütme uyumluluğu yükü biçimlendirmesi gönderilmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="curl /v1/models başarısız oluyor">
    `inferrs` çalışmıyor, erişilebilir değil veya yapılandırdığınız ana makine/porta bağlanmamış. Sunucunun başlatıldığını ve bu adreste dinlediğini doğrulayın.
  </Accordion>

  <Accordion title="messages[].content bir dize bekliyor">
    Model girdisinde `compat.requiresStringContent: true` ayarını kullanın (yukarıya bakın).
  </Accordion>

  <Accordion title="Doğrudan /v1/chat/completions çağrıları başarılı oluyor ancak openclaw infer model run başarısız oluyor">
    Araç şeması yüzeyini devre dışı bırakmak için `compat.supportsTools: false` ayarını kullanın (yukarıdaki Gemma uyarısına bakın).
  </Accordion>

  <Accordion title="inferrs daha büyük aracı turlarında hâlâ çöküyor">
    Şema hataları giderildiği hâlde `inferrs` daha büyük aracı turlarında çökmeye devam ediyorsa bunu üst kaynaklı bir `inferrs` veya model sınırlaması olarak değerlendirin. İstem baskısını azaltın ya da arka ucu/modeli değiştirin.
  </Accordion>
</AccordionGroup>

<Tip>
Genel yardım için [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq) sayfalarına bakın.
</Tip>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    OpenClaw'ı yerel model sunucularıyla çalıştırma.
  </Card>
  <Card title="Yerel model hizmetleri" href="/tr/gateway/local-model-services" icon="play">
    Yapılandırılmış sağlayıcılar için yerel model sunucularını gerektiğinde başlatma.
  </Card>
  <Card title="Gateway sorunlarını giderme" href="/tr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Doğrudan yoklamaları geçen ancak aracı çalıştırmalarında başarısız olan yerel OpenAI uyumlu arka uçlarda hata ayıklama.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model başvurularına ve yük devretme davranışına genel bakış.
  </Card>
</CardGroup>
