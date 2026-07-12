---
read_when:
    - Anda ingin menyumbangkan temuan keamanan atau skenario ancaman
    - Meninjau atau memperbarui model ancaman
summary: Cara berkontribusi pada model ancaman OpenClaw
title: Berkontribusi pada model ancaman
x-i18n:
    generated_at: "2026-07-12T14:38:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[Model ancaman](/id/security/THREAT-MODEL-ATLAS) adalah dokumen yang terus berkembang. Kontribusi diterima dari siapa saja; Anda tidak perlu memiliki latar belakang keamanan atau MITRE ATLAS.

<Note>
Bagian ini ditujukan untuk menambahkan informasi ke model ancaman, bukan melaporkan kerentanan aktif. Jika Anda menemukan kerentanan yang dapat dieksploitasi, ikuti petunjuk pengungkapan yang bertanggung jawab di [halaman Trust](https://trust.openclaw.ai).
</Note>

## Cara berkontribusi

**Tambahkan ancaman.** Buka isu di [openclaw/trust](https://github.com/openclaw/trust/issues) yang menjelaskan skenario serangan dengan kata-kata Anda sendiri. Informasi berikut membantu, tetapi tidak diwajibkan:

- Skenario serangan dan cara mengeksploitasinya.
- Komponen yang terdampak (CLI, Gateway, kanal, ClawHub, server MCP, dan sebagainya).
- Perkiraan tingkat keparahan Anda (rendah / sedang / tinggi / kritis).
- Tautan ke penelitian terkait, CVE, atau contoh di dunia nyata.

Pengelola menetapkan pemetaan ATLAS, ID ancaman, dan tingkat risiko selama peninjauan.

**Sarankan mitigasi.** Buka isu atau PR yang merujuk pada ancaman tersebut. Berikan saran yang spesifik dan dapat ditindaklanjuti: "pembatasan laju per pengirim sebesar 10 pesan/menit di Gateway" lebih bermanfaat daripada "terapkan pembatasan laju."

**Usulkan rantai serangan.** Rantai serangan menunjukkan bagaimana beberapa ancaman digabungkan menjadi skenario yang realistis. Jelaskan langkah-langkahnya dan cara penyerang merangkainya; narasi singkat lebih baik daripada templat formal.

**Perbaiki atau tingkatkan konten yang ada.** Kesalahan ketik, klarifikasi, informasi usang, atau contoh yang lebih baik: PR diterima tanpa perlu membuka isu.

## Referensi kerangka kerja

Ancaman dipetakan ke [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), sebuah kerangka kerja untuk ancaman khusus AI/ML seperti injeksi prompt, penyalahgunaan alat, dan eksploitasi agen. Anda tidak perlu memahami ATLAS untuk berkontribusi; pengelola akan memetakan kiriman selama peninjauan.

**ID ancaman.** Setiap ancaman mendapatkan ID seperti `T-EXEC-003`, yang ditetapkan oleh pengelola selama peninjauan.

| Kode    | Kategori                                      |
| ------- | --------------------------------------------- |
| RECON   | Pengintaian - pengumpulan informasi           |
| ACCESS  | Akses awal - memperoleh jalan masuk            |
| EXEC    | Eksekusi - menjalankan tindakan berbahaya      |
| PERSIST | Persistensi - mempertahankan akses             |
| EVADE   | Penghindaran pertahanan - menghindari deteksi  |
| DISC    | Penemuan - mempelajari lingkungan              |
| EXFIL   | Eksfiltrasi - mencuri data                     |
| IMPACT  | Dampak - kerusakan atau gangguan               |

**Tingkat risiko.** Jika Anda tidak yakin mengenai tingkatnya, cukup jelaskan dampaknya; pengelola akan menilainya.

| Tingkat     | Arti                                                                |
| ----------- | ------------------------------------------------------------------- |
| **Kritis**  | Pengambilalihan sistem secara penuh, atau kemungkinan tinggi + dampak kritis |
| **Tinggi**  | Kemungkinan terjadinya kerusakan signifikan, atau kemungkinan sedang + dampak kritis |
| **Sedang**  | Risiko sedang, atau kemungkinan rendah + dampak tinggi              |
| **Rendah**  | Kecil kemungkinannya dan dampaknya terbatas                          |

## Proses peninjauan

1. **Triase** - kiriman baru ditinjau dalam waktu 48 jam.
2. **Penilaian** - pengelola memverifikasi kelayakan, menetapkan pemetaan ATLAS dan ID ancaman, serta memvalidasi tingkat risiko.
3. **Dokumentasi** - pemeriksaan format dan kelengkapan.
4. **Penggabungan** - ditambahkan ke model ancaman dan visualisasi.

## Sumber daya

- [Situs web ATLAS](https://atlas.mitre.org/)
- [Teknik ATLAS](https://atlas.mitre.org/techniques/)
- [Studi kasus ATLAS](https://atlas.mitre.org/studies/)

## Kontak

- **Kerentanan keamanan:** [halaman Trust](https://trust.openclaw.ai) untuk petunjuk pelaporan, atau `security@openclaw.ai`.
- **Pertanyaan tentang model ancaman:** buka isu di [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Percakapan umum:** kanal Discord `#security`.

## Pengakuan

Kontributor model ancaman diberi pengakuan dalam bagian ucapan terima kasih model ancaman, catatan rilis, dan daftar kehormatan keamanan OpenClaw untuk kontribusi yang signifikan.

## Terkait

- [Model ancaman](/id/security/THREAT-MODEL-ATLAS)
- [Respons insiden](/id/security/incident-response)
- [Verifikasi formal](/id/security/formal-verification)
