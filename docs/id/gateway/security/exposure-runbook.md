---
read_when:
    - Mengekspos Gateway melalui LAN, tailnet, Tailscale Serve, Funnel, atau proksi terbalik
    - Meninjau deployment sebelum mengizinkan pengguna perpesanan nyata
    - Mengembalikan konfigurasi akses jarak jauh atau DM yang berisiko ke kondisi sebelumnya
sidebarTitle: Exposure runbook
summary: Daftar periksa prapenerbangan dan pemulihan sebelum mengekspos Gateway OpenClaw di luar loopback
title: Panduan operasional pemaparan Gateway
x-i18n:
    generated_at: "2026-07-12T14:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Ekspos Gateway hanya setelah Anda dapat menjelaskan siapa yang dapat mengaksesnya, bagaimana mereka
diautentikasi, agen mana yang dapat mereka picu, dan alat apa yang dapat
digunakan oleh agen tersebut. Jika ragu, kembalilah ke akses khusus local loopback dan jalankan ulang audit.
</Warning>

Panduan operasional ini mengubah panduan [Keamanan](/id/gateway/security) yang lebih luas menjadi
daftar periksa operator untuk akses jarak jauh dan eksposur perpesanan.

## Pilih pola eksposur

Utamakan pola paling terbatas yang memenuhi alur kerja.

| Pola                       | Direkomendasikan ketika                                | Kontrol wajib                                                                                                                                  |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + terowongan SSH  | Penggunaan pribadi, akses admin, penelusuran kesalahan | Pertahankan `gateway.bind: "loopback"` dan buat terowongan ke `127.0.0.1:18789`                                                                |
| Loopback + Tailscale Serve | Akses tailnet pribadi ke Control UI/WebSocket          | Pertahankan Gateway khusus local loopback; header identitas Tailscale hanya mengautentikasi permukaan WebSocket Control UI, bukan jalur autentikasi lainnya |
| Pengikatan tailnet/LAN     | Jaringan privat khusus dengan perangkat yang diketahui | Autentikasi Gateway, daftar izin firewall, tanpa penerusan port publik                                                                          |
| Proksi balik tepercaya     | SSO/OIDC organisasi di depan Gateway                   | Autentikasi `trusted-proxy`, `trustedProxies` yang ketat, aturan penimpaan/penghapusan header, pengguna yang diizinkan secara eksplisit          |
| Internet publik            | Penerapan langka dan berisiko tinggi                   | Proksi berbasis identitas, TLS, batas laju, daftar izin ketat, sesi non-utama dalam sandbox                                                      |

Hindari penerusan port publik langsung ke Gateway. Jika akses publik
diperlukan, tempatkan proksi berbasis identitas di depannya dan jadikan proksi tersebut
sebagai satu-satunya jalur jaringan menuju Gateway.

## Inventaris pra-pelaksanaan

Catat hal-hal berikut sebelum mengubah kebijakan pengikatan, proksi, Tailscale, atau kanal:

- Host Gateway, pengguna OS, dan direktori status (default `~/.openclaw`).
- URL Gateway dan mode pengikatan (`gateway.bind`; port default `18789`).
- Mode autentikasi, sumber token/kata sandi, atau sumber identitas proksi tepercaya.
- Setiap kanal yang diaktifkan dan apakah kanal tersebut menerima DM, grup, atau webhook.
- Agen yang dapat dijangkau oleh pengirim nonlokal.
- Profil alat, mode sandbox, dan kebijakan alat dengan hak istimewa untuk setiap agen yang dapat dijangkau.
- Kredensial eksternal yang tersedia bagi agen tersebut.
- Lokasi cadangan untuk `~/.openclaw/openclaw.json` dan kredensial.

Jika lebih dari satu orang dapat mengirim pesan kepada bot, perlakukan ini sebagai otoritas
alat terdelegasi bersama, bukan isolasi host per pengguna.

## Pemeriksaan dasar

Jalankan sebelum membuka akses:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Selesaikan temuan kritis terlebih dahulu. Terima peringatan hanya jika disengaja dan
didokumentasikan untuk penerapan tersebut. Lihat [Pemeriksaan audit keamanan](/id/gateway/security/audit-checks)
untuk mengetahui arti setiap `checkId` dan kunci perbaikannya.

Untuk validasi CLI jarak jauh, berikan kredensial secara eksplisit:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Jangan berasumsi bahwa kredensial konfigurasi lokal berlaku untuk URL jarak jauh yang dinyatakan secara eksplisit.

## Dasar aman minimum

Gunakan struktur ini sebagai titik awal untuk penerapan yang diekspos:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Perluas satu kontrol pada satu waktu: tambahkan daftar izin kanal tertentu sebelum mengaktifkan
alat yang dapat menulis, atau aktifkan proksi balik sebelum menerima lalu lintas Control UI
jarak jauh.

`tools.exec.security: "deny"` memblokir semua panggilan eksekusi, termasuk
diagnostik yang aman. Jika diagnostik atau perintah berisiko rendah diperlukan, longgarkan ini hanya
setelah memilih pengirim, agen, perintah, dan mode persetujuan tertentu yang
sesuai dengan model ancaman Anda.

## Eksposur DM dan grup

Kanal perpesanan adalah permukaan masukan yang tidak tepercaya. Sebelum mengizinkan DM atau
grup:

- Utamakan `dmPolicy: "pairing"` atau daftar `allowFrom` yang ketat daripada `dmPolicy: "open"`.
- Jangan gabungkan daftar izin `"*"` dengan akses alat yang luas.
- Wajibkan penyebutan dalam grup kecuali ruang tersebut dikontrol dengan ketat.
- Tetapkan `session.dmScope: "per-channel-peer"` (atau `"per-account-channel-peer"` untuk
  kanal multiakun) ketika beberapa orang dapat mengirim DM kepada bot, agar sesi DM
  tidak berbagi konteks.
- Arahkan kanal bersama ke agen dengan alat minimum dan tanpa
  kredensial pribadi.

Pemasangan menyetujui pengirim untuk memicu bot. Hal ini tidak menjadikan pengirim tersebut sebagai
batas keamanan host yang terpisah.

## Pemeriksaan proksi balik

Untuk proksi berbasis identitas:

- Proksi harus mengautentikasi pengguna sebelum meneruskan ke Gateway.
- Firewall atau kebijakan jaringan harus memblokir akses langsung ke port Gateway.
- `gateway.trustedProxies` hanya boleh mencantumkan IP sumber proksi.
- Proksi harus menghapus atau menimpa header identitas dan penerusan
  yang diberikan oleh klien.
- Tetapkan `gateway.auth.trustedProxy.allowUsers` ketika proksi melayani lebih dari
  satu kelompok pengguna.
- Gunakan `gateway.auth.trustedProxy.allowLoopback` hanya untuk proksi pada host yang sama,
  tempat proses lokal dipercaya dan proksi mengelola header identitas.

Jalankan `openclaw security audit --deep` setelah perubahan proksi. Temuan
proksi tepercaya sangat signifikan karena proksi menjadi batas
autentikasi.

## Peninjauan alat dan sandbox

Sebelum mengekspos agen kepada pengirim jarak jauh:

- Pastikan sesi mana yang berjalan pada host dan mana yang berjalan dalam sandbox.
- Tolak atau wajibkan persetujuan untuk eksekusi pada host.
- Pertahankan alat dengan hak istimewa dalam keadaan nonaktif kecuali pengirim tepercaya tertentu membutuhkannya.
- Hindari alat peramban, kanvas, Node, Cron, Gateway, dan pemunculan sesi untuk permukaan
  perpesanan terbuka atau semi-terbuka.
- Pertahankan cakupan titik kait tetap sempit; hindari jalur kredensial, direktori utama, soket Docker, dan
  sistem.
- Gunakan Gateway, pengguna OS, atau host terpisah untuk batas kepercayaan
  yang berbeda secara material.

Jika pengguna jarak jauh tidak sepenuhnya dipercaya, isolasi harus berasal dari
penerapan terpisah, bukan hanya dari prompt atau label sesi.

## Validasi pascaperubahan

Setelah setiap perubahan eksposur:

1. Jalankan ulang `openclaw security audit --deep`.
2. Pastikan koneksi resmi berhasil tersambung.
3. Pastikan pengirim atau sesi peramban yang tidak resmi ditolak.
4. Pastikan log menyamarkan rahasia.
5. Pastikan perutean DM/grup hanya mencapai agen yang dituju.
6. Pastikan alat berdampak tinggi meminta persetujuan atau ditolak.
7. Dokumentasikan peringatan residual yang diterima.

Jangan lanjutkan ke perubahan eksposur berikutnya sampai perubahan saat ini
dipahami.

## Rencana pemulihan

Jika Gateway mungkin terekspos secara berlebihan:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Kemudian:

1. Hentikan penerusan publik, Tailscale Funnel, atau rute proksi balik.
2. Rotasikan token/kata sandi Gateway dan kredensial integrasi yang terdampak.
3. Hapus `"*"` dan pengirim yang tidak diharapkan dari daftar izin.
4. Tinjau log audit terbaru, riwayat eksekusi, panggilan alat, dan perubahan konfigurasi.
5. Jalankan ulang `openclaw security audit --deep`.
6. Aktifkan kembali akses dengan pola paling terbatas yang memenuhi alur kerja.

## Daftar periksa peninjauan

- Gateway tetap khusus local loopback kecuali terdapat alasan yang didokumentasikan.
- Akses non-loopback memiliki autentikasi, perlindungan firewall, dan tidak memiliki rute publik langsung.
- Penerapan proksi tepercaya memiliki IP proksi dan kontrol header yang ketat.
- DM menggunakan pemasangan atau daftar izin, bukan akses terbuka secara default.
- Grup mewajibkan penyebutan atau daftar izin eksplisit.
- Kanal bersama tidak dapat mengakses kredensial pribadi.
- Sesi non-utama berjalan dalam mode sandbox.
- Eksekusi pada host dan alat dengan hak istimewa ditolak atau dibatasi oleh persetujuan.
- Log menyamarkan rahasia.
- Temuan audit kritis telah diselesaikan.
- Langkah pemulihan telah diuji dan didokumentasikan.
