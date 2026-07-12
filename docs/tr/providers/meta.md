---
read_when:
    - Meta'yı OpenClaw ile kullanmak istiyorsunuz
    - MODEL_API_KEY ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Meta kurulumu (kimlik doğrulama + muse-spark-1.1 model seçimi)
title: Meta
x-i18n:
    generated_at: "2026-07-12T12:09:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API**, `muse-spark-1.1` akıl yürütme modeli için OpenAI uyumlu **Responses API**'yi (`POST /v1/responses`) kullanır. Sağlayıcı, OpenClaw ile birlikte gelen bir Plugin olarak sunulur.

| Özellik                | Değer                              |
| ---------------------- | ---------------------------------- |
| Sağlayıcı kimliği      | `meta`                             |
| Plugin                 | birlikte gelen sağlayıcı           |
| Kimlik doğrulama ortam değişkeni | `MODEL_API_KEY`          |
| İlk kurulum bayrağı    | `--auth-choice meta-api-key`       |
| Doğrudan CLI bayrağı   | `--meta-api-key <key>`             |
| API                    | Responses API (`openai-responses`) |
| Temel URL              | `https://api.meta.ai/v1`           |
| Varsayılan model       | `meta/muse-spark-1.1`              |
| Varsayılan akıl yürütme | `high` (`reasoning.effort`)       |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider meta
    ```

    Statik `muse-spark-1.1` katalog girdisini listeler. `MODEL_API_KEY` çözümlenemiyorsa
    `openclaw models status --json`, eksik kimlik bilgisini
    `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

## Etkileşimsiz kurulum

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Yerleşik katalog

| Model referansı        | Ad             | Akıl yürütme | Bağlam penceresi | En fazla çıktı |
| ---------------------- | -------------- | ------------ | ---------------- | -------------- |
| `meta/muse-spark-1.1`  | Muse Spark 1.1 | evet         | 1,048,576        | 131,072        |

Yetenekler:

- Metin + görüntü girdisi
- Araç çağırma ve akış
- Akıl yürütme yoğunluğu: `minimal`, `low`, `medium`, `high`, `xhigh` (varsayılan: `high`)
- Durumsuz şifreli akıl yürütme yeniden oynatımı (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1`, `reasoning.effort: "none"` değerini kabul etmez. OpenClaw,
bu sağlayıcı için `--thinking off` seçeneğini `minimal` değerine eşler.
</Warning>

## Elle yapılandırma

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Gateway bir arka plan programı (launchd, systemd, Docker) olarak çalışıyorsa
`MODEL_API_KEY` değişkeninin bu işlem tarafından erişilebilir olduğundan emin olun;
örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla. Yalnızca
etkileşimli bir kabukta dışa aktarılan anahtar, ortam ayrıca içe aktarılmadığı
sürece yönetilen bir hizmete yardımcı olmaz.
</Note>

## Hızlı doğrulama testi

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Canlı testler, `POST /v1/responses` uç noktasına karşı `muse-spark-1.1` kullanır.

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    muse-spark-1.1 için akıl yürütme yoğunluğu düzeyleri.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Ajan varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
