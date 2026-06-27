---
read_when:
    - Quieres detección de área amplia (DNS-SD) mediante Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referencia de CLI para `openclaw dns` (auxiliares de descubrimiento de área amplia)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

Utilidades de DNS para el descubrimiento de área amplia (Tailscale + CoreDNS). Actualmente centrado en macOS + CoreDNS de Homebrew.

Relacionado:

- Descubrimiento de Gateway: [Descubrimiento](/es/gateway/discovery)
- Configuración del descubrimiento de área amplia: [Configuración](/es/gateway/configuration)

## Configuración inicial

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planifica o aplica la configuración de CoreDNS para el descubrimiento DNS-SD de unidifusión.

Opciones:

- `--domain <domain>`: dominio de descubrimiento de área amplia (por ejemplo, `openclaw.internal`)
- `--apply`: instala o actualiza la configuración de CoreDNS y reinicia el servicio (requiere sudo; solo macOS)

Lo que muestra:

- dominio de descubrimiento resuelto
- ruta del archivo de zona
- IP actuales de tailnet
- configuración de descubrimiento recomendada para `openclaw.json`
- los valores de servidor de nombres/dominio de Split DNS de Tailscale que se deben establecer

Notas:

- Sin `--apply`, el comando solo es una utilidad de planificación e imprime la configuración recomendada.
- Si se omite `--domain`, OpenClaw usa `discovery.wideArea.domain` de la configuración.
- `--apply` actualmente solo admite macOS y espera CoreDNS de Homebrew.
- `--apply` inicializa el archivo de zona si es necesario, garantiza que exista la estrofa de importación de CoreDNS y reinicia el servicio brew `coredns`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Descubrimiento](/es/gateway/discovery)
