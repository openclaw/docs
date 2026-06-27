---
read_when:
    - Publicar una skill o un plugin
    - Depuración de errores de propietario o de alcance de paquete
    - Agregar comportamiento de publicación en la interfaz de usuario, la CLI o el backend
summary: Cómo funciona la publicación en ClawHub para Skills, plugins, propietarios, ámbitos, versiones y revisión.
x-i18n:
    generated_at: "2026-06-27T10:54:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicación

Publicar envía una carpeta de skill o un paquete de plugin a ClawHub bajo el propietario que
elijas. ClawHub comprueba que tu token pueda publicar para ese propietario, valida los
metadatos, el nombre, la versión, los archivos y la información de origen, luego almacena la versión
e inicia comprobaciones de seguridad automatizadas.

Si la validación falla, no se publica nada. Las nuevas versiones también pueden permanecer fuera de
las superficies normales de instalación y descarga hasta que termine la revisión.

## Skills

La ruta de publicación más sencilla es la CLI. Inicia sesión y luego publica una carpeta de skill
local:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Usa `--owner <handle>` al publicar para un propietario de organización. Omítelo para publicar como
el usuario autenticado. La publicación omite el contenido sin cambios. Una skill nueva empieza
en `1.0.0`, y los cambios posteriores publican automáticamente la siguiente versión de parche. Pasa
`--version` solo cuando necesites una versión explícita.

Para repositorios de catálogo, usa el
[flujo de trabajo reutilizable `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
de ClawHub. Llama a `skill publish` para cada carpeta de skill inmediata bajo `root` (predeterminado:
`skills`), o solo la carpeta proporcionada como `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Usa `dry_run: true` para previsualizar skills nuevas y modificadas sin publicar.

## Plugins

Los plugins usan nombres de paquete al estilo de npm. Los nombres de paquete con ámbito incluyen al propietario en
la primera parte del nombre:

```text
@owner/package-name
```

El ámbito debe coincidir con el propietario de publicación seleccionado. Si tu paquete se llama
`@openclaw/dronzer`, solo puede publicarse como `@openclaw`. Si publicas como
`@vintageayu`, cambia el nombre del paquete a `@vintageayu/dronzer`.

Esto evita que un paquete reclame un espacio de nombres de organización que el publicador no
controla.

Si eres el propietario legítimo de una organización, marca, ámbito de paquete, identificador de propietario o
espacio de nombres que ya está reclamado o reservado en ClawHub, abre una
[incidencia de reclamo de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles. Consulta
[Reclamos de organización y espacio de nombres](/es/clawhub/namespace-claims) para saber qué incluir y qué
mantener fuera de las incidencias públicas.

### Antes de publicar un Plugin

- Elige un propietario que coincida con el ámbito del paquete.
- Incluye `openclaw.plugin.json`. Los plugins de código también necesitan `package.json` con
  `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.
- Para mostrar un icono personalizado en la tarjeta del plugin, añade `icon` a `openclaw.plugin.json` con
  cualquier URL de imagen HTTPS.
- Incluye el repositorio de origen y los metadatos exactos del commit, o usa la CLI desde un
  checkout respaldado por GitHub para que pueda detectarlos.
- Ejecuta `clawhub package validate <source>` antes de publicar. Para hallazgos de paquete,
  manifiesto, importación de SDK o artefacto, consulta
  [Correcciones de validación de plugins](/es/clawhub/plugin-validation-fixes).
- Ejecuta `clawhub package publish <source> --dry-run` antes de crear una versión.
- Espera que las nuevas versiones permanezcan fuera de las superficies públicas de instalación hasta que finalicen
  las comprobaciones de seguridad automatizadas y la verificación.

### Publicación confiable para paquetes

La publicación confiable de paquetes es una configuración de dos pasos:

1. Publica el paquete una vez mediante `clawhub package publish` normal, manual o autenticado por token.
   Esto crea la fila del paquete y establece los administradores del paquete que pueden cambiar su configuración
   de publicador confiable.
2. Un administrador del paquete define la configuración de publicador confiable de GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Después de establecer la configuración, las futuras publicaciones compatibles de GitHub Actions pueden usar
OIDC/publicación confiable sin almacenar un token de ClawHub de larga duración en el
repositorio. El repositorio configurado y el nombre de archivo del flujo de trabajo deben coincidir con la
declaración OIDC de GitHub Actions. Si también pasas `--environment <name>`, la declaración de entorno de GitHub
Actions debe coincidir exactamente con ese nombre.

ClawHub verifica el repositorio de GitHub configurado cuando se establece la configuración del publicador confiable.
Los repositorios públicos pueden verificarse mediante metadatos públicos de GitHub.
Los repositorios privados requieren que ClawHub tenga acceso de GitHub a ese repositorio,
por ejemplo mediante una futura instalación de la GitHub App de ClawHub u otra
integración autorizada de GitHub.

El flujo de trabajo reutilizable actual de publicación de paquetes admite publicación confiable sin secretos
para publicaciones de `workflow_dispatch` cuando `id-token: write` está
disponible. Las publicaciones reales por push de etiqueta siguen necesitando `clawhub_token`, así que mantén
`CLAWHUB_TOKEN` disponible para versiones por etiqueta, primeras publicaciones, paquetes no confiables
o publicaciones de emergencia.

Inspecciona o elimina la configuración con:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Eliminar la configuración del publicador confiable es la ruta de reversión. Desactiva la futura
emisión de tokens de publicación confiable hasta que un administrador del paquete vuelva a establecer la configuración.

## Preguntas frecuentes

### El ámbito del paquete debe coincidir con el propietario seleccionado

Si el ámbito del paquete y el propietario seleccionado no coinciden, ClawHub rechaza la
publicación:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Para solucionarlo, elige el propietario nombrado por el ámbito del paquete o cambia el nombre del
paquete para que el ámbito coincida con el propietario con el que puedes publicar.

Si el nombre del paquete ya tiene el ámbito correcto pero el paquete pertenece al
publicador equivocado, transfiere la propiedad en su lugar:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa la transferencia de paquetes o skills solo cuando tengas acceso de administrador tanto al
propietario actual como al publicador de destino. La transferencia de paquetes no te permite
publicar en un ámbito que no puedes administrar.

Si no tienes acceso al propietario actual pero crees que tu organización, proyecto o
marca es el propietario legítimo del espacio de nombres, abre una
[incidencia de reclamo de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles para revisión del personal. Consulta
[Reclamos de organización y espacio de nombres](/es/clawhub/namespace-claims) antes de presentarla.

Esto protege los espacios de nombres de organización. Un paquete llamado `@openclaw/dronzer` reclama el
espacio de nombres `@openclaw`, por lo que solo los publicadores con acceso al propietario `@openclaw`
pueden publicarlo.
