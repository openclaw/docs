---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolviendo un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas de propiedad de organización, marca, identificador de propietario, alcance de paquete, slug de skill o espacio de nombres.
title: Reivindicaciones de organización y espacio de nombres
x-i18n:
    generated_at: "2026-07-01T05:28:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organización y espacio de nombres

ClawHub usa identificadores de propietario, identificadores de organización, slugs de Skills, nombres de paquetes de Plugin y
ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un
proyecto, marca, ecosistema de paquetes u organización del mundo real, pero ya está
reclamado, reservado, resulta engañoso o está en disputa en ClawHub, pide al personal que lo revise
con el
[formulario de incidencia de reclamación de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa esta vía para revisiones de propiedad públicas y no sensibles. No uses informes
dentro del producto ni el formulario de apelación de cuenta para reclamaciones de espacios de nombres.

## Cuándo abrir una reclamación

Abre una reclamación de espacio de nombres cuando creas que el personal de ClawHub debería revisar si un
espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o modificarse de otro modo por motivos de propiedad en el mundo real.

Los ejemplos incluyen:

- un identificador de organización que coincide con tu organización de GitHub, proyecto, empresa o comunidad
- un ámbito de paquete como `@example-org/*` que solo debería publicar bajo el
  propietario correspondiente de ClawHub
- un slug de Skill o nombre de paquete de Plugin que parece suplantar a un proyecto
- una disputa sobre una marca, marca registrada, cambio de nombre de proyecto o historial de paquete
- un propietario eliminado, inactivo o inaccesible que bloquea al propietario legítimo del espacio de nombres

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de propiedad,
sigue también la guía de moderación o seguridad correspondiente. El formulario de reclamación de espacio de nombres
es para revisión de propiedad, no para la divulgación urgente de vulnerabilidades.

## Antes de presentar la solicitud

Primero confirma que estás publicando con el propietario que coincide con el espacio de nombres.
Para paquetes de Plugin, los nombres con ámbito como `@example-org/example-plugin` deben
publicarse como el propietario `example-org` correspondiente.

Si puedes administrar el propietario actual, corrige el espacio de nombres directamente publicando,
renombrando, transfiriendo, ocultando o eliminando el recurso afectado. Usa una reclamación
cuando no puedas administrar el propietario actual o cuando el personal necesite resolver una
disputa.

## Evidencia que incluir

Usa evidencia pública y no sensible. Las pruebas útiles incluyen:

- historial de organización, repositorio, versión o mantenedor en GitHub
- documentación oficial del proyecto que nombre el espacio de nombres
- prueba de dominio o de dominio de correo electrónico oficial
- control de ámbitos en npm, PyPI, crates.io u otro registro de paquetes
- evidencia de marca registrada, marca o propiedad del proyecto que sea segura para discutir
  públicamente
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, Skill, Plugin, paquete o incidencia de ClawHub en disputa

Explica qué demuestra cada enlace. El personal debería poder entender la
relación sin necesitar credenciales privadas ni secretos.

## Qué no incluir

No pongas secretos ni pruebas privadas en una incidencia pública de GitHub. No incluyas:

- tokens de API, claves de firma o credenciales
- tokens de desafío DNS
- archivos legales privados o contratos
- documentos de identidad personales
- correos electrónicos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamación pregunta si la evidencia sensible necesita un canal privado con el personal.
Usa esa opción en lugar de publicar material sensible públicamente.

## Resultados posibles

Según la evidencia y el riesgo, el personal de ClawHub puede reservar un espacio de nombres,
transferir la propiedad, renombrar un recurso, ocultar o poner en cuarentena una publicación existente,
agregar un alias o redirección, pedir más pruebas o rechazar la solicitud.

La revisión de espacios de nombres no garantiza que todos los nombres coincidentes se transfieran.
El personal sopesa la evidencia pública, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de cuentas](/clawhub/moderation)
- [Seguridad](/clawhub/security)
