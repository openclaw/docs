---
read_when:
    - Menambahkan atau mengubah CLI models (`models list/set/scan/aliases/fallbacks`)
    - Mengubah perilaku fallback model atau UX pemilihan model
    - Memperbarui probe pemindaian model (tool/gambar)
summary: 'CLI model: daftar, setel, alias, fallback, pemindaian, status'
title: CLI Models
x-i18n:
    generated_at: "2026-04-24T09:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Lihat [/concepts/model-failover](/id/concepts/model-failover) untuk rotasi
auth profile, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
Ikhtisar provider cepat + contoh: [/concepts/model-providers](/id/concepts/model-providers).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan berikut:

1. Model **utama** (`agents.defaults.model.primary` atau `agents.defaults.model`).
2. **Fallback** di `agents.defaults.model.fallbacks` (berurutan).
3. **Provider auth failover** terjadi di dalam sebuah provider sebelum berpindah ke
   model berikutnya.

Terkait:

- `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (beserta alias).
- `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh tool `pdf`. Jika dihilangkan, tool
  akan kembali ke `agents.defaults.imageModel`, lalu model sesi/default yang telah di-resolve.
- `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas generasi gambar bersama. Jika dihilangkan, `image_generate` masih dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider generasi gambar terdaftar lainnya menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas generasi musik bersama. Jika dihilangkan, `music_generate` masih dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider generasi musik terdaftar lainnya menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas generasi video bersama. Jika dihilangkan, `video_generate` masih dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider generasi video terdaftar lainnya menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- Default per agen dapat menimpa `agents.defaults.model` melalui `agents.list[].model` beserta binding (lihat [/concepts/multi-agent](/id/concepts/multi-agent)).

## Kebijakan model cepat

- Setel model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan obrolan dengan risiko lebih rendah.
- Untuk agen yang mengaktifkan tool atau input yang tidak tepercaya, hindari model lama/lebih lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + auth untuk provider umum, termasuk **langganan
OpenAI Code (Codex)** (OAuth) dan **Anthropic** (API key atau Claude CLI).

## Kunci konfigurasi (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter provider)
- `models.providers` (provider kustom yang ditulis ke `models.json`)

Ref model dinormalkan ke huruf kecil. Alias provider seperti `z.ai/*` dinormalkan
menjadi `zai/*`.

Contoh konfigurasi provider (termasuk OpenCode) ada di
[/providers/opencode](/id/providers/opencode).

### Edit allowlist yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` melindungi peta model/provider dari penimpaan yang tidak disengaja. Penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` akan ditolak ketika dapat menghapus entri yang sudah ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang diberikan memang harus menjadi seluruh nilai target.

Penyiapan provider interaktif dan `openclaw configure --section model` juga menggabungkan pilihan bercakupan provider ke allowlist yang ada, sehingga menambahkan Codex,
Ollama, atau provider lain tidak akan menghapus entri model yang tidak terkait.

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan untuk
override sesi. Saat pengguna memilih model yang tidak ada dalam allowlist itu,
OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Ini terjadi **sebelum** balasan normal dibuat, sehingga pesannya bisa terasa
seperti “tidak merespons.” Perbaikannya adalah:

- Tambahkan model itu ke `agents.defaults.models`, atau
- Kosongkan allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

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

Anda dapat mengganti model untuk sesi saat ini tanpa restart:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Catatan:

- `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/models add` tersedia secara default dan dapat dinonaktifkan dengan `commands.modelsWrite=false`.
- Jika diaktifkan, `/models add <provider> <modelId>` adalah jalur tercepat; `/models add` tanpa argumen memulai alur terpandu yang mendahulukan provider jika didukung.
- Setelah `/models add`, model baru akan tersedia di `/models` dan `/model` tanpa restart Gateway.
- `/model <#>` memilih dari pemilih tersebut.
- `/model` langsung mempertahankan pilihan sesi baru.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakan model baru.
- Jika eksekusi sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya melakukan restart ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, perpindahan tertunda dapat tetap mengantre sampai kesempatan retry berikutnya atau giliran pengguna berikutnya.
- `/model status` adalah tampilan terperinci (kandidat auth dan, jika dikonfigurasi, `baseUrl` endpoint provider + mode `api`).
- Ref model diparse dengan memisahkan pada **`/` pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
- Jika ID model itu sendiri mengandung `/` (gaya OpenRouter), Anda harus menyertakan prefiks provider (contoh: `/model openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input dalam urutan ini:
  1. kecocokan alias
  2. kecocokan provider terkonfigurasi yang unik untuk id model tanpa prefiks yang tepat
  3. fallback usang ke provider default yang dikonfigurasi
     Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
     akan kembali ke provider/model terkonfigurasi pertama untuk menghindari
     menampilkan default provider lama yang sudah dihapus.

Perilaku/konfigurasi perintah lengkap: [Slash commands](/id/tools/slash-commands).

Contoh:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

Menampilkan model yang dikonfigurasi secara default. Flag yang berguna:

- `--all`: katalog penuh
- `--local`: hanya provider lokal
- `--provider <id>`: filter menurut id provider, misalnya `moonshot`; label tampilan dari pemilih interaktif tidak diterima
- `--plain`: satu model per baris
- `--json`: output yang dapat dibaca mesin

`--all` mencakup baris katalog statis bawaan milik provider sebelum auth
dikonfigurasi, sehingga tampilan khusus discovery dapat menampilkan model yang belum tersedia sampai Anda menambahkan kredensial provider yang sesuai.

### `models status`

Menampilkan model utama yang telah di-resolve, fallback, model gambar, dan ikhtisar auth
provider yang dikonfigurasi. Ini juga menampilkan status kedaluwarsa OAuth untuk profile yang ditemukan
di auth store (memberi peringatan dalam 24 jam secara default). `--plain` hanya mencetak model utama yang telah di-resolve.
Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika provider yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
JSON mencakup `auth.oauth` (jendela peringatan + profile) dan `auth.providers`
(auth efektif per provider, termasuk kredensial berbasis env). `auth.oauth`
hanya kesehatan profile auth-store; provider yang hanya berbasis env tidak muncul di sana.
Gunakan `--check` untuk otomatisasi (keluar `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
Gunakan `--probe` untuk pemeriksaan auth live; baris probe dapat berasal dari auth profile, kredensial env, atau `models.json`.
Jika `auth.order.<provider>` eksplisit menghilangkan profile yang tersimpan, probe melaporkan
`excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang dapat diprobe untuk provider tersebut, probe melaporkan `status: no_model`.

Pilihan auth bergantung pada provider/akun. Untuk host Gateway yang selalu aktif, API key biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profile Anthropic OAuth/token yang ada juga didukung.

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat
secara opsional memprobe model untuk dukungan tool dan gambar.

Flag utama:

- `--no-probe`: lewati probe live (hanya metadata)
- `--min-params <b>`: ukuran parameter minimum (miliar)
- `--max-age-days <days>`: lewati model yang lebih lama
- `--provider <name>`: filter prefiks provider
- `--max-candidates <n>`: ukuran daftar fallback
- `--set-default`: setel `agents.defaults.model.primary` ke pilihan pertama
- `--set-image`: setel `agents.defaults.imageModel.primary` ke pilihan gambar pertama

Probing memerlukan API key OpenRouter (dari auth profile atau
`OPENROUTER_API_KEY`). Tanpa key, gunakan `--no-probe` untuk hanya mencantumkan kandidat.

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi tool
3. Ukuran konteks
4. Jumlah parameter

Input

- Daftar `/models` OpenRouter (filter `:free`)
- Memerlukan API key OpenRouter dari auth profile atau `OPENROUTER_API_KEY` (lihat [/environment](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol probe: `--timeout`, `--concurrency`

Saat dijalankan dalam TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif, berikan `--yes` untuk menerima default.

## Registry model (`models.json`)

Provider kustom dalam `models.providers` ditulis ke `models.json` di bawah
direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini
digabungkan secara default kecuali `models.mode` disetel ke `replace`.

Prioritas mode merge untuk id provider yang cocok:

- `baseUrl` non-kosong yang sudah ada di `models.json` agen akan diprioritaskan.
- `apiKey` non-kosong di `models.json` agen akan diprioritaskan hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks konfigurasi/auth-profile saat ini.
- Nilai `apiKey` provider yang dikelola SecretRef diperbarui dari penanda sumber (`ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref) alih-alih mempersistensikan secret hasil resolve.
- Nilai header provider yang dikelola SecretRef diperbarui dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref).
- `apiKey`/`baseUrl` agen yang kosong atau hilang akan kembali ke config `models.providers`.
- Field provider lainnya diperbarui dari konfigurasi dan data katalog yang dinormalkan.

Persistensi penanda bersifat source-authoritative: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (sebelum resolve), bukan dari nilai secret runtime yang telah di-resolve.
Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang digerakkan perintah seperti `openclaw agent`.

## Terkait

- [Provider Model](/id/concepts/model-providers) — routing provider dan auth
- [Model Failover](/id/concepts/model-failover) — rantai fallback
- [Generasi Gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Generasi Musik](/id/tools/music-generation) — konfigurasi model musik
- [Generasi Video](/id/tools/video-generation) — konfigurasi model video
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
