---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda perlu menyiapkan NVIDIA_API_KEY
    - Anda ingin menggunakan Nemotron 3 Ultra melalui NVIDIA
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T14:33:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA menyediakan model terbuka secara gratis melalui API yang kompatibel dengan OpenAI di
`https://integrate.api.nvidia.com/v1`, yang diautentikasi dengan kunci API dari
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
menetapkan Nemotron 3 Ultra sebagai model bawaan penyedia NVIDIA, yaitu model
penalaran NVIDIA dengan total 550B parameter / 55B parameter aktif untuk tugas
agen dengan konteks panjang.

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Ekspor kunci dan jalankan orientasi awal">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Tetapkan model NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Untuk penyiapan noninteraktif, berikan kunci secara langsung:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` menyimpan kunci dalam riwayat shell dan keluaran `ps`. Jika
memungkinkan, gunakan variabel lingkungan `NVIDIA_API_KEY`.
</Warning>

## Contoh konfigurasi

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Katalog unggulan

Saat kunci API NVIDIA dikonfigurasi, alur penyiapan dan pemilihan model mengambil
katalog publik model unggulan NVIDIA dari
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` dan
menyimpan hasilnya dalam cache selama 24 jam (32 entri pertama, diimpor sebagai
baris masukan teks gratis). Karena itu, model unggulan baru dari build.nvidia.com
akan muncul pada antarmuka penyiapan dan pemilihan model tanpa harus menunggu
rilis OpenClaw. Saat umpan langsung tersedia, model pertama yang dikembalikan
menjadi opsi yang telah dipilih sebelumnya selama penyiapan NVIDIA.

Pengambilan menggunakan kebijakan host HTTPS tetap untuk `assets.ngc.nvidia.com`.
Jika tidak ada kunci API NVIDIA yang dikonfigurasi, atau jika umpan tidak tersedia
atau berformat tidak valid, OpenClaw kembali menggunakan katalog bawaan dan model
bawaan di bawah ini.

## Nemotron 3 Ultra

Nemotron 3 Ultra adalah model NVIDIA bawaan di OpenClaw. Halaman build NVIDIA untuk
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
mencantumkannya sebagai titik akhir gratis yang tersedia dengan spesifikasi konteks
1 juta token.

Baris Ultra bawaan mengirim
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
secara bawaan agar keluaran percakapan biasa tetap berada dalam jawaban yang
terlihat dan tidak menampilkan teks penalaran.

Gunakan Ultra sebagai model bawaan NVIDIA dengan kemampuan tertinggi. Tetap pilih
Super jika Anda menginginkan opsi Nemotron 3 yang lebih kecil, atau pilih salah
satu model pihak ketiga yang dihosting dalam katalog NVIDIA jika konteks, latensi,
atau perilakunya lebih sesuai.

## Katalog cadangan bawaan

Baris bawaan yang dapat dipilih merupakan cuplikan katalog model unggulan NVIDIA.
Baris kompatibilitas yang sudah tidak digunakan tetap dapat diakses melalui
referensi persis, tetapi tidak ditampilkan dalam pemilih model.

| Referensi model                            | Nama                  | Konteks   | Keluaran maks. |
| ------------------------------------------ | --------------------- | --------- | -------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192          |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192          |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192          |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192          |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384         |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384         |

Katalog kompatibilitas lengkap juga mempertahankan referensi yang telah dirilis
berikut untuk konfigurasi yang sudah ada: `nvidia/moonshotai/kimi-k2.5`,
`nvidia/z-ai/glm-5.1`, `nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5`, dan
`nvidia/minimaxai/minimax-m2.7`. Model tersebut tetap tersedia melalui referensi
persis, tetapi tidak pernah muncul dalam orientasi awal atau pemilih model.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku pengaktifan otomatis">
    Penyedia diaktifkan secara otomatis saat variabel lingkungan `NVIDIA_API_KEY`
    ditetapkan atau kunci disimpan selama orientasi awal. Tidak diperlukan
    konfigurasi penyedia secara eksplisit selain kunci tersebut.
  </Accordion>

  <Accordion title="Katalog dan harga">
    OpenClaw mengutamakan katalog publik model unggulan NVIDIA saat autentikasi
    NVIDIA dikonfigurasi dan menyimpannya dalam cache selama 24 jam. Cadangan
    bawaan yang dapat dipilih merupakan cuplikan statis katalog model unggulan
    NVIDIA; baris kompatibilitas dengan referensi persis yang sudah tidak
    digunakan disembunyikan dari pemilih model. Biaya secara bawaan ditetapkan
    ke `0` dalam kode sumber karena NVIDIA saat ini menawarkan akses API gratis
    untuk model yang tercantum.
  </Accordion>

  <Accordion title="Titik akhir yang kompatibel dengan OpenAI">
    OpenClaw berkomunikasi dengan NVIDIA menggunakan adaptor
    `openai-completions` melalui rute penyelesaian percakapan standar `/v1`.
    Peralatan apa pun yang kompatibel dengan OpenAI seharusnya langsung berfungsi
    dengan URL dasar NVIDIA.
  </Accordion>

  <Accordion title="Parameter penalaran Nemotron 3 Ultra">
    Contoh permintaan Ultra dari NVIDIA menggunakan
    `chat_template_kwargs.enable_thinking` dan `reasoning_budget` untuk keluaran
    penalaran. Baris Ultra bawaan OpenClaw secara bawaan menonaktifkan penalaran
    templat untuk penggunaan percakapan biasa. Jika Anda perlu mengaktifkan
    keluaran penalaran NVIDIA atau memaksakan kolom permintaan khusus NVIDIA
    lainnya, tetapkan parameter per model dan batasi penggantian khusus penyedia
    hanya untuk model NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` digabungkan ke dalam
    `chat_template_kwargs` yang sudah ada pada permintaan, alih-alih mengganti
    seluruh objek. `params.extra_body` adalah penggantian akhir isi permintaan
    yang kompatibel dengan OpenAI dan akan menimpa kunci muatan yang bertabrakan,
    jadi gunakan hanya untuk kolom yang didokumentasikan NVIDIA bagi titik akhir
    yang dipilih.

  </Accordion>

  <Accordion title="Respons penyedia khusus yang lambat">
    Beberapa model khusus yang dihosting NVIDIA dapat memerlukan waktu lebih lama
    daripada pengawas waktu menganggur model bawaan sekitar 120 detik sebelum
    mengirim potongan respons pertama. Untuk entri penyedia NVIDIA khusus,
    tingkatkan batas waktu penyedia, bukan batas waktu seluruh lingkungan
    eksekusi agen; `timeoutSeconds` mencakup permintaan HTTP penyedia dan
    meningkatkan batas pengawas waktu menganggur/aliran untuk penyedia tersebut:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Model NVIDIA saat ini dapat digunakan secara gratis. Periksa
[build.nvidia.com](https://build.nvidia.com/) untuk ketersediaan terbaru dan
detail batas laju.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
