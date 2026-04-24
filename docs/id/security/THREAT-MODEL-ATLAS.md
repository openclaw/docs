---
read_when:
    - Meninjau postur keamanan atau skenario ancaman
    - Mengerjakan fitur keamanan atau respons audit
summary: Model ancaman OpenClaw yang dipetakan ke kerangka MITRE ATLAS
title: Model ancaman (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T09:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Model Ancaman OpenClaw v1.0

## Kerangka MITRE ATLAS

**Versi:** 1.0-draft
**Terakhir diperbarui:** 2026-02-04
**Metodologi:** MITRE ATLAS + Diagram Alir Data
**Kerangka:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribusi kerangka

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/), kerangka standar industri untuk mendokumentasikan ancaman adversarial terhadap sistem AI/ML. ATLAS dikelola oleh [MITRE](https://www.mitre.org/) bekerja sama dengan komunitas keamanan AI.

**Sumber daya ATLAS utama:**

- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Taktik ATLAS](https://atlas.mitre.org/tactics/)
- [Studi Kasus ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Berkontribusi ke ATLAS](https://atlas.mitre.org/resources/contribute)

### Berkontribusi pada model ancaman ini

Ini adalah dokumen hidup yang dipelihara oleh komunitas OpenClaw. Lihat [CONTRIBUTING-THREAT-MODEL.md](/id/security/CONTRIBUTING-THREAT-MODEL) untuk panduan kontribusi:

- Melaporkan ancaman baru
- Memperbarui ancaman yang ada
- Mengusulkan rantai serangan
- Menyarankan mitigasi

---

## 1. Pendahuluan

### 1.1 Tujuan

Model ancaman ini mendokumentasikan ancaman adversarial terhadap platform agen AI OpenClaw dan marketplace skill ClawHub, menggunakan kerangka MITRE ATLAS yang dirancang khusus untuk sistem AI/ML.

### 1.2 Cakupan

| Komponen               | Termasuk | Catatan                                          |
| ---------------------- | -------- | ------------------------------------------------ |
| Runtime Agen OpenClaw  | Ya       | Eksekusi agen inti, pemanggilan alat, sesi       |
| Gateway                | Ya       | Autentikasi, perutean, integrasi kanal           |
| Integrasi Kanal        | Ya       | WhatsApp, Telegram, Discord, Signal, Slack, dll. |
| Marketplace ClawHub    | Ya       | Penerbitan skill, moderasi, distribusi           |
| Server MCP             | Ya       | Provider alat eksternal                          |
| Perangkat Pengguna     | Sebagian | Aplikasi mobile, klien desktop                   |

### 1.3 Di luar cakupan

Tidak ada yang secara eksplisit di luar cakupan untuk model ancaman ini.

---

## 2. Arsitektur sistem

### 2.1 Batas kepercayaan

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA TIDAK TEPERCAYA                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              BATAS KEPERCAYAAN 1: Akses Kanal                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                             │   │
│  │  • Pairing perangkat (grace period DM 1j / node 5m)     │   │
│  │  • Validasi AllowFrom / AllowList                        │   │
│  │  • Auth Token/Password/Tailscale                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BATAS KEPERCAYAAN 2: Isolasi Sesi                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SESI AGEN                            │   │
│  │  • Session key = agent:channel:peer                    │   │
│  │  • Kebijakan alat per agen                             │   │
│  │  • Logging transkrip                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            BATAS KEPERCAYAAN 3: Eksekusi Alat                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SANDBOX EKSEKUSI                        │   │
│  │  • Sandbox Docker ATAU Host (exec-approvals)            │   │
│  │  • Eksekusi jarak jauh Node                             │   │
│  │  • Perlindungan SSRF (DNS pinning + pemblokiran IP)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BATAS KEPERCAYAAN 4: Konten Eksternal                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           URL / EMAIL / WEBHOOK YANG DIAMBIL            │   │
│  │  • Pembungkusan konten eksternal (tag XML)              │   │
│  │  • Injeksi pemberitahuan keamanan                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            BATAS KEPERCAYAAN 5: Rantai Pasok                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                            │   │
│  │  • Penerbitan skill (semver, SKILL.md wajib)           │   │
│  │  • Flag moderasi berbasis pola                          │   │
│  │  • Pemindaian VirusTotal (segera hadir)                 │   │
│  │  • Verifikasi usia akun GitHub                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Alur data

| Alur | Sumber  | Tujuan      | Data                | Perlindungan         |
| ---- | ------- | ----------- | ------------------- | -------------------- |
| F1   | Kanal   | Gateway     | Pesan pengguna      | TLS, AllowFrom       |
| F2   | Gateway | Agen        | Pesan yang dirutekan | Isolasi sesi        |
| F3   | Agen    | Alat        | Pemanggilan alat    | Penegakan kebijakan  |
| F4   | Agen    | Eksternal   | permintaan `web_fetch` | Pemblokiran SSRF  |
| F5   | ClawHub | Agen        | Kode skill          | Moderasi, pemindaian |
| F6   | Agen    | Kanal       | Respons             | Pemfilteran output   |

---

## 3. Analisis ancaman berdasarkan taktik ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001: Penemuan endpoint agen

| Atribut                  | Nilai                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0006 - Active Scanning                                         |
| **Deskripsi**            | Penyerang memindai endpoint gateway OpenClaw yang terekspos         |
| **Vektor serangan**      | Pemindaian jaringan, kueri shodan, enumerasi DNS                   |
| **Komponen terdampak**   | Gateway, endpoint API yang terekspos                               |
| **Mitigasi saat ini**    | Opsi auth Tailscale, bind ke loopback secara default               |
| **Risiko residual**      | Sedang - Gateway publik dapat ditemukan                            |
| **Rekomendasi**          | Dokumentasikan deployment aman, tambahkan rate limiting pada endpoint discovery |

#### T-RECON-002: Probing integrasi kanal

| Atribut                  | Nilai                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0006 - Active Scanning                                           |
| **Deskripsi**            | Penyerang mem-probe kanal pesan untuk mengidentifikasi akun yang dikelola AI |
| **Vektor serangan**      | Mengirim pesan uji, mengamati pola respons                            |
| **Komponen terdampak**   | Semua integrasi kanal                                                 |
| **Mitigasi saat ini**    | Tidak ada yang spesifik                                               |
| **Risiko residual**      | Rendah - Nilai penemuan saja terbatas                                 |
| **Rekomendasi**          | Pertimbangkan randomisasi waktu respons                               |

---

### 3.2 Akses awal (AML.TA0004)

#### T-ACCESS-001: Intersepsi kode pairing

| Atribut                  | Nilai                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - AI Model Inference API Access                                                                        |
| **Deskripsi**            | Penyerang mencegat kode pairing selama grace period pairing (1j untuk pairing kanal DM, 5m untuk pairing Node) |
| **Vektor serangan**      | Mengintip dari balik bahu, sniffing jaringan, rekayasa sosial                                                   |
| **Komponen terdampak**   | Sistem pairing perangkat                                                                                         |
| **Mitigasi saat ini**    | Kedaluwarsa 1j (pairing DM) / 5m (pairing Node), kode dikirim melalui kanal yang sudah ada                     |
| **Risiko residual**      | Sedang - Grace period dapat dieksploitasi                                                                        |
| **Rekomendasi**          | Kurangi grace period, tambahkan langkah konfirmasi                                                               |

#### T-ACCESS-002: Pemalsuan AllowFrom

| Atribut                  | Nilai                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - AI Model Inference API Access                                    |
| **Deskripsi**            | Penyerang memalsukan identitas pengirim yang diizinkan di kanal              |
| **Vektor serangan**      | Bergantung pada kanal - spoofing nomor telepon, peniruan username            |
| **Komponen terdampak**   | Validasi AllowFrom per kanal                                                 |
| **Mitigasi saat ini**    | Verifikasi identitas khusus kanal                                            |
| **Risiko residual**      | Sedang - Beberapa kanal rentan terhadap spoofing                             |
| **Rekomendasi**          | Dokumentasikan risiko khusus kanal, tambahkan verifikasi kriptografis bila memungkinkan |

#### T-ACCESS-003: Pencurian token

| Atribut                  | Nilai                                                         |
| ------------------------ | ------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - AI Model Inference API Access                     |
| **Deskripsi**            | Penyerang mencuri token autentikasi dari file konfigurasi     |
| **Vektor serangan**      | Malware, akses perangkat tidak sah, paparan backup konfigurasi |
| **Komponen terdampak**   | ~/.openclaw/credentials/, penyimpanan konfigurasi             |
| **Mitigasi saat ini**    | Izin file                                                     |
| **Risiko residual**      | Tinggi - Token disimpan dalam plaintext                       |
| **Rekomendasi**          | Terapkan enkripsi token saat diam, tambahkan rotasi token     |

---

### 3.3 Eksekusi (AML.TA0005)

#### T-EXEC-001: Prompt injection langsung

| Atribut                  | Nilai                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0051.000 - LLM Prompt Injection: Direct                                               |
| **Deskripsi**            | Penyerang mengirim prompt yang dirancang untuk memanipulasi perilaku agen                  |
| **Vektor serangan**      | Pesan kanal yang berisi instruksi adversarial                                              |
| **Komponen terdampak**   | LLM agen, semua permukaan input                                                            |
| **Mitigasi saat ini**    | Deteksi pola, pembungkusan konten eksternal                                                |
| **Risiko residual**      | Kritis - Hanya deteksi, tidak ada pemblokiran; serangan canggih dapat melewati             |
| **Rekomendasi**          | Terapkan pertahanan multi-lapis, validasi output, konfirmasi pengguna untuk tindakan sensitif |

#### T-EXEC-002: Prompt injection tidak langsung

| Atribut                  | Nilai                                                       |
| ------------------------ | ----------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **Deskripsi**            | Penyerang menyisipkan instruksi berbahaya ke dalam konten yang diambil |
| **Vektor serangan**      | URL berbahaya, email yang diracuni, Webhook yang dikompromikan |
| **Komponen terdampak**   | `web_fetch`, ingestion email, sumber data eksternal         |
| **Mitigasi saat ini**    | Pembungkusan konten dengan tag XML dan pemberitahuan keamanan |
| **Risiko residual**      | Tinggi - LLM dapat mengabaikan instruksi pembungkus         |
| **Rekomendasi**          | Terapkan sanitasi konten, konteks eksekusi terpisah         |

#### T-EXEC-003: Injeksi argumen alat

| Atribut                  | Nilai                                                          |
| ------------------------ | -------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.000 - LLM Prompt Injection: Direct                   |
| **Deskripsi**            | Penyerang memanipulasi argumen alat melalui prompt injection   |
| **Vektor serangan**      | Prompt yang dirancang untuk memengaruhi nilai parameter alat   |
| **Komponen terdampak**   | Semua pemanggilan alat                                         |
| **Mitigasi saat ini**    | Persetujuan exec untuk perintah berbahaya                      |
| **Risiko residual**      | Tinggi - Bergantung pada penilaian pengguna                    |
| **Rekomendasi**          | Terapkan validasi argumen, pemanggilan alat terparametrisasi   |

#### T-EXEC-004: Bypass persetujuan exec

| Atribut                  | Nilai                                                        |
| ------------------------ | ------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0043 - Craft Adversarial Data                           |
| **Deskripsi**            | Penyerang membuat perintah yang melewati allowlist persetujuan |
| **Vektor serangan**      | Obfuskasi perintah, eksploitasi alias, manipulasi path       |
| **Komponen terdampak**   | `exec-approvals.ts`, allowlist perintah                      |
| **Mitigasi saat ini**    | Allowlist + mode ask                                         |
| **Risiko residual**      | Tinggi - Tidak ada sanitasi perintah                         |
| **Rekomendasi**          | Terapkan normalisasi perintah, perluas blocklist             |

---

### 3.4 Persistensi (AML.TA0006)

#### T-PERSIST-001: Instalasi skill berbahaya

| Atribut                  | Nilai                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.001 - Supply Chain Compromise: AI Software                       |
| **Deskripsi**            | Penyerang menerbitkan skill berbahaya ke ClawHub                           |
| **Vektor serangan**      | Membuat akun, menerbitkan skill dengan kode berbahaya tersembunyi          |
| **Komponen terdampak**   | ClawHub, pemuatan skill, eksekusi agen                                     |
| **Mitigasi saat ini**    | Verifikasi usia akun GitHub, flag moderasi berbasis pola                   |
| **Risiko residual**      | Kritis - Tidak ada sandboxing, peninjauan terbatas                         |
| **Rekomendasi**          | Integrasi VirusTotal (sedang berlangsung), sandboxing skill, peninjauan komunitas |

#### T-PERSIST-002: Peracunan pembaruan skill

| Atribut                  | Nilai                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.001 - Supply Chain Compromise: AI Software             |
| **Deskripsi**            | Penyerang mengompromikan skill populer dan mendorong pembaruan berbahaya |
| **Vektor serangan**      | Kompromi akun, rekayasa sosial terhadap pemilik skill            |
| **Komponen terdampak**   | Pembuatan versi ClawHub, alur auto-update                        |
| **Mitigasi saat ini**    | Fingerprinting versi                                             |
| **Risiko residual**      | Tinggi - Auto-update dapat menarik versi berbahaya               |
| **Rekomendasi**          | Terapkan penandatanganan pembaruan, kemampuan rollback, version pinning |

#### T-PERSIST-003: Perusakan konfigurasi agen

| Atribut                  | Nilai                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.002 - Supply Chain Compromise: Data                     |
| **Deskripsi**            | Penyerang memodifikasi konfigurasi agen untuk mempertahankan akses |
| **Vektor serangan**      | Modifikasi file konfigurasi, injeksi pengaturan                   |
| **Komponen terdampak**   | Konfigurasi agen, kebijakan alat                                  |
| **Mitigasi saat ini**    | Izin file                                                         |
| **Risiko residual**      | Sedang - Memerlukan akses lokal                                   |
| **Rekomendasi**          | Verifikasi integritas konfigurasi, logging audit untuk perubahan konfigurasi |

---

### 3.5 Pengelakan pertahanan (AML.TA0007)

#### T-EVADE-001: Bypass pola moderasi

| Atribut                  | Nilai                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0043 - Craft Adversarial Data                                       |
| **Deskripsi**            | Penyerang membuat konten skill untuk menghindari pola moderasi           |
| **Vektor serangan**      | Homoglif Unicode, trik encoding, pemuatan dinamis                        |
| **Komponen terdampak**   | `moderation.ts` ClawHub                                                  |
| **Mitigasi saat ini**    | `FLAG_RULES` berbasis pola                                               |
| **Risiko residual**      | Tinggi - Regex sederhana mudah dilewati                                  |
| **Rekomendasi**          | Tambahkan analisis perilaku (VirusTotal Code Insight), deteksi berbasis AST |

#### T-EVADE-002: Escape pembungkus konten

| Atribut                  | Nilai                                                        |
| ------------------------ | ------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0043 - Craft Adversarial Data                           |
| **Deskripsi**            | Penyerang membuat konten yang lolos dari konteks pembungkus XML |
| **Vektor serangan**      | Manipulasi tag, kebingungan konteks, override instruksi      |
| **Komponen terdampak**   | Pembungkusan konten eksternal                                |
| **Mitigasi saat ini**    | Tag XML + pemberitahuan keamanan                             |
| **Risiko residual**      | Sedang - Escape baru ditemukan secara berkala                |
| **Rekomendasi**          | Banyak lapisan pembungkus, validasi di sisi output           |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Enumerasi alat

| Atribut                  | Nilai                                                 |
| ------------------------ | ----------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - AI Model Inference API Access             |
| **Deskripsi**            | Penyerang mengenumerasi alat yang tersedia melalui prompting |
| **Vektor serangan**      | Kueri bergaya "alat apa yang Anda miliki?"            |
| **Komponen terdampak**   | Registry alat agen                                    |
| **Mitigasi saat ini**    | Tidak ada yang spesifik                               |
| **Risiko residual**      | Rendah - Alat umumnya terdokumentasi                  |
| **Rekomendasi**          | Pertimbangkan kontrol visibilitas alat                |

#### T-DISC-002: Ekstraksi data sesi

| Atribut                  | Nilai                                                 |
| ------------------------ | ----------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - AI Model Inference API Access             |
| **Deskripsi**            | Penyerang mengekstrak data sensitif dari konteks sesi |
| **Vektor serangan**      | Kueri "apa yang kita bahas?" , probing konteks        |
| **Komponen terdampak**   | Transkrip sesi, jendela konteks                       |
| **Mitigasi saat ini**    | Isolasi sesi per pengirim                             |
| **Risiko residual**      | Sedang - Data dalam sesi dapat diakses                |
| **Rekomendasi**          | Terapkan redaksi data sensitif dalam konteks          |

---

### 3.7 Pengumpulan & eksfiltrasi (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Pencurian data melalui `web_fetch`

| Atribut                  | Nilai                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0009 - Collection                                                    |
| **Deskripsi**            | Penyerang mengekfiltrasi data dengan menginstruksikan agen mengirim ke URL eksternal |
| **Vektor serangan**      | Prompt injection yang menyebabkan agen POST data ke server penyerang      |
| **Komponen terdampak**   | Alat `web_fetch`                                                          |
| **Mitigasi saat ini**    | Pemblokiran SSRF untuk jaringan internal                                  |
| **Risiko residual**      | Tinggi - URL eksternal diizinkan                                          |
| **Rekomendasi**          | Terapkan allowlist URL, kesadaran klasifikasi data                        |

#### T-EXFIL-002: Pengiriman pesan tanpa izin

| Atribut                  | Nilai                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0009 - Collection                                             |
| **Deskripsi**            | Penyerang menyebabkan agen mengirim pesan yang berisi data sensitif |
| **Vektor serangan**      | Prompt injection yang menyebabkan agen mengirim pesan ke penyerang  |
| **Komponen terdampak**   | Alat message, integrasi kanal                                      |
| **Mitigasi saat ini**    | Gating pesan outbound                                              |
| **Risiko residual**      | Sedang - Gating dapat dilewati                                     |
| **Rekomendasi**          | Wajibkan konfirmasi eksplisit untuk penerima baru                  |

#### T-EXFIL-003: Pemanenan kredensial

| Atribut                  | Nilai                                                    |
| ------------------------ | -------------------------------------------------------- |
| **ID ATLAS**             | AML.T0009 - Collection                                   |
| **Deskripsi**            | Skill berbahaya memanen kredensial dari konteks agen     |
| **Vektor serangan**      | Kode skill membaca environment variable, file konfigurasi |
| **Komponen terdampak**   | Environment eksekusi skill                               |
| **Mitigasi saat ini**    | Tidak ada yang spesifik untuk skill                      |
| **Risiko residual**      | Kritis - Skill berjalan dengan hak akses agen            |
| **Rekomendasi**          | Sandboxing skill, isolasi kredensial                     |

---

### 3.8 Dampak (AML.TA0011)

#### T-IMPACT-001: Eksekusi perintah tanpa izin

| Atribut                  | Nilai                                                 |
| ------------------------ | ----------------------------------------------------- |
| **ID ATLAS**             | AML.T0031 - Erode AI Model Integrity                  |
| **Deskripsi**            | Penyerang mengeksekusi perintah arbitrer di sistem pengguna |
| **Vektor serangan**      | Prompt injection digabung dengan bypass persetujuan exec |
| **Komponen terdampak**   | Alat Bash, eksekusi perintah                          |
| **Mitigasi saat ini**    | Persetujuan exec, opsi sandbox Docker                 |
| **Risiko residual**      | Kritis - Eksekusi host tanpa sandbox                  |
| **Rekomendasi**          | Jadikan sandbox sebagai default, tingkatkan UX persetujuan |

#### T-IMPACT-002: Penghabisan sumber daya (DoS)

| Atribut                  | Nilai                                                |
| ------------------------ | ---------------------------------------------------- |
| **ID ATLAS**             | AML.T0031 - Erode AI Model Integrity                 |
| **Deskripsi**            | Penyerang menghabiskan kredit API atau sumber daya komputasi |
| **Vektor serangan**      | Flooding pesan otomatis, pemanggilan alat mahal      |
| **Komponen terdampak**   | Gateway, sesi agen, provider API                     |
| **Mitigasi saat ini**    | Tidak ada                                            |
| **Risiko residual**      | Tinggi - Tidak ada rate limiting                     |
| **Rekomendasi**          | Terapkan rate limit per pengirim, anggaran biaya     |

#### T-IMPACT-003: Kerusakan reputasi

| Atribut                  | Nilai                                                     |
| ------------------------ | --------------------------------------------------------- |
| **ID ATLAS**             | AML.T0031 - Erode AI Model Integrity                      |
| **Deskripsi**            | Penyerang menyebabkan agen mengirim konten berbahaya/ofensif |
| **Vektor serangan**      | Prompt injection yang menyebabkan respons tidak pantas    |
| **Komponen terdampak**   | Pembuatan output, pesan kanal                             |
| **Mitigasi saat ini**    | Kebijakan konten provider LLM                             |
| **Risiko residual**      | Sedang - Filter provider tidak sempurna                   |
| **Rekomendasi**          | Lapisan pemfilteran output, kontrol pengguna              |

---

## 4. Analisis rantai pasok ClawHub

### 4.1 Kontrol keamanan saat ini

| Kontrol               | Implementasi                  | Efektivitas                                            |
| --------------------- | ----------------------------- | ------------------------------------------------------ |
| Usia Akun GitHub      | `requireGitHubAccountAge()`   | Sedang - Menaikkan ambang bagi penyerang baru          |
| Sanitasi Path         | `sanitizePath()`              | Tinggi - Mencegah path traversal                       |
| Validasi Jenis File   | `isTextFile()`                | Sedang - Hanya file teks, tetapi tetap bisa berbahaya  |
| Batas Ukuran          | Bundle total 50MB             | Tinggi - Mencegah penghabisan sumber daya              |
| SKILL.md Wajib        | Readme wajib                  | Nilai keamanan rendah - Hanya informatif               |
| Moderasi Pola         | `FLAG_RULES` di moderation.ts | Rendah - Mudah dilewati                                |
| Status Moderasi       | field `moderationStatus`      | Sedang - Tinjauan manual dimungkinkan                  |

### 4.2 Pola flag moderasi

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

- Hanya memeriksa slug, displayName, summary, frontmatter, metadata, path file
- Tidak menganalisis konten kode skill yang sebenarnya
- Regex sederhana mudah dilewati dengan obfuskasi
- Tidak ada analisis perilaku

### 4.3 Peningkatan yang direncanakan

| Peningkatan            | Status                                 | Dampak                                                               |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Integrasi VirusTotal   | Sedang berlangsung                     | Tinggi - Analisis perilaku Code Insight                              |
| Pelaporan komunitas    | Sebagian (`skillReports` table exists) | Sedang                                                               |
| Logging audit          | Sebagian (`auditLogs` table exists)    | Sedang                                                               |
| Sistem badge           | Sudah diimplementasikan                | Sedang - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriks risiko

### 5.1 Kemungkinan vs dampak

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

### 5.2 Rantai serangan jalur kritis

**Rantai Serangan 1: Pencurian data berbasis skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Menerbitkan skill berbahaya) → (Menghindari moderasi) → (Memanen kredensial)
```

**Rantai Serangan 2: Prompt injection ke RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Menyuntikkan prompt) → (Melewati persetujuan exec) → (Mengeksekusi perintah)
```

**Rantai Serangan 3: Injeksi tidak langsung melalui konten yang diambil**

```
T-EXEC-002 → T-EXFIL-001 → Eksfiltrasi eksternal
(Meracuni konten URL) → (Agen mengambil & mengikuti instruksi) → (Data dikirim ke penyerang)
```

---

## 6. Ringkasan rekomendasi

### 6.1 Segera (P0)

| ID    | Rekomendasi                                  | Menangani                  |
| ----- | -------------------------------------------- | -------------------------- |
| R-001 | Selesaikan integrasi VirusTotal              | T-PERSIST-001, T-EVADE-001 |
| R-002 | Terapkan sandboxing skill                    | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Tambahkan validasi output untuk tindakan sensitif | T-EXEC-001, T-EXEC-002 |

### 6.2 Jangka pendek (P1)

| ID    | Rekomendasi                               | Menangani     |
| ----- | ----------------------------------------- | ------------- |
| R-004 | Terapkan rate limiting                    | T-IMPACT-002  |
| R-005 | Tambahkan enkripsi token saat diam        | T-ACCESS-003  |
| R-006 | Tingkatkan UX dan validasi persetujuan exec | T-EXEC-004  |
| R-007 | Terapkan allowlist URL untuk `web_fetch`  | T-EXFIL-001   |

### 6.3 Jangka menengah (P2)

| ID    | Rekomendasi                                          | Menangani     |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Tambahkan verifikasi kanal kriptografis bila memungkinkan | T-ACCESS-002  |
| R-009 | Terapkan verifikasi integritas konfigurasi           | T-PERSIST-003 |
| R-010 | Tambahkan penandatanganan pembaruan dan version pinning | T-PERSIST-002 |

---

## 7. Lampiran

### 7.1 Pemetaan teknik ATLAS

| ID ATLAS      | Nama Teknik                    | Ancaman OpenClaw                                                  |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                      |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                     |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                          |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002  |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                        |

### 7.2 File keamanan utama

| Path                                | Tujuan                      | Tingkat Risiko |
| ----------------------------------- | --------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Logika persetujuan perintah | **Kritis**     |
| `src/gateway/auth.ts`               | Autentikasi gateway         | **Kritis**     |
| `src/infra/net/ssrf.ts`             | Perlindungan SSRF           | **Kritis**     |
| `src/security/external-content.ts`  | Mitigasi prompt injection   | **Kritis**     |
| `src/agents/sandbox/tool-policy.ts` | Penegakan kebijakan alat    | **Kritis**     |
| `src/routing/resolve-route.ts`      | Isolasi sesi                | **Sedang**     |

### 7.3 Glosarium

| Istilah              | Definisi                                                   |
| -------------------- | ---------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems milik MITRE    |
| **ClawHub**          | Marketplace skill milik OpenClaw                           |
| **Gateway**          | Lapisan perutean pesan dan autentikasi milik OpenClaw      |
| **MCP**              | Model Context Protocol - antarmuka provider alat           |
| **Prompt Injection** | Serangan saat instruksi berbahaya disisipkan ke input      |
| **Skill**            | Ekstensi yang dapat diunduh untuk agen OpenClaw            |
| **SSRF**             | Server-Side Request Forgery                                |

---

_Model ancaman ini adalah dokumen hidup. Laporkan masalah keamanan ke security@openclaw.ai_

## Terkait

- [Verifikasi formal](/id/security/formal-verification)
- [Berkontribusi pada model ancaman](/id/security/CONTRIBUTING-THREAT-MODEL)
