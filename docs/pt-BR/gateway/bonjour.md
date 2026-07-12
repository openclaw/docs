---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alteração dos tipos de serviço mDNS, dos registros TXT ou da experiência de descoberta
summary: Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta do Bonjour
x-i18n:
    generated_at: "2026-07-11T23:54:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

O OpenClaw pode usar o Bonjour (mDNS/DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket). A busca multicast em `local.` é uma **conveniência restrita à LAN**: o Plugin `bonjour` incluído é responsável pelo anúncio na LAN, iniciando automaticamente em hosts macOS e sendo opcional no Linux, Windows e em implantações de Gateway em contêineres. O mesmo sinalizador também pode ser publicado por meio de um domínio DNS-SD de longa distância configurado para descoberta entre redes. A descoberta funciona na medida do possível e **não** substitui a conectividade baseada em SSH ou Tailnet.

## Bonjour de longa distância (DNS-SD unicast) pelo Tailscale

Se o Node e o Gateway estiverem em redes diferentes, o mDNS multicast não poderá atravessar o limite entre elas. Mantenha a mesma experiência de descoberta mudando para **DNS-SD unicast** ("Bonjour de longa distância") pelo Tailscale:

1. Execute um servidor DNS no host do Gateway, acessível pela Tailnet.
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada (exemplo: `openclaw.internal.`).
3. Configure o **split DNS** do Tailscale para que o domínio escolhido seja resolvido por esse servidor DNS para os clientes, incluindo o iOS.

O `openclaw.internal.` acima é apenas um exemplo — o OpenClaw aceita qualquer domínio de descoberta. Os Nodes iOS/Android buscam tanto em `local.` quanto no domínio de longa distância configurado.

### Configuração do Gateway

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` também aceita a variável de ambiente `OPENCLAW_WIDE_AREA_DOMAIN` como alternativa quando não estiver definido.

### Configuração única do servidor DNS (host do Gateway, somente macOS)

```bash
openclaw dns setup --apply
```

Este comando está disponível somente no macOS e exige o Homebrew e uma conexão ativa com o Tailscale. Ele instala o CoreDNS (`brew install coredns`) e o configura para:

- escutar na porta 53 somente nas interfaces do Tailscale do Gateway
- atender ao domínio escolhido (exemplo: `openclaw.internal.`) usando `~/.openclaw/dns/<domain>.db`

Primeiro, execute sem `--apply` para visualizar o plano (domínio, caminho do arquivo de zona, IP da Tailnet detectado e configuração recomendada) sem instalar nada.

Valide em uma máquina conectada à Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um servidor de nomes que aponte para o IP da Tailnet do Gateway (UDP/TCP 53).
- Adicione o split DNS para que seu domínio de descoberta use esse servidor de nomes.

Depois que os clientes aceitarem o DNS da Tailnet, os Nodes iOS e a descoberta pela CLI poderão buscar `_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway

Por padrão, a porta WS do Gateway (`18789`) é vinculada ao local loopback. Para acesso pela LAN/Tailnet, configure o vínculo explicitamente e mantenha a autenticação habilitada. Para configurações restritas à Tailnet, defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json` e reinicie o Gateway (ou o aplicativo da barra de menus do macOS).

## O que faz anúncios

Somente o Gateway anuncia `_openclaw-gw._tcp`. O anúncio multicast na LAN é feito pelo Plugin `bonjour` incluído quando está habilitado; a publicação DNS-SD de longa distância continua sob responsabilidade do Gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` - sinalizador de transporte do Gateway, usado por Nodes macOS/iOS/Android.

## Chaves TXT (dicas não secretas)

| Chave                         | Quando está presente                                                          |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Sempre.                                                                        |
| `displayName=<friendly name>` | Sempre.                                                                        |
| `lanHost=<hostname>.local`    | Sempre.                                                                        |
| `gatewayPort=<port>`          | Sempre (WS + HTTP do Gateway).                                                  |
| `transport=gateway`           | Sempre.                                                                        |
| `gatewayTls=1`                | Somente quando o TLS está habilitado.                                           |
| `gatewayTlsSha256=<sha256>`   | Somente quando o TLS está habilitado e há uma impressão digital disponível.     |
| `gatewayDirectReachable=1`    | Somente quando o Gateway está diretamente acessível (não apenas por um caminho de retransmissão/proxy). |
| `canvasPort=<port>`           | Somente quando o host do canvas está habilitado; atualmente é igual a `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Somente no modo mDNS completo; dica opcional quando a Tailnet está disponível.  |
| `sshPort=<port>`              | Somente no modo completo; omitida nos modos mínimo e desativado.                |
| `cliPath=<path>`              | Somente no modo completo; omitida nos modos mínimo e desativado.                |

Observações de segurança:

- Os registros TXT do Bonjour/mDNS **não são autenticados**. Os clientes não devem tratar o TXT como fonte autoritativa de roteamento.
- Os clientes devem fazer o roteamento usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- A seleção automática do destino SSH também deve usar o host de serviço resolvido, e não dicas provenientes apenas do TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua uma fixação armazenada anteriormente.
- Os Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **restritas a TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

## Depuração no macOS

Ferramentas integradas:

```bash
# Buscar instâncias
dns-sd -B _openclaw-gw._tcp local.

# Resolver uma instância (substitua <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Se a busca funcionar, mas a resolução falhar, geralmente há um problema na política da LAN ou no resolvedor mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (exibido na inicialização como `gateway log file: ...`). Procure linhas com `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

O watchdog trata estados ativos de `probing`, `announcing` e renomeações recentes por conflito como estados em andamento. Se o serviço nunca atingir `announced`, o OpenClaw recriará o anunciante e, após falhas repetidas, desabilitará o Bonjour para esse processo do Gateway, em vez de continuar anunciando indefinidamente.

O Bonjour usa o nome de host do sistema como host `.local` anunciado quando ele é um rótulo DNS válido. Se o nome de host do sistema contiver espaços, sublinhados ou outro caractere inválido para rótulos DNS, o OpenClaw usará `openclaw.local` como alternativa. Defina `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o Gateway quando precisar de um rótulo de host explícito.

## Depuração no Node iOS

O Node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs: Settings -> Gateway -> Advanced -> **Discovery Debug Logs** e, em seguida, Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduza o problema -> **Copy**. O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando habilitar o Bonjour

O Bonjour inicia automaticamente quando o Gateway é iniciado sem configuração em hosts macOS, pois o aplicativo local e os Nodes iOS/Android próximos normalmente dependem da descoberta na mesma LAN.

Habilite-o explicitamente quando a descoberta automática na mesma LAN for útil no Linux, Windows ou em outro host que não seja macOS:

```bash
openclaw plugins enable bonjour
```

Quando habilitado, o Bonjour usa `discovery.mdns.mode` para decidir quantos metadados TXT publicar; o mesmo modo controla as dicas TXT opcionais nos registros DNS-SD de longa distância. Modos:

| Modo                | Comportamento                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (padrão)  | Somente as chaves TXT principais; omite `sshPort`, `cliPath` e `tailnetDns`.                                                                                  |
| `full`              | Adiciona `sshPort`, `cliPath` e `tailnetDns` — use quando os clientes precisarem dessas dicas.                                                                 |
| `off`               | Suprime o multicast na LAN sem alterar a habilitação do Plugin; o DNS-SD de longa distância ainda pode publicar o sinalizador mínimo quando `discovery.wideArea.enabled` for `true`. |

## Quando desabilitar o Bonjour

Mantenha o Bonjour desabilitado quando o anúncio multicast na LAN for desnecessário, indisponível ou prejudicial — casos comuns incluem servidores que não usam macOS, redes bridge do Docker, WSL ou uma política de rede que bloqueia multicast mDNS. O Gateway continuará acessível por sua URL publicada, SSH, Tailnet ou DNS-SD de longa distância; apenas a descoberta automática na LAN ficará indisponível ou não será confiável.

Use a substituição por variável de ambiente para problemas específicos da implantação (segura para imagens Docker, arquivos de serviço, scripts de inicialização e depuração pontual — ela desaparece quando o ambiente deixa de existir):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Use a configuração do Plugin quando quiser desativar intencionalmente o Plugin de descoberta na LAN incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Armadilhas do Docker

O Plugin Bonjour incluído desabilita automaticamente o anúncio multicast na LAN em contêineres detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. As redes bridge do Docker geralmente não encaminham multicast mDNS (`224.0.0.251:5353`) entre o contêiner e a LAN; portanto, anunciar a partir do contêiner raramente faz a descoberta funcionar.

Armadilhas:

- O Bonjour inicia automaticamente em hosts macOS e é opcional nos demais sistemas. Mantê-lo desabilitado não interrompe o Gateway — apenas ignora o anúncio multicast na LAN.
- Desabilitar o Bonjour não altera `gateway.bind`; o Docker ainda usa `OPENCLAW_GATEWAY_BIND=lan` por padrão para que a porta publicada do host funcione.
- Desabilitar o Bonjour não desabilita o DNS-SD de longa distância. Use a descoberta de longa distância ou a Tailnet quando o Gateway e o Node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não mantém a política de desabilitação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para rede do host, macvlan ou outra rede na qual o multicast mDNS comprovadamente passe; defina como `1` para forçar a desabilitação.

## Solução de problemas do Bonjour desabilitado

Se um Node não descobrir mais o Gateway automaticamente após a configuração do Docker:

1. Confirme se o Gateway está sendo executado no modo automático, forçadamente habilitado ou forçadamente desabilitado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme se o próprio Gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desabilitado:
   - Interface de controle ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes da LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou DNS-SD de longa distância

4. Se você habilitou deliberadamente o Plugin Bonjour no Docker e forçou o anúncio com `OPENCLAW_DISABLE_BONJOUR=0`, teste o multicast no host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a busca não retornar resultados ou se os logs do Gateway mostrarem cancelamentos repetidos do watchdog do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou pela Tailnet.

## Modos comuns de falha

- **O Bonjour não atravessa redes**: use a Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desabilitam o mDNS.
- **Anunciante travado em sondagem/anúncio**: hosts com multicast bloqueado, pontes de contêiner, WSL ou alterações frequentes de interface podem deixar o anunciante ciao em um estado não anunciado. O OpenClaw tenta novamente algumas vezes e, depois, desabilita o Bonjour para o processo atual do Gateway, em vez de reiniciar o anunciante indefinidamente.
- **Rede em ponte do Docker**: o Bonjour é desabilitado automaticamente em contêineres detectados. Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para redes de host, macvlan ou outra rede compatível com mDNS.
- **Suspensão/alterações frequentes de interface**: o macOS pode interromper temporariamente os resultados de mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha os nomes das máquinas simples (evite emojis ou pontuação) e reinicie o Gateway. O nome da instância do serviço deriva do nome do host, portanto, nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância com escape (`\032`)

O Bonjour/DNS-SD frequentemente representa bytes em nomes de instâncias de serviço como sequências decimais `\DDD` com escape (espaços se tornam `\032`). Isso é normal no nível do protocolo; as interfaces devem decodificá-las para exibição (o iOS usa `BonjourEscapes.decode`).

## Ativação / desativação / configuração

| Configuração                                         | Efeito                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Ativa o plugin integrado de descoberta na LAN em hosts nos quais ele não está ativado por padrão.              |
| `openclaw plugins disable bonjour`                   | Desativa o anúncio multicast na LAN ao desabilitar o plugin integrado.                                         |
| `OPENCLAW_DISABLE_BONJOUR=1` (ou `true`/`yes`/`on`)  | Desativa o anúncio multicast na LAN sem alterar a configuração do plugin.                                       |
| `OPENCLAW_DISABLE_BONJOUR=0` (ou `false`/`no`/`off`) | Força a ativação do anúncio multicast na LAN, inclusive dentro de contêineres detectados.                       |
| `discovery.mdns.mode`                                | `off` \| `minimal` (padrão) \| `full` — consulte os modos acima.                                                |
| `gateway.bind`                                       | Controla o modo de vinculação do Gateway em `~/.openclaw/openclaw.json`.                                        |
| `OPENCLAW_SSH_PORT`                                  | Substitui a porta SSH quando `sshPort` é anunciado (modo completo).                                             |
| `OPENCLAW_TAILNET_DNS`                               | Publica uma indicação do MagicDNS em TXT quando o modo completo de mDNS está ativado.                           |
| `OPENCLAW_CLI_PATH`                                  | Substitui o caminho da CLI anunciado (modo completo).                                                           |

Por padrão, hosts macOS iniciam automaticamente o plugin integrado de descoberta na LAN. Quando o plugin Bonjour está ativado e `OPENCLAW_DISABLE_BONJOUR` não está definido, o Bonjour anuncia em hosts normais e é desabilitado automaticamente dentro de contêineres detectados (Docker, máquinas Fly.io e ambientes de execução de contêineres comuns).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de Node e aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
