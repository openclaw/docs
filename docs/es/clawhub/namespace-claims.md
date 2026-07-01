---
read_when:
    - Reclamar una organización, marca, alcance de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolución de un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas de propiedad de organización, marca, identificador de propietario, ámbito de paquete, slug de skill o espacio de nombres.
title: Reclamaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-01T15:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamos de organización y espacio de nombres

ClawHub usa identificadores de propietarios, identificadores de organizaciones, slugs de Skills, nombres de paquetes de plugins y ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un proyecto real, marca, ecosistema de paquetes u organización, pero ya está reclamado, reservado, es engañoso o está en disputa en ClawHub, pide al personal que lo revise con el
[formulario de incidencia de reclamo de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa esta vía para revisiones públicas y no sensibles de propiedad. No uses informes dentro del producto ni el formulario de apelación de cuenta para reclamos de espacios de nombres.

## Cuándo abrir un reclamo

Abre un reclamo de espacio de nombres cuando creas que el personal de ClawHub debe revisar si un espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, asociarse con un alias o modificarse de otro modo debido a propiedad en el mundo real.

Algunos ejemplos incluyen:

- un identificador de organización que coincide con tu organización de GitHub, proyecto, empresa o comunidad
- un ámbito de paquete como `@example-org/*` que solo debería publicarse bajo el propietario de ClawHub correspondiente
- un slug de Skill o nombre de paquete de plugin que parece suplantar a un proyecto
- una disputa sobre marca, marca registrada, cambio de nombre de proyecto o historial de paquete
- un propietario eliminado, inactivo o inaccesible que bloquea al propietario legítimo del espacio de nombres

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de propiedad, sigue también la guía de moderación o seguridad correspondiente. El formulario de reclamo de espacio de nombres es para revisión de propiedad, no para divulgación de vulnerabilidades de emergencia.

## Antes de presentarlo

Primero confirma que estás publicando con el propietario que coincide con el espacio de nombres. Para paquetes de plugins, los nombres con ámbito como `@example-org/example-plugin` deben publicarse como el propietario `example-org` correspondiente.

Si puedes administrar el propietario actual, corrige directamente el espacio de nombres publicando, renombrando, transfiriendo, ocultando o eliminando el recurso afectado. Usa un reclamo cuando no puedas administrar el propietario actual o cuando el personal necesite resolver una disputa.

## Evidencia que incluir

Usa evidencia pública y no sensible. Las pruebas útiles incluyen:

- historial de organización de GitHub, repositorio, lanzamiento o mantenedor
- documentación oficial del proyecto que mencione el espacio de nombres
- prueba de dominio o de dominio de correo electrónico oficial
- control de ámbito en npm, PyPI, crates.io u otro registro de paquetes
- evidencia de propiedad de marca registrada, marca o proyecto que sea segura para discutir públicamente
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, Skill, plugin, paquete o incidencia en disputa de ClawHub

Explica qué demuestra cada enlace. El personal debe poder entender la relación sin necesitar credenciales privadas ni secretos.

## Qué no incluir

No pongas secretos ni pruebas privadas en una incidencia pública de GitHub. No incluyas:

- tokens de API, claves de firma o credenciales
- tokens de desafío DNS
- archivos legales o contratos privados
- documentos de identidad personales
- correos electrónicos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamo pregunta si la evidencia sensible necesita un canal privado con el personal. Usa esa opción en lugar de publicar material sensible públicamente.

## Posibles resultados

Según la evidencia y el riesgo, el personal de ClawHub puede reservar un espacio de nombres, transferir la propiedad, renombrar un recurso, ocultar o poner en cuarentena una publicación existente, agregar un alias o redirección, pedir más pruebas o rechazar la solicitud.

La revisión de espacios de nombres no garantiza que todos los nombres coincidentes se transferirán. El personal pondera la evidencia pública, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentos relacionados

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de la cuenta](/clawhub/moderation)
- [Seguridad](/clawhub/security)
