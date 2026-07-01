---
read_when:
    - Anda sedang menghubungkan permukaan penggunaan/kuota penyedia
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan autentikasi
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-07-01T20:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Apa itu

- Menarik penggunaan/kuota penyedia langsung dari endpoint penggunaan mereka.
- Tidak ada estimasi biaya; hanya jendela kuota atau ringkasan status akun yang
  dilaporkan penyedia.
- Output status jendela kuota yang mudah dibaca manusia dinormalisasi menjadi `X% left`, bahkan
  ketika API hulu melaporkan kuota terpakai, kuota tersisa, atau hanya hitungan
  mentah. Penyedia tanpa jendela kuota yang dapat direset dapat menampilkan teks
  ringkasan penyedia sebagai gantinya, seperti saldo.
- `/status` tingkat sesi dan `session_status` dapat fallback ke entri penggunaan
  transkrip terbaru ketika snapshot sesi langsung minim. Fallback itu mengisi
  penghitung token/cache yang hilang, dapat memulihkan label model runtime aktif,
  dan memilih total berorientasi prompt yang lebih besar ketika metadata sesi
  hilang atau lebih kecil. Nilai langsung bukan nol yang sudah ada tetap menang.

## Tempat kemunculannya

- `/status` dalam chat: kartu status kaya emoji dengan token sesi + estimasi biaya (hanya kunci API). Penggunaan penyedia ditampilkan untuk **penyedia model saat ini** ketika tersedia sebagai jendela `X% left` yang dinormalisasi atau teks ringkasan penyedia.
- `/usage off|tokens|full` dalam chat: footer penggunaan per respons.
- `/usage cost` dalam chat: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak rincian lengkap per penyedia.
- CLI: `openclaw channels list` mencetak snapshot penggunaan yang sama bersama konfigurasi penyedia (gunakan `--no-usage` untuk melewati).
- Bilah menu macOS: bagian "Penggunaan" di bawah Konteks (hanya jika tersedia).

## Mode footer penggunaan default

`/usage off|tokens|full` mengatur footer untuk sebuah sesi dan diingat untuk sesi
tersebut. `messages.responseUsage` menanamkan mode itu untuk sesi yang belum
memilih, sehingga footer dapat aktif secara default tanpa mengetik `/usage` setiap kali.

Tetapkan satu mode untuk setiap channel, atau peta per-channel dengan fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Tiga status sesi yang berbeda

Field `responseUsage` milik sesi memiliki tiga status yang dapat direpresentasikan, masing-masing dengan
semantik berbeda:

| Status              | Nilai tersimpan                 | Mode efektif                                                         |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **Belum diatur / mewarisi** | `undefined` (tidak ada)         | Jatuh ke default konfigurasi `messages.responseUsage`, lalu `off`. |
| **Nonaktif eksplisit** | `"off"` (tersimpan)              | Selalu nonaktif — default konfigurasi non-off tidak dapat mengaktifkan ulang footer. |
| **Aktif eksplisit** | `"tokens"` atau `"full"` (tersimpan) | Mode tersebut, terlepas dari default konfigurasi.                    |

### Presedensi

Mode efektif = override sesi → entri konfigurasi channel → `default` → `off`.

`/usage off` eksplisit **dipersistenkan** sebagai nilai literal `"off"` dalam
sesi, bukan sama dengan "belum diatur." Ini berarti default `messages.responseUsage`
non-off tidak dapat mengaktifkan kembali footer setelah pengguna menonaktifkannya secara eksplisit.

### Mereset vs. menonaktifkan

- `/usage off` — memaksa footer nonaktif dan mempertahankan pilihan itu. Default
  non-off yang dikonfigurasi tidak dapat menimpanya.
- `/usage reset` (alias: `inherit`, `clear`, `default`) — menghapus override sesi.
  Sesi kemudian **mewarisi** default konfigurasi efektif
  (`messages.responseUsage`). Jika tidak ada default yang dikonfigurasi, footer nonaktif
  (tidak berubah dari sebelumnya). Gunakan ini untuk "kembali ke default" tanpa secara eksplisit
  mengaktifkan footer.
- Reset sesi penuh (`/reset` atau `/new`) atau rollover sesi **mempertahankan**
  preferensi mode penggunaan eksplisit sehingga pilihan tampilan pengguna bertahan melewati
  rollover sesi. Hanya `/usage reset` (dan aliasnya) yang benar-benar menghapus
  override.

### Perilaku toggle

`/usage` tanpa argumen berputar: off → tokens → full → off. Titik awal
siklus adalah mode saat ini yang **efektif** (override sesi yang jatuh ke
default konfigurasi ketika belum diatur), sehingga siklus selalu konsisten dengan apa yang
dilihat pengguna di footer.

### Konfigurasi

Tanpa konfigurasi, perilaku sebelumnya tetap berlaku (footer nonaktif sampai `/usage`). Gunakan
`/usage reset` untuk menghapus override sesi dan mewarisi ulang default yang dikonfigurasi.

## Footer `/usage full` kustom

`/usage full` menampilkan footer ringkas bawaan dengan model, reasoning, cepat/lambat,
jendela konteks, dan biaya ketika field tersebut tersedia. Field token dan cache
tetap tersedia untuk templat kustom. Tidak diperlukan file templat.

`messages.usageTemplate` hanya untuk tata letak kustom tingkat lanjut. Nilainya adalah
path file JSON (mendukung `~`) atau objek inline, dan menggantikan footer bawaan
ketika valid:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Templat yang hilang atau kosong fallback ke footer bawaan secara diam-diam. Templat
terkonfigurasi yang tidak dapat dibaca atau tidak valid juga fallback ke footer bawaan dan memancarkan
peringatan operator.

Mulai templat kustom dari bentuk bawaan, lalu edit bagian yang ingin Anda
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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Setiap surface adalah daftar **piece** berurutan; engine merender masing-masing, membuang
yang kosong, dan menggabungkan yang tersisa dengan `sep`. Surface tanpa entri menggunakan
`output.default`.

### Path Kontrak

Sebuah piece membaca nilai dari kontrak per-turn melalui dot-path. Nilai yang tidak ada menjadi
kosong (sehingga guard `when` atau `|fallback` menjaga piece tetap bersih).

| Path                                                                                | Makna                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id channel (`discord`/`telegram`/dll.) |
| `model.provider` / `model.display_name`                                             | id penyedia / id model                 |
| `model.reasoning`                                                                   | effort (`off` sampai `xhigh`)          |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback digunakan / model dipin |
| `state.fast_mode`                                                                   | bool: cepat vs lambat                  |
| `context.max_tokens` / `context.pct_used`                                           | anggaran jendela / 0-100 terpakai      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregat turn                           |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guard tampilan token dan persen cache  |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | hanya panggilan model final            |
| `cost.turn_usd`                                                                     | estimasi biaya turn                    |
| `identity.name` / `identity.emoji`                                                  | nama agen / emoji yang dipilih         |

(Jendela rate-limit penyedia **tidak** ada dalam kontrak ini.)

### Verb

Pipe nilai melalui verb dari kiri ke kanan; segmen non-verb adalah fallback.

| Verb            | Efek                                  | Contoh                            |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | hitungan ringkas                      | `272000 -> 272k`                  |
| `fixed:N`       | N desimal (default 2)                 | `0.0377`                          |
| `dur`           | detik ke durasi                       | `14820 -> 4h07m`                  |
| `pct`           | tambahkan `%`                         | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | dari terpakai ke tersisa          |
| `alias:TABLE`   | cari di `aliases`, gema jika tidak terdaftar | `medium -> 🌗`                    |
| `meter:W:SCALE` | bar glyph W-sel di atas nilai 0-100   | `[⣿⣿⠐⠐⠐]` (`meter:1` = satu glyph) |

### Bentuk piece

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolasi.
- `{ "when": "<path>", "text": "..." }`: render hanya jika path truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: nilai ke glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: iterasi array.

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

- **Anthropic (Claude)**: Token OAuth di profil auth.
- **GitHub Copilot**: Token OAuth di profil auth.
- **Gemini CLI**: Token OAuth di profil auth.
  - Penggunaan JSON beralih kembali ke `stats`; `stats.cached` dinormalisasi menjadi
    `cacheRead`.
- **OpenAI Codex**: Token OAuth di profil auth (accountId digunakan jika ada).
- **MiniMax**: Kunci API atau profil auth OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama,
  mengutamakan OAuth MiniMax tersimpan jika ada, dan jika tidak beralih kembali
  ke `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Polling penggunaan memperoleh host Coding Plan dari `models.providers.minimax-portal.baseUrl`
  atau `models.providers.minimax.baseUrl` jika dikonfigurasi, dan jika tidak menggunakan
  host MiniMax CN.
  Kolom mentah MiniMax `usage_percent` / `usagePercent` berarti kuota **tersisa**,
  sehingga OpenClaw membaliknya sebelum ditampilkan; kolom berbasis hitungan diutamakan jika
  ada.
  - Label jendela coding-plan berasal dari kolom jam/menit penyedia jika
    ada, lalu beralih kembali ke rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw mengutamakan entri
    model chat, memperoleh label jendela dari timestamp jika kolom eksplisit
    `window_hours` / `window_minutes` tidak ada, dan menyertakan nama model
    dalam label paket.
- **Xiaomi MiMo**: Kunci API melalui env/config/penyimpanan auth (`XIAOMI_API_KEY`).
- **z.ai**: Kunci API melalui env/config/penyimpanan auth.
- **DeepSeek**: Kunci API melalui env/config/penyimpanan auth (`DEEPSEEK_API_KEY`).
  OpenClaw memanggil endpoint saldo DeepSeek dan menampilkan saldo yang dilaporkan penyedia
  sebagai teks alih-alih jendela kuota persen tersisa.

Penggunaan disembunyikan ketika tidak ada auth penggunaan penyedia yang dapat digunakan yang bisa diselesaikan. Penyedia
dapat menyediakan logika auth penggunaan khusus plugin; jika tidak, OpenClaw beralih kembali ke
kredensial OAuth/kunci API yang cocok dari profil auth, variabel lingkungan,
atau config.

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
