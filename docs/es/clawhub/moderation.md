---
read_when:
    - Denunciar una skill, un plugin o un paquete
    - Recuperación de una publicación retenida, oculta o bloqueada
    - Comprender la moderación de ClawHub, los bloqueos o el estado de la cuenta
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan las denuncias, las retenciones por moderación, los listados ocultos, los bloqueos y el estado de las cuentas en ClawHub.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-12T14:23:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de las cuentas

ClawHub permite publicar libremente, pero las superficies públicas de descubrimiento e instalación aún
necesitan medidas de protección. Los reportes, las retenciones de moderación, los listados ocultos y las acciones sobre cuentas
ayudan a proteger a los usuarios cuando una versión o una cuenta parece insegura, engañosa o
incumple las políticas.

Esta página trata sobre la moderación y el estado de las cuentas. Para consultar etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulte
[Auditorías de seguridad](/clawhub/security-audits).

Consulte también [Seguridad](/clawhub/security) y
[Uso aceptable](/clawhub/acceptable-usage). Para cuestiones relacionadas con derechos de autor u otros
derechos sobre el contenido, utilice [Solicitudes de derechos sobre el contenido](/clawhub/content-rights).

## Reportes

Los usuarios que hayan iniciado sesión pueden reportar Skills, plugins y paquetes.

Utilice los reportes de ClawHub únicamente para contenido inseguro del mercado, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infrinja el [Uso aceptable](/clawhub/acceptable-usage)

Utilice el botón **Report skill** en la página de una Skill, o el comando o la API de reporte
de paquetes.

No utilice los reportes de ClawHub para vulnerabilidades en el código fuente propio de una Skill o un
Plugin de terceros. Repórtelas directamente al editor o al repositorio
de código fuente enlazado desde el listado. ClawHub no mantiene ni corrige
el código de Skills o plugins de terceros.

Los avisos de seguridad de GitHub para `openclaw/clawhub` son para vulnerabilidades del
propio ClawHub. Algunos ejemplos son errores en el sitio web, la API, la CLI, el registro, la autenticación,
el análisis, la moderación o los límites de confianza de descarga e instalación. No utilice los avisos de
ClawHub para vulnerabilidades en Skills o plugins de terceros.

Los buenos reportes son específicos y permiten tomar medidas. El abuso del sistema de reportes puede provocar
acciones sobre la cuenta.

## Reclamaciones de organizaciones y espacios de nombres

Las disputas sobre la propiedad de organizaciones, marcas, ámbitos de paquetes, identificadores de propietarios o espacios de nombres deben
utilizar el proceso de [Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims), no el
flujo de reportes del producto ni el formulario de apelación de cuentas.

Utilice ese proceso cuando necesite que el personal de ClawHub revise pruebas no confidenciales de que un
espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o someterse a cualquier otro tipo de revisión. No incluya secretos, documentos privados, archivos legales
privados, documentos de identidad personal, tokens de API ni tokens de desafío de DNS en una
incidencia pública.

## Retenciones de moderación

Algunos hallazgos graves o problemas relacionados con las políticas pueden someter a un editor o listado a una
retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del
descubrimiento público o las publicaciones futuras pueden comenzar ocultas hasta que se revise el problema.

Las retenciones de moderación tienen como objetivo proteger a los usuarios mientras ClawHub resuelve casos de
alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no disponible de algún otro modo en
las superficies públicas de instalación.

Si encuentra uno de estos estados, no instale la versión a menos que el propietario
resuelva el problema o el equipo de moderación la restablezca.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Bloqueos y estado de las cuentas

Las cuentas que infrinjan las políticas de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden
provocar el bloqueo de cuentas, la revocación de tokens, contenido oculto o la eliminación de listados.
Las señales de presión por abuso de editores se comprueban a diario. Las señales que alcanzan
el umbral de posible bloqueo de ClawHub pueden activar una advertencia automática. Si el siguiente
análisis admisible posterior al plazo de la advertencia aún sitúa al editor en el
umbral de posible bloqueo, ClawHub puede aplicar automáticamente la acción sobre la cuenta.
Las señales de menor confianza y de revisión temporal limitada quedan fuera de la aplicación
automática de medidas.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden utilizar tokens de la API de ClawHub. Si la autenticación de la CLI
comienza a fallar después de una acción sobre la cuenta, inicie sesión en la interfaz web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal mediante la CLI está bloqueado debido a un bloqueo o a una cuenta deshabilitada,
utilice el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para solicitar una revisión de recuperación.

Si un correo electrónico activado por el analizador identifica como maliciosa una versión de una Skill o un Plugin,
descargue los resultados almacenados del análisis de la versión enviada y bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, añada
`--kind plugin`. Revise los resultados del análisis, corrija el listado, incremente el número
de versión y cargue la versión corregida.

## Recomendaciones para editores

Para reducir los falsos positivos y mejorar la confianza de los usuarios:

- mantenga actualizados y precisos los nombres, resúmenes, etiquetas y registros de cambios
- declare las variables de entorno y los permisos necesarios
- evite comandos de instalación ofuscados
- incluya un enlace al código fuente cuando sea posible
- utilice ejecuciones de prueba antes de publicar plugins
- responda con claridad si los usuarios o moderadores preguntan sobre el comportamiento de una versión
