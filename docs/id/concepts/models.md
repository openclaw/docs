---
read_when:
    - Menambahkan atau memodifikasi CLI models (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku pengalihan ke model cadangan atau UX pemilihan
    - Memperbarui probe pemindaian model (tools/images)
sidebarTitle: Models CLI
summary: 'CLI model: list, set, aliases, fallbacks, scan, status'
title: CLI Model
x-i18n:
    generated_at: "2026-04-30T09:44:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil auth, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers">
    Ikhtisar singkat penyedia dan contoh.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent-runtimes">
    PI, Codex, dan runtime loop agen lainnya.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults">
    Kunci konfigurasi model.
  </Card>
</CardGroup>

Ref model memilih penyedia dan model. Biasanya ref tidak memilih runtime agen tingkat rendah. Misalnya, `openai/gpt-5.5` dapat berjalan melalui jalur penyedia OpenAI normal atau melalui runtime app-server Codex, tergantung pada `agents.defaults.agentRuntime.id`. Lihat [Runtime agen](/id/concepts/agent-runtimes).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (sesuai urutan).
  </Step>
  <Step title="Failover auth penyedia">
    Failover auth terjadi di dalam penyedia sebelum berpindah ke model berikutnya.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Permukaan model terkait">
    - `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (ditambah alias).
    - `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
    - `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika dihilangkan, alat akan fallback ke `agents.defaults.imageModel`, lalu model sesi/default yang di-resolve.
    - `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar yang tersisa dalam urutan provider-id. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar yang tersisa dalam urutan provider-id. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar yang tersisa dalam urutan provider-id. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - Default per agen dapat mengganti `agents.defaults.model` melalui `agents.list[].model` ditambah binding (lihat [Routing multi-agen](/id/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Sumber pemilihan dan perilaku fallback

`provider/model` yang sama dapat berarti hal berbeda tergantung dari mana asalnya:

- Default yang dikonfigurasi (`agents.defaults.model.primary` dan primary khusus agen) adalah titik awal normal dan menggunakan `agents.defaults.model.fallbacks`.
- Pemilihan fallback otomatis adalah status pemulihan sementara. Ini disimpan dengan `modelOverrideSource: "auto"` sehingga giliran berikutnya dapat terus menggunakan rantai fallback tanpa mencoba primary yang diketahui bermasalah terlebih dahulu.
- Pemilihan sesi pengguna bersifat tepat. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`; jika penyedia/model yang dipilih itu tidak dapat dijangkau, OpenClaw gagal secara terlihat alih-alih jatuh ke model terkonfigurasi lain.
- Cron `--model` / payload `model` adalah primary per pekerjaan. Ini tetap menggunakan fallback yang dikonfigurasi kecuali pekerjaan memasok payload `fallbacks` eksplisit (gunakan `fallbacks: []` untuk eksekusi cron yang ketat).
- Pemilih default-model dan allowlist CLI menghormati `models.mode: "replace"` dengan mencantumkan `models.providers.*.models` eksplisit alih-alih memuat katalog bawaan lengkap.
- Pemilih model Control UI meminta Gateway untuk tampilan model yang dikonfigurasi: `agents.defaults.models` saat ada, jika tidak maka `models.providers.*.models` eksplisit ditambah penyedia dengan auth yang dapat digunakan. Katalog bawaan lengkap dicadangkan untuk tampilan jelajah eksplisit seperti `models.list` dengan `view: "all"` atau `openclaw models list --all`.

## Kebijakan model singkat

- Atur primary Anda ke model generasi terbaru terkuat yang tersedia untuk Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat berisiko lebih rendah.
- Untuk agen yang mengaktifkan alat atau input tidak tepercaya, hindari tier model yang lebih lama/lebih lemah.

## Onboarding (direkomendasikan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + auth untuk penyedia umum, termasuk **OpenAI Code (Codex) subscription** (OAuth) dan **Anthropic** (kunci API atau Claude CLI).

## Kunci konfigurasi (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter penyedia)
- `models.providers` (penyedia kustom yang ditulis ke `models.json`)

<Note>
Ref model dinormalisasi menjadi huruf kecil. Alias penyedia seperti `z.ai/*` dinormalisasi menjadi `zai/*`.

Contoh konfigurasi penyedia (termasuk OpenCode) ada di [OpenCode](/id/providers/opencode).
</Note>

### Edit allowlist aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Aturan perlindungan clobber">
    `openclaw config set` melindungi peta model/penyedia dari clobber tidak sengaja. Assignment objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` ditolak saat itu akan menghapus entri yang sudah ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya saat nilai yang diberikan harus menjadi nilai target lengkap.

    Penyiapan penyedia interaktif dan `openclaw configure --section model` juga menggabungkan pemilihan berlingkup penyedia ke allowlist yang sudah ada, sehingga menambahkan Codex, Ollama, atau penyedia lain tidak menghapus entri model yang tidak terkait. Configure mempertahankan `agents.defaults.model.primary` yang sudah ada saat auth penyedia diterapkan kembali. Perintah penetapan default eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model tidak diizinkan" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` diatur, itu menjadi **allowlist** untuk `/model` dan untuk override sesi. Saat pengguna memilih model yang tidak ada di allowlist tersebut, OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Ini terjadi **sebelum** balasan normal dibuat, sehingga pesan dapat terasa seperti "tidak merespons." Perbaikannya adalah salah satu dari berikut:

- Tambahkan model ke `agents.defaults.models`, atau
- Kosongkan allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

</Warning>

Untuk model lokal/GGUF, simpan ref lengkap dengan prefiks penyedia di allowlist,
misalnya `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, atau
provider/model persis yang ditampilkan oleh `openclaw models list --provider <provider>`.
Nama file lokal polos atau nama tampilan saja tidak cukup saat allowlist
aktif.

Contoh konfigurasi allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Mengganti model dalam chat (`/model`)

Anda dapat mengganti model untuk sesi saat ini tanpa memulai ulang:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Perilaku pemilih">
    - `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
    - Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model serta langkah Submit.
    - `/models add` sudah deprecated dan sekarang mengembalikan pesan deprecation alih-alih mendaftarkan model dari chat.
    - `/model <#>` memilih dari pemilih tersebut.

  </Accordion>
  <Accordion title="Persistensi dan penggantian langsung">
    - `/model` segera mempertahankan pemilihan sesi baru.
    - Jika agen idle, run berikutnya langsung menggunakan model baru.
    - Jika run sudah aktif, OpenClaw menandai penggantian langsung sebagai pending dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, penggantian pending dapat tetap antre hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
    - Ref `/model` yang dipilih pengguna bersifat ketat untuk sesi tersebut: jika penyedia/model yang dipilih tidak dapat dijangkau, balasan gagal secara terlihat alih-alih diam-diam menjawab dari `agents.defaults.model.fallbacks`. Ini berbeda dari default yang dikonfigurasi dan primary pekerjaan cron, yang masih dapat menggunakan rantai fallback.
    - `/model status` adalah tampilan terperinci (kandidat auth dan, saat dikonfigurasi, endpoint penyedia `baseUrl` + mode `api`).

  </Accordion>
  <Accordion title="Parsing ref">
    - Ref model di-parse dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
    - Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks penyedia (contoh: `/model openrouter/moonshotai/kimi-k2`).
    - Jika Anda menghilangkan penyedia, OpenClaw me-resolve input dalam urutan ini:
      1. kecocokan alias
      2. kecocokan penyedia terkonfigurasi unik untuk id model tanpa prefiks yang persis sama
      3. fallback deprecated ke penyedia default terkonfigurasi — jika penyedia itu tidak lagi mengekspos model default terkonfigurasi, OpenClaw sebagai gantinya fallback ke penyedia/model terkonfigurasi pertama untuk menghindari menampilkan default penyedia terhapus yang usang.
  </Accordion>
</AccordionGroup>

Perilaku/konfigurasi perintah lengkap: [Perintah slash](/id/tools/slash-commands).

## Perintah CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (tanpa subperintah) adalah pintasan untuk `models status`.

### `models list`

Menampilkan model yang dikonfigurasi/tersedia-auth secara default. Flag yang berguna:

<ParamField path="--all" type="boolean">
  Katalog lengkap. Mencakup baris katalog statis milik penyedia bawaan sebelum auth dikonfigurasi, sehingga tampilan khusus discovery dapat menampilkan model yang tidak tersedia sampai Anda menambahkan kredensial penyedia yang sesuai.
</ParamField>
<ParamField path="--local" type="boolean">
  Hanya penyedia lokal.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filter berdasarkan id penyedia, misalnya `moonshot`. Label tampilan dari pemilih interaktif tidak diterima.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satu model per baris.
</ParamField>
<ParamField path="--json" type="boolean">
  Output yang dapat dibaca mesin.
</ParamField>

### `models status`

Menampilkan model utama yang diselesaikan, cadangan, model gambar, dan ringkasan autentikasi penyedia yang dikonfigurasi. Ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan di penyimpanan autentikasi (memperingatkan dalam 24 jam secara default). `--plain` hanya mencetak model utama yang diselesaikan.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika penyedia yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Autentikasi hilang**.
    - JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers` (autentikasi efektif per penyedia, termasuk kredensial berbasis env). `auth.oauth` hanya kesehatan profil penyimpanan autentikasi; penyedia hanya-env tidak muncul di sana.
    - Gunakan `--check` untuk otomatisasi (keluar `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
    - Gunakan `--probe` untuk pemeriksaan autentikasi langsung; baris uji dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.
    - Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, uji melaporkan `excluded_by_auth_order` alih-alih mencobanya. Jika autentikasi ada tetapi tidak ada model yang dapat diuji yang dapat diselesaikan untuk penyedia tersebut, uji melaporkan `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Pilihan autentikasi bergantung pada penyedia/akun. Untuk host gateway yang selalu aktif, kunci API biasanya paling dapat diprediksi; penggunaan ulang Claude CLI serta profil OAuth/token Anthropic yang sudah ada juga didukung.
</Note>

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan secara opsional dapat menguji model untuk dukungan alat dan gambar.

<ParamField path="--no-probe" type="boolean">
  Lewati uji langsung (hanya metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Ukuran parameter minimum (miliar).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Lewati model yang lebih lama.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filter prefiks penyedia.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Ukuran daftar cadangan.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Tetapkan `agents.defaults.model.primary` ke pilihan pertama.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Tetapkan `agents.defaults.imageModel.primary` ke pilihan gambar pertama.
</ParamField>

<Note>
Katalog `/models` OpenRouter bersifat publik, jadi pemindaian hanya-metadata dapat mencantumkan kandidat gratis tanpa kunci. Pengujian dan inferensi tetap memerlukan kunci API OpenRouter (dari profil autentikasi atau `OPENROUTER_API_KEY`). Jika tidak ada kunci yang tersedia, `openclaw models scan` kembali ke output hanya-metadata dan membiarkan konfigurasi tidak berubah. Gunakan `--no-probe` untuk meminta mode hanya-metadata secara eksplisit.
</Note>

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi alat
3. Ukuran konteks
4. Jumlah parameter

Input:

- Daftar `/models` OpenRouter (filter `:free`)
- Uji langsung memerlukan kunci API OpenRouter dari profil autentikasi atau `OPENROUTER_API_KEY` (lihat [Variabel lingkungan](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol permintaan/uji: `--timeout`, `--concurrency`

Saat uji langsung berjalan di TTY, Anda dapat memilih cadangan secara interaktif. Dalam mode non-interaktif, teruskan `--yes` untuk menerima default. Hasil hanya-metadata bersifat informasional; `--set-default` dan `--set-image` memerlukan uji langsung agar OpenClaw tidak mengonfigurasi model OpenRouter tanpa kunci yang tidak dapat digunakan.

## Registri model (`models.json`)

Penyedia khusus dalam `models.providers` ditulis ke `models.json` di bawah direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini digabungkan secara default kecuali `models.mode` diatur ke `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Prioritas mode penggabungan untuk ID penyedia yang cocok:

    - `baseUrl` tidak kosong yang sudah ada di `models.json` agen menang.
    - `apiKey` tidak kosong di `models.json` agen hanya menang saat penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil-autentikasi saat ini.
    - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih mempertahankan rahasia yang diselesaikan.
    - Nilai header penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
    - `apiKey`/`baseUrl` agen yang kosong atau hilang kembali ke `models.providers` konfigurasi.
    - Bidang penyedia lainnya disegarkan dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

<Note>
Persistensi penanda bersifat otoritatif terhadap sumber: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai rahasia runtime yang diselesaikan. Ini berlaku setiap kali OpenClaw membuat ulang `models.json`, termasuk jalur yang digerakkan perintah seperti `openclaw agent`.
</Note>

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — PI, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai cadangan
- [Penyedia model](/id/concepts/model-providers) — perutean penyedia dan autentikasi
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
