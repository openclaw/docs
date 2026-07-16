---
read_when:
    - Anda ingin menjalankan audit keamanan cepat pada konfigurasi/status
    - Anda ingin menerapkan saran "perbaikan" yang aman (izin, memperketat nilai default)
summary: Referensi CLI untuk `openclaw security` (mengaudit dan memperbaiki kekeliruan keamanan umum)
title: Keamanan
x-i18n:
    generated_at: "2026-07-16T17:56:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Alat keamanan: audit serta perbaikan aman opsional. Terkait: [Keamanan](/id/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Mode audit

`security audit` biasa tetap menggunakan jalur konfigurasi dingin/sistem berkas/hanya-baca: ini tidak menemukan kolektor keamanan runtime plugin, sehingga audit rutin tidak memuat setiap runtime plugin yang terpasang. `--deep` menambahkan pemeriksaan Gateway aktif dengan upaya terbaik dan kolektor audit keamanan milik plugin (pemanggil internal eksplisit juga dapat memilih untuk menggunakan kolektor tersebut jika sudah memiliki cakupan runtime yang sesuai).

Jika autentikasi kata sandi Gateway hanya diberikan saat startup, teruskan nilai yang sama dengan `--auth password --password <password>` agar audit dapat memeriksanya terhadap `hooks.token`.

## Yang diperiksa

**Model DM/kepercayaan**

- Memperingatkan ketika beberapa pengirim DM berbagi sesi utama dan merekomendasikan mode DM aman: `session.dmScope="per-channel-peer"` (atau `per-account-channel-peer` untuk kanal multiakun) untuk kotak masuk bersama. Ini adalah penguatan kooperatif/kotak masuk bersama, bukan isolasi bagi operator yang tidak saling dipercaya; pisahkan batas kepercayaan dengan Gateway terpisah (atau pengguna OS/host terpisah) untuk keperluan tersebut.
- Menghasilkan `security.trust_model.multi_user_heuristic` ketika konfigurasi menunjukkan kemungkinan masuknya beberapa pengguna bersama (misalnya kebijakan DM/grup terbuka, target grup yang dikonfigurasi, atau aturan pengirim wildcard) — model kepercayaan default OpenClaw adalah asisten pribadi (satu operator), bukan isolasi multipenyewa yang bermusuhan. Untuk penyiapan bersama banyak pengguna yang disengaja: gunakan sandbox pada semua sesi, batasi akses sistem berkas pada ruang kerja, dan jauhkan identitas atau kredensial pribadi/privat dari runtime tersebut.
- Memperingatkan ketika model kecil (parameter `<=300B`) digunakan tanpa sandbox serta dengan alat web/peramban diaktifkan.

**Webhook/hook**

Startup mencatat peringatan keamanan nonfatal, dan audit menandai penggunaan ulang `hooks.token` atas nilai autentikasi rahasia bersama Gateway yang aktif (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Juga memperingatkan ketika:

- `hooks.token` terlalu pendek
- `hooks.path="/"`
- `hooks.defaultSessionKey` tidak ditetapkan
- `hooks.allowedAgentIds` tidak dibatasi
- penggantian `sessionKey` permintaan diaktifkan
- penggantian diaktifkan tanpa `hooks.allowedSessionKeyPrefixes`

Jalankan `openclaw doctor --fix` untuk merotasi `hooks.token` tersimpan yang digunakan ulang, lalu perbarui pengirim hook eksternal agar menggunakan token baru.

**Sandbox/alat**

- Memperingatkan ketika pengaturan Docker sandbox dikonfigurasi sementara mode sandbox dinonaktifkan.
- Memperingatkan ketika `gateway.nodes.denyCommands` menggunakan entri menyerupai pola/tidak dikenal yang tidak efektif (pencocokan hanya berdasarkan nama perintah node secara persis, bukan pemfilteran teks shell).
- Memperingatkan ketika `gateway.nodes.allowCommands` secara eksplisit mengaktifkan perintah node berbahaya.
- Memperingatkan ketika `tools.profile="minimal"` global ditimpa oleh profil alat agen.
- Memperingatkan ketika alat tulis/edit dinonaktifkan tetapi `exec` masih tersedia tanpa batas sistem berkas sandbox yang membatasi.
- Memperingatkan ketika DM atau grup terbuka mengekspos alat runtime/sistem berkas tanpa pelindung sandbox/ruang kerja.
- Memperingatkan ketika alat plugin yang terpasang mungkin dapat dijangkau berdasarkan kebijakan alat yang permisif.

**Peramban sandbox**

- Memperingatkan ketika peramban sandbox menggunakan jaringan Docker `bridge` tanpa `sandbox.browser.cdpSourceRange`.
- Menandai mode jaringan Docker sandbox yang berbahaya, termasuk penggabungan namespace `host` dan `container:*`.
- Memperingatkan ketika kontainer Docker peramban sandbox yang ada memiliki label hash yang hilang/usang (misalnya kontainer sebelum migrasi yang tidak memiliki `openclaw.browserConfigEpoch`) dan merekomendasikan `openclaw sandbox recreate --browser --all`.

**Jaringan/penemuan**

- Menandai `gateway.allowRealIpFallback=true` (risiko pemalsuan header jika proksi salah dikonfigurasi).
- Menandai `discovery.mdns.mode="full"` (kebocoran metadata melalui rekaman TXT mDNS).
- Memperingatkan ketika `gateway.auth.mode="none"` membuat API HTTP Gateway dapat dijangkau tanpa rahasia bersama (`/tools/invoke` beserta setiap endpoint `/v1/*` yang diaktifkan).

**Plugin/kanal**

- Memperingatkan ketika catatan pemasangan plugin/hook berbasis npm tidak disematkan, tidak memiliki metadata integritas, atau menyimpang dari versi paket yang saat ini terpasang.
- Memperingatkan ketika daftar yang diizinkan untuk kanal mengandalkan nama/email/tag yang dapat berubah, bukan ID stabil (cakupan Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC jika berlaku).

Pengaturan yang diawali dengan `dangerous`/`dangerously` merupakan penggantian darurat eksplisit oleh operator; mengaktifkan salah satunya bukanlah laporan kerentanan keamanan dengan sendirinya. Untuk inventaris lengkap parameter berbahaya, lihat "Ringkasan tanda tidak aman atau berbahaya" di [Keamanan](/id/gateway/security).

## Perilaku SecretRef

`security audit` menyelesaikan SecretRef yang didukung dalam mode hanya-baca untuk jalur yang ditargetkan. Jika SecretRef tidak tersedia pada jalur perintah saat ini, audit berlanjut dan melaporkan `secretDiagnostics`, bukan mengalami crash. `--token` dan `--password` hanya mengganti autentikasi pemeriksaan mendalam untuk pemanggilan perintah tersebut; keduanya tidak menulis ulang konfigurasi atau pemetaan SecretRef.

## Supresi

Terima temuan tetap yang disengaja dengan `security.audit.suppressions`. Setiap supresi mencocokkan `checkId` secara persis dan dapat dipersempit dengan substring `titleIncludes` dan/atau `detailIncludes` yang tidak peka huruf besar-kecil:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Plugin ekstensi yang diaktifkan: gbrain",
          "reason": "plugin operator lokal tepercaya"
        }
      ]
    }
  }
}
```

Temuan yang disupresi dihapus dari daftar `summary` dan `findings` aktif. Keluaran JSON mempertahankannya di bawah `suppressedFindings` agar dapat diaudit. Ketika supresi dikonfigurasi, keluaran aktif juga mempertahankan temuan info `security.audit.suppressions.active` yang tidak dapat disupresi agar pembaca mengetahui bahwa audit telah difilter. Tanda konfigurasi berbahaya dihasilkan satu tanda per temuan, sehingga menerima satu tanda berbahaya tidak menyembunyikan tanda aktif lain yang memiliki checkId `config.insecure_or_dangerous_flags` yang sama.

Karena supresi dapat menyembunyikan risiko tetap, menambahkan atau menghapusnya melalui perintah shell yang dijalankan agen memerlukan persetujuan eksekusi, kecuali eksekusi sudah berjalan dengan `security="full"` dan `ask="off"` untuk otomatisasi lokal tepercaya.

## Keluaran JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Dengan `--fix --json`, keluaran mencakup tindakan perbaikan dan laporan akhir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Yang diubah oleh `--fix`

Menerapkan remediasi yang aman dan deterministik:

- mengubah `groupPolicy="open"` umum menjadi `groupPolicy="allowlist"` (termasuk varian akun pada kanal yang didukung)
- ketika kebijakan grup WhatsApp berubah menjadi `allowlist`, mengisi awal `groupAllowFrom` dari berkas `allowFrom` yang tersimpan jika daftar tersebut ada dan konfigurasi belum mendefinisikan `allowFrom`
- menetapkan `logging.redactSensitive` dari `"off"` menjadi `"tools"`
- memperketat izin untuk status/konfigurasi dan berkas sensitif umum (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite`, serta artefak sesi lama)
- juga memperketat berkas penyertaan konfigurasi yang dirujuk dari `openclaw.json`
- menggunakan `chmod` pada host POSIX dan pengaturan ulang `icacls` pada Windows

`--fix` **tidak**:

- merotasi token/kata sandi/kunci API
- menonaktifkan alat (`gateway`, `cron`, `exec`, dan sebagainya)
- mengubah pilihan pengikatan/autentikasi/eksposur jaringan Gateway
- menghapus atau menulis ulang plugin/Skills

## Terkait

- [Referensi CLI](/id/cli)
- [Audit keamanan](/id/gateway/security)
