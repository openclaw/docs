---
read_when:
    - Ejecutaste `clawhub package validate` y necesitas corregir los problemas detectados en el plugin
    - ClawHub rechazó o mostró una advertencia al publicar un paquete de Plugin
    - Estás actualizando los metadatos del paquete del Plugin antes del lanzamiento
summary: Corrige los problemas de validación de paquetes de Plugin de ClawHub antes de publicar
title: Correcciones de validación de plugins
x-i18n:
    generated_at: "2026-07-11T22:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correcciones de validación de plugins

ClawHub valida los paquetes de plugins antes de publicarlos y también puede mostrar hallazgos de análisis automatizados de paquetes. Esta página abarca los hallazgos dirigidos a los autores, es decir, aquellos que el autor del plugin puede corregir en los metadatos del paquete, el manifiesto, las importaciones del SDK o el artefacto publicado.

No abarca los hallazgos internos de cobertura de Plugin Inspector. Si un informe completo contiene códigos de mantenimiento del analizador sin instrucciones de corrección para el autor, están destinados a los responsables de mantenimiento de OpenClaw, no a los autores de plugins.

Después de aplicar cualquier corrección, vuelve a ejecutar:

```bash
clawhub package validate <path-to-plugin>
```

## Hallazgos dirigidos a los autores

| Código                                    | Empieza aquí                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Añadir metadatos del paquete](/es/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Añadir el bloque openclaw del paquete](/es/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Declarar los puntos de entrada del paquete de OpenClaw](/es/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publicar el punto de entrada declarado](/es/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completar los metadatos de instalación](/es/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Declarar la compatibilidad con la API de plugins](/es/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Alinear la versión mínima del host](/es/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Alinear las versiones del paquete y del manifiesto](/es/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Eliminar metadatos no compatibles del paquete de OpenClaw](/es/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Permitir empaquetar el artefacto de npm](/es/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Incluir los puntos de entrada en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Incluir los metadatos en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Añadir un nombre para mostrar al manifiesto](/es/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Eliminar campos no compatibles del manifiesto](/es/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Eliminar claves de contrato no compatibles](/es/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sustituir las importaciones de la raíz del SDK](/es/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Eliminar importaciones reservadas del SDK](/es/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sustituir el acceso al almacén completo de sesiones](/es/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sustituir las escrituras en el almacén completo de sesiones](/es/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sustituir los auxiliares de rutas de archivos de sesión](/es/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sustituir los destinos heredados de archivos de transcripción](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sustituir los auxiliares de transcripción de bajo nivel](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sustituir before_agent_start](/es/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Trasladar las variables de entorno del proveedor a los metadatos de configuración](/es/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Reflejar las variables de entorno del canal en los metadatos actuales](/es/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Eliminar referencias a esquemas de manifiestos de seguridad no disponibles](/es/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Eliminar archivos de manifiestos de seguridad no compatibles](/es/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadatos del paquete

### package-json-missing

La raíz del paquete no incluye `package.json`, por lo que ClawHub no puede identificar el paquete npm, la versión, los puntos de entrada ni los metadatos de OpenClaw.

- Añade `package.json` con `name`, `version` y `type`.
- Añade un bloque `openclaw` cuando el paquete distribuya un plugin de OpenClaw.
- Consulta [Creación de plugins](/es/plugins/building-plugins) para ver un ejemplo mínimo de paquete y [Manifiesto del plugin](/es/plugins/manifest#manifest-versus-packagejson) para conocer la separación entre el paquete y el manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

El paquete tiene `package.json`, pero no declara los metadatos del paquete de OpenClaw.

- Añade `package.json#openclaw`.
- Incluye metadatos de puntos de entrada como `openclaw.extensions` u `openclaw.runtimeExtensions`.
- Añade metadatos de compatibilidad e instalación cuando el paquete se vaya a publicar o instalar mediante ClawHub.
- Consulta [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Los metadatos del paquete existen, pero no declaran un punto de entrada de ejecución de OpenClaw.

- Añade `openclaw.extensions` para los puntos de entrada nativos del plugin.
- Añade `openclaw.runtimeExtensions` cuando el paquete publicado deba cargar JavaScript compilado.
- Mantén todas las rutas de los puntos de entrada dentro del directorio del paquete.
- Consulta [Puntos de entrada del plugin](/es/plugins/sdk-entrypoints) y [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

El paquete declara un punto de entrada de OpenClaw, pero falta el archivo referenciado en el paquete que se está validando.

- Comprueba cada ruta de `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` y `openclaw.runtimeSetupEntry`.
- Compila el paquete si el punto de entrada se genera en `dist`.
- Actualiza los metadatos si se ha movido el punto de entrada.
- Consulta [Puntos de entrada del plugin](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub no puede determinar cómo debe instalarse o actualizarse el paquete.

- Completa `openclaw.install` con el origen de instalación compatible, como `clawhubSpec`, `npmSpec` o `localPath`.
- Define `openclaw.install.defaultChoice` cuando haya más de un origen de instalación disponible.
- Usa `openclaw.install.minHostVersion` para la versión mínima del host de OpenClaw.
- Consulta [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

El paquete no declara el intervalo de versiones de la API de plugins de OpenClaw que admite.

- Añade `openclaw.compat.pluginApi` a `package.json`.
- Usa la versión de la API de plugins de OpenClaw o la versión mínima de semver con la que compilaste y realizaste las pruebas.
- Mantenla separada de la versión del paquete. La versión del paquete describe la versión publicada del plugin; `openclaw.compat.pluginApi` describe el contrato de la API del host.
- Consulta [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versión mínima del host del paquete no coincide con los metadatos de la versión de OpenClaw con la que se compiló el paquete.

- Comprueba `openclaw.install.minHostVersion`.
- Comprueba los metadatos de compilación de OpenClaw en el paquete, como la versión de OpenClaw utilizada durante la publicación.
- Alinea la versión mínima del host con el intervalo de versiones del host que el paquete admite realmente.
- Consulta [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versión del paquete y la versión del manifiesto del plugin no coinciden.

- Usa preferentemente `package.json#version` como versión de publicación del paquete.
- Si `openclaw.plugin.json` también tiene `version`, actualízala para que coincida o elimina los metadatos obsoletos de la versión del manifiesto cuando los metadatos del paquete sean la fuente autoritativa.
- Publica una nueva versión del paquete después de cambiar metadatos ya publicados.
- Consulta [Manifiesto del plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

El bloque `package.json#openclaw` contiene campos que no son metadatos compatibles del paquete de OpenClaw.

- Elimina los campos no compatibles, como `openclaw.bundle`.
- Mantén los metadatos del plugin nativo en `openclaw.plugin.json`.
- Mantén los metadatos de puntos de entrada, compatibilidad, instalación, configuración y catálogo del paquete en los campos compatibles de `package.json#openclaw`.
- Consulta [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Artefacto publicado

### package-npm-pack-unavailable

El paquete no puede empaquetarse en el artefacto que ClawHub inspeccionaría o publicaría.

- Ejecuta `npm pack --dry-run` desde la raíz del paquete.
- Corrige los metadatos no válidos del paquete, los scripts del ciclo de vida defectuosos o las entradas de archivos que impiden el empaquetado.
- Elimina `private: true` si este paquete está destinado a publicarse públicamente.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

El paquete se puede empaquetar, pero el artefacto empaquetado no incluye los archivos de puntos de entrada declarados en `package.json#openclaw`.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos que se incluirían.
- Compila los puntos de entrada generados antes de empaquetar.
- Actualiza `files`, `.npmignore` o la salida de compilación para que se incluyan los puntos de entrada declarados.
- Consulta [Puntos de entrada del plugin](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Al artefacto empaquetado le faltan metadatos de OpenClaw que existen en el paquete fuente.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos de metadatos incluidos.
- Asegúrate de que `package.json` incluya el bloque `openclaw` en el artefacto empaquetado.
- Asegúrate de que `openclaw.plugin.json` esté incluido cuando el paquete sea un plugin nativo de OpenClaw.
- Actualiza `files` o `.npmignore` para que no se excluyan los metadatos del paquete.
- Consulta [Creación de plugins](/es/plugins/building-plugins).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Metadatos del manifiesto

### manifest-name-missing

El manifiesto nativo del plugin no incluye un nombre para mostrar.

- Añade un campo `name` no vacío a `openclaw.plugin.json`.
- Mantén `name` legible para las personas y conserva `id` como identificador estable para la máquina.
- Consulta [Manifiesto del plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

El manifiesto del plugin contiene campos de nivel superior que OpenClaw no admite.

- Compara cada campo de nivel superior con la
  [referencia de campos del manifiesto](/es/plugins/manifest#top-level-field-reference).
- Elimina los campos personalizados de `openclaw.plugin.json`.
- Mueve los metadatos del paquete o de instalación a campos compatibles de `package.json#openclaw`
  en lugar de incluirlos en el manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

El manifiesto declara claves no compatibles dentro de `contracts`.

- Compara cada clave de `contracts` con la
  [referencia de contratos](/es/plugins/manifest#contracts-reference).
- Elimina las claves de contrato no compatibles.
- Mueve el comportamiento en tiempo de ejecución al código de registro del plugin y limita `contracts`
  a metadatos estáticos sobre la propiedad de capacidades.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Migración del SDK y de compatibilidad

### legacy-root-sdk-import

El plugin importa desde el módulo raíz obsoleto del SDK:
`openclaw/plugin-sdk`.

- Sustituye las importaciones desde el módulo raíz por importaciones específicas desde subrutas públicas.
- Usa `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` para las funciones auxiliares de puntos de entrada de canales.
- Consulta [Convenciones de importación](/es/plugins/building-plugins#import-conventions) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) para encontrar la importación específica.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

El plugin importa una ruta del SDK reservada para plugins incluidos o para compatibilidad
interna.

- Sustituye las importaciones internas reservadas del SDK de OpenClaw por subrutas públicas documentadas de
  `openclaw/plugin-sdk/*`.
- Si el comportamiento no dispone de un SDK público, mantén la función auxiliar dentro de tu paquete o
  solicita una API pública de OpenClaw.
- Consulta [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) y
  [Migración del SDK](/es/plugins/sdk-migration) para elegir una importación compatible.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

El plugin todavía utiliza la función auxiliar obsoleta para todo el almacén de sesiones
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` para leer el
  estado de la sesión.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` para escribir el
  estado de la sesión.
- Evita cargar, modificar y guardar el objeto completo del almacén de sesiones.
- Conserva `loadSessionStore(...)` solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

El plugin todavía utiliza una función auxiliar obsoleta para escribir todo el almacén de sesiones, como
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` para actualizar campos de una entrada de sesión
  existente.
- Usa `upsertSessionEntry(...)` para sustituir o crear una entrada de sesión.
- Evita cargar, modificar y guardar el objeto completo del almacén de sesiones.
- Conserva las funciones auxiliares de escritura del almacén completo solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que las requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

El plugin todavía utiliza funciones auxiliares obsoletas para rutas de archivos de sesión, como
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` para leer los metadatos de la sesión según la identidad
  del agente y de la sesión.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` para conservar los metadatos
  de la sesión.
- Usa funciones auxiliares de identidad o destino de transcripción cuando el código prepare una
  operación de transcripción.
- No conserves ni uses rutas de archivos de transcripción heredadas.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

El plugin todavía utiliza la función auxiliar obsoleta de destino de archivo de transcripción
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` cuando el código solo necesite la identidad pública
  de la sesión.
- Usa `resolveSessionTranscriptTarget(...)` cuando el código necesite un destino estructurado
  para una operación de transcripción.
- Evita leer o construir directamente destinos de archivos de transcripción heredados.
- Conserva la función auxiliar heredada solo mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que la requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

El plugin todavía utiliza funciones auxiliares de transcripción obsoletas de bajo nivel, como
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` para añadir contenido a las transcripciones.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` para las notificaciones de actualización
  de transcripciones.
- Da preferencia a la interfaz estructurada de transcripción en tiempo de ejecución para que OpenClaw pueda aplicar los
  límites de transacción y la gestión de identidades correctos.
- Conserva las funciones auxiliares de transcripción de bajo nivel solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que las requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

El plugin todavía utiliza el enlace heredado `before_agent_start`.

- Mueve las operaciones de sustitución del modelo o proveedor a `before_model_resolve`.
- Mueve las operaciones de modificación del prompt o del contexto a `before_prompt_build`.
- Conserva `before_agent_start` solo mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [Enlaces](/es/plugins/hooks) y
  [Compatibilidad de plugins](/es/plugins/compatibility).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

El manifiesto todavía utiliza los metadatos heredados de autenticación del proveedor `providerAuthEnvVars`.

- Replica los metadatos de las variables de entorno del proveedor en `setup.providers[].envVars`.
- Conserva `providerAuthEnvVars` únicamente como metadatos de compatibilidad mientras el intervalo de versiones de
  OpenClaw admitido todavía lo necesite.
- Consulta la [referencia de configuración](/es/plugins/manifest#setup-reference) y
  [Migración del SDK](/es/plugins/sdk-migration).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### channel-env-vars

El manifiesto utiliza metadatos heredados o antiguos de variables de entorno del canal sin los metadatos actuales
de configuración que espera ClawHub.

- Mantén declarativos los metadatos de las variables de entorno del canal para que OpenClaw pueda inspeccionar el estado de configuración
  sin cargar el entorno de ejecución del canal.
- Replica la configuración del canal controlada por variables de entorno en la configuración actual, en la configuración del canal o en
  los metadatos de canal del paquete utilizados por la estructura de tu plugin.
- Conserva `channelEnvVars` únicamente como metadatos de compatibilidad mientras las versiones anteriores admitidas de
  OpenClaw todavía lo requieran.
- Consulta [Manifiesto del plugin](/es/plugins/manifest) y
  [Plugins de canal](/es/plugins/sdk-channel-plugins).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Manifiesto de seguridad

### security-manifest-schema-unavailable

El paquete incluye `openclaw.security.json` con una referencia de esquema que ClawHub
no reconoce como disponible.

- Elimina la URL del esquema si solo tiene carácter consultivo.
- Usa un esquema versionado y documentado únicamente después de que OpenClaw publique uno.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

El paquete incluye un archivo de manifiesto de seguridad no compatible.

- Elimina `openclaw.security.json` hasta que OpenClaw documente un esquema versionado de manifiesto de seguridad
  y el comportamiento de ClawHub.
- Mantén documentado el comportamiento relacionado con la seguridad en la documentación pública de tu paquete o en el
  README hasta que exista el contrato del manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Contenido relacionado

- [CLI de ClawHub](/es/clawhub/cli)
- [Publicación en ClawHub](/es/clawhub/publishing)
- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto del plugin](/es/plugins/manifest)
- [Puntos de entrada del plugin](/es/plugins/sdk-entrypoints)
- [Compatibilidad de plugins](/es/plugins/compatibility)
