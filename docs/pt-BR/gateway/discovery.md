---
read_when:
    - Implementando ou alterando descoberta/publicação via Bonjour
    - Ajustando modos de conexão remota (direto vs SSH)
    - Projetando descoberta de Node + pairing para Nodes remotos
summary: Descoberta de Node e transportes (Bonjour, Tailscale, SSH) para encontrar o gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-04-24T05:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Descoberta e transportes

O OpenClaw tem dois problemas distintos que parecem semelhantes à primeira vista:

1. **Controle remoto do operador**: o app da barra de menu no macOS controlando um gateway em execução em outro lugar.
2. **Pairing de Node**: iOS/Android (e futuros Nodes) encontrando um gateway e fazendo pairing com segurança.

O objetivo do design é manter toda a descoberta/publicação de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (app Mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de gateway de longa duração que controla o estado (sessões, pairing, registro de Node) e executa canais. A maioria das configurações usa um por host; configurações isoladas com vários gateways são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode fazer bind em LAN/tailnet via `gateway.bind`.
- **Direct WS transport**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **SSH transport (fallback)**: controle remoto encaminhando `127.0.0.1:18789` via SSH.
- **Legacy TCP bridge (removed)**: transporte antigo de Node (consulte
  [Bridge protocol](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta e não faz mais parte das compilações atuais.

Detalhes do protocolo:

- [Gateway protocol](/pt-BR/gateway/protocol)
- [Bridge protocol (legacy)](/pt-BR/gateway/bridge-protocol)

## Por que mantemos tanto "direct" quanto SSH

- **Direct WS** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de pairing + ACLs controlados pelo gateway
  - nenhum acesso shell necessário; a superfície do protocolo pode permanecer enxuta e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo em redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não exige novas portas de entrada além do SSH

## Entradas de descoberta (como os clientes descobrem onde está o gateway)

### 1) Descoberta via Bonjour / DNS-SD

O Bonjour multicast é best-effort e não cruza redes. O OpenClaw também pode navegar pelo
mesmo beacon do gateway por meio de um domínio DNS-SD de longa distância configurado, então a descoberta pode cobrir:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção do destino:

- O **gateway** anuncia seu endpoint WS via Bonjour.
- Os clientes navegam e mostram uma lista “escolha um gateway”, depois armazenam o endpoint escolhido.

Solução de problemas e detalhes do beacon: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (beacon de transporte do gateway)
- Chaves TXT (não secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome amigável configurado pelo operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (somente quando TLS está ativado)
  - `gatewayTlsSha256=<sha256>` (somente quando TLS está ativado e a fingerprint está disponível)
  - `canvasPort=<port>` (porta do host canvas; atualmente é a mesma que `gatewayPort` quando o host canvas está ativado)
  - `tailnetDns=<magicdns>` (dica opcional; detectada automaticamente quando Tailscale está disponível)
  - `sshPort=<port>` (somente no modo mDNS full; DNS-SD de longa distância pode omiti-la, caso em que os padrões de SSH continuam em `22`)
  - `cliPath=<path>` (somente no modo mDNS full; DNS-SD de longa distância ainda a grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Os clientes devem tratar valores TXT apenas como dicas de UX.
- O roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem exigir uma confirmação explícita de “confiar nesta fingerprint” antes de armazenar um primeiro pin (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Desativar/substituir:

- `OPENCLAW_DISABLE_BONJOUR=1` desativa o anúncio.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada quando `sshPort` é emitido.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho anunciado da CLI.

### 2) Tailnet (entre redes)

Para configurações no estilo Londres/Viena, o Bonjour não ajuda. O destino “direct” recomendado é:

- Nome MagicDNS do Tailscale (preferido) ou um IP estável da tailnet.

Se o gateway conseguir detectar que está sendo executado sob Tailscale, ele publica `tailnetDns` como dica opcional para clientes (incluindo beacons de longa distância).

Agora o app macOS prefere nomes MagicDNS em vez de IPs brutos do Tailscale para descoberta de gateway. Isso melhora a confiabilidade quando IPs da tailnet mudam (por exemplo após reinicializações de Node ou reatribuição de CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para pairing de Node móvel, dicas de descoberta não flexibilizam a segurança de transporte em rotas tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro para a primeira conexão tailnet/pública (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não permissão para usar `ws://` remoto em texto simples.
- `ws://` de conexão direta privada em LAN continua compatível.
- Se você quiser o caminho Tailscale mais simples para Nodes móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam ambos para o mesmo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Quando não houver rota direta (ou direct estiver desativado), os clientes sempre podem se conectar via SSH encaminhando a porta loopback do gateway.

Consulte [Remote access](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um gateway em `local.` ou no domínio de longa distância configurado, ofereça uma opção de um toque “Usar este gateway” e salve-a como endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente direct.
   Para Nodes móveis em rotas tailnet/públicas, direct significa um endpoint seguro, não `ws://` remoto em texto simples.
4. Caso contrário, use SSH como fallback.

## Pairing + autenticação (transporte direto)

O gateway é a fonte da verdade para admissão de Node/cliente.

- Solicitações de pairing são criadas/aprovadas/rejeitadas no gateway (consulte [Gateway pairing](/pt-BR/gateway/pairing)).
- O gateway aplica:
  - autenticação (token / par de chaves)
  - escopos/ACLs (o gateway não é um proxy bruto para todos os métodos)
  - limites de taxa

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, controla decisões de pairing e hospeda o endpoint WS.
- **app macOS**: ajuda você a escolher um gateway, mostra prompts de pairing e usa SSH apenas como fallback.
- **Nodes iOS/Android**: navegam por Bonjour como conveniência e se conectam ao Gateway WS pareado.

## Relacionado

- [Remote access](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Bonjour discovery](/pt-BR/gateway/bonjour)
