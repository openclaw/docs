---
read_when:
    - Informar de un problema de seguridad de ClawHub
    - Comprender la divulgación de vulnerabilidades de ClawHub
    - Distinguir los problemas de la plataforma ClawHub de los problemas de Skills o Plugin de terceros
sidebarTitle: Security
summary: Cómo informar problemas de seguridad de ClawHub y cuándo se divulgan públicamente las vulnerabilidades.
title: Seguridad
x-i18n:
    generated_at: "2026-07-06T10:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad

Los problemas de seguridad de ClawHub se pueden informar mediante GitHub Security Advisories para
`openclaw/clawhub`.

Usa GitHub Security Advisories para vulnerabilidades en ClawHub mismo. Los buenos
informes de advisory de ClawHub incluyen errores en:

- el sitio web, la API o la CLI de ClawHub
- la publicación en el registro, las descargas, las instalaciones o la integridad de artefactos
- la autenticación, la autorización o los tokens de API
- el escaneo, la moderación o la gestión de informes

No uses los advisories de ClawHub para vulnerabilidades en el código fuente propio de una skill o
plugin de terceros. Infórmalas directamente al publicador o al repositorio de origen
vinculado desde la ficha de ClawHub.

## Divulgación de vulnerabilidades

Dado que ClawHub es una aplicación en la nube alojada, las vulnerabilidades del servicio de ClawHub
no se divulgan públicamente de forma predeterminada. Se divulgan públicamente cuando hay
evidencia de impacto real en usuarios o cuando los usuarios deben tomar medidas.

Los ejemplos de impacto real en usuarios incluyen explotación confirmada, exposición de datos
o secretos de usuarios, contenido malicioso que llega a los usuarios debido a un fallo de la plataforma,
o cualquier problema que requiera que los usuarios roten credenciales, actualicen software local o
tomen otras medidas de protección.

Las vulnerabilidades en software instalado por el usuario se divulgan públicamente, como
paquetes, binarios, bibliotecas u otros artefactos de lanzamiento de la CLI de ClawHub que los usuarios
deben actualizar localmente.

## Páginas relacionadas

Para etiquetas de auditoría durante la instalación, niveles de riesgo, hallazgos e interpretación, consulta
[Auditorías de seguridad](/clawhub/security-audits).

Para informes del marketplace, retenciones de moderación, fichas ocultas, vetos y estado de cuenta,
consulta [Moderación y seguridad de la cuenta](/clawhub/moderation).
