---
read_when:
    - Anda perlu menemukan sesuatu yang dibahas dalam sesi sebelumnya
    - Anda ingin memahami privasi atau pengindeksan pencarian sesi
summary: Cari transkrip sesi sebelumnya dan buka kembali konteks yang cocok
title: Pencarian sesi
x-i18n:
    generated_at: "2026-07-16T18:00:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Pencarian sesi

`sessions_search` mencari teks pengguna dan asisten dalam sesi Anda sebelumnya. Setiap hasil
menyertakan `sessionKey`, stempel waktu, peran, dan kutipan singkat yang cocok. Teruskan
`sessionKey` yang dikembalikan ke `sessions_history` saat Anda memerlukan percakapan di sekitarnya.

## Visibilitas dan keluaran

Pencarian menggunakan aturan visibilitas sesi yang sama dengan `sessions_history`. Hasil di luar
pohon sesi yang dapat dilihat pemanggil dihapus sebelum batas hasil diterapkan. Agen dalam sandbox tetap
dibatasi pada sesi yang mereka buat jika visibilitas sesi yang dibuat diaktifkan.

Kutipan disunting sebelum dikembalikan ke model. Hasil juga dibatasi berdasarkan jumlah, panjang
kutipan, dan ukuran total respons.

## Siklus hidup indeks

OpenClaw menyimpan indeks teks lengkap di samping baris transkrip dalam basis data SQLite setiap agen.
Pesan pengguna dan asisten baru diindeks dalam transaksi yang sama dengan transaksi yang menyimpannya,
sehingga indeks tidak pernah tertinggal dari percakapan langsung; hasil alat, blok penalaran, dan gambar
dikecualikan. Hanya cabang aktif transkrip yang dapat dicari.

Transkrip yang dibuat sebelum indeks tersedia (misalnya, sesi yang diimpor oleh `openclaw doctor`) dan
sesi yang cabang aktifnya dikembalikan ke keadaan sebelumnya diindeks ulang melalui rekonsiliasi latar
belakang yang dimulai pada pencarian berikutnya. Karena itu, respons dengan `indexing: true` dapat tidak
lengkap; coba lagi setelah pengindeksan selesai. Menghapus sesi akan menghapus entri indeksnya dalam
transaksi yang sama.

Saat ini, pencarian menggunakan tokenizer kata Unicode SQLite dengan penghapusan diakritik. Tokenisasi
trigram untuk pencocokan substring CJK merupakan penyempurnaan mendatang.

## Pencarian sesi vs. pencarian memori

Gunakan `sessions_search` untuk kata atau frasa persis dari transkrip sesi mentah. Gunakan
[`memory_search`](/id/concepts/memory-search) untuk file memori persisten dan pengingatan semantik. Korpus
memori sesi eksperimental merupakan pelengkap semantik bagi pencarian transkrip persis ini.
