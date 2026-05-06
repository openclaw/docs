---
read_when:
    - Necesitas ediciones estructuradas en varios archivos
    - Desea documentar o depurar ediciones basadas en parches
summary: Aplica parches de varios archivos con la herramienta apply_patch
title: herramienta apply_patch
x-i18n:
    generated_at: "2026-05-06T05:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Aplica cambios en archivos usando un formato de parche estructurado. Esto es ideal para ediciones de varios archivos
o varios bloques donde una sola llamada a `edit` sería frágil.

La herramienta acepta una única cadena `input` que envuelve una o más operaciones de archivo:

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

- `input` (obligatorio): Contenido completo del parche, incluidos `*** Begin Patch` y `*** End Patch`.

## Notas

- Las rutas de parche admiten rutas relativas (desde el directorio del espacio de trabajo) y rutas absolutas.
- `tools.exec.applyPatch.workspaceOnly` tiene el valor predeterminado `true` (contenido dentro del espacio de trabajo). Establécelo en `false` solo si quieres intencionalmente que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo.
- Usa `*** Move to:` dentro de un bloque `*** Update File:` para cambiar el nombre de archivos.
- `*** End of File` marca una inserción solo de EOF cuando sea necesario.
- Disponible de forma predeterminada para los modelos OpenAI y OpenAI Codex. Establece
  `tools.exec.applyPatch.enabled: false` para deshabilitarlo.
- Opcionalmente, limita por modelo mediante
  `tools.exec.applyPatch.allowModels`.
- La configuración solo está bajo `tools.exec`.

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
    Visor de diffs de solo lectura para presentar cambios.
  </Card>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Ejecución de comandos de shell desde el agente.
  </Card>
  <Card title="Code execution" href="/es/tools/code-execution" icon="square-code">
    Análisis remoto de Python en sandbox con xAI.
  </Card>
</CardGroup>
