---
read_when:
    - Estás implementando clawdbot-d63.2 / clawdbot-04b
    - Está modificando la retención, el restablecimiento o la eliminación de sesiones de SQLite, o el archivado de la eliminación de agentes.
    - Debe distinguir las familias de artefactos de la era de SQLite de los archivos auxiliares JSONL heredados
summary: Plan de la ruta 3 para archivar todos los artefactos de transcripción de SQLite que pertenecen a una sesión
title: Familia de artefactos de sesión SQLite de la ruta 3
x-i18n:
    generated_at: "2026-07-12T14:38:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Familia de artefactos de sesión SQLite de la ruta 3

Esta nota delimita `clawdbot-d63.2`, mientras que `clawdbot-d63.1` se ocupa del helper de archivado solapado para restablecimiento/eliminación en `src/config/sessions/session-accessor.sqlite.ts`.
El archivo de implementación tenía cambios sin confirmar durante esta pasada, por lo que este artefacto registra el contrato exacto y los puntos de modificación sin interferir con el trabajo del agente paralelo.

## Familia autoritativa

Tras el cambio a SQLite, las transcripciones de sesiones activas son filas de SQLite. La familia de archivado de una sesión es:

- Las filas de `transcript_events`, `transcript_event_identities` y `sessions`
  correspondientes al `sessionId` actual de la entrada.
- El mismo conjunto de filas de transcripción de SQLite para cada `sessionId` al que haga referencia
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- El mismo conjunto de filas de transcripción de SQLite para cada `sessionId` al que haga referencia
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- El mismo conjunto de filas de transcripción de SQLite para cada `sessionId` incluido en
  `entry.usageFamilySessionIds`.

Archive únicamente las filas a las que ya no haga referencia ninguna fila
`session_entries` restante ni los metadatos de Compaction o de la familia de uso de ninguna entrada restante. Esto conserva el estado de bifurcación/restauración de los puntos de control y de acumulación de uso hasta que desaparezca la última referencia activa.

## Artefactos ajenos a la familia tras el cambio

Las variantes generadas de archivos de transcripción por tema y los archivos auxiliares de trayectoria no forman parte del estado de ejecución activo de SQLite. Son artefactos de archivos heredados:

- Las variantes de tema, como `<sessionId>-topic-<thread>.jsonl`, solo existen para el
  formato de transcripción basado en archivos. SQLite utiliza el identificador de sesión canónico junto con
  `session_routes` y los metadatos de entrega de la entrada, en lugar de archivos JSONL por tema.
- Los archivos auxiliares de trayectoria, como `.trajectory.jsonl` y `.trajectory-path.json`,
  se nombran a partir de rutas `sessionFile` de archivos JSONL reales. Los valores `sessionFile` de SQLite son
  marcadores `sqlite:<agentId>:<sessionId>:<storePath>` y no designan archivos
  auxiliares.
- Los lectores del nivel de archivo deben seguir leyendo los archivos JSONL heredados archivados, pero
  la retención en tiempo de ejecución no debe examinar los directorios de sesiones activas ni volver a abrir archivos de
  transcripción JSONL para sesiones SQLite.

La importación de Doctor sigue siendo la responsable de la migración de los archivos JSONL principales heredados y
sus archivos auxiliares de trayectoria adyacentes. La retención de SQLite en tiempo de ejecución no debe añadir un
segundo importador ni un mecanismo alternativo basado en archivos.

## Puntos de modificación

Amplíe el helper de archivado de SQLite introducido por `clawdbot-d63.1` en lugar de
añadir una ruta paralela.

1. Añada un recopilador local cerca de `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Incluya `entry.sessionId`, los identificadores de sesión previos/posteriores de los puntos de control y
     `usageFamilySessionIds`.
   - Filtre las cadenas vacías y elimine duplicados de forma determinista.

2. Añada un recopilador de referencias para el almacén posterior a la eliminación:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Recorra las filas `session_entries` actuales, analice cada `entry_json` y recopile
     los mismos identificadores de familia de cada entrada superviviente.

3. Cambie los invocadores de restablecimiento/eliminación/mantenimiento que actualmente archivan un único
   `sessionId` eliminado para que pasen la familia completa de la entrada eliminada.

4. Para cada identificador de familia, archive las filas de transcripción de SQLite con el motivo del invocador
   (`reset` o `deleted`) y, a continuación, elimine la fila `sessions` únicamente cuando el
   identificador de familia no esté presente en el conjunto de referencias posterior a la eliminación.

5. Mantenga centralizada la eliminación de eventos de transcripción mediante la ruta existente de limpieza de filas
   de sesión de SQLite. No añada lecturas de archivos JSONL activos.

## Pruebas específicas

Añada pruebas exclusivas para SQLite a `src/config/sessions/session-accessor.conformance.test.ts`
o a la prueba paralela del ciclo de vida después de que se confirme `clawdbot-d63.1`:

- Al eliminar una entrada con una transcripción anterior a la Compaction, se archivan tanto la sesión actual
  como la sesión anterior a la Compaction y, a continuación, se eliminan ambos conjuntos de filas de SQLite.
- Al eliminar una de dos entradas que comparten una sesión anterior a la Compaction, no se archiva
  nada de la sesión anterior compartida hasta que se elimine la última entrada que hace
  referencia a ella.
- Al eliminar una entrada con `usageFamilySessionIds`, se archivan las filas de transcripción de SQLite
  predecesoras cuando ninguna otra entrada hace referencia a esa familia de uso.
- Una clave de sesión con forma de tema y un marcador de SQLite no provoca ninguna lectura del archivo JSONL
  de tema generado ni ninguna búsqueda de archivos auxiliares.

La verificación específica debe utilizar:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Si las pruebas finales se encuentran en `store.session-lifecycle-mutation.test.ts`, ejecute ese
archivo explícitamente con el mismo wrapper. Las comprobaciones generales de `pnpm` deben seguir ejecutándose en
Crabbox/Testbox para este árbol de trabajo de Codex.
