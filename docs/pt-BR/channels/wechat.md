---
read_when:
    - Você quer conectar o OpenClaw ao WeChat ou ao Weixin
    - Você está instalando ou solucionando problemas do plugin de canal openclaw-weixin
    - Você precisa entender como os plugins de canais externos são executados junto ao Gateway
summary: Configuração do canal WeChat por meio do plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T14:57:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw se conecta ao WeChat por meio do plugin de canal externo
`@tencent-weixin/openclaw-weixin` da Tencent.

Status: plugin externo, mantido pela equipe Tencent Weixin. Há suporte a conversas
diretas e mídia. Conversas em grupo não são anunciadas pelos metadados de
capacidade do plugin (ele declara apenas conversas diretas).

## Nomenclatura

- **WeChat** é o nome apresentado ao usuário nesta documentação.
- **Weixin** é o nome usado pelo pacote da Tencent e pelo id do plugin.
- `openclaw-weixin` é o id do canal OpenClaw (`weixin` e `wechat` funcionam como aliases).
- `@tencent-weixin/openclaw-weixin` é o pacote npm.

Use `openclaw-weixin` em comandos da CLI e caminhos de configuração.

## Como funciona

O código do WeChat não fica no repositório principal do OpenClaw. O OpenClaw fornece o
contrato genérico de plugin de canal, e o plugin externo fornece o runtime
específico do WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. O Gateway detecta o manifesto do plugin e carrega o ponto de entrada do plugin.
3. O plugin registra o id de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia o login por código QR.
5. O plugin armazena as credenciais da conta no diretório de estado do OpenClaw
   (`~/.openclaw` por padrão).
6. Quando o Gateway é iniciado, o plugin inicia seu monitor do Weixin para cada
   conta configurada.
7. As mensagens recebidas do WeChat são normalizadas por meio do contrato de canal, encaminhadas ao
   agente OpenClaw selecionado e enviadas de volta pelo caminho de saída do plugin.

Essa separação é importante: o núcleo do OpenClaw permanece independente de canais. O login no WeChat,
as chamadas à API Tencent iLink, o upload e download de mídia, os tokens de contexto e o
monitoramento de contas são responsabilidade do plugin externo.

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

Execute o login por código QR na mesma máquina em que o Gateway está em execução:

```bash
openclaw channels login --channel openclaw-weixin
```

Leia o código QR com o WeChat no celular e confirme o login. O plugin salva
o token da conta localmente após uma leitura bem-sucedida.

Para adicionar outra conta do WeChat, execute novamente o mesmo comando de login. Para várias
contas, isole as sessões de mensagens diretas por conta, canal e remetente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controle de acesso

As mensagens diretas usam o modelo normal de pareamento e lista de permissões do OpenClaw para plugins
de canal.

Aprove novos remetentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para conhecer o modelo completo de controle de acesso, consulte [Pareamento](/pt-BR/channels/pairing).

## Compatibilidade

O plugin verifica a versão do OpenClaw host durante a inicialização.

| Linha do plugin | Versão do OpenClaw                                              | Tag npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (atual 2.4.6; versões 2.x iniciais aceitavam `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Se o plugin informar que sua versão do OpenClaw é antiga demais, atualize
o OpenClaw ou instale a linha legada do plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo auxiliar

O plugin do WeChat pode executar trabalho auxiliar ao lado do Gateway enquanto monitora a
API Tencent iLink. Na issue #68451, esse caminho auxiliar expôs um bug na
limpeza genérica de Gateways obsoletos do OpenClaw: um processo filho podia tentar limpar o processo
Gateway pai, causando ciclos de reinicialização em gerenciadores de processos como o systemd.

A limpeza atual durante a inicialização do OpenClaw exclui o processo atual e seus ancestrais,
portanto um auxiliar de canal não pode encerrar o Gateway que o iniciou. Essa correção é
genérica; não é um caminho específico do WeChat no núcleo.

## Solução de problemas

Verifique a instalação e o status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se o canal aparecer como instalado, mas não se conectar, confirme que o plugin está
ativado e reinicie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se o Gateway reiniciar repetidamente após ativar o WeChat, atualize o OpenClaw e
o plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Se a inicialização informar que o pacote de plugin instalado `requires compiled runtime
output for TypeScript entry`, o pacote npm foi publicado sem os arquivos compilados
do runtime JavaScript necessários ao OpenClaw. Atualize ou reinstale depois que o
publicador do plugin disponibilizar um pacote corrigido ou desative/desinstale temporariamente o plugin.

Desativação temporária:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentação relacionada

- Visão geral dos canais: [Canais de conversa](/pt-BR/channels)
- Pareamento: [Pareamento](/pt-BR/channels/pairing)
- Roteamento de canais: [Roteamento de canais](/pt-BR/channels/channel-routing)
- Arquitetura de plugins: [Arquitetura de plugins](/pt-BR/plugins/architecture)
- SDK de plugins de canal: [SDK de plugins de canal](/pt-BR/plugins/sdk-channel-plugins)
- Pacote externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
