---
read_when:
    - Quieres un diagnóstico rápido del estado del canal y los destinatarios de sesiones recientes
    - Quieres un estado "all" que se pueda pegar para depuración
summary: Referencia de CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-05T11:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnósticos para canales y sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Flag                    | Descripción                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnóstico completo (solo lectura, apto para pegar). Incluye auditoría de seguridad, compatibilidad de plugins y comprobaciones de vectores de memoria. |
| `--deep`                | Ejecuta comprobaciones en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal). También habilita la auditoría de seguridad. |
| `--usage`               | Imprime las ventanas normalizadas de uso del proveedor como `X% left`.                                                  |
| `--json`                | Salida legible por máquina.                                                                                            |
| `--verbose` / `--debug` | También imprime la resolución sin procesar del destino de Gateway antes del informe.                                   |

`openclaw status` sin opciones permanece en la ruta rápida de solo lectura y marca la memoria como
`not checked` en lugar de no disponible cuando omite la inspección de memoria. La auditoría de
seguridad pesada, la compatibilidad de plugins y las comprobaciones de vectores de memoria quedan para
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
y `openclaw memory status --deep`.

## Resolución de sesión y modelo

- La salida de estado de sesión separa `Execution:` de `Runtime:`. `Execution`
  es la ruta de sandbox (`direct`, `docker/*`), mientras que `Runtime` indica
  si la sesión usa `OpenClaw Default`, `OpenAI Codex`, un backend de CLI
  o un backend ACP como `codex (acp/acpx)`. Consulta
  [runtimes de agentes](/es/concepts/agent-runtimes) para ver la distinción entre proveedor/modelo/runtime.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede rellenar los contadores de tokens
  y caché desde el registro de uso de transcripción más reciente. Los valores en vivo
  existentes distintos de cero siguen teniendo prioridad sobre los valores de reserva de la transcripción.
- La reserva de transcripción también puede recuperar la etiqueta del modelo runtime activo cuando
  falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere
  del modelo seleccionado, status resuelve la ventana de contexto contra el
  modelo runtime recuperado en lugar del seleccionado.
- Para la contabilidad del tamaño del prompt, la reserva de transcripción prefiere el total mayor
  orientado al prompt cuando faltan los metadatos de sesión o son menores, de modo que
  las sesiones de proveedores personalizados no colapsen a visualizaciones de `0` tokens.
- Cuando una sesión está fijada a un modelo que difiere del primario configurado,
  status imprime ambos valores, el motivo (`session override`) y
  la sugerencia `/model default`. El primario configurado se aplica a sesiones nuevas o
  sin fijar; las sesiones fijadas existentes conservan su selección de sesión
  hasta que se borra.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes
  configurados.

## Uso y cuota

- `--usage` imprime las ventanas normalizadas de uso del proveedor como `X% left`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante,
  por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando
  están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la
  etiqueta de ventana a partir de marcas de tiempo cuando es necesario e incluyen el nombre del modelo en
  la etiqueta del plan.
- Los fallos de actualización de precios de modelos se muestran como advertencias de precios opcionales.
  No significan que Gateway o los canales no estén en buen estado.

## Estado general y de actualización

- El resumen incluye el estado de instalación/runtime del servicio de host Gateway + node cuando
  está disponible, además del tiempo de actividad compacto del proceso Gateway y del sistema host.
- El resumen incluye el canal de actualización + SHA de git (para checkouts de código fuente).
- La información de actualización aparece en el resumen; si hay una actualización disponible, status
  imprime una sugerencia para ejecutar `openclaw update` (consulta [Actualizar](/es/install/updating)).

## Secretos

- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`)
  resuelven SecretRefs compatibles para sus rutas de configuración objetivo cuando
  es posible.
- Si un SecretRef de canal compatible está configurado pero no disponible en la
  ruta del comando actual, status permanece en solo lectura e informa una salida degradada
  en lugar de fallar. La salida humana muestra advertencias como "token configurado
  no disponible en esta ruta de comando", y la salida JSON incluye
  `secretDiagnostics`.
- Cuando la resolución de SecretRef local al comando tiene éxito, status prefiere la
  instantánea resuelta y borra de la salida final los marcadores transitorios de canal
  de "secreto no disponible".
- `status --all` incluye una fila de resumen de secretos y una sección de diagnóstico
  que resume los diagnósticos de secretos (truncados para mejorar la legibilidad) sin
  detener la generación del informe.

## Memoria

`status --json --all` informa detalles de memoria desde el runtime del plugin de memoria activo
seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar
deshabilitado el `agents.defaults.memorySearch.enabled` integrado y aun así informar
sus propios archivos, fragmentos, vectores y estado FTS.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
