---
read_when:
    - Tencent hy3'ü OpenClaw ile kullanmak istiyorsunuz
    - TokenHub veya TokenPlan API anahtarı kurulumunu yapmanız gerekir
summary: hy3 için Tencent Cloud TokenHub ve TokenPlan kurulumu
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T12:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Hy3'e, OpenAI uyumlu bir API kullanarak iki uç nokta — TokenHub (`tencent-tokenhub`) ve TokenPlan (`tencent-tokenplan`) — üzerinden erişmek için resmi Tencent Cloud sağlayıcı Plugin'ini yükleyin.

| Özellik                         | Değer                                                 |
| ------------------------------- | ----------------------------------------------------- |
| Sağlayıcı kimlikleri            | `tencent-tokenhub`, `tencent-tokenplan`               |
| Paket                           | `@openclaw/tencent-provider`                          |
| TokenHub kimlik doğrulama ortam değişkeni | `TOKENHUB_API_KEY`                           |
| TokenPlan kimlik doğrulama ortam değişkeni | `TOKENPLAN_API_KEY`                         |
| TokenHub ilk kurulum bayrağı    | `--auth-choice tokenhub-api-key`                      |
| TokenPlan ilk kurulum bayrağı   | `--auth-choice tokenplan-api-key`                     |
| TokenHub doğrudan CLI bayrağı   | `--tokenhub-api-key <key>`                            |
| TokenPlan doğrudan CLI bayrağı  | `--tokenplan-api-key <key>`                           |
| API                             | OpenAI uyumlu (`openai-completions`)                  |
| TokenHub temel URL'si            | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub küresel temel URL'si    | `https://tokenhub-intl.tencentmaas.com/v1` (geçersiz kılma) |
| TokenPlan temel URL'si           | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Varsayılan model                | `tencent-tokenhub/hy3`                                |

## Hızlı başlangıç

<Steps>
  <Step title="Tencent API anahtarı oluşturun">
    Tencent Cloud TokenHub ve TokenPlan için bir API anahtarı oluşturun. Anahtar için sınırlı bir erişim kapsamı seçerseniz izin verilen modellere **hy3**'ü (TokenHub'da kullanmayı planlıyorsanız **hy3 preview**'ı da) ekleyin.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    <CodeGroup>

```bash TokenHub ilk kurulumu
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub doğrudan bayrağı
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan ilk kurulumu
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan doğrudan bayrağı
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Yalnızca ortam değişkenleri
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Modeli doğrulayın">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Etkileşimsiz kurulum

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--non-interactive` ile birlikte `--accept-risk` kullanılması zorunludur.
</Note>

## Yerleşik katalog

| Model referansı                 | Ad                     | Girdi | Bağlam  | Azami çıktı | Notlar                  |
| ------------------------------ | ---------------------- | ----- | ------- | ----------- | ----------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 önizleme (TokenHub) | metin | 256,000 | 64,000      | akıl yürütme etkin      |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)          | metin | 256,000 | 64,000      | akıl yürütme etkin      |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)         | metin | 256,000 | 64,000      | akıl yürütme etkin      |

hy3; akıl yürütme, uzun bağlamlı talimatları izleme, kod ve ajan iş akışları için Tencent Hunyuan'ın büyük MoE dil modelidir. Tencent'in OpenAI uyumlu örnekleri model kimliği olarak `hy3` kullanır ve standart sohbet tamamlama aracı çağrılarının yanı sıra `reasoning_effort` özelliğini de destekler.

<Tip>
  Model kimliği `hy3`'tür. Bunu, 3B oluşturma API'leri olan ve bu sağlayıcının yapılandırdığı OpenClaw sohbet modeli olmayan Tencent'in `HY-3D-*` modelleriyle karıştırmayın.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Uç noktayı geçersiz kılma">
    OpenClaw'ın yerleşik kataloğu Tencent Cloud'un `https://tokenhub.tencentmaas.com/v1` uç noktasını kullanır. Yalnızca TokenHub hesabınız veya bölgeniz farklı bir uç nokta gerektiriyorsa bunu geçersiz kılın:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak (launchd, systemd, Docker) çalışıyorsa `TOKENHUB_API_KEY` ve `TOKENPLAN_API_KEY` söz konusu işlem tarafından görülebilmelidir. launchd, systemd veya Docker exec ortamlarının bunları okuyabilmesi için değişkenleri `~/.openclaw/.env` içinde ya da `env.shellEnv` aracılığıyla ayarlayın.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan anahtarlar, yönetilen Gateway işlemleri tarafından görülemez. Kalıcı kullanılabilirlik için ortam dosyasını veya yapılandırma bağlantı noktasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarlarını da içeren eksiksiz yapılandırma şeması.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud'un TokenHub ürün sayfası.
  </Card>
  <Card title="Hy3 önizleme model kartı" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 önizleme ayrıntıları ve karşılaştırmalı performans sonuçları.
  </Card>
</CardGroup>
