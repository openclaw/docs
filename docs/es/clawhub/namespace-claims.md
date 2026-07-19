---
read_when:
    - Reclamación de una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolver un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas sobre la propiedad de una organización, marca, identificador de propietario, ámbito de paquete, slug de skill o espacio de nombres.
title: Reivindicaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-19T01:52:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub utiliza identificadores de propietarios, identificadores de organizaciones, slugs de Skills, nombres de paquetes de plugins y
ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un
proyecto, una marca, un ecosistema de paquetes o una organización del mundo real, pero ya está
reclamado, reservado, resulta engañoso o está en disputa en ClawHub, solicite al personal que lo revise
mediante el
[formulario de incidencia para reclamar una organización o un espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilice esta vía para revisiones públicas y no sensibles de la titularidad. No utilice los
informes del producto ni el formulario de apelación de cuentas para reclamar espacios de nombres.

## Cuándo presentar una reclamación

Presente una reclamación de espacio de nombres cuando considere que el personal de ClawHub debe revisar si un
espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, asociarse mediante un alias
o modificarse de otro modo debido a su titularidad en el mundo real.

Algunos ejemplos son:

- un identificador de organización que coincide con su organización, proyecto, empresa o comunidad de GitHub
- un ámbito de paquete como `@example-org/*` que solo debería publicarse bajo el
  propietario correspondiente de ClawHub
- un slug de Skill o nombre de paquete de plugin que parece suplantar a un proyecto
- una disputa sobre una marca, una marca registrada, el cambio de nombre de un proyecto o el historial de un paquete
- un propietario eliminado, inactivo o inaccesible que impide el acceso al espacio de nombres a su
  propietario legítimo

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de titularidad,
siga también las directrices de moderación o seguridad pertinentes. El formulario de reclamación de
espacios de nombres sirve para revisar la titularidad, no para divulgar vulnerabilidades de emergencia.

## Antes de presentar la solicitud

Primero, confirme que está publicando con el propietario que corresponde al espacio de nombres.
En el caso de los paquetes de plugins, los nombres con ámbito como `@example-org/example-plugin` deben
publicarse como el propietario correspondiente `example-org`.

Si puede gestionar el propietario actual, corrija directamente el espacio de nombres mediante la publicación,
el cambio de nombre, la transferencia, la ocultación o la eliminación del recurso afectado. Presente una reclamación
cuando no pueda gestionar el propietario actual o cuando el personal deba resolver una
disputa.

## Pruebas que deben incluirse

Utilice pruebas públicas y no sensibles. Entre las pruebas útiles se incluyen:

- historial de la organización, el repositorio, las versiones o los responsables de mantenimiento en GitHub
- documentación oficial del proyecto que mencione el espacio de nombres
- prueba mediante un dominio o un dominio de correo electrónico oficial
- control del ámbito en npm, PyPI, crates.io u otro registro de paquetes
- pruebas de la titularidad de una marca registrada, una marca o un proyecto que puedan tratarse
  públicamente de forma segura
- historial del repositorio de código fuente, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, Skill, plugin, paquete o incidencia de ClawHub en disputa

Explique qué demuestra cada enlace. El personal debe poder comprender la
relación sin necesitar credenciales privadas ni secretos.

## Qué no debe incluirse

No publique secretos ni pruebas privadas en una incidencia pública de GitHub. No incluya:

- tokens de API, claves de firma o credenciales
- tokens de desafío de DNS
- archivos legales o contratos privados
- documentos personales de identidad
- correos electrónicos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamación pregunta si las pruebas sensibles requieren un canal privado con el personal.
Utilice esa opción en lugar de publicar material sensible públicamente.

## Resultados posibles

Según las pruebas y el riesgo, el personal de ClawHub puede reservar un espacio de nombres,
transferir la titularidad, cambiar el nombre de un recurso, ocultar o poner en cuarentena una publicación existente,
añadir un alias o una redirección, solicitar más pruebas o rechazar la solicitud.

La revisión de un espacio de nombres no garantiza la transferencia de todos los nombres coincidentes.
El personal evalúa las pruebas públicas, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/es/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de las cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
