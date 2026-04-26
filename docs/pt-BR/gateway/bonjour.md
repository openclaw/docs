---
read_when:
    - Depurando problemas de descoberta Bonjour no macOS/iOS
    - Alterando tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-04-26T11:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descoberta Bonjour / mDNS

O OpenClaw usa Bonjour (mDNS / DNS‑SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast em `local.` é uma **conveniência apenas para LAN**. O
plugin `bonjour` incluído é responsável pela publicidade em LAN e vem ativado por padrão. Para descoberta entre redes,
o mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado.
A descoberta continua sendo best-effort e **não** substitui conectividade via SSH ou Tailnet.

## Bonjour de área ampla (Unicast DNS-SD) via Tailscale

Se o Node e o Gateway estiverem em redes diferentes, o mDNS multicast não atravessará
esse limite. Você pode manter a mesma UX de descoberta trocando para **DNS‑SD unicast**
("Wide‑Area Bonjour") via Tailscale.

Etapas em alto nível:

1. Execute um servidor DNS no host do Gateway (acessível pela Tailnet).
2. Publique registros DNS‑SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure **split DNS** no Tailscale para que o domínio escolhido resolva por esse
   servidor DNS para os clientes (incluindo iOS).

O OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto em `local.` quanto no domínio de área ampla configurado.

### Configuração do Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // ativa publicação DNS-SD de área ampla
}
```

### Configuração inicial do servidor DNS (host do Gateway)

```bash
openclaw dns setup --apply
```

Isso instala o CoreDNS e o configura para:

- escutar na porta 53 apenas nas interfaces Tailscale do Gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Valide a partir de uma máquina conectada à tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um nameserver apontando para o IP tailnet do Gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse nameserver.

Assim que os clientes aceitarem o DNS da tailnet, Nodes iOS e a descoberta pela CLI poderão navegar
em `_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendada)

A porta WS do Gateway (padrão `18789`) faz bind em loopback por padrão. Para acesso por LAN/tailnet,
faça bind explicitamente e mantenha a autenticação ativada.

Para configurações somente com tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menus no macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast em LAN é
fornecida pelo plugin `bonjour` incluído; a publicação DNS-SD de área ampla continua
sendo responsabilidade do Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por Nodes macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar os fluxos da UI mais convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (WS + HTTP do Gateway)
- `gatewayTls=1` (somente quando TLS está ativado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está ativado e a fingerprint está disponível)
- `canvasPort=<port>` (somente quando o host do canvas está ativado; atualmente igual a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (somente no modo mDNS completo; dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente no modo mDNS completo; DNS-SD de área ampla pode omiti-lo)
- `cliPath=<path>` (somente no modo mDNS completo; DNS-SD de área ampla ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático por SSH também deve usar o host de serviço resolvido, não dicas apenas de TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma fingerprint pela primeira vez.

## Depuração no macOS

Ferramentas úteis integradas:

- Navegar pelas instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se navegar funcionar, mas resolver falhar, normalmente você está enfrentando uma política de LAN
ou um problema no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Depuração no Node iOS

O Node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Ajustes → Gateway → Avançado → **Logs de depuração de descoberta**
- Ajustes → Gateway → Avançado → **Logs de descoberta** → reproduza → **Copiar**

O log inclui transições de estado do browser e mudanças no conjunto de resultados.

## Quando desativar Bonjour

Desative o Bonjour apenas quando a publicidade multicast em LAN estiver indisponível ou for prejudicial.
O caso comum é um Gateway executando por trás de Docker bridge networking, WSL ou uma
política de rede que bloqueia multicast mDNS. Nesses ambientes o Gateway continua
acessível por sua URL publicada, SSH, Tailnet ou DNS-SD de área ampla,
mas a descoberta automática em LAN não é confiável.

Prefira a substituição de ambiente existente quando o problema for delimitado à implantação:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Isso desativa a publicidade multicast em LAN sem alterar a configuração do plugin.
É seguro para imagens Docker, arquivos de serviço, scripts de inicialização e depuração
pontual porque a configuração desaparece quando o ambiente desaparece.

Use configuração de plugin apenas quando você realmente quiser desativar o
plugin de descoberta em LAN incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Armadilhas do Docker

O Docker Compose incluído define `OPENCLAW_DISABLE_BONJOUR=1` para o serviço Gateway
por padrão. Redes bridge do Docker normalmente não encaminham multicast mDNS
(`224.0.0.251:5353`) entre o contêiner e a LAN, então deixar o Bonjour ativado pode
produzir falhas repetidas de `probing` ou `announcing` do ciao sem fazer a descoberta funcionar.

Armadilhas importantes:

- Desativar Bonjour não interrompe o Gateway. Apenas interrompe a publicidade multicast em LAN.
- Desativar Bonjour não altera `gateway.bind`; o Docker ainda usa por padrão
  `OPENCLAW_GATEWAY_BIND=lan` para que a porta publicada do host possa funcionar.
- Desativar Bonjour não desativa o DNS-SD de área ampla. Use descoberta de área ampla
  ou Tailnet quando o Gateway e o Node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não herda o padrão do
  Compose, a menos que o ambiente ainda defina `OPENCLAW_DISABLE_BONJOUR`.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` apenas para host networking, macvlan ou outra
  rede em que o multicast mDNS comprovadamente funcione.

## Solução de problemas com Bonjour desativado

Se um Node deixar de descobrir automaticamente o Gateway após a configuração do Docker:

1. Confirme se o Gateway está suprimindo intencionalmente a publicidade em LAN:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme que o próprio Gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desativado:
   - Control UI ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: Tailnet MagicDNS, IP da Tailnet, túnel SSH ou
     DNS-SD de área ampla

4. Se você ativou deliberadamente o Bonjour no Docker com
   `OPENCLAW_DISABLE_BONJOUR=0`, teste multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a navegação estiver vazia ou os logs do Gateway mostrarem cancelamentos
   repetidos do watchdog do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou
   via Tailnet.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi‑Fi desativam mDNS.
- **Anunciador preso em probing/announcing**: hosts com multicast bloqueado,
  bridges de contêiner, WSL ou churn de interface podem deixar o anunciador ciao em
  um estado não anunciado. O OpenClaw tenta novamente algumas vezes e depois desativa o Bonjour
  para o processo atual do Gateway em vez de reiniciar o anunciador para sempre.
- **Docker bridge networking**: o Docker Compose incluído desativa o Bonjour por
  padrão com `OPENCLAW_DISABLE_BONJOUR=1`. Defina `0` apenas para host,
  macvlan ou outra rede com suporte a mDNS.
- **Suspensão / churn de interface**: o macOS pode temporariamente perder resultados mDNS; tente novamente.
- **Navegar funciona, mas resolver falha**: mantenha nomes de máquina simples (evite emojis ou
  pontuação), depois reinicie o Gateway. O nome da instância de serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS‑SD geralmente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços se tornam `\032`).

- Isso é normal no nível do protocolo.
- UIs devem decodificar para exibição (o iOS usa `BonjourEscapes.decode`).

## Desativação / configuração

- `openclaw plugins disable bonjour` desativa a publicidade multicast em LAN ao desativar o plugin incluído.
- `openclaw plugins enable bonjour` restaura o plugin padrão de descoberta em LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` desativa a publicidade multicast em LAN sem alterar a configuração do plugin; valores truthy aceitos são `1`, `true`, `yes` e `on` (legado: `OPENCLAW_DISABLE_BONJOUR`).
- O Docker Compose define `OPENCLAW_DISABLE_BONJOUR=1` por padrão para bridge networking; substitua com `OPENCLAW_DISABLE_BONJOUR=0` apenas quando multicast mDNS estiver disponível.
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciada (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica de MagicDNS em TXT quando o modo mDNS completo está ativado (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho anunciado da CLI (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Discovery](/pt-BR/gateway/discovery)
- Pareamento e aprovações de Node: [Pareamento do Gateway](/pt-BR/gateway/pairing)
