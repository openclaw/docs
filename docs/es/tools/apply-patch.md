---
read_when:
    - Necesitas ediciones estructuradas de archivos en varios archivos.
    - Quieres documentar o depurar ediciones basadas en parches
summary: Aplica parches en varios archivos con la herramienta apply_patch
title: herramienta apply_patch
x-i18n:
    generated_at: "2026-07-11T23:32:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Aplica cambios en archivos mediante un formato de parche estructurado. Esto es ideal para ediciones
en varios archivos o con varios fragmentos, donde una única llamada a `edit` sería frágil.

La herramienta acepta una sola cadena `input` que contiene una o más operaciones de archivo:

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

- `input` (obligatorio): contenido completo del parche, incluidos `*** Begin Patch` y `*** End Patch`.

## Notas

- Las rutas del parche admiten rutas relativas (desde el directorio del espacio de trabajo) y rutas absolutas.
- El valor predeterminado de `tools.exec.applyPatch.workspaceOnly` es `true` (limitado al espacio de trabajo). Establécelo en `false` solo si quieres intencionadamente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.
- Usa `*** Move to:` dentro de un fragmento `*** Update File:` para cambiar el nombre de archivos.
- `*** End of File` marca una inserción únicamente al final del archivo cuando sea necesario.
- Está habilitado de forma predeterminada para todos los modelos. Establece `tools.exec.applyPatch.enabled: false`
  para deshabilitarlo, o restríngelo a modelos específicos con
  `tools.exec.applyPatch.allowModels` (acepta identificadores sin prefijo como `gpt-5.4` o identificadores
  completos como `openai/gpt-5.4`).
- La configuración se encuentra en `tools.exec.applyPatch.*`.

## Ejemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Diferencias" href="/es/tools/diffs" icon="code-compare">
    Visor de diferencias de solo lectura para presentar cambios.
  </Card>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Ejecución de comandos del shell desde el agente.
  </Card>
  <Card title="Ejecución de código" href="/es/tools/code-execution" icon="square-code">
    Análisis remoto de Python en un entorno aislado con xAI.
  </Card>
</CardGroup>
