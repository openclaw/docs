---
read_when:
    - Anda menginginkan hasil alat `exec` atau `bash` yang lebih singkat di OpenClaw
    - Anda ingin menginstal atau mengaktifkan Plugin Tokenjuice
    - Anda perlu memahami apa yang diubah tokenjuice dan apa yang dibiarkannya mentah
summary: Ringkas hasil tool exec dan bash yang berisik dengan Plugin Tokenjuice opsional
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:22:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` adalah Plugin eksternal opsional yang memadatkan hasil tool `exec` dan `bash`
yang berisik setelah perintah selesai dijalankan.

Plugin ini mengubah `tool_result` yang dikembalikan, bukan perintah itu sendiri. Tokenjuice tidak
menulis ulang input shell, menjalankan ulang perintah, atau mengubah kode keluar.

Saat ini hal ini berlaku untuk run tertanam OpenClaw dan tool dinamis OpenClaw dalam harness
app-server Codex. Tokenjuice mengait ke middleware hasil tool OpenClaw dan
memangkas output sebelum dikembalikan ke sesi harness aktif.

## Aktifkan Plugin

Instal sekali:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Lalu aktifkan:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Setara:

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

## Yang diubah tokenjuice

- Memadatkan hasil `exec` dan `bash` yang berisik sebelum dimasukkan kembali ke sesi.
- Membiarkan eksekusi perintah asli tidak tersentuh.
- Mempertahankan pembacaan konten file yang persis dan perintah lain yang harus dibiarkan mentah oleh tokenjuice.
- Tetap opt-in: nonaktifkan Plugin jika Anda menginginkan output verbatim di semua tempat.

## Verifikasi bahwa ini berfungsi

1. Aktifkan Plugin.
2. Mulai sesi yang dapat memanggil `exec`.
3. Jalankan perintah yang berisik seperti `git status`.
4. Periksa bahwa hasil tool yang dikembalikan lebih pendek dan lebih terstruktur daripada output shell mentah.

## Nonaktifkan Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Atau:

```bash
openclaw plugins disable tokenjuice
```

## Terkait

- [Tool exec](/id/tools/exec)
- [Tingkat berpikir](/id/tools/thinking)
- [Mesin konteks](/id/concepts/context-engine)
