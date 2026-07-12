---
read_when:
    - Birden çok dosyada yapılandırılmış dosya düzenlemeleri yapmanız gerekiyor
    - Yama tabanlı düzenlemeleri belgelemek veya hata ayıklamak istiyorsunuz
summary: apply_patch aracıyla birden çok dosyaya yama uygulayın
title: apply_patch aracı
x-i18n:
    generated_at: "2026-07-12T12:46:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Yapılandırılmış bir yama biçimi kullanarak dosya değişikliklerini uygulayın. Bu, tek bir `edit` çağrısının kırılgan olacağı birden fazla dosyayı
veya birden fazla bölümü kapsayan düzenlemeler için idealdir.

Araç, bir veya daha fazla dosya işlemini sarmalayan tek bir `input` dizesi kabul eder:

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

## Parametreler

- `input` (zorunlu): `*** Begin Patch` ve `*** End Patch` dâhil olmak üzere yamanın tam içeriği.

## Notlar

- Yama yolları, göreli yolları (çalışma alanı dizininden itibaren) ve mutlak yolları destekler.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlıdır). Yalnızca `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini bilinçli olarak istiyorsanız bunu `false` olarak ayarlayın.
- Dosyaları yeniden adlandırmak için bir `*** Update File:` bölümü içinde `*** Move to:` kullanın.
- `*** End of File`, gerektiğinde yalnızca dosya sonuna yapılacak bir eklemeyi işaretler.
- Her model için varsayılan olarak etkindir. Devre dışı bırakmak için `tools.exec.applyPatch.enabled: false` olarak ayarlayın veya `tools.exec.applyPatch.allowModels` ile belirli modellerle sınırlandırın (`gpt-5.4` gibi ham kimlikleri ya da `openai/gpt-5.4` gibi tam kimlikleri kabul eder).
- Yapılandırma `tools.exec.applyPatch.*` altında bulunur.

## Örnek

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## İlgili

<CardGroup cols={2}>
  <Card title="Farklar" href="/tr/tools/diffs" icon="code-compare">
    Değişikliklerin sunumu için salt okunur fark görüntüleyici.
  </Card>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Agent üzerinden kabuk komutu yürütme.
  </Card>
  <Card title="Kod yürütme" href="/tr/tools/code-execution" icon="square-code">
    xAI ile korumalı alanda uzaktan Python analizi.
  </Card>
</CardGroup>
