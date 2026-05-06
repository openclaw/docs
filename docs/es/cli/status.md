---
read_when:
    - Quieres un diagnóstico rápido del estado de los canales + los destinatarios de sesiones recientes
    - Desea un estado "all" que se pueda pegar para depuración
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:02:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
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
- El `openclaw status` simple se mantiene en la ruta rápida de solo lectura y marca la memoria como `not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de seguridad pesada, la compatibilidad de plugins y los sondeos de vectores de memoria quedan para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` y `openclaw memory status --deep`.
- `status --json --all` informa detalles de memoria desde el runtime del Plugin de memoria activo seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar deshabilitado el `agents.defaults.memorySearch.enabled` integrado y aun así informar sus propios archivos, fragmentos, vectores y estado de FTS.
- `--usage` imprime las ventanas de uso normalizadas del proveedor como `X% left`.
- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta del sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP como `codex (acp/acpx)`. Consulta [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) para ver la distinción entre proveedor/modelo/runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando están presentes. Las respuestas de `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede rellenar los contadores de tokens y caché desde el registro de uso de transcripción más reciente. Los valores en vivo distintos de cero existentes siguen teniendo prioridad sobre los valores de reserva de la transcripción.
- `/status` incluye el tiempo de actividad compacto del proceso Gateway y el tiempo de actividad del sistema host.
- La reserva de transcripción también puede recuperar la etiqueta del modelo del runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, el estado resuelve la ventana de contexto respecto al modelo de runtime recuperado en lugar del seleccionado.
- Para la contabilidad del tamaño del prompt, la reserva de transcripción prefiere el total más grande orientado a prompts cuando faltan los metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no se reduzcan a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.
- La vista general incluye el estado de instalación/runtime del servicio host Gateway + Node cuando está disponible.
- La vista general incluye el canal de actualización + SHA de git (para checkouts de código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, el estado imprime una sugerencia para ejecutar `openclaw update` (consulta [Actualizar](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando es posible.
- Si un SecretRef de canal compatible está configurado pero no está disponible en la ruta de comando actual, el estado permanece de solo lectura e informa una salida degradada en lugar de fallar. La salida para humanos muestra advertencias como "token configurado no disponible en esta ruta de comando", y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución de SecretRef local del comando se realiza correctamente, el estado prefiere la instantánea resuelta y borra los marcadores transitorios de canal "secreto no disponible" de la salida final.
- `status --all` incluye una fila de vista general de secretos y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para mejorar la legibilidad) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
