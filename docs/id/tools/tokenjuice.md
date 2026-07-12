---
read_when:
    - Anda menginginkan hasil alat `exec` atau `bash` yang lebih ringkas di OpenClaw
    - Anda ingin menginstal atau mengaktifkan plugin Tokenjuice
    - Anda perlu memahami apa yang diubah oleh tokenjuice dan apa yang dibiarkannya mentah
summary: Ringkas hasil alat exec dan bash yang berisik dengan Plugin Tokenjuice opsional
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T14:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` adalah plugin eksternal opsional yang memadatkan hasil alat `exec` dan `bash`
yang berisik setelah perintah selesai dijalankan.

Plugin ini mengubah `tool_result` yang dikembalikan, bukan perintah itu sendiri. Tokenjuice
tidak menulis ulang masukan shell, menjalankan ulang perintah, atau mengubah kode keluar.

Saat ini, fungsi tersebut berlaku untuk proses tertanam OpenClaw dan alat dinamis OpenClaw dalam harness
app-server Codex. Tokenjuice terhubung ke middleware hasil alat OpenClaw dan
meringkas keluaran sebelum dikembalikan ke sesi harness aktif.

## Aktifkan plugin

Instal satu kali:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Kemudian aktifkan:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Setara dengan:

```bash
openclaw plugins enable tokenjuice
```

Jika Anda lebih suka mengedit konfigurasi secara langsung:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Perubahan yang dilakukan tokenjuice

- Memadatkan hasil `exec` dan `bash` yang berisik sebelum dimasukkan kembali ke sesi.
- Menjaga eksekusi perintah asli tetap tidak berubah.
- Menerapkan kebijakan inventaris aman: pembacaan konten file secara persis tetap mentah, perintah inventaris repositori mandiri dapat dipadatkan, dan rangkaian perintah campuran yang tidak aman tetap mentah.
- Tetap bersifat opsional: nonaktifkan plugin jika Anda menginginkan keluaran verbatim di semua tempat.

## Verifikasi bahwa plugin berfungsi

1. Aktifkan plugin.
2. Mulai sesi yang dapat memanggil `exec`.
3. Jalankan perintah yang menghasilkan banyak keluaran, seperti `git status`.
4. Pastikan hasil alat yang dikembalikan lebih ringkas dan lebih terstruktur daripada keluaran shell mentah.

## Nonaktifkan plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Atau:

```bash
openclaw plugins disable tokenjuice
```

## Terkait

- [Alat Exec](/id/tools/exec)
- [Tingkat penalaran](/id/tools/thinking)
- [Mesin konteks](/id/concepts/context-engine)
