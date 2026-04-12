---
read_when:
    - OpenClaw'ı yerel bir inferrs sunucusuna karşı çalıştırmak istiyorsunuz
    - Gemma veya başka bir modeli inferrs üzerinden sunuyorsunuz
    - inferrs için tam OpenClaw uyumluluk bayraklarına ihtiyacınız var
summary: OpenClaw'ı inferrs üzerinden çalıştırın (OpenAI uyumlu yerel sunucu)
title: inferrs
x-i18n:
    generated_at: "2026-04-12T23:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs), yerel modelleri
OpenAI uyumlu bir `/v1` API arkasında sunabilir. OpenClaw, `inferrs` ile genel
`openai-completions` yolu üzerinden çalışır.

`inferrs` şu anda özel bir OpenClaw sağlayıcı Plugin'i olarak değil, özel barındırılan,
kendin yönettiğin OpenAI uyumlu bir arka uç olarak ele alınmalıdır.

## Başlangıç

<Steps>
  <Step title="Bir modelle inferrs'ü başlatın">
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
    Açık bir sağlayıcı girdisi ekleyin ve varsayılan modelinizi buna yönlendirin. Tam yapılandırma örneği için aşağıya bakın.
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

## Gelişmiş

<AccordionGroup>
  <Accordion title="requiresStringContent neden önemlidir">
    Bazı `inferrs` Chat Completions yolları, yapılandırılmış içerik parçası dizilerini değil,
    yalnızca string türünde `messages[].content` kabul eder.

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

    OpenClaw, isteği göndermeden önce yalnızca metinden oluşan içerik parçalarını düz string'lere indirger.

  </Accordion>

  <Accordion title="Gemma ve araç şeması uyarısı">
    Bazı güncel `inferrs` + Gemma birleşimleri, küçük doğrudan
    `/v1/chat/completions` isteklerini kabul eder ancak yine de tam OpenClaw ajan çalışma zamanı
    turlarında başarısız olur.

    Böyle bir durumda önce şunu deneyin:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Bu, model için OpenClaw'ın araç şeması yüzeyini devre dışı bırakır ve daha katı yerel arka uçlardaki
    istem baskısını azaltabilir.

    Küçük doğrudan istekler yine de çalışıyor ama normal OpenClaw ajan turları
    `inferrs` içinde çökmeye devam ediyorsa, geriye kalan sorun genellikle OpenClaw'ın taşıma katmanından çok
    yukarı akış model/sunucu davranışıdır.

  </Accordion>

  <Accordion title="El ile smoke test">
    Yapılandırdıktan sonra her iki katmanı da test edin:

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

    İlk komut çalışıyor ama ikincisi başarısız oluyorsa aşağıdaki sorun giderme bölümünü kontrol edin.

  </Accordion>

  <Accordion title="Proxy tarzı davranış">
    `inferrs`, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır.

    - Yalnızca yerel OpenAI'ye özgü istek şekillendirmesi burada uygulanmaz
    - `service_tier`, Responses `store`, istem önbelleği ipuçları veya
      OpenAI akıl yürütme uyumluluk yük şekillendirmesi yoktur
    - Gizli OpenClaw ilişkilendirme üst bilgileri (`originator`, `version`, `User-Agent`)
      özel `inferrs` base URL'lerine eklenmez

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="curl /v1/models başarısız oluyor">
    `inferrs` çalışmıyor, erişilemiyor veya beklenen
    ana makine/port'a bağlanmamış. Sunucunun başlatıldığından ve yapılandırdığınız
    adreste dinlediğinden emin olun.
  </Accordion>

  <Accordion title="messages[].content için string bekleniyordu">
    Model girdisinde `compat.requiresStringContent: true` ayarlayın. Ayrıntılar için yukarıdaki
    `requiresStringContent` bölümüne bakın.
  </Accordion>

  <Accordion title="Doğrudan /v1/chat/completions çağrıları geçiyor ama openclaw infer model run başarısız oluyor">
    Araç şeması yüzeyini devre dışı bırakmak için `compat.supportsTools: false` ayarlamayı deneyin.
    Yukarıdaki Gemma araç şeması uyarısına bakın.
  </Accordion>

  <Accordion title="inferrs daha büyük ajan turlarında hâlâ çöküyor">
    OpenClaw artık şema hataları almıyorsa ama `inferrs` daha büyük
    ajan turlarında yine de çöküyorsa, bunu yukarı akış `inferrs` veya model sınırlaması olarak değerlendirin. İstem baskısını azaltın veya farklı bir yerel arka uç ya da modele geçin.
  </Accordion>
</AccordionGroup>

<Tip>
Genel yardım için [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq) bölümlerine bakın.
</Tip>

## Ayrıca bakın

<CardGroup cols={2}>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    OpenClaw'ı yerel model sunucularına karşı çalıştırma.
  </Card>
  <Card title="Gateway sorun giderme" href="/tr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Doğrudan yoklamaları geçen ancak ajan çalıştırmalarında başarısız olan yerel OpenAI uyumlu arka uçlarda hata ayıklama.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model referansları ve yük devretme davranışına genel bakış.
  </Card>
</CardGroup>
