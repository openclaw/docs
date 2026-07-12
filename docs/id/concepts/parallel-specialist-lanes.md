---
read_when:
    - Anda merutekan obrolan grup ke agen khusus
    - Anda menginginkan pekerjaan paralel tanpa satu tugas panjang memblokir setiap obrolan
    - Anda sedang merancang penyiapan operasi multiagen
sidebarTitle: Specialist lanes
status: active
summary: Jalankan agen spesialis secara paralel tanpa membebani kapasitas model dan alat bersama
title: Jalur spesialis paralel
x-i18n:
    generated_at: "2026-07-12T14:09:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Jalur spesialis paralel memungkinkan satu Gateway merutekan percakapan atau ruang yang berbeda ke agen yang berbeda sambil menjaga pengalaman pengguna tetap cepat. Perlakukan paralelisme sebagai masalah desain sumber daya terbatas, bukan sekadar "lebih banyak agen".

## Prinsip dasar

Jalur spesialis hanya meningkatkan throughput jika mengurangi perebutan pada hambatan yang sebenarnya:

- **Kunci sesi**: hanya satu proses yang boleh mengubah sesi tertentu pada satu waktu.
- **Kapasitas model global**: semua proses percakapan yang terlihat tetap berbagi batas penyedia.
- **Kapasitas alat**: pekerjaan shell, peramban, jaringan, dan repositori bisa lebih lambat daripada giliran model itu sendiri.
- **Anggaran konteks**: transkrip panjang membuat setiap giliran berikutnya lebih lambat dan kurang terfokus.
- **Ambiguitas kepemilikan**: agen duplikat yang mengerjakan tugas yang sama membuang kapasitas.

OpenClaw sudah menserialkan proses per sesi dan membatasi paralelisme global melalui [antrean perintah](/id/concepts/queue). Jalur spesialis menambahkan kebijakan di atasnya: agen mana yang memiliki pekerjaan tertentu, apa yang tetap berada dalam percakapan, dan apa yang menjadi pekerjaan latar belakang.

## Peluncuran yang direkomendasikan

### Fase 1: kontrak jalur + pekerjaan berat di latar belakang

Berikan setiap jalur kontrak tertulis di ruang kerja dan prompt sistemnya:

- **Tujuan**: pekerjaan yang menjadi tanggung jawab jalur ini.
- **Bukan tujuan**: pekerjaan yang seharusnya dialihkan, bukan dicoba sendiri.
- **Anggaran percakapan**: jawaban cepat tetap dalam percakapan; tugas panjang ditanggapi secara singkat, lalu dijalankan dalam subagen atau tugas latar belakang.
- **Aturan pengalihan**: ketika jalur lain memiliki pekerjaan tersebut, sebutkan ke mana pekerjaan itu harus diarahkan dan berikan ringkasan pengalihan yang ringkas.
- **Aturan risiko alat**: pilih cakupan alat terkecil yang dapat menyelesaikan pekerjaan.

Ini adalah fase termurah dan mengatasi sebagian besar penyumbatan: satu pekerjaan pengodean tidak lagi membuat jalur riset menjadi sangat lambat, dan konteks setiap percakapan tetap bersih.

### Fase 2: kontrol prioritas dan konkurensi

Sesuaikan kapasitas antrean dan model berdasarkan nilai bisnis setiap jalur:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
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

Gunakan percakapan langsung/pribadi dan agen operasi produksi untuk pekerjaan berprioritas tinggi. Alihkan riset, penyusunan draf, dan pengodean batch ke tugas latar belakang saat sistem sibuk.

### Fase 3: koordinator / pengatur lalu lintas

Tambahkan pola koordinator kecil setelah beberapa jalur aktif:

- Lacak tugas dan pemilik jalur yang aktif.
- Deteksi permintaan duplikat di berbagai grup.
- Rutekan ringkasan pengalihan antarlajur.
- Tampilkan hanya penghambat, hasil yang telah selesai, dan keputusan yang harus dibuat manusia.

Jangan mulai dari sini. Koordinator tanpa kontrak jalur hanya mengoordinasikan kekacauan.

## Templat kontrak jalur minimal

```md
# Kontrak jalur

## Tanggung jawab

- <pekerjaan yang menjadi tanggung jawab jalur ini>

## Bukan tanggung jawab

- <pekerjaan yang harus dialihkan>

## Anggaran percakapan

- Jawab pertanyaan singkat secara langsung.
- Untuk pekerjaan bertahap, lambat, atau intensif alat: tanggapi secara singkat, jalankan
  pekerjaan melalui subagen/latar belakang, lalu berikan hasilnya setelah selesai.

## Pengalihan

Jika jalur lain memiliki permintaan tersebut, balas dengan:

- jalur tujuan
- sasaran
- konteks yang relevan
- tindakan berikutnya yang tepat

## Sikap penggunaan alat

Gunakan cakupan alat terkecil yang dapat menyelesaikan tugas. Hindari pekerjaan shell atau
jaringan yang luas kecuali jalur ini secara eksplisit bertanggung jawab atasnya.
```

## Terkait

- [Perutean multiagen](/id/concepts/multi-agent)
- [Antrean perintah](/id/concepts/queue)
- [Subagen](/id/tools/subagents)
