---
read_when:
    - Anda perlu melakukan pengeditan berkas terstruktur di beberapa berkas
    - Anda ingin mendokumentasikan atau men-debug pengeditan berbasis patch
summary: Terapkan patch pada beberapa berkas dengan alat apply_patch
title: alat apply_patch
x-i18n:
    generated_at: "2026-07-12T14:42:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Terapkan perubahan file menggunakan format patch terstruktur. Format ini ideal untuk pengeditan
beberapa file atau beberapa bagian ketika satu panggilan `edit` akan rentan gagal.

Alat ini menerima satu string `input` yang membungkus satu atau beberapa operasi file:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parameter

- `input` (wajib): Isi patch lengkap termasuk `*** Begin Patch` dan `*** End Patch`.

## Catatan

- Jalur patch mendukung jalur relatif (dari direktori ruang kerja) dan jalur absolut.
- `tools.exec.applyPatch.workspaceOnly` secara default bernilai `true` (terbatas dalam ruang kerja). Atur ke `false` hanya jika Anda sengaja ingin `apply_patch` menulis/menghapus di luar direktori ruang kerja.
- Gunakan `*** Move to:` di dalam bagian `*** Update File:` untuk mengganti nama file.
- `*** End of File` menandai penyisipan khusus di EOF saat diperlukan.
- Diaktifkan secara default untuk setiap model. Atur `tools.exec.applyPatch.enabled: false`
  untuk menonaktifkannya, atau batasi ke model tertentu dengan
  `tools.exec.applyPatch.allowModels` (menerima id mentah seperti `gpt-5.4` atau id lengkap
  seperti `openai/gpt-5.4`).
- Konfigurasi berada di bawah `tools.exec.applyPatch.*`.

## Contoh

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Terkait

<CardGroup cols={2}>
  <Card title="Perbedaan" href="/id/tools/diffs" icon="code-compare">
    Penampil perbedaan hanya-baca untuk menyajikan perubahan.
  </Card>
  <Card title="Alat eksekusi" href="/id/tools/exec" icon="terminal">
    Eksekusi perintah shell dari agen.
  </Card>
  <Card title="Eksekusi kode" href="/id/tools/code-execution" icon="square-code">
    Analisis Python jarak jauh dalam sandbox dengan xAI.
  </Card>
</CardGroup>
