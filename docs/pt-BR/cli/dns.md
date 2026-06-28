---
read_when:
    - Você quer descoberta de área ampla (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referência da CLI para `openclaw dns` (auxiliares de descoberta em área ampla)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

Auxiliares de DNS para descoberta de área ampla (Tailscale + CoreDNS). Atualmente focado em macOS + Homebrew CoreDNS.

Relacionado:

- Descoberta do Gateway: [Descoberta](/pt-BR/gateway/discovery)
- Configuração de descoberta de área ampla: [Configuração](/pt-BR/gateway/configuration)

## Configuração

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planeje ou aplique a configuração do CoreDNS para descoberta DNS-SD unicast.

Opções:

- `--domain <domain>`: domínio de descoberta de área ampla (por exemplo, `openclaw.internal`)
- `--apply`: instala ou atualiza a configuração do CoreDNS e reinicia o serviço (requer sudo; somente macOS)

O que ele mostra:

- domínio de descoberta resolvido
- caminho do arquivo de zona
- IPs atuais da tailnet
- configuração de descoberta recomendada para `openclaw.json`
- os valores de servidor de nomes/domínio de Split DNS do Tailscale a definir

Observações:

- Sem `--apply`, o comando é apenas um auxiliar de planejamento e imprime a configuração recomendada.
- Se `--domain` for omitido, o OpenClaw usa `discovery.wideArea.domain` da configuração.
- Atualmente, `--apply` oferece suporte somente ao macOS e espera Homebrew CoreDNS.
- `--apply` inicializa o arquivo de zona se necessário, garante que a estrofe de importação do CoreDNS exista e reinicia o serviço brew `coredns`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Descoberta](/pt-BR/gateway/discovery)
