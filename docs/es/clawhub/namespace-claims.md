---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolver un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas sobre la propiedad de una organización, marca, identificador del propietario, ámbito de paquete, slug de una skill o espacio de nombres.
title: Reivindicaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-16T11:26:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub utiliza identificadores de propietarios y organizaciones, slugs de Skills, nombres de paquetes de plugins y
ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un
proyecto, una marca, un ecosistema de paquetes o una organización del mundo real, pero ya está
reclamado, reservado, resulta engañoso o está en disputa en ClawHub, solicite al personal que lo revise
mediante el
[formulario de incidencia para reclamaciones de organizaciones o espacios de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilice esta vía para revisiones públicas y no confidenciales de la titularidad. No utilice los informes
del producto ni el formulario de apelación de cuentas para reclamar espacios de nombres.

## Cuándo presentar una reclamación

Presente una reclamación de espacio de nombres cuando considere que el personal de ClawHub debe revisar si un
espacio de nombres debe reservarse, transferirse, cambiarse de nombre, ocultarse, ponerse en cuarentena, recibir un alias
o modificarse de alguna otra forma debido a su titularidad en el mundo real.

Por ejemplo:

- un identificador de organización que coincide con su organización de GitHub, proyecto, empresa o comunidad
- un ámbito de paquete como `@example-org/*` que solo debería publicarse con el
  propietario correspondiente de ClawHub
- un slug de Skill o nombre de paquete de plugin que parece suplantar a un proyecto
- una disputa sobre una marca, marca registrada, cambio de nombre de un proyecto o historial de un paquete
- un propietario eliminado, inactivo o inaccesible que impide usar el espacio de nombres a su
  propietario legítimo

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de titularidad,
siga también las directrices pertinentes de moderación o seguridad. El formulario de reclamación
de espacios de nombres sirve para revisar la titularidad, no para divulgar vulnerabilidades de emergencia.

## Antes de presentar la reclamación

Primero, confirme que publica con el propietario que corresponde al espacio de nombres.
En el caso de los paquetes de plugins, los nombres con ámbito como `@example-org/example-plugin` deben
publicarse con el propietario `example-org` correspondiente.

Si puede gestionar el propietario actual, corrija directamente el espacio de nombres mediante la publicación,
el cambio de nombre, la transferencia, la ocultación o la eliminación del recurso afectado. Presente una reclamación
cuando no pueda gestionar el propietario actual o cuando el personal deba resolver una
disputa.

## Pruebas que debe incluir

Utilice pruebas públicas y no confidenciales. Las pruebas útiles incluyen:

- historial de la organización, el repositorio, las versiones o los responsables de mantenimiento en GitHub
- documentación oficial del proyecto que identifique el espacio de nombres
- prueba mediante un dominio o un dominio de correo electrónico oficial
- control del ámbito en npm, PyPI, crates.io u otro registro de paquetes
- pruebas de titularidad de una marca registrada, marca o proyecto que puedan exponerse de forma segura
  públicamente
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, Skill, plugin, paquete o incidencia de ClawHub objeto de la disputa

Explique qué demuestra cada enlace. El personal debe poder comprender la
relación sin necesitar credenciales privadas ni secretos.

## Qué no debe incluir

No publique secretos ni pruebas privadas en una incidencia pública de GitHub. No incluya:

- tokens de API, claves de firma o credenciales
- tokens de desafío DNS
- archivos jurídicos privados o contratos
- documentos de identidad personales
- correos electrónicos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamación pregunta si las pruebas confidenciales requieren un canal privado con el personal.
Utilice esa opción en lugar de publicar material confidencial.

## Posibles resultados

En función de las pruebas y el riesgo, el personal de ClawHub puede reservar un espacio de nombres,
transferir la titularidad, cambiar el nombre de un recurso, ocultar o poner en cuarentena una publicación existente,
añadir un alias o una redirección, solicitar más pruebas o rechazar la solicitud.

La revisión del espacio de nombres no garantiza la transferencia de todos los nombres coincidentes.
El personal pondera las pruebas públicas, el uso existente, el riesgo de seguridad y el impacto sobre los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de las cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
