---
read_when:
    - Anda menginginkan satu kunci terkelola untuk beberapa penyedia model
    - Anda memerlukan penemuan model ClawRouter atau pelaporan kuota di OpenClaw
summary: Rutekan model yang dicakup kredensial melalui ClawRouter dan tampilkan kuota terkelola
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T04:07:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter memberi OpenClaw satu kunci bercakupan kebijakan untuk beberapa penyedia model upstream. Plugin bawaan hanya menemukan model yang diizinkan untuk kunci tersebut, merutekan setiap model melalui protokol yang dideklarasikannya, dan melaporkan anggaran kunci serta penggunaan agregat pada permukaan penggunaan OpenClaw.

Anda tidak perlu memasang atau mengautentikasi setiap Plugin penyedia upstream pada host OpenClaw. Kredensial upstream dan penerusan khusus penyedia tetap berada di ClawRouter. OpenClaw hanya memerlukan Plugin `@openclaw/clawrouter` bawaan dan kredensial ClawRouter yang diterbitkan.

| Properti      | Nilai                                    |
| ------------- | ---------------------------------------- |
| Penyedia      | `clawrouter`                             |
| Paket         | `@openclaw/clawrouter`                   |
| Autentikasi   | `CLAWROUTER_API_KEY`                     |
| URL default   | `https://clawrouter.openclaw.ai`         |
| Katalog model | Bercakupan kredensial melalui `/v1/catalog` |
| Kuota         | Anggaran bulanan dan penggunaan melalui `/v1/usage` |

## Memulai

<Steps>
  <Step title="Dapatkan kredensial bercakupan">
    Minta administrator ClawRouter Anda untuk kredensial yang kebijakannya mencakup penyedia, model, dan anggaran bulanan yang seharusnya Anda gunakan. Kredensial ditampilkan satu kali saat diterbitkan.
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Plugin ini dibundel dengan OpenClaw. Jika konfigurasi Anda menetapkan `plugins.allow`, tambahkan `clawrouter` ke daftar tersebut sebelum mengaktifkannya. Untuk deployment kustom, tetapkan `models.providers.clawrouter.baseUrl` ke origin ClawRouter; defaultnya adalah `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Cantumkan model yang diberikan">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gunakan referensi model yang dikembalikan persis seperti yang ditampilkan. Referensi tersebut mempertahankan namespace upstream, seperti `clawrouter/openai/...`, `clawrouter/anthropic/...`, atau `clawrouter/google/...`. Jika `agents.defaults.models` adalah allowlist dalam konfigurasi Anda, tambahkan setiap referensi ClawRouter yang dipilih ke sana.

  </Step>
  <Step title="Pilih model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Anda juga dapat memilih model yang dikembalikan untuk satu kali eksekusi dengan `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Penemuan model

`GET /v1/catalog` adalah sumber kebenaran. OpenClaw tidak mengirimkan daftar kedua yang tetap untuk model ClawRouter. Model yang dikonfigurasi di ClawRouter muncul ketika:

- kebijakan kredensial memberikan akses ke penyedianya;
- koneksi penyedia diaktifkan dan siap;
- model katalog mengiklankan kapabilitas LLM yang didukung; dan
- katalog mengekspos kontrak transport yang didukung oleh Plugin.

Karena itu, menambahkan model lain ke penyedia ClawRouter yang didukung tidak memerlukan rilis OpenClaw atau Plugin penyedia lain. Penyegaran katalog berikutnya akan menemukannya. Model yang memerlukan protokol wire baru memerlukan dukungan di Plugin ClawRouter sebelum OpenClaw mengiklankannya.

## Protokol dan Plugin penyedia

Anda tidak perlu memasang Plugin autentikasi setiap perusahaan upstream. ClawRouter memiliki kredensial upstream; katalognya memberi tahu OpenClaw transport mana yang harus digunakan. Plugin mendukung:

| Rute katalog                  | Transport OpenClaw     |
| ----------------------------- | ---------------------- |
| Chat kompatibel OpenAI        | `openai-completions`   |
| Responses kompatibel OpenAI   | `openai-responses`     |
| Messages Anthropic native     | `anthropic-messages`   |
| Streaming Google Gemini native | `google-generative-ai` |

Plugin juga menerapkan kebijakan replay dan skema alat yang sesuai untuk keluarga tersebut. Baris katalog yang menggunakan format permintaan/stream lain sengaja tidak diiklankan sebagai model teks OpenClaw. Normalisasikan penyedia tersebut ke salah satu kontrak yang didukung di ClawRouter, bukan mengirim payload yang tidak kompatibel.

## Kuota dan penggunaan

Respons `/v1/usage` ClawRouter mengisi permukaan penggunaan penyedia OpenClaw normal. `/status` dan status dasbor terkait menampilkan jendela anggaran bulanan ketika kunci memiliki batas, ditambah total permintaan, token, dan pengeluaran. Kunci tanpa meter tetap menampilkan penggunaan agregat tanpa jendela persentase.

Pencarian kuota menggunakan kunci bercakupan yang sama dengan penemuan model. Kegagalan pencarian kuota tidak memblokir eksekusi model.

Periksa snapshot live dengan:

```bash
openclaw status --usage
openclaw models status
```

Snapshot penyedia yang sama tersedia untuk `/status` di chat dan UI penggunaan OpenClaw. Anggaran berlaku di seluruh kebijakan, jadi permintaan yang dibuat oleh klien lain menggunakan kebijakan ClawRouter yang sama dapat mengubah persentase yang tersisa.

## Pemecahan masalah

| Gejala                                  | Periksa                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tidak ada model ClawRouter             | Pastikan Plugin diaktifkan dan diizinkan oleh `plugins.allow`, lalu periksa bahwa kredensial aktif dan memberikan setidaknya satu penyedia yang siap. |
| Model ClawRouter yang dikonfigurasi hilang | Periksa kapabilitas dan format rute `/v1/catalog`-nya. Kontrak transport yang tidak didukung sengaja difilter.                                  |
| `Unknown model: clawrouter/...`        | Tambahkan referensi katalog persis ke `agents.defaults.models` ketika peta konfigurasi tersebut digunakan sebagai allowlist.                      |
| `401` atau `403` dari katalog atau penggunaan | Terbitkan ulang atau cakup ulang kredensial ClawRouter; OpenClaw tidak fallback ke kunci penyedia upstream.                                      |
| Panggilan model gagal setelah penemuan | Periksa koneksi penyedia dan kesehatan upstream di ClawRouter, lalu coba lagi setelah status kesiapannya pulih.                                  |
| Penggunaan memiliki total tetapi tidak ada persentase | Kebijakan tidak bermeter; tambahkan anggaran bulanan di ClawRouter untuk mengekspos jendela persentase.                                         |

## Perilaku keamanan

- Penemuan katalog dicakup ke kunci proxy yang dikonfigurasi dan di-cache per kunci.
- Kunci proxy hanya dilampirkan saat pengiriman permintaan; kunci tersebut tidak disimpan dalam metadata model.
- ID model Anthropic dan Gemini native ditulis ulang ke ID upstream masing-masing hanya saat pengiriman.
- Baris katalog yang tidak didukung atau tidak diberikan gagal tertutup dan tidak dapat dipilih.

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Konfigurasi penyedia dan pemilihan model.
  </Card>
  <Card title="Pelacakan penggunaan" href="/id/concepts/usage-tracking" icon="chart-line">
    Permukaan penggunaan dan status OpenClaw.
  </Card>
</CardGroup>
