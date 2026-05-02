---
read_when:
    - Menambahkan atau memodifikasi CLI models (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku penggunaan model cadangan atau pengalaman pengguna saat memilih
    - Memperbarui probe pemindaian model (alat/gambar)
sidebarTitle: Models CLI
summary: 'CLI Model: daftar, atur, alias, alternatif cadangan, pindai, status'
title: CLI Model
x-i18n:
    generated_at: "2026-05-02T09:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil autentikasi, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
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

Ref model memilih penyedia dan model. Ref tersebut biasanya tidak memilih runtime agen tingkat rendah. Misalnya, `openai/gpt-5.5` dapat berjalan melalui jalur penyedia OpenAI normal atau melalui runtime server aplikasi Codex, bergantung pada `agents.defaults.agentRuntime.id`. Dalam mode runtime Codex, ref `openai/gpt-*` tidak menyiratkan penagihan kunci API; autentikasi dapat berasal dari akun Codex atau profil autentikasi `openai-codex`. Lihat [Runtime agen](/id/concepts/agent-runtimes).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (berurutan).
  </Step>
  <Step title="Failover autentikasi penyedia">
    Failover autentikasi terjadi di dalam penyedia sebelum berpindah ke model berikutnya.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Permukaan model terkait">
    - `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (ditambah alias).
    - `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
    - `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika dihilangkan, alat akan fallback ke `agents.defaults.imageModel`, lalu model sesi/default yang sudah diselesaikan.
    - `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar yang tersisa dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar yang tersisa dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar yang tersisa dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - Default per agen dapat mengganti `agents.defaults.model` melalui `agents.list[].model` plus binding (lihat [Perutean multi-agen](/id/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Sumber pemilihan dan perilaku fallback

`provider/model` yang sama dapat berarti hal berbeda bergantung pada asalnya:

- Default yang dikonfigurasi (`agents.defaults.model.primary` dan utama khusus agen) adalah titik awal normal dan menggunakan `agents.defaults.model.fallbacks`.
- Pemilihan fallback otomatis adalah status pemulihan sementara. Pemilihan ini disimpan dengan `modelOverrideSource: "auto"` sehingga giliran berikutnya dapat terus menggunakan rantai fallback tanpa memeriksa model utama yang diketahui bermasalah terlebih dahulu.
- Pemilihan sesi pengguna bersifat persis. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`; jika penyedia/model yang dipilih tersebut tidak dapat dijangkau, OpenClaw gagal secara terlihat alih-alih jatuh ke model lain yang dikonfigurasi.
- Cron `--model` / payload `model` adalah model utama per pekerjaan. Ini tetap menggunakan fallback yang dikonfigurasi kecuali pekerjaan menyediakan payload `fallbacks` eksplisit (gunakan `fallbacks: []` untuk run cron ketat).
- Pemilih model default CLI dan allowlist menghormati `models.mode: "replace"` dengan mencantumkan `models.providers.*.models` eksplisit alih-alih memuat katalog bawaan lengkap.
- Pemilih model Control UI meminta tampilan model yang dikonfigurasi dari Gateway: `agents.defaults.models` jika ada, jika tidak `models.providers.*.models` eksplisit plus penyedia dengan autentikasi yang dapat digunakan. Katalog bawaan lengkap dicadangkan untuk tampilan jelajah eksplisit seperti `models.list` dengan `view: "all"` atau `openclaw models list --all`.

## Kebijakan model cepat

- Atur model utama Anda ke model generasi terbaru terkuat yang tersedia untuk Anda.
- Gunakan fallback untuk tugas yang sensitif biaya/latensi dan obrolan dengan risiko lebih rendah.
- Untuk agen yang mengaktifkan alat atau input tidak tepercaya, hindari tingkat model yang lebih lama/lebih lemah.

## Onboarding (direkomendasikan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + autentikasi untuk penyedia umum, termasuk **langganan OpenAI Code (Codex)** (OAuth) dan **Anthropic** (kunci API atau Claude CLI).

## Kunci konfigurasi (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter penyedia)
- `models.providers` (penyedia kustom yang ditulis ke `models.json`)

<Note>
Ref model dinormalisasi ke huruf kecil. Alias penyedia seperti `z.ai/*` dinormalisasi menjadi `zai/*`.

Contoh konfigurasi penyedia (termasuk OpenCode) tersedia di [OpenCode](/id/providers/opencode).
</Note>

### Edit allowlist yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Aturan perlindungan penimpaan">
    `openclaw config set` melindungi peta model/penyedia dari penimpaan yang tidak disengaja. Penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` ditolak jika akan menghapus entri yang sudah ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang diberikan harus menjadi nilai target lengkap.

    Penyiapan penyedia interaktif dan `openclaw configure --section model` juga menggabungkan pemilihan berskala penyedia ke allowlist yang sudah ada, sehingga menambahkan Codex, Ollama, atau penyedia lain tidak menghapus entri model yang tidak terkait. Configure mempertahankan `agents.defaults.model.primary` yang sudah ada ketika autentikasi penyedia diterapkan ulang. Perintah pengaturan default eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model tidak diizinkan" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` diatur, itu menjadi **allowlist** untuk `/model` dan untuk override sesi. Ketika pengguna memilih model yang tidak ada dalam allowlist tersebut, OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Ini terjadi **sebelum** balasan normal dibuat, sehingga pesan dapat terasa seperti "tidak merespons." Perbaikannya adalah salah satu dari:

- Tambahkan model ke `agents.defaults.models`, atau
- Kosongkan allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

</Warning>

Untuk model lokal/GGUF, simpan ref lengkap berprefiks penyedia di allowlist,
misalnya `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, atau
provider/model persis yang ditampilkan oleh `openclaw models list --provider <provider>`.
Nama file lokal polos atau nama tampilan tidak cukup ketika allowlist
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

## Beralih model di chat (`/model`)

Anda dapat beralih model untuk sesi saat ini tanpa memulai ulang:

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
    - Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit.
    - Di Telegram, pemilihan pemilih `/models` berskala sesi; pemilihan tersebut tidak mengubah default persisten agen di `openclaw.json`.
    - `/models add` sudah tidak digunakan dan sekarang mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari chat.
    - `/model <#>` memilih dari pemilih tersebut.

  </Accordion>
  <Accordion title="Persistensi dan peralihan langsung">
    - `/model` langsung mempertahankan pemilihan sesi baru.
    - Jika agen idle, run berikutnya langsung menggunakan model baru.
    - Jika run sudah aktif, OpenClaw menandai peralihan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, peralihan tertunda dapat tetap mengantre hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
    - Ref `/model` yang dipilih pengguna bersifat ketat untuk sesi tersebut: jika penyedia/model yang dipilih tidak dapat dijangkau, balasan gagal secara terlihat alih-alih diam-diam menjawab dari `agents.defaults.model.fallbacks`. Ini berbeda dari default yang dikonfigurasi dan model utama pekerjaan cron, yang masih dapat menggunakan rantai fallback.
    - `/model status` adalah tampilan terperinci (kandidat autentikasi dan, jika dikonfigurasi, endpoint penyedia `baseUrl` + mode `api`).

  </Accordion>
  <Accordion title="Parsing ref">
    - Ref model di-parse dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
    - Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks penyedia (contoh: `/model openrouter/moonshotai/kimi-k2`).
    - Jika Anda menghilangkan penyedia, OpenClaw menyelesaikan input dalam urutan ini:
      1. kecocokan alias
      2. kecocokan penyedia-terkonfigurasi unik untuk ID model tanpa prefiks yang persis itu
      3. fallback usang ke penyedia default yang dikonfigurasi — jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw sebagai gantinya fallback ke penyedia/model terkonfigurasi pertama untuk menghindari menampilkan default penyedia terhapus yang sudah basi.
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

Menampilkan model yang dikonfigurasi/tersedia autentikasi secara default. Flag yang berguna:

<ParamField path="--all" type="boolean">
  Katalog lengkap. Menyertakan baris katalog statis milik penyedia bawaan sebelum autentikasi dikonfigurasi, sehingga tampilan khusus penemuan dapat menampilkan model yang tidak tersedia sampai Anda menambahkan kredensial penyedia yang sesuai.
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
  Keluaran yang dapat dibaca mesin.
</ParamField>

### `models status`

Menampilkan model utama yang diselesaikan, fallback, model gambar, dan ringkasan autentikasi penyedia yang dikonfigurasi. Perintah ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan di penyimpanan autentikasi (memperingatkan dalam 24 jam secara bawaan). `--plain` hanya mencetak model utama yang diselesaikan.

<AccordionGroup>
  <Accordion title="Perilaku autentikasi dan pemeriksaan">
    - Status OAuth selalu ditampilkan (dan disertakan dalam keluaran `--json`). Jika penyedia yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Autentikasi hilang**.
    - JSON menyertakan `auth.oauth` (jendela peringatan + profil) dan `auth.providers` (autentikasi efektif per penyedia, termasuk kredensial berbasis env). `auth.oauth` hanya untuk kesehatan profil penyimpanan autentikasi; penyedia khusus env tidak muncul di sana.
    - Gunakan `--check` untuk otomatisasi (keluar dengan `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
    - Gunakan `--probe` untuk pemeriksaan autentikasi langsung; baris pemeriksaan dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.
    - Jika `auth.order.<provider>` eksplisit menghilangkan profil yang tersimpan, pemeriksaan melaporkan `excluded_by_auth_order` alih-alih mencobanya. Jika autentikasi ada tetapi tidak ada model yang dapat diperiksa untuk penyedia tersebut, pemeriksaan melaporkan `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Pilihan autentikasi bergantung pada penyedia/akun. Untuk host gateway yang selalu aktif, kunci API biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil OAuth/token Anthropic yang ada juga didukung.
</Note>

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat secara opsional memeriksa dukungan alat dan gambar pada model.

<ParamField path="--no-probe" type="boolean">
  Lewati pemeriksaan langsung (hanya metadata).
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
  Ukuran daftar fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Tetapkan `agents.defaults.model.primary` ke pilihan pertama.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Tetapkan `agents.defaults.imageModel.primary` ke pilihan gambar pertama.
</ParamField>

<Note>
Katalog `/models` OpenRouter bersifat publik, sehingga pemindaian khusus metadata dapat mencantumkan kandidat gratis tanpa kunci. Pemeriksaan dan inferensi tetap memerlukan kunci API OpenRouter (dari profil autentikasi atau `OPENROUTER_API_KEY`). Jika tidak ada kunci yang tersedia, `openclaw models scan` kembali ke keluaran khusus metadata dan membiarkan konfigurasi tidak berubah. Gunakan `--no-probe` untuk meminta mode khusus metadata secara eksplisit.
</Note>

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi alat
3. Ukuran konteks
4. Jumlah parameter

Input:

- Daftar `/models` OpenRouter (filter `:free`)
- Pemeriksaan langsung memerlukan kunci API OpenRouter dari profil autentikasi atau `OPENROUTER_API_KEY` (lihat [Variabel lingkungan](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol permintaan/pemeriksaan: `--timeout`, `--concurrency`

Saat pemeriksaan langsung berjalan di TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif, berikan `--yes` untuk menerima bawaan. Hasil khusus metadata bersifat informatif; `--set-default` dan `--set-image` memerlukan pemeriksaan langsung agar OpenClaw tidak mengonfigurasi model OpenRouter tanpa kunci yang tidak dapat digunakan.

## Registri model (`models.json`)

Penyedia khusus di `models.providers` ditulis ke dalam `models.json` di bawah direktori agen (bawaan `~/.openclaw/agents/<agentId>/agent/models.json`). File ini digabungkan secara bawaan kecuali `models.mode` diatur ke `replace`.

<AccordionGroup>
  <Accordion title="Prioritas mode penggabungan">
    Prioritas mode penggabungan untuk ID penyedia yang cocok:

    - `baseUrl` tidak kosong yang sudah ada di `models.json` agen menang.
    - `apiKey` tidak kosong di `models.json` agen hanya menang ketika penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
    - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec) alih-alih mempertahankan rahasia yang telah diselesaikan.
    - Nilai header penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
    - `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke konfigurasi `models.providers`.
    - Kolom penyedia lainnya disegarkan dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

<Note>
Persistensi penanda bersumber otoritatif: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai rahasia runtime yang telah diselesaikan. Ini berlaku setiap kali OpenClaw membuat ulang `models.json`, termasuk jalur yang didorong perintah seperti `openclaw agent`.
</Note>

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — PI, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — perutean dan autentikasi penyedia
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
