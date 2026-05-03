---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alteração de tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta e depuração de Bonjour/mDNS (sinalizadores do Gateway, clientes e modos de falha comuns)
title: Descoberta via Bonjour
x-i18n:
    generated_at: "2026-05-03T21:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Descoberta Bonjour / mDNS

O OpenClaw pode usar Bonjour (mDNS / DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas para LAN**. O Plugin `bonjour`
incluído é responsável pela publicidade em LAN. Ele inicia automaticamente em hosts macOS e é opcional em
Linux, Windows e implantações de Gateway em contêiner. Para descoberta entre redes, o mesmo
beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado. A descoberta
continua sendo de melhor esforço e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de área ampla (DNS-SD Unicast) sobre Tailscale

Se o nó e o gateway estiverem em redes diferentes, o mDNS multicast não atravessará a
fronteira. Você pode manter a mesma UX de descoberta mudando para **DNS-SD unicast**
("Bonjour de Área Ampla") sobre Tailscale.

Etapas de alto nível:

1. Execute um servidor DNS no host do gateway (acessível pela Tailnet).
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure o **split DNS** do Tailscale para que o domínio escolhido seja resolvido por esse
   servidor DNS para os clientes (incluindo iOS).

O OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nós iOS/Android navegam tanto em `local.` quanto no domínio de área ampla configurado.

### Configuração do Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita a publicação DNS-SD de área ampla
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

- Adicione um nameserver apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicione split DNS para que o domínio de descoberta use esse nameserver.

Depois que os clientes aceitarem o DNS da tailnet, nós iOS e a descoberta da CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendado)

A porta WS do Gateway (padrão `18789`) se vincula a loopback por padrão. Para acesso
LAN/tailnet, vincule explicitamente e mantenha a autenticação habilitada.

Para configurações somente tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app de barra de menus do macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast em LAN é
fornecida pelo Plugin `bonjour` incluído quando o Plugin está habilitado; a
publicação DNS-SD de área ampla continua pertencendo ao Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por nós macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar os fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está habilitado e a impressão digital está disponível)
- `canvasPort=<port>` (somente quando o host de canvas está habilitado; atualmente o mesmo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente modo mDNS completo, dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente modo mDNS completo; DNS-SD de área ampla pode omiti-lo)
- `cliPath=<path>` (somente modo mDNS completo; DNS-SD de área ampla ainda o escreve como dica de instalação remota)

Notas de segurança:

- Registros TXT Bonjour/mDNS são **não autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático por SSH também deve usar o host de serviço resolvido, não dicas apenas de TXT.
- O pinning TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
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

Se a navegação funciona, mas a resolução falha, normalmente você está encontrando uma política de LAN ou
um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

O Bonjour usa o hostname do sistema para o host `.local` anunciado quando ele é um
rótulo DNS válido. Se o hostname do sistema contiver espaços, underscores ou outro
caractere inválido para rótulo DNS, o OpenClaw faz fallback para `openclaw.local`. Defina
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o Gateway quando precisar de um
rótulo de host explícito.

## Depuração no nó iOS

O nó iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Ajustes → Gateway → Avançado → **Logs de Depuração de Descoberta**
- Ajustes → Gateway → Avançado → **Logs de Descoberta** → reproduzir → **Copiar**

O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando habilitar Bonjour

O Bonjour inicia automaticamente para inicialização do Gateway com configuração vazia em hosts macOS porque o
app local e nós iOS/Android próximos geralmente dependem da descoberta na mesma LAN.

Habilite o Bonjour explicitamente quando a descoberta automática na mesma LAN for útil em Linux,
Windows ou outro host não macOS:

```bash
openclaw plugins enable bonjour
```

Quando habilitado, o Bonjour usa `discovery.mdns.mode` para decidir quanto metadado TXT
publicar. O modo padrão é `minimal`; use `full` somente quando clientes locais precisarem de
dicas `cliPath` ou `sshPort`, e use `off` para suprimir multicast em LAN sem
alterar a habilitação do Plugin.

## Quando desabilitar Bonjour

Deixe o Bonjour desabilitado quando a publicidade multicast em LAN for desnecessária, indisponível
ou prejudicial. Os casos comuns são servidores não macOS, rede bridge do Docker,
WSL ou uma política de rede que bloqueia multicast mDNS. Nesses ambientes, o
Gateway ainda pode ser acessado por sua URL publicada, SSH, Tailnet ou DNS-SD
de área ampla, mas a descoberta automática em LAN não é confiável.

Prefira a substituição de ambiente existente quando o problema for específico da implantação:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Isso desabilita a publicidade multicast em LAN sem alterar a configuração do Plugin.
É seguro para imagens Docker, arquivos de serviço, scripts de inicialização e depuração
pontual porque a configuração desaparece quando o ambiente desaparece.

Use a configuração do Plugin quando quiser intencionalmente desativar o Plugin de descoberta em LAN
incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Armadilhas do Docker

O Plugin Bonjour incluído desabilita automaticamente a publicidade multicast em LAN em contêineres
detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. Redes bridge do Docker
geralmente não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner
e a LAN, então anunciar a partir do contêiner raramente faz a descoberta funcionar.

Armadilhas importantes:

- O Bonjour inicia automaticamente em hosts macOS e é opcional em outros lugares. Deixá-lo
  desabilitado não interrompe o Gateway; apenas pula a publicidade multicast em LAN.
- Desabilitar o Bonjour não altera `gateway.bind`; o Docker ainda usa por padrão
  `OPENCLAW_GATEWAY_BIND=lan` para que a porta publicada do host funcione.
- Desabilitar o Bonjour não desabilita DNS-SD de área ampla. Use descoberta de área ampla
  ou Tailnet quando o Gateway e o nó não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não persiste a
  política de desabilitação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para rede host, macvlan ou outra
  rede em que se sabe que multicast mDNS passa; defina como `1` para forçar a desabilitação.

## Solução de problemas do Bonjour desabilitado

Se um nó não descobre mais automaticamente o Gateway depois da configuração do Docker:

1. Confirme se o Gateway está em modo automático, forçado ligado ou forçado desligado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme se o próprio Gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desabilitado:
   - Control UI ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou
     DNS-SD de área ampla

4. Se você habilitou deliberadamente o Plugin Bonjour no Docker e forçou a publicidade
   com `OPENCLAW_DISABLE_BONJOUR=0`, teste o multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a navegação estiver vazia ou os logs do Gateway mostrarem cancelamentos repetidos do watchdog
   do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou
   Tailnet.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam mDNS.
- **Anunciante travado em probing/announcing**: hosts com multicast bloqueado,
  bridges de contêiner, WSL ou alterações de interface podem deixar o anunciante ciao em um
  estado não anunciado. O OpenClaw tenta novamente algumas vezes e então desabilita o Bonjour
  para o processo atual do Gateway em vez de reiniciar o anunciante indefinidamente.
- **Rede bridge do Docker**: o Bonjour se desabilita automaticamente em contêineres detectados.
  Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para host, macvlan ou outra
  rede compatível com mDNS.
- **Suspensão / alterações de interface**: o macOS pode perder temporariamente resultados mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha nomes de máquina simples (evite emojis ou
  pontuação), depois reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Habilitação / desabilitação / configuração

- Hosts macOS iniciam automaticamente o Plugin de descoberta em LAN incluído por padrão.
- `openclaw plugins enable bonjour` habilita o Plugin de descoberta em LAN incluído em hosts em que ele não é habilitado por padrão.
- `openclaw plugins disable bonjour` desabilita a publicidade multicast em LAN ao desabilitar o Plugin incluído.
- `OPENCLAW_DISABLE_BONJOUR=1` desabilita a publicidade multicast em LAN sem alterar a configuração do Plugin; valores verdadeiros aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` força a publicidade multicast em LAN, inclusive dentro de contêineres detectados; valores falsos aceitos são `0`, `false`, `no` e `off`.
- Quando o Plugin Bonjour está habilitado e `OPENCLAW_DISABLE_BONJOUR` não está definido, o Bonjour anuncia em hosts normais e se desabilita automaticamente dentro de contêineres detectados.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica MagicDNS em TXT quando o modo mDNS completo está habilitado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de nós + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
