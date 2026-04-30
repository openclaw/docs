---
read_when:
    - Anda ingin menggunakan model Amazon Bedrock dengan OpenClaw
    - Anda memerlukan penyiapan kredensial/wilayah AWS untuk panggilan model
summary: Gunakan model Amazon Bedrock (Converse API) dengan OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T10:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw dapat menggunakan model **Amazon Bedrock** melalui penyedia streaming
**Bedrock Converse** milik pi-ai. Autentikasi Bedrock menggunakan **rantai
kredensial default AWS SDK**, bukan API key.

| Properti | Nilai                                                       |
| -------- | ----------------------------------------------------------- |
| Penyedia | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Autentikasi | Kredensial AWS (env vars, konfigurasi bersama, atau peran instans) |
| Wilayah   | `AWS_REGION` atau `AWS_DEFAULT_REGION` (default: `us-east-1`) |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Access keys / env vars">
    **Paling cocok untuk:** mesin pengembang, CI, atau host tempat Anda mengelola kredensial AWS secara langsung.

    <Steps>
      <Step title="Atur kredensial AWS di host gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Tambahkan penyedia Bedrock dan model ke konfigurasi Anda">
        Tidak diperlukan `apiKey`. Konfigurasikan penyedia dengan `auth: "aws-sdk"`:

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
    Dengan autentikasi penanda env (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, atau `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw otomatis mengaktifkan penyedia Bedrock implisit untuk penemuan model tanpa konfigurasi tambahan.
    </Tip>

  </Tab>

  <Tab title="Peran instans EC2 (IMDS)">
    **Paling cocok untuk:** instans EC2 dengan peran IAM terpasang, menggunakan layanan metadata instans untuk autentikasi.

    <Steps>
      <Step title="Aktifkan penemuan secara eksplisit">
        Saat menggunakan IMDS, OpenClaw tidak dapat mendeteksi autentikasi AWS hanya dari penanda env, jadi Anda harus memilih ikut serta:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opsional, tambahkan penanda env untuk mode otomatis">
        Jika Anda juga ingin jalur deteksi otomatis penanda env berfungsi (misalnya, untuk permukaan `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Anda **tidak** memerlukan API key palsu.
      </Step>
      <Step title="Verifikasi bahwa model ditemukan">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Peran IAM yang terpasang ke instans EC2 Anda harus memiliki izin berikut:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (untuk penemuan otomatis)
    - `bedrock:ListInferenceProfiles` (untuk penemuan profil inferensi)

    Atau pasang kebijakan terkelola `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Anda hanya memerlukan `AWS_PROFILE=default` jika secara khusus menginginkan penanda env untuk mode otomatis atau permukaan status. Jalur autentikasi runtime Bedrock yang sebenarnya menggunakan rantai default AWS SDK, sehingga autentikasi peran instans IMDS berfungsi bahkan tanpa penanda env.
    </Note>

  </Tab>
</Tabs>

## Penemuan model otomatis

OpenClaw dapat secara otomatis menemukan model Bedrock yang mendukung **streaming**
dan **output teks**. Penemuan menggunakan `bedrock:ListFoundationModels` dan
`bedrock:ListInferenceProfiles`, dan hasilnya di-cache (default: 1 jam).

Cara penyedia implisit diaktifkan:

- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` adalah `true`,
  OpenClaw akan mencoba penemuan bahkan ketika tidak ada penanda env AWS.
- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` belum diatur,
  OpenClaw hanya menambahkan otomatis
  penyedia Bedrock implisit ketika melihat salah satu penanda autentikasi AWS ini:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, atau `AWS_PROFILE`.
- Jalur autentikasi runtime Bedrock yang sebenarnya tetap menggunakan rantai default AWS SDK, sehingga
  konfigurasi bersama, SSO, dan autentikasi peran instans IMDS dapat berfungsi bahkan ketika penemuan
  memerlukan `enabled: true` untuk ikut serta.

<Note>
Untuk entri eksplisit `models.providers["amazon-bedrock"]`, OpenClaw masih dapat menyelesaikan autentikasi penanda env Bedrock lebih awal dari penanda env AWS seperti `AWS_BEARER_TOKEN_BEDROCK` tanpa memaksa pemuatan autentikasi runtime penuh. Jalur autentikasi panggilan model yang sebenarnya tetap menggunakan rantai default AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opsi konfigurasi penemuan">
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
    | ------ | ------- | ----------- |
    | `enabled` | otomatis | Dalam mode otomatis, OpenClaw hanya mengaktifkan penyedia Bedrock implisit ketika melihat penanda env AWS yang didukung. Atur ke `true` untuk memaksa penemuan. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Wilayah AWS yang digunakan untuk panggilan API penemuan. |
    | `providerFilter` | (semua) | Mencocokkan nama penyedia Bedrock (misalnya `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durasi cache dalam detik. Atur ke `0` untuk menonaktifkan caching. |
    | `defaultContextWindow` | `32000` | Jendela konteks yang digunakan untuk model yang ditemukan (timpa jika Anda mengetahui batas model Anda). |
    | `defaultMaxTokens` | `4096` | Token output maksimum yang digunakan untuk model yang ditemukan (timpa jika Anda mengetahui batas model Anda). |

  </Accordion>
</AccordionGroup>

## Penyiapan cepat (jalur AWS)

Panduan ini membuat peran IAM, memasang izin Bedrock, mengaitkan
profil instans, dan mengaktifkan penemuan OpenClaw di host EC2.

```bash
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Profil inferensi">
    OpenClaw menemukan **profil inferensi regional dan global** bersama
    model foundation. Ketika sebuah profil dipetakan ke model foundation yang dikenal,
    profil tersebut mewarisi kapabilitas model itu (jendela konteks, token maksimum,
    reasoning, vision) dan wilayah permintaan Bedrock yang benar disuntikkan
    secara otomatis. Ini berarti profil Claude lintas wilayah berfungsi tanpa
    penggantian penyedia manual.

    ID profil inferensi terlihat seperti `us.anthropic.claude-opus-4-6-v1:0` (regional)
    atau `anthropic.claude-opus-4-6-v1:0` (global). Jika model pendukung sudah
    ada dalam hasil penemuan, profil mewarisi seluruh set kapabilitasnya;
    jika tidak, default yang aman diterapkan.

    Tidak diperlukan konfigurasi tambahan. Selama penemuan diaktifkan dan principal IAM
    memiliki `bedrock:ListInferenceProfiles`, profil muncul bersama
    model foundation di `openclaw models list`.

  </Accordion>

  <Accordion title="Suhu Claude Opus 4.7">
    Bedrock menolak parameter `temperature` untuk Claude Opus 4.7. OpenClaw
    menghilangkan `temperature` secara otomatis untuk setiap referensi Bedrock Opus 4.7, termasuk
    ID model foundation, profil inferensi bernama, profil inferensi aplikasi
    yang model dasarnya diselesaikan ke Opus 4.7 melalui
    `bedrock:GetInferenceProfile`, dan varian bertitik `opus-4.7` dengan
    prefiks wilayah opsional (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Tidak diperlukan pengaturan konfigurasi, dan penghilangan ini berlaku untuk
    objek opsi permintaan maupun kolom payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Guardrails">
    Anda dapat menerapkan [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ke semua pemanggilan model Bedrock dengan menambahkan objek `guardrail` ke
    konfigurasi Plugin `amazon-bedrock`. Guardrails memungkinkan Anda menerapkan penyaringan konten,
    penolakan topik, filter kata, filter informasi sensitif, dan pemeriksaan
    grounding kontekstual.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opsi | Wajib | Deskripsi |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Ya | ID Guardrail (mis. `abc123`) atau ARN lengkap (mis. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ya | Nomor versi yang diterbitkan, atau `"DRAFT"` untuk draf kerja. |
    | `streamProcessingMode` | Tidak | `"sync"` atau `"async"` untuk evaluasi guardrail selama streaming. Jika dihilangkan, Bedrock menggunakan default-nya. |
    | `trace` | Tidak | `"enabled"` atau `"enabled_full"` untuk debugging; hilangkan atau atur `"disabled"` untuk produksi. |

    <Warning>
    Principal IAM yang digunakan oleh gateway harus memiliki izin `bedrock:ApplyGuardrail` selain izin pemanggilan standar.
    </Warning>

  </Accordion>

  <Accordion title="Embedding untuk pencarian memori">
    Bedrock juga dapat berfungsi sebagai penyedia embedding untuk
    [pencarian memori](/id/concepts/memory-search). Ini dikonfigurasi secara terpisah dari
    penyedia inferensi -- atur `agents.defaults.memorySearch.provider` ke `"bedrock"`:

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

    Embedding Bedrock menggunakan rantai kredensial AWS SDK yang sama dengan inferensi (peran
    instans, SSO, kunci akses, konfigurasi bersama, dan identitas web). Tidak diperlukan kunci
    API. Saat `provider` bernilai `"auto"`, Bedrock terdeteksi otomatis jika
    rantai kredensial tersebut berhasil di-resolve.

    Model embedding yang didukung mencakup Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), dan TwelveLabs Marengo. Lihat
    [Referensi konfigurasi memori -- Bedrock](/id/reference/memory-config#bedrock-embedding-config)
    untuk daftar model lengkap dan opsi dimensi.

  </Accordion>

  <Accordion title="Catatan dan peringatan">
    - Bedrock memerlukan **akses model** yang diaktifkan di akun/wilayah AWS Anda.
    - Penemuan otomatis memerlukan izin `bedrock:ListFoundationModels` dan
      `bedrock:ListInferenceProfiles`.
    - Jika Anda mengandalkan mode otomatis, atur salah satu penanda env autentikasi AWS yang didukung pada
      host gateway. Jika Anda lebih memilih autentikasi IMDS/konfigurasi-bersama tanpa penanda env, atur
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw menampilkan sumber kredensial dalam urutan ini: `AWS_BEARER_TOKEN_BEDROCK`,
      lalu `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, lalu `AWS_PROFILE`, lalu
      rantai AWS SDK default.
    - Dukungan penalaran bergantung pada model; periksa kartu model Bedrock untuk
      kemampuan saat ini.
    - Jika Anda lebih memilih alur kunci terkelola, Anda juga dapat menempatkan proxy yang kompatibel dengan OpenAI
      di depan Bedrock dan mengonfigurasinya sebagai penyedia OpenAI sebagai gantinya.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pencarian memori" href="/id/concepts/memory-search" icon="magnifying-glass">
    Embedding Bedrock untuk konfigurasi pencarian memori.
  </Card>
  <Card title="Referensi konfigurasi memori" href="/id/reference/memory-config#bedrock-embedding-config" icon="database">
    Daftar lengkap model embedding Bedrock dan opsi dimensi.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
