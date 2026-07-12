---
read_when:
    - Publicación de Skills
    - Depuración de fallos de publicación
summary: Formato de la carpeta de Skills, archivos obligatorios, tipos de archivo permitidos y límites.
x-i18n:
    generated_at: "2026-07-11T22:54:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato de Skills

## En disco

Una Skill es una carpeta.

Obligatorio:

- `SKILL.md` (o `skill.md`; también se acepta el formato heredado `skills.md`)

Opcional:

- cualquier archivo auxiliar _basado en texto_ (consulta «Archivos permitidos»)
- `.clawhubignore` (patrones que se ignorarán al publicar; formato heredado `.clawdhubignore`)
- `.gitignore` (también se respeta)

## Importación desde GitHub

El importador web de GitHub es más estricto que la publicación o sincronización local. Solo detecta archivos `SKILL.md` o archivos heredados `skills.md` en repositorios públicos que no sean bifurcaciones y pertenezcan a la cuenta de GitHub que ha iniciado sesión. No importa repositorios privados, bifurcaciones, repositorios archivados o deshabilitados ni repositorios públicos de terceros.

Metadatos de instalación local (escritos por la CLI):

- `<skill>/.clawhub/origin.json` (formato heredado `.clawdhub`)

Estado de instalación del directorio de trabajo (escrito por la CLI):

- `<workdir>/.clawhub/lock.json` (formato heredado `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae los metadatos del frontmatter durante la publicación.
- `description` se usa como resumen de la Skill en la interfaz y las búsquedas.

Para las Agent Skills portables, `name` debe coincidir con el directorio superior y usar entre 1 y 64 letras minúsculas, números o guiones. ClawHub mantiene separados el slug enrutable y el nombre mostrado en el catálogo, por lo que los nombres existentes de otros clientes se pueden seguir publicando y no se reescriben silenciosamente. Las listas del catálogo pueden acortar visualmente los nombres largos sin cambiar el nombre almacenado.

## Metadatos del frontmatter

Los metadatos de la Skill se declaran en el frontmatter YAML al principio de `SKILL.md`. Esto indica al registro (y al análisis de seguridad) qué necesita la Skill para ejecutarse.

### Frontmatter básico

```yaml
---
name: my-skill
description: Resumen breve de lo que hace esta Skill.
version: 1.0.0
---
```

### Metadatos de ejecución (`metadata.openclaw`)

Declara los requisitos de ejecución de tu Skill en `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Usa `requires.env` para las variables de entorno que deben estar presentes antes de que la Skill pueda ejecutarse. Usa `envVars` cuando necesites metadatos para cada variable, incluidas variables opcionales con `required: false`.

### Referencia completa de campos

| Campo              | Tipo       | Descripción                                                                                                                                                           |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables de entorno obligatorias que espera tu Skill.                                                                                                                |
| `requires.bins`    | `string[]` | Binarios de la CLI que deben estar instalados en su totalidad.                                                                                                        |
| `requires.anyBins` | `string[]` | Binarios de la CLI de los que debe existir al menos uno.                                                                                                              |
| `requires.config`  | `string[]` | Rutas de los archivos de configuración que lee tu Skill.                                                                                                              |
| `primaryEnv`       | `string`   | Variable de entorno principal de credenciales para tu Skill.                                                                                                          |
| `envVars`          | `array`    | Declaraciones de variables de entorno con `name`, `required` opcional y `description` opcional. Establece `required: false` para las variables de entorno opcionales. |
| `always`           | `boolean`  | Si es `true`, la Skill está siempre activa (no requiere instalación explícita).                                                                                        |
| `skillKey`         | `string`   | Sustituye la clave de invocación de la Skill.                                                                                                                          |
| `emoji`            | `string`   | Emoji que se muestra para la Skill.                                                                                                                                    |
| `homepage`         | `string`   | URL de la página principal o la documentación de la Skill.                                                                                                            |
| `os`               | `string[]` | Restricciones del sistema operativo (por ejemplo, `["macos"]`, `["linux"]`).                                                                                            |
| `install`          | `array`    | Especificaciones de instalación de las dependencias (consulta más adelante).                                                                                          |
| `nix`              | `object`   | Especificación del Plugin de Nix (consulta el archivo README).                                                                                                         |
| `config`           | `object`   | Especificación de configuración de Clawdbot (consulta el archivo README).                                                                                              |

### Especificaciones de instalación

Si tu Skill necesita que se instalen dependencias, decláralas en el arreglo `install`:

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

Declara las variables de entorno opcionales en `metadata.openclaw.envVars` y establece `required: false`. No añadas entradas opcionales a `requires.env`, ya que `requires.env` significa que la Skill no puede ejecutarse sin ellas.

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
        description: Identificador opcional del proyecto predeterminado cuando el usuario no especifica uno.
```

### Por qué es importante

El análisis de seguridad de ClawHub comprueba que lo declarado por tu Skill coincida con lo que realmente hace. Si tu código hace referencia a `TODOIST_API_KEY`, pero el frontmatter no la declara en `requires.env`, `primaryEnv` o `envVars`, el análisis señalará una discrepancia en los metadatos. Mantener las declaraciones precisas ayuda a que tu Skill supere la revisión y a que los usuarios comprendan qué están instalando.

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
        description: Token de la API de Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Identificador opcional del proyecto predeterminado.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Archivos permitidos

La publicación solo acepta archivos «basados en texto».

- La lista de extensiones permitidas está en `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Los archivos de script se siguen analizando después de cargarlos; los archivos de PowerShell `.ps1`, `.psm1` y `.psd1` se aceptan como texto.
- Los tipos de contenido que comienzan por `text/` se tratan como texto, junto con una pequeña lista de formatos permitidos (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Límites (del lado del servidor):

- Tamaño total del paquete: 50 MB.
- El texto para generar las representaciones vectoriales incluye `SKILL.md` y hasta unos 40 archivos que no sean `.md` (límite aproximado sujeto al mejor esfuerzo).

## Slugs

- De forma predeterminada, se derivan del nombre de la carpeta.
- Los ámbitos de los paquetes deben coincidir exactamente con el identificador del editor de ClawHub. Los identificadores de editor pueden usar letras minúsculas, números, guiones, puntos y guiones bajos; deben comenzar y terminar con una letra minúscula o un número.
- Los slugs de los paquetes deben estar en minúsculas y ser compatibles con npm; por ejemplo, `@example.tools/demo-plugin` o `demo-plugin`.

## Control de versiones y etiquetas

- Cada publicación crea una versión nueva (semver).
- Las etiquetas son punteros de texto a una versión; se suele usar `latest`.

## Licencia

- Todas las Skills publicadas en ClawHub se distribuyen bajo la licencia `MIT-0`.
- Cualquiera puede usar, modificar y redistribuir las Skills publicadas, incluso con fines comerciales.
- No se requiere atribución.
- No añadas condiciones de licencia incompatibles en `SKILL.md`; ClawHub no admite sustituciones de licencia para Skills individuales.

## Skills de pago

- ClawHub no admite Skills de pago, precios por Skill, muros de pago ni reparto de ingresos.
- No añadas metadatos de precios a `SKILL.md`; no forman parte del formato de Skills y no harán que una Skill publicada sea de pago.
- Si tu Skill se integra con un servicio de terceros de pago, documenta claramente el coste externo y la cuenta necesaria en las instrucciones de la Skill y en las declaraciones de entorno (`requires.env` para las variables obligatorias o `envVars` con `required: false` para las variables opcionales).
