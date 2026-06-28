---
read_when:
    - Tencent Hy3 önizlemesini OpenClaw ile kullanmak istiyorsunuz
    - TokenHub API anahtarı kurulumuna ihtiyacınız var
summary: Hy3 önizlemesi için Tencent Cloud TokenHub kurulumu
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-28T01:13:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Resmi Tencent Cloud sağlayıcı Plugin'ini kurarak OpenAI uyumlu bir API kullanarak TokenHub uç noktası (`tencent-tokenhub`) üzerinden Tencent Hy3 preview erişimi sağlayın.

| Özellik                 | Değer                                                 |
| ----------------------- | ----------------------------------------------------- |
| Sağlayıcı kimliği       | `tencent-tokenhub`                                    |
| Paket                   | `@openclaw/tencent-provider`                          |
| Kimlik doğrulama ortam değişkeni | `TOKENHUB_API_KEY`                           |
| Başlangıç kurulumu bayrağı | `--auth-choice tokenhub-api-key`                   |
| Doğrudan CLI bayrağı    | `--tokenhub-api-key <key>`                            |
| API                     | OpenAI uyumlu (`openai-completions`)                  |
| Varsayılan temel URL    | `https://tokenhub.tencentmaas.com/v1`                 |
| Küresel temel URL       | `https://tokenhub-intl.tencentmaas.com/v1` (geçersiz kılma) |
| Varsayılan model        | `tencent-tokenhub/hy3-preview`                        |

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i kurun">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="TokenHub API anahtarı oluşturun">
    Tencent Cloud TokenHub içinde bir API anahtarı oluşturun. Anahtar için sınırlı bir erişim kapsamı seçerseniz izin verilen modellere **Hy3 preview** modelini dahil edin.
  </Step>
  <Step title="Başlangıç kurulumunu çalıştırın">
    <CodeGroup>

```bash Başlangıç kurulumu
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Doğrudan bayrak
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Yalnızca env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Modeli doğrulayın">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Etkileşimsiz kurulum

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model ref                      | Ad                    | Girdi | Bağlam | Maks. çıktı | Notlar                         |
| ------------------------------ | --------------------- | ----- | ------ | ----------- | ------------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000      | Varsayılan; akıl yürütme etkin |

Hy3 preview, Tencent Hunyuan'ın akıl yürütme, uzun bağlamlı yönerge izleme, kod ve ajan iş akışları için geliştirilmiş büyük MoE dil modelidir. Tencent'in OpenAI uyumlu örnekleri model kimliği olarak `hy3-preview` kullanır ve standart chat-completions araç çağrısının yanı sıra `reasoning_effort` desteği sunar.

<Tip>
  Model kimliği `hy3-preview` şeklindedir. Bunu Tencent'in 3D üretim API'leri olan ve bu sağlayıcı tarafından yapılandırılan OpenClaw sohbet modeli olmayan `HY-3D-*` modelleriyle karıştırmayın.
</Tip>

## Kademeli fiyatlandırma

Sağlayıcı kataloğu, girdi penceresi uzunluğuna göre ölçeklenen kademeli maliyet meta verileriyle gelir; bu nedenle maliyet tahminleri manuel geçersiz kılmalar olmadan doldurulur.

| Girdi token aralığı | Girdi ücreti | Çıktı ücreti | Önbellek okuma |
| ------------------- | ------------ | ------------ | -------------- |
| 0 - 16,000          | 0.176        | 0.587        | 0.059          |
| 16,000 - 32,000     | 0.235        | 0.939        | 0.088          |
| 32,000+             | 0.293        | 1.173        | 0.117          |

Ücretler, Tencent tarafından duyurulduğu şekilde milyon token başına USD cinsindedir. Fiyatlandırmayı yalnızca farklı bir yüzeye ihtiyacınız olduğunda `models.providers.tencent-tokenhub` altında geçersiz kılın.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Uç nokta geçersiz kılma">
    OpenClaw varsayılan olarak Tencent Cloud'un `https://tokenhub.tencentmaas.com/v1` uç noktasını kullanır. Tencent ayrıca uluslararası bir TokenHub uç noktası da belgeler:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Uç noktayı yalnızca TokenHub hesabınız veya bölgeniz bunu gerektiriyorsa geçersiz kılın.

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak çalışıyorsa (launchd, systemd, Docker), `TOKENHUB_API_KEY` bu süreç tarafından görülebilir olmalıdır. launchd, systemd veya Docker exec ortamlarının okuyabilmesi için bunu `~/.openclaw/.env` içinde ya da `env.shellEnv` üzerinden ayarlayın.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan anahtarlar, yönetilen gateway süreçleri tarafından görülemez. Kalıcı kullanılabilirlik için env dosyasını veya yapılandırma seam'ini kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration" icon="gear">
    Sağlayıcı ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud'un TokenHub ürün sayfası.
  </Card>
  <Card title="Hy3 preview model kartı" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview ayrıntıları ve kıyaslamaları.
  </Card>
</CardGroup>
