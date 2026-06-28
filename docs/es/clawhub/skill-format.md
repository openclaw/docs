---
read_when:
    - Publicación de Skills
    - Depuración de fallos de publicación
summary: Formato de carpeta de Skills, archivos obligatorios, tipos de archivo permitidos, límites.
x-i18n:
    generated_at: "2026-06-28T05:17:37Z"
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

- `SKILL.md` (o `skill.md`; también se acepta el legado `skills.md`)

Opcional:

- cualquier archivo de apoyo _basado en texto_ (consulta “Archivos permitidos”)
- `.clawhubignore` (patrones de ignorado para publicar, legado `.clawdhubignore`)
- `.gitignore` (también se respeta)

## Importación desde GitHub

El importador web de GitHub es más estricto que la publicación/sincronización local. Solo descubre
archivos `SKILL.md` o el legado `skills.md` en repositorios públicos, que no sean forks, propiedad de
la cuenta de GitHub con la sesión iniciada. No importa repositorios privados, forks,
repositorios archivados/deshabilitados ni repositorios públicos de terceros.

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen de la skill en la interfaz/búsqueda.

## Metadatos de frontmatter

Los metadatos de la skill se declaran en el frontmatter YAML al principio de tu `SKILL.md`. Esto indica al registro (y al análisis de seguridad) qué necesita tu skill para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadatos de tiempo de ejecución (`metadata.openclaw`)

Declara los requisitos de tiempo de ejecución de tu skill en `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Usa `requires.env` para variables de entorno que deben estar presentes antes de que la skill pueda ejecutarse. Usa `envVars` cuando necesites metadatos por variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables de entorno obligatorias que espera tu skill.                                                                                       |
| `requires.bins`    | `string[]` | Binarios de CLI que deben estar todos instalados.                                                                                            |
| `requires.anyBins` | `string[]` | Binarios de CLI de los cuales debe existir al menos uno.                                                                                     |
| `requires.config`  | `string[]` | Rutas de archivos de configuración que lee tu skill.                                                                                         |
| `primaryEnv`       | `string`   | La variable de entorno de credencial principal de tu skill.                                                                                  |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Define `required: false` para variables de entorno opcionales. |
| `always`           | `boolean`  | Si es `true`, la skill siempre está activa (no se necesita instalación explícita).                                                           |
| `skillKey`         | `string`   | Sobrescribe la clave de invocación de la skill.                                                                                              |
| `emoji`            | `string`   | Emoji de visualización para la skill.                                                                                                        |
| `homepage`         | `string`   | URL de la página principal o documentación de la skill.                                                                                      |
| `os`               | `string[]` | Restricciones de sistema operativo (p. ej., `["macos"]`, `["linux"]`).                                                                       |
| `install`          | `array`    | Especificaciones de instalación para dependencias (ver abajo).                                                                               |
| `nix`              | `object`   | Especificación del plugin Nix (ver README).                                                                                                  |
| `config`           | `object`   | Especificación de configuración de Clawdbot (ver README).                                                                                    |

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

Declara variables de entorno opcionales en `metadata.openclaw.envVars` y define `required: false`. No añadas entradas opcionales a `requires.env`, porque `requires.env` significa que la skill no puede ejecutarse sin ellas.

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

El análisis de seguridad de ClawHub comprueba que lo que declara tu skill coincide con lo que realmente hace. Si tu código referencia `TODOIST_API_KEY` pero tu frontmatter no la declara en `requires.env`, `primaryEnv` o `envVars`, el análisis marcará una discrepancia de metadatos. Mantener las declaraciones precisas ayuda a que tu skill supere la revisión y ayuda a los usuarios a entender qué están instalando.

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
- Los tipos de contenido que empiezan por `text/` se tratan como texto; además de una pequeña lista de permitidos (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto para embeddings incluye `SKILL.md` + hasta ~40 archivos que no sean `.md` (límite de esfuerzo razonable).

## Slugs

- Se derivan del nombre de la carpeta de forma predeterminada.
- Los ámbitos de paquete deben coincidir exactamente con el identificador del publicador de ClawHub. Los identificadores de publicador pueden usar letras minúsculas, números, guiones, puntos y guiones bajos; deben empezar y terminar con una letra minúscula o un número.
- Los slugs de paquete deben estar en minúsculas y ser seguros para npm, por ejemplo `@example.tools/demo-plugin` o `demo-plugin`.

## Versionado + etiquetas

- Cada publicación crea una nueva versión (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa habitualmente.

## Licencia

- Todas las skills publicadas en ClawHub tienen licencia `MIT-0`.
- Cualquiera puede usar, modificar y redistribuir skills publicadas, incluso comercialmente.
- No se requiere atribución.
- No añadas términos de licencia contradictorios en `SKILL.md`; ClawHub no admite sobrescrituras de licencia por skill.

## Skills de pago

- ClawHub no admite skills de pago, precios por skill, muros de pago ni reparto de ingresos.
- No añadas metadatos de precios a `SKILL.md`; no forman parte del formato de skill y no harán que una skill publicada sea de pago.
- Si tu skill se integra con un servicio de terceros de pago, documenta claramente el coste externo y la cuenta requerida en las instrucciones de la skill y las declaraciones de entorno (`requires.env` para variables obligatorias, o `envVars` con `required: false` para variables opcionales).
