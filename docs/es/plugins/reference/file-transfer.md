---
read_when:
    - Está instalando, configurando o auditando el plugin de transferencia de archivos
summary: Obtén, enumera y escribe archivos en nodos emparejados mediante comandos de Node específicos. Evita el truncamiento de stdout de bash mediante el uso de base64 sobre node.invoke para archivos binarios de hasta 16 MB.
title: Plugin de transferencia de archivos
x-i18n:
    generated_at: "2026-07-16T11:51:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin de transferencia de archivos

Obtiene, enumera y escribe archivos en nodos emparejados mediante comandos de nodo específicos. Evita el truncamiento de la salida estándar de bash mediante el uso de base64 a través de node.invoke para archivos binarios de hasta 16 MB.

## Distribución

- Paquete: `@openclaw/file-transfer`
- Ruta de instalación: incluido en OpenClaw

## Superficie

contratos: `tools`
