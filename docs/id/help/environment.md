---
read_when:
    - Anda perlu mengetahui variabel env mana yang dimuat, dan dalam urutan apa
    - Anda sedang men-debug kunci API yang hilang di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan deployment
summary: Tempat OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-04-05T13:56:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Variabel lingkungan

OpenClaw mengambil variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.

## Prioritas (tertinggi → terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (default dotenv; tidak menimpa).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; tidak menimpa).
4. **Blok `env` konfigurasi** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor login-shell opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan dan belum ada.

Pada instalasi baru Ubuntu yang menggunakan direktori state default, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan nilainya berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan menampilkan peringatan.

Jika file konfigurasi sama sekali tidak ada, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Blok `env` konfigurasi

Dua cara yang setara untuk menetapkan variabel env inline (keduanya tidak menimpa):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Impor env shell

`env.shellEnv` menjalankan login shell Anda dan hanya mengimpor kunci yang diharapkan dan **belum ada**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Padanan variabel env:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variabel env yang disuntikkan saat runtime

OpenClaw juga menyuntikkan penanda konteks ke proses turunan yang dijalankan:

- `OPENCLAW_SHELL=exec`: ditetapkan untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: ditetapkan untuk spawn proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: ditetapkan untuk `openclaw acp client` saat memunculkan proses bridge ACP.
- `OPENCLAW_SHELL=tui-local`: ditetapkan untuk perintah shell `!` TUI lokal.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang diperlukan). Penanda ini dapat digunakan dalam logika shell/profile
untuk menerapkan aturan khusus konteks.

## Variabel env UI

- `OPENCLAW_THEME=light`: paksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: paksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi variabel env dalam konfigurasi

Anda dapat merujuk variabel env langsung dalam nilai string konfigurasi menggunakan sintaks `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Lihat [Konfigurasi: substitusi variabel env](/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Referensi rahasia vs string `${ENV}`

OpenClaw mendukung dua pola berbasis env:

- Substitusi string `${VAR}` dalam nilai konfigurasi.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk field yang mendukung referensi rahasia.

Keduanya diselesaikan dari env proses pada saat aktivasi. Detail SecretRef didokumentasikan dalam [Manajemen Rahasia](/gateway/secrets).

## Variabel env terkait path

| Variable               | Tujuan                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Menimpa direktori home yang digunakan untuk semua resolusi path internal (`~/.openclaw/`, direktori agen, sesi, kredensial). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`   | Menimpa direktori state (default `~/.openclaw`).                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH` | Menimpa path file konfigurasi (default `~/.openclaw/openclaw.json`).                                                                                                              |

## Logging

| Variable             | Tujuan                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Menimpa tingkat log untuk file dan konsol (mis. `debug`, `trace`). Memiliki prioritas lebih tinggi daripada `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai yang tidak valid diabaikan dengan peringatan. |

### `OPENCLAW_HOME`

Saat ditetapkan, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk semua resolusi path internal. Ini memungkinkan isolasi filesystem penuh untuk akun layanan tanpa antarmuka.

**Prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat ditetapkan ke path tilde (mis. `~/svc`), yang akan diekspansi menggunakan `$HOME` sebelum digunakan.

## Pengguna nvm: kegagalan TLS `web_fetch`

Jika Node.js diinstal melalui **nvm** (bukan manajer paket sistem), `fetch()` bawaan menggunakan
penyimpanan CA bawaan nvm, yang mungkin tidak memiliki root CA modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Hal ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` pada sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikannya di lingkungan startup yang sebenarnya:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke lingkungan layanan systemd
- entrypoint CLI `openclaw` mengeksekusi ulang dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` yang sudah ditetapkan sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel tersebut sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan mengandalkan penulisan hanya ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` saat startup proses.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [FAQ: variabel env dan pemuatan .env](/help/faq#env-vars-and-env-loading)
- [Ringkasan model](/id/concepts/models)
