---
read_when:
    - Se necesita un diagnóstico rápido del estado de los canales y de los destinatarios de las sesiones recientes
    - Quieres un estado «all» que se pueda pegar para depurar
summary: Referencia de la CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-19T01:52:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abf35fe5e60e7fce94aacf86c009d77ac1cc993e0099d294d248e7b884a3f9dc
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

| Opción                  | Descripción                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnóstico completo (solo lectura, apto para pegar). Incluye auditoría de seguridad, compatibilidad de plugins y comprobaciones de vectores de memoria. |
| `--deep`                | Ejecuta comprobaciones en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal). También habilita la auditoría de seguridad. |
| `--usage`               | Muestra las ventanas normalizadas de uso del proveedor como `X% left`.                                               |
| `--json`                | Salida legible por máquina.                                                                                                   |
| `--verbose` / `--debug` | También muestra la resolución sin procesar del destino del Gateway antes del informe.                                         |

El comando `openclaw status` sin opciones permanece en la ruta rápida de solo lectura y marca la memoria como
`not checked` en lugar de no disponible cuando omite la inspección de la memoria. La auditoría
de seguridad exhaustiva, la compatibilidad de plugins y las comprobaciones de vectores de memoria se dejan para
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
y `openclaw memory status --deep`.

## Resolución de sesiones y modelos

- La salida del estado de la sesión distingue `Execution:` de `Runtime:`. `Execution`
  es la ruta del entorno aislado (`direct`, `docker/*`), mientras que `Runtime` indica
  si la sesión utiliza `OpenClaw Default`, `OpenAI Codex`, un backend de
  CLI o un backend de ACP como `codex (acp/acpx)`. Consulte
  [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) para conocer la distinción entre
  proveedor, modelo y entorno de ejecución.
- Cuando la instantánea de la sesión actual contiene pocos datos, `/status` puede completar los contadores
  de tokens y caché a partir del registro de uso más reciente de la transcripción. Los valores activos
  distintos de cero siguen teniendo prioridad sobre los valores alternativos de la transcripción.
- La alternativa basada en la transcripción también puede recuperar la etiqueta del modelo activo del entorno de ejecución cuando
  falta en la entrada de la sesión en vivo. Si ese modelo de la transcripción difiere
  del modelo seleccionado, el estado resuelve la ventana de contexto con respecto al
  modelo recuperado del entorno de ejecución en lugar del seleccionado.
- Para contabilizar el tamaño de las indicaciones, la alternativa basada en la transcripción prefiere el total mayor
  orientado a indicaciones cuando faltan los metadatos de la sesión o su valor es menor, de modo que
  las sesiones de proveedores personalizados no se reduzcan a visualizaciones de `0` tokens.
- Cuando una sesión está fijada a un modelo distinto del principal configurado,
  el estado muestra ambos valores, el motivo (`session override`) y
  la sugerencia `/model default`. El modelo principal configurado se aplica a las sesiones nuevas o
  no fijadas; las sesiones fijadas existentes conservan su selección de sesión
  hasta que se borre.
- La salida incluye almacenes de sesiones por agente cuando hay varios agentes
  configurados.

## Uso y cuota

- `--usage` muestra las ventanas normalizadas de uso del proveedor como `X% left`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante,
  por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuentos tienen prioridad cuando
  están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la
  etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en
  la etiqueta del plan.
- Los errores al actualizar los precios de los modelos se muestran como advertencias opcionales sobre precios.
  No significan que el Gateway o los canales tengan problemas.

## Resumen y estado de actualización

- El resumen incluye el estado de instalación y ejecución del servicio del host del Gateway y del Node cuando
  está disponible, además del tiempo de actividad compacto del proceso del Gateway y del sistema host.
- El resumen incluye el canal de actualización y el SHA de Git (para copias de trabajo del código fuente).
- La información de actualización aparece en el resumen; si hay una actualización disponible, el estado
  muestra una sugerencia para ejecutar `openclaw update` (consulte [Actualización](/es/install/updating)).

## Secretos

- Cuando el Gateway en ejecución tiene algún propietario aislado de SecretRef debido al inicio, una recarga o una escritura de configuración, el estado incluye `degradedSecretOwners` en JSON y una fila de resumen **Secretos degradados** en la salida para personas. Cada entrada indica el propietario, el estado de degradación (`cold` o `stale`), las rutas de configuración y el motivo censurado. Los propietarios inactivos no están disponibles; los propietarios obsoletos continúan utilizando los últimos valores válidos conocidos.
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`)
  resuelven las SecretRefs compatibles para sus rutas de configuración de destino cuando
  es posible.
- Si se configura una SecretRef de canal compatible, pero no está disponible en la
  ruta del comando actual, el estado permanece en modo de solo lectura e informa de una salida degradada
  en lugar de bloquearse. La salida para personas muestra advertencias como «el token configurado
  no está disponible en esta ruta del comando», y la salida JSON incluye
  `secretDiagnostics`.
- Cuando la resolución de SecretRef local al comando se realiza correctamente, el estado prefiere la
  instantánea resuelta y elimina de la salida final los marcadores transitorios del canal
  «secreto no disponible».
- `status --all` incluye una fila de resumen de Secretos y una sección de diagnóstico
  que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin
  detener la generación del informe.

## Memoria

`status --json --all` informa de los detalles de la memoria procedentes del entorno de ejecución del plugin de memoria activo
seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden mantener
deshabilitado el componente integrado `agents.defaults.memorySearch.enabled` y aun así informar
de sus propios archivos, fragmentos y estados de vectores y FTS.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
