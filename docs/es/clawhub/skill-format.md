---
read_when:
    - Publicar Skills
    - Depuración de fallos de publicación/sincronización
summary: Formato de la carpeta de Skills, archivos obligatorios, tipos de archivo permitidos, límites.
x-i18n:
    generated_at: "2026-05-13T05:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de Skill

## En disco

Una Skill es una carpeta.

Obligatorio:

- `SKILL.md` (o `skill.md`)

Opcional:

- cualquier archivo de soporte _basado en texto_ (consulta “Archivos permitidos”)
- `.clawhubignore` (patrones de exclusión para publicación/sincronización, `.clawdhubignore` heredado)
- `.gitignore` (también se respeta)

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` heredado)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` heredado)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen de la Skill en la UI/búsqueda.

## Metadatos del frontmatter

Los metadatos de la Skill se declaran en el frontmatter YAML al principio de tu `SKILL.md`. Esto indica al registro (y al análisis de seguridad) qué necesita tu Skill para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Resumen breve de lo que hace esta Skill.
version: 1.0.0
---
```

### Metadatos de runtime (`metadata.openclaw`)

Declara los requisitos de runtime de tu Skill en `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestiona tareas mediante la API de Todoist.
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

Usa `requires.env` para las variables de entorno que deben estar presentes antes de que la Skill pueda ejecutarse. Usa `envVars` cuando necesites metadatos por variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                             |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables de entorno obligatorias que espera tu Skill.                                                                                                  |
| `requires.bins`    | `string[]` | Binarios de CLI que deben estar todos instalados.                                                                                                       |
| `requires.anyBins` | `string[]` | Binarios de CLI donde debe existir al menos uno.                                                                                                        |
| `requires.config`  | `string[]` | Rutas de archivos de configuración que lee tu Skill.                                                                                                    |
| `primaryEnv`       | `string`   | La variable de entorno principal de credenciales para tu Skill.                                                                                         |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Establece `required: false` para variables opcionales. |
| `always`           | `boolean`  | Si es `true`, la Skill siempre está activa (no se necesita instalación explícita).                                                                      |
| `skillKey`         | `string`   | Sobrescribe la clave de invocación de la Skill.                                                                                                        |
| `emoji`            | `string`   | Emoji mostrado para la Skill.                                                                                                                          |
| `homepage`         | `string`   | URL de la página principal o la documentación de la Skill.                                                                                             |
| `os`               | `string[]` | Restricciones de SO (p. ej. `["macos"]`, `["linux"]`).                                                                                                  |
| `install`          | `array`    | Especificaciones de instalación para dependencias (consulta abajo).                                                                                     |
| `nix`              | `object`   | Especificación del Plugin de Nix (consulta README).                                                                                                    |
| `config`           | `object`   | Especificación de configuración de Clawdbot (consulta README).                                                                                         |

### Especificaciones de instalación

Si tu Skill necesita dependencias instaladas, decláralas en el arreglo `install`:

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

Declara variables de entorno opcionales en `metadata.openclaw.envVars` y establece `required: false`. No agregues entradas opcionales a `requires.env`, porque `requires.env` significa que la Skill no puede ejecutarse sin ellas.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token de API de Todoist usado para solicitudes autenticadas.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID de proyecto predeterminado opcional cuando el usuario no especifica uno.
```

### Por qué esto importa

El análisis de seguridad de ClawHub comprueba que lo que declara tu Skill coincida con lo que realmente hace. Si tu código referencia `TODOIST_API_KEY` pero tu frontmatter no la declara en `requires.env`, `primaryEnv` o `envVars`, el análisis marcará una discrepancia de metadatos. Mantener las declaraciones precisas ayuda a que tu Skill apruebe la revisión y ayuda a los usuarios a entender qué están instalando.

### Ejemplo: frontmatter completo

```yaml
---
name: todoist-cli
description: Gestiona tareas, proyectos y etiquetas de Todoist desde la línea de comandos.
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
        description: Token de API de Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID de proyecto predeterminado opcional.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Archivos permitidos

La publicación solo acepta archivos “basados en texto”.

- La lista de extensiones permitidas está en `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Los archivos de script siguen analizándose después de la carga; los archivos PowerShell `.ps1`, `.psm1` y `.psd1` se aceptan como texto.
- Los tipos de contenido que empiezan por `text/` se tratan como texto; además de una pequeña lista permitida (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto de embedding incluye `SKILL.md` + hasta ~40 archivos que no sean `.md` (límite de mejor esfuerzo).

## Slugs

- Se derivan del nombre de la carpeta de forma predeterminada.
- Deben estar en minúsculas y ser seguros para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionado + etiquetas

- Cada publicación crea una nueva versión (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa habitualmente.

## Licencia

- Todas las Skills publicadas en ClawHub tienen licencia `MIT-0`.
- Cualquiera puede usar, modificar y redistribuir Skills publicadas, incluso comercialmente.
- No se requiere atribución.
- No agregues términos de licencia en conflicto en `SKILL.md`; ClawHub no admite sobrescrituras de licencia por Skill.

## Skills de pago

- ClawHub no admite Skills de pago, precios por Skill, muros de pago ni reparto de ingresos.
- No agregues metadatos de precio a `SKILL.md`; no forman parte del formato de Skill y no harán que una Skill publicada sea de pago.
- Si tu Skill se integra con un servicio de terceros de pago, documenta claramente el costo externo y la cuenta requerida en las instrucciones de la Skill y las declaraciones de entorno (`requires.env` para variables obligatorias, o `envVars` con `required: false` para variables opcionales).
