---
read_when:
    - Publicación de Skills
    - Depuración de fallos de publicación/sincronización
summary: Formato de carpeta de Skills, archivos obligatorios, tipos de archivo permitidos, límites.
x-i18n:
    generated_at: "2026-05-12T12:49:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de Skill

## En disco

Un Skill es una carpeta.

Obligatorio:

- `SKILL.md` (o `skill.md`)

Opcional:

- cualquier archivo de apoyo _basado en texto_ (consulta “Archivos permitidos”)
- `.clawhubignore` (patrones de exclusión para publicación/sincronización, heredado `.clawdhubignore`)
- `.gitignore` (también se respeta)

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (heredado `.clawdhub`)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (heredado `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen del Skill en la interfaz de usuario/búsqueda.

## Metadatos de frontmatter

Los metadatos del Skill se declaran en el frontmatter YAML al principio de tu `SKILL.md`. Esto indica al registro (y al análisis de seguridad) qué necesita tu Skill para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadatos de runtime (`metadata.openclaw`)

Declara los requisitos de runtime de tu Skill bajo `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Usa `requires.env` para variables de entorno que deben estar presentes antes de que el Skill pueda ejecutarse. Usa `envVars` cuando necesites metadatos por variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables de entorno requeridas que tu Skill espera.                                                                                         |
| `requires.bins`    | `string[]` | Binarios de CLI que deben estar todos instalados.                                                                                             |
| `requires.anyBins` | `string[]` | Binarios de CLI donde al menos uno debe existir.                                                                                              |
| `requires.config`  | `string[]` | Rutas de archivos de configuración que tu Skill lee.                                                                                          |
| `primaryEnv`       | `string`   | La variable de entorno de credencial principal para tu Skill.                                                                                 |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Establece `required: false` para variables de entorno opcionales. |
| `always`           | `boolean`  | Si es `true`, el Skill siempre está activo (no se necesita instalación explícita).                                                            |
| `skillKey`         | `string`   | Sobrescribe la clave de invocación del Skill.                                                                                                 |
| `emoji`            | `string`   | Emoji mostrado para el Skill.                                                                                                                 |
| `homepage`         | `string`   | URL a la página principal o documentación del Skill.                                                                                          |
| `os`               | `string[]` | Restricciones de sistema operativo (por ejemplo, `["macos"]`, `["linux"]`).                                                                   |
| `install`          | `array`    | Especificaciones de instalación para dependencias (ver abajo).                                                                                |
| `nix`              | `object`   | Especificación de plugin Nix (consulta README).                                                                                               |
| `config`           | `object`   | Especificación de configuración de Clawdbot (consulta README).                                                                                |

### Especificaciones de instalación

Si tu Skill necesita dependencias instaladas, decláralas en el array `install`:

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

Declara variables de entorno opcionales bajo `metadata.openclaw.envVars` y establece `required: false`. No añadas entradas opcionales a `requires.env`, porque `requires.env` significa que el Skill no puede ejecutarse sin ellas.

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

El análisis de seguridad de ClawHub comprueba que lo que tu Skill declara coincida con lo que realmente hace. Si tu código referencia `TODOIST_API_KEY` pero tu frontmatter no lo declara bajo `requires.env`, `primaryEnv` o `envVars`, el análisis marcará una discrepancia de metadatos. Mantener declaraciones precisas ayuda a que tu Skill pase la revisión y ayuda a los usuarios a entender qué están instalando.

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

Publish solo acepta archivos “basados en texto”.

- La lista de extensiones permitidas está en `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Los archivos de script se siguen escaneando después de la carga; los archivos PowerShell `.ps1`, `.psm1` y `.psd1` se aceptan como texto.
- Los tipos de contenido que empiezan por `text/` se tratan como texto; además de una pequeña lista permitida (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto de embedding incluye `SKILL.md` + hasta aproximadamente 40 archivos que no sean `.md` (límite de máximo esfuerzo).

## Slugs

- Se derivan del nombre de la carpeta de forma predeterminada.
- Deben estar en minúsculas y ser seguros para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionado + etiquetas

- Cada publicación crea una nueva versión (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa habitualmente.

## Licencia

- Todos los Skills publicados en ClawHub tienen licencia `MIT-0`.
- Cualquier persona puede usar, modificar y redistribuir Skills publicados, incluso comercialmente.
- No se requiere atribución.
- No añadas términos de licencia contradictorios en `SKILL.md`; ClawHub no admite sobrescrituras de licencia por Skill.

## Skills de pago

- ClawHub no admite Skills de pago, precios por Skill, paywalls ni reparto de ingresos.
- No añadas metadatos de precio a `SKILL.md`; no forman parte del formato de Skill y no harán que un Skill publicado sea de pago.
- Si tu Skill se integra con un servicio de terceros de pago, documenta claramente el costo externo y la cuenta requerida en las instrucciones del Skill y las declaraciones de entorno (`requires.env` para variables requeridas, o `envVars` con `required: false` para variables opcionales).
