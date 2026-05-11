---
read_when:
    - Menambahkan atau memodifikasi CLI models (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku pengalihan model atau pengalaman pengguna pemilihan
    - Memperbarui probe pemindaian model (alat/gambar)
sidebarTitle: Models CLI
summary: 'CLI Model: daftar, atur, alias, cadangan, pindai, status'
title: CLI Model
x-i18n:
    generated_at: "2026-05-11T20:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil auth, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers">
    Ringkasan cepat penyedia dan contoh.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent-runtimes">
    PI, Codex, dan runtime loop agen lainnya.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults">
    Kunci konfigurasi model.
  </Card>
</CardGroup>

Ref model memilih penyedia dan model. Ref ini biasanya tidak memilih runtime agen tingkat rendah. Ref agen OpenAI adalah pengecualian utama: `openai/gpt-5.5` berjalan melalui runtime app-server Codex secara default pada penyedia resmi OpenAI. Override runtime eksplisit berada pada kebijakan penyedia/model, bukan pada seluruh agen atau sesi. Dalam mode runtime Codex, ref `openai/gpt-*` tidak berarti penagihan kunci API; auth dapat berasal dari akun Codex atau profil auth `openai-codex`. Lihat [Runtime agen](/id/concepts/agent-runtimes).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model`).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (berurutan).
  </Step>
  <Step title="Failover auth penyedia">
    Failover auth terjadi di dalam penyedia sebelum berpindah ke model berikutnya.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Permukaan model terkait">
    - `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (ditambah alias). Gunakan entri `provider/*` untuk membatasi penyedia yang terlihat sambil menjaga penemuan penyedia tetap dinamis.
    - `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
    - `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika dihilangkan, alat akan fallback ke `agents.defaults.imageModel`, lalu model sesi/default yang diselesaikan.
    - `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ia mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar lainnya dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ia mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar lainnya dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` masih dapat menyimpulkan default penyedia yang didukung auth. Ia mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar lainnya dalam urutan ID penyedia. Jika Anda menetapkan penyedia/model tertentu, konfigurasikan juga auth/kunci API penyedia tersebut.
    - Default per agen dapat mengesampingkan `agents.defaults.model` melalui `agents.list[].model` ditambah binding (lihat [Routing multi-agen](/id/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Sumber pemilihan dan perilaku fallback

`provider/model` yang sama dapat berarti hal berbeda tergantung dari mana asalnya:

- Default yang dikonfigurasi (`agents.defaults.model.primary` dan primary khusus agen) adalah titik awal normal dan menggunakan `agents.defaults.model.fallbacks`.
- Pemilihan fallback otomatis adalah status pemulihan sementara. Pemilihan ini disimpan dengan `modelOverrideSource: "auto"` sehingga turn berikutnya dapat terus menggunakan rantai fallback tanpa memeriksa primary yang sudah diketahui bermasalah terlebih dahulu.
- Pemilihan sesi pengguna bersifat tepat. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`; jika penyedia/model yang dipilih itu tidak dapat dijangkau, OpenClaw gagal secara terlihat alih-alih jatuh ke model lain yang dikonfigurasi.
- Cron `--model` / payload `model` adalah primary per job. Ia tetap menggunakan fallback yang dikonfigurasi kecuali job menyediakan payload `fallbacks` eksplisit (gunakan `fallbacks: []` untuk run cron yang ketat).
- Pemilih default-model dan allowlist CLI menghormati `models.mode: "replace"` dengan mencantumkan `models.providers.*.models` eksplisit alih-alih memuat katalog bawaan lengkap.
- Pemilih model UI Kontrol meminta tampilan model terkonfigurasi dari Gateway: `agents.defaults.models` saat ada, termasuk entri seluruh penyedia `provider/*`, jika tidak maka `models.providers.*.models` eksplisit ditambah penyedia dengan auth yang dapat digunakan. Katalog bawaan lengkap dicadangkan untuk tampilan penelusuran eksplisit seperti `models.list` dengan `view: "all"` atau `openclaw models list --all`.

## Kebijakan model cepat

- Tetapkan primary Anda ke model generasi terbaru terkuat yang tersedia untuk Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat berisiko lebih rendah.
- Untuk agen yang mengaktifkan alat atau input tidak tepercaya, hindari tingkat model lama/lebih lemah.

## Onboarding (direkomendasikan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + auth untuk penyedia umum, termasuk **langganan OpenAI Code (Codex)** (OAuth) dan **Anthropic** (kunci API atau Claude CLI).

## Kunci konfigurasi (ringkasan)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter penyedia + entri penyedia dinamis `provider/*`)
- `models.providers` (penyedia kustom yang ditulis ke `models.json`)

<Note>
Ref model dinormalisasi ke huruf kecil. Alias penyedia seperti `z.ai/*` dinormalisasi menjadi `zai/*`.

Contoh konfigurasi penyedia (termasuk OpenCode) tersedia di [OpenCode](/id/providers/opencode).
</Note>

### Edit allowlist aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Aturan perlindungan clobber">
    `openclaw config set` melindungi peta model/penyedia dari clobber tidak disengaja. Penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` ditolak ketika itu akan menghapus entri yang sudah ada. Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang diberikan harus menjadi nilai target lengkap.

    Penyiapan penyedia interaktif dan `openclaw configure --section model` juga menggabungkan pemilihan berskala penyedia ke allowlist yang ada, sehingga menambahkan Codex, Ollama, atau penyedia lain tidak menghapus entri model yang tidak terkait. Configure mempertahankan `agents.defaults.model.primary` yang sudah ada ketika auth penyedia diterapkan ulang. Perintah penetapan default eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model tidak diizinkan" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` ditetapkan, itu menjadi **allowlist** untuk `/model` dan untuk override sesi. Ketika pengguna memilih model yang tidak ada dalam allowlist tersebut, OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Ini terjadi **sebelum** balasan normal dibuat, sehingga pesannya dapat terasa seperti "tidak merespons." Perbaikannya adalah salah satu dari berikut:

- Tambahkan model ke `agents.defaults.models`, atau
- Hapus allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

</Warning>

Ketika perintah yang ditolak menyertakan override runtime seperti `/model openai/gpt-5.5 --runtime codex`, perbaiki allowlist terlebih dahulu, lalu coba lagi perintah `/model ... --runtime ...` yang sama. Untuk eksekusi Codex native, model yang dipilih tetap `openai/gpt-5.5`; runtime `codex` memilih harness dan menggunakan auth Codex secara terpisah.

Untuk model lokal/GGUF, simpan ref lengkap dengan prefiks penyedia di allowlist,
misalnya `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, atau
penyedia/model persis yang ditampilkan oleh `openclaw models list --provider <provider>`.
Nama file lokal polos atau nama tampilan saja tidak cukup ketika allowlist
aktif.

Jika Anda ingin membatasi penyedia tanpa mencantumkan setiap model secara manual, tambahkan
entri `provider/*` ke `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Dengan kebijakan itu, `/model`, `/models`, dan pemilih model menampilkan katalog
yang ditemukan hanya untuk penyedia tersebut. Model baru dari penyedia yang dipilih dapat
muncul tanpa mengedit allowlist. Entri `provider/model` persis dapat dicampur
dengan entri `provider/*` ketika Anda memerlukan satu model tertentu dari penyedia lain.

Contoh konfigurasi allowlist:

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
/model status
```

<AccordionGroup>
  <Accordion title="Perilaku pemilih">
    - `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
    - Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Kirim.
    - Di Telegram, pemilihan pemilih `/models` berskala sesi; pemilihan tersebut tidak mengubah default persisten agen di `openclaw.json`.
    - `/models add` sudah usang dan sekarang mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari chat.
    - `/model <#>` memilih dari pemilih tersebut.

  </Accordion>
  <Accordion title="Persistensi dan peralihan langsung">
    - `/model` langsung menyimpan pemilihan sesi baru.
    - Jika agen idle, run berikutnya langsung menggunakan model baru.
    - Jika run sudah aktif, OpenClaw menandai peralihan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, peralihan tertunda dapat tetap dalam antrean sampai kesempatan retry berikutnya atau turn pengguna berikutnya.
    - Ref `/model` yang dipilih pengguna bersifat ketat untuk sesi tersebut: jika penyedia/model yang dipilih tidak dapat dijangkau, balasan gagal secara terlihat alih-alih diam-diam menjawab dari `agents.defaults.model.fallbacks`. Ini berbeda dari default yang dikonfigurasi dan primary job cron, yang tetap dapat menggunakan rantai fallback.
    - `/model status` adalah tampilan detail (kandidat auth dan, ketika dikonfigurasi, endpoint penyedia `baseUrl` + mode `api`).

  </Accordion>
  <Accordion title="Ref parsing">
    - Referensi model diurai dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
    - Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks penyedia (contoh: `/model openrouter/moonshotai/kimi-k2`).
    - Jika Anda menghilangkan penyedia, OpenClaw menyelesaikan input dalam urutan ini:
      1. kecocokan alias
      2. kecocokan penyedia terkonfigurasi yang unik untuk id model tanpa prefiks yang persis tersebut
      3. fallback usang ke penyedia default yang dikonfigurasi — jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw sebagai gantinya kembali ke penyedia/model terkonfigurasi pertama untuk menghindari menampilkan default penyedia yang sudah dihapus dan usang.
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
  Katalog lengkap. Menyertakan baris katalog statis milik penyedia bawaan sebelum auth dikonfigurasi, sehingga tampilan khusus penemuan dapat menampilkan model yang tidak tersedia hingga Anda menambahkan kredensial penyedia yang sesuai.
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

Menampilkan model utama yang diselesaikan, fallback, model gambar, dan ringkasan auth dari penyedia yang dikonfigurasi. Ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan di penyimpanan auth (memperingatkan dalam 24 jam secara default). `--plain` hanya mencetak model utama yang diselesaikan.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika penyedia yang dikonfigurasi tidak memiliki kredensial, `models status` mencetak bagian **Auth hilang**.
    - JSON menyertakan `auth.oauth` (jendela peringatan + profil) dan `auth.providers` (auth efektif per penyedia, termasuk kredensial berbasis env). `auth.oauth` hanya kesehatan profil penyimpanan auth; penyedia khusus-env tidak muncul di sana.
    - Gunakan `--check` untuk otomatisasi (keluar `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
    - Gunakan `--probe` untuk pemeriksaan auth langsung; baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
    - Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan `excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang dapat diprobe yang bisa diselesaikan untuk penyedia tersebut, probe melaporkan `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Pilihan auth bergantung pada penyedia/akun. Untuk host Gateway yang selalu aktif, kunci API biasanya paling dapat diprediksi; penggunaan ulang Claude CLI serta profil OAuth/token Anthropic yang sudah ada juga didukung.
</Note>

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat secara opsional memprobe model untuk dukungan alat dan gambar.

<ParamField path="--no-probe" type="boolean">
  Lewati probe langsung (hanya metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Ukuran parameter minimum (miliar).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Lewati model lama.
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
Katalog `/models` OpenRouter bersifat publik, sehingga pemindaian khusus metadata dapat mencantumkan kandidat gratis tanpa kunci. Probe dan inferensi tetap memerlukan kunci API OpenRouter (dari profil auth atau `OPENROUTER_API_KEY`). Jika tidak ada kunci yang tersedia, `openclaw models scan` kembali ke output khusus metadata dan membiarkan konfigurasi tidak berubah. Gunakan `--no-probe` untuk meminta mode khusus metadata secara eksplisit.
</Note>

Hasil pemindaian diperingkat berdasarkan:

1. Dukungan gambar
2. Latensi alat
3. Ukuran konteks
4. Jumlah parameter

Input:

- Daftar `/models` OpenRouter (filter `:free`)
- Probe langsung memerlukan kunci API OpenRouter dari profil auth atau `OPENROUTER_API_KEY` (lihat [Variabel lingkungan](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol permintaan/probe: `--timeout`, `--concurrency`

Saat probe langsung berjalan di TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif, berikan `--yes` untuk menerima default. Hasil khusus metadata bersifat informatif; `--set-default` dan `--set-image` memerlukan probe langsung agar OpenClaw tidak mengonfigurasi model OpenRouter tanpa kunci yang tidak dapat digunakan.

## Registri model (`models.json`)

Penyedia kustom di `models.providers` ditulis ke `models.json` di bawah direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini digabungkan secara default kecuali `models.mode` diatur ke `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Presedensi mode gabung untuk ID penyedia yang cocok:

    - `baseUrl` tidak kosong yang sudah ada di `models.json` agen menang.
    - `apiKey` tidak kosong di `models.json` agen menang hanya saat penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil-auth saat ini.
    - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih mempertahankan rahasia yang sudah diselesaikan.
    - Nilai header penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
    - `apiKey`/`baseUrl` agen yang kosong atau hilang kembali ke `models.providers` konfigurasi.
    - Bidang penyedia lainnya disegarkan dari konfigurasi dan data katalog yang dinormalisasi.

  </Accordion>
</AccordionGroup>

<Note>
Persistensi penanda bersifat otoritatif terhadap sumber: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (pra-penyelesaian), bukan dari nilai rahasia runtime yang sudah diselesaikan. Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang digerakkan perintah seperti `openclaw agent`.
</Note>

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — PI, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — perutean penyedia dan auth
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
