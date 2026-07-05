---
read_when:
    - Informar de un problema de seguridad de ClawHub
    - Comprender la divulgación de vulnerabilidades de ClawHub
    - Distinguir los problemas de la plataforma ClawHub de los problemas de Skills o Plugins de terceros
sidebarTitle: Security
summary: Cómo reportar problemas de seguridad de ClawHub y cuándo se divulgan públicamente las vulnerabilidades.
title: Seguridad
x-i18n:
    generated_at: "2026-07-05T11:05:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Seguridad

Los problemas de seguridad de ClawHub pueden reportarse mediante GitHub Security Advisories para
`openclaw/clawhub`.

Usa GitHub Security Advisories para vulnerabilidades en ClawHub en sí. Los buenos
reportes de advisories de ClawHub incluyen errores en:

- el sitio web, la API o la CLI de ClawHub
- publicación en el registro, descargas, instalaciones o integridad de artefactos
- autenticación, autorización o tokens de API
- escaneo, moderación o gestión de reportes

No uses advisories de ClawHub para vulnerabilidades en el código fuente propio de un skill o
Plugin de terceros. Repórtalas directamente al publicador o al repositorio fuente
enlazado desde la ficha de ClawHub.

## Divulgación de vulnerabilidades

Como ClawHub es una aplicación en la nube alojada, las vulnerabilidades del servicio ClawHub
no se divulgan públicamente de forma predeterminada. Se divulgan públicamente cuando hay
evidencia de impacto real en usuarios o cuando los usuarios necesitan tomar medidas.

Los ejemplos de impacto real en usuarios incluyen explotación confirmada, exposición de datos
o secretos de usuarios, contenido malicioso que llega a los usuarios debido a un fallo de la plataforma,
o cualquier problema que requiera que los usuarios roten credenciales, actualicen software local o
tomen otras medidas de protección.

Las vulnerabilidades en software instalado por usuarios se divulgan públicamente, como
paquetes de la CLI de ClawHub, binarios, bibliotecas u otros artefactos de lanzamiento que los usuarios
necesiten actualizar localmente.

## Páginas relacionadas

Para etiquetas de auditoría en el momento de la instalación, niveles de riesgo, hallazgos e interpretación, consulta
[Auditorías de seguridad](/clawhub/security-audits).

Para reportes del marketplace, retenciones de moderación, fichas ocultas, bloqueos y estado de la cuenta,
consulta [Moderación y seguridad de cuentas](/clawhub/moderation).
