---
read_when:
    - Você quer conectar o OpenClaw ao WeChat ou Weixin
    - Você está instalando ou solucionando problemas do plugin de canal openclaw-weixin
    - Você precisa entender como plugins de canal externos são executados ao lado do Gateway
summary: Configuração do canal WeChat por meio do plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T05:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

O OpenClaw se conecta ao WeChat por meio do plugin de canal externo da Tencent
`@tencent-weixin/openclaw-weixin`.

Status: plugin externo. Chats diretos e mídia são compatíveis. Chats em grupo não são
anunciados pelos metadados atuais de capacidades do plugin.

## Nomenclatura

- **WeChat** é o nome exibido ao usuário nesta documentação.
- **Weixin** é o nome usado pelo pacote da Tencent e pelo ID do plugin.
- `openclaw-weixin` é o ID do canal no OpenClaw.
- `@tencent-weixin/openclaw-weixin` é o pacote npm.

Use `openclaw-weixin` em comandos da CLI e em caminhos de configuração.

## Como funciona

O código do WeChat não fica no repositório principal do OpenClaw. O OpenClaw fornece o
contrato genérico de plugin de canal, e o plugin externo fornece o
runtime específico do WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. O Gateway descobre o manifesto do plugin e carrega o ponto de entrada do plugin.
3. O plugin registra o ID de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia o login por QR.
5. O plugin armazena as credenciais da conta no diretório de estado do OpenClaw.
6. Quando o Gateway inicia, o plugin inicia seu monitor do Weixin para cada
   conta configurada.
7. Mensagens WeChat de entrada são normalizadas por meio do contrato de canal, roteadas para
   o agente OpenClaw selecionado e enviadas de volta pelo caminho de saída do plugin.

Essa separação é importante: o núcleo do OpenClaw deve permanecer agnóstico a canais. Login do WeChat,
chamadas à API Tencent iLink, upload/download de mídia, tokens de contexto e monitoramento
de contas pertencem ao plugin externo.

## Instalação

Instalação rápida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalação manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Reinicie o Gateway após a instalação:

```bash
openclaw gateway restart
```

## Login

Execute o login por QR na mesma máquina que executa o Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Escaneie o código QR com o WeChat no seu telefone e confirme o login. O plugin salva
o token da conta localmente após uma leitura bem-sucedida.

Para adicionar outra conta do WeChat, execute o mesmo comando de login novamente. Para várias
contas, isole as sessões de mensagem direta por conta, canal e remetente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controle de acesso

Mensagens diretas usam o modelo normal de pareamento e lista de permissões do OpenClaw para
plugins de canal.

Aprove novos remetentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para o modelo completo de controle de acesso, consulte [Pareamento](/pt-BR/channels/pairing).

## Compatibilidade

O plugin verifica a versão do OpenClaw host na inicialização.

| Linha do plugin | Versão do OpenClaw      | Tag npm  |
| --------------- | ----------------------- | -------- |
| `2.x`           | `>=2026.3.22`           | `latest` |
| `1.x`           | `>=2026.1.0 <2026.3.22` | `legacy` |

Se o plugin informar que sua versão do OpenClaw é muito antiga, atualize o
OpenClaw ou instale a linha legada do plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo sidecar

O plugin do WeChat pode executar trabalho auxiliar ao lado do Gateway enquanto monitora a
API Tencent iLink. Na issue #68451, esse caminho auxiliar expôs um bug na
limpeza genérica de Gateway obsoleto do OpenClaw: um processo filho podia tentar limpar o
processo Gateway pai, causando loops de reinicialização em gerenciadores de processo como systemd.

A limpeza atual de inicialização do OpenClaw exclui o processo atual e seus ancestrais,
então um auxiliar de canal não deve encerrar o Gateway que o iniciou. Essa correção é
genérica; não é um caminho específico do WeChat no núcleo.

## Solução de problemas

Verifique a instalação e o status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se o canal aparecer como instalado, mas não se conectar, confirme que o plugin está
habilitado e reinicie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se o Gateway reiniciar repetidamente após habilitar o WeChat, atualize o OpenClaw e
o plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Desativação temporária:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentação relacionada

- Visão geral de canais: [Canais de chat](/pt-BR/channels)
- Pareamento: [Pareamento](/pt-BR/channels/pairing)
- Roteamento de canais: [Roteamento de canais](/pt-BR/channels/channel-routing)
- Arquitetura de Plugin: [Arquitetura de Plugin](/pt-BR/plugins/architecture)
- SDK de plugin de canal: [SDK de Plugin de canal](/pt-BR/plugins/sdk-channel-plugins)
- Pacote externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
