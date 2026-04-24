---
read_when:
    - Anda ingin menggunakan model Amazon Bedrock dengan OpenClaw
    - Anda memerlukan penyiapan kredensial/region AWS untuk panggilan model
summary: Gunakan model Amazon Bedrock (Converse API) dengan OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T09:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw dapat menggunakan model **Amazon Bedrock** melalui provider streaming **Bedrock Converse**
milik pi-ai. Autentikasi Bedrock menggunakan **rantai kredensial default AWS SDK**,
bukan API key.

| Properti | Nilai                                                      |
| -------- | ---------------------------------------------------------- |
| Provider | `amazon-bedrock`                                           |
| API      | `bedrock-converse-stream`                                  |
| Auth     | Kredensial AWS (env vars, shared config, atau instance role) |
| Region   | `AWS_REGION` atau `AWS_DEFAULT_REGION` (default: `us-east-1`) |

## Mulai menggunakan

Pilih metode autentikasi yang Anda sukai dan ikuti langkah setup.

<Tabs>
  <Tab title="Access key / env vars">
    **Terbaik untuk:** mesin developer, CI, atau host tempat Anda mengelola kredensial AWS secara langsung.

    <Steps>
      <Step title="Setel kredensial AWS di host gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Opsional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Opsional (API key/token bearer Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Tambahkan provider dan model Bedrock ke konfigurasi Anda">
        Tidak diperlukan `apiKey`. Konfigurasikan provider dengan `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Dengan autentikasi env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, atau `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw otomatis mengaktifkan provider Bedrock implisit untuk penemuan model tanpa konfigurasi tambahan.
    </Tip>

  </Tab>

  <Tab title="Role instance EC2 (IMDS)">
    **Terbaik untuk:** instance EC2 dengan IAM role yang terpasang, menggunakan layanan metadata instance untuk autentikasi.

    <Steps>
      <Step title="Aktifkan discovery secara eksplisit">
        Saat menggunakan IMDS, OpenClaw tidak dapat mendeteksi autentikasi AWS hanya dari env marker, jadi Anda harus melakukan opt-in:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opsional tambahkan env marker untuk mode auto">
        Jika Anda juga ingin jalur auto-detection env-marker berfungsi (misalnya, untuk permukaan `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Anda **tidak** memerlukan API key palsu.
      </Step>
      <Step title="Verifikasi model ditemukan">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    IAM role yang terpasang pada instance EC2 Anda harus memiliki izin berikut:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (untuk discovery otomatis)
    - `bedrock:ListInferenceProfiles` (untuk discovery inference profile)

    Atau lampirkan managed policy `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Anda hanya memerlukan `AWS_PROFILE=default` jika secara khusus menginginkan env marker untuk mode auto atau permukaan status. Jalur autentikasi runtime Bedrock yang sebenarnya menggunakan rantai default AWS SDK, jadi autentikasi instance-role IMDS tetap berfungsi meskipun tanpa env marker.
    </Note>

  </Tab>
</Tabs>

## Discovery model otomatis

OpenClaw dapat secara otomatis menemukan model Bedrock yang mendukung **streaming**
dan **text output**. Discovery menggunakan `bedrock:ListFoundationModels` dan
`bedrock:ListInferenceProfiles`, dan hasilnya di-cache (default: 1 jam).

Cara provider implisit diaktifkan:

- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` adalah `true`,
  OpenClaw akan mencoba discovery meskipun tidak ada env marker AWS.
- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` tidak diatur,
  OpenClaw hanya akan menambahkan
  provider Bedrock implisit secara otomatis ketika melihat salah satu marker auth AWS ini:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, atau `AWS_PROFILE`.
- Jalur autentikasi runtime Bedrock yang sebenarnya tetap menggunakan rantai default AWS SDK, jadi
  shared config, SSO, dan autentikasi instance-role IMDS dapat tetap berfungsi meskipun discovery
  memerlukan `enabled: true` untuk opt in.

<Note>
Untuk entri `models.providers["amazon-bedrock"]` eksplisit, OpenClaw tetap dapat menyelesaikan autentikasi env-marker Bedrock lebih awal dari marker env AWS seperti `AWS_BEARER_TOKEN_BEDROCK` tanpa memaksa pemuatan autentikasi runtime penuh. Jalur autentikasi panggilan model yang sebenarnya tetap menggunakan rantai default AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opsi konfigurasi discovery">
    Opsi konfigurasi berada di bawah `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Opsi | Default | Deskripsi |
    | ---- | ------- | --------- |
    | `enabled` | auto | Dalam mode auto, OpenClaw hanya mengaktifkan provider Bedrock implisit ketika melihat marker env AWS yang didukung. Setel `true` untuk memaksa discovery. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Region AWS yang digunakan untuk panggilan API discovery. |
    | `providerFilter` | (semua) | Cocok dengan nama provider Bedrock (misalnya `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durasi cache dalam detik. Setel ke `0` untuk menonaktifkan cache. |
    | `defaultContextWindow` | `32000` | Context window yang digunakan untuk model yang ditemukan (override jika Anda mengetahui batas model Anda). |
    | `defaultMaxTokens` | `4096` | Max output token yang digunakan untuk model yang ditemukan (override jika Anda mengetahui batas model Anda). |

  </Accordion>
</AccordionGroup>

## Setup cepat (jalur AWS)

Panduan ini membuat IAM role, melampirkan izin Bedrock, mengaitkan
instance profile, dan mengaktifkan discovery OpenClaw di host EC2.

```bash
# 1. Buat IAM role dan instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Lampirkan ke instance EC2 Anda
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Di instance EC2, aktifkan discovery secara eksplisit
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opsional: tambahkan env marker jika Anda menginginkan mode auto tanpa explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifikasi model ditemukan
openclaw models list
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Inference profile">
    OpenClaw menemukan **inference profile regional dan global** bersama
    foundation model. Ketika sebuah profile dipetakan ke foundation model yang dikenal, profile tersebut
    mewarisi kapabilitas model tersebut (context window, max tokens,
    reasoning, vision) dan region permintaan Bedrock yang benar disuntikkan
    secara otomatis. Ini berarti profile Claude lintas region berfungsi tanpa override
    provider manual.

    ID inference profile terlihat seperti `us.anthropic.claude-opus-4-6-v1:0` (regional)
    atau `anthropic.claude-opus-4-6-v1:0` (global). Jika model pendukungnya sudah
    ada dalam hasil discovery, profile akan mewarisi set kapabilitas penuhnya;
    jika tidak, default aman akan diterapkan.

    Tidak diperlukan konfigurasi tambahan. Selama discovery diaktifkan dan principal IAM
    memiliki `bedrock:ListInferenceProfiles`, profile muncul bersama
    foundation model di `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrail">
    Anda dapat menerapkan [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ke semua pemanggilan model Bedrock dengan menambahkan objek `guardrail` ke
    konfigurasi plugin `amazon-bedrock`. Guardrail memungkinkan Anda menegakkan content filtering,
    topic denial, word filter, filter informasi sensitif, dan pemeriksaan
    contextual grounding.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID guardrail atau ARN lengkap
                guardrailVersion: "1", // nomor versi atau "DRAFT"
                streamProcessingMode: "sync", // opsional: "sync" atau "async"
                trace: "enabled", // opsional: "enabled", "disabled", atau "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opsi | Wajib | Deskripsi |
    | ---- | ----- | --------- |
    | `guardrailIdentifier` | Ya | ID guardrail (mis. `abc123`) atau ARN lengkap (mis. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ya | Nomor versi yang dipublikasikan, atau `"DRAFT"` untuk draf kerja. |
    | `streamProcessingMode` | Tidak | `"sync"` atau `"async"` untuk evaluasi guardrail selama streaming. Jika dihilangkan, Bedrock menggunakan default-nya. |
    | `trace` | Tidak | `"enabled"` atau `"enabled_full"` untuk debugging; hilangkan atau setel `"disabled"` untuk produksi. |

    <Warning>
    Principal IAM yang digunakan oleh gateway harus memiliki izin `bedrock:ApplyGuardrail` selain izin invoke standar.
    </Warning>

  </Accordion>

  <Accordion title="Embedding untuk memory search">
    Bedrock juga dapat berfungsi sebagai provider embedding untuk
    [memory search](/id/concepts/memory-search). Ini dikonfigurasi terpisah dari
    provider inference -- setel `agents.defaults.memorySearch.provider` ke `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Embedding Bedrock menggunakan rantai kredensial AWS SDK yang sama seperti inference (instance
    role, SSO, access key, shared config, dan web identity). Tidak diperlukan
    API key. Ketika `provider` adalah `"auto"`, Bedrock terdeteksi otomatis jika
    rantai kredensial tersebut berhasil diselesaikan.

    Model embedding yang didukung mencakup Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), dan TwelveLabs Marengo. Lihat
    [Referensi konfigurasi Memory -- Bedrock](/id/reference/memory-config#bedrock-embedding-config)
    untuk daftar model lengkap dan opsi dimensi.

  </Accordion>

  <Accordion title="Catatan dan hal yang perlu diperhatikan">
    - Bedrock memerlukan **akses model** yang diaktifkan di akun/region AWS Anda.
    - Discovery otomatis memerlukan izin `bedrock:ListFoundationModels` dan
      `bedrock:ListInferenceProfiles`.
    - Jika Anda mengandalkan mode auto, setel salah satu auth env marker AWS yang didukung di
      host gateway. Jika Anda lebih memilih autentikasi IMDS/shared-config tanpa env marker, setel
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw menampilkan sumber kredensial dalam urutan ini: `AWS_BEARER_TOKEN_BEDROCK`,
      lalu `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, lalu `AWS_PROFILE`, lalu
      rantai default AWS SDK.
    - Dukungan reasoning bergantung pada model; periksa kartu model Bedrock untuk
      kapabilitas terkini.
    - Jika Anda lebih memilih alur managed key, Anda juga dapat menempatkan proxy
      yang kompatibel dengan OpenAI di depan Bedrock dan mengonfigurasinya sebagai provider OpenAI.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Memory search" href="/id/concepts/memory-search" icon="magnifying-glass">
    Konfigurasi embedding Bedrock untuk memory search.
  </Card>
  <Card title="Referensi konfigurasi Memory" href="/id/reference/memory-config#bedrock-embedding-config" icon="database">
    Daftar lengkap model embedding Bedrock dan opsi dimensi.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
