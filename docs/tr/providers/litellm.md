---
read_when:
    - OpenClaw'ı bir LiteLLM proxy üzerinden yönlendirmek istiyorsunuz
    - LiteLLM üzerinden maliyet takibi, günlükleme veya model yönlendirme ihtiyacınız var
summary: Birleşik model erişimi ve maliyet takibi için OpenClaw'ı LiteLLM Proxy üzerinden çalıştırın
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T09:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai), 100'den fazla model sağlayıcısı için birleşik bir API sunan açık kaynaklı bir LLM Gateway'idir. Merkezileştirilmiş maliyet takibi, günlükleme ve OpenClaw yapılandırmanızı değiştirmeden arka uçları değiştirme esnekliği elde etmek için OpenClaw'ı LiteLLM üzerinden yönlendirin.

<Tip>
**OpenClaw ile neden LiteLLM kullanılır?**

- **Maliyet takibi** — OpenClaw'ın tüm modeller genelinde tam olarak ne kadar harcadığını görün
- **Model yönlendirme** — Yapılandırma değişikliği olmadan Claude, GPT-4, Gemini, Bedrock arasında geçiş yapın
- **Sanal anahtarlar** — OpenClaw için harcama limitli anahtarlar oluşturun
- **Günlükleme** — Hata ayıklama için tam istek/yanıt günlükleri
- **Fallbacks** — Birincil sağlayıcınız kapalıysa otomatik failover

</Tip>

## Hızlı başlangıç

<Tabs>
  <Tab title="Onboarding (önerilir)">
    **Şunlar için en uygunu:** çalışan bir LiteLLM kurulumu için en hızlı yol.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Elle kurulum">
    **Şunlar için en uygunu:** kurulum ve yapılandırma üzerinde tam denetim.

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

        Hepsi bu kadar. OpenClaw artık LiteLLM üzerinden yönlendirilir.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma

### Ortam değişkenleri

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Yapılandırma dosyası

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

<AccordionGroup>
  <Accordion title="Sanal anahtarlar">
    OpenClaw için harcama limitleri olan özel bir anahtar oluşturun:

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
    LiteLLM, model isteklerini farklı arka uçlara yönlendirebilir. LiteLLM `config.yaml` dosyanızda yapılandırın:

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

    OpenClaw `claude-opus-4-6` istemeye devam eder — yönlendirmeyi LiteLLM yönetir.

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

  <Accordion title="Proxy davranışı notları">
    - LiteLLM varsayılan olarak `http://localhost:4000` üzerinde çalışır
    - OpenClaw, LiteLLM'nin proxy tarzı OpenAI uyumlu `/v1`
      uç noktası üzerinden bağlanır
    - Yerel yalnızca-OpenAI istek şekillendirmesi LiteLLM üzerinden uygulanmaz:
      `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok ve
      OpenAI reasoning-compat yük şekillendirmesi yok
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      özel LiteLLM temel URL'lerine eklenmez
  </Accordion>
</AccordionGroup>

<Note>
Genel sağlayıcı yapılandırması ve failover davranışı için bkz. [Model Providers](/tr/concepts/model-providers).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="LiteLLM Belgeleri" href="https://docs.litellm.ai" icon="book">
    Resmi LiteLLM belgeleri ve API başvurusu.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model başvurularına ve failover davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
</CardGroup>
