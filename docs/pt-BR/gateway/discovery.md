---
read_when:
    - Implementando ou alterando a descoberta/anúncio do Bonjour
    - Ajustando modos de conexão remota (direta vs SSH)
    - Projetando a descoberta de Node + pareamento para Nodes remotos
summary: Descoberta de Node e transportes (Bonjour, Tailscale, SSH) para encontrar o Gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-04-30T09:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Descoberta e transportes

OpenClaw tem dois problemas distintos que parecem semelhantes na superfície:

1. **Controle remoto do operador**: o app da barra de menus do macOS controlando um Gateway em execução em outro lugar.
2. **Pareamento de Node**: iOS/Android (e futuros nodes) encontrando um Gateway e pareando com segurança.

O objetivo do design é manter toda a descoberta/anúncio de rede no **Node Gateway** (`openclaw gateway`) e manter os clientes (app para Mac, iOS) como consumidores.

## Termos

- **Gateway**: um único processo de Gateway de longa duração que detém o estado (sessões, pareamento, registro de nodes) e executa canais. A maioria das configurações usa um por host; configurações multi-Gateway isoladas são possíveis.
- **Gateway WS (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789` por padrão; pode ser vinculado à LAN/tailnet via `gateway.bind`.
- **Transporte Direct WS**: um endpoint Gateway WS voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto encaminhando `127.0.0.1:18789` por SSH.
- **Ponte TCP legada (removida)**: transporte de node mais antigo (veja
  [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta e não faz mais parte das builds atuais.

Detalhes do protocolo:

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Protocolo de ponte (legado)](/pt-BR/gateway/bridge-protocol)

## Por que mantemos "direct" e SSH

- **Direct WS** é a melhor UX na mesma rede e dentro de uma tailnet:
  - descoberta automática na LAN via Bonjour
  - tokens de pareamento + ACLs pertencentes ao Gateway
  - sem necessidade de acesso ao shell; a superfície do protocolo pode permanecer restrita e auditável
- **SSH** continua sendo o fallback universal:
  - funciona em qualquer lugar onde você tenha acesso SSH (mesmo entre redes não relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - não requer novas portas de entrada além de SSH

## Entradas de descoberta (como os clientes descobrem onde está o Gateway)

### 1) Descoberta Bonjour / DNS-SD

Bonjour multicast é de melhor esforço e não cruza redes. OpenClaw também pode navegar pelo
mesmo sinalizador de Gateway por meio de um domínio DNS-SD de longa distância configurado, então a descoberta pode cobrir:

- `local.` na mesma LAN
- um domínio DNS-SD unicast configurado para descoberta entre redes

Direção-alvo:

- O **Gateway** anuncia seu endpoint WS via Bonjour.
- Os clientes navegam e mostram uma lista “escolha um Gateway”, depois armazenam o endpoint escolhido.

Solução de problemas e detalhes do sinalizador: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do sinalizador de serviço

- Tipos de serviço:
  - `_openclaw-gw._tcp` (sinalizador de transporte do Gateway)
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
  - `sshPort=<port>` (somente modo mDNS completo; DNS-SD de longa distância pode omiti-la, nesse caso os padrões de SSH permanecem em `22`)
  - `cliPath=<path>` (somente modo mDNS completo; DNS-SD de longa distância ainda a escreve como uma dica de instalação remota)

Notas de segurança:

- Registros TXT Bonjour/mDNS **não são autenticados**. Os clientes devem tratar valores TXT apenas como dicas de UX.
- O roteamento (host/porta) deve preferir o **endpoint de serviço resolvido** (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos via TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma fixação armazenada anteriormente.
- Nodes iOS/Android devem exigir uma confirmação explícita de “confiar nesta impressão digital” antes de armazenar uma fixação pela primeira vez (verificação fora de banda) sempre que a rota escolhida for segura/baseada em TLS.

Desabilitar/substituir:

- `OPENCLAW_DISABLE_BONJOUR=1` desabilita o anúncio.
- Quando `OPENCLAW_DISABLE_BONJOUR` não está definido, Bonjour anuncia em hosts normais
  e se desabilita automaticamente dentro de contêineres detectados. Use `0` somente no host, macvlan,
  ou outra rede compatível com mDNS; use `1` para forçar a desabilitação.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada quando `sshPort` é emitida.
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho anunciado da CLI.

### 2) Tailnet (entre redes)

Para configurações no estilo Londres/Viena, Bonjour não ajuda. O alvo “direct” recomendado é:

- nome MagicDNS do Tailscale (preferido) ou um IP de tailnet estável.

Se o Gateway puder detectar que está em execução sob Tailscale, ele publica `tailnetDns` como uma dica opcional para clientes (incluindo sinalizadores de longa distância).

O app para macOS agora prefere nomes MagicDNS a IPs Tailscale brutos para descoberta de Gateway. Isso melhora a confiabilidade quando IPs de tailnet mudam (por exemplo, após reinicializações de node ou reatribuição de CGNAT), porque nomes MagicDNS resolvem automaticamente para o IP atual.

Para pareamento de node móvel, dicas de descoberta não relaxam a segurança de transporte em rotas de tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro de primeira conexão em tailnet/público (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não permissão para usar `ws://` remoto em texto puro.
- Conexão direta privada via LAN com `ws://` continua compatível.
- Se você quer o caminho Tailscale mais simples para nodes móveis, use Tailscale Serve para que a descoberta e o código de configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Alvo manual / SSH

Quando não há rota direta (ou direct está desabilitado), os clientes sempre podem se conectar via SSH encaminhando a porta do Gateway em loopback.

Veja [Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

Comportamento recomendado do cliente:

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um Gateway em `local.` ou no domínio de longa distância configurado, ofereça uma escolha “Usar este Gateway” com um toque e salve-a como o endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente direct.
   Para nodes móveis em rotas de tailnet/públicas, direct significa um endpoint seguro, não `ws://` remoto em texto puro.
4. Caso contrário, use SSH como fallback.

## Pareamento + autenticação (transporte direto)

O Gateway é a fonte da verdade para admissão de node/cliente.

- Solicitações de pareamento são criadas/aprovadas/rejeitadas no Gateway (veja [Pareamento do Gateway](/pt-BR/gateway/pairing)).
- O Gateway aplica:
  - autenticação (token / par de chaves)
  - escopos/ACLs (o Gateway não é um proxy bruto para todos os métodos)
  - limites de taxa

## Responsabilidades por componente

- **Gateway**: anuncia sinalizadores de descoberta, detém decisões de pareamento e hospeda o endpoint WS.
- **app macOS**: ajuda você a escolher um Gateway, mostra prompts de pareamento e usa SSH apenas como fallback.
- **nodes iOS/Android**: navegam pelo Bonjour como conveniência e se conectam ao Gateway WS pareado.

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta Bonjour](/pt-BR/gateway/bonjour)
