---
read_when:
    - Menambahkan atau memodifikasi CLI model (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku cadangan model atau pengalaman pengguna pemilihan
    - Memperbarui probe pemindaian model (alat/gambar)
sidebarTitle: Models CLI
summary: 'CLI model: daftar, atur, alias, fallback, pindai, status'
title: CLI Model
x-i18n:
    generated_at: "2026-06-27T17:25:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil autentikasi, masa tunggu, dan bagaimana itu berinteraksi dengan cadangan.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers">
    Ringkasan singkat penyedia dan contoh.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent-runtimes">
    OpenClaw, Codex, dan runtime loop agen lainnya.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults">
    Kunci konfigurasi model.
  </Card>
</CardGroup>

Ref model memilih penyedia dan model. Biasanya ref tersebut tidak memilih runtime agen tingkat rendah. Ref agen OpenAI adalah pengecualian utama: `openai/gpt-5.5` berjalan melalui runtime app-server Codex secara default pada penyedia OpenAI resmi. Ref Copilot langganan (`github-copilot/*`) juga dapat diikutkan ke Plugin runtime agen GitHub Copilot eksternal — jalur itu tetap eksplisit (tanpa cadangan `auto`). Penggantian runtime eksplisit berada pada kebijakan penyedia/model, bukan pada seluruh agen atau sesi. Dalam mode runtime Codex, ref `openai/gpt-*` tidak menyiratkan penagihan kunci API; autentikasi dapat berasal dari akun Codex atau profil OAuth `openai`. Lihat [Runtime agen](/id/concepts/agent-runtimes) dan [Runtime agen GitHub Copilot](/id/plugins/copilot).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model`).
  </Step>
  <Step title="Cadangan">
    `agents.defaults.model.fallbacks` (berurutan).
  </Step>
  <Step title="Failover autentikasi penyedia">
    Failover autentikasi terjadi di dalam penyedia sebelum berpindah ke model berikutnya.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Permukaan model terkait">
    - `agents.defaults.models` adalah daftar izin/katalog model yang dapat digunakan OpenClaw (ditambah alias). Gunakan entri `provider/*` untuk membatasi penyedia yang terlihat sambil mempertahankan penemuan penyedia tetap dinamis.
    - `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
    - `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika dihilangkan, alat kembali ke `agents.defaults.imageModel`, lalu model sesi/default yang di-resolve.
    - `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ia mencoba penyedia default saat ini terlebih dahulu, lalu sisa penyedia pembuatan gambar terdaftar dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ia mencoba penyedia default saat ini terlebih dahulu, lalu sisa penyedia pembuatan musik terdaftar dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ia mencoba penyedia default saat ini terlebih dahulu, lalu sisa penyedia pembuatan video terdaftar dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga autentikasi/kunci API penyedia tersebut.
    - Default per agen dapat mengganti `agents.defaults.model` melalui `agents.list[].model` plus binding (lihat [Perutean multi-agen](/id/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Sumber pemilihan dan perilaku cadangan

`provider/model` yang sama dapat berarti hal berbeda tergantung dari mana asalnya:

- Default yang dikonfigurasi (`agents.defaults.model.primary` dan utama khusus agen) adalah titik awal normal dan menggunakan `agents.defaults.model.fallbacks`.
- Pilihan cadangan otomatis adalah status pemulihan sementara. Pilihan tersebut disimpan dengan `modelOverrideSource: "auto"` sehingga giliran berikutnya dapat terus menggunakan rantai cadangan tanpa menguji utama yang diketahui bermasalah setiap kali; OpenClaw secara berkala menguji ulang utama asli, menghapus pilihan otomatis ketika pulih, dan mengumumkan transisi cadangan/pemulihan satu kali per perubahan status.
- Pilihan sesi pengguna bersifat eksak. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`; jika penyedia/model yang dipilih itu tidak dapat dijangkau, OpenClaw gagal secara terlihat alih-alih jatuh ke model lain yang dikonfigurasi.
- Mengubah `agents.defaults.model.primary` tidak menulis ulang pilihan sesi yang ada. Jika status mengatakan `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, hapus pilihan sesi saat ini dengan `/model default` agar sesi mewarisi utama yang dikonfigurasi lagi.
- Cron `--model` / payload `model` adalah utama per pekerjaan. Ia tetap menggunakan cadangan yang dikonfigurasi kecuali pekerjaan menyediakan payload `fallbacks` eksplisit (gunakan `fallbacks: []` untuk run cron yang ketat).
- Pemilih model default CLI dan daftar izin menghormati `models.mode: "replace"` dengan mencantumkan `models.providers.*.models` eksplisit alih-alih memuat katalog bawaan lengkap.
- Pemilih model Control UI meminta tampilan model terkonfigurasi kepada Gateway: `agents.defaults.models` saat ada, termasuk entri seluruh penyedia `provider/*`, jika tidak maka `models.providers.*.models` eksplisit plus penyedia dengan autentikasi yang dapat digunakan. Katalog bawaan lengkap dicadangkan untuk tampilan jelajah eksplisit seperti `models.list` dengan `view: "all"` atau `openclaw models list --all`.

## Kebijakan model singkat

- Tetapkan utama Anda ke model generasi terbaru terkuat yang tersedia untuk Anda.
- Gunakan cadangan untuk tugas yang sensitif terhadap biaya/latensi dan chat berisiko lebih rendah.
- Untuk agen dengan alat aktif atau input tidak tepercaya, hindari tingkat model yang lebih lama/lebih lemah.

## Onboarding (direkomendasikan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + autentikasi untuk penyedia umum, termasuk **langganan OpenAI Code (Codex)** (OAuth) dan **Anthropic** (kunci API atau Claude CLI).

## Kunci konfigurasi (ringkasan)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (daftar izin + alias + parameter penyedia + entri penyedia dinamis `provider/*`)
- `models.providers` (penyedia kustom yang ditulis ke `models.json`)

<Note>
Ref model dinormalisasi ke huruf kecil. ID penyedia selain itu bersifat eksak; gunakan
ID penyedia yang diiklankan oleh Plugin.

Contoh konfigurasi penyedia (termasuk OpenCode) ada di [OpenCode](/id/providers/opencode).
</Note>

### Edit daftar izin yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Aturan perlindungan penimpaan">
    `openclaw config set` melindungi peta model/penyedia dari penimpaan tidak sengaja. Penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` ditolak ketika itu akan menghapus entri yang ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang diberikan harus menjadi nilai target lengkap.

    Penyiapan penyedia interaktif dan `openclaw configure --section model` juga menggabungkan pilihan dengan cakupan penyedia ke daftar izin yang ada, sehingga menambahkan Codex, Ollama, atau penyedia lain tidak menghapus entri model yang tidak terkait. Configure mempertahankan `agents.defaults.model.primary` yang ada ketika autentikasi penyedia diterapkan ulang. Perintah penetapan default eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model tidak diizinkan" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` ditetapkan, itu menjadi **daftar izin** untuk `/model` dan penggantian sesi. Saat pengguna memilih model yang tidak ada dalam daftar izin itu, OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Ini terjadi **sebelum** balasan normal dibuat, sehingga pesan dapat terasa seperti "tidak merespons." Perbaikannya adalah salah satu dari:

- Tambahkan model ke `agents.defaults.models`, atau
- Hapus daftar izin (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

</Warning>

Ketika perintah yang ditolak menyertakan penggantian runtime seperti `/model openai/gpt-5.5 --runtime codex`, perbaiki daftar izin terlebih dahulu, lalu coba ulangi perintah `/model ... --runtime ...` yang sama. Untuk eksekusi Codex native, model yang dipilih tetap `openai/gpt-5.5`; runtime `codex` memilih harness dan menggunakan autentikasi Codex secara terpisah.

Untuk model lokal/GGUF, simpan ref lengkap dengan prefiks penyedia di daftar izin,
misalnya `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, atau
penyedia/model eksak yang ditampilkan oleh `openclaw models list --provider <provider>`.
Nama file lokal polos atau nama tampilan tidak cukup saat daftar izin
aktif.

Jika Anda ingin membatasi penyedia tanpa mencantumkan setiap model secara manual, tambahkan
entri `provider/*` ke `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Dengan kebijakan itu, `/model`, `/models`, dan pemilih model menampilkan
katalog yang ditemukan hanya untuk penyedia tersebut. Model baru dari penyedia yang dipilih dapat
muncul tanpa mengedit daftar izin. Entri `provider/model` eksak dapat dicampur
dengan entri `provider/*` saat Anda membutuhkan satu model tertentu dari penyedia lain.

Contoh konfigurasi daftar izin:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Perilaku pemilih">
    - `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
    - Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit.
    - Di Telegram, pilihan pemilih `/models` bercakupan sesi; pilihan tersebut tidak mengubah default persisten agen di `openclaw.json`.
    - `/models add` sudah tidak digunakan dan sekarang mengembalikan pesan deprekasi alih-alih mendaftarkan model dari chat.
    - `/model <#>` memilih dari pemilih tersebut.

  </Accordion>
  <Accordion title="Persistensi dan peralihan langsung">
    - `/model` segera menyimpan pilihan sesi baru.
    - Jika agen sedang menganggur, proses berikutnya langsung menggunakan model baru.
    - Jika proses sudah aktif, OpenClaw menandai peralihan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik percobaan ulang yang bersih.
    - Jika aktivitas alat atau keluaran balasan sudah dimulai, peralihan yang tertunda dapat tetap mengantre sampai kesempatan percobaan ulang berikutnya atau giliran pengguna berikutnya.
    - `/model default` menghapus pilihan sesi dan mengembalikan sesi ke model default yang dikonfigurasi.
    - Ref `/model` yang dipilih pengguna bersifat ketat untuk sesi tersebut: jika penyedia/model yang dipilih tidak dapat dijangkau, balasan gagal secara terlihat alih-alih diam-diam menjawab dari `agents.defaults.model.fallbacks`. Ini berbeda dari default yang dikonfigurasi dan primer tugas cron, yang masih dapat menggunakan rantai fallback.
    - `/model status` adalah tampilan terperinci (kandidat auth dan, bila dikonfigurasi, endpoint penyedia `baseUrl` + mode `api`).

  </Accordion>
  <Accordion title="Penguraian ref">
    - Ref model diuraikan dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
    - Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks penyedia (contoh: `/model openrouter/moonshotai/kimi-k2`).
    - Jika Anda menghilangkan penyedia, OpenClaw menyelesaikan input dalam urutan ini:
      1. kecocokan alias
      2. kecocokan penyedia terkonfigurasi yang unik untuk id model tanpa prefiks yang persis sama
      3. fallback usang ke penyedia default yang dikonfigurasi — jika penyedia itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw sebagai gantinya fallback ke penyedia/model terkonfigurasi pertama untuk menghindari memunculkan default penyedia yang dihapus dan basi.
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
  Katalog lengkap. Menyertakan baris katalog statis bawaan milik penyedia sebelum auth dikonfigurasi, sehingga tampilan khusus penemuan dapat menampilkan model yang tidak tersedia sampai Anda menambahkan kredensial penyedia yang cocok.
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

Menampilkan model primer yang diselesaikan, fallback, model gambar, dan ringkasan auth dari penyedia yang dikonfigurasi. Ini juga memunculkan status kedaluwarsa OAuth untuk profil yang ditemukan di penyimpanan auth (memperingatkan dalam 24 jam secara default). `--plain` hanya mencetak model primer yang diselesaikan.

<AccordionGroup>
  <Accordion title="Perilaku auth dan probe">
    - Status OAuth selalu ditampilkan (dan disertakan dalam keluaran `--json`). Jika penyedia yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Auth hilang**.
    - JSON menyertakan `auth.oauth` (jendela peringatan + profil) dan `auth.providers` (auth efektif per penyedia, termasuk kredensial berbasis env). `auth.oauth` hanya kesehatan profil penyimpanan-auth; penyedia yang hanya env tidak muncul di sana.
    - Gunakan `--check` untuk otomatisasi (keluar `1` saat hilang/kedaluwarsa, `2` saat hampir kedaluwarsa).
    - Gunakan `--probe` untuk pemeriksaan auth langsung; baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
    - Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan `excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang dapat diprobe yang dapat diselesaikan untuk penyedia itu, probe melaporkan `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Pilihan auth bergantung pada penyedia/akun. Untuk host Gateway yang selalu aktif, kunci API biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil OAuth/token Anthropic yang sudah ada juga didukung.
</Note>

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan secara opsional dapat memprobe model untuk dukungan alat dan gambar.

<ParamField path="--no-probe" type="boolean">
  Lewati probe langsung (hanya metadata).
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
  Atur `agents.defaults.model.primary` ke pilihan pertama.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Atur `agents.defaults.imageModel.primary` ke pilihan gambar pertama.
</ParamField>

<Note>
Katalog `/models` OpenRouter bersifat publik, sehingga pemindaian hanya metadata dapat mencantumkan kandidat gratis tanpa kunci. Probe dan inferensi tetap memerlukan kunci API OpenRouter (dari profil auth atau `OPENROUTER_API_KEY`). Jika tidak ada kunci yang tersedia, `openclaw models scan` fallback ke keluaran hanya metadata dan membiarkan konfigurasi tidak berubah. Gunakan `--no-probe` untuk meminta mode hanya metadata secara eksplisit.
</Note>

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi alat
3. Ukuran konteks
4. Jumlah parameter

Input:

- Daftar `/models` OpenRouter (filter `:free`)
- Probe langsung memerlukan kunci API OpenRouter dari profil auth atau `OPENROUTER_API_KEY` (lihat [Variabel lingkungan](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol permintaan/probe: `--timeout`, `--concurrency`

Saat probe langsung berjalan di TUI, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif, berikan `--yes` untuk menerima default. Hasil hanya metadata bersifat informatif; `--set-default` dan `--set-image` memerlukan probe langsung agar OpenClaw tidak mengonfigurasi model OpenRouter tanpa kunci yang tidak dapat digunakan.

## Registri model (`models.json`)

Penyedia kustom di `models.providers` ditulis ke `models.json` di bawah direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). Katalog Plugin penyedia disimpan sebagai shard katalog yang dihasilkan dan dimiliki plugin di bawah state plugin agen dan dimuat otomatis. File ini digabungkan secara default kecuali `models.mode` diatur ke `replace`.

<AccordionGroup>
  <Accordion title="Prioritas mode gabung">
    Prioritas mode gabung untuk ID penyedia yang cocok:

    - `baseUrl` tidak kosong yang sudah ada di `models.json` agen menang.
    - `apiKey` tidak kosong di `models.json` agen hanya menang ketika penyedia itu tidak dikelola SecretRef dalam konteks konfigurasi/profil-auth saat ini.
    - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari marker sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih mempertahankan rahasia yang telah diselesaikan.
    - Nilai header penyedia yang dikelola SecretRef disegarkan dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
    - `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke `models.providers` konfigurasi.
    - Field penyedia lainnya disegarkan dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

<Note>
Persistensi marker bersifat otoritatif-sumber: OpenClaw menulis marker dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai rahasia runtime yang telah diselesaikan. Ini berlaku setiap kali OpenClaw membuat ulang `models.json`, termasuk jalur yang digerakkan perintah seperti `openclaw agent`.
</Note>

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — OpenClaw, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — routing penyedia dan auth
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
