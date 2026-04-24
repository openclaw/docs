---
read_when:
    - Necesitas ediciones estructuradas de archivos en varios archivos
    - Quieres documentar o depurar ediciones basadas en parches
summary: Aplicar parches de varios archivos con la herramienta `apply_patch`
title: Herramienta `apply_patch`
x-i18n:
    generated_at: "2026-04-24T05:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Aplica cambios de archivos usando un formato de parche estructurado. Esto es ideal para ediciones de varios archivos o varios bloques donde una sola llamada a `edit` sería frágil.

La herramienta acepta una única cadena `input` que envuelve una o más operaciones sobre archivos:

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

## Parámetros

- `input` (obligatorio): contenido completo del parche, incluyendo `*** Begin Patch` y `*** End Patch`.

## Notas

- Las rutas del parche admiten rutas relativas (desde el directorio del espacio de trabajo) y rutas absolutas.
- `tools.exec.applyPatch.workspaceOnly` usa `true` de forma predeterminada (contenido dentro del espacio de trabajo). Configúralo en `false` solo si quieres intencionadamente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.
- Usa `*** Move to:` dentro de un bloque `*** Update File:` para renombrar archivos.
- `*** End of File` marca una inserción solo al final del archivo cuando sea necesario.
- Disponible de forma predeterminada para modelos OpenAI y OpenAI Codex. Configura
  `tools.exec.applyPatch.enabled: false` para deshabilitarla.
- Puedes restringirla opcionalmente por modelo mediante
  `tools.exec.applyPatch.allowModels`.
- La configuración vive solo bajo `tools.exec`.

## Ejemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionado

- [Diffs](/es/tools/diffs)
- [Herramienta exec](/es/tools/exec)
- [Ejecución de código](/es/tools/code-execution)
