---
read_when:
    - Informar sobre una skill, Plugin o paquete
    - Recuperarse de un listado retenido, oculto o bloqueado
    - Comprender la moderación, los bloqueos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los reportes de ClawHub, las retenciones de moderación, los listados ocultos, las prohibiciones y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-06T10:46:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a la publicación, pero las superficies públicas de descubrimiento e instalación aún necesitan medidas de protección. Los reportes, las retenciones de moderación, las fichas ocultas y las acciones sobre cuentas ayudan a proteger a los usuarios cuando una versión o cuenta parece insegura, engañosa o fuera de la política.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como `Pass`, `Review`, `Warn`, `Malicious` y el nivel de riesgo, consulta [Auditorías de seguridad](/clawhub/security-audits).

Consulta también [Seguridad](/clawhub/security) y [Uso aceptable](/clawhub/acceptable-usage). Para inquietudes sobre derechos de autor u otros derechos de contenido, usa [Solicitudes de derechos de contenido](/clawhub/content-rights).

## Reportes

Los usuarios que han iniciado sesión pueden reportar skills, plugins y paquetes.

Usa los reportes de ClawHub solo para contenido inseguro del marketplace, como:

- fichas maliciosas
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/clawhub/acceptable-usage)

Usa el botón **Reportar skill** en una página de skill, o el comando/API de reporte de paquetes para paquetes.

No uses los reportes de ClawHub para vulnerabilidades en el código fuente propio de un skill o plugin de terceros. Repórtalas directamente al publicador o al repositorio fuente enlazado desde la ficha. ClawHub no mantiene ni parchea código de skills o plugins de terceros.

Los GitHub Security Advisories para `openclaw/clawhub` son para vulnerabilidades en ClawHub mismo. Algunos ejemplos incluyen errores en el sitio web, la API, la CLI, el registro, la autenticación, el escaneo, la moderación o los límites de confianza de descarga/instalación. No uses los avisos de ClawHub para vulnerabilidades en skills o plugins de terceros.

Los buenos reportes son específicos y accionables. El abuso de los reportes puede derivar en acciones sobre la cuenta.

## Reclamos de organización y namespace

Las disputas de propiedad sobre organización, marca, alcance de paquete, identificador de propietario o namespace deben usar el proceso de [Reclamos de organización y namespace](/clawhub/namespace-claims), no el flujo de reportes del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un namespace debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados, documentos de identidad personal, tokens de API ni tokens de desafío DNS en un issue público.

## Retenciones de moderación

Algunos hallazgos graves o problemas de política pueden poner a un publicador o una ficha bajo una retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del descubrimiento público o las publicaciones futuras pueden empezar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Fichas ocultas o bloqueadas

Una ficha puede estar retenida, oculta, en cuarentena, revocada o no disponible de otro modo en las superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión salvo que el propietario resuelva el problema o moderación la restaure.

Los propietarios aún pueden ver diagnósticos de sus propias fichas retenidas u ocultas. Estos diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que la ficha pueda volver a las superficies públicas.

## Baneos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder el acceso de publicación. Los abusos graves pueden derivar en baneos de cuenta, revocación de tokens, contenido oculto o fichas eliminadas. Las señales de presión por abuso de publicadores se revisan a diario. Las señales que alcanzan el umbral de posible baneo de ClawHub pueden activar una advertencia automática. Si el siguiente escaneo elegible después de la fecha límite de advertencia aún coloca al publicador en el umbral de posible baneo, ClawHub puede aplicar la acción sobre la cuenta automáticamente. Las señales de revisión temporal de menor confianza y acotadas quedan fuera de la aplicación automática.

Las cuentas eliminadas, baneadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI empieza a fallar después de una acción sobre la cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta. Si el inicio de sesión o el acceso normal por CLI está bloqueado por un baneo o una cuenta deshabilitada, usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para una revisión de recuperación.

Si un correo activado por un escáner nombra una versión de skill o plugin como maliciosa, descarga los resultados de escaneo almacenados para la versión enviada bloqueada: `clawhub scan download <slug> --version <version>`. Para plugins, agrega `--kind plugin`. Revisa la salida del escaneo, corrige la ficha, incrementa el número de versión y sube la versión corregida.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén nombres, resúmenes, etiquetas y changelogs precisos
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si usuarios o moderadores preguntan sobre el comportamiento de una versión
