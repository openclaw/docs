---
read_when:
    - Publicar una Skill o un Plugin
    - Depuración de errores de ámbito de propietario o de paquete
    - Agregar comportamiento de publicación en la interfaz de usuario, la CLI o el lado servidor
summary: Cómo funciona la publicación en ClawHub para Skills, plugins, propietarios, ámbitos, versiones y revisión.
x-i18n:
    generated_at: "2026-05-11T20:24:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicación

La publicación en ClawHub tiene ámbito de propietario: cada publicación apunta a un publicador, y el servidor decide si el usuario con sesión iniciada tiene permiso para publicar allí.

## Propietarios

Un propietario es un identificador de publicador de ClawHub, como `@alice` o `@openclaw`. Los propietarios personales se crean para los usuarios. Los propietarios de organización pueden tener varios miembros.

Cuando publicas, usas tu propietario personal o eliges un propietario de organización donde tengas acceso de publicador.

## Skills

Skills se publican desde una carpeta de skill. La página pública es:

```text
https://clawhub.ai/<owner>/<slug>
```

Ejemplo:

```text
https://clawhub.ai/alice/review-helper
```

La solicitud de publicación incluye el propietario seleccionado, slug, versión, registro de cambios y archivos. El servidor verifica que el actor pueda publicar como ese propietario antes de crear la versión.

Para mover una skill existente a otro propietario mientras publicas una nueva versión, elige el nuevo propietario y confirma explícitamente el traslado de propiedad. En la CLI/API, pasa el propietario de destino más la aceptación explícita de migración:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

La migración de propietario de skill requiere acceso de administrador o propietario tanto en el propietario actual como en el propietario de destino. Conserva la skill, el historial de versiones, las estadísticas, los comentarios, los forks, los alias y el rastro de auditoría; las URL del propietario anterior continúan funcionando mediante la ruta de alias/redirección.

## Plugins

Los plugins usan nombres de paquete de estilo npm. Los nombres de paquete con ámbito incluyen el propietario en la primera parte del nombre:

```text
@owner/package-name
```

El ámbito debe coincidir con el propietario de publicación seleccionado. Si tu paquete se llama `@openclaw/dronzer`, solo se puede publicar como `@openclaw`. Si publicas como `@vintageayu`, cambia el nombre del paquete a `@vintageayu/dronzer`.

Esto evita que un paquete reclame un espacio de nombres de organización que el publicador no controla.

## Flujo de publicación

1. La UI, la CLI o el flujo de trabajo de GitHub recopila los metadatos y archivos del paquete.
2. La solicitud de publicación se envía a ClawHub con el propietario seleccionado.
3. El servidor valida los permisos del propietario, el ámbito del paquete, el nombre del paquete, la versión, los límites de archivos y los metadatos de origen.
4. ClawHub almacena la versión e inicia comprobaciones de seguridad automatizadas.
5. Las nuevas versiones se ocultan de las superficies normales de instalación/descarga hasta que finalicen la revisión y la verificación.

Si la validación falla, la versión no se crea.

## Preguntas frecuentes

### El ámbito del paquete debe coincidir con el propietario seleccionado

Si el ámbito del paquete y el propietario seleccionado no coinciden, ClawHub rechaza la publicación:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Para corregirlo, elige el propietario nombrado por el ámbito del paquete, o cambia el nombre del paquete para que el ámbito coincida con el propietario con el que puedes publicar.

Si el nombre del paquete ya tiene el ámbito correcto pero el paquete pertenece al publicador equivocado, transfiere la propiedad en su lugar:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa la transferencia de paquete o skill solo cuando tengas acceso de administrador tanto al propietario actual como al publicador de destino. La transferencia de paquete no te permite publicar en un ámbito que no puedes administrar.

Esto protege los espacios de nombres de organización. Un paquete llamado `@openclaw/dronzer` reclama el espacio de nombres `@openclaw`, por lo que solo los publicadores con acceso al propietario `@openclaw` pueden publicarlo.
