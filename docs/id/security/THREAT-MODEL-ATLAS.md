---
read_when:
    - Meninjau postur keamanan atau skenario ancaman
    - Mengerjakan fitur keamanan atau respons audit
summary: Model ancaman OpenClaw yang dipetakan ke framework MITRE ATLAS
title: Model Ancaman (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T14:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Model Ancaman OpenClaw v1.0

## Framework MITRE ATLAS

**Versi:** 1.0-draft
**Terakhir Diperbarui:** 2026-02-04
**Metodologi:** MITRE ATLAS + Diagram Alur Data
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribusi Framework

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/), framework standar industri untuk mendokumentasikan ancaman adversarial terhadap sistem AI/ML. ATLAS dikelola oleh [MITRE](https://www.mitre.org/) bekerja sama dengan komunitas keamanan AI.

**Sumber Daya ATLAS Utama:**

- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Taktik ATLAS](https://atlas.mitre.org/tactics/)
- [Studi Kasus ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Berkontribusi ke ATLAS](https://atlas.mitre.org/resources/contribute)

### Berkontribusi pada Model Ancaman Ini

Ini adalah dokumen hidup yang dikelola oleh komunitas OpenClaw. Lihat [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) untuk panduan berkontribusi:

- Melaporkan ancaman baru
- Memperbarui ancaman yang sudah ada
- Mengusulkan rantai serangan
- Menyarankan mitigasi

---

## 1. Pendahuluan

### 1.1 Tujuan

Model ancaman ini mendokumentasikan ancaman adversarial terhadap platform agent AI OpenClaw dan marketplace skill ClawHub, menggunakan framework MITRE ATLAS yang dirancang khusus untuk sistem AI/ML.

### 1.2 Cakupan

| Komponen               | Termasuk | Catatan                                          |
| ---------------------- | -------- | ------------------------------------------------ |
| Runtime Agent OpenClaw | Ya       | Eksekusi agent inti, panggilan tool, sesi        |
| Gateway                | Ya       | Autentikasi, perutean, integrasi channel         |
| Integrasi Channel      | Ya       | WhatsApp, Telegram, Discord, Signal, Slack, dll. |
| Marketplace ClawHub    | Ya       | Penerbitan skill, moderasi, distribusi           |
| Server MCP             | Ya       | Penyedia tool eksternal                          |
| Perangkat Pengguna     | Sebagian | Aplikasi seluler, klien desktop                  |

### 1.3 Di Luar Cakupan

Tidak ada yang secara eksplisit di luar cakupan untuk model ancaman ini.

---

## 2. Arsitektur Sistem

### 2.1 Batas Kepercayaan

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA TIDAK TEPERCAYA                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              BATAS KEPERCAYAAN 1: Akses Channel                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Pairing Perangkat (periode tenggang DM 1j / node 5m)   │   │
│  │  • Validasi AllowFrom / AllowList                         │   │
│  │  • Auth Token/Password/Tailscale                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BATAS KEPERCAYAAN 2: Isolasi Sesi                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SESI AGENT                             │   │
│  │  • Kunci sesi = agent:channel:peer                        │   │
│  │  • Kebijakan tool per agent                               │   │
│  │  • Pencatatan transkrip                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BATAS KEPERCAYAAN 3: Eksekusi Tool                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SANDBOX EKSEKUSI                          │   │
│  │  • Sandbox Docker ATAU Host (exec-approvals)              │   │
│  │  • Eksekusi jarak jauh Node                               │   │
│  │  • Perlindungan SSRF (pinning DNS + pemblokiran IP)       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            BATAS KEPERCAYAAN 4: Konten Eksternal                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            URL / EMAIL / WEBHOOK YANG DIAMBIL             │   │
│  │  • Pembungkusan konten eksternal (tag XML)                │   │
│  │  • Penyisipan pemberitahuan keamanan                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BATAS KEPERCAYAAN 5: Rantai Pasok                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Penerbitan skill (semver, SKILL.md wajib)             │   │
│  │  • Flag moderasi berbasis pola                           │   │
│  │  • Pemindaian VirusTotal (segera hadir)                  │   │
│  │  • Verifikasi usia akun GitHub                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Alur Data

| Alur | Sumber  | Tujuan      | Data               | Perlindungan         |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Channel | Gateway     | Pesan pengguna     | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Pesan yang dirutekan | Isolasi sesi       |
| F3   | Agent   | Tools       | Pemanggilan tool   | Penegakan kebijakan  |
| F4   | Agent   | Eksternal   | Permintaan web_fetch | Pemblokiran SSRF   |
| F5   | ClawHub | Agent       | Kode skill         | Moderasi, pemindaian |
| F6   | Agent   | Channel     | Respons            | Penyaringan output   |

---

## 3. Analisis Ancaman berdasarkan Taktik ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001: Penemuan Endpoint Agent

| Atribut                 | Nilai                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Pemindaian Aktif                                         |
| **Deskripsi**           | Penyerang memindai endpoint gateway OpenClaw yang terekspos          |
| **Vektor Serangan**     | Pemindaian jaringan, query shodan, enumerasi DNS                     |
| **Komponen Terdampak**  | Gateway, endpoint API yang terekspos                                 |
| **Mitigasi Saat Ini**   | Opsi auth Tailscale, bind ke loopback secara default                 |
| **Risiko Residual**     | Sedang - Gateway publik dapat ditemukan                              |
| **Rekomendasi**         | Dokumentasikan deployment aman, tambahkan rate limiting pada endpoint penemuan |

#### T-RECON-002: Probing Integrasi Channel

| Atribut                 | Nilai                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0006 - Pemindaian Aktif                                       |
| **Deskripsi**           | Penyerang mem-probe channel perpesanan untuk mengidentifikasi akun yang dikelola AI |
| **Vektor Serangan**     | Mengirim pesan uji, mengamati pola respons                         |
| **Komponen Terdampak**  | Semua integrasi channel                                            |
| **Mitigasi Saat Ini**   | Tidak ada yang spesifik                                            |
| **Risiko Residual**     | Rendah - Nilai terbatas hanya dari penemuan                        |
| **Rekomendasi**         | Pertimbangkan randomisasi waktu respons                            |

---

### 3.2 Akses Awal (AML.TA0004)

#### T-ACCESS-001: Penyadapan Kode Pairing

| Atribut                 | Nilai                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                                                      |
| **Deskripsi**           | Penyerang menyadap kode pairing selama periode tenggang pairing (1j untuk pairing channel DM, 5m untuk pairing node) |
| **Vektor Serangan**     | Mengintip dari belakang, sniffing jaringan, rekayasa sosial                                                   |
| **Komponen Terdampak**  | Sistem pairing perangkat                                                                                        |
| **Mitigasi Saat Ini**   | Kedaluwarsa 1j (pairing DM) / 5m (pairing node), kode dikirim melalui channel yang sudah ada                  |
| **Risiko Residual**     | Sedang - Periode tenggang dapat dieksploitasi                                                                  |
| **Rekomendasi**         | Kurangi periode tenggang, tambahkan langkah konfirmasi                                                         |

#### T-ACCESS-002: Pemalsuan AllowFrom

| Atribut                 | Nilai                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                                       |
| **Deskripsi**           | Penyerang memalsukan identitas pengirim yang diizinkan di channel              |
| **Vektor Serangan**     | Tergantung channel - spoofing nomor telepon, peniruan nama pengguna            |
| **Komponen Terdampak**  | Validasi AllowFrom per channel                                                 |
| **Mitigasi Saat Ini**   | Verifikasi identitas khusus per channel                                        |
| **Risiko Residual**     | Sedang - Beberapa channel rentan terhadap spoofing                             |
| **Rekomendasi**         | Dokumentasikan risiko khusus per channel, tambahkan verifikasi kriptografis bila memungkinkan |

#### T-ACCESS-003: Pencurian Token

| Atribut                 | Nilai                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI                    |
| **Deskripsi**           | Penyerang mencuri token autentikasi dari file config        |
| **Vektor Serangan**     | Malware, akses perangkat tanpa izin, paparan cadangan config |
| **Komponen Terdampak**  | `~/.openclaw/credentials/`, penyimpanan config              |
| **Mitigasi Saat Ini**   | Izin file                                                   |
| **Risiko Residual**     | Tinggi - Token disimpan dalam plaintext                     |
| **Rekomendasi**         | Terapkan enkripsi token saat disimpan, tambahkan rotasi token |

---

### 3.3 Eksekusi (AML.TA0005)

#### T-EXEC-001: Injeksi Prompt Langsung

| Atribut                 | Nilai                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injeksi Prompt LLM: Langsung                                              |
| **Deskripsi**           | Penyerang mengirim prompt yang dibuat khusus untuk memanipulasi perilaku agent            |
| **Vektor Serangan**     | Pesan channel yang berisi instruksi adversarial                                           |
| **Komponen Terdampak**  | LLM agent, semua surface input                                                            |
| **Mitigasi Saat Ini**   | Deteksi pola, pembungkusan konten eksternal                                               |
| **Risiko Residual**     | Kritis - Hanya deteksi, tidak ada pemblokiran; serangan canggih dapat lolos               |
| **Rekomendasi**         | Terapkan pertahanan multi-layer, validasi output, konfirmasi pengguna untuk tindakan sensitif |

#### T-EXEC-002: Injeksi Prompt Tidak Langsung

| Atribut                 | Nilai                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Injeksi Prompt LLM: Tidak Langsung          |
| **Deskripsi**           | Penyerang menyisipkan instruksi berbahaya dalam konten yang diambil |
| **Vektor Serangan**     | URL berbahaya, email yang diracuni, webhook yang disusupi   |
| **Komponen Terdampak**  | `web_fetch`, ingestion email, sumber data eksternal         |
| **Mitigasi Saat Ini**   | Pembungkusan konten dengan tag XML dan pemberitahuan keamanan |
| **Risiko Residual**     | Tinggi - LLM dapat mengabaikan instruksi pembungkus         |
| **Rekomendasi**         | Terapkan sanitasi konten, pisahkan konteks eksekusi         |

#### T-EXEC-003: Injeksi Argumen Tool

| Atribut                 | Nilai                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Injeksi Prompt LLM: Langsung                 |
| **Deskripsi**           | Penyerang memanipulasi argumen tool melalui injeksi prompt   |
| **Vektor Serangan**     | Prompt yang dibuat khusus dan memengaruhi nilai parameter tool |
| **Komponen Terdampak**  | Semua pemanggilan tool                                       |
| **Mitigasi Saat Ini**   | Persetujuan exec untuk perintah berbahaya                    |
| **Risiko Residual**     | Tinggi - Bergantung pada penilaian pengguna                  |
| **Rekomendasi**         | Terapkan validasi argumen, panggilan tool terparameterisasi  |

#### T-EXEC-004: Bypass Persetujuan Exec

| Atribut                 | Nilai                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                       |
| **Deskripsi**           | Penyerang membuat perintah yang melewati allowlist persetujuan |
| **Vektor Serangan**     | Obfuscasi perintah, eksploitasi alias, manipulasi path     |
| **Komponen Terdampak**  | `exec-approvals.ts`, allowlist perintah                    |
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
| **Vektor Serangan**     | Membuat akun, menerbitkan skill dengan kode berbahaya yang disembunyikan |
| **Komponen Terdampak**  | ClawHub, pemuatan skill, eksekusi agent                                  |
| **Mitigasi Saat Ini**   | Verifikasi usia akun GitHub, flag moderasi berbasis pola                 |
| **Risiko Residual**     | Kritis - Tidak ada sandboxing, peninjauan terbatas                       |
| **Rekomendasi**         | Integrasi VirusTotal (sedang berlangsung), sandboxing skill, peninjauan komunitas |

#### T-PERSIST-002: Peracunan Pembaruan Skill

| Atribut                 | Nilai                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Kompromi Rantai Pasok: Perangkat Lunak AI      |
| **Deskripsi**           | Penyerang menyusupi skill populer dan mendorong pembaruan berbahaya |
| **Vektor Serangan**     | Kompromi akun, rekayasa sosial terhadap pemilik skill          |
| **Komponen Terdampak**  | Pembuatan versi ClawHub, alur auto-update                      |
| **Mitigasi Saat Ini**   | Fingerprinting versi                                           |
| **Risiko Residual**     | Tinggi - Auto-update dapat menarik versi berbahaya             |
| **Rekomendasi**         | Terapkan penandatanganan pembaruan, kemampuan rollback, version pinning |

#### T-PERSIST-003: Perusakan Konfigurasi Agent

| Atribut                 | Nilai                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Kompromi Rantai Pasok: Data                     |
| **Deskripsi**           | Penyerang memodifikasi konfigurasi agent untuk mempertahankan akses |
| **Vektor Serangan**     | Modifikasi file config, injeksi pengaturan                      |
| **Komponen Terdampak**  | Config agent, kebijakan tool                                    |
| **Mitigasi Saat Ini**   | Izin file                                                       |
| **Risiko Residual**     | Sedang - Memerlukan akses lokal                                 |
| **Rekomendasi**         | Verifikasi integritas config, pencatatan audit untuk perubahan config |

---

### 3.5 Pengelakan Pertahanan (AML.TA0007)

#### T-EVADE-001: Bypass Pola Moderasi

| Atribut                 | Nilai                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                                   |
| **Deskripsi**           | Penyerang membuat konten skill agar lolos dari pola moderasi           |
| **Vektor Serangan**     | Homoglif Unicode, trik encoding, pemuatan dinamis                      |
| **Komponen Terdampak**  | `moderation.ts` ClawHub                                                |
| **Mitigasi Saat Ini**   | `FLAG_RULES` berbasis pola                                             |
| **Risiko Residual**     | Tinggi - Regex sederhana mudah dilewati                                |
| **Rekomendasi**         | Tambahkan analisis perilaku (VirusTotal Code Insight), deteksi berbasis AST |

#### T-EVADE-002: Lolos dari Pembungkus Konten

| Atribut                 | Nilai                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Membuat Data Adversarial                      |
| **Deskripsi**           | Penyerang membuat konten yang lolos dari konteks pembungkus XML |
| **Vektor Serangan**     | Manipulasi tag, kebingungan konteks, override instruksi   |
| **Komponen Terdampak**  | Pembungkusan konten eksternal                             |
| **Mitigasi Saat Ini**   | Tag XML + pemberitahuan keamanan                          |
| **Risiko Residual**     | Sedang - Teknik lolos baru rutin ditemukan                |
| **Rekomendasi**         | Banyak layer pembungkus, validasi di sisi output          |

---

### 3.6 Penemuan (AML.TA0008)

#### T-DISC-001: Enumerasi Tool

| Atribut                 | Nilai                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI              |
| **Deskripsi**           | Penyerang melakukan enumerasi tool yang tersedia melalui prompting |
| **Vektor Serangan**     | Query bergaya "Tool apa yang Anda miliki?"            |
| **Komponen Terdampak**  | Registry tool agent                                   |
| **Mitigasi Saat Ini**   | Tidak ada yang spesifik                               |
| **Risiko Residual**     | Rendah - Tool umumnya terdokumentasi                  |
| **Rekomendasi**         | Pertimbangkan kontrol visibilitas tool                |

#### T-DISC-002: Ekstraksi Data Sesi

| Atribut                 | Nilai                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Akses API Inferensi Model AI              |
| **Deskripsi**           | Penyerang mengekstrak data sensitif dari konteks sesi |
| **Vektor Serangan**     | Query "Apa yang kita bahas?", probing konteks         |
| **Komponen Terdampak**  | Transkrip sesi, context window                        |
| **Mitigasi Saat Ini**   | Isolasi sesi per pengirim                             |
| **Risiko Residual**     | Sedang - Data dalam sesi dapat diakses                |
| **Rekomendasi**         | Terapkan redaksi data sensitif dalam konteks          |

---

### 3.7 Pengumpulan & Eksfiltrasi (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Pencurian Data melalui web_fetch

| Atribut                 | Nilai                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                                |
| **Deskripsi**           | Penyerang mengekstrak data dengan menginstruksikan agent mengirim ke URL eksternal |
| **Vektor Serangan**     | Injeksi prompt yang menyebabkan agent melakukan POST data ke server penyerang |
| **Komponen Terdampak**  | Tool `web_fetch`                                                       |
| **Mitigasi Saat Ini**   | Pemblokiran SSRF untuk jaringan internal                               |
| **Risiko Residual**     | Tinggi - URL eksternal diizinkan                                       |
| **Rekomendasi**         | Terapkan allowlisting URL, kesadaran klasifikasi data                  |

#### T-EXFIL-002: Pengiriman Pesan Tanpa Otorisasi

| Atribut                 | Nilai                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                          |
| **Deskripsi**           | Penyerang menyebabkan agent mengirim pesan yang berisi data sensitif |
| **Vektor Serangan**     | Injeksi prompt yang menyebabkan agent mengirim pesan ke penyerang |
| **Komponen Terdampak**  | Tool pesan, integrasi channel                                    |
| **Mitigasi Saat Ini**   | Gating pesan keluar                                              |
| **Risiko Residual**     | Sedang - Gating dapat dilewati                                   |
| **Rekomendasi**         | Wajibkan konfirmasi eksplisit untuk penerima baru                |

#### T-EXFIL-003: Pemanenan Kredensial

| Atribut                 | Nilai                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Pengumpulan                                 |
| **Deskripsi**           | Skill berbahaya memanen kredensial dari konteks agent   |
| **Vektor Serangan**     | Kode skill membaca environment variable, file config    |
| **Komponen Terdampak**  | Lingkungan eksekusi skill                               |
| **Mitigasi Saat Ini**   | Tidak ada yang spesifik untuk skill                     |
| **Risiko Residual**     | Kritis - Skill berjalan dengan hak istimewa agent       |
| **Rekomendasi**         | Sandboxing skill, isolasi kredensial                    |

---

### 3.8 Dampak (AML.TA0011)

#### T-IMPACT-001: Eksekusi Perintah Tanpa Otorisasi

| Atribut                 | Nilai                                               |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Merusak Integritas Model AI             |
| **Deskripsi**           | Penyerang mengeksekusi perintah arbitrer pada sistem pengguna |
| **Vektor Serangan**     | Injeksi prompt yang digabungkan dengan bypass persetujuan exec |
| **Komponen Terdampak**  | Tool Bash, eksekusi perintah                        |
| **Mitigasi Saat Ini**   | Persetujuan exec, opsi sandbox Docker               |
| **Risiko Residual**     | Kritis - Eksekusi host tanpa sandbox                |
| **Rekomendasi**         | Default ke sandbox, tingkatkan UX persetujuan       |

#### T-IMPACT-002: Penghabisan Sumber Daya (DoS)

| Atribut                 | Nilai                                              |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Merusak Integritas Model AI            |
| **Deskripsi**           | Penyerang menghabiskan kredit API atau sumber daya komputasi |
| **Vektor Serangan**     | Pembanjiran pesan otomatis, panggilan tool mahal   |
| **Komponen Terdampak**  | Gateway, sesi agent, penyedia API                  |
| **Mitigasi Saat Ini**   | Tidak ada                                          |
| **Risiko Residual**     | Tinggi - Tidak ada rate limiting                   |
| **Rekomendasi**         | Terapkan batas laju per pengirim, anggaran biaya   |

#### T-IMPACT-003: Kerusakan Reputasi

| Atribut                 | Nilai                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Merusak Integritas Model AI                 |
| **Deskripsi**           | Penyerang menyebabkan agent mengirim konten berbahaya/ofensif |
| **Vektor Serangan**     | Injeksi prompt yang menyebabkan respons tidak pantas    |
| **Komponen Terdampak**  | Pembuatan output, perpesanan channel                    |
| **Mitigasi Saat Ini**   | Kebijakan konten penyedia LLM                           |
| **Risiko Residual**     | Sedang - Filter penyedia tidak sempurna                 |
| **Rekomendasi**         | Layer penyaringan output, kontrol pengguna              |

---

## 4. Analisis Rantai Pasok ClawHub

### 4.1 Kontrol Keamanan Saat Ini

| Kontrol               | Implementasi                | Efektivitas                                           |
| --------------------- | --------------------------- | ----------------------------------------------------- |
| Usia Akun GitHub      | `requireGitHubAccountAge()` | Sedang - Menaikkan hambatan bagi penyerang baru       |
| Sanitasi Path         | `sanitizePath()`            | Tinggi - Mencegah path traversal                      |
| Validasi Jenis File   | `isTextFile()`              | Sedang - Hanya file teks, tetapi tetap bisa berbahaya |
| Batas Ukuran          | Bundle total 50MB           | Tinggi - Mencegah penghabisan sumber daya             |
| SKILL.md Wajib        | Readme wajib                | Nilai keamanan rendah - Hanya informatif              |
| Moderasi Pola         | `FLAG_RULES` di `moderation.ts` | Rendah - Mudah dilewati                           |
| Status Moderasi       | field `moderationStatus`    | Sedang - Peninjauan manual dimungkinkan               |

### 4.2 Pola Flag Moderasi

Pola saat ini di `moderation.ts`:

```javascript
// Pengidentifikasi known-bad
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Kata kunci mencurigakan
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Keterbatasan:**

- Hanya memeriksa slug, `displayName`, `summary`, frontmatter, metadata, path file
- Tidak menganalisis konten kode skill yang sebenarnya
- Regex sederhana mudah dilewati dengan obfuscation
- Tidak ada analisis perilaku

### 4.3 Peningkatan yang Direncanakan

| Peningkatan            | Status                                  | Dampak                                                              |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Integrasi VirusTotal   | Sedang Berlangsung                      | Tinggi - Analisis perilaku Code Insight                             |
| Pelaporan Komunitas    | Sebagian (`skillReports` table ada)     | Sedang                                                              |
| Pencatatan Audit       | Sebagian (`auditLogs` table ada)        | Sedang                                                              |
| Sistem Badge           | Sudah Diimplementasikan                 | Sedang - `highlighted`, `official`, `deprecated`, `redactionApproved` |

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

**Rantai Serangan 1: Pencurian Data Berbasis Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Terbitkan skill berbahaya) → (Lolos dari moderasi) → (Panen kredensial)
```

**Rantai Serangan 2: Injeksi Prompt ke RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Sisipkan prompt) → (Lewati persetujuan exec) → (Eksekusi perintah)
```

**Rantai Serangan 3: Injeksi Tidak Langsung melalui Konten yang Diambil**

```
T-EXEC-002 → T-EXFIL-001 → Eksfiltrasi eksternal
(Racuni konten URL) → (Agent mengambil & mengikuti instruksi) → (Data dikirim ke penyerang)
```

---

## 6. Ringkasan Rekomendasi

### 6.1 Segera (P0)

| ID    | Rekomendasi                                | Menangani                  |
| ----- | ------------------------------------------ | -------------------------- |
| R-001 | Selesaikan integrasi VirusTotal            | T-PERSIST-001, T-EVADE-001 |
| R-002 | Terapkan sandboxing skill                  | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Tambahkan validasi output untuk tindakan sensitif | T-EXEC-001, T-EXEC-002 |

### 6.2 Jangka Pendek (P1)

| ID    | Rekomendasi                              | Menangani    |
| ----- | ---------------------------------------- | ------------ |
| R-004 | Terapkan rate limiting                   | T-IMPACT-002 |
| R-005 | Tambahkan enkripsi token saat disimpan   | T-ACCESS-003 |
| R-006 | Tingkatkan UX dan validasi persetujuan exec | T-EXEC-004 |
| R-007 | Terapkan allowlisting URL untuk `web_fetch` | T-EXFIL-001 |

### 6.3 Jangka Menengah (P2)

| ID    | Rekomendasi                                           | Menangani     |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Tambahkan verifikasi channel kriptografis bila memungkinkan | T-ACCESS-002  |
| R-009 | Terapkan verifikasi integritas config                 | T-PERSIST-003 |
| R-010 | Tambahkan penandatanganan pembaruan dan version pinning | T-PERSIST-002 |

---

## 7. Lampiran

### 7.1 Pemetaan Teknik ATLAS

| ID ATLAS      | Nama Teknik                    | Ancaman OpenClaw                                                  |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| AML.T0006     | Pemindaian Aktif               | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Pengumpulan                    | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Rantai Pasok: Perangkat Lunak AI | T-PERSIST-001, T-PERSIST-002                                    |
| AML.T0010.002 | Rantai Pasok: Data             | T-PERSIST-003                                                     |
| AML.T0031     | Merusak Integritas Model AI    | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                          |
| AML.T0040     | Akses API Inferensi Model AI   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002  |
| AML.T0043     | Membuat Data Adversarial       | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | Injeksi Prompt LLM: Langsung   | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | Injeksi Prompt LLM: Tidak Langsung | T-EXEC-002                                                    |

### 7.2 File Keamanan Utama

| Path                                | Tujuan                      | Tingkat Risiko |
| ----------------------------------- | --------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Logika persetujuan perintah | **Kritis**     |
| `src/gateway/auth.ts`               | Autentikasi gateway         | **Kritis**     |
| `src/infra/net/ssrf.ts`             | Perlindungan SSRF           | **Kritis**     |
| `src/security/external-content.ts`  | Mitigasi injeksi prompt     | **Kritis**     |
| `src/agents/sandbox/tool-policy.ts` | Penegakan kebijakan tool    | **Kritis**     |
| `src/routing/resolve-route.ts`      | Isolasi sesi                | **Sedang**     |

### 7.3 Glosarium

| Istilah              | Definisi                                                |
| -------------------- | ------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems milik MITRE |
| **ClawHub**          | Marketplace skill OpenClaw                              |
| **Gateway**          | Layer perutean pesan dan autentikasi OpenClaw           |
| **MCP**              | Model Context Protocol - antarmuka penyedia tool        |
| **Prompt Injection** | Serangan ketika instruksi berbahaya disisipkan ke input |
| **Skill**            | Ekstensi yang dapat diunduh untuk agent OpenClaw        |
| **SSRF**             | Server-Side Request Forgery                             |

---

_Model ancaman ini adalah dokumen hidup. Laporkan masalah keamanan ke security@openclaw.ai_
