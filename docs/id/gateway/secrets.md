---
read_when:
    - Mengonfigurasi SecretRef untuk kredensial penyedia dan ref `auth-profiles.json`
    - Menjalankan reload, audit, konfigurasi, dan apply secret dengan aman di produksi
    - Memahami fail-fast saat startup, pemfilteran permukaan tidak aktif, dan perilaku last-known-good
summary: 'Manajemen secret: kontrak SecretRef, perilaku snapshot runtime, dan pembersihan satu arah yang aman'
title: Manajemen Secret
x-i18n:
    generated_at: "2026-04-05T13:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Manajemen secret

OpenClaw mendukung SecretRef aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai plaintext di konfigurasi.

Plaintext tetap berfungsi. SecretRef bersifat opt-in untuk setiap kredensial.

## Tujuan dan model runtime

Secret di-resolve ke dalam snapshot runtime di memori.

- Resolusi dilakukan secara eager selama aktivasi, bukan secara lazy di jalur permintaan.
- Startup gagal secara fail-fast ketika SecretRef yang efektif aktif tidak dapat di-resolve.
- Reload menggunakan atomic swap: berhasil sepenuhnya, atau mempertahankan snapshot last-known-good.
- Pelanggaran kebijakan SecretRef (misalnya profil auth mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum swap runtime.
- Permintaan runtime hanya membaca dari snapshot aktif di memori.
- Setelah aktivasi/load konfigurasi pertama yang berhasil, jalur kode runtime terus membaca snapshot aktif di memori tersebut sampai reload yang berhasil menukarnya.
- Jalur pengiriman outbound juga membaca dari snapshot aktif tersebut (misalnya pengiriman balasan/thread Discord dan pengiriman action Telegram); jalur ini tidak me-resolve ulang SecretRef pada setiap pengiriman.

Ini menjaga gangguan penyedia secret agar tidak masuk ke jalur permintaan yang panas.

## Pemfilteran permukaan aktif

SecretRef hanya divalidasi pada permukaan yang efektif aktif.

- Permukaan yang diaktifkan: ref yang tidak ter-resolve memblokir startup/reload.
- Permukaan tidak aktif: ref yang tidak ter-resolve tidak memblokir startup/reload.
- Ref yang tidak aktif mengeluarkan diagnostik non-fatal dengan kode `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Contoh permukaan yang tidak aktif:

- Entri channel/akun yang dinonaktifkan.
- Kredensial channel tingkat atas yang tidak diwarisi oleh akun aktif mana pun.
- Permukaan tool/fitur yang dinonaktifkan.
- Kunci khusus penyedia web search yang tidak dipilih oleh `tools.web.search.provider`.
  Dalam mode auto (provider tidak disetel), kunci dikonsultasikan berdasarkan prioritas untuk auto-detection penyedia sampai satu kunci berhasil di-resolve.
  Setelah pemilihan, kunci penyedia yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
- Materi auth SSH sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, ditambah override per-agent) hanya aktif
  ketika backend sandbox efektif adalah `ssh` untuk agen default atau agen yang diaktifkan.
- SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu dari kondisi berikut bernilai true:
  - `gateway.mode=remote`
  - `gateway.remote.url` dikonfigurasi
  - `gateway.tailscale.mode` adalah `serve` atau `funnel`
  - Dalam mode local tanpa permukaan remote tersebut:
    - `gateway.remote.token` aktif ketika auth token dapat menang dan tidak ada env/auth token yang dikonfigurasi.
    - `gateway.remote.password` aktif hanya ketika auth password dapat menang dan tidak ada env/auth password yang dikonfigurasi.
- SecretRef `gateway.auth.token` tidak aktif untuk resolusi auth saat startup ketika `OPENCLAW_GATEWAY_TOKEN` disetel, karena input token env menang untuk runtime tersebut.

## Diagnostik permukaan auth gateway

Ketika SecretRef dikonfigurasi pada `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, atau `gateway.remote.password`, startup/reload gateway mencatat
status permukaan secara eksplisit:

- `active`: SecretRef adalah bagian dari permukaan auth efektif dan harus berhasil di-resolve.
- `inactive`: SecretRef diabaikan untuk runtime ini karena permukaan auth lain menang, atau
  karena auth remote dinonaktifkan/tidak aktif.

Entri ini dicatat dengan `SECRETS_GATEWAY_AUTH_SURFACE` dan menyertakan alasan yang digunakan oleh
kebijakan permukaan aktif, sehingga Anda dapat melihat mengapa sebuah kredensial diperlakukan sebagai aktif atau tidak aktif.

## Preflight referensi onboarding

Saat onboarding berjalan dalam mode interaktif dan Anda memilih penyimpanan SecretRef, OpenClaw menjalankan validasi preflight sebelum menyimpan:

- Ref env: memvalidasi nama env var dan mengonfirmasi bahwa nilai non-kosong terlihat selama setup.
- Ref penyedia (`file` atau `exec`): memvalidasi pemilihan penyedia, me-resolve `id`, dan memeriksa tipe nilai yang telah di-resolve.
- Jalur penggunaan ulang quickstart: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding me-resolve-nya sebelum bootstrap probe/dashboard (untuk ref `env`, `file`, dan `exec`) menggunakan gate fail-fast yang sama.

Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

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
- Escape RFC6901 dalam segmen: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validasi:

- `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
- `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` tidak boleh mengandung `.` atau `..` sebagai segmen path yang dipisahkan slash (misalnya `a/../b` ditolak)

## Konfigurasi penyedia

Definisikan penyedia di bawah `secrets.providers`:

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

### Penyedia env

- Allowlist opsional melalui `allowlist`.
- Nilai env yang hilang/kosong menyebabkan resolusi gagal.

### Penyedia file

- Membaca file lokal dari `path`.
- `mode: "json"` mengharapkan payload objek JSON dan me-resolve `id` sebagai pointer.
- `mode: "singleValue"` mengharapkan id ref `"value"` dan mengembalikan isi file.
- Path harus lolos pemeriksaan kepemilikan/izin.
- Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk sebuah path, resolusi gagal. Hanya untuk path tepercaya, setel `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan path.

### Penyedia exec

- Menjalankan path biner absolut yang dikonfigurasi, tanpa shell.
- Secara default, `command` harus menunjuk ke file reguler (bukan symlink).
- Setel `allowSymlinkCommand: true` untuk mengizinkan path command symlink (misalnya shim Homebrew). OpenClaw memvalidasi path target yang telah di-resolve.
- Pasangkan `allowSymlinkCommand` dengan `trustedDirs` untuk path package manager (misalnya `["/opt/homebrew"]`).
- Mendukung timeout, timeout tanpa output, batas byte output, allowlist env, dan direktori tepercaya.
- Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk path command, resolusi gagal. Hanya untuk path tepercaya, setel `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan path.

Payload permintaan (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload respons (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Error opsional per-id:

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
        allowSymlinkCommand: true, // diperlukan untuk biner Homebrew bersymlink
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
        allowSymlinkCommand: true, // diperlukan untuk biner Homebrew bersymlink
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
        allowSymlinkCommand: true, // diperlukan untuk biner Homebrew bersymlink
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

Env var server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` mendukung SecretInput. Ini menjaga API key dan token tetap berada di luar konfigurasi plaintext:

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

Nilai string plaintext tetap berfungsi. Ref template env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef di-resolve selama aktivasi gateway sebelum proses server MCP dijalankan. Seperti permukaan SecretRef lainnya, ref yang tidak ter-resolve hanya memblokir aktivasi ketika plugin `acpx` efektif aktif.

## Materi auth SSH sandbox

Backend sandbox `ssh` inti juga mendukung SecretRef untuk materi auth SSH:

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
- Nilai yang telah di-resolve ditulis ke file sementara dengan izin ketat dan digunakan dalam konfigurasi SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh`, ref ini tetap tidak aktif dan tidak memblokir startup.

## Permukaan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum di:

- [Permukaan Kredensial SecretRef](/reference/secretref-credential-surface)

Kredensial yang dibuat runtime atau berotasi dan materi refresh OAuth sengaja dikecualikan dari resolusi SecretRef baca-saja.

## Perilaku yang diwajibkan dan prioritas

- Field tanpa ref: tidak berubah.
- Field dengan ref: wajib pada permukaan aktif selama aktivasi.
- Jika plaintext dan ref sama-sama ada, ref diprioritaskan pada jalur prioritas yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan konfigurasi internal dan ditolak sebagai data konfigurasi literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit ketika kredensial `auth-profiles.json` diprioritaskan dibanding ref `openclaw.json`)

Perilaku kompatibilitas Google Chat:

- `serviceAccountRef` diprioritaskan dibanding plaintext `serviceAccount`.
- Nilai plaintext diabaikan ketika ref sibling disetel.

## Pemicu aktivasi

Aktivasi secret berjalan pada:

- Startup (preflight ditambah aktivasi final)
- Jalur hot-apply reload konfigurasi
- Jalur restart-check reload konfigurasi
- Reload manual melalui `secrets.reload`
- Preflight RPC penulisan konfigurasi gateway (`config.set` / `config.apply` / `config.patch`) untuk resolvabilitas SecretRef permukaan aktif di dalam payload konfigurasi yang dikirimkan sebelum edit dipersistenkan

Kontrak aktivasi:

- Keberhasilan menukar snapshot secara atomik.
- Kegagalan startup membatalkan startup gateway.
- Kegagalan reload runtime mempertahankan snapshot last-known-good.
- Kegagalan preflight write-RPC menolak konfigurasi yang dikirimkan dan menjaga konfigurasi di disk serta snapshot runtime aktif tetap tidak berubah.
- Memberikan token channel per-panggilan yang eksplisit ke panggilan helper/tool outbound tidak memicu aktivasi SecretRef; titik aktivasi tetap startup, reload, dan `secrets.reload` eksplisit.

## Sinyal degraded dan recovered

Ketika aktivasi saat reload gagal setelah keadaan sehat, OpenClaw masuk ke status secret degraded.

Event sistem sekali-kirim dan kode log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Degraded: runtime mempertahankan snapshot last-known-good.
- Recovered: dipancarkan sekali setelah aktivasi berhasil berikutnya.
- Kegagalan berulang saat sudah degraded mencatat peringatan tetapi tidak membanjiri event.
- Fail-fast saat startup tidak memancarkan event degraded karena runtime tidak pernah menjadi aktif.

## Resolusi jalur command

Jalur command dapat memilih resolusi SecretRef yang didukung melalui RPC snapshot gateway.

Ada dua perilaku umum:

- Jalur command ketat (misalnya jalur remote-memory `openclaw memory` dan `openclaw qr --remote` ketika membutuhkan ref shared-secret remote) membaca dari snapshot aktif dan gagal secara fail-fast ketika SecretRef yang dibutuhkan tidak tersedia.
- Jalur command baca-saja (misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, dan alur doctor/perbaikan konfigurasi baca-saja) juga memprioritaskan snapshot aktif, tetapi mengalami degradasi alih-alih membatalkan ketika SecretRef yang ditargetkan tidak tersedia di jalur command tersebut.

Perilaku baca-saja:

- Ketika gateway berjalan, command ini terlebih dahulu membaca dari snapshot aktif.
- Jika resolusi gateway tidak lengkap atau gateway tidak tersedia, command mencoba fallback lokal yang ditargetkan untuk permukaan command tertentu.
- Jika SecretRef yang ditargetkan tetap tidak tersedia, command melanjutkan dengan output baca-saja yang terdegradasi dan diagnostik eksplisit seperti “dikonfigurasi tetapi tidak tersedia di jalur command ini”.
- Perilaku terdegradasi ini hanya berlaku lokal pada command. Ini tidak melemahkan jalur startup, reload, atau kirim/auth runtime.

Catatan lain:

- Refresh snapshot setelah rotasi secret backend ditangani oleh `openclaw secrets reload`.
- Metode RPC gateway yang digunakan oleh jalur command ini: `secrets.resolve`.

## Alur kerja audit dan konfigurasi

Alur operator default:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Temuan meliputi:

- nilai plaintext saat tersimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan)
- residu header penyedia sensitif plaintext pada entri `models.json` yang dihasilkan
- ref yang tidak ter-resolve
- precedence shadowing (`auth-profiles.json` diprioritaskan atas ref `openclaw.json`)
- residu lama (`auth.json`, pengingat OAuth)

Catatan exec:

- Secara default, audit melewati pemeriksaan resolvabilitas SecretRef exec untuk menghindari efek samping command.
- Gunakan `openclaw secrets audit --allow-exec` untuk mengeksekusi penyedia exec selama audit.

Catatan residu header:

- Deteksi header penyedia sensitif didasarkan pada heuristik nama (nama dan fragmen header auth/kredensial umum seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

### `secrets configure`

Helper interaktif yang:

- mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus)
- memungkinkan Anda memilih field pembawa secret yang didukung di `openclaw.json` ditambah `auth-profiles.json` untuk satu cakupan agen
- dapat membuat pemetaan `auth-profiles.json` baru langsung di pemilih target
- menangkap detail SecretRef (`source`, `provider`, `id`)
- menjalankan resolusi preflight
- dapat langsung menerapkan

Catatan exec:

- Preflight melewati pemeriksaan SecretRef exec kecuali `--allow-exec` disetel.
- Jika Anda menerapkan langsung dari `configure --apply` dan rencana mencakup ref/penyedia exec, biarkan `--allow-exec` tetap disetel untuk langkah apply juga.

Mode yang membantu:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Default apply `configure`:

- membersihkan kredensial statis yang cocok dari `auth-profiles.json` untuk penyedia yang ditargetkan
- membersihkan entri statis `api_key` lama dari `auth.json`
- membersihkan baris secret yang diketahui dan cocok dari `<config-dir>/.env`

### `secrets apply`

Menerapkan rencana yang disimpan:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Catatan exec:

- dry-run melewati pemeriksaan exec kecuali `--allow-exec` disetel.
- mode tulis menolak rencana yang berisi SecretRef/penyedia exec kecuali `--allow-exec` disetel.

Untuk detail kontrak target/path yang ketat dan aturan penolakan yang tepat, lihat:

- [Kontrak Rencana Apply Secret](/id/gateway/secrets-plan-contract)

## Kebijakan keamanan satu arah

OpenClaw sengaja tidak menulis backup rollback yang berisi nilai secret plaintext historis.

Model keamanan:

- preflight harus berhasil sebelum mode tulis
- aktivasi runtime divalidasi sebelum commit
- apply memperbarui file menggunakan penggantian file atomik dan restore upaya-terbaik saat gagal

## Catatan kompatibilitas auth lama

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan auth lama berbentuk plaintext.

- Sumber kredensial runtime adalah snapshot di memori yang telah di-resolve.
- Entri statis `api_key` lama dibersihkan saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan Web UI

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada mode formulir.

## Dokumen terkait

- Command CLI: [secrets](/cli/secrets)
- Detail kontrak rencana: [Kontrak Rencana Apply Secret](/id/gateway/secrets-plan-contract)
- Permukaan kredensial: [Permukaan Kredensial SecretRef](/reference/secretref-credential-surface)
- Setup auth: [Autentikasi](/id/gateway/authentication)
- Postur keamanan: [Keamanan](/gateway/security)
- Prioritas lingkungan: [Variabel Lingkungan](/help/environment)
