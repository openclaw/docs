---
read_when:
    - Reclamar una organización, marca, ámbito de paquete, identificador de propietario, slug de skill o espacio de nombres de paquete
    - Resolviendo un espacio de nombres que ya está reclamado o reservado
    - Decidir si usar un informe, una apelación o una reclamación de espacio de nombres
sidebarTitle: Org and Namespace Claims
summary: Cómo solicitar una revisión de ClawHub para disputas de propiedad de organización, marca, identificador de propietario, ámbito de paquete, slug de skill o espacio de nombres.
title: Reclamaciones de organización y espacios de nombres
x-i18n:
    generated_at: "2026-07-04T03:34:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reclamaciones de organizaciones y espacios de nombres

ClawHub usa identificadores de propietarios, identificadores de organizaciones, slugs de Skills, nombres de paquetes de Plugin y
ámbitos de paquetes como espacios de nombres públicos. Si un espacio de nombres parece pertenecer a un
proyecto, marca, ecosistema de paquetes u organización del mundo real, pero ya está
reclamado, reservado, es engañoso o está disputado en ClawHub, pide al personal que lo revise
con el
[formulario de incidencia de reclamación de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa esta vía para una revisión de propiedad pública y no confidencial. No uses informes
dentro del producto ni el formulario de apelación de cuenta para reclamaciones de espacios de nombres.

## Cuándo abrir una reclamación

Abre una reclamación de espacio de nombres cuando creas que el personal de ClawHub debe revisar si un
espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o modificarse de otro modo debido a propiedad en el mundo real.

Algunos ejemplos son:

- un identificador de organización que coincide con tu organización, proyecto, empresa o comunidad de GitHub
- un ámbito de paquete como `@example-org/*` que solo debería publicarse bajo el
  propietario correspondiente de ClawHub
- un slug de Skill o un nombre de paquete de Plugin que parece suplantar a un proyecto
- una disputa sobre una marca, marca registrada, cambio de nombre de proyecto o historial de paquetes
- un propietario eliminado, inactivo o inaccesible que bloquea al propietario legítimo del
  espacio de nombres

Si la publicación es insegura, maliciosa o engañosa más allá de la disputa de propiedad,
sigue también la guía de moderación o seguridad correspondiente. El formulario de reclamación de espacio de nombres
es para revisión de propiedad, no para la divulgación urgente de vulnerabilidades.

## Antes de presentar la reclamación

Primero confirma que estás publicando con el propietario que coincide con el espacio de nombres.
Para paquetes de Plugin, los nombres con ámbito como `@example-org/example-plugin` deben
publicarse como el propietario `example-org` correspondiente.

Si puedes administrar el propietario actual, corrige el espacio de nombres directamente publicando,
renombrando, transfiriendo, ocultando o eliminando el recurso afectado. Usa una reclamación
cuando no puedas administrar el propietario actual o cuando el personal deba resolver una
disputa.

## Evidencia que debes incluir

Usa evidencia pública y no confidencial. Las pruebas útiles incluyen:

- historial de organización, repositorio, versión o mantenedor en GitHub
- documentación oficial del proyecto que nombre el espacio de nombres
- prueba de dominio o de dominio de correo electrónico oficial
- control de ámbitos en npm, PyPI, crates.io u otro registro de paquetes
- evidencia de propiedad de marca registrada, marca o proyecto que sea seguro comentar
  públicamente
- historial del repositorio de origen, historial del paquete o avisos públicos de cambio de nombre
- enlaces al propietario, Skill, Plugin, paquete o incidencia de ClawHub en disputa

Explica qué demuestra cada enlace. El personal debe poder entender la
relación sin necesitar credenciales privadas ni secretos.

## Qué no incluir

No pongas secretos ni pruebas privadas en una incidencia pública de GitHub. No incluyas:

- tokens de API, claves de firma o credenciales
- tokens de desafío DNS
- archivos legales o contratos privados
- documentos de identidad personal
- correos electrónicos privados, informes de seguridad privados o datos confidenciales de clientes

El formulario de reclamación pregunta si la evidencia confidencial necesita un canal privado con el personal.
Usa esa opción en lugar de publicar material confidencial públicamente.

## Resultados posibles

Según la evidencia y el riesgo, el personal de ClawHub puede reservar un espacio de nombres,
transferir la propiedad, renombrar un recurso, ocultar o poner en cuarentena una publicación existente,
añadir un alias o redirección, pedir más pruebas o rechazar la solicitud.

La revisión de espacios de nombres no garantiza que se transfieran todos los nombres coincidentes.
El personal sopesa la evidencia pública, el uso existente, el riesgo de seguridad y el impacto en los usuarios.

## Documentación relacionada

- [Publicación](/es/clawhub/publishing)
- [Solución de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderación y seguridad de la cuenta](/clawhub/moderation)
- [Seguridad](/clawhub/security)
