---
read_when:
    - Você precisa da visão geral da arquitetura de rede + segurança
    - Você está depurando o acesso local versus via tailnet ou o pareamento
    - Você quer a lista canônica da documentação de rede
summary: 'Hub de rede: superfícies do Gateway, pareamento, descoberta e segurança'
title: Rede
x-i18n:
    generated_at: "2026-05-06T06:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

Este hub vincula a documentação central sobre como o OpenClaw conecta, pareia e protege
dispositivos entre localhost, LAN e tailnet.

## Modelo central

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração que controla as conexões de canal e o plano de controle WebSocket.

- **Loopback primeiro**: o WS do Gateway usa `ws://127.0.0.1:18789` por padrão.
  Associações sem loopback exigem um caminho válido de autenticação do gateway: autenticação
  por token/senha de segredo compartilhado ou uma implantação `trusted-proxy`
  sem loopback configurada corretamente.
- **Um Gateway por host** é recomendado. Para isolamento, execute múltiplos gateways com perfis e portas isolados ([Múltiplos Gateways](/pt-BR/gateway/multiple-gateways)).
- **Host do Canvas** é servido na mesma porta que o Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido pela autenticação do Gateway quando associado além do loopback.
- **Acesso remoto** normalmente é feito por túnel SSH ou VPN Tailscale ([Acesso remoto](/pt-BR/gateway/remote)).

Referências principais:

- [Arquitetura do Gateway](/pt-BR/concepts/architecture)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Runbook do Gateway](/pt-BR/gateway)
- [Superfícies web + modos de associação](/pt-BR/web)

## Pareamento + identidade

- [Visão geral de pareamento (DM + nós)](/pt-BR/channels/pairing)
- [Pareamento de nós controlado pelo Gateway](/pt-BR/gateway/pairing)
- [CLI de dispositivos (pareamento + rotação de token)](/pt-BR/cli/devices)
- [CLI de pareamento (aprovações por DM)](/pt-BR/cli/pairing)

Confiança local:

- Conexões diretas por local loopback podem ser aprovadas automaticamente para pareamento, mantendo
  a UX no mesmo host fluida.
- O OpenClaw também tem um caminho restrito de autoconexão local ao backend/contêiner para
  fluxos auxiliares confiáveis de segredo compartilhado.
- Clientes em tailnet e LAN, incluindo associações de tailnet no mesmo host, ainda exigem
  aprovação explícita de pareamento.

## Descoberta + transportes

- [Descoberta e transportes](/pt-BR/gateway/discovery)
- [Bonjour / mDNS](/pt-BR/gateway/bonjour)
- [Acesso remoto (SSH)](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)

## Nós + transportes

- [Visão geral de nós](/pt-BR/nodes)
- [Protocolo de ponte (nós legados, histórico)](/pt-BR/gateway/bridge-protocol)
- [Runbook de nó: iOS](/pt-BR/platforms/ios)
- [Runbook de nó: Android](/pt-BR/platforms/android)

## Segurança

- [Visão geral de segurança](/pt-BR/gateway/security)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration)
- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Doctor](/pt-BR/gateway/doctor)

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Acesso remoto](/pt-BR/gateway/remote)
