---
read_when:
    - Informar sobre una skill, un plugin o un paquete
    - Recuperarse de un listado retenido, oculto o bloqueado
    - Comprender la moderación, los bloqueos o el estado de la cuenta en ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan las denuncias de ClawHub, las retenciones de moderación, los listados ocultos, las suspensiones y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-07-04T10:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a la publicación, pero las superficies públicas de descubrimiento e instalación aún
necesitan salvaguardas. Los reportes, las retenciones de moderación, los listados ocultos y las acciones de cuenta
ayudan a proteger a los usuarios cuando una versión o cuenta parece insegura, engañosa o fuera
de la política.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y nivel de riesgo, consulta
[Auditorías de seguridad](/clawhub/security-audits).

Consulta también [Seguridad](/clawhub/security) y
[Uso aceptable](/clawhub/acceptable-usage). Para inquietudes sobre derechos de autor u otros
derechos de contenido, usa [Solicitudes de derechos de contenido](/clawhub/content-rights).

## Reportes

Los usuarios con sesión iniciada pueden reportar skills, plugins y paquetes.

Usa los reportes de ClawHub solo para contenido inseguro del marketplace, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe [Uso aceptable](/clawhub/acceptable-usage)

Usa el botón **Reportar skill** en la página de una skill, o el comando/API de reporte de
paquetes para paquetes.

No uses los reportes de ClawHub para vulnerabilidades en el código fuente propio de una skill o
plugin de terceros. Repórtalas directamente al publicador o al repositorio de código fuente
enlazado desde el listado. ClawHub no mantiene ni parchea código de skills o plugins
de terceros.

Los GitHub Security Advisories para `openclaw/clawhub` son para vulnerabilidades en
ClawHub mismo. Algunos ejemplos incluyen errores en el sitio web, API, CLI, registro, autenticación,
escaneo, moderación o límites de confianza de descarga/instalación. No uses los avisos de ClawHub
para vulnerabilidades en skills o plugins de terceros.

Los buenos reportes son específicos y accionables. El abuso de los reportes puede provocar
acciones de cuenta.

## Reclamos de organizaciones y namespaces

Las disputas sobre organizaciones, marcas, alcances de paquete, identificadores de propietario o propiedad de namespaces deben
usar el proceso de [Reclamos de organizaciones y namespaces](/clawhub/namespace-claims), no el
flujo de reporte dentro del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un
namespace debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir alias
o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados,
documentos de identidad personal, tokens de API ni tokens de desafío DNS en un
issue público.

## Retenciones de moderación

Algunos hallazgos graves o problemas de política pueden poner a un publicador o listado bajo una
retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del descubrimiento
público o las publicaciones futuras pueden empezar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos
de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no disponible de otro modo en
las superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión a menos que el propietario
resuelva el problema o moderación la restaure.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Prohibiciones y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder acceso de publicación. El abuso grave puede
dar lugar a prohibiciones de cuenta, revocación de tokens, contenido oculto o listados eliminados.
Las señales de presión por abuso de publicadores se revisan diariamente. Las señales que alcanzan
el umbral de posible prohibición de ClawHub pueden activar una advertencia automática. Si el siguiente
escaneo elegible después de la fecha límite de la advertencia aún ubica al publicador en el
umbral de posible prohibición, ClawHub puede aplicar la acción de cuenta automáticamente.
Las señales de revisión temporal delimitadas y de menor confianza quedan fuera de la aplicación
automática.

Las cuentas eliminadas, prohibidas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una acción de cuenta, inicia sesión en la interfaz web para revisar el estado de la cuenta.
Si una prohibición o cuenta deshabilitada bloquea el inicio de sesión o el acceso normal a la CLI,
usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para la revisión de recuperación.

Si un correo electrónico activado por el escáner nombra una versión de skill o plugin como maliciosa,
descarga los resultados de escaneo almacenados para la versión enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, agrega
`--kind plugin`. Revisa la salida del escaneo, corrige el listado, incrementa el número de versión
y sube la versión corregida.

## Guía para publicadores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén precisos los nombres, resúmenes, etiquetas y changelogs
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si los usuarios o moderadores preguntan sobre el comportamiento de una versión
