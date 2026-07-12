---
read_when:
    - Está demostrando el cambio al almacenamiento SQLite de la Ruta 3 en un Gateway activo
    - Debe distinguir la desviación esperada del formato JSONL heredado de los fallos de ejecución
    - Está creando o revisando el entorno de pruebas E2E de SQLite en vivo controlado por agentes
summary: Diseño para la prueba en vivo del Gateway del cambio de sesión/transcripción a SQLite de la Ruta 3
title: Arnés E2E de SQLite en vivo de la ruta 3
x-i18n:
    generated_at: "2026-07-12T14:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

El arnés E2E de SQLite en vivo de la Ruta 3 demuestra que el Gateway utiliza SQLite como
almacén canónico de sesiones y transcripciones, mientras que los archivos JSONL heredados siguen siendo
datos de entrada para la migración o material de archivo. Es un arnés de prueba para mantenedores, no una
herramienta de diagnóstico para usuarios normales.

Después de que un Gateway haya procesado tráfico posterior a la migración, la paridad con los archivos JSONL heredados
deja de ser una señal válida del estado del entorno de ejecución. Un Gateway migrado en buen estado puede tener
filas de transcripción de SQLite cuyos recuentos difieran de los archivos JSONL heredados porque los nuevos turnos
solo deben hacer avanzar SQLite. Por lo tanto, el arnés en vivo debe medir el
comportamiento del Gateway, el movimiento de filas de SQLite, la inactividad de los archivos heredados y el estado de los registros en cada
paso.

## Formato del comando

El comando en vivo previsto es:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

El comando se conecta a un Gateway que ya está en ejecución. No inicia, detiene,
importa ni vuelve a ejecutar la migración, salvo que posteriormente se añada un modo de migración
explícito. Una variante para CI o un entorno local aislado puede utilizar
`test/helpers/openclaw-test-instance.ts`, pero la ruta de prueba en vivo debe inspeccionar
el Gateway real del operador y su base de datos SQLite real por agente.

## Prueba aislada con la CLI compilada

El ejecutor de pruebas con la CLI compilada inicializa un almacén de sesiones heredado aislado, inicia el
Gateway recompilado y demuestra que, durante el inicio, se importan las sesiones heredadas activas en
SQLite antes de que comiencen las lecturas del entorno de ejecución. No debe ejecutar `openclaw doctor --fix`
antes del primer inicio del Gateway, ya que eso demostraría la ruta de migración manual
en lugar de la ruta de actualización que reciben los usuarios en el primer arranque tras el cambio.

Después de la importación durante el inicio, la prueba aislada puede ejecutar
`openclaw doctor --session-sqlite inspect` y
`openclaw doctor --session-sqlite validate` como evidencia de diagnóstico. Esos
comandos de doctor no controlan la migración en la prueba de actualización durante el inicio.
Los escenarios independientes de importación mediante doctor deben inicializar archivos de transcripción heredados junto con
archivos auxiliares de trayectoria y verificar que doctor archive esos artefactos mientras SQLite
sigue siendo canónico.

## Comprobaciones previas

Las comprobaciones previas recopilan una referencia inicial y generan un fallo antes de enviar un turno de prueba si el
Gateway no se puede utilizar:

- `GET /health` y el estado detallado del Gateway deben indicar que el
  Gateway está en ejecución y es accesible.
- Las versiones de la CLI y del Gateway deben coincidir con la rama que se está probando.
- El arnés registra un cursor de registro para el archivo de registro activo del Gateway.
- El arnés registra los recuentos de las tablas SQLite por agente para `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` y
  `session_routes`.
- El arnés registra `mtime`, `size` y la existencia de los archivos heredados
  `sessions.json`, los archivos JSONL referenciados y las posibles rutas JSONL de la sesión de prueba.
- `lsof -p <gateway-pid>` debe mostrar identificadores de la base de datos SQLite/WAL/SHM y ningún
  identificador activo de `.jsonl` ni `sessions.json`.

`openclaw doctor --session-sqlite validate` solo tiene carácter informativo en el modo en vivo.
Después del tráfico posterior al cambio, puede indicar una divergencia esperada con respecto a los archivos heredados. El
arnés debe utilizar la salida de doctor para la clasificación y el inventario de migración,
no como el criterio definitivo para aprobar o rechazar el entorno de ejecución.

## Escenario controlado por el agente

El escenario en vivo utiliza una clave de sesión dedicada para la prueba y controla el Gateway
mediante rutas RPC públicas siempre que sea posible. Un turno del agente debería bastar para
ejercitar la persistencia ordinaria, pero la prueba completa debe cubrir los puntos de integración
de 3.1b que anteriormente requerían comprobaciones individuales en vivo:

- Turno de chat ordinario: crear o reutilizar la sesión de prueba, enviar un prompt real al agente,
  esperar el resultado final del asistente y verificar `chat.history` o
  una proyección equivalente del Gateway.
- Identidad de la transcripción: verificar que el mismo marcador aparezca en el historial del Gateway y en
  las filas de transcripción de SQLite, incluidas las filas de identidad de eventos estables cuando estén presentes.
- Métodos de acceso a los metadatos de sesión: leer la sesión de prueba y determinadas sesiones existentes en vivo
  mediante los métodos de acceso del Gateway o de la sesión y compararlas con las filas de SQLite.
- Proyección de modificaciones de sesión: aplicar un cambio reversible en el modelo o los metadatos de sesión de
  la sesión de prueba y, a continuación, verificar que la fila proyectada y la respuesta del Gateway coincidan.
- Ciclo de vida de los puntos de control de Compaction: enumerar, bifurcar y restaurar un punto de control únicamente
  en la sesión de prueba o en una sesión de datos de prueba sintéticos creada por el arnés.
- Recuperación tras un reinicio: ejecutar la ruta segura de marcadores de recuperación en una sesión de prueba
  controlada o una instancia de prueba aislada; el modo en vivo solo puede ejecutar este paso cuando
  el conjunto de sesiones de destino sea explícito y reversible.
- Ciclo de vida de limpieza: eliminar o restablecer la sesión de prueba y, a continuación, verificar las filas
  del ciclo de vida de SQLite y el estado archivado de la transcripción.

Los puntos de integración específicos del transporte que no puedan ejercitarse de forma segura en el Gateway
en vivo del operador, como la entrada desde WhatsApp o llamadas de voz, deben utilizar sondas del entorno de ejecución
a nivel del propietario con el mismo contrato de SQLite, en lugar de simular el transporte externo.

## Aserciones por paso

Cada paso captura el estado anterior y posterior y escribe un registro estructurado de aserciones:

- Los recuentos de filas de SQLite solo avanzan donde se espera.
- Las filas del entorno de ejecución de trayectorias avanzan para las sesiones de prueba respaldadas por marcadores que registran
  eventos del entorno de ejecución.
- La fila de la sesión de prueba contiene los valores esperados de `session_id`, estado, marcas de tiempo,
  metadatos y filas de rutas.
- La proyección del historial o de la sesión del Gateway coincide con el final de la transcripción de SQLite.
- No se crea ni modifica ningún archivo JSONL de la sesión de prueba.
- No se crea ningún archivo auxiliar `.trajectory.jsonl`, `.trajectory-path.json` ni
  `trajectory/<session>.jsonl` derivado de marcadores para la sesión de prueba.
- Los archivos JSONL heredados existentes y `sessions.json` permanecen sin cambios, salvo que el
  paso sea explícitamente una operación de migración o archivado sin conexión.
- El proceso del Gateway no abre identificadores de `.jsonl` ni `sessions.json`.
- Los registros posteriores al cursor anterior no contienen `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, indisponibilidad del almacén de sesiones, fallo de recuperación tras un reinicio ni
  advertencia de reconciliación de transcripciones, salvo que el escenario lo incluya explícitamente en la lista de permitidos.

El análisis de los registros forma parte del contrato de aprobación o rechazo. Un Gateway que responde a las comprobaciones
de estado, pero emite errores del esquema de SQLite o fallos repetidos de reconciliación de transcripciones,
no se considera satisfactorio para la Ruta 3.

## Artefacto de evidencia

El arnés debe escribir la evidencia en `.artifacts/path3-live-e2e/<timestamp>/`
y mantenerla fuera de git:

- `summary.json`: argumentos del comando, versión del Gateway, resultado, aserción que ha fallado y
  rutas de los artefactos.
- `sqlite-before.json` y `sqlite-after.json`: recuentos de filas y filas seleccionadas de la prueba.
- `legacy-files.json`: existencia de los archivos heredados, `mtime`, tamaño y si cada
  archivo ha cambiado.
- `gateway-log-scan.json`: intervalo de cursores, líneas de registro coincidentes y decisiones de la
  lista de permitidos.
- `events.jsonl`: observaciones ordenadas por paso, adecuadas para los comentarios de prueba del PR.

La prueba del PR debe resumir estos artefactos en lugar de pegar transcripciones completas
o contenido de mensajes privados.

## Reglas de seguridad

- El modo en vivo nunca debe volver a importar archivos JSONL heredados mientras el Gateway esté en ejecución.
- El modo en vivo no debe modificar sesiones ajenas a la prueba, salvo en el caso de sondas de reparación
  explícitamente seleccionadas y reversibles.
- Cualquier paso de migración destructivo o generalizado requiere una copia de seguridad nueva de la
  base de datos SQLite y el directorio de sesiones heredadas afectados.
- Las copias de seguridad deben limitarse al directorio de la base de datos o de la sesión del agente afectado y reutilizarse
  durante una ejecución de prueba para evitar un crecimiento ilimitado del disco.
- El paso de limpieza no debe dejar ninguna sesión de prueba, archivo JSONL de prueba ni archivo heredado
  modificado, salvo que el invocador proporcione `--keep-artifacts`.

## Resultado satisfactorio

Una ejecución en vivo satisfactoria significa que el Gateway aceptó un flujo real de sesión controlado por el agente,
todo el estado canónico observado se encontraba en SQLite, los archivos heredados del entorno de ejecución permanecieron
inactivos y el estado de los registros permaneció limpio durante el intervalo medido. No significa que
la paridad con los archivos JSONL heredados permanezca intacta después del tráfico en vivo; se espera una divergencia
en vivo una vez que SQLite sea el almacén canónico.
