---
read_when:
    - Anda memerlukan pengeditan file terstruktur di beberapa file
    - Anda ingin mendokumentasikan atau men-debug pengeditan berbasis patch
summary: Terapkan patch multi-file dengan alat apply_patch
title: alat apply_patch
x-i18n:
    generated_at: "2026-04-24T09:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Terapkan perubahan file menggunakan format patch terstruktur. Ini ideal untuk pengeditan multi-file
atau multi-hunk ketika satu panggilan `edit` akan rapuh.

Alat ini menerima satu string `input` yang membungkus satu atau lebih operasi file:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parameter

- `input` (wajib): Isi patch lengkap termasuk `*** Begin Patch` dan `*** End Patch`.

## Catatan

- Path patch mendukung path relatif (dari direktori workspace) dan path absolut.
- `tools.exec.applyPatch.workspaceOnly` default ke `true` (hanya di dalam workspace). Tetapkan ke `false` hanya jika Anda memang ingin `apply_patch` menulis/menghapus di luar direktori workspace.
- Gunakan `*** Move to:` di dalam hunk `*** Update File:` untuk mengganti nama file.
- `*** End of File` menandai sisipan hanya di EOF bila diperlukan.
- Tersedia secara default untuk model OpenAI dan OpenAI Codex. Tetapkan
  `tools.exec.applyPatch.enabled: false` untuk menonaktifkannya.
- Secara opsional batasi berdasarkan model melalui
  `tools.exec.applyPatch.allowModels`.
- Konfigurasi hanya berada di bawah `tools.exec`.

## Contoh

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Terkait

- [Diff](/id/tools/diffs)
- [Alat exec](/id/tools/exec)
- [Eksekusi kode](/id/tools/code-execution)
