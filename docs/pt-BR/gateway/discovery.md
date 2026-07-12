---
read_when:
    - Implementação ou alteração da descoberta/publicidade do Bonjour
    - Ajustando os modos de conexão remota (direta ou via SSH)
    - Projetando a descoberta + o pareamento de nodes remotos
summary: Descoberta de Nodes e transportes (Bonjour, Tailscale, SSH) para localizar o Gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-07-12T15:12:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

O OpenClaw tem dois problemas de descoberta relacionados, mas distintos:

1. **Controle remoto do operador**: o aplicativo da barra de menus do macOS controlando um gateway executado em outro lugar.
2. **Pareamento de Node**: iOS/Android (e futuros nodes) encontrando um gateway e realizando o pareamento com segurança.

Toda a descoberta/publicidade de rede reside no **Gateway de Node**
(`openclaw gateway`); os clientes (aplicativo para Mac, iOS) são apenas consumidores.

## Termos

- **Gateway**: um único processo de longa duração que controla o estado (sessões,
  pareamento, registro de nodes) e executa canais. A maioria das configurações usa um por host;
  configurações isoladas com vários gateways são possíveis.
- **WS do Gateway (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789`
  por padrão; vincule-o à LAN/tailnet por meio de `gateway.bind`.
- **Transporte WS direto**: um endpoint WS do Gateway voltado para a LAN/tailnet (sem SSH).
- **Transporte SSH (fallback)**: controle remoto por meio do encaminhamento de
  `127.0.0.1:18789` por SSH.
- **Ponte TCP legada (removida)**: transporte de node mais antigo (consulte
  [Protocolo da ponte](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta nem faz parte das compilações atuais.

Detalhes dos protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol),
[Protocolo da ponte (legado)](/pt-BR/gateway/bridge-protocol).

## Por que existem as opções direta e SSH

- O **WS direto** oferece a melhor experiência do usuário na mesma rede e dentro de uma tailnet: descoberta
  automática na LAN via Bonjour, tokens de pareamento e ACLs controlados pelo gateway,
  sem exigir acesso ao shell.
- O **SSH** é o fallback universal: funciona em qualquer lugar onde você tenha acesso SSH, até mesmo
  entre redes não relacionadas, contorna problemas de multicast/mDNS e não exige nenhuma nova
  porta de entrada além da SSH.

## Fontes de descoberta

### 1) Bonjour / DNS-SD

O Bonjour multicast é baseado em melhor esforço e não atravessa redes. O OpenClaw também
permite procurar o mesmo beacon do gateway por meio de um domínio DNS-SD de longa distância
configurado, de modo que a descoberta possa abranger tanto `local.` na mesma LAN quanto um domínio
DNS-SD unicast configurado para descoberta entre redes.

O **gateway** anuncia seu endpoint WS via Bonjour quando o Plugin
`bonjour` incluído está habilitado; os clientes procuram e exibem uma lista para "escolher um gateway",
depois armazenam o endpoint escolhido.

Solução de problemas e detalhes do beacon: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do beacon de serviço

- Tipo de serviço: `_openclaw-gw._tcp` (beacon de transporte do gateway).
- Chaves TXT (não secretas):

  | Chave                       | Observações                                                                                                                                                                  |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Sempre presente.                                                                                                                                                             |
  | `transport=gateway`         | Sempre presente.                                                                                                                                                             |
  | `displayName=<name>`        | Nome de exibição configurado pelo operador.                                                                                                                                  |
  | `lanHost=<hostname>.local`  | Somente no anunciante mDNS da LAN; não é gravado pelo DNS-SD de longa distância.                                                                                             |
  | `gatewayPort=18789`         | Porta do WS do Gateway + HTTP.                                                                                                                                               |
  | `gatewayTls=1`              | Somente quando o TLS está habilitado.                                                                                                                                        |
  | `gatewayTlsSha256=<sha256>` | Somente quando o TLS está habilitado e uma impressão digital está disponível.                                                                                                |
  | `tailnetDns=<magicdns>`     | Dica opcional; detectada automaticamente quando o Tailscale está disponível.                                                                                                 |
  | `sshPort=<port>`            | Presente somente quando `discovery.mdns.mode="full"`; omitida (o padrão do SSH é `22`) no modo `"minimal"` padrão, tanto no anunciante da LAN quanto no DNS-SD de longa distância. |
  | `cliPath=<path>`            | Mesma condição `discovery.mdns.mode="full"` que `sshPort`; uma dica de instalação remota para o caminho da CLI.                                                              |

  Uma chave TXT `canvasPort` é definida no contrato de descoberta do Plugin para uma
  futura porta de host do canvas, mas nenhum caminho de código atual define um valor; portanto, ela
  nunca é emitida atualmente.

Observações de segurança:

- Os registros TXT do Bonjour/mDNS **não são autenticados**. Os clientes devem tratar os valores TXT
  apenas como dicas de experiência do usuário.
- O roteamento (host/porta) deve priorizar o **endpoint de serviço resolvido**
  (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos por TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma
  fixação armazenada anteriormente.
- Os nodes iOS/Android devem exigir uma confirmação explícita para "confiar nesta impressão digital"
  antes de armazenar uma fixação pela primeira vez (verificação fora de banda)
  sempre que a rota escolhida for segura/baseada em TLS.

Habilitar, desabilitar e substituir:

- `openclaw plugins enable bonjour` habilita a publicidade multicast na LAN.
- `discovery.mdns.mode` em `openclaw.json` controla a transmissão mDNS:
  `"minimal"` (padrão), `"full"` (adiciona `cliPath`/`sshPort` tanto ao beacon da LAN
  quanto a qualquer zona DNS-SD de longa distância) ou `"off"` (desabilita o mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` força a desativação da publicidade; `discovery.mdns.mode="off"`
  a desabilita independentemente. `OPENCLAW_DISABLE_BONJOUR=0` é uma ativação
  explícita que substitui a desativação automática do Plugin dentro de um contêiner detectado
  (Docker, containerd, Kubernetes, LXC); ela não substitui
  `discovery.mdns.mode="off"`. O Plugin `bonjour` incluído inicia automaticamente em
  hosts macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) e é desabilitado automaticamente
  dentro de contêineres detectados; implantações no Linux, Windows e em outros ambientes
  conteinerizados precisam executar explicitamente `plugins enable bonjour`.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de vinculação do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada (só entra em vigor
  quando `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado.

### 2) Tailnet (entre redes)

Para gateways em redes físicas diferentes, o Bonjour não ajudará. O
destino direto recomendado é um nome MagicDNS do Tailscale (preferencial) ou um
IP de tailnet estável.

Se o gateway detectar que está sendo executado sob o Tailscale, ele publicará
`tailnetDns` como uma dica opcional para os clientes (incluindo beacons de longa distância).
O aplicativo para macOS prioriza nomes MagicDNS em vez de IPs brutos do Tailscale para a
descoberta do gateway, que permanece confiável quando os IPs da tailnet mudam (reinicializações
de nodes, reatribuição de CGNAT), pois o MagicDNS resolve automaticamente para o IP atual.

Para o pareamento de nodes móveis, as dicas de descoberta nunca flexibilizam a segurança do transporte em
rotas de tailnet/públicas:

- O iOS/Android ainda exige um caminho seguro de conexão inicial por tailnet/rede pública
  (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto de tailnet descoberto é uma dica de roteamento, não uma permissão para usar
  `ws://` remoto sem criptografia.
- A conexão direta `ws://` em LAN privada continua sendo compatível.
- Para o caminho mais simples do Tailscale em nodes móveis, use o Tailscale Serve para que
  a descoberta e a configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Quando não houver uma rota direta (ou ela estiver desabilitada), os clientes sempre poderão
se conectar via SSH encaminhando a porta de loopback do gateway. Consulte
[Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um gateway em `local.` ou no domínio de longa distância
   configurado, ofereça uma opção de um toque para "usar este gateway" e salve-o como o
   endpoint direto.
3. Caso contrário, se um DNS/IP de tailnet estiver configurado, tente a conexão direta. Para nodes móveis em
   rotas de tailnet/públicas, direta significa um endpoint seguro, não `ws://`
   remoto sem criptografia.
4. Caso contrário, use o SSH como fallback.

## Pareamento e autenticação (transporte direto)

O gateway é a fonte da verdade para a admissão de nodes/clientes:

- As solicitações de pareamento são criadas/aprovadas/rejeitadas no gateway (consulte
  [Pareamento do Gateway](/pt-BR/gateway/pairing)).
- O gateway aplica autenticação (token/par de chaves), escopos/ACLs (não é um proxy bruto
  para todos os métodos) e limites de taxa.

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descoberta, controla as decisões de pareamento e hospeda
  o endpoint WS.
- **Aplicativo para macOS**: ajuda você a escolher um gateway, exibe solicitações de pareamento e usa SSH
  apenas como fallback.
- **Nodes iOS/Android**: procuram o Bonjour por conveniência e se conectam ao
  WS do Gateway pareado.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta via Bonjour](/pt-BR/gateway/bonjour)
