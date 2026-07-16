---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alteração de tipos de serviço mDNS, registros TXT ou experiência de descoberta
summary: Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-07-16T12:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

O OpenClaw pode usar o Bonjour (mDNS/DNS-SD) para descobrir um gateway ativo (endpoint WebSocket). A busca multicast `local.` é uma **conveniência exclusiva da LAN**: o Plugin `bonjour` incluído é responsável pela publicidade na LAN, iniciando automaticamente em hosts macOS e sendo opcional no Linux, Windows e em implantações de gateway em contêineres. O mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de longa distância configurado para descoberta entre redes. A descoberta funciona em regime de melhor esforço e **não** substitui a conectividade baseada em SSH ou Tailnet.

## Bonjour de longa distância (DNS-SD unicast) pelo Tailscale

Se o Node e o gateway estiverem em redes diferentes, o mDNS multicast não poderá atravessar o limite entre elas. Mantenha a mesma experiência de descoberta alternando para **DNS-SD unicast** ("Bonjour de longa distância") pelo Tailscale:

1. Execute um servidor DNS no host do gateway, acessível pela Tailnet.
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada (exemplo: `openclaw.internal.`).
3. Configure o **DNS dividido** do Tailscale para que o domínio escolhido seja resolvido por esse servidor DNS para os clientes, incluindo o iOS.

O `openclaw.internal.` acima é apenas um exemplo — o OpenClaw aceita qualquer domínio de descoberta. Os Nodes iOS/Android buscam tanto em `local.` quanto no domínio de longa distância configurado.

### Configuração do Gateway

```json5
{
  gateway: { bind: "tailnet" }, // somente Tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` também aceita a variável de ambiente `OPENCLAW_WIDE_AREA_DOMAIN` como alternativa quando não está definido.

### Configuração única do servidor DNS (host do gateway, somente macOS)

```bash
openclaw dns setup --apply
```

Esse comando é exclusivo do macOS e requer o Homebrew e uma conexão ativa com o Tailscale. Ele instala o CoreDNS (`brew install coredns`) e o configura para:

- escutar na porta 53 somente nas interfaces Tailscale do gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Primeiro, execute sem `--apply` para visualizar o plano (domínio, caminho do arquivo de zona, IP da Tailnet detectado e configuração recomendada) sem instalar nada.

Valide em uma máquina conectada à Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um servidor de nomes que aponte para o IP da Tailnet do gateway (UDP/TCP 53).
- Adicione o DNS dividido para que seu domínio de descoberta use esse servidor de nomes.

Depois que os clientes aceitarem o DNS da Tailnet, os Nodes iOS e a descoberta pela CLI poderão buscar `_openclaw-gw._tcp` no domínio de descoberta sem multicast.

### Segurança do listener do Gateway

Por padrão, a porta WS do gateway (`18789`) é vinculada à interface de loopback. Para acesso por LAN/Tailnet, configure explicitamente o vínculo e mantenha a autenticação ativada. Para configurações exclusivas da Tailnet, defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json` e reinicie o gateway (ou o aplicativo da barra de menus do macOS).

## O que é anunciado

Somente o gateway anuncia `_openclaw-gw._tcp`. A publicidade multicast na LAN vem do Plugin `bonjour` incluído quando ele está ativado; a publicação de DNS-SD de longa distância continua sob responsabilidade do gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` - beacon de transporte do gateway, usado pelos Nodes macOS/iOS/Android.

## Chaves TXT (dicas não confidenciais)

| Chave                         | Quando está presente                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `role=gateway`                | Sempre.                                                                         |
| `displayName=<friendly name>` | Sempre.                                                                         |
| `lanHost=<hostname>.local`    | Sempre.                                                                         |
| `gatewayPort=<port>`          | Sempre (WS + HTTP do gateway).                                                   |
| `transport=gateway`           | Sempre.                                                                         |
| `gatewayTls=1`                | Somente quando o TLS está ativado.                                               |
| `gatewayTlsSha256=<sha256>`   | Somente quando o TLS está ativado e uma impressão digital está disponível.       |
| `gatewayDirectReachable=1`    | Somente quando o gateway está diretamente acessível (não apenas por um caminho de retransmissão/proxy). |
| `canvasPort=<port>`           | Somente quando o host de canvas está ativado; atualmente, é igual a `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Somente no modo completo do mDNS; dica opcional quando a Tailnet está disponível. |
| `sshPort=<port>`              | Somente no modo completo; omitida nos modos mínimo e desativado.                 |
| `cliPath=<path>`              | Somente no modo completo; omitida nos modos mínimo e desativado.                 |

Observações de segurança:

- Os registros TXT do Bonjour/mDNS **não são autenticados**. Os clientes não devem tratar os dados TXT como roteamento autoritativo.
- Os clientes devem fazer o roteamento usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático por SSH também deve usar o host de serviço resolvido, não dicas somente de TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma fixação armazenada anteriormente.
- Os Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **exclusivas de TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

## Depuração no macOS

Ferramentas integradas:

```bash
# Buscar instâncias
dns-sd -B _openclaw-gw._tcp local.

# Resolver uma instância (substitua <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Se a busca funcionar, mas a resolução falhar, geralmente o problema está em uma política da LAN ou no resolvedor mDNS.

## Depuração nos logs do Gateway

O gateway grava um arquivo de log rotativo (exibido na inicialização como `gateway log file: ...`). Procure linhas com `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

O OpenClaw inicia cada serviço Bonjour uma vez e deixa a sondagem, as novas tentativas, a resolução de conflitos de nome e a republicação após mudanças de interface a cargo do respondente mDNS. Isso evita tentativas de publicação sobrepostas durante alterações normais da rede. Mensagens internas repetidas de autossondagem são suprimidas para impedir que inundem o log do gateway.

Quando vários gateways OpenClaw anunciam a partir do mesmo host, o Bonjour pode acrescentar sufixos como `(2)` ou `(3)` para manter os nomes das instâncias de serviço exclusivos. Esses sufixos são parte normal da resolução de conflitos e não indicam supervisão OCM duplicada.

O Bonjour usa o nome de host do sistema para o host `.local` anunciado quando ele é um rótulo DNS válido. Se o nome de host do sistema contiver espaços, sublinhados ou outro caractere inválido para rótulos DNS, o OpenClaw usará `openclaw.local` como alternativa. Defina `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o gateway quando precisar de um rótulo de host explícito.

## Depuração no Node iOS

O Node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs: Settings -> Gateway -> Advanced -> **Discovery Debug Logs** e, em seguida, Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduza o problema -> **Copy**. O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando ativar o Bonjour

O Bonjour inicia automaticamente quando o gateway é iniciado com uma configuração vazia em hosts macOS, pois o aplicativo local e os Nodes iOS/Android próximos normalmente dependem da descoberta na mesma LAN.

Ative-o explicitamente quando a descoberta automática na mesma LAN for útil no Linux, Windows ou em outro host que não seja macOS:

```bash
openclaw plugins enable bonjour
```

Quando ativado, o Bonjour usa `discovery.mdns.mode` para decidir quantos metadados TXT publicar; o mesmo modo controla dicas TXT opcionais nos registros DNS-SD de longa distância. Modos:

| Modo                | Comportamento                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (padrão) | Somente as chaves TXT principais; omite `sshPort`, `cliPath`, `tailnetDns`.                                                                                              |
| `full`              | Adiciona `sshPort`, `cliPath`, `tailnetDns` — use quando os clientes precisarem dessas dicas.                                                                             |
| `off`               | Suprime o multicast da LAN sem alterar a ativação do Plugin; o DNS-SD de longa distância ainda pode publicar o beacon mínimo quando `discovery.wideArea.enabled` for verdadeiro. |

## Quando desativar o Bonjour

Mantenha o Bonjour desativado quando a publicidade multicast na LAN for desnecessária, indisponível ou prejudicial — casos comuns incluem servidores que não sejam macOS, redes bridge do Docker, WSL ou uma política de rede que descarte multicast mDNS. O gateway continua acessível pela URL publicada, por SSH, Tailnet ou DNS-SD de longa distância; somente a descoberta automática na LAN fica indisponível.

Use a substituição por variável de ambiente para problemas específicos da implantação (é segura para imagens do Docker, arquivos de serviço, scripts de inicialização e depuração pontual — ela desaparece quando o ambiente deixa de existir):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Use a configuração do Plugin quando quiser desativar intencionalmente o Plugin de descoberta na LAN incluído nessa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Armadilhas do Docker

O Plugin Bonjour incluído desativa automaticamente a publicidade multicast na LAN em contêineres detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. Em geral, as redes bridge do Docker não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner e a LAN, portanto anunciar a partir do contêiner raramente faz a descoberta funcionar.

Armadilhas:

- O Bonjour inicia automaticamente em hosts macOS e é opcional nos demais. Mantê-lo desativado não interrompe o gateway — apenas ignora a publicidade multicast na LAN.
- Desativar o Bonjour não altera `gateway.bind`; o Docker continua usando `OPENCLAW_GATEWAY_BIND=lan` por padrão para que a porta publicada do host funcione.
- Desativar o Bonjour não desativa o DNS-SD de longa distância. Use a descoberta de longa distância ou a Tailnet quando o gateway e o Node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não mantém a política de desativação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para redes do host, macvlan ou outra rede na qual se saiba que o multicast mDNS passa; defina-o como `1` para forçar a desativação.

## Solução de problemas com o Bonjour desativado

Se um Node deixar de descobrir automaticamente o gateway após a configuração do Docker:

1. Confirme se o gateway está em modo automático, forçadamente ativado ou forçadamente desativado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme se o próprio gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desativado:
   - UI de controle ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes da LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou DNS-SD de longa distância

4. Se o Plugin Bonjour tiver sido ativado intencionalmente no Docker e a publicidade tiver sido forçada com `OPENCLAW_DISABLE_BONJOUR=0`, teste o multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a busca não retornar resultados ou se os logs do Gateway mostrarem falhas repetidas de sondagem do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou pela Tailnet.

## Modos de falha comuns

- **O Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desativam o mDNS.
- **Anunciante travado em sondagem/anúncio**: hosts com multicast bloqueado, bridges de contêineres, WSL ou mudanças frequentes de interface podem deixar o respondente em um estado não anunciado. O Gateway permanece disponível por rotas diretas, SSH, Tailnet ou DNS-SD de longa distância; desative o Bonjour da LAN com `discovery.mdns.mode: "off"` ou `OPENCLAW_DISABLE_BONJOUR=1` quando o multicast não estiver disponível.
- **Rede bridge do Docker**: o Bonjour é desativado automaticamente nos contêineres detectados. Defina `OPENCLAW_DISABLE_BONJOUR=0` apenas para host, macvlan ou outra rede compatível com mDNS.
- **Suspensão/mudanças frequentes de interface**: o macOS pode interromper temporariamente os resultados de mDNS; tente novamente.
- **A busca funciona, mas a resolução falha**: mantenha os nomes das máquinas simples (evite emojis ou pontuação) e reinicie o Gateway. O nome da instância de serviço é derivado do nome do host, portanto nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instâncias com escape (`\032`)

O Bonjour/DNS-SD frequentemente aplica escape aos bytes nos nomes das instâncias de serviço como sequências decimais `\DDD` (espaços se tornam `\032`). Isso é normal no nível do protocolo; as interfaces devem decodificá-las para exibição (o iOS usa `BonjourEscapes.decode`).

## Ativação / desativação / configuração

| Configuração                                         | Efeito                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Ativa o Plugin integrado de descoberta de LAN nos hosts em que ele não é ativado por padrão. |
| `openclaw plugins disable bonjour`                   | Desativa a publicidade multicast da LAN ao desativar o Plugin integrado.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (ou `true`/`yes`/`on`)  | Desativa a publicidade multicast da LAN sem alterar a configuração do Plugin.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (ou `false`/`no`/`off`) | Força a ativação da publicidade multicast da LAN, inclusive dentro dos contêineres detectados.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (padrão) \| `full` — consulte os modos acima.                         |
| `gateway.bind`                                       | Controla o modo de vinculação do Gateway em `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Substitui a porta SSH quando `sshPort` é anunciado (modo completo).                  |
| `OPENCLAW_TAILNET_DNS`                               | Publica uma indicação do MagicDNS no TXT quando o modo completo de mDNS está ativado.                  |
| `OPENCLAW_CLI_PATH`                                  | Substitui o caminho da CLI anunciado (modo completo).                                    |

Por padrão, os hosts macOS iniciam automaticamente o Plugin integrado de descoberta de LAN. Quando o Plugin Bonjour está ativado e `OPENCLAW_DISABLE_BONJOUR` não está definido, o Bonjour anuncia em hosts normais e é desativado automaticamente dentro dos contêineres detectados (Docker, máquinas Fly.io e ambientes de execução de contêineres comuns).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de Node + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
