---
read_when:
    - Quieres un diagnóstico rápido del estado del canal y de los destinatarios de sesiones recientes
    - Quieres un estado "all" listo para pegar para depuración
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T11:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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

- `--deep` ejecuta comprobaciones en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` sin opciones se mantiene en la ruta rápida de solo lectura y marca la memoria como `not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de seguridad pesada, la compatibilidad de plugins y las comprobaciones de vectores de memoria quedan para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` y `openclaw memory status --deep`.
- `status --json --all` informa detalles de memoria desde el runtime del plugin de memoria activo seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar desactivado el valor integrado `agents.defaults.memorySearch.enabled` y aun así informar sus propios archivos, fragmentos, vector y estado de FTS.
- `--usage` imprime ventanas normalizadas de uso del proveedor como `X% left`.
- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta del sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Default`, `OpenAI Codex`, un backend de CLI o un backend ACP como `codex (acp/acpx)`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes) para ver la distinción entre proveedor, modelo y runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de la ventana a partir de marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede rellenar los contadores de tokens y caché desde el registro de uso de transcripción más reciente. Los valores en vivo existentes que no sean cero siguen teniendo prioridad sobre los valores de respaldo de la transcripción.
- `/status` incluye el tiempo de actividad compacto del proceso Gateway y el tiempo de actividad del sistema host.
- El respaldo de transcripción también puede recuperar la etiqueta del modelo de runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, status resuelve la ventana de contexto contra el modelo de runtime recuperado en lugar del seleccionado.
- Cuando una sesión está fijada a un modelo que difiere del primario configurado, status imprime ambos valores, el motivo (`session override`) y la indicación clara (`/model default`). El primario configurado se aplica a sesiones nuevas o no fijadas; las sesiones fijadas existentes conservan su selección de sesión hasta que se borre.
- Para el cómputo del tamaño del prompt, el respaldo de transcripción prefiere el total más grande orientado al prompt cuando faltan los metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no se reduzcan a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.
- La vista general incluye el estado de instalación/runtime del servicio host Gateway + node cuando está disponible.
- La vista general incluye canal de actualización + SHA de git (para checkouts de código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, status imprime una indicación para ejecutar `openclaw update` (consulta [Actualización](/es/install/updating)).
- Los fallos de actualización de precios de modelos se muestran como advertencias opcionales de precios. No
  significan que el Gateway o los canales no estén en buen estado.
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando es posible.
- Si se configura un SecretRef de canal compatible pero no está disponible en la ruta del comando actual, status permanece en modo de solo lectura e informa una salida degradada en lugar de fallar. La salida para humanos muestra advertencias como "token configurado no disponible en esta ruta de comando", y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución de SecretRef local del comando se completa correctamente, status prefiere la instantánea resuelta y borra de la salida final los marcadores transitorios de canal de "secreto no disponible".
- `status --all` incluye una fila de resumen de secretos y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
