---
read_when:
    - Mengonfigurasi SecretRefs untuk kredensial penyedia dan referensi `auth-profiles.json`
    - Mengoperasikan pemuatan ulang, audit, konfigurasi, dan penerapan rahasia dengan aman di lingkungan produksi
    - Memahami kegagalan cepat saat startup, pemfilteran permukaan tidak aktif, dan perilaku konfigurasi terakhir yang diketahui berfungsi baik
sidebarTitle: Secrets management
summary: 'Pengelolaan rahasia: kontrak SecretRef, perilaku snapshot runtime, dan pembersihan satu arah yang aman'
title: Pengelolaan rahasia
x-i18n:
    generated_at: "2026-07-16T18:09:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw mendukung SecretRef aditif agar kredensial yang didukung tidak perlu disimpan sebagai teks biasa dalam konfigurasi.

<Note>
Teks biasa tetap berfungsi. SecretRef bersifat opsional untuk setiap kredensial.
</Note>

<Warning>
Kredensial teks biasa tetap dapat dibaca agen jika berada dalam file yang dapat diperiksa agen, termasuk `openclaw.json`, `auth-profiles.json`, `.env`, atau file `agents/*/agent/models.json` yang dihasilkan. SecretRef hanya mengurangi cakupan dampak lokal tersebut setelah setiap kredensial yang didukung dimigrasikan dan `openclaw secrets audit --check` melaporkan tidak ada residu teks biasa.
</Warning>

## Model runtime

- Rahasia diuraikan menjadi snapshot runtime dalam memori, secara proaktif selama aktivasi, bukan secara malas pada jalur permintaan.
- Proses mulai gagal dengan cepat ketika SecretRef yang secara efektif aktif tidak dapat diuraikan.
- Pemuatan ulang merupakan pertukaran atomik: berhasil sepenuhnya, atau mempertahankan snapshot terakhir yang diketahui baik.
- Pelanggaran kebijakan (misalnya profil autentikasi mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca snapshot dalam memori yang aktif. Kredensial SecretRef penyedia model diteruskan melalui penyimpanan autentikasi dan opsi aliran sebagai sentinel lokal proses hingga keluar. Jalur pengiriman keluar (pengiriman balasan/utas Discord, pengiriman tindakan Telegram) juga membaca snapshot tersebut dan tidak menguraikan ulang referensi pada setiap pengiriman.

Hal ini mencegah gangguan penyedia rahasia memengaruhi jalur permintaan sibuk.

## Injeksi saat keluar (sentinel)

Untuk kredensial penyedia model yang didukung oleh SecretRef, OpenClaw membuat sentinel buram yang bersifat lokal terhadap proses selama penguraian autentikasi model. Oleh karena itu, penyimpanan autentikasi, opsi aliran, konfigurasi SDK, log, objek kesalahan, dan sebagian besar introspeksi runtime melihat nilai seperti `oc-sent-v1-...`, bukan kredensial penyedia. Pengambilan model yang dilindungi dan probe kesehatan penyedia lokal terkelola mengganti sentinel yang dikenal dalam nilai URL dan header tepat sebelum setiap permintaan meninggalkan proses.

Nilai berbentuk sentinel yang tidak dikenal ditolak secara tertutup sebelum aktivitas jaringan. OpenClaw menolak mengirim permintaan alih-alih meneruskan sentinel yang belum diuraikan kepada penyedia. Nilai rahasia yang telah diuraikan juga didaftarkan untuk penyuntingan log berdasarkan kecocokan nilai yang tepat sebagai langkah pertahanan berlapis.

Adaptor penyedia menggunakan titik injeksi terbaru yang didukung SDK-nya:

- SDK dengan opsi pengambilan khusus menerima pengambilan terlindungi milik OpenClaw, sehingga SDK mempertahankan sentinel.
- SDK tanpa opsi pengambilan khusus membuka sentinel tepat sebelum pembuatan klien. Aliran penyedia milik Plugin dan harness agen membukanya pada serah terima terakhir yang dimiliki inti karena transportasi tersebut tidak menggunakan pengambilan terlindungi milik OpenClaw.

Sentinel mengurangi paparan teks biasa di seluruh rantai panggilan model, tetapi bukan merupakan isolasi proses. Nilai sebenarnya tetap ada dalam memori proses yang sama dan muncul pada batas adaptor terakhir. Kredensial lingkungan biasa yang tidak dikonfigurasi melalui SecretRef tetap berupa teks biasa dan berada di luar mekanisme ini.

Atur `OPENCLAW_SECRET_SENTINELS=off` (juga menerima `0` atau `false`, tanpa membedakan huruf besar-kecil) untuk menonaktifkan pembuatan sentinel selama respons insiden atau pemecahan masalah kompatibilitas. Sakelar penghenti tidak menonaktifkan pendaftaran penyuntingan berdasarkan kecocokan nilai yang tepat.

## Batas akses agen

SecretRef mencegah kredensial disimpan secara persisten dalam konfigurasi dan file model yang dihasilkan, tetapi bukan merupakan batas isolasi proses. Kredensial teks biasa yang tertinggal pada disk di jalur yang dapat dibaca agen tetap dapat dibaca melalui alat file atau shell, sehingga melewati penyuntingan tingkat API.

Untuk deployment produksi yang mencakup file yang dapat diakses agen, anggap migrasi selesai hanya jika semua kondisi berikut terpenuhi:

- Kredensial yang didukung menggunakan SecretRef, bukan nilai teks biasa.
- Residu teks biasa lama dibersihkan dari `openclaw.json`, `auth-profiles.json`, `.env`, dan file `models.json` yang dihasilkan.
- `openclaw secrets audit --check` bersih setelah migrasi.
- Semua kredensial yang tersisa dan tidak didukung atau dirotasi dilindungi oleh isolasi OS, isolasi kontainer, atau proksi kredensial eksternal.

Inilah sebabnya alur audit/konfigurasi/penerapan merupakan gerbang migrasi keamanan, bukan sekadar alat bantu praktis.

<Warning>
SecretRef tidak membuat sembarang file yang dapat dibaca menjadi aman. Cadangan, konfigurasi yang disalin, katalog model lama yang dihasilkan, dan kelas kredensial yang tidak didukung tetap menjadi rahasia produksi sampai dihapus, dipindahkan ke luar batas kepercayaan agen, atau diisolasi secara terpisah.
</Warning>

## Pemfilteran permukaan aktif

SecretRef hanya divalidasi pada permukaan yang secara efektif aktif:

- **Permukaan yang diaktifkan**: referensi yang belum diuraikan memblokir proses mulai/pemuatan ulang.
- **Permukaan tidak aktif**: referensi yang belum diuraikan tidak memblokir proses mulai/pemuatan ulang; referensi tersebut memancarkan diagnostik `SECRETS_REF_IGNORED_INACTIVE_SURFACE` yang tidak fatal.

<Accordion title="Contoh permukaan tidak aktif">
- Entri saluran/akun yang dinonaktifkan.
- Kredensial saluran tingkat atas yang tidak diwarisi oleh akun mana pun yang diaktifkan.
- Permukaan alat/fitur yang dinonaktifkan.
- Kunci khusus penyedia pencarian web yang tidak dipilih oleh `tools.web.search.provider`. Dalam mode otomatis (penyedia tidak ditetapkan), kunci diperiksa berdasarkan prioritas untuk deteksi otomatis hingga salah satunya berhasil diuraikan; setelah pemilihan, kunci penyedia yang tidak dipilih menjadi tidak aktif.
- Materi autentikasi SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, beserta penggantian per agen) hanya aktif ketika backend sandbox efektif adalah `ssh` dan mode sandbox bukan `off`, untuk agen default atau agen yang diaktifkan.
- SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu kondisi berikut terpenuhi:
  - `gateway.mode=remote`
  - `gateway.remote.url` dikonfigurasi
  - `gateway.tailscale.mode` adalah `serve` atau `funnel`
  - Dalam mode lokal tanpa permukaan jarak jauh tersebut: `gateway.remote.token` aktif ketika autentikasi token dapat diprioritaskan dan tidak ada token lingkungan/autentikasi yang dikonfigurasi; `gateway.remote.password` hanya aktif ketika autentikasi kata sandi dapat diprioritaskan dan tidak ada kata sandi lingkungan/autentikasi yang dikonfigurasi.
- SecretRef `gateway.auth.token` tidak aktif untuk penguraian autentikasi saat proses mulai ketika `OPENCLAW_GATEWAY_TOKEN` ditetapkan, karena input token lingkungan diprioritaskan untuk runtime tersebut.

</Accordion>

## Diagnostik permukaan autentikasi Gateway

Ketika SecretRef ditetapkan pada `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, atau `gateway.remote.password`, proses mulai/pemuatan ulang Gateway mencatat status permukaan dengan kode `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: SecretRef merupakan bagian dari permukaan autentikasi efektif dan harus diuraikan.
- `inactive`: permukaan autentikasi lain diprioritaskan, atau autentikasi jarak jauh dinonaktifkan/tidak aktif.

Entri log menyertakan alasan yang digunakan oleh kebijakan permukaan aktif.

## Prapemeriksaan referensi orientasi

Dalam orientasi interaktif, memilih penyimpanan SecretRef menjalankan validasi prapemeriksaan sebelum menyimpan:

- Referensi lingkungan: memvalidasi nama variabel lingkungan dan memastikan nilai yang tidak kosong terlihat selama penyiapan.
- Referensi penyedia (`file` atau `exec`): memvalidasi pemilihan penyedia, menguraikan `id`, dan memeriksa jenis nilai yang diuraikan.
- Alur mulai cepat: ketika `gateway.auth.token` sudah berupa SecretRef, orientasi menguraikannya sebelum bootstrap probe/dasbor (untuk referensi `env`, `file`, dan `exec`) menggunakan gerbang gagal-cepat yang sama.

Kegagalan validasi menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

## Kontrak SecretRef

Satu bentuk objek di semua tempat:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    String singkat juga diterima pada bidang SecretInput:

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
    - `id` harus berupa penunjuk JSON absolut (`/...`), atau literal `value` untuk penyedia `singleValue`
    - Pelolosan RFC 6901 dalam segmen: `~` menjadi `~0`, `/` menjadi `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (mendukung pemilih seperti `secret#json_key`)
    - `id` tidak boleh memuat `.` atau `..` sebagai segmen jalur yang dipisahkan garis miring (misalnya `a/../b` ditolak)

  </Tab>
</Tabs>

## Konfigurasi penyedia

Tentukan penyedia di bawah `secrets.providers`:

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

<Accordion title="Penyedia lingkungan">
- Daftar izin nama persis opsional melalui `allowlist`.
- Nilai lingkungan yang hilang atau kosong menggagalkan penguraian.

</Accordion>

<Accordion title="Penyedia file">
- Membaca file lokal di `path`.
- `mode: "json"` (default) mengharapkan muatan objek JSON dan menguraikan `id` sebagai penunjuk JSON.
- `mode: "singleValue"` mengharapkan id referensi `"value"` dan mengembalikan isi file mentah (baris baru di bagian akhir dihapus).
- Jalur harus lulus pemeriksaan kepemilikan/izin; `timeoutMs` (default 5000) dan `maxBytes` (default 1 MiB) membatasi pembacaan.
- Penolakan tertutup di Windows: jika verifikasi ACL tidak tersedia untuk jalur tersebut, penguraian gagal. Hanya untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan.

</Accordion>

<Accordion title="Penyedia exec">
- Menjalankan jalur biner absolut yang dikonfigurasi secara langsung, tanpa shell.
- Secara default, `command` harus berupa berkas biasa, bukan symlink. Atur `allowSymlinkCommand: true` untuk mengizinkan jalur perintah symlink (misalnya shim Homebrew), dan pasangkan dengan `trustedDirs` (misalnya `["/opt/homebrew"]`) agar hanya jalur pengelola paket yang memenuhi syarat.
- Mendukung `timeoutMs` (default 5000), `noOutputTimeoutMs` (default sama dengan `timeoutMs`), `maxOutputBytes` (default 1 MiB), daftar yang diizinkan `env`/`passEnv`, dan `trustedDirs`.
- `jsonOnly` memiliki default `true`. Dengan `jsonOnly: false` dan satu id yang diminta, stdout non-JSON biasa diterima sebagai nilai id tersebut.
- Windows gagal secara tertutup: jika verifikasi ACL tidak tersedia untuk jalur perintah, resolusi gagal. Hanya untuk jalur tepercaya, atur `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan.
- Penyedia exec yang dikelola Plugin dapat menggunakan `pluginIntegration` sebagai pengganti `command`/`args` yang disalin. OpenClaw menyelesaikan detail perintah saat ini dari manifes Plugin yang terinstal selama startup/pemuatan ulang; jika Plugin dinonaktifkan, dihapus, tidak tepercaya, atau tidak lagi mendeklarasikan integrasi, SecretRef aktif pada penyedia tersebut gagal secara tertutup.

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
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` adalah diagnostik opsional yang dapat dibaca mesin. OpenClaw menampilkan kode
yang dikenali, `NOT_FOUND` dan `AMBIGUOUS_DUPLICATE_KEY`, beserta penyedia dan id referensi. Kode lain
dan bidang berbentuk bebas seperti `message` diterima untuk kompatibilitas protocol-v1,
tetapi tidak ditampilkan karena keluaran resolver dapat berisi materi kredensial.

</Accordion>

## Kunci API berbasis berkas

Jangan masukkan string `file:...` ke dalam blok `env` konfigurasi. Blok tersebut bersifat literal dan tidak dapat ditimpa, sehingga `file:...` tidak pernah diselesaikan di sana.

Sebagai gantinya, gunakan SecretRef berkas pada bidang kredensial yang didukung:

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

Untuk `mode: "singleValue"`, `id` SecretRef adalah `"value"`. Untuk `mode: "json"`, gunakan penunjuk JSON absolut seperti `"/providers/xai/apiKey"`.

Lihat [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) untuk bidang yang menerima SecretRef.

## Contoh integrasi exec

Untuk panduan khusus 1Password yang mencakup akun layanan, skill agen yang disertakan, dan pemecahan masalah, lihat [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // diperlukan untuk biner Homebrew yang di-symlink
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
    Gunakan pembungkus resolver untuk memetakan id SecretRef ke kunci item Bitwarden Secrets Manager. Repositori menyertakan `scripts/secrets/openclaw-bws-resolver.mjs`; instal atau salin ke jalur absolut tepercaya pada host yang menjalankan Gateway.

    Persyaratan:

    - CLI Bitwarden Secrets Manager (`bws`) terinstal pada host Gateway.
    - `BWS_ACCESS_TOKEN` tersedia untuk layanan Gateway.
    - `PATH` diteruskan ke resolver, atau `BWS_BIN` diatur ke jalur biner `bws` absolut.
    - `BWS_SERVER_URL` diatur di lingkungan saat menggunakan instans Bitwarden yang di-host sendiri.

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

    Resolver mengelompokkan id yang diminta, menjalankan `bws secret list`, dan mengembalikan nilai untuk bidang rahasia `key` yang cocok. Gunakan kunci yang memenuhi kontrak id SecretRef exec, seperti `openclaw/providers/openai/apiKey`; kunci bergaya variabel lingkungan dengan garis bawah ditolak sebelum resolver berjalan. Jika lebih dari satu rahasia Bitwarden yang terlihat menggunakan kunci yang diminta, resolver menggagalkan id tersebut sebagai ambigu alih-alih menebak. Setelah memperbarui konfigurasi, verifikasi jalur resolver:

    ```bash
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // diperlukan untuk biner Homebrew yang di-symlink
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
    Gunakan pembungkus resolver kecil untuk memetakan id SecretRef secara langsung ke entri `pass`. Simpan ini sebagai berkas yang dapat dieksekusi pada jalur absolut yang lolos pemeriksaan jalur penyedia exec Anda, misalnya `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node` menyelesaikan `node` dari `PATH` proses resolver, jadi sertakan `PATH` dalam `passEnv`. Jika `pass` tidak berada pada `PATH` tersebut, atur `PASS_BIN` di lingkungan induk dan sertakan juga dalam `passEnv`:

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
        process.stderr.write(`Gagal mengurai permintaan: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass keluar dengan status ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Kemudian konfigurasikan penyedia exec dan arahkan `apiKey` ke jalur entri `pass`:

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

    Simpan rahasia pada baris pertama entri `pass`, atau sesuaikan pembungkus agar mengembalikan keluaran `pass show` lengkap. Setelah memperbarui konfigurasi, verifikasi audit statis dan jalur resolver exec:

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
            allowSymlinkCommand: true, // diperlukan untuk biner Homebrew yang di-symlink
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

Variabel lingkungan server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` menerima SecretInput, sehingga kunci API dan token tidak disimpan dalam konfigurasi teks biasa:

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

Nilai string teks biasa tetap berfungsi. Referensi templat lingkungan seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef diselesaikan selama aktivasi gateway, sebelum proses server MCP dimulai. Seperti permukaan SecretRef lainnya, referensi yang tidak terselesaikan hanya memblokir aktivasi saat Plugin `acpx` aktif secara efektif.

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

- OpenClaw me-resolve referensi ini selama aktivasi sandbox, bukan secara malas pada setiap panggilan SSH.
- Nilai yang telah di-resolve ditulis ke direktori sementara dengan izin file yang ketat (`0o600`) dan digunakan dalam konfigurasi SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh` (atau mode sandbox adalah `off`), referensi ini tetap tidak aktif dan tidak menghalangi proses startup.

## Cakupan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum dalam [Cakupan Kredensial SecretRef](/id/reference/secretref-credential-surface).

<Note>
Kredensial yang dibuat oleh runtime atau berotasi serta materi penyegaran OAuth sengaja dikecualikan dari resolusi SecretRef hanya-baca.
</Note>

## Perilaku dan presedensi yang diwajibkan

- Bidang tanpa referensi: tidak berubah.
- Bidang dengan referensi: wajib pada permukaan aktif selama aktivasi.
- Jika teks biasa dan referensi sama-sama tersedia, referensi diprioritaskan pada jalur presedensi yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan konfigurasi internal dan ditolak sebagai data konfigurasi literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit ketika kredensial `auth-profiles.json` diprioritaskan daripada referensi `openclaw.json`)

Kompatibilitas Google Chat: `serviceAccountRef` diprioritaskan daripada teks biasa `serviceAccount`; nilai teks biasa diabaikan setelah referensi saudaranya ditetapkan.

## Pemicu aktivasi

Aktivasi rahasia dijalankan saat:

- Startup (prapemeriksaan serta aktivasi akhir)
- Jalur penerapan langsung saat pemuatan ulang konfigurasi
- Jalur pemeriksaan mulai ulang saat pemuatan ulang konfigurasi
- Pemuatan ulang manual melalui `secrets.reload`
- Prapemeriksaan RPC penulisan konfigurasi Gateway (`config.set` / `config.apply` / `config.patch`), yang memeriksa apakah SecretRef pada permukaan aktif dapat di-resolve dalam muatan konfigurasi yang dikirimkan sebelum perubahan dipersistenkan

Kontrak aktivasi:

- Keberhasilan mengganti snapshot secara atomik.
- Kegagalan startup membatalkan startup Gateway.
- Kegagalan pemuatan ulang runtime mempertahankan snapshot terakhir yang diketahui baik.
- Kegagalan prapemeriksaan RPC penulisan menolak konfigurasi yang dikirimkan; konfigurasi pada disk dan snapshot runtime aktif tetap tidak berubah.
- Memberikan token saluran per panggilan secara eksplisit ke panggilan helper/alat keluar tidak memicu aktivasi SecretRef; titik aktivasi tetap berupa startup, pemuatan ulang, dan `secrets.reload` eksplisit.

## Sinyal terdegradasi dan pulih

Ketika aktivasi saat pemuatan ulang gagal setelah kondisi yang sehat, OpenClaw memasuki status rahasia terdegradasi dan memancarkan peristiwa sistem sekali jalan serta kode log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Terdegradasi: runtime mempertahankan snapshot terakhir yang diketahui baik.
- Pulih: dipancarkan sekali setelah aktivasi berikutnya berhasil.
- Kegagalan berulang saat sudah terdegradasi mencatat peringatan, tetapi tidak memancarkan ulang peristiwa.
- Kegagalan cepat saat startup tidak pernah memancarkan peristiwa terdegradasi karena runtime tidak pernah menjadi aktif.

## Resolusi jalur perintah

Jalur perintah dapat memilih untuk menggunakan resolusi SecretRef yang didukung melalui RPC snapshot Gateway. Dua perilaku umum berlaku:

<Tabs>
  <Tab title="Jalur perintah ketat">
    Contohnya jalur memori jarak jauh `openclaw memory` dan `openclaw qr --remote` ketika memerlukan referensi rahasia bersama jarak jauh. Jalur tersebut membaca dari snapshot aktif dan langsung gagal ketika SecretRef yang diwajibkan tidak tersedia.
  </Tab>
  <Tab title="Jalur perintah hanya-baca">
    Contohnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, serta alur doctor/perbaikan konfigurasi hanya-baca. Jalur tersebut juga mengutamakan snapshot aktif, tetapi beralih ke kondisi terdegradasi alih-alih membatalkan ketika SecretRef yang ditargetkan tidak tersedia.

    Perilaku hanya-baca:

    - Ketika Gateway berjalan, perintah ini membaca dari snapshot aktif terlebih dahulu.
    - Jika resolusi Gateway tidak lengkap atau Gateway tidak tersedia, perintah mencoba fallback lokal yang ditargetkan untuk permukaan perintah tersebut.
    - Jika SecretRef yang ditargetkan tetap tidak tersedia, perintah dilanjutkan dengan keluaran hanya-baca terdegradasi dan diagnostik eksplisit bahwa referensi telah dikonfigurasi, tetapi tidak tersedia dalam jalur perintah ini.
    - Perilaku terdegradasi ini hanya bersifat lokal bagi perintah; perilaku ini tidak memperlemah startup runtime, pemuatan ulang, atau jalur pengiriman/autentikasi.

  </Tab>
</Tabs>

Catatan lainnya:

- Penyegaran snapshot setelah rotasi rahasia backend ditangani oleh `openclaw secrets reload`.
- Metode RPC Gateway yang digunakan oleh jalur perintah ini: `secrets.resolve`.

## Alur kerja audit dan konfigurasi

Alur operator default:

<Steps>
  <Step title="Audit kondisi saat ini">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Konfigurasikan dan terapkan SecretRef">
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

Jangan anggap migrasi selesai hingga audit ulang bersih. Jika audit masih melaporkan nilai teks biasa saat tersimpan, risiko akses agen tetap ada meskipun API runtime mengembalikan nilai yang disunting.

Jika Anda menyimpan rencana alih-alih menerapkannya selama `configure`, terapkan rencana tersimpan tersebut dengan `openclaw secrets apply --from <plan-path>` sebelum audit ulang.

<AccordionGroup>
  <Accordion title="secrets audit">
    Temuan mencakup:

    - Nilai teks biasa saat tersimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan).
    - Residu header penyedia sensitif dalam teks biasa pada entri `models.json` yang dihasilkan.
    - Referensi yang tidak dapat di-resolve.
    - Pembayangan presedensi (`auth-profiles.json` diprioritaskan daripada referensi `openclaw.json`).
    - Residu lama (`auth.json`, pengingat OAuth).

    Catatan exec: secara default, audit melewati pemeriksaan keter-resolusi-an SecretRef exec untuk menghindari efek samping perintah. Gunakan `openclaw secrets audit --allow-exec` untuk menjalankan penyedia exec selama audit.

    Catatan residu header: deteksi header penyedia sensitif didasarkan pada heuristik nama (nama header autentikasi/kredensial umum serta fragmen seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interaktif yang:

    - Mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus).
    - Memungkinkan Anda memilih bidang yang didukung dan memuat rahasia dalam `openclaw.json`, ditambah `auth-profiles.json` untuk satu cakupan agen.
    - Dapat membuat pemetaan `auth-profiles.json` baru secara langsung dalam pemilih target.
    - Mengambil detail SecretRef (`source`, `provider`, `id`).
    - Menjalankan resolusi prapemeriksaan dan dapat langsung menerapkannya.

    Catatan exec: prapemeriksaan melewati pemeriksaan SecretRef exec kecuali `--allow-exec` ditetapkan. Jika Anda menerapkan langsung dari `configure --apply` dan rencana menyertakan referensi/penyedia exec, pertahankan `--allow-exec` untuk langkah penerapan juga.

    Mode yang membantu:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Default penerapan `configure`:

    - Menghapus kredensial statis yang cocok dari `auth-profiles.json` untuk penyedia yang ditargetkan.
    - Menghapus entri statis lama `api_key` dari `auth.json`.
    - Menghapus baris rahasia yang diketahui cocok dari `<config-dir>/.env`.

  </Accordion>
  <Accordion title="secrets apply">
    Terapkan rencana tersimpan:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Catatan exec: uji coba melewati pemeriksaan exec kecuali `--allow-exec` ditetapkan; mode penulisan menolak rencana yang memuat SecretRef/penyedia exec kecuali `--allow-exec` ditetapkan.

    Untuk detail kontrak target/jalur yang ketat dan aturan penolakan yang tepat, lihat [Kontrak Rencana Penerapan Rahasia](/id/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Kebijakan keamanan satu arah

<Warning>
OpenClaw sengaja tidak menulis cadangan rollback yang memuat nilai rahasia historis dalam teks biasa.
</Warning>

Model keamanan:

- Prapemeriksaan harus berhasil sebelum mode penulisan.
- Aktivasi runtime divalidasi sebelum commit.
- Penerapan memperbarui file menggunakan penggantian file atomik dan pemulihan upaya terbaik jika terjadi kegagalan.

## Catatan kompatibilitas autentikasi lama

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan autentikasi lama dalam teks biasa.

- Sumber kredensial runtime adalah snapshot dalam memori yang telah di-resolve.
- Entri statis lama `api_key` dihapus saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan UI web

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada dalam mode formulir.

## Terkait

- [Autentikasi](/id/gateway/authentication) - penyiapan autentikasi
- [CLI: rahasia](/id/cli/secrets) - perintah CLI
- [SecretRef Vault](/id/plugins/vault) - penyiapan penyedia HashiCorp Vault
- [Variabel Lingkungan](/id/help/environment) - presedensi lingkungan
- [Cakupan Kredensial SecretRef](/id/reference/secretref-credential-surface) - cakupan kredensial
- [Kontrak Rencana Penerapan Rahasia](/id/gateway/secrets-plan-contract) - detail kontrak rencana
- [Keamanan](/id/gateway/security) - postur keamanan
