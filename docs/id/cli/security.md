---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada config/state
    - Anda ingin menerapkan saran “fix” yang aman (izin, memperketat default)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki footgun keamanan umum)
title: security
x-i18n:
    generated_at: "2026-04-05T13:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Tool keamanan (audit + perbaikan opsional).

Terkait:

- Panduan keamanan: [Security](/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Audit memperingatkan ketika beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk channel multi-akun) untuk kotak masuk bersama.
Ini ditujukan untuk penguatan kotak masuk kooperatif/bersama. Satu Gateway yang dibagikan oleh operator yang saling tidak dipercaya/bersifat adversarial bukanlah setup yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna OS/host terpisah).
Audit juga menghasilkan `security.trust_model.multi_user_heuristic` ketika config menunjukkan ingress pengguna bersama yang mungkin terjadi (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan Anda bahwa model kepercayaan OpenClaw secara default adalah asisten pribadi.
Untuk setup pengguna bersama yang disengaja, panduan audit adalah menjalankan sandbox untuk semua sesi, menjaga akses filesystem tetap dibatasi ke workspace, serta tidak menempatkan identitas atau kredensial pribadi/pribadi sensitif pada runtime tersebut.
Audit juga memperingatkan ketika model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan tool web/browser diaktifkan.
Untuk ingress webhook, audit memperingatkan ketika `hooks.token` menggunakan ulang token Gateway, ketika `hooks.token` pendek, ketika `hooks.path="/"`, ketika `hooks.defaultSessionKey` tidak disetel, ketika `hooks.allowedAgentIds` tidak dibatasi, ketika override `sessionKey` permintaan diaktifkan, dan ketika override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Audit juga memperingatkan ketika pengaturan Docker sandbox dikonfigurasi sementara mode sandbox nonaktif, ketika `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan nama perintah node yang persis, bukan pemfilteran teks shell), ketika `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, ketika `tools.profile="minimal"` global dioverride oleh profil tool agen, ketika grup terbuka mengekspos tool runtime/filesystem tanpa pelindung sandbox/workspace, dan ketika tool plugin ekstensi yang terinstal mungkin dapat dijangkau di bawah kebijakan tool yang permisif.
Audit juga menandai `gateway.allowRealIpFallback=true` (risiko spoofing header jika proxy salah konfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui rekaman TXT mDNS).
Audit juga memperingatkan ketika browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk `host` dan penggabungan namespace `container:*`).
Audit juga memperingatkan ketika container Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya container pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit juga memperingatkan ketika catatan instalasi plugin/hook berbasis npm tidak dipin, tidak memiliki metadata integritas, atau mengalami drift dari versi paket yang saat ini terinstal.
Audit memperingatkan ketika daftar izin channel mengandalkan nama/email/tag yang dapat berubah alih-alih ID stabil (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, cakupan IRC jika berlaku).
Audit memperingatkan ketika `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa secret bersama (`/tools/invoke` ditambah endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan yang diawali dengan `dangerous`/`dangerously` adalah override operator break-glass yang eksplisit; mengaktifkan salah satunya bukan, dengan sendirinya, laporan kerentanan keamanan.
Untuk inventaris lengkap parameter berbahaya, lihat bagian "Insecure or dangerous flags summary" di [Security](/gateway/security).

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode baca-saja untuk path yang ditargetkan.
- Jika SecretRef tidak tersedia di jalur perintah saat ini, audit tetap berlanjut dan melaporkan `secretDiagnostics` (bukan crash).
- `--token` dan `--password` hanya mengoverride autentikasi deep-probe untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang config atau pemetaan SecretRef.

## Output JSON

Gunakan `--json` untuk pemeriksaan CI/kebijakan:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jika `--fix` dan `--json` digabungkan, output mencakup tindakan perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Apa yang diubah oleh `--fix`

`--fix` menerapkan remediasi yang aman dan deterministik:

- mengubah `groupPolicy="open"` yang umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di channel yang didukung)
- ketika kebijakan grup WhatsApp diubah menjadi `allowlist`, mengisi `groupAllowFrom` dari
  file `allowFrom` yang tersimpan saat daftar itu ada dan config belum
  mendefinisikan `allowFrom`
- menetapkan `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk state/config dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesi
  `*.jsonl`)
- juga memperketat file include config yang dirujuk dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` di Windows

`--fix` **tidak**:

- merotasi token/kata sandi/API key
- menonaktifkan tool (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang plugin/Skills
