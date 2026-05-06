---
read_when:
    - Tencent Hy3 önizlemesini OpenClaw ile kullanmak istiyorsunuz
    - TokenHub API anahtarını ayarlamanız gerekir
summary: Hy3 önizlemesi için Tencent Cloud TokenHub kurulumu
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud, OpenClaw içinde paketlenmiş bir sağlayıcı Plugin olarak gelir. OpenAI uyumlu bir API kullanarak TokenHub uç noktası (`tencent-tokenhub`) üzerinden Tencent Hy3 preview erişimi sağlar.

| Özellik         | Değer                                                 |
| ---------------- | ----------------------------------------------------- |
| Sağlayıcı kimliği      | `tencent-tokenhub`                                    |
| Plugin           | paketlenmiş, `enabledByDefault: true`                     |
| Kimlik doğrulama env var     | `TOKENHUB_API_KEY`                                    |
| Onboarding bayrağı  | `--auth-choice tokenhub-api-key`                      |
| Doğrudan CLI bayrağı  | `--tokenhub-api-key <key>`                            |
| API              | OpenAI uyumlu (`openai-completions`)              |
| Varsayılan temel URL | `https://tokenhub.tencentmaas.com/v1`                 |
| Küresel temel URL  | `https://tokenhub-intl.tencentmaas.com/v1` (geçersiz kılma) |
| Varsayılan model    | `tencent-tokenhub/hy3-preview`                        |

## Hızlı başlangıç

<Steps>
  <Step title="TokenHub API anahtarı oluşturun">
    Tencent Cloud TokenHub içinde bir API anahtarı oluşturun. Anahtar için sınırlı bir erişim kapsamı seçerseniz izin verilen modellere **Hy3 preview** ekleyin.
  </Step>
  <Step title="Onboarding çalıştırın">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
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

| Model ref                      | Ad                   | Girdi | Bağlam | Maksimum çıktı | Notlar                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | Varsayılan; akıl yürütme etkin |

Hy3 preview, Tencent Hunyuan'ın akıl yürütme, uzun bağlamlı yönerge izleme, kod ve agent iş akışları için büyük MoE dil modelidir. Tencent'in OpenAI uyumlu örnekleri model kimliği olarak `hy3-preview` kullanır ve standart chat-completions araç çağırmanın yanı sıra `reasoning_effort` desteği sağlar.

<Tip>
  Model kimliği `hy3-preview` şeklindedir. Bunu Tencent'in 3D üretim API'leri olan ve bu sağlayıcı tarafından yapılandırılan OpenClaw sohbet modeli olmayan `HY-3D-*` modelleriyle karıştırmayın.
</Tip>

## Katmanlı fiyatlandırma

Paketlenmiş katalog, girdi penceresi uzunluğuna göre ölçeklenen katmanlı maliyet meta verileriyle gelir; bu nedenle maliyet tahminleri manuel geçersiz kılmalar olmadan doldurulur.

| Girdi token aralığı | Girdi ücreti | Çıktı ücreti | Önbellek okuma |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

Ücretler Tencent tarafından duyurulduğu şekilde milyon token başına USD cinsindendir. Fiyatlandırmayı yalnızca farklı bir yüzeye ihtiyaç duyduğunuzda `models.providers.tencent-tokenhub` altında geçersiz kılın.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Uç nokta geçersiz kılma">
    OpenClaw varsayılan olarak Tencent Cloud'un `https://tokenhub.tencentmaas.com/v1` uç noktasını kullanır. Tencent ayrıca uluslararası bir TokenHub uç noktasını belgeler:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Uç noktayı yalnızca TokenHub hesabınız veya bölgeniz gerektirdiğinde geçersiz kılın.

  </Accordion>

  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak çalışıyorsa (launchd, systemd, Docker), `TOKENHUB_API_KEY` bu süreç tarafından görülebilir olmalıdır. launchd, systemd veya Docker exec ortamlarının okuyabilmesi için bunu `~/.openclaw/.env` içinde ya da `env.shellEnv` aracılığıyla ayarlayın.

    <Warning>
      Yalnızca `~/.profile` içinde ayarlanan anahtarlar yönetilen gateway süreçleri tarafından görülemez. Kalıcı kullanılabilirlik için env dosyasını veya config seam'i kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model refs değerlerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration" icon="gear">
    Sağlayıcı ayarları dahil tam config şeması.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud'un TokenHub ürün sayfası.
  </Card>
  <Card title="Hy3 preview model kartı" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview ayrıntıları ve kıyaslamaları.
  </Card>
</CardGroup>
