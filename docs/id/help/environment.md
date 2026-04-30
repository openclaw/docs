---
read_when:
    - Anda perlu mengetahui variabel lingkungan mana yang dimuat, dan dalam urutan apa
    - Anda sedang men-debug kunci API yang hilang di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan penerapan
summary: Tempat OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-04-30T09:53:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw mengambil variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.

## Prioritas (tertinggi → terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (default dotenv; tidak menimpa).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; tidak menimpa).
4. **Blok `env` konfigurasi** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor shell login opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi belum ada.

Pada instalasi baru Ubuntu yang menggunakan direktori status default, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan nilainya berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan mencetak peringatan.

Jika file konfigurasi sama sekali tidak ada, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Blok `env` konfigurasi

Dua cara yang setara untuk menetapkan env var inline (keduanya tidak menimpa):

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

`env.shellEnv` menjalankan shell login Anda dan hanya mengimpor kunci yang diharapkan tetapi **belum ada**:

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

Padanan env var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Env var yang diinjeksi saat runtime

OpenClaw juga menginjeksi penanda konteks ke proses anak yang dibuat:

- `OPENCLAW_SHELL=exec`: diatur untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: diatur untuk pembuatan proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: diatur untuk `openclaw acp client` saat membuat proses bridge ACP.
- `OPENCLAW_SHELL=tui-local`: diatur untuk perintah shell `!` TUI lokal.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang wajib). Penanda ini dapat digunakan dalam logika shell/profil
untuk menerapkan aturan khusus konteks.

## Env var UI

- `OPENCLAW_THEME=light`: paksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: paksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi env var dalam konfigurasi

Anda dapat merujuk env var secara langsung dalam nilai string konfigurasi menggunakan sintaks `${VAR_NAME}`:

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

Lihat [Konfigurasi: Substitusi env var](/id/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Secret refs vs string `${ENV}`

OpenClaw mendukung dua pola berbasis env:

- Substitusi string `${VAR}` dalam nilai konfigurasi.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk bidang yang mendukung referensi rahasia.

Keduanya diselesaikan dari env proses pada saat aktivasi. Detail SecretRef didokumentasikan di [Manajemen Rahasia](/id/gateway/secrets).

## Env var terkait path

| Variabel               | Tujuan                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`        | Timpa direktori home yang digunakan untuk semua resolusi path internal (`~/.openclaw/`, direktori agen, sesi, kredensial). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`   | Timpa direktori status (default `~/.openclaw`).                                                                                                                                            |
| `OPENCLAW_CONFIG_PATH` | Timpa path file konfigurasi (default `~/.openclaw/openclaw.json`).                                                                                                                         |

## Logging

| Variabel             | Tujuan                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Timpa level log untuk file dan konsol (misalnya `debug`, `trace`). Ini didahulukan dari `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai tidak valid diabaikan dengan peringatan. |

### `OPENCLAW_HOME`

Saat diatur, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk semua resolusi path internal. Ini memungkinkan isolasi filesystem penuh untuk akun layanan headless.

**Prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat diatur ke path tilde (misalnya `~/svc`), yang diperluas menggunakan `$HOME` sebelum digunakan.

## Pengguna nvm: kegagalan TLS web_fetch

Jika Node.js diinstal melalui **nvm** (bukan manajer paket sistem), `fetch()` bawaan menggunakan
penyimpanan CA bawaan nvm, yang mungkin tidak memiliki CA root modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` di sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikan di lingkungan startup aktual:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke lingkungan layanan systemd
- entrypoint CLI `openclaw` mengeksekusi ulang dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` yang sudah diatur sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan hanya mengandalkan penulisan variabel ini ke `~/.openclaw/.env`; Node membaca
`NODE_EXTRA_CA_CERTS` saat startup proses.

## Variabel lingkungan lama

OpenClaw hanya membaca variabel lingkungan `OPENCLAW_*`. Prefiks lama
`CLAWDBOT_*` dan `MOLTBOT_*` dari rilis sebelumnya diabaikan secara diam-diam.

Jika masih ada yang diatur pada proses Gateway saat startup, OpenClaw memunculkan
satu peringatan deprecation Node (`OPENCLAW_LEGACY_ENV_VARS`) yang mencantumkan
prefiks yang terdeteksi dan jumlah totalnya. Ganti nama setiap nilai dengan mengganti
prefiks lama dengan `OPENCLAW_` (misalnya `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); nama lama tidak berpengaruh.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [FAQ: env vars dan pemuatan .env](/id/help/faq#env-vars-and-env-loading)
- [Ringkasan model](/id/concepts/models)
