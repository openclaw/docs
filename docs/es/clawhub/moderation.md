---
read_when:
    - Denunciar una Skill, un plugin o un paquete
    - Recuperación de un anuncio retenido, oculto o bloqueado
    - Información sobre la moderación de ClawHub, los bloqueos o el estado de la cuenta
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los reportes de ClawHub, las retenciones por moderación, los listados ocultos, los bloqueos y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-14T13:31:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de las cuentas

ClawHub permite la publicación abierta, pero las superficies públicas de descubrimiento e instalación
siguen necesitando medidas de protección. Los informes, las retenciones de moderación, los listados ocultos y las medidas sobre las cuentas
ayudan a proteger a los usuarios cuando una versión o una cuenta parece insegura, engañosa o contraria
a las políticas.

Esta página trata sobre la moderación y el estado de las cuentas. Para las etiquetas de auditoría, como
`Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulte
[Auditorías de seguridad](/clawhub/security-audits).

Consulte también [Seguridad](/clawhub/security) y
[Uso aceptable](/clawhub/acceptable-usage). Para cuestiones relacionadas con derechos de autor u otros
derechos sobre el contenido, utilice [Solicitudes sobre derechos de contenido](/clawhub/content-rights).

## Informes

Los usuarios que hayan iniciado sesión pueden denunciar Skills, plugins y paquetes.

Utilice los informes de ClawHub únicamente para contenido inseguro del mercado, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/clawhub/acceptable-usage)

Utilice el botón **Report skill** de la página de una Skill, o el comando o la API
de denuncia de paquetes.

No utilice los informes de ClawHub para vulnerabilidades en el código fuente propio de una Skill
o un plugin de terceros. Comuníquelas directamente al editor o al repositorio
de código fuente enlazado desde el listado. ClawHub no mantiene ni corrige
el código de Skills o plugins de terceros.

Los avisos de seguridad de GitHub para `openclaw/clawhub` están destinados a vulnerabilidades en
el propio ClawHub. Algunos ejemplos son errores en el sitio web, la API, la CLI, el registro, la autenticación,
el análisis, la moderación o los límites de confianza de descarga e instalación. No utilice los avisos de
ClawHub para vulnerabilidades en Skills o plugins de terceros.

Los buenos informes son específicos y permiten tomar medidas. El uso abusivo del sistema de informes puede dar lugar
a medidas sobre la cuenta.

## Reclamaciones de organizaciones y espacios de nombres

Las disputas sobre la propiedad de organizaciones, marcas, ámbitos de paquetes, identificadores de propietarios o espacios de nombres deben
utilizar el proceso de [Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims), no el
flujo de denuncia del producto ni el formulario de apelación de cuentas.

Utilice ese proceso cuando necesite que el personal de ClawHub revise pruebas no confidenciales de que un
espacio de nombres debe reservarse, transferirse, cambiarse de nombre, ocultarse, ponerse en cuarentena, recibir un alias
o revisarse de otro modo. No incluya secretos, documentos privados, archivos jurídicos
privados, documentos personales de identidad, tokens de API ni tokens de desafío de DNS en una
incidencia pública.

## Retenciones de moderación

Algunos hallazgos graves o problemas relacionados con las políticas pueden someter a un editor o un listado a una
retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del descubrimiento
público o las publicaciones futuras pueden comenzar ocultas hasta que se revise el problema.

Las retenciones de moderación están destinadas a proteger a los usuarios mientras ClawHub resuelve casos
de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no estar disponible de otro modo en
las superficies públicas de instalación.

Si observa uno de estos estados, no instale la versión a menos que el propietario
resuelva el problema o la moderación la restablezca.

Los propietarios pueden seguir viendo diagnósticos de sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ha ocurrido y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Bloqueos y estado de las cuentas

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso a la publicación. Los abusos graves pueden
provocar el bloqueo de cuentas, la revocación de tokens, la ocultación de contenido o la eliminación de listados.
Las señales de presión por abuso de los editores se comprueban a diario. Las señales que alcanzan
el umbral de posible bloqueo de ClawHub pueden activar una advertencia automática. Si el siguiente
análisis apto posterior al vencimiento del plazo de la advertencia todavía sitúa al editor en el
umbral de posible bloqueo, ClawHub puede aplicar automáticamente la medida sobre la cuenta.
Las señales de revisión de menor confianza y limitadas temporalmente no se someten a la aplicación
automática de medidas.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden utilizar tokens de la API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una medida sobre la cuenta, inicie sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal mediante la CLI está bloqueado debido a un bloqueo o a una cuenta deshabilitada,
utilice el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para solicitar una revisión de recuperación.

Si un correo electrónico activado por un analizador identifica una versión de una Skill o un plugin como maliciosa,
descargue los resultados almacenados del análisis de la versión enviada y bloqueada:
`clawhub scan download <slug> --version <version>`. Para los plugins, añada
`--kind plugin`. Revise el resultado del análisis, corrija el listado, incremente el número
de versión y cargue la versión corregida.

## Orientación para editores

Para reducir los falsos positivos y mejorar la confianza de los usuarios:

- mantenga precisos los nombres, resúmenes, etiquetas y registros de cambios
- declare las variables de entorno y los permisos necesarios
- evite los comandos de instalación ofuscados
- incluya un enlace al código fuente cuando sea posible
- utilice ejecuciones de prueba antes de publicar plugins
- responda con claridad si los usuarios o moderadores preguntan por el comportamiento de una versión
