---
read_when:
    - Quieres un diagnóstico rápido del estado de los canales + destinatarios de sesiones recientes
    - Quieres un estado “all” que se pueda pegar para depurar
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: Estado
x-i18n:
    generated_at: "2026-04-30T05:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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

- `--deep` ejecuta comprobaciones en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` sin opciones permanece en la ruta rápida de solo lectura y marca la memoria como `not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de seguridad pesada, la compatibilidad de plugins y las comprobaciones de vectores de memoria quedan para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` y `openclaw memory status --deep`.
- `status --json --all` informa detalles de memoria desde el runtime del plugin de memoria activo seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar deshabilitado el valor integrado `agents.defaults.memorySearch.enabled` y aun así informar sus propios archivos, fragmentos, vector y estado de FTS.
- `--usage` imprime ventanas de uso normalizadas del proveedor como `X% left`.
- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta de sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP como `codex (acp/acpx)`. Consulta [runtimes de agentes](/es/concepts/agent-runtimes) para ver la distinción entre proveedor, modelo y runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es dispersa, `/status` puede completar los contadores de tokens y caché desde el registro de uso de transcripción más reciente. Los valores activos existentes distintos de cero siguen teniendo prioridad sobre los valores de reserva de la transcripción.
- La reserva de transcripción también puede recuperar la etiqueta del modelo de runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, el estado resuelve la ventana de contexto contra el modelo de runtime recuperado en lugar del seleccionado.
- Para el cálculo del tamaño del prompt, la reserva de transcripción prefiere el total más grande orientado al prompt cuando faltan metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no se reduzcan a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesiones por agente cuando se configuran varios agentes.
- La vista general incluye el estado de instalación/runtime del servicio de host Gateway + Node cuando está disponible.
- La vista general incluye el canal de actualización + el SHA de git (para checkouts desde el código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, el estado imprime una sugerencia para ejecutar `openclaw update` (consulta [actualización](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando es posible.
- Si se configura una SecretRef de canal compatible pero no está disponible en la ruta del comando actual, el estado permanece en solo lectura e informa una salida degradada en lugar de fallar. La salida para humanos muestra advertencias como “token configurado no disponible en esta ruta de comando”, y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución de SecretRef local del comando se completa correctamente, el estado prefiere la instantánea resuelta y borra los marcadores transitorios de canal de “secreto no disponible” de la salida final.
- `status --all` incluye una fila de vista general de secretos y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
