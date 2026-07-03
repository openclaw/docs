---
read_when:
    - Executando ou solucionando problemas em configurações remotas do Gateway
summary: Acesso remoto usando WS do Gateway, túneis SSH e tailnets
title: Acesso remoto
x-i18n:
    generated_at: "2026-07-03T23:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Este repositório oferece suporte a acesso remoto ao Gateway mantendo um único Gateway (o principal) em execução em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app macOS)**: WebSocket direto por LAN/Tailnet é mais simples quando o gateway está acessível; túnel SSH é a alternativa universal.
- Para **nós (iOS/Android e dispositivos futuros)**: conecte-se ao **WebSocket** do Gateway (LAN/tailnet ou túnel SSH conforme necessário).

## A ideia central

- O WebSocket do Gateway geralmente faz bind ao **loopback** na porta configurada (padrão 18789).
- Para uso remoto, exponha-o por meio do Tailscale Serve ou de um bind confiável de LAN/Tailnet, ou encaminhe a porta de loopback por SSH.

## Configurações comuns de VPN e tailnet

Pense no **host do Gateway** como o local onde o agente vive. Ele possui sessões, perfis de autenticação, canais e estado. Seu laptop, desktop e nós se conectam a esse host.

### Gateway sempre ativo na sua tailnet

Execute o Gateway em um host persistente (VPS ou servidor doméstico) e acesse-o via **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a UI de Controle.
- **LAN/Tailnet confiável:** faça bind do gateway a uma interface privada e conecte diretamente com `gateway.remote.transport: "direct"`.
- **Alternativa:** mantenha loopback mais túnel SSH a partir de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/pt-BR/install/exe-dev) (VM fácil) ou [Hetzner](/pt-BR/install/hetzner) (VPS de produção).

Ideal quando seu laptop entra em repouso com frequência, mas você quer que o agente fique sempre ativo.

### Desktop doméstico executa o Gateway

O laptop **não** executa o agente. Ele se conecta remotamente:

- Use o modo remoto do app macOS (Ajustes → Geral → OpenClaw é executado).
- O app se conecta diretamente quando o gateway está acessível na LAN/Tailnet, ou abre e gerencia um túnel SSH quando você escolhe SSH.

Runbook: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).

### Laptop executa o Gateway

Mantenha o Gateway local, mas exponha-o com segurança:

- Túnel SSH para o laptop a partir de outras máquinas, ou
- Tailscale Serve para a UI de Controle e mantenha o Gateway somente em loopback.

Guias: [Tailscale](/pt-BR/gateway/tailscale) e [visão geral da Web](/pt-BR/web).

## Fluxo de comandos (o que roda onde)

Um serviço de gateway possui estado + canais. Nós são periféricos.

Exemplo de fluxo (Telegram → nó):

- A mensagem do Telegram chega ao **Gateway**.
- O Gateway executa o **agente** e decide se deve chamar uma ferramenta do nó.
- O Gateway chama o **nó** pelo WebSocket do Gateway (RPC `node.*`).
- O nó retorna o resultado; o Gateway responde de volta ao Telegram.

Observações:

- **Nós não executam o serviço de gateway.** Apenas um gateway deve rodar por host, a menos que você execute perfis isolados intencionalmente (consulte [Vários gateways](/pt-BR/gateway/multiple-gateways)).
- O "modo nó" do app macOS é apenas um cliente de nó pelo WebSocket do Gateway.

## Túnel SSH (CLI + ferramentas)

Crie um túnel local para o WS do Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o túnel ativo:

- `openclaw health` e `openclaw status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` também podem apontar para a URL encaminhada via `--url` quando necessário.

<Note>
Substitua `18789` pelo seu `gateway.port` configurado (ou `--port` ou `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Ao passar `--url`, a CLI não recorre às credenciais de configuração ou ambiente. Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Warning>

## Padrões remotos da CLI

Você pode persistir um destino remoto para que comandos da CLI o usem por padrão:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Quando o gateway for somente loopback, mantenha a URL em `ws://127.0.0.1:18789` e abra o túnel SSH primeiro.
No transporte de túnel SSH do app macOS, nomes de host de gateway descobertos pertencem a
`gateway.remote.sshTarget`; `gateway.remote.url` permanece a URL do túnel local.
Se essas portas forem diferentes, defina `gateway.remote.remotePort` como a porta do gateway no
host SSH.
A verificação de chave de host é estrita por padrão. Aliases gerenciados podem usar explicitamente
sua política de confiança efetiva do OpenSSH com
`gateway.remote.sshHostKeyPolicy: "openssh"`; revise as configurações SSH correspondentes de usuário e sistema
antes de habilitá-la.

Para um gateway já acessível em uma LAN ou Tailnet confiável, use o modo direto:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Precedência de credenciais

A resolução de credenciais do Gateway segue um contrato compartilhado em todos os caminhos de call/probe/status e no monitoramento de aprovação de execução do Discord. O host de nó usa o mesmo contrato base com uma exceção de modo local (ele ignora intencionalmente `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password` ou `gatewayToken` da ferramenta) sempre vencem em caminhos de chamada que aceitam autenticação explícita.
- Segurança de substituição de URL:
  - Substituições de URL da CLI (`--url`) nunca reutilizam credenciais implícitas de configuração/ambiente.
  - Substituições de URL do ambiente (`OPENCLAW_GATEWAY_URL`) podem usar apenas credenciais do ambiente (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões do modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (a alternativa remota se aplica somente quando a entrada de token de autenticação local não está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (a alternativa remota se aplica somente quando a entrada de senha de autenticação local não está definida)
- Padrões do modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção de modo local do host de nó: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- Verificações de token de probe/status remotos são estritas por padrão: elas usam apenas `gateway.remote.token` (sem alternativa para token local) ao apontar para o modo remoto.
- Substituições de ambiente do Gateway usam apenas `OPENCLAW_GATEWAY_*`.

## Acesso remoto à UI de Chat

O WebChat não usa mais uma porta HTTP separada. A UI de chat do SwiftUI se conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` por SSH (veja acima) e então conecte os clientes a `ws://127.0.0.1:18789`.
- Para o modo direto LAN/Tailnet, conecte clientes à URL privada `ws://` ou segura `wss://` configurada.
- No macOS, prefira o modo remoto do app, que gerencia o transporte selecionado automaticamente.

## Modo remoto do app macOS

O app de barra de menus do macOS pode conduzir a mesma configuração de ponta a ponta (verificações de status remoto, WebChat e encaminhamento do Voice Wake).

Runbook: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway somente em loopback**, a menos que você tenha certeza de que precisa de um bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` em texto claro é aceito para loopback, LAN, link-local, `.local`, `.ts.net` e hosts CGNAT do Tailscale. Hosts remotos públicos devem usar `wss://`.
- **Binds que não são loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback não está disponível) devem usar autenticação do gateway: token, senha ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles **não** configuram a autenticação do servidor por si só.
- Caminhos de chamada locais podem usar `gateway.remote.*` como alternativa somente quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente via SecretRef e não resolvido, a resolução falha de forma fechada (sem alternativa remota mascarando).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto ao usar `wss://`, incluindo o modo direto do macOS. Sem um pin configurado ou armazenado anteriormente, o macOS só fixa um certificado de primeiro uso depois que a confiança normal do sistema passa; gateways autoassinados ou de CA privada em que o macOS ainda não confia precisam de uma impressão digital explícita ou Remoto por SSH.
- **Tailscale Serve** pode autenticar o tráfego da UI de Controle/WebSocket por meio de cabeçalhos de identidade
  quando `gateway.auth.allowTailscale: true`; endpoints de API HTTP não
  usam essa autenticação de cabeçalho do Tailscale e, em vez disso, seguem o modo normal de autenticação HTTP
  do gateway. Esse fluxo sem token pressupõe que o host do gateway é confiável. Defina-o como
  `false` se quiser autenticação por segredo compartilhado em todos os lugares.
- A autenticação **trusted-proxy** espera configurações de proxy com reconhecimento de identidade que não sejam loopback por padrão.
  Proxies reversos loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Trate o controle pelo navegador como acesso de operador: somente tailnet + pareamento deliberado de nó.

Aprofundamento: [Segurança](/pt-BR/gateway/security).

### macOS: túnel SSH persistente via LaunchAgent

Para clientes macOS que se conectam a um gateway remoto, a configuração persistente mais fácil usa uma entrada de configuração SSH `LocalForward` mais um LaunchAgent para manter o túnel ativo entre reinicializações e falhas.

#### Etapa 1: adicionar configuração SSH

Edite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Substitua `<REMOTE_IP>` e `<REMOTE_USER>` pelos seus valores.

#### Etapa 2: copiar chave SSH (uma vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Etapa 3: configurar o token do gateway

Armazene o token na configuração para que ele persista entre reinicializações:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Etapa 4: criar o LaunchAgent

Salve isto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Etapa 5: carregar o LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

O túnel será iniciado automaticamente no login, reiniciado em caso de falha e manterá a porta encaminhada ativa.

<Note>
Se você tiver um LaunchAgent `com.openclaw.ssh-tunnel` restante de uma configuração mais antiga, descarregue-o e exclua-o.
</Note>

#### Solução de problemas

Verifique se o túnel está em execução:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicie o túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Pare o túnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuração              | O que ela faz                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Encaminha a porta local 18789 para a porta remota 18789      |
| `ssh -N`                             | SSH sem executar comandos remotos (somente encaminhamento de porta) |
| `KeepAlive`                          | Reinicia automaticamente o túnel se ele falhar               |
| `RunAtLoad`                          | Inicia o túnel quando o LaunchAgent carrega no login         |

## Relacionados

- [Tailscale](/pt-BR/gateway/tailscale)
- [Autenticação](/pt-BR/gateway/authentication)
- [Configuração de gateway remoto](/pt-BR/gateway/remote-gateway-readme)
