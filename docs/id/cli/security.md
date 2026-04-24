---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada config/status
    - Anda ingin menerapkan saran “fix” yang aman (izin, memperketat default)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki footgun keamanan yang umum)
title: Keamanan
x-i18n:
    generated_at: "2026-04-24T09:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
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

Audit memperingatkan saat beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk saluran multi-akun) untuk inbox bersama.
Ini ditujukan untuk hardening inbox bersama/kooperatif. Satu Gateway yang dibagi oleh operator yang saling tidak dipercaya/bersifat adversarial bukan penyiapan yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna OS/host terpisah).
Audit juga mengeluarkan `security.trust_model.multi_user_heuristic` saat config menunjukkan kemungkinan ingress pengguna bersama (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan bahwa OpenClaw secara default menggunakan model kepercayaan asisten pribadi.
Untuk penyiapan pengguna bersama yang disengaja, panduan audit adalah melakukan sandbox pada semua sesi, menjaga akses filesystem tetap dibatasi ke workspace, dan menjauhkan identitas atau kredensial pribadi/pribadi dari runtime tersebut.
Audit juga memperingatkan saat model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress Webhook, audit memperingatkan saat `hooks.token` menggunakan ulang token Gateway, saat `hooks.token` terlalu pendek, saat `hooks.path="/"`, saat `hooks.defaultSessionKey` tidak disetel, saat `hooks.allowedAgentIds` tidak dibatasi, saat override `sessionKey` permintaan diaktifkan, dan saat override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Audit juga memperingatkan saat pengaturan Docker sandbox dikonfigurasi sementara mode sandbox nonaktif, saat `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan nama perintah node exact, bukan pemfilteran teks shell), saat `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, saat `tools.profile="minimal"` global dioverride oleh profil alat agen, saat grup terbuka mengekspos alat runtime/filesystem tanpa pengaman sandbox/workspace, dan saat alat plugin terinstal mungkin dapat dijangkau di bawah kebijakan alat permisif.
Audit juga menandai `gateway.allowRealIpFallback=true` (risiko spoofing header jika proxy salah dikonfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui record TXT mDNS).
Audit juga memperingatkan saat browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit juga menandai mode jaringan Docker sandbox berbahaya (termasuk `host` dan penggabungan namespace `container:*`).
Audit juga memperingatkan saat container Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya container pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit juga memperingatkan saat catatan instalasi plugin/hook berbasis npm tidak disematkan, tidak memiliki metadata integritas, atau menyimpang dari versi paket yang saat ini terinstal.
Audit memperingatkan saat allowlist saluran bergantung pada nama/email/tag yang dapat berubah alih-alih ID stabil (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, cakupan IRC jika berlaku).
Audit memperingatkan saat `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa shared secret (`/tools/invoke` plus endpoint `/v1/*` yang diaktifkan).
Pengaturan dengan prefiks `dangerous`/`dangerously` adalah override operator break-glass yang eksplisit; mengaktifkan salah satunya bukan, dengan sendirinya, laporan kerentanan keamanan.
Untuk inventaris lengkap parameter berbahaya, lihat bagian "Insecure or dangerous flags summary" di [Keamanan](/id/gateway/security).

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode hanya-baca untuk path targetnya.
- Jika SecretRef tidak tersedia pada jalur perintah saat ini, audit tetap berjalan dan melaporkan `secretDiagnostics` (alih-alih crash).
- `--token` dan `--password` hanya meng-override autentikasi deep-probe untuk invocation perintah tersebut; keduanya tidak menulis ulang config atau mapping SecretRef.

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

## Perubahan yang dilakukan `--fix`

`--fix` menerapkan remedi yang aman dan deterministik:

- membalik `groupPolicy="open"` yang umum menjadi `groupPolicy="allowlist"` (termasuk varian akun pada saluran yang didukung)
- saat kebijakan grup WhatsApp dibalik ke `allowlist`, mengisi `groupAllowFrom` dari
  file `allowFrom` yang tersimpan ketika daftar tersebut ada dan config belum
  mendefinisikan `allowFrom`
- menyetel `logging.redactSensitive` dari `"off"` ke `"tools"`
- memperketat izin untuk status/config dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- juga memperketat file include config yang dirujuk dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/password/API key
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang plugin/Skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
