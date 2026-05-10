---
read_when:
    - Anda ingin menggunakan model OSS yang dihosting oleh Bedrock Mantle dengan OpenClaw
    - Anda memerlukan endpoint Mantle yang kompatibel dengan OpenAI untuk GPT-OSS, Qwen, Kimi, atau GLM
summary: Gunakan model Amazon Bedrock Mantle (kompatibel dengan OpenAI) dengan OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw menyertakan provider **Amazon Bedrock Mantle** bawaan yang terhubung ke
endpoint Mantle yang kompatibel dengan OpenAI. Mantle meng-host model sumber terbuka dan
pihak ketiga (GPT-OSS, Qwen, Kimi, GLM, dan sejenisnya) melalui permukaan standar
`/v1/chat/completions` yang didukung oleh infrastruktur Bedrock.

| Properti        | Nilai                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| ID Provider     | `amazon-bedrock-mantle`                                                                       |
| API             | `openai-completions` (kompatibel dengan OpenAI) atau `anthropic-messages` (rute Anthropic Messages) |
| Autentikasi     | `AWS_BEARER_TOKEN_BEDROCK` eksplisit atau pembuatan bearer token dari rantai kredensial IAM   |
| Wilayah default | `us-east-1` (timpa dengan `AWS_REGION` atau `AWS_DEFAULT_REGION`)                             |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Explicit bearer token">
    **Paling cocok untuk:** lingkungan yang sudah memiliki bearer token Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Secara opsional, tetapkan wilayah (default-nya `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Model yang ditemukan muncul di bawah provider `amazon-bedrock-mantle`. Tidak ada
        konfigurasi tambahan yang diperlukan kecuali Anda ingin menimpa default.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Paling cocok untuk:** menggunakan kredensial yang kompatibel dengan AWS SDK (konfigurasi bersama, SSO, identitas web, peran instance atau tugas).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Sumber autentikasi apa pun yang kompatibel dengan AWS SDK dapat digunakan:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw membuat bearer token Mantle dari rantai kredensial secara otomatis.
      </Step>
    </Steps>

    <Tip>
    Ketika `AWS_BEARER_TOKEN_BEDROCK` tidak ditetapkan, OpenClaw menerbitkan bearer token untuk Anda dari rantai kredensial default AWS, termasuk kredensial/profil konfigurasi bersama, SSO, identitas web, serta peran instance atau tugas.
    </Tip>

  </Tab>
</Tabs>

## Penemuan model otomatis

Ketika `AWS_BEARER_TOKEN_BEDROCK` ditetapkan, OpenClaw menggunakannya secara langsung. Jika tidak,
OpenClaw mencoba membuat bearer token Mantle dari rantai kredensial default
AWS. Kemudian OpenClaw menemukan model Mantle yang tersedia dengan menanyakan
endpoint `/v1/models` wilayah tersebut.

| Perilaku             | Detail                        |
| -------------------- | ----------------------------- |
| Cache penemuan       | Hasil disimpan dalam cache selama 1 jam |
| Penyegaran token IAM | Setiap jam                    |

Untuk mempertahankan Plugin Mantle tetap aktif tetapi menekan penemuan otomatis dan pembuatan
bearer token IAM, nonaktifkan toggle penemuan milik Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token ini sama dengan `AWS_BEARER_TOKEN_BEDROCK` yang digunakan oleh provider standar [Amazon Bedrock](/id/providers/bedrock).
</Note>

### Wilayah yang didukung

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfigurasi manual

Jika Anda lebih suka konfigurasi eksplisit daripada penemuan otomatis:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Reasoning support">
    Dukungan penalaran disimpulkan dari ID model yang memuat pola seperti
    `thinking`, `reasoner`, atau `gpt-oss-120b`. OpenClaw menetapkan `reasoning: true`
    secara otomatis untuk model yang cocok selama penemuan.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Jika endpoint Mantle tidak tersedia atau tidak mengembalikan model, provider
    dilewati secara diam-diam. OpenClaw tidak menghasilkan error; provider lain yang dikonfigurasi
    tetap berfungsi normal.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle juga mengekspos rute Anthropic Messages yang membawa model Claude melalui jalur streaming yang diautentikasi dengan bearer token yang sama. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) dapat dipanggil melalui rute ini dengan streaming milik provider, sehingga bearer token AWS tidak diperlakukan seperti kunci API Anthropic.

    Ketika Anda menetapkan model Anthropic Messages pada provider Mantle, OpenClaw menggunakan permukaan API `anthropic-messages`, bukan `openai-completions`, untuk model tersebut. Autentikasi tetap berasal dari `AWS_BEARER_TOKEN_BEDROCK` (atau bearer token IAM yang diterbitkan).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle adalah provider terpisah dari provider standar
    [Amazon Bedrock](/id/providers/bedrock). Mantle menggunakan permukaan `/v1`
    yang kompatibel dengan OpenAI, sementara provider standar Bedrock menggunakan
    API Bedrock native.

    Kedua provider berbagi kredensial `AWS_BEARER_TOKEN_BEDROCK` yang sama ketika
    tersedia.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/id/providers/bedrock" icon="cloud">
    Provider Bedrock native untuk Anthropic Claude, Titan, dan model lainnya.
  </Card>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
