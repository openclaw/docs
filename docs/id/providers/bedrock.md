---
read_when:
    - Anda ingin menggunakan model Amazon Bedrock dengan OpenClaw
    - Anda perlu menyiapkan kredensial/wilayah AWS untuk panggilan model
summary: Gunakan model Amazon Bedrock (Converse API) dengan OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T14:35:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw dapat menggunakan model **Amazon Bedrock** melalui penyedia streaming **Bedrock Converse**. Autentikasi Bedrock menggunakan **rantai kredensial default AWS SDK**, bukan kunci API.

| Properti | Nilai                                                               |
| -------- | ------------------------------------------------------------------- |
| Penyedia | `amazon-bedrock`                                                    |
| API      | `bedrock-converse-stream`                                           |
| Autentikasi | Kredensial AWS (variabel lingkungan, konfigurasi bersama, atau peran instans) |
| Wilayah  | `AWS_REGION` atau `AWS_DEFAULT_REGION` (default: `us-east-1`)        |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Kunci akses / variabel lingkungan">
    **Paling sesuai untuk:** mesin pengembang, CI, atau host tempat Anda mengelola kredensial AWS secara langsung.

    <Steps>
      <Step title="Tetapkan kredensial AWS pada host Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Opsional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Opsional (kunci API/token bearer Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Tambahkan penyedia dan model Bedrock ke konfigurasi Anda">
        `apiKey` tidak diperlukan. Konfigurasikan penyedia dengan `auth: "aws-sdk"`:

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
    Dengan autentikasi penanda lingkungan (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, atau `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw secara otomatis mengaktifkan penyedia Bedrock implisit untuk penemuan model tanpa konfigurasi tambahan.
    </Tip>

  </Tab>

  <Tab title="Peran instans EC2 (IMDS)">
    **Paling sesuai untuk:** instans EC2 dengan peran IAM terpasang yang menggunakan layanan metadata instans untuk autentikasi.

    <Steps>
      <Step title="Aktifkan penemuan secara eksplisit">
        Saat menggunakan IMDS, OpenClaw tidak dapat mendeteksi autentikasi AWS hanya dari penanda lingkungan sehingga Anda harus mengaktifkannya:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Tambahkan penanda lingkungan untuk mode otomatis secara opsional">
        Jika Anda juga ingin jalur deteksi otomatis penanda lingkungan berfungsi (misalnya, untuk tampilan `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Anda **tidak** memerlukan kunci API palsu.
      </Step>
      <Step title="Verifikasi bahwa model ditemukan">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Peran IAM yang terpasang pada instans EC2 Anda harus memiliki izin berikut:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (untuk penemuan otomatis)
    - `bedrock:ListInferenceProfiles` (untuk penemuan profil inferensi)

    Atau pasang kebijakan terkelola `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Anda hanya memerlukan `AWS_PROFILE=default` jika secara khusus menginginkan penanda lingkungan untuk mode otomatis atau tampilan status. Jalur autentikasi runtime Bedrock yang sebenarnya menggunakan rantai default AWS SDK, sehingga autentikasi peran instans IMDS tetap berfungsi meskipun tanpa penanda lingkungan.
    </Note>

  </Tab>
</Tabs>

## Penemuan model otomatis

OpenClaw dapat secara otomatis menemukan model Bedrock yang mendukung **streaming**
dan **keluaran teks**. Penemuan menggunakan `bedrock:ListFoundationModels` dan
`bedrock:ListInferenceProfiles`, serta hasilnya disimpan dalam cache (default: 1 jam).

Cara penyedia implisit diaktifkan:

- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` bernilai `true`,
  OpenClaw akan mencoba melakukan penemuan meskipun tidak ada penanda lingkungan AWS.
- Jika `plugins.entries.amazon-bedrock.config.discovery.enabled` tidak ditetapkan,
  OpenClaw hanya menambahkan secara otomatis
  penyedia Bedrock implisit ketika mendeteksi salah satu penanda autentikasi AWS berikut:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, atau `AWS_PROFILE`.
- Jalur autentikasi runtime Bedrock yang sebenarnya tetap menggunakan rantai default AWS SDK, sehingga
  konfigurasi bersama, SSO, dan autentikasi peran instans IMDS dapat berfungsi meskipun penemuan
  memerlukan `enabled: true` untuk diaktifkan.

<Note>
Untuk entri `models.providers["amazon-bedrock"]` yang eksplisit, OpenClaw tetap dapat menyelesaikan autentikasi penanda lingkungan Bedrock lebih awal dari penanda lingkungan AWS seperti `AWS_BEARER_TOKEN_BEDROCK` tanpa memaksa pemuatan autentikasi runtime secara penuh. Jalur autentikasi pemanggilan model yang sebenarnya tetap menggunakan rantai default AWS SDK.
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
    | ---- | ------- | --------- |
    | `enabled` | otomatis | Dalam mode otomatis, OpenClaw hanya mengaktifkan penyedia Bedrock implisit ketika mendeteksi penanda lingkungan AWS yang didukung. Tetapkan ke `true` untuk memaksakan penemuan. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Wilayah AWS yang digunakan untuk panggilan API penemuan. |
    | `providerFilter` | (semua) | Mencocokkan nama penyedia Bedrock (misalnya `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durasi cache dalam detik. Tetapkan ke `0` untuk menonaktifkan caching. |
    | `defaultContextWindow` | `32000` | Jendela konteks yang digunakan untuk model yang ditemukan tanpa batas token yang diketahui (timpa jika Anda mengetahui batas model Anda). |
    | `defaultMaxTokens` | `4096` | Token keluaran maksimum yang digunakan untuk model yang ditemukan tanpa batas token yang diketahui (timpa jika Anda mengetahui batas model Anda). |

  </Accordion>

  <Accordion title="Jendela konteks dan batas token maksimum">
    API Bedrock `ListFoundationModels` dan `GetFoundationModel` tidak mengembalikan
    metadata batas token, hanya ID model, nama, modalitas, dan status
    siklus hidup. OpenClaw menyertakan tabel pencarian jendela konteks dan batas
    keluaran yang diketahui untuk model Bedrock populer (Claude, Nova, Llama, Mistral, DeepSeek,
    dan lainnya), sehingga pengelolaan sesi, ambang batas Compaction, dan
    deteksi luapan konteks berfungsi dengan benar untuk model tersebut.

    Model yang ditemukan tetapi tidak tercantum dalam tabel akan menggunakan `defaultContextWindow`
    dan `defaultMaxTokens`. Jika model yang Anda gunakan tidak memiliki batas yang akurat,
    timpa dengan entri
    `models.providers["amazon-bedrock"].models` yang eksplisit.

  </Accordion>
</AccordionGroup>

## Penyiapan cepat (jalur AWS)

Panduan ini membuat peran IAM, memasang izin Bedrock, mengaitkan
profil instans, dan mengaktifkan penemuan OpenClaw pada host EC2.

```bash
# 1. Buat peran IAM dan profil instans
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

# 2. Pasang pada instans EC2 Anda
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Pada instans EC2, aktifkan penemuan secara eksplisit
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opsional: tambahkan penanda lingkungan jika Anda menginginkan mode otomatis tanpa pengaktifan eksplisit
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifikasi bahwa model ditemukan
openclaw models list
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Profil inferensi">
    OpenClaw menemukan **profil inferensi regional dan global** bersama
    model dasar. Ketika suatu profil dipetakan ke model dasar yang diketahui,
    profil tersebut mewarisi kemampuan model itu (jendela konteks, token maksimum,
    penalaran, visi), dan wilayah permintaan Bedrock yang benar disisipkan
    secara otomatis. Artinya, profil Claude lintas wilayah berfungsi tanpa
    penimpaan penyedia secara manual. Profil lintas wilayah global (`global.*`) dicantumkan
    lebih dahulu di `openclaw models list` karena umumnya menawarkan kapasitas lebih baik
    dan failover otomatis.

    ID profil inferensi tampak seperti `us.anthropic.claude-opus-4-6-v1:0` (regional)
    atau `anthropic.claude-opus-4-6-v1:0` (global). Jika model pendukungnya sudah
    ada dalam hasil penemuan, profil mewarisi seluruh rangkaian kemampuannya;
    jika tidak, default yang aman akan diterapkan.

    Tidak diperlukan konfigurasi tambahan. Selama penemuan diaktifkan dan prinsipal IAM
    memiliki `bedrock:ListInferenceProfiles`, profil akan muncul bersama
    model dasar di `openclaw models list`.

  </Accordion>

  <Accordion title="Tingkat layanan">
    Beberapa model Bedrock mendukung parameter `service_tier` untuk mengoptimalkan biaya
    atau latensi. Tingkat berikut tersedia:

    | Tingkat | Deskripsi |
    |---------|-----------|
    | `default` | Tingkat Bedrock standar |
    | `flex` | Pemrosesan dengan diskon untuk beban kerja yang dapat menoleransi latensi lebih lama |
    | `priority` | Pemrosesan yang diprioritaskan untuk beban kerja yang sensitif terhadap latensi |
    | `reserved` | Kapasitas yang dicadangkan untuk beban kerja kondisi stabil |

    Tetapkan `serviceTier` (atau `service_tier`) melalui `agents.defaults.params` untuk
    permintaan model Bedrock, atau per model di
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // diterapkan ke semua model
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // penimpaan per model
              },
            },
          },
        },
      },
    }
    ```

    Nilai yang valid adalah `default`, `flex`, `priority`, dan `reserved`. Claude
    Fable 5 dan Sonnet 5 hanya mendukung tingkat `default`; OpenClaw memberikan
    peringatan dan mengabaikan `flex`, `priority`, atau `reserved` yang diminta
    untuk model tersebut. Untuk model lain, tidak setiap model mendukung setiap
    tingkat -- tingkat yang tidak didukung akan menghasilkan kesalahan validasi
    Bedrock, dan pesan kesalahannya dapat menyesatkan (misalnya "The provided
    model identifier is invalid", alih-alih menyebutkan bahwa tingkat tersebut
    adalah masalahnya). Jika Anda melihat kesalahan ini, periksa apakah model
    mendukung tingkat yang diminta.

  </Accordion>

  <Accordion title="Temperatur Claude Opus 4.7 dan 4.8">
    Bedrock menolak parameter `temperature` untuk Claude Opus 4.7 dan Opus
    4.8. OpenClaw secara otomatis menghilangkan `temperature` untuk setiap
    referensi Bedrock yang cocok, termasuk ID model fondasi, profil inferensi
    bernama, profil inferensi aplikasi yang model dasarnya diresolusi menjadi
    Opus 4.7/4.8 melalui `bedrock:GetInferenceProfile`, dan varian bertitik
    `opus-4.7`/`opus-4.8` dengan awalan wilayah opsional (`us.`, `eu.`, `ap.`,
    `apac.`, `au.`, `jp.`, `global.`). Tidak diperlukan opsi konfigurasi, dan
    penghilangan ini berlaku baik untuk objek opsi permintaan maupun kolom
    muatan `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Gunakan `amazon-bedrock/anthropic.claude-fable-5` di `us-east-1`, atau ID
    inferensi regional seperti `us.anthropic.claude-fable-5`.
    OpenClaw menerapkan jendela konteks 1 juta milik Fable, batas keluaran 128
    ribu, pemikiran adaptif yang selalu aktif, dan pemetaan tingkat upaya yang
    didukung. `/think off` dan `/think minimal` dipetakan ke `low`; kontrol
    temperatur dan pemilihan alat secara paksa dihilangkan, sesuai dengan rute
    Opus 4.7/4.8. Keluaran streaming ditahan hingga Bedrock mengembalikan status
    terminal agar penolakan di tengah streaming tidak mengekspos teks parsial.

    AWS mewajibkan persetujuan eksplisit retensi data `provider_data_share`
    sebelum Fable tersedia. Prompt dan penyelesaian dibagikan kepada Anthropic
    dan disimpan hingga 30 hari untuk tujuan kepercayaan dan keamanan. Tinjau
    dan konfigurasikan [retensi data Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    sebelum mengaktifkan model.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 tersedia melalui Bedrock hanya untuk akun yang memiliki
    persetujuan akses terbatas yang diperlukan. OpenClaw mengenali model
    fondasi `anthropic.claude-mythos-5` serta profil inferensi regional atau
    global seperti `us.anthropic.claude-mythos-5`.

    OpenClaw menerapkan jendela konteks 1.000.000 token, batas keluaran 128.000
    token, masukan gambar, caching prompt, streaming yang aman terhadap
    penolakan, dan tingkat upaya bawaan. Pemikiran adaptif selalu diaktifkan:
    `/think off` dan `/think minimal` dipetakan ke `low`, sedangkan `xhigh` dan
    `max` tetap tersedia. Nilai sampling khusus dan pemilihan alat secara paksa
    dihilangkan.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS mendokumentasikan Sonnet 5 untuk endpoint
    [`bedrock-runtime` dan `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw mengenali model fondasi Bedrock
    `anthropic.claude-sonnet-5` serta profil inferensi regional atau global
    seperti `us.anthropic.claude-sonnet-5`. OpenClaw menerapkan jendela konteks
    1.000.000 token, batas keluaran 128.000 token, masukan gambar, tingkat upaya
    bawaan, caching prompt, dan streaming yang aman terhadap penolakan.

    Bedrock mempertahankan pemikiran adaptif tetap aktif untuk Sonnet 5.
    OpenClaw menggunakan `high` secara default; `/think off` dan
    `/think minimal` dipetakan ke `low` karena rute ini tidak dapat
    menonaktifkan pemikiran. Nilai temperatur khusus dan pemilihan alat secara
    paksa dihilangkan saat pemikiran adaptif aktif.

  </Accordion>

  <Accordion title="Pagar pengaman">
    Anda dapat menerapkan [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    ke semua pemanggilan model Bedrock dengan menambahkan objek `guardrail` ke
    konfigurasi Plugin `amazon-bedrock`. Pagar pengaman memungkinkan Anda
    menerapkan pemfilteran konten, penolakan topik, filter kata, filter informasi
    sensitif, dan pemeriksaan landasan kontekstual.

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

    `guardrailIdentifier` dan `guardrailVersion` wajib diisi.

    | Opsi | Deskripsi |
    | ------ | ----------- |
    | `guardrailIdentifier` | ID pagar pengaman (misalnya `abc123`) atau ARN lengkap (misalnya `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Nomor versi yang dipublikasikan, atau `"DRAFT"` untuk draf yang sedang dikerjakan. |
    | `streamProcessingMode` | `"sync"` atau `"async"` untuk evaluasi pagar pengaman selama streaming. Jika dihilangkan, Bedrock menggunakan nilai default-nya. |
    | `trace` | `"enabled"` atau `"enabled_full"` untuk debugging; hilangkan atau tetapkan `"disabled"` untuk produksi. |

    <Warning>
    Prinsipal IAM yang digunakan oleh Gateway harus memiliki izin `bedrock:ApplyGuardrail` selain izin pemanggilan standar.
    </Warning>

  </Accordion>

  <Accordion title="Embedding untuk pencarian memori">
    Bedrock juga dapat berfungsi sebagai penyedia embedding untuk
    [pencarian memori](/id/concepts/memory-search). Ini dikonfigurasikan secara terpisah dari
    penyedia inferensi -- tetapkan `agents.defaults.memorySearch.provider` ke `"bedrock"`:

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

    Embedding Bedrock menggunakan rantai kredensial AWS SDK yang sama dengan
    inferensi (peran instans, SSO, kunci akses, konfigurasi bersama, dan identitas
    web). Tidak diperlukan kunci API.

    Model embedding yang didukung mencakup Amazon Titan Embed (v1, v2), Amazon
    Nova Embed, Cohere Embed (v3, v4), dan TwelveLabs Marengo. Lihat
    [Referensi konfigurasi memori -- Bedrock](/id/reference/memory-config#bedrock-embedding-config)
    untuk daftar lengkap model dan opsi dimensi.

  </Accordion>

  <Accordion title="Catatan dan batasan">
    - Bedrock memerlukan **akses model** yang diaktifkan di akun/wilayah AWS Anda.
    - Penemuan otomatis memerlukan izin `bedrock:ListFoundationModels` dan
      `bedrock:ListInferenceProfiles`.
    - Jika Anda mengandalkan mode otomatis, tetapkan salah satu penanda env
      autentikasi AWS yang didukung pada host Gateway. Jika Anda lebih memilih
      autentikasi IMDS/konfigurasi bersama tanpa penanda env, tetapkan
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw menampilkan sumber kredensial dalam urutan berikut:
      `AWS_BEARER_TOKEN_BEDROCK`, lalu `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, lalu `AWS_PROFILE`, kemudian rantai AWS SDK
      default.
    - Dukungan penalaran bergantung pada model; periksa kartu model Bedrock
      untuk kemampuan terkini.
    - Jika Anda lebih memilih alur kunci terkelola, Anda juga dapat menempatkan
      proksi yang kompatibel dengan OpenAI di depan Bedrock dan
      mengonfigurasikannya sebagai penyedia OpenAI.
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
    Pemecahan masalah umum dan pertanyaan yang sering diajukan.
  </Card>
</CardGroup>
