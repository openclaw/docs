---
read_when:
    - Ejecutaste `clawhub package validate` y necesitas corregir los hallazgos del plugin
    - ClawHub rechazó o advirtió sobre la publicación de un paquete de Plugin
    - Estás actualizando los metadatos del paquete de Plugin antes del lanzamiento
summary: Corregir los hallazgos de validación del paquete Plugin de ClawHub antes de publicar
title: Correcciones de validación de Plugin
x-i18n:
    generated_at: "2026-07-01T10:56:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correcciones de validación de Plugin

ClawHub valida los paquetes de Plugin antes de publicar y también puede mostrar hallazgos de
análisis automatizados de paquetes. Esta página cubre los hallazgos orientados al autor, es decir,
hallazgos que el autor del Plugin puede corregir en los metadatos del paquete, el manifiesto, las
importaciones del SDK o el artefacto publicado.

No cubre los hallazgos internos de cobertura de Plugin Inspector. Si un informe completo
contiene códigos de mantenimiento del analizador sin orientación de remediación para el autor, esos
son para los mantenedores de OpenClaw en lugar de para los autores de Plugin.

Después de aplicar cualquier corrección, vuelve a ejecutar:

```bash
clawhub package validate <path-to-plugin>
```

## Hallazgos orientados al autor

| Código                                  | Empieza aquí                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Agrega metadatos del paquete](/es/clawhub/plugin-validation-fixes#package-json-missing)                                        |
| `package-openclaw-metadata-missing`     | [Agrega el bloque openclaw del paquete](/es/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                  |
| `package-openclaw-entry-missing`        | [Declara puntos de entrada del paquete OpenClaw](/es/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)            |
| `package-entrypoint-missing`            | [Publica el punto de entrada declarado](/es/clawhub/plugin-validation-fixes#package-entrypoint-missing)                         |
| `package-install-metadata-incomplete`   | [Completa los metadatos de instalación](/es/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                |
| `package-plugin-api-compat-missing`     | [Declara compatibilidad con la API de Plugin](/es/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)            |
| `package-min-host-version-drift`        | [Alinea la versión mínima del host](/es/clawhub/plugin-validation-fixes#package-min-host-version-drift)                         |
| `package-manifest-version-drift`        | [Alinea las versiones del paquete y del manifiesto](/es/clawhub/plugin-validation-fixes#package-manifest-version-drift)         |
| `package-openclaw-unsupported-metadata` | [Elimina metadatos de paquete OpenClaw no admitidos](/es/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Haz que el artefacto npm pueda empaquetarse](/es/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                 |
| `package-npm-pack-entrypoint-missing`   | [Incluye puntos de entrada en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)   |
| `package-npm-pack-metadata-missing`     | [Incluye metadatos en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)             |
| `manifest-name-missing`                 | [Agrega un nombre visible al manifiesto](/es/clawhub/plugin-validation-fixes#manifest-name-missing)                             |
| `manifest-unknown-fields`               | [Elimina campos de manifiesto no admitidos](/es/clawhub/plugin-validation-fixes#manifest-unknown-fields)                        |
| `manifest-unknown-contracts`            | [Elimina claves de contrato no admitidas](/es/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                       |
| `legacy-root-sdk-import`                | [Reemplaza las importaciones raíz del SDK](/es/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                          |
| `reserved-sdk-import`                   | [Elimina importaciones reservadas del SDK](/es/clawhub/plugin-validation-fixes#reserved-sdk-import)                             |
| `sdk-load-session-store`                | [Reemplaza el acceso al almacén de sesión completo](/es/clawhub/plugin-validation-fixes#sdk-load-session-store)                 |
| `sdk-session-store-write`               | [Reemplaza escrituras del almacén de sesión completo](/es/clawhub/plugin-validation-fixes#sdk-session-store-write)              |
| `sdk-session-file-helper`               | [Reemplaza auxiliares de ruta de archivo de sesión](/es/clawhub/plugin-validation-fixes#sdk-session-file-helper)                |
| `sdk-session-transcript-file-target`    | [Reemplaza destinos heredados de archivo de transcripción](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target) |
| `sdk-session-transcript-low-level`      | [Reemplaza auxiliares de transcripción de bajo nivel](/es/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)     |
| `legacy-before-agent-start`             | [Reemplaza before_agent_start](/es/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                   |
| `provider-auth-env-vars`                | [Mueve las variables de entorno del proveedor a los metadatos de configuración](/es/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Replica las variables de entorno del canal en los metadatos actuales](/es/clawhub/plugin-validation-fixes#channel-env-vars)    |
| `security-manifest-schema-unavailable`  | [Elimina referencias a esquemas de manifiesto de seguridad no disponibles](/es/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Elimina archivos de manifiesto de seguridad no admitidos](/es/clawhub/plugin-validation-fixes#unrecognized-security-manifest)  |

## Metadatos del paquete

### package-json-missing

La raíz del paquete no incluye `package.json`, así que ClawHub no puede identificar el
paquete npm, la versión, los puntos de entrada ni los metadatos de OpenClaw.

- Agrega `package.json` con `name`, `version` y `type`.
- Agrega un bloque `openclaw` cuando el paquete incluya un Plugin de OpenClaw.
- Usa [Crear Plugins](/es/plugins/building-plugins) para ver un ejemplo de paquete
  mínimo y [Manifiesto de Plugin](/es/plugins/manifest#manifest-versus-packagejson)
  para la separación entre paquete y manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

El paquete tiene `package.json`, pero no declara metadatos de paquete de
OpenClaw.

- Agrega `package.json#openclaw`.
- Incluye metadatos de punto de entrada como `openclaw.extensions` o
  `openclaw.runtimeExtensions`.
- Agrega metadatos de compatibilidad e instalación cuando el paquete se vaya a publicar o
  instalar mediante ClawHub.
- Consulta [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Los metadatos del paquete existen, pero no declaran un punto de entrada de runtime
de OpenClaw.

- Agrega `openclaw.extensions` para puntos de entrada de Plugin nativo.
- Agrega `openclaw.runtimeExtensions` cuando el paquete publicado deba cargar
  JavaScript compilado.
- Mantén todas las rutas de puntos de entrada dentro del directorio del paquete.
- Consulta [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints) y
  [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

El paquete declara un punto de entrada de OpenClaw, pero el archivo referenciado falta
en el paquete que se está validando.

- Revisa cada ruta en `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` y `openclaw.runtimeSetupEntry`.
- Compila el paquete si el punto de entrada se genera en `dist`.
- Actualiza los metadatos si el punto de entrada se movió.
- Consulta [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub no puede determinar cómo debe instalarse o actualizarse el paquete.

- Completa `openclaw.install` con el origen de instalación admitido, como
  `clawhubSpec`, `npmSpec` o `localPath`.
- Define `openclaw.install.defaultChoice` cuando haya más de un origen de instalación
  disponible.
- Usa `openclaw.install.minHostVersion` para la versión mínima del host OpenClaw.
- Consulta [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

El paquete no declara el rango de API de Plugin de OpenClaw que admite.

- Agrega `openclaw.compat.pluginApi` a `package.json`.
- Usa la versión de la API de Plugin de OpenClaw o el mínimo de semver contra el que
  compilaste y probaste.
- Mantén esto separado de la versión del paquete. La versión del paquete describe el
  lanzamiento del Plugin; `openclaw.compat.pluginApi` describe el contrato de API del host.
- Consulta [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versión mínima del host del paquete no coincide con los metadatos de versión de OpenClaw
contra los que se compiló el paquete.

- Revisa `openclaw.install.minHostVersion`.
- Revisa cualquier metadato de compilación de OpenClaw en el paquete, como la versión de OpenClaw
  usada durante el lanzamiento.
- Alinea la versión mínima del host con el rango de versiones del host que el paquete
  admite realmente.
- Consulta [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versión del paquete y la versión del manifiesto del Plugin no coinciden.

- Prefiere `package.json#version` como versión de lanzamiento del paquete.
- Si `openclaw.plugin.json` también tiene `version`, actualízala para que coincida o elimina
  metadatos de versión de manifiesto obsoletos cuando los metadatos del paquete sean autoritativos.
- Publica una nueva versión del paquete después de cambiar metadatos publicados.
- Consulta [Manifiesto de Plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

El bloque `package.json#openclaw` contiene campos que no son metadatos de paquete de OpenClaw
admitidos.

- Elimina campos no admitidos como `openclaw.bundle`.
- Mantén los metadatos de Plugin nativo en `openclaw.plugin.json`.
- Mantén los puntos de entrada del paquete, compatibilidad, instalación, configuración y metadatos
  de catálogo en campos admitidos de `package.json#openclaw`.
- Consulta [campos de package.json que afectan el descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Artefacto publicado

### package-npm-pack-unavailable

El paquete no puede empaquetarse en el artefacto que ClawHub inspeccionaría o
publicaría.

- Ejecuta `npm pack --dry-run` desde la raíz del paquete.
- Corrige metadatos de paquete no válidos, scripts de ciclo de vida rotos o entradas de archivos que
  hacen que falle el empaquetado.
- Elimina `private: true` si este paquete está destinado a publicación pública.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

El paquete puede empaquetarse, pero el artefacto empaquetado no incluye los
archivos de punto de entrada declarados en `package.json#openclaw`.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos que se incluirían.
- Compila los puntos de entrada generados antes de empaquetar.
- Actualiza `files`, `.npmignore` o la salida de compilación para que se incluyan los puntos de entrada
  declarados.
- Consulta [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Al artefacto empaquetado le faltan metadatos de OpenClaw que existen en tu paquete
fuente.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos de metadatos incluidos.
- Asegúrate de que `package.json` incluya el bloque `openclaw` en el artefacto empaquetado.
- Asegúrate de que `openclaw.plugin.json` se incluya cuando el paquete sea un Plugin nativo de
  OpenClaw.
- Actualiza `files` o `.npmignore` para que los metadatos del paquete no queden excluidos.
- Consulta [Crear Plugins](/es/plugins/building-plugins).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Metadatos del manifiesto

### manifest-name-missing

El manifiesto nativo del plugin no incluye un nombre para mostrar.

- Agrega un campo `name` no vacío a `openclaw.plugin.json`.
- Mantén `name` legible para humanos y mantén `id` como el id estable para máquina.
- Consulta [manifiesto de Plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

El manifiesto del plugin tiene campos de nivel superior que OpenClaw no admite.

- Compara cada campo de nivel superior con la
  [referencia de campos del manifiesto](/es/plugins/manifest#top-level-field-reference).
- Elimina los campos personalizados de `openclaw.plugin.json`.
- Mueve los metadatos de paquete o instalación a campos `package.json#openclaw`
  admitidos en lugar del manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

El manifiesto declara claves no admitidas dentro de `contracts`.

- Compara cada clave bajo `contracts` con la
  [referencia de contracts](/es/plugins/manifest#contracts-reference).
- Elimina las claves de contrato no admitidas.
- Mueve el comportamiento de tiempo de ejecución al código de registro del plugin y mantén `contracts`
  limitado a metadatos estáticos de propiedad de capacidades.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Migración de compatibilidad y SDK

### legacy-root-sdk-import

El plugin importa desde el barrel raíz obsoleto del SDK:
`openclaw/plugin-sdk`.

- Reemplaza las importaciones del barrel raíz por importaciones de subrutas públicas enfocadas.
- Usa `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` para los helpers de entrada de canal.
- Usa [convenciones de importación](/es/plugins/building-plugins#import-conventions) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths) para encontrar la importación precisa.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

El plugin importa una ruta del SDK reservada para plugins agrupados o compatibilidad
interna.

- Reemplaza las importaciones internas reservadas del SDK de OpenClaw por subrutas públicas
  `openclaw/plugin-sdk/*` documentadas.
- Si el comportamiento no tiene SDK público, mantén el helper dentro de tu paquete o
  solicita una API pública de OpenClaw.
- Usa [subrutas del Plugin SDK](/es/plugins/sdk-subpaths) y
  [migración del SDK](/es/plugins/sdk-migration) para elegir una importación admitida.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

El plugin todavía usa el helper obsoleto de almacén de sesión completo
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` al leer el estado de sesión.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` al escribir el estado de sesión.
- Evita cargar, mutar y guardar el objeto completo del almacén de sesión.
- Mantén `loadSessionStore(...)` solo mientras tu rango de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

El plugin todavía usa un helper obsoleto de escritura de almacén de sesión completo como
`saveSessionStore` o `updateSessionStore`.

- Usa `patchSessionEntry(...)` al actualizar campos en una entrada de sesión existente.
- Usa `upsertSessionEntry(...)` al reemplazar o crear una entrada de sesión.
- Evita cargar, mutar y guardar el objeto completo del almacén de sesión.
- Mantén los helpers de escritura de almacén completo solo mientras tu rango de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

El plugin todavía usa helpers obsoletos de rutas de archivo de sesión como
`resolveSessionFilePath` o `resolveAndPersistSessionFile`.

- Usa `getSessionEntry(...)` para leer metadatos de sesión por identidad de agente y sesión.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` para persistir metadatos de sesión.
- Usa la identidad de transcripción o helpers de destino cuando el código esté preparando una
  operación de transcripción.
- No persistas ni dependas de rutas de archivo de transcripción heredadas.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

El plugin todavía usa el helper obsoleto de destino de archivo de transcripción
`resolveSessionTranscriptLegacyFileTarget`.

- Usa `resolveSessionTranscriptIdentity(...)` cuando el código solo necesite identidad pública
  de sesión.
- Usa `resolveSessionTranscriptTarget(...)` cuando el código necesite un destino estructurado
  de operación de transcripción.
- Evita leer o construir directamente destinos de archivo de transcripción heredados.
- Mantén el helper heredado solo mientras tu rango de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

El plugin todavía usa helpers obsoletos de bajo nivel para transcripciones como
`appendSessionTranscriptMessage` o `emitSessionTranscriptUpdate`.

- Usa `appendSessionTranscriptMessageByIdentity(...)` para agregar a transcripciones.
- Usa `publishSessionTranscriptUpdateByIdentity(...)` para notificaciones de actualización
  de transcripción.
- Prefiere la superficie estructurada de tiempo de ejecución de transcripciones para que OpenClaw pueda aplicar los
  límites de transacción y el manejo de identidad correctos.
- Mantén los helpers de transcripción de bajo nivel solo mientras tu rango de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que los requieran.
- Consulta [API de tiempo de ejecución](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del Plugin SDK](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

El plugin todavía usa el hook heredado `before_agent_start`.

- Mueve el trabajo de anulación de modelo o proveedor a `before_model_resolve`.
- Mueve el trabajo de mutación de prompt o contexto a `before_prompt_build`.
- Mantén `before_agent_start` solo mientras tu rango de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [hooks](/es/plugins/hooks) y
  [compatibilidad de Plugin](/es/plugins/compatibility).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

El manifiesto todavía usa metadatos heredados de autenticación de proveedor `providerAuthEnvVars`.

- Refleja los metadatos de env-vars del proveedor en `setup.providers[].envVars`.
- Mantén `providerAuthEnvVars` solo como metadatos de compatibilidad mientras tu rango
  admitido de OpenClaw todavía lo necesite.
- Consulta [referencia de setup](/es/plugins/manifest#setup-reference) y
  [migración del SDK](/es/plugins/sdk-migration).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### channel-env-vars

El manifiesto usa metadatos heredados o antiguos de env-var de canal sin los metadatos actuales
de setup o configuración que ClawHub espera.

- Mantén declarativos los metadatos de env-var del canal para que OpenClaw pueda inspeccionar el estado de setup
  sin cargar el tiempo de ejecución del canal.
- Refleja el setup de canal impulsado por env en los metadatos actuales de setup, configuración de canal o
  paquete de canal usados por la forma de tu plugin.
- Mantén `channelEnvVars` solo como metadatos de compatibilidad mientras versiones anteriores admitidas
  de OpenClaw todavía lo requieran.
- Consulta [manifiesto de Plugin](/es/plugins/manifest) y
  [plugins de canal](/es/plugins/sdk-channel-plugins).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Manifiesto de seguridad

### security-manifest-schema-unavailable

El paquete incluye `openclaw.security.json` con una referencia de esquema que ClawHub
no reconoce como disponible.

- Elimina la URL del esquema si es solo orientativa.
- Usa un esquema versionado documentado solo después de que OpenClaw publique uno.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

El paquete incluye un archivo de manifiesto de seguridad no admitido.

- Elimina `openclaw.security.json` hasta que OpenClaw documente un esquema versionado de manifiesto
  de seguridad y el comportamiento de ClawHub.
- Mantén el comportamiento sensible para la seguridad documentado en la documentación pública de tu paquete o
  README hasta que exista el contrato del manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Relacionado

- [CLI de ClawHub](/es/clawhub/cli)
- [publicación de ClawHub](/es/clawhub/publishing)
- [creación de plugins](/es/plugins/building-plugins)
- [manifiesto de Plugin](/es/plugins/manifest)
- [puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [compatibilidad de Plugin](/es/plugins/compatibility)
