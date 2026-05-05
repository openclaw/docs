---
read_when:
    - Quieres un diagnóstico rápido del estado del canal + destinatarios recientes de la sesión
    - Quieres un estado “all” que se pueda pegar para depuración
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: Estado
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnósticos para canales + sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notas:

- `--deep` ejecuta sondeos en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simple permanece en la ruta rápida de solo lectura y marca la memoria como `not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de seguridad pesada, la compatibilidad de plugins y los sondeos de vectores de memoria se dejan para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` y `openclaw memory status --deep`.
- `status --json --all` informa detalles de memoria desde el runtime del plugin de memoria activo seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar deshabilitado el valor integrado `agents.defaults.memorySearch.enabled` y aun así informar sus propios archivos, fragmentos, vector y estado de FTS.
- `--usage` imprime las ventanas de uso normalizadas del proveedor como `X% left`.
- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta de sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend ACP como `codex (acp/acpx)`. Consulta [runtimes de agentes](/es/concepts/agent-runtimes) para ver la distinción entre proveedor/modelo/runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son la cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuento tienen prioridad cuando están presentes. Las respuestas de `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es dispersa, `/status` puede rellenar los contadores de tokens y caché desde el registro de uso de transcripción más reciente. Los valores en vivo distintos de cero existentes siguen teniendo prioridad sobre los valores de reserva de la transcripción.
- `/status` incluye el tiempo de actividad compacto del proceso Gateway y el tiempo de actividad del sistema host.
- La reserva de transcripción también puede recuperar la etiqueta del modelo de runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, status resuelve la ventana de contexto contra el modelo de runtime recuperado en lugar del seleccionado.
- Para la contabilización del tamaño del prompt, la reserva de transcripción prefiere el total más grande orientado a prompts cuando faltan los metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no se reducen a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.
- El resumen incluye el estado de instalación/runtime del servicio Gateway + host de Node cuando está disponible.
- El resumen incluye el canal de actualización + SHA de git (para checkouts de código fuente).
- La información de actualización aparece en el resumen; si hay una actualización disponible, status imprime una sugerencia para ejecutar `openclaw update` (consulta [Actualizar](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando es posible.
- Si un SecretRef de canal compatible está configurado pero no disponible en la ruta del comando actual, status permanece en modo de solo lectura e informa una salida degradada en lugar de fallar. La salida para humanos muestra advertencias como “configured token unavailable in this command path”, y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución local del comando de SecretRef se realiza correctamente, status prefiere la instantánea resuelta y borra de la salida final los marcadores transitorios de canal de “secret unavailable”.
- `status --all` incluye una fila de resumen de secretos y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
