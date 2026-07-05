---
read_when:
    - Quieres resultados más breves de las herramientas `exec` o `bash` en OpenClaw
    - Quieres instalar o habilitar el plugin Tokenjuice
    - Necesitas entender qué cambia tokenjuice y qué deja sin procesar
summary: Compacta los resultados ruidosos de las herramientas exec y bash con el Plugin opcional Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-05T11:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` es un plugin externo opcional que compacta resultados ruidosos de herramientas `exec` y `bash` después de que el comando ya se haya ejecutado.

Cambia el `tool_result` devuelto, no el comando en sí. Tokenjuice no reescribe la entrada de shell, no vuelve a ejecutar comandos ni cambia códigos de salida.

Actualmente esto se aplica a ejecuciones integradas de OpenClaw y a herramientas dinámicas de OpenClaw en el arnés de servidor de aplicaciones de Codex. Tokenjuice se engancha al middleware de resultados de herramientas de OpenClaw y recorta la salida antes de que vuelva a la sesión activa del arnés.

## Habilitar el plugin

Instala una vez:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Luego habilítalo:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

Si prefieres editar la configuración directamente:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Qué cambia tokenjuice

- Compacta resultados ruidosos de `exec` y `bash` antes de que se devuelvan a la sesión.
- Mantiene intacta la ejecución del comando original.
- Aplica una política de inventario seguro: las lecturas exactas de contenido de archivos permanecen sin procesar, los comandos independientes de inventario del repositorio pueden compactarse y las secuencias mixtas de comandos no seguras permanecen sin procesar.
- Sigue siendo opcional: deshabilita el plugin si quieres salida literal en todas partes.

## Verificar que funciona

1. Habilita el plugin.
2. Inicia una sesión que pueda llamar a `exec`.
3. Ejecuta un comando ruidoso como `git status`.
4. Comprueba que el resultado devuelto por la herramienta sea más corto y más estructurado que la salida sin procesar del shell.

## Deshabilitar el plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

O:

```bash
openclaw plugins disable tokenjuice
```

## Relacionado

- [Herramienta Exec](/es/tools/exec)
- [Niveles de razonamiento](/es/tools/thinking)
- [Motor de contexto](/es/concepts/context-engine)
