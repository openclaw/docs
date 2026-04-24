---
read_when:
    - Você precisa da visão geral da arquitetura de rede + segurança
    - Você está depurando acesso local vs tailnet ou pairing
    - Você quer a lista canônica da documentação de rede
summary: 'Hub de rede: superfícies do gateway, pairing, descoberta e segurança'
title: Rede
x-i18n:
    generated_at: "2026-04-24T05:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Hub de rede

Este hub reúne a documentação principal sobre como o OpenClaw conecta, faz pairing e protege
dispositivos em localhost, LAN e tailnet.

## Modelo principal

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração que é o proprietário das conexões de canal e do plano de controle WebSocket.

- **Loopback primeiro**: o WS do Gateway usa por padrão `ws://127.0.0.1:18789`.
  Binds fora de loopback exigem um caminho válido de autenticação do gateway: autenticação
  por token/senha com segredo compartilhado, ou uma implantação `trusted-proxy`
  fora de loopback corretamente configurada.
- **Um Gateway por host** é o recomendado. Para isolamento, execute vários gateways com perfis e portas isolados ([Múltiplos Gateways](/pt-BR/gateway/multiple-gateways)).
- **Canvas host** é servido na mesma porta do Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido pela autenticação do Gateway quando vinculado além de loopback.
- **Acesso remoto** normalmente é feito por túnel SSH ou VPN Tailscale ([Acesso remoto](/pt-BR/gateway/remote)).

Referências principais:

- [Arquitetura do Gateway](/pt-BR/concepts/architecture)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Runbook do Gateway](/pt-BR/gateway)
- [Superfícies web + modos de bind](/pt-BR/web)

## Pairing + identidade

- [Visão geral do pairing (DM + nodes)](/pt-BR/channels/pairing)
- [Pairing de nodes pertencentes ao Gateway](/pt-BR/gateway/pairing)
- [CLI de dispositivos (pairing + rotação de token)](/pt-BR/cli/devices)
- [CLI de pairing (aprovações de DM)](/pt-BR/cli/pairing)

Confiança local:

- Conexões diretas por loopback local podem ser autoaprovadas para pairing a fim de manter
  a UX no mesmo host fluida.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Clientes de tailnet e LAN, incluindo binds de tailnet no mesmo host, ainda exigem
  aprovação explícita de pairing.

## Descoberta + transportes

- [Descoberta e transportes](/pt-BR/gateway/discovery)
- [Bonjour / mDNS](/pt-BR/gateway/bonjour)
- [Acesso remoto (SSH)](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)

## Nodes + transportes

- [Visão geral de nodes](/pt-BR/nodes)
- [Protocolo Bridge (nodes legados, histórico)](/pt-BR/gateway/bridge-protocol)
- [Runbook de node: iOS](/pt-BR/platforms/ios)
- [Runbook de node: Android](/pt-BR/platforms/android)

## Segurança

- [Visão geral de segurança](/pt-BR/gateway/security)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration)
- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Doctor](/pt-BR/gateway/doctor)

## Relacionado

- [Modelo de rede do Gateway](/pt-BR/gateway/network-model)
- [Acesso remoto](/pt-BR/gateway/remote)
