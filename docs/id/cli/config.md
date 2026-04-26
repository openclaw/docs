---
read_when:
    - Anda ingin membaca atau mengedit config secara non-interaktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Config
x-i18n:
    generated_at: "2026-04-26T11:25:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Helper config untuk pengeditan non-interaktif di `openclaw.json`: dapatkan/atur/hapus/file/schema/validate nilai berdasarkan path dan cetak file config aktif. Jalankan tanpa subperintah untuk membuka wizard konfigurasi (sama seperti `openclaw configure`).

## Opsi root

<ParamField path="--section <section>" type="string">
  Filter bagian guided-setup yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah.
</ParamField>

Bagian panduan yang didukung: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Cetak JSON schema yang dihasilkan untuk `openclaw.json` ke stdout sebagai JSON.

<AccordionGroup>
  <Accordion title="Apa yang disertakan">
    - Schema root config saat ini, ditambah field string root `$schema` untuk tooling editor.
    - Metadata dokumen `title` dan `description` field yang digunakan oleh Control UI.
    - Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok tersedia.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumen yang sama saat dokumentasi field yang cocok tersedia.
    - Metadata schema Plugin + channel live secara best-effort saat manifest runtime dapat dimuat.
    - Schema fallback yang bersih bahkan saat config saat ini tidak valid.
  </Accordion>
  <Accordion title="RPC runtime terkait">
    `config.schema.lookup` mengembalikan satu path config yang dinormalisasi dengan node schema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata hint UI yang cocok, dan ringkasan child langsung. Gunakan ini untuk drill-down dengan cakupan path di Control UI atau klien kustom.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe ke file saat Anda ingin memeriksa atau memvalidasinya dengan tool lain:

```bash
openclaw config schema > openclaw.schema.json
```

### Path

Path menggunakan notasi titik atau kurung:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Gunakan indeks daftar agen untuk menargetkan agen tertentu:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Nilai

Nilai di-parse sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string. Gunakan `--strict-json` untuk mewajibkan parsing JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON, bukan teks yang diformat untuk terminal.

<Note>
Penetapan objek menggantikan path target secara default. Path map/list yang dilindungi dan biasanya menyimpan entri yang ditambahkan pengguna, seperti `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali Anda memberikan `--replace`.
</Note>

Gunakan `--merge` saat menambahkan entri ke map tersebut:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya saat Anda memang ingin nilai yang diberikan menjadi seluruh nilai target.

## Mode `config set`

`openclaw config set` mendukung empat gaya assignment:

<Tabs>
  <Tab title="Mode nilai">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Mode builder SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode builder provider">
    Mode builder provider hanya menargetkan path `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Mode batch">
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
Assignment SecretRef ditolak pada surface runtime-mutable yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook Discord untuk thread-binding, dan JSON kredensial WhatsApp). Lihat [SecretRef Credential Surface](/id/reference/secretref-credential-surface).
</Warning>

Parsing batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran. `--strict-json` / `--json` tidak mengubah perilaku parsing batch.

Mode path/value JSON tetap didukung untuk SecretRef dan provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag builder provider

Target builder provider harus menggunakan `secrets.providers.<alias>` sebagai path.

<AccordionGroup>
  <Accordion title="Flag umum">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)
  </Accordion>
  <Accordion title="Provider env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (dapat diulang)
  </Accordion>
  <Accordion title="Provider file (--provider-source file)">
    - `--provider-path <path>` (wajib)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`
  </Accordion>
  <Accordion title="Provider exec (--provider-source exec)">
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

Contoh provider exec yang diperkeras:

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
  <Accordion title="Perilaku dry-run">
    - Mode builder: menjalankan pemeriksaan resolvabilitas SecretRef untuk ref/provider yang berubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi schema plus pemeriksaan resolvabilitas SecretRef.
    - Validasi kebijakan juga berjalan untuk surface target SecretRef yang diketahui tidak didukung.
    - Pemeriksaan kebijakan mengevaluasi seluruh config pasca-perubahan, sehingga penulisan objek parent (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
    - Gunakan `--allow-exec` dengan `--dry-run` untuk ikut menjalankan pemeriksaan SecretRef exec (ini dapat mengeksekusi perintah provider).
    - `--allow-exec` hanya untuk dry-run dan akan menghasilkan error jika digunakan tanpa `--dry-run`.
  </Accordion>
  <Accordion title="Field --dry-run --json">
    `--dry-run --json` mencetak laporan yang dapat dibaca mesin:

    - `ok`: apakah dry-run berhasil
    - `operations`: jumlah assignment yang dievaluasi
    - `checks`: apakah pemeriksaan schema/resolvabilitas dijalankan
    - `checks.resolvabilityComplete`: apakah pemeriksaan resolvabilitas berjalan sampai selesai (`false` saat ref exec dilewati)
    - `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
    - `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak diatur
    - `errors`: kegagalan schema/resolvabilitas terstruktur saat `ok=false`

  </Accordion>
</AccordionGroup>

### Bentuk output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // ada untuk error resolvabilitas
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
    - `config schema validation failed`: bentuk config pasca-perubahan Anda tidak valid; perbaiki path/nilai atau bentuk objek provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial itu kembali ke input plaintext/string dan simpan SecretRef hanya pada surface yang didukung.
    - `SecretRef assignment(s) could not be resolved`: provider/ref yang dirujuk saat ini tidak dapat di-resolve (variabel env hilang, pointer file tidak valid, kegagalan provider exec, atau ketidakcocokan provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi resolvabilitas exec.
    - Untuk mode batch, perbaiki entri yang gagal lalu jalankan ulang `--dry-run` sebelum menulis.
  </Accordion>
</AccordionGroup>

## Keamanan penulisan

`openclaw config set` dan writer config milik OpenClaw lainnya memvalidasi seluruh config pasca-perubahan sebelum meng-commit-nya ke disk. Jika payload baru gagal validasi schema atau terlihat seperti clobber destruktif, config aktif dibiarkan apa adanya dan payload yang ditolak disimpan di sampingnya sebagai `openclaw.json.rejected.*`.

<Warning>
Path config aktif harus berupa file biasa. Tata letak `openclaw.json` yang berupa symlink tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk langsung menunjuk ke file yang sebenarnya.
</Warning>

Utamakan penulisan lewat CLI untuk pengeditan kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki bentuk config lengkapnya:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan langsung lewat editor tetap diizinkan, tetapi Gateway yang sedang berjalan memperlakukannya sebagai tidak tepercaya sampai lolos validasi. Edit langsung yang tidak valid dapat dipulihkan dari backup terakhir yang diketahui baik saat startup atau hot reload. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config).

Pemulihan seluruh file dicadangkan untuk config yang rusak secara global, seperti error parse, kegagalan schema di level root, kegagalan migrasi lama, atau kegagalan campuran Plugin dan root. Jika validasi gagal hanya di bawah `plugins.entries.<id>...`, OpenClaw mempertahankan `openclaw.json` aktif dan melaporkan masalah lokal Plugin tersebut alih-alih memulihkan `.last-good`. Ini mencegah perubahan schema Plugin atau ketidaksesuaian `minHostVersion` mengembalikan pengaturan pengguna lain yang tidak terkait seperti model, provider, profil auth, channel, eksposur gateway, tools, memori, browser, atau config cron.

## Subperintah

- `config file`: Cetak path file config aktif (diselesaikan dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Path tersebut harus menunjuk file biasa, bukan symlink.

Restart gateway setelah pengeditan.

## Validate

Validasi config saat ini terhadap schema aktif tanpa memulai gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal agar agen bawaan membandingkan config aktif dengan dokumentasi sambil Anda memvalidasi setiap perubahan dari terminal yang sama:

<Note>
Jika validasi sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix`. `openclaw chat` tidak melewati guard config tidak valid.
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

Loop perbaikan yang umum:

<Steps>
  <Step title="Bandingkan dengan dokumentasi">
    Minta agen membandingkan config Anda saat ini dengan halaman dokumentasi yang relevan dan menyarankan perbaikan terkecil.
  </Step>
  <Step title="Terapkan edit terarah">
    Terapkan edit terarah dengan `openclaw config set` atau `openclaw configure`.
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
- [Configuration](/id/gateway/configuration)
