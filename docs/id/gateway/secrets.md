---
read_when:
    - Mengonfigurasi SecretRefs untuk kredensial penyedia dan referensi `auth-profiles.json`
    - Mengoperasikan pemuatan ulang, audit, konfigurasi, dan penerapan rahasia dengan aman di produksi
    - Memahami kegagalan cepat saat startup, pemfilteran permukaan tidak aktif, dan perilaku terakhir yang diketahui baik
sidebarTitle: Secrets management
summary: 'Pengelolaan rahasia: kontrak SecretRef, perilaku snapshot runtime, dan pembersihan satu arah yang aman'
title: Manajemen rahasia
x-i18n:
    generated_at: "2026-04-30T09:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw mendukung SecretRef aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai teks polos dalam konfigurasi.

<Note>
Teks polos tetap berfungsi. SecretRef bersifat ikut serta per kredensial.
</Note>

## Tujuan dan model runtime

Secret diselesaikan menjadi snapshot runtime dalam memori.

- Resolusi dilakukan secara eager saat aktivasi, bukan lazy pada jalur permintaan.
- Startup gagal cepat ketika SecretRef yang secara efektif aktif tidak dapat diselesaikan.
- Reload menggunakan pertukaran atomik: berhasil penuh, atau tetap memakai snapshot terakhir yang diketahui baik.
- Pelanggaran kebijakan SecretRef (misalnya profil autentikasi mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca dari snapshot dalam memori yang aktif.
- Setelah aktivasi/pemuatan konfigurasi pertama berhasil, jalur kode runtime terus membaca snapshot dalam memori aktif tersebut hingga reload yang berhasil menukarnya.
- Jalur pengiriman keluar juga membaca dari snapshot aktif tersebut (misalnya pengiriman balasan/thread Discord dan pengiriman aksi Telegram); jalur ini tidak menyelesaikan ulang SecretRef pada setiap pengiriman.

Ini menjaga gangguan penyedia secret tetap berada di luar jalur permintaan panas.

## Pemfilteran permukaan aktif

SecretRef hanya divalidasi pada permukaan yang secara efektif aktif.

- Permukaan aktif: referensi yang belum terselesaikan memblokir startup/reload.
- Permukaan tidak aktif: referensi yang belum terselesaikan tidak memblokir startup/reload.
- Referensi tidak aktif memancarkan diagnostik non-fatal dengan kode `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Contoh permukaan tidak aktif">
    - Entri channel/akun yang dinonaktifkan.
    - Kredensial channel tingkat atas yang tidak diwarisi oleh akun aktif mana pun.
    - Permukaan alat/fitur yang dinonaktifkan.
    - Kunci khusus penyedia pencarian web yang tidak dipilih oleh `tools.web.search.provider`. Dalam mode otomatis (penyedia tidak ditetapkan), kunci diperiksa berdasarkan prioritas untuk deteksi otomatis penyedia hingga satu berhasil diselesaikan. Setelah pemilihan, kunci penyedia yang tidak dipilih diperlakukan sebagai tidak aktif hingga dipilih.
    - Material autentikasi SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, serta penggantian per agen) hanya aktif ketika backend sandbox efektif adalah `ssh` untuk agen default atau agen yang aktif.
    - SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu dari berikut ini benar:
      - `gateway.mode=remote`
      - `gateway.remote.url` dikonfigurasi
      - `gateway.tailscale.mode` adalah `serve` atau `funnel`
      - Dalam mode lokal tanpa permukaan remote tersebut:
        - `gateway.remote.token` aktif ketika autentikasi token dapat menang dan tidak ada token env/auth yang dikonfigurasi.
        - `gateway.remote.password` hanya aktif ketika autentikasi kata sandi dapat menang dan tidak ada kata sandi env/auth yang dikonfigurasi.
    - SecretRef `gateway.auth.token` tidak aktif untuk resolusi autentikasi startup ketika `OPENCLAW_GATEWAY_TOKEN` ditetapkan, karena input token env menang untuk runtime tersebut.

  </Accordion>
</AccordionGroup>

## Diagnostik permukaan autentikasi Gateway

Ketika SecretRef dikonfigurasi pada `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, atau `gateway.remote.password`, startup/reload gateway mencatat status permukaan secara eksplisit:

- `active`: SecretRef adalah bagian dari permukaan autentikasi efektif dan harus diselesaikan.
- `inactive`: SecretRef diabaikan untuk runtime ini karena permukaan autentikasi lain menang, atau karena autentikasi remote dinonaktifkan/tidak aktif.

Entri ini dicatat dengan `SECRETS_GATEWAY_AUTH_SURFACE` dan menyertakan alasan yang digunakan oleh kebijakan permukaan aktif, sehingga Anda dapat melihat mengapa kredensial diperlakukan sebagai aktif atau tidak aktif.

## Preflight referensi onboarding

Ketika onboarding berjalan dalam mode interaktif dan Anda memilih penyimpanan SecretRef, OpenClaw menjalankan validasi preflight sebelum menyimpan:

- Referensi env: memvalidasi nama variabel env dan mengonfirmasi nilai tidak kosong terlihat selama penyiapan.
- Referensi penyedia (`file` atau `exec`): memvalidasi pilihan penyedia, menyelesaikan `id`, dan memeriksa tipe nilai yang diselesaikan.
- Jalur penggunaan ulang quickstart: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding menyelesaikannya sebelum bootstrap probe/dashboard (untuk referensi `env`, `file`, dan `exec`) menggunakan gerbang gagal-cepat yang sama.

Jika validasi gagal, onboarding menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

## Kontrak SecretRef

Gunakan satu bentuk objek di mana saja:

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
    - `id` tidak boleh berisi `.` atau `..` sebagai segmen jalur yang dipisahkan slash (misalnya `a/../b` ditolak)

  </Tab>
</Tabs>

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
        mode: "json", // or "singleValue"
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
  <Accordion title="Penyedia env">
    - Allowlist opsional melalui `allowlist`.
    - Nilai env yang hilang/kosong menggagalkan resolusi.

  </Accordion>
  <Accordion title="Penyedia file">
    - Membaca file lokal dari `path`.
    - `mode: "json"` mengharapkan payload objek JSON dan menyelesaikan `id` sebagai pointer.
    - `mode: "singleValue"` mengharapkan id referensi `"value"` dan mengembalikan isi file.
    - Jalur harus lulus pemeriksaan kepemilikan/izin.
    - Catatan gagal-tertutup Windows: jika verifikasi ACL tidak tersedia untuk suatu jalur, resolusi gagal. Hanya untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.

  </Accordion>
  <Accordion title="Penyedia exec">
    - Menjalankan jalur biner absolut yang dikonfigurasi, tanpa shell.
    - Secara default, `command` harus menunjuk ke file biasa (bukan symlink).
    - Tetapkan `allowSymlinkCommand: true` untuk mengizinkan jalur perintah symlink (misalnya shim Homebrew). OpenClaw memvalidasi jalur target yang diselesaikan.
    - Pasangkan `allowSymlinkCommand` dengan `trustedDirs` untuk jalur package manager (misalnya `["/opt/homebrew"]`).
    - Mendukung timeout, timeout tanpa-output, batas byte output, allowlist env, dan direktori tepercaya.
    - Catatan gagal-tertutup Windows: jika verifikasi ACL tidak tersedia untuk jalur perintah, resolusi gagal. Hanya untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.

    Payload permintaan (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload respons (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Kesalahan opsional per-id:

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

Variabel env server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` mendukung SecretInput. Ini menjaga kunci API dan token tetap di luar konfigurasi teks polos:

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

Nilai string teks polos tetap berfungsi. Referensi template env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef diselesaikan selama aktivasi gateway sebelum proses server MCP dibuat. Seperti permukaan SecretRef lainnya, referensi yang belum terselesaikan hanya memblokir aktivasi ketika Plugin `acpx` secara efektif aktif.

## Material autentikasi SSH sandbox

Backend sandbox inti `ssh` juga mendukung SecretRef untuk material autentikasi SSH:

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

- OpenClaw menyelesaikan ref ini selama aktivasi sandbox, bukan secara malas pada setiap panggilan SSH.
- Nilai yang diselesaikan ditulis ke file sementara dengan izin ketat dan digunakan dalam konfigurasi SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh`, ref ini tetap tidak aktif dan tidak memblokir startup.

## Permukaan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum di:

- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)

<Note>
Kredensial yang dibuat saat runtime atau berotasi dan materi refresh OAuth sengaja dikecualikan dari resolusi SecretRef baca-saja.
</Note>

## Perilaku wajib dan prioritas

- Field tanpa ref: tidak berubah.
- Field dengan ref: wajib pada permukaan aktif selama aktivasi.
- Jika plaintext dan ref sama-sama ada, ref diprioritaskan pada jalur prioritas yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan konfigurasi internal dan ditolak sebagai data konfigurasi literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit saat kredensial `auth-profiles.json` diprioritaskan dibanding ref `openclaw.json`)

Perilaku kompatibilitas Google Chat:

- `serviceAccountRef` diprioritaskan dibanding plaintext `serviceAccount`.
- Nilai plaintext diabaikan saat ref saudara disetel.

## Pemicu aktivasi

Aktivasi rahasia berjalan pada:

- Startup (preflight plus aktivasi final)
- Jalur hot-apply muat ulang konfigurasi
- Jalur pemeriksaan restart muat ulang konfigurasi
- Muat ulang manual melalui `secrets.reload`
- Preflight RPC penulisan konfigurasi Gateway (`config.set` / `config.apply` / `config.patch`) untuk keterpecahan SecretRef permukaan aktif di dalam payload konfigurasi yang dikirimkan sebelum menyimpan edit

Kontrak aktivasi:

- Keberhasilan menukar snapshot secara atomik.
- Kegagalan startup membatalkan startup gateway.
- Kegagalan muat ulang runtime mempertahankan snapshot terakhir yang diketahui baik.
- Kegagalan preflight write-RPC menolak konfigurasi yang dikirimkan dan menjaga konfigurasi disk serta snapshot runtime aktif tetap tidak berubah.
- Memberikan token channel per-panggilan eksplisit ke panggilan helper/tool keluar tidak memicu aktivasi SecretRef; titik aktivasi tetap startup, muat ulang, dan `secrets.reload` eksplisit.

## Sinyal terdegradasi dan pulih

Saat aktivasi pada waktu muat ulang gagal setelah status sehat, OpenClaw memasuki status rahasia terdegradasi.

Kode log dan peristiwa sistem sekali jalan:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Terdegradasi: runtime mempertahankan snapshot terakhir yang diketahui baik.
- Pulih: dipancarkan sekali setelah aktivasi berhasil berikutnya.
- Kegagalan berulang saat sudah terdegradasi mencatat peringatan tetapi tidak membanjiri peristiwa.
- Fail-fast startup tidak memancarkan peristiwa terdegradasi karena runtime tidak pernah menjadi aktif.

## Resolusi jalur perintah

Jalur perintah dapat ikut memakai resolusi SecretRef yang didukung melalui RPC snapshot gateway.

Ada dua perilaku umum:

<Tabs>
  <Tab title="Jalur perintah ketat">
    Misalnya jalur memori jarak jauh `openclaw memory` dan `openclaw qr --remote` saat membutuhkan ref rahasia bersama jarak jauh. Jalur ini membaca dari snapshot aktif dan gagal cepat saat SecretRef wajib tidak tersedia.
  </Tab>
  <Tab title="Jalur perintah baca-saja">
    Misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, serta alur doctor/perbaikan konfigurasi baca-saja. Jalur ini juga lebih memilih snapshot aktif, tetapi terdegradasi alih-alih membatalkan saat SecretRef tertarget tidak tersedia di jalur perintah tersebut.

    Perilaku baca-saja:

    - Saat gateway berjalan, perintah ini membaca dari snapshot aktif terlebih dahulu.
    - Jika resolusi gateway tidak lengkap atau gateway tidak tersedia, perintah mencoba fallback lokal tertarget untuk permukaan perintah tertentu.
    - Jika SecretRef tertarget masih tidak tersedia, perintah berlanjut dengan output baca-saja terdegradasi dan diagnostik eksplisit seperti "configured but unavailable in this command path".
    - Perilaku terdegradasi ini hanya lokal untuk perintah. Ini tidak melemahkan jalur startup runtime, muat ulang, atau kirim/auth.

  </Tab>
</Tabs>

Catatan lain:

- Refresh snapshot setelah rotasi rahasia backend ditangani oleh `openclaw secrets reload`.
- Metode RPC Gateway yang digunakan oleh jalur perintah ini: `secrets.resolve`.

## Alur kerja audit dan konfigurasi

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

    - nilai plaintext saat tersimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan)
    - residu header penyedia sensitif plaintext di entri `models.json` yang dihasilkan
    - ref yang tidak terselesaikan
    - pembayangan prioritas (`auth-profiles.json` mengambil prioritas dibanding ref `openclaw.json`)
    - residu legacy (`auth.json`, pengingat OAuth)

    Catatan exec:

    - Secara default, audit melewati pemeriksaan keterpecahan SecretRef exec untuk menghindari efek samping perintah.
    - Gunakan `openclaw secrets audit --allow-exec` untuk mengeksekusi penyedia exec selama audit.

    Catatan residu header:

    - Deteksi header penyedia sensitif berbasis heuristik nama (nama dan fragmen header auth/kredensial umum seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interaktif yang:

    - mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus)
    - memungkinkan Anda memilih field berisi rahasia yang didukung di `openclaw.json` plus `auth-profiles.json` untuk satu cakupan agen
    - dapat membuat pemetaan `auth-profiles.json` baru langsung di pemilih target
    - menangkap detail SecretRef (`source`, `provider`, `id`)
    - menjalankan resolusi preflight
    - dapat langsung menerapkan

    Catatan exec:

    - Preflight melewati pemeriksaan SecretRef exec kecuali `--allow-exec` disetel.
    - Jika Anda menerapkan langsung dari `configure --apply` dan rencana mencakup ref/penyedia exec, tetap setel `--allow-exec` untuk langkah penerapan juga.

    Mode yang membantu:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Default penerapan `configure`:

    - menghapus kredensial statis yang cocok dari `auth-profiles.json` untuk penyedia tertarget
    - menghapus entri `api_key` statis legacy dari `auth.json`
    - menghapus baris rahasia yang cocok dan diketahui dari `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Terapkan rencana tersimpan:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Catatan exec:

    - dry-run melewati pemeriksaan exec kecuali `--allow-exec` disetel.
    - mode tulis menolak rencana yang berisi SecretRef/penyedia exec kecuali `--allow-exec` disetel.

    Untuk detail kontrak target/jalur ketat dan aturan penolakan persis, lihat [Kontrak Rencana Penerapan Secrets](/id/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Kebijakan keselamatan satu arah

<Warning>
OpenClaw sengaja tidak menulis cadangan rollback yang berisi nilai rahasia plaintext historis.
</Warning>

Model keselamatan:

- preflight harus berhasil sebelum mode tulis
- aktivasi runtime divalidasi sebelum commit
- penerapan memperbarui file menggunakan penggantian file atomik dan pemulihan best-effort saat gagal

## Catatan kompatibilitas auth legacy

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan auth legacy plaintext.

- Sumber kredensial runtime adalah snapshot dalam memori yang terselesaikan.
- Entri `api_key` statis legacy dihapus saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan UI Web

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada dalam mode formulir.

## Terkait

- [Autentikasi](/id/gateway/authentication) — penyiapan autentikasi
- [CLI: secrets](/id/cli/secrets) — perintah CLI
- [Variabel Lingkungan](/id/help/environment) — prioritas lingkungan
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) — permukaan kredensial
- [Kontrak Rencana Penerapan Secrets](/id/gateway/secrets-plan-contract) — detail kontrak rencana
- [Keamanan](/id/gateway/security) — postur keamanan
