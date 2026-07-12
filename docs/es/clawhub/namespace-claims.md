---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolver un espacio de nombres que ya está asignado o reservado
    - Decidir si usar una denuncia, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas sobre la propiedad de una organización, marca, identificador de propietario, ámbito de paquete, slug de skill o espacio de nombres.
title: Reclamaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-11T22:54:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub utiliza identificadores de propietarios, identificadores de organizaciones, slugs de Skills, nombres de paquetes de Plugins y ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un proyecto, una marca, un ecosistema de paquetes o una organización reales, pero ya está reclamado, reservado, resulta engañoso o está en disputa en ClawHub, solicita al personal que lo revise mediante el
[formulario de incidencia para reclamar una organización o un espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utiliza esta vía para revisiones públicas y no confidenciales sobre la titularidad. No utilices los informes del producto ni el formulario de apelación de cuentas para reclamar espacios de nombres.

## Cuándo presentar una reclamación

Presenta una reclamación de espacio de nombres cuando consideres que el personal de ClawHub debe revisar si un espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, convertirse en alias o modificarse de algún otro modo debido a su titularidad en el mundo real.

Algunos ejemplos:

- un identificador de organización que coincida con tu organización de GitHub, proyecto, empresa o comunidad
- un ámbito de paquete como `@example-org/*` que solo deba publicarse bajo el propietario correspondiente de ClawHub
- un slug de Skill o un nombre de paquete de Plugin que parezca suplantar a un proyecto
- una disputa relacionada con una marca, una marca comercial, el cambio de nombre de un proyecto o el historial de un paquete
- un propietario eliminado, inactivo o inaccesible que impida el acceso al propietario legítimo del espacio de nombres

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de titularidad, sigue también las directrices de moderación o seguridad pertinentes. El formulario de reclamación de espacios de nombres está destinado a revisar la titularidad, no a divulgar vulnerabilidades urgentes.

## Antes de presentar la solicitud

Primero, confirma que estás publicando con el propietario que corresponde al espacio de nombres. En el caso de los paquetes de Plugins, los nombres con ámbito como `@example-org/example-plugin` deben publicarse bajo el propietario `example-org` correspondiente.

Si puedes administrar al propietario actual, corrige directamente el espacio de nombres publicando, renombrando, transfiriendo, ocultando o eliminando el recurso afectado. Presenta una reclamación cuando no puedas administrar al propietario actual o cuando el personal deba resolver una disputa.

## Pruebas que debes incluir

Utiliza pruebas públicas y no confidenciales. Las pruebas útiles incluyen:

- historial de la organización, el repositorio, las versiones o los responsables de mantenimiento en GitHub
- documentación oficial del proyecto que mencione el espacio de nombres
- pruebas mediante un dominio o un dominio de correo electrónico oficial
- control del ámbito en npm, PyPI, crates.io u otro registro de paquetes
- pruebas de titularidad de una marca comercial, una marca o un proyecto que puedan comentarse públicamente de forma segura
- historial del repositorio de origen, historial del paquete o avisos públicos sobre cambios de nombre
- enlaces al propietario, la Skill, el Plugin, el paquete o la incidencia de ClawHub objeto de la disputa

Explica qué demuestra cada enlace. El personal debe poder comprender la relación sin necesitar credenciales privadas ni secretos.

## Qué no debes incluir

No publiques secretos ni pruebas privadas en una incidencia pública de GitHub. No incluyas:

- tokens de API, claves de firma ni credenciales
- tokens de validación de DNS
- archivos jurídicos privados ni contratos
- documentos personales de identidad
- correos electrónicos privados, informes de seguridad privados ni datos confidenciales de clientes

El formulario de reclamación pregunta si las pruebas confidenciales requieren un canal privado con el personal. Utiliza esa opción en lugar de publicar material confidencial.

## Posibles resultados

Según las pruebas y el riesgo, el personal de ClawHub puede reservar un espacio de nombres, transferir su titularidad, renombrar un recurso, ocultar o poner en cuarentena una publicación existente, añadir un alias o una redirección, solicitar más pruebas o rechazar la solicitud.

La revisión de un espacio de nombres no garantiza que se transfieran todos los nombres coincidentes. El personal evalúa las pruebas públicas, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de las cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
