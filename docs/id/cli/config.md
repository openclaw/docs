---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara noninteraktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-06T17:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Pembantu konfigurasi untuk edit non-interaktif di `openclaw.json`: get/set/patch/unset/file/schema/validate nilai berdasarkan path dan mencetak file konfigurasi aktif. Jalankan tanpa subperintah untuk membuka wizard konfigurasi (sama seperti `openclaw configure`).

<Note>
Saat `OPENCLAW_NIX_MODE=1`, OpenClaw memperlakukan `openclaw.json` sebagai tidak dapat diubah. Perintah hanya-baca seperti `config get`, `config file`, `config schema`, dan `config validate` tetap berfungsi, tetapi penulis konfigurasi akan ditolak. Agent sebaiknya mengedit sumber Nix untuk instalasi tersebut; untuk distribusi nix-openclaw pihak pertama, gunakan [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) dan tetapkan nilai di bawah `programs.openclaw.config` atau `instances.<name>.config`.
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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
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
  <Accordion title="Yang disertakan">
    - Skema konfigurasi root saat ini, ditambah field string `$schema` root untuk tooling editor.
    - Metadata dokumentasi field `title` dan `description` yang digunakan oleh Control UI.
    - Node objek bersarang, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok ada.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumentasi yang sama saat dokumentasi field yang cocok ada.
    - Metadata skema Plugin + channel live secara best-effort saat manifes runtime dapat dimuat.
    - Skema fallback yang bersih bahkan saat konfigurasi saat ini tidak valid.

  </Accordion>
  <Accordion title="RPC runtime terkait">
    `config.schema.lookup` mengembalikan satu path konfigurasi ternormalisasi dengan node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata petunjuk UI yang cocok, dan ringkasan child langsung. Gunakan ini untuk penelusuran mendalam berbasis path di Control UI atau klien khusus.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe ke file saat Anda ingin memeriksa atau memvalidasinya dengan alat lain:

```bash
openclaw config schema > openclaw.schema.json
```

### Path

Path menggunakan notasi titik atau kurung siku:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Gunakan indeks daftar agent untuk menargetkan agent tertentu:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Nilai

Nilai diparse sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string. Gunakan `--strict-json` untuk mewajibkan parsing JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON, bukan teks berformat terminal.

<Note>
Penetapan objek secara default menggantikan path target. Path map/list terlindungi yang umum menyimpan entri yang ditambahkan pengguna, seperti `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali Anda meneruskan `--replace`.
</Note>

Gunakan `--merge` saat menambahkan entri ke map tersebut:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya saat Anda sengaja ingin nilai yang diberikan menjadi nilai target lengkap.

## Mode `config set`

`openclaw config set` mendukung empat gaya penetapan:

<Tabs>
  <Tab title="Mode nilai">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Mode pembuat SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode pembuat provider">
    Mode pembuat provider hanya menargetkan path `secrets.providers.<alias>`:

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
Penetapan SecretRef ditolak pada surface runtime-mutable yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook thread-binding Discord, dan JSON kredensial WhatsApp). Lihat [Surface Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Warning>

Parsing batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran. `--strict-json` / `--json` tidak mengubah perilaku parsing batch.

## `config patch`

Gunakan `config patch` saat Anda ingin menempelkan atau melakukan pipe patch berbentuk konfigurasi, bukan menjalankan banyak perintah `config set` berbasis path. Input berupa objek JSON5. Objek digabungkan secara rekursif, array dan nilai skalar menggantikan nilai target, dan `null` menghapus path target.

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

Gunakan `--replace-path <path>` saat satu objek atau array harus menjadi persis nilai yang diberikan, bukan dipatch secara rekursif:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` menjalankan pemeriksaan skema dan keterpecahan SecretRef tanpa menulis. SecretRef berbasis exec dilewati secara default selama dry-run; tambahkan `--allow-exec` saat Anda sengaja ingin dry-run menjalankan perintah provider.

Mode path/nilai JSON tetap didukung untuk SecretRef dan provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag pembuat provider

Target pembuat provider harus menggunakan `secrets.providers.<alias>` sebagai path.

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
    - Mode pembuat: menjalankan pemeriksaan keterpecahan SecretRef untuk ref/provider yang berubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi skema plus pemeriksaan keterpecahan SecretRef.
    - Validasi kebijakan juga berjalan untuk surface target SecretRef yang diketahui tidak didukung.
    - Pemeriksaan kebijakan mengevaluasi konfigurasi penuh setelah perubahan, sehingga penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
    - Gunakan `--allow-exec` dengan `--dry-run` untuk memilih ikut pemeriksaan SecretRef exec (ini dapat mengeksekusi perintah provider).
    - `--allow-exec` hanya untuk dry-run dan error jika digunakan tanpa `--dry-run`.

  </Accordion>
  <Accordion title="Field --dry-run --json">
    `--dry-run --json` mencetak laporan yang dapat dibaca mesin:

    - `ok`: apakah dry-run berhasil
    - `operations`: jumlah penetapan yang dievaluasi
    - `checks`: apakah pemeriksaan skema/resolvability dijalankan
    - `checks.resolvabilityComplete`: apakah pemeriksaan resolvability berjalan sampai selesai (false ketika ref exec dilewati)
    - `refsChecked`: jumlah ref yang benar-benar diselesaikan selama dry-run
    - `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak ditetapkan
    - `errors`: kegagalan skema/resolvability terstruktur ketika `ok=false`

  </Accordion>
</AccordionGroup>

### Bentuk keluaran JSON

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
    - `config schema validation failed`: bentuk config setelah perubahan tidak valid; perbaiki jalur/nilai atau bentuk objek provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial itu kembali ke input teks biasa/string dan pertahankan SecretRef hanya pada permukaan yang didukung.
    - `SecretRef assignment(s) could not be resolved`: provider/ref yang direferensikan saat ini tidak dapat diselesaikan (env var hilang, pointer file tidak valid, kegagalan provider exec, atau ketidakcocokan provider/sumber).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi resolvability exec.
    - Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

  </Accordion>
</AccordionGroup>

## Keamanan tulis

`openclaw config set` dan penulis config milik OpenClaw lainnya memvalidasi seluruh config setelah perubahan sebelum mengirimkannya ke disk. Jika payload baru gagal validasi skema atau terlihat seperti penimpaan yang destruktif, config aktif dibiarkan tetap ada dan payload yang ditolak disimpan di sampingnya sebagai `openclaw.json.rejected.*`.

<Warning>
Jalur config aktif harus berupa file reguler. Tata letak `openclaw.json` yang berupa symlink tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung ke file sebenarnya.
</Warning>

Utamakan penulisan CLI untuk edit kecil:

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

Penulisan langsung dengan editor tetap diizinkan, tetapi Gateway yang berjalan memperlakukannya sebagai tidak tepercaya sampai tervalidasi. Edit langsung yang tidak valid menggagalkan startup atau dilewati oleh hot reload; Gateway tidak menulis ulang `openclaw.json`. Jalankan `openclaw doctor --fix` untuk memperbaiki config yang berprefiks/tertimpah atau memulihkan salinan terakhir yang diketahui baik. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config).

Pemulihan seluruh file dikhususkan untuk perbaikan doctor. Perubahan skema Plugin atau ketidaksesuaian `minHostVersion` tetap ditampilkan jelas alih-alih mengembalikan pengaturan pengguna yang tidak terkait seperti model, provider, profil auth, channel, paparan gateway, tool, memory, browser, atau config cron.

## Subperintah

- `config file`: Cetak jalur file config aktif (diselesaikan dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Jalur tersebut harus menunjuk ke file reguler, bukan symlink.

Mulai ulang gateway setelah pengeditan.

## Validasi

Validasi config saat ini terhadap skema aktif tanpa memulai gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal agar agen tertanam membandingkan config aktif dengan dokumen saat Anda memvalidasi setiap perubahan dari terminal yang sama:

<Note>
Jika validasi sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix`. `openclaw chat` tidak melewati penjaga config-tidak-valid.
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
  <Step title="Bandingkan dengan dokumen">
    Minta agen membandingkan config Anda saat ini dengan halaman dokumen yang relevan dan menyarankan perbaikan terkecil.
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
