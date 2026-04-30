---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara noninteraktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-30T09:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

Pembantu konfigurasi untuk pengeditan non-interaktif di `openclaw.json`: get/set/patch/unset/file/schema/validate nilai berdasarkan path dan cetak file konfigurasi aktif. Jalankan tanpa subperintah untuk membuka wizard konfigurasi (sama seperti `openclaw configure`).

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
    - Skema konfigurasi root saat ini, plus field string root `$schema` untuk tooling editor.
    - Metadata dokumentasi field `title` dan `description` yang digunakan oleh Control UI.
    - Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok ada.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumentasi yang sama saat dokumentasi field yang cocok ada.
    - Metadata skema Plugin + channel live sebaik mungkin saat manifes runtime dapat dimuat.
    - Skema fallback yang bersih bahkan saat konfigurasi saat ini tidak valid.

  </Accordion>
  <Accordion title="RPC runtime terkait">
    `config.schema.lookup` mengembalikan satu path konfigurasi yang dinormalisasi dengan node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata petunjuk UI yang cocok, dan ringkasan child langsung. Gunakan ini untuk drill-down berbasis path di Control UI atau klien kustom.
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

Gunakan indeks daftar agen untuk menargetkan agen tertentu:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Nilai

Nilai diurai sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string. Gunakan `--strict-json` untuk mewajibkan penguraian JSON5. `--json` tetap didukung sebagai alias legacy.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON alih-alih teks berformat terminal.

<Note>
Penetapan objek mengganti path target secara default. Path map/list terlindungi yang biasanya menyimpan entri yang ditambahkan pengguna, seperti `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali Anda meneruskan `--replace`.
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
  <Tab title="Mode builder SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode builder penyedia">
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
Penetapan SecretRef ditolak pada permukaan runtime-mutable yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook pengikatan thread Discord, dan JSON kredensial WhatsApp). Lihat [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Warning>

Penguraian batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran. `--strict-json` / `--json` tidak mengubah perilaku penguraian batch.

## `config patch`

Gunakan `config patch` saat Anda ingin menempelkan atau melakukan pipe patch berbentuk konfigurasi alih-alih menjalankan banyak perintah `config set` berbasis path. Input adalah objek JSON5. Objek digabungkan secara rekursif, array dan nilai skalar mengganti nilai target, dan `null` menghapus path target.

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

Gunakan `--replace-path <path>` saat satu objek atau array harus menjadi persis nilai yang diberikan alih-alih dipatch secara rekursif:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` menjalankan pemeriksaan skema dan keterpecahan SecretRef tanpa menulis. SecretRef berbasis exec dilewati secara default selama dry-run; tambahkan `--allow-exec` saat Anda sengaja ingin dry-run menjalankan perintah penyedia.

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
  <Accordion title="Flag umum">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Penyedia env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (dapat diulang)

  </Accordion>
  <Accordion title="Penyedia file (--provider-source file)">
    - `--provider-path <path>` (wajib)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Penyedia exec (--provider-source exec)">
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

Contoh penyedia exec yang diperkeras:

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
    - Mode builder: menjalankan pemeriksaan keterpecahan SecretRef untuk ref/penyedia yang berubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi skema plus pemeriksaan keterpecahan SecretRef.
    - Validasi kebijakan juga berjalan untuk permukaan target SecretRef tidak didukung yang diketahui.
    - Pemeriksaan kebijakan mengevaluasi konfigurasi lengkap pascaperubahan, sehingga penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi permukaan tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
    - Gunakan `--allow-exec` dengan `--dry-run` untuk ikut serta dalam pemeriksaan SecretRef exec (ini dapat menjalankan perintah penyedia).
    - `--allow-exec` hanya untuk dry-run dan error jika digunakan tanpa `--dry-run`.

  </Accordion>
  <Accordion title="Field --dry-run --json">
    `--dry-run --json` mencetak laporan yang dapat dibaca mesin:

    - `ok`: apakah dry-run berhasil
    - `operations`: jumlah penetapan yang dievaluasi
    - `checks`: apakah pemeriksaan skema/keterpecahan berjalan
    - `checks.resolvabilityComplete`: apakah pemeriksaan keterpecahan berjalan hingga selesai (false saat ref exec dilewati)
    - `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
    - `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak ditetapkan
    - `errors`: kegagalan skema/keterpecahan terstruktur saat `ok=false`

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: bentuk config setelah perubahan tidak valid; perbaiki jalur/nilai atau bentuk objek provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial itu kembali ke input plaintext/string dan simpan SecretRefs hanya pada permukaan yang didukung.
    - `SecretRef assignment(s) could not be resolved`: provider/ref yang dirujuk saat ini tidak dapat di-resolve (env var hilang, penunjuk file tidak valid, kegagalan provider exec, atau ketidakcocokan provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda perlu validasi resolvabilitas exec.
    - Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

  </Accordion>
</AccordionGroup>

## Keamanan tulis

`openclaw config set` dan penulis config lain yang dimiliki OpenClaw memvalidasi config penuh setelah perubahan sebelum menyimpannya ke disk. Jika payload baru gagal validasi skema atau tampak seperti clobber yang destruktif, config aktif dibiarkan apa adanya dan payload yang ditolak disimpan di sampingnya sebagai `openclaw.json.rejected.*`.

<Warning>
Jalur config aktif harus berupa file biasa. Tata letak `openclaw.json` bersymlink tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung ke file asli sebagai gantinya.
</Warning>

Utamakan penulisan CLI untuk edit kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki bentuk config penuh:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan langsung lewat editor tetap diizinkan, tetapi Gateway yang berjalan memperlakukannya sebagai tidak tepercaya hingga lolos validasi. Edit langsung yang tidak valid dapat dipulihkan dari cadangan terakhir yang diketahui baik saat startup atau hot reload. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config).

Pemulihan seluruh file dicadangkan untuk config yang rusak secara global, seperti error parse, kegagalan skema level root, kegagalan migrasi legacy, atau gabungan kegagalan plugin dan root. Jika validasi gagal hanya di bawah `plugins.entries.<id>...`, OpenClaw mempertahankan `openclaw.json` aktif dan melaporkan masalah lokal plugin alih-alih memulihkan `.last-good`. Ini mencegah perubahan skema plugin atau ketidaksesuaian `minHostVersion` membatalkan pengaturan pengguna yang tidak terkait seperti config model, provider, profil auth, channel, eksposur Gateway, tools, memori, browser, atau cron.

## Subperintah

- `config file`: Cetak jalur file config aktif (di-resolve dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Jalur tersebut harus menunjuk ke file biasa, bukan symlink.

Mulai ulang gateway setelah edit.

## Validasi

Validasi config saat ini terhadap skema aktif tanpa memulai gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal agar agent tertanam membandingkan config aktif dengan docs saat Anda memvalidasi setiap perubahan dari terminal yang sama:

<Note>
Jika validasi sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix`. `openclaw chat` tidak melewati penjaga config tidak valid.
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
  <Step title="Compare with docs">
    Minta agent membandingkan config Anda saat ini dengan halaman docs yang relevan dan menyarankan perbaikan terkecil.
  </Step>
  <Step title="Apply targeted edits">
    Terapkan edit tertarget dengan `openclaw config set` atau `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Jalankan ulang `openclaw config validate` setelah setiap perubahan.
  </Step>
  <Step title="Doctor for runtime issues">
    Jika validasi berhasil tetapi runtime masih tidak sehat, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk bantuan migrasi dan perbaikan.
  </Step>
</Steps>

## Terkait

- [referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
