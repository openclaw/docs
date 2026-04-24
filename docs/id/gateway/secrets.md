---
read_when:
    - Mengonfigurasi SecretRef untuk kredensial provider dan ref `auth-profiles.json`
    - Mengoperasikan reload, audit, configure, dan apply Secrets dengan aman di produksi
    - Memahami fail-fast saat startup, pemfilteran surface tidak aktif, dan perilaku last-known-good
summary: 'Pengelolaan Secrets: kontrak SecretRef, perilaku snapshot runtime, dan scrub satu arah yang aman'
title: Pengelolaan Secrets
x-i18n:
    generated_at: "2026-04-24T09:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw mendukung SecretRef aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai plaintext di konfigurasi.

Plaintext tetap berfungsi. SecretRef bersifat opt-in per kredensial.

## Tujuan dan model runtime

Secrets di-resolve ke dalam snapshot runtime di memori.

- Resolusi dilakukan secara eager selama aktivasi, bukan lazy di jalur permintaan.
- Startup gagal cepat ketika SecretRef yang efektif aktif tidak dapat di-resolve.
- Reload menggunakan pertukaran atomik: sukses penuh, atau pertahankan snapshot last-known-good.
- Pelanggaran kebijakan SecretRef (misalnya auth profile mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca dari snapshot aktif di memori.
- Setelah aktivasi/pemuatan config pertama yang berhasil, jalur kode runtime terus membaca snapshot aktif di memori itu sampai reload yang berhasil menukarnya.
- Jalur pengiriman keluar juga membaca dari snapshot aktif tersebut (misalnya pengiriman balasan/thread Discord dan pengiriman action Telegram); jalur ini tidak me-resolve ulang SecretRef pada setiap pengiriman.

Ini menjaga outage provider secret tetap di luar jalur permintaan panas.

## Pemfilteran surface aktif

SecretRef hanya divalidasi pada surface yang efektif aktif.

- Surface aktif: ref yang tidak ter-resolve memblokir startup/reload.
- Surface tidak aktif: ref yang tidak ter-resolve tidak memblokir startup/reload.
- Ref tidak aktif mengeluarkan diagnostik non-fatal dengan kode `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Contoh surface tidak aktif:

- Entri channel/akun yang dinonaktifkan.
- Kredensial channel tingkat atas yang tidak diwarisi akun aktif mana pun.
- Surface alat/fitur yang dinonaktifkan.
- Kunci web search khusus provider yang tidak dipilih oleh `tools.web.search.provider`.
  Dalam mode auto (provider tidak diatur), kunci diperiksa berdasarkan prioritas untuk auto-detection provider sampai salah satunya ter-resolve.
  Setelah pemilihan, kunci provider yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
- Materi autentikasi SSH sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, plus override per agen) aktif hanya
  ketika backend sandbox efektif adalah `ssh` untuk agen default atau agen yang aktif.
- SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu dari ini benar:
  - `gateway.mode=remote`
  - `gateway.remote.url` dikonfigurasi
  - `gateway.tailscale.mode` adalah `serve` atau `funnel`
  - Dalam mode lokal tanpa surface remote tersebut:
    - `gateway.remote.token` aktif ketika autentikasi token dapat menang dan tidak ada token env/auth yang dikonfigurasi.
    - `gateway.remote.password` aktif hanya ketika autentikasi password dapat menang dan tidak ada password env/auth yang dikonfigurasi.
- SecretRef `gateway.auth.token` tidak aktif untuk resolusi autentikasi startup ketika `OPENCLAW_GATEWAY_TOKEN` diatur, karena input token env menang untuk runtime tersebut.

## Diagnostik surface autentikasi Gateway

Ketika SecretRef dikonfigurasi pada `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, atau `gateway.remote.password`, log startup/reload gateway mencatat
status surface secara eksplisit:

- `active`: SecretRef adalah bagian dari surface autentikasi efektif dan harus di-resolve.
- `inactive`: SecretRef diabaikan untuk runtime ini karena surface autentikasi lain menang, atau
  karena autentikasi remote dinonaktifkan/tidak aktif.

Entri ini dicatat dengan `SECRETS_GATEWAY_AUTH_SURFACE` dan menyertakan alasan yang digunakan oleh
kebijakan surface aktif, sehingga Anda dapat melihat mengapa sebuah kredensial diperlakukan sebagai aktif atau tidak aktif.

## Preflight referensi onboarding

Saat onboarding berjalan dalam mode interaktif dan Anda memilih penyimpanan SecretRef, OpenClaw menjalankan validasi preflight sebelum menyimpan:

- Ref env: memvalidasi nama env var dan memastikan nilai non-kosong terlihat selama penyiapan.
- Ref provider (`file` atau `exec`): memvalidasi pemilihan provider, me-resolve `id`, dan memeriksa tipe nilai yang di-resolve.
- Jalur penggunaan ulang quickstart: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding me-resolve-nya sebelum bootstrap probe/dashboard (untuk ref `env`, `file`, dan `exec`) menggunakan gate fail-fast yang sama.

Jika validasi gagal, onboarding menampilkan error dan membiarkan Anda mencoba lagi.

## Kontrak SecretRef

Gunakan satu bentuk objek di mana pun:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validasi:

- `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
- `id` harus cocok dengan `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validasi:

- `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
- `id` harus berupa pointer JSON absolut (`/...`)
- Escaping RFC6901 dalam segmen: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validasi:

- `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
- `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` tidak boleh berisi `.` atau `..` sebagai segmen path yang dipisahkan slash (misalnya `a/../b` ditolak)

## Config provider

Definisikan provider di bawah `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // atau "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Provider env

- Allowlist opsional melalui `allowlist`.
- Nilai env yang hilang/kosong menggagalkan resolusi.

### Provider file

- Membaca file lokal dari `path`.
- `mode: "json"` mengharapkan payload objek JSON dan me-resolve `id` sebagai pointer.
- `mode: "singleValue"` mengharapkan id ref `"value"` dan mengembalikan isi file.
- Path harus lolos pemeriksaan kepemilikan/izin.
- Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk sebuah path, resolusi gagal. Hanya untuk path tepercaya, atur `allowInsecurePath: true` pada provider tersebut untuk melewati pemeriksaan keamanan path.

### Provider exec

- Menjalankan path biner absolut yang dikonfigurasi, tanpa shell.
- Secara default, `command` harus menunjuk ke file biasa (bukan symlink).
- Atur `allowSymlinkCommand: true` untuk mengizinkan path perintah symlink (misalnya shim Homebrew). OpenClaw memvalidasi path target yang di-resolve.
- Pasangkan `allowSymlinkCommand` dengan `trustedDirs` untuk path package-manager (misalnya `["/opt/homebrew"]`).
- Mendukung timeout, timeout tanpa output, batas byte output, allowlist env, dan trusted dir.
- Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk path perintah, resolusi gagal. Hanya untuk path tepercaya, atur `allowInsecurePath: true` pada provider tersebut untuk melewati pemeriksaan keamanan path.

Payload permintaan (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload respons (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Error opsional per id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Contoh integrasi exec

### CLI 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // diperlukan untuk biner symlink Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### CLI HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // diperlukan untuk biner symlink Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // diperlukan untuk biner symlink Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Variabel lingkungan server MCP

Env var server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` mendukung SecretInput. Ini menjaga API key dan token tetap di luar config plaintext:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Nilai string plaintext tetap berfungsi. Ref template env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef di-resolve selama aktivasi gateway sebelum proses server MCP di-spawn. Seperti surface SecretRef lainnya, ref yang tidak ter-resolve hanya memblokir aktivasi ketika plugin `acpx` efektif aktif.

## Materi autentikasi SSH sandbox

Backend sandbox inti `ssh` juga mendukung SecretRef untuk materi autentikasi SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Perilaku runtime:

- OpenClaw me-resolve ref ini selama aktivasi sandbox, bukan secara lazy selama setiap panggilan SSH.
- Nilai yang di-resolve ditulis ke file temp dengan izin ketat dan digunakan dalam config SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh`, ref ini tetap tidak aktif dan tidak memblokir startup.

## Surface kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum di:

- [Surface Kredensial SecretRef](/id/reference/secretref-credential-surface)

Kredensial yang dicetak runtime atau berotasi dan materi refresh OAuth sengaja dikecualikan dari resolusi SecretRef read-only.

## Perilaku dan prioritas yang diwajibkan

- Bidang tanpa ref: tidak berubah.
- Bidang dengan ref: wajib pada surface aktif selama aktivasi.
- Jika plaintext dan ref sama-sama ada, ref diprioritaskan pada jalur prioritas yang didukung.
- Sentinel penyamaran `__OPENCLAW_REDACTED__` dicadangkan untuk penyamaran/pemulihan config internal dan ditolak sebagai data config literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit saat kredensial `auth-profiles.json` didahulukan dibanding ref `openclaw.json`)

Perilaku kompatibilitas Google Chat:

- `serviceAccountRef` didahulukan dibanding plaintext `serviceAccount`.
- Nilai plaintext diabaikan saat ref sibling diatur.

## Pemicu aktivasi

Aktivasi secret berjalan pada:

- Startup (preflight plus aktivasi final)
- Jalur hot-apply reload config
- Jalur restart-check reload config
- Reload manual melalui `secrets.reload`
- Preflight RPC penulisan config Gateway (`config.set` / `config.apply` / `config.patch`) untuk kemampuan resolve SecretRef pada surface aktif di dalam payload config yang dikirim sebelum edit dipersist

Kontrak aktivasi:

- Keberhasilan menukar snapshot secara atomik.
- Kegagalan startup membatalkan startup gateway.
- Kegagalan reload runtime mempertahankan snapshot last-known-good.
- Kegagalan preflight write-RPC menolak config yang dikirim dan membiarkan config di disk serta snapshot runtime aktif tetap tidak berubah.
- Memberikan token channel eksplisit per-panggilan ke helper/tool call outbound tidak memicu aktivasi SecretRef; titik aktivasi tetap startup, reload, dan `secrets.reload` eksplisit.

## Sinyal degraded dan recovered

Ketika aktivasi saat reload gagal setelah status sehat, OpenClaw masuk ke status secrets degraded.

System event satu kali dan kode log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Degraded: runtime mempertahankan snapshot last-known-good.
- Recovered: dipancarkan sekali setelah aktivasi berhasil berikutnya.
- Kegagalan berulang saat sudah degraded mencatat peringatan tetapi tidak membanjiri event.
- Fail-fast startup tidak memancarkan event degraded karena runtime tidak pernah menjadi aktif.

## Resolusi path perintah

Path perintah dapat ikut serta dalam resolusi SecretRef yang didukung melalui RPC snapshot gateway.

Ada dua perilaku luas:

- Path perintah ketat (misalnya path remote-memory `openclaw memory` dan `openclaw qr --remote` saat membutuhkan ref shared-secret remote) membaca dari snapshot aktif dan gagal cepat saat SecretRef yang diperlukan tidak tersedia.
- Path perintah read-only (misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, serta alur doctor/perbaikan config read-only) juga mengutamakan snapshot aktif, tetapi mengalami degradasi alih-alih membatalkan saat SecretRef target tidak tersedia di path perintah tersebut.

Perilaku read-only:

- Saat gateway berjalan, perintah-perintah ini membaca dari snapshot aktif terlebih dahulu.
- Jika resolusi gateway tidak lengkap atau gateway tidak tersedia, perintah mencoba fallback lokal tertarget untuk surface perintah tertentu.
- Jika SecretRef target tetap tidak tersedia, perintah berlanjut dengan output read-only degraded dan diagnostik eksplisit seperti “configured but unavailable in this command path”.
- Perilaku degraded ini hanya lokal pada perintah. Ini tidak melemahkan jalur startup, reload, atau send/auth runtime.

Catatan lain:

- Penyegaran snapshot setelah rotasi secret backend ditangani oleh `openclaw secrets reload`.
- Method RPC Gateway yang digunakan oleh path perintah ini: `secrets.resolve`.

## Alur kerja audit dan configure

Alur operator default:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Temuan mencakup:

- nilai plaintext saat diam (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan)
- residu header provider sensitif plaintext dalam entri `models.json` yang dihasilkan
- ref yang tidak ter-resolve
- shadowing prioritas (`auth-profiles.json` mengambil prioritas atas ref `openclaw.json`)
- residu lama (`auth.json`, pengingat OAuth)

Catatan exec:

- Secara default, audit melewati pemeriksaan kemampuan resolve SecretRef exec untuk menghindari side effect perintah.
- Gunakan `openclaw secrets audit --allow-exec` untuk mengeksekusi provider exec selama audit.

Catatan residu header:

- Deteksi header provider sensitif berbasis heuristik nama (nama header autentikasi/kredensial umum dan fragmen seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

### `secrets configure`

Helper interaktif yang:

- mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus)
- memungkinkan Anda memilih bidang yang didukung dan membawa secret di `openclaw.json` plus `auth-profiles.json` untuk satu cakupan agen
- dapat membuat pemetaan `auth-profiles.json` baru langsung di pemilih target
- menangkap detail SecretRef (`source`, `provider`, `id`)
- menjalankan resolusi preflight
- dapat langsung menerapkan

Catatan exec:

- Preflight melewati pemeriksaan SecretRef exec kecuali `--allow-exec` diatur.
- Jika Anda menerapkan langsung dari `configure --apply` dan rencana mencakup ref/provider exec, pertahankan `--allow-exec` untuk langkah apply juga.

Mode yang berguna:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Default apply `configure`:

- scrub kredensial statis yang cocok dari `auth-profiles.json` untuk provider yang ditargetkan
- scrub entri `api_key` statis lama dari `auth.json`
- scrub baris secret yang dikenal dan cocok dari `<config-dir>/.env`

### `secrets apply`

Terapkan rencana yang disimpan:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Catatan exec:

- dry-run melewati pemeriksaan exec kecuali `--allow-exec` diatur.
- mode tulis menolak rencana yang berisi SecretRef/provider exec kecuali `--allow-exec` diatur.

Untuk detail kontrak target/path yang ketat dan aturan penolakan yang persis, lihat:

- [Kontrak Rencana Apply Secrets](/id/gateway/secrets-plan-contract)

## Kebijakan keamanan satu arah

OpenClaw sengaja tidak menulis backup rollback yang berisi nilai secret plaintext historis.

Model keamanan:

- preflight harus berhasil sebelum mode tulis
- aktivasi runtime divalidasi sebelum commit
- apply memperbarui file menggunakan penggantian file atomik dan pemulihan best-effort saat gagal

## Catatan kompatibilitas autentikasi lama

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan autentikasi lama plaintext.

- Sumber kredensial runtime adalah snapshot di memori yang telah di-resolve.
- Entri `api_key` statis lama di-scrub saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan Web UI

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada mode formulir.

## Dokumen terkait

- Perintah CLI: [secrets](/id/cli/secrets)
- Detail kontrak rencana: [Kontrak Rencana Apply Secrets](/id/gateway/secrets-plan-contract)
- Surface kredensial: [Surface Kredensial SecretRef](/id/reference/secretref-credential-surface)
- Penyiapan autentikasi: [Authentication](/id/gateway/authentication)
- Postur keamanan: [Security](/id/gateway/security)
- Prioritas environment: [Variabel Lingkungan](/id/help/environment)
