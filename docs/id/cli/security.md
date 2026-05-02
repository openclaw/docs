---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada konfigurasi/keadaan
    - Anda ingin menerapkan saran “perbaikan” yang aman (izin, memperketat nilai bawaan)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki kesalahan umum yang menjadi risiko keamanan)
title: Keamanan
x-i18n:
    generated_at: "2026-05-02T09:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

`security audit` biasa tetap berada di jalur config/filesystem/read-only yang dingin. Secara default, perintah ini tidak menemukan kolektor keamanan runtime plugin, sehingga audit rutin tidak memuat setiap runtime plugin yang terpasang. Gunakan `--deep` untuk menyertakan probe Gateway langsung dengan upaya terbaik dan kolektor audit keamanan milik plugin; pemanggil internal eksplisit juga dapat ikut menggunakan kolektor milik plugin tersebut ketika mereka sudah memiliki cakupan runtime yang sesuai.

Audit memperingatkan ketika beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk channel multi-akun) untuk kotak masuk bersama.
Ini untuk pengerasan kotak masuk kooperatif/bersama. Satu Gateway yang dibagikan oleh operator yang saling tidak dipercaya/adversarial bukan penyiapan yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna/host OS terpisah).
Ini juga menghasilkan `security.trust_model.multi_user_heuristic` ketika config menunjukkan kemungkinan ingress pengguna bersama (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan bahwa OpenClaw secara default memakai model kepercayaan asisten pribadi.
Untuk penyiapan pengguna bersama yang disengaja, panduan audit adalah melakukan sandbox pada semua sesi, menjaga akses filesystem tetap tercakup ke workspace, dan menjauhkan identitas atau kredensial pribadi/privat dari runtime tersebut.
Ini juga memperingatkan ketika model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress webhook, ini memperingatkan ketika `hooks.token` menggunakan ulang token Gateway, ketika `hooks.token` pendek, ketika `hooks.path="/"`, ketika `hooks.defaultSessionKey` belum diatur, ketika `hooks.allowedAgentIds` tidak dibatasi, ketika override `sessionKey` permintaan diaktifkan, dan ketika override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Ini juga memperingatkan ketika pengaturan sandbox Docker dikonfigurasi sementara mode sandbox nonaktif, ketika `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan persis nama perintah node, bukan pemfilteran teks shell), ketika `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node yang berbahaya, ketika `tools.profile="minimal"` global dioverride oleh profil alat agent, ketika grup terbuka mengekspos alat runtime/filesystem tanpa penjaga sandbox/workspace, dan ketika alat plugin yang terpasang mungkin dapat dijangkau dalam kebijakan alat yang permisif.
Ini juga menandai `gateway.allowRealIpFallback=true` (risiko header spoofing jika proxy salah dikonfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui record mDNS TXT).
Ini juga memperingatkan ketika browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Ini juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk `host` dan join namespace `container:*`).
Ini juga memperingatkan ketika container Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya container pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Ini juga memperingatkan ketika record instalasi plugin/hook berbasis npm tidak dipin, tidak memiliki metadata integritas, atau menyimpang dari versi paket yang saat ini terpasang.
Ini memperingatkan ketika allowlist channel bergantung pada nama/email/tag yang dapat berubah alih-alih ID stabil (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, cakupan IRC jika berlaku).
Ini memperingatkan ketika `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa shared secret (`/tools/invoke` ditambah endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan berawalan `dangerous`/`dangerously` adalah override operator break-glass eksplisit; mengaktifkan salah satunya, dengan sendirinya, bukan laporan kerentanan keamanan.
Untuk inventaris parameter berbahaya lengkap, lihat bagian "Ringkasan flag tidak aman atau berbahaya" di [Keamanan](/id/gateway/security).

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode read-only untuk jalur targetnya.
- Jika SecretRef tidak tersedia di jalur perintah saat ini, audit berlanjut dan melaporkan `secretDiagnostics` (alih-alih crash).
- `--token` dan `--password` hanya mengoverride auth deep-probe untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang config atau pemetaan SecretRef.

## Output JSON

Gunakan `--json` untuk pemeriksaan CI/kebijakan:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jika `--fix` dan `--json` digabungkan, output menyertakan aksi perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Yang diubah oleh `--fix`

`--fix` menerapkan remediasi aman dan deterministik:

- mengubah `groupPolicy="open"` umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di channel yang didukung)
- ketika kebijakan grup WhatsApp berubah ke `allowlist`, mengisi awal `groupAllowFrom` dari
  file `allowFrom` yang tersimpan ketika daftar tersebut ada dan config belum
  mendefinisikan `allowFrom`
- mengatur `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk state/config dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- juga memperketat file include config yang direferensikan dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/kata sandi/API key
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang plugins/skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
