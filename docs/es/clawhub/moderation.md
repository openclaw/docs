---
read_when:
    - Denunciar una skill, un plugin o un paquete
    - Recuperación de una publicación retenida, oculta o bloqueada
    - Información sobre la moderación, los bloqueos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los reportes de ClawHub, las retenciones por moderación, los listados ocultos, los bloqueos y el estado de las cuentas.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-19T01:48:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de las cuentas

ClawHub permite la publicación abierta, pero las superficies públicas de descubrimiento e instalación aún
necesitan medidas de protección. Los reportes, las retenciones de moderación, los listados ocultos y las medidas sobre las cuentas
ayudan a proteger a los usuarios cuando una versión o una cuenta parece insegura, engañosa o
contraria a las políticas.

Esta página abarca la moderación y el estado de las cuentas. Para consultar etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulte
[Auditorías de seguridad](/clawhub/security-audits).

Consulte también [Seguridad](/clawhub/security) y
[Uso aceptable](/es/clawhub/acceptable-usage). Para cuestiones relacionadas con derechos de autor u otros
derechos sobre el contenido, use [Solicitudes sobre derechos de contenido](/es/clawhub/content-rights).

## Reportes

Los usuarios que hayan iniciado sesión pueden reportar Skills, plugins y paquetes.

Use los reportes de ClawHub únicamente para contenido inseguro del mercado, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

Use el botón **Report skill** en la página de una Skill, o el
comando o la API de reporte de paquetes.

No use los reportes de ClawHub para vulnerabilidades en el código fuente propio de una Skill o
un plugin de terceros. Repórtelas directamente al editor o al repositorio del código fuente
enlazado desde el listado. ClawHub no mantiene ni corrige
el código de Skills o plugins de terceros.

Los avisos de seguridad de GitHub para `openclaw/clawhub` están destinados a vulnerabilidades en
el propio ClawHub. Algunos ejemplos son errores en el sitio web, la API, la CLI, el registro, la autenticación,
el análisis, la moderación o los límites de confianza de descarga e instalación. No use los avisos de
ClawHub para vulnerabilidades en Skills o plugins de terceros.

Los buenos reportes son específicos y permiten tomar medidas. El uso indebido de los reportes puede dar lugar
a medidas sobre la cuenta.

## Reclamaciones de organizaciones y espacios de nombres

Las disputas sobre la propiedad de una organización, marca, ámbito de paquete, identificador de propietario o espacio de nombres deben
usar el proceso de [Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims), no el
flujo de reporte dentro del producto ni el formulario de apelación de cuentas.

Use ese proceso cuando necesite que el personal de ClawHub revise pruebas no confidenciales de que un
espacio de nombres debe reservarse, transferirse, cambiar de nombre, ocultarse, ponerse en cuarentena, asociarse a un alias
o revisarse de otro modo. No incluya secretos, documentos privados, archivos jurídicos
privados, documentos personales de identidad, tokens de API ni tokens de verificación de DNS en una
incidencia pública.

## Retenciones de moderación

Algunos hallazgos graves o problemas con las políticas pueden someter a un editor o listado a una
retención de moderación. Cuando esto sucede, el contenido afectado puede ocultarse del
descubrimiento público o las publicaciones futuras pueden comenzar ocultas hasta que se revise el problema.

Las retenciones de moderación tienen por objeto proteger a los usuarios mientras ClawHub resuelve casos
de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede quedar retenido, oculto, en cuarentena, revocado o no disponible de otro modo en
las superficies públicas de instalación.

Si ve uno de estos estados, no instale la versión a menos que el propietario
resuelva el problema o el equipo de moderación la restablezca.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Bloqueos y estado de las cuentas

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden
dar lugar al bloqueo de cuentas, la revocación de tokens, contenido oculto o la retirada de listados.
Las señales de presión por abuso de los editores se comprueban diariamente. Las señales que alcanzan
el umbral de posible bloqueo de ClawHub pueden activar una advertencia automática. Si el siguiente
análisis apto tras el vencimiento del plazo de la advertencia sigue situando al editor en el
umbral de posible bloqueo, ClawHub puede aplicar automáticamente la medida sobre la cuenta.
Las señales de revisión temporal acotadas y de menor confianza quedan fuera de la
aplicación automática de medidas.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden usar tokens de la API de ClawHub. Si la autenticación de la CLI
comienza a fallar después de una medida sobre la cuenta, inicie sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal mediante la CLI están bloqueados por un bloqueo o una cuenta deshabilitada,
use el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para solicitar una revisión de recuperación.

Si un correo electrónico activado por un analizador identifica una versión de una Skill o un plugin como maliciosa,
descargue los resultados almacenados del análisis correspondiente a la versión enviada que se bloqueó:
`clawhub scan download <slug> --version <version>`. Para los plugins, añada
`--kind plugin`. Revise el resultado del análisis, corrija el listado, incremente el número de
versión y cargue la versión corregida.

## Orientación para editores

Para reducir los falsos positivos y mejorar la confianza de los usuarios:

- mantenga precisos los nombres, resúmenes, etiquetas y registros de cambios
- declare las variables de entorno y los permisos necesarios
- evite comandos de instalación ofuscados
- incluya un enlace al código fuente cuando sea posible
- use ejecuciones de prueba antes de publicar plugins
- responda con claridad si los usuarios o moderadores preguntan sobre el comportamiento de una versión
