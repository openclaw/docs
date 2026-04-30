---
read_when:
    - Anda menjalankan openclaw tanpa perintah dan ingin memahami Crestodian
    - Anda memerlukan cara yang aman tanpa konfigurasi untuk memeriksa atau memperbaiki OpenClaw
    - Anda sedang merancang atau mengaktifkan mode penyelamatan saluran pesan
summary: Referensi CLI dan model keamanan untuk Crestodian, pembantu penyiapan dan perbaikan yang aman tanpa konfigurasi
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T09:38:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian adalah pembantu penyiapan, perbaikan, dan konfigurasi lokal OpenClaw. Ini
dirancang agar tetap dapat dijangkau saat jalur agen normal rusak.

Menjalankan `openclaw` tanpa perintah akan memulai Crestodian di terminal interaktif.
Menjalankan `openclaw crestodian` memulai pembantu yang sama secara eksplisit.

## Yang ditampilkan Crestodian

Saat startup, Crestodian interaktif membuka shell TUI yang sama dengan yang digunakan oleh
`openclaw tui`, dengan backend chat Crestodian. Log chat dimulai dengan sapaan singkat:

- kapan memulai Crestodian
- jalur model atau perencana deterministik yang sebenarnya digunakan Crestodian
- validitas konfigurasi dan agen default
- keterjangkauan Gateway dari probe startup pertama
- tindakan debug berikutnya yang dapat dilakukan Crestodian

Ini tidak membuang rahasia atau memuat perintah CLI plugin hanya untuk memulai. TUI
tetap menyediakan header, log chat, baris status, footer, pelengkapan otomatis,
dan kontrol editor normal.

Gunakan `status` untuk inventaris terperinci dengan jalur konfigurasi, jalur docs/sumber,
probe CLI lokal, keberadaan kunci API, agen, model, dan detail Gateway.

Crestodian menggunakan penemuan referensi OpenClaw yang sama seperti agen biasa. Dalam checkout Git,
ia mengarahkan dirinya ke `docs/` lokal dan pohon sumber lokal. Dalam instalasi paket npm, ia
menggunakan docs paket yang dibundel dan menautkan ke
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan eksplisit
untuk meninjau sumber saat docs tidak cukup.

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

Jalur startup Crestodian sengaja dibuat kecil. Ini dapat berjalan saat:

- `openclaw.json` tidak ada
- `openclaw.json` tidak valid
- Gateway sedang mati
- pendaftaran perintah plugin tidak tersedia
- belum ada agen yang dikonfigurasi

`openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normal.
`openclaw` noninteraktif keluar dengan pesan singkat alih-alih mencetak bantuan root,
karena produk tanpa perintah adalah Crestodian.

## Operasi dan persetujuan

Crestodian menggunakan operasi bertipe alih-alih mengedit konfigurasi secara ad hoc.

Operasi hanya-baca dapat langsung berjalan:

- tampilkan ringkasan
- daftar agen
- tampilkan status model/backend
- jalankan pemeriksaan status atau kesehatan
- periksa keterjangkauan Gateway
- jalankan doctor tanpa perbaikan interaktif
- validasi konfigurasi
- tampilkan jalur log audit

Operasi persisten memerlukan persetujuan percakapan dalam mode interaktif kecuali
Anda meneruskan `--yes` untuk perintah langsung:

- tulis konfigurasi
- jalankan `config set`
- tetapkan nilai SecretRef yang didukung melalui `config set-ref`
- jalankan bootstrap penyiapan/onboarding
- ubah model default
- mulai, hentikan, atau mulai ulang Gateway
- buat agen
- jalankan perbaikan doctor yang menulis ulang konfigurasi atau status

Penulisan yang diterapkan dicatat di:

```text
~/.openclaw/audit/crestodian.jsonl
```

Penemuan tidak diaudit. Hanya operasi dan penulisan yang diterapkan yang dicatat.

`openclaw onboard --modern` memulai Crestodian sebagai pratinjau onboarding modern.
`openclaw onboard` biasa tetap menjalankan onboarding klasik.

## Bootstrap penyiapan

`setup` adalah bootstrap onboarding yang mengutamakan chat. Ini menulis hanya melalui operasi
konfigurasi bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Saat tidak ada model yang dikonfigurasi, penyiapan memilih backend pertama yang dapat digunakan dalam
urutan ini dan memberi tahu Anda apa yang dipilihnya:

- model eksplisit yang sudah ada, jika sudah dikonfigurasi
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jika tidak ada yang tersedia, penyiapan tetap menulis workspace default dan membiarkan
model belum ditetapkan. Instal atau masuk ke Codex/Claude Code, atau ekspos
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, lalu jalankan penyiapan lagi.

## Perencana Berbantuan Model

Crestodian selalu dimulai dalam mode deterministik. Untuk perintah fuzzy yang tidak dipahami
parser deterministik, Crestodian lokal dapat membuat satu giliran perencana terbatas
melalui jalur runtime normal OpenClaw. Ia pertama-tama menggunakan
model OpenClaw yang dikonfigurasi. Jika belum ada model terkonfigurasi yang dapat digunakan, ia dapat
fallback ke runtime lokal yang sudah ada di mesin:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Harness Codex app-server: `openai/gpt-5.5` dengan `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Perencana berbantuan model tidak dapat memutasi konfigurasi secara langsung. Ia harus menerjemahkan
permintaan menjadi salah satu perintah bertipe Crestodian, lalu aturan persetujuan dan
audit normal berlaku. Crestodian mencetak model yang digunakannya dan perintah yang
ditafsirkan sebelum menjalankan apa pun. Giliran perencana fallback tanpa konfigurasi bersifat
sementara, alat dinonaktifkan jika runtime mendukungnya, dan menggunakan
workspace/sesi sementara.

Mode penyelamatan kanal pesan tidak menggunakan perencana berbantuan model. Penyelamatan jarak jauh
tetap deterministik sehingga jalur agen normal yang rusak atau terkompromi tidak dapat
digunakan sebagai editor konfigurasi.

## Beralih ke agen

Gunakan pemilih bahasa alami untuk meninggalkan Crestodian dan membuka TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` tetap membuka TUI
agen normal secara langsung. Mereka tidak memulai Crestodian.

Setelah beralih ke TUI normal, gunakan `/crestodian` untuk kembali ke Crestodian.
Anda dapat menyertakan permintaan tindak lanjut:

```text
/crestodian
/crestodian restart gateway
```

Peralihan agen di dalam TUI meninggalkan breadcrumb bahwa `/crestodian` tersedia.

## Mode penyelamatan pesan

Mode penyelamatan pesan adalah entrypoint kanal pesan untuk Crestodian. Ini untuk
kasus ketika agen normal Anda mati, tetapi kanal tepercaya seperti WhatsApp
masih menerima perintah.

Perintah teks yang didukung:

- `/crestodian <request>`

Alur operator:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Pembuatan agen juga dapat diantrekan dari prompt lokal atau mode penyelamatan:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Mode penyelamatan jarak jauh adalah permukaan admin. Ini harus diperlakukan seperti perbaikan konfigurasi
jarak jauh, bukan seperti chat normal.

Kontrak keamanan untuk penyelamatan jarak jauh:

- Dinonaktifkan saat sandboxing aktif. Jika agen/sesi berada dalam sandbox,
  Crestodian harus menolak penyelamatan jarak jauh dan menjelaskan bahwa perbaikan CLI lokal
  diperlukan.
- Status efektif default adalah `auto`: izinkan penyelamatan jarak jauh hanya dalam operasi YOLO
  tepercaya, tempat runtime sudah memiliki otoritas lokal tanpa sandbox.
- Memerlukan identitas pemilik eksplisit. Penyelamatan tidak boleh menerima aturan pengirim
  wildcard, kebijakan grup terbuka, webhook tanpa autentikasi, atau kanal anonim.
- DM pemilik saja secara default. Penyelamatan grup/kanal memerlukan opt-in eksplisit.
- Penyelamatan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen
  interaktif. Gunakan `openclaw` lokal untuk handoff agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode penyelamatan.
- Audit setiap operasi penyelamatan yang diterapkan. Penyelamatan kanal pesan mencatat metadata
  kanal, akun, pengirim, dan alamat sumber. Operasi yang memutasi konfigurasi juga
  mencatat hash konfigurasi sebelum dan sesudah.
- Jangan pernah menggemakan rahasia. Inspeksi SecretRef harus melaporkan ketersediaan, bukan
  nilai.
- Jika Gateway hidup, pilih operasi bertipe Gateway. Jika Gateway
  mati, gunakan hanya permukaan perbaikan lokal minimal yang tidak bergantung pada
  loop agen normal.

Bentuk konfigurasi:

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

- `"auto"`: default. Izinkan hanya saat runtime efektif adalah YOLO dan
  sandboxing mati.
- `false`: jangan pernah izinkan penyelamatan kanal pesan.
- `true`: izinkan penyelamatan secara eksplisit saat pemeriksaan pemilik/kanal lulus. Ini
  tetap tidak boleh melewati penolakan sandboxing.

Postur YOLO `"auto"` default adalah:

- mode sandbox diselesaikan ke `off`
- `tools.exec.security` diselesaikan ke `full`
- `tools.exec.ask` diselesaikan ke `off`

Penyelamatan jarak jauh dicakup oleh lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback perencana lokal tanpa konfigurasi dicakup oleh:

```bash
pnpm test:docker:crestodian-planner
```

Smoke permukaan perintah kanal live opt-in memeriksa `/crestodian status` plus
roundtrip persetujuan persisten melalui handler penyelamatan:

```bash
pnpm test:live:crestodian-rescue-channel
```

Penyiapan baru tanpa konfigurasi melalui Crestodian dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Lane tersebut dimulai dengan direktori status kosong, merutekan `openclaw` kosong ke Crestodian,
menetapkan model default, membuat agen tambahan, mengonfigurasi Discord melalui
pengaktifan plugin plus SecretRef token, memvalidasi konfigurasi, dan memeriksa log
audit. QA Lab juga memiliki skenario berbasis repo untuk alur Ring 0 yang sama:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Keamanan](/id/cli/security)
