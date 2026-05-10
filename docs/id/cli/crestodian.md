---
read_when:
    - Anda menjalankan openclaw tanpa perintah dan ingin memahami Crestodian
    - Anda memerlukan cara yang aman tanpa konfigurasi untuk memeriksa atau memperbaiki OpenClaw
    - Anda sedang merancang atau mengaktifkan mode penyelamatan saluran pesan
summary: Referensi CLI dan model keamanan untuk Crestodian, pembantu penyiapan dan perbaikan yang aman tanpa konfigurasi
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian adalah pembantu penyiapan lokal, perbaikan, dan konfigurasi OpenClaw. Ia
dirancang agar tetap dapat dijangkau ketika jalur agen normal rusak.

Menjalankan `openclaw` tanpa perintah akan memulai Crestodian di terminal interaktif.
Menjalankan `openclaw crestodian` akan memulai pembantu yang sama secara eksplisit.

## Yang Ditampilkan Crestodian

Saat startup, Crestodian interaktif membuka shell TUI yang sama dengan yang digunakan oleh
`openclaw tui`, dengan backend chat Crestodian. Log chat dimulai dengan sapaan singkat:

- kapan memulai Crestodian
- jalur model atau perencana deterministik yang sebenarnya digunakan Crestodian
- validitas config dan agen default
- keterjangkauan Gateway dari probe startup pertama
- tindakan debug berikutnya yang dapat dilakukan Crestodian

Ia tidak menumpahkan rahasia atau memuat perintah CLI Plugin hanya untuk memulai. TUI
tetap menyediakan header, log chat, baris status, footer, pelengkapan otomatis,
dan kontrol editor normal.

Gunakan `status` untuk inventaris terperinci dengan jalur config, jalur docs/sumber,
probe CLI lokal, keberadaan kunci API, agen, model, dan detail Gateway.

Crestodian menggunakan penemuan referensi OpenClaw yang sama seperti agen biasa. Dalam checkout Git,
ia mengarahkan dirinya ke `docs/` lokal dan pohon sumber lokal. Dalam instalasi paket npm, ia
menggunakan docs paket yang dibundel dan menautkan ke
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan eksplisit
untuk meninjau sumber ketika docs tidak mencukupi.

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Startup Aman

Jalur startup Crestodian sengaja dibuat kecil. Ia dapat berjalan ketika:

- `openclaw.json` tidak ada
- `openclaw.json` tidak valid
- Gateway sedang mati
- pendaftaran perintah Plugin tidak tersedia
- belum ada agen yang dikonfigurasi

`openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normal.
`openclaw` noninteraktif keluar dengan pesan singkat alih-alih mencetak bantuan root,
karena produk tanpa perintah adalah Crestodian.

## Operasi dan Persetujuan

Crestodian menggunakan operasi bertipe, bukan mengedit config secara ad hoc.

Operasi hanya-baca dapat berjalan segera:

- menampilkan ringkasan
- mencantumkan agen
- mencantumkan Plugin yang terpasang
- mencari Plugin ClawHub
- menampilkan status model/backend
- menjalankan pemeriksaan status atau kesehatan
- memeriksa keterjangkauan Gateway
- menjalankan doctor tanpa perbaikan interaktif
- memvalidasi config
- menampilkan jalur log audit

Operasi persisten memerlukan persetujuan percakapan dalam mode interaktif kecuali
Anda meneruskan `--yes` untuk perintah langsung:

- menulis config
- menjalankan `config set`
- mengatur nilai SecretRef yang didukung melalui `config set-ref`
- menjalankan bootstrap penyiapan/onboarding
- mengubah model default
- memulai, menghentikan, atau memulai ulang Gateway
- membuat agen
- memasang Plugin dari ClawHub atau npm
- menghapus pemasangan Plugin
- menjalankan perbaikan doctor yang menulis ulang config atau state

Penulisan yang diterapkan dicatat di:

```text
~/.openclaw/audit/crestodian.jsonl
```

Penemuan tidak diaudit. Hanya operasi dan penulisan yang diterapkan yang dicatat.

`openclaw onboard --modern` memulai Crestodian sebagai pratinjau onboarding modern.
`openclaw onboard` biasa tetap menjalankan onboarding klasik.

## Bootstrap Penyiapan

`setup` adalah bootstrap onboarding yang mengutamakan chat. Ia menulis hanya melalui operasi
config bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Ketika tidak ada model yang dikonfigurasi, setup memilih backend pertama yang dapat digunakan dalam
urutan ini dan memberi tahu apa yang dipilihnya:

- model eksplisit yang sudah ada, jika sudah dikonfigurasi
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jika tidak ada yang tersedia, setup tetap menulis workspace default dan membiarkan
model tidak disetel. Pasang atau masuk ke Codex/Claude Code, atau tampilkan
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, lalu jalankan setup lagi.

## Perencana Berbantuan Model

Crestodian selalu dimulai dalam mode deterministik. Untuk perintah fuzzy yang tidak
dipahami parser deterministik, Crestodian lokal dapat melakukan satu giliran perencana
terbatas melalui jalur runtime normal OpenClaw. Ia pertama-tama menggunakan
model OpenClaw yang dikonfigurasi. Jika belum ada model terkonfigurasi yang dapat digunakan,
ia dapat fallback ke runtime lokal yang sudah ada di mesin:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server Codex: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

Perencana berbantuan model tidak dapat memutasi config secara langsung. Ia harus menerjemahkan
permintaan menjadi salah satu perintah bertipe milik Crestodian, lalu aturan persetujuan dan
audit normal berlaku. Crestodian mencetak model yang digunakannya dan perintah yang ditafsirkan
sebelum menjalankan apa pun. Giliran perencana fallback tanpa config bersifat
sementara, alat dinonaktifkan jika runtime mendukungnya, dan menggunakan
workspace/sesi sementara.

Mode penyelamatan kanal pesan tidak menggunakan perencana berbantuan model. Penyelamatan jarak jauh
tetap deterministik sehingga jalur agen normal yang rusak atau disusupi tidak dapat
digunakan sebagai editor config.

## Beralih ke Agen

Gunakan pemilih bahasa alami untuk keluar dari Crestodian dan membuka TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` tetap membuka TUI
agen normal secara langsung. Mereka tidak memulai Crestodian.

Setelah beralih ke TUI normal, gunakan `/crestodian` untuk kembali ke Crestodian.
Anda dapat menyertakan permintaan lanjutan:

```text
/crestodian
/crestodian restart gateway
```

Peralihan agen di dalam TUI meninggalkan jejak bahwa `/crestodian` tersedia.

## Mode Penyelamatan Pesan

Mode penyelamatan pesan adalah entrypoint kanal pesan untuk Crestodian. Ini ditujukan untuk
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

Mode penyelamatan jarak jauh adalah permukaan admin. Ia harus diperlakukan seperti perbaikan
config jarak jauh, bukan seperti chat normal.

Kontrak keamanan untuk penyelamatan jarak jauh:

- Dinonaktifkan ketika sandboxing aktif. Jika agen/sesi berada dalam sandbox,
  Crestodian harus menolak penyelamatan jarak jauh dan menjelaskan bahwa perbaikan CLI lokal
  diperlukan.
- State efektif default adalah `auto`: izinkan penyelamatan jarak jauh hanya dalam operasi YOLO
  tepercaya, ketika runtime sudah memiliki otoritas lokal tanpa sandbox.
- Memerlukan identitas owner eksplisit. Penyelamatan tidak boleh menerima aturan pengirim wildcard,
  kebijakan grup terbuka, webhook tanpa autentikasi, atau kanal anonim.
- Hanya DM owner secara default. Penyelamatan grup/kanal memerlukan opt-in eksplisit.
- Pencarian dan daftar Plugin bersifat hanya-baca. Pemasangan Plugin bersifat hanya-lokal secara default
  karena mengunduh kode yang dapat dieksekusi. Penghapusan pemasangan Plugin dapat diizinkan sebagai
  operasi perbaikan yang disetujui ketika kebijakan penyelamatan mengizinkan penulisan persisten.
- Penyelamatan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen
  interaktif. Gunakan `openclaw` lokal untuk handoff agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode penyelamatan.
- Audit setiap operasi penyelamatan yang diterapkan. Penyelamatan kanal pesan mencatat metadata kanal,
  akun, pengirim, dan alamat sumber. Operasi yang memutasi config juga
  mencatat hash config sebelum dan sesudah.
- Jangan pernah menggemakan rahasia. Inspeksi SecretRef harus melaporkan ketersediaan, bukan
  nilai.
- Jika Gateway hidup, utamakan operasi bertipe Gateway. Jika Gateway mati, gunakan hanya
  permukaan perbaikan lokal minimal yang tidak bergantung pada loop agen normal.

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
  sandboxing mati.
- `false`: jangan pernah izinkan penyelamatan kanal pesan.
- `true`: izinkan penyelamatan secara eksplisit ketika pemeriksaan owner/kanal lolos. Ini
  tetap tidak boleh melewati penolakan sandboxing.

Postur YOLO `"auto"` default adalah:

- mode sandbox terurai menjadi `off`
- `tools.exec.security` terurai menjadi `full`
- `tools.exec.ask` terurai menjadi `off`

Penyelamatan jarak jauh dicakup oleh lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback perencana lokal tanpa config dicakup oleh:

```bash
pnpm test:docker:crestodian-planner
```

Smoke permukaan perintah kanal live opt-in memeriksa `/crestodian status` ditambah
roundtrip persetujuan persisten melalui handler penyelamatan:

```bash
pnpm test:live:crestodian-rescue-channel
```

Penyiapan baru tanpa config melalui Crestodian dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Lane itu dimulai dengan direktori state kosong, merutekan `openclaw` polos ke Crestodian,
menyetel model default, membuat agen tambahan, mengonfigurasi Discord melalui
pengaktifan Plugin ditambah token SecretRef, memvalidasi config, dan memeriksa log
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
