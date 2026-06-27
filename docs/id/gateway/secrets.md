---
read_when:
    - Mengonfigurasi SecretRefs untuk kredensial penyedia dan referensi `auth-profiles.json`
    - Mengoperasikan pemuatan ulang, audit, konfigurasi, dan penerapan rahasia secara aman di produksi
    - Memahami kegagalan cepat saat startup, pemfilteran permukaan tidak aktif, dan perilaku terakhir yang diketahui baik
sidebarTitle: Secrets management
summary: 'Manajemen rahasia: kontrak SecretRef, perilaku snapshot runtime, dan penghapusan aman satu arah'
title: Manajemen rahasia
x-i18n:
    generated_at: "2026-06-27T17:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw mendukung SecretRefs aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai teks biasa dalam konfigurasi.

<Note>
Teks biasa tetap berfungsi. SecretRefs bersifat opt-in per kredensial.
</Note>

<Warning>
Kredensial teks biasa tetap dapat dibaca agen jika disimpan dalam file yang
dapat diperiksa agen, termasuk `openclaw.json`, `auth-profiles.json`, `.env`, atau
file `agents/*/agent/models.json` yang dihasilkan. SecretRefs mengurangi radius
dampak lokal tersebut hanya setelah setiap kredensial yang didukung telah dimigrasikan dan
`openclaw secrets audit --check` melaporkan tidak ada sisa rahasia teks biasa.
</Warning>

## Tujuan dan model runtime

Rahasia diselesaikan menjadi snapshot runtime dalam memori.

- Resolusi dilakukan secara eager selama aktivasi, bukan lazy pada jalur permintaan.
- Startup gagal cepat ketika SecretRef yang efektif aktif tidak dapat diselesaikan.
- Reload menggunakan pertukaran atomik: sukses penuh, atau pertahankan snapshot terakhir yang diketahui baik.
- Pelanggaran kebijakan SecretRef (misalnya profil auth mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca dari snapshot dalam memori yang aktif.
- Setelah aktivasi/pemuatan konfigurasi pertama berhasil, jalur kode runtime terus membaca snapshot dalam memori aktif tersebut hingga reload yang berhasil menukarnya.
- Jalur pengiriman keluar juga membaca dari snapshot aktif tersebut (misalnya pengiriman balasan/thread Discord dan pengiriman aksi Telegram); jalur tersebut tidak menyelesaikan ulang SecretRefs pada setiap pengiriman.

Ini menjauhkan gangguan penyedia rahasia dari jalur permintaan kritis.

## Batas akses agen

SecretRefs melindungi kredensial agar tidak dipersistenkan dalam konfigurasi yang didukung dan
permukaan model yang dihasilkan, tetapi SecretRefs bukan batas isolasi proses. Jika
kredensial teks biasa tetap ada di disk pada jalur yang dapat dibaca agen, agen dapat
melewati redaksi tingkat API dengan menggunakan alat file atau shell untuk memeriksa file tersebut.

Untuk deployment produksi ketika file yang dapat diakses agen termasuk dalam cakupan, anggap
migrasi SecretRef selesai hanya ketika semua hal berikut benar:

- kredensial yang didukung menggunakan SecretRefs alih-alih nilai teks biasa
- sisa teks biasa legacy telah dibersihkan dari `openclaw.json`,
  `auth-profiles.json`, `.env`, dan file `models.json` yang dihasilkan
- `openclaw secrets audit --check` bersih setelah migrasi
- kredensial lain yang tidak didukung atau berotasi dilindungi oleh isolasi
  sistem operasi, isolasi kontainer, atau proxy kredensial eksternal

Inilah alasan workflow audit/configure/apply menjadi gerbang migrasi keamanan, bukan
sekadar helper praktis.

<Warning>
SecretRefs tidak membuat file arbitrer yang dapat dibaca menjadi aman. Cadangan, konfigurasi yang disalin,
katalog model lama yang dihasilkan, dan kelas kredensial yang tidak didukung harus diperlakukan
sebagai rahasia produksi hingga dihapus, dipindahkan ke luar batas kepercayaan agen,
atau dilindungi oleh lapisan isolasi terpisah.
</Warning>

## Pemfilteran permukaan aktif

SecretRefs divalidasi hanya pada permukaan yang efektif aktif.

- Permukaan yang diaktifkan: ref yang belum terselesaikan memblokir startup/reload.
- Permukaan tidak aktif: ref yang belum terselesaikan tidak memblokir startup/reload.
- Ref tidak aktif menghasilkan diagnostik non-fatal dengan kode `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Entri channel/akun yang dinonaktifkan.
    - Kredensial channel tingkat atas yang tidak diwarisi akun aktif mana pun.
    - Permukaan alat/fitur yang dinonaktifkan.
    - Kunci khusus penyedia pencarian web yang tidak dipilih oleh `tools.web.search.provider`. Dalam mode auto (penyedia tidak ditetapkan), kunci dikonsultasikan berdasarkan prioritas untuk deteksi otomatis penyedia hingga salah satunya terselesaikan. Setelah pemilihan, kunci penyedia yang tidak dipilih diperlakukan sebagai tidak aktif hingga dipilih.
    - Materi auth SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus override per agen) aktif hanya ketika backend sandbox efektif adalah `ssh` untuk agen default atau agen yang diaktifkan.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu dari ini benar:
      - `gateway.mode=remote`
      - `gateway.remote.url` dikonfigurasi
      - `gateway.tailscale.mode` adalah `serve` atau `funnel`
      - Dalam mode lokal tanpa permukaan remote tersebut:
        - `gateway.remote.token` aktif ketika auth token dapat menang dan tidak ada token env/auth yang dikonfigurasi.
        - `gateway.remote.password` aktif hanya ketika auth kata sandi dapat menang dan tidak ada kata sandi env/auth yang dikonfigurasi.
    - SecretRef `gateway.auth.token` tidak aktif untuk resolusi auth startup ketika `OPENCLAW_GATEWAY_TOKEN` disetel, karena input token env menang untuk runtime tersebut.

  </Accordion>
</AccordionGroup>

## Diagnostik permukaan auth Gateway

Ketika SecretRef dikonfigurasi pada `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, atau `gateway.remote.password`, startup/reload gateway mencatat status permukaan secara eksplisit:

- `active`: SecretRef adalah bagian dari permukaan auth efektif dan harus terselesaikan.
- `inactive`: SecretRef diabaikan untuk runtime ini karena permukaan auth lain menang, atau karena auth remote dinonaktifkan/tidak aktif.

Entri ini dicatat dengan `SECRETS_GATEWAY_AUTH_SURFACE` dan menyertakan alasan yang digunakan oleh kebijakan permukaan aktif, sehingga Anda dapat melihat mengapa kredensial diperlakukan sebagai aktif atau tidak aktif.

## Preflight referensi onboarding

Ketika onboarding berjalan dalam mode interaktif dan Anda memilih penyimpanan SecretRef, OpenClaw menjalankan validasi preflight sebelum menyimpan:

- Ref env: memvalidasi nama env var dan mengonfirmasi nilai yang tidak kosong terlihat selama setup.
- Ref penyedia (`file` atau `exec`): memvalidasi pemilihan penyedia, menyelesaikan `id`, dan memeriksa tipe nilai yang terselesaikan.
- Jalur penggunaan ulang quickstart: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding menyelesaikannya sebelum bootstrap probe/dashboard (untuk ref `env`, `file`, dan `exec`) menggunakan gerbang gagal-cepat yang sama.

Jika validasi gagal, onboarding menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

## Kontrak SecretRef

Gunakan satu bentuk objek di semua tempat:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Field SecretInput yang didukung juga menerima shorthand string persis:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - Escaping RFC6901 dalam segmen: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (mendukung selector seperti `secret#json_key`)
    - `id` tidak boleh memuat `.` atau `..` sebagai segmen jalur yang dibatasi slash (misalnya `a/../b` ditolak)

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
  <Accordion title="Env provider">
    - Allowlist opsional melalui `allowlist`.
    - Nilai env yang hilang/kosong menggagalkan resolusi.

  </Accordion>
  <Accordion title="File provider">
    - Membaca file lokal dari `path`.
    - `mode: "json"` mengharapkan payload objek JSON dan menyelesaikan `id` sebagai pointer.
    - `mode: "singleValue"` mengharapkan ref id `"value"` dan mengembalikan isi file.
    - Jalur harus lulus pemeriksaan kepemilikan/izin.
    - Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk suatu jalur, resolusi gagal. Hanya untuk jalur tepercaya, setel `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.

  </Accordion>
  <Accordion title="Exec provider">
    - Menjalankan jalur biner absolut yang dikonfigurasi, tanpa shell.
    - Secara default, `command` harus menunjuk ke file reguler (bukan symlink).
    - Setel `allowSymlinkCommand: true` untuk mengizinkan jalur perintah symlink (misalnya shim Homebrew). OpenClaw memvalidasi jalur target yang terselesaikan.
    - Pasangkan `allowSymlinkCommand` dengan `trustedDirs` untuk jalur package manager (misalnya `["/opt/homebrew"]`).
    - Mendukung timeout, timeout tanpa output, batas byte output, allowlist env, dan direktori tepercaya.
    - Catatan fail-closed Windows: jika verifikasi ACL tidak tersedia untuk jalur perintah, resolusi gagal. Hanya untuk jalur tepercaya, setel `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.
    - Penyedia exec yang dikelola Plugin dapat menggunakan `pluginIntegration` alih-alih
      `command`/`args` yang disalin. OpenClaw menyelesaikan detail perintah saat ini
      dari manifes plugin terpasang selama startup/reload. Jika plugin
      dinonaktifkan, dihapus, tidak tepercaya, atau tidak lagi mendeklarasikan integrasi,
      SecretRefs aktif yang menggunakan penyedia tersebut gagal tertutup.

    Payload permintaan (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload respons (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Kesalahan opsional per id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Kunci API berbasis file

Jangan letakkan string `file:...` dalam blok `env` konfigurasi. Blok `env` bersifat
literal dan tidak menimpa, jadi `file:...` tidak diselesaikan.

Gunakan SecretRef file pada field kredensial yang didukung sebagai gantinya:

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

Untuk `mode: "singleValue"`, `id` SecretRef adalah `"value"`. Untuk
`mode: "json"`, gunakan pointer JSON absolut seperti
`"/providers/xai/apiKey"`.

Lihat [Permukaan kredensial SecretRef](/id/reference/secretref-credential-surface) untuk
field konfigurasi yang menerima SecretRefs.

## Contoh integrasi exec

<AccordionGroup>
  <Accordion title="1Password CLI">
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Gunakan pembungkus resolver saat Anda ingin id SecretRef dipetakan ke kunci item Bitwarden
    Secrets Manager. Repositori menyertakan
    `scripts/secrets/openclaw-bws-resolver.mjs`; instal atau salin ke jalur absolut
    tepercaya pada host yang menjalankan Gateway.

    Persyaratan:

    - Bitwarden Secrets Manager CLI (`bws`) terinstal pada host Gateway.
    - `BWS_ACCESS_TOKEN` tersedia untuk layanan Gateway.
    - `PATH` diteruskan ke resolver, atau `BWS_BIN` diatur ke jalur absolut biner
      `bws`.
    - `BWS_SERVER_URL` harus diatur di lingkungan saat menggunakan instans Bitwarden
      yang di-host sendiri.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Resolver mengelompokkan id yang diminta, menjalankan `bws secret list`, dan mengembalikan
    nilai untuk bidang `key` rahasia yang cocok. Gunakan kunci yang memenuhi kontrak id
    SecretRef exec, seperti `openclaw/providers/openai/apiKey`; kunci bergaya env-var
    dengan garis bawah ditolak sebelum resolver berjalan. Jika lebih dari satu rahasia
    Bitwarden yang terlihat memiliki kunci yang sama dengan yang diminta, resolver
    menggagalkan id tersebut sebagai ambigu alih-alih memilih salah satunya. Setelah memperbarui config,
    verifikasi jalur resolver:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
  <Accordion title="password-store (`pass`)">
    Gunakan pembungkus resolver kecil saat Anda ingin id SecretRef dipetakan langsung ke
    entri `pass`. Simpan ini sebagai executable dalam jalur absolut yang lolos
    pemeriksaan jalur exec-provider Anda, misalnya
    `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node`
    menyelesaikan `node` dari `PATH` proses resolver, jadi sertakan `PATH` dalam
    `passEnv`. Jika `pass` tidak ada di `PATH` tersebut, atur `PASS_BIN` di lingkungan
    induk dan sertakan juga dalam `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Lalu konfigurasikan provider exec dan arahkan `apiKey` ke jalur entri `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Simpan rahasia pada baris pertama entri `pass`, atau sesuaikan
    pembungkus jika Anda ingin mengembalikan seluruh output `pass show`. Setelah
    memperbarui config, verifikasi audit statis dan jalur resolver exec:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

Env var server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` mendukung SecretInput. Ini menjaga kunci API dan token tetap berada di luar config plaintext:

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

Nilai string plaintext tetap berfungsi. Ref template env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef diselesaikan selama aktivasi gateway sebelum proses server MCP dibuat. Seperti permukaan SecretRef lainnya, ref yang belum terselesaikan hanya memblokir aktivasi saat plugin `acpx` secara efektif aktif.

## Materi auth SSH sandbox

Backend sandbox inti `ssh` juga mendukung SecretRefs untuk materi auth SSH:

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

- OpenClaw menyelesaikan ref ini selama aktivasi sandbox, bukan secara malas selama setiap panggilan SSH.
- Nilai yang diselesaikan ditulis ke file temp dengan izin terbatas dan digunakan dalam config SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh`, ref ini tetap tidak aktif dan tidak memblokir startup.

## Permukaan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum di:

- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)

<Note>
Kredensial yang dibuat runtime atau berotasi dan materi refresh OAuth sengaja dikecualikan dari resolusi SecretRef baca-saja.
</Note>

## Perilaku dan presedensi yang diperlukan

- Bidang tanpa ref: tidak berubah.
- Bidang dengan ref: wajib pada permukaan aktif selama aktivasi.
- Jika plaintext dan ref sama-sama ada, ref diprioritaskan pada jalur presedensi yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan config internal dan ditolak sebagai data config literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit saat kredensial `auth-profiles.json` diprioritaskan atas ref `openclaw.json`)

Perilaku kompatibilitas Google Chat:

- `serviceAccountRef` diprioritaskan atas `serviceAccount` plaintext.
- Nilai plaintext diabaikan saat ref saudara diatur.

## Pemicu aktivasi

Aktivasi rahasia berjalan saat:

- Startup (preflight ditambah aktivasi final)
- Jalur hot-apply reload config
- Jalur restart-check reload config
- Reload manual melalui `secrets.reload`
- Preflight RPC tulis config Gateway (`config.set` / `config.apply` / `config.patch`) untuk resolvabilitas SecretRef permukaan aktif di dalam payload config yang dikirimkan sebelum menyimpan edit

Kontrak aktivasi:

- Berhasil menukar snapshot secara atomik.
- Kegagalan startup membatalkan startup gateway.
- Kegagalan reload runtime mempertahankan snapshot terakhir yang diketahui baik.
- Kegagalan preflight write-RPC menolak config yang dikirimkan dan mempertahankan config disk serta snapshot runtime aktif tanpa perubahan.
- Menyediakan token kanal per panggilan eksplisit ke panggilan helper/tool outbound tidak memicu aktivasi SecretRef; titik aktivasi tetap startup, reload, dan `secrets.reload` eksplisit.

## Sinyal terdegradasi dan pulih

Saat aktivasi pada waktu reload gagal setelah status sehat, OpenClaw memasuki status rahasia terdegradasi.

Event sistem satu kali dan kode log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Terdegradasi: runtime mempertahankan snapshot terakhir yang diketahui baik.
- Pulih: dipancarkan sekali setelah aktivasi berhasil berikutnya.
- Kegagalan berulang saat sudah terdegradasi mencatat peringatan tetapi tidak membanjiri event.
- Fail-fast startup tidak memancarkan event terdegradasi karena runtime tidak pernah menjadi aktif.

## Resolusi jalur perintah

Jalur perintah dapat memilih ikut serta dalam resolusi SecretRef yang didukung melalui RPC snapshot gateway.

Ada dua perilaku umum:

<Tabs>
  <Tab title="Jalur perintah ketat">
    Misalnya jalur remote-memory `openclaw memory` dan `openclaw qr --remote` ketika memerlukan referensi remote shared-secret. Keduanya membaca dari snapshot aktif dan gagal cepat ketika SecretRef yang diperlukan tidak tersedia.
  </Tab>
  <Tab title="Jalur perintah baca-saja">
    Misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, serta alur perbaikan doctor/config baca-saja. Semuanya juga lebih memilih snapshot aktif, tetapi menurun fungsinya alih-alih batal ketika SecretRef yang ditargetkan tidak tersedia di jalur perintah tersebut.

    Perilaku baca-saja:

    - Ketika gateway berjalan, perintah ini membaca dari snapshot aktif terlebih dahulu.
    - Jika resolusi gateway belum lengkap atau gateway tidak tersedia, perintah mencoba fallback lokal tertarget untuk permukaan perintah tertentu.
    - Jika SecretRef yang ditargetkan masih tidak tersedia, perintah berlanjut dengan keluaran baca-saja yang menurun fungsinya dan diagnostik eksplisit seperti "dikonfigurasi tetapi tidak tersedia di jalur perintah ini".
    - Perilaku yang menurun fungsi ini hanya bersifat lokal untuk perintah. Ini tidak melemahkan startup runtime, reload, atau jalur kirim/auth.

  </Tab>
</Tabs>

Catatan lain:

- Penyegaran snapshot setelah rotasi secret backend ditangani oleh `openclaw secrets reload`.
- Metode RPC Gateway yang digunakan oleh jalur perintah ini: `secrets.resolve`.

## Alur kerja audit dan konfigurasi

Alur operator default:

<Steps>
  <Step title="Audit status saat ini">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Konfigurasi dan terapkan SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Audit ulang">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Jangan anggap migrasi selesai sampai audit ulang bersih. Jika audit
masih melaporkan nilai plaintext saat tersimpan, risiko akses agen masih ada
meskipun API runtime mengembalikan nilai yang telah disamarkan.

Jika Anda menyimpan rencana alih-alih menerapkannya selama `configure`, terapkan rencana tersimpan itu
dengan `openclaw secrets apply --from <plan-path>` sebelum audit ulang.

<AccordionGroup>
  <Accordion title="audit secrets">
    Temuan mencakup:

    - nilai plaintext saat tersimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan)
    - sisa header provider sensitif berbentuk plaintext dalam entri `models.json` yang dihasilkan
    - ref yang belum terselesaikan
    - precedence shadowing (`auth-profiles.json` mengambil prioritas atas ref `openclaw.json`)
    - sisa legacy (`auth.json`, pengingat OAuth)

    Catatan exec:

    - Secara default, audit melewati pemeriksaan resolvabilitas exec SecretRef untuk menghindari efek samping perintah.
    - Gunakan `openclaw secrets audit --allow-exec` untuk menjalankan provider exec selama audit.

    Catatan sisa header:

    - Deteksi header provider sensitif berbasis heuristik nama (nama dan fragmen header auth/kredensial umum seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

  </Accordion>
  <Accordion title="konfigurasi secrets">
    Helper interaktif yang:

    - mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus)
    - memungkinkan Anda memilih field pembawa secret yang didukung di `openclaw.json` plus `auth-profiles.json` untuk satu cakupan agen
    - dapat membuat pemetaan `auth-profiles.json` baru langsung di pemilih target
    - menangkap detail SecretRef (`source`, `provider`, `id`)
    - menjalankan resolusi preflight
    - dapat langsung menerapkan

    Catatan exec:

    - Preflight melewati pemeriksaan exec SecretRef kecuali `--allow-exec` disetel.
    - Jika Anda menerapkan langsung dari `configure --apply` dan rencana menyertakan ref/provider exec, tetap setel `--allow-exec` untuk langkah apply juga.

    Mode yang berguna:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Default apply `configure`:

    - hapus kredensial statis yang cocok dari `auth-profiles.json` untuk provider yang ditargetkan
    - hapus entri `api_key` statis legacy dari `auth.json`
    - hapus baris secret yang diketahui dan cocok dari `<config-dir>/.env`

  </Accordion>
  <Accordion title="terapkan secrets">
    Terapkan rencana tersimpan:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Catatan exec:

    - dry-run melewati pemeriksaan exec kecuali `--allow-exec` disetel.
    - mode tulis menolak rencana yang berisi exec SecretRefs/provider kecuali `--allow-exec` disetel.

    Untuk detail kontrak target/jalur ketat dan aturan penolakan persis, lihat [Kontrak Rencana Apply Secrets](/id/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Kebijakan keamanan satu arah

<Warning>
OpenClaw sengaja tidak menulis backup rollback yang berisi nilai secret plaintext historis.
</Warning>

Model keamanan:

- preflight harus berhasil sebelum mode tulis
- aktivasi runtime divalidasi sebelum commit
- apply memperbarui file menggunakan penggantian file atomik dan pemulihan upaya terbaik saat gagal

## Catatan kompatibilitas auth legacy

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan auth legacy berbentuk plaintext.

- Sumber kredensial runtime adalah snapshot dalam memori yang sudah terselesaikan.
- Entri `api_key` statis legacy dihapus ketika ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan Web UI

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada mode formulir.

## Terkait

- [Autentikasi](/id/gateway/authentication) — penyiapan auth
- [CLI: secrets](/id/cli/secrets) — perintah CLI
- [Variabel Lingkungan](/id/help/environment) — prioritas lingkungan
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) — permukaan kredensial
- [Kontrak Rencana Apply Secrets](/id/gateway/secrets-plan-contract) — detail kontrak rencana
- [Keamanan](/id/gateway/security) — postur keamanan
