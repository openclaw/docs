---
read_when:
    - Denunciar una skill, un plugin o un paquete
    - Recuperación de un listado retenido, oculto o bloqueado
    - Cómo entender la moderación, los bloqueos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los reportes, las retenciones por moderación, los listados ocultos, los bloqueos y el estado de las cuentas en ClawHub.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-11T22:57:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de las cuentas

ClawHub permite la publicación abierta, pero las superficies públicas de descubrimiento e instalación siguen necesitando medidas de protección. Los reportes, las retenciones de moderación, los listados ocultos y las medidas sobre las cuentas ayudan a proteger a los usuarios cuando una versión o una cuenta parece insegura, engañosa o contraria a las políticas.

Esta página aborda la moderación y el estado de las cuentas. Para consultar etiquetas de auditoría como `Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulta [Auditorías de seguridad](/clawhub/security-audits).

Consulta también [Seguridad](/es/clawhub/security) y [Uso aceptable](/clawhub/acceptable-usage). Para cuestiones de derechos de autor u otros derechos sobre contenidos, utiliza [Solicitudes sobre derechos de contenido](/clawhub/content-rights).

## Reportes

Los usuarios que hayan iniciado sesión pueden reportar Skills, plugins y paquetes.

Utiliza los reportes de ClawHub únicamente para contenido inseguro del mercado, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infrinja el [Uso aceptable](/clawhub/acceptable-usage)

Utiliza el botón **Report skill** en la página de una Skill, o el comando o la API de reporte de paquetes para los paquetes.

No utilices los reportes de ClawHub para vulnerabilidades en el código fuente propio de una Skill o Plugin de terceros. Repórtalas directamente al editor o al repositorio de código fuente enlazado desde el listado. ClawHub no mantiene ni corrige el código de Skills o plugins de terceros.

Los avisos de seguridad de GitHub para `openclaw/clawhub` están destinados a las vulnerabilidades del propio ClawHub. Algunos ejemplos son los errores en el sitio web, la API, la CLI, el registro, la autenticación, el análisis, la moderación o los límites de confianza de descarga e instalación. No utilices los avisos de ClawHub para vulnerabilidades en Skills o plugins de terceros.

Los buenos reportes son específicos y permiten tomar medidas. El abuso del sistema de reportes puede dar lugar a medidas sobre la cuenta.

## Reclamaciones de organizaciones y espacios de nombres

Las disputas sobre la propiedad de una organización, marca, ámbito de paquete, identificador de propietario o espacio de nombres deben utilizar el proceso de [Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims), no el flujo de reportes del producto ni el formulario de apelación de cuentas.

Utiliza ese proceso cuando necesites que el personal de ClawHub revise pruebas no confidenciales de que un espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias o someterse a otra revisión. No incluyas secretos, documentos privados, archivos legales privados, documentos personales de identidad, tokens de API ni tokens de comprobación de DNS en una incidencia pública.

## Retenciones de moderación

Algunos hallazgos graves o problemas relacionados con las políticas pueden someter a un editor o listado a una retención de moderación. Cuando esto sucede, el contenido afectado puede ocultarse del descubrimiento público o las publicaciones futuras pueden comenzar ocultas hasta que se revise el problema.

Las retenciones de moderación tienen como objetivo proteger a los usuarios mientras ClawHub resuelve casos de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no estar disponible de algún otro modo en las superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión a menos que el propietario resuelva el problema o el equipo de moderación la restablezca.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos diagnósticos ayudan a explicar qué sucedió y qué debe cambiar antes de que el listado pueda volver a las superficies públicas.

## Bloqueos y estado de las cuentas

Las cuentas que infrinjan las políticas de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden dar lugar al bloqueo de la cuenta, la revocación de tokens, la ocultación de contenido o la eliminación de listados. Las señales de presión por abuso de los editores se comprueban a diario. Las señales que alcanzan el umbral de posible bloqueo de ClawHub pueden activar una advertencia automática. Si el siguiente análisis válido tras el vencimiento del plazo de la advertencia sigue situando al editor en el umbral de posible bloqueo, ClawHub puede aplicar automáticamente la medida sobre la cuenta. Las señales de menor confianza y las señales de revisión temporal limitada quedan fuera de la aplicación automática.

Las cuentas eliminadas, bloqueadas o deshabilitadas no pueden utilizar tokens de la API de ClawHub. Si la autenticación de la CLI comienza a fallar después de una medida sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta. Si el inicio de sesión o el acceso normal mediante la CLI están bloqueados debido a un bloqueo o a una cuenta deshabilitada, utiliza el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para solicitar una revisión de recuperación.

Si un correo electrónico generado por el analizador identifica como maliciosa una versión de una Skill o un Plugin, descarga los resultados almacenados del análisis de la versión enviada que fue bloqueada: `clawhub scan download <slug> --version <version>`. Para plugins, añade `--kind plugin`. Revisa el resultado del análisis, corrige el listado, incrementa el número de versión y carga la versión corregida.

## Orientación para editores

Para reducir los falsos positivos y mejorar la confianza de los usuarios:

- mantén exactos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y los permisos necesarios
- evita los comandos de instalación ofuscados
- incluye un enlace al código fuente cuando sea posible
- utiliza simulaciones antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento de una versión
