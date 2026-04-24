---
read_when:
    - Quieres resultados más cortos de las herramientas `exec` o `bash` en OpenClaw
    - Quieres habilitar el Plugin incluido tokenjuice
    - Necesitas entender qué cambia tokenjuice y qué deja sin procesar
summary: Compacta resultados ruidosos de las herramientas exec y bash con un Plugin incluido opcional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T05:56:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` es un Plugin incluido opcional que compacta resultados ruidosos de las
herramientas `exec` y `bash` después de que el comando ya se haya ejecutado.

Cambia el `tool_result` devuelto, no el comando en sí. Tokenjuice no
reescribe la entrada del shell, no vuelve a ejecutar comandos ni cambia códigos de salida.

Hoy esto se aplica a ejecuciones incrustadas de Pi, donde tokenjuice engancha la
ruta incrustada de `tool_result` y recorta la salida que vuelve a la sesión.

## Habilitar el Plugin

Ruta rápida:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw ya incluye el Plugin. No hay ningún paso aparte de `plugins install`
ni `tokenjuice install openclaw`.

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

- Compacta resultados ruidosos de `exec` y `bash` antes de que vuelvan a introducirse en la sesión.
- Mantiene intacta la ejecución original del comando.
- Conserva las lecturas exactas de contenido de archivos y otros comandos que tokenjuice debe dejar sin procesar.
- Sigue siendo opcional: desactiva el Plugin si quieres salida literal en todas partes.

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

- [Herramienta exec](/es/tools/exec)
- [Niveles de thinking](/es/tools/thinking)
- [Motor de contexto](/es/concepts/context-engine)
