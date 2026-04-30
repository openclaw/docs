---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alterar tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta e depuração do Bonjour/mDNS (anúncios do Gateway, clientes e modos de falha comuns)
title: Descoberta do Bonjour
x-i18n:
    generated_at: "2026-04-30T09:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Descoberta Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast `local.` é uma **conveniência apenas para LAN**. O plugin `bonjour`
incluído é responsável pela publicidade na LAN e vem habilitado por padrão. Para descoberta
entre redes, o mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado.
A descoberta continua sendo de melhor esforço e **não** substitui SSH ou conectividade baseada em Tailnet.

## Bonjour de área ampla (DNS-SD unicast) sobre Tailscale

Se o node e o gateway estiverem em redes diferentes, o mDNS multicast não cruzará o
limite. Você pode manter a mesma UX de descoberta mudando para **DNS-SD unicast**
("Bonjour de Área Ampla") sobre Tailscale.

Etapas gerais:

1. Execute um servidor DNS no host do gateway (acessível pela Tailnet).
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure o **DNS dividido** do Tailscale para que seu domínio escolhido seja resolvido por esse
   servidor DNS para clientes (incluindo iOS).

OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto por `local.` quanto pelo seu domínio de área ampla configurado.

### Configuração do Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // apenas tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita publicação DNS-SD de área ampla
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
- Adicione DNS dividido para que seu domínio de descoberta use esse nameserver.

Depois que os clientes aceitarem o DNS da tailnet, nodes iOS e a descoberta da CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendada)

A porta WS do Gateway (padrão `18789`) se vincula ao loopback por padrão. Para acesso por LAN/tailnet,
vincule explicitamente e mantenha a autenticação habilitada.

Para configurações apenas por tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menus do macOS).

## O que anuncia

Apenas o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast na LAN é
fornecida pelo plugin `bonjour` incluído; a publicação DNS-SD de área ampla permanece
sob responsabilidade do Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por nodes macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar os fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (apenas quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (apenas quando TLS está habilitado e a impressão digital está disponível)
- `canvasPort=<port>` (apenas quando o host canvas está habilitado; atualmente igual a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente modo mDNS completo, dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente modo mDNS completo; DNS-SD de área ampla pode omiti-la)
- `cliPath=<path>` (somente modo mDNS completo; DNS-SD de área ampla ainda a escreve como dica de instalação remota)

Notas de segurança:

- Registros TXT Bonjour/mDNS **não são autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático de SSH também deve usar o host de serviço resolvido, não dicas apenas em TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **apenas TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

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

Se a navegação funciona, mas a resolução falha, geralmente você está encontrando uma política de LAN ou
um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour usa o hostname do sistema para o host `.local` anunciado quando ele é um
rótulo DNS válido. Se o hostname do sistema contiver espaços, sublinhados ou outro
caractere inválido para rótulo DNS, OpenClaw usa `openclaw.local` como fallback. Defina
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o Gateway quando você precisar de um
rótulo de host explícito.

## Depuração no node iOS

O node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Settings → Gateway → Advanced → **Logs de Depuração de Descoberta**
- Settings → Gateway → Advanced → **Logs de Descoberta** → reproduzir → **Copiar**

O log inclui transições de estado do navegador e mudanças no conjunto de resultados.

## Quando desabilitar Bonjour

Desabilite Bonjour apenas quando a publicidade multicast na LAN estiver indisponível ou for prejudicial.
O caso comum é um Gateway em execução atrás de rede bridge do Docker, WSL ou uma
política de rede que descarta multicast mDNS. Nesses ambientes, o Gateway ainda é
acessível por sua URL publicada, SSH, Tailnet ou DNS-SD de área ampla,
mas a descoberta automática na LAN não é confiável.

Prefira a substituição por ambiente existente quando o problema for específico da implantação:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Isso desabilita a publicidade multicast na LAN sem alterar a configuração do plugin.
É seguro para imagens Docker, arquivos de serviço, scripts de inicialização e depuração pontual,
porque a configuração desaparece quando o ambiente desaparece.

Use a configuração de plugin apenas quando você intencionalmente quiser desligar o
plugin de descoberta LAN incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Particularidades do Docker

O plugin Bonjour incluído desabilita automaticamente a publicidade multicast na LAN em contêineres
detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. Redes bridge do Docker
geralmente não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner
e a LAN, então a publicidade a partir do contêiner raramente faz a descoberta funcionar.

Particularidades importantes:

- Desabilitar Bonjour não interrompe o Gateway. Isso apenas interrompe a
  publicidade multicast na LAN.
- Desabilitar Bonjour não altera `gateway.bind`; o Docker ainda usa por padrão
  `OPENCLAW_GATEWAY_BIND=lan` para que a porta publicada no host possa funcionar.
- Desabilitar Bonjour não desabilita DNS-SD de área ampla. Use descoberta de área ampla
  ou Tailnet quando o Gateway e o node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não persiste a
  política de desabilitação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` apenas para rede host, macvlan ou outra
  rede onde se sabe que multicast mDNS passa; defina como `1` para forçar a desabilitação.

## Solução de problemas de Bonjour desabilitado

Se um node não descobre mais automaticamente o Gateway após a configuração do Docker:

1. Confirme se o Gateway está em modo automático, forçado ligado ou forçado desligado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme que o próprio Gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando Bonjour estiver desabilitado:
   - Control UI ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou
     DNS-SD de área ampla

4. Se você habilitou Bonjour deliberadamente no Docker com
   `OPENCLAW_DISABLE_BONJOUR=0`, teste multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a navegação estiver vazia ou os logs do Gateway mostrarem cancelamentos repetidos do watchdog ciao,
   restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou
   Tailnet.

## Modos de falha comuns

- **Bonjour não cruza redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam mDNS.
- **Anunciante preso em sondagem/anúncio**: hosts com multicast bloqueado,
  bridges de contêiner, WSL ou mudanças de interface podem deixar o anunciante ciao em um
  estado não anunciado. OpenClaw tenta novamente algumas vezes e depois desabilita Bonjour
  para o processo atual do Gateway em vez de reiniciar o anunciante para sempre.
- **Rede bridge do Docker**: Bonjour é desabilitado automaticamente em contêineres detectados.
  Defina `OPENCLAW_DISABLE_BONJOUR=0` apenas para host, macvlan ou outra
  rede compatível com mDNS.
- **Suspensão / mudanças de interface**: o macOS pode remover temporariamente resultados mDNS; tente novamente.
- **Navegação funciona, mas resolução falha**: mantenha nomes de máquinas simples (evite emojis ou
  pontuação), depois reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, então nomes complexos demais podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (iOS usa `BonjourEscapes.decode`).

## Desabilitação / configuração

- `openclaw plugins disable bonjour` desabilita a publicidade multicast na LAN ao desabilitar o plugin incluído.
- `openclaw plugins enable bonjour` restaura o plugin padrão de descoberta LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` desabilita a publicidade multicast na LAN sem alterar a configuração do plugin; valores verdadeiros aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` força a publicidade multicast na LAN ligada, inclusive dentro de contêineres detectados; valores falsos aceitos são `0`, `false`, `no` e `off`.
- Quando `OPENCLAW_DISABLE_BONJOUR` não está definido, Bonjour anuncia em hosts normais e é desabilitado automaticamente dentro de contêineres detectados.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de vinculação do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica MagicDNS em TXT quando o modo mDNS completo está habilitado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho da CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Documentos relacionados

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de node + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
