---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolver un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas sobre la propiedad de una organización, marca, identificador de propietario, ámbito de paquete, slug de skill o espacio de nombres.
title: Reclamaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-12T21:22:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub utiliza identificadores de propietarios, identificadores de organizaciones, slugs de Skills, nombres de paquetes de plugins y
ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un
proyecto, marca, ecosistema de paquetes u organización del mundo real, pero ya está
reclamado, reservado, resulta engañoso o está en disputa en ClawHub, solicite al personal que lo revise
mediante el
[formulario de incidencia para reclamar una organización o un espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilice esta vía para una revisión pública y no confidencial de la titularidad. No utilice los
informes del producto ni el formulario de apelación de cuentas para reclamar espacios de nombres.

## Cuándo presentar una reclamación

Presente una reclamación de espacio de nombres cuando considere que el personal de ClawHub debe revisar si un
espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o modificarse de alguna otra forma debido a su titularidad en el mundo real.

Entre los ejemplos se incluyen:

- un identificador de organización que coincide con su organización de GitHub, proyecto, empresa o comunidad
- un ámbito de paquete como `@example-org/*` que solo debería publicarse bajo el
  propietario de ClawHub correspondiente
- un slug de una Skill o un nombre de paquete de plugin que parece suplantar a un proyecto
- una disputa sobre una marca, una marca registrada, el cambio de nombre de un proyecto o el historial de un paquete
- un propietario eliminado, inactivo o inaccesible que impide el acceso al espacio de nombres a su
  propietario legítimo

Si el listado es inseguro, malicioso o engañoso más allá de la disputa de titularidad,
siga también las directrices de moderación o seguridad correspondientes. El formulario de reclamación de
espacios de nombres está destinado a revisar la titularidad, no a divulgar vulnerabilidades de emergencia.

## Antes de presentar la reclamación

En primer lugar, confirme que está publicando con el propietario que coincide con el espacio de nombres.
En el caso de los paquetes de plugins, los nombres con ámbito como `@example-org/example-plugin` deben
publicarse con el propietario `example-org` correspondiente.

Si puede gestionar el propietario actual, corrija directamente el espacio de nombres mediante la publicación,
el cambio de nombre, la transferencia, la ocultación o la eliminación del recurso afectado. Presente una reclamación
cuando no pueda gestionar el propietario actual o cuando el personal deba resolver una
disputa.

## Pruebas que debe incluir

Utilice pruebas públicas y no confidenciales. Entre las pruebas útiles se incluyen:

- el historial de la organización, el repositorio, las versiones o los responsables de mantenimiento en GitHub
- documentación oficial del proyecto que mencione el espacio de nombres
- pruebas del dominio o del dominio de correo electrónico oficial
- control del ámbito en npm, PyPI, crates.io u otro registro de paquetes
- pruebas de titularidad de la marca registrada, la marca o el proyecto que puedan comentarse
  públicamente de forma segura
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, la Skill, el plugin, el paquete o la incidencia de ClawHub objeto de la disputa

Explique qué demuestra cada enlace. El personal debe poder comprender la
relación sin necesitar credenciales privadas ni secretos.

## Qué no debe incluir

No publique secretos ni pruebas privadas en una incidencia pública de GitHub. No incluya:

- tokens de API, claves de firma ni credenciales
- tokens de desafío DNS
- archivos jurídicos privados ni contratos
- documentos personales de identidad
- correos electrónicos privados, informes de seguridad privados ni datos confidenciales de clientes

El formulario de reclamación pregunta si las pruebas confidenciales requieren un canal privado con el personal.
Utilice esa opción en lugar de publicar material confidencial.

## Resultados posibles

En función de las pruebas y el riesgo, el personal de ClawHub puede reservar un espacio de nombres,
transferir la titularidad, cambiar el nombre de un recurso, ocultar o poner en cuarentena un listado existente,
añadir un alias o una redirección, solicitar más pruebas o rechazar la solicitud.

La revisión del espacio de nombres no garantiza que se transfieran todos los nombres coincidentes.
El personal sopesa las pruebas públicas, el uso existente, el riesgo de seguridad y el impacto para los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de las cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
