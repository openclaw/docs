---
read_when:
    - Anda menjalankan openclaw tanpa perintah setelah penyiapan dan ingin memahami Crestodian
    - Anda memerlukan cara yang aman tanpa konfigurasi untuk memeriksa atau memperbaiki OpenClaw
    - Anda sedang merancang atau mengaktifkan mode penyelamatan kanal pesan
summary: Referensi CLI dan model keamanan untuk Crestodian, pembantu penyiapan dan perbaikan yang aman tanpa konfigurasi
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:18:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian adalah pembantu penyiapan, perbaikan, dan konfigurasi lokal OpenClaw. Ini
dirancang agar tetap dapat dijangkau saat jalur agen normal rusak.

Menjalankan `openclaw` tanpa perintah akan memulai orientasi klasik terlebih dahulu saat
file konfigurasi aktif tidak ada atau tidak memiliki pengaturan yang ditulis (kosong atau
hanya metadata). Setelah file konfigurasi memiliki pengaturan yang ditulis, menjalankan
`openclaw` tanpa perintah akan memulai Crestodian di terminal interaktif. Menjalankan
`openclaw crestodian` memulai pembantu yang sama secara eksplisit.

## Yang Ditampilkan Crestodian

Saat mulai, Crestodian interaktif membuka shell TUI yang sama dengan yang digunakan oleh
`openclaw tui`, dengan backend chat Crestodian. Log chat dimulai dengan sapaan singkat:

- kapan memulai Crestodian
- model atau jalur perencana deterministik yang benar-benar digunakan Crestodian
- validitas konfigurasi dan agen default
- keterjangkauan Gateway dari probe startup pertama
- tindakan debug berikutnya yang dapat dilakukan Crestodian

Ini tidak membuang secret atau memuat perintah CLI plugin hanya untuk memulai. TUI
tetap menyediakan header, log chat, baris status, footer, pelengkapan otomatis,
dan kontrol editor normal.

Gunakan `status` untuk inventaris terperinci dengan path konfigurasi, path docs/source,
probe CLI lokal, keberadaan kunci API, agen, model, dan detail Gateway.

Crestodian menggunakan penemuan referensi OpenClaw yang sama seperti agen reguler. Dalam checkout Git,
ini mengarahkan dirinya ke `docs/` lokal dan pohon source lokal. Dalam instalasi paket npm, ini
menggunakan docs paket bawaan dan menautkan ke
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan eksplisit
untuk meninjau source setiap kali docs tidak cukup.

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

Jalur startup Crestodian sengaja dibuat kecil. Ini dapat berjalan saat:

- `openclaw.json` tidak ada
- `openclaw.json` tidak valid
- Gateway sedang down
- pendaftaran perintah Plugin tidak tersedia
- belum ada agen yang dikonfigurasi

`openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normal.
`openclaw` polos noninteraktif keluar dengan pesan singkat alih-alih mencetak
bantuan root. Pada instalasi baru, pesan tersebut mengarah ke orientasi noninteraktif;
setelah penyiapan, pesan tersebut mengarah ke perintah Crestodian sekali jalan.

## Operasi dan Persetujuan

Crestodian menggunakan operasi bertipe alih-alih mengedit konfigurasi secara ad hoc.

Operasi baca-saja dapat langsung berjalan:

- tampilkan ringkasan
- daftar agen
- daftar Plugin terinstal
- cari Plugin ClawHub
- tampilkan status model/backend
- jalankan pemeriksaan status atau kesehatan
- periksa keterjangkauan Gateway
- jalankan doctor tanpa perbaikan interaktif
- validasi konfigurasi
- tampilkan path log audit

Operasi persisten memerlukan persetujuan percakapan dalam mode interaktif kecuali
Anda meneruskan `--yes` untuk perintah langsung:

- tulis konfigurasi
- jalankan `config set`
- tetapkan nilai SecretRef yang didukung melalui `config set-ref`
- jalankan bootstrap penyiapan/orientasi
- ubah model default
- mulai, hentikan, atau mulai ulang Gateway
- buat agen
- instal Plugin dari ClawHub atau npm
- hapus instalasi Plugin
- jalankan perbaikan doctor yang menulis ulang konfigurasi atau status

Penulisan yang diterapkan dicatat di:

```text
~/.openclaw/audit/crestodian.jsonl
```

Penemuan tidak diaudit. Hanya operasi dan penulisan yang diterapkan yang dicatat.

`openclaw onboard --modern` memulai Crestodian sebagai pratinjau orientasi modern.
`openclaw onboard` biasa tetap menjalankan orientasi klasik.

## Bootstrap Penyiapan

`setup` adalah bootstrap orientasi yang mengutamakan chat. Ini hanya menulis melalui operasi
konfigurasi bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Saat tidak ada model yang dikonfigurasi, penyiapan memilih backend pertama yang dapat digunakan dalam
urutan ini dan memberi tahu Anda apa yang dipilih:

- model eksplisit yang sudah ada, jika sudah dikonfigurasi
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- CLI Claude Code -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` melalui harness app-server Codex

Jika tidak ada yang tersedia, penyiapan tetap menulis workspace default dan membiarkan
model tidak ditetapkan. Instal atau masuk ke Codex/Claude Code, atau sediakan
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, lalu jalankan penyiapan lagi.

## Perencana Berbantuan Model

Crestodian selalu mulai dalam mode deterministik. Untuk perintah samar yang tidak
dipahami parser deterministik, Crestodian lokal dapat membuat satu giliran perencana
terbatas melalui jalur runtime normal OpenClaw. Ini pertama menggunakan model
OpenClaw yang dikonfigurasi. Jika belum ada model terkonfigurasi yang dapat digunakan, ini dapat
fallback ke runtime lokal yang sudah ada di mesin:

- CLI Claude Code: `claude-cli/claude-opus-4-8`
- harness app-server Codex: `openai/gpt-5.5`

Perencana berbantuan model tidak dapat mengubah konfigurasi secara langsung. Ini harus menerjemahkan
permintaan menjadi salah satu perintah bertipe Crestodian, lalu aturan persetujuan dan
audit normal berlaku. Crestodian mencetak model yang digunakannya dan perintah yang
diinterpretasikan sebelum menjalankan apa pun. Giliran perencana fallback tanpa konfigurasi bersifat
sementara, tool dinonaktifkan jika didukung runtime, dan menggunakan
workspace/sesi sementara.

Mode penyelamatan kanal pesan tidak menggunakan perencana berbantuan model. Penyelamatan jarak jauh
tetap deterministik agar jalur agen normal yang rusak atau disusupi tidak dapat
digunakan sebagai editor konfigurasi.

## Beralih ke Agen

Gunakan pemilih bahasa alami untuk meninggalkan Crestodian dan membuka TUI normal:

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

Peralihan agen di dalam TUI meninggalkan penanda bahwa `/crestodian` tersedia.

## Mode Penyelamatan Pesan

Mode penyelamatan pesan adalah entrypoint kanal pesan untuk Crestodian. Ini digunakan untuk
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

Pembuatan agen juga dapat dimasukkan ke antrean dari prompt lokal atau mode penyelamatan:

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
  tepercaya, saat runtime sudah memiliki otoritas lokal tanpa sandbox.
- Memerlukan identitas owner eksplisit. Penyelamatan tidak boleh menerima aturan pengirim
  wildcard, kebijakan grup terbuka, Webhook tanpa autentikasi, atau kanal anonim.
- DM owner saja secara default. Penyelamatan grup/kanal memerlukan opt-in eksplisit.
- Pencarian dan daftar Plugin bersifat baca-saja. Instalasi Plugin bersifat hanya lokal secara default
  karena mengunduh kode yang dapat dieksekusi. Penghapusan instalasi Plugin dapat diizinkan sebagai
  operasi perbaikan yang disetujui saat kebijakan penyelamatan mengizinkan penulisan persisten.
- Penyelamatan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen
  interaktif. Gunakan `openclaw` lokal untuk handoff agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode penyelamatan.
- Audit setiap operasi penyelamatan yang diterapkan. Penyelamatan kanal pesan mencatat metadata kanal,
  akun, pengirim, dan alamat sumber. Operasi yang mengubah konfigurasi juga
  mencatat hash konfigurasi sebelum dan sesudah.
- Jangan pernah menggemakan secret. Inspeksi SecretRef harus melaporkan ketersediaan, bukan
  nilai.
- Jika Gateway hidup, utamakan operasi bertipe Gateway. Jika Gateway
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
  sandboxing nonaktif.
- `false`: jangan pernah izinkan penyelamatan kanal pesan.
- `true`: izinkan penyelamatan secara eksplisit saat pemeriksaan owner/kanal lolos. Ini
  tetap tidak boleh melewati penolakan sandboxing.

Postur YOLO `"auto"` default adalah:

- mode sandbox bernilai `off`
- `tools.exec.security` bernilai `full`
- `tools.exec.ask` bernilai `off`

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

Penyiapan tanpa konfigurasi melalui perintah Crestodian eksplisit dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Lane tersebut dimulai dengan direktori status kosong, memverifikasi entrypoint Crestodian
orientasi modern, menetapkan model default, membuat agen tambahan, mengonfigurasi
Discord melalui pengaktifan Plugin plus SecretRef token, memvalidasi konfigurasi, dan
memeriksa log audit. QA Lab juga memiliki skenario berbasis repo untuk alur Ring 0
yang sama:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Keamanan](/id/cli/security)
