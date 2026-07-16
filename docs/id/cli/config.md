---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara noninteraktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-07-16T17:59:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Pembantu noninteraktif untuk `openclaw.json`: dapatkan/tetapkan/tambal/hapus penetapan nilai berdasarkan jalur, cetak skema, validasi, atau cetak jalur file aktif. Jalankan `openclaw config` tanpa subperintah untuk membuka wizard terpandu yang sama seperti `openclaw configure`.

<Note>
Saat `OPENCLAW_NIX_MODE=1`, OpenClaw memperlakukan `openclaw.json` sebagai tidak dapat diubah. Perintah hanya-baca (`config get`, `config file`, `config schema`, `config validate`) tetap berfungsi; penulis konfigurasi menolak. Sebagai gantinya, edit sumber Nix untuk instalasi tersebut; untuk distribusi nix-openclaw pihak pertama, gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) dan tetapkan nilai di bawah `programs.openclaw.config` atau `instances.<name>.config`.
</Note>

## Opsi root

<ParamField path="--section <section>" type="string">
  Filter bagian penyiapan terpandu yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah.
</ParamField>

Bagian terpandu: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Jalur

Notasi titik atau kurung siku. Kutip jalur berkurung siku dalam contoh shell agar zsh tidak memperluas glob `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Membaca nilai dari snapshot konfigurasi yang telah disunting (rahasia tidak pernah dicetak). `--json` mencetak nilai mentah sebagai JSON; jika tidak, string/angka/boolean dicetak apa adanya dan objek/larik dicetak sebagai JSON terformat.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Mencetak jalur file konfigurasi aktif, yang diselesaikan dari `OPENCLAW_CONFIG_PATH` atau lokasi default. Jalur tersebut menunjuk file biasa, bukan symlink; lihat [Keamanan penulisan](#write-safety).

### `config schema`

Mencetak skema JSON yang dihasilkan untuk `openclaw.json` ke stdout.

<AccordionGroup>
  <Accordion title="Yang disertakan">
    - Skema konfigurasi root saat ini, ditambah bidang string `$schema` pada root untuk alat editor.
    - Metadata dokumentasi bidang `title` / `description` yang digunakan oleh UI Kontrol.
    - Node objek bertingkat, wildcard (`*`), dan item larik (`[]`) mewarisi metadata `title` / `description` yang sama ketika dokumentasi bidang yang cocok tersedia.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumentasi yang sama.
    - Metadata skema plugin + kanal langsung dengan upaya terbaik saat manifes runtime dapat dimuat.
    - Skema fallback yang bersih bahkan ketika konfigurasi saat ini tidak valid.

  </Accordion>
  <Accordion title="RPC runtime terkait">
    `config.schema.lookup` mengembalikan satu jalur konfigurasi yang dinormalisasi dengan node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata petunjuk UI yang cocok, dan ringkasan turunan langsung. Gunakan untuk penelusuran mendetail yang dibatasi pada jalur di UI Kontrol atau klien khusus.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Memvalidasi konfigurasi saat ini terhadap skema aktif tanpa memulai Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Jika validasi sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix`. `openclaw chat` tidak melewati pengaman konfigurasi tidak valid.
</Note>

## Nilai

Nilai diurai sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string mentah. Gunakan `--strict-json` untuk mewajibkan JSON standar tanpa fallback string (sintaks khusus JSON5 seperti komentar, koma akhir, atau kunci tanpa tanda kutip kemudian ditolak). `--json` adalah alias lama untuk `--strict-json` pada `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON alih-alih teks yang diformat untuk terminal.

<Note>
Penetapan objek menggantikan jalur target secara default. Jalur terlindungi yang umumnya menyimpan entri yang ditambahkan pengguna menolak penggantian yang akan menghapus entri yang ada kecuali Anda meneruskan `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`.
</Note>

Gunakan `--merge` saat menambahkan entri ke peta tersebut:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya ketika nilai yang diberikan memang dimaksudkan menjadi nilai target lengkap.

## Mode `config set`

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
  <Tab title="Mode pembuat penyedia">
    Hanya menargetkan jalur `secrets.providers.<alias>`:

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
Penetapan SecretRef ditolak pada permukaan yang dapat diubah saat runtime tetapi tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook pengikatan utas Discord, dan JSON kredensial WhatsApp). Lihat [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Warning>

Penguraian batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran; `--strict-json` / `--json` tidak mengubah perilaku penguraian batch.

Mode jalur/nilai JSON juga berfungsi langsung untuk SecretRef dan penyedia:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flag pembuat penyedia

Target pembuat penyedia harus menggunakan `secrets.providers.<alias>` sebagai jalur.

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

Contoh penyedia exec yang diperketat:

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

## `config patch`

Tempel atau salurkan tambalan JSON5 berbentuk konfigurasi alih-alih menjalankan banyak perintah `config set` berbasis jalur. Objek digabungkan secara rekursif; larik dan nilai skalar menggantikan target; `null` menghapus jalur target.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Salurkan tambalan melalui stdin untuk skrip penyiapan jarak jauh:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Contoh tambalan:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Gunakan `--replace-path <path>` ketika satu objek atau larik harus menjadi persis nilai yang diberikan alih-alih ditambal secara rekursif:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` menjalankan pemeriksaan skema dan keteruraian SecretRef tanpa menulis. SecretRef yang didukung exec dilewati secara default selama uji coba; tambahkan `--allow-exec` ketika Anda sengaja ingin uji coba menjalankan perintah penyedia.

## Uji coba

`--dry-run` memvalidasi perubahan tanpa menulis `openclaw.json`. Tersedia pada `config set`, `config patch`, dan `config unset`.

```bash
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
  <Accordion title="Perilaku uji coba">
    - Mode builder: menjalankan pemeriksaan keteruraian SecretRef untuk ref/penyedia yang diubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi skema serta pemeriksaan keteruraian SecretRef.
    - Validasi kebijakan dijalankan terhadap konfigurasi lengkap setelah perubahan, sehingga penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi permukaan yang tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default untuk menghindari efek samping perintah; teruskan `--allow-exec` untuk mengaktifkannya (ini dapat menjalankan perintah penyedia). `--allow-exec` hanya untuk uji coba dan akan menghasilkan kesalahan tanpa `--dry-run`.

  </Accordion>
  <Accordion title="Bidang --dry-run --json">
    - `ok`: apakah uji coba berhasil
    - `operations`: jumlah penetapan yang dievaluasi
    - `checks`: apakah pemeriksaan skema/keteruraian dijalankan
    - `checks.resolvabilityComplete`: apakah pemeriksaan keteruraian dijalankan hingga selesai (false saat ref exec dilewati)
    - `refsChecked`: jumlah ref yang benar-benar diuraikan selama uji coba
    - `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak ditetapkan
    - `errors`: kegagalan jalur yang hilang, skema, atau keteruraian yang terstruktur saat `ok=false`

  </Accordion>
</AccordionGroup>

### Struktur keluaran JSON

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
      ref?: string, // ada untuk kesalahan keteruraian
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
  <Tab title="Contoh kegagalan">
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
          "message": "Kesalahan: Variabel lingkungan \"MISSING_TEST_SECRET\" tidak ditetapkan.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Jika uji coba gagal">
    - `config schema validation failed`: struktur konfigurasi setelah perubahan tidak valid; perbaiki jalur/nilai atau struktur objek penyedia/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial tersebut kembali ke masukan teks biasa/string; gunakan SecretRef hanya pada permukaan yang didukung.
    - `SecretRef assignment(s) could not be resolved`: penyedia/ref yang dirujuk saat ini tidak dapat diuraikan (variabel lingkungan tidak ada, penunjuk berkas tidak valid, kegagalan penyedia exec, atau ketidakcocokan penyedia/sumber).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi keteruraian exec.
    - Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

  </Accordion>
</AccordionGroup>

## Menerapkan perubahan

Setelah setiap `config set` / `config patch` / `config unset` yang berhasil, CLI mencetak salah satu dari tiga petunjuk agar Anda mengetahui apakah Gateway perlu dimulai ulang:

| Petunjuk                                            | Arti                                          |
| --------------------------------------------------- | --------------------------------------------- |
| `Restart the gateway to apply.`                     | Jalur yang diubah memerlukan mulai ulang penuh. |
| `Change will apply without restarting the gateway.` | Muat ulang langsung menerapkannya secara otomatis. |
| `No gateway restart needed.`                        | Tidak ada hal yang relevan bagi runtime yang berubah. |

Penulisan ke `plugins.entries` (atau subjalur mana pun) selalu memerlukan mulai ulang, karena CLI tidak dapat memastikan bahwa metadata muat ulang setiap plugin telah dimuat.

## Keamanan penulisan

`openclaw config set` dan penulis konfigurasi lain milik OpenClaw memvalidasi konfigurasi lengkap setelah perubahan sebelum menyimpannya ke disk. Jika payload baru gagal dalam validasi skema atau tampak seperti penimpaan yang merusak, konfigurasi aktif dibiarkan tidak berubah dan payload yang ditolak disimpan di sebelahnya sebagai `openclaw.json.rejected.*`.

Penulisan milik OpenClaw melakukan serialisasi ulang JSON5 sebagai JSON standar. Jika sumber berisi komentar, penulis langsung memberikan peringatan sebelum menghapusnya; gunakan editor langsung jika komentar perlu dipertahankan.

<Warning>
Jalur konfigurasi aktif harus berupa berkas biasa. Tata letak `openclaw.json` dengan symlink tidak didukung untuk penulisan; sebagai gantinya, gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung ke berkas yang sebenarnya.
</Warning>

Utamakan penulisan melalui CLI untuk penyuntingan kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki struktur konfigurasi lengkap:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan dengan editor langsung tetap diperbolehkan, tetapi Gateway yang sedang berjalan memperlakukannya sebagai tidak tepercaya hingga lolos validasi. Penyuntingan langsung yang tidak valid menyebabkan kegagalan saat memulai atau dilewati oleh muat ulang langsung; Gateway tidak menulis ulang `openclaw.json`. Jalankan `openclaw doctor --fix` untuk memperbaiki konfigurasi yang diberi prefiks/ditimpa atau memulihkan salinan terakhir yang diketahui baik. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config).

Pemulihan seluruh berkas dikhususkan untuk perbaikan oleh doctor. Perubahan skema plugin atau ketidakselarasan `minHostVersion` tetap dilaporkan dengan jelas alih-alih mengembalikan pengaturan pengguna yang tidak terkait, seperti konfigurasi model, penyedia, profil autentikasi, channel, eksposur Gateway, alat, memori, browser, atau cron.

## Siklus perbaikan

Setelah `openclaw config validate` berhasil, gunakan TUI lokal agar agen tertanam membandingkan konfigurasi aktif dengan dokumentasi sementara Anda memvalidasi setiap perubahan dari terminal yang sama:

```bash
openclaw chat
```

Di dalam TUI, `!` di awal menjalankan perintah shell lokal secara harfiah (setelah permintaan konfirmasi satu kali per sesi):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Bandingkan dengan dokumentasi">
    Minta agen membandingkan konfigurasi Anda saat ini dengan halaman dokumentasi yang relevan dan menyarankan perbaikan terkecil.
  </Step>
  <Step title="Terapkan penyuntingan terarah">
    Terapkan penyuntingan terarah dengan `openclaw config set` atau `openclaw configure`.
  </Step>
  <Step title="Validasi ulang">
    Jalankan ulang `openclaw config validate` setelah setiap perubahan.
  </Step>
  <Step title="Doctor untuk masalah runtime">
    Jika validasi berhasil tetapi runtime masih bermasalah, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk mendapatkan bantuan migrasi dan perbaikan.
  </Step>
</Steps>

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
