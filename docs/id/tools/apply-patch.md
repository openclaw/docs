---
read_when:
    - Anda memerlukan pengeditan file terstruktur di beberapa file
    - Anda ingin mendokumentasikan atau men-debug pengeditan berbasis patch
summary: Terapkan patch multi-file dengan tool apply_patch
title: Tool apply_patch
x-i18n:
    generated_at: "2026-04-05T14:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# tool apply_patch

Terapkan perubahan file menggunakan format patch terstruktur. Ini ideal untuk pengeditan multi-file
atau multi-hunk ketika satu pemanggilan `edit` akan rapuh.

Tool ini menerima satu string `input` yang membungkus satu atau lebih operasi file:

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

- Jalur patch mendukung jalur relatif (dari direktori workspace) dan jalur absolut.
- `tools.exec.applyPatch.workspaceOnly` default-nya `true` (terbatas pada workspace). Setel ke `false` hanya jika Anda memang ingin `apply_patch` menulis/menghapus di luar direktori workspace.
- Gunakan `*** Move to:` dalam hunk `*** Update File:` untuk mengganti nama file.
- `*** End of File` menandai sisipan khusus EOF saat diperlukan.
- Tersedia secara default untuk model OpenAI dan OpenAI Codex. Setel
  `tools.exec.applyPatch.enabled: false` untuk menonaktifkannya.
- Secara opsional dapat dibatasi berdasarkan model melalui
  `tools.exec.applyPatch.allowModels`.
- Konfigurasi hanya berada di bawah `tools.exec`.

## Contoh

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
