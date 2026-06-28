---
read_when:
    - Publicar Skills
    - Depurar fallos de publicación
summary: Formato de la carpeta de Skills, archivos requeridos, tipos de archivo permitidos, límites.
x-i18n:
    generated_at: "2026-06-28T05:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de habilidad

## En disco

Una habilidad es una carpeta.

Obligatorio:

- `SKILL.md` (o `skill.md`; también se acepta el heredado `skills.md`)

Opcional:

- cualquier archivo de apoyo _basado en texto_ (consulta “Archivos permitidos”)
- `.clawhubignore` (patrones de exclusión para publicar, heredado `.clawdhubignore`)
- `.gitignore` (también se respeta)

## Importación desde GitHub

El importador web de GitHub es más estricto que la publicación/sincronización local. Solo descubre archivos
`SKILL.md` o archivos heredados `skills.md` en repositorios públicos que no sean forks y que pertenezcan a
la cuenta de GitHub con sesión iniciada. No importa repositorios privados, forks,
repositorios archivados/deshabilitados ni repositorios públicos de terceros.

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (heredado `.clawdhub`)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (heredado `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen de la habilidad en la UI/búsqueda.

## Metadatos del frontmatter

Los metadatos de la habilidad se declaran en el frontmatter YAML al principio de tu `SKILL.md`. Esto le indica al registro (y al análisis de seguridad) qué necesita tu habilidad para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadatos de runtime (`metadata.openclaw`)

Declara los requisitos de runtime de tu habilidad bajo `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
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

Usa `requires.env` para las variables de entorno que deben estar presentes antes de que la habilidad pueda ejecutarse. Usa `envVars` cuando necesites metadatos por variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables de entorno obligatorias que espera tu habilidad.                                                                                   |
| `requires.bins`    | `string[]` | Binarios de CLI que deben estar todos instalados.                                                                                            |
| `requires.anyBins` | `string[]` | Binarios de CLI donde al menos uno debe existir.                                                                                             |
| `requires.config`  | `string[]` | Rutas de archivos de configuración que lee tu habilidad.                                                                                     |
| `primaryEnv`       | `string`   | La variable de entorno de credencial principal para tu habilidad.                                                                            |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Establece `required: false` para variables de entorno opcionales. |
| `always`           | `boolean`  | Si es `true`, la habilidad siempre está activa (no se necesita instalación explícita).                                                       |
| `skillKey`         | `string`   | Sobrescribe la clave de invocación de la habilidad.                                                                                          |
| `emoji`            | `string`   | Emoji de visualización para la habilidad.                                                                                                    |
| `homepage`         | `string`   | URL de la página principal o la documentación de la habilidad.                                                                               |
| `os`               | `string[]` | Restricciones de SO (por ejemplo, `["macos"]`, `["linux"]`).                                                                                 |
| `install`          | `array`    | Especificaciones de instalación para dependencias (consulta abajo).                                                                          |
| `nix`              | `object`   | Especificación del plugin Nix (consulta README).                                                                                             |
| `config`           | `object`   | Especificación de configuración de Clawdbot (consulta README).                                                                               |

### Especificaciones de instalación

Si tu habilidad necesita dependencias instaladas, decláralas en el array `install`:

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

Tipos de instalación compatibles: `brew`, `node`, `go`, `uv`.

### Variables de entorno opcionales

Declara variables de entorno opcionales bajo `metadata.openclaw.envVars` y establece `required: false`. No agregues entradas opcionales a `requires.env`, porque `requires.env` significa que la habilidad no puede ejecutarse sin ellas.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Por qué esto importa

El análisis de seguridad de ClawHub comprueba que lo que declara tu habilidad coincida con lo que realmente hace. Si tu código referencia `TODOIST_API_KEY` pero tu frontmatter no la declara bajo `requires.env`, `primaryEnv` o `envVars`, el análisis señalará una discrepancia de metadatos. Mantener declaraciones precisas ayuda a que tu habilidad pase la revisión y ayuda a los usuarios a entender qué están instalando.

### Ejemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
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
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Archivos permitidos

La publicación solo acepta archivos “basados en texto”.

- La lista de extensiones permitidas está en `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Los archivos de script se siguen escaneando después de la carga; los archivos PowerShell `.ps1`, `.psm1` y `.psd1` se aceptan como texto.
- Los tipos de contenido que empiezan por `text/` se tratan como texto; además de una pequeña lista permitida (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto para embedding incluye `SKILL.md` + hasta ~40 archivos que no sean `.md` (límite de mejor esfuerzo).

## Slugs

- Se derivan del nombre de la carpeta de forma predeterminada.
- Los scopes de paquete deben coincidir exactamente con el identificador de publisher de ClawHub. Los identificadores de publisher pueden usar letras minúsculas, números, guiones, puntos y guiones bajos; deben empezar y terminar con una letra minúscula o un número.
- Los slugs de paquete deben estar en minúsculas y ser seguros para npm, por ejemplo `@example.tools/demo-plugin` o `demo-plugin`.

## Versionado + etiquetas

- Cada publicación crea una versión nueva (semver).
- Las etiquetas son punteros de string a una versión; `latest` se usa comúnmente.

## Licencia

- Todas las habilidades publicadas en ClawHub tienen licencia `MIT-0`.
- Cualquiera puede usar, modificar y redistribuir habilidades publicadas, incluso comercialmente.
- No se requiere atribución.
- No agregues términos de licencia en conflicto en `SKILL.md`; ClawHub no admite sobrescrituras de licencia por habilidad.

## Habilidades de pago

- ClawHub no admite habilidades de pago, precios por habilidad, paywalls ni reparto de ingresos.
- No agregues metadatos de precios a `SKILL.md`; no forman parte del formato de habilidad y no harán que una habilidad publicada sea de pago.
- Si tu habilidad se integra con un servicio externo de pago, documenta claramente el costo externo y la cuenta requerida en las instrucciones de la habilidad y las declaraciones de entorno (`requires.env` para variables obligatorias, o `envVars` con `required: false` para variables opcionales).
