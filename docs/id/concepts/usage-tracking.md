---
read_when:
    - Anda sedang menghubungkan antarmuka penggunaan/kuota penyedia
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan autentikasi
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-07-19T04:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a1bc9aeb95cd80a48ab57a18fcd24894fdd6fb71e10e8bea8bae67a8688b78e
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Apa itu

- Mengambil penggunaan/kuota penyedia secara langsung dari endpoint penggunaan masing-masing penyedia. Tidak ada estimasi tagihan penyedia; hanya nama paket, jendela kuota, saldo, pengeluaran, anggaran, riwayat biaya harian, atribusi token/model, atau ringkasan status akun yang dilaporkan penyedia.
- Keluaran jendela kuota yang mudah dibaca manusia dinormalisasi menjadi `X% left`, bahkan ketika penyedia melaporkan kuota yang telah digunakan, kuota tersisa, atau hanya jumlah mentah. Penyedia tanpa jendela kuota yang dapat diatur ulang akan menampilkan teks ringkasan penyedia sebagai gantinya (misalnya saldo).
- `/status` tingkat sesi dan alat `session_status` menggunakan log transkrip sesi sebagai fallback ketika snapshot sesi langsung tidak memiliki data token/model. Fallback tersebut mengisi penghitung token/cache yang hilang, dapat memulihkan label model runtime aktif, dan memilih total berorientasi prompt yang lebih besar ketika metadata sesi tidak ada atau lebih kecil (`totalTokensFresh !== true`, nol, atau di bawah nilai yang berasal dari transkrip). Nilai langsung bukan nol selalu diprioritaskan daripada fallback.

## Tempat kemunculannya

- `/status` dalam obrolan: kartu status dengan token sesi dan estimasi biaya (hanya model kunci API). Penggunaan penyedia ditampilkan untuk **penyedia model saat ini** jika tersedia, sebagai jendela `X% left` yang dinormalisasi atau teks ringkasan penyedia.
- `/usage off|tokens|full` dalam obrolan: footer penggunaan per respons.
- `/usage cost` dalam obrolan: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak perincian lengkap penggunaan/kuota per penyedia.
- CLI: `openclaw models status` mencantumkan profil autentikasi OAuth/token dan menampilkan ringkasan jendela penggunaan di samping setiap penyedia yang memilikinya.
- UI Kontrol: **Penggunaan** menampilkan kartu paket dan tagihan penyedia di atas analisis token dan estimasi biaya OpenClaw yang berasal dari sesi. Kredensial API Admin Anthropic dan OpenAI menambahkan pengeluaran hari ini, 7 hari, dan 30 hari yang dilaporkan penyedia, tren harian, total token, model teratas, dan kategori biaya.
- UI Kontrol: popover cincin konteks pada penyusun obrolan menampilkan **penggunaan paket** untuk penyedia langganan — bilah per jendela (5 jam, mingguan, tercakup model) beserta waktu pengaturan ulang, paket penyedia jika diketahui (misalnya `Max (20x)`), dan kredit penggunaan tambahan. Sesi yang ditagih melalui paket menyembunyikan estimasi biaya dolar per token; sesi yang ditagih melalui API tetap menampilkan `Est. cost` dan perincian biaya menurut jenis. Penyiapan CLI Claude Code (`claude-cli`) menggunakan kembali penggunaan langganan Anthropic yang sama.
- Bilah menu macOS: bagian akar "Penggunaan" muncul di bawah Konteks ketika snapshot penggunaan penyedia tersedia. Lihat [Bilah menu](/id/platforms/mac/menu-bar).

`openclaw channels list` tidak lagi mencetak penggunaan penyedia; sebagai gantinya, perintah tersebut mengarahkan pengguna ke `openclaw status` atau `openclaw models list`.

## Riwayat biaya Anthropic dan OpenAI

Kuota langganan dan tagihan API merupakan permukaan penyedia yang berbeda:

- Kredensial langganan/penyiapan Anthropic tetap menampilkan jendela kuota Claude dan anggaran penggunaan tambahan opsional. Tetapkan `ANTHROPIC_ADMIN_KEY` atau `ANTHROPIC_ADMIN_API_KEY` untuk menampilkan riwayat API Penggunaan dan Biaya organisasi sebagai gantinya. Kredensial penyedia Anthropic yang diawali dengan `sk-ant-admin` terdeteksi secara otomatis.
- OAuth OpenAI ChatGPT/Codex tetap menampilkan paket, jendela kuota, dan saldo kredit. Tetapkan `OPENAI_ADMIN_KEY` untuk menampilkan riwayat biaya organisasi dan penggunaan completion sebagai gantinya; secara opsional, tetapkan `OPENAI_PROJECT_ID` untuk membatasi cakupannya pada satu proyek. OpenClaw tidak pernah mengirim kredensial inferensi dari `OPENAI_API_KEY`, konfigurasi penyedia, atau profil autentikasi ke API organisasi karena kunci tersebut mungkin merupakan milik endpoint khusus.

Kredensial admin diprioritaskan karena menyediakan tagihan organisasi yang sebenarnya. OpenClaw tidak menggabungkan total yang dilaporkan penyedia ini dengan estimasi sesi lokalnya; kedua bagian tersebut sengaja menjawab pertanyaan yang berbeda.

## Mode footer penggunaan default

`/usage off|tokens|full` menetapkan footer untuk sebuah sesi dan diingat untuk sesi
tersebut. `messages.responseUsage` menginisialisasi mode tersebut untuk sesi yang belum
memilihnya, sehingga footer dapat aktif secara default tanpa mengetik `/usage` setiap kali.

Tetapkan satu mode untuk setiap saluran, atau peta per saluran dengan fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // atau: { "default": "off", "discord": "full" }
  },
}
```

Nilai yang diterima: `"off"`, `"tokens"`, `"full"`, dan alias lama `"on"` (diperlakukan sebagai `"tokens"`).

### Tiga status sesi yang berbeda

Bidang `responseUsage` sebuah sesi memiliki tiga status yang dapat direpresentasikan, masing-masing dengan
semantik berbeda:

| Status                        | Nilai tersimpan                           | Mode efektif                                                                     |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| **Tidak disetel / diwarisi** | `undefined` (tidak ada)            | Beralih ke default konfigurasi `messages.responseUsage`, lalu `off`.       |
| **Dinonaktifkan eksplisit**   | `"off"` (tersimpan)            | Selalu nonaktif; default konfigurasi yang tidak nonaktif tidak dapat mengaktifkan kembali footer. |
| **Diaktifkan eksplisit**      | `"tokens"` atau `"full"` (tersimpan) | Mode tersebut, terlepas dari default konfigurasi.                                |

### Prioritas

Mode efektif = penggantian sesi → entri konfigurasi saluran → `default` → `off`.

`/usage off` yang eksplisit **dipertahankan** sebagai nilai literal `"off"` dalam
sesi, tidak sama dengan "tidak disetel". Default `messages.responseUsage` yang
tidak nonaktif tidak dapat mengaktifkan kembali footer setelah pengguna menonaktifkannya secara eksplisit.

### Mengatur ulang versus menonaktifkan

- `/usage off` memaksa footer nonaktif dan mempertahankan pilihan tersebut. Default
  terkonfigurasi yang tidak nonaktif tidak dapat menggantikannya.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) menghapus penggantian
  sesi. Sesi kemudian **mewarisi** default konfigurasi efektif
  (`messages.responseUsage`). Jika tidak ada default yang dikonfigurasi, footer tetap nonaktif.
- Pengaturan ulang sesi penuh (`/reset` atau `/new`) atau pergantian sesi **mempertahankan**
  preferensi mode penggunaan eksplisit agar pilihan tampilan pengguna tetap berlaku
  saat sesi berganti. Hanya `/usage reset` (dan aliasnya) yang menghapus penggantian tersebut.

### Perilaku tombol alih

`/usage` tanpa argumen berputar: nonaktif → token → penuh → nonaktif. Titik awal
siklus adalah mode saat ini yang **efektif** (penggantian sesi beralih
ke default konfigurasi ketika tidak disetel), sehingga siklus selalu sesuai dengan yang
saat ini dilihat pengguna di footer.

### Konfigurasi

Tanpa konfigurasi, perilaku sebelumnya tetap berlaku (footer nonaktif hingga `/usage`). Gunakan
`/usage reset` untuk menghapus penggantian sesi dan mewarisi kembali default yang dikonfigurasi.

## Footer `/usage full` khusus

`/usage tokens` selalu merender baris `Usage: X in / Y out` sederhana (ditambah akhiran cache dan
estimasi biaya jika tersedia). Hanya `/usage full` yang merender footer lebih lengkap
yang dijelaskan di bawah ini.

`/usage full` menampilkan footer ringkas bawaan dengan model, penalaran, cepat/lambat,
jendela konteks, dan biaya jika bidang tersebut tersedia. Tidak diperlukan berkas templat
untuk footer bawaan.

`messages.usageTemplate` hanya ditujukan untuk tata letak khusus tingkat lanjut. Nilainya berupa
jalur berkas JSON (mendukung `~`) atau objek inline, dan menggantikan footer bawaan
jika valid. Jalur berkas dipantau dan dimuat ulang secara langsung saat berubah.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Templat yang tidak ada atau kosong akan kembali ke footer bawaan secara diam-diam. Templat
terkonfigurasi yang tidak dapat dibaca atau tidak valid (JSON buruk, atau bentuk tanpa bagian
keluaran yang dapat dirender) juga akan kembali ke footer bawaan dan mengeluarkan peringatan operator.

Mulai templat khusus dari bentuk bawaan, lalu edit bagian yang ingin
diubah:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Bentuk

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "glif dari rendah ke tinggi" }, // string (1 glif/karakter) atau array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // menggabungkan bagian yang tersisa
    "default": [/* pieces */], // fallback untuk permukaan apa pun
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Setiap permukaan merupakan daftar **bagian** yang terurut; mesin merender setiap bagian, membuang
yang kosong, dan menggabungkan bagian yang tersisa dengan `sep`. Permukaan tanpa entri menggunakan
`output.default`.

### Jalur Kontrak

Sebuah bagian membaca nilai dari kontrak per giliran melalui jalur bertitik. Nilai yang tidak ada dianggap
kosong (sehingga penjaga `when` atau `|fallback` menjaga bagian tetap bersih).

| Jalur                                                                               | Arti                                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | id channel (`discord`/`telegram`/dll.)                                                               |
| `agentId` / `chat_type`                                                             | id agen pemilik / jenis permukaan chat                                                               |
| `model.id` / `model.display_name` / `model.provider`                                | id model / nama tampilan / id penyedia                                                               |
| `model.actual`, `model.resolved_ref`                                                | referensi penyedia/model yang benar-benar digunakan untuk giliran                                    |
| `model.requested`                                                                   | referensi penyedia/model yang diminta (sebelum fallback)                                             |
| `model.reasoning`                                                                   | upaya (`off` hingga `xhigh`)                                                                       |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback digunakan / model disematkan                                                          |
| `model.override_source` / `model.auth_mode`                                         | label sumber penggantian / mode kredensial (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | bool: cepat atau lambat                                                                              |
| `state.compactions`                                                                 | jumlah Compaction untuk sesi                                                                         |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | anggaran jendela / token terisi / 0-100 terpakai                                                     |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregat giliran                                                                                      |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | token pembacaan cache dan penulisan cache untuk giliran                                              |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | pengaman tampilan token                                                                              |
| `usage.cache_hit_pct`                                                               | porsi pembacaan cache dari total token prompt                                                        |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | hanya panggilan model terakhir (juga memiliki `cache_read_tokens`, `cache_write_tokens`, `total_tokens`) |
| `cost.turn_usd` / `cost.available`                                                  | estimasi biaya giliran / apakah tabel biaya berhasil ditemukan                                       |
| `timing.duration_ms`                                                                | durasi giliran menurut waktu nyata                                                                   |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nama identitas agen / emoji / avatar                                                                 |
| `session.id`                                                                        | id sesi                                                                                              |

(Jendela batas laju penyedia **tidak** termasuk dalam kontrak ini; saat ini tidak ada jalur bernilai larik, sehingga bagian `each` tidak memiliki apa pun untuk diiterasi.)

### Verba

Salurkan nilai melalui verba dari kiri ke kanan; segmen nonverba menjadi fallback.

| Verba           | Efek                                  | Contoh                            |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | jumlah ringkas                        | `272000 -> 272k`                  |
| `fixed:N`       | N angka desimal (`0..100`, default 2) | `0.0377`                          |
| `dur`           | detik menjadi durasi                  | `14820 -> 4h07m`                  |
| `pct`           | tambahkan `%`                     | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | untuk mengubah terpakai menjadi tersisa |
| `alias:TABLE`   | cari di `aliases`, tampilkan apa adanya jika tidak tercantum | `medium -> 🌗` |
| `meter:W:SCALE` | bilah glif selebar W sel pada nilai 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = satu glif) |

`fixed:N` hanya menerima bilangan bulat desimal lengkap dari 0 hingga 100. Argumen
presisi yang tidak valid membuat interpolasi tersebut kosong.

`meter:W:SCALE` hanya menerima lebar bilangan bulat desimal lengkap dari 1 hingga 100. Biarkan lebar kosong untuk menggunakan default 5 (`meter::braille`); lebar
yang tidak valid membuat interpolasi tersebut kosong.

### Bentuk bagian

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolasi.
- `{ "when": "<path>", "text": "..." }`: render hanya jika jalurnya bernilai truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: nilai menjadi glif (kasus `_default` mencakup nilai yang tidak cocok).
- `{ "each": "<array-path>", "item": "{label}" }`: iterasi jalur bernilai larik (tidak ada jalur kontrak saat ini yang berupa larik).

### Contoh

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

merender misalnya `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Penyedia + kredensial

Penggunaan disembunyikan jika autentikasi penggunaan penyedia yang dapat digunakan tidak dapat ditemukan. OpenClaw
secara otomatis menemukan plugin penyedia aktif yang mendeklarasikan
`contracts.usageProviders` dan mengimplementasikan `resolveUsageAuth` serta
`fetchUsageSnapshot`; tidak ada daftar izin penyedia inti terpisah. Kontrak statis
menjaga cakupan penemuan tanpa mengimpor setiap plugin penyedia. Setiap
plugin memiliki endpoint upstream dan pemetaan responsnya sendiri. Snapshot
bersama mempertahankan nama paket, jendela kuota, saldo, pengeluaran, dan anggaran
yang netral terhadap penyedia bagi konsumen CLI, aplikasi, dan UI Kontrol.

- **Anthropic (Claude)**: Token OAuth dalam profil autentikasi. Jika token OAuth tidak memiliki
  cakupan `user:profile`, beralih ke fallback sesi web `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`, atau cookie `sessionKey=` di `CLAUDE_WEB_COOKIE`) jika ditetapkan.
  Batas dengan cakupan model serta pengeluaran/anggaran bulanan penggunaan tambahan yang diaktifkan disertakan
  saat Anthropic melaporkannya. Kunci API Admin Anthropic eksplisit, atau profil
  penyedia `sk-ant-admin...` yang terdeteksi otomatis, sebagai gantinya menampilkan biaya organisasi
  30 hari dan riwayat Messages API.
- **ClawRouter**: Kunci API (`CLAWROUTER_API_KEY`). Menampilkan jendela anggaran bulanan
  dan anggaran USD bertipe jika dikonfigurasi; jika tidak, menampilkan pengeluaran agregat dan
  ringkasan permintaan/token/biaya.
- **DeepSeek**: Kunci API melalui env/konfigurasi/penyimpanan autentikasi (`DEEPSEEK_API_KEY`).
  Menampilkan setiap saldo mata uang yang dilaporkan penyedia.
- **GitHub Copilot**: Token OAuth dalam profil autentikasi.
- **Gemini CLI**: Token OAuth dalam profil autentikasi.
- **MiniMax**: Kunci API atau profil autentikasi OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama,
  memprioritaskan OAuth MiniMax yang tersimpan jika tersedia, dan jika tidak beralih ke fallback
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Polling penggunaan memperoleh host Coding Plan dari `models.providers.minimax-portal.baseUrl`
  atau `models.providers.minimax.baseUrl` jika dikonfigurasi, dan jika tidak menggunakan
  host MiniMax CN.
  Kolom mentah `usage_percent` / `usagePercent` milik MiniMax berarti kuota yang **tersisa**,
  sehingga OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis jumlah diprioritaskan jika
  tersedia.
  - Label jendela berasal dari kolom jam/menit penyedia jika tersedia, lalu
    beralih ke fallback rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw memprioritaskan
    entri model chat, memperoleh label jendela dari stempel waktu jika kolom eksplisit
    `window_hours` / `window_minutes` tidak tersedia, dan menyertakan nama model
    dalam label paket.
- **OpenAI (paket Codex/ChatGPT)**: Token OAuth dalam profil autentikasi (header `ChatGPT-Account-Id`
  dikirim jika id akun tersedia). Menampilkan paket ChatGPT, jendela Codex yang dapat
  direset, serta saldo kredit jika dilaporkan. Kredit tetap merupakan kredit penyedia;
  OpenClaw tidak melabelinya sebagai dolar. `OPENAI_ADMIN_KEY` menambahkan
  biaya organisasi 30 hari dan riwayat penggunaan completions jika kunci memiliki akses
  Usage Dashboard. Kredensial inferensi tidak pernah diteruskan ke API organisasi.
- **OpenRouter**: Kunci API atau kunci API yang didukung OAuth (`OPENROUTER_API_KEY` atau profil
  autentikasi). Menggabungkan endpoint kredit akun dengan endpoint kuota kunci,
  sehingga saldo/pengeluaran akun, anggaran kunci, serta penggunaan harian/mingguan/bulanan muncul
  saat kredensial dapat mengaksesnya. Masing-masing endpoint dapat memperkaya snapshot
  secara independen.
- **Venice**: Kunci API melalui env/konfigurasi/penyimpanan autentikasi (`VENICE_API_KEY`). Menampilkan saldo USD dan
  DIEM serta penggunaan alokasi epoch DIEM jika dilaporkan.
- **Xiaomi MiMo**: dua permukaan penggunaan terpisah. Bayar sesuai pemakaian menggunakan kunci API
  (`XIAOMI_API_KEY`); Token Plan menggunakan kunci terpisah (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Saat ini, keduanya tidak melaporkan jendela kuota.
- **z.ai**: Kunci API melalui env/konfigurasi/penyimpanan autentikasi (`ZAI_API_KEY` atau `Z_AI_API_KEY`).

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Bilah menu](/id/platforms/mac/menu-bar)
