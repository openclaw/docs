---
read_when:
    - Birden fazla dosyada yapılandırılmış dosya düzenlemeleri yapmanız gerekir
    - Yama tabanlı düzenlemeleri belgelemek veya hata ayıklamak istiyorsunuz
summary: Çok dosyalı yamaları apply_patch aracıyla uygulayın
title: apply_patch aracı
x-i18n:
    generated_at: "2026-05-06T09:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Yapılandırılmış bir yama formatı kullanarak dosya değişiklikleri uygulayın. Bu, tek bir `edit` çağrısının kırılgan olacağı çok dosyalı
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

- `input` (gerekli): `*** Begin Patch` ve `*** End Patch` dahil tam yama içeriği.

## Notlar

- Yama yolları göreli yolları (çalışma alanı dizininden) ve mutlak yolları destekler.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlı). Yalnızca `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini özellikle istiyorsanız bunu `false` olarak ayarlayın.
- Dosyaları yeniden adlandırmak için bir `*** Update File:` hunk'ı içinde `*** Move to:` kullanın.
- `*** End of File`, gerektiğinde yalnızca EOF eklemesini işaretler.
- OpenAI ve OpenAI Codex modelleri için varsayılan olarak kullanılabilir. Devre dışı bırakmak için
  `tools.exec.applyPatch.enabled: false` ayarlayın.
- İsteğe bağlı olarak model bazında şu yapılandırmayla sınırlayın:
  `tools.exec.applyPatch.allowModels`.
- Yapılandırma yalnızca `tools.exec` altındadır.

## Örnek

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## İlgili

<CardGroup cols={2}>
  <Card title="Diffs" href="/tr/tools/diffs" icon="code-compare">
    Değişiklik sunumu için salt okunur diff görüntüleyici.
  </Card>
  <Card title="Exec tool" href="/tr/tools/exec" icon="terminal">
    Agent tarafından shell komutu yürütme.
  </Card>
  <Card title="Code execution" href="/tr/tools/code-execution" icon="square-code">
    xAI ile sandbox içinde uzak Python analizi.
  </Card>
</CardGroup>
