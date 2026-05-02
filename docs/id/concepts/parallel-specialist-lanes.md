---
read_when:
    - Anda merutekan obrolan grup ke agen khusus
    - Anda menginginkan pekerjaan paralel tanpa satu tugas panjang memblokir setiap percakapan
    - Anda sedang merancang konfigurasi operasi multi-agen
sidebarTitle: Specialist lanes
status: active
summary: Jalankan agen spesialis secara paralel tanpa membebani kapasitas model dan alat bersama
title: Jalur spesialis paralel
x-i18n:
    generated_at: "2026-05-02T20:43:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Jalur spesialis paralel memungkinkan satu Gateway merutekan chat atau ruang berbeda ke
agen berbeda, sambil menjaga pengalaman pengguna tetap cepat. Kuncinya adalah memperlakukan
paralelisme sebagai masalah desain sumber daya langka, bukan sekadar sebagai "lebih banyak agen".

## Prinsip dasar

Jalur spesialis hanya meningkatkan throughput ketika jalur tersebut mengurangi perebutan pada
hambatan nyata:

- **Kunci sesi**: hanya satu run yang boleh mengubah sesi tertentu pada satu waktu.
- **Kapasitas model global**: semua run chat yang terlihat tetap berbagi batas penyedia.
- **Kapasitas alat**: pekerjaan shell, browser, jaringan, dan repositori dapat lebih lambat
  daripada giliran model itu sendiri.
- **Anggaran konteks**: transkrip panjang membuat setiap giliran berikutnya lebih lambat dan kurang
  fokus.
- **Ambiguitas kepemilikan**: agen duplikat yang melakukan pekerjaan yang sama membuang kapasitas.

OpenClaw sudah menserialkan run per sesi dan membatasi paralelisme global melalui
[antrean perintah](/id/concepts/queue). Jalur spesialis menambahkan kebijakan di atasnya:
agen mana yang memiliki pekerjaan mana, apa yang tetap berada di chat, dan apa yang menjadi pekerjaan
latar belakang.

## Peluncuran yang direkomendasikan

### Fase 1: kontrak jalur + pekerjaan berat latar belakang

Berikan setiap jalur kontrak tertulis di workspace dan prompt sistemnya:

- **Tujuan**: pekerjaan yang dimiliki jalur ini.
- **Bukan tujuan**: pekerjaan yang harus dialihkan alih-alih dicoba sendiri.
- **Anggaran chat**: jawaban cepat tetap di chat; tugas panjang harus diakui
  secara singkat, lalu dijalankan dalam sub-agen atau tugas latar belakang.
- **Aturan pengalihan**: ketika jalur lain memiliki pekerjaan tersebut, sebutkan ke mana pekerjaan harus diarahkan dan
  berikan ringkasan pengalihan yang ringkas.
- **Aturan risiko alat**: pilih permukaan alat terkecil yang dapat menyelesaikan pekerjaan.

Ini adalah fase termurah dan memperbaiki sebagian besar kemacetan: satu pekerjaan coding tidak lagi
membuat jalur riset menjadi lambat, dan setiap chat menjaga konteksnya sendiri tetap bersih.

### Fase 2: kontrol prioritas dan konkurensi

Sesuaikan kapasitas antrean dan model berdasarkan nilai bisnis setiap jalur:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Gunakan chat langsung/pribadi dan agen operasi produksi untuk pekerjaan berprioritas tinggi. Biarkan
riset, penyusunan draf, dan coding batch berpindah ke tugas latar belakang saat sistem sedang
sibuk.

### Fase 3: koordinator / pengendali lalu lintas

Tambahkan pola koordinator kecil setelah beberapa jalur aktif:

- Lacak tugas dan pemilik jalur aktif.
- Deteksi permintaan duplikat di berbagai grup.
- Rutekan ringkasan pengalihan antarjalur.
- Tampilkan hanya pemblokir, hasil yang selesai, dan keputusan yang harus dibuat manusia.

Jangan mulai dari sini. Koordinator tanpa kontrak jalur hanya mengoordinasikan kekacauan.

## Templat kontrak jalur minimal

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Terkait

- [Perutean multi-agen](/id/concepts/multi-agent)
- [Antrean perintah](/id/concepts/queue)
- [Sub-agen](/id/tools/subagents)
