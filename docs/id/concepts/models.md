---
read_when:
    - Menambahkan atau memodifikasi CLI models (`models list/set/scan/aliases/fallbacks`)
    - Mengubah perilaku fallback model atau UX pemilihan
    - Memperbarui probe pemindaian model (tools/images)
sidebarTitle: Models CLI
summary: 'CLI Models: list, set, alias, fallback, scan, status'
title: CLI Models
x-i18n:
    generated_at: "2026-04-26T11:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil auth, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
  </Card>
  <Card title="Provider model" href="/id/concepts/model-providers">
    Ikhtisar provider singkat dan contoh.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent-runtimes">
    PI, Codex, dan runtime loop agen lainnya.
  </Card>
  <Card title="Referensi config" href="/id/gateway/config-agents#agent-defaults">
    Key config model.
  </Card>
</CardGroup>

Ref model memilih provider dan model. Biasanya tidak memilih runtime agen level rendah. Misalnya, `openai/gpt-5.5` dapat berjalan melalui jalur provider OpenAI normal atau melalui runtime app-server Codex, tergantung pada `agents.defaults.agentRuntime.id`. Lihat [Runtime agen](/id/concepts/agent-runtimes).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (berurutan).
  </Step>
  <Step title="Failover auth provider">
    Failover auth terjadi di dalam provider sebelum berpindah ke model berikutnya.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Surface model terkait">
    - `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (beserta alias).
    - `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
    - `agents.defaults.pdfModel` digunakan oleh tool `pdf`. Jika dihilangkan, tool akan fallback ke `agents.defaults.imageModel`, lalu model sesi/default yang telah di-resolve.
    - `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider yang didukung auth. Mula-mula mencoba provider default saat ini, lalu provider pembuatan gambar terdaftar yang tersisa dalam urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
    - `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider yang didukung auth. Mula-mula mencoba provider default saat ini, lalu provider pembuatan musik terdaftar yang tersisa dalam urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
    - `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider yang didukung auth. Mula-mula mencoba provider default saat ini, lalu provider pembuatan video terdaftar yang tersisa dalam urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
    - Default per agen dapat menimpa `agents.defaults.model` melalui `agents.list[].model` beserta binding (lihat [Routing multi-agen](/id/concepts/multi-agent)).
  </Accordion>
</AccordionGroup>

## Kebijakan model cepat

- Tetapkan model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat dengan risiko lebih rendah.
- Untuk agen dengan tool aktif atau input yang tidak tepercaya, hindari model tingkat lama/lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit config secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + auth untuk provider umum, termasuk **langganan OpenAI Code (Codex)** (OAuth) dan **Anthropic** (API key atau CLI Claude).

## Key config (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter provider)
- `models.providers` (provider kustom yang ditulis ke `models.json`)

<Note>
Ref model dinormalisasi ke huruf kecil. Alias provider seperti `z.ai/*` dinormalisasi menjadi `zai/*`.

Contoh config provider (termasuk OpenCode) ada di [OpenCode](/id/providers/opencode).
</Note>

### Pengeditan allowlist yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Aturan perlindungan clobber">
    `openclaw config set` melindungi map model/provider dari clobber yang tidak disengaja. Assignment objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` akan ditolak jika akan menghapus entri yang ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang diberikan memang harus menjadi seluruh nilai target.

    Penyiapan provider interaktif dan `openclaw configure --section model` juga menggabungkan pilihan dengan cakupan provider ke dalam allowlist yang ada, sehingga menambahkan Codex, Ollama, atau provider lain tidak menghapus entri model yang tidak terkait. Configure mempertahankan `agents.defaults.model.primary` yang sudah ada saat auth provider diterapkan ulang. Perintah penetapan default yang eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` diatur, ini menjadi **allowlist** untuk `/model` dan untuk override sesi. Saat pengguna memilih model yang tidak ada dalam allowlist tersebut, OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Ini terjadi **sebelum** balasan normal dihasilkan, sehingga pesannya bisa terasa seperti "tidak merespons." Solusinya adalah:

- Tambahkan model ke `agents.defaults.models`, atau
- Hapus allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.
</Warning>

Contoh config allowlist:

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

Anda dapat mengganti model untuk sesi saat ini tanpa restart:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Perilaku pemilih">
    - `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + provider yang tersedia).
    - Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
    - `/models add` sudah usang dan sekarang mengembalikan pesan deprecasi alih-alih mendaftarkan model dari chat.
    - `/model <#>` memilih dari pemilih tersebut.
  </Accordion>
  <Accordion title="Persistensi dan penggantian live">
    - `/model` langsung menyimpan pilihan sesi baru.
    - Jika agen idle, eksekusi berikutnya langsung menggunakan model baru.
    - Jika eksekusi sudah aktif, OpenClaw menandai pergantian live sebagai pending dan hanya restart ke model baru pada titik percobaan ulang yang bersih.
    - Jika aktivitas tool atau output balasan sudah dimulai, pergantian yang pending dapat tetap diantrikan hingga kesempatan percobaan ulang berikutnya atau giliran pengguna berikutnya.
    - `/model status` adalah tampilan detail (kandidat auth dan, bila dikonfigurasi, provider endpoint `baseUrl` + mode `api`).
  </Accordion>
  <Accordion title="Parsing ref">
    - Ref model di-parse dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
    - Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefix provider (contoh: `/model openrouter/moonshotai/kimi-k2`).
    - Jika Anda menghilangkan provider, OpenClaw me-resolve input dalam urutan ini:
      1. kecocokan alias
      2. kecocokan provider terkonfigurasi unik untuk id model tanpa prefix yang persis itu
      3. fallback usang ke provider default yang dikonfigurasi — jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw akan fallback ke provider/model terkonfigurasi pertama untuk menghindari menampilkan default provider terhapus yang basi.
  </Accordion>
</AccordionGroup>

Perilaku/config perintah lengkap: [Slash commands](/id/tools/slash-commands).

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

`openclaw models` (tanpa subperintah) adalah shortcut untuk `models status`.

### `models list`

Secara default menampilkan model yang dikonfigurasi. Flag yang berguna:

<ParamField path="--all" type="boolean">
  Katalog lengkap. Termasuk baris katalog statis milik provider bawaan sebelum auth dikonfigurasi, sehingga tampilan discovery-only dapat menampilkan model yang belum tersedia sampai Anda menambahkan kredensial provider yang sesuai.
</ParamField>
<ParamField path="--local" type="boolean">
  Hanya provider lokal.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filter berdasarkan id provider, misalnya `moonshot`. Label tampilan dari pemilih interaktif tidak diterima.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satu model per baris.
</ParamField>
<ParamField path="--json" type="boolean">
  Output yang dapat dibaca mesin.
</ParamField>

### `models status`

Menampilkan model utama yang telah di-resolve, fallback, model gambar, dan ikhtisar auth provider yang dikonfigurasi. Ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan di auth store (peringatan dalam 24 jam secara default). `--plain` hanya mencetak model utama yang telah di-resolve.

<AccordionGroup>
  <Accordion title="Perilaku auth dan probe">
    - Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika provider yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
    - JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers` (auth efektif per provider, termasuk kredensial yang didukung env). `auth.oauth` hanya untuk kesehatan profil auth-store; provider yang hanya berbasis env tidak muncul di sana.
    - Gunakan `--check` untuk otomatisasi (kode keluar `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
    - Gunakan `--probe` untuk pemeriksaan auth live; baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
    - Jika `auth.order.<provider>` eksplisit menghilangkan profil yang disimpan, probe melaporkan `excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang dapat diprobe untuk provider itu, probe melaporkan `status: no_model`.
  </Accordion>
</AccordionGroup>

<Note>
Pilihan auth bergantung pada provider/akun. Untuk host gateway yang selalu aktif, API key biasanya paling dapat diprediksi; penggunaan ulang CLI Claude dan profil OAuth/token Anthropic yang ada juga didukung.
</Note>

Contoh (CLI Claude):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan secara opsional dapat memprobe model untuk dukungan tool dan gambar.

<ParamField path="--no-probe" type="boolean">
  Lewati probe live (hanya metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Ukuran parameter minimum (miliar).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Lewati model yang lebih lama.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filter prefix provider.
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
Katalog OpenRouter `/models` bersifat publik, jadi pemindaian hanya metadata dapat mencantumkan kandidat gratis tanpa key. Probe dan inferensi tetap memerlukan API key OpenRouter (dari profil auth atau `OPENROUTER_API_KEY`). Jika tidak ada key yang tersedia, `openclaw models scan` akan fallback ke output hanya metadata dan membiarkan config tidak berubah. Gunakan `--no-probe` untuk secara eksplisit meminta mode hanya metadata.
</Note>

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi tool
3. Ukuran konteks
4. Jumlah parameter

Input:

- Daftar OpenRouter `/models` (filter `:free`)
- Probe live memerlukan API key OpenRouter dari profil auth atau `OPENROUTER_API_KEY` (lihat [Variabel environment](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol permintaan/probe: `--timeout`, `--concurrency`

Saat probe live berjalan dalam TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif, berikan `--yes` untuk menerima default. Hasil hanya metadata bersifat informatif; `--set-default` dan `--set-image` memerlukan probe live agar OpenClaw tidak mengonfigurasi model OpenRouter tanpa key yang tidak dapat digunakan.

## Registry model (`models.json`)

Provider kustom di `models.providers` ditulis ke `models.json` di bawah direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini digabungkan secara default kecuali `models.mode` diatur ke `replace`.

<AccordionGroup>
  <Accordion title="Prioritas mode merge">
    Prioritas mode merge untuk ID provider yang cocok:

    - `baseUrl` non-kosong yang sudah ada di `models.json` agen akan menang.
    - `apiKey` non-kosong di `models.json` agen hanya menang ketika provider tersebut tidak dikelola SecretRef dalam konteks config/profil-auth saat ini.
    - Nilai `apiKey` provider yang dikelola SecretRef diperbarui dari penanda sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih menyimpan secret yang telah di-resolve.
    - Nilai header provider yang dikelola SecretRef diperbarui dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
    - `apiKey`/`baseUrl` agen yang kosong atau tidak ada akan fallback ke config `models.providers`.
    - Field provider lainnya diperbarui dari config dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

<Note>
Persistensi penanda bersifat source-authoritative: OpenClaw menulis penanda dari snapshot config sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang telah di-resolve. Ini berlaku kapan pun OpenClaw meregenerasi `models.json`, termasuk jalur berbasis perintah seperti `openclaw agent`.
</Note>

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — PI, Codex, dan runtime loop agen lainnya
- [Referensi config](/id/gateway/config-agents#agent-defaults) — key config model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Provider model](/id/concepts/model-providers) — routing provider dan auth
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
