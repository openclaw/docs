---
read_when:
    - Anda ingin menggunakan model OSS yang dihosting Bedrock Mantle dengan OpenClaw
    - Anda memerlukan endpoint Mantle yang kompatibel dengan OpenAI untuk GPT-OSS, Qwen, Kimi, atau GLM
    - Anda ingin menggunakan Claude Sonnet 5 atau Mythos 5 melalui Amazon Bedrock Mantle
summary: Gunakan model Amazon Bedrock Mantle yang kompatibel dengan OpenAI dan Claude Messages bersama OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T14:31:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw menyertakan penyedia **Amazon Bedrock Mantle** bawaan yang terhubung ke
endpoint Mantle yang kompatibel dengan OpenAI. Mantle menghosting model sumber terbuka dan
pihak ketiga (GPT-OSS, Qwen, Kimi, GLM, dan sejenisnya) melalui antarmuka standar
`/v1/chat/completions` yang didukung oleh infrastruktur Bedrock. Mantle juga
menyediakan model Anthropic Claude melalui rute Anthropic Messages.

| Properti        | Nilai                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| ID penyedia     | `amazon-bedrock-mantle`                                                                           |
| API             | `openai-completions` untuk model OSS yang ditemukan, `anthropic-messages` untuk model Claude      |
| Autentikasi     | `AWS_BEARER_TOKEN_BEDROCK` eksplisit atau pembuatan token pembawa melalui rantai kredensial IAM    |
| Wilayah default | `us-east-1` (ganti dengan `AWS_REGION` atau `AWS_DEFAULT_REGION`)                                  |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Token pembawa eksplisit">
    **Paling cocok untuk:** lingkungan tempat Anda sudah memiliki token pembawa Mantle.

    <Steps>
      <Step title="Tetapkan token pembawa pada host Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Tetapkan wilayah jika diperlukan (default-nya `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifikasi bahwa model ditemukan">
        ```bash
        openclaw models list
        ```

        Model yang ditemukan muncul di bawah penyedia `amazon-bedrock-mantle`. Tidak
        diperlukan konfigurasi tambahan kecuali jika Anda ingin mengganti nilai default.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Kredensial IAM">
    **Paling cocok untuk:** menggunakan kredensial yang kompatibel dengan AWS SDK (konfigurasi bersama, SSO, identitas web, serta peran instans atau tugas).

    <Steps>
      <Step title="Konfigurasikan kredensial AWS pada host Gateway">
        Semua sumber autentikasi yang kompatibel dengan AWS SDK dapat digunakan:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifikasi bahwa model ditemukan">
        ```bash
        openclaw models list
        ```

        OpenClaw secara otomatis menghasilkan token pembawa Mantle dari rantai kredensial.
      </Step>
    </Steps>

    <Tip>
    Saat `AWS_BEARER_TOKEN_BEDROCK` tidak ditetapkan, OpenClaw membuat token pembawa untuk Anda dari rantai kredensial default AWS, termasuk kredensial/profil konfigurasi bersama, SSO, identitas web, serta peran instans atau tugas.
    </Tip>

  </Tab>
</Tabs>

## Penemuan model otomatis

Saat `AWS_BEARER_TOKEN_BEDROCK` ditetapkan, OpenClaw menggunakannya secara langsung. Jika tidak,
OpenClaw mencoba menghasilkan token pembawa Mantle dari rantai
kredensial default AWS. Kemudian, OpenClaw menemukan model Mantle yang tersedia dengan mengirim kueri ke
endpoint `/v1/models` wilayah tersebut.

| Perilaku             | Detail                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Cache penemuan       | Hasil disimpan dalam cache selama 1 jam per wilayah; kegagalan pengambilan mengembalikan hasil cache terakhir |
| Penyegaran token IAM | Setiap 2 jam, disimpan dalam cache per wilayah                                                          |

Untuk mempertahankan Plugin Mantle tetap aktif, tetapi menonaktifkan penemuan otomatis dan
pembuatan token pembawa IAM, nonaktifkan pengalih penemuan milik Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Token pembawa tersebut sama dengan `AWS_BEARER_TOKEN_BEDROCK` yang digunakan oleh penyedia standar [Amazon Bedrock](/id/providers/bedrock).
</Note>

### Wilayah yang didukung

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfigurasi manual

Jika Anda lebih memilih konfigurasi eksplisit daripada penemuan otomatis:

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

Daftar `models` eksplisit yang tidak kosong bersifat otoritatif dan menggantikan setiap
baris yang ditemukan, termasuk baris Claude di bawah. Hilangkan `models` untuk mempertahankan
katalog Mantle otomatis, atau sertakan entri lengkap model Claude yang
ingin Anda gunakan.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Dukungan penalaran">
    Dukungan penalaran disimpulkan dari ID model yang berisi pola seperti
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b`, atau
    `gpt-oss-safeguard-120b`. OpenClaw secara otomatis menetapkan `reasoning: true` untuk
    model yang cocok selama penemuan.
  </Accordion>

  <Accordion title="Ketidaktersediaan endpoint">
    Jika endpoint Mantle tidak tersedia, tidak mengembalikan model, atau
    resolusi token pembawa gagal, penemuan mengembalikan hasil kosong dan penyedia
    implisit dilewati. OpenClaw tidak menghasilkan galat; penyedia lain yang dikonfigurasi
    tetap berfungsi seperti biasa.
  </Accordion>

  <Accordion title="Claude melalui rute Anthropic Messages">
    Saat penemuan otomatis mengelola daftar model, OpenClaw menambahkan empat model
    Claude setelah pencarian berhasil, terlepas dari hasil yang dikembalikan oleh `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7), dan
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), ditambah
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Model-model tersebut menggunakan antarmuka API `anthropic-messages` dan melakukan streaming melalui
    endpoint kompatibel Anthropic yang sama dan diautentikasi dengan token pembawa
    (`<mantle-base>/anthropic`), sehingga token pembawa AWS tidak diperlakukan seperti
    kunci API Anthropic.

    Claude Sonnet 5 selalu menggunakan pemikiran adaptif dan secara default memakai tingkat upaya `high`.
    `/think off` dan `/think minimal` dipetakan ke `low` karena rute Mantle
    tidak dapat menonaktifkan pemikiran. OpenClaw juga tidak menyertakan suhu khusus untuk
    permintaan Sonnet 5.

    Akses ke Claude Mythos 5 dibatasi. Model ini menyediakan jendela konteks
    1.000.000 token dan batas keluaran 128.000 token, selalu menggunakan pemikiran adaptif, memetakan
    `/think off` dan `/think minimal` ke `low`, serta tidak menyertakan parameter
    pengambilan sampel yang dipilih pemanggil.

    Claude Mythos Preview selalu meminta penalaran, dengan tingkat upaya default `high`
    saat tidak ada tingkat `/think` yang ditetapkan (`xhigh`/`max` dipetakan turun ke
    `high`, dan `minimal` dinaikkan ke `low`). Opus 4.7 pada Mantle melakukan streaming tanpa
    penalaran yang disediakan model, dan OpenClaw tidak menyertakan parameter `temperature`
    karena Opus 4.7 tidak menerima penggantian pengambilan sampel pada rute ini; Mythos
    Preview menerima penggantian `temperature` seperti biasa.

    Daftar `models.providers["amazon-bedrock-mantle"].models` eksplisit yang tidak kosong
    menggantikan seluruh katalog yang ditemukan. Hilangkan daftar tersebut jika Anda
    menginginkan baris Claude bawaan ini.

  </Accordion>

  <Accordion title="Hubungan dengan penyedia Amazon Bedrock">
    Bedrock Mantle adalah penyedia yang terpisah dari penyedia standar
    [Amazon Bedrock](/id/providers/bedrock). Mantle menggunakan antarmuka `/v1`
    yang kompatibel dengan OpenAI untuk katalog OSS-nya, sedangkan penyedia standar
    Bedrock menggunakan API Bedrock Converse native.

    Kedua penyedia menggunakan kredensial `AWS_BEARER_TOKEN_BEDROCK` yang sama jika
    tersedia.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/id/providers/bedrock" icon="cloud">
    Penyedia Bedrock native untuk Anthropic Claude, Titan, dan model lainnya.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
