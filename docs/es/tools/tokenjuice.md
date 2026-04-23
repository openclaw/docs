---
read_when:
    - Quieres resultados más cortos de herramientas `exec` o `bash` en OpenClaw
    - Quieres habilitar el Plugin incluido tokenjuice
    - Necesitas entender qué cambia tokenjuice y qué deja sin procesar
summary: Compactar resultados ruidosos de herramientas exec y bash con un Plugin incluido opcional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T05:21:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` es un Plugin incluido opcional que compacta los resultados ruidosos de herramientas `exec` y `bash`
después de que el comando ya se haya ejecutado.

Cambia el `tool_result` devuelto, no el comando en sí. Tokenjuice no
reescribe la entrada del shell, no vuelve a ejecutar comandos ni cambia códigos de salida.

Hoy esto se aplica a ejecuciones incrustadas de Pi, donde tokenjuice engancha la ruta incrustada de
`tool_result` y recorta la salida que vuelve a entrar en la sesión.

## Habilitar el Plugin

Ruta rápida:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw ya incluye el Plugin. No hay ningún paso separado de `plugins install`
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

- Compacta los resultados ruidosos de `exec` y `bash` antes de que vuelvan a introducirse en la sesión.
- Mantiene intacta la ejecución original del comando.
- Conserva las lecturas exactas de contenido de archivos y otros comandos que tokenjuice debe dejar sin procesar.
- Sigue siendo opcional: deshabilita el Plugin si quieres salida literal en todas partes.

## Verificar que funciona

1. Habilita el Plugin.
2. Inicia una sesión que pueda llamar a `exec`.
3. Ejecuta un comando ruidoso como `git status`.
4. Comprueba que el resultado de herramienta devuelto sea más corto y más estructurado que la salida raw del shell.

## Deshabilitar el Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

O:

```bash
openclaw plugins disable tokenjuice
```
