---
read_when:
    - Meninjau postur keamanan atau skenario ancaman
    - Mengerjakan fitur keamanan atau tanggapan audit
summary: Model ancaman OpenClaw yang dipetakan ke kerangka kerja MITRE ATLAS
title: Model ancaman (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T14:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versi:** 1.0-draft | **Kerangka kerja:** [MITRE ATLAS](https://atlas.mitre.org/) (Lanskap Ancaman Adversarial untuk Sistem AI) + diagram aliran data

Model ancaman ini mendokumentasikan ancaman adversarial terhadap platform agen AI OpenClaw dan lokapasar keterampilan ClawHub. Dokumen ini terus diperbarui dan dikelola oleh komunitas OpenClaw. Lihat [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL) untuk mengetahui cara melaporkan ancaman baru, mengusulkan rantai serangan, atau menyarankan mitigasi.

**Sumber daya utama ATLAS:** [Teknik](https://atlas.mitre.org/techniques/) | [Taktik](https://atlas.mitre.org/tactics/) | [Studi kasus](https://atlas.mitre.org/studies/) | [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data) | [Berkontribusi pada ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Cakupan

| Komponen                   | Disertakan | Catatan                                               |
| -------------------------- | ----------- | ----------------------------------------------------- |
| Runtime agen OpenClaw      | Ya          | Eksekusi agen inti, pemanggilan alat, sesi             |
| Gateway                    | Ya          | Autentikasi, perutean, integrasi saluran                |
| Integrasi saluran          | Ya          | WhatsApp, Telegram, Discord, Signal, Slack, dan lainnya |
| Lokapasar ClawHub          | Ya          | Penerbitan, moderasi, dan distribusi keterampilan       |
| Server MCP                 | Ya          | Penyedia alat eksternal                                |
| Perangkat pengguna         | Sebagian    | Aplikasi seluler, klien desktop                         |

Laporan di luar cakupan dan pola positif palsu (paparan ke internet publik, rantai yang hanya berupa injeksi prompt tanpa melewati batas, operator yang tidak saling memercayai berbagi satu hos Gateway, dan lainnya) dicantumkan dalam [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); berkas tersebut merupakan sumber kebenaran terkini untuk cakupan laporan kerentanan, bukan halaman ini.

## 2. Arsitektur sistem

### 2.1 Batas kepercayaan

```text
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device pairing (1h DM pairing / 5m node pairing TTL)   │   │
│  │  • AllowFrom / allowlist validation                       │   │
│  │  • Token / password / Tailscale auth                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox (default) or host (exec approvals)      │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (random-boundary XML tags)   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Static pattern + AST-adjacent moderation scanning      │   │
│  │  • LLM-based agentic risk review + VirusTotal scanning    │   │
│  │  • GitHub account age verification (14 days)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Aliran data

| Aliran | Sumber  | Tujuan   | Data                   | Perlindungan                |
| ------ | ------- | -------- | ---------------------- | --------------------------- |
| F1     | Saluran | Gateway  | Pesan pengguna         | TLS, `AllowFrom`            |
| F2     | Gateway | Agen     | Pesan yang dirutekan   | Isolasi sesi                |
| F3     | Agen    | Alat     | Pemanggilan alat       | Penegakan kebijakan         |
| F4     | Agen    | Eksternal | Permintaan `web_fetch` | Pemblokiran SSRF            |
| F5     | ClawHub | Agen     | Kode keterampilan      | Moderasi, pemindaian        |
| F6     | Agen    | Saluran  | Respons                | Pemfilteran keluaran        |

---

## 3. Analisis ancaman berdasarkan taktik ATLAS

### 3.1 Pengintaian (AML.TA0002)

#### T-RECON-001: Penemuan titik akhir agen

| Atribut                  | Nilai                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0006 - Pemindaian Aktif                                               |
| **Deskripsi**            | Penyerang memindai titik akhir Gateway OpenClaw yang terekspos             |
| **Vektor serangan**      | Pemindaian jaringan, kueri Shodan, enumerasi DNS                           |
| **Komponen terdampak**   | Gateway, titik akhir API yang terekspos                                    |
| **Mitigasi saat ini**    | Opsi autentikasi Tailscale, terikat ke local loopback secara bawaan        |
| **Risiko residual**      | Sedang - Gateway publik dapat ditemukan                                    |
| **Rekomendasi**          | Dokumentasikan penerapan aman, tambahkan pembatasan laju pada titik akhir penemuan |

#### T-RECON-002: Penyelidikan integrasi saluran

| Atribut                  | Nilai                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0006 - Pemindaian Aktif                                                  |
| **Deskripsi**            | Penyerang menyelidiki saluran perpesanan untuk mengidentifikasi akun yang dikelola AI |
| **Vektor serangan**      | Mengirim pesan pengujian, mengamati pola respons                              |
| **Komponen terdampak**   | Semua integrasi saluran                                                       |
| **Mitigasi saat ini**    | Tidak ada yang spesifik                                                       |
| **Risiko residual**      | Rendah - penemuan saja memberikan nilai yang terbatas                         |
| **Rekomendasi**          | Pertimbangkan pengacakan waktu respons                                        |

---

### 3.2 Akses awal (AML.TA0004)

#### T-ACCESS-001: Intersepsi kode pemasangan

| Atribut                  | Nilai                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Akses API Inferensi Model AI                                                                      |
| **Deskripsi**            | Penyerang mencegat kode pemasangan selama jendela pemasangan (1 jam untuk DM/pemasangan umum, 5 menit untuk pemasangan Node) |
| **Vektor serangan**      | Mengintip dari balik bahu, penyadapan jaringan, rekayasa sosial                                                |
| **Komponen terdampak**   | Sistem pemasangan perangkat                                                                                   |
| **Mitigasi saat ini**    | TTL 1 jam (DM/pemasangan umum), TTL 5 menit (pemasangan Node); kode dikirim melalui saluran yang ada          |
| **Risiko tersisa**       | Sedang - jendela pemasangan dapat dieksploitasi                                                               |
| **Rekomendasi**          | Kurangi jendela pemasangan, tambahkan langkah konfirmasi                                                       |

#### T-ACCESS-002: Pemalsuan AllowFrom

| Atribut                  | Nilai                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Akses API Inferensi Model AI                                                |
| **Deskripsi**            | Penyerang memalsukan identitas pengirim yang diizinkan pada suatu saluran              |
| **Vektor serangan**      | Bergantung pada saluran - pemalsuan nomor telepon, peniruan nama pengguna               |
| **Komponen terdampak**   | Validasi AllowFrom per saluran                                                          |
| **Mitigasi saat ini**    | Verifikasi identitas khusus saluran                                                     |
| **Risiko tersisa**       | Sedang - beberapa saluran masih rentan terhadap pemalsuan                               |
| **Rekomendasi**          | Dokumentasikan risiko khusus saluran, tambahkan verifikasi kriptografis jika memungkinkan |

#### T-ACCESS-003: Pencurian token

| Atribut                  | Nilai                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Akses API Inferensi Model AI                                   |
| **Deskripsi**            | Penyerang mencuri token autentikasi dari berkas konfigurasi/kredensial     |
| **Vektor serangan**      | Malware, akses perangkat tanpa izin, tereksposnya cadangan konfigurasi     |
| **Komponen terdampak**   | Penyimpanan kredensial saluran/penyedia, penyimpanan konfigurasi           |
| **Mitigasi saat ini**    | Izin berkas                                                                |
| **Risiko tersisa**       | Tinggi - token disimpan sebagai teks biasa pada disk                       |
| **Rekomendasi**          | Terapkan enkripsi token saat tersimpan, tambahkan rotasi token             |

---

### 3.3 Eksekusi (AML.TA0005)

#### T-EXEC-001: Injeksi prompt langsung

| Atribut                  | Nilai                                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.000 - Injeksi Prompt LLM: Langsung                                                                                                                      |
| **Deskripsi**            | Penyerang mengirim prompt yang dirancang untuk memanipulasi perilaku agen                                                                                         |
| **Vektor serangan**      | Pesan saluran yang berisi instruksi berbahaya                                                                                                                     |
| **Komponen terdampak**   | LLM agen, semua permukaan input                                                                                                                                   |
| **Mitigasi saat ini**    | Deteksi pola, pembungkusan konten eksternal; dianggap di luar cakupan laporan kerentanan jika tidak ada penerobosan batas (lihat `SECURITY.md`)                    |
| **Risiko tersisa**       | Kritis - hanya mendeteksi, tanpa pemblokiran; serangan canggih dapat melewatinya                                                                                  |
| **Rekomendasi**          | Validasi output dan konfirmasi pengguna untuk tindakan sensitif, sebagai lapisan tambahan di atas deteksi yang ada                                                |

#### T-EXEC-002: Injeksi prompt tidak langsung

| Atribut                  | Nilai                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.001 - Injeksi Prompt LLM: Tidak Langsung                                                                              |
| **Deskripsi**            | Penyerang menyisipkan instruksi berbahaya dalam konten yang diambil                                                             |
| **Vektor serangan**      | URL berbahaya, surel yang diracuni, Webhook yang disusupi                                                                       |
| **Komponen terdampak**   | `web_fetch`, penyerapan surel, sumber data eksternal                                                                            |
| **Mitigasi saat ini**    | Pembungkusan konten dengan penanda bergaya XML berbatas acak, normalisasi homoglif/token khusus, dan pemberitahuan keamanan     |
| **Risiko tersisa**       | Tinggi - LLM mungkin masih mengabaikan instruksi pembungkus                                                                     |
| **Rekomendasi**          | Konteks eksekusi terpisah untuk konten yang dibungkus                                                                           |

#### T-EXEC-003: Injeksi argumen alat

| Atribut                  | Nilai                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.000 - Injeksi Prompt LLM: Langsung                     |
| **Deskripsi**            | Penyerang memanipulasi argumen alat melalui injeksi prompt       |
| **Vektor serangan**      | Prompt yang dirancang untuk memengaruhi nilai parameter alat     |
| **Komponen terdampak**   | Semua pemanggilan alat                                           |
| **Mitigasi saat ini**    | Persetujuan eksekusi untuk perintah berbahaya                    |
| **Risiko tersisa**       | Tinggi - bergantung pada penilaian pengguna                      |
| **Rekomendasi**          | Validasi argumen, pemanggilan alat berparameter                   |

#### T-EXEC-004: Penerobosan persetujuan eksekusi

| Atribut                  | Nilai                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0043 - Membuat Data Berbahaya                                                                                                                                                                         |
| **Deskripsi**            | Penyerang membuat perintah yang menerobos daftar izin persetujuan                                                                                                                                          |
| **Vektor serangan**      | Pengaburan perintah, eksploitasi alias, manipulasi jalur                                                                                                                                                   |
| **Komponen terdampak**   | `src/infra/exec-approvals*.ts`, daftar izin perintah                                                                                                                                                       |
| **Mitigasi saat ini**    | Daftar izin + mode tanya, serta normalisasi perintah (penguraian pembungkus pengiriman, deteksi evaluasi sebaris, analisis rantai shell)                                                                    |
| **Risiko tersisa**       | Tinggi - normalisasi mempersempit tetapi tidak menghilangkan penerobosan melalui pengaburan; temuan yang hanya terkait kesetaraan antarjalur eksekusi dianggap sebagai penguatan, bukan kerentanan (lihat `SECURITY.md`) |
| **Rekomendasi**          | Terus perluas cakupan normalisasi perintah untuk menghadapi teknik pengaburan baru                                                                                                                         |

---

### 3.4 Persistensi (AML.TA0006)

#### T-PERSIST-001: Instalasi skill berbahaya

| Atribut                  | Nilai                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.001 - Penyusupan Rantai Pasok: Perangkat Lunak AI                                                                           |
| **Deskripsi**            | Penyerang menerbitkan skill berbahaya ke ClawHub                                                                                      |
| **Vektor serangan**      | Membuat akun, menerbitkan skill dengan kode berbahaya tersembunyi                                                                     |
| **Komponen terdampak**   | ClawHub, pemuatan skill, eksekusi agen                                                                                                |
| **Mitigasi saat ini**    | Verifikasi usia akun GitHub, pemindaian pola statis/yang berdekatan dengan AST, peninjauan risiko agentik berbasis LLM, pemindaian VirusTotal |
| **Risiko tersisa**       | Tinggi - lapisan deteksi tersedia, tetapi skill tetap berjalan dengan hak istimewa agen dan tanpa sandbox eksekusi                    |
| **Rekomendasi**          | Sandbox eksekusi skill, perluasan peninjauan komunitas                                                                                |

#### T-PERSIST-002: Peracunan pembaruan skill

| Atribut                  | Nilai                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.001 - Penyusupan Rantai Pasok: Perangkat Lunak AI                       |
| **Deskripsi**            | Penyerang menyusupi skill populer dan mengirim pembaruan berbahaya                |
| **Vektor serangan**      | Penyusupan akun, rekayasa sosial terhadap pemilik skill                           |
| **Komponen terdampak**   | Pembuatan versi ClawHub, alur pembaruan otomatis                                  |
| **Mitigasi saat ini**    | Sidik jari versi, pengulangan moderasi/pemindaian pada versi baru                 |
| **Risiko tersisa**       | Tinggi - pembaruan otomatis dapat mengambil versi berbahaya sebelum peninjauan selesai |
| **Rekomendasi**          | Penandatanganan pembaruan, kemampuan pengembalian, penyematan versi               |

#### T-PERSIST-003: Perusakan konfigurasi agen

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Kompromi Rantai Pasok: Data                                                                                                                   |
| **Deskripsi**           | Penyerang mengubah konfigurasi agen untuk mempertahankan akses                                                                                                 |
| **Vektor serangan**     | Modifikasi berkas konfigurasi, injeksi pengaturan                                                                                                              |
| **Komponen terdampak**  | Konfigurasi agen, kebijakan alat                                                                                                                               |
| **Mitigasi saat ini**   | Izin berkas                                                                                                                                                    |
| **Risiko tersisa**      | Sedang - memerlukan akses lokal                                                                                                                                |
| **Rekomendasi**         | Verifikasi integritas konfigurasi, pencatatan audit untuk perubahan konfigurasi                                                                                |

---

### 3.5 Pengelakan pertahanan (AML.TA0007)

#### T-EVADE-001: Pengelakan pola moderasi

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                                                                                                                          |
| **Deskripsi**           | Penyerang membuat konten Skills untuk mengelak dari pemeriksaan moderasi ClawHub                                                                               |
| **Vektor serangan**     | Homoglif Unicode, trik pengodean, pemuatan dinamis                                                                                                             |
| **Komponen terdampak**  | Alur moderasi/pemindaian ClawHub                                                                                                                               |
| **Mitigasi saat ini**   | Aturan pola statis, pemindaian kode yang berdekatan dengan AST, peninjauan risiko agentik oleh LLM, VirusTotal                                                |
| **Risiko tersisa**      | Sedang - obfuscation baru masih dapat lolos dari heuristik berlapis                                                                                            |
| **Rekomendasi**         | Terus perluas korpus pola/perilaku ketika teknik pengelakan baru ditemukan                                                                                     |

#### T-EVADE-002: Pelolosan pembungkus konten

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                                                                                                                          |
| **Deskripsi**           | Penyerang membuat konten yang lolos dari konteks pembungkus konten eksternal                                                                                   |
| **Vektor serangan**     | Manipulasi tag, kebingungan konteks, penimpaan instruksi                                                                                                       |
| **Komponen terdampak**  | Pembungkusan konten eksternal                                                                                                                                 |
| **Mitigasi saat ini**   | Penanda bergaya XML dengan batas acak + pemberitahuan keamanan, serta deteksi pemalsuan penanda dengan varian homoglif/spasi                                  |
| **Risiko tersisa**      | Sedang - teknik pelolosan baru ditemukan secara berkala                                                                                                        |
| **Rekomendasi**         | Validasi sisi keluaran selain pembungkusan sisi masukan                                                                                                        |

---

### 3.6 Penemuan (AML.TA0008)

#### T-DISC-001: Enumerasi alat

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                                                                                                      |
| **Deskripsi**           | Penyerang menginventarisasi alat yang tersedia melalui prompt                                                                                                  |
| **Vektor serangan**     | Kueri bergaya "Alat apa yang Anda miliki?"                                                                                                                     |
| **Komponen terdampak**  | Registri alat agen                                                                                                                                             |
| **Mitigasi saat ini**   | Tidak ada yang spesifik                                                                                                                                        |
| **Risiko tersisa**      | Rendah - alat umumnya didokumentasikan                                                                                                                         |
| **Rekomendasi**         | Pertimbangkan kontrol visibilitas alat                                                                                                                         |

#### T-DISC-002: Ekstraksi data sesi

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                                                                                                      |
| **Deskripsi**           | Penyerang mengekstrak data sensitif dari konteks sesi                                                                                                          |
| **Vektor serangan**     | Kueri "Apa yang telah kita bahas?", penyelidikan konteks                                                                                                       |
| **Komponen terdampak**  | Transkrip sesi, jendela konteks                                                                                                                                |
| **Mitigasi saat ini**   | Isolasi sesi per pengirim (kunci `agent:channel:peer`)                                                                                                         |
| **Risiko tersisa**      | Sedang - data dalam sesi dapat diakses berdasarkan rancangan                                                                                                   |
| **Rekomendasi**         | Redaksi data sensitif dalam konteks                                                                                                                            |

---

### 3.7 Pengumpulan dan eksfiltrasi (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Pencurian data melalui web_fetch

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                                                                                                                       |
| **Deskripsi**           | Penyerang mengeksfiltrasi data dengan menginstruksikan agen untuk mengirimkannya ke URL eksternal                                                              |
| **Vektor serangan**     | Injeksi prompt yang menyebabkan agen melakukan POST data ke server penyerang                                                                                   |
| **Komponen terdampak**  | Alat `web_fetch`                                                                                                                                               |
| **Mitigasi saat ini**   | Pemblokiran SSRF untuk jaringan internal/privat (penguncian DNS + pemblokiran IP)                                                                              |
| **Risiko tersisa**      | Tinggi - URL eksternal arbitrer tetap diizinkan                                                                                                                |
| **Rekomendasi**         | Daftar izin URL, kesadaran klasifikasi data                                                                                                                    |

#### T-EXFIL-002: Pengiriman pesan tanpa izin

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                                                                                                                       |
| **Deskripsi**           | Penyerang menyebabkan agen mengirim pesan yang berisi data sensitif                                                                                            |
| **Vektor serangan**     | Injeksi prompt yang menyebabkan agen mengirim pesan kepada penyerang                                                                                           |
| **Komponen terdampak**  | Alat pesan, integrasi saluran                                                                                                                                 |
| **Mitigasi saat ini**   | Pembatasan pengiriman pesan keluar                                                                                                                             |
| **Risiko tersisa**      | Sedang - pembatasan mungkin dapat dilewati                                                                                                                     |
| **Rekomendasi**         | Konfirmasi eksplisit untuk penerima baru                                                                                                                       |

#### T-EXFIL-003: Pemanenan kredensial

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                                                                                                                       |
| **Deskripsi**           | Skills berbahaya memanen kredensial dari konteks agen                                                                                                          |
| **Vektor serangan**     | Kode Skills membaca variabel lingkungan dan berkas konfigurasi                                                                                                 |
| **Komponen terdampak**  | Lingkungan eksekusi Skills                                                                                                                                    |
| **Mitigasi saat ini**   | Pemindaian pola kredensial ClawHub (rahasia yang ditanam langsung, akses variabel lingkungan kredensial yang dipasangkan dengan pengiriman jaringan); tidak ada sandbox eksekusi untuk Skills saat runtime |
| **Risiko tersisa**      | Kritis - Skills berjalan dengan hak istimewa agen                                                                                                              |
| **Rekomendasi**         | Sandbox eksekusi Skills, isolasi kredensial                                                                                                                    |

---

### 3.8 Dampak (AML.TA0011)

#### T-IMPACT-001: Eksekusi perintah tanpa izin

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Mengikis Integritas Model AI                                                                                                                      |
| **Deskripsi**           | Penyerang mengeksekusi perintah arbitrer pada sistem pengguna                                                                                                  |
| **Vektor serangan**     | Injeksi prompt yang digabungkan dengan pengelakan persetujuan eksekusi                                                                                         |
| **Komponen terdampak**  | Alat Bash, eksekusi perintah                                                                                                                                  |
| **Mitigasi saat ini**   | Persetujuan eksekusi, opsi sandbox Docker (backend runtime bawaan)                                                                                             |
| **Risiko tersisa**      | Kritis - eksekusi pada host dimungkinkan ketika sandbox dinonaktifkan                                                                                          |
| **Rekomendasi**         | Tingkatkan pengalaman pengguna untuk persetujuan; penerapan tanpa sandbox tetap menjadi pilihan operator yang disengaja dan didokumentasikan sebagaimana mestinya |

#### T-IMPACT-002: Pengurasan sumber daya (DoS)

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Mengikis Integritas Model AI                                                                                                                      |
| **Deskripsi**           | Penyerang menghabiskan kredit API atau sumber daya komputasi                                                                                                   |
| **Vektor serangan**     | Pembanjiran pesan otomatis, pemanggilan alat yang mahal                                                                                                        |
| **Komponen terdampak**  | Gateway, sesi agen, penyedia API                                                                                                                               |
| **Mitigasi saat ini**   | Tidak ada                                                                                                                                                     |
| **Risiko tersisa**      | Tinggi - tidak ada pembatasan laju per pengirim                                                                                                                |
| **Rekomendasi**         | Batas laju per pengirim, anggaran biaya                                                                                                                        |

#### T-IMPACT-003: Kerusakan reputasi

| Atribut                 | Nilai                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Mengikis Integritas Model AI                                                                                                                      |
| **Deskripsi**           | Penyerang menyebabkan agen mengirim konten yang berbahaya/ofensif                                                                                              |
| **Vektor serangan**     | Injeksi prompt yang menyebabkan respons tidak pantas                                                                                                           |
| **Komponen terdampak**  | Pembuatan keluaran, pengiriman pesan melalui saluran                                                                                                           |
| **Mitigasi saat ini**   | Kebijakan konten penyedia LLM                                                                                                                                 |
| **Risiko tersisa**      | Sedang - filter penyedia tidak sempurna                                                                                                                        |
| **Rekomendasi**         | Lapisan pemfilteran keluaran, kontrol pengguna                                                                                                                 |

---

## 4. Analisis rantai pasok ClawHub

### 4.1 Kontrol keamanan saat ini

| Kontrol                          | Implementasi                                                                          | Efektivitas                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Usia akun GitHub                  | `requireGitHubAccountAge()` (minimum 14 hari)                                         | Sedang - meningkatkan hambatan bagi penyerang baru                            |
| Sanitasi jalur                   | `sanitizePath()`                                                                      | Tinggi - mencegah traversal jalur                                             |
| Validasi jenis berkas            | `isTextFile()`                                                                        | Sedang - hanya berkas teks yang dipindai, tetapi masih dapat dieksploitasi    |
| Batas ukuran                     | Total bundel 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                        | Tinggi - mencegah pengurasan sumber daya                                      |
| SKILL.md wajib                   | README wajib saat publikasi                                                           | Nilai keamanan rendah - hanya bersifat informatif                             |
| Pemindaian statis + berdekatan dengan AST | Mesin pola yang mencakup eksekusi, eksfiltrasi, pengambilan kredensial, obfuskasi, dan lainnya | Sedang-Tinggi - mencakup banyak pola penyalahgunaan yang diketahui, tetapi masih berbasis pola |
| Tinjauan risiko agentik berbasis LLM | Putusan berbasis perintah keamanan saat publikasi                                     | Sedang-Tinggi - menangkap perilaku yang terlewat oleh pola statis             |
| Pemindaian VirusTotal            | Terhubung ke alur publikasi/pemindaian ulang Skills dan rilis paket, bergantung pada kunci API operator | Tinggi saat diaktifkan - deteksi mesin statis                                 |
| Status moderasi                  | Bidang `moderationStatus`                                                             | Sedang - memungkinkan peninjauan manual                                       |

### 4.2 Keterbatasan moderasi

Pemindaian statis ClawHub memeriksa konten kode Skills secara langsung (bukan hanya slug/metadata/frontmatter), yang mencakup panggilan eksekusi berbahaya, eksekusi kode dinamis, pengambilan kredensial, pola eksfiltrasi, muatan yang diobfuskasi, dan lainnya. Kesenjangan yang diketahui:

- Deteksi berbasis pola masih dapat dilewati dengan obfuskasi yang cukup baru.
- Tinjauan berbasis LLM dan pemindaian VirusTotal bergantung pada pengaktifan kunci API/konfigurasi di sisi operator.
- Tidak ada sandbox eksekusi runtime yang mengisolasi Skills dari hak akses agen itu sendiri setelah diinstal.

### 4.3 Lencana

Skills dan paket memiliki lencana yang ditetapkan moderator: `highlighted`, `official`, `deprecated`, `redactionApproved` (khusus Skills). Pelaporan komunitas (`skillReports`) dan pencatatan audit (`auditLogs`) mendukung alur kerja moderasi.

---

## 5. Matriks risiko

### 5.1 Kemungkinan dibandingkan dampak

| ID ancaman    | Kemungkinan | Dampak   | Tingkat risiko | Prioritas |
| ------------- | ----------- | -------- | -------------- | --------- |
| T-EXEC-001    | Tinggi      | Kritis   | **Kritis**     | P0        |
| T-PERSIST-001 | Tinggi      | Kritis   | **Kritis**     | P0        |
| T-EXFIL-003   | Sedang      | Kritis   | **Kritis**     | P0        |
| T-IMPACT-001  | Sedang      | Kritis   | **Tinggi**     | P1        |
| T-EXEC-002    | Tinggi      | Tinggi   | **Tinggi**     | P1        |
| T-EXEC-004    | Sedang      | Tinggi   | **Tinggi**     | P1        |
| T-ACCESS-003  | Sedang      | Tinggi   | **Tinggi**     | P1        |
| T-EXFIL-001   | Sedang      | Tinggi   | **Tinggi**     | P1        |
| T-IMPACT-002  | Tinggi      | Sedang   | **Tinggi**     | P1        |
| T-EVADE-001   | Tinggi      | Sedang   | **Sedang**     | P2        |
| T-ACCESS-001  | Rendah      | Tinggi   | **Sedang**     | P2        |
| T-ACCESS-002  | Rendah      | Tinggi   | **Sedang**     | P2        |
| T-PERSIST-002 | Rendah      | Tinggi   | **Sedang**     | P2        |

### 5.2 Rantai serangan jalur kritis

**Rantai 1: Pencurian data berbasis Skills**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publikasikan Skills berbahaya) → (Hindari moderasi) → (Ambil kredensial)
```

**Rantai 2: Injeksi prompt hingga RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injeksikan prompt) → (Lewati persetujuan eksekusi) → (Jalankan perintah)
```

**Rantai 3: Injeksi tidak langsung melalui konten yang diambil**

```text
T-EXEC-002 → T-EXFIL-001 → Eksfiltrasi eksternal
(Racuni konten URL) → (Agen mengambil & mengikuti instruksi) → (Data dikirim kepada penyerang)
```

---

## 6. Ringkasan rekomendasi

### 6.1 Segera (P0)

| ID    | Rekomendasi                                      | Menangani                  |
| ----- | ------------------------------------------------ | -------------------------- |
| R-002 | Terapkan sandbox untuk eksekusi Skills           | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Tambahkan validasi keluaran untuk tindakan sensitif | T-EXEC-001, T-EXEC-002  |

### 6.2 Jangka pendek (P1)

| ID    | Rekomendasi                                                                | Menangani     |
| ----- | -------------------------------------------------------------------------- | ------------- |
| R-004 | Terapkan pembatasan laju per pengirim                                      | T-IMPACT-002  |
| R-005 | Tambahkan enkripsi token saat tersimpan                                    | T-ACCESS-003  |
| R-006 | Tingkatkan UX persetujuan eksekusi dan terus perluas normalisasi perintah  | T-EXEC-004    |
| R-007 | Terapkan daftar izin URL untuk `web_fetch`                                 | T-EXFIL-001   |

### 6.3 Jangka menengah (P2)

| ID    | Rekomendasi                                                  | Menangani     |
| ----- | ------------------------------------------------------------ | ------------- |
| R-008 | Tambahkan verifikasi kanal secara kriptografis jika memungkinkan | T-ACCESS-002 |
| R-009 | Terapkan verifikasi integritas konfigurasi                    | T-PERSIST-003 |
| R-010 | Tambahkan penandatanganan pembaruan dan penguncian versi      | T-PERSIST-002 |

---

## 7. Lampiran

### 7.1 Pemetaan teknik ATLAS

| ID ATLAS      | Nama teknik                        | Ancaman OpenClaw                                                |
| ------------- | ---------------------------------- | --------------------------------------------------------------- |
| AML.T0006     | Pemindaian Aktif                   | T-RECON-001, T-RECON-002                                        |
| AML.T0009     | Pengumpulan                        | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                           |
| AML.T0010.001 | Rantai Pasok: Perangkat Lunak AI   | T-PERSIST-001, T-PERSIST-002                                    |
| AML.T0010.002 | Rantai Pasok: Data                 | T-PERSIST-003                                                   |
| AML.T0031     | Mengikis Integritas Model AI       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                        |
| AML.T0040     | Akses API Inferensi Model AI       | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Membuat Data Adversarial           | T-EXEC-004, T-EVADE-001, T-EVADE-002                            |
| AML.T0051.000 | Injeksi Prompt LLM: Langsung       | T-EXEC-001, T-EXEC-003                                          |
| AML.T0051.001 | Injeksi Prompt LLM: Tidak Langsung | T-EXEC-002                                                      |

### 7.2 Berkas keamanan utama

| Jalur                               | Tujuan                              | Tingkat risiko |
| ----------------------------------- | ----------------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Logika persetujuan perintah         | **Kritis**     |
| `src/gateway/auth.ts`               | Autentikasi Gateway                 | **Kritis**     |
| `src/infra/net/ssrf.ts`             | Perlindungan SSRF                   | **Kritis**     |
| `src/security/external-content.ts`  | Mitigasi injeksi prompt             | **Kritis**     |
| `src/agents/sandbox/tool-policy.ts` | Kebijakan izin/tolak alat sandbox   | **Kritis**     |
| `src/routing/resolve-route.ts`      | Isolasi sesi / perutean             | **Sedang**     |

### 7.3 Glosarium

| Istilah              | Definisi                                                    |
| -------------------- | ----------------------------------------------------------- |
| **ATLAS**            | Lanskap Ancaman Adversarial MITRE untuk Sistem AI           |
| **ClawHub**          | Marketplace Skills OpenClaw                                 |
| **Gateway**          | Lapisan perutean pesan dan autentikasi OpenClaw             |
| **MCP**              | Model Context Protocol - antarmuka penyedia alat             |
| **Injeksi prompt**   | Serangan ketika instruksi berbahaya disematkan dalam masukan |
| **Skills**           | Ekstensi yang dapat diunduh untuk agen OpenClaw              |
| **SSRF**             | Pemalsuan Permintaan Sisi Server                             |

---

_Model ancaman ini adalah dokumen yang terus diperbarui. Laporkan masalah keamanan ke `security@openclaw.ai` atau lihat [halaman Kepercayaan](https://trust.openclaw.ai)._

## Terkait

- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
- [Respons insiden](/id/security/incident-response)
- [Proksi jaringan](/id/security/network-proxy)
- [Verifikasi formal](/id/security/formal-verification)
