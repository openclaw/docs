---
read_when:
    - Quieres un diagnóstico rápido de la salud del canal + destinatarios de sesiones recientes
    - Quieres un estado “all” fácil de pegar para depuración
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondas, instantáneas de uso)
title: estado
x-i18n:
    generated_at: "2026-04-23T14:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnósticos de canales + sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notas:

- `--deep` ejecuta sondas en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` imprime ventanas de uso normalizadas como `X% left`.
- La salida de estado de la sesión ahora separa `Runtime:` de `Runner:`. `Runtime` es la ruta de ejecución y el estado del sandbox (`direct`, `docker/*`), mientras que `Runner` indica si la sesión está usando Pi integrado, un proveedor respaldado por CLI o un backend de arnés ACP como `codex (acp/acpx)`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuento tienen prioridad cuando están presentes. Las respuestas de `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede rellenar contadores de tokens y caché a partir del registro de uso de transcripción más reciente. Los valores activos no nulos existentes siguen teniendo prioridad sobre los valores de respaldo de la transcripción.
- El respaldo de transcripción también puede recuperar la etiqueta activa del modelo de runtime cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, status resuelve la ventana de contexto respecto del modelo de runtime recuperado en lugar del seleccionado.
- Para la contabilidad del tamaño del prompt, el respaldo de transcripción prefiere el total orientado a prompts de mayor tamaño cuando faltan metadatos de sesión o son menores, de modo que las sesiones de proveedor personalizado no se reduzcan a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.
- La vista general incluye el estado de instalación/runtime del servicio host de Gateway + Node cuando está disponible.
- La vista general incluye el canal de actualización + git SHA (para repositorios clonados desde código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, status imprime una sugerencia para ejecutar `openclaw update` (consulta [Actualización](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración de destino cuando es posible.
- Si un SecretRef de canal compatible está configurado pero no está disponible en la ruta actual del comando, status permanece en modo de solo lectura y muestra una salida degradada en lugar de fallar. La salida legible por humanos muestra advertencias como “configured token unavailable in this command path”, y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución local del comando de SecretRef tiene éxito, status prefiere la instantánea resuelta y elimina de la salida final los marcadores transitorios de canal “secret unavailable”.
- `status --all` incluye una fila de vista general de Secrets y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.
