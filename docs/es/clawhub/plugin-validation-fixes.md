---
read_when:
    - Ejecutaste clawhub package validate y necesitas corregir los hallazgos del Plugin
    - ClawHub rechazó o emitió una advertencia durante la publicación de un paquete de Plugin
    - Estás actualizando los metadatos del paquete del plugin antes del lanzamiento
summary: Corrige los hallazgos de validación del paquete del Plugin de ClawHub antes de publicar
title: Correcciones de validación de Plugin
x-i18n:
    generated_at: "2026-06-28T05:16:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correcciones de validación de plugins

ClawHub valida los paquetes de plugins antes de publicarlos y también puede mostrar hallazgos de análisis automatizados de paquetes. Esta página cubre los hallazgos orientados al autor, es decir, hallazgos que el autor del plugin puede corregir en los metadatos del paquete, el manifiesto, las importaciones del SDK o el artefacto publicado.

No cubre los hallazgos internos de cobertura de Plugin Inspector. Si un informe completo contiene códigos de mantenimiento del analizador sin orientación de remediación para autores, esos códigos son para los mantenedores de OpenClaw, no para los autores de plugins.

Después de aplicar cualquier corrección, vuelve a ejecutar:

```bash
clawhub package validate <path-to-plugin>
```

## Hallazgos orientados al autor

| Código                                  | Empieza aquí                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Añade metadatos del paquete](/es/clawhub/plugin-validation-fixes#package-json-missing)                                        |
| `package-openclaw-metadata-missing`     | [Añade el bloque openclaw del paquete](/es/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                  |
| `package-openclaw-entry-missing`        | [Declara puntos de entrada del paquete OpenClaw](/es/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)           |
| `package-entrypoint-missing`            | [Publica el punto de entrada declarado](/es/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Completa los metadatos de instalación](/es/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)               |
| `package-plugin-api-compat-missing`     | [Declara la compatibilidad con la API de plugins](/es/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)       |
| `package-min-host-version-drift`        | [Alinea la versión mínima del host](/es/clawhub/plugin-validation-fixes#package-min-host-version-drift)                        |
| `package-manifest-version-drift`        | [Alinea las versiones del paquete y del manifiesto](/es/clawhub/plugin-validation-fixes#package-manifest-version-drift)        |
| `package-openclaw-unsupported-metadata` | [Elimina metadatos de paquete de OpenClaw no admitidos](/es/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Haz que el artefacto de npm sea empaquetable](/es/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)               |
| `package-npm-pack-entrypoint-missing`   | [Incluye puntos de entrada en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)  |
| `package-npm-pack-metadata-missing`     | [Incluye metadatos en la salida de npm pack](/es/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)            |
| `manifest-name-missing`                 | [Añade un nombre visible al manifiesto](/es/clawhub/plugin-validation-fixes#manifest-name-missing)                             |
| `manifest-unknown-fields`               | [Elimina campos de manifiesto no admitidos](/es/clawhub/plugin-validation-fixes#manifest-unknown-fields)                       |
| `manifest-unknown-contracts`            | [Elimina claves de contrato no admitidas](/es/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                      |
| `legacy-root-sdk-import`                | [Reemplaza las importaciones raíz del SDK](/es/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                         |
| `reserved-sdk-import`                   | [Elimina importaciones reservadas del SDK](/es/clawhub/plugin-validation-fixes#reserved-sdk-import)                            |
| `sdk-load-session-store`                | [Reemplaza el acceso a todo el almacén de sesión](/es/clawhub/plugin-validation-fixes#sdk-load-session-store)                  |
| `legacy-before-agent-start`             | [Reemplaza before_agent_start](/es/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                  |
| `provider-auth-env-vars`                | [Mueve las variables de entorno del proveedor a los metadatos de configuración](/es/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Refleja las variables de entorno del canal en los metadatos actuales](/es/clawhub/plugin-validation-fixes#channel-env-vars)   |
| `security-manifest-schema-unavailable`  | [Elimina referencias no disponibles al esquema de manifiesto de seguridad](/es/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Elimina archivos de manifiesto de seguridad no admitidos](/es/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Metadatos del paquete

### package-json-missing

La raíz del paquete no incluye `package.json`, por lo que ClawHub no puede identificar el paquete de npm, la versión, los puntos de entrada ni los metadatos de OpenClaw.

- Añade `package.json` con `name`, `version` y `type`.
- Añade un bloque `openclaw` cuando el paquete incluya un plugin de OpenClaw.
- Usa [Crear plugins](/es/plugins/building-plugins) para ver un ejemplo mínimo de paquete y [Manifiesto del plugin](/es/plugins/manifest#manifest-versus-packagejson) para la separación entre paquete y manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

El paquete tiene `package.json`, pero no declara metadatos de paquete de OpenClaw.

- Añade `package.json#openclaw`.
- Incluye metadatos de punto de entrada como `openclaw.extensions` u `openclaw.runtimeExtensions`.
- Añade metadatos de compatibilidad e instalación cuando el paquete se vaya a publicar o instalar mediante ClawHub.
- Consulta [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Los metadatos del paquete existen, pero no declaran un punto de entrada de runtime de OpenClaw.

- Añade `openclaw.extensions` para puntos de entrada de plugins nativos.
- Añade `openclaw.runtimeExtensions` cuando el paquete publicado deba cargar JavaScript compilado.
- Mantén todas las rutas de puntos de entrada dentro del directorio del paquete.
- Consulta [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints) y [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

El paquete declara un punto de entrada de OpenClaw, pero falta el archivo referenciado en el paquete que se está validando.

- Comprueba cada ruta en `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` y `openclaw.runtimeSetupEntry`.
- Compila el paquete si el punto de entrada se genera en `dist`.
- Actualiza los metadatos si el punto de entrada se movió.
- Consulta [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub no puede determinar cómo debe instalarse o actualizarse el paquete.

- Rellena `openclaw.install` con el origen de instalación admitido, como `clawhubSpec`, `npmSpec` o `localPath`.
- Establece `openclaw.install.defaultChoice` cuando haya más de un origen de instalación disponible.
- Usa `openclaw.install.minHostVersion` para la versión mínima del host OpenClaw.
- Consulta [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

El paquete no declara el rango de API de plugins de OpenClaw que admite.

- Añade `openclaw.compat.pluginApi` a `package.json`.
- Usa la versión de la API de plugins de OpenClaw o el límite inferior de semver con el que compilaste y probaste.
- Mantén esto separado de la versión del paquete. La versión del paquete describe la versión publicada del plugin; `openclaw.compat.pluginApi` describe el contrato de API del host.
- Consulta [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La versión mínima del host del paquete no coincide con los metadatos de versión de OpenClaw contra los que se compiló el paquete.

- Comprueba `openclaw.install.minHostVersion`.
- Comprueba cualquier metadato de compilación de OpenClaw en el paquete, como la versión de OpenClaw usada durante la publicación.
- Alinea la versión mínima del host con el rango de versiones del host que el paquete admite realmente.
- Consulta [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La versión del paquete y la versión del manifiesto del plugin no coinciden.

- Prefiere `package.json#version` como versión publicada del paquete.
- Si `openclaw.plugin.json` también tiene `version`, actualízalo para que coincida o elimina metadatos obsoletos de versión del manifiesto cuando los metadatos del paquete sean autoritativos.
- Publica una nueva versión del paquete después de cambiar metadatos publicados.
- Consulta [Manifiesto del plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

El bloque `package.json#openclaw` contiene campos que no son metadatos de paquete de OpenClaw admitidos.

- Elimina campos no admitidos como `openclaw.bundle`.
- Mantén los metadatos de plugins nativos en `openclaw.plugin.json`.
- Mantén los puntos de entrada, la compatibilidad, la instalación, la configuración y los metadatos de catálogo del paquete en campos admitidos de `package.json#openclaw`.
- Consulta [campos de package.json que afectan al descubrimiento](/es/plugins/manifest#packagejson-fields-that-affect-discovery).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Artefacto publicado

### package-npm-pack-unavailable

El paquete no se puede empaquetar en el artefacto que ClawHub inspeccionaría o publicaría.

- Ejecuta `npm pack --dry-run` desde la raíz del paquete.
- Corrige metadatos de paquete no válidos, scripts de ciclo de vida rotos o entradas de archivos que hacen que el empaquetado falle.
- Elimina `private: true` si este paquete está destinado a publicarse públicamente.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

El paquete se puede empaquetar, pero el artefacto empaquetado no incluye los archivos de punto de entrada declarados en `package.json#openclaw`.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos que se incluirían.
- Compila los puntos de entrada generados antes de empaquetar.
- Actualiza `files`, `.npmignore` o la salida de compilación para que se incluyan los puntos de entrada declarados.
- Consulta [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Al artefacto empaquetado le faltan metadatos de OpenClaw que existen en el paquete fuente.

- Ejecuta `npm pack --dry-run` e inspecciona los archivos de metadatos incluidos.
- Asegúrate de que `package.json` incluya el bloque `openclaw` en el artefacto empaquetado.
- Asegúrate de que `openclaw.plugin.json` esté incluido cuando el paquete sea un plugin nativo de OpenClaw.
- Actualiza `files` o `.npmignore` para que los metadatos del paquete no queden excluidos.
- Consulta [Crear plugins](/es/plugins/building-plugins).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Metadatos del manifiesto

### manifest-name-missing

El manifiesto de plugin nativo no incluye un nombre visible.

- Añade un campo `name` no vacío a `openclaw.plugin.json`.
- Mantén `name` legible para humanos y conserva `id` como el identificador de máquina estable.
- Consulta [Manifiesto del plugin](/es/plugins/manifest).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

El manifiesto del plugin tiene campos de nivel superior que OpenClaw no admite.

- Compara cada campo de nivel superior con la
  [referencia de campos del manifiesto](/es/plugins/manifest#top-level-field-reference).
- Elimina los campos personalizados de `openclaw.plugin.json`.
- Mueve los metadatos de paquete o instalación a campos compatibles de `package.json#openclaw`
  en lugar de al manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

El manifiesto declara claves no compatibles dentro de `contracts`.

- Compara cada clave bajo `contracts` con la
  [referencia de contracts](/es/plugins/manifest#contracts-reference).
- Elimina las claves de contrato no compatibles.
- Mueve el comportamiento de runtime al código de registro del plugin y mantén `contracts`
  limitado a metadatos estáticos de propiedad de capacidades.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## SDK y migración de compatibilidad

### legacy-root-sdk-import

El plugin importa desde el barrel raíz obsoleto del SDK:
`openclaw/plugin-sdk`.

- Reemplaza las importaciones desde el barrel raíz con importaciones de subrutas públicas específicas.
- Usa `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Usa `openclaw/plugin-sdk/channel-core` para helpers de entrada de canal.
- Usa [convenciones de importación](/es/plugins/building-plugins#import-conventions) y
  [subrutas del SDK de plugin](/es/plugins/sdk-subpaths) para encontrar la importación limitada.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

El plugin importa una ruta del SDK reservada para plugins integrados o compatibilidad
interna.

- Reemplaza las importaciones internas reservadas del SDK de OpenClaw con subrutas públicas
  documentadas de `openclaw/plugin-sdk/*`.
- Si el comportamiento no tiene un SDK público, mantén el helper dentro de tu paquete o
  solicita una API pública de OpenClaw.
- Usa [subrutas del SDK de plugin](/es/plugins/sdk-subpaths) y
  [migración del SDK](/es/plugins/sdk-migration) para elegir una importación compatible.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

El plugin todavía usa el helper obsoleto de almacén de sesión completo
`loadSessionStore`.

- Usa `getSessionEntry(...)` o `listSessionEntries(...)` al leer el estado de sesión.
- Usa `patchSessionEntry(...)` o `upsertSessionEntry(...)` al escribir el estado de sesión.
- Evita cargar, mutar y guardar todo el objeto del almacén de sesión.
- Mantén `loadSessionStore(...)` solo mientras tu intervalo de compatibilidad declarado
  siga admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [API de runtime](/es/plugins/sdk-runtime#agent-session-state) y
  [subrutas del SDK de plugin](/es/plugins/sdk-subpaths).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

El plugin todavía usa el hook heredado `before_agent_start`.

- Mueve el trabajo de sobrescritura de modelo o proveedor a `before_model_resolve`.
- Mueve el trabajo de mutación de prompt o contexto a `before_prompt_build`.
- Mantén `before_agent_start` solo mientras tu intervalo de compatibilidad declarado siga
  admitiendo versiones anteriores de OpenClaw que lo requieran.
- Consulta [hooks](/es/plugins/hooks) y
  [compatibilidad de plugins](/es/plugins/compatibility).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

El manifiesto todavía usa metadatos heredados de autenticación de proveedor `providerAuthEnvVars`.

- Replica los metadatos de variables de entorno del proveedor en `setup.providers[].envVars`.
- Mantén `providerAuthEnvVars` solo como metadatos de compatibilidad mientras tu rango compatible
  de OpenClaw aún lo necesite.
- Consulta [referencia de setup](/es/plugins/manifest#setup-reference) y
  [migración del SDK](/es/plugins/sdk-migration).
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

### channel-env-vars

El manifiesto usa metadatos heredados o antiguos de variables de entorno de canal sin los metadatos
actuales de setup o configuración que ClawHub espera.

- Mantén declarativos los metadatos de variables de entorno de canal para que OpenClaw pueda inspeccionar el estado de setup
  sin cargar el runtime del canal.
- Replica la configuración de canal impulsada por variables de entorno en el setup, la configuración de canal o
  los metadatos de canal del paquete actuales que use la forma de tu plugin.
- Mantén `channelEnvVars` solo como metadatos de compatibilidad mientras las versiones anteriores compatibles
  de OpenClaw sigan requiriéndolo.
- Consulta [manifiesto de plugin](/es/plugins/manifest) y
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

El paquete incluye un archivo de manifiesto de seguridad no compatible.

- Elimina `openclaw.security.json` hasta que OpenClaw documente un esquema versionado de manifiesto de seguridad
  y el comportamiento de ClawHub.
- Mantén el comportamiento sensible a la seguridad documentado en la documentación pública de tu paquete o
  README hasta que exista el contrato del manifiesto.
- Vuelve a ejecutar `clawhub package validate <path-to-plugin>`.

## Relacionado

- [CLI de ClawHub](/es/clawhub/cli)
- [publicación de ClawHub](/es/clawhub/publishing)
- [creación de plugins](/es/plugins/building-plugins)
- [manifiesto de plugin](/es/plugins/manifest)
- [puntos de entrada de plugin](/es/plugins/sdk-entrypoints)
- [compatibilidad de plugins](/es/plugins/compatibility)
