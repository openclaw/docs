---
read_when:
    - Mengubah perilaku fallback model atau UX pemilihan
    - Men-debug "model is not allowed" atau fallback penyedia default yang usang
    - Mengerjakan perilaku penggabungan/rahasia models.json
sidebarTitle: Models CLI
summary: Cara OpenClaw menyelesaikan referensi penyedia/model, kunci konfigurasi, dan perintah chat `/model`
title: CLI Model
x-i18n:
    generated_at: "2026-07-19T04:55:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ad5cdf2ca5f165ab5700eaf6af89a7e5fb02fbd2eaa27c5d06ba50dd0f60637
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil autentikasi, masa tunggu, dan interaksinya dengan fallback.
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

Referensi model (`provider/model`) memilih penyedia dan model, bukan runtime agen tingkat rendah.
Jika kebijakan runtime tidak ditetapkan atau `auto`, kebijakan rute milik penyedia OpenAI
dapat memilih Codex hanya untuk rute resmi HTTPS Platform Responses atau ChatGPT Responses
yang sama persis tanpa penggantian permintaan yang ditentukan pengguna; prefiks
`openai/*` saja tidak pernah memilih Codex. Adaptor Completions, endpoint khusus,
dan perilaku permintaan yang ditentukan pengguna tetap menggunakan OpenClaw. Endpoint HTTP
teks biasa resmi ditolak. Lihat [Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

Referensi Copilot langganan (`github-copilot/*`) dapat diikutsertakan dalam plugin runtime
agen GitHub Copilot eksternal, tetapi jalur tersebut selalu eksplisit (tidak pernah
dipilih oleh `auto`). Penggantian runtime diterapkan pada kebijakan penyedia/model, bukan pada
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
    Rotasi profil autentikasi terjadi di dalam penyedia sebelum OpenClaw beralih ke model fallback berikutnya.
  </Step>
</Steps>

Permukaan konfigurasi model terkait:

- `agents.defaults.models` menyimpan alias dan pengaturan per model. Menambahkan entri tidak membatasi penggantian model.
- `agents.defaults.modelPolicy.allow` adalah daftar izin penggantian opsional. Gunakan referensi persis atau entri `provider/*`; hilangkan atau tetapkan `[]` untuk mengizinkan model apa pun. `agents.list[].modelPolicy.allow` per agen menggantikan kebijakan default untuk agen tersebut.
- `agents.defaults.utilityModel` adalah model opsional berbiaya lebih rendah untuk tugas internal singkat seperti judul sesi dasbor yang dihasilkan, judul utas/topik saluran yang didukung, dan narasi progres. `agents.list[].utilityModel` per agen menggantikannya. Jika tidak ditetapkan, OpenClaw menggunakan default model kecil yang dideklarasikan oleh penyedia utama jika tersedia (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), atau model utama agen jika tidak tersedia; tetapkan ke string kosong untuk menonaktifkan perutean utilitas. Tugas utilitas merupakan panggilan model terpisah dan dapat mengirimkan konten tugas terbatas kepada penyedia model yang dipilih.
- `agents.defaults.imageModel` hanya digunakan jika model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika tidak ditetapkan, alat melakukan fallback ke `imageModel`, lalu ke model sesi/default yang telah ditentukan.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel`, dan `videoGenerationModel` mendukung alat pembuatan media bersama. Jika tidak ditetapkan, setiap alat menyimpulkan default penyedia yang didukung autentikasi: penyedia default saat ini terlebih dahulu, lalu penyedia terdaftar lainnya untuk kemampuan tersebut berdasarkan urutan id penyedia. Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk menonaktifkan inferensi lintas penyedia tersebut sambil mempertahankan fallback eksplisit.
- `agents.list[].model` per agen (beserta binding) menggantikan `agents.defaults.model` — lihat [Perutean multi-agen](/id/concepts/multi-agent).

Referensi kunci lengkap, nilai default, dan contoh JSON5: [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults).

## Sumber pemilihan dan keketatan fallback

`provider/model` yang sama berperilaku berbeda bergantung pada asalnya:

| Sumber                                                                  | Perilaku                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default yang dikonfigurasi (`agents.defaults.model.primary`, utama per agen) | Titik awal normal; menggunakan `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Fallback otomatis                                                       | Status pemulihan sementara, disimpan sebagai `modelOverrideSource: "auto"`. OpenClaw secara berkala menguji ulang model utama asli, menghapus pilihan otomatis setelah pulih, dan mengumumkan transisi fallback/pemulihan satu kali per perubahan status.                              |
| Pilihan sesi pengguna                                                   | Persis dan ketat. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`. Jika penyedia/model tersebut tidak dapat dijangkau, eksekusi akan gagal secara jelas alih-alih beralih ke model lain yang dikonfigurasi. |
| Cron `--model` / payload `model`                                        | Model utama per tugas. Tetap menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan payload `fallbacks` sendiri (`fallbacks: []` memaksa eksekusi ketat).                                                                                                                    |

Aturan pemilihan lainnya:

- Mengubah `agents.defaults.model.primary` tidak menulis ulang pin sesi yang sudah ada. Jika status melaporkan `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, jalankan `/model default` untuk menghapus pin.
- Pemilih model default dan daftar izin CLI mematuhi `models.mode: "replace"` dengan hanya mencantumkan `models.providers.*.models`, bukan seluruh katalog bawaan.
- Pemilih model Control UI meminta tampilan model yang dikonfigurasi dari Gateway. `modelPolicy.allow` eksplisit memfilternya, termasuk entri wildcard `provider/*`; jika tidak, pemilih menampilkan model yang dikonfigurasi beserta penyedia yang memiliki autentikasi yang dapat digunakan. Katalog bawaan lengkap disediakan khusus untuk tampilan penelusuran eksplisit (`models.list` dengan `view: "all"`, atau `openclaw models list --all`).
- UI inventaris penyedia menggunakan `models.list` dengan `view: "provider-config"` untuk menampilkan baris `models.providers.*.models` yang ditentukan sumber tanpa menerapkan daftar izin pemilih.

Mekanisme lengkap: [Failover model](/id/concepts/model-failover).

## Kebijakan model ringkas

- Tetapkan model utama Anda ke model generasi terbaru dan terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan percakapan dengan tingkat risiko lebih rendah.
- Untuk agen dengan alat yang diaktifkan atau input yang tidak tepercaya, hindari tingkatan model yang lebih lama/lemah.

## Orientasi awal

```bash
openclaw onboard
```

Menyiapkan model dan autentikasi untuk penyedia umum tanpa mengedit konfigurasi secara manual, termasuk OAuth langganan OpenAI Codex dan Anthropic (kunci API atau penggunaan ulang Claude CLI).

Jika tidak ada model utama yang dikonfigurasi, penyiapan baru dengan kunci API OpenAI memilih
`openai/gpt-5.6`; id API langsung tanpa kualifikasi ditetapkan ke tingkatan Sol. Penyiapan baru
OAuth ChatGPT/Codex memilih referensi katalog `openai/gpt-5.6-sol` yang persis.
Autentikasi ulang mempertahankan model utama eksplisit yang sudah ada, termasuk
`openai/gpt-5.5`. Jika GPT-5.6 tidak tersedia untuk akun tersebut, pilih
`openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan tingkatannya secara diam-diam.

## "Model tidak diizinkan" (dan alasan balasan berhenti)

Jika `agents.defaults.modelPolicy.allow` tidak kosong, nilai tersebut menjadi daftar izin untuk `/model`, penggantian sesi, dan `--model`. Memilih model di luar daftar izin tersebut akan mengembalikan hasil sebelum balasan normal dihasilkan. `agents.list[].modelPolicy.allow` per agen menggantikan kebijakan default untuk agen tersebut.

```text
Penggantian model "provider/model" tidak diizinkan oleh agents.defaults.modelPolicy.allow.
Tambahkan "provider/model" atau "provider/*" ke agents.defaults.modelPolicy.allow, atau hapus/kosongkan daftar untuk mengizinkan model apa pun.
```

Perbaiki dengan menambahkan model atau wildcard penyedia ke kunci `modelPolicy.allow` yang disebutkan, menghapus/mengosongkan daftar tersebut, atau memilih model dari `/model list`. Jika perintah yang ditolak menyertakan penggantian runtime seperti `/model openai/gpt-5.5 --runtime codex`, perbaiki daftar izin terlebih dahulu, lalu coba lagi perintah yang sama.

Untuk model lokal/GGUF, daftar izin memerlukan referensi lengkap dengan prefiks penyedia, misalnya `ollama/gemma4:26b` atau `lmstudio/Gemma4-26b-a4-it-gguf` — periksa `openclaw models list --provider <provider>` untuk string persisnya. Nama file tanpa prefiks atau nama tampilan tidak memadai setelah daftar izin aktif.

Untuk membatasi penyedia tanpa mencantumkan setiap model, gunakan entri wildcard `provider/*`:

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

`/model`, `/models`, dan pemilih model kemudian hanya menampilkan katalog yang ditemukan untuk penyedia tersebut, dan model baru dapat muncul tanpa mengedit daftar izin. Gabungkan entri persis `provider/model` dengan entri `provider/*` untuk menyertakan satu model tertentu dari penyedia lain.

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

- `/model` dan `/model list` menampilkan pemilih bernomor yang ringkas (keluarga model + penyedia yang tersedia); `/model <#>` memilih darinya. Di Discord, tindakan ini membuka menu tarik-turun penyedia/model dengan langkah Submit; di Telegram, pilihan pemilih dibatasi pada sesi dan tidak pernah menulis ulang nilai default persisten agen di `openclaw.json`. `/models add` sudah tidak digunakan lagi dan mengembalikan pesan alih-alih mendaftarkan model dari obrolan.
- `/model` segera menyimpan pilihan sesi baru. Jika agen sedang menganggur, proses berikutnya langsung menggunakannya; jika suatu proses sudah aktif, peralihan akan diantrekan untuk titik percobaan ulang bersih berikutnya (atau titik setelahnya jika aktivitas alat atau keluaran balasan sudah dimulai).
- `/model default` menghapus pilihan sesi sehingga kembali mewarisi model utama yang dikonfigurasi.
- Referensi `/model` yang dipilih pengguna berlaku ketat untuk sesi tersebut: jika tidak dapat dijangkau, balasan akan gagal secara jelas alih-alih beralih secara diam-diam melalui `agents.defaults.model.fallbacks`. Nilai default yang dikonfigurasi dan model utama tugas cron tetap menggunakan rantai fallback.
- `/model status` adalah tampilan terperinci: kandidat autentikasi per penyedia dan (jika dikonfigurasi) endpoint penyedia `baseUrl` beserta mode `api`.
- Referensi model diuraikan dengan memisahkannya pada `/` pertama; ketik `provider/model`. Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks penyedia, misalnya `/model openrouter/moonshotai/kimi-k2`. Jika penyedia dihilangkan, OpenClaw mencoba: (1) kecocokan alias, (2) kecocokan unik dengan penyedia yang dikonfigurasi untuk ID model tanpa prefiks yang sama persis, (3) penyedia default yang dikonfigurasi (fallback yang sudah tidak digunakan lagi) — dan jika penyedia tersebut tidak lagi menyediakan model default yang dikonfigurasi, OpenClaw akan menggunakan penyedia/model pertama yang dikonfigurasi agar nilai default usang dari penyedia yang telah dihapus tidak ditampilkan.
- Referensi model dinormalisasi menjadi huruf kecil; selain itu, ID penyedia harus persis sama, jadi gunakan ID yang diumumkan oleh plugin.

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

`openclaw models` tanpa subperintah adalah pintasan untuk `models status`, yang juga menampilkan masa berlaku OAuth untuk profil penyimpanan autentikasi (secara default memperingatkan dalam 24h). Flag lengkap, struktur JSON, dan subperintah profil autentikasi: [Referensi CLI model](/id/cli/models).

<AccordionGroup>
  <Accordion title="Pemindaian (model gratis OpenRouter)">
    `openclaw models scan` memeriksa katalog publik model gratis OpenRouter dan dapat menguji kandidat secara langsung untuk dukungan alat dan gambar. Katalog itu sendiri bersifat publik, sehingga pemindaian yang hanya mengambil metadata (`--no-probe`) tidak memerlukan kunci; pengujian langsung serta `--set-default`/`--set-image` memerlukan kunci API OpenRouter (profil autentikasi atau `OPENROUTER_API_KEY`) dan, jika tidak tersedia, akan membatasi keluaran hanya pada metadata.

    Hasil diurutkan berdasarkan: dukungan gambar, kemudian latensi alat, ukuran konteks, dan jumlah parameter. Dalam TTY, hasil yang diuji akan meminta pemilihan fallback secara interaktif; mode noninteraktif memerlukan `--yes` untuk menerima nilai default.

  </Accordion>
</AccordionGroup>

## Registri model (`models.json`)

Penyedia kustom yang dikonfigurasi di bawah `models.providers` ditulis ke `models.json` di dalam direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). Katalog plugin penyedia disimpan secara terpisah sebagai pecahan katalog yang dihasilkan dan dimiliki plugin, lalu dimuat secara otomatis. Secara default, berkas ini digabungkan dengan konfigurasi; tetapkan `models.mode: "replace"` agar hanya menggunakan penyedia yang Anda konfigurasi.

<AccordionGroup>
  <Accordion title="Prioritas mode penggabungan">
    Untuk ID penyedia yang cocok:

    - `baseUrl` yang tidak kosong dan sudah ada dalam `models.json` agen akan diprioritaskan.
    - `apiKey` yang tidak kosong dalam `models.json` hanya diprioritaskan jika penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
    - Nilai `apiKey` yang dikelola SecretRef disegarkan dari penanda sumber alih-alih menyimpan rahasia yang telah diresolusi: nama variabel lingkungan untuk referensi lingkungan, `secretref-managed` untuk referensi berkas/exec.
    - Nilai header yang dikelola SecretRef disegarkan dengan cara yang sama, menggunakan `secretref-env:ENV_VAR_NAME` untuk referensi lingkungan.
    - `apiKey`/`baseUrl` yang kosong atau tidak ada dalam `models.json` akan menggunakan `models.providers` konfigurasi sebagai fallback.
    - Kolom penyedia lainnya disegarkan dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

Persistensi penanda menjadikan sumber sebagai acuan utama: setiap kali membuat ulang `models.json` — termasuk melalui jalur berbasis perintah seperti `openclaw agent` — OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah diresolusi.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — OpenClaw, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — perutean penyedia dan autentikasi
- [Referensi CLI model](/id/cli/models) — referensi lengkap perintah dan flag
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
