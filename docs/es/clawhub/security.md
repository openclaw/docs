---
read_when:
    - Informar de un problema de seguridad de ClawHub
    - Comprender la divulgación de vulnerabilidades de ClawHub
    - Distinguir los problemas de la plataforma ClawHub de los problemas de Skills o Plugin de terceros
sidebarTitle: Security
summary: Cómo informar problemas de seguridad de ClawHub y cuándo se divulgan públicamente las vulnerabilidades.
title: Seguridad
x-i18n:
    generated_at: "2026-07-04T17:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad

Los problemas de seguridad de ClawHub se pueden reportar mediante GitHub Security Advisories para
`openclaw/clawhub`.

Usa GitHub Security Advisories para vulnerabilidades en el propio ClawHub. Los buenos
reportes de avisos de ClawHub incluyen errores en:

- el sitio web, la API o la CLI de ClawHub
- publicación en el registro, descargas, instalaciones o integridad de artefactos
- autenticación, autorización o tokens de API
- escaneo, moderación o gestión de reportes

No uses los avisos de ClawHub para vulnerabilidades en el código fuente propio de una skill o
Plugin de terceros. Repórtalas directamente al publicador o al repositorio de origen
enlazado desde la ficha de ClawHub.

## Divulgación de vulnerabilidades

Como ClawHub es una aplicación alojada en la nube, las vulnerabilidades del servicio
ClawHub no se divulgan públicamente de forma predeterminada. Se divulgan públicamente cuando hay
evidencia de impacto real en usuarios o cuando los usuarios necesitan tomar medidas.

Ejemplos de impacto real en usuarios incluyen explotación confirmada, exposición de datos
o secretos de usuarios, contenido malicioso que llega a usuarios debido a una falla de la plataforma,
o cualquier problema que requiera que los usuarios roten credenciales, actualicen software local o
tomen otra medida de protección.

Las vulnerabilidades en software instalado por los usuarios se divulgan públicamente, como
paquetes de la CLI de ClawHub, binarios, bibliotecas u otros artefactos de lanzamiento que los usuarios
deben actualizar localmente.

## Páginas relacionadas

Para etiquetas de auditoría durante la instalación, niveles de riesgo, hallazgos e interpretación, consulta
[Auditorías de seguridad](/clawhub/security-audits).

Para reportes del marketplace, retenciones de moderación, fichas ocultas, prohibiciones y estado de la cuenta,
consulta [Moderación y seguridad de la cuenta](/clawhub/moderation).
