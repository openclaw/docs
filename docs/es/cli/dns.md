---
read_when:
    - Quieres descubrimiento de área amplia (DNS-SD) mediante Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referencia de la CLI para `openclaw dns` (ayudantes de descubrimiento de área amplia)
title: DNS
x-i18n:
    generated_at: "2026-04-24T05:22:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Ayudantes DNS para descubrimiento de área amplia (Tailscale + CoreDNS). Actualmente centrado en macOS + CoreDNS de Homebrew.

Relacionado:

- Descubrimiento del Gateway: [Discovery](/es/gateway/discovery)
- Configuración de descubrimiento de área amplia: [Configuración](/es/gateway/configuration)

## Configuración

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planifica o aplica la configuración de CoreDNS para descubrimiento DNS-SD unicast.

Opciones:

- `--domain <domain>`: dominio de descubrimiento de área amplia (por ejemplo, `openclaw.internal`)
- `--apply`: instala o actualiza la configuración de CoreDNS y reinicia el servicio (requiere sudo; solo macOS)

Qué muestra:

- dominio de descubrimiento resuelto
- ruta del archivo de zona
- IP de tailnet actuales
- configuración de descubrimiento recomendada para `openclaw.json`
- los valores de servidor de nombres/dominio de DNS dividido de Tailscale que se deben configurar

Notas:

- Sin `--apply`, el comando es solo un ayudante de planificación e imprime la configuración recomendada.
- Si se omite `--domain`, OpenClaw usa `discovery.wideArea.domain` de la configuración.
- `--apply` actualmente solo es compatible con macOS y espera CoreDNS de Homebrew.
- `--apply` inicializa el archivo de zona si es necesario, garantiza que exista la estrofa import de CoreDNS y reinicia el servicio brew `coredns`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Discovery](/es/gateway/discovery)
