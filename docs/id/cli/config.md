---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara non-interaktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-06-27T17:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

Helper konfigurasi untuk pengeditan noninteraktif di `openclaw.json`: get/set/patch/unset/file/schema/validate nilai berdasarkan path dan cetak file konfigurasi aktif. Jalankan tanpa subperintah untuk membuka wizard konfigurasi (sama seperti `openclaw configure`).

<Note>
Saat `OPENCLAW_NIX_MODE=1`, OpenClaw memperlakukan `openclaw.json` sebagai tidak dapat diubah. Perintah baca-saja seperti `config get`, `config file`, `config schema`, dan `config validate` tetap berfungsi, tetapi penulis konfigurasi akan menolak. Agent sebaiknya mengedit sumber Nix untuk instalasi tersebut; untuk distribusi pihak pertama nix-openclaw, gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) dan atur nilai di bawah `programs.openclaw.config` atau `instances.<name>.config`.
</Note>

## Opsi root

<ParamField path="--section <section>" type="string">
  Filter bagian penyiapan terpandu yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah.
</ParamField>

Bagian terpandu yang didukung: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Contoh

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Cetak skema JSON yang dihasilkan untuk `openclaw.json` ke stdout sebagai JSON.

<AccordionGroup>
  <Accordion title="What it includes">
    - Skema konfigurasi root saat ini, ditambah field string root `$schema` untuk tooling editor.
    - Metadata dokumentasi field `title` dan `description` yang digunakan oleh Control UI.
    - Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok tersedia.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumentasi yang sama saat dokumentasi field yang cocok tersedia.
    - Metadata skema Plugin + channel live berbasis upaya terbaik saat manifes runtime dapat dimuat.
    - Skema fallback yang bersih bahkan saat konfigurasi saat ini tidak valid.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` mengembalikan satu path konfigurasi ternormalisasi dengan node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata petunjuk UI yang cocok, dan ringkasan anak langsung. Gunakan ini untuk penelusuran mendalam berbasis path di Control UI atau klien kustom.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe ke dalam file saat Anda ingin memeriksa atau memvalidasinya dengan alat lain:

```bash
openclaw config schema > openclaw.schema.json
```

### Path

Path menggunakan notasi titik atau bracket. Kutip path notasi bracket dalam contoh shell agar shell seperti zsh tidak memperluas `[0]` sebagai glob sebelum OpenClaw menerima path:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Gunakan indeks daftar agent untuk menargetkan agent tertentu:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Nilai

Nilai diurai sebagai JSON5 bila memungkinkan; jika tidak, nilai diperlakukan sebagai string. Gunakan `--strict-json` untuk mewajibkan penguraian JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON, bukan teks yang diformat untuk terminal.

<Note>
Penetapan objek mengganti path target secara default. Path map/list yang dilindungi dan umumnya menyimpan entri yang ditambahkan pengguna, seperti `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali Anda meneruskan `--replace`.
</Note>

Gunakan `--merge` saat menambahkan entri ke map tersebut:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya saat Anda memang ingin nilai yang diberikan menjadi nilai target lengkap.

## Mode `config set`

`openclaw config set` mendukung empat gaya penetapan:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Mode builder penyedia hanya menargetkan path `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
Penetapan SecretRef ditolak pada surface runtime-mutable yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook pengikatan thread Discord, dan JSON kredensial WhatsApp). Lihat [Surface Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Warning>

Penguraian batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran. `--strict-json` / `--json` tidak mengubah perilaku penguraian batch.

## `config patch`

Gunakan `config patch` saat Anda ingin menempelkan atau melakukan pipe patch berbentuk konfigurasi, alih-alih menjalankan banyak perintah `config set` berbasis path. Input adalah objek JSON5. Objek digabung secara rekursif, array dan nilai skalar mengganti nilai target, dan `null` menghapus path target.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Anda juga dapat melakukan pipe patch melalui stdin, yang berguna untuk skrip penyiapan jarak jauh:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Contoh patch:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Gunakan `--replace-path <path>` saat satu objek atau array harus menjadi tepat seperti nilai yang diberikan, alih-alih dipatch secara rekursif:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` menjalankan pemeriksaan skema dan keterpecahan SecretRef tanpa menulis. SecretRef berbasis exec dilewati secara default selama dry-run; tambahkan `--allow-exec` saat Anda memang ingin dry-run menjalankan perintah penyedia.

Mode path/nilai JSON tetap didukung untuk SecretRef dan penyedia:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag builder penyedia

Target builder penyedia harus menggunakan `secrets.providers.<alias>` sebagai path.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (dapat diulang)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (wajib)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (wajib)
    - `--provider-arg <arg>` (dapat diulang)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (dapat diulang)
    - `--provider-pass-env <ENV_VAR>` (dapat diulang)
    - `--provider-trusted-dir <path>` (dapat diulang)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Contoh penyedia exec yang diperkuat:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Gunakan `--dry-run` untuk memvalidasi perubahan tanpa menulis `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Dry-run behavior">
    - Mode builder: menjalankan pemeriksaan keterpecahan SecretRef untuk ref/penyedia yang berubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi skema ditambah pemeriksaan keterpecahan SecretRef.
    - Validasi kebijakan juga berjalan untuk surface target SecretRef yang diketahui tidak didukung.
    - Pemeriksaan kebijakan mengevaluasi konfigurasi lengkap setelah perubahan, sehingga penulisan objek induk (misalnya mengatur `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
    - Gunakan `--allow-exec` dengan `--dry-run` untuk ikut serta dalam pemeriksaan SecretRef exec (ini dapat menjalankan perintah penyedia).
    - `--allow-exec` hanya untuk dry-run dan menghasilkan error jika digunakan tanpa `--dry-run`.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` mencetak laporan yang dapat dibaca mesin:

    - `ok`: apakah dry-run berhasil
    - `operations`: jumlah penetapan yang dievaluasi
    - `checks`: apakah pemeriksaan skema/resolvability dijalankan
    - `checks.resolvabilityComplete`: apakah pemeriksaan resolvability berjalan hingga selesai (false saat ref exec dilewati)
    - `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
    - `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak disetel
    - `errors`: kegagalan missing-path, skema, atau resolvability terstruktur saat `ok=false`

  </Accordion>
</AccordionGroup>

### Bentuk output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Contoh berhasil">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Contoh gagal">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Jika dry-run gagal">
    - `config schema validation failed`: bentuk konfigurasi setelah perubahan tidak valid; perbaiki jalur/nilai atau bentuk objek penyedia/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial itu kembali ke input plaintext/string dan gunakan SecretRefs hanya pada permukaan yang didukung.
    - `SecretRef assignment(s) could not be resolved`: penyedia/ref yang direferensikan saat ini tidak dapat di-resolve (variabel env hilang, pointer file tidak valid, kegagalan penyedia exec, atau ketidakcocokan penyedia/sumber).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi resolvability exec.
    - Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

  </Accordion>
</AccordionGroup>

## Keamanan penulisan

`openclaw config set` dan penulis konfigurasi milik OpenClaw lainnya memvalidasi konfigurasi penuh setelah perubahan sebelum menyimpannya ke disk. Jika payload baru gagal validasi skema atau terlihat seperti penimpaan destruktif, konfigurasi aktif dibiarkan tetap seperti semula dan payload yang ditolak disimpan di sebelahnya sebagai `openclaw.json.rejected.*`.

<Warning>
Jalur konfigurasi aktif harus berupa file biasa. Tata letak `openclaw.json` yang berupa symlink tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung ke file sebenarnya.
</Warning>

Utamakan penulisan CLI untuk edit kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki bentuk konfigurasi lengkap:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan langsung melalui editor tetap diperbolehkan, tetapi Gateway yang berjalan memperlakukannya sebagai tidak tepercaya hingga tervalidasi. Edit langsung yang tidak valid menggagalkan startup atau dilewati oleh hot reload; Gateway tidak menulis ulang `openclaw.json`. Jalankan `openclaw doctor --fix` untuk memperbaiki konfigurasi berprefiks/tertimpah atau memulihkan salinan terakhir yang diketahui baik. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config).

Pemulihan seluruh file dicadangkan untuk perbaikan doctor. Perubahan skema Plugin atau ketidaksesuaian `minHostVersion` tetap ditampilkan jelas alih-alih me-rollback pengaturan pengguna yang tidak terkait seperti konfigurasi model, penyedia, profil auth, channel, eksposur gateway, alat, memori, browser, atau Cron.

## Subperintah

- `config file`: Cetak jalur file konfigurasi aktif (di-resolve dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Jalur harus merujuk ke file biasa, bukan symlink.

Mulai ulang gateway setelah edit.

## Validasi

Validasi konfigurasi saat ini terhadap skema aktif tanpa memulai gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal agar agen tertanam membandingkan konfigurasi aktif dengan dokumentasi saat Anda memvalidasi setiap perubahan dari terminal yang sama:

<Note>
Jika validasi sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix`. `openclaw chat` tidak melewati penjaga konfigurasi tidak valid.
</Note>

```bash
openclaw chat
```

Lalu di dalam TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Loop perbaikan umum:

<Steps>
  <Step title="Bandingkan dengan dokumentasi">
    Minta agen membandingkan konfigurasi Anda saat ini dengan halaman dokumentasi yang relevan dan menyarankan perbaikan terkecil.
  </Step>
  <Step title="Terapkan edit tertarget">
    Terapkan edit tertarget dengan `openclaw config set` atau `openclaw configure`.
  </Step>
  <Step title="Validasi ulang">
    Jalankan ulang `openclaw config validate` setelah setiap perubahan.
  </Step>
  <Step title="Doctor untuk masalah runtime">
    Jika validasi berhasil tetapi runtime masih tidak sehat, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk bantuan migrasi dan perbaikan.
  </Step>
</Steps>

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
