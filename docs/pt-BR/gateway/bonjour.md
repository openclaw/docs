---
read_when:
    - Depuração de problemas de descoberta do Bonjour no macOS/iOS
    - Alteração de tipos de serviço mDNS, registros TXT ou experiência de descoberta
summary: Descoberta via Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-07-12T15:13:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

O OpenClaw pode usar o Bonjour (mDNS/DNS-SD) para descobrir um gateway ativo (endpoint WebSocket). A busca multicast em `local.` é uma **conveniência exclusiva da LAN**: o plugin `bonjour` incluído é responsável pela divulgação na LAN, iniciando automaticamente em hosts macOS e mediante ativação no Linux, Windows e em implantações de gateway em contêineres. O mesmo sinalizador também pode ser publicado por meio de um domínio DNS-SD de longa distância configurado para descoberta entre redes. A descoberta é feita em regime de melhor esforço e **não** substitui a conectividade baseada em SSH ou Tailnet.

## Bonjour de longa distância (DNS-SD unicast) pelo Tailscale

Se o Node e o gateway estiverem em redes diferentes, o mDNS multicast não poderá atravessar o limite. Mantenha a mesma experiência de descoberta mudando para **DNS-SD unicast** ("Bonjour de longa distância") pelo Tailscale:

1. Execute um servidor DNS no host do gateway, acessível pela Tailnet.
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada (exemplo: `openclaw.internal.`).
3. Configure o **DNS dividido** do Tailscale para que o domínio escolhido seja resolvido por esse servidor DNS para os clientes, incluindo o iOS.

O `openclaw.internal.` acima é apenas um exemplo — o OpenClaw aceita qualquer domínio de descoberta. Os Nodes iOS/Android buscam tanto em `local.` quanto no domínio de longa distância configurado.

### Configuração do gateway

```json5
{
  gateway: { bind: "tailnet" }, // somente Tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` também aceita a variável de ambiente `OPENCLAW_WIDE_AREA_DOMAIN` como alternativa quando não estiver definido.

### Configuração única do servidor DNS (host do gateway, somente macOS)

```bash
openclaw dns setup --apply
```

Este comando é exclusivo do macOS e requer o Homebrew e uma conexão ativa com o Tailscale. Ele instala o CoreDNS (`brew install coredns`) e o configura para:

- escutar na porta 53 somente nas interfaces do Tailscale do gateway
- servir o domínio escolhido (exemplo: `openclaw.internal.`) a partir de `~/.openclaw/dns/<domain>.db`

Execute primeiro sem `--apply` para visualizar o plano (domínio, caminho do arquivo de zona, IP da Tailnet detectado, configuração recomendada) sem instalar nada.

Valide a partir de uma máquina conectada à Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um servidor de nomes que aponte para o IP da Tailnet do gateway (UDP/TCP 53).
- Adicione DNS dividido para que o domínio de descoberta use esse servidor de nomes.

Depois que os clientes aceitarem o DNS da Tailnet, os Nodes iOS e a descoberta pela CLI poderão buscar `_openclaw-gw._tcp` no domínio de descoberta sem multicast.

### Segurança do listener do gateway

A porta WS do gateway (padrão `18789`) é vinculada ao loopback por padrão. Para acesso pela LAN/Tailnet, configure a vinculação explicitamente e mantenha a autenticação ativada. Para configurações exclusivas da Tailnet, defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json` e reinicie o gateway (ou o aplicativo da barra de menus do macOS).

## O que é divulgado

Somente o gateway divulga `_openclaw-gw._tcp`. A divulgação multicast na LAN vem do plugin `bonjour` incluído quando ele está ativado; a publicação DNS-SD de longa distância continua sob responsabilidade do gateway.

## Tipos de serviço

- `_openclaw-gw._tcp` - sinalizador de transporte do gateway, usado pelos Nodes macOS/iOS/Android.

## Chaves TXT (dicas não secretas)

| Chave                         | Quando está presente                                                           |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Sempre.                                                                        |
| `displayName=<friendly name>` | Sempre.                                                                        |
| `lanHost=<hostname>.local`    | Sempre.                                                                        |
| `gatewayPort=<port>`          | Sempre (WS + HTTP do gateway).                                                  |
| `transport=gateway`           | Sempre.                                                                        |
| `gatewayTls=1`                | Somente quando o TLS está ativado.                                              |
| `gatewayTlsSha256=<sha256>`   | Somente quando o TLS está ativado e uma impressão digital está disponível.     |
| `gatewayDirectReachable=1`    | Somente quando o gateway está diretamente acessível (não apenas por um caminho de retransmissão/proxy). |
| `canvasPort=<port>`           | Somente quando o host do canvas está ativado; atualmente, é igual a `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Somente no modo mDNS completo; dica opcional quando a Tailnet está disponível. |
| `sshPort=<port>`              | Somente no modo completo; omitida nos modos mínimo e desativado.               |
| `cliPath=<path>`              | Somente no modo completo; omitida nos modos mínimo e desativado.               |

Observações de segurança:

- Os registros TXT do Bonjour/mDNS **não são autenticados**. Os clientes não devem considerar o TXT como uma fonte autoritativa de roteamento.
- Os clientes devem fazer o roteamento usando o endpoint de serviço resolvido (SRV + A/AAAA). Considere `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- A seleção automática do destino SSH também deve usar o host de serviço resolvido, não dicas provenientes apenas do TXT.
- A fixação de TLS nunca deve permitir que um `gatewayTlsSha256` divulgado substitua uma fixação armazenada anteriormente.
- Os Nodes iOS/Android devem considerar conexões diretas baseadas em descoberta como **exclusivas de TLS** e exigir confirmação explícita do usuário antes de confiar em uma impressão digital pela primeira vez.

## Depuração no macOS

Ferramentas integradas:

```bash
# Buscar instâncias
dns-sd -B _openclaw-gw._tcp local.

# Resolver uma instância (substitua <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Se a busca funcionar, mas a resolução falhar, geralmente há um problema com a política da LAN ou com o resolvedor mDNS.

## Depuração nos logs do Gateway

O gateway grava um arquivo de log rotativo (exibido na inicialização como `gateway log file: ...`). Procure linhas com `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

O watchdog considera `probing` e `announcing` ativos, além de renomeações recentes por conflito, como estados em andamento. Se o serviço nunca atingir `announced`, o OpenClaw recriará o divulgador e, após falhas repetidas, desativará o Bonjour para esse processo do gateway em vez de continuar divulgando novamente para sempre.

O Bonjour usa o nome de host do sistema como o host `.local` divulgado quando ele é um rótulo DNS válido. Se o nome de host do sistema contiver espaços, sublinhados ou outro caractere inválido para rótulos DNS, o OpenClaw usará `openclaw.local` como alternativa. Defina `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar o gateway quando precisar de um rótulo de host explícito.

## Depuração no Node iOS

O Node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs: Settings -> Gateway -> Advanced -> **Discovery Debug Logs** e, em seguida, Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduza o problema -> **Copy**. O log inclui transições de estado do navegador e alterações no conjunto de resultados.

## Quando ativar o Bonjour

O Bonjour inicia automaticamente na inicialização de um gateway com configuração vazia em hosts macOS, pois o aplicativo local e os Nodes iOS/Android próximos geralmente dependem da descoberta na mesma LAN.

Ative-o explicitamente quando a descoberta automática na mesma LAN for útil no Linux, Windows ou em outro host que não seja macOS:

```bash
openclaw plugins enable bonjour
```

Quando ativado, o Bonjour usa `discovery.mdns.mode` para decidir quantos metadados TXT publicar; o mesmo modo controla dicas TXT opcionais nos registros DNS-SD de longa distância. Modos:

| Modo                | Comportamento                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (padrão)  | Somente as chaves TXT principais; omite `sshPort`, `cliPath`, `tailnetDns`.                                                                                    |
| `full`              | Adiciona `sshPort`, `cliPath`, `tailnetDns` — use quando os clientes precisarem dessas dicas.                                                                  |
| `off`               | Suprime o multicast na LAN sem alterar a ativação do plugin; o DNS-SD de longa distância ainda pode publicar o sinalizador mínimo quando `discovery.wideArea.enabled` for verdadeiro. |

## Quando desativar o Bonjour

Mantenha o Bonjour desativado quando a divulgação multicast na LAN for desnecessária, estiver indisponível ou for prejudicial — casos comuns incluem servidores que não sejam macOS, redes bridge do Docker, WSL ou uma política de rede que descarte o multicast mDNS. O gateway continua acessível por sua URL publicada, SSH, Tailnet ou DNS-SD de longa distância; apenas a descoberta automática na LAN fica pouco confiável.

Use a substituição por variável de ambiente para problemas específicos da implantação (segura para imagens Docker, arquivos de serviço, scripts de inicialização e depuração pontual — ela desaparece quando o ambiente deixa de existir):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Use a configuração do plugin quando quiser desativar intencionalmente o plugin de descoberta na LAN incluído para essa configuração do OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Armadilhas do Docker

O plugin Bonjour incluído desativa automaticamente a divulgação multicast na LAN em contêineres detectados quando `OPENCLAW_DISABLE_BONJOUR` não está definido. As redes bridge do Docker geralmente não encaminham o multicast mDNS (`224.0.0.251:5353`) entre o contêiner e a LAN, portanto, a divulgação a partir do contêiner raramente faz a descoberta funcionar.

Armadilhas:

- O Bonjour inicia automaticamente em hosts macOS e exige ativação em outros ambientes. Mantê-lo desativado não interrompe o gateway — apenas ignora a divulgação multicast na LAN.
- Desativar o Bonjour não altera `gateway.bind`; o Docker ainda usa `OPENCLAW_GATEWAY_BIND=lan` por padrão para que a porta publicada do host funcione.
- Desativar o Bonjour não desativa o DNS-SD de longa distância. Use a descoberta de longa distância ou a Tailnet quando o gateway e o Node não estiverem na mesma LAN.
- Reutilizar o mesmo `OPENCLAW_CONFIG_DIR` fora do Docker não mantém a política de desativação automática do contêiner.
- Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para rede do host, macvlan ou outra rede em que se saiba que o multicast mDNS é encaminhado; defina-o como `1` para forçar a desativação.

## Solução de problemas com o Bonjour desativado

Se um Node deixar de descobrir automaticamente o gateway após a configuração do Docker:

1. Confirme se o gateway está sendo executado no modo automático, forçadamente ativado ou forçadamente desativado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme se o próprio gateway está acessível pela porta publicada:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use um destino direto quando o Bonjour estiver desativado:
   - Interface de controle ou ferramentas locais: `http://127.0.0.1:18789`
   - Clientes da LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS da Tailnet, IP da Tailnet, túnel SSH ou DNS-SD de longa distância

4. Se você ativou deliberadamente o plugin Bonjour no Docker e forçou a divulgação com `OPENCLAW_DISABLE_BONJOUR=0`, teste o multicast a partir do host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se a busca não retornar resultados ou os logs do Gateway mostrarem cancelamentos repetidos do watchdog do ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` e use uma rota direta ou pela Tailnet.

## Modos de falha comuns

- **O Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi-Fi desativam o mDNS.
- **Anunciante travado na sondagem/divulgação**: hosts com multicast bloqueado, bridges de contêiner, WSL ou mudanças frequentes de interface podem deixar o anunciante ciao em um estado não anunciado. O OpenClaw tenta novamente algumas vezes e, em seguida, desativa o Bonjour no processo atual do Gateway, em vez de reiniciar o anunciante indefinidamente.
- **Rede com bridge do Docker**: o Bonjour é desativado automaticamente em contêineres detectados. Defina `OPENCLAW_DISABLE_BONJOUR=0` somente para redes host, macvlan ou outra rede compatível com mDNS.
- **Suspensão/mudanças de interface**: o macOS pode perder temporariamente os resultados de mDNS; tente novamente.
- **A navegação funciona, mas a resolução falha**: mantenha os nomes das máquinas simples (evite emojis ou pontuação) e reinicie o Gateway. O nome da instância do serviço é derivado do nome do host; portanto, nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância com escape (`\032`)

O Bonjour/DNS-SD frequentemente representa bytes com escape nos nomes de instâncias de serviço como sequências decimais `\DDD` (espaços se tornam `\032`). Isso é normal no nível do protocolo; as interfaces devem decodificá-las para exibição (o iOS usa `BonjourEscapes.decode`).

## Ativação / desativação / configuração

| Configuração                                         | Efeito                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Ativa o Plugin integrado de descoberta de LAN em hosts nos quais ele não está ativado por padrão.         |
| `openclaw plugins disable bonjour`                   | Desativa a divulgação multicast na LAN desativando o Plugin integrado.                                    |
| `OPENCLAW_DISABLE_BONJOUR=1` (ou `true`/`yes`/`on`)  | Desativa a divulgação multicast na LAN sem alterar a configuração do Plugin.                              |
| `OPENCLAW_DISABLE_BONJOUR=0` (ou `false`/`no`/`off`) | Força a ativação da divulgação multicast na LAN, inclusive dentro de contêineres detectados.               |
| `discovery.mdns.mode`                                | `off` \| `minimal` (padrão) \| `full` — consulte os modos acima.                                          |
| `gateway.bind`                                       | Controla o modo de vinculação do Gateway em `~/.openclaw/openclaw.json`.                                  |
| `OPENCLAW_SSH_PORT`                                  | Substitui a porta SSH quando `sshPort` é divulgado (modo completo).                                       |
| `OPENCLAW_TAILNET_DNS`                               | Publica uma indicação de MagicDNS em TXT quando o modo completo de mDNS está ativado.                      |
| `OPENCLAW_CLI_PATH`                                  | Substitui o caminho da CLI divulgado (modo completo).                                                      |

Por padrão, os hosts macOS iniciam automaticamente o Plugin integrado de descoberta de LAN. Quando o Plugin Bonjour está ativado e `OPENCLAW_DISABLE_BONJOUR` não está definido, o Bonjour faz a divulgação em hosts normais e é desativado automaticamente dentro de contêineres detectados (Docker, máquinas Fly.io e ambientes de execução de contêineres comuns).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Descoberta](/pt-BR/gateway/discovery)
- Pareamento de Node + aprovações: [Pareamento do Gateway](/pt-BR/gateway/pairing)
