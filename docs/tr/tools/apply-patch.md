---
read_when:
    - Birden çok dosyada yapılandırılmış dosya düzenlemelerine ihtiyacınız var
    - Yama tabanlı düzenlemeleri belgelendirmek veya hata ayıklamak istiyorsunuz
summary: Çok dosyalı yamaları apply_patch aracıyla uygulayın
title: apply_patch Aracı
x-i18n:
    generated_at: "2026-04-05T14:09:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# apply_patch aracı

Dosya değişikliklerini yapılandırılmış bir yama biçimi kullanarak uygulayın. Bu, tek bir `edit` çağrısının kırılgan olacağı çok dosyalı veya çok parçalı düzenlemeler için idealdir.

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

- `input` (zorunlu): `*** Begin Patch` ve `*** End Patch` dahil olmak üzere tam yama içeriği.

## Notlar

- Yama yolları göreli yolları (çalışma alanı dizininden) ve mutlak yolları destekler.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerine sahiptir (çalışma alanıyla sınırlı). `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini bilerek istiyorsanız bunu yalnızca `false` olarak ayarlayın.
- Dosyaları yeniden adlandırmak için bir `*** Update File:` parçası içinde `*** Move to:` kullanın.
- `*** End of File`, gerektiğinde yalnızca EOF eklemesini işaretler.
- Varsayılan olarak OpenAI ve OpenAI Codex modelleri için kullanılabilir.
  Devre dışı bırakmak için `tools.exec.applyPatch.enabled: false`
  ayarını kullanın.
- İsteğe bağlı olarak model bazında
  `tools.exec.applyPatch.allowModels` ile sınırlandırabilirsiniz.
- Config yalnızca `tools.exec` altında bulunur.

## Örnek

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
