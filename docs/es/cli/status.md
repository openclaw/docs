---
read_when:
    - Quieres un diagnóstico rápido del estado de los canales y de los destinatarios recientes de sesiones
    - Quieres un estado “all” copiable para depuración
summary: Referencia de la CLI para `openclaw status` (diagnósticos, comprobaciones, instantáneas de uso)
title: Estado
x-i18n:
    generated_at: "2026-04-24T05:24:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
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
- `--usage` imprime ventanas de uso normalizadas como `X% left`.
- La salida de estado de la sesión ahora separa `Runtime:` de `Runner:`. `Runtime` es la ruta de ejecución y el estado del sandbox (`direct`, `docker/*`), mientras que `Runner` te indica si la sesión usa Pi integrado, un proveedor respaldado por CLI o un backend de arnés ACP como `codex (acp/acpx)`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo prevalecen cuando están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de marcas de tiempo cuando es necesario e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea actual de la sesión es escasa, `/status` puede rellenar contadores de tokens y caché a partir del registro de uso de transcript más reciente. Los valores activos no cero existentes siguen prevaleciendo sobre los valores de respaldo del transcript.
- El respaldo de transcript también puede recuperar la etiqueta activa del modelo de runtime cuando falta en la entrada de la sesión en vivo. Si ese modelo del transcript difiere del modelo seleccionado, status resuelve la ventana de contexto contra el modelo de runtime recuperado en lugar del seleccionado.
- Para la contabilidad del tamaño del prompt, el respaldo de transcript prefiere el total orientado al prompt más grande cuando faltan metadatos de sesión o son menores, de modo que las sesiones de proveedores personalizados no colapsen a visualizaciones de `0` tokens.
- La salida incluye almacenes de sesiones por agente cuando hay varios agentes configurados.
- El resumen incluye el estado de instalación/ejecución del servicio Gateway + host Node cuando está disponible.
- El resumen incluye el canal de actualización + git SHA (para checkouts del código fuente).
- La información de actualización aparece en el resumen; si hay una actualización disponible, status imprime una sugerencia para ejecutar `openclaw update` (consulta [Updating](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando es posible.
- Si un SecretRef de canal compatible está configurado pero no está disponible en la ruta del comando actual, status sigue siendo de solo lectura e informa una salida degradada en lugar de fallar. La salida legible para humanos muestra advertencias como «configured token unavailable in this command path», y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución local de SecretRef del comando tiene éxito, status prefiere la instantánea resuelta y elimina del resultado final los marcadores transitorios de canal “secret unavailable”.
- `status --all` incluye una fila de resumen de Secrets y una sección de diagnóstico que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
