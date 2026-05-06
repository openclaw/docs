---
read_when:
    - OpenClaw'u yerel bir inferrs sunucusuna karşı çalıştırmak istiyorsunuz
    - Gemma'yı veya başka bir modeli inferrs üzerinden sunuyorsunuz
    - inferrs için tam OpenClaw uyumluluk bayraklarına ihtiyacınız var
summary: OpenClaw'u inferrs üzerinden çalıştırın (OpenAI uyumlu yerel sunucu)
title: Çıkarım yapar
x-i18n:
    generated_at: "2026-05-06T09:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs), yerel modelleri OpenAI uyumlu bir `/v1` API arkasında sunabilir. OpenClaw, genel `openai-completions` yolu üzerinden `inferrs` ile çalışır.

| Özellik           | Değer                                                              |
| ------------------ | ------------------------------------------------------------------ |
| Provider kimliği        | `inferrs` (özel; `models.providers.inferrs` altında yapılandırın)     |
| Plugin             | yok — `inferrs`, paketle birlikte gelen bir OpenClaw provider plugin değildir         |
| Kimlik doğrulama env var       | İsteğe bağlı. inferrs sunucunuzda kimlik doğrulama yoksa herhangi bir değer çalışır       |
| API                | OpenAI uyumlu (`openai-completions`)                           |
| Önerilen temel URL | `http://127.0.0.1:8080/v1` (veya inferrs sunucunuz neredeyse orası) |

<Note>
  `inferrs` şu anda özel, kendinizin barındırdığı OpenAI uyumlu bir backend olarak ele alınmalıdır; özel bir OpenClaw provider plugin değildir. Onu bir onboarding seçim bayrağı yerine `models.providers.inferrs` üzerinden yapılandırırsınız. Otomatik keşfe sahip gerçek bir paketlenmiş plugin gerekiyorsa [SGLang](/tr/providers/sglang) veya [vLLM](/tr/providers/vllm) bölümüne bakın.
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
  <Step title="Bir OpenClaw provider girdisi ekleyin">
    Açık bir provider girdisi ekleyin ve varsayılan modelinizi ona yönlendirin. Aşağıdaki tam yapılandırma örneğine bakın.
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="requiresStringContent neden önemlidir">
    Bazı `inferrs` Chat Completions rotaları, yapılandırılmış içerik parçası dizileri yerine yalnızca string
    `messages[].content` kabul eder.

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

    OpenClaw, isteği göndermeden önce saf metin içerik parçalarını düz stringlere dönüştürür.

  </Accordion>

  <Accordion title="Gemma ve tool-schema uyarısı">
    Bazı güncel `inferrs` + Gemma kombinasyonları küçük doğrudan
    `/v1/chat/completions` isteklerini kabul eder, ancak tam OpenClaw agent-runtime
    turlarında yine de başarısız olur.

    Bu olursa önce şunu deneyin:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Bu, model için OpenClaw'ın araç şeması yüzeyini devre dışı bırakır ve daha katı yerel backendler üzerindeki prompt
    baskısını azaltabilir.

    Çok küçük doğrudan istekler hâlâ çalışıyor ancak normal OpenClaw agent turları
    `inferrs` içinde çökmeye devam ediyorsa, kalan sorun genellikle OpenClaw'ın taşıma katmanı değil upstream model/sunucu
    davranışıdır.

  </Accordion>

  <Accordion title="Manuel smoke test">
    Yapılandırıldıktan sonra iki katmanı da test edin:

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
    `inferrs`, yerel bir OpenAI uç noktası değil, proxy tarzı OpenAI uyumlu bir `/v1` backend olarak ele alınır.

    - Yerel OpenAI'ye özgü istek şekillendirme burada geçerli değildir
    - `service_tier` yoktur, Responses `store` yoktur, prompt-cache ipuçları yoktur ve OpenAI reasoning-compat payload şekillendirmesi yoktur
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      özel `inferrs` temel URL'lerine eklenmez

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="curl /v1/models başarısız oluyor">
    `inferrs` çalışmıyor, erişilebilir değil veya beklenen host/porta bağlanmamış. Sunucunun başlatıldığından ve yapılandırdığınız adreste dinlediğinden emin olun.
  </Accordion>

  <Accordion title="messages[].content bir string bekliyordu">
    Model girdisinde `compat.requiresStringContent: true` ayarlayın. Ayrıntılar için yukarıdaki
    `requiresStringContent` bölümüne bakın.
  </Accordion>

  <Accordion title="Doğrudan /v1/chat/completions çağrıları başarılı oluyor ancak openclaw infer model run başarısız oluyor">
    Araç şeması yüzeyini devre dışı bırakmak için `compat.supportsTools: false` ayarlamayı deneyin.
    Yukarıdaki Gemma tool-schema uyarısına bakın.
  </Accordion>

  <Accordion title="inferrs daha büyük agent turlarında hâlâ çöküyor">
    OpenClaw artık şema hataları almıyor ancak `inferrs` daha büyük
    agent turlarında hâlâ çöküyorsa, bunu upstream `inferrs` veya model sınırlaması olarak ele alın. Prompt
    baskısını azaltın veya farklı bir yerel backend ya da modele geçin.
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
  <Card title="Gateway sorun giderme" href="/tr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Probları geçen ancak agent çalıştırmalarında başarısız olan yerel OpenAI uyumlu backendlerde hata ayıklama.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm providerlara, model referanslarına ve failover davranışına genel bakış.
  </Card>
</CardGroup>
