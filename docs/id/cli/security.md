---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada config/state
    - Anda ingin menerapkan saran "perbaikan" yang aman (izin, memperketat default)
summary: Referensi CLI untuk `openclaw security` (audit dan perbaiki kekeliruan keamanan umum)
title: Keamanan
x-i18n:
    generated_at: "2026-06-27T17:20:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

`security audit` biasa tetap berada di jalur konfigurasi dingin/sistem file/hanya baca. Secara default, perintah ini tidak menemukan kolektor keamanan runtime plugin, sehingga audit rutin tidak memuat setiap runtime plugin yang terpasang. Gunakan `--deep` untuk menyertakan probe Gateway langsung berbasis upaya terbaik dan kolektor audit keamanan milik plugin; pemanggil internal eksplisit juga dapat ikut memakai kolektor milik plugin tersebut ketika mereka sudah memiliki cakupan runtime yang sesuai.

Audit memperingatkan ketika beberapa pengirim DM berbagi sesi utama dan merekomendasikan **mode DM aman**: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk channel multi-akun) untuk kotak masuk bersama.
Ini ditujukan untuk pengerasan kotak masuk kooperatif/bersama. Satu Gateway yang dibagikan oleh operator yang saling tidak percaya/bersifat adversarial bukan penyiapan yang direkomendasikan; pisahkan batas kepercayaan dengan gateway terpisah (atau pengguna/host OS terpisah).
Audit juga memancarkan `security.trust_model.multi_user_heuristic` ketika konfigurasi mengindikasikan ingress pengguna bersama yang mungkin terjadi (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard), dan mengingatkan bahwa OpenClaw menggunakan model kepercayaan asisten pribadi secara default.
Untuk penyiapan pengguna bersama yang disengaja, panduan auditnya adalah menjalankan semua sesi dalam sandbox, menjaga akses sistem file tetap tercakup workspace, dan menjauhkan identitas atau kredensial pribadi/privat dari runtime tersebut.
Audit juga memperingatkan ketika model kecil (`<=300B`) digunakan tanpa sandboxing dan dengan alat web/browser diaktifkan.
Untuk ingress webhook, startup mencatat peringatan keamanan non-fatal dan audit menandai penggunaan ulang `hooks.token` dari nilai auth rahasia bersama Gateway yang aktif, termasuk `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` dan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Audit juga memperingatkan ketika:

- `hooks.token` pendek
- `hooks.path="/"`
- `hooks.defaultSessionKey` belum disetel
- `hooks.allowedAgentIds` tidak dibatasi
- override `sessionKey` permintaan diaktifkan
- override diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`

Jika auth kata sandi Gateway hanya diberikan saat startup, teruskan nilai yang sama ke `openclaw security audit --auth password --password <password>` agar audit dapat memeriksanya terhadap `hooks.token`.
Jalankan `openclaw doctor --fix` untuk merotasi `hooks.token` persisten yang digunakan ulang, lalu perbarui pengirim hook eksternal agar menggunakan token hook baru.

Audit juga memperingatkan ketika pengaturan Docker sandbox dikonfigurasi sementara mode sandbox nonaktif, ketika `gateway.nodes.denyCommands` menggunakan entri mirip pola/tidak dikenal yang tidak efektif (hanya pencocokan nama perintah node yang persis, bukan pemfilteran teks shell), ketika `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya, ketika `tools.profile="minimal"` global dioverride oleh profil alat agen, ketika alat tulis/edit dinonaktifkan tetapi `exec` masih tersedia tanpa batas sistem file sandbox yang membatasi, ketika DM atau grup terbuka mengekspos alat runtime/sistem file tanpa penjaga sandbox/workspace, dan ketika alat plugin yang terpasang mungkin dapat dijangkau di bawah kebijakan alat yang permisif.
Audit juga menandai `gateway.allowRealIpFallback=true` (risiko pemalsuan header jika proxy salah dikonfigurasi) dan `discovery.mdns.mode="full"` (kebocoran metadata melalui catatan TXT mDNS).
Audit juga memperingatkan ketika browser sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
Audit juga menandai mode jaringan Docker sandbox yang berbahaya (termasuk penggabungan namespace `host` dan `container:*`).
Audit juga memperingatkan ketika kontainer Docker browser sandbox yang ada memiliki label hash yang hilang/usang (misalnya kontainer pra-migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.
Audit juga memperingatkan ketika catatan instalasi plugin/hook berbasis npm tidak dipin, tidak memiliki metadata integritas, atau menyimpang dari versi paket yang saat ini terpasang.
Audit memperingatkan ketika allowlist channel bergantung pada nama/email/tag yang dapat berubah alih-alih ID stabil (cakupan Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC jika berlaku).
Audit memperingatkan ketika `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa rahasia bersama (`/tools/invoke` ditambah endpoint `/v1/*` apa pun yang diaktifkan).
Pengaturan yang diawali dengan `dangerous`/`dangerously` adalah override operator break-glass eksplisit; mengaktifkan salah satunya, dengan sendirinya, bukan laporan kerentanan keamanan.
Untuk inventaris lengkap parameter berbahaya, lihat bagian "Ringkasan flag tidak aman atau berbahaya" di [Keamanan](/id/gateway/security).

Temuan tetap yang disengaja dapat diterima dengan `security.audit.suppressions`.
Setiap suppression mencocokkan `checkId` persis dan dapat dipersempit dengan
substring peka-huruf besar/kecil `titleIncludes` dan/atau `detailIncludes`:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Temuan yang disuppress dihapus dari daftar `summary` dan `findings` aktif.
Output JSON menyimpannya di bawah `suppressedFindings` untuk auditabilitas.
Ketika suppression dikonfigurasi, output aktif juga mempertahankan temuan info
`security.audit.suppressions.active` yang tidak dapat disuppress agar pembaca dapat mengetahui audit
telah difilter. Flag konfigurasi berbahaya dipancarkan satu flag per temuan, sehingga
menerima satu flag berbahaya tidak menyembunyikan flag aktif lain yang berbagi
`checkId` `config.insecure_or_dangerous_flags` yang sama.
Karena suppression dapat menyembunyikan risiko tetap, menambah atau menghapusnya melalui
perintah shell yang dijalankan agen memerlukan persetujuan exec kecuali exec sudah berjalan
dengan `security="full"` dan `ask="off"` untuk otomasi lokal tepercaya.

Perilaku SecretRef:

- `security audit` menyelesaikan SecretRef yang didukung dalam mode hanya baca untuk jalur yang ditargetkan.
- Jika SecretRef tidak tersedia di jalur perintah saat ini, audit berlanjut dan melaporkan `secretDiagnostics` (alih-alih crash).
- `--token` dan `--password` hanya mengoverride auth probe mendalam untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang konfigurasi atau pemetaan SecretRef.

## Output JSON

Gunakan `--json` untuk pemeriksaan CI/kebijakan:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jika `--fix` dan `--json` digabungkan, output menyertakan tindakan perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Apa yang diubah `--fix`

`--fix` menerapkan remediasi yang aman dan deterministik:

- membalik `groupPolicy="open"` umum menjadi `groupPolicy="allowlist"` (termasuk varian akun di channel yang didukung)
- ketika kebijakan grup WhatsApp dibalik menjadi `allowlist`, mengisi awal `groupAllowFrom` dari
  file `allowFrom` tersimpan ketika daftar tersebut ada dan konfigurasi belum
  mendefinisikan `allowFrom`
- menyetel `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk state/konfigurasi dan file sensitif umum
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesi
  `*.jsonl`)
- juga memperketat file include konfigurasi yang direferensikan dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan reset `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/kata sandi/kunci API
- menonaktifkan alat (`gateway`, `cron`, `exec`, dll.)
- mengubah pilihan bind/auth/eksposur jaringan gateway
- menghapus atau menulis ulang plugin/skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
