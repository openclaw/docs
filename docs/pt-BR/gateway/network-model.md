---
read_when:
    - Você quer uma visão concisa do modelo de rede do Gateway
summary: Como o Gateway, os nodes e o host do canvas se conectam.
title: Modelo de rede
x-i18n:
    generated_at: "2026-04-24T05:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Este conteúdo foi incorporado em [Network](/pt-BR/network#core-model). Consulte essa página para ver o guia atual.

A maioria das operações passa pelo Gateway (`openclaw gateway`), um único processo
de longa execução que controla conexões de canal e o plano de controle WebSocket.

## Regras principais

- Recomenda-se um Gateway por host. É o único processo autorizado a controlar a sessão do WhatsApp Web. Para bots de resgate ou isolamento estrito, execute vários gateways com perfis e portas isolados. Consulte [Vários gateways](/pt-BR/gateway/multiple-gateways).
- Loopback primeiro: o WS do Gateway usa por padrão `ws://127.0.0.1:18789`. O assistente cria autenticação por segredo compartilhado por padrão e normalmente gera um token, mesmo para loopback. Para acesso sem loopback, use um caminho válido de autenticação do gateway: autenticação por token/senha com segredo compartilhado, ou uma implantação `trusted-proxy` sem loopback corretamente configurada. Configurações com tailnet/mobile normalmente funcionam melhor via Tailscale Serve ou outro endpoint `wss://`, em vez de `ws://` bruto do tailnet.
- Os nodes se conectam ao WS do Gateway por LAN, tailnet ou SSH conforme necessário. A bridge TCP legada foi removida.
- O host do canvas é servido pelo servidor HTTP do Gateway na **mesma porta** do Gateway (padrão `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Quando `gateway.auth` está configurado e o Gateway faz bind além do loopback, essas rotas são protegidas pela autenticação do Gateway. Clientes node usam URLs de capacidade com escopo de node vinculadas à sessão WS ativa. Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) (`canvasHost`, `gateway`).
- O uso remoto normalmente é por tunnel SSH ou VPN tailnet. Consulte [Acesso remoto](/pt-BR/gateway/remote) e [Discovery](/pt-BR/gateway/discovery).

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Autenticação trusted-proxy](/pt-BR/gateway/trusted-proxy-auth)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
