---
read_when:
    - Depurando problemas de descoberta Bonjour no macOS/iOS
    - Alterando tipos de serviço mDNS, registros TXT ou UX de descoberta
summary: Descoberta Bonjour/mDNS + depuração (beacons do Gateway, clientes e modos de falha comuns)
title: Descoberta Bonjour
x-i18n:
    generated_at: "2026-04-24T05:50:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descoberta Bonjour / mDNS

O OpenClaw usa Bonjour (mDNS / DNS-SD) para descobrir um Gateway ativo (endpoint WebSocket).
A navegação multicast em `local.` é uma **conveniência apenas para LAN**. Para descoberta entre redes, o
mesmo beacon também pode ser publicado por meio de um domínio DNS-SD de área ampla configurado. A descoberta
continua sendo de melhor esforço e **não** substitui conectividade baseada em SSH ou Tailnet.

## Bonjour de área ampla (Unicast DNS-SD) sobre Tailscale

Se o node e o gateway estiverem em redes diferentes, o mDNS multicast não atravessará esse
limite. Você pode manter a mesma UX de descoberta trocando para **DNS-SD unicast**
("Wide-Area Bonjour") sobre Tailscale.

Etapas de alto nível:

1. Execute um servidor DNS no host do gateway (acessível pelo Tailnet).
2. Publique registros DNS-SD para `_openclaw-gw._tcp` em uma zona dedicada
   (exemplo: `openclaw.internal.`).
3. Configure o **split DNS** do Tailscale para que seu domínio escolhido resolva por meio desse
   servidor DNS para os clientes (incluindo iOS).

O OpenClaw oferece suporte a qualquer domínio de descoberta; `openclaw.internal.` é apenas um exemplo.
Nodes iOS/Android navegam tanto em `local.` quanto no seu domínio de área ampla configurado.

### Configuração do Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // somente tailnet (recomendado)
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

Valide a partir de uma máquina conectada ao tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configurações de DNS do Tailscale

No console de administração do Tailscale:

- Adicione um nameserver apontando para o IP tailnet do gateway (UDP/TCP 53).
- Adicione split DNS para que seu domínio de descoberta use esse nameserver.

Depois que os clientes aceitarem o DNS do tailnet, nodes iOS e a descoberta da CLI poderão navegar por
`_openclaw-gw._tcp` no seu domínio de descoberta sem multicast.

### Segurança do listener do Gateway (recomendada)

A porta WS do Gateway (padrão `18789`) usa bind em loopback por padrão. Para acesso por LAN/tailnet,
faça bind explicitamente e mantenha a autenticação habilitada.

Para configurações somente com tailnet:

- Defina `gateway.bind: "tailnet"` em `~/.openclaw/openclaw.json`.
- Reinicie o Gateway (ou reinicie o app da barra de menu do macOS).

## O que anuncia

Somente o Gateway anuncia `_openclaw-gw._tcp`.

## Tipos de serviço

- `_openclaw-gw._tcp` — beacon de transporte do gateway (usado por nodes macOS/iOS/Android).

## Chaves TXT (dicas não secretas)

O Gateway anuncia pequenas dicas não secretas para tornar os fluxos de UI convenientes:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (somente quando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (somente quando TLS está habilitado e a fingerprint está disponível)
- `canvasPort=<port>` (somente quando o host do canvas está habilitado; atualmente é o mesmo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (dica opcional quando Tailnet está disponível)
- `sshPort=<port>` (somente no modo mDNS completo; DNS-SD de área ampla pode omiti-lo)
- `cliPath=<path>` (somente no modo mDNS completo; DNS-SD de área ampla ainda o grava como dica de instalação remota)

Observações de segurança:

- Registros TXT de Bonjour/mDNS são **não autenticados**. Clientes não devem tratar TXT como roteamento autoritativo.
- Os clientes devem rotear usando o endpoint de serviço resolvido (SRV + A/AAAA). Trate `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` apenas como dicas.
- O direcionamento automático de SSH também deve usar o host de serviço resolvido, não dicas baseadas apenas em TXT.
- O pinning de TLS nunca deve permitir que um `gatewayTlsSha256` anunciado substitua um pin armazenado anteriormente.
- Nodes iOS/Android devem tratar conexões diretas baseadas em descoberta como **somente TLS** e exigir confirmação explícita do usuário antes de confiar em uma fingerprint vista pela primeira vez.

## Depuração no macOS

Ferramentas úteis integradas:

- Navegar por instâncias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver uma instância (substitua `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se navegar funciona, mas resolver falha, normalmente você está enfrentando uma política de LAN ou
um problema no resolvedor de mDNS.

## Depuração nos logs do Gateway

O Gateway grava um arquivo de log rotativo (impresso na inicialização como
`gateway log file: ...`). Procure linhas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuração no node iOS

O node iOS usa `NWBrowser` para descobrir `_openclaw-gw._tcp`.

Para capturar logs:

- Ajustes → Gateway → Avançado → **Discovery Debug Logs**
- Ajustes → Gateway → Avançado → **Discovery Logs** → reproduza → **Copy**

O log inclui transições de estado do browser e mudanças no conjunto de resultados.

## Modos de falha comuns

- **Bonjour não atravessa redes**: use Tailnet ou SSH.
- **Multicast bloqueado**: algumas redes Wi‑Fi desabilitam mDNS.
- **Suspensão / mudança de interface**: o macOS pode remover temporariamente resultados mDNS; tente novamente.
- **Navegar funciona, mas resolver falha**: mantenha nomes de máquina simples (evite emojis ou
  pontuação) e então reinicie o Gateway. O nome da instância do serviço deriva do
  nome do host, então nomes excessivamente complexos podem confundir alguns resolvedores.

## Nomes de instância escapados (`\032`)

Bonjour/DNS-SD frequentemente escapa bytes em nomes de instância de serviço como sequências decimais `\DDD`
(por exemplo, espaços viram `\032`).

- Isso é normal no nível do protocolo.
- As UIs devem decodificar para exibição (o iOS usa `BonjourEscapes.decode`).

## Desativação / configuração

- `OPENCLAW_DISABLE_BONJOUR=1` desabilita o anúncio (legado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` em `~/.openclaw/openclaw.json` controla o modo de bind do Gateway.
- `OPENCLAW_SSH_PORT` substitui a porta SSH quando `sshPort` é anunciado (legado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica uma dica de MagicDNS em TXT (legado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` substitui o caminho de CLI anunciado (legado: `OPENCLAW_CLI_PATH`).

## Documentação relacionada

- Política de descoberta e seleção de transporte: [Discovery](/pt-BR/gateway/discovery)
- Pairing de node + aprovações: [Gateway pairing](/pt-BR/gateway/pairing)
