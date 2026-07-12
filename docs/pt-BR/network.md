---
read_when:
    - Você precisa da visão geral da arquitetura de rede e da segurança
    - Você está depurando o acesso local em comparação com o acesso via tailnet ou o pareamento
    - Você quer a lista canônica da documentação de rede
summary: 'Hub de rede: interfaces do Gateway, pareamento, descoberta e segurança'
title: Rede
x-i18n:
    generated_at: "2026-07-12T15:19:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Este hub reúne links para a documentação principal sobre como o OpenClaw conecta, emparelha e protege
dispositivos no localhost, na LAN e na tailnet.

## Modelo principal

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo de longa duração que gerencia as conexões de canais e o plano de controle WebSocket.

- **Loopback primeiro**: o WS do Gateway usa `ws://127.0.0.1:18789` por padrão.
  Vínculos que não sejam de loopback se recusam a iniciar sem um caminho válido de autenticação do gateway:
  autenticação por token/senha de segredo compartilhado ou uma implantação
  `trusted-proxy` que não seja de loopback e esteja configurada corretamente.
- **Recomenda-se um Gateway por host**. Para isolamento, execute vários gateways com perfis e portas isolados ([Vários Gateways](/pt-BR/gateway/multiple-gateways)).
- **O host do Canvas** é servido na mesma porta que o Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido pela autenticação do Gateway quando vinculado além do loopback.
- **O acesso remoto** normalmente é feito por um túnel SSH ou pela VPN Tailscale ([Acesso remoto](/pt-BR/gateway/remote)).

Principais referências:

- [Arquitetura do Gateway](/pt-BR/concepts/architecture)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Guia operacional do Gateway](/pt-BR/gateway)
- [Superfícies web + modos de vínculo](/pt-BR/web)

## Emparelhamento + identidade

- [Visão geral do emparelhamento (MD + nodes)](/pt-BR/channels/pairing)
- [Emparelhamento de nodes gerenciado pelo Gateway](/pt-BR/gateway/pairing)
- [CLI de dispositivos (emparelhamento + rotação de token)](/pt-BR/cli/devices)
- [CLI de emparelhamento (aprovações de MD)](/pt-BR/cli/pairing)

Confiança local:

- Conexões locais diretas por loopback (sem cabeçalhos encaminhados/de proxy) podem ser
  aprovadas automaticamente para emparelhamento, mantendo fluida a experiência no mesmo host.
- O OpenClaw também tem um caminho restrito de autoconexão local ao backend/contêiner para
  fluxos confiáveis de auxiliares com segredo compartilhado.
- Clientes da tailnet e da LAN, incluindo vínculos de tailnet no mesmo host, ainda exigem
  aprovação explícita de emparelhamento.

## Descoberta + transportes

- [Descoberta e transportes](/pt-BR/gateway/discovery)
- [Bonjour / mDNS](/pt-BR/gateway/bonjour)
- [Acesso remoto (SSH)](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)

## Nodes + transportes

- [Visão geral dos nodes](/pt-BR/nodes)
- [Protocolo de ponte (nodes legados, histórico)](/pt-BR/gateway/bridge-protocol)
- [Guia operacional de node: iOS](/pt-BR/platforms/ios)
- [Guia operacional de node: Android](/pt-BR/platforms/android)

## Segurança

- [Visão geral de segurança](/pt-BR/gateway/security)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration)
- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Doctor](/pt-BR/gateway/doctor)

## Relacionado

- [Guia operacional do Gateway](/pt-BR/gateway)
- [Acesso remoto](/pt-BR/gateway/remote)
