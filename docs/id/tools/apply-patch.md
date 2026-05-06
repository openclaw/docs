---
read_when:
    - Anda perlu melakukan pengeditan file terstruktur di beberapa file
    - Anda ingin mendokumentasikan atau men-debug pengeditan berbasis patch
summary: Terapkan tambalan pada beberapa file dengan alat apply_patch
title: alat apply_patch
x-i18n:
    generated_at: "2026-05-06T09:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Terapkan perubahan berkas menggunakan format patch terstruktur. Ini ideal untuk edit multi-berkas
atau multi-segmen ketika satu pemanggilan `edit` akan rapuh.

Alat ini menerima satu string `input` yang membungkus satu atau beberapa operasi berkas:

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
- `tools.exec.applyPatch.workspaceOnly` default-nya adalah `true` (terbatas dalam workspace). Atur ke `false` hanya jika Anda sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.
- Gunakan `*** Move to:` di dalam segmen `*** Update File:` untuk mengganti nama berkas.
- `*** End of File` menandai penyisipan khusus EOF bila diperlukan.
- Tersedia secara default untuk model OpenAI dan OpenAI Codex. Atur
  `tools.exec.applyPatch.enabled: false` untuk menonaktifkannya.
- Secara opsional, batasi berdasarkan model melalui
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

<CardGroup cols={2}>
  <Card title="Diff" href="/id/tools/diffs" icon="code-compare">
    Penampil diff hanya-baca untuk penyajian perubahan.
  </Card>
  <Card title="Alat exec" href="/id/tools/exec" icon="terminal">
    Eksekusi perintah shell dari agen.
  </Card>
  <Card title="Eksekusi kode" href="/id/tools/code-execution" icon="square-code">
    Analisis Python jarak jauh dalam sandbox dengan xAI.
  </Card>
</CardGroup>
