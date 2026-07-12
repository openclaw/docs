---
read_when:
    - Quieres un diagnóstico rápido del estado de los canales y de los destinatarios de sesiones recientes
    - Quieres un estado «all» que puedas pegar para depurar
summary: Referencia de la CLI para `openclaw status` (diagnósticos, comprobaciones, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-11T23:01:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnóstico de canales y sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Opción                  | Descripción                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Diagnóstico completo (solo lectura, apto para copiar y pegar). Incluye auditoría de seguridad, compatibilidad de plugins y comprobaciones de vectores de memoria. |
| `--deep`                | Ejecuta comprobaciones en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal). También habilita la auditoría de seguridad. |
| `--usage`               | Muestra las ventanas normalizadas de uso del proveedor como `X% restante`.                                                      |
| `--json`                | Salida legible por máquinas.                                                                                                   |
| `--verbose` / `--debug` | También muestra la resolución sin procesar del destino del Gateway antes del informe.                                          |

La ejecución simple de `openclaw status` permanece en la ruta rápida de solo lectura y marca la memoria como
`no comprobada` en lugar de no disponible cuando omite su inspección. Las comprobaciones intensivas de
auditoría de seguridad, compatibilidad de plugins y vectores de memoria quedan a cargo de
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
y `openclaw memory status --deep`.

## Resolución de sesiones y modelos

- La salida de estado de la sesión separa `Ejecución:` de `Entorno de ejecución:`. `Ejecución`
  es la ruta del entorno aislado (`direct`, `docker/*`), mientras que `Entorno de ejecución` indica
  si la sesión utiliza `OpenClaw predeterminado`, `OpenAI Codex`, un backend de CLI
  o un backend de ACP como `codex (acp/acpx)`. Consulta
  [Entornos de ejecución del agente](/es/concepts/agent-runtimes) para conocer la distinción
  entre proveedor, modelo y entorno de ejecución.
- Cuando la instantánea de la sesión actual contiene pocos datos, `/status` puede completar los contadores
  de tokens y caché a partir del registro de uso más reciente de la transcripción. Los valores activos
  distintos de cero siguen teniendo prioridad sobre los valores de respaldo de la transcripción.
- El respaldo de la transcripción también puede recuperar la etiqueta del modelo activo del entorno de ejecución cuando
  falta en la entrada de la sesión en vivo. Si ese modelo de la transcripción difiere
  del modelo seleccionado, el estado resuelve la ventana de contexto según el
  modelo recuperado del entorno de ejecución, en lugar del seleccionado.
- Para contabilizar el tamaño del prompt, el respaldo de la transcripción prefiere el total mayor
  orientado al prompt cuando faltan los metadatos de la sesión o son menores, de modo que
  las sesiones de proveedores personalizados no se reduzcan a mostrar `0` tokens.
- Cuando una sesión está fijada a un modelo distinto del principal configurado,
  el estado muestra ambos valores, el motivo (`anulación de sesión`) y
  la sugerencia `/model default`. El modelo principal configurado se aplica a sesiones nuevas o
  no fijadas; las sesiones fijadas existentes conservan su selección
  hasta que se borre.
- La salida incluye los almacenes de sesiones de cada agente cuando hay varios agentes
  configurados.

## Uso y cuota

- `--usage` muestra las ventanas normalizadas de uso del proveedor como `X% restante`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante,
  por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuentos tienen prioridad cuando
  están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la
  etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en
  la etiqueta del plan.
- Los errores de actualización de precios de los modelos se muestran como advertencias opcionales sobre precios.
  No significan que el Gateway o los canales tengan problemas.

## Resumen y estado de actualización

- El resumen incluye el estado de instalación y ejecución del servicio del host del Gateway y del Node cuando
  está disponible, además de un tiempo de actividad compacto del proceso del Gateway y del sistema host.
- El resumen incluye el canal de actualización y el SHA de git (para copias de trabajo del código fuente).
- La información de actualización aparece en el resumen; si hay una actualización disponible, el estado
  muestra una sugerencia para ejecutar `openclaw update` (consulta [Actualización](/es/install/updating)).

## Secretos

- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`)
  resuelven las SecretRefs compatibles para sus rutas de configuración de destino cuando
  es posible.
- Si hay una SecretRef de canal compatible configurada, pero no está disponible en la
  ruta del comando actual, el estado permanece en modo de solo lectura e informa de una salida
  degradada en lugar de fallar. La salida para personas muestra advertencias como «token configurado
  no disponible en esta ruta del comando», y la salida JSON incluye
  `secretDiagnostics`.
- Cuando la resolución local de SecretRef del comando se realiza correctamente, el estado prefiere la
  instantánea resuelta y elimina de la salida final los marcadores transitorios
  de canal de «secreto no disponible».
- `status --all` incluye una fila de resumen de secretos y una sección de diagnóstico
  que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin
  detener la generación del informe.

## Memoria

`status --json --all` informa de los detalles de memoria del entorno de ejecución del plugin de memoria activo
seleccionado mediante `plugins.slots.memory`. Los plugins de memoria personalizados pueden mantener
deshabilitado `agents.defaults.memorySearch.enabled` y aun así informar
de sus propios archivos, fragmentos, vectores y estado de FTS.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
