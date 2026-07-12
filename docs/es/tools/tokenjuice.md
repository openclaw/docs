---
read_when:
    - Quieres resultados más breves de las herramientas `exec` o `bash` en OpenClaw
    - Quieres instalar o habilitar el plugin Tokenjuice
    - Necesitas entender qué modifica tokenjuice y qué deja sin procesar
summary: Compacta los resultados ruidosos de las herramientas exec y bash con el Plugin opcional Tokenjuice
title: Jugo de tokens
x-i18n:
    generated_at: "2026-07-11T23:36:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` es un plugin externo opcional que compacta los resultados ruidosos de las herramientas `exec` y `bash`
después de que el comando ya se haya ejecutado.

Modifica el `tool_result` devuelto, no el comando en sí. Tokenjuice no
reescribe la entrada del shell, no vuelve a ejecutar comandos ni cambia los códigos de salida.

Actualmente, esto se aplica a las ejecuciones integradas de OpenClaw y a las herramientas dinámicas de OpenClaw en el entorno
de app-server de Codex. Tokenjuice se integra en el middleware de resultados de herramientas de OpenClaw y
recorta la salida antes de devolverla a la sesión activa del entorno.

## Habilitar el plugin

Instálelo una vez:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

A continuación, habilítelo:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

Si prefiere editar la configuración directamente:

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

- Compacta los resultados ruidosos de `exec` y `bash` antes de volver a introducirlos en la sesión.
- Mantiene intacta la ejecución del comando original.
- Aplica una política de inventario seguro: las lecturas exactas del contenido de archivos se mantienen sin procesar, los comandos independientes de inventario del repositorio pueden compactarse y las secuencias mixtas de comandos no seguras se mantienen sin procesar.
- Sigue siendo opcional: deshabilite el plugin si desea una salida literal en todos los casos.

## Verificar que funciona

1. Habilite el plugin.
2. Inicie una sesión que pueda llamar a `exec`.
3. Ejecute un comando con salida abundante, como `git status`.
4. Compruebe que el resultado devuelto por la herramienta sea más breve y esté más estructurado que la salida sin procesar del shell.

## Deshabilitar el plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

O bien:

```bash
openclaw plugins disable tokenjuice
```

## Temas relacionados

- [Herramienta Exec](/es/tools/exec)
- [Niveles de razonamiento](/es/tools/thinking)
- [Motor de contexto](/es/concepts/context-engine)
