---
read_when:
    - Anda ingin berkontribusi temuan keamanan atau skenario ancaman
    - Meninjau atau memperbarui model ancaman
summary: Cara berkontribusi pada model ancaman OpenClaw
title: Berkontribusi pada Model Ancaman
x-i18n:
    generated_at: "2026-04-05T14:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Berkontribusi pada Model Ancaman OpenClaw

Terima kasih telah membantu membuat OpenClaw lebih aman. Model ancaman ini adalah dokumen yang terus berkembang dan kami menyambut kontribusi dari siapa pun - Anda tidak perlu menjadi pakar keamanan.

## Cara Berkontribusi

### Tambahkan Ancaman

Menemukan vektor serangan atau risiko yang belum kami bahas? Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues) dan jelaskan dengan kata-kata Anda sendiri. Anda tidak perlu memahami framework apa pun atau mengisi setiap bidang - cukup jelaskan skenarionya.

**Hal yang berguna untuk disertakan (tetapi tidak wajib):**

- Skenario serangan dan bagaimana hal itu dapat dieksploitasi
- Bagian OpenClaw mana yang terpengaruh (CLI, gateway, channel, ClawHub, server MCP, dll.)
- Seberapa parah menurut Anda tingkatnya (low / medium / high / critical)
- Tautan apa pun ke riset terkait, CVE, atau contoh nyata

Kami akan menangani pemetaan ATLAS, ID ancaman, dan penilaian risiko selama peninjauan. Jika Anda ingin menyertakan detail tersebut, bagus - tetapi itu tidak diharapkan.

> **Ini untuk menambahkan ke model ancaman, bukan melaporkan kerentanan aktif.** Jika Anda menemukan kerentanan yang dapat dieksploitasi, lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pengungkapan yang bertanggung jawab.

### Sarankan Mitigasi

Punya ide tentang cara menangani ancaman yang sudah ada? Buka issue atau PR yang merujuk pada ancaman tersebut. Mitigasi yang berguna bersifat spesifik dan dapat ditindaklanjuti - misalnya, "rate limiting per pengirim sebesar 10 pesan/menit di gateway" lebih baik daripada "terapkan rate limiting."

### Ajukan Rantai Serangan

Rantai serangan menunjukkan bagaimana beberapa ancaman bergabung menjadi skenario serangan yang realistis. Jika Anda melihat kombinasi berbahaya, jelaskan langkah-langkahnya dan bagaimana penyerang akan merangkainya bersama. Narasi singkat tentang bagaimana serangan berlangsung dalam praktik lebih bernilai daripada template formal.

### Perbaiki atau Tingkatkan Konten yang Ada

Typo, klarifikasi, informasi usang, contoh yang lebih baik - PR diterima, tidak perlu issue.

## Yang Kami Gunakan

### MITRE ATLAS

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), framework yang dirancang khusus untuk ancaman AI/ML seperti prompt injection, penyalahgunaan tool, dan eksploitasi agen. Anda tidak perlu memahami ATLAS untuk berkontribusi - kami memetakan kiriman ke framework tersebut selama peninjauan.

### ID Ancaman

Setiap ancaman mendapatkan ID seperti `T-EXEC-003`. Kategorinya adalah:

| Code    | Kategori                                   |
| ------- | ------------------------------------------ |
| RECON   | Rekonesans - pengumpulan informasi         |
| ACCESS  | Akses awal - mendapatkan akses masuk       |
| EXEC    | Eksekusi - menjalankan tindakan berbahaya  |
| PERSIST | Persistensi - mempertahankan akses         |
| EVADE   | Pengelakan pertahanan - menghindari deteksi |
| DISC    | Discovery - mempelajari lingkungan         |
| EXFIL   | Exfiltration - mencuri data                |
| IMPACT  | Dampak - kerusakan atau gangguan           |

ID ditetapkan oleh maintainer selama peninjauan. Anda tidak perlu memilihnya.

### Tingkat Risiko

| Level        | Arti                                                            |
| ------------ | --------------------------------------------------------------- |
| **Critical** | Kompromi sistem penuh, atau kemungkinan tinggi + dampak kritis  |
| **High**     | Kerusakan signifikan kemungkinan terjadi, atau kemungkinan sedang + dampak kritis |
| **Medium**   | Risiko sedang, atau kemungkinan rendah + dampak tinggi          |
| **Low**      | Kemungkinan kecil dan dampak terbatas                           |

Jika Anda tidak yakin tentang tingkat risiko, cukup jelaskan dampaknya dan kami akan menilainya.

## Proses Peninjauan

1. **Triase** - Kami meninjau kiriman baru dalam 48 jam
2. **Penilaian** - Kami memverifikasi kelayakan, menetapkan pemetaan ATLAS dan ID ancaman, memvalidasi tingkat risiko
3. **Dokumentasi** - Kami memastikan semuanya diformat dengan benar dan lengkap
4. **Merge** - Ditambahkan ke model ancaman dan visualisasi

## Sumber Daya

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [Model Ancaman OpenClaw](/security/THREAT-MODEL-ATLAS)

## Kontak

- **Kerentanan keamanan:** Lihat [halaman Trust](https://trust.openclaw.ai) kami untuk instruksi pelaporan
- **Pertanyaan model ancaman:** Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Obrolan umum:** Channel #security di Discord

## Pengakuan

Kontributor pada model ancaman diakui dalam ucapan terima kasih model ancaman, catatan rilis, dan OpenClaw security hall of fame untuk kontribusi yang signifikan.
