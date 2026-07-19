---
read_when:
    - Anda perlu mengetahui variabel lingkungan mana yang dimuat dan dalam urutan apa
    - Anda sedang men-debug kunci API yang tidak ditemukan di Gateway
    - Anda sedang mendokumentasikan autentikasi penyedia atau lingkungan deployment
summary: Tempat OpenClaw memuat variabel lingkungan dan urutan prioritasnya
title: Variabel lingkungan
x-i18n:
    generated_at: "2026-07-19T04:58:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9f9fdd67ee148931af2e15a12917871a0b85f80f763f0df3a978b7fd39b93eff
    source_path: help/environment.md
    workflow: 16
---

OpenClaw mengambil variabel lingkungan dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.
File `.env` ruang kerja merupakan sumber dengan tingkat kepercayaan lebih rendah: OpenClaw mengabaikan kredensial penyedia dan kontrol runtime yang dilindungi dari `.env` ruang kerja sebelum menerapkan urutan prioritas.

## Urutan prioritas (tertinggi ke terendah)

1. **Lingkungan proses** (yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (dotenv bawaan; tidak menimpa; kredensial penyedia dan kontrol runtime yang dilindungi diabaikan).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; disarankan untuk kunci API penyedia; tidak menimpa).
4. **Blok konfigurasi `env`** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor shell login opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi belum ada.

Pada instalasi Ubuntu baru yang menggunakan direktori status bawaan, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan nilainya berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan menampilkan peringatan.

Jika file konfigurasi tidak ada sama sekali, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Kredensial penyedia dan `.env` ruang kerja

Jangan menyimpan kunci API penyedia hanya dalam `.env` ruang kerja. OpenClaw memblokir sejumlah besar kunci kredensial penyedia dan pengalihan endpoint dari file `.env` ruang kerja, termasuk setiap variabel lingkungan autentikasi penyedia yang diketahui (misalnya `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), serta setiap kunci yang berakhiran `_API_HOST`, `_BASE_URL`, `_ENDPOINT`, atau `_HOMESERVER`, dan seluruh namespace `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*`, dan `OPENAI_API_KEY_*`.

Sebagai gantinya, gunakan salah satu sumber tepercaya berikut untuk kredensial penyedia:

- Lingkungan proses Gateway, seperti shell, unit launchd/systemd, rahasia kontainer, atau rahasia CI.
- File dotenv runtime global di `~/.openclaw/.env` atau `$OPENCLAW_STATE_DIR/.env`.
- Blok konfigurasi `env` di `~/.openclaw/openclaw.json`.
- Impor shell login opsional ketika `env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1` diaktifkan.

Jika sebelumnya Anda menyimpan kunci penyedia atau nilai perutean endpoint hanya dalam `.env` ruang kerja, pindahkan ke salah satu sumber tepercaya di atas. `.env` ruang kerja tetap dapat menyediakan variabel proyek biasa yang bukan kredensial, pengalihan endpoint, penggantian host, atau kontrol runtime `OPENCLAW_*`.

Lihat [File `.env` ruang kerja](/id/gateway/security#workspace-env-files) untuk alasan keamanannya.

## Blok konfigurasi `env`

Dua cara yang setara untuk menetapkan variabel lingkungan sebaris (keduanya tidak menimpa):

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

Blok konfigurasi `env` hanya menerima nilai string literal. Blok ini tidak mengembangkan
nilai `file:...`; misalnya, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
diteruskan ke penyedia sebagai string yang persis sama.

Untuk kunci penyedia berbasis file, gunakan SecretRef pada bidang kredensial yang
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

Lihat [Pengelolaan Rahasia](/id/gateway/secrets) dan
[permukaan kredensial SecretRef](/id/reference/secretref-credential-surface) untuk
bidang yang didukung.

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

Variabel lingkungan yang setara:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (bawaan `15000`)

## Snapshot shell eksekusi

Pada host Gateway non-Windows, perintah `exec` bash dan zsh menggunakan snapshot awal secara bawaan.
Tetapkan `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dalam lingkungan proses Gateway untuk menonaktifkan jalur ini.
Nilai `false`, `no`, dan `off` juga menonaktifkannya. Nilai `exec.env` per panggilan tidak dapat mengaktifkan atau menonaktifkan
snapshot maupun mengalihkan cache snapshot.

## Variabel lingkungan yang diinjeksi saat runtime

OpenClaw juga menginjeksi penanda konteks ke dalam proses anak yang dibuat:

- `OPENCLAW_SHELL=exec`: ditetapkan untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp-client`: ditetapkan untuk `openclaw acp client` saat membuat proses jembatan ACP.
- `OPENCLAW_SHELL=tui-local`: ditetapkan untuk perintah shell `!` TUI lokal.
- `OPENCLAW_CLI=1`: ditetapkan untuk proses anak yang dibuat oleh titik masuk CLI.

Ini adalah penanda runtime (bukan konfigurasi pengguna yang diwajibkan). Penanda ini dapat digunakan dalam logika shell/profil
untuk menerapkan aturan khusus konteks.

## Variabel lingkungan UI

- `OPENCLAW_THEME=light`: memaksakan palet TUI terang ketika terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: memaksakan palet TUI gelap.
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

Lihat [Konfigurasi: Substitusi variabel lingkungan](/id/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Referensi rahasia vs string `${ENV}`

OpenClaw mendukung dua pola berbasis lingkungan:

- Substitusi string `${VAR}` dalam nilai konfigurasi.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk bidang yang mendukung referensi rahasia.

Keduanya diselesaikan dari lingkungan proses pada waktu aktivasi. Detail SecretRef didokumentasikan dalam [Pengelolaan Rahasia](/id/gateway/secrets).
Blok konfigurasi `env` itu sendiri tidak menyelesaikan SecretRef atau nilai singkat
`file:...`.

## Variabel lingkungan terkait jalur

| Variabel                 | Tujuan                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Mengganti direktori utama yang digunakan untuk nilai bawaan jalur internal OpenClaw (`~/.openclaw/`, direktori agen, sesi, kredensial, orientasi awal penginstal, dan checkout pengembangan bawaan). Berguna ketika menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`     | Mengganti direktori status (bawaan `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Mengganti jalur file konfigurasi (bawaan `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Daftar jalur direktori tempat direktif `$include` dapat menyelesaikan file di luar direktori konfigurasi (bawaan: tidak ada - `$include` dibatasi pada direktori konfigurasi). Tilde diperluas.                                                         |

## Unduhan alat bantu agen

Tetapkan `OPENCLAW_OFFLINE=1` untuk mencegah OpenClaw mengunduh biner alat bantu `fd`
dan `ripgrep` yang versinya telah dipatok. Alat bantu yang sudah ada dalam direktori alat OpenClaw
dan biner sistem yang berfungsi tetap dapat digunakan; alat bantu yang tidak ada tetap
tidak tersedia alih-alih memicu permintaan jaringan.

## Pencatatan log

| Variabel                         | Tujuan                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Mengganti tingkat log untuk file dan konsol (misalnya `debug`, `trace`). Lebih diprioritaskan daripada `logging.level` dan `logging.consoleLevel` dalam konfigurasi. Nilai yang tidak valid diabaikan disertai peringatan. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Menghasilkan diagnostik waktu permintaan/respons model yang ditargetkan pada tingkat `info` tanpa mengaktifkan log debug global.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostik muatan model: `summary`, `tools`, atau `full-redacted`. `full-redacted` dibatasi dan disamarkan, tetapi mungkin menyertakan teks prompt/pesan.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostik streaming: `events` untuk waktu pertama/selesai, `peek` untuk menyertakan lima peristiwa SSE pertama yang telah disamarkan.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostik permukaan model mode kode, termasuk penyembunyian alat penyedia dan penerapan langsung/kontrol ringkas.                                                                                  |

### `OPENCLAW_HOME`

Saat ditetapkan, `OPENCLAW_HOME` menggantikan direktori utama sistem (`$HOME` / `os.homedir()`) untuk nilai bawaan jalur internal OpenClaw. Ini mencakup direktori status bawaan, jalur konfigurasi, direktori agen, kredensial, ruang kerja orientasi awal penginstal, dan checkout pengembangan bawaan yang digunakan oleh `openclaw update --channel dev`.

**Urutan prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback direktori utama `PREFIX` Termux di Android > `os.homedir()`

**Contoh** (LaunchDaemon macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat ditetapkan ke jalur tilde (misalnya `~/svc`), yang diperluas menggunakan rantai fallback direktori utama OS yang sama sebelum digunakan.

Variabel jalur eksplisit seperti `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, dan `OPENCLAW_GIT_DIR` tetap lebih diprioritaskan. Tugas akun OS seperti deteksi file awal shell, penyiapan pengelola paket, dan perluasan `~` host mungkin masih menggunakan direktori utama sistem yang sebenarnya.

## Pengguna nvm: kegagalan TLS web_fetch

Jika Node.js diinstal melalui **nvm** (bukan pengelola paket sistem), `fetch()` bawaan menggunakan
penyimpanan CA bawaan nvm, yang mungkin tidak memiliki CA root modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dan sebagainya). Hal ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` pada sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikan dalam lingkungan awal yang sebenarnya:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke dalam lingkungan layanan systemd
- titik masuk CLI `openclaw` mengeksekusi ulang dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` ditetapkan sebelum Node dimulai

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan mengandalkan penulisan hanya ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` saat proses dimulai.

## Variabel lingkungan lama

OpenClaw hanya membaca variabel lingkungan `OPENCLAW_*`. Awalan lama
`CLAWDBOT_*` dan `MOLTBOT_*` dari rilis sebelumnya secara diam-diam
diabaikan.

Jika salah satunya masih ditetapkan pada proses Gateway saat dimulai, OpenClaw mengeluarkan
satu peringatan penghentian penggunaan Node (`OPENCLAW_LEGACY_ENV_VARS`) yang mencantumkan
awalan yang terdeteksi dan jumlah totalnya. Ganti nama setiap nilai dengan mengganti
awalan lama dengan `OPENCLAW_` (misalnya `CLAWDBOT_GATEWAY_TOKEN` menjadi
`OPENCLAW_GATEWAY_TOKEN`); nama lama tidak berpengaruh.

## Terkait

- [Konfigurasi Gateway](/id/gateway/configuration)
- [Tanya Jawab Umum: variabel lingkungan dan pemuatan .env](/id/help/faq#env-vars-and-env-loading)
- [Ikhtisar model](/id/concepts/models)
