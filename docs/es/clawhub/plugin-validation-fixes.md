---
read_when:
    - Ejecutó clawhub package validate y necesita corregir los problemas detectados en el plugin
    - ClawHub rechazó o mostró una advertencia al publicar un paquete de Plugin
    - Está actualizando los metadatos del paquete del plugin antes del lanzamiento
summary: Corrige los problemas de validación de paquetes de plugins de ClawHub antes de publicar
title: Correcciones de validación de plugins
x-i18n:
    generated_at: "2026-07-14T13:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correcciones de validación de plugins

ClawHub valida los paquetes de plugins antes de publicarlos y también puede mostrar hallazgos de
análisis automatizados de paquetes. Esta página abarca los hallazgos dirigidos a autores, es decir,
hallazgos que el autor del plugin puede corregir en los metadatos del paquete, el manifiesto, las
importaciones del SDK o el artefacto publicado.

No abarca los hallazgos internos de cobertura de Plugin Inspector. Si un informe completo
contiene códigos de mantenimiento del analizador sin instrucciones de corrección para el autor,
estos están destinados a los responsables de mantenimiento de OpenClaw, no a los autores de plugins.

Después de aplicar cualquier corrección, vuelva a ejecutar:

```bash
clawhub package validate <path-to-plugin>
```

## Hallazgos dirigidos a autores

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
| `package-npm-pack-unavailable`          | [Hacer empaquetable el artefacto de npm](/es/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Incluir los puntos de entrada en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Incluir los metadatos en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Añadir un nombre para mostrar al manifiesto](/es/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Eliminar los campos de manifiesto no compatibles](/es/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Eliminar las claves de contrato no compatibles](/es/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Sustituir las importaciones raíz del SDK](/es/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Eliminar las importaciones reservadas del SDK](/es/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Sustituir el acceso al almacén de sesiones completo](/es/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Sustituir las escrituras en el almacén de sesiones completo](/es/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Sustituir los auxiliares de rutas de archivos de sesión](/es/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Sustituir los destinos heredados de archivos de transcripción](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Sustituir los auxiliares de transcripción de bajo nivel](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
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
  y [Manifiesto de plugins](/es/plugins/manifest#manifest-versus-packagejson)
  para conocer la separación entre el paquete y el manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

El paquete tiene `package.json`, pero no declara metadatos de paquete de
OpenClaw.

- Añada `package.json#openclaw`.
- Incluya metadatos de puntos de entrada, como `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Añada metadatos de compatibilidad e instalación cuando el paquete vaya a publicarse o
  instalarse mediante ClawHub.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Los metadatos del paquete existen, pero no declaran un punto de entrada de ejecución de
OpenClaw.

- Añada `openclaw.extensions` para los puntos de entrada nativos del plugin.
- Añada `openclaw.runtimeExtensions` cuando el paquete publicado deba cargar JavaScript
  compilado.
- Mantenga todas las rutas de los puntos de entrada dentro del directorio del paquete.
- Consulte [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints) y
  [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

El paquete declara un punto de entrada de OpenClaw, pero falta el archivo al que se hace referencia
en el paquete que se está validando.

- Compruebe cada ruta de `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` y `openclaw.runtimeSetupEntry`.
- Compile el paquete si el punto de entrada se genera en `dist`.
- Actualice los metadatos si el punto de entrada se ha movido.
- Consulte [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub no puede determinar cómo debe instalarse o actualizarse el paquete.

- Rellene `openclaw.install` con el origen de instalación compatible, como
  `clawhubSpec`, `npmSpec` o `localPath`.
- Establezca `openclaw.install.defaultChoice` cuando haya más de un origen de instalación
  disponible.
- Use `openclaw.install.minHostVersion` para indicar la versión mínima del host de OpenClaw.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

El paquete no declara el intervalo de la API de plugins de OpenClaw que admite.

- Añada `openclaw.compat.pluginApi` a `package.json`.
- Use la versión de la API de plugins de OpenClaw o la versión mínima semver con la que se compiló y probó
  el paquete.
- Mantenga este valor separado de la versión del paquete. La versión del paquete describe la
  versión publicada del plugin; `openclaw.compat.pluginApi` describe el contrato de la API del host.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versión mínima del host del paquete no coincide con los metadatos de versión de OpenClaw
con los que se compiló el paquete.

- Compruebe `openclaw.install.minHostVersion`.
- Compruebe todos los metadatos de compilación de OpenClaw incluidos en el paquete, como la versión de OpenClaw
  utilizada durante la publicación.
- Alinee la versión mínima del host con el intervalo de versiones del host que el paquete
  admite realmente.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versión del paquete y la versión del manifiesto del plugin no coinciden.

- Prefiera `package.json#version` como versión publicada del paquete.
- Si `openclaw.plugin.json` también tiene `version`, actualícelo para que coincida o elimine
  los metadatos obsoletos de la versión del manifiesto cuando los metadatos del paquete sean la fuente autoritativa.
- Publique una nueva versión del paquete después de cambiar los metadatos publicados.
- Consulte [Manifiesto de plugins](/es/plugins/manifest).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

El bloque `package.json#openclaw` contiene campos que no son metadatos compatibles
del paquete de OpenClaw.

- Elimine los campos no compatibles, como `openclaw.bundle`.
- Mantenga los metadatos del plugin nativo en `openclaw.plugin.json`.
- Mantenga los puntos de entrada, la compatibilidad, la instalación, la configuración y los metadatos del catálogo del paquete
  en campos compatibles de `package.json#openclaw`.
- Consulte [Campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Artefacto publicado

### package-npm-pack-unavailable

El paquete no puede empaquetarse en el artefacto que ClawHub inspeccionaría o
publicaría.

- Ejecute `npm pack --dry-run` desde la raíz del paquete.
- Corrija los metadatos no válidos del paquete, los scripts del ciclo de vida defectuosos o las entradas de archivos que
  impidan el empaquetado.
- Elimine `private: true` si este paquete está destinado a su publicación pública.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

El paquete puede empaquetarse, pero el artefacto empaquetado no incluye los
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
- Asegúrese de que se incluya `openclaw.plugin.json` cuando el paquete sea un
  plugin nativo de OpenClaw.
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

El manifiesto del plugin contiene campos de nivel superior que OpenClaw no admite.

- Compare cada campo de nivel superior con la
  [referencia de campos del manifiesto](/es/plugins/manifest#top-level-field-reference).
- Elimine los campos personalizados de `openclaw.plugin.json`.
- Traslade los metadatos del paquete o de instalación a campos `package.json#openclaw` admitidos,
  en lugar de incluirlos en el manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

El manifiesto declara claves no admitidas dentro de `contracts`.

- Compare cada clave de `contracts` con la
  [referencia de contratos](/es/plugins/manifest#contracts-reference).
- Elimine las claves de contrato no admitidas.
- Traslade el comportamiento en tiempo de ejecución al código de registro del plugin y limite `contracts`
  a metadatos estáticos sobre la propiedad de las capacidades.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Migración del SDK y de compatibilidad

### legacy-root-sdk-import

El plugin importa desde el módulo raíz obsoleto del SDK:
`openclaw/plugin-sdk`.

- Sustituya las importaciones del módulo raíz por importaciones específicas de subrutas públicas.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para los auxiliares de punto de entrada de canales.
- Use [Convenciones de importación](/es/plugins/building-plugins#import-conventions) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) para encontrar la importación específica.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

El plugin importa una ruta del SDK reservada para plugins incluidos o para
compatibilidad interna.

- Sustituya las importaciones internas reservadas del SDK de OpenClaw por subrutas
  documentadas de `openclaw/plugin-sdk/*`.
- Si el comportamiento no dispone de un SDK público, mantenga el auxiliar dentro del paquete o
  solicite una API pública de OpenClaw.
- Use [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths) y
  [Migración del SDK](/es/plugins/sdk-migration) para elegir una importación admitida.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

El plugin todavía usa el auxiliar obsoleto para el almacén completo de sesiones
`loadSessionStore`.

- Use `getSessionEntry(...)` o `listSessionEntries(...)` al leer el estado
  de la sesión.
- Use `patchSessionEntry(...)` o `upsertSessionEntry(...)` al escribir el estado
  de la sesión.
- Evite cargar, modificar y guardar el objeto completo del almacén de sesiones.
- Mantenga `loadSessionStore(...)` únicamente mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

El plugin todavía usa un auxiliar obsoleto de escritura del almacén completo de sesiones, como
`saveSessionStore` o `updateSessionStore`.

- Use `patchSessionEntry(...)` al actualizar campos de una entrada de sesión
  existente.
- Use `upsertSessionEntry(...)` al sustituir o crear una entrada de sesión.
- Evite cargar, modificar y guardar el objeto completo del almacén de sesiones.
- Mantenga los auxiliares de escritura del almacén completo únicamente mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulte [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

El plugin todavía usa auxiliares obsoletos para rutas de archivos de sesión, como
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Use `getSessionEntry(...)` para leer los metadatos de sesión según la identidad
  del agente y de la sesión.
- Use `patchSessionEntry(...)` o `upsertSessionEntry(...)` para conservar los metadatos
  de sesión.
- Use la identidad de la transcripción o los auxiliares de destino cuando el código prepare una
  operación de transcripción.
- No conserve ni dependa de rutas de archivos de transcripción heredadas.
- Consulte [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

El plugin todavía usa el auxiliar obsoleto de destino de archivo de transcripción
`resolveSessionTranscriptLegacyFileTarget`.

- Use `resolveSessionTranscriptIdentity(...)` cuando el código solo necesite la identidad pública
  de la sesión.
- Use `resolveSessionTranscriptTarget(...)` cuando el código necesite un destino estructurado
  para una operación de transcripción.
- Evite leer o construir directamente destinos de archivos de transcripción heredados.
- Mantenga el auxiliar heredado únicamente mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

El plugin todavía usa auxiliares obsoletos de bajo nivel para transcripciones, como
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Use `appendSessionTranscriptMessageByIdentity(...)` para añadir contenido a las transcripciones.
- Use `publishSessionTranscriptUpdateByIdentity(...)` para las notificaciones de actualización
  de transcripciones.
- Prefiera la interfaz estructurada de tiempo de ejecución para transcripciones, de modo que OpenClaw pueda aplicar los
  límites de transacción y la gestión de identidades correctos.
- Mantenga los auxiliares de bajo nivel para transcripciones únicamente mientras el intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulte [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

El plugin todavía usa el enlace heredado `before_agent_start`.

- Traslade a `before_model_resolve` el trabajo de sustitución del modelo o proveedor.
- Traslade a `before_prompt_build` el trabajo de modificación del prompt o del contexto.
- Mantenga `before_agent_start` únicamente mientras el intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulte [Enlaces](/es/plugins/hooks) y
  [Compatibilidad de plugins](/es/plugins/compatibility).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

El manifiesto todavía usa los metadatos heredados `providerAuthEnvVars` para la autenticación del proveedor.

- Replique los metadatos de variables de entorno del proveedor en `setup.providers[].envVars`.
- Mantenga `providerAuthEnvVars` únicamente como metadatos de compatibilidad mientras el intervalo
  de versiones de OpenClaw admitido siga necesitándolo.
- Consulte la [referencia de configuración](/es/plugins/manifest#setup-reference) y
  [Migración del SDK](/es/plugins/sdk-migration).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### channel-env-vars

El manifiesto usa metadatos heredados o antiguos de variables de entorno del canal sin los metadatos actuales
de configuración o instalación que espera ClawHub.

- Mantenga declarativos los metadatos de variables de entorno del canal para que OpenClaw pueda inspeccionar el estado de configuración
  sin cargar el tiempo de ejecución del canal.
- Replique la configuración del canal basada en variables de entorno en los metadatos actuales de configuración, configuración del canal o
  canal del paquete que use la estructura del plugin.
- Mantenga `channelEnvVars` únicamente como metadatos de compatibilidad mientras las versiones anteriores
  de OpenClaw admitidas sigan requiriéndolo.
- Consulte [Manifiesto del plugin](/es/plugins/manifest) y
  [Plugins de canal](/es/plugins/sdk-channel-plugins).
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Manifiesto de seguridad

### security-manifest-schema-unavailable

El paquete incluye `openclaw.security.json` con una referencia de esquema que ClawHub
no reconoce como disponible.

- Elimine la URL del esquema si solo tiene carácter informativo.
- Use un esquema versionado documentado únicamente después de que OpenClaw publique uno.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

El paquete incluye un archivo de manifiesto de seguridad no admitido.

- Elimine `openclaw.security.json` hasta que OpenClaw documente un esquema versionado de manifiesto de seguridad
  y el comportamiento de ClawHub.
- Mantenga documentado el comportamiento relevante para la seguridad en la documentación pública del paquete o
  en el README hasta que exista el contrato del manifiesto.
- Vuelva a ejecutar `clawhub package validate <path-to-plugin>`.

## Contenido relacionado

- [CLI de ClawHub](/es/clawhub/cli)
- [Publicación en ClawHub](/es/clawhub/publishing)
- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto del plugin](/es/plugins/manifest)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Compatibilidad de plugins](/es/plugins/compatibility)
