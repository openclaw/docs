---
read_when:
    - Publicación de Skills
    - Depuración de fallos de publicación
summary: Formato de la carpeta de Skills, archivos obligatorios, tipos de archivo permitidos, límites.
x-i18n:
    generated_at: "2026-07-04T10:26:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de skill

## En disco

Una skill es una carpeta.

Obligatorio:

- `SKILL.md` (o `skill.md`; también se acepta el `skills.md` heredado)

Opcional:

- cualquier archivo _basado en texto_ de apoyo (consulta “Archivos permitidos”)
- `.clawhubignore` (patrones de exclusión para publicar, `.clawdhubignore` heredado)
- `.gitignore` (también se respeta)

## Importación desde GitHub

El importador web de GitHub es más estricto que la publicación/sincronización local. Solo descubre
archivos `SKILL.md` o `skills.md` heredados en repositorios públicos, que no sean forks, propiedad de
la cuenta de GitHub con sesión iniciada. No importa repositorios privados, forks,
repositorios archivados/deshabilitados ni repositorios públicos de terceros.

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` heredado)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` heredado)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como el resumen de la skill en la interfaz de usuario/búsqueda.

## Metadatos de frontmatter

Los metadatos de la skill se declaran en el frontmatter YAML al inicio de tu `SKILL.md`. Esto le indica al registro (y al análisis de seguridad) qué necesita tu skill para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Resumen breve de lo que hace esta skill.
version: 1.0.0
---
```

### Metadatos de runtime (`metadata.openclaw`)

Declara los requisitos de runtime de tu skill en `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestionar tareas mediante la API de Todoist.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Usa `requires.env` para variables de entorno que deben estar presentes antes de que la skill pueda ejecutarse. Usa `envVars` cuando necesites metadatos por variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                                  |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Variables de entorno requeridas que espera tu skill.                                                                                                         |
| `requires.bins`    | `string[]` | Binarios de la CLI que deben estar todos instalados.                                                                                                         |
| `requires.anyBins` | `string[]` | Binarios de la CLI donde al menos uno debe existir.                                                                                                          |
| `requires.config`  | `string[]` | Rutas de archivos de configuración que lee tu skill.                                                                                                         |
| `primaryEnv`       | `string`   | La variable de entorno de credenciales principal para tu skill.                                                                                              |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Define `required: false` para variables de entorno opcionales. |
| `always`           | `boolean`  | Si es `true`, la skill siempre está activa (no se necesita instalación explícita).                                                                            |
| `skillKey`         | `string`   | Sobrescribe la clave de invocación de la skill.                                                                                                              |
| `emoji`            | `string`   | Emoji de visualización para la skill.                                                                                                                        |
| `homepage`         | `string`   | URL de la página de inicio o la documentación de la skill.                                                                                                   |
| `os`               | `string[]` | Restricciones de sistema operativo (por ejemplo, `["macos"]`, `["linux"]`).                                                                                  |
| `install`          | `array`    | Especificaciones de instalación para dependencias (ver abajo).                                                                                               |
| `nix`              | `object`   | Especificación de plugin de Nix (consulta README).                                                                                                           |
| `config`           | `object`   | Especificación de configuración de Clawdbot (consulta README).                                                                                               |

### Especificaciones de instalación

Si tu skill necesita dependencias instaladas, decláralas en el array `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Tipos de instalación admitidos: `brew`, `node`, `go`, `uv`.

### Variables de entorno opcionales

Declara variables de entorno opcionales en `metadata.openclaw.envVars` y establece `required: false`. No añadas entradas opcionales a `requires.env`, porque `requires.env` significa que la skill no puede ejecutarse sin ellas.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token de la API de Todoist usado para solicitudes autenticadas.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID de proyecto predeterminado opcional cuando el usuario no especifica uno.
```

### Por qué esto importa

El análisis de seguridad de ClawHub comprueba que lo que declara tu skill coincide con lo que realmente hace. Si tu código hace referencia a `TODOIST_API_KEY` pero tu frontmatter no lo declara en `requires.env`, `primaryEnv` o `envVars`, el análisis marcará una discrepancia de metadatos. Mantener declaraciones precisas ayuda a que tu skill supere la revisión y ayuda a los usuarios a entender qué están instalando.

### Ejemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Gestionar tareas, proyectos y etiquetas de Todoist desde la línea de comandos.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token de la API de Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID de proyecto predeterminado opcional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Archivos permitidos

Publish solo acepta archivos “basados en texto”.

- La lista de extensiones permitidas está en `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Los archivos de script se siguen escaneando después de la carga; los archivos `.ps1`, `.psm1` y `.psd1` de PowerShell se aceptan como texto.
- Los tipos de contenido que empiezan por `text/` se tratan como texto; además de una pequeña lista de permitidos (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto de embeddings incluye `SKILL.md` + hasta ~40 archivos que no sean `.md` (límite de mejor esfuerzo).

## Slugs

- Derivados del nombre de la carpeta de forma predeterminada.
- Los scopes de paquete deben coincidir exactamente con el identificador de publicador de ClawHub. Los identificadores de publicador pueden usar letras minúsculas, números, guiones, puntos y guiones bajos; deben empezar y terminar con una letra minúscula o un número.
- Los slugs de paquete deben estar en minúsculas y ser seguros para npm; por ejemplo, `@example.tools/demo-plugin` o `demo-plugin`.

## Versionado + etiquetas

- Cada publicación crea una versión nueva (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa habitualmente.

## Licencia

- Todas las skills publicadas en ClawHub tienen licencia `MIT-0`.
- Cualquiera puede usar, modificar y redistribuir skills publicadas, incluso comercialmente.
- No se requiere atribución.
- No añadas términos de licencia en conflicto en `SKILL.md`; ClawHub no admite sobrescrituras de licencia por skill.

## Skills de pago

- ClawHub no admite skills de pago, precios por skill, muros de pago ni reparto de ingresos.
- No añadas metadatos de precios a `SKILL.md`; no forman parte del formato de skill y no harán que una skill publicada sea de pago.
- Si tu skill se integra con un servicio de terceros de pago, documenta claramente el coste externo y la cuenta requerida en las instrucciones de la skill y las declaraciones de entorno (`requires.env` para variables requeridas, o `envVars` con `required: false` para variables opcionales).
