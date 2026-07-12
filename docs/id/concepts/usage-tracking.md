---
read_when:
    - Anda sedang menghubungkan antarmuka penggunaan/kuota penyedia
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan autentikasi
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-07-12T14:10:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Apa itu

- Mengambil penggunaan/kuota penyedia secara langsung dari endpoint penggunaan masing-masing penyedia. Tidak ada perkiraan tagihan penyedia; hanya nama paket, jendela kuota, saldo, pengeluaran, anggaran, riwayat biaya harian, atribusi token/model, atau ringkasan status akun yang dilaporkan penyedia.
- Keluaran jendela kuota yang mudah dibaca dinormalisasi menjadi `X% tersisa`, bahkan ketika penyedia melaporkan kuota yang telah digunakan, kuota tersisa, atau hanya jumlah mentah. Penyedia tanpa jendela kuota yang dapat diatur ulang akan menampilkan teks ringkasan penyedia sebagai gantinya (misalnya saldo).
- `/status` tingkat sesi dan alat `session_status` menggunakan log transkrip sesi sebagai fallback ketika snapshot sesi langsung tidak memiliki data token/model. Fallback tersebut mengisi penghitung token/cache yang hilang, dapat memulihkan label model runtime aktif, dan memilih total berorientasi prompt yang lebih besar ketika metadata sesi tidak tersedia atau lebih kecil (`totalTokensFresh !== true`, nol, atau di bawah nilai yang diturunkan dari transkrip). Nilai langsung bukan nol selalu diutamakan daripada fallback.

## Tempat kemunculannya

- `/status` dalam percakapan: kartu status dengan token sesi dan perkiraan biaya (hanya model dengan kunci API). Penggunaan penyedia ditampilkan untuk **penyedia model saat ini** jika tersedia, sebagai jendela `X% tersisa` yang dinormalisasi atau teks ringkasan penyedia.
- `/usage off|tokens|full` dalam percakapan: footer penggunaan per respons.
- `/usage cost` dalam percakapan: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak perincian lengkap penggunaan/kuota per penyedia.
- CLI: `openclaw models status` mencantumkan profil autentikasi OAuth/token dan menampilkan ringkasan jendela penggunaan di sebelah setiap penyedia yang memilikinya.
- UI Kontrol: **Penggunaan** menampilkan kartu paket dan tagihan penyedia di atas analisis token serta perkiraan biaya OpenClaw yang diturunkan dari sesi. Kredensial Anthropic dan OpenAI Admin API menambahkan pengeluaran hari ini, 7 hari, dan 30 hari yang dilaporkan penyedia, tren harian, total token, model teratas, serta kategori biaya.
- UI Kontrol: popover cincin konteks pada komposer percakapan menampilkan **penggunaan paket** untuk penyedia langganan — bilah per jendela (5 jam, mingguan, cakupan model) beserta waktu pengaturan ulang, paket penyedia jika diketahui (misalnya `Max (20x)`), dan kredit penggunaan tambahan. Sesi yang ditagih melalui paket menyembunyikan perkiraan biaya dolar per token; sesi yang ditagih melalui API tetap menampilkan `Perk. biaya` dan perincian biaya berdasarkan jenis. Penyiapan Claude Code CLI (`claude-cli`) menggunakan kembali penggunaan langganan Anthropic yang sama.
- Bilah menu macOS: bagian akar "Penggunaan" muncul di bawah Konteks ketika snapshot penggunaan penyedia tersedia. Lihat [Bilah menu](/id/platforms/mac/menu-bar).

`openclaw channels list` tidak lagi mencetak penggunaan penyedia; sebagai gantinya, perintah tersebut mengarahkan pengguna ke `openclaw status` atau `openclaw models list`.

## Riwayat biaya Anthropic dan OpenAI

Kuota langganan dan tagihan API merupakan permukaan penyedia yang berbeda:

- Kredensial langganan/penyiapan Anthropic tetap menampilkan jendela kuota Claude dan anggaran penggunaan tambahan opsional. Atur `ANTHROPIC_ADMIN_KEY` atau `ANTHROPIC_ADMIN_API_KEY` untuk menampilkan riwayat Usage and Cost API organisasi sebagai gantinya. Kredensial penyedia Anthropic yang diawali dengan `sk-ant-admin` dideteksi secara otomatis.
- OAuth OpenAI ChatGPT/Codex tetap menampilkan paket, jendela kuota, dan saldo kredit. Atur `OPENAI_ADMIN_KEY` untuk menampilkan riwayat biaya dan penggunaan penyelesaian organisasi sebagai gantinya; secara opsional, atur `OPENAI_PROJECT_ID` untuk membatasi cakupannya ke satu proyek. OpenClaw tidak pernah mengirim kredensial inferensi dari `OPENAI_API_KEY`, konfigurasi penyedia, atau profil autentikasi ke API organisasi karena kunci tersebut mungkin merupakan milik endpoint khusus.

Kredensial admin diutamakan karena menyediakan tagihan organisasi yang sebenarnya. OpenClaw tidak menggabungkan total yang dilaporkan penyedia ini dengan perkiraan sesi lokalnya; kedua bagian tersebut memang ditujukan untuk menjawab pertanyaan yang berbeda.

## Mode footer penggunaan default

`/usage off|tokens|full` menetapkan footer untuk sebuah sesi dan diingat untuk sesi
tersebut. `messages.responseUsage` menginisialisasi mode tersebut untuk sesi yang belum
memilihnya, sehingga footer dapat aktif secara default tanpa mengetik `/usage` setiap kali.

Atur satu mode untuk setiap saluran, atau peta per saluran dengan fallback `default`:

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

Bidang `responseUsage` suatu sesi memiliki tiga status yang dapat direpresentasikan, masing-masing dengan
semantik berbeda:

| Status                  | Nilai tersimpan                  | Mode efektif                                                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| **Tidak diatur / warisi** | `undefined` (tidak ada)          | Berlanjut ke default konfigurasi `messages.responseUsage`, lalu `off`.           |
| **Nonaktif eksplisit**  | `"off"` (tersimpan)              | Selalu nonaktif; default konfigurasi selain nonaktif tidak dapat mengaktifkan kembali footer. |
| **Aktif eksplisit**     | `"tokens"` atau `"full"` (tersimpan) | Mode tersebut, terlepas dari default konfigurasi.                            |

### Prioritas

Mode efektif = penggantian sesi → entri konfigurasi saluran → `default` → `off`.

Perintah eksplisit `/usage off` **disimpan secara persisten** sebagai nilai literal `"off"` dalam
sesi, tidak sama dengan "tidak diatur". Default `messages.responseUsage` yang bukan nonaktif
tidak dapat mengaktifkan kembali footer setelah pengguna menonaktifkannya secara eksplisit.

### Mengatur ulang vs. menonaktifkan

- `/usage off` memaksa footer nonaktif dan menyimpan pilihan tersebut secara persisten. Default
  terkonfigurasi yang bukan nonaktif tidak dapat menggantikannya.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) menghapus penggantian
  sesi. Sesi kemudian **mewarisi** default konfigurasi efektif
  (`messages.responseUsage`). Jika tidak ada default yang dikonfigurasi, footer tetap nonaktif.
- Pengaturan ulang sesi penuh (`/reset` atau `/new`) atau pergantian sesi **mempertahankan**
  preferensi mode penggunaan eksplisit sehingga pilihan tampilan pengguna tetap berlaku
  setelah pergantian sesi. Hanya `/usage reset` (dan aliasnya) yang menghapus penggantian tersebut.

### Perilaku peralihan

`/usage` tanpa argumen berputar: nonaktif → token → penuh → nonaktif. Titik awal
siklus adalah mode saat ini yang **efektif** (penggantian sesi berlanjut
ke default konfigurasi saat tidak diatur), sehingga siklus selalu sesuai dengan apa yang
saat ini dilihat pengguna di footer.

### Konfigurasi

Tanpa konfigurasi, perilaku sebelumnya tetap berlaku (footer nonaktif hingga `/usage`). Gunakan
`/usage reset` untuk menghapus penggantian sesi dan kembali mewarisi default yang dikonfigurasi.

## Footer `/usage full` khusus

`/usage tokens` selalu merender baris sederhana `Penggunaan: X masuk / Y keluar` (ditambah cache dan
akhiran perkiraan biaya jika tersedia). Hanya `/usage full` yang merender footer yang lebih kaya
seperti dijelaskan di bawah.

`/usage full` menampilkan footer ringkas bawaan dengan model, penalaran, cepat/lambat,
jendela konteks, dan biaya jika bidang tersebut tersedia. Tidak diperlukan berkas templat
untuk footer bawaan.

`messages.usageTemplate` hanya untuk tata letak khusus tingkat lanjut. Nilainya berupa
jalur berkas JSON (mendukung `~`) atau objek sebaris, dan menggantikan footer bawaan
jika valid. Jalur berkas dipantau dan dimuat ulang secara langsung saat berubah.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Templat yang hilang atau kosong secara diam-diam menggunakan footer bawaan sebagai fallback. Templat terkonfigurasi
yang tidak dapat dibaca atau tidak valid (JSON buruk, atau bentuk tanpa bagian keluaran yang dapat dirender)
juga menggunakan footer bawaan sebagai fallback dan mengeluarkan peringatan operator.

Mulailah templat khusus dari bentuk bawaan, lalu edit bagian yang ingin Anda
ubah:

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
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Setiap permukaan adalah daftar **bagian** yang terurut; mesin merender masing-masing, membuang
yang kosong, dan menggabungkan bagian yang tersisa dengan `sep`. Permukaan tanpa entri menggunakan
`output.default`.

### Jalur Kontrak

Sebuah bagian membaca nilai dari kontrak per giliran melalui jalur bertitik. Nilai yang tidak ada dianggap
kosong (sehingga penjaga `when` atau `|fallback` menjaga bagian tetap bersih).

| Jalur                                                                               | Arti                                                                                                        |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | id kanal (`discord`/`telegram`/dll.)                                                                         |
| `agentId` / `chat_type`                                                             | id agen pemilik / jenis permukaan obrolan                                                                    |
| `model.id` / `model.display_name` / `model.provider`                                | id model / nama tampilan / id penyedia                                                                        |
| `model.actual`, `model.resolved_ref`                                                | referensi penyedia/model yang benar-benar digunakan untuk giliran tersebut                                   |
| `model.requested`                                                                   | referensi penyedia/model yang diminta (sebelum fallback)                                                      |
| `model.reasoning`                                                                   | tingkat upaya (`off` hingga `xhigh`)                                                                          |
| `model.is_fallback` / `model.is_override`                                           | boolean: fallback digunakan / model disematkan                                                                |
| `model.override_source` / `model.auth_mode`                                         | label sumber penggantian / mode kredensial (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`)      |
| `state.fast_mode`                                                                   | boolean: cepat dibanding lambat                                                                               |
| `state.compactions`                                                                 | jumlah Compaction untuk sesi tersebut                                                                         |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | anggaran jendela / token yang terpakai / 0–100 yang digunakan                                                 |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregat giliran                                                                                               |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | token pembacaan cache dan penulisan cache untuk giliran tersebut                                              |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | pengaman tampilan token                                                                                       |
| `usage.cache_hit_pct`                                                               | porsi pembacaan cache dari total token prompt                                                                 |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | hanya panggilan model terakhir (juga memiliki `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)      |
| `cost.turn_usd` / `cost.available`                                                  | perkiraan biaya giliran / apakah tabel biaya berhasil ditentukan                                              |
| `timing.duration_ms`                                                                | durasi giliran berdasarkan waktu nyata                                                                        |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nama identitas agen / emoji / avatar                                                                          |
| `session.id`                                                                        | id sesi                                                                                                       |

(Jendela batas laju penyedia **tidak** termasuk dalam kontrak ini; saat ini tidak ada jalur bernilai larik, sehingga bagian `each` tidak memiliki apa pun untuk diiterasi.)

### Kata kerja

Salurkan nilai melalui kata kerja dari kiri ke kanan; segmen yang bukan kata kerja merupakan fallback.

| Kata kerja      | Efek                                         | Contoh                            |
| --------------- | -------------------------------------------- | --------------------------------- |
| `num`           | jumlah ringkas                               | `272000 -> 272k`                  |
| `fixed:N`       | N angka desimal (bawaan 2)                   | `0.0377`                          |
| `dur`           | detik menjadi durasi                         | `14820 -> 4h07m`                  |
| `pct`           | tambahkan `%`                                | `96 -> 96%`                       |
| `inv`           | `100 - x`                                    | dari yang digunakan menjadi tersisa |
| `alias:TABLE`   | cari di `aliases`, tampilkan apa adanya jika tidak terdaftar | `medium -> 🌗`       |
| `meter:W:SCALE` | bilah glif W-sel untuk nilai 0–100           | `[⣿⣿⠐⠐⠐]` (`meter:1` = satu glif) |

### Bentuk bagian

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolasi.
- `{ "when": "<path>", "text": "..." }`: render hanya jika jalur bernilai benar.
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

dirender, misalnya, menjadi `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Penyedia + kredensial

Penggunaan disembunyikan jika autentikasi penggunaan penyedia yang dapat dipakai tidak dapat ditentukan. OpenClaw
secara otomatis menemukan plugin penyedia aktif yang mendeklarasikan
`contracts.usageProviders` serta mengimplementasikan `resolveUsageAuth` dan
`fetchUsageSnapshot`; tidak ada daftar izin penyedia inti yang terpisah. Kontrak
statis menjaga penemuan tetap terbatas tanpa mengimpor setiap plugin penyedia. Setiap
plugin memiliki endpoint hulu dan pemetaan responsnya sendiri. Snapshot
bersama menjaga nama paket, jendela kuota, saldo, pengeluaran, dan anggaran
tetap netral terhadap penyedia bagi pengguna CLI, aplikasi, dan UI Kontrol.

- **Anthropic (Claude)**: token OAuth dalam profil autentikasi. Jika token OAuth tidak memiliki
  cakupan `user:profile`, gunakan fallback ke sesi web `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`, atau cookie `sessionKey=` dalam `CLAUDE_WEB_COOKIE`) jika ditetapkan.
  Batas khusus model serta pengeluaran/anggaran bulanan penggunaan tambahan yang diaktifkan disertakan
  saat Anthropic melaporkannya. Kunci API Admin Anthropic yang diberikan secara eksplisit, atau profil
  penyedia `sk-ant-admin...` yang terdeteksi otomatis, sebagai gantinya menampilkan biaya organisasi
  30 hari dan riwayat Messages API.
- **ClawRouter**: kunci API (`CLAWROUTER_API_KEY`). Menampilkan jendela anggaran bulanan
  dan anggaran USD bertipe jika dikonfigurasi; jika tidak, menampilkan pengeluaran agregat serta
  ringkasan permintaan/token/biaya.
- **DeepSeek**: kunci API melalui env/konfigurasi/penyimpanan autentikasi (`DEEPSEEK_API_KEY`).
  Menampilkan setiap saldo mata uang yang dilaporkan penyedia.
- **GitHub Copilot**: token OAuth dalam profil autentikasi.
- **Gemini CLI**: token OAuth dalam profil autentikasi.
- **MiniMax**: kunci API atau profil autentikasi OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama,
  mengutamakan OAuth MiniMax tersimpan jika tersedia, dan jika tidak menggunakan fallback
  ke `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Polling penggunaan memperoleh host Paket Pengodean dari `models.providers.minimax-portal.baseUrl`
  atau `models.providers.minimax.baseUrl` jika dikonfigurasi, dan jika tidak menggunakan
  host MiniMax CN.
  Kolom mentah `usage_percent` / `usagePercent` milik MiniMax berarti kuota yang **tersisa**,
  sehingga OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis jumlah diutamakan jika
  tersedia.
  - Label jendela berasal dari kolom jam/menit penyedia jika tersedia, kemudian
    menggunakan fallback ke rentang `start_time` / `end_time`.
  - Jika endpoint paket pengodean mengembalikan `model_remains`, OpenClaw mengutamakan
    entri model obrolan, memperoleh label jendela dari stempel waktu saat kolom eksplisit
    `window_hours` / `window_minutes` tidak tersedia, dan menyertakan nama model
    dalam label paket.
- **OpenAI (paket Codex/ChatGPT)**: token OAuth dalam profil autentikasi (header `ChatGPT-Account-Id`
  dikirim jika id akun tersedia). Menampilkan paket ChatGPT, jendela Codex yang dapat diatur ulang,
  dan saldo kredit jika dilaporkan. Kredit tetap merupakan kredit penyedia;
  OpenClaw tidak melabelinya sebagai dolar. `OPENAI_ADMIN_KEY` menambahkan
  biaya organisasi 30 hari dan riwayat penggunaan penyelesaian jika kunci memiliki akses
  Dasbor Penggunaan. Kredensial inferensi tidak pernah diteruskan ke API organisasi.
- **OpenRouter**: kunci API atau kunci API yang didukung OAuth (`OPENROUTER_API_KEY` atau profil
  autentikasi). Menggabungkan endpoint kredit akun dengan endpoint kuota kunci,
  sehingga saldo/pengeluaran akun, anggaran kunci, serta penggunaan harian/mingguan/bulanan muncul
  jika kredensial dapat mengaksesnya. Masing-masing endpoint dapat memperkaya snapshot
  secara independen.
- **Venice**: kunci API melalui env/konfigurasi/penyimpanan autentikasi (`VENICE_API_KEY`). Menampilkan saldo USD dan
  DIEM serta penggunaan alokasi periode DIEM jika dilaporkan.
- **Xiaomi MiMo**: dua permukaan penggunaan terpisah. Bayar sesuai pemakaian menggunakan kunci API
  (`XIAOMI_API_KEY`); Paket Token menggunakan kunci terpisah (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Keduanya saat ini tidak melaporkan jendela kuota.
- **z.ai**: kunci API melalui env/konfigurasi/penyimpanan autentikasi (`ZAI_API_KEY` atau `Z_AI_API_KEY`).

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Bilah menu](/id/platforms/mac/menu-bar)
