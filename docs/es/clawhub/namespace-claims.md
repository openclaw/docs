---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolver un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de namespace
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas de propiedad de organización, marca, identificador de propietario, alcance de paquete, slug de skill o espacio de nombres.
title: Reclamaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-05T20:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub usa identificadores de propietario, identificadores de organización, slugs de Skills, nombres de paquetes de plugins y ámbitos de paquete como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un proyecto, marca, ecosistema de paquetes u organización del mundo real, pero ya está reclamado, reservado, es engañoso o está en disputa en ClawHub, pide al equipo que lo revise con el
[formulario de incidencia de reclamación de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa esta vía para revisiones públicas y no sensibles de propiedad. No uses informes dentro del producto ni el formulario de apelación de cuentas para reclamaciones de espacios de nombres.

## Cuándo Abrir una Reclamación

Abre una reclamación de espacio de nombres cuando creas que el equipo de ClawHub debe revisar si un espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, tener un alias o cambiarse de otra forma debido a propiedad del mundo real.

Los ejemplos incluyen:

- un identificador de organización que coincide con tu organización, proyecto, empresa o comunidad de GitHub
- un ámbito de paquete como `@example-org/*` que solo debería publicarse bajo el propietario correspondiente de ClawHub
- un slug de Skills o nombre de paquete de plugin que parece suplantar a un proyecto
- una disputa de marca, marca comercial, cambio de nombre de proyecto o historial de paquete
- un propietario eliminado, inactivo o inaccesible que bloquea al propietario legítimo del espacio de nombres

Si el listado es inseguro, malicioso o engañoso más allá de la disputa de propiedad, sigue también la guía pertinente de moderación o seguridad. El formulario de reclamación de espacio de nombres es para revisión de propiedad, no para divulgación urgente de vulnerabilidades.

## Antes de Presentarla

Primero confirma que estás publicando con el propietario que coincide con el espacio de nombres. Para paquetes de plugins, los nombres con ámbito como `@example-org/example-plugin` deben publicarse como el propietario `example-org` correspondiente.

Si puedes gestionar el propietario actual, corrige directamente el espacio de nombres publicando, renombrando, transfiriendo, ocultando o eliminando el recurso afectado. Usa una reclamación cuando no puedas gestionar el propietario actual o cuando el equipo necesite resolver una disputa.

## Evidencia que Debes Incluir

Usa evidencia pública y no sensible. Las pruebas útiles incluyen:

- historial de organización, repositorio, lanzamiento o mantenedor de GitHub
- documentación oficial del proyecto que nombre el espacio de nombres
- prueba de dominio o de dominio de correo electrónico oficial
- control del ámbito en npm, PyPI, crates.io u otros registros de paquetes
- evidencia de propiedad de marca comercial, marca o proyecto que sea segura de comentar públicamente
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, skill, plugin, paquete o incidencia de ClawHub en disputa

Explica qué demuestra cada enlace. El equipo debe poder entender la relación sin necesitar credenciales privadas ni secretos.

## Qué No Debes Incluir

No pongas secretos ni pruebas privadas en una incidencia pública de GitHub. No incluyas:

- tokens de API, claves de firma o credenciales
- tokens de desafío DNS
- archivos legales o contratos privados
- documentos de identidad personales
- correos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamación pregunta si la evidencia sensible necesita un canal privado con el equipo. Usa esa opción en lugar de publicar material sensible públicamente.

## Posibles Resultados

Según la evidencia y el riesgo, el equipo de ClawHub puede reservar un espacio de nombres, transferir la propiedad, renombrar un recurso, ocultar o poner en cuarentena un listado existente, añadir un alias o redirección, pedir más pruebas o rechazar la solicitud.

La revisión de espacios de nombres no garantiza que todos los nombres coincidentes se transfieran. El equipo sopesa la evidencia pública, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentos Relacionados

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
