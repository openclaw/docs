---
read_when:
    - OpenClaw'ı bir LiteLLM proxy üzerinden yönlendirmek istiyorsunuz
    - LiteLLM üzerinden maliyet takibi, günlükleme veya model yönlendirmeye ihtiyacınız var
summary: Birleşik model erişimi ve maliyet takibi için OpenClaw'ı LiteLLM Proxy üzerinden çalıştırın
title: LiteLLM
x-i18n:
    generated_at: "2026-04-26T11:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai), 100+'den fazla model sağlayıcısına birleşik API sunan açık kaynaklı bir LLM gateway'dir. Merkezi maliyet takibi, günlükleme ve OpenClaw config'inizi değiştirmeden backend değiştirme esnekliği elde etmek için OpenClaw'ı LiteLLM üzerinden yönlendirin.

<Tip>
**OpenClaw ile LiteLLM neden kullanılır?**

- **Maliyet takibi** — OpenClaw'ın tüm modellerde tam olarak ne kadar harcadığını görün
- **Model yönlendirme** — Config değişikliği olmadan Claude, GPT-4, Gemini, Bedrock arasında geçiş yapın
- **Sanal anahtarlar** — OpenClaw için harcama limitli anahtarlar oluşturun
- **Günlükleme** — Hata ayıklama için tam istek/yanıt günlükleri
- **Fallback'ler** — Birincil sağlayıcınız kapalıysa otomatik failover

</Tip>

## Hızlı başlangıç

<Tabs>
  <Tab title="Onboarding (önerilir)">
    **Şunun için en iyisi:** çalışan bir LiteLLM kurulumuna en hızlı yol.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Elle kurulum">
    **Şunun için en iyisi:** kurulum ve config üzerinde tam denetim.

    <Steps>
      <Step title="LiteLLM Proxy'yi başlatın">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw'ı LiteLLM'ye yönlendirin">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Hepsi bu. OpenClaw artık LiteLLM üzerinden yönlenir.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma

### Ortam değişkenleri

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Config dosyası

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Gelişmiş yapılandırma

### Görsel oluşturma

LiteLLM, OpenAI uyumlu
`/images/generations` ve `/images/edits` yolları üzerinden `image_generate` tool'unu da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir LiteLLM görsel
modeli yapılandırın:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

`http://localhost:4000` gibi loopback LiteLLM URL'leri genel
özel ağ geçersiz kılması olmadan çalışır. LAN üzerinde barındırılan bir proxy için
`models.providers.litellm.request.allowPrivateNetwork: true` ayarlayın; çünkü API anahtarı
yapılandırılmış proxy ana makinesine gönderilecektir.

<AccordionGroup>
  <Accordion title="Sanal anahtarlar">
    OpenClaw için harcama limitli özel bir anahtar oluşturun:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Oluşturulan anahtarı `LITELLM_API_KEY` olarak kullanın.

  </Accordion>

  <Accordion title="Model yönlendirme">
    LiteLLM, model isteklerini farklı backend'lere yönlendirebilir. LiteLLM `config.yaml` dosyanızda yapılandırın:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw yine `claude-opus-4-6` ister — yönlendirmeyi LiteLLM yönetir.

  </Accordion>

  <Accordion title="Kullanımı görüntüleme">
    LiteLLM panosunu veya API'yi denetleyin:

    ```bash
    # Anahtar bilgisi
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Harcama günlükleri
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy davranış notları">
    - LiteLLM varsayılan olarak `http://localhost:4000` üzerinde çalışır
    - OpenClaw, LiteLLM'nin proxy tarzı OpenAI uyumlu `/v1`
      uç noktası üzerinden bağlanır
    - Yerel yalnızca-OpenAI istek biçimlendirmesi LiteLLM üzerinden uygulanmaz:
      `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok ve
      OpenAI reasoning-compat payload biçimlendirmesi yok
    - Gizli OpenClaw attribution üstbilgileri (`originator`, `version`, `User-Agent`)
      özel LiteLLM base URL'lerine enjekte edilmez
  </Accordion>
</AccordionGroup>

<Note>
Genel sağlayıcı yapılandırması ve failover davranışı için bkz. [Model Providers](/tr/concepts/model-providers).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Resmi LiteLLM dokümantasyonu ve API referansı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcıların, model başvurularının ve failover davranışının genel görünümü.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam config referansı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modeller nasıl seçilir ve yapılandırılır.
  </Card>
</CardGroup>
