---
read_when:
    - Anda ingin berkontribusi temuan keamanan atau skenario ancaman
    - Meninjau atau memperbarui model ancaman
summary: Cara berkontribusi pada model ancaman OpenClaw
title: Berkontribusi pada model ancaman
x-i18n:
    generated_at: "2026-04-24T09:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Berkontribusi pada Model Ancaman OpenClaw

Terima kasih telah membantu membuat OpenClaw lebih aman. Model ancaman ini adalah dokumen hidup dan kami menyambut kontribusi dari siapa pun - Anda tidak perlu menjadi pakar keamanan.

## Cara Berkontribusi

### Tambahkan Ancaman

Melihat vektor serangan atau risiko yang belum kami bahas? Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues) dan jelaskan dengan kata-kata Anda sendiri. Anda tidak perlu mengetahui framework apa pun atau mengisi setiap field - cukup jelaskan skenarionya.

**Berguna untuk disertakan (tetapi tidak wajib):**

- Skenario serangan dan bagaimana serangan itu dapat dieksploitasi
- Bagian OpenClaw mana yang terdampak (CLI, gateway, channels, ClawHub, server MCP, dll.)
- Seberapa parah menurut Anda (low / medium / high / critical)
- Tautan ke riset terkait, CVE, atau contoh dunia nyata

Kami akan menangani pemetaan ATLAS, ID ancaman, dan penilaian risiko selama peninjauan. Jika Anda ingin menyertakan detail tersebut, bagus - tetapi itu tidak diharapkan.

> **Ini untuk menambahkan ke model ancaman, bukan melaporkan kerentanan aktif.** Jika Anda menemukan kerentanan yang dapat dieksploitasi, lihat [Trust page](https://trust.openclaw.ai) kami untuk instruksi responsible disclosure.

### Sarankan Mitigasi

Punya ide tentang cara mengatasi ancaman yang ada? Buka issue atau PR yang merujuk ke ancaman tersebut. Mitigasi yang berguna bersifat spesifik dan dapat ditindaklanjuti - misalnya, "rate limiting per-pengirim sebesar 10 pesan/menit di gateway" lebih baik daripada "implement rate limiting."

### Usulkan Rantai Serangan

Rantai serangan menunjukkan bagaimana beberapa ancaman digabungkan menjadi skenario serangan yang realistis. Jika Anda melihat kombinasi berbahaya, jelaskan langkah-langkahnya dan bagaimana penyerang akan merangkainya. Narasi singkat tentang bagaimana serangan berlangsung dalam praktik lebih bernilai daripada template formal.

### Perbaiki atau Tingkatkan Konten yang Ada

Typo, klarifikasi, informasi usang, contoh yang lebih baik - PR dipersilakan, tanpa perlu issue.

## Yang Kami Gunakan

### MITRE ATLAS

Model ancaman ini dibangun di atas [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), sebuah framework yang dirancang khusus untuk ancaman AI/ML seperti prompt injection, penyalahgunaan tool, dan eksploitasi agen. Anda tidak perlu mengetahui ATLAS untuk berkontribusi - kami memetakan kiriman ke framework ini selama peninjauan.

### ID Ancaman

Setiap ancaman mendapat ID seperti `T-EXEC-003`. Kategorinya adalah:

| Kode    | Kategori                                   |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - pengumpulan informasi     |
| ACCESS  | Initial access - mendapatkan akses masuk   |
| EXEC    | Execution - menjalankan tindakan berbahaya |
| PERSIST | Persistence - mempertahankan akses         |
| EVADE   | Defense evasion - menghindari deteksi      |
| DISC    | Discovery - mempelajari lingkungan         |
| EXFIL   | Exfiltration - mencuri data                |
| IMPACT  | Impact - kerusakan atau gangguan           |

ID ditetapkan oleh maintainer selama peninjauan. Anda tidak perlu memilihnya.

### Tingkat Risiko

| Tingkat      | Arti                                                            |
| ------------ | --------------------------------------------------------------- |
| **Critical** | Kompromi sistem penuh, atau kemungkinan tinggi + dampak kritis  |
| **High**     | Kerusakan signifikan kemungkinan besar terjadi, atau kemungkinan sedang + dampak kritis |
| **Medium**   | Risiko sedang, atau kemungkinan rendah + dampak tinggi          |
| **Low**      | Tidak mungkin dan dampak terbatas                               |

Jika Anda tidak yakin tentang tingkat risikonya, cukup jelaskan dampaknya dan kami akan menilainya.

## Proses Peninjauan

1. **Triase** - Kami meninjau kiriman baru dalam 48 jam
2. **Penilaian** - Kami memverifikasi kelayakan, menetapkan pemetaan ATLAS dan ID ancaman, memvalidasi tingkat risiko
3. **Dokumentasi** - Kami memastikan semuanya diformat dengan benar dan lengkap
4. **Merge** - Ditambahkan ke model ancaman dan visualisasi

## Sumber Daya

- [Website ATLAS](https://atlas.mitre.org/)
- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Studi Kasus ATLAS](https://atlas.mitre.org/studies/)
- [Model Ancaman OpenClaw](/id/security/THREAT-MODEL-ATLAS)

## Kontak

- **Kerentanan keamanan:** Lihat [Trust page](https://trust.openclaw.ai) kami untuk instruksi pelaporan
- **Pertanyaan model ancaman:** Buka issue di [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Obrolan umum:** channel #security di Discord

## Pengakuan

Kontributor model ancaman diakui dalam acknowledgments model ancaman, catatan rilis, dan hall of fame keamanan OpenClaw untuk kontribusi yang signifikan.

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Verifikasi formal](/id/security/formal-verification)
