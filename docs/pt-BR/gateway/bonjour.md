---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alterando tipos de serviço mDNS, registros TXT ou experiência de descoberta
summary: Descoberta + depuração de Bonjour/mDNS (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

O OpenClaw pode usar Bonjour (mDNS / DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas de LAN**. O plugin `bonjour`
incluído é responsável pela publicidade na LAN. Ele inicia automaticamente em hosts macOS e é opt-in em
Linux, Windows e implantações de Gateway em contêiner. Para descoberta entre redes, o mesmo
beacon também pode ser publicado por meio de um domínio DNS-SD de ampla área configurado. A descoberta
continua sendo de melhor esforço e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de ampla área (DNS-SD unicast) sobre Tailscale

Se o nó e o gateway estiverem em redes diferentes, o mDNS multicast não atravessará a
fronteira. Você pode manter a mesma UX de descoberta mudando para **DNS-SD unicast**
("Bonjour de ampla área") sobre Tailscale.

Etapas em alto nível:

1. Execute um servidor DNS no host do gateway (alcançável pela Tailnet).
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure **split DNS** no Tailscale para que seu domínio escolhido seja resolvido por esse
   servidor DNS para clientes (incluindo iOS).

O OpenClaw aceita qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nós iOS/Android navegam tanto por `local.` quanto pelo seu domínio de ampla área configurado.

### Configuração do Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita publicação DNS-SD de ampla área
}
```

### Configuração única do servidor DNS (host do gateway)

```bash
openclaw dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do gateway
- servir seu domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Valide a partir de uma máquina conectada à tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um nameserver apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse nameserver.

Depois que os clientes aceitarem o DNS da tailnet, nós iOS e a descoberta pela CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendado)

A porta WS do Gateway (padrão `18789`) se vincula ao loopback por padrão. Para acesso por LAN/tailnet,
vincule explicitamente e mantenha a autenticação habilitada.

Para configurações somente tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menus do macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast na LAN é
fornecida pelo plugin `bonjour` incluído quando o plugin está habilitado; a
publicação DNS-SD de ampla área continua sendo responsabilidade do Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` - beacon de transporte do gateway (usado por nós macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está habilitado e a impressão digital está disponível)
- `canvasPort=<port>` (somente quando o host de canvas está habilitado; atualmente igual a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente modo mDNS completo, dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente modo completo; omitido nos modos mínimo e desligado)
- `cliPath=<path>` (somente modo completo; omitido nos modos mínimo e desligado)

Notas de segurança:

- Registros TXT Bonjour/mDNS **não são autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático por SSH também deve usar o host de serviço resolvido, não dicas apenas de TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nós iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

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

Se a navegação funcionar, mas a resolução falhar, normalmente você está encontrando uma política de LAN ou
um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

O watchdog trata `probing`, `announcing` ativos e renomeações recentes por conflito como
estados em andamento. Se o serviço nunca chegar a `announced`, o OpenClaw eventualmente
recria o anunciante e, após falhas repetidas, desabilita Bonjour para esse
processo do Gateway em vez de anunciar novamente para sempre.

Bonjour usa o nome de host do sistema para o host `.local` anunciado quando ele é um
rótulo DNS válido. Se o nome de host do sistema contiver espaços, sublinhados ou outro
caractere inválido para rótulo DNS, o OpenClaw volta para `openclaw.local`. Defina
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o Gateway quando precisar de um
rótulo de host explícito.

## Depuração no nó iOS

O nó iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Settings → Gateway → Advanced → **Logs de depuração de descoberta**
- Settings → Gateway → Advanced → **Logs de descoberta** → reproduzir → **Copiar**

O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando habilitar Bonjour

Bonjour inicia automaticamente na inicialização do Gateway com configuração vazia em hosts macOS porque o
app local e nós iOS/Android próximos costumam depender da descoberta na mesma LAN.

Habilite Bonjour explicitamente quando a descoberta automática na mesma LAN for útil em Linux,
Windows ou outro host não macOS:

```bash
openclaw plugins enable bonjour
```

Quando habilitado, Bonjour usa `discovery.mdns.mode` para decidir quantos metadados TXT
publicar. O mesmo modo controla dicas TXT opcionais em registros DNS-SD de ampla área.
O modo padrão é `minimal`; use `full` somente quando os clientes precisarem das dicas `cliPath` ou
`sshPort`. Use `off` para suprimir multicast na LAN sem alterar a habilitação do plugin;
DNS-SD de ampla área ainda pode publicar o beacon mínimo do Gateway quando
`discovery.wideArea.enabled` é true.

## Quando desabilitar Bonjour

Deixe Bonjour desabilitado quando a publicidade multicast na LAN for desnecessária, indisponível
ou prejudicial. Os casos comuns são servidores não macOS, rede bridge do Docker,
WSL ou uma política de rede que descarta multicast mDNS. Nesses ambientes, o
Gateway ainda é alcançável por sua URL publicada, SSH, Tailnet ou DNS-SD de ampla área,
mas a descoberta automática na LAN não é confiável.

Prefira a substituição de ambiente existente quando o problema estiver no escopo da implantação:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Isso desabilita a publicidade multicast na LAN sem alterar a configuração do plugin.
É seguro para imagens Docker, arquivos de serviço, scripts de inicialização e depuração pontual,
porque a configuração desaparece quando o ambiente desaparece.

Use a configuração do plugin quando você quiser intencionalmente desligar o plugin de
descoberta em LAN incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pegadinhas do Docker

O plugin Bonjour incluído desabilita automaticamente a publicidade multicast na LAN em contêineres
detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. Redes bridge do Docker
geralmente não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner
e a LAN, então anunciar a partir do contêiner raramente faz a descoberta funcionar.

Pegadinhas importantes:

- Bonjour inicia automaticamente em hosts macOS e é opt-in em outros lugares. Deixá-lo
  desabilitado não interrompe o Gateway; apenas pula a publicidade multicast na LAN.
- Desabilitar Bonjour não altera `gateway.bind`; Docker ainda usa como padrão
  `OPENCLAW_GATEWAY_BIND=lan` para que a porta publicada do host possa funcionar.
- Desabilitar Bonjour não desabilita DNS-SD de ampla área. Use descoberta de ampla área
  ou Tailnet quando o Gateway e o nó não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não persiste a
  política de desabilitação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para rede do host, macvlan ou outra
  rede em que se saiba que multicast mDNS passa; defina como `1` para forçar a desabilitação.

## Solução de problemas de Bonjour desabilitado

Se um nó não descobre mais automaticamente o Gateway após a configuração do Docker:

1. Confirme se o Gateway está em modo automático, forçado ligado ou forçado desligado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme que o próprio Gateway está alcançável pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando Bonjour estiver desabilitado:
   - UI de controle ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: Tailnet MagicDNS, IP Tailnet, túnel SSH ou
     DNS-SD de ampla área

4. Se você habilitou deliberadamente o plugin Bonjour no Docker e forçou a publicidade
   com `OPENCLAW_DISABLE_BONJOUR=0`, teste multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a navegação estiver vazia ou os logs do Gateway mostrarem cancelamentos repetidos
   do watchdog ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou
   Tailnet.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam mDNS.
- **Anunciante preso em probing/announcing**: hosts com multicast bloqueado,
  bridges de contêiner, WSL ou oscilação de interface podem deixar o anunciante ciao em um
  estado não anunciado. O OpenClaw tenta novamente algumas vezes e então desabilita Bonjour
  para o processo atual do Gateway em vez de reiniciar o anunciante para sempre.
- **Rede bridge do Docker**: Bonjour desabilita automaticamente em contêineres detectados.
  Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para host, macvlan ou outra
  rede compatível com mDNS.
- **Suspensão / oscilação de interface**: o macOS pode descartar temporariamente resultados mDNS; tente novamente.
- **Navegação funciona, mas resolução falha**: mantenha nomes de máquinas simples (evite emojis ou
  pontuação) e então reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, então nomes complexos demais podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências
decimais `\DDD` (por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Habilitação / desabilitação / configuração

- Hosts macOS iniciam automaticamente o Plugin de descoberta LAN incluído por padrão.
- `openclaw plugins enable bonjour` habilita o Plugin de descoberta LAN incluído em hosts onde ele não é habilitado por padrão.
- `openclaw plugins disable bonjour` desabilita a divulgação multicast LAN ao desabilitar o Plugin incluído.
- `OPENCLAW_DISABLE_BONJOUR=1` desabilita a divulgação multicast LAN sem alterar a configuração do Plugin; os valores truthy aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` força a divulgação multicast LAN a ficar ativada, inclusive dentro de contêineres detectados; os valores falsy aceitos são `0`, `false`, `no` e `off`.
- Quando o Plugin Bonjour está habilitado e `OPENCLAW_DISABLE_BONJOUR` não está definido, Bonjour divulga em hosts normais e se desabilita automaticamente dentro de contêineres detectados.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de vínculo do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é divulgada (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica MagicDNS em TXT quando o modo completo de mDNS está habilitado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI divulgado (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Emparelhamento de Node + aprovações: [Emparelhamento do Gateway](/pt-BR/gateway/pairing)
