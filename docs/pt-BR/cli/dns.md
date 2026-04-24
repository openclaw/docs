---
read_when:
    - Você quer descoberta de longa distância (DNS-SD) via Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referência de CLI para `openclaw dns` (auxiliares de descoberta de longa distância)
title: DNS
x-i18n:
    generated_at: "2026-04-24T05:45:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Auxiliares de DNS para descoberta de longa distância (Tailscale + CoreDNS). Atualmente focado em macOS + CoreDNS do Homebrew.

Relacionado:

- Descoberta de Gateway: [Discovery](/pt-BR/gateway/discovery)
- Configuração de descoberta de longa distância: [Configuration](/pt-BR/gateway/configuration)

## Configuração

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planeje ou aplique a configuração do CoreDNS para descoberta DNS-SD unicast.

Opções:

- `--domain <domain>`: domínio de descoberta de longa distância (por exemplo `openclaw.internal`)
- `--apply`: instala ou atualiza a configuração do CoreDNS e reinicia o serviço (requer sudo; somente macOS)

O que ele mostra:

- domínio de descoberta resolvido
- caminho do arquivo de zona
- IPs atuais da tailnet
- configuração de descoberta recomendada para `openclaw.json`
- os valores de nameserver/domínio de DNS dividido do Tailscale a serem definidos

Observações:

- Sem `--apply`, o comando é apenas um auxiliar de planejamento e imprime a configuração recomendada.
- Se `--domain` for omitido, o OpenClaw usa `discovery.wideArea.domain` da configuração.
- `--apply` atualmente oferece suporte apenas a macOS e espera CoreDNS do Homebrew.
- `--apply` inicializa o arquivo de zona, se necessário, garante que a estrofe de import do CoreDNS exista e reinicia o serviço `coredns` do brew.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Discovery](/pt-BR/gateway/discovery)
