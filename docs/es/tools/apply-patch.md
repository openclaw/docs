---
read_when:
    - Necesitas ediciones de archivos estructuradas en varios archivos
    - Quieres documentar o depurar ediciones basadas en parches
summary: Aplicar parches de varios archivos con la herramienta apply_patch
title: herramienta apply_patch
x-i18n:
    generated_at: "2026-07-05T11:47:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Aplica cambios de archivos usando un formato de parche estructurado. Es ideal para ediciones de varios archivos
o varios fragmentos donde una sola llamada a `edit` sería frágil.

La herramienta acepta una única cadena `input` que envuelve una o más operaciones de archivo:

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

## Parámetros

- `input` (obligatorio): Contenido completo del parche, incluidos `*** Begin Patch` y `*** End Patch`.

## Notas

- Las rutas del parche admiten rutas relativas (desde el directorio del espacio de trabajo) y rutas absolutas.
- `tools.exec.applyPatch.workspaceOnly` tiene como valor predeterminado `true` (contenido dentro del espacio de trabajo). Establécelo en `false` solo si quieres intencionalmente que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.
- Usa `*** Move to:` dentro de un fragmento `*** Update File:` para cambiar el nombre de archivos.
- `*** End of File` marca una inserción solo EOF cuando sea necesario.
- Habilitado de forma predeterminada para todos los modelos. Establece `tools.exec.applyPatch.enabled: false`
  para deshabilitarlo, o restríngelo a modelos específicos con
  `tools.exec.applyPatch.allowModels` (acepta ids sin procesar como `gpt-5.4` o ids completos
  como `openai/gpt-5.4`).
- La configuración reside en `tools.exec.applyPatch.*`.

## Ejemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Diffs" href="/es/tools/diffs" icon="code-compare">
    Visor de diferencias de solo lectura para la presentación de cambios.
  </Card>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Ejecución de comandos de shell desde el agente.
  </Card>
  <Card title="Ejecución de código" href="/es/tools/code-execution" icon="square-code">
    Análisis remoto de Python en entorno aislado con xAI.
  </Card>
</CardGroup>
