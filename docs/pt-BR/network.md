---
read_when:
    - Você precisa da visão geral da arquitetura de rede e da segurança
    - Você está depurando o acesso local em comparação com o acesso pela tailnet ou o emparelhamento
    - Você quer a lista canônica de documentos sobre redes
summary: 'Hub de rede: interfaces do Gateway, pareamento, descoberta e segurança'
title: Rede
x-i18n:
    generated_at: "2026-07-12T00:06:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Este hub reúne links para a documentação principal sobre como o OpenClaw conecta, emparelha e protege
dispositivos no localhost, na LAN e na tailnet.

## Modelo principal

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração responsável pelas conexões dos canais e pelo plano de controle WebSocket.

- **Local loopback primeiro**: o WS do Gateway usa `ws://127.0.0.1:18789` por padrão.
  Vinculações fora do local loopback se recusam a iniciar sem um caminho válido de autenticação do Gateway:
  autenticação por token/senha de segredo compartilhado ou uma implantação
  `trusted-proxy` fora do local loopback configurada corretamente.
- Recomenda-se **um Gateway por host**. Para obter isolamento, execute vários gateways com perfis e portas isolados ([Vários Gateways](/pt-BR/gateway/multiple-gateways)).
- O **host do Canvas** é servido na mesma porta do Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) e protegido pela autenticação do Gateway quando vinculado além do local loopback.
- O **acesso remoto** normalmente é feito por um túnel SSH ou uma VPN Tailscale ([Acesso remoto](/pt-BR/gateway/remote)).

Referências principais:

- [Arquitetura do Gateway](/pt-BR/concepts/architecture)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Guia operacional do Gateway](/pt-BR/gateway)
- [Superfícies web e modos de vinculação](/pt-BR/web)

## Emparelhamento e identidade

- [Visão geral do emparelhamento (MD + nós)](/pt-BR/channels/pairing)
- [Emparelhamento de nós gerenciado pelo Gateway](/pt-BR/gateway/pairing)
- [CLI de dispositivos (emparelhamento + rotação de token)](/pt-BR/cli/devices)
- [CLI de emparelhamento (aprovações de MD)](/pt-BR/cli/pairing)

Confiança local:

- Conexões diretas pelo local loopback (sem cabeçalhos encaminhados/de proxy) podem ser
  aprovadas automaticamente para emparelhamento, mantendo uma experiência fluida no mesmo host.
- O OpenClaw também tem um caminho restrito de autoconexão local ao backend/contêiner para
  fluxos confiáveis de auxiliares com segredo compartilhado.
- Clientes da tailnet e da LAN, incluindo vinculações à tailnet no mesmo host, ainda exigem
  aprovação explícita de emparelhamento.

## Descoberta e transportes

- [Descoberta e transportes](/pt-BR/gateway/discovery)
- [Bonjour / mDNS](/pt-BR/gateway/bonjour)
- [Acesso remoto (SSH)](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)

## Nós e transportes

- [Visão geral dos nós](/pt-BR/nodes)
- [Protocolo de ponte (nós legados, histórico)](/pt-BR/gateway/bridge-protocol)
- [Guia operacional de nós: iOS](/pt-BR/platforms/ios)
- [Guia operacional de nós: Android](/pt-BR/platforms/android)

## Segurança

- [Visão geral da segurança](/pt-BR/gateway/security)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration)
- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Doctor](/pt-BR/gateway/doctor)

## Relacionados

- [Guia operacional do Gateway](/pt-BR/gateway)
- [Acesso remoto](/pt-BR/gateway/remote)
