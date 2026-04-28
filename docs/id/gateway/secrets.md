---
read_when:
    - Mengonfigurasi SecretRef untuk kredensial provider dan referensi `auth-profiles.json`
    - Mengoperasikan reload, audit, configure, dan apply secret dengan aman di produksi
    - Memahami fail-fast saat startup, pemfilteran permukaan tidak aktif, dan perilaku last-known-good
sidebarTitle: Secrets management
summary: 'Manajemen secret: kontrak SecretRef, perilaku snapshot runtime, dan scrubbing satu arah yang aman'
title: Secrets Management
x-i18n:
    generated_at: "2026-04-26T11:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw mendukung SecretRef aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai plaintext di konfigurasi.

<Note>
Plaintext tetap berfungsi. SecretRef bersifat opt-in per kredensial.
</Note>

## Tujuan dan model runtime

Secret di-resolve ke snapshot runtime dalam memori.

- Resolusi bersifat eager saat aktivasi, bukan lazy pada jalur permintaan.
- Startup gagal cepat saat SecretRef yang aktif secara efektif tidak dapat di-resolve.
- Reload menggunakan atomic swap: sukses sepenuhnya, atau pertahankan snapshot last-known-good.
- Pelanggaran kebijakan SecretRef (misalnya auth profile mode OAuth yang digabung dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca dari snapshot aktif dalam memori.
- Setelah aktivasi/load konfigurasi pertama yang berhasil, jalur kode runtime terus membaca snapshot aktif dalam memori tersebut sampai reload yang berhasil menukarnya.
- Jalur pengiriman keluar juga membaca dari snapshot aktif tersebut (misalnya pengiriman balasan/thread Discord dan pengiriman action Telegram); jalur ini tidak me-resolve ulang SecretRef pada setiap pengiriman.

Ini menjaga outage provider secret tetap di luar jalur permintaan panas.

## Pemfilteran permukaan aktif

SecretRef divalidasi hanya pada permukaan yang aktif secara efektif.

- Permukaan aktif: referensi yang tidak ter-resolve memblokir startup/reload.
- Permukaan tidak aktif: referensi yang tidak ter-resolve tidak memblokir startup/reload.
- Referensi tidak aktif mengeluarkan diagnostik non-fatal dengan kode `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Contoh permukaan tidak aktif">
    - Entri channel/akun yang dinonaktifkan.
    - Kredensial channel tingkat atas yang tidak diwarisi oleh akun aktif mana pun.
    - Permukaan tool/fitur yang dinonaktifkan.
    - Key spesifik provider web search yang tidak dipilih oleh `tools.web.search.provider`. Dalam mode auto (provider tidak diatur), key dikonsultasikan berdasarkan prioritas untuk auto-detection provider sampai satu berhasil di-resolve. Setelah dipilih, key provider yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
    - Materi autentikasi SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus override per agen) aktif hanya ketika backend sandbox efektif adalah `ssh` untuk agen default atau agen yang aktif.
    - SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu dari ini benar:
      - `gateway.mode=remote`
      - `gateway.remote.url` dikonfigurasi
      - `gateway.tailscale.mode` adalah `serve` atau `funnel`
      - Dalam mode lokal tanpa permukaan remote tersebut:
        - `gateway.remote.token` aktif ketika autentikasi token dapat menang dan tidak ada env/auth token yang dikonfigurasi.
        - `gateway.remote.password` aktif hanya ketika autentikasi password dapat menang dan tidak ada env/auth password yang dikonfigurasi.
    - SecretRef `gateway.auth.token` tidak aktif untuk resolusi autentikasi startup ketika `OPENCLAW_GATEWAY_TOKEN` diatur, karena input env token menang untuk runtime tersebut.

  </Accordion>
</AccordionGroup>

## Diagnostik permukaan autentikasi Gateway

Ketika SecretRef dikonfigurasi pada `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, atau `gateway.remote.password`, startup/reload gateway mencatat status permukaan secara eksplisit:

- `active`: SecretRef adalah bagian dari permukaan autentikasi efektif dan harus berhasil di-resolve.
- `inactive`: SecretRef diabaikan untuk runtime ini karena permukaan autentikasi lain menang, atau karena autentikasi remote dinonaktifkan/tidak aktif.

Entri ini dicatat dengan `SECRETS_GATEWAY_AUTH_SURFACE` dan menyertakan alasan yang digunakan oleh kebijakan permukaan aktif, sehingga Anda dapat melihat mengapa sebuah kredensial diperlakukan sebagai aktif atau tidak aktif.

## Preflight referensi onboarding

Saat onboarding berjalan dalam mode interaktif dan Anda memilih penyimpanan SecretRef, OpenClaw menjalankan validasi preflight sebelum menyimpan:

- Referensi env: memvalidasi nama env var dan mengonfirmasi bahwa nilai non-kosong terlihat selama penyiapan.
- Referensi provider (`file` atau `exec`): memvalidasi pemilihan provider, me-resolve `id`, dan memeriksa tipe nilai yang berhasil di-resolve.
- Jalur reuse quickstart: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding me-resolve-nya sebelum bootstrap probe/dashboard (untuk referensi `env`, `file`, dan `exec`) menggunakan gerbang fail-fast yang sama.

Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

## Kontrak SecretRef

Gunakan satu bentuk objek di mana-mana:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus cocok dengan `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus berupa pointer JSON absolut (`/...`)
    - Escape RFC6901 dalam segmen: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` tidak boleh mengandung `.` atau `..` sebagai segmen path yang dipisah slash (misalnya `a/../b` ditolak)

  </Tab>
</Tabs>

## Konfigurasi provider

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

<AccordionGroup>
  <Accordion title="Provider env">
    - Allowlist opsional melalui `allowlist`.
    - Nilai env yang hilang/kosong menggagalkan resolusi.

  </Accordion>
  <Accordion title="Provider file">
    - Membaca file lokal dari `path`.
    - `mode: "json"` mengharapkan payload objek JSON dan me-resolve `id` sebagai pointer.
    - `mode: "singleValue"` mengharapkan ref id `"value"` dan mengembalikan isi file.
    - Path harus lolos pemeriksaan kepemilikan/izin.
    - Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk sebuah path, resolusi gagal. Hanya untuk path tepercaya, atur `allowInsecurePath: true` pada provider tersebut untuk melewati pemeriksaan keamanan path.

  </Accordion>
  <Accordion title="Provider exec">
    - Menjalankan path biner absolut yang dikonfigurasi, tanpa shell.
    - Secara default, `command` harus menunjuk ke file biasa (bukan symlink).
    - Atur `allowSymlinkCommand: true` untuk mengizinkan path command berupa symlink (misalnya shim Homebrew). OpenClaw memvalidasi path target yang berhasil di-resolve.
    - Pasangkan `allowSymlinkCommand` dengan `trustedDirs` untuk path package manager (misalnya `["/opt/homebrew"]`).
    - Mendukung timeout, timeout tanpa output, batas byte output, allowlist env, dan direktori tepercaya.
    - Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk path command, resolusi gagal. Hanya untuk path tepercaya, atur `allowInsecurePath: true` pada provider tersebut untuk melewati pemeriksaan keamanan path.

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

  </Accordion>
</AccordionGroup>

## Contoh integrasi exec

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // wajib untuk biner Homebrew yang berupa symlink
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
  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // wajib untuk biner Homebrew yang berupa symlink
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // wajib untuk biner Homebrew yang berupa symlink
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
  </Accordion>
</AccordionGroup>

## Variabel lingkungan server MCP

Env var server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` mendukung SecretInput. Ini menjaga API key dan token tetap di luar konfigurasi plaintext:

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

Nilai string plaintext tetap berfungsi. Referensi template env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef di-resolve selama aktivasi gateway sebelum proses server MCP di-spawn. Seperti permukaan SecretRef lainnya, referensi yang tidak ter-resolve hanya memblokir aktivasi saat Plugin `acpx` aktif secara efektif.

## Materi autentikasi SSH sandbox

Backend sandbox `ssh` inti juga mendukung SecretRef untuk materi autentikasi SSH:

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

- OpenClaw me-resolve referensi ini selama aktivasi sandbox, bukan secara lazy pada setiap panggilan SSH.
- Nilai yang berhasil di-resolve ditulis ke file temp dengan izin ketat dan digunakan dalam konfigurasi SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh`, referensi ini tetap tidak aktif dan tidak memblokir startup.

## Permukaan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum di:

- [SecretRef Credential Surface](/id/reference/secretref-credential-surface)

<Note>
Kredensial yang dicetak runtime atau berotasi serta materi refresh OAuth sengaja dikecualikan dari resolusi SecretRef baca-saja.
</Note>

## Perilaku dan prioritas yang diwajibkan

- Field tanpa ref: tidak berubah.
- Field dengan ref: wajib pada permukaan aktif selama aktivasi.
- Jika plaintext dan ref sama-sama ada, ref mendapat prioritas pada jalur prioritas yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan konfigurasi internal dan ditolak sebagai data konfigurasi literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit ketika kredensial `auth-profiles.json` lebih diprioritaskan daripada ref `openclaw.json`)

Perilaku kompatibilitas Google Chat:

- `serviceAccountRef` mendapat prioritas dibanding plaintext `serviceAccount`.
- Nilai plaintext diabaikan ketika ref sibling diatur.

## Pemicu aktivasi

Aktivasi secret berjalan pada:

- Startup (preflight plus aktivasi final)
- Jalur hot-apply reload konfigurasi
- Jalur restart-check reload konfigurasi
- Reload manual melalui `secrets.reload`
- Preflight RPC penulisan konfigurasi Gateway (`config.set` / `config.apply` / `config.patch`) untuk resolvabilitas SecretRef permukaan aktif di dalam payload konfigurasi yang dikirimkan sebelum menyimpan edit

Kontrak aktivasi:

- Keberhasilan menukar snapshot secara atomik.
- Kegagalan startup membatalkan startup gateway.
- Kegagalan reload runtime mempertahankan snapshot last-known-good.
- Kegagalan preflight Write-RPC menolak konfigurasi yang dikirimkan dan mempertahankan konfigurasi disk maupun snapshot runtime aktif tetap tidak berubah.
- Memberikan token channel per panggilan secara eksplisit ke panggilan helper/tool keluar tidak memicu aktivasi SecretRef; titik aktivasi tetap pada startup, reload, dan `secrets.reload` eksplisit.

## Sinyal degraded dan recovered

Ketika aktivasi saat reload gagal setelah status sehat, OpenClaw masuk ke status secret degraded.

Kode log dan system event sekali tembak:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Degraded: runtime mempertahankan snapshot last-known-good.
- Recovered: dikeluarkan sekali setelah aktivasi berhasil berikutnya.
- Kegagalan berulang saat sudah degraded mencatat peringatan tetapi tidak membanjiri event.
- Fail-fast startup tidak mengeluarkan event degraded karena runtime tidak pernah menjadi aktif.

## Resolusi jalur perintah

Jalur perintah dapat ikut serta dalam resolusi SecretRef yang didukung melalui snapshot RPC gateway.

Ada dua perilaku umum:

<Tabs>
  <Tab title="Jalur perintah ketat">
    Misalnya jalur remote-memory `openclaw memory` dan `openclaw qr --remote` ketika memerlukan ref shared-secret remote. Jalur ini membaca dari snapshot aktif dan gagal cepat saat SecretRef yang diperlukan tidak tersedia.
  </Tab>
  <Tab title="Jalur perintah baca-saja">
    Misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, dan alur doctor/perbaikan konfigurasi baca-saja. Jalur ini juga lebih dulu memilih snapshot aktif, tetapi mengalami degraded alih-alih dibatalkan saat SecretRef yang ditargetkan tidak tersedia pada jalur perintah tersebut.

    Perilaku baca-saja:

    - Saat gateway berjalan, perintah ini membaca dari snapshot aktif terlebih dahulu.
    - Jika resolusi gateway tidak lengkap atau gateway tidak tersedia, perintah mencoba fallback lokal yang ditargetkan untuk permukaan perintah tertentu.
    - Jika SecretRef yang ditargetkan masih tidak tersedia, perintah tetap berjalan dengan output baca-saja yang degraded dan diagnostik eksplisit seperti "configured but unavailable in this command path".
    - Perilaku degraded ini hanya lokal pada perintah. Ini tidak melemahkan jalur startup, reload, atau send/auth runtime.

  </Tab>
</Tabs>

Catatan lain:

- Penyegaran snapshot setelah rotasi secret backend ditangani oleh `openclaw secrets reload`.
- Metode RPC gateway yang digunakan oleh jalur perintah ini: `secrets.resolve`.

## Alur audit dan configure

Alur operator default:

<Steps>
  <Step title="Audit status saat ini">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Konfigurasikan SecretRef">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Audit ulang">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Temuan mencakup:

    - nilai plaintext saat disimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan)
    - residu header provider sensitif plaintext pada entri `models.json` yang dihasilkan
    - ref yang tidak ter-resolve
    - precedence shadowing (`auth-profiles.json` lebih diprioritaskan daripada ref `openclaw.json`)
    - residu lama (`auth.json`, pengingat OAuth)

    Catatan exec:

    - Secara default, audit melewati pemeriksaan resolvabilitas SecretRef exec untuk menghindari efek samping perintah.
    - Gunakan `openclaw secrets audit --allow-exec` untuk mengeksekusi provider exec selama audit.

    Catatan residu header:

    - Deteksi header provider sensitif berbasis heuristik nama (nama dan fragmen header autentikasi/kredensial umum seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interaktif yang:

    - mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus)
    - memungkinkan Anda memilih field yang didukung dan memuat secret di `openclaw.json` plus `auth-profiles.json` untuk satu cakupan agen
    - dapat membuat mapping `auth-profiles.json` baru langsung di pemilih target
    - menangkap detail SecretRef (`source`, `provider`, `id`)
    - menjalankan resolusi preflight
    - dapat langsung menerapkan

    Catatan exec:

    - Preflight melewati pemeriksaan SecretRef exec kecuali `--allow-exec` diatur.
    - Jika Anda langsung menerapkan dari `configure --apply` dan rencana mencakup ref/provider exec, biarkan `--allow-exec` tetap diatur untuk langkah apply juga.

    Mode yang membantu:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Default apply `configure`:

    - scrub kredensial statis yang cocok dari `auth-profiles.json` untuk provider yang ditargetkan
    - scrub entri `api_key` statis lama dari `auth.json`
    - scrub baris secret yang dikenal dan cocok dari `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
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

    Untuk detail kontrak target/path ketat dan aturan penolakan yang tepat, lihat [Secrets Apply Plan Contract](/id/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Kebijakan keamanan satu arah

<Warning>
OpenClaw sengaja tidak menulis cadangan rollback yang berisi nilai secret plaintext historis.
</Warning>

Model keamanan:

- preflight harus berhasil sebelum mode tulis
- aktivasi runtime divalidasi sebelum commit
- apply memperbarui file menggunakan penggantian file atomik dan pemulihan best-effort saat gagal

## Catatan kompatibilitas autentikasi lama

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan autentikasi lama berbentuk plaintext.

- Sumber kredensial runtime adalah snapshot dalam memori yang telah di-resolve.
- Entri `api_key` statis lama di-scrub saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan Web UI

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada mode form.

## Terkait

- [Authentication](/id/gateway/authentication) — penyiapan autentikasi
- [CLI: secrets](/id/cli/secrets) — perintah CLI
- [Environment Variables](/id/help/environment) — prioritas environment
- [SecretRef Credential Surface](/id/reference/secretref-credential-surface) — permukaan kredensial
- [Secrets Apply Plan Contract](/id/gateway/secrets-plan-contract) — detail kontrak rencana
- [Security](/id/gateway/security) — postur keamanan
