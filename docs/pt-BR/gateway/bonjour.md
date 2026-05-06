---
read_when:
    - Depurando problemas de descoberta do Bonjour no macOS/iOS
    - Alteração de tipos de serviço mDNS, registros TXT ou experiência de descoberta
summary: Descoberta Bonjour/mDNS + depuração (sinalizadores do Gateway, clientes e modos de falha comuns)
title: Descoberta do Bonjour
x-i18n:
    generated_at: "2026-05-06T05:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

O OpenClaw pode usar Bonjour (mDNS / DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas para LAN**. O plugin `bonjour`
incluído é responsável pela publicidade em LAN. Ele inicia automaticamente em hosts macOS e é opcional em
implantações de Gateway no Linux, Windows e em contêineres. Para descoberta entre redes, o mesmo
beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado. A descoberta
continua sendo de melhor esforço e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de área ampla (DNS-SD unicast) sobre Tailscale

Se o node e o gateway estiverem em redes diferentes, o mDNS multicast não atravessará a
fronteira. Você pode manter a mesma UX de descoberta mudando para **DNS-SD unicast**
("Bonjour de Área Ampla") sobre Tailscale.

Etapas gerais:

1. Execute um servidor DNS no host do gateway (acessível pela Tailnet).
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure o **DNS dividido** do Tailscale para que o domínio escolhido seja resolvido por esse
   servidor DNS para clientes (incluindo iOS).

O OpenClaw é compatível com qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto em `local.` quanto no domínio de área ampla configurado.

### Configuração do Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Configuração única do servidor DNS (host do gateway)

```bash
openclaw dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Valide a partir de uma máquina conectada à tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um servidor de nomes apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicione DNS dividido para que o domínio de descoberta use esse servidor de nomes.

Depois que os clientes aceitarem o DNS da tailnet, nodes iOS e a descoberta da CLI poderão navegar por
`_openclaw-gw._tcp` no domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendado)

A porta WS do Gateway (padrão `18789`) se vincula a loopback por padrão. Para acesso por LAN/tailnet,
vincule explicitamente e mantenha a autenticação ativada.

Para configurações apenas por tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app de barra de menus do macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast em LAN é
fornecida pelo plugin `bonjour` incluído quando o plugin está ativado; a publicação
DNS-SD de área ampla continua pertencendo ao Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` - beacon de transporte do gateway (usado por nodes macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para facilitar fluxos de UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS está ativado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está ativado e a impressão digital está disponível)
- `canvasPort=<port>` (somente quando o host de canvas está ativado; atualmente o mesmo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente modo mDNS completo, dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente modo mDNS completo; DNS-SD de área ampla pode omiti-lo)
- `cliPath=<path>` (somente modo mDNS completo; DNS-SD de área ampla ainda o escreve como uma dica de instalação remota)

Notas de segurança:

- Registros TXT Bonjour/mDNS **não são autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático por SSH também deve usar o host de serviço resolvido, não dicas apenas em TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma fixação armazenada anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

## Depuração no macOS

Ferramentas integradas úteis:

- Navegar por instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se a navegação funciona, mas a resolução falha, você geralmente está encontrando uma política de LAN ou
um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway escreve um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

O Bonjour usa o nome de host do sistema para o host `.local` anunciado quando ele é um
rótulo DNS válido. Se o nome de host do sistema contiver espaços, sublinhados ou outro
caractere inválido para rótulo DNS, o OpenClaw recorre a `openclaw.local`. Defina
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o Gateway quando precisar de um
rótulo de host explícito.

## Depuração no node iOS

O node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduza → **Copy**

O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando ativar o Bonjour

O Bonjour inicia automaticamente na inicialização do Gateway com configuração vazia em hosts macOS porque o
app local e nodes iOS/Android próximos normalmente dependem da descoberta na mesma LAN.

Ative o Bonjour explicitamente quando a descoberta automática na mesma LAN for útil no Linux,
Windows ou outro host não macOS:

```bash
openclaw plugins enable bonjour
```

Quando ativado, o Bonjour usa `discovery.mdns.mode` para decidir quantos metadados TXT
publicar. O modo padrão é `minimal`; use `full` somente quando clientes locais precisarem de
dicas `cliPath` ou `sshPort`, e use `off` para suprimir multicast em LAN sem
alterar a ativação do plugin.

## Quando desativar o Bonjour

Deixe o Bonjour desativado quando a publicidade multicast em LAN for desnecessária, indisponível
ou prejudicial. Os casos comuns são servidores não macOS, rede bridge do Docker,
WSL ou uma política de rede que bloqueia multicast mDNS. Nesses ambientes, o
Gateway ainda é acessível por sua URL publicada, SSH, Tailnet ou DNS-SD de área ampla,
mas a descoberta automática em LAN não é confiável.

Prefira a substituição de ambiente existente quando o problema for específico da implantação:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Isso desativa a publicidade multicast em LAN sem alterar a configuração do plugin.
É seguro para imagens Docker, arquivos de serviço, scripts de inicialização e depuração pontual
porque a configuração desaparece quando o ambiente desaparece.

Use a configuração do plugin quando quiser intencionalmente desativar o plugin de descoberta em LAN
incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pegadinhas do Docker

O plugin Bonjour incluído desativa automaticamente a publicidade multicast em LAN em contêineres
detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. Redes bridge do Docker
normalmente não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner
e a LAN, então anunciar a partir do contêiner raramente faz a descoberta funcionar.

Pegadinhas importantes:

- O Bonjour inicia automaticamente em hosts macOS e é opcional nos demais. Deixá-lo
  desativado não interrompe o Gateway; apenas ignora a publicidade multicast em LAN.
- Desativar o Bonjour não altera `gateway.bind`; o Docker ainda usa por padrão
  `OPENCLAW_GATEWAY_BIND=lan` para que a porta publicada do host possa funcionar.
- Desativar o Bonjour não desativa DNS-SD de área ampla. Use descoberta de área ampla
  ou Tailnet quando o Gateway e o node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não persiste a
  política de desativação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para rede do host, macvlan ou outra
  rede em que se saiba que multicast mDNS passa; defina como `1` para forçar a desativação.

## Solução de problemas com Bonjour desativado

Se um node não descobre mais automaticamente o Gateway após a configuração do Docker:

1. Confirme se o Gateway está em modo automático, forçado ligado ou forçado desligado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme se o próprio Gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desativado:
   - UI de controle ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou
     DNS-SD de área ampla

4. Se você ativou deliberadamente o plugin Bonjour no Docker e forçou a publicidade
   com `OPENCLAW_DISABLE_BONJOUR=0`, teste o multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a navegação estiver vazia ou os logs do Gateway mostrarem cancelamentos repetidos
   do watchdog do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou
   por Tailnet.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desativam mDNS.
- **Anunciante preso em sondagem/anúncio**: hosts com multicast bloqueado,
  bridges de contêiner, WSL ou oscilação de interface podem deixar o anunciante ciao em um
  estado não anunciado. O OpenClaw tenta novamente algumas vezes e então desativa o Bonjour
  para o processo atual do Gateway em vez de reiniciar o anunciante indefinidamente.
- **Rede bridge do Docker**: o Bonjour se desativa automaticamente em contêineres detectados.
  Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para host, macvlan ou outra
  rede compatível com mDNS.
- **Suspensão / oscilação de interface**: o macOS pode perder temporariamente resultados mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha nomes de máquinas simples (evite emojis ou
  pontuação) e reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, portanto nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Ativação / desativação / configuração

- Hosts macOS iniciam automaticamente o plugin de descoberta em LAN incluído por padrão.
- `openclaw plugins enable bonjour` ativa o plugin de descoberta em LAN incluído em hosts em que ele não é ativado por padrão.
- `openclaw plugins disable bonjour` desativa a publicidade multicast em LAN desativando o plugin incluído.
- `OPENCLAW_DISABLE_BONJOUR=1` desativa a publicidade multicast em LAN sem alterar a configuração do plugin; valores verdadeiros aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` força a ativação da publicidade multicast em LAN, inclusive dentro de contêineres detectados; valores falsos aceitos são `0`, `false`, `no` e `off`.
- Quando o plugin Bonjour está ativado e `OPENCLAW_DISABLE_BONJOUR` não está definido, o Bonjour anuncia em hosts normais e se desativa automaticamente dentro de contêineres detectados.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de vinculação do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica MagicDNS em TXT quando o modo mDNS completo está ativado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Docs relacionadas

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de node + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
