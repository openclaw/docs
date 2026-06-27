---
read_when:
    - Anda ingin menggunakan model OSS yang dihosting Bedrock Mantle dengan OpenClaw
    - Anda memerlukan endpoint yang kompatibel dengan Mantle OpenAI untuk GPT-OSS, Qwen, Kimi, atau GLM
summary: Gunakan model Amazon Bedrock Mantle (kompatibel dengan OpenAI) dengan OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw menyertakan penyedia **Amazon Bedrock Mantle** bawaan yang terhubung ke
endpoint Mantle yang kompatibel dengan OpenAI. Mantle menghosting model sumber terbuka dan
pihak ketiga (GPT-OSS, Qwen, Kimi, GLM, dan sejenisnya) melalui permukaan
`/v1/chat/completions` standar yang didukung oleh infrastruktur Bedrock.

| Properti       | Nilai                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID penyedia    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (kompatibel dengan OpenAI) atau `anthropic-messages` (rute Anthropic Messages) |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` eksplisit atau pembuatan token bearer rantai kredensial IAM      |
| Region default | `us-east-1` (timpa dengan `AWS_REGION` atau `AWS_DEFAULT_REGION`)                           |

## Memulai

Pilih metode auth yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Token bearer eksplisit">
    **Terbaik untuk:** lingkungan tempat Anda sudah memiliki token bearer Mantle.

    <Steps>
      <Step title="Atur token bearer di host gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Secara opsional, atur region (default ke `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Ikut serta dalam berbagi data penyedia untuk Claude Fable 5">
        Claude Fable 5 dan model Bedrock kelas Claude Mythos memerlukan mode Mantle Data Retention API `provider_data_share` sebelum pemanggilan. Keikutsertaan ini memungkinkan Bedrock membagikan prompt dan completion dengan Anthropic dan menyimpannya hingga 30 hari untuk peninjauan kepercayaan dan keamanan.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Gunakan model Bedrock lain dalam config jika Anda tidak dapat menerima mode retensi tersebut.
      </Step>
      <Step title="Verifikasi model ditemukan">
        ```bash
        openclaw models list
        ```

        Model yang ditemukan muncul di bawah penyedia `amazon-bedrock-mantle`. Tidak ada
        config tambahan yang diperlukan kecuali Anda ingin menimpa default.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Kredensial IAM">
    **Terbaik untuk:** menggunakan kredensial yang kompatibel dengan AWS SDK (config bersama, SSO, identitas web, peran instance atau tugas).

    <Steps>
      <Step title="Konfigurasikan kredensial AWS di host gateway">
        Sumber auth apa pun yang kompatibel dengan AWS SDK dapat digunakan:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifikasi model ditemukan">
        ```bash
        openclaw models list
        ```

        OpenClaw membuat token bearer Mantle dari rantai kredensial secara otomatis.
      </Step>
    </Steps>

    <Tip>
    Saat `AWS_BEARER_TOKEN_BEDROCK` tidak diatur, OpenClaw menerbitkan token bearer untuk Anda dari rantai kredensial default AWS, termasuk profil kredensial/config bersama, SSO, identitas web, dan peran instance atau tugas.
    </Tip>

  </Tab>
</Tabs>

## Penemuan model otomatis

Saat `AWS_BEARER_TOKEN_BEDROCK` diatur, OpenClaw menggunakannya secara langsung. Jika tidak,
OpenClaw mencoba membuat token bearer Mantle dari rantai kredensial default
AWS. Kemudian OpenClaw menemukan model Mantle yang tersedia dengan mengkueri endpoint
`/v1/models` region tersebut.

| Perilaku          | Detail                         |
| ----------------- | ------------------------------ |
| Cache penemuan    | Hasil disimpan di cache selama 1 jam |
| Penyegaran token IAM | Setiap jam                  |

Untuk menjaga Plugin Mantle tetap aktif tetapi menekan penemuan otomatis dan
pembuatan token bearer IAM, nonaktifkan toggle penemuan milik Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Token bearer adalah `AWS_BEARER_TOKEN_BEDROCK` yang sama dengan yang digunakan oleh penyedia [Amazon Bedrock](/id/providers/bedrock) standar.
</Note>

### Region yang didukung

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfigurasi manual

Jika Anda lebih memilih config eksplisit daripada penemuan otomatis:

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
  <Accordion title="Dukungan reasoning">
    Dukungan reasoning disimpulkan dari ID model yang berisi pola seperti
    `thinking`, `reasoner`, atau `gpt-oss-120b`. OpenClaw mengatur `reasoning: true`
    secara otomatis untuk model yang cocok selama penemuan.
  </Accordion>

  <Accordion title="Endpoint tidak tersedia">
    Jika endpoint Mantle tidak tersedia atau tidak mengembalikan model, penyedia
    dilewati secara diam-diam. OpenClaw tidak menghasilkan error; penyedia lain yang dikonfigurasi
    tetap bekerja secara normal.
  </Accordion>

  <Accordion title="Claude Opus 4.7 melalui rute Anthropic Messages">
    Mantle juga mengekspos rute Anthropic Messages yang membawa model Claude melalui jalur streaming terautentikasi bearer yang sama. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) dapat dipanggil melalui rute ini dengan streaming milik penyedia, sehingga token bearer AWS tidak diperlakukan seperti kunci API Anthropic.

    Saat Anda menyematkan model Anthropic Messages pada penyedia Mantle, OpenClaw menggunakan permukaan API `anthropic-messages` alih-alih `openai-completions` untuk model tersebut. Auth tetap berasal dari `AWS_BEARER_TOKEN_BEDROCK` (atau token bearer IAM yang diterbitkan).

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

  <Accordion title="Hubungan dengan penyedia Amazon Bedrock">
    Bedrock Mantle adalah penyedia terpisah dari penyedia
    [Amazon Bedrock](/id/providers/bedrock) standar. Mantle menggunakan permukaan
    `/v1` yang kompatibel dengan OpenAI, sedangkan penyedia Bedrock standar menggunakan
    API Bedrock native.

    Kedua penyedia berbagi kredensial `AWS_BEARER_TOKEN_BEDROCK` yang sama saat
    tersedia.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/id/providers/bedrock" icon="cloud">
    Penyedia Bedrock native untuk Anthropic Claude, Titan, dan model lainnya.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara menyelesaikannya.
  </Card>
</CardGroup>
