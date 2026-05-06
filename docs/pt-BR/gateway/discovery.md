---
read_when:
    - Implementando ou alterando a descoberta/anúncio do Bonjour
    - Ajustando modos de conexão remota (direta vs SSH)
    - Projetando a descoberta de Node + pareamento para Nodes remotos
summary: Descoberta e transportes de Node (Bonjour, Tailscale, SSH) para encontrar o Gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-05-06T05:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw tem dois problemas distintos que parecem semelhantes à primeira vista:

1. **Controle remoto do operador**: o app da barra de menus do macOS controlando um Gateway em execução em outro lugar.
2. **Pareamento de Node**: iOS/Android (e Nodes futuros) encontrando um Gateway e pareando com segurança.

O objetivo do design é manter toda descoberta/anúncio de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (app para Mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de Gateway de longa duração que é dono do estado (sessões, pareamento, registro de Nodes) e executa canais. A maioria das configurações usa um por host; configurações isoladas com múltiplos Gateways são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado à LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` por SSH.
- **Ponte TCP legada (removida)**: transporte de Node mais antigo (consulte
  [Protocolo da ponte](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta e não faz mais parte das builds atuais.

Detalhes do protocolo:

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Protocolo da ponte (legado)](/pt-BR/gateway/bridge-protocol)

## Por que mantemos direto e SSH

- **WS direto** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de pareamento + ACLs pertencentes ao Gateway
  - não exige acesso ao shell; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo entre redes não relacionadas)
  - resiste a problemas de multicast/mDNS
  - não exige novas portas de entrada além de SSH

## Entradas de descoberta (como os clientes descobrem onde está o Gateway)

### 1) Descoberta Bonjour / DNS-SD

Bonjour multicast é de melhor esforço e não atravessa redes. OpenClaw também pode navegar pelo
mesmo beacon de Gateway por meio de um domínio DNS-SD de área ampla configurado, então a descoberta pode cobrir:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção-alvo:

- O **Gateway** anuncia seu endpoint WS via Bonjour quando o Plugin integrado
  `bonjour` está habilitado. O Plugin inicia automaticamente em hosts macOS e é
  opcional em outros lugares.
- Os clientes navegam e mostram uma lista "escolha um Gateway", depois armazenam o endpoint escolhido.

Solução de problemas e detalhes do beacon: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (beacon de transporte do Gateway)
- Chaves TXT (não secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome de exibição configurado pelo operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (somente quando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (somente quando TLS está habilitado e a impressão digital está disponível)
  - `canvasPort=<port>` (porta do host de canvas; atualmente a mesma que `gatewayPort` quando o host de canvas está habilitado)
  - `tailnetDns=<magicdns>` (dica opcional; detectada automaticamente quando Tailscale está disponível)
  - `sshPort=<port>` (somente modo completo mDNS; DNS-SD de área ampla pode omiti-la; nesse caso, os padrões de SSH permanecem em `22`)
  - `cliPath=<path>` (somente modo completo mDNS; DNS-SD de área ampla ainda a escreve como uma dica de instalação remota)

Observações de segurança:

- Registros TXT Bonjour/mDNS **não são autenticados**. Clientes devem tratar valores TXT apenas como dicas de UX.
- Roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem exigir uma confirmação explícita de "confiar nesta impressão digital" antes de armazenar um pin pela primeira vez (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Habilitar/desabilitar/sobrescrever:

- `openclaw plugins enable bonjour` habilita anúncio multicast na LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` desabilita anúncios.
- Quando o Plugin Bonjour está habilitado e `OPENCLAW_DISABLE_BONJOUR` não está definido,
  Bonjour anuncia em hosts normais e se desabilita automaticamente dentro de contêineres detectados.
  A inicialização do Gateway no macOS com configuração vazia habilita o Plugin automaticamente; implantações em Linux,
  Windows e conteinerizadas precisam de habilitação explícita.
  Use `0` somente em host, macvlan ou outra rede compatível com mDNS; use `1` para
  forçar a desativação.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada quando `sshPort` é emitido.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado.

### 2) Tailnet (entre redes)

Para configurações no estilo Londres/Viena, Bonjour não ajuda. O alvo "direto" recomendado é:

- nome Tailscale MagicDNS (preferencial) ou um IP estável de tailnet.

Se o Gateway conseguir detectar que está em execução sob Tailscale, ele publica `tailnetDns` como uma dica opcional para clientes (incluindo beacons de área ampla).

O app macOS agora prefere nomes MagicDNS em vez de IPs Tailscale brutos para descoberta de Gateway. Isso melhora a confiabilidade quando IPs de tailnet mudam (por exemplo, após reinicializações de Node ou reatribuição de CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para pareamento de Node móvel, dicas de descoberta não flexibilizam a segurança de transporte em rotas tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro de conexão inicial em tailnet/público (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não permissão para usar `ws://` remoto em texto claro.
- Conexão direta `ws://` em LAN privada continua sendo compatível.
- Se você quiser o caminho Tailscale mais simples para Nodes móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Alvo manual / SSH

Quando não há rota direta (ou o direto está desabilitado), os clientes sempre podem se conectar via SSH encaminhando a porta do Gateway em loopback.

Consulte [Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e alcançável, use-o.
2. Caso contrário, se a descoberta encontrar um Gateway em `local.` ou no domínio de área ampla configurado, ofereça uma escolha de um toque "Usar este Gateway" e salve-o como o endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente direto.
   Para Nodes móveis em rotas tailnet/públicas, direto significa um endpoint seguro, não `ws://` remoto em texto claro.
4. Caso contrário, use SSH como fallback.

## Pareamento + autenticação (transporte direto)

O Gateway é a fonte da verdade para admissão de Node/cliente.

- Solicitações de pareamento são criadas/aprovadas/rejeitadas no Gateway (consulte [Pareamento do Gateway](/pt-BR/gateway/pairing)).
- O Gateway aplica:
  - autenticação (token / par de chaves)
  - escopos/ACLs (o Gateway não é um proxy bruto para todos os métodos)
  - limites de taxa

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, controla decisões de pareamento e hospeda o endpoint WS.
- **App macOS**: ajuda você a escolher um Gateway, mostra prompts de pareamento e usa SSH apenas como fallback.
- **Nodes iOS/Android**: navegam Bonjour por conveniência e se conectam ao Gateway WS pareado.

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta Bonjour](/pt-BR/gateway/bonjour)
