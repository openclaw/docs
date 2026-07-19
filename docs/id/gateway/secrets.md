---
read_when:
    - Mengonfigurasi SecretRefs untuk kredensial penyedia dan ref `auth-profiles.json`
    - Mengoperasikan pemuatan ulang, audit, konfigurasi, dan penerapan rahasia secara aman dalam produksi
    - Memahami penghentian cepat saat startup, pemfilteran permukaan tidak aktif, dan perilaku konfigurasi terakhir yang diketahui berfungsi baik
sidebarTitle: Secrets management
summary: 'Manajemen rahasia: kontrak SecretRef, perilaku snapshot runtime, dan penghapusan aman satu arah'
title: Manajemen rahasia
x-i18n:
    generated_at: "2026-07-19T04:56:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17076666f1b26c379436792704575a171e183343a62a9a6b4e2ece17ec8d10d0
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw mendukung SecretRef aditif sehingga kredensial yang didukung tidak perlu disimpan sebagai teks biasa dalam konfigurasi.

<Note>
Teks biasa tetap berfungsi. SecretRef bersifat opsional untuk setiap kredensial.
</Note>

<Warning>
Kredensial teks biasa tetap dapat dibaca agen jika berada dalam file yang dapat diperiksa agen, termasuk `openclaw.json`, `auth-profiles.json`, `.env`, atau file `agents/*/agent/models.json` yang dihasilkan. SecretRef hanya mengurangi radius dampak lokal tersebut setelah setiap kredensial yang didukung dimigrasikan dan `openclaw secrets audit --check` melaporkan tidak ada sisa teks biasa.
</Warning>

## Model runtime

- Rahasia diresolusikan ke dalam snapshot runtime di memori, secara langsung selama aktivasi, bukan secara tertunda pada jalur permintaan.
- Startup dingin Gateway mengisolasi kegagalan SecretRef yang dapat dicoba ulang ke pemilik non-Gateway yang diketahui jika pemilik tersebut mendukung isolasi. Kelas pemilik yang dipetakan mencakup penyedia model dan Skills, penyedia media/TTS/Cron, profil autentikasi yang memenuhi syarat, memori per agen, SSH sandbox, akun saluran, dan rute Plugin yang dideklarasikan dalam manifes. Gateway dimulai, mencatat pemilik sebagai telah dikonfigurasi tetapi tidak tersedia, dan mengeluarkan peringatan degradasi yang telah disamarkan. Autentikasi ingress Gateway, referensi atau nilai hasil resolusi yang secara struktural tidak valid, pemilik yang gagal secara tertutup, dan referensi yang pemilik runtimenya tidak dipetakan tetap menggagalkan startup.
- Pemuatan ulang memvalidasi setiap pemilik yang dipetakan secara independen, lalu menerbitkan satu snapshot atomik. Pemilik yang sehat diperbarui. Pemilik gagal yang memenuhi syarat mempertahankan nilai terakhir yang diketahui baik dan menjadi kedaluwarsa hanya jika identitas referensinya, definisi penyedia, dan kontrak lengkap pemilik non-rahasia tidak berubah; pemilik gagal yang berubah atau baru menjadi dingin. Kegagalan ketat menolak pemuatan ulang dan mempertahankan snapshot aktif.
- Pelanggaran kebijakan (misalnya profil autentikasi mode OAuth yang digabungkan dengan input SecretRef) menggagalkan aktivasi sebelum pertukaran runtime.
- Permintaan runtime hanya membaca snapshot aktif di memori. Kredensial SecretRef penyedia model diteruskan melalui penyimpanan autentikasi dan opsi streaming sebagai sentinel lokal proses hingga egress. Jalur pengiriman keluar (pengiriman balasan/utas Discord, pengiriman tindakan Telegram) juga membaca snapshot tersebut dan tidak meresolusikan ulang referensi untuk setiap pengiriman.

Hal ini mencegah gangguan penyedia rahasia memengaruhi jalur permintaan sibuk.

Perlindungan ingress Gateway, konfigurasi atau nilai hasil resolusi yang secara struktural tidak valid, pelanggaran kebijakan, dan kepemilikan yang tidak diketahui tetap gagal secara tertutup. Pemilik yang diisolasi tidak pernah beralih ke sumber kredensial berprioritas lebih rendah.

## Injeksi saat egress (sentinel)

Untuk kredensial penyedia model yang didukung oleh SecretRef, OpenClaw membuat sentinel buram lokal proses selama resolusi autentikasi model. Karena itu, penyimpanan autentikasi, opsi streaming, konfigurasi SDK, log, objek kesalahan, dan sebagian besar introspeksi runtime melihat nilai seperti `oc-sent-v1-...`, bukan kredensial penyedia. Fetch model yang dilindungi dan probe kesehatan penyedia lokal terkelola mengganti sentinel yang diketahui dalam nilai URL dan header tepat sebelum setiap permintaan meninggalkan proses.

Nilai berbentuk sentinel yang tidak diketahui gagal secara tertutup sebelum aktivitas jaringan. OpenClaw menolak mengirim permintaan alih-alih meneruskan sentinel yang belum diresolusikan ke penyedia. Nilai rahasia yang telah diresolusikan juga didaftarkan untuk penyamaran log berdasarkan kecocokan nilai persis sebagai langkah pertahanan berlapis.

Adaptor penyedia menggunakan titik injeksi paling akhir yang didukung SDK-nya:

- SDK dengan opsi fetch kustom menerima fetch terlindungi milik OpenClaw sehingga SDK tetap mempertahankan sentinel.
- SDK tanpa opsi fetch kustom membuka sentinel tepat sebelum pembuatan klien. Streaming penyedia milik Plugin dan harness agen membuka sentinel pada serah-terima terakhir yang dimiliki inti karena transportasi tersebut tidak menggunakan fetch terlindungi milik OpenClaw.

Sentinel mengurangi paparan teks biasa di sepanjang rantai pemanggilan model, tetapi bukan merupakan isolasi proses. Nilai sebenarnya tetap ada dalam memori proses yang sama dan muncul pada batas adaptor terakhir. Kredensial lingkungan biasa yang tidak dikonfigurasi melalui SecretRef tetap berupa teks biasa dan berada di luar mekanisme ini.

Atur `OPENCLAW_SECRET_SENTINELS=off` (juga menerima `0` atau `false`, tanpa membedakan huruf besar-kecil) untuk menonaktifkan pembuatan sentinel selama respons insiden atau pemecahan masalah kompatibilitas. Sakelar penghenti ini tidak menonaktifkan pendaftaran penyamaran berdasarkan kecocokan nilai persis.

## Batas akses agen

SecretRef mencegah kredensial dipersistenkan dalam konfigurasi dan file model yang dihasilkan, tetapi bukan merupakan batas isolasi proses. Kredensial teks biasa yang dibiarkan tersimpan pada disk di jalur yang dapat dibaca agen tetap dapat dibaca melalui alat file atau shell, sehingga melewati penyamaran tingkat API.

Untuk penerapan produksi yang mencakup file yang dapat diakses agen, anggap migrasi selesai hanya jika semua kondisi berikut terpenuhi:

- Kredensial yang didukung menggunakan SecretRef, bukan nilai teks biasa.
- Sisa teks biasa lama telah dibersihkan dari `openclaw.json`, `auth-profiles.json`, `.env`, dan file `models.json` yang dihasilkan.
- `openclaw secrets audit --check` bersih setelah migrasi.
- Semua kredensial yang belum didukung atau yang dirotasi dilindungi oleh isolasi OS, isolasi kontainer, atau proksi kredensial eksternal.

Inilah sebabnya alur audit/konfigurasi/penerapan merupakan gerbang migrasi keamanan, bukan sekadar alat bantu praktis.

<Warning>
SecretRef tidak membuat sembarang file yang dapat dibaca menjadi aman. Cadangan, salinan konfigurasi, katalog model lama yang dihasilkan, dan kelas kredensial yang belum didukung tetap merupakan rahasia produksi sampai dihapus, dipindahkan ke luar batas kepercayaan agen, atau diisolasi secara terpisah.
</Warning>

## Pemfilteran permukaan aktif

SecretRef hanya divalidasi pada permukaan yang secara efektif aktif:

- **Permukaan yang diaktifkan**: kegagalan yang dapat dicoba ulang untuk pemilik yang dipetakan dan dapat diisolasi memasuki degradasi dingin atau kedaluwarsa. Kegagalan yang ketat, gagal secara tertutup, diperlukan Gateway, atau tidak dipetakan akan memblokir startup/pemuatan ulang.
- **Permukaan tidak aktif**: referensi yang belum diresolusikan tidak memblokir startup/pemuatan ulang; referensi tersebut mengeluarkan diagnostik `SECRETS_REF_IGNORED_INACTIVE_SURFACE` yang tidak fatal.

<Accordion title="Contoh permukaan tidak aktif">
- Entri saluran/akun yang dinonaktifkan.
- Kredensial saluran tingkat atas yang tidak diwarisi oleh akun aktif mana pun.
- Permukaan alat/fitur yang dinonaktifkan.
- Kunci khusus penyedia pencarian web yang tidak dipilih oleh `tools.web.search.provider`. Dalam mode otomatis (penyedia tidak ditetapkan), kunci diperiksa berdasarkan prioritas untuk deteksi otomatis hingga salah satunya berhasil diresolusikan; setelah pemilihan, kunci penyedia yang tidak dipilih menjadi tidak aktif.
- Materi autentikasi SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, serta penggantian per agen) hanya aktif ketika backend sandbox efektif adalah `ssh` dan mode sandbox bukan `off`, untuk agen default atau agen yang diaktifkan.
- SecretRef `gateway.remote.token` / `gateway.remote.password` aktif jika salah satu kondisi berikut terpenuhi:
  - `gateway.mode=remote`
  - `gateway.remote.url` dikonfigurasi
  - `gateway.tailscale.mode` adalah `serve` atau `funnel`
  - Dalam mode lokal tanpa permukaan jarak jauh tersebut: `gateway.remote.token` aktif ketika autentikasi token dapat diprioritaskan dan tidak ada token lingkungan/autentikasi yang dikonfigurasi; `gateway.remote.password` hanya aktif ketika autentikasi kata sandi dapat diprioritaskan dan tidak ada kata sandi lingkungan/autentikasi yang dikonfigurasi.
- SecretRef `gateway.auth.token` tidak aktif untuk resolusi autentikasi startup ketika `OPENCLAW_GATEWAY_TOKEN` ditetapkan karena input token lingkungan diprioritaskan untuk runtime tersebut.

</Accordion>

## Diagnostik permukaan autentikasi Gateway

Ketika SecretRef ditetapkan pada `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, atau `gateway.remote.password`, startup/pemuatan ulang Gateway mencatat status permukaan dengan kode `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: SecretRef merupakan bagian dari permukaan autentikasi efektif dan harus diresolusikan.
- `inactive`: permukaan autentikasi lain diprioritaskan, atau autentikasi jarak jauh dinonaktifkan/tidak aktif.

Entri log mencakup alasan yang digunakan oleh kebijakan permukaan aktif.

## Prapemeriksaan referensi saat onboarding

Dalam onboarding interaktif, memilih penyimpanan SecretRef menjalankan validasi prapemeriksaan sebelum menyimpan:

- Referensi lingkungan: memvalidasi nama variabel lingkungan dan memastikan nilai yang tidak kosong terlihat selama penyiapan.
- Referensi penyedia (`file` atau `exec`): memvalidasi pemilihan penyedia, meresolusikan `id`, dan memeriksa jenis nilai hasil resolusi.
- Alur mulai cepat: ketika `gateway.auth.token` sudah berupa SecretRef, onboarding meresolusikannya sebelum bootstrap probe/dasbor (untuk referensi `env`, `file`, dan `exec`) menggunakan gerbang gagal-cepat yang sama.

Kegagalan validasi menampilkan kesalahan dan memungkinkan Anda mencoba kembali.

## Kontrak SecretRef

Satu bentuk objek di mana pun:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    String singkatan juga diterima pada bidang SecretInput:

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
    - Escape RFC 6901 dalam segmen: `~` menjadi `~0`, `/` menjadi `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validasi:

    - `provider` harus cocok dengan `^[a-z][a-z0-9_-]{0,63}$`
    - `id` harus cocok dengan `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (mendukung selektor seperti `secret#json_key`)
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

<Accordion title="Penyedia lingkungan">
- Daftar izin nama persis opsional melalui `allowlist`.
- Nilai lingkungan yang tidak ada atau kosong menggagalkan resolusi.

</Accordion>

<Accordion title="Penyedia file">
- Membaca file lokal di `path`.
- `mode: "json"` (default) mengharapkan payload objek JSON dan menguraikan `id` sebagai pointer JSON.
- `mode: "singleValue"` mengharapkan id referensi `"value"` dan mengembalikan isi file mentah (baris baru di akhir dihapus).
- Jalur harus lolos pemeriksaan kepemilikan/izin; `timeoutMs` (default 5000) dan `maxBytes` (default 1 MiB) membatasi pembacaan.
- Windows gagal secara tertutup: jika verifikasi ACL tidak tersedia untuk jalur tersebut, penguraian gagal. Khusus untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan.

</Accordion>

<Accordion title="Penyedia eksekusi">
- Menjalankan jalur absolut biner yang dikonfigurasi secara langsung, tanpa shell.
- Secara default, `command` harus berupa file biasa, bukan symlink. Tetapkan `allowSymlinkCommand: true` untuk mengizinkan jalur perintah symlink (misalnya shim Homebrew), dan pasangkan dengan `trustedDirs` (misalnya `["/opt/homebrew"]`) agar hanya jalur pengelola paket yang memenuhi syarat.
- Mendukung `timeoutMs` (default 5000), `noOutputTimeoutMs` (default sama dengan `timeoutMs`), `maxOutputBytes` (default 1 MiB), daftar izin `env`/`passEnv`, dan `trustedDirs`.
- `jsonOnly` secara default bernilai `true`. Dengan `jsonOnly: false` dan satu id yang diminta, stdout biasa non-JSON diterima sebagai nilai id tersebut.
- Windows gagal secara tertutup: jika verifikasi ACL tidak tersedia untuk jalur perintah, penguraian gagal. Khusus untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan.
- Penyedia eksekusi yang dikelola Plugin dapat menggunakan `pluginIntegration` sebagai pengganti `command`/`args` yang disalin. OpenClaw menguraikan detail perintah saat ini dari manifes plugin yang terinstal selama proses mulai/muat ulang; jika plugin dinonaktifkan, dihapus, tidak tepercaya, atau tidak lagi mendeklarasikan integrasi tersebut, SecretRef aktif pada penyedia itu gagal secara tertutup.

Payload permintaan (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload respons (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Kesalahan per id opsional:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` adalah diagnostik opsional yang dapat dibaca mesin. OpenClaw menampilkan
kode yang dikenali, yaitu `NOT_FOUND` dan `AMBIGUOUS_DUPLICATE_KEY`, bersama penyedia dan id referensi. Kode lain
dan bidang berformat bebas seperti `message` diterima untuk kompatibilitas protocol-v1,
tetapi tidak ditampilkan karena keluaran pengurai dapat memuat materi kredensial.

</Accordion>

## Kunci API berbasis file

Jangan masukkan string `file:...` ke dalam blok `env` konfigurasi. Blok tersebut bersifat literal dan tidak dapat ditimpa, sehingga `file:...` tidak pernah diuraikan di sana.

Sebagai gantinya, gunakan SecretRef file pada bidang kredensial yang didukung:

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

Untuk `mode: "singleValue"`, `id` SecretRef adalah `"value"`. Untuk `mode: "json"`, gunakan pointer JSON absolut seperti `"/providers/xai/apiKey"`.

Lihat [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) untuk bidang yang menerima SecretRef.

## Contoh integrasi eksekusi

Untuk panduan khusus 1Password yang mencakup akun layanan, skill agen bawaan, dan pemecahan masalah, lihat [1Password](/id/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // diperlukan untuk biner yang di-symlink oleh Homebrew
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
    Gunakan pembungkus pengurai untuk memetakan id SecretRef ke kunci item Bitwarden Secrets Manager. Repositori menyertakan `scripts/secrets/openclaw-bws-resolver.mjs`; instal atau salin ke jalur tepercaya absolut pada host yang menjalankan Gateway.

    Persyaratan:

    - CLI Bitwarden Secrets Manager (`bws`) terinstal pada host Gateway.
    - `BWS_ACCESS_TOKEN` tersedia bagi layanan Gateway.
    - `PATH` diteruskan ke pengurai, atau `BWS_BIN` ditetapkan ke jalur absolut biner `bws`.
    - `BWS_SERVER_URL` ditetapkan dalam lingkungan saat menggunakan instans Bitwarden yang dihosting sendiri.

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

    Pengurai mengelompokkan id yang diminta, menjalankan `bws secret list`, dan mengembalikan nilai untuk bidang `key` rahasia yang cocok. Gunakan kunci yang memenuhi kontrak id SecretRef eksekusi, seperti `openclaw/providers/openai/apiKey`; kunci bergaya variabel lingkungan dengan garis bawah ditolak sebelum pengurai dijalankan. Jika lebih dari satu rahasia Bitwarden yang terlihat menggunakan kunci yang diminta, pengurai menggagalkan id tersebut sebagai ambigu alih-alih menebak. Setelah memperbarui konfigurasi, verifikasi jalur pengurai:

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
            allowSymlinkCommand: true, // diperlukan untuk biner yang di-symlink oleh Homebrew
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
    Gunakan pembungkus pengurai kecil untuk memetakan id SecretRef secara langsung ke entri `pass`. Simpan ini sebagai berkas yang dapat dieksekusi pada jalur absolut yang lolos pemeriksaan jalur penyedia eksekusi Anda, misalnya `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node` menguraikan `node` dari `PATH` proses pengurai, jadi sertakan `PATH` dalam `passEnv`. Jika `pass` tidak berada di `PATH` tersebut, tetapkan `PASS_BIN` di lingkungan induk dan sertakan juga dalam `passEnv`:

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

    Kemudian konfigurasikan penyedia eksekusi dan arahkan `apiKey` ke jalur entri `pass`:

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

    Simpan rahasia pada baris pertama entri `pass`, atau sesuaikan pembungkus untuk mengembalikan seluruh keluaran `pass show`. Setelah memperbarui konfigurasi, verifikasi audit statis dan jalur pengurai eksekusi:

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
            allowSymlinkCommand: true, // diperlukan untuk biner yang di-symlink oleh Homebrew
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

Variabel lingkungan server MCP yang dikonfigurasi melalui `plugins.entries.acpx.config.mcpServers` menerima SecretInput, sehingga kunci API dan token tidak tersimpan dalam konfigurasi teks biasa:

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

Nilai string teks biasa tetap berfungsi. Referensi templat env seperti `${MCP_SERVER_API_KEY}` dan objek SecretRef diresolusi selama aktivasi gateway, sebelum proses server MCP dimulai. Seperti pada permukaan SecretRef lainnya, referensi yang tidak dapat diresolusi hanya memblokir aktivasi ketika plugin `acpx` secara efektif aktif.

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

- OpenClaw meresolusi referensi ini selama aktivasi sandbox, bukan secara malas pada setiap panggilan SSH.
- Nilai yang telah diresolusi ditulis ke direktori sementara dengan izin berkas yang ketat (`0o600`) dan digunakan dalam konfigurasi SSH yang dihasilkan.
- Jika backend sandbox efektif bukan `ssh` (atau mode sandbox adalah `off`), referensi ini tetap tidak aktif dan tidak memblokir proses mulai.

## Permukaan kredensial yang didukung

Kredensial kanonis yang didukung dan tidak didukung tercantum dalam [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).

<Note>
Kredensial yang dibuat saat runtime atau berotasi serta materi penyegaran OAuth sengaja dikecualikan dari resolusi SecretRef hanya-baca.
</Note>

## Perilaku dan urutan prioritas yang diwajibkan

- Kolom tanpa referensi: tidak berubah.
- Kolom dengan referensi: wajib pada permukaan aktif selama aktivasi.
- Jika teks biasa dan referensi sama-sama tersedia, referensi lebih diprioritaskan pada jalur prioritas yang didukung.
- Sentinel redaksi `__OPENCLAW_REDACTED__` dicadangkan untuk redaksi/pemulihan konfigurasi internal dan ditolak sebagai data konfigurasi literal yang dikirimkan.

Sinyal peringatan dan audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (peringatan runtime)
- `REF_SHADOWED` (temuan audit ketika kredensial `auth-profiles.json` lebih diprioritaskan daripada referensi `openclaw.json`)

Kompatibilitas Google Chat: `serviceAccountRef` lebih diprioritaskan daripada `serviceAccount` dalam teks biasa; nilai teks biasa diabaikan setelah referensi yang sejajar ditetapkan.

## Pemicu aktivasi

Aktivasi rahasia berjalan saat:

- Proses mulai (prapemeriksaan serta aktivasi akhir)
- Jalur penerapan langsung pemuatan ulang konfigurasi
- Jalur pemeriksaan mulai ulang pemuatan ulang konfigurasi
- Pemuatan ulang manual melalui `secrets.reload`
- Prapemeriksaan RPC penulisan konfigurasi Gateway (`config.set` / `config.apply` / `config.patch`), yang memvalidasi SecretRef permukaan aktif dalam muatan konfigurasi yang dikirimkan sebelum menyimpan pengeditan

Kontrak aktivasi:

- Keberhasilan menukar snapshot secara atomik.
- Kegagalan proses mulai yang ketat membatalkan proses mulai Gateway.
- Selama proses mulai dingin, kegagalan resolusi yang dapat dicoba ulang untuk pemilik non-Gateway yang dipetakan dan dapat diisolasi dapat memublikasikan snapshot dengan pemilik tersebut dikonfigurasi sebagai tidak tersedia. Permintaan untuk pemilik tersebut gagal dengan `SECRET_SURFACE_UNAVAILABLE`; pemilik penyedia model tidak beralih ke kredensial lingkungan atau profil autentikasi setelah referensi eksplisit gagal.
- Pemuatan ulang dan pemeriksaan mulai ulang mengisolasi pemilik terpetakan yang memenuhi syarat. Identitas referensi yang tidak berubah, dengan definisi penyedia yang tidak berubah dan kontrak pemilik non-rahasia lengkap yang tidak berubah, mempertahankan nilai tepat terakhir yang diketahui baik sebagai usang; referensi yang berubah atau baru dikonfigurasi tetapi tidak dapat diresolusi dipublikasikan dalam kondisi dingin hanya untuk pemilik tersebut. Kegagalan pemuatan ulang yang ketat mempertahankan snapshot yang sebelumnya aktif.
- `config.set`, `config.apply`, dan `config.patch` menerima referensi yang tidak dapat diresolusi tetapi valid secara sintaksis untuk pemilik yang dapat diisolasi dan mengembalikan laporan `degradedSecretOwners` yang telah disunting. Autentikasi ingress Gateway, konfigurasi atau nilai hasil resolusi yang secara struktural tidak valid, pelanggaran kebijakan, dan pemilik yang tidak dikenal tetap ditolak sebelum mutasi disk.
- Pemilik sejawat yang sehat diresolusi dan dipublikasikan secara normal meskipun pemilik lain dalam kondisi dingin atau usang.
- Memberikan token kanal eksplisit per panggilan kepada panggilan pembantu/alat keluar tidak memicu aktivasi SecretRef; titik aktivasi tetap pada proses mulai, pemuatan ulang, dan `secrets.reload` eksplisit.

## Sinyal terdegradasi dan pulih

Ketika aktivasi saat pemuatan ulang gagal setelah keadaan sehat, OpenClaw memasuki keadaan rahasia terdegradasi, dengan memancarkan peristiwa sistem satu kali dan kode log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Perilaku:

- Terdegradasi: pemilik yang sehat disegarkan, pemilik usang mempertahankan nilai terakhir yang diketahui baik, dan pemilik dingin tetap tidak tersedia.
- Pulih: dipancarkan sekali setelah aktivasi berikutnya berhasil.
- Kegagalan berulang saat sudah terdegradasi mencatat peringatan, tetapi tidak memancarkan ulang peristiwa tersebut.
- Kegagalan proses mulai yang ketat tidak pernah memancarkan peristiwa terdegradasi karena runtime tidak pernah menjadi aktif. Proses mulai yang berhasil dengan pemilik dingin mencatat degradasi pemilik, tetapi tidak memancarkan peristiwa pemuat ulang.
- Kegagalan proses mulai dan pemuatan ulang yang dibatasi pada referensi memancarkan peringatan terstruktur `SECRETS_DEGRADED` untuk setiap pemilik yang terpengaruh. Gangguan pada cakupan penyedia memancarkan satu peringatan `SECRETS_PROVIDER_DEGRADED` berisi penyedia dan daftar lengkap pemilik yang terpengaruh, alih-alih mengulangi kegagalan penyedia untuk setiap pemilik. Peringatan mencakup alasan yang telah disunting, keadaan pemilik `cold` atau `stale`, dan petunjuk mencoba ulang `openclaw secrets reload`. Peringatan tidak pernah menyertakan nilai hasil resolusi atau ID SecretRef.
- `openclaw doctor` mencantumkan pemilik dingin dan usang beserta jalur konfigurasi yang terpengaruh, alasan yang telah disunting, dan panduan mencoba ulang.

## Resolusi jalur perintah

Jalur perintah dapat memilih untuk menggunakan resolusi SecretRef yang didukung melalui RPC snapshot gateway. Dua perilaku umum berlaku:

<Tabs>
  <Tab title="Jalur perintah ketat">
    Misalnya jalur memori jarak jauh `openclaw memory` dan `openclaw qr --remote` ketika memerlukan referensi rahasia bersama jarak jauh. Jalur ini membaca dari snapshot aktif dan segera gagal ketika SecretRef yang diwajibkan tidak tersedia.
  </Tab>
  <Tab title="Jalur perintah hanya-baca">
    Misalnya `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, serta alur perbaikan doctor/konfigurasi hanya-baca. Jalur ini juga mengutamakan snapshot aktif, tetapi mengalami degradasi alih-alih membatalkan ketika SecretRef yang ditargetkan tidak tersedia.

    Perilaku hanya-baca:

    - Ketika gateway berjalan, perintah ini terlebih dahulu membaca dari snapshot aktif.
    - Jika resolusi gateway tidak lengkap atau gateway tidak tersedia, perintah ini mencoba fallback lokal yang ditargetkan untuk permukaan perintah tersebut.
    - Jika SecretRef yang ditargetkan masih tidak tersedia, perintah dilanjutkan dengan keluaran hanya-baca yang terdegradasi dan diagnostik eksplisit bahwa referensi telah dikonfigurasi tetapi tidak tersedia dalam jalur perintah ini.
    - Perilaku terdegradasi ini hanya berlaku secara lokal pada perintah; perilaku ini tidak memperlemah proses mulai runtime, pemuatan ulang, atau jalur pengiriman/autentikasi.

  </Tab>
</Tabs>

Catatan lainnya:

- Penyegaran snapshot setelah rotasi rahasia backend ditangani oleh `openclaw secrets reload`.
- Metode RPC Gateway yang digunakan oleh jalur perintah ini: `secrets.resolve`.

## Alur kerja audit dan konfigurasi

Alur operator default:

<Steps>
  <Step title="Audit keadaan saat ini">
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

Jangan anggap migrasi selesai hingga audit ulang bersih. Jika audit masih melaporkan nilai teks biasa yang tersimpan, risiko akses agen tetap ada meskipun API runtime mengembalikan nilai yang telah disunting.

Jika Anda menyimpan rencana alih-alih menerapkannya selama `configure`, terapkan rencana tersimpan tersebut dengan `openclaw secrets apply --from <plan-path>` sebelum audit ulang.

<AccordionGroup>
  <Accordion title="audit rahasia">
    Temuan mencakup:

    - Nilai teks biasa yang tersimpan (`openclaw.json`, `auth-profiles.json`, `.env`, dan `agents/*/agent/models.json` yang dihasilkan).
    - Residu header penyedia sensitif dalam teks biasa pada entri `models.json` yang dihasilkan.
    - Referensi yang tidak dapat diresolusi.
    - Pembayangan prioritas (`auth-profiles.json` lebih diprioritaskan daripada referensi `openclaw.json`).
    - Residu lama (`auth.json`, pengingat OAuth).

    Catatan exec: secara default, audit melewati pemeriksaan kemampuan resolusi SecretRef exec untuk menghindari efek samping perintah. Gunakan `openclaw secrets audit --allow-exec` untuk mengeksekusi penyedia exec selama audit.

    Catatan residu header: deteksi header penyedia sensitif berbasis heuristik nama (nama header autentikasi/kredensial umum dan fragmen seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

  </Accordion>
  <Accordion title="konfigurasi rahasia">
    Pembantu interaktif yang:

    - Mengonfigurasi `secrets.providers` terlebih dahulu (`env`/`file`/`exec`, tambah/edit/hapus).
    - Memungkinkan Anda memilih kolom yang didukung dan mengandung rahasia dalam `openclaw.json`, beserta `auth-profiles.json` untuk satu cakupan agen.
    - Dapat membuat pemetaan `auth-profiles.json` baru secara langsung dalam pemilih target.
    - Mengambil detail SecretRef (`source`, `provider`, `id`).
    - Menjalankan resolusi prapemeriksaan dan dapat langsung menerapkannya.

    Catatan exec: prapemeriksaan melewati pemeriksaan SecretRef exec kecuali `--allow-exec` ditetapkan. Jika Anda menerapkan langsung dari `configure --apply` dan rencana mencakup referensi/penyedia exec, pertahankan `--allow-exec` tetap ditetapkan untuk langkah penerapan juga.

    Mode yang berguna:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Default penerapan `configure`:

    - Menghapus kredensial statis yang cocok dari `auth-profiles.json` untuk penyedia yang ditargetkan.
    - Menghapus entri statis lama `api_key` dari `auth.json`.
    - Menghapus baris rahasia yang diketahui dan cocok dari berkas `.env` pada keadaan efektif dan konfigurasi aktif (dideduplikasi ketika kedua jalur cocok).

  </Accordion>
  <Accordion title="penerapan rahasia">
    Terapkan rencana tersimpan:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Catatan exec: uji coba melewati pemeriksaan exec kecuali `--allow-exec` ditetapkan; mode tulis menolak rencana yang berisi SecretRef/penyedia exec kecuali `--allow-exec` ditetapkan.

    Untuk detail kontrak target/jalur yang ketat dan aturan penolakan yang tepat, lihat [Kontrak Rencana Penerapan Rahasia](/id/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Kebijakan keamanan satu arah

<Warning>
OpenClaw sengaja tidak menulis cadangan rollback yang berisi nilai rahasia teks biasa historis.
</Warning>

Model keamanan:

- Prapemeriksaan harus berhasil sebelum mode tulis.
- Aktivasi runtime divalidasi sebelum commit.
- Penerapan memperbarui berkas menggunakan penggantian berkas atomik dan upaya pemulihan terbaik jika terjadi kegagalan.

## Catatan kompatibilitas autentikasi lama

Untuk kredensial statis, runtime tidak lagi bergantung pada penyimpanan autentikasi lama dalam teks biasa.

- Sumber kredensial runtime adalah snapshot dalam memori yang telah di-resolve.
- Entri statis lama `api_key` dibersihkan saat ditemukan.
- Perilaku kompatibilitas terkait OAuth tetap terpisah.

## Catatan UI web

Beberapa union SecretInput lebih mudah dikonfigurasi dalam mode editor mentah daripada dalam mode formulir.

## Terkait

- [Autentikasi](/id/gateway/authentication) - penyiapan autentikasi
- [CLI: rahasia](/id/cli/secrets) - perintah CLI
- [SecretRef Vault](/id/plugins/vault) - penyiapan penyedia HashiCorp Vault
- [Variabel Lingkungan](/id/help/environment) - prioritas lingkungan
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) - permukaan kredensial
- [Kontrak Rencana Penerapan Rahasia](/id/gateway/secrets-plan-contract) - detail kontrak rencana
- [Keamanan](/id/gateway/security) - postur keamanan
