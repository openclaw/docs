---
read_when:
    - Anda perlu mengetahui variabel lingkungan mana yang dimuat, dan urutan pemuatannya
    - Anda sedang men-debug kunci API yang tidak ditemukan di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan penerapan
summary: Di mana OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-05-11T20:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw menarik variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.

## Prioritas (tertinggi → terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (default dotenv; tidak menimpa).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; tidak menimpa).
4. **Blok `env` konfigurasi** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor login-shell opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi belum ada.

Pada instalasi baru Ubuntu yang menggunakan direktori status default, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan mencetak peringatan.

Jika file konfigurasi sama sekali tidak ada, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Blok `env` konfigurasi

Dua cara setara untuk menetapkan variabel lingkungan inline (keduanya tidak menimpa):

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

## Impor lingkungan shell

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

Padanan variabel lingkungan:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variabel lingkungan yang diinjeksi runtime

OpenClaw juga menginjeksi penanda konteks ke dalam proses anak yang dijalankan:

- `OPENCLAW_SHELL=exec`: ditetapkan untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: ditetapkan untuk spawn proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: ditetapkan untuk `openclaw acp client` saat men-spawn proses bridge ACP.
- `OPENCLAW_SHELL=tui-local`: ditetapkan untuk perintah shell `!` TUI lokal.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang wajib). Penanda ini dapat digunakan dalam logika shell/profil
untuk menerapkan aturan khusus konteks.

## Variabel lingkungan UI

- `OPENCLAW_THEME=light`: memaksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: memaksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi variabel lingkungan dalam konfigurasi

Anda dapat mereferensikan variabel lingkungan langsung di nilai string konfigurasi menggunakan sintaks `${VAR_NAME}`:

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

Lihat [Konfigurasi: Substitusi variabel lingkungan](/id/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Referensi rahasia vs string `${ENV}`

OpenClaw mendukung dua pola berbasis lingkungan:

- Substitusi string `${VAR}` dalam nilai konfigurasi.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk field yang mendukung referensi rahasia.

Keduanya di-resolve dari lingkungan proses pada waktu aktivasi. Detail SecretRef didokumentasikan di [Manajemen Rahasia](/id/gateway/secrets).

## Variabel lingkungan terkait path

| Variabel                 | Tujuan                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Menimpa direktori home yang digunakan untuk semua resolusi path internal (`~/.openclaw/`, direktori agen, sesi, kredensial). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`     | Menimpa direktori status (default `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Menimpa path file konfigurasi (default `~/.openclaw/openclaw.json`).                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | Daftar path direktori tempat direktif `$include` dapat me-resolve file di luar direktori konfigurasi (default: tidak ada — `$include` dibatasi ke direktori konfigurasi). Tilde diperluas.  |

## Logging

| Variabel                         | Tujuan                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Menimpa level log untuk file dan konsol (mis. `debug`, `trace`). Mengambil prioritas atas `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai tidak valid diabaikan dengan peringatan. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Mengeluarkan diagnostik waktu request/response model yang tertarget pada level `info` tanpa mengaktifkan log debug global.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostik payload model: `summary`, `tools`, atau `full-redacted`. `full-redacted` dibatasi dan disunting tetapi dapat menyertakan teks prompt/pesan.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostik streaming: `events` untuk waktu awal/selesai, `peek` untuk menyertakan lima event SSE pertama yang telah disunting.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostik permukaan model mode kode, termasuk penyembunyian alat provider dan penegakan hanya exec/wait.                                                                                          |

### `OPENCLAW_HOME`

Saat ditetapkan, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk semua resolusi path internal. Ini memungkinkan isolasi filesystem penuh untuk akun layanan headless.

**Prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat ditetapkan ke path tilde (mis. `~/svc`), yang diperluas menggunakan `$HOME` sebelum digunakan.

## Pengguna nvm: kegagalan TLS web_fetch

Jika Node.js diinstal melalui **nvm** (bukan manajer paket sistem), `fetch()` bawaan menggunakan
penyimpanan CA bawaan nvm, yang mungkin tidak memiliki CA root modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` di sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikan di lingkungan startup aktual:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke lingkungan layanan systemd
- entrypoint CLI `openclaw` menjalankan ulang dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` ditetapkan sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan hanya mengandalkan penulisan ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` pada startup proses.

## Variabel lingkungan legacy

OpenClaw hanya membaca variabel lingkungan `OPENCLAW_*`. Prefix legacy
`CLAWDBOT_*` dan `MOLTBOT_*` dari rilis sebelumnya diabaikan secara diam-diam.

Jika ada yang masih ditetapkan pada proses Gateway saat startup, OpenClaw mengeluarkan
satu peringatan deprecation Node (`OPENCLAW_LEGACY_ENV_VARS`) yang mencantumkan
prefix yang terdeteksi dan jumlah totalnya. Ganti nama setiap nilai dengan mengganti
prefix legacy dengan `OPENCLAW_` (misalnya `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); nama lama tidak berpengaruh.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [FAQ: variabel lingkungan dan pemuatan .env](/id/help/faq#env-vars-and-env-loading)
- [Ringkasan model](/id/concepts/models)
