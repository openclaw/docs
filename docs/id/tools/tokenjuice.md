---
read_when:
    - Anda menginginkan hasil alat `exec` atau `bash` yang lebih singkat di OpenClaw
    - Anda ingin mengaktifkan Plugin tokenjuice bawaan
    - Anda perlu memahami apa yang diubah oleh tokenjuice dan apa yang dibiarkannya mentah
summary: Kompakkan hasil alat exec dan Bash yang berisik dengan Plugin bawaan opsional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T09:33:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` adalah Plugin bawaan opsional yang mengompakkan hasil alat `exec` dan `bash`
yang berisik setelah perintah sudah dijalankan.

Plugin ini mengubah `tool_result` yang dikembalikan, bukan perintah itu sendiri. Tokenjuice
tidak menulis ulang input shell, menjalankan ulang perintah, atau mengubah exit code.

Saat ini ini berlaku untuk run Pi embedded, tempat tokenjuice meng-hook
jalur `tool_result` embedded dan memangkas output yang kembali ke sesi.

## Aktifkan Plugin

Jalur cepat:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Setara:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw sudah menyertakan Plugin ini. Tidak ada langkah `plugins install`
atau `tokenjuice install openclaw` terpisah.

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

## Apa yang diubah tokenjuice

- Mengompakkan hasil `exec` dan `bash` yang berisik sebelum dikirim kembali ke sesi.
- Membiarkan eksekusi perintah asli tetap tidak berubah.
- Mempertahankan pembacaan konten file yang exact dan perintah lain yang harus dibiarkan mentah oleh tokenjuice.
- Tetap opt-in: nonaktifkan Plugin jika Anda menginginkan output verbatim di mana pun.

## Verifikasi bahwa ini berfungsi

1. Aktifkan Plugin.
2. Mulai sesi yang dapat memanggil `exec`.
3. Jalankan perintah berisik seperti `git status`.
4. Periksa bahwa hasil alat yang dikembalikan lebih singkat dan lebih terstruktur daripada output shell mentah.

## Nonaktifkan Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Atau:

```bash
openclaw plugins disable tokenjuice
```

## Terkait

- [Alat Exec](/id/tools/exec)
- [Level berpikir](/id/tools/thinking)
- [Mesin konteks](/id/concepts/context-engine)
