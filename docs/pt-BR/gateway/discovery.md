---
read_when:
    - Implementando ou alterando a descoberta/anúncio Bonjour
    - Ajustando modos de conexão remota (direta versus SSH)
    - Projetando descoberta de nós + pareamento para nós remotos
summary: Descoberta de Node e transportes (Bonjour, Tailscale, SSH) para localizar o Gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-05-03T21:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Descoberta e transportes

OpenClaw tem dois problemas distintos que parecem semelhantes na superfície:

1. **Controle remoto do operador**: o aplicativo da barra de menus do macOS controlando um Gateway em execução em outro lugar.
2. **Pareamento de Node**: iOS/Android (e Nodes futuros) encontrando um Gateway e pareando com segurança.

O objetivo do design é manter toda a descoberta/anúncio de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (aplicativo Mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de Gateway de longa duração que possui o estado (sessões, pareamento, registro de Nodes) e executa canais. A maioria das configurações usa um por host; configurações isoladas com múltiplos Gateways são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado à LAN/tailnet via `gateway.bind`.
- **Transporte WS direto**: um endpoint Gateway WS exposto à LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` por SSH.
- **Ponte TCP legada (removida)**: transporte de Node mais antigo (consulte
  [Protocolo da ponte](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta e não faz mais parte das compilações atuais.

Detalhes de protocolo:

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Protocolo da ponte (legado)](/pt-BR/gateway/bridge-protocol)

## Por que mantemos tanto "direto" quanto SSH

- **WS direto** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de pareamento + ACLs pertencentes ao Gateway
  - sem necessidade de acesso shell; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo entre redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não exige novas portas de entrada além de SSH

## Entradas de descoberta (como os clientes descobrem onde está o Gateway)

### 1) Descoberta Bonjour / DNS-SD

Bonjour multicast é de melhor esforço e não atravessa redes. OpenClaw também pode navegar pelo
mesmo beacon de Gateway via um domínio DNS-SD de área ampla configurado, para que a descoberta cubra:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção alvo:

- O **Gateway** anuncia seu endpoint WS via Bonjour quando o Plugin `bonjour`
  incluído está habilitado. O Plugin inicia automaticamente em hosts macOS e é
  opcional em outros lugares.
- Os clientes navegam e mostram uma lista “escolha um Gateway”, depois armazenam o endpoint escolhido.

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
  - `sshPort=<port>` (somente modo completo mDNS; DNS-SD de área ampla pode omiti-la, caso em que os padrões de SSH permanecem em `22`)
  - `cliPath=<path>` (somente modo completo mDNS; DNS-SD de área ampla ainda a escreve como uma dica de instalação remota)

Notas de segurança:

- Registros TXT Bonjour/mDNS são **não autenticados**. Os clientes devem tratar valores TXT apenas como dicas de UX.
- O roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado sobrescreva um pin armazenado anteriormente.
- Nodes iOS/Android devem exigir uma confirmação explícita “confiar nesta impressão digital” antes de armazenar um pin pela primeira vez (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Habilitar/desabilitar/substituir:

- `openclaw plugins enable bonjour` habilita o anúncio multicast na LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` desabilita o anúncio.
- Quando o Plugin Bonjour está habilitado e `OPENCLAW_DISABLE_BONJOUR` não está definido,
  Bonjour anuncia em hosts normais e se desabilita automaticamente dentro de contêineres detectados.
  A inicialização do Gateway no macOS com configuração vazia habilita o Plugin automaticamente; implantações em Linux,
  Windows e contêineres precisam de habilitação explícita.
  Use `0` somente em host, macvlan ou outra rede compatível com mDNS; use `1` para
  forçar a desabilitação.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada quando `sshPort` é emitida.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado.

### 2) Tailnet (entre redes)

Para configurações no estilo Londres/Viena, Bonjour não ajudará. O alvo “direto” recomendado é:

- nome Tailscale MagicDNS (preferido) ou um IP tailnet estável.

Se o Gateway conseguir detectar que está sendo executado sob Tailscale, ele publicará `tailnetDns` como uma dica opcional para clientes (incluindo beacons de área ampla).

O aplicativo macOS agora prefere nomes MagicDNS em vez de IPs Tailscale brutos para descoberta de Gateway. Isso melhora a confiabilidade quando IPs de tailnet mudam (por exemplo, após reinicializações de Node ou reatribuição de CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para pareamento de Node móvel, dicas de descoberta não relaxam a segurança de transporte em rotas tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro de conexão tailnet/pública pela primeira vez (`wss://` ou Tailscale Serve/Funnel).
- Um IP tailnet bruto descoberto é uma dica de roteamento, não permissão para usar `ws://` remoto em texto claro.
- Conexão direta privada em LAN com `ws://` continua compatível.
- Se você quiser o caminho Tailscale mais simples para Nodes móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Alvo manual / SSH

Quando não há rota direta (ou a direta está desabilitada), os clientes sempre podem se conectar via SSH encaminhando a porta de loopback do Gateway.

Consulte [Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um Gateway em `local.` ou no domínio de área ampla configurado, ofereça uma escolha “Usar este Gateway” com um toque e salve-a como o endpoint direto.
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

- **Gateway**: anuncia beacons de descoberta, possui decisões de pareamento e hospeda o endpoint WS.
- **Aplicativo macOS**: ajuda você a escolher um Gateway, mostra prompts de pareamento e usa SSH apenas como fallback.
- **Nodes iOS/Android**: navegam pelo Bonjour por conveniência e se conectam ao Gateway WS pareado.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta Bonjour](/pt-BR/gateway/bonjour)
