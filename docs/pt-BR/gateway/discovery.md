---
read_when:
    - Implementando ou alterando descoberta/publicação via Bonjour
    - Ajustando modos de conexão remota (direta vs SSH)
    - Projetando descoberta de Node + pareamento para Nodes remotos
summary: Descoberta de Node e transportes (Bonjour, Tailscale, SSH) para encontrar o gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-04-26T11:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Descoberta e transportes

O OpenClaw tem dois problemas distintos que parecem semelhantes na superfície:

1. **Controle remoto do operador**: o app de barra de menus do macOS controlando um gateway em execução em outro lugar.
2. **Pareamento de Node**: iOS/Android (e futuros Nodes) encontrando um gateway e fazendo pareamento com segurança.

O objetivo do design é manter toda a descoberta/publicação de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (app de macOS, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de gateway de longa duração que controla o estado (sessões, pareamento, registro de Nodes) e executa canais. A maioria das configurações usa um por host; configurações isoladas com múltiplos gateways são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode fazer bind em LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` por SSH.
- **Bridge TCP legada (removida)**: transporte de Node mais antigo (veja
  [Protocolo de Bridge](/pt-BR/gateway/bridge-protocol)); não é mais publicado para
  descoberta e não faz mais parte das compilações atuais.

Detalhes do protocolo:

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Protocolo de Bridge (legado)](/pt-BR/gateway/bridge-protocol)

## Por que mantemos tanto “direto” quanto SSH

- **WS direto** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de pareamento + ACLs controlados pelo gateway
  - nenhum acesso shell é necessário; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo em redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não exige novas portas de entrada além do SSH

## Entradas de descoberta (como clientes aprendem onde está o gateway)

### 1) Descoberta via Bonjour / DNS-SD

Bonjour multicast é best-effort e não atravessa redes. O OpenClaw também pode navegar pelo
mesmo beacon de gateway por um domínio DNS-SD de área ampla configurado, de modo que a descoberta pode cobrir:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção-alvo:

- O **gateway** publica seu endpoint WS via Bonjour.
- Clientes navegam e mostram uma lista “escolha um gateway”, depois armazenam o endpoint escolhido.

Detalhes de solução de problemas e beacon: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do beacon do serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (beacon de transporte do gateway)
- Chaves TXT (não secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome amigável configurado pelo operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (somente quando TLS estiver ativado)
  - `gatewayTlsSha256=<sha256>` (somente quando TLS estiver ativado e a impressão digital estiver disponível)
  - `canvasPort=<port>` (porta do host canvas; atualmente a mesma que `gatewayPort` quando o host canvas está ativado)
  - `tailnetDns=<magicdns>` (dica opcional; detectado automaticamente quando Tailscale está disponível)
  - `sshPort=<port>` (somente no modo mDNS full; DNS-SD de área ampla pode omiti-lo, caso em que os padrões de SSH permanecem em `22`)
  - `cliPath=<path>` (somente no modo mDNS full; DNS-SD de área ampla ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Os clientes devem tratar valores TXT apenas como dicas de UX.
- O roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` publicado substitua um pin armazenado anteriormente.
- Nodes de iOS/Android devem exigir uma confirmação explícita de “confiar nesta impressão digital” antes de armazenar um pin de primeira vez (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Desativar/substituir:

- `OPENCLAW_DISABLE_BONJOUR=1` desativa a publicação.
- O padrão do Docker Compose é `OPENCLAW_DISABLE_BONJOUR=1` porque redes bridge
  geralmente não transportam multicast mDNS de forma confiável; use `0` apenas em host, macvlan
  ou outra rede compatível com mDNS.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH publicada quando `sshPort` é emitido.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho de CLI publicado.

### 2) Tailnet (entre redes)

Para configurações no estilo Londres/Viena, Bonjour não ajuda. O alvo “direto” recomendado é:

- nome MagicDNS do Tailscale (preferido) ou um IP estável da tailnet.

Se o gateway conseguir detectar que está sendo executado sob Tailscale, ele publica `tailnetDns` como dica opcional para clientes (incluindo beacons de área ampla).

O app de macOS agora prefere nomes MagicDNS a IPs brutos do Tailscale para descoberta de gateway. Isso melhora a confiabilidade quando IPs da tailnet mudam (por exemplo, após reinicializações do node ou reatribuição por CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para pareamento de Node móvel, dicas de descoberta não flexibilizam a segurança de transporte em rotas tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro de primeira conexão tailnet/pública (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não uma permissão para usar `ws://` remoto em texto simples.
- `ws://` de conexão direta em LAN privada continua compatível.
- Se você quiser o caminho mais simples do Tailscale para Nodes móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Alvo manual / SSH

Quando não há rota direta (ou a rota direta está desativada), clientes sempre podem se conectar por SSH encaminhando a porta de gateway loopback.

Veja [Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um gateway em `local.` ou no domínio de área ampla configurado, ofereça uma escolha de “Usar este gateway” com um toque e salve-a como endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente conexão direta.
   Para Nodes móveis em rotas tailnet/públicas, direto significa um endpoint seguro, não `ws://` remoto em texto simples.
4. Caso contrário, use SSH como fallback.

## Pareamento + auth (transporte direto)

O gateway é a fonte da verdade para admissão de node/cliente.

- Solicitações de pareamento são criadas/aprovadas/rejeitadas no gateway (veja [Pareamento do Gateway](/pt-BR/gateway/pairing)).
- O gateway aplica:
  - auth (token / par de chaves)
  - escopos/ACLs (o gateway não é um proxy bruto para todos os métodos)
  - limites de taxa

## Responsabilidades por componente

- **Gateway**: publica beacons de descoberta, controla decisões de pareamento e hospeda o endpoint WS.
- **App de macOS**: ajuda você a escolher um gateway, mostra prompts de pareamento e usa SSH apenas como fallback.
- **Nodes de iOS/Android**: navegam por Bonjour como conveniência e se conectam ao Gateway WS pareado.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta Bonjour](/pt-BR/gateway/bonjour)
