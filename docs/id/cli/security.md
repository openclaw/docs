---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada konfigurasi/status
    - Anda ingin menerapkan saran "perbaikan" yang aman (izin, memperketat nilai bawaan)
summary: Referensi CLI untuk `openclaw security` (mengaudit dan memperbaiki kekeliruan keamanan umum yang berisiko)
title: Keamanan
x-i18n:
    generated_at: "2026-05-06T17:54:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Alat keamanan (audit + perbaikan opsional).

Terkait:

- Panduan keamanan: [Keamanan](/id/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` biasa tetap berada pada jalur dingin konfigurasi/sistem berkas/hanya-baca. Secara default, perintah ini tidak menemukan kolektor keamanan runtime Plugin, sehingga audit rutin tidak memuat setiap runtime Plugin yang terinstal. Gunakan `--deep` untuk menyertakan probe Gateway langsung berbasis upaya terbaik dan kolektor audit keamanan milik Plugin; pemanggil internal eksplisit juga dapat memilih ikut memakai kolektor milik Plugin tersebut ketika mereka sudah memiliki cakupan runtime yang sesuai.

Audit memperingatkan ketika beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk kanal multi-akun) untuk inbox bersama.
Ini ditujukan untuk pengerasan inbox kooperatif/bersama. Satu Gateway yang dibagikan oleh operator yang saling tidak percaya/bersifat adversarial bukan penyiapan yang direkomendasikan; pisahkan batas kepercayaan dengan Gateway terpisah (atau pengguna/host OS terpisah).
Audit juga mengeluarkan `security.trust_model.multi_user_heuristic` ketika konfigurasi menunjukkan kemungkinan ingress pengguna bersama (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan Anda bahwa OpenClaw secara default memakai model kepercayaan asisten pribadi.
Untuk penyiapan pengguna bersama yang disengaja, panduan audit adalah men-sandbox semua sesi, menjaga akses sistem berkas tetap tercakup ke workspace, dan menjaga identitas atau kredensial pribadi/privat tidak berada di runtime tersebut.
Audit juga memperingatkan ketika model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress Webhook, audit memperingatkan ketika `hooks.token` menggunakan ulang token Gateway, ketika `hooks.token` pendek, ketika `hooks.path="/"`, ketika `hooks.defaultSessionKey` belum disetel, ketika `hooks.allowedAgentIds` tidak dibatasi, ketika override `sessionKey` permintaan diaktifkan, dan ketika override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Audit juga memperingatkan ketika pengaturan Docker sandbox dikonfigurasi saat mode sandbox nonaktif, ketika `gateway.nodes.denyCommands` memakai entri yang tidak efektif seperti pola/tidak dikenal (hanya pencocokan nama perintah node secara persis, bukan pemfilteran teks shell), ketika `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, ketika `tools.profile="minimal"` global ditimpa oleh profil alat agen, ketika grup terbuka mengekspos alat runtime/sistem berkas tanpa pengaman sandbox/workspace, dan ketika alat Plugin terinstal mungkin dapat dijangkau di bawah kebijakan alat yang permisif.
Audit juga menandai `gateway.allowRealIpFallback=true` (risiko pemalsuan header jika proxy salah dikonfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui catatan TXT mDNS).
Audit juga memperingatkan ketika browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk `host` dan join namespace `container:*`).
Audit juga memperingatkan ketika kontainer Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya kontainer pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit juga memperingatkan ketika catatan instal Plugin/hook berbasis npm tidak dipin, kehilangan metadata integritas, atau menyimpang dari versi paket yang saat ini terinstal.
Audit memperingatkan ketika allowlist kanal bergantung pada nama/email/tag yang dapat berubah, bukan ID stabil (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, cakupan IRC jika berlaku).
Audit memperingatkan ketika `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa rahasia bersama (`/tools/invoke` ditambah endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan yang diawali dengan `dangerous`/`dangerously` adalah override operator break-glass eksplisit; mengaktifkannya tidak, dengan sendirinya, merupakan laporan kerentanan keamanan.
Untuk inventaris parameter berbahaya lengkap, lihat bagian "Ringkasan flag tidak aman atau berbahaya" di [Keamanan](/id/gateway/security).

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode hanya-baca untuk jalur yang ditargetkan.
- Jika SecretRef tidak tersedia di jalur perintah saat ini, audit berlanjut dan melaporkan `secretDiagnostics` (alih-alih crash).
- `--token` dan `--password` hanya meng-override auth probe mendalam untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang konfigurasi atau pemetaan SecretRef.

## Output JSON

Gunakan `--json` untuk pemeriksaan CI/kebijakan:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jika `--fix` dan `--json` digabungkan, output mencakup aksi perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Apa yang diubah `--fix`

`--fix` menerapkan remediasi yang aman dan deterministik:

- mengubah `groupPolicy="open"` umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di kanal yang didukung)
- ketika kebijakan grup WhatsApp berubah menjadi `allowlist`, mengisi awal `groupAllowFrom` dari
  file `allowFrom` yang tersimpan ketika daftar tersebut ada dan konfigurasi belum
  mendefinisikan `allowFrom`
- menetapkan `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk state/konfigurasi dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesi
  `*.jsonl`)
- juga memperketat file include konfigurasi yang dirujuk dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/password/kunci API
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/paparan jaringan Gateway
- menghapus atau menulis ulang plugins/Skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
