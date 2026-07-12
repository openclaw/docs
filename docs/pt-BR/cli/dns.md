---
read_when:
    - Você quer descoberta em rede de longa distância (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referência da CLI para `openclaw dns` (auxiliares de descoberta em redes de longa distância)
title: DNS
x-i18n:
    generated_at: "2026-07-11T23:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Utilitários de DNS para descoberta em redes de longa distância (Tailscale + CoreDNS). Atualmente, apenas macOS + CoreDNS via Homebrew.

Relacionado:

- Descoberta do Gateway: [Descoberta](/pt-BR/gateway/discovery)
- Configuração de descoberta em redes de longa distância: [Configuração](/pt-BR/gateway/configuration)

## `dns setup`

Planeje ou aplique a configuração do CoreDNS para descoberta DNS-SD unicast.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Opção               | Efeito                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Domínio de descoberta em redes de longa distância (por exemplo, `openclaw.internal`).                       |
| `--apply`           | Instala/atualiza a configuração do CoreDNS e (re)inicia o serviço. Requer sudo; disponível apenas no macOS. |

Sem `--domain`, o OpenClaw usa `discovery.wideArea.domain` da configuração.

Sem `--apply`, o comando apenas exibe:

- Domínio de descoberta resolvido e caminho do arquivo de zona
- IPs atuais da tailnet
- Configuração de descoberta recomendada para `openclaw.json`
- Valores do servidor de nomes e do domínio do Split DNS do Tailscale a serem definidos no console de administração do Tailscale

Com `--apply` (apenas no macOS; requer CoreDNS via Homebrew):

- Inicializa o arquivo de zona, caso não exista
- Adiciona a seção de importação do CoreDNS, caso não exista
- Reinicia o serviço `coredns` do brew

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Descoberta](/pt-BR/gateway/discovery)
