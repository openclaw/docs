---
read_when:
    - Anda perlu mengetahui var env mana yang dimuat, dan dalam urutan apa
    - Anda sedang men-debug kunci API yang hilang di Gateway
    - Anda sedang mendokumentasikan auth penyedia atau environment deployment
summary: Dari mana OpenClaw memuat variabel environment dan urutan prioritasnya
title: Variabel environment
x-i18n:
    generated_at: "2026-04-24T09:10:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw mengambil variabel environment dari beberapa sumber. Aturannya adalah **jangan pernah menimpa nilai yang sudah ada**.

## Prioritas (tertinggi → terendah)

1. **Environment proses** (apa yang sudah dimiliki proses Gateway dari shell/daemon induk).
2. **`.env` di direktori kerja saat ini** (default dotenv; tidak menimpa).
3. **`.env` global** di `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; tidak menimpa).
4. **Blok `env` config** di `~/.openclaw/openclaw.json` (diterapkan hanya jika belum ada).
5. **Impor login-shell opsional** (`env.shellEnv.enabled` atau `OPENCLAW_LOAD_SHELL_ENV=1`), diterapkan hanya untuk kunci yang diharapkan tetapi masih hilang.

Pada instalasi Ubuntu baru yang menggunakan direktori state default, OpenClaw juga memperlakukan `~/.config/openclaw/gateway.env` sebagai fallback kompatibilitas setelah `.env` global. Jika kedua file ada dan nilainya berbeda, OpenClaw mempertahankan `~/.openclaw/.env` dan mencetak peringatan.

Jika file config sama sekali tidak ada, langkah 4 dilewati; impor shell tetap berjalan jika diaktifkan.

## Blok `env` config

Dua cara setara untuk menyetel var env inline (keduanya tidak menimpa):

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

`env.shellEnv` menjalankan shell login Anda dan hanya mengimpor kunci yang **hilang**:

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

Padanan var env:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Var env yang disuntikkan saat runtime

OpenClaw juga menyuntikkan penanda konteks ke proses child yang dimunculkan:

- `OPENCLAW_SHELL=exec`: disetel untuk perintah yang dijalankan melalui alat `exec`.
- `OPENCLAW_SHELL=acp`: disetel untuk spawn proses backend runtime ACP (misalnya `acpx`).
- `OPENCLAW_SHELL=acp-client`: disetel untuk `openclaw acp client` saat memunculkan proses bridge ACP.
- `OPENCLAW_SHELL=tui-local`: disetel untuk perintah shell `!` TUI lokal.

Ini adalah penanda runtime (bukan config pengguna yang wajib). Penanda ini dapat digunakan dalam logika shell/profile
untuk menerapkan aturan khusus konteks.

## Var env UI

- `OPENCLAW_THEME=light`: paksa palet TUI terang saat terminal Anda memiliki latar belakang terang.
- `OPENCLAW_THEME=dark`: paksa palet TUI gelap.
- `COLORFGBG`: jika terminal Anda mengekspornya, OpenClaw menggunakan petunjuk warna latar belakang untuk memilih palet TUI secara otomatis.

## Substitusi var env dalam config

Anda dapat mereferensikan var env langsung dalam nilai string config menggunakan sintaks `${VAR_NAME}`:

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

Lihat [Configuration: Env var substitution](/id/gateway/configuration-reference#env-var-substitution) untuk detail lengkap.

## Ref secret vs string `${ENV}`

OpenClaw mendukung dua pola berbasis env:

- Substitusi string `${VAR}` dalam nilai config.
- Objek SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) untuk field yang mendukung referensi secret.

Keduanya diresolusikan dari env proses saat waktu aktivasi. Detail SecretRef didokumentasikan di [Secrets Management](/id/gateway/secrets).

## Var env terkait path

| Variable               | Purpose                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Override direktori home yang digunakan untuk semua resolusi path internal (`~/.openclaw/`, dir agen, sesi, kredensial). Berguna saat menjalankan OpenClaw sebagai pengguna layanan khusus. |
| `OPENCLAW_STATE_DIR`   | Override direktori state (default `~/.openclaw`).                                                                                                                                |
| `OPENCLAW_CONFIG_PATH` | Override path file config (default `~/.openclaw/openclaw.json`).                                                                                                                 |

## Logging

| Variable             | Purpose                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Override level log untuk file dan konsol (misalnya `debug`, `trace`). Didahulukan dibanding `logging.level` dan `logging.consoleLevel` di config. Nilai tidak valid diabaikan dengan peringatan. |

### `OPENCLAW_HOME`

Saat disetel, `OPENCLAW_HOME` menggantikan direktori home sistem (`$HOME` / `os.homedir()`) untuk semua resolusi path internal. Ini memungkinkan isolasi filesystem penuh untuk akun layanan headless.

**Prioritas:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Contoh** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` juga dapat disetel ke path tilde (misalnya `~/svc`), yang akan diekspansi menggunakan `$HOME` sebelum digunakan.

## Pengguna nvm: kegagalan TLS `web_fetch`

Jika Node.js diinstal melalui **nvm** (bukan pengelola paket sistem), `fetch()` bawaan menggunakan
CA store bawaan nvm, yang mungkin tidak memiliki CA root modern (ISRG Root X1/X2 untuk Let's Encrypt,
DigiCert Global Root G2, dll.). Ini menyebabkan `web_fetch` gagal dengan `"fetch failed"` di sebagian besar situs HTTPS.

Di Linux, OpenClaw secara otomatis mendeteksi nvm dan menerapkan perbaikan di environment startup yang sebenarnya:

- `openclaw gateway install` menulis `NODE_EXTRA_CA_CERTS` ke environment layanan systemd
- entrypoint CLI `openclaw` melakukan re-exec dirinya sendiri dengan `NODE_EXTRA_CA_CERTS` disetel sebelum startup Node

**Perbaikan manual (untuk versi lama atau peluncuran langsung `node ...`):**

Ekspor variabel tersebut sebelum memulai OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Jangan hanya mengandalkan penulisan ke `~/.openclaw/.env` untuk variabel ini; Node membaca
`NODE_EXTRA_CA_CERTS` saat startup proses.

## Terkait

- [Gateway configuration](/id/gateway/configuration)
- [FAQ: env vars and .env loading](/id/help/faq#env-vars-and-env-loading)
- [Models overview](/id/concepts/models)
