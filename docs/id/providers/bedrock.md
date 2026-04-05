---
read_when:
    - Anda ingin menggunakan model Amazon Bedrock dengan OpenClaw
    - Anda memerlukan penyiapan kredensial/region AWS untuk panggilan model
summary: Gunakan model Amazon Bedrock (Converse API) dengan OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T14:03:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw dapat menggunakan model **Amazon Bedrock** melalui provider streaming **Bedrock Converse**
milik pi‑ai. Auth Bedrock menggunakan **rantai kredensial default AWS SDK**,
bukan API key.

## Yang didukung pi-ai

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: kredensial AWS (env vars, config bersama, atau instance role)
- Region: `AWS_REGION` atau `AWS_DEFAULT_REGION` (default: `us-east-1`)

## Penemuan model otomatis

OpenClaw dapat secara otomatis menemukan model Bedrock yang mendukung **streaming**
dan **output teks**. Penemuan menggunakan `bedrock:ListFoundationModels` dan
`bedrock:ListInferenceProfiles`, dan hasilnya di-cache (default: 1 jam).

Cara provider implisit diaktifkan:

- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` adalah `true`,
  OpenClaw akan mencoba penemuan bahkan saat tidak ada penanda env AWS.
- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` tidak disetel,
  OpenClaw hanya menambahkan provider Bedrock implisit secara otomatis
  saat melihat salah satu penanda auth AWS ini:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, atau `AWS_PROFILE`.
- Jalur auth runtime Bedrock yang sebenarnya tetap menggunakan rantai default AWS SDK, sehingga
  config bersama, SSO, dan auth instance-role IMDS dapat berfungsi bahkan saat penemuan
  memerlukan `enabled: true` untuk opt-in.

Opsi config berada di bawah `plugins.entries.amazon-bedrock.config.discovery`:

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

Catatan:

- `enabled` secara default menggunakan mode otomatis. Dalam mode otomatis, OpenClaw hanya mengaktifkan
  provider Bedrock implisit saat melihat penanda env AWS yang didukung.
- `region` secara default menggunakan `AWS_REGION` atau `AWS_DEFAULT_REGION`, lalu `us-east-1`.
- `providerFilter` cocok dengan nama provider Bedrock (misalnya `anthropic`).
- `refreshInterval` dalam detik; setel ke `0` untuk menonaktifkan cache.
- `defaultContextWindow` (default: `32000`) dan `defaultMaxTokens` (default: `4096`)
  digunakan untuk model yang ditemukan (override jika Anda mengetahui batas model Anda).
- Untuk entri `models.providers["amazon-bedrock"]` yang eksplisit, OpenClaw tetap dapat
  me-resolve auth penanda env Bedrock lebih awal dari penanda env AWS seperti
  `AWS_BEARER_TOKEN_BEDROCK` tanpa memaksa pemuatan auth runtime penuh. Jalur
  auth panggilan model yang sebenarnya tetap menggunakan rantai default AWS SDK.

## Onboarding

1. Pastikan kredensial AWS tersedia pada **host gateway**:

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

2. Tambahkan provider dan model Bedrock ke config Anda (tidak memerlukan `apiKey`):

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

## Instance Role EC2

Saat menjalankan OpenClaw pada instance EC2 dengan IAM role terpasang, AWS SDK
dapat menggunakan instance metadata service (IMDS) untuk autentikasi. Untuk penemuan model
Bedrock, OpenClaw hanya mengaktifkan provider implisit secara otomatis dari penanda env AWS
kecuali jika Anda secara eksplisit menyetel
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Penyiapan yang direkomendasikan untuk host berbasis IMDS:

- Setel `plugins.entries.amazon-bedrock.config.discovery.enabled` ke `true`.
- Setel `plugins.entries.amazon-bedrock.config.discovery.region` (atau ekspor `AWS_REGION`).
- Anda **tidak** memerlukan API key palsu.
- Anda hanya memerlukan `AWS_PROFILE=default` jika secara khusus menginginkan penanda env
  untuk mode otomatis atau surface status.

```bash
# Direkomendasikan: aktifkan penemuan secara eksplisit + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Opsional: tambahkan penanda env jika Anda ingin mode otomatis tanpa aktivasi eksplisit
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Izin IAM yang diperlukan** untuk instance role EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (untuk penemuan otomatis)
- `bedrock:ListInferenceProfiles` (untuk penemuan inference profile)

Atau pasang managed policy `AmazonBedrockFullAccess`.

## Penyiapan cepat (jalur AWS)

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

# 2. Pasang ke instance EC2 Anda
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Pada instance EC2, aktifkan penemuan secara eksplisit
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opsional: tambahkan penanda env jika Anda ingin mode otomatis tanpa aktivasi eksplisit
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifikasi bahwa model ditemukan
openclaw models list
```

## Inference profile

OpenClaw menemukan **inference profile regional dan global** bersama
foundation model. Saat sebuah profile dipetakan ke foundation model yang dikenal, profile tersebut
mewarisi capability model itu (context window, max tokens,
reasoning, vision) dan region permintaan Bedrock yang benar disuntikkan
secara otomatis. Ini berarti profile Claude lintas region berfungsi tanpa override
provider manual.

ID inference profile terlihat seperti `us.anthropic.claude-opus-4-6-v1:0` (regional)
atau `anthropic.claude-opus-4-6-v1:0` (global). Jika model pendukungnya sudah ada
dalam hasil penemuan, profile tersebut mewarisi set capability lengkapnya;
jika tidak, default yang aman diterapkan.

Tidak diperlukan konfigurasi tambahan. Selama penemuan diaktifkan dan principal IAM
memiliki `bedrock:ListInferenceProfiles`, profile akan muncul bersama
foundation model di `openclaw models list`.

## Catatan

- Bedrock memerlukan **akses model** yang diaktifkan di akun/region AWS Anda.
- Penemuan otomatis memerlukan izin `bedrock:ListFoundationModels` dan
  `bedrock:ListInferenceProfiles`.
- Jika Anda mengandalkan mode otomatis, setel salah satu penanda env auth AWS yang didukung pada
  host gateway. Jika Anda lebih memilih auth IMDS/config bersama tanpa penanda env, setel
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw menampilkan sumber kredensial dalam urutan ini: `AWS_BEARER_TOKEN_BEDROCK`,
  lalu `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, lalu `AWS_PROFILE`, lalu
  rantai default AWS SDK.
- Dukungan reasoning bergantung pada model; periksa kartu model Bedrock untuk
  capability saat ini.
- Jika Anda lebih suka alur kunci terkelola, Anda juga dapat menempatkan proxy
  yang kompatibel dengan OpenAI di depan Bedrock dan mengonfigurasinya sebagai provider OpenAI.

## Guardrails

Anda dapat menerapkan [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
ke semua pemanggilan model Bedrock dengan menambahkan objek `guardrail` ke
config plugin `amazon-bedrock`. Guardrails memungkinkan Anda menerapkan pemfilteran konten,
penolakan topik, filter kata, filter informasi sensitif, dan pemeriksaan
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

- `guardrailIdentifier` (wajib) menerima ID guardrail (misalnya `abc123`) atau
  ARN lengkap (misalnya `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (wajib) menentukan versi terbitan mana yang akan digunakan, atau
  `"DRAFT"` untuk draf kerja.
- `streamProcessingMode` (opsional) mengontrol apakah evaluasi guardrail berjalan
  secara sinkron (`"sync"`) atau asinkron (`"async"`) selama streaming. Jika
  dihilangkan, Bedrock menggunakan perilaku default-nya.
- `trace` (opsional) mengaktifkan output jejak guardrail dalam respons API. Setel ke
  `"enabled"` atau `"enabled_full"` untuk debugging; hilangkan atau setel ke `"disabled"` untuk
  produksi.

Principal IAM yang digunakan oleh gateway harus memiliki izin `bedrock:ApplyGuardrail`
selain izin invoke standar.
