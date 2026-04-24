---
read_when:
    - Birden çok dosyada yapılandırılmış dosya düzenlemelerine ihtiyacınız var
    - Yama tabanlı düzenlemeleri belgelemek veya hata ayıklamak istiyorsunuz
summary: '`apply_patch` aracıyla çok dosyalı yamalar uygulama'
title: '`apply_patch` aracı'
x-i18n:
    generated_at: "2026-04-24T09:32:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Yapılandırılmış bir yama biçimi kullanarak dosya değişiklikleri uygulayın. Bu, tek bir `edit` çağrısının kırılgan olacağı çok dosyalı
veya çok hunk'lı düzenlemeler için idealdir.

Araç, bir veya daha fazla dosya işlemini saran tek bir `input` dizesi kabul eder:

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

## Parametreler

- `input` (zorunlu): `*** Begin Patch` ve `*** End Patch` dâhil tam yama içeriği.

## Notlar

- Yama yolları göreli yolları (çalışma alanı dizininden) ve mutlak yolları destekler.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanı içinde). `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini özellikle istiyorsanız bunu yalnızca `false` olarak ayarlayın.
- Dosyaları yeniden adlandırmak için `*** Update File:` hunk'ı içinde `*** Move to:` kullanın.
- Gerektiğinde yalnızca EOF ekleme için `*** End of File` kullanılır.
- Varsayılan olarak OpenAI ve OpenAI Codex modelleri için kullanılabilir.
  Devre dışı bırakmak için `tools.exec.applyPatch.enabled: false` ayarlayın.
- İsteğe bağlı olarak
  `tools.exec.applyPatch.allowModels` ile model bazında geçitleme yapın.
- Yapılandırma yalnızca `tools.exec` altındadır.

## Örnek

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## İlgili

- [Diff'ler](/tr/tools/diffs)
- [Exec aracı](/tr/tools/exec)
- [Kod yürütme](/tr/tools/code-execution)
