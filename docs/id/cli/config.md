---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara noninteraktif
sidebarTitle: Config
summary: Referensi CLI untuk `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-07-20T14:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dafc3a8e8c6d27fc86ab6c417593bd753f4326a65768b1cb073bfa6fffceaea
    source_path: cli/config.md
    workflow: 16
---

Pembantu non-interaktif untuk `openclaw.json`: mendapatkan/menetapkan/menambal/menghapus penetapan nilai berdasarkan jalur, mencetak skema, memvalidasi, atau mencetak jalur file aktif. Jalankan `openclaw config` tanpa subperintah untuk membuka wisaya terpandu yang sama seperti `openclaw configure`.

<Note>
Saat `OPENCLAW_NIX_MODE=1`, OpenClaw memperlakukan `openclaw.json` sebagai tidak dapat diubah. Perintah hanya-baca (`config get`, `config file`, `config schema`, `config validate`) tetap berfungsi; penulis konfigurasi akan menolak. Sebagai gantinya, edit sumber Nix untuk instalasi tersebut; untuk distribusi nix-openclaw pihak pertama, gunakan [Panduan Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) dan tetapkan nilai di bawah `programs.openclaw.config` atau `instances.<name>.config`.
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

Notasi titik atau tanda kurung. Kutip jalur bertanda kurung dalam contoh shell agar zsh tidak memperluas pola glob `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Membaca nilai dari snapshot konfigurasi yang telah disunting (rahasia tidak pernah dicetak). `--json` mencetak nilai mentah sebagai JSON; jika tidak, string/angka/boolean dicetak apa adanya dan objek/larik dicetak sebagai JSON berformat.

Saat jalur tidak ditemukan, `--json` menulis `{ "error": "Config path not found: <path>" }` ke stdout dan keluar dengan status 1. Tanpa `--json`, diagnostik tetap berada di stderr.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Mencetak jalur file konfigurasi aktif, yang diselesaikan dari `OPENCLAW_CONFIG_PATH` atau lokasi default. Jalur tersebut menunjuk ke file biasa, bukan symlink; lihat [Keamanan penulisan](#write-safety).

### `config schema`

Mencetak skema JSON yang dihasilkan untuk `openclaw.json` ke stdout.

<AccordionGroup>
  <Accordion title="Yang disertakan">
    - Skema konfigurasi root saat ini, ditambah bidang string root `$schema` untuk alat editor.
    - Metadata dokumentasi bidang `title` / `description` yang digunakan oleh UI Kontrol.
    - Node objek bersarang, wildcard (`*`), dan item larik (`[]`) mewarisi metadata `title` / `description` yang sama ketika dokumentasi bidang yang cocok tersedia.
    - Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumentasi yang sama.
    - Metadata skema plugin + saluran langsung dengan upaya terbaik saat manifes runtime dapat dimuat.
    - Skema cadangan yang bersih bahkan ketika konfigurasi saat ini tidak valid.

  </Accordion>
  <Accordion title="RPC runtime terkait">
    `config.schema.lookup` mengembalikan satu jalur konfigurasi yang dinormalisasi dengan node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum), metadata petunjuk UI yang cocok, dan ringkasan turunan langsung. Gunakan untuk penelusuran mendalam dalam cakupan jalur di UI Kontrol atau klien khusus.
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

Nilai diuraikan sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string mentah. Gunakan `--strict-json` untuk mewajibkan JSON standar tanpa fallback string (sintaks khusus JSON5 seperti komentar, koma di akhir, atau kunci tanpa tanda kutip kemudian ditolak). `--json` adalah alias lama untuk `--strict-json` pada `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON, bukan teks yang diformat untuk terminal.

Saat penulisan mengubah `agents.defaults.model` atau `agents.list[].model` per agen, OpenClaw menyelesaikan setiap pilihan utama atau fallback yang berubah melalui katalog penyedia yang dikonfigurasi sebelum menulis. Referensi model yang tidak dikenal ditolak tanpa mengubah konfigurasi aktif; jalankan `openclaw models list` untuk melihat model yang tersedia.

<Note>
Penetapan objek mengganti jalur target secara default. Jalur terlindungi yang biasanya menampung entri tambahan pengguna menolak penggantian yang akan menghapus entri yang ada kecuali Anda meneruskan `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries`, dan `auth.profiles`.
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

    File batch dibatasi hingga 8 MiB.

  </Tab>
</Tabs>

<Warning>
Penetapan SecretRef ditolak pada permukaan yang dapat diubah saat runtime yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook pengikatan utas Discord, dan JSON kredensial WhatsApp). Lihat [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
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

## `config patch`

Tempelkan atau salurkan tambalan JSON5 berbentuk konfigurasi alih-alih menjalankan banyak perintah `config set` berbasis jalur. Objek digabungkan secara rekursif; larik dan nilai skalar mengganti target; `null` menghapus jalur target.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

File tambalan dibatasi hingga 8 MiB. Tambalan `--stdin` yang disalurkan dibatasi hingga 1 MiB.

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

Gunakan `--replace-path <path>` ketika satu objek atau larik harus menjadi persis nilai yang diberikan, alih-alih ditambal secara rekursif:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` menjalankan pemeriksaan skema dan kemampuan resolusi SecretRef tanpa menulis. SecretRef berbasis exec dilewati secara default selama uji coba; tambahkan `--allow-exec` jika Anda memang ingin uji coba menjalankan perintah penyedia.

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
    - Mode builder: menjalankan pemeriksaan kemampuan resolusi SecretRef untuk referensi/penyedia yang diubah.
    - Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi skema beserta pemeriksaan kemampuan resolusi SecretRef.
    - Validasi kebijakan dijalankan terhadap konfigurasi lengkap setelah perubahan, sehingga penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi permukaan yang tidak didukung.
    - Pemeriksaan SecretRef exec dilewati secara default untuk menghindari efek samping perintah; teruskan `--allow-exec` untuk mengaktifkannya (ini dapat menjalankan perintah penyedia). `--allow-exec` hanya untuk uji coba dan menghasilkan kesalahan tanpa `--dry-run`.

  </Accordion>
  <Accordion title="Kolom --dry-run --json">
    - `ok`: apakah uji coba berhasil
    - `operations`: jumlah penetapan yang dievaluasi
    - `checks`: apakah pemeriksaan skema/kemampuan resolusi dijalankan
    - `checks.resolvabilityComplete`: apakah pemeriksaan kemampuan resolusi dijalankan hingga selesai (false ketika referensi exec dilewati)
    - `refsChecked`: jumlah referensi yang benar-benar diresolusi selama uji coba
    - `skippedExecRefs`: jumlah referensi exec yang dilewati karena `--allow-exec` tidak ditetapkan
    - `errors`: kegagalan jalur yang hilang, skema, atau kemampuan resolusi yang terstruktur ketika `ok=false`

  </Accordion>
</AccordionGroup>

### Bentuk keluaran JSON

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
      kind: "missing-path" | "schema" | "resolvability" | "model",
      message: string,
      ref?: string, // tersedia untuk kesalahan kemampuan resolusi
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
    - `config schema validation failed`: bentuk konfigurasi setelah perubahan tidak valid; perbaiki jalur/nilai atau bentuk objek penyedia/referensi.
    - `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial tersebut kembali ke masukan teks biasa/string; gunakan SecretRef hanya pada permukaan yang didukung.
    - `SecretRef assignment(s) could not be resolved`: penyedia/referensi yang dirujuk saat ini tidak dapat diresolusi (variabel lingkungan tidak ada, penunjuk berkas tidak valid, kegagalan penyedia exec, atau ketidakcocokan penyedia/sumber).
    - `model reference validation failed`: model teks utama atau cadangan yang diubah tidak dikenali; jalankan `openclaw models list` dan pilih model yang tersedia.
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi kemampuan resolusi exec.
    - Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

  </Accordion>
</AccordionGroup>

## Menerapkan perubahan

Setelah setiap `config set` / `config patch` / `config unset` berhasil, CLI mencetak salah satu dari tiga petunjuk agar Anda mengetahui apakah Gateway perlu dimulai ulang:

| Petunjuk                                            | Arti                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `Restart the gateway to apply.`                     | Jalur yang diubah memerlukan mulai ulang penuh. |
| `Change will apply without restarting the gateway.` | Pemuatan ulang langsung menerapkannya otomatis. |
| `No gateway restart needed.`                        | Tidak ada perubahan yang relevan bagi runtime. |

Penulisan ke `plugins.entries` (atau subjalur apa pun) selalu memerlukan mulai ulang karena CLI tidak dapat membuktikan bahwa metadata pemuatan ulang setiap plugin telah dimuat.

## Keamanan penulisan

`openclaw config set` dan penulis konfigurasi lain yang dimiliki OpenClaw memvalidasi konfigurasi lengkap setelah perubahan sebelum menyimpannya ke disk. Jika muatan baru gagal dalam validasi skema atau tampak seperti penimpaan destruktif, konfigurasi aktif tidak diubah dan muatan yang ditolak disimpan di sebelahnya sebagai `openclaw.json.rejected.*`.

Penulisan yang dimiliki OpenClaw melakukan serialisasi ulang JSON5 sebagai JSON standar. Jika sumber berisi komentar, penulis akan langsung memperingatkan sebelum menghapusnya; gunakan editor langsung jika komentar perlu dipertahankan.

<Warning>
Jalur konfigurasi aktif harus berupa berkas biasa. Tata letak `openclaw.json` yang menggunakan symlink tidak didukung untuk penulisan; sebagai gantinya, gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung ke berkas sebenarnya.
</Warning>

Utamakan penulisan melalui CLI untuk pengeditan kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa muatan yang disimpan dan perbaiki bentuk konfigurasi lengkap:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan melalui editor langsung tetap diizinkan, tetapi Gateway yang sedang berjalan menganggapnya tidak tepercaya hingga berhasil divalidasi. Pengeditan langsung yang tidak valid menyebabkan kegagalan saat memulai atau dilewati oleh pemuatan ulang langsung; Gateway tidak menulis ulang `openclaw.json`. Jalankan `openclaw doctor --fix` untuk memperbaiki konfigurasi yang memiliki prefiks/tertimpa atau memulihkan salinan terakhir yang diketahui valid. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config).

Pemulihan seluruh berkas hanya diperuntukkan bagi perbaikan oleh doctor. Perubahan skema plugin atau ketidakselarasan `minHostVersion` tetap menghasilkan kegagalan yang jelas alih-alih mengembalikan pengaturan pengguna lain yang tidak terkait, seperti konfigurasi model, penyedia, profil autentikasi, saluran, eksposur Gateway, alat, memori, browser, atau cron.

## Siklus perbaikan

Setelah `openclaw config validate` berhasil, gunakan TUI lokal agar agen tertanam membandingkan konfigurasi aktif dengan dokumentasi sembari Anda memvalidasi setiap perubahan dari terminal yang sama:

```bash
openclaw chat
```

Di dalam TUI, awalan `!` menjalankan perintah shell lokal secara literal (setelah permintaan konfirmasi satu kali per sesi):

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
  <Step title="Terapkan pengeditan tertarget">
    Terapkan pengeditan tertarget dengan `openclaw config set` atau `openclaw configure`.
  </Step>
  <Step title="Validasi ulang">
    Jalankan ulang `openclaw config validate` setelah setiap perubahan.
  </Step>
  <Step title="Gunakan doctor untuk masalah runtime">
    Jika validasi berhasil tetapi runtime masih bermasalah, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk mendapatkan bantuan migrasi dan perbaikan.
  </Step>
</Steps>

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
