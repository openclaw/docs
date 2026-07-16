---
read_when:
    - Ejecutaste `clawhub package validate` y necesitas corregir los hallazgos del plugin
    - ClawHub rechazó o mostró una advertencia al publicar un paquete de Plugin
    - Está actualizando los metadatos del paquete del plugin antes del lanzamiento
summary: Corregir los hallazgos de validación de paquetes de plugins de ClawHub antes de publicar
title: Correcciones de validación de plugins
x-i18n:
    generated_at: "2026-07-16T11:26:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correcciones de validación de Plugin

ClawHub valida los paquetes de plugins antes de publicarlos y también puede mostrar hallazgos de
análisis automatizados de paquetes. Esta página aborda los hallazgos dirigidos a los autores, es decir,
los hallazgos que el autor del plugin puede corregir en los metadatos del paquete, el manifiesto, las
importaciones del SDK o el artefacto publicado.

No abarca los hallazgos internos de cobertura de Plugin Inspector. Si un informe completo
contiene códigos de mantenimiento del analizador sin instrucciones de corrección para el autor,
estos están destinados a los responsables de mantenimiento de OpenClaw, no a los autores de plugins.

Después de aplicar cualquier corrección, vuelva a ejecutar:

```bash
clawhub package validate <path-to-plugin>
```

## Hallazgos dirigidos a los autores

| Código                                    | Empiece aquí                                                                                                                  |
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
| `package-npm-pack-unavailable`          | [Hacer que el artefacto npm se pueda empaquetar](/es/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Incluir los puntos de entrada en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Incluir los metadatos en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Añadir un nombre para mostrar al manifiesto](/es/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Eliminar los campos no compatibles del manifiesto](/es/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Eliminar las claves de contrato no compatibles](/es/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sustituir las importaciones raíz del SDK](/es/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Eliminar las importaciones reservadas del SDK](/es/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sustituir el acceso al almacén completo de sesiones](/es/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sustituir las escrituras en el almacén completo de sesiones](/es/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sustituir los auxiliares de rutas de archivos de sesión](/es/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sustituir los destinos heredados de archivos de transcripción](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sustituir los auxiliares de bajo nivel para transcripciones](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Sustituir before_agent_start](/es/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Mover las variables de entorno del proveedor a los metadatos de configuración](/es/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Reflejar las variables de entorno del canal en los metadatos actuales](/es/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Eliminar las referencias no disponibles al esquema del manifiesto de seguridad](/es/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Eliminar los archivos de manifiesto de seguridad no compatibles](/es/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadatos del paquete

### package-json-missing

La raíz del paquete no incluye `package.json`, por lo que ClawHub no puede identificar el
paquete npm, la versión, los puntos de entrada ni los metadatos de OpenClaw.

- Añada `package.json` con `name`, `version` y `type`.
- Añada un bloque `openclaw` cuando el paquete distribuya un plugin de OpenClaw.
- Consulte [Creación de plugins](/es/plugins/building-plugins) para ver un ejemplo mínimo de paquete
  y [Manifiesto de Plugin](/es/plugins/manifest#manifest-versus-packagejson)
  para conocer la separación entre el paquete y el manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

El paquete tiene `package.json`, pero no declara los metadatos
del paquete de OpenClaw.

- Añada `package.json#openclaw`.
- Incluya metadatos de puntos de entrada, como `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Añada metadatos de compatibilidad e instalación cuando el paquete se vaya a publicar o
  instalar mediante ClawHub.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Los metadatos del paquete existen, pero no declaran un punto de entrada
de ejecución de OpenClaw.

- Añada `openclaw.extensions` para los puntos de entrada de plugins nativos.
- Añada `openclaw.runtimeExtensions` cuando el paquete publicado deba cargar
  JavaScript compilado.
- Mantenga todas las rutas de puntos de entrada dentro del directorio del paquete.
- Consulte [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints) y
  [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

El paquete declara un punto de entrada de OpenClaw, pero falta el archivo al que se hace referencia
en el paquete que se está validando.

- Compruebe cada ruta de `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` y `openclaw.runtimeSetupEntry`.
- Compile el paquete si el punto de entrada se genera en `dist`.
- Actualice los metadatos si se ha movido el punto de entrada.
- Consulte [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub no puede determinar cómo debe instalarse o actualizarse el paquete.

- Complete `openclaw.install` con el origen de instalación compatible, como
  `clawhubSpec`, `npmSpec` o `localPath`.
- Establezca `openclaw.install.defaultChoice` cuando haya más de un origen de instalación
  disponible.
- Utilice `openclaw.install.minHostVersion` para la versión mínima del host de OpenClaw.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

El paquete no declara el intervalo de versiones de la API de plugins de OpenClaw que admite.

- Añada `openclaw.compat.pluginApi` a `package.json`.
- Utilice la versión de la API de plugins de OpenClaw o la versión mínima de semver con la que se haya compilado y probado
  el paquete.
- Mantenga este valor separado de la versión del paquete. La versión del paquete describe la
  versión del plugin; `openclaw.compat.pluginApi` describe el contrato de la API del host.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versión mínima del host del paquete no coincide con los metadatos de versión de OpenClaw
con los que se compiló el paquete.

- Compruebe `openclaw.install.minHostVersion`.
- Compruebe todos los metadatos de compilación de OpenClaw presentes en el paquete, como la versión de OpenClaw
  utilizada durante la publicación.
- Alinee la versión mínima del host con el intervalo de versiones del host que el paquete
  admite realmente.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versión del paquete y la versión del manifiesto del plugin no coinciden.

- Utilice preferentemente `package.json#version` como versión de publicación del paquete.
- Si `openclaw.plugin.json` también tiene `version`, actualícelo para que coincida o elimine
  los metadatos obsoletos de la versión del manifiesto cuando los metadatos del paquete sean la fuente autoritativa.
- Publique una nueva versión del paquete después de cambiar los metadatos publicados.
- Consulte [Manifiesto de Plugin](/es/plugins/manifest).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

El bloque `package.json#openclaw` contiene campos que no se admiten como
metadatos de paquetes de OpenClaw.

- Elimine los campos no compatibles, como `openclaw.bundle`.
- Mantenga los metadatos de plugins nativos en `openclaw.plugin.json`.
- Mantenga los puntos de entrada, la compatibilidad, la instalación, la configuración y los metadatos del catálogo del paquete
  en los campos compatibles de `package.json#openclaw`.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Artefacto publicado

### package-npm-pack-unavailable

El paquete no se puede empaquetar en el artefacto que ClawHub inspeccionaría o
publicaría.

- Ejecute `npm pack --dry-run` desde la raíz del paquete.
- Corrija los metadatos no válidos del paquete, los scripts del ciclo de vida defectuosos o las entradas de archivos que
  provocan errores al empaquetar.
- Elimine `private: true` si este paquete está destinado a su publicación pública.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

El paquete se puede empaquetar, pero el artefacto empaquetado no incluye los
archivos de puntos de entrada declarados en `package.json#openclaw`.

- Ejecute `npm pack --dry-run` e inspeccione los archivos que se incluirían.
- Compile los puntos de entrada generados antes de empaquetar.
- Actualice `files`, `.npmignore` o la salida de compilación para que se incluyan los puntos de entrada
  declarados.
- Consulte [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Al artefacto empaquetado le faltan metadatos de OpenClaw que existen en el paquete
de origen.

- Ejecute `npm pack --dry-run` e inspeccione los archivos de metadatos incluidos.
- Asegúrese de que `package.json` incluya el bloque `openclaw` en el artefacto empaquetado.
- Asegúrese de que `openclaw.plugin.json` esté incluido cuando el paquete sea un plugin nativo de
  OpenClaw.
- Actualice `files` o `.npmignore` para que no se excluyan los metadatos del paquete.
- Consulte [Creación de plugins](/es/plugins/building-plugins).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Metadatos del manifiesto

### manifest-name-missing

El manifiesto del plugin nativo no incluye un nombre para mostrar.

- Añada un campo `name` no vacío a `openclaw.plugin.json`.
- Mantenga `name` legible para las personas y `id` como identificador estable para la máquina.
- Consulte [Manifiesto del plugin](/es/plugins/manifest).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

El manifiesto del plugin tiene campos de nivel superior que OpenClaw no admite.

- Compare cada campo de nivel superior con la
  [referencia de campos del manifiesto](/es/plugins/manifest#top-level-field-reference).
- Elimine los campos personalizados de `openclaw.plugin.json`.
- Traslade los metadatos del paquete o de instalación a campos `package.json#openclaw` compatibles
  en lugar de incluirlos en el manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

El manifiesto declara claves no compatibles dentro de `contracts`.

- Compare cada clave de `contracts` con la
  [referencia de contratos](/es/plugins/manifest#contracts-reference).
- Elimine las claves de contrato no compatibles.
- Traslade el comportamiento de ejecución al código de registro del plugin y limite `contracts`
  a los metadatos estáticos de propiedad de capacidades.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Migración del SDK y de compatibilidad

### legacy-root-sdk-import

El plugin importa desde el contenedor raíz obsoleto del SDK:
`openclaw/plugin-sdk`.

- Sustituya las importaciones del contenedor raíz por importaciones específicas de subrutas públicas.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para los asistentes de punto de entrada de canales.
- Use [Convenciones de importación](/es/plugins/building-plugins#import-conventions) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) para encontrar la importación específica.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

El plugin importa una ruta del SDK reservada para plugins incluidos o para compatibilidad
interna.

- Sustituya las importaciones internas reservadas del SDK de OpenClaw por subrutas
  `openclaw/plugin-sdk/*` públicas documentadas.
- Si el comportamiento no dispone de un SDK público, mantenga el asistente dentro de su paquete o
  solicite una API pública de OpenClaw.
- Use [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) y
  [Migración del SDK](/es/plugins/sdk-migration) para elegir una importación compatible.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

El plugin todavía utiliza el asistente obsoleto para todo el almacén de sesiones
`loadSessionStore`.

- Use `getSessionEntry(...)` o `listSessionEntries(...)` al leer el estado
  de la sesión.
- Use `patchSessionEntry(...)` o `upsertSessionEntry(...)` al escribir el estado
  de la sesión.
- Evite cargar, modificar y guardar todo el objeto del almacén de sesiones.
- Mantenga `loadSessionStore(...)` solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [API de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

El plugin todavía utiliza un asistente obsoleto de escritura de todo el almacén de sesiones, como
`saveSessionStore` o `updateSessionStore`.

- Use `patchSessionEntry(...)` al actualizar campos de una entrada de sesión
  existente.
- Use `upsertSessionEntry(...)` al sustituir o crear una entrada de sesión.
- Evite cargar, modificar y guardar todo el objeto del almacén de sesiones.
- Mantenga los asistentes de escritura de todo el almacén solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulte [API de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

El plugin todavía utiliza asistentes obsoletos de rutas de archivos de sesión, como
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Use `getSessionEntry(...)` para leer los metadatos de sesión por identidad del agente y de la sesión.
- Use `patchSessionEntry(...)` o `upsertSessionEntry(...)` para conservar los metadatos
  de la sesión.
- Use los asistentes de identidad o destino de la transcripción cuando el código prepare una
  operación de transcripción.
- No conserve ni dependa de rutas de archivos de transcripción heredadas.
- Consulte [API de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

El plugin todavía utiliza el asistente obsoleto de destino de archivo de transcripción
`resolveSessionTranscriptLegacyFileTarget`.

- Use `resolveSessionTranscriptIdentity(...)` cuando el código solo necesite la identidad pública
  de la sesión.
- Use `resolveSessionTranscriptTarget(...)` cuando el código necesite un destino estructurado
  para una operación de transcripción.
- Evite leer o crear directamente destinos de archivos de transcripción heredados.
- Mantenga el asistente heredado solo mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [API de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

El plugin todavía utiliza asistentes obsoletos de transcripción de bajo nivel, como
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Use `appendSessionTranscriptMessageByIdentity(...)` para añadir contenido a las transcripciones.
- Use `publishSessionTranscriptUpdateByIdentity(...)` para las notificaciones de actualización
  de transcripciones.
- Utilice preferentemente la superficie estructurada de ejecución de transcripciones para que OpenClaw pueda aplicar los
  límites de transacción y la gestión de identidades correctos.
- Mantenga los asistentes de transcripción de bajo nivel solo mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulte [API de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

El plugin todavía utiliza el enlace heredado `before_agent_start`.

- Traslade el trabajo de sustitución del modelo o proveedor a `before_model_resolve`.
- Traslade el trabajo de modificación de instrucciones o contexto a `before_prompt_build`.
- Mantenga `before_agent_start` solo mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [Enlaces](/es/plugins/hooks) y
  [Compatibilidad de plugins](/es/plugins/compatibility).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

El manifiesto todavía utiliza metadatos heredados de autenticación del proveedor `providerAuthEnvVars`.

- Replique los metadatos de variables de entorno del proveedor en `setup.providers[].envVars`.
- Mantenga `providerAuthEnvVars` solo como metadatos de compatibilidad mientras el intervalo de
  OpenClaw admitido todavía los necesite.
- Consulte la [referencia de configuración](/es/plugins/manifest#setup-reference) y
  [Migración del SDK](/es/plugins/sdk-migration).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### channel-env-vars

El manifiesto utiliza metadatos heredados o antiguos de variables de entorno del canal sin los metadatos actuales
de configuración o ajustes que ClawHub espera.

- Mantenga declarativos los metadatos de variables de entorno del canal para que OpenClaw pueda inspeccionar el estado de configuración
  sin cargar la ejecución del canal.
- Replique la configuración del canal basada en variables de entorno en los metadatos actuales de configuración, ajustes del canal o
  del canal del paquete que utilice la estructura de su plugin.
- Mantenga `channelEnvVars` solo como metadatos de compatibilidad mientras las versiones anteriores de
  OpenClaw admitidas todavía lo requieran.
- Consulte [Manifiesto del plugin](/es/plugins/manifest) y
  [Plugins de canal](/es/plugins/sdk-channel-plugins).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Manifiesto de seguridad

### security-manifest-schema-unavailable

El paquete distribuye `openclaw.security.json` con una referencia de esquema que ClawHub
no reconoce como disponible.

- Elimine la URL del esquema si solo tiene carácter informativo.
- Use un esquema versionado documentado solo después de que OpenClaw publique uno.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

El paquete distribuye un archivo de manifiesto de seguridad no compatible.

- Elimine `openclaw.security.json` hasta que OpenClaw documente un esquema versionado de manifiesto de seguridad
  y el comportamiento de ClawHub.
- Mantenga documentado el comportamiento que afecte a la seguridad en la documentación pública de su paquete o en el
  archivo README hasta que exista el contrato del manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Contenido relacionado

- [CLI de ClawHub](/es/clawhub/cli)
- [Publicación en ClawHub](/es/clawhub/publishing)
- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto del plugin](/es/plugins/manifest)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Compatibilidad de plugins](/es/plugins/compatibility)
