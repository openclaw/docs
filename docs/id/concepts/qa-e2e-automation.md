---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dashboard Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario seed, dan laporan protokol
title: Otomasi E2E QA
x-i18n:
    generated_at: "2026-04-08T02:14:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4aa5acc8e77303f4045d4f04372494cae21b89d2fdaba856dbb4855ced9d27
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomasi E2E QA

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan menyerupai channel dibandingkan yang dapat dicakup oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas awal dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan menampilkan
halaman QA Lab tempat operator atau loop otomasi dapat memberikan misi QA
kepada agen, mengamati perilaku channel nyata, serta mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser melakukan muat ulang otomatis ketika hash aset QA Lab berubah.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios.md`

Aset ini sengaja disimpan di git agar rencana QA terlihat baik oleh manusia maupun
agen. Daftar dasarnya harus tetap cukup luas untuk mencakup:

- obrolan DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan memori
- peralihan model
- handoff subagen
- membaca repo dan membaca dokumentasi
- satu tugas build kecil seperti Lobster Invaders

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

## Dokumentasi terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
