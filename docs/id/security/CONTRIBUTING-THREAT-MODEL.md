---
read_when:
    - Anda ingin berkontribusi dengan temuan keamanan atau skenario ancaman
    - Meninjau atau memperbarui model ancaman
summary: Cara berkontribusi pada model ancaman OpenClaw
title: Berkontribusi pada model ancaman
x-i18n:
    generated_at: "2026-05-06T17:59:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Terima kasih telah membantu membuat OpenClaw lebih aman. Model ancaman ini adalah dokumen yang terus berkembang dan kami menerima kontribusi dari siapa pun - Anda tidak perlu menjadi pakar keamanan.

## Cara berkontribusi

### Tambahkan ancaman

Melihat vektor serangan atau risiko yang belum kami bahas? Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues) dan jelaskan dengan kata-kata Anda sendiri. Anda tidak perlu mengetahui framework apa pun atau mengisi setiap kolom - cukup jelaskan skenarionya.

**Berguna untuk disertakan (tetapi tidak wajib):**

- Skenario serangan dan bagaimana itu dapat dieksploitasi
- Bagian OpenClaw mana yang terdampak (CLI, Gateway, saluran, ClawHub, server MCP, dll.)
- Seberapa parah menurut Anda risikonya (rendah / sedang / tinggi / kritis)
- Tautan apa pun ke riset terkait, CVE, atau contoh dunia nyata

Kami akan menangani pemetaan ATLAS, ID ancaman, dan penilaian risiko selama peninjauan. Jika Anda ingin menyertakan detail tersebut, bagus - tetapi itu tidak diharapkan.

> **Ini untuk menambahkan ke model ancaman, bukan melaporkan kerentanan aktif.** Jika Anda menemukan kerentanan yang dapat dieksploitasi, lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pengungkapan yang bertanggung jawab.

### Sarankan mitigasi

Punya ide tentang cara menangani ancaman yang sudah ada? Buka issue atau PR yang merujuk ancaman tersebut. Mitigasi yang berguna bersifat spesifik dan dapat ditindaklanjuti - misalnya, "pembatasan laju per pengirim sebesar 10 pesan/menit di Gateway" lebih baik daripada "implementasikan pembatasan laju."

### Usulkan rantai serangan

Rantai serangan menunjukkan bagaimana beberapa ancaman digabungkan menjadi skenario serangan yang realistis. Jika Anda melihat kombinasi yang berbahaya, jelaskan langkah-langkahnya dan bagaimana penyerang akan merangkainya. Narasi singkat tentang bagaimana serangan terjadi dalam praktik lebih bernilai daripada template formal.

### Perbaiki atau tingkatkan konten yang ada

Salah ketik, klarifikasi, informasi yang sudah usang, contoh yang lebih baik - PR diterima, tidak perlu issue.

## Yang kami gunakan

### Framework MITRE ATLAS

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), sebuah framework yang dirancang khusus untuk ancaman AI/ML seperti injeksi prompt, penyalahgunaan alat, dan eksploitasi agen. Anda tidak perlu mengetahui ATLAS untuk berkontribusi - kami memetakan kiriman ke framework selama peninjauan.

### ID ancaman

Setiap ancaman mendapat ID seperti `T-EXEC-003`. Kategorinya adalah:

| Kode    | Kategori                                   |
| ------- | ------------------------------------------ |
| RECON   | Rekonesans - pengumpulan informasi         |
| ACCESS  | Akses awal - mendapatkan akses masuk       |
| EXEC    | Eksekusi - menjalankan tindakan berbahaya  |
| PERSIST | Persistensi - mempertahankan akses         |
| EVADE   | Penghindaran pertahanan - menghindari deteksi |
| DISC    | Penemuan - mempelajari lingkungan          |
| EXFIL   | Eksfiltrasi - mencuri data                 |
| IMPACT  | Dampak - kerusakan atau gangguan           |

ID diberikan oleh maintainer selama peninjauan. Anda tidak perlu memilihnya.

### Tingkat risiko

| Tingkat      | Arti                                                              |
| ------------ | ----------------------------------------------------------------- |
| **Kritis**   | Kompromi sistem penuh, atau kemungkinan tinggi + dampak kritis    |
| **Tinggi**   | Kerusakan signifikan mungkin terjadi, atau kemungkinan sedang + dampak kritis |
| **Sedang**   | Risiko sedang, atau kemungkinan rendah + dampak tinggi            |
| **Rendah**   | Kecil kemungkinan terjadi dan dampaknya terbatas                  |

Jika Anda tidak yakin tentang tingkat risikonya, cukup jelaskan dampaknya dan kami akan menilainya.

## Proses peninjauan

1. **Triase** - Kami meninjau kiriman baru dalam 48 jam
2. **Penilaian** - Kami memverifikasi kelayakan, menetapkan pemetaan ATLAS dan ID ancaman, memvalidasi tingkat risiko
3. **Dokumentasi** - Kami memastikan semuanya diformat dan lengkap
4. **Penggabungan** - Ditambahkan ke model ancaman dan visualisasi

## Sumber daya

- [Situs web ATLAS](https://atlas.mitre.org/)
- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Studi kasus ATLAS](https://atlas.mitre.org/studies/)
- [Model Ancaman OpenClaw](/id/security/THREAT-MODEL-ATLAS)

## Kontak

- **Kerentanan keamanan:** Lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pelaporan
- **Pertanyaan model ancaman:** Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Obrolan umum:** Saluran Discord #security

## Pengakuan

Kontributor model ancaman diakui dalam ucapan terima kasih model ancaman, catatan rilis, dan hall of fame keamanan OpenClaw untuk kontribusi signifikan.

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Verifikasi formal](/id/security/formal-verification)
