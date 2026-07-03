---
read_when:
    - Informar sobre una skill, plugin o paquete
    - Recuperarse de una publicación retenida, oculta o bloqueada
    - Comprender la moderación, las suspensiones o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los informes de ClawHub, las retenciones de moderación, los listados ocultos, las prohibiciones y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-03T02:41:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a la publicación, pero las superficies públicas de descubrimiento e instalación siguen necesitando medidas de protección. Los informes, las retenciones de moderación, los listados ocultos y las acciones sobre cuentas ayudan a proteger a los usuarios cuando una versión o una cuenta parece insegura, engañosa o contraria a las políticas.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como `Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulta [Auditorías de seguridad](/clawhub/security-audits).

Consulta también [Seguridad](/clawhub/security) y [Uso aceptable](/clawhub/acceptable-usage). Para problemas de derechos de autor u otros derechos de contenido, usa [Solicitudes de derechos de contenido](/clawhub/content-rights).

## Informes

Los usuarios con sesión iniciada pueden informar sobre skills, plugins y paquetes.

Usa los informes de ClawHub solo para contenido inseguro del marketplace, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/clawhub/acceptable-usage)

Usa el botón **Reportar skill** en una página de skill, o el comando/API de informe de paquetes para paquetes.

No uses los informes de ClawHub para vulnerabilidades en el propio código fuente de una skill o plugin de terceros. Infórmalas directamente al publicador o al repositorio fuente enlazado desde el listado. ClawHub no mantiene ni parchea código de skills o plugins de terceros.

Los GitHub Security Advisories para `openclaw/clawhub` son para vulnerabilidades en ClawHub mismo. Algunos ejemplos incluyen errores en el sitio web, la API, la CLI, el registro, la autenticación, el escaneo, la moderación o los límites de confianza de descarga/instalación. No uses los avisos de ClawHub para vulnerabilidades en skills o plugins de terceros.

Los buenos informes son específicos y accionables. El abuso del sistema de informes puede dar lugar a acciones sobre la cuenta.

## Reclamaciones de organización y espacio de nombres

Las disputas sobre la propiedad de organizaciones, marcas, ámbitos de paquetes, identificadores de propietario o espacios de nombres deben usar el proceso de [Reclamaciones de organización y espacio de nombres](/clawhub/namespace-claims), no el flujo de informes dentro del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un espacio de nombres debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados, documentos de identidad personal, tokens de API ni tokens de desafío DNS en una incidencia pública.

## Retenciones de moderación

Algunos hallazgos graves o problemas de políticas pueden poner a un publicador o listado bajo una retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del descubrimiento público o las publicaciones futuras pueden empezar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no disponible de otro modo en las superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión a menos que el propietario resuelva el problema o moderación la restaure.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el listado pueda volver a las superficies públicas.

## Prohibiciones y estado de la cuenta

Las cuentas que infringen la política de ClawHub pueden perder acceso de publicación. Los abusos graves pueden provocar prohibiciones de cuenta, revocación de tokens, contenido oculto o listados eliminados. Las señales de presión por abuso del publicador se revisan diariamente. Las señales que alcanzan el umbral de posible prohibición de ClawHub pueden activar una advertencia automática. Si el siguiente escaneo elegible después del plazo de advertencia sigue situando al publicador en el umbral de posible prohibición, ClawHub puede aplicar automáticamente la acción sobre la cuenta. Las señales de revisión temporal de menor confianza y acotadas quedan fuera de la aplicación automática.

Las cuentas eliminadas, prohibidas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta. Si el inicio de sesión o el acceso normal de la CLI está bloqueado por una prohibición o una cuenta deshabilitada, usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para la revisión de recuperación.

Si un correo electrónico activado por un escáner identifica una versión de skill o plugin como maliciosa, descarga los resultados de escaneo almacenados para la versión enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, añade
`--kind plugin`. Revisa la salida del escaneo, corrige el listado, incrementa el número de versión y sube la versión corregida.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y registros de cambios
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa simulacros antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento de la versión
