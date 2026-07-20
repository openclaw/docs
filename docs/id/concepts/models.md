---
read_when:
    - Mengubah perilaku fallback model atau UX pemilihan
    - Men-debug "model is not allowed" atau fallback penyedia default yang kedaluwarsa
    - Menangani perilaku penggabungan/rahasia models.json
sidebarTitle: Models CLI
summary: Cara OpenClaw menguraikan referensi penyedia/model, kunci konfigurasi, dan perintah chat `/model`
title: CLI Model
x-i18n:
    generated_at: "2026-07-20T14:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 357d3f248eed4369ae475f6f632ba256c43fba982b2d94640b3c2f87c95ea54c
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Pengalihan model saat gagal" href="/id/concepts/model-failover">
    Rotasi profil autentikasi, masa jeda, dan interaksinya dengan fallback.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers">
    Ikhtisar singkat penyedia dan contoh.
  </Card>
  <Card title="Referensi CLI model" href="/id/cli/models">
    Referensi lengkap perintah dan flag `openclaw models`.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults">
    Kunci konfigurasi model, nilai default, dan contoh.
  </Card>
</CardGroup>

Referensi model (`provider/model`) memilih penyedia dan model, bukan runtime
agen tingkat rendah. Saat kebijakan runtime tidak ditetapkan atau bernilai `auto`, kebijakan
rute milik penyedia OpenAI dapat memilih Codex hanya untuk rute resmi HTTPS Platform
Responses atau ChatGPT Responses yang sama persis tanpa penggantian permintaan yang ditulis pengguna; prefiks
`openai/*` saja tidak pernah memilih Codex. Adaptor Completions, endpoint
khusus, dan perilaku permintaan yang ditulis pengguna tetap menggunakan OpenClaw. Endpoint resmi
HTTP teks biasa ditolak. Lihat [Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

Referensi Copilot langganan (`github-copilot/*`) dapat diikutsertakan dalam plugin runtime agen
GitHub Copilot eksternal, tetapi jalur tersebut selalu eksplisit (tidak pernah
dipilih oleh `auto`). Penggantian runtime berada dalam kebijakan penyedia/model, bukan pada
seluruh agen atau sesi. Pemilihan runtime tidak menentukan penagihan:
kredensial kunci API OpenAI dan langganan ChatGPT/Codex tetap terpisah. Lihat
[Runtime agen](/id/concepts/agent-runtimes) dan
[Runtime agen GitHub Copilot](/id/plugins/copilot).

## Urutan pemilihan

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model` sebagai string biasa).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks`, dicoba secara berurutan.
  </Step>
  <Step title="Failover autentikasi">
    Rotasi profil autentikasi berlangsung di dalam penyedia sebelum OpenClaw beralih ke model fallback berikutnya.
  </Step>
</Steps>

Permukaan konfigurasi model terkait:

- `agents.defaults.models` menyimpan alias dan pengaturan per model. Menambahkan entri tidak membatasi penggantian model.
- `agents.defaults.modelPolicy.allow` adalah daftar izin penggantian opsional. Gunakan referensi yang sama persis atau wildcard prefiks di bagian akhir seperti `provider/*` dan `provider/namespace/*`; hilangkan atau tetapkan `[]` untuk mengizinkan model apa pun. `agents.list[].modelPolicy.allow` per agen menggantikan kebijakan default untuk agen tersebut.
- `agents.defaults.utilityModel` adalah model opsional berbiaya lebih rendah untuk tugas internal singkat seperti judul sesi dasbor yang dihasilkan, judul utas/topik kanal yang didukung, dan narasi progres. `agents.list[].utilityModel` per agen menggantikannya. Saat tidak ditetapkan, OpenClaw menggunakan default model kecil yang dideklarasikan oleh penyedia utama jika tersedia (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), atau model utama agen jika tidak tersedia; tetapkan ke string kosong untuk menonaktifkan perutean utilitas. Judul yang dihasilkan mencoba ulang satu kali dengan model utama ketika model utilitas yang berbeda gagal. Untuk judul dasbor, derivasi utilitas otomatis dan fallback biasa mengikuti penyedia sesi dan profil autentikasi yang berlaku; model utilitas eksplisit mempertahankan penyedia/autentikasi yang dikonfigurasi. Model utilitas kosong hanya melewati rute model kecil alternatif, bukan pembuatan judul dasbor. Tugas utilitas merupakan panggilan model terpisah dan dapat mengirimkan konten tugas terbatas kepada penyedia model yang dipilih.
- `agents.defaults.imageModel` hanya digunakan ketika model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika tidak ditetapkan, alat menggunakan fallback ke `imageModel`, lalu model sesi/default yang telah diuraikan.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel`, dan `videoGenerationModel` mendukung alat pembuatan media bersama. Jika tidak ditetapkan, setiap alat menyimpulkan default penyedia yang didukung autentikasi: penyedia default saat ini terlebih dahulu, lalu penyedia terdaftar lainnya untuk kapabilitas tersebut berdasarkan urutan ID penyedia. Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk menonaktifkan inferensi lintas penyedia tersebut sambil mempertahankan fallback eksplisit.
- `agents.list[].model` per agen (beserta pengikatan) menggantikan `agents.defaults.model` — lihat [Perutean multiagen](/id/concepts/multi-agent).

Referensi lengkap kunci, nilai default, dan contoh JSON5: [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults).

## Sumber pemilihan dan ketegasan fallback

`provider/model` yang sama berperilaku berbeda tergantung asalnya:

| Sumber                                                                  | Perilaku                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default yang dikonfigurasi (`agents.defaults.model.primary`, utama per agen) | Titik awal normal; menggunakan `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Fallback otomatis                                                       | Status pemulihan sementara, disimpan sebagai `modelOverrideSource: "auto"`. OpenClaw secara berkala memeriksa ulang model utama semula, menghapus pemilihan otomatis setelah pulih, dan mengumumkan transisi fallback/pemulihan satu kali untuk setiap perubahan status.                              |
| Pemilihan sesi pengguna                                                 | Sama persis dan ketat. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`. Jika penyedia/model tersebut tidak dapat dijangkau, eksekusi gagal secara terlihat alih-alih beralih ke model lain yang dikonfigurasi. |
| Cron `--model` / payload `model`                                        | Model utama per tugas. Tetap menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan payload `fallbacks` sendiri (`fallbacks: []` memaksakan eksekusi ketat).                                                                                                                    |

Aturan pemilihan lainnya:

- Mengubah `agents.defaults.model.primary` tidak menulis ulang pin sesi yang sudah ada. Jika status melaporkan `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, jalankan `/model default` untuk menghapus pin.
- Pemilih model default dan daftar izin CLI mematuhi `models.mode: "replace"` dengan hanya mencantumkan `models.providers.*.models`, bukan seluruh katalog bawaan.
- Pemilih model Control UI meminta tampilan model yang dikonfigurasi dari Gateway. `modelPolicy.allow` eksplisit memfilternya, termasuk entri wildcard prefiks di bagian akhir; jika tidak ada, pemilih menampilkan model yang dikonfigurasi beserta penyedia yang memiliki autentikasi yang dapat digunakan. Katalog bawaan lengkap hanya tersedia untuk tampilan penelusuran eksplisit (`models.list` dengan `view: "all"`, atau `openclaw models list --all`).
- UI inventaris penyedia menggunakan `models.list` dengan `view: "provider-config"` untuk menampilkan baris `models.providers.*.models` yang ditulis sumber tanpa menerapkan daftar izin pemilih.

Mekanisme lengkap: [Pengalihan model saat gagal](/id/concepts/model-failover).

## Kebijakan model singkat

- Tetapkan model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan percakapan dengan risiko lebih rendah.
- Untuk agen yang mendukung alat atau input yang tidak tepercaya, hindari tingkatan model yang lebih lama/lemah.

## Orientasi awal

```bash
openclaw onboard
```

Menyiapkan model dan autentikasi untuk penyedia umum tanpa mengedit konfigurasi secara manual, termasuk OAuth langganan OpenAI Codex dan Anthropic (kunci API atau penggunaan ulang Claude CLI).

Jika tidak ada model utama yang dikonfigurasi, penyiapan baru dengan kunci API OpenAI memilih
`openai/gpt-5.6`; ID API langsung tanpa kualifikasi diuraikan ke tingkatan Sol. Penyiapan baru
OAuth ChatGPT/Codex memilih referensi katalog `openai/gpt-5.6-sol` yang sama persis.
Autentikasi ulang mempertahankan model utama eksplisit yang sudah ada, termasuk
`openai/gpt-5.5`. Jika GPT-5.6 tidak tersedia untuk akun tersebut, pilih
`openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan versinya secara diam-diam.

## "Model tidak diizinkan" (dan alasan balasan berhenti)

Jika `agents.defaults.modelPolicy.allow` tidak kosong, nilai tersebut menjadi daftar izin untuk `/model`, penggantian sesi, dan `--model`. Memilih model di luar daftar izin tersebut mengembalikan hasil sebelum balasan normal dihasilkan. `agents.list[].modelPolicy.allow` per agen menggantikan kebijakan default untuk agen tersebut.

```text
Penggantian model "provider/model" tidak diizinkan oleh agents.defaults.modelPolicy.allow.
Tambahkan "provider/model", "provider/*", atau prefiks "provider/namespace/*" yang lebih sempit ke agents.defaults.modelPolicy.allow, atau hapus/kosongkan daftar tersebut untuk mengizinkan model apa pun.
```

Perbaiki dengan menambahkan model atau wildcard penyedia ke kunci `modelPolicy.allow` yang disebutkan, menghapus/mengosongkan daftar tersebut, atau memilih model dari `/model list`. Jika perintah yang ditolak menyertakan penggantian runtime seperti `/model openai/gpt-5.5 --runtime codex`, perbaiki daftar izin terlebih dahulu, lalu coba lagi perintah yang sama.

Untuk model lokal/GGUF, daftar izin memerlukan referensi lengkap dengan prefiks penyedia, misalnya `ollama/gemma4:26b` atau `lmstudio/Gemma4-26b-a4-it-gguf` — periksa `openclaw models list --provider <provider>` untuk string yang sama persis. Nama file tanpa prefiks atau nama tampilan tidak cukup setelah daftar izin aktif.

Untuk membatasi penyedia tanpa mencantumkan setiap model, gunakan entri wildcard prefiks di bagian akhir. `provider/*` tingkat penyedia cocok dengan setiap model di bawah penyedia tersebut; prefiks yang lebih sempit seperti `clawrouter/anthropic/*` hanya cocok dengan namespace tersebut:

```json5
{
  agents: {
    defaults: {
      modelPolicy: {
        allow: ["openai/*", "vllm/*"],
      },
    },
  },
}
```

`/model`, `/models`, dan pemilih model kemudian hanya menampilkan katalog yang ditemukan untuk penyedia tersebut, dan model baru dapat muncul tanpa mengedit daftar izin. Gabungkan entri `provider/model` yang sama persis dengan entri `provider/*` untuk menyertakan satu model tertentu dari penyedia lain.

Contoh daftar izin dengan alias dan pengaturan per model:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      modelPolicy: {
        allow: ["anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Edit daftar izin secara eksplisit">
Tetapkan daftar lengkap secara langsung:

```bash
openclaw config set agents.defaults.modelPolicy.allow '["openai/gpt-5.4","anthropic/*"]' --strict-json
```

`openclaw models set`, penyiapan penyedia, dan `openclaw models aliases add` dapat menambahkan entri di bawah `agents.defaults.models`, tetapi tidak pernah mengubah `modelPolicy.allow`. Hal ini menjaga metadata dan alias model tetap terpisah dari kebijakan penggantian.
</Accordion>

## `/model` dalam percakapan

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` dan `/model list` menampilkan pemilih bernomor ringkas (keluarga model + penyedia yang tersedia); `/model <#>` memilih darinya. Di Discord, tindakan ini membuka menu tarik-turun penyedia/model dengan langkah Submit; di Telegram, pilihan pemilih dibatasi pada sesi dan tidak pernah menulis ulang nilai default persisten agen di `openclaw.json`. `/models add` sudah tidak digunakan dan mengembalikan pesan alih-alih mendaftarkan model dari obrolan.
- `/model` segera menyimpan pilihan sesi baru. Jika agen sedang menganggur, eksekusi berikutnya langsung menggunakannya; jika eksekusi sudah aktif, peralihan diantrekan untuk titik percobaan ulang bersih berikutnya (atau titik yang lebih kemudian, jika aktivitas alat atau keluaran balasan sudah dimulai).
- `/model default` menghapus pilihan sesi agar kembali mewarisi model utama yang dikonfigurasi.
- Referensi `/model` yang dipilih pengguna berlaku ketat untuk sesi tersebut: jika referensi itu tidak dapat dijangkau, balasan gagal secara kasatmata alih-alih beralih diam-diam melalui `agents.defaults.model.fallbacks`. Nilai default yang dikonfigurasi dan model utama tugas cron tetap menggunakan rantai fallback.
- `/model status` adalah tampilan terperinci: kandidat autentikasi per penyedia, serta (jika dikonfigurasi) titik akhir penyedia `baseUrl` beserta mode `api`.
- Referensi model diurai dengan memisahkannya pada `/` pertama; ketik `provider/model`. Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks penyedia, misalnya `/model openrouter/moonshotai/kimi-k2`. Jika penyedia tidak dicantumkan, OpenClaw mencoba: (1) kecocokan alias, (2) kecocokan penyedia terkonfigurasi yang unik untuk ID model tanpa prefiks tersebut, (3) penyedia default yang dikonfigurasi (fallback yang sudah tidak digunakan) — dan jika penyedia itu tidak lagi menyediakan model default yang dikonfigurasi, gunakan penyedia/model terkonfigurasi pertama sebagai gantinya agar nilai default penyedia yang telah dihapus dan kedaluwarsa tidak ditampilkan.
- Referensi model dinormalisasi menjadi huruf kecil; selain itu, ID penyedia harus persis, jadi gunakan ID yang diumumkan oleh plugin.

Perilaku perintah dan konfigurasi lengkap: [Perintah garis miring](/id/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` tanpa subperintah merupakan pintasan untuk `models status`, yang juga menampilkan masa berlaku OAuth untuk profil penyimpanan autentikasi (secara default memperingatkan dalam 24 jam). Flag lengkap, struktur JSON, dan subperintah profil autentikasi: [Referensi CLI model](/id/cli/models).

<AccordionGroup>
  <Accordion title="Pemindaian (model gratis OpenRouter)">
    `openclaw models scan` memeriksa katalog publik model gratis OpenRouter dan dapat menguji kandidat secara langsung untuk dukungan alat dan gambar. Katalog itu sendiri bersifat publik, sehingga pemindaian khusus metadata (`--no-probe`) tidak memerlukan kunci; pengujian langsung serta `--set-default`/`--set-image` memerlukan kunci API OpenRouter (profil autentikasi atau `OPENROUTER_API_KEY`) dan, tanpa kunci, gagal secara tertutup dengan hanya menghasilkan keluaran metadata.

    Hasil diberi peringkat berdasarkan: dukungan gambar, lalu latensi alat, kemudian ukuran konteks, dan terakhir jumlah parameter. Dalam TTY, hasil yang diuji akan meminta pemilihan fallback interaktif; mode noninteraktif memerlukan `--yes` untuk menerima nilai default.

  </Accordion>
</AccordionGroup>

## Registri model (`models.json`)

Penyedia kustom yang dikonfigurasi di bawah `models.providers` ditulis ke `models.json` dalam direktori agen (nilai default `~/.openclaw/agents/<agentId>/agent/models.json`). Katalog plugin penyedia disimpan secara terpisah sebagai serpihan katalog milik plugin yang dihasilkan dan dimuat secara otomatis. Secara default, berkas ini digabungkan dengan konfigurasi; atur `models.mode: "replace"` agar hanya menggunakan penyedia yang Anda konfigurasi.

<AccordionGroup>
  <Accordion title="Prioritas mode penggabungan">
    Untuk ID penyedia yang cocok:

    - `baseUrl` yang tidak kosong dan sudah ada dalam `models.json` agen diutamakan.
    - `apiKey` yang tidak kosong dalam `models.json` hanya diutamakan jika penyedia tersebut tidak dikelola oleh SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
    - Nilai `apiKey` yang dikelola oleh SecretRef diperbarui dari penanda sumber alih-alih menyimpan rahasia yang telah diresolusikan: nama variabel lingkungan untuk referensi lingkungan, `secretref-managed` untuk referensi berkas/eksekusi.
    - Nilai header yang dikelola oleh SecretRef diperbarui dengan cara yang sama, menggunakan `secretref-env:ENV_VAR_NAME` untuk referensi lingkungan.
    - `apiKey`/`baseUrl` yang kosong atau tidak ada dalam `models.json` menggunakan `models.providers` dari konfigurasi sebagai fallback.
    - Kolom penyedia lainnya diperbarui dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

Persistensi penanda menjadikan sumber sebagai otoritas: OpenClaw menulis penanda dari snapshot konfigurasi sumber yang aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah diresolusikan, setiap kali menghasilkan ulang `models.json` — termasuk jalur yang digerakkan oleh perintah seperti `openclaw agent`.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — OpenClaw, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — perutean penyedia dan autentikasi
- [Referensi CLI model](/id/cli/models) — referensi lengkap perintah dan flag
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
