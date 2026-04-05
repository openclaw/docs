---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara non-interaktif
summary: Referensi CLI untuk `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-05T13:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper konfigurasi untuk pengeditan non-interaktif di `openclaw.json`: get/set/unset/file/schema/validate
nilai berdasarkan path dan mencetak file konfigurasi aktif. Jalankan tanpa subperintah untuk
membuka wizard konfigurasi (sama seperti `openclaw configure`).

Opsi root:

- `--section <section>`: filter bagian penyiapan terpandu yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah

Bagian terpandu yang didukung:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Contoh

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Cetak JSON schema yang dihasilkan untuk `openclaw.json` ke stdout sebagai JSON.

Yang disertakan:

- Root schema konfigurasi saat ini, plus field string root `$schema` untuk tooling editor
- Metadata dokumen `title` dan `description` field yang digunakan oleh UI Control
- Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok ada
- Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumen yang sama saat dokumentasi field yang cocok ada
- Metadata schema plugin + channel live secara best-effort saat manifest runtime dapat dimuat
- Schema fallback yang bersih bahkan saat konfigurasi saat ini tidak valid

Runtime RPC terkait:

- `config.schema.lookup` mengembalikan satu path konfigurasi yang dinormalisasi dengan node
  schema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum),
  metadata petunjuk UI yang cocok, dan ringkasan anak langsung. Gunakan ini untuk
  penelusuran berbasis path di UI Control atau klien kustom.

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

Nilai diparse sebagai JSON5 jika memungkinkan; jika tidak, nilainya diperlakukan sebagai string.
Gunakan `--strict-json` untuk mewajibkan parsing JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON alih-alih teks berformat terminal.

## Mode `config set`

`openclaw config set` mendukung empat gaya penetapan:

1. Mode nilai: `openclaw config set <path> <value>`
2. Mode pembuat SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode pembuat provider (khusus path `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Mode batch (`--batch-json` atau `--batch-file`):

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

Catatan kebijakan:

- Penetapan SecretRef ditolak pada surface yang tidak mendukung mutasi runtime (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token webhook thread-binding Discord, dan JSON kredensial WhatsApp). Lihat [SecretRef Credential Surface](/reference/secretref-credential-surface).

Parsing batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran.
`--strict-json` / `--json` tidak mengubah perilaku parsing batch.

Mode path/nilai JSON tetap didukung untuk SecretRefs maupun provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag Pembuat Provider

Target pembuat provider harus menggunakan `secrets.providers.<alias>` sebagai path.

Flag umum:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (dapat diulang)

Provider file (`--provider-source file`):

- `--provider-path <path>` (wajib)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Provider exec (`--provider-source exec`):

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

Gunakan `--dry-run` untuk memvalidasi perubahan tanpa menulis ke `openclaw.json`.

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

Perilaku dry-run:

- Mode builder: menjalankan pemeriksaan resolvabilitas SecretRef untuk ref/provider yang berubah.
- Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi schema plus pemeriksaan resolvabilitas SecretRef.
- Validasi kebijakan juga dijalankan untuk surface target SecretRef yang diketahui tidak didukung.
- Pemeriksaan kebijakan mengevaluasi keseluruhan konfigurasi pasca-perubahan, sehingga penulisan objek induk (misalnya mengatur `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
- Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
- Gunakan `--allow-exec` bersama `--dry-run` untuk ikut serta dalam pemeriksaan SecretRef exec (ini dapat mengeksekusi perintah provider).
- `--allow-exec` hanya untuk dry-run dan menghasilkan error jika digunakan tanpa `--dry-run`.

`--dry-run --json` mencetak laporan yang dapat dibaca mesin:

- `ok`: apakah dry-run lulus
- `operations`: jumlah penetapan yang dievaluasi
- `checks`: apakah pemeriksaan schema/resolvabilitas dijalankan
- `checks.resolvabilityComplete`: apakah pemeriksaan resolvabilitas berjalan hingga selesai (false saat ref exec dilewati)
- `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
- `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak diatur
- `errors`: kegagalan schema/resolvabilitas terstruktur saat `ok=false`

### Bentuk Output JSON

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

Contoh sukses:

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

Contoh gagal:

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

Jika dry-run gagal:

- `config schema validation failed`: bentuk konfigurasi pasca-perubahan Anda tidak valid; perbaiki path/nilai atau bentuk objek provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial itu kembali ke input plaintext/string dan pertahankan SecretRef hanya pada surface yang didukung.
- `SecretRef assignment(s) could not be resolved`: provider/ref yang dirujuk saat ini tidak dapat di-resolve (variabel env hilang, pointer file tidak valid, kegagalan provider exec, atau ketidakcocokan provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan lagi dengan `--allow-exec` jika Anda memerlukan validasi resolvabilitas exec.
- Untuk mode batch, perbaiki entri yang gagal lalu jalankan ulang `--dry-run` sebelum menulis.

## Subperintah

- `config file`: Cetak path file konfigurasi aktif (di-resolve dari `OPENCLAW_CONFIG_PATH` atau lokasi default).

Mulai ulang gateway setelah pengeditan.

## Validasi

Validasi konfigurasi saat ini terhadap schema aktif tanpa memulai
gateway.

```bash
openclaw config validate
openclaw config validate --json
```
