---
read_when:
    - Menambahkan atau mengubah CLI models (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku fallback model atau UX pemilihan
    - Memperbarui probe pemindaian model (tool/gambar)
summary: 'CLI Models: daftar, setel, alias, fallback, pindai, status'
title: CLI Models
x-i18n:
    generated_at: "2026-04-05T13:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# CLI Models

Lihat [/concepts/model-failover](/concepts/model-failover) untuk rotasi
profil autentikasi, cooldown, dan bagaimana itu berinteraksi dengan fallback.
Ikhtisar singkat penyedia + contoh: [/concepts/model-providers](/concepts/model-providers).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

1. Model **utama** (`agents.defaults.model.primary` atau `agents.defaults.model`).
2. **Fallback** di `agents.defaults.model.fallbacks` (berurutan).
3. **Failover autentikasi penyedia** terjadi di dalam penyedia sebelum berpindah ke
   model berikutnya.

Terkait:

- `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (beserta alias).
- `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh tool `pdf`. Jika dihilangkan, tool ini
  akan fallback ke `agents.defaults.imageModel`, lalu ke model sesi/default yang telah di-resolve.
- `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Fitur ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar lainnya dalam urutan provider-id. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
- `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Tidak seperti pembuatan gambar, saat ini fitur ini tidak menyimpulkan default penyedia. Tetapkan `provider/model` eksplisit seperti `qwen/wan2.6-t2v`, dan konfigurasikan juga autentikasi/kunci API penyedia tersebut.
- Default per agen dapat mengganti `agents.defaults.model` melalui `agents.list[].model` beserta bindings (lihat [/concepts/multi-agent](/concepts/multi-agent)).

## Kebijakan model singkat

- Setel model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat dengan risiko lebih rendah.
- Untuk agen dengan tool aktif atau input yang tidak tepercaya, hindari model tingkat lama/lebih lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Fitur ini dapat menyiapkan model + autentikasi untuk penyedia umum, termasuk langganan **OpenAI Code (Codex)**
(OAuth) dan **Anthropic** (kunci API atau Claude CLI).

## Kunci konfigurasi (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter penyedia)
- `models.providers` (penyedia kustom yang ditulis ke `models.json`)

Referensi model dinormalisasi menjadi huruf kecil. Alias penyedia seperti `z.ai/*` dinormalisasi
menjadi `zai/*`.

Contoh konfigurasi penyedia (termasuk OpenCode) tersedia di
[/providers/opencode](/providers/opencode).

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan untuk
override sesi. Ketika pengguna memilih model yang tidak ada di allowlist itu,
OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Ini terjadi **sebelum** balasan normal dihasilkan, sehingga pesan bisa terasa
seperti “tidak merespons.” Perbaikannya adalah dengan:

- Menambahkan model ke `agents.defaults.models`, atau
- Menghapus allowlist (hapus `agents.defaults.models`), atau
- Memilih model dari `/model list`.

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

## Mengganti model di chat (`/model`)

Anda dapat mengganti model untuk sesi saat ini tanpa memulai ulang:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Catatan:

- `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model serta langkah Submit.
- `/model <#>` memilih dari pemilih tersebut.
- `/model` langsung menyimpan pilihan sesi yang baru.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakan model baru.
- Jika eksekusi sudah aktif, OpenClaw menandai perpindahan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang aman.
- Jika aktivitas tool atau output balasan sudah dimulai, perpindahan tertunda dapat tetap mengantre hingga ada kesempatan retry berikutnya atau giliran pengguna berikutnya.
- `/model status` adalah tampilan detail (kandidat autentikasi dan, jika dikonfigurasi, `baseUrl` endpoint penyedia + mode `api`).
- Referensi model diparse dengan membagi pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks penyedia (contoh: `/model openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw me-resolve input dalam urutan ini:
  1. kecocokan alias
  2. kecocokan penyedia-terkonfigurasi unik untuk ID model tanpa prefiks yang persis sama
  3. fallback usang ke penyedia default yang dikonfigurasi
     Jika penyedia itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
     akan fallback ke penyedia/model terkonfigurasi pertama untuk menghindari
     menampilkan default penyedia terhapus yang sudah usang.

Perilaku/perintah konfigurasi lengkap: [Slash commands](/tools/slash-commands).

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

Secara default menampilkan model yang dikonfigurasi. Flag yang berguna:

- `--all`: katalog lengkap
- `--local`: hanya penyedia lokal
- `--provider <name>`: filter berdasarkan penyedia
- `--plain`: satu model per baris
- `--json`: output yang dapat dibaca mesin

### `models status`

Menampilkan model utama yang telah di-resolve, fallback, model gambar, dan ikhtisar autentikasi
dari penyedia yang dikonfigurasi. Perintah ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan
di penyimpanan autentikasi (memberi peringatan dalam 24 jam secara default). `--plain` hanya mencetak
model utama yang telah di-resolve.
Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika sebuah
penyedia yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers`
(autentikasi efektif per penyedia).
Gunakan `--check` untuk otomatisasi (kode keluar `1` jika hilang/kedaluwarsa, `2` jika akan kedaluwarsa).
Gunakan `--probe` untuk pemeriksaan autentikasi langsung; baris probe dapat berasal dari profil autentikasi, kredensial env,
atau `models.json`.
Jika `auth.order.<provider>` eksplisit menghilangkan profil yang tersimpan, probe melaporkan
`excluded_by_auth_order` alih-alih mencobanya. Jika autentikasi ada tetapi tidak ada model yang bisa diprobe yang dapat di-resolve untuk penyedia tersebut, probe melaporkan `status: no_model`.

Pilihan autentikasi bergantung pada penyedia/akun. Untuk host Gateway yang selalu aktif, kunci API
biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil OAuth/token Anthropic
yang sudah ada juga didukung.

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat
secara opsional memprobe model untuk dukungan tool dan gambar.

Flag utama:

- `--no-probe`: lewati probe langsung (metadata saja)
- `--min-params <b>`: ukuran parameter minimum (miliar)
- `--max-age-days <days>`: lewati model yang lebih lama
- `--provider <name>`: filter prefiks penyedia
- `--max-candidates <n>`: ukuran daftar fallback
- `--set-default`: setel `agents.defaults.model.primary` ke pilihan pertama
- `--set-image`: setel `agents.defaults.imageModel.primary` ke pilihan gambar pertama

Probe memerlukan kunci API OpenRouter (dari profil autentikasi atau
`OPENROUTER_API_KEY`). Tanpa kunci, gunakan `--no-probe` untuk hanya menampilkan kandidat.

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi tool
3. Ukuran konteks
4. Jumlah parameter

Input

- Daftar OpenRouter `/models` (filter `:free`)
- Memerlukan kunci API OpenRouter dari profil autentikasi atau `OPENROUTER_API_KEY` (lihat [/environment](/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol probe: `--timeout`, `--concurrency`

Saat dijalankan di TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif,
berikan `--yes` untuk menerima default.

## Registri model (`models.json`)

Penyedia kustom di `models.providers` ditulis ke `models.json` di bawah
direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini
digabungkan secara default kecuali `models.mode` disetel ke `replace`.

Prioritas mode gabung untuk provider ID yang cocok:

- `baseUrl` non-kosong yang sudah ada di `models.json` agen akan menang.
- `apiKey` non-kosong di `models.json` agen hanya menang ketika penyedia itu tidak dikelola SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
- Nilai `apiKey` penyedia yang dikelola SecretRef diperbarui dari marker sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec) alih-alih menyimpan secret yang telah di-resolve.
- Nilai header penyedia yang dikelola SecretRef diperbarui dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
- `apiKey`/`baseUrl` agen yang kosong atau tidak ada akan fallback ke konfigurasi `models.providers`.
- Field penyedia lainnya diperbarui dari konfigurasi dan data katalog yang dinormalisasi.

Persistensi marker bersifat authoritative terhadap sumber: OpenClaw menulis marker dari snapshot konfigurasi sumber aktif (pra-resolve), bukan dari nilai secret runtime yang telah di-resolve.
Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang dipicu perintah seperti `openclaw agent`.

## Terkait

- [Model Providers](/concepts/model-providers) — perutean penyedia dan autentikasi
- [Model Failover](/concepts/model-failover) — rantai fallback
- [Image Generation](/tools/image-generation) — konfigurasi model gambar
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — kunci konfigurasi model
