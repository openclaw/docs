---
read_when:
    - Quieres resultados de herramientas `exec` o `bash` más breves en OpenClaw
    - Quieres instalar o habilitar el plugin Tokenjuice
    - Necesitas entender qué cambia tokenjuice y qué deja sin procesar
summary: Compacta resultados ruidosos de herramientas exec y bash con el plugin opcional Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T13:12:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` es un Plugin externo opcional que compacta resultados ruidosos de herramientas `exec` y `bash`
después de que el comando ya se ha ejecutado.

Cambia el `tool_result` devuelto, no el comando en sí. Tokenjuice no
reescribe la entrada de shell, no vuelve a ejecutar comandos ni cambia los códigos de salida.

Actualmente esto se aplica a ejecuciones integradas de OpenClaw y a herramientas dinámicas de OpenClaw en el arnés app-server de Codex. Tokenjuice se engancha al middleware de resultados de herramientas de OpenClaw y
recorta la salida antes de que vuelva a la sesión activa del arnés.

## Habilitar el Plugin

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

- Compacta resultados ruidosos de `exec` y `bash` antes de que se reintroduzcan en la sesión.
- Mantiene intacta la ejecución del comando original.
- Preserva las lecturas exactas de contenido de archivos y otros comandos que tokenjuice debe dejar sin procesar.
- Permanece como opt-in: deshabilita el Plugin si quieres salida textual en todas partes.

## Verificar que funciona

1. Habilita el Plugin.
2. Inicia una sesión que pueda llamar a `exec`.
3. Ejecuta un comando ruidoso como `git status`.
4. Comprueba que el resultado de herramienta devuelto sea más corto y más estructurado que la salida sin procesar del shell.

## Deshabilitar el Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

O bien:

```bash
openclaw plugins disable tokenjuice
```

## Relacionado

- [Herramienta Exec](/es/tools/exec)
- [Niveles de pensamiento](/es/tools/thinking)
- [Motor de contexto](/es/concepts/context-engine)
