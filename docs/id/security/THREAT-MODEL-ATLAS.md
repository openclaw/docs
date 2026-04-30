---
read_when:
    - Meninjau postur keamanan atau skenario ancaman
    - Mengerjakan fitur keamanan atau tanggapan audit
summary: Model ancaman OpenClaw yang dipetakan ke kerangka kerja MITRE ATLAS
title: Model ancaman (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-30T10:12:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# Model Ancaman OpenClaw v1.0

## Framework MITRE ATLAS

**Versi:** 1.0-draft
**Terakhir Diperbarui:** 2026-02-04
**Metodologi:** MITRE ATLAS + Diagram Aliran Data
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Lanskap Ancaman Adversarial untuk Sistem AI)

### Atribusi framework

Model ancaman ini dibangun berdasarkan [MITRE ATLAS](https://atlas.mitre.org/), framework standar industri untuk mendokumentasikan ancaman adversarial terhadap sistem AI/ML. ATLAS dikelola oleh [MITRE](https://www.mitre.org/) bersama komunitas keamanan AI.

**Sumber Daya Utama ATLAS:**

- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Taktik ATLAS](https://atlas.mitre.org/tactics/)
- [Studi Kasus ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Berkontribusi ke ATLAS](https://atlas.mitre.org/resources/contribute)

### Berkontribusi ke Model Ancaman Ini

Ini adalah dokumen hidup yang dikelola oleh komunitas OpenClaw. Lihat [CONTRIBUTING-THREAT-MODEL.md](/id/security/CONTRIBUTING-THREAT-MODEL) untuk panduan berkontribusi:

- Melaporkan ancaman baru
- Memperbarui ancaman yang ada
- Mengusulkan rantai serangan
- Menyarankan mitigasi

---

## 1. Pendahuluan

### 1.1 Tujuan

Model ancaman ini mendokumentasikan ancaman adversarial terhadap platform agen AI OpenClaw dan marketplace Skills ClawHub, menggunakan framework MITRE ATLAS yang dirancang khusus untuk sistem AI/ML.

### 1.2 Cakupan

| Komponen               | Disertakan | Catatan                                           |
| ---------------------- | ---------- | ------------------------------------------------- |
| Runtime Agen OpenClaw  | Ya         | Eksekusi agen inti, panggilan alat, sesi          |
| Gateway                | Ya         | Autentikasi, perutean, integrasi kanal            |
| Integrasi Kanal        | Ya         | WhatsApp, Telegram, Discord, Signal, Slack, dll.  |
| Marketplace ClawHub    | Ya         | Penerbitan Skill, moderasi, distribusi            |
| Server MCP             | Ya         | Penyedia alat eksternal                           |
| Perangkat Pengguna     | Sebagian   | Aplikasi seluler, klien desktop                   |

### 1.3 Di Luar Cakupan

Tidak ada yang secara eksplisit berada di luar cakupan untuk model ancaman ini.

---

## 2. Arsitektur Sistem

### 2.1 Batas Kepercayaan

```
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
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
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
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
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
│  │  • External content wrapping (XML tags)                   │   │
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
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Aliran Data

| Aliran | Sumber  | Tujuan   | Data                  | Perlindungan          |
| ------ | ------- | -------- | --------------------- | --------------------- |
| F1     | Kanal   | Gateway  | Pesan pengguna        | TLS, AllowFrom        |
| F2     | Gateway | Agen     | Pesan yang dirutekan  | Isolasi sesi          |
| F3     | Agen    | Alat     | Pemanggilan alat      | Penegakan kebijakan   |
| F4     | Agen    | Eksternal| Permintaan web_fetch  | Pemblokiran SSRF      |
| F5     | ClawHub | Agen     | Kode Skill            | Moderasi, pemindaian  |
| F6     | Agen    | Kanal    | Respons               | Pemfilteran keluaran  |

---

## 3. Analisis Ancaman berdasarkan Taktik ATLAS

### 3.1 Pengintaian (AML.TA0002)

#### T-RECON-001: Penemuan Endpoint Agen

| Atribut                 | Nilai                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Pemindaian Aktif                                          |
| **Deskripsi**           | Penyerang memindai endpoint gateway OpenClaw yang terekspos           |
| **Vektor Serangan**     | Pemindaian jaringan, kueri shodan, enumerasi DNS                      |
| **Komponen Terdampak**  | Gateway, endpoint API yang terekspos                                  |
| **Mitigasi Saat Ini**   | Opsi autentikasi Tailscale, bind ke loopback secara default           |
| **Risiko Residual**     | Sedang - Gateway publik dapat ditemukan                               |
| **Rekomendasi**         | Dokumentasikan deployment aman, tambahkan pembatasan laju pada endpoint penemuan |

#### T-RECON-002: Probing Integrasi Kanal

| Atribut                 | Nilai                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Pemindaian Aktif                                            |
| **Deskripsi**           | Penyerang menyelidiki saluran pesan untuk mengidentifikasi akun yang dikelola AI |
| **Vektor Serangan**     | Mengirim pesan uji, mengamati pola respons                              |
| **Komponen Terdampak**  | Semua integrasi saluran                                                 |
| **Mitigasi Saat Ini**   | Tidak ada yang spesifik                                                 |
| **Risiko Residual**     | Rendah - Nilai terbatas dari penemuan saja                              |
| **Rekomendasi**         | Pertimbangkan pengacakan waktu respons                                  |

---

### 3.2 Akses Awal (AML.TA0004)

#### T-ACCESS-001: Intersepsi Kode Pemasangan

| Atribut                 | Nilai                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                                                      |
| **Deskripsi**           | Penyerang mengintersepsi kode pemasangan selama masa tenggang pemasangan (1 jam untuk pemasangan saluran DM, 5 menit untuk pemasangan Node) |
| **Vektor Serangan**     | Mengintip layar, sniffing jaringan, rekayasa sosial                                                           |
| **Komponen Terdampak**  | Sistem pemasangan perangkat                                                                                   |
| **Mitigasi Saat Ini**   | Kedaluwarsa 1 jam (pemasangan DM) / kedaluwarsa 5 menit (pemasangan Node), kode dikirim melalui saluran yang sudah ada |
| **Risiko Residual**     | Sedang - Masa tenggang dapat dieksploitasi                                                                    |
| **Rekomendasi**         | Kurangi masa tenggang, tambahkan langkah konfirmasi                                                           |

#### T-ACCESS-002: Pemalsuan AllowFrom

| Atribut                 | Nilai                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                       |
| **Deskripsi**           | Penyerang memalsukan identitas pengirim yang diizinkan di saluran              |
| **Vektor Serangan**     | Bergantung pada saluran - pemalsuan nomor telepon, peniruan nama pengguna      |
| **Komponen Terdampak**  | Validasi AllowFrom per saluran                                                 |
| **Mitigasi Saat Ini**   | Verifikasi identitas khusus saluran                                            |
| **Risiko Residual**     | Sedang - Beberapa saluran rentan terhadap pemalsuan                            |
| **Rekomendasi**         | Dokumentasikan risiko khusus saluran, tambahkan verifikasi kriptografis jika memungkinkan |

#### T-ACCESS-003: Pencurian Token

| Atribut                 | Nilai                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                    |
| **Deskripsi**           | Penyerang mencuri token autentikasi dari file konfigurasi   |
| **Vektor Serangan**     | Malware, akses perangkat tidak sah, paparan cadangan konfigurasi |
| **Komponen Terdampak**  | ~/.openclaw/credentials/, penyimpanan konfigurasi           |
| **Mitigasi Saat Ini**   | Izin file                                                   |
| **Risiko Residual**     | Tinggi - Token disimpan dalam plaintext                     |
| **Rekomendasi**         | Terapkan enkripsi token saat disimpan, tambahkan rotasi token |

---

### 3.3 Eksekusi (AML.TA0005)

#### T-EXEC-001: Injeksi Prompt Langsung

| Atribut                 | Nilai                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injeksi Prompt LLM: Langsung                                              |
| **Deskripsi**           | Penyerang mengirim prompt yang dirancang untuk memanipulasi perilaku agen                 |
| **Vektor Serangan**     | Pesan saluran yang berisi instruksi adversarial                                           |
| **Komponen Terdampak**  | LLM agen, semua permukaan input                                                           |
| **Mitigasi Saat Ini**   | Deteksi pola, pembungkusan konten eksternal                                               |
| **Risiko Residual**     | Kritis - Hanya deteksi, tanpa pemblokiran; serangan canggih dapat melewati                |
| **Rekomendasi**         | Terapkan pertahanan berlapis, validasi output, konfirmasi pengguna untuk tindakan sensitif |

#### T-EXEC-002: Injeksi Prompt Tidak Langsung

| Atribut                 | Nilai                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Injeksi Prompt LLM: Tidak Langsung          |
| **Deskripsi**           | Penyerang menyisipkan instruksi berbahaya dalam konten yang diambil |
| **Vektor Serangan**     | URL berbahaya, email beracun, webhook yang disusupi         |
| **Komponen Terdampak**  | web_fetch, penyerapan email, sumber data eksternal          |
| **Mitigasi Saat Ini**   | Pembungkusan konten dengan tag XML dan pemberitahuan keamanan |
| **Risiko Residual**     | Tinggi - LLM mungkin mengabaikan instruksi pembungkus       |
| **Rekomendasi**         | Terapkan sanitasi konten, pisahkan konteks eksekusi         |

#### T-EXEC-003: Injeksi Argumen Alat

| Atribut                 | Nilai                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Injeksi Prompt LLM: Langsung                 |
| **Deskripsi**           | Penyerang memanipulasi argumen alat melalui injeksi prompt   |
| **Vektor Serangan**     | Prompt yang dirancang untuk memengaruhi nilai parameter alat |
| **Komponen Terdampak**  | Semua pemanggilan alat                                       |
| **Mitigasi Saat Ini**   | Persetujuan exec untuk perintah berbahaya                    |
| **Risiko Residual**     | Tinggi - Bergantung pada penilaian pengguna                  |
| **Rekomendasi**         | Terapkan validasi argumen, pemanggilan alat berparameter     |

#### T-EXEC-004: Bypass Persetujuan Exec

| Atribut                 | Nilai                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                       |
| **Deskripsi**           | Penyerang membuat perintah yang melewati allowlist persetujuan |
| **Vektor Serangan**     | Pengaburan perintah, eksploitasi alias, manipulasi path    |
| **Komponen Terdampak**  | exec-approvals.ts, allowlist perintah                      |
| **Mitigasi Saat Ini**   | Allowlist + mode tanya                                     |
| **Risiko Residual**     | Tinggi - Tidak ada sanitasi perintah                       |
| **Rekomendasi**         | Terapkan normalisasi perintah, perluas blocklist           |

---

### 3.4 Persistensi (AML.TA0006)

#### T-PERSIST-001: Instalasi Skill Berbahaya

| Atribut                 | Nilai                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Kompromi Rantai Pasok: Perangkat Lunak AI                |
| **Deskripsi**           | Penyerang menerbitkan skill berbahaya ke ClawHub                         |
| **Vektor Serangan**     | Membuat akun, menerbitkan skill dengan kode berbahaya tersembunyi        |
| **Komponen Terdampak**  | ClawHub, pemuatan skill, eksekusi agen                                   |
| **Mitigasi Saat Ini**   | Verifikasi usia akun GitHub, flag moderasi berbasis pola                 |
| **Risiko Residual**     | Kritis - Tidak ada sandboxing, peninjauan terbatas                       |
| **Rekomendasi**         | Integrasi VirusTotal (sedang berjalan), sandboxing skill, peninjauan komunitas |

#### T-PERSIST-002: Peracunan Pembaruan Skill

| Atribut                 | Nilai                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Kompromi Rantai Pasok: Perangkat Lunak AI      |
| **Deskripsi**           | Penyerang menyusupi skill populer dan mendorong pembaruan berbahaya |
| **Vektor Serangan**     | Penyusupan akun, rekayasa sosial terhadap pemilik skill        |
| **Komponen Terdampak**  | Pembuatan versi ClawHub, alur pembaruan otomatis               |
| **Mitigasi Saat Ini**   | Sidik jari versi                                               |
| **Risiko Residual**     | Tinggi - Pembaruan otomatis dapat menarik versi berbahaya      |
| **Rekomendasi**         | Terapkan penandatanganan pembaruan, kemampuan rollback, penyematan versi |

#### T-PERSIST-003: Perusakan Konfigurasi Agen

| Atribut                 | Nilai                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Kompromi Rantai Pasok: Data                     |
| **Deskripsi**           | Penyerang memodifikasi konfigurasi agen untuk mempertahankan akses |
| **Vektor Serangan**     | Modifikasi file konfigurasi, injeksi pengaturan                 |
| **Komponen Terdampak**  | Konfigurasi agen, kebijakan alat                                |
| **Mitigasi Saat Ini**   | Izin file                                                       |
| **Risiko Residual**     | Sedang - Memerlukan akses lokal                                 |
| **Rekomendasi**         | Verifikasi integritas konfigurasi, pencatatan audit untuk perubahan konfigurasi |

---

### 3.5 Penghindaran Pertahanan (AML.TA0007)

#### T-EVADE-001: Bypass Pola Moderasi

| Atribut                 | Nilai                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                                   |
| **Deskripsi**           | Penyerang membuat konten skill untuk menghindari pola moderasi         |
| **Vektor Serangan**     | Homoglif Unicode, trik encoding, pemuatan dinamis                      |
| **Komponen Terdampak**  | ClawHub moderation.ts                                                  |
| **Mitigasi Saat Ini**   | FLAG_RULES berbasis pola                                               |
| **Risiko Residual**     | Tinggi - Regex sederhana mudah dilewati                                |
| **Rekomendasi**         | Tambahkan analisis perilaku (VirusTotal Code Insight), deteksi berbasis AST |

#### T-EVADE-002: Escape Pembungkus Konten

| Atribut                | Nilai                                                     |
| ---------------------- | --------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Membuat Data Adversarial                      |
| **Deskripsi**          | Penyerang membuat konten yang keluar dari konteks pembungkus XML |
| **Vektor Serangan**    | Manipulasi tag, kebingungan konteks, penimpaan instruksi |
| **Komponen Terdampak** | Pembungkusan konten eksternal                             |
| **Mitigasi Saat Ini**  | Tag XML + pemberitahuan keamanan                          |
| **Risiko Tersisa**     | Sedang - Escape baru ditemukan secara berkala             |
| **Rekomendasi**        | Beberapa lapisan pembungkus, validasi sisi output         |

---

### 3.6 Penemuan (AML.TA0008)

#### T-DISC-001: Enumerasi Alat

| Atribut                | Nilai                                                 |
| ---------------------- | ----------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - Akses API Inferensi Model AI              |
| **Deskripsi**          | Penyerang mengenumerasi alat yang tersedia melalui prompting |
| **Vektor Serangan**    | Kueri bergaya "Alat apa yang Anda punya?"             |
| **Komponen Terdampak** | Registri alat agen                                    |
| **Mitigasi Saat Ini**  | Tidak ada yang spesifik                               |
| **Risiko Tersisa**     | Rendah - Alat umumnya terdokumentasi                  |
| **Rekomendasi**        | Pertimbangkan kontrol visibilitas alat                |

#### T-DISC-002: Ekstraksi Data Sesi

| Atribut                | Nilai                                                 |
| ---------------------- | ----------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - Akses API Inferensi Model AI              |
| **Deskripsi**          | Penyerang mengekstrak data sensitif dari konteks sesi |
| **Vektor Serangan**    | Kueri "Apa yang kita bahas?", probing konteks         |
| **Komponen Terdampak** | Transkrip sesi, jendela konteks                       |
| **Mitigasi Saat Ini**  | Isolasi sesi per pengirim                             |
| **Risiko Tersisa**     | Sedang - Data dalam sesi dapat diakses                |
| **Rekomendasi**        | Terapkan redaksi data sensitif dalam konteks          |

---

### 3.7 Pengumpulan & Eksfiltrasi (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Pencurian Data melalui web_fetch

| Atribut                | Nilai                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0009 - Pengumpulan                                                 |
| **Deskripsi**          | Penyerang mengekfiltrasi data dengan menginstruksikan agen untuk mengirim ke URL eksternal |
| **Vektor Serangan**    | Injeksi prompt yang menyebabkan agen mengirim data dengan POST ke server penyerang |
| **Komponen Terdampak** | Alat web_fetch                                                         |
| **Mitigasi Saat Ini**  | Pemblokiran SSRF untuk jaringan internal                               |
| **Risiko Tersisa**     | Tinggi - URL eksternal diizinkan                                       |
| **Rekomendasi**        | Terapkan allowlist URL, kesadaran klasifikasi data                     |

#### T-EXFIL-002: Pengiriman Pesan Tidak Sah

| Atribut                | Nilai                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0009 - Pengumpulan                                           |
| **Deskripsi**          | Penyerang menyebabkan agen mengirim pesan yang berisi data sensitif |
| **Vektor Serangan**    | Injeksi prompt yang menyebabkan agen mengirim pesan ke penyerang  |
| **Komponen Terdampak** | Alat pesan, integrasi kanal                                      |
| **Mitigasi Saat Ini**  | Pembatasan pesan keluar                                          |
| **Risiko Tersisa**     | Sedang - Pembatasan mungkin dapat dilewati                       |
| **Rekomendasi**        | Wajibkan konfirmasi eksplisit untuk penerima baru                |

#### T-EXFIL-003: Pemanenan Kredensial

| Atribut                | Nilai                                                   |
| ---------------------- | ------------------------------------------------------- |
| **ID ATLAS**           | AML.T0009 - Pengumpulan                                  |
| **Deskripsi**          | Skills berbahaya memanen kredensial dari konteks agen   |
| **Vektor Serangan**    | Kode Skills membaca variabel lingkungan, file konfigurasi |
| **Komponen Terdampak** | Lingkungan eksekusi Skills                              |
| **Mitigasi Saat Ini**  | Tidak ada yang spesifik untuk Skills                    |
| **Risiko Tersisa**     | Kritis - Skills berjalan dengan hak istimewa agen       |
| **Rekomendasi**        | Sandboxing Skills, isolasi kredensial                   |

---

### 3.8 Dampak (AML.TA0011)

#### T-IMPACT-001: Eksekusi Perintah Tidak Sah

| Atribut                | Nilai                                               |
| ---------------------- | --------------------------------------------------- |
| **ID ATLAS**           | AML.T0031 - Mengikis Integritas Model AI            |
| **Deskripsi**          | Penyerang mengeksekusi perintah arbitrer pada sistem pengguna |
| **Vektor Serangan**    | Injeksi prompt digabungkan dengan bypass persetujuan exec |
| **Komponen Terdampak** | Alat Bash, eksekusi perintah                        |
| **Mitigasi Saat Ini**  | Persetujuan exec, opsi sandbox Docker               |
| **Risiko Tersisa**     | Kritis - Eksekusi host tanpa sandbox                |
| **Rekomendasi**        | Jadikan sandbox sebagai default, tingkatkan UX persetujuan |

#### T-IMPACT-002: Penghabisan Sumber Daya (DoS)

| Atribut                | Nilai                                              |
| ---------------------- | -------------------------------------------------- |
| **ID ATLAS**           | AML.T0031 - Mengikis Integritas Model AI           |
| **Deskripsi**          | Penyerang menghabiskan kredit API atau sumber daya komputasi |
| **Vektor Serangan**    | Flooding pesan otomatis, panggilan alat yang mahal |
| **Komponen Terdampak** | Gateway, sesi agen, penyedia API                   |
| **Mitigasi Saat Ini**  | Tidak ada                                          |
| **Risiko Tersisa**     | Tinggi - Tidak ada pembatasan laju                 |
| **Rekomendasi**        | Terapkan batas laju per pengirim, anggaran biaya   |

#### T-IMPACT-003: Kerusakan Reputasi

| Atribut                | Nilai                                                   |
| ---------------------- | ------------------------------------------------------- |
| **ID ATLAS**           | AML.T0031 - Mengikis Integritas Model AI                |
| **Deskripsi**          | Penyerang menyebabkan agen mengirim konten berbahaya/menyinggung |
| **Vektor Serangan**    | Injeksi prompt yang menyebabkan respons tidak pantas    |
| **Komponen Terdampak** | Pembuatan output, pengiriman pesan kanal                |
| **Mitigasi Saat Ini**  | Kebijakan konten penyedia LLM                           |
| **Risiko Tersisa**     | Sedang - Filter penyedia tidak sempurna                 |
| **Rekomendasi**        | Lapisan pemfilteran output, kontrol pengguna            |

---

## 4. Analisis Rantai Pasok ClawHub

### 4.1 Kontrol Keamanan Saat Ini

| Kontrol              | Implementasi                | Efektivitas                                          |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Usia Akun GitHub     | `requireGitHubAccountAge()` | Sedang - Menaikkan ambang bagi penyerang baru        |
| Sanitasi Path        | `sanitizePath()`            | Tinggi - Mencegah traversal path                     |
| Validasi Jenis File  | `isTextFile()`              | Sedang - Hanya file teks, tetapi masih bisa berbahaya |
| Batas Ukuran         | Bundle total 50MB           | Tinggi - Mencegah penghabisan sumber daya            |
| SKILL.md Wajib       | Readme wajib                | Nilai keamanan rendah - Hanya informatif             |
| Moderasi Pola        | FLAG_RULES di moderation.ts | Rendah - Mudah dilewati                              |
| Status Moderasi      | Field `moderationStatus`    | Sedang - Peninjauan manual dimungkinkan              |

### 4.2 Pola Flag Moderasi

Pola saat ini di `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Keterbatasan:**

- Hanya memeriksa slug, displayName, ringkasan, frontmatter, metadata, path file
- Tidak menganalisis konten kode Skills yang sebenarnya
- Regex sederhana mudah dilewati dengan obfuskasi
- Tidak ada analisis perilaku

### 4.3 Peningkatan yang Direncanakan

| Peningkatan           | Status                                | Dampak                                                                |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integrasi VirusTotal  | Sedang Berjalan                       | Tinggi - Analisis perilaku Code Insight                               |
| Pelaporan Komunitas   | Parsial (tabel `skillReports` ada)    | Sedang                                                                |
| Logging Audit         | Parsial (tabel `auditLogs` ada)       | Sedang                                                                |
| Sistem Badge          | Diimplementasikan                     | Sedang - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriks Risiko

### 5.1 Kemungkinan vs Dampak

| ID Ancaman    | Kemungkinan | Dampak   | Tingkat Risiko | Prioritas |
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

### 5.2 Rantai Serangan Jalur Kritis

**Rantai Serangan 1: Pencurian Data Berbasis Skills**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Rantai Serangan 2: Injeksi Prompt ke RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Rantai Serangan 3: Injeksi Tidak Langsung melalui Konten yang Diambil**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Ringkasan Rekomendasi

### 6.1 Segera (P0)

| ID    | Rekomendasi                                      | Menangani                  |
| ----- | ------------------------------------------------ | -------------------------- |
| R-001 | Selesaikan integrasi VirusTotal                  | T-PERSIST-001, T-EVADE-001 |
| R-002 | Terapkan isolasi sandbox untuk skill             | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Tambahkan validasi output untuk tindakan sensitif | T-EXEC-001, T-EXEC-002     |

### 6.2 Jangka pendek (P1)

| ID    | Rekomendasi                                  | Menangani    |
| ----- | -------------------------------------------- | ------------ |
| R-004 | Terapkan pembatasan laju                     | T-IMPACT-002 |
| R-005 | Tambahkan enkripsi token saat tersimpan      | T-ACCESS-003 |
| R-006 | Tingkatkan UX dan validasi persetujuan exec  | T-EXEC-004   |
| R-007 | Terapkan daftar izinkan URL untuk web_fetch  | T-EXFIL-001  |

### 6.3 Jangka menengah (P2)

| ID    | Rekomendasi                                           | Menangani     |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Tambahkan verifikasi kanal kriptografis jika memungkinkan | T-ACCESS-002  |
| R-009 | Terapkan verifikasi integritas config                 | T-PERSIST-003 |
| R-010 | Tambahkan penandatanganan pembaruan dan penyematan versi | T-PERSIST-002 |

---

## 7. Lampiran

### 7.1 Pemetaan Teknik ATLAS

| ID ATLAS      | Nama Teknik                    | Ancaman OpenClaw                                                |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Pemindaian Aktif               | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Pengumpulan                    | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Rantai Pasok: Perangkat Lunak AI | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Rantai Pasok: Data             | T-PERSIST-003                                                    |
| AML.T0031     | Mengikis Integritas Model AI   | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Akses API Inferensi Model AI   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Membuat Data Adversarial       | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Injeksi Prompt LLM: Langsung   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Injeksi Prompt LLM: Tidak Langsung | T-EXEC-002                                                       |

### 7.2 File Keamanan Utama

| Path                                | Tujuan                         | Tingkat Risiko |
| ----------------------------------- | ------------------------------ | -------------- |
| `src/infra/exec-approvals.ts`       | Logika persetujuan perintah    | **Kritis**     |
| `src/gateway/auth.ts`               | Autentikasi Gateway            | **Kritis**     |
| `src/infra/net/ssrf.ts`             | Perlindungan SSRF              | **Kritis**     |
| `src/security/external-content.ts`  | Mitigasi injeksi prompt        | **Kritis**     |
| `src/agents/sandbox/tool-policy.ts` | Penegakan kebijakan alat       | **Kritis**     |
| `src/routing/resolve-route.ts`      | Isolasi sesi                   | **Sedang**     |

### 7.3 Glosarium

| Istilah              | Definisi                                                |
| -------------------- | ------------------------------------------------------- |
| **ATLAS**            | Lanskap Ancaman Adversarial MITRE untuk Sistem AI       |
| **ClawHub**          | marketplace skill OpenClaw                              |
| **Gateway**          | lapisan perutean pesan dan autentikasi OpenClaw         |
| **MCP**              | Model Context Protocol - antarmuka penyedia alat        |
| **Injeksi Prompt**   | Serangan saat instruksi berbahaya disematkan dalam input |
| **Skill**            | Ekstensi yang dapat diunduh untuk agen OpenClaw         |
| **SSRF**             | Server-Side Request Forgery                             |

---

_Model ancaman ini adalah dokumen yang terus berkembang. Laporkan masalah keamanan ke security@openclaw.ai_

## Terkait

- [Verifikasi formal](/id/security/formal-verification)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
