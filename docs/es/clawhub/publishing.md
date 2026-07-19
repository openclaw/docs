---
read_when:
    - Publicar una skill o un plugin
    - Depuración de errores de propietario o de ámbito del paquete
    - Añadir comportamiento de publicación en la interfaz de usuario, la CLI o el backend
summary: Cómo funciona la publicación en ClawHub para Skills, plugins, propietarios, ámbitos, versiones y revisión.
x-i18n:
    generated_at: "2026-07-19T01:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 582dffaf4429e9f24d7c38f2809cc7dc05f8471e4ae2f9c6be60153cc8604e3f
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicación

La publicación envía una carpeta de skill o un paquete de plugin a ClawHub con el propietario que se
elija. ClawHub comprueba que el token pueda publicar para ese propietario, valida los
metadatos, el nombre, la versión, los archivos y la información de origen y, a continuación, almacena la versión
e inicia comprobaciones de seguridad automatizadas.

Si la validación falla, no se publica nada. Las versiones nuevas también pueden quedar fuera de las
superficies normales de instalación y descarga hasta que finalice la revisión.

## Skills

La vía de publicación más sencilla es la CLI. Inicie sesión y, a continuación, publique una carpeta
local de skill:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Use `--owner <handle>` al publicar para el propietario de una organización. Omítalo para publicar como
el usuario autenticado. La publicación omite el contenido sin cambios. Una skill nueva comienza
en `1.0.0`, y los cambios posteriores publican automáticamente la siguiente versión de parche. Pase
`--version` solo cuando necesite una versión explícita.

Para repositorios de catálogo, use el
[flujo de trabajo `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) reutilizable de ClawHub.
Este llama a `skill publish` para cada carpeta de skill inmediata en `root` (valor predeterminado:
`skills`), o solo para la carpeta proporcionada como `skill_path`.

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

Use `dry_run: true` para obtener una vista previa de las skills nuevas y modificadas sin publicarlas.

## Plugins

Los plugins usan nombres de paquete al estilo de npm. Los nombres de paquete con ámbito incluyen al propietario en
la primera parte del nombre:

```text
@owner/package-name
```

El ámbito debe coincidir con el propietario seleccionado para la publicación. Si el paquete se llama
`@openclaw/dronzer`, solo se puede publicar como `@openclaw`. Si publica como
`@vintageayu`, cambie el nombre del paquete a `@vintageayu/dronzer`.

Esto impide que un paquete se apropie del espacio de nombres de una organización que el editor no
controla.

Si es el propietario legítimo de una organización, marca, ámbito de paquete, identificador de propietario o
espacio de nombres que ya esté reclamado o reservado en ClawHub, abra una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas que no sean confidenciales. Consulte
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) para saber qué incluir y qué
dejar fuera de las incidencias públicas.

### Antes de publicar un plugin

- Elija un propietario que coincida con el ámbito del paquete.
- Incluya `openclaw.plugin.json`. Los plugins de código también necesitan `package.json` con
  `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.
- Para mostrar un icono personalizado del catálogo de plugins en la página de inicio y en las páginas de listas de plugins,
  añada `icon` a `openclaw.plugin.json` con cualquier URL de imagen HTTPS.
- Incluya el repositorio de origen y los metadatos exactos del commit, o use la CLI desde un
  checkout respaldado por GitHub para que pueda detectarlos.
- Ejecute `clawhub package validate <source>` antes de publicar. Para los hallazgos relacionados con el paquete,
  el manifiesto, las importaciones del SDK o los artefactos, consulte
  [Correcciones de validación de plugins](/clawhub/plugin-validation-fixes).
- Ejecute `clawhub package publish <source> --dry-run` antes de crear una versión.
- Cabe esperar que las versiones nuevas permanezcan fuera de las superficies públicas de instalación hasta que finalicen las
  comprobaciones de seguridad automatizadas y la verificación.

### Publicación de confianza para paquetes

La publicación de confianza de paquetes requiere una configuración de dos pasos:

1. Publique el paquete una vez mediante el proceso normal manual o autenticado con token
   `clawhub package publish`. Esto crea el registro del paquete y establece los
   administradores del paquete que pueden cambiar la configuración del editor de confianza.
2. Un administrador del paquete establece la configuración del editor de confianza de GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Una vez establecida la configuración, las futuras publicaciones compatibles de GitHub Actions pueden usar
OIDC o la publicación de confianza sin almacenar un token de ClawHub de larga duración en el
repositorio. El repositorio y el nombre de archivo del flujo de trabajo configurados deben coincidir con la
declaración OIDC de GitHub Actions. Si también pasa `--environment <name>`, la declaración del
entorno de GitHub Actions debe coincidir exactamente con ese nombre.

ClawHub verifica el repositorio de GitHub configurado cuando se establece la configuración del editor
de confianza. Los repositorios públicos pueden verificarse mediante los metadatos públicos de GitHub.
Los repositorios privados requieren que ClawHub tenga acceso de GitHub a ese repositorio,
por ejemplo, mediante una futura instalación de la aplicación de GitHub de ClawHub u otra
integración de GitHub autorizada.

El flujo de trabajo reutilizable actual de publicación de paquetes admite la publicación de confianza
sin secretos para publicaciones de `workflow_dispatch` cuando `id-token: write` está
disponible. Las publicaciones reales mediante el envío de etiquetas siguen necesitando `clawhub_token`, por lo que se debe mantener
`CLAWHUB_TOKEN` disponible para versiones con etiqueta, primeras publicaciones, paquetes que no sean de confianza
o publicaciones de emergencia.

Inspeccione o elimine la configuración con:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Eliminar la configuración del editor de confianza es la vía de reversión. Deshabilita la futura
emisión de tokens de publicación de confianza hasta que un administrador del paquete vuelva a establecer la configuración.

## Preguntas frecuentes

### El ámbito del paquete debe coincidir con el propietario seleccionado

Si el ámbito del paquete y el propietario seleccionado no coinciden, ClawHub rechaza la
publicación:

```text
El ámbito del paquete "@openclaw" debe coincidir con el propietario seleccionado "@vintageayu".
Publique como "@openclaw" o cambie el nombre de este paquete a "@vintageayu/dronzer".
```

Para corregirlo, elija el propietario indicado por el ámbito del paquete o cambie el nombre del
paquete para que el ámbito coincida con el propietario con el que puede publicar.

Si el nombre del paquete ya tiene el ámbito correcto, pero el paquete pertenece al
editor equivocado, transfiera la propiedad en su lugar:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Use la transferencia de paquetes o skills solo cuando tenga acceso de administrador tanto al
propietario actual como al editor de destino. La transferencia de paquetes no permite
publicar en un ámbito que no pueda administrar.

Si no tiene acceso al propietario actual, pero considera que su organización, proyecto o
marca es el propietario legítimo del espacio de nombres, abra una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas que no sean confidenciales para que el personal las revise. Consulte
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) antes de presentarla.

Esto protege los espacios de nombres de las organizaciones. Un paquete llamado `@openclaw/dronzer` reclama el
espacio de nombres `@openclaw`, por lo que solo los editores con acceso al propietario `@openclaw`
pueden publicarlo.
