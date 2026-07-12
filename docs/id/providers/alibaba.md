---
read_when:
    - Anda ingin menggunakan pembuatan video Alibaba Wan di OpenClaw
    - Anda perlu menyiapkan kunci API Model Studio atau DashScope untuk pembuatan video
summary: Pembuatan video Alibaba Model Studio Wan di OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T14:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Plugin `alibaba` bawaan mendaftarkan penyedia pembuatan video untuk model Wan di Alibaba Model Studio (nama internasional untuk DashScope). Plugin ini diaktifkan secara default; hanya kunci API yang diperlukan.

| Properti         | Nilai                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| ID penyedia      | `alibaba`                                                                       |
| Plugin           | bawaan, `enabledByDefault: true`                                                |
| Variabel env autentikasi | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (kecocokan pertama digunakan) |
| Flag orientasi awal | `--auth-choice alibaba-model-studio-api-key`                                 |
| Flag CLI langsung | `--alibaba-model-studio-api-key <key>`                                         |
| Model default    | `alibaba/wan2.6-t2v`                                                            |
| URL dasar default | `https://dashscope-intl.aliyuncs.com`                                          |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    Simpan kunci untuk penyedia `alibaba` melalui orientasi awal:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Atau berikan kunci secara langsung:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Atau ekspor salah satu variabel env yang diterima sebelum memulai Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # atau DASHSCOPE_API_KEY=...
    # atau QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Tetapkan model video default">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifikasi bahwa penyedia telah dikonfigurasi">
    ```bash
    openclaw models list --provider alibaba
    ```

    Daftar tersebut mencakup kelima model Wan bawaan. Jika `MODELSTUDIO_API_KEY` tidak dapat ditemukan, `openclaw models status --json` melaporkan kredensial yang tidak tersedia di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba dan [Plugin Qwen](/id/providers/qwen) sama-sama melakukan autentikasi ke DashScope dan menerima variabel env yang tumpang tindih. Gunakan ID model `alibaba/...` untuk antarmuka video Wan khusus; gunakan ID `qwen/...` untuk percakapan, penyematan, atau pemahaman media Qwen.
</Note>

## Model Wan bawaan

| Referensi model            | Mode                         |
| -------------------------- | ---------------------------- |
| `alibaba/wan2.6-t2v`       | Teks-ke-video (default)      |
| `alibaba/wan2.6-i2v`       | Gambar-ke-video              |
| `alibaba/wan2.6-r2v`       | Referensi-ke-video           |
| `alibaba/wan2.6-r2v-flash` | Referensi-ke-video (cepat)   |
| `alibaba/wan2.7-r2v`       | Referensi-ke-video           |

## Kemampuan dan batasan

Ketiga mode memiliki jumlah video per permintaan dan batas durasi yang sama; hanya bentuk masukannya yang berbeda.

| Mode               | Maks. video keluaran | Maks. gambar masukan | Maks. video masukan | Durasi maks. | Kontrol yang didukung                                      |
| ------------------ | -------------------- | -------------------- | ------------------- | ------------ | --------------------------------------------------------- |
| Teks-ke-video      | 1                    | tidak berlaku        | tidak berlaku       | 10 dtk       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Gambar-ke-video    | 1                    | 1                    | tidak berlaku       | 10 dtk       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referensi-ke-video | 1                    | tidak berlaku        | 4                   | 10 dtk       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Permintaan yang tidak menyertakan `durationSeconds` akan menggunakan nilai default yang diterima DashScope, yaitu **5 detik**. Tetapkan `durationSeconds` secara eksplisit pada [alat pembuatan video](/id/tools/video-generation) untuk memperpanjangnya hingga 10 dtk.

<Warning>
  Masukan gambar dan video referensi harus berupa URL `http(s)` jarak jauh; mode referensi DashScope menolak jalur berkas lokal. Unggah terlebih dahulu ke penyimpanan objek, atau gunakan alur [alat media](/id/tools/media-overview) yang sudah menghasilkan URL publik.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Ganti URL dasar DashScope">
    Secara default, penyedia menggunakan endpoint DashScope internasional. Untuk menggunakan endpoint wilayah Tiongkok:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Penyedia menghapus garis miring di akhir sebelum menyusun URL tugas AIGC.

  </Accordion>

  <Accordion title="Prioritas env autentikasi">
    OpenClaw mendapatkan kunci API Alibaba dari variabel lingkungan dalam urutan berikut, dengan mengambil nilai pertama yang tidak kosong:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Entri `auth.profiles` yang dikonfigurasi (ditetapkan melalui `openclaw models auth login`) menggantikan pencarian variabel env. Lihat [Profil autentikasi dalam Tanya Jawab Umum model](/id/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) untuk mekanisme rotasi profil, masa tunggu, dan penggantian.

  </Accordion>

  <Accordion title="Hubungan dengan Plugin Qwen">
    Kedua Plugin bawaan berkomunikasi dengan DashScope dan menerima kunci API yang tumpang tindih. Gunakan:

    - ID `alibaba/wan*.*` untuk penyedia video Wan khusus yang didokumentasikan pada halaman ini.
    - ID `qwen/*` untuk percakapan, penyematan, dan pemahaman media Qwen (lihat [Qwen](/id/providers/qwen)).

    Menetapkan `MODELSTUDIO_API_KEY` satu kali akan mengautentikasi kedua Plugin karena daftar variabel env autentikasinya sengaja tumpang tindih; orientasi awal untuk setiap Plugin secara terpisah tidak diperlukan.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Qwen" href="/id/providers/qwen" icon="microchip">
    Penyiapan percakapan, penyematan, dan pemahaman media Qwen dengan autentikasi DashScope yang sama.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Nilai default agen dan konfigurasi model.
  </Card>
  <Card title="Tanya Jawab Umum model" href="/id/help/faq-models" icon="circle-question">
    Profil autentikasi, pergantian model, dan penyelesaian kesalahan "tidak ada profil".
  </Card>
</CardGroup>
