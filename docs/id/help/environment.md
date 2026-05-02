---
read_when:
    - Anda perlu mengetahui variabel lingkungan mana yang dimuat, dan urutannya
    - Anda sedang men-debug kunci API yang hilang di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan penerapan
summary: Tempat OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-05-02T09:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw mengambil variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.

## Presedensi (tertinggi → terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (bawaan dotenv; tidak menimpa).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; tidak menimpa).
4. **Blok `env` konfigurasi** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor shell login opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi belum ada.

Pada pemasangan baru Ubuntu yang menggunakan direktori status bawaan, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan tidak cocok, OpenClaw mempertahankan `~/.openclaw/.env` dan mencetak peringatan.

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

## Variabel lingkungan yang disuntikkan runtime

OpenClaw juga menyuntikkan penanda konteks ke dalam proses anak yang dibuat:

- `OPENCLAW_SHELL=exec`: ditetapkan untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: ditetapkan untuk pembuatan proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: ditetapkan untuk `openclaw acp client` saat membuat proses jembatan ACP.
- `OPENCLAW_SHELL=tui-local`: ditetapkan untuk perintah shell `!` TUI lokal.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang wajib). Penanda ini dapat digunakan dalam logika shell/profil
untuk menerapkan aturan khusus konteks.

## Variabel lingkungan UI

- `OPENCLAW_THEME=light`: paksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: paksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi variabel lingkungan dalam konfigurasi

Anda dapat merujuk variabel lingkungan secara langsung dalam nilai string konfigurasi menggunakan sintaks `${VAR_NAME}`:

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

Lihat [Konfigurasi: substitusi variabel lingkungan](/id/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Referensi rahasia vs string `${ENV}`

OpenClaw mendukung dua pola berbasis lingkungan:

- Substitusi string `${VAR}` dalam nilai konfigurasi.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk bidang yang mendukung referensi rahasia.

Keduanya diselesaikan dari lingkungan proses saat aktivasi. Detail SecretRef didokumentasikan di [Pengelolaan Rahasia](/id/gateway/secrets).

## Variabel lingkungan terkait jalur

| Variabel                 | Tujuan                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Timpa direktori home yang digunakan untuk semua resolusi jalur internal (`~/.openclaw/`, direktori agen, sesi, kredensial). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`     | Timpa direktori status (bawaan `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Timpa jalur file konfigurasi (bawaan `~/.openclaw/openclaw.json`).                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | Daftar jalur direktori tempat direktif `$include` dapat menyelesaikan file di luar direktori konfigurasi (bawaan: tidak ada — `$include` dibatasi ke direktori konfigurasi). Tilde diperluas.  |

## Pencatatan log

| Variabel             | Tujuan                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Timpa level log untuk file dan konsol (mis. `debug`, `trace`). Diutamakan daripada `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai tidak valid diabaikan dengan peringatan. |

### `OPENCLAW_HOME`

Saat ditetapkan, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk semua resolusi jalur internal. Ini memungkinkan isolasi sistem file penuh untuk akun layanan tanpa kepala.

**Presedensi:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat ditetapkan ke jalur tilde (mis. `~/svc`), yang diperluas menggunakan `$HOME` sebelum digunakan.

## pengguna nvm: kegagalan TLS web_fetch

Jika Node.js dipasang melalui **nvm** (bukan pengelola paket sistem), `fetch()` bawaan menggunakan
penyimpanan CA bawaan nvm, yang mungkin tidak memiliki CA akar modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` pada sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikan di lingkungan startup aktual:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke lingkungan layanan systemd
- entrypoint CLI `openclaw` menjalankan ulang dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` ditetapkan sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan mengandalkan penulisan hanya ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` saat startup proses.

## Variabel lingkungan lama

OpenClaw hanya membaca variabel lingkungan `OPENCLAW_*`. Prefiks lama
`CLAWDBOT_*` dan `MOLTBOT_*` dari rilis sebelumnya diabaikan secara diam-diam.

Jika masih ada yang ditetapkan pada proses Gateway saat startup, OpenClaw mengeluarkan
satu peringatan penghentian Node (`OPENCLAW_LEGACY_ENV_VARS`) yang mencantumkan
prefiks yang terdeteksi dan jumlah totalnya. Ganti nama setiap nilai dengan mengganti
prefiks lama dengan `OPENCLAW_` (misalnya `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); nama lama tidak berpengaruh.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [FAQ: variabel lingkungan dan pemuatan .env](/id/help/faq#env-vars-and-env-loading)
- [Ikhtisar model](/id/concepts/models)
