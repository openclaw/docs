---
read_when:
    - Informar sobre un skill, plugin o paquete
    - Recuperación de un listado retenido, oculto o bloqueado
    - Entender la moderación de ClawHub, los bloqueos o el estado de la cuenta
sidebarTitle: Moderation and Account Safety
summary: Cómo funcionan los informes de ClawHub, las retenciones de moderación, los listados ocultos, las prohibiciones y el estado de la cuenta.
title: Moderación y seguridad de la cuenta
x-i18n:
    generated_at: "2026-06-28T00:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderación y seguridad de la cuenta

ClawHub está abierto a publicaciones, pero las superficies públicas de descubrimiento e instalación aún
necesitan mecanismos de protección. Los informes, las retenciones de moderación, los listados ocultos y las medidas
sobre cuentas ayudan a proteger a los usuarios cuando una versión o cuenta parece insegura, engañosa o fuera
de la política.

Esta página cubre la moderación y el estado de la cuenta. Para etiquetas de auditoría como
`Pass`, `Review`, `Warn`, `Malicious` y nivel de riesgo, consulta
[Auditorías de seguridad](/es/clawhub/security-audits).

Consulta también [Seguridad](/es/clawhub/security) y
[Uso aceptable](/es/clawhub/acceptable-usage). Para problemas de derechos de autor u otros derechos
de contenido, usa [Solicitudes de derechos de contenido](/es/clawhub/content-rights).

## Informes

Los usuarios con sesión iniciada pueden informar sobre Skills, plugins y paquetes.

Usa los informes de ClawHub solo para contenido inseguro del marketplace, como:

- listados maliciosos
- metadatos engañosos
- credenciales o requisitos de permisos no declarados
- instrucciones de instalación sospechosas
- suplantación de identidad
- registros de mala fe o uso indebido de marcas comerciales
- contenido que infringe el [Uso aceptable](/es/clawhub/acceptable-usage)

Usa el botón **Informar Skill** en una página de Skill, o el comando/API de informes
de paquetes para paquetes.

No uses los informes de ClawHub para vulnerabilidades en el código fuente propio de un Skill o
plugin de terceros. Informa de ellas directamente al editor o al repositorio de origen
enlazado desde el listado. ClawHub no mantiene ni parchea código de Skills o plugins
de terceros.

Los GitHub Security Advisories para `openclaw/clawhub` son para vulnerabilidades en
ClawHub en sí. Algunos ejemplos incluyen errores en el sitio web, la API, la CLI, el registro, la autenticación,
el escaneo, la moderación o los límites de confianza de descarga/instalación. No uses los advisories de ClawHub
para vulnerabilidades en Skills o plugins de terceros.

Los buenos informes son específicos y accionables. El abuso de los informes puede derivar
en medidas sobre la cuenta.

## Reclamaciones de organizaciones y namespaces

Las disputas sobre organizaciones, marcas, ámbitos de paquete, identificadores de propietario o propiedad de namespaces deben
usar el proceso de [Reclamaciones de organizaciones y namespaces](/es/clawhub/namespace-claims), no el
flujo de informes dentro del producto ni el formulario de apelación de cuenta.

Usa ese proceso cuando necesites que el personal de ClawHub revise pruebas no sensibles de que un
namespace debe reservarse, transferirse, renombrarse, ocultarse, ponerse en cuarentena, recibir un alias
o revisarse de otro modo. No incluyas secretos, documentos privados, archivos legales privados,
documentos de identidad personal, tokens de API ni tokens de desafío DNS en un
issue público.

## Retenciones de moderación

Algunos hallazgos graves o problemas de política pueden poner a un editor o listado bajo una
retención de moderación. Cuando esto ocurre, el contenido afectado puede ocultarse del descubrimiento público
o las publicaciones futuras pueden empezar ocultas hasta que se revise el problema.

Las retenciones de moderación están pensadas para proteger a los usuarios mientras ClawHub resuelve casos
de alto riesgo. También pueden levantarse cuando se confirma un falso positivo.

## Listados ocultos o bloqueados

Un listado puede estar retenido, oculto, en cuarentena, revocado o no disponible de otro modo en
superficies públicas de instalación.

Si ves uno de estos estados, no instales la versión salvo que el propietario
resuelva el problema o moderación la restaure.

Los propietarios aún pueden ver diagnósticos de sus propios listados retenidos u ocultos. Estos
diagnósticos ayudan a explicar qué ocurrió y qué debe cambiar antes de que el
listado pueda volver a las superficies públicas.

## Baneos y estado de la cuenta

Las cuentas que infrinjan la política de ClawHub pueden perder acceso de publicación. El abuso grave puede
resultar en baneos de cuenta, revocación de tokens, contenido oculto o listados eliminados.
Las señales de presión de abuso de editores se revisan a diario. Las señales que alcanzan
el umbral de baneo potencial de ClawHub pueden activar una advertencia automática. Si el siguiente
escaneo elegible después de la fecha límite de la advertencia todavía coloca al editor en el
umbral de baneo potencial, ClawHub puede aplicar la medida sobre la cuenta automáticamente.
Las señales de revisión temporal acotadas y de menor confianza quedan fuera de la
aplicación automática.

Las cuentas eliminadas, baneadas o deshabilitadas no pueden usar tokens de API de ClawHub. Si la autenticación de la CLI
empieza a fallar después de una medida sobre la cuenta, inicia sesión en la UI web para revisar el
estado de la cuenta. Si el inicio de sesión o el acceso normal de la CLI está bloqueado por un baneo o una cuenta deshabilitada,
usa el [formulario de apelación de ClawHub](https://appeals.openclaw.ai/) para revisión de recuperación.

Si un correo activado por un escáner nombra una versión de Skill o plugin como maliciosa,
descarga los resultados de escaneo almacenados para la versión enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, añade
`--kind plugin`. Revisa la salida del escaneo, corrige el listado, incrementa el número de versión
y sube la versión corregida.

## Guía para editores

Para reducir falsos positivos y mejorar la confianza de los usuarios:

- mantén nombres, resúmenes, etiquetas y registros de cambios precisos
- declara las variables de entorno y permisos requeridos
- evita comandos de instalación ofuscados
- enlaza al código fuente cuando sea posible
- usa ejecuciones de prueba antes de publicar plugins
- responde con claridad si usuarios o moderadores preguntan sobre el comportamiento de una versión
