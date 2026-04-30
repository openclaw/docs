---
read_when:
    - Anda ingin menyumbangkan temuan keamanan atau skenario ancaman
    - Meninjau atau memperbarui model ancaman
summary: Cara berkontribusi pada model ancaman OpenClaw
title: Berkontribusi pada model ancaman
x-i18n:
    generated_at: "2026-04-30T10:11:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Berkontribusi pada Model Ancaman OpenClaw

Terima kasih telah membantu membuat OpenClaw lebih aman. Model ancaman ini adalah dokumen hidup dan kami menerima kontribusi dari siapa pun - Anda tidak perlu menjadi pakar keamanan.

## Cara Berkontribusi

### Tambahkan Ancaman

Menemukan vektor serangan atau risiko yang belum kami cakup? Buka isu di [openclaw/trust](https://github.com/openclaw/trust/issues) dan jelaskan dengan kata-kata Anda sendiri. Anda tidak perlu mengetahui kerangka kerja apa pun atau mengisi setiap bidang - cukup jelaskan skenarionya.

**Bermanfaat untuk disertakan (tetapi tidak wajib):**

- Skenario serangan dan bagaimana skenario itu dapat dieksploitasi
- Bagian OpenClaw mana yang terdampak (CLI, Gateway, kanal, ClawHub, server MCP, dll.)
- Seberapa parah menurut Anda risikonya (rendah / sedang / tinggi / kritis)
- Tautan apa pun ke penelitian terkait, CVE, atau contoh dunia nyata

Kami akan menangani pemetaan ATLAS, ID ancaman, dan penilaian risiko selama peninjauan. Jika Anda ingin menyertakan detail tersebut, bagus - tetapi itu tidak diharapkan.

> **Ini untuk menambahkan ke model ancaman, bukan melaporkan kerentanan aktif.** Jika Anda menemukan kerentanan yang dapat dieksploitasi, lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pengungkapan yang bertanggung jawab.

### Sarankan Mitigasi

Punya ide tentang cara menangani ancaman yang sudah ada? Buka isu atau PR yang merujuk ke ancaman tersebut. Mitigasi yang berguna bersifat spesifik dan dapat ditindaklanjuti - misalnya, "pembatasan laju per-pengirim sebesar 10 pesan/menit di Gateway" lebih baik daripada "terapkan pembatasan laju."

### Usulkan Rantai Serangan

Rantai serangan menunjukkan bagaimana beberapa ancaman bergabung menjadi skenario serangan yang realistis. Jika Anda melihat kombinasi yang berbahaya, jelaskan langkah-langkahnya dan bagaimana penyerang akan merangkainya. Narasi singkat tentang bagaimana serangan berlangsung dalam praktik lebih bernilai daripada templat formal.

### Perbaiki atau Tingkatkan Konten yang Ada

Salah ketik, klarifikasi, informasi usang, contoh yang lebih baik - PR dipersilakan, tidak perlu isu.

## Yang kami gunakan

### MITRE ATLAS

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), kerangka kerja yang dirancang khusus untuk ancaman AI/ML seperti injeksi prompt, penyalahgunaan alat, dan eksploitasi agen. Anda tidak perlu mengetahui ATLAS untuk berkontribusi - kami memetakan kiriman ke kerangka kerja tersebut selama peninjauan.

### ID ancaman

Setiap ancaman mendapatkan ID seperti `T-EXEC-003`. Kategorinya adalah:

| Kode    | Kategori                                      |
| ------- | --------------------------------------------- |
| RECON   | Pengintaian - pengumpulan informasi           |
| ACCESS  | Akses awal - mendapatkan akses masuk          |
| EXEC    | Eksekusi - menjalankan tindakan berbahaya     |
| PERSIST | Persistensi - mempertahankan akses            |
| EVADE   | Penghindaran pertahanan - menghindari deteksi |
| DISC    | Penemuan - mempelajari lingkungan             |
| EXFIL   | Eksfiltrasi - mencuri data                    |
| IMPACT  | Dampak - kerusakan atau gangguan              |

ID ditetapkan oleh pemelihara selama peninjauan. Anda tidak perlu memilihnya.

### Tingkat risiko

| Tingkat      | Arti                                                               |
| ------------ | ------------------------------------------------------------------ |
| **Kritis**   | Kompromi sistem penuh, atau kemungkinan tinggi + dampak kritis     |
| **Tinggi**   | Kerusakan signifikan mungkin terjadi, atau kemungkinan sedang + dampak kritis |
| **Sedang**   | Risiko sedang, atau kemungkinan rendah + dampak tinggi             |
| **Rendah**   | Tidak mungkin terjadi dan dampak terbatas                          |

Jika Anda tidak yakin tentang tingkat risikonya, cukup jelaskan dampaknya dan kami akan menilainya.

## Proses peninjauan

1. **Triase** - Kami meninjau kiriman baru dalam 48 jam
2. **Penilaian** - Kami memverifikasi kelayakan, menetapkan pemetaan ATLAS dan ID ancaman, memvalidasi tingkat risiko
3. **Dokumentasi** - Kami memastikan semuanya diformat dan lengkap
4. **Penggabungan** - Ditambahkan ke model ancaman dan visualisasi

## Sumber daya

- [Situs Web ATLAS](https://atlas.mitre.org/)
- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Studi Kasus ATLAS](https://atlas.mitre.org/studies/)
- [Model Ancaman OpenClaw](/id/security/THREAT-MODEL-ATLAS)

## Kontak

- **Kerentanan keamanan:** Lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pelaporan
- **Pertanyaan model ancaman:** Buka isu di [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Obrolan umum:** Kanal Discord #security

## Pengakuan

Kontributor pada model ancaman diakui dalam ucapan terima kasih model ancaman, catatan rilis, dan aula kehormatan keamanan OpenClaw untuk kontribusi signifikan.

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Verifikasi formal](/id/security/formal-verification)
