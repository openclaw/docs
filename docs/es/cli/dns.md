---
read_when:
    - Quieres descubrimiento de área amplia (DNS-SD) mediante Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referencia de la CLI para `openclaw dns` (ayudantes de detección de área amplia)
title: DNS
x-i18n:
    generated_at: "2026-07-05T11:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Ayudantes de DNS para descubrimiento de área amplia (Tailscale + CoreDNS). Actualmente solo macOS + Homebrew CoreDNS.

Relacionado:

- Descubrimiento de Gateway: [Descubrimiento](/es/gateway/discovery)
- Configuración del descubrimiento de área amplia: [Configuración](/es/gateway/configuration)

## `dns setup`

Planifica o aplica la configuración de CoreDNS para el descubrimiento DNS-SD de unidifusión.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Opción              | Efecto                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Dominio de descubrimiento de área amplia (por ejemplo, `openclaw.internal`).                        |
| `--apply`           | Instala/actualiza la configuración de CoreDNS y (re)inicia el servicio. Requiere sudo, solo macOS. |

Sin `--domain`, OpenClaw usa `discovery.wideArea.domain` de la configuración.

Sin `--apply`, el comando solo imprime:

- Dominio de descubrimiento resuelto y ruta del archivo de zona
- IPs actuales de tailnet
- Configuración de descubrimiento de `openclaw.json` recomendada
- Valores de servidor de nombres/dominio de DNS dividido de Tailscale para establecer en la consola de administración de Tailscale

Con `--apply` (solo macOS, requiere Homebrew CoreDNS):

- Inicializa el archivo de zona si falta
- Agrega la estrofa de importación de CoreDNS si falta
- Reinicia el servicio brew `coredns`

## Relacionado

- [Referencia de CLI](/es/cli)
- [Descubrimiento](/es/gateway/discovery)
