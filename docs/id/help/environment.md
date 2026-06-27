---
read_when:
    - Anda perlu mengetahui env vars mana yang dimuat, dan dalam urutan apa
    - Anda sedang men-debug kunci API yang hilang di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan deployment
summary: Di mana OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-06-27T17:35:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw mengambil variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.
File `.env` ruang kerja adalah sumber dengan tingkat kepercayaan lebih rendah: OpenClaw mengabaikan kredensial penyedia dan kontrol runtime terlindungi dari `.env` ruang kerja sebelum menerapkan prioritas.

## Prioritas (tertinggi → terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (default dotenv; tidak menimpa; kredensial penyedia dan kontrol runtime terlindungi diabaikan).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; direkomendasikan untuk kunci API penyedia; tidak menimpa).
4. **Blok `env` konfigurasi** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor login-shell opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi belum ada.

Pada instalasi baru Ubuntu yang menggunakan direktori state default, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan mencetak peringatan.

Jika file konfigurasi sepenuhnya tidak ada, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Kredensial penyedia dan `.env` ruang kerja

Jangan simpan kunci API penyedia hanya di `.env` ruang kerja. OpenClaw mengabaikan variabel lingkungan kredensial penyedia dari file `.env` ruang kerja, termasuk kunci umum seperti `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, dan `FIRECRAWL_API_KEY`.

Gunakan salah satu sumber tepercaya ini untuk kredensial penyedia:

- Lingkungan proses Gateway, seperti shell, unit launchd/systemd, rahasia kontainer, atau rahasia CI.
- File dotenv runtime global di `~/.openclaw/.env` atau `$OPENCLAW_STATE_DIR/.env`.
- Blok `env` konfigurasi di `~/.openclaw/openclaw.json`.
- Impor login-shell opsional saat `env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1` diaktifkan.

Jika sebelumnya Anda menyimpan kunci penyedia hanya di `.env` ruang kerja, pindahkan ke salah satu sumber tepercaya di atas. `.env` ruang kerja masih dapat menyediakan variabel proyek biasa yang bukan kredensial, pengalihan endpoint, override host, atau kontrol runtime `OPENCLAW_*`.

Lihat [File `.env` ruang kerja](/id/gateway/security#workspace-env-files) untuk alasan keamanannya.

## Blok `env` konfigurasi

Dua cara setara untuk menetapkan env vars inline (keduanya tidak menimpa):

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

Blok `env` konfigurasi hanya menerima nilai string literal. Blok ini tidak memperluas
nilai `file:...`; misalnya, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
diteruskan ke penyedia sebagai string persis tersebut.

Untuk kunci penyedia berbasis file, gunakan SecretRef pada kolom kredensial yang
mendukungnya:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Lihat [Manajemen Rahasia](/id/gateway/secrets) dan
[Permukaan kredensial SecretRef](/id/reference/secretref-credential-surface) untuk
kolom yang didukung.

## Impor env shell

`env.shellEnv` menjalankan login shell Anda dan hanya mengimpor kunci yang diharapkan tetapi **belum ada**:

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

## Snapshot shell exec

Pada host Gateway non-Windows, perintah `exec` bash dan zsh menggunakan snapshot startup secara default.
Tetapkan `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` di lingkungan proses Gateway untuk menonaktifkan jalur ini.
Nilai `false`, `no`, dan `off` juga menonaktifkannya. Nilai `exec.env` per panggilan tidak dapat mengaktifkan/nonaktifkan
snapshot atau mengalihkan cache snapshot.

## Env vars yang disuntikkan runtime

OpenClaw juga menyuntikkan penanda konteks ke proses anak yang dibuat:

- `OPENCLAW_SHELL=exec`: ditetapkan untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: ditetapkan untuk pembuatan proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: ditetapkan untuk `openclaw acp client` saat membuat proses jembatan ACP.
- `OPENCLAW_SHELL=tui-local`: ditetapkan untuk perintah shell TUI lokal `!`.
- `OPENCLAW_CLI=1`: ditetapkan untuk proses anak yang dibuat oleh titik masuk CLI.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang wajib). Penanda ini dapat digunakan dalam logika shell/profil
untuk menerapkan aturan khusus konteks.

## Env vars UI

- `OPENCLAW_THEME=light`: paksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: paksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi env var dalam konfigurasi

Anda dapat merujuk env vars secara langsung dalam nilai string konfigurasi menggunakan sintaks `${VAR_NAME}`:

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
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk kolom yang mendukung referensi rahasia.

Keduanya diselesaikan dari env proses pada waktu aktivasi. Detail SecretRef didokumentasikan dalam [Manajemen Rahasia](/id/gateway/secrets).
Blok `env` konfigurasi itu sendiri tidak menyelesaikan SecretRefs atau nilai shorthand
`file:...`.

## Env vars terkait path

| Variabel                 | Tujuan                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Override direktori home yang digunakan untuk default path internal OpenClaw (`~/.openclaw/`, direktori agen, sesi, kredensial, onboarding installer, dan checkout dev default). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`     | Override direktori state (default `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Override path file konfigurasi (default `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Daftar path direktori tempat direktif `$include` dapat menyelesaikan file di luar direktori konfigurasi (default: tidak ada — `$include` dibatasi ke direktori konfigurasi). Tilde diperluas.                                                         |

## Logging

| Variabel                         | Tujuan                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Override level log untuk file dan konsol (mis. `debug`, `trace`). Diprioritaskan atas `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai tidak valid diabaikan dengan peringatan. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Mengeluarkan diagnostik timing permintaan/respons model yang tertarget pada level `info` tanpa mengaktifkan log debug global.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostik payload model: `summary`, `tools`, atau `full-redacted`. `full-redacted` dibatasi dan disunting tetapi mungkin menyertakan teks prompt/pesan.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostik streaming: `events` untuk timing awal/selesai, `peek` untuk menyertakan lima event SSE pertama yang disunting.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostik permukaan model mode kode, termasuk penyembunyian alat penyedia dan penegakan hanya exec/wait.                                                                                          |

### `OPENCLAW_HOME`

Saat ditetapkan, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk default path internal OpenClaw. Ini mencakup direktori state default, path konfigurasi, direktori agen, kredensial, ruang kerja onboarding installer, dan checkout dev default yang digunakan oleh `openclaw update --channel dev`.

**Prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback home Termux `PREFIX` di Android > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat ditetapkan ke path tilde (mis. `~/svc`), yang diperluas menggunakan rantai fallback home OS yang sama sebelum digunakan.

Variabel path eksplisit seperti `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, dan `OPENCLAW_GIT_DIR` tetap diprioritaskan. Tugas akun OS seperti deteksi file startup shell, setup package-manager, dan ekspansi host `~` masih dapat menggunakan home sistem yang sebenarnya.

## Pengguna nvm: kegagalan TLS web_fetch

Jika Node.js diinstal melalui **nvm** (bukan package manager sistem), `fetch()` bawaan menggunakan
penyimpanan CA bundel nvm, yang mungkin tidak memiliki CA root modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` di sebagian besar situs HTTPS.

Di Linux, OpenClaw otomatis mendeteksi nvm dan menerapkan perbaikan di lingkungan startup sebenarnya:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke lingkungan layanan systemd
- titik masuk CLI `openclaw` menjalankan ulang dirinya dengan `NODE_EXTRA_CA_CERTS` ditetapkan sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan mengandalkan penulisan hanya ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` saat startup proses.

## Variabel lingkungan legacy

OpenClaw hanya membaca variabel lingkungan `OPENCLAW_*`. Prefiks legacy
`CLAWDBOT_*` dan `MOLTBOT_*` dari rilis sebelumnya diabaikan secara diam-diam.

Jika ada yang masih ditetapkan pada proses Gateway saat startup, OpenClaw mengeluarkan
satu peringatan deprecation Node (`OPENCLAW_LEGACY_ENV_VARS`) yang mencantumkan
prefiks yang terdeteksi dan jumlah totalnya. Ganti nama setiap nilai dengan mengganti
prefiks legacy dengan `OPENCLAW_` (misalnya `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); nama lama tidak berpengaruh.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [FAQ: env vars dan pemuatan .env](/id/help/faq#env-vars-and-env-loading)
- [Ikhtisar model](/id/concepts/models)
