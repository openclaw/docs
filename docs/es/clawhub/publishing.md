---
read_when:
    - Publicar una Skill o un Plugin
    - Depuración de errores de propietario o de ámbito de paquete
    - Añadir comportamiento de publicación en la interfaz de usuario, la CLI o el backend
summary: Cómo funciona la publicación en ClawHub para Skills, plugins, propietarios, ámbitos, versiones y revisión.
x-i18n:
    generated_at: "2026-07-11T22:57:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicación

La publicación envía una carpeta de Skills o un paquete de Plugin a ClawHub bajo el propietario que
elijas. ClawHub comprueba que tu token pueda publicar para ese propietario, valida los
metadatos, el nombre, la versión, los archivos y la información de origen; después almacena la versión
e inicia comprobaciones de seguridad automatizadas.

Si la validación falla, no se publica nada. Las versiones nuevas también pueden quedar fuera de
las interfaces normales de instalación y descarga hasta que termine la revisión.

## Skills

La vía de publicación más sencilla es la CLI. Inicia sesión y después publica una carpeta local de Skills:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Usa `--owner <handle>` al publicar para el propietario de una organización. Omítelo para publicar como
el usuario autenticado. La publicación omite el contenido sin cambios. Una nueva Skill comienza
en `1.0.0`, y los cambios posteriores publican automáticamente la siguiente versión de parche. Pasa
`--version` solo cuando necesites una versión explícita.

Para repositorios de catálogo, usa el
[flujo de trabajo reutilizable `skill-publish.yml` de ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Este llama a `skill publish` para cada carpeta de Skills que se encuentre directamente bajo `root` (valor predeterminado:
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

Usa `dry_run: true` para previsualizar las Skills nuevas y modificadas sin publicarlas.

## Plugins

Los Plugins usan nombres de paquete al estilo de npm. Los nombres de paquete con ámbito incluyen al propietario en
la primera parte del nombre:

```text
@owner/package-name
```

El ámbito debe coincidir con el propietario seleccionado para la publicación. Si tu paquete se llama
`@openclaw/dronzer`, solo puede publicarse como `@openclaw`. Si publicas como
`@vintageayu`, cambia el nombre del paquete a `@vintageayu/dronzer`.

Esto impide que un paquete se apropie del espacio de nombres de una organización que el publicador
no controla.

Si eres el propietario legítimo de una organización, marca, ámbito de paquete, identificador de propietario o
espacio de nombres que ya está reclamado o reservado en ClawHub, abre una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles. Consulta
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) para saber qué incluir y qué
dejar fuera de las incidencias públicas.

### Antes de publicar un Plugin

- Elige un propietario que coincida con el ámbito del paquete.
- Incluye `openclaw.plugin.json`. Los Plugins de código también necesitan `package.json` con
  `openclaw.compat.pluginApi` y `openclaw.build.openclawVersion`.
- Para mostrar un icono personalizado en la tarjeta del Plugin, añade `icon` a `openclaw.plugin.json` con
  cualquier URL de imagen HTTPS.
- Incluye el repositorio de origen y los metadatos exactos del commit, o usa la CLI desde un
  checkout respaldado por GitHub para que pueda detectarlos.
- Ejecuta `clawhub package validate <source>` antes de publicar. Para hallazgos relacionados con el paquete,
  el manifiesto, las importaciones del SDK o los artefactos, consulta
  [Correcciones de validación de Plugins](/clawhub/plugin-validation-fixes).
- Ejecuta `clawhub package publish <source> --dry-run` antes de crear una versión.
- Es de esperar que las versiones nuevas permanezcan fuera de las interfaces públicas de instalación hasta que terminen
  las comprobaciones de seguridad automatizadas y la verificación.

### Publicación de confianza para paquetes

La publicación de confianza de paquetes se configura en dos pasos:

1. Publica el paquete una vez mediante el proceso manual normal o mediante
   `clawhub package publish` autenticado con token. Esto crea el registro del paquete y establece los
   administradores del paquete que pueden cambiar su configuración de publicador de confianza.
2. Un administrador del paquete establece la configuración del publicador de confianza de GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Una vez establecida la configuración, las publicaciones futuras compatibles de GitHub Actions pueden usar
OIDC/publicación de confianza sin almacenar un token de ClawHub de larga duración en el
repositorio. El repositorio y el nombre de archivo del flujo de trabajo configurados deben coincidir con la
declaración OIDC de GitHub Actions. Si también pasas `--environment <name>`, la declaración del
entorno de GitHub Actions debe coincidir exactamente con ese nombre.

ClawHub verifica el repositorio de GitHub configurado cuando se establece la configuración del publicador
de confianza. Los repositorios públicos pueden verificarse mediante los metadatos públicos de GitHub.
Los repositorios privados requieren que ClawHub tenga acceso de GitHub a ese repositorio,
por ejemplo, mediante una futura instalación de la GitHub App de ClawHub u otra
integración autorizada de GitHub.

El flujo de trabajo reutilizable actual para publicar paquetes admite la publicación de confianza sin secretos
para publicaciones mediante `workflow_dispatch` cuando `id-token: write` está
disponible. Las publicaciones reales al enviar etiquetas todavía necesitan `clawhub_token`, así que mantén
`CLAWHUB_TOKEN` disponible para versiones mediante etiquetas, primeras publicaciones, paquetes no confiables
o publicaciones de emergencia.

Inspecciona o elimina la configuración con:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Eliminar la configuración del publicador de confianza es la vía de reversión. Deshabilita la emisión futura de
tokens de publicación de confianza hasta que un administrador del paquete vuelva a establecer la configuración.

## Preguntas frecuentes

### El ámbito del paquete debe coincidir con el propietario seleccionado

Si el ámbito del paquete y el propietario seleccionado no coinciden, ClawHub rechaza la
publicación:

```text
El ámbito del paquete "@openclaw" debe coincidir con el propietario seleccionado "@vintageayu".
Publica como "@openclaw" o cambia el nombre de este paquete a "@vintageayu/dronzer".
```

Para corregirlo, elige el propietario indicado por el ámbito del paquete o cambia el nombre del
paquete para que el ámbito coincida con el propietario bajo el que puedes publicar.

Si el nombre del paquete ya tiene el ámbito correcto, pero el paquete pertenece al
publicador equivocado, transfiere la propiedad:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa la transferencia de paquetes o Skills solo cuando tengas acceso de administrador tanto al
propietario actual como al publicador de destino. La transferencia de paquetes no te permite
publicar en un ámbito que no puedes administrar.

Si no tienes acceso al propietario actual, pero consideras que tu organización, proyecto o
marca es el propietario legítimo del espacio de nombres, abre una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles para que el personal las revise. Consulta
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) antes de presentarla.

Esto protege los espacios de nombres de las organizaciones. Un paquete llamado `@openclaw/dronzer` reclama el
espacio de nombres `@openclaw`, por lo que solo los publicadores con acceso al propietario `@openclaw`
pueden publicarlo.
