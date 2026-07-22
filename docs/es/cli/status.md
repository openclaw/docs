---
read_when:
    - Se busca un diagnóstico rápido del estado de los canales y de los destinatarios de sesiones recientes
    - Se necesita un estado «all» que se pueda pegar para depurar.
summary: Referencia de la CLI para `openclaw status` (diagnósticos, sondeos, instantáneas de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-07-22T10:29:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52e8076339216f11ddadf35e0ae8e5604322a47a5a9e2ee305468b2624d7cfde
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

| Indicador               | Descripción                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Diagnóstico completo (solo lectura, apto para pegar). Incluye auditoría de seguridad, compatibilidad de plugins y sondeos de vectores de memoria. |
| `--deep`                | Ejecuta sondeos en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal). También habilita la auditoría de seguridad.       |
| `--usage`               | Muestra las ventanas normalizadas de uso del proveedor como `X% left`.                                                |
| `--json`                | Salida legible por máquina.                                                                                                    |
| `--verbose` / `--debug` | También muestra la resolución sin procesar del destino del Gateway antes del informe.                                          |

El comando `openclaw status` sin opciones permanece en la ruta rápida de solo lectura y marca la memoria como
`not checked` en lugar de no disponible cuando omite la inspección de la memoria. La auditoría
de seguridad exhaustiva, la compatibilidad de plugins y los sondeos de vectores de memoria se reservan para
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
y `openclaw memory status --deep`.

## Resolución de sesiones y modelos

- La salida del estado de la sesión distingue `Execution:` de `Runtime:`. `Execution`
  es la ruta del entorno aislado (`direct`, `docker/*`), mientras que `Runtime` indica
  si la sesión utiliza `OpenClaw Default`, `OpenAI Codex`, un backend de
  CLI o un backend de ACP como `codex (acp/acpx)`. Consulte
  [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) para conocer la distinción
  entre proveedor, modelo y entorno de ejecución.
- Cuando la instantánea de la sesión actual contiene pocos datos, `/status` puede completar los contadores
  de tokens y caché a partir del registro de uso de la transcripción más reciente. Los valores activos
  distintos de cero siguen teniendo prioridad sobre los valores alternativos de la transcripción.
- La alternativa basada en la transcripción también puede recuperar la etiqueta del modelo activo del entorno de ejecución cuando
  falta en la entrada de la sesión activa. Si ese modelo de la transcripción difiere
  del modelo seleccionado, el estado resuelve la ventana de contexto con respecto al
  modelo de ejecución recuperado en lugar del seleccionado.
- Para contabilizar el tamaño del prompt, la alternativa basada en la transcripción prefiere el total mayor
  orientado al prompt cuando faltan los metadatos de la sesión o su valor es menor, para que
  las sesiones de proveedores personalizados no se reduzcan a representaciones de `0` tokens.
- Cuando una sesión está fijada a un modelo distinto del principal configurado,
  el estado muestra ambos valores, el motivo (`session override`) y
  la sugerencia `/model default`. El principal configurado se aplica a las sesiones nuevas o
  no fijadas; las sesiones fijadas existentes conservan su selección de sesión
  hasta que se borre.
- La salida incluye los almacenes de sesiones de cada agente cuando hay varios agentes
  configurados.

## Uso y cuota

- `--usage` muestra las ventanas normalizadas de uso del proveedor como `X% left`.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante,
  por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en recuentos tienen prioridad cuando
  están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la
  etiqueta de la ventana de las marcas de tiempo cuando es necesario e incluyen el nombre del modelo en
  la etiqueta del plan.
- Los errores al actualizar los precios de los modelos se muestran como advertencias opcionales sobre precios.
  No indican que el Gateway o los canales estén en mal estado.

## Resumen y estado de actualización

- El resumen incluye el estado de instalación y ejecución del servicio de host del Gateway y del Node cuando
  está disponible, además del tiempo de actividad compacto del proceso del Gateway y del sistema host.
- El resumen incluye el canal de actualización y el SHA de git (para los checkouts del código fuente).
- La información de actualización aparece en el Resumen; si hay una actualización disponible, el estado
  muestra una sugerencia para ejecutar `openclaw update` (consulte [Actualización](/es/install/updating)).

## Secretos

- Cuando el Gateway en ejecución tiene algún propietario de SecretRef aislado debido al inicio, una recarga o una escritura de configuración, el estado incluye `degradedSecretOwners` en JSON y una fila **Secretos degradados** en el resumen de la salida para personas. Cada entrada indica el propietario, el estado de degradación (`cold` o `stale`), las rutas de configuración y el motivo censurado. Los propietarios fríos no están disponibles; los propietarios obsoletos continúan con los últimos valores válidos conocidos.
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`)
  resuelven las SecretRefs compatibles para las rutas de configuración especificadas cuando
  es posible.
- Si se configura una SecretRef de canal compatible, pero no está disponible en la
  ruta del comando actual, el estado permanece en modo de solo lectura e informa de una salida degradada
  en lugar de fallar. La salida para personas muestra advertencias como «el token configurado
  no está disponible en esta ruta de comando» y la salida JSON incluye
  `secretDiagnostics`.
- Cuando la resolución de SecretRef local del comando se realiza correctamente, el estado prefiere la
  instantánea resuelta y elimina de la salida final los marcadores transitorios
  de canal «secreto no disponible».
- `status --all` incluye una fila Secretos en el resumen y una sección de diagnóstico
  que resume los diagnósticos de secretos (truncados para facilitar la lectura) sin
  detener la generación del informe.

## Memoria

`status --json --all` informa de los detalles de la memoria procedentes del entorno de ejecución del plugin de memoria activo
seleccionado por `plugins.slots.memory`. Los plugins de memoria personalizados pueden dejar
deshabilitado el componente integrado `memory.search.enabled` y aun así informar
de sus propios archivos, fragmentos, vectores y estado de FTS.

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
