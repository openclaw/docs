---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada config/state
    - Anda ingin menerapkan saran "perbaikan" yang aman (izin, memperketat nilai default)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki kesalahan keamanan umum)
title: Keamanan
x-i18n:
    generated_at: "2026-05-10T19:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
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

`security audit` biasa tetap berada pada jalur konfigurasi/filesystem/read-only yang dingin. Secara default, perintah ini tidak menemukan kolektor keamanan runtime Plugin, sehingga audit rutin tidak memuat setiap runtime Plugin yang terpasang. Gunakan `--deep` untuk menyertakan probe Gateway live best-effort dan kolektor audit keamanan milik Plugin; pemanggil internal eksplisit juga dapat memilih kolektor milik Plugin tersebut saat mereka sudah memiliki cakupan runtime yang sesuai.

Audit memperingatkan saat beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk channel multi-akun) untuk kotak masuk bersama.
Ini ditujukan untuk pengerasan kotak masuk kooperatif/bersama. Satu Gateway yang dibagikan oleh operator yang saling tidak percaya/adversarial bukan setup yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna/host OS terpisah).
Audit juga mengeluarkan `security.trust_model.multi_user_heuristic` saat konfigurasi menunjukkan kemungkinan ingress pengguna bersama (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan Anda bahwa OpenClaw secara default menggunakan model kepercayaan asisten pribadi.
Untuk setup pengguna bersama yang disengaja, panduan audit adalah melakukan sandbox pada semua sesi, menjaga akses filesystem tetap terbatas ke workspace, dan menjauhkan identitas atau kredensial pribadi/privat dari runtime tersebut.
Audit juga memperingatkan saat model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress Webhook, audit memperingatkan saat `hooks.token` menggunakan kembali token Gateway, saat `hooks.token` pendek, saat `hooks.path="/"`, saat `hooks.defaultSessionKey` belum disetel, saat `hooks.allowedAgentIds` tidak dibatasi, saat override `sessionKey` request diaktifkan, dan saat override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`.
Audit juga memperingatkan saat pengaturan Docker sandbox dikonfigurasi sementara mode sandbox nonaktif, saat `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan persis nama perintah node, bukan pemfilteran teks shell), saat `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, saat `tools.profile="minimal"` global ditimpa oleh profil alat agen, saat alat tulis/edit dinonaktifkan tetapi `exec` masih tersedia tanpa batas filesystem sandbox yang membatasi, saat grup terbuka mengekspos alat runtime/filesystem tanpa pelindung sandbox/workspace, dan saat alat Plugin yang terpasang mungkin dapat dijangkau di bawah kebijakan alat yang permisif.
Audit juga menandai `gateway.allowRealIpFallback=true` (risiko spoofing header jika proxy salah konfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui record mDNS TXT).
Audit juga memperingatkan saat browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk join namespace `host` dan `container:*`).
Audit juga memperingatkan saat container Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya container pra-migrasi yang kehilangan `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit juga memperingatkan saat catatan instalasi Plugin/hook berbasis npm tidak dipin, metadata integritasnya hilang, atau menyimpang dari versi paket yang saat ini terpasang.
Audit memperingatkan saat allowlist channel bergantung pada nama/email/tag yang dapat berubah alih-alih ID stabil (Discord, Slack, Google Chat, Microsoft Teams, cakupan Mattermost, IRC jika berlaku).
Audit memperingatkan saat `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa shared secret (`/tools/invoke` ditambah endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan dengan prefiks `dangerous`/`dangerously` adalah override operator break-glass yang eksplisit; mengaktifkan salah satunya tidak, dengan sendirinya, merupakan laporan kerentanan keamanan.
Untuk inventaris lengkap parameter berbahaya, lihat bagian "Ringkasan flag tidak aman atau berbahaya" di [Keamanan](/id/gateway/security).

Perilaku SecretRef:

- `security audit` me-resolve SecretRef yang didukung dalam mode read-only untuk jalur yang ditargetkan.
- Jika SecretRef tidak tersedia di jalur perintah saat ini, audit berlanjut dan melaporkan `secretDiagnostics` (alih-alih crash).
- `--token` dan `--password` hanya menimpa auth deep-probe untuk invocation perintah tersebut; keduanya tidak menulis ulang konfigurasi atau pemetaan SecretRef.

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

## Apa yang diubah oleh `--fix`

`--fix` menerapkan remediasi yang aman dan deterministik:

- mengubah `groupPolicy="open"` umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di channel yang didukung)
- saat kebijakan grup WhatsApp berubah menjadi `allowlist`, mengisi seed `groupAllowFrom` dari
  file `allowFrom` yang tersimpan saat daftar tersebut ada dan konfigurasi belum
  mendefinisikan `allowFrom`
- menyetel `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk state/konfigurasi dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- juga memperketat file include konfigurasi yang dirujuk dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/password/API key
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang plugin/Skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
