---
read_when:
    - Implementação ou alteração da descoberta/publicidade do Bonjour
    - Ajuste dos modos de conexão remota (direta ou via SSH)
    - Projetando a descoberta e o pareamento de Nodes remotos
summary: Descoberta de Nodes e transportes (Bonjour, Tailscale, SSH) para localizar o Gateway
title: Descoberta e transportes
x-i18n:
    generated_at: "2026-07-11T23:57:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

O OpenClaw tem dois problemas de descoberta relacionados, mas distintos:

1. **Controle remoto do operador**: o aplicativo da barra de menus do macOS controlando um Gateway em execução em outro local.
2. **Pareamento de Node**: iOS/Android (e futuros Nodes) encontrando um Gateway e realizando o pareamento com segurança.

Toda a descoberta/publicidade de rede fica no **Gateway de Nodes**
(`openclaw gateway`); os clientes (aplicativo para Mac, iOS) são apenas consumidores.

## Termos

- **Gateway**: um único processo de longa duração que detém o estado (sessões,
  pareamento, registro de Nodes) e executa canais. A maioria das configurações usa um por host;
  configurações isoladas com vários Gateways são possíveis.
- **WS do Gateway (plano de controle)**: o endpoint WebSocket em `127.0.0.1:18789`
  por padrão; vincule-o à LAN/tailnet por meio de `gateway.bind`.
- **Transporte WS direto**: um endpoint WS do Gateway voltado para LAN/tailnet (sem SSH).
- **Transporte SSH (alternativa)**: controle remoto encaminhando
  `127.0.0.1:18789` por SSH.
- **Ponte TCP legada (removida)**: transporte antigo de Nodes (consulte
  [Protocolo da ponte](/pt-BR/gateway/bridge-protocol)); não é mais anunciado para
  descoberta nem faz parte das compilações atuais.

Detalhes dos protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol),
[Protocolo da ponte (legado)](/pt-BR/gateway/bridge-protocol).

## Por que existem as opções direta e SSH

- **WS direto** oferece a melhor experiência do usuário na mesma rede e dentro de uma tailnet: descoberta
  automática na LAN via Bonjour, tokens de pareamento e ACLs gerenciados pelo Gateway,
  sem necessidade de acesso ao shell.
- **SSH** é a alternativa universal: funciona em qualquer lugar onde você tenha acesso SSH, mesmo
  entre redes não relacionadas, não é afetado por problemas de multicast/mDNS e não exige nenhuma nova
  porta de entrada além da SSH.

## Fontes de descoberta

### 1) Bonjour / DNS-SD

O Bonjour multicast funciona com base no melhor esforço e não atravessa redes. O OpenClaw também
oferece suporte à busca pelo mesmo sinalizador do Gateway por meio de um domínio DNS-SD de área ampla
configurado, permitindo que a descoberta abranja tanto `local.` na mesma LAN quanto um domínio
DNS-SD unicast configurado para descoberta entre redes.

O **Gateway** anuncia seu endpoint WS via Bonjour quando o Plugin
`bonjour` incluído está ativado; os clientes pesquisam e exibem uma lista para "escolher um Gateway",
depois armazenam o endpoint escolhido.

Solução de problemas e detalhes do sinalizador: [Bonjour](/pt-BR/gateway/bonjour).

#### Detalhes do sinalizador de serviço

- Tipo de serviço: `_openclaw-gw._tcp` (sinalizador de transporte do Gateway).
- Chaves TXT (não secretas):

  | Chave                       | Observações                                                                                                                                                                                        |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Sempre presente.                                                                                                                                                                                   |
  | `transport=gateway`         | Sempre presente.                                                                                                                                                                                   |
  | `displayName=<name>`        | Nome de exibição configurado pelo operador.                                                                                                                                                        |
  | `lanHost=<hostname>.local`  | Somente no anunciante mDNS da LAN; não é gravado pelo DNS-SD de área ampla.                                                                                                                        |
  | `gatewayPort=18789`         | Porta WS + HTTP do Gateway.                                                                                                                                                                        |
  | `gatewayTls=1`              | Somente quando o TLS está ativado.                                                                                                                                                                 |
  | `gatewayTlsSha256=<sha256>` | Somente quando o TLS está ativado e há uma impressão digital disponível.                                                                                                                          |
  | `tailnetDns=<magicdns>`     | Dica opcional; detectada automaticamente quando o Tailscale está disponível.                                                                                                                       |
  | `sshPort=<port>`            | Presente somente quando `discovery.mdns.mode="full"`; omitida (o SSH usa `22` por padrão) no modo `"minimal"` padrão, tanto no anunciante da LAN quanto no DNS-SD de área ampla.                     |
  | `cliPath=<path>`            | Mesma condição `discovery.mdns.mode="full"` que `sshPort`; uma dica para instalação remota referente ao caminho da CLI.                                                                            |

  Uma chave TXT `canvasPort` é definida no contrato de descoberta do Plugin para uma
  futura porta do host de canvas, mas nenhum caminho de código atual define um valor; portanto, ela
  nunca é emitida atualmente.

Observações de segurança:

- Os registros TXT do Bonjour/mDNS **não são autenticados**. Os clientes devem tratar os valores TXT
  apenas como dicas de experiência do usuário.
- O roteamento (host/porta) deve priorizar o **endpoint de serviço resolvido**
  (SRV + A/AAAA) em vez de `lanHost`, `tailnetDns` ou `gatewayPort` fornecidos pelo TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma
  fixação armazenada anteriormente.
- Os Nodes iOS/Android devem exigir uma confirmação explícita de "confiar nesta impressão digital"
  antes de armazenar uma fixação pela primeira vez (verificação fora de banda)
  sempre que a rota escolhida for segura/baseada em TLS.

Ativação, desativação e substituições:

- `openclaw plugins enable bonjour` ativa a publicidade multicast na LAN.
- `discovery.mdns.mode` em `openclaw.json` controla a transmissão mDNS:
  `"minimal"` (padrão), `"full"` (adiciona `cliPath`/`sshPort` tanto ao
  sinalizador da LAN quanto a qualquer zona DNS-SD de área ampla) ou `"off"` (desativa o mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` desativa a publicidade à força; `discovery.mdns.mode="off"`
  a desativa independentemente. `OPENCLAW_DISABLE_BONJOUR=0` é uma
  adesão explícita que substitui a desativação automática do Plugin dentro de um contêiner detectado
  (Docker, containerd, Kubernetes, LXC); não substitui
  `discovery.mdns.mode="off"`. O Plugin `bonjour` incluído inicia automaticamente em
  hosts macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) e se desativa automaticamente
  dentro de contêineres detectados; Linux, Windows e outras implantações em
  contêineres precisam executar explicitamente `plugins enable bonjour`.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de vinculação do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH anunciada (só entra em vigor
  quando `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publica uma dica `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` substitui o caminho anunciado da CLI.

### 2) Tailnet (entre redes)

Para Gateways em redes físicas diferentes, o Bonjour não ajudará. O
destino direto recomendado é um nome MagicDNS do Tailscale (preferencial) ou um
IP estável da tailnet.

Se o Gateway detectar que está sendo executado sob o Tailscale, ele publicará
`tailnetDns` como uma dica opcional para os clientes (incluindo sinalizadores de área ampla).
O aplicativo para macOS prioriza nomes MagicDNS em vez de IPs brutos do Tailscale na
descoberta de Gateways, o que mantém a confiabilidade quando os IPs da tailnet mudam (reinicializações de Nodes,
reatribuição de CGNAT), pois o MagicDNS resolve automaticamente para o IP atual.

Para o pareamento de Nodes móveis, as dicas de descoberta nunca reduzem a segurança do transporte em
rotas de tailnet/públicas:

- iOS/Android ainda exigem um caminho seguro para a primeira conexão de tailnet/pública
  (`wss://` ou Tailscale Serve/Funnel).
- Um IP bruto da tailnet descoberto é uma dica de roteamento, não uma permissão para usar
  `ws://` remoto em texto simples.
- A conexão direta privada pela LAN via `ws://` continua sendo compatível.
- Para o caminho mais simples do Tailscale em Nodes móveis, use o Tailscale Serve para que
  a descoberta e a configuração resolvam para o mesmo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Quando não houver uma rota direta (ou quando a opção direta estiver desativada), os clientes sempre poderão
se conectar via SSH encaminhando a porta de local loopback do Gateway. Consulte
[Acesso remoto](/pt-BR/gateway/remote).

## Seleção de transporte (política do cliente)

1. Se um endpoint direto pareado estiver configurado e acessível, use-o.
2. Caso contrário, se a descoberta encontrar um Gateway em `local.` ou no domínio de área ampla
   configurado, ofereça a opção de um toque "Usar este Gateway" e salve-o como
   endpoint direto.
3. Caso contrário, se um DNS/IP da tailnet estiver configurado, tente uma conexão direta. Para Nodes móveis em
   rotas de tailnet/públicas, conexão direta significa um endpoint seguro, não
   `ws://` remoto em texto simples.
4. Caso contrário, use SSH como alternativa.

## Pareamento e autenticação (transporte direto)

O Gateway é a fonte da verdade para a admissão de Nodes/clientes:

- As solicitações de pareamento são criadas/aprovadas/rejeitadas no Gateway (consulte
  [Pareamento do Gateway](/pt-BR/gateway/pairing)).
- O Gateway impõe autenticação (token/par de chaves), escopos/ACLs (não é um proxy
  bruto para todos os métodos) e limites de taxa.

## Responsabilidades por componente

- **Gateway**: anuncia sinalizadores de descoberta, gerencia decisões de pareamento e hospeda
  o endpoint WS.
- **Aplicativo para macOS**: ajuda você a escolher um Gateway, exibe solicitações de pareamento e usa SSH
  somente como alternativa.
- **Nodes iOS/Android**: pesquisam o Bonjour por conveniência e se conectam ao
  WS do Gateway pareado.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
- [Descoberta via Bonjour](/pt-BR/gateway/bonjour)
