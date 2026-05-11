---
read_when:
    - Quieres un diagnóstico rápido del estado del canal + destinatarios recientes de la sesión
    - Quieres un estado "all" que se pueda pegar para depurar
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

Diagnósticos para canales + sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notas:

- `--deep` ejecuta sondeos en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simple permanece en la ruta rápida de solo lectura y marca la memoria como `not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de seguridad pesada, la compatibilidad de plugins y los sondeos de vectores de memoria quedan para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` y `openclaw memory status --deep`.
- `status --json --all` informa detalles de memoria desde el runtime activo del plugin de memoria seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar deshabilitado el `agents.defaults.memorySearch.enabled` integrado y aun así informar sus propios archivos, fragmentos, vector y estado FTS.
- `--usage` imprime ventanas de uso de proveedor normalizadas como `X% left`.
- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta del sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP como `codex (acp/acpx)`. Consulta [Runtimes de agente](/es/concepts/agent-runtimes) para ver la distinción entre proveedor/modelo/runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuento prevalecen cuando están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede completar los contadores de tokens y caché desde el registro de uso de transcripción más reciente. Los valores en vivo existentes distintos de cero siguen prevaleciendo sobre los valores de reserva de la transcripción.
- `/status` incluye el tiempo de actividad compacto del proceso Gateway y el tiempo de actividad del sistema host.
- La reserva de transcripción también puede recuperar la etiqueta del modelo de runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, status resuelve la ventana de contexto contra el modelo de runtime recuperado en lugar del seleccionado.
- Para la contabilización del tamaño del prompt, la reserva de transcripción prefiere el total orientado a prompts más grande cuando faltan los metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no se reduzcan a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesiones por agente cuando hay varios agentes configurados.
- La vista general incluye el estado de instalación/runtime del servicio de host Gateway + node cuando está disponible.
- La vista general incluye el canal de actualización + SHA de git (para checkouts de código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, status imprime una sugerencia para ejecutar `openclaw update` (consulta [Actualizar](/es/install/updating)).
- Los errores al actualizar precios de modelos se muestran como advertencias opcionales de precios. No
  significan que Gateway o los canales estén en mal estado.
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs admitidos para sus rutas de configuración objetivo cuando es posible.
- Si se configura un SecretRef de canal admitido pero no está disponible en la ruta del comando actual, status permanece en modo de solo lectura e informa una salida degradada en lugar de bloquearse. La salida para humanos muestra advertencias como "configured token unavailable in this command path", y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución de SecretRef local al comando se realiza correctamente, status prefiere la instantánea resuelta y borra los marcadores transitorios de canal de "secret unavailable" de la salida final.
- `status --all` incluye una fila de vista general de Secrets y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
