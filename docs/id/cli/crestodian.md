---
read_when:
    - Anda menjalankan openclaw tanpa perintah dan ingin memahami Crestodian
    - Anda memerlukan cara aman tanpa config untuk memeriksa atau memperbaiki OpenClaw
    - Anda sedang merancang atau mengaktifkan mode penyelamatan message-channel
summary: Referensi CLI dan model keamanan untuk Crestodian, helper penyiapan dan perbaikan aman tanpa config
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian adalah helper penyiapan, perbaikan, dan konfigurasi lokal OpenClaw. Ini
dirancang agar tetap dapat dijangkau ketika jalur agent normal rusak.

Menjalankan `openclaw` tanpa perintah akan memulai Crestodian dalam terminal interaktif.
Menjalankan `openclaw crestodian` akan memulai helper yang sama secara eksplisit.

## Apa yang ditampilkan Crestodian

Saat startup, Crestodian interaktif membuka shell TUI yang sama seperti yang digunakan oleh
`openclaw tui`, dengan backend chat Crestodian. Log chat dimulai dengan sapaan singkat:

- kapan harus memulai Crestodian
- model atau jalur planner deterministik yang benar-benar digunakan Crestodian
- validitas config dan agent default
- keterjangkauan Gateway dari probe startup pertama
- tindakan debug berikutnya yang dapat diambil Crestodian

Crestodian tidak menampilkan secret atau memuat perintah CLI Plugin hanya untuk memulai. TUI
tetap menyediakan header normal, log chat, baris status, footer, autocomplete,
dan kontrol editor.

Gunakan `status` untuk inventaris detail dengan path config, path docs/source,
probe CLI lokal, keberadaan API key, agent, model, dan detail Gateway.

Crestodian menggunakan penemuan referensi OpenClaw yang sama seperti agent biasa. Dalam checkout Git,
Crestodian mengarahkan dirinya ke `docs/` lokal dan source tree lokal. Dalam
instalasi paket npm, Crestodian menggunakan docs paket yang dibundel dan menautkan ke
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan eksplisit
untuk meninjau source kapan pun docs tidak cukup.

## Contoh

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Di dalam TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Startup aman

Jalur startup Crestodian sengaja dibuat kecil. Crestodian dapat berjalan ketika:

- `openclaw.json` tidak ada
- `openclaw.json` tidak valid
- Gateway mati
- pendaftaran perintah Plugin tidak tersedia
- belum ada agent yang dikonfigurasi

`openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normal.
`openclaw` noninteraktif keluar dengan pesan singkat alih-alih mencetak bantuan root,
karena produk tanpa perintah adalah Crestodian.

## Operasi dan persetujuan

Crestodian menggunakan operasi bertipe alih-alih mengedit config secara ad hoc.

Operasi baca-saja dapat langsung dijalankan:

- tampilkan ringkasan
- daftarkan agent
- tampilkan status model/backend
- jalankan pemeriksaan status atau health
- periksa keterjangkauan Gateway
- jalankan doctor tanpa perbaikan interaktif
- validasi config
- tampilkan path audit-log

Operasi persisten memerlukan persetujuan percakapan dalam mode interaktif kecuali
Anda meneruskan `--yes` untuk perintah langsung:

- menulis config
- menjalankan `config set`
- menetapkan nilai SecretRef yang didukung melalui `config set-ref`
- menjalankan bootstrap setup/onboarding
- mengubah model default
- memulai, menghentikan, atau memulai ulang Gateway
- membuat agent
- menjalankan perbaikan doctor yang menulis ulang config atau state

Penulisan yang diterapkan dicatat di:

```text
~/.openclaw/audit/crestodian.jsonl
```

Penemuan tidak diaudit. Hanya operasi yang diterapkan dan penulisan yang dicatat.

`openclaw onboard --modern` memulai Crestodian sebagai pratinjau onboarding modern.
`openclaw onboard` biasa tetap menjalankan onboarding klasik.

## Bootstrap Setup

`setup` adalah bootstrap onboarding yang mengutamakan chat. Ini hanya menulis melalui operasi
config bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Saat tidak ada model yang dikonfigurasi, setup memilih backend pertama yang dapat digunakan dalam
urutan ini dan memberi tahu Anda pilihan yang diambil:

- model eksplisit yang sudah ada, jika sudah dikonfigurasi
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jika tidak ada yang tersedia, setup tetap menulis workspace default dan membiarkan
model tidak diatur. Instal atau login ke Codex/Claude Code, atau sediakan
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, lalu jalankan setup lagi.

## Planner Berbantuan Model

Crestodian selalu dimulai dalam mode deterministik. Untuk perintah fuzzy yang tidak
dipahami parser deterministik, Crestodian lokal dapat membuat satu giliran planner terbatas
melalui jalur runtime normal OpenClaw. Crestodian pertama-tama menggunakan model OpenClaw
yang dikonfigurasi. Jika belum ada model yang dikonfigurasi yang dapat digunakan, Crestodian dapat fallback
ke runtime lokal yang sudah ada pada mesin:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server Codex: `openai/gpt-5.5` dengan `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Planner berbantuan model tidak dapat mengubah config secara langsung. Planner harus menerjemahkan
permintaan ke salah satu perintah bertipe Crestodian, lalu aturan persetujuan dan
audit normal berlaku. Crestodian mencetak model yang digunakan dan perintah yang
diinterpretasikan sebelum menjalankan apa pun. Giliran planner fallback tanpa config
bersifat sementara, tool-disabled jika runtime mendukungnya, dan menggunakan
workspace/session sementara.

Mode penyelamatan message-channel tidak menggunakan planner berbantuan model. Penyelamatan
jarak jauh tetap deterministik agar jalur agent normal yang rusak atau dikompromikan
tidak dapat digunakan sebagai editor config.

## Beralih ke agent

Gunakan pemilih bahasa alami untuk meninggalkan Crestodian dan membuka TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` tetap membuka
TUI agent normal secara langsung. Ketiganya tidak memulai Crestodian.

Setelah beralih ke TUI normal, gunakan `/crestodian` untuk kembali ke Crestodian.
Anda dapat menyertakan permintaan lanjutan:

```text
/crestodian
/crestodian restart gateway
```

Peralihan agent di dalam TUI meninggalkan breadcrumb bahwa `/crestodian` tersedia.

## Mode penyelamatan pesan

Mode penyelamatan pesan adalah entrypoint message-channel untuk Crestodian. Ini ditujukan
untuk kasus ketika agent normal Anda mati, tetapi channel tepercaya seperti WhatsApp
masih menerima perintah.

Perintah teks yang didukung:

- `/crestodian <request>`

Alur operator:

```text
Anda, di DM owner tepercaya: /crestodian status
OpenClaw: Mode penyelamatan Crestodian. Gateway dapat dijangkau: tidak. Config valid: tidak.
Anda: /crestodian restart gateway
OpenClaw: Rencana: mulai ulang Gateway. Balas /crestodian yes untuk menerapkan.
Anda: /crestodian yes
OpenClaw: Diterapkan. Entri audit ditulis.
```

Pembuatan agent juga dapat diantrikan dari prompt lokal atau mode penyelamatan:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Mode penyelamatan jarak jauh adalah permukaan admin. Ini harus diperlakukan seperti
perbaikan config jarak jauh, bukan seperti chat normal.

Kontrak keamanan untuk penyelamatan jarak jauh:

- Dinonaktifkan ketika sandboxing aktif. Jika sebuah agent/session disandbox,
  Crestodian harus menolak penyelamatan jarak jauh dan menjelaskan bahwa perbaikan CLI lokal
  diperlukan.
- Status efektif default adalah `auto`: izinkan penyelamatan jarak jauh hanya dalam operasi
  YOLO tepercaya, ketika runtime sudah memiliki otoritas lokal tanpa sandbox.
- Memerlukan identitas owner eksplisit. Penyelamatan tidak boleh menerima aturan pengirim
  wildcard, group policy terbuka, Webhook tanpa autentikasi, atau channel anonim.
- Hanya owner DM secara default. Penyelamatan group/channel memerlukan opt-in eksplisit.
- Penyelamatan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agent
  interaktif. Gunakan `openclaw` lokal untuk handoff agent.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode penyelamatan.
- Audit setiap operasi penyelamatan yang diterapkan. Penyelamatan message-channel mencatat
  metadata channel, akun, pengirim, dan source-address. Operasi yang mengubah config juga
  mencatat hash config sebelum dan sesudah.
- Jangan pernah menggemakan secret. Pemeriksaan SecretRef harus melaporkan ketersediaan,
  bukan nilainya.
- Jika Gateway hidup, utamakan operasi bertipe Gateway. Jika Gateway mati, gunakan hanya
  permukaan perbaikan lokal minimal yang tidak bergantung pada loop agent normal.

Bentuk config:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` harus menerima:

- `"auto"`: default. Izinkan hanya ketika runtime efektif adalah YOLO dan
  sandboxing nonaktif.
- `false`: jangan pernah izinkan penyelamatan message-channel.
- `true`: secara eksplisit izinkan penyelamatan ketika pemeriksaan owner/channel lolos. Ini
  tetap tidak boleh melewati penolakan sandboxing.

Postur YOLO default `"auto"` adalah:

- mode sandbox diresolusikan ke `off`
- `tools.exec.security` diresolusikan ke `full`
- `tools.exec.ask` diresolusikan ke `off`

Penyelamatan jarak jauh dicakup oleh lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback planner lokal tanpa config dicakup oleh:

```bash
pnpm test:docker:crestodian-planner
```

Smoke command-surface live channel opt-in memeriksa `/crestodian status` plus
roundtrip persetujuan persisten melalui handler penyelamatan:

```bash
pnpm test:live:crestodian-rescue-channel
```

Setup awal tanpa config melalui Crestodian dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Lane tersebut dimulai dengan state dir kosong, merutekan `openclaw` kosong ke Crestodian,
menetapkan model default, membuat agent tambahan, mengonfigurasi Discord melalui
pengaktifan Plugin plus token SecretRef, memvalidasi config, dan memeriksa audit
log. QA Lab juga memiliki skenario berbasis repo untuk alur Ring 0 yang sama:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Security](/id/cli/security)
